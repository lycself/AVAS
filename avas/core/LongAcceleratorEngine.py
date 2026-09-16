import ctypes
import sys
import os

from avas.paths import ENGINE_DIR

class LongAcceleratorEngine():
    def __init__(self, kind):
        if kind == 2:
            self.dll_path = os.path.join(ENGINE_DIR, 'LongAccelerator2.dll')
        elif kind == 3:
            self.dll_path = os.path.join(ENGINE_DIR, 'LongAccelerator3.dll')

        try:
            # 尝试加载DLL文件
            self.library = ctypes.CDLL(self.dll_path)

        except OSError as e:
            # 如果DLL文件不存在或加载出错，使用raise引发自定义的异常
            raise ValueError(f"Failed to load DLL '{self.dll_path}'. Reason: {e}")

    def get_path(self, inputfilepath, outputfilePath):

        inputfilepath = ctypes.c_wchar_p(inputfilepath)
        outputfilePath = ctypes.c_wchar_p(outputfilePath)

        res = self.library.path(inputfilepath, outputfilePath)

        return res

    #input, beam, lattice都应该为自定义的结构体
    def main_agent(self, value):
        res = self.library.main_agent(value)
        return res


