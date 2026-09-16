import ctypes
import os

from avas.paths import ENGINE_DIR

class LinacOPTEngine():
    def __init__(self):
        self.dll_path = os.path.join(ENGINE_DIR, 'Dll2.dll')

        try:
            # 尝试加载DLL文件
            self.library = ctypes.CDLL(self.dll_path)
        except OSError as e:
            # 如果DLL文件不存在或加载出错，使用raise引发自定义的异常
            raise ValueError(f"Failed to load DLL '{self.dll_path}'. Reason: {e}")

    def Trace_win_file_change(self, str1, str2, str3, change_line_p, Number, out):
        res = self.library.Trace_win_file_change(str1, str2, str3, change_line_p, Number, out)

    def Trace_win_file(self, str1, str2, str3, str4):
        res = self.library.Trace_win_file(str1, str2, str3, str4)
        return res


    def Trace_win_beam_change(self, str1, str2, str3, change_line, out):
         res =  self.library.Trace_win_beam_change(str1, str2, str3, change_line, out)