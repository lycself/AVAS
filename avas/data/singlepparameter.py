import os.path
import sys
import time

from avas.utils.readfile import read_dst, read_txt, read_dst_fast
import math

from avas.constants import Pi, c_light
from avas.data.latticeparameter import LatticeParameter
from avas.utils.getinfotools import get_mass_freq_from_dir
import random
import numpy as np

class SinglePparameter():
    """
    """

    def __init__(self, single_p_path, project_path=None, input_dir=None):
        self.single_p_path = single_p_path
        self.z = []
        self.project_path = project_path
        self.input_dir = input_dir or (os.path.join(project_path, 'InputFile') if project_path else None)
        self.len_num_evert_step = 41

    def get_parameter(self):
        single_p_info = read_txt(self.single_p_path, out='list')[3:]


        if len(single_p_info) == 0:
            return False
        if len(single_p_info) == 1:
            return False

        single_p_info = [[float(j) for j in i] for i in single_p_info]

        self.x = [i[0] for i in single_p_info]
        self.y = [i[1] for i in single_p_info]
        self.z = [i[2] for i in single_p_info]

        self.ek = [i[6] for i in single_p_info]
        self.particle_t = [i[7] for i in single_p_info]

        if self.input_dir:
            beam_info = get_mass_freq_from_dir(self.input_dir)
            self.freq = beam_info["frequency"]

        if self.project_path:
            self.abs_phase = [i[7] *  2 * 180 * self.freq  for i in single_p_info] #

        return True





if __name__ == "__main__":
    # path1 = r"C:\Users\shliu\Desktop\testz\OutputFile\error_output\output_0_0\DataSet.txt"
    # obj = DatasetParameter(path1)
    # obj.get_parameter()
    # print(obj.z)
    #
    path1 = r"D:\using\test_avas_qt\test_one_p\OutputFile\SingleParticle.txt"
    project_path = r"D:\using\test_avas_qt\test_one_p"
    obj = SinglePparameter(path1, project_path)
    v = obj.get_parameter()
    # print(obj.x)
    # print(obj.abs_phase)
    # #

