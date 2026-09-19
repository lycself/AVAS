"""One multi-particle simulation: point the engine at the folders, run it, report its errors."""
import logging
import os

from avas.core.MultiParticleEngine import MultiParticleEngine
from avas.utils.readfile import read_txt
from avas.utils.tool import write_to_txt

log = logging.getLogger(__name__)


class MultiParticle():
    """
    多粒子模拟
    """
    def __init__(self, item):
        # {
        # "project_path": path,
        # "input_file": path,        folder with input.txt, beam.txt, lattice.txt (a staged copy for `avas run`)
        # "output_file": path,
        # "field_path": path,        folder with the field maps (default: input_file)
        # "mulp_engine": ,
        # "device": ,
        # "if_error": 0/1,
        # }
        self.project_path = item["project_path"]
        self.input_file = item.get("input_file")
        self.output_file = item.get("output_file")
        self.field_path = item.get("field_path")
        self.multiparticle_engine = item.get("mulp_engine")
        self.device = item.get("device")
        self.if_error = item.get("if_error", 0)

        if self.device in [None, ""]:
            self.device = "cpu"

        if self.input_file is None:
            self.input_file = os.path.join(self.project_path, "InputFile")
        if self.output_file is None:
            self.output_file = os.path.join(self.project_path, "OutputFile")

        if self.field_path is None:
            self.field_path = self.input_file

        if self.device == "cpu" and self.multiparticle_engine is None:
            self.multiparticle_engine = MultiParticleEngine()

        if self.if_error == 0:
            self.errorlog_path = os.path.join(self.output_file, "ErrorLog.txt")
        elif self.if_error == 1:
            self.errorlog_path = os.path.join(self.output_file, "output_0", "ErrorLog.txt")

    def after_treat(self):
        from avas.post.analysis.new_dataset import trans_dataset2new

        # 误差模拟的情况
        if self.if_error == 1:
            ori_dataset_path = os.path.join(self.output_file, "output_0", "DataSet.txt")
            new_dataset_path = os.path.join(self.output_file, "output_0", "Dataset_New.txt")
        else:
            ori_dataset_path = os.path.join(self.output_file, "DataSet.txt")
            new_dataset_path = os.path.join(self.output_file, "Dataset_New.txt")

        res = trans_dataset2new(ori_dataset_path, new_dataset_path)
        return res

    def run(self):
        if self.device == "cpu":
            if os.path.exists(self.errorlog_path):
                os.remove(self.errorlog_path)

            self.multiparticle_engine.get_path(self.input_file, self.output_file, self.field_path)
            res = self.multiparticle_engine.main_agent(1)

            # 检查报错
            if res in (1, 2):
                error = self.check_error_file(self.errorlog_path)
                raise Exception(f'{error}')

        elif self.device == "gpu":
            from avas.gpu.pic import SimulationRunner

            # 重写beam和input (written next to the inputs the engine reads, i.e. the staged copy)
            generate_input_gpu(self.input_file, self.output_file, self.field_path)
            generate_beam_gpu(self.input_file, self.output_file, self.field_path)

            input_txt_gpu_path = os.path.join(self.input_file, "input_gpu.txt")
            beam_txt_gpu_path = os.path.join(self.input_file, "beam_gpu.txt")
            lattice_txt_gpu_path = os.path.join(self.input_file, "lattice.txt")

            item = {"project_path": self.project_path,
                    "input_file": self.input_file,
                    "input_path": input_txt_gpu_path,
                    "beam_path": beam_txt_gpu_path,
                    "lattice_path": lattice_txt_gpu_path,
                    }

            simulator = SimulationRunner(item)
            simulator.run()

            res = 0

        return res

    def stop(self):
        res = self.multiparticle_engine.main_agent(2)
        log.info("simulation stopped %s", res)

    def check_error_file(self, ErrorLog):
        """The engine's error message from ErrorLog.txt (the text after the 5-space separator, else all of it)."""
        try:
            with open(ErrorLog, 'r', encoding="utf-8", errors="replace") as file:
                text = file.read()
        except OSError:
            return f"simulation failed, and {ErrorLog} could not be read"
        parts = text.split('     ')
        return parts[1].strip() if len(parts) > 1 and parts[1].strip() else text.strip()


def generate_input_gpu(input_file, output_file, field_path):
    input_txt = os.path.join(input_file, "input.txt")
    ori_input_res = read_txt(input_txt, out="list", case_sensitive=True)
    ori_input_res.append(["outputpath", output_file])
    ori_input_res.append(["fieldpath", field_path])

    ori_input_res.append(["numofgrid", 24, 24, 24])
    ori_input_res.append(["MeshRms", 4, 4, 4])
    ori_input_res.append(["statOutputInterval", 1])
    ori_input_res.append(["beampath", input_file])

    input_txt_gpu = os.path.join(input_file, "input_gpu.txt")
    write_to_txt(input_txt_gpu, ori_input_res)


def generate_beam_gpu(input_file, output_file, field_path):
    beam_txt = os.path.join(input_file, "beam.txt")
    ori_beam_res = read_txt(beam_txt, out="list", case_sensitive=True)

    for i in ori_beam_res:
        if i[0] == "kneticenergy":
            i.append(0)

    beam_txt_gpu = os.path.join(input_file, "beam_gpu.txt")
    write_to_txt(beam_txt_gpu, ori_beam_res)
