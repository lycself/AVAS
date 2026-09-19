"""该文件定义了读取各种文件的工具函数"""
import struct
import numpy
import numpy as np
import os
from avas.utils.exception import CustomFileNotFoundError
import re
from avas.data import schema
from avas.data.lattice_doc import LatticeDocument
from avas.gui.textio import read_text

import logging
logger = logging.getLogger(__name__)

def read_txt(input, out='dict', readdall=None, case_sensitive=None):
    #目前这个函数无法处理包含重复的情况
    """
    :param input: 需要读取的txt文件
    :out:结果返回的类型，可选参数为dict， list
    :return:{}or[]
    注意：当输出为字典格式的时候，文件中存在相同key会出现覆盖的情况
    """
    if not os.path.exists(input):
        raise CustomFileNotFoundError(input)

    with open(input, encoding='UTF-8') as file_object:
        input_lines = []
        if not readdall:
            for line in file_object:
                line = line.lstrip('\ufeff')
                line = line.strip()
                if '!' in line:
                    # 如果当前行包含感叹号，只保留感叹号之前的内容
                    line = line.split('!', 1)[0]
                    input_lines.append(line)
                    continue  # 跳出循环，停止读取接下来的内容
                else:
                    input_lines.append(line)
        elif readdall:
            for line in file_object:
                line = line.lstrip('\ufeff')
                line = line.strip()
                input_lines.append(line)

    input_lines = [re.sub(":" ," : ", i) for i in input_lines]
    input_lines = [i.split() for i in input_lines if i.strip()]

    if not case_sensitive:
        #如果大小写不敏感，全都变成小写，如果敏感
        input_lines = [[word.lower() for word in line] for line in input_lines]



    if out == 'list':
        return input_lines


    res = {}
    for i in input_lines:

        if len(i) == 1:
            res[i[0]] = None
        elif len(i) == 2:
            res[i[0]] = i[1]
        else:
            res[i[0]] = i[1:]
    return res


# --------------------------------------------------------------------------- lattice files
# Positional readers used by the run path, the error study and the post-processing.
# They are adapters over avas.data.lattice_doc.LatticeDocument (the only lattice
# tokeniser) and keep the historical list shapes, pinned by tests/test_lattice_parsers.py:
#   * every non-blank, non-comment line is one list of tokens (":" is its own token;
#     "section X {", "{" and "}" lines pass through);
#   * the first token is lower-cased, the rest keep their case;
#   * a bend's first parameter is replaced by the computed |alpha·rho| (numpy float);
#   * the list stops after the first line whose keyword is "end".

def _lattice_rows(lattice_path):
    """Token lists of every non-blank, non-comment line, in file order."""
    if not os.path.exists(lattice_path):
        raise CustomFileNotFoundError(lattice_path)
    doc = LatticeDocument(read_text(lattice_path))
    return [list(st.tokens) for st in doc.all_lines()]


def _finish_rows(rows):
    out = []
    for row in rows:
        row[0] = row[0].lower()
        if row[0] == "bend":
            row[1] = np.abs(float(row[4]) / 180 * np.pi * float(row[5]))
        out.append(row)
        if row[0] == "end":
            break
    return out


def read_lattice_mulp(lattice_mulp_path):
    """Rows as written (a ``name : keyword`` prefix stays in the row)."""
    return _finish_rows(_lattice_rows(lattice_mulp_path))


def read_lattice_mulp_with_name(lattice_mulp_path):
    """``(rows, names)``: the ``name :`` prefix is moved to *names*.

    Elements without a name get ``"no_name"``, commands ``None``.
    """
    rows, names = [], []
    for tokens in _lattice_rows(lattice_mulp_path):
        if tokens[0].lower() in schema.ELEMENT_KEYWORDS and ":" not in tokens:
            tokens = ["no_name", ":"] + tokens
        if ":" in tokens:
            rows.append(tokens[2:])
            names.append(tokens[0])
        else:
            rows.append(tokens)
            names.append(None)
    rows = _finish_rows(rows)
    return rows, names[:len(rows)]


def read_dst(input):
    """
    此函数为读取dst文件
    :param input:  dst文件路径
    :return:{'number': _, 'ib': _, 'freq': _, 'phase':[], 'basemassinmev': _ }
    """

    res = {}
    f = open(input, 'rb')
    # f.read(2)

    data = struct.unpack("<cc", f.read(2))


    data = struct.unpack("<i", f.read(4))
    number = int(data[0])
    res['number'] = number

    #流强
    data = struct.unpack("<d", f.read(8))
    Ib = float(data[0])
    res['ib'] = Ib

    data = struct.unpack("<d", f.read(8))
    freq = float(data[0])
    res['freq'] = freq*10**6

    data = f.read(1)
    partran_dist = numpy.arange(6 * number, dtype='float64').reshape(number, 6)

    for i in range(number):
        data = f.read(48)
        data = struct.unpack("<dddddd", data)
        partran_dist[i, 0] = data[0]
        partran_dist[i, 1] = data[1]
        partran_dist[i, 2] = data[2]
        partran_dist[i, 3] = data[3]
        partran_dist[i, 4] = data[4]
        partran_dist[i, 5] = data[5]

    res['phase'] = partran_dist

    data = struct.unpack("<d", f.read(8))
    BaseMassInMeV = data[0]
    res['basemassinmev'] = BaseMassInMeV

    f.close()
    return res
def read_dst_fast(input):
    with open(input, 'rb') as f:
        f.read(2)  # 跳过前2个字节

        # 读取整数和两个双精度浮点数
        number = struct.unpack("<i", f.read(4))[0]
        # print("粒子数", number/10000, "万")
        Ib = struct.unpack("<d", f.read(8))[0]
        freq = struct.unpack("<d", f.read(8))[0]

        f.read(1)  # 跳过1个字节

        # 读取 6 * number 个双精度浮点数 cm mrad
        partran_dist = np.fromfile(f, dtype='<f8', count=6 * number).reshape(number, 6)

        # 读取最后一个双精度浮点数
        BaseMassInMeV = struct.unpack("<d", f.read(8))[0]

    res= {}
    res['number'] = number
    res['ib'] = Ib
    res['freq'] = freq*10**6
    res['partran_dist'] = partran_dist
    res['basemassinmev'] = BaseMassInMeV
    res['kneticenergy'] = float(partran_dist[:, 5].mean())

    return res

def write_to_dst(path, particle_info, ):
    # particle_info = {
    #     "np": ,
    #     "Ib":
    #     "freq":
    #     "BaseMassInMeV": ,
    # }

    np = particle_info["number"]
    Ib = particle_info["ib"]
    freq = particle_info["freq"]
    BaseMassInMeV = particle_info["basemassinmev"]

    p_dst = particle_info["partran_dist"]

    outputfile_one_step = path

    with open(outputfile_one_step, 'wb') as data0utFile:
        try:
            data0utFile.write(struct.pack('c', b'\x7D'))  # skip1
            data0utFile.write(struct.pack('c', b'\x64'))  # skip2

            data0utFile.write(struct.pack('i', np))
            data0utFile.write(struct.pack('d', Ib))  # mA
            data0utFile.write(struct.pack('d', freq/10**6))  # MHz

            data0utFile.write(struct.pack('c', b'\x7D'))

            for i in range(len(p_dst)):
                for j in range(6):
                    data0utFile.write(struct.pack('d', p_dst[i][j]))

            data0utFile.write(struct.pack('d', BaseMassInMeV))  # Mev

        except IOError:
            print("输出错误")
# def read_dst_fast(input):
#     t0 = time.time()
#     with open(input, 'rb') as f:
#         f.read(2)  # 跳过前2个字节
#
#         # 读取整数和两个双精度浮点数
#         number = struct.unpack("<i", f.read(4))[0]
#         Ib = struct.unpack("<d", f.read(8))[0]
#         freq = struct.unpack("<d", f.read(8))[0]
#
#         f.read(1)  # 跳过1个字节
#
#         # 读取 6 * number 个双精度浮点数 cm mrad
#         partran_dist = np.fromfile(f, dtype='<f8', count=6 * number).reshape(number, 6)
#
#         # 读取最后一个双精度浮点数
#         BaseMassInMeV = struct.unpack("<d", f.read(8))[0]
#
#     res= {}
#     res['number'] = number
#     res['ib'] = Ib
#     res['freq'] = freq*10**6
#     res['partran_dist'] = partran_dist
#     res['basemassinmev'] = BaseMassInMeV
#     t1 = time.time()
#     print("读文件时间", t1 - t0)
#     energy_lis = np.array([i[5] for i in partran_dist])
#     t2 = time.time()
#     print("计算能量时间", t2 - t1)
#     res['kneticenergy'] = np.mean(energy_lis)
#     return res

def read_runsignal(path):
    res = 0
    with open(path, 'r') as file:
        line = file.readline()
        res = int(line)
    return res


def read_file_with_np(path, dtype=np.float64):
    #该函数用来快速获取表格型文件
    """
    适合 ≤ 数十 MB 的文本文件
    自动按任何空白分隔符（空格 / 制表符 / 连续空格）拆列。

    Parameters
    ----------
    path : str or Path
        文件路径
    dtype : data‑type, default np.float64
        改成 np.float32 可省一半内存、略快

    Returns
    -------
    np.ndarray  shape=(n_rows, n_cols)
    """
    return np.loadtxt(path, dtype=dtype)


#
if __name__ == "__main__":


    # path0 = r"C:\Users\wangh\Desktop\danengsan_p10_2\p10_2.dst"
    # res= read_dst_fast(path0)
    # print(res)
    #
    # par_dist = res['partran_dist']
    #
    # v1 = new_arr = np.concatenate([par_dist] * 1000, axis=0)
    # new_res =res
    # new_res["partran_dist"] = v1
    # new_res["number"] = 1000
    # new_path = r"C:\Users\wangh\Desktop\danengsan_p10_2\p1000_2.dst"
    # write_to_dst(new_path, new_res)



    # path = r"C:\Users\wangh\Desktop\324\v1\OutputFile\inData.dst"
    # res = read_dst_fast(path)
    # print(res)

    path = r"C:\Users\wangh\Desktop\phase_plot\ge_dst\result\part_rfq.dst"
    res = read_dst_fast(path)
    print(res)






