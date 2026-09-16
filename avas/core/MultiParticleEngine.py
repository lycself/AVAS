
import ctypes
import sys

import os
from ctypes import POINTER, c_char_p, cdll
import platform

from avas.paths import ENGINE_DIR


def _unbuffer_c_stdout():
    """Make the C runtime's ``stdout`` unbuffered (Windows, shared UCRT).

    AVAS.dll reports progress with ``printf``/``std::cout``.  When the GUI runs
    the simulation in a child process those writes go to a pipe, and the MSVC
    runtime then buffers them in 4 KiB blocks - the progress would arrive in
    bursts many seconds apart.  The DLL links the dynamic UCRT (see its
    ``api-ms-win-crt-stdio`` import), so switching the shared ``stdout`` FILE
    to ``_IONBF`` here makes every line show up immediately.  Harmless on a
    console and silently skipped when anything is missing.
    """
    if platform.system() != "Windows" or sys.stdout is None or sys.stdout.isatty():
        return
    try:
        ucrt = ctypes.CDLL("ucrtbase")
        ucrt.__acrt_iob_func.restype = ctypes.c_void_p
        ucrt.setvbuf.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_int, ctypes.c_size_t]
        _IONBF = 4
        ucrt.setvbuf(ucrt.__acrt_iob_func(1), None, _IONBF, 0)
    except (OSError, AttributeError):
        pass


class MultiParticleEngine():
    def __init__(self):
        _unbuffer_c_stdout()
        self.dll_dir = ENGINE_DIR
        self.dll_path = os.path.join(ENGINE_DIR, 'AVAS.dll')
        self.so_path = os.path.join(ENGINE_DIR, 'libAVAS.so')
        try:
            if platform.system() == "Windows":
                # make libfftw3*.dll / MSVCP140.dll next to AVAS.dll resolvable
                if hasattr(os, "add_dll_directory"):
                    os.add_dll_directory(ENGINE_DIR)
                self.library = ctypes.CDLL(self.dll_path)  # 或 WinDLL
            elif platform.system() == "Linux":
                self.AVAS_cdll = cdll.LoadLibrary(self.so_path)  # Load Dynamic Link Library

        except OSError as e:
            if platform.system() == 'Windows':
                # 尝试加载DLL文件
                raise ValueError(f"Failed to load DLL '{self.dll_path}'. Reason: {e}")
            elif platform.system() == "Linux":
                raise ValueError(f"Failed to load so '{self.so_path}'. Reason: {e}")

    def get_path(self, inputfilepath, outputfilePath, fieldfilePath):
        if platform.system() == 'Windows':
            inputfilepath = ctypes.c_wchar_p(inputfilepath)
            outputfilePath = ctypes.c_wchar_p(outputfilePath)
            fieldfilePath = ctypes.c_wchar_p(fieldfilePath)
            res = self.library.path(inputfilepath, outputfilePath, fieldfilePath)

        elif platform.system() == "Linux":
            inputfilepath = ctypes.c_char_p(inputfilepath.encode('utf-8'))  # 转为字节并包装为 c_char_p
            outputfilePath = ctypes.c_char_p(outputfilePath.encode('utf-8'))
            fieldfilePath = ctypes.c_char_p(fieldfilePath.encode('utf-8'))
            res = self.AVAS_cdll.path(inputfilepath, outputfilePath, fieldfilePath)

        return res

    # input, beam, lattice都应该为自定义的结构体
    def main_agent(self, value):

        value = ctypes.c_int(value)
        value = ctypes.pointer(value)
        if platform.system() == 'Windows':
            res = self.library.main_agent(value)
        elif platform.system() == "Linux":
            res = self.AVAS_cdll.main_agent(value)

        return res

if __name__ == '__main__':
    import threading
    import time

    project_path = r"C:\Users\shliu\Desktop\HEBT\hebt_avas"
    inputfile = os.path.join(project_path, "InputFile")
    outputfile = os.path.join(project_path, "OutputFile")
    fieldfile = os.path.join(project_path, "InputFile")

    # 创建一个停止标志，用于停止执行
    obj = MultiParticleEngine()
    obj.get_path(inputfile, outputfile, fieldfile)

    agent_thread = threading.Thread(target=obj.main_agent, args=(1,))
    agent_thread.start()

    # 主线程等待 3 秒
    # time.sleep(3)
    #
    # print("3秒后发送停止信号 main_agent(0)")
    # obj.main_agent(0)
    #
    # # 可选：等子线程结束
    # agent_thread.join()
    # print("线程已结束")

