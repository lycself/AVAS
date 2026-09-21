"""Independent updater status UI; no imports from the installation being replaced."""
import os
from pathlib import Path
import queue
import threading
import time


TEXT = {
    "waiting": ("Waiting for AVAS to close...", "正在等待 AVAS 关闭……"),
    "checking": ("Checking the update and installed files...", "正在检查更新包和已安装文件……"),
    "backup": ("Backing up program files...", "正在备份程序文件……"),
    "installing": ("Installing the update...", "正在安装更新……"),
    "dependencies": ("Updating Python dependencies...", "正在更新 Python 依赖……"),
    "checking_startup": ("Checking the updated program...", "正在检查更新后的程序……"),
    "restoring": ("Restoring the previous program files...", "正在恢复原来的程序文件……"),
    "restarting": ("Starting AVAS automatically...", "正在自动启动 AVAS……"),
    "failed": ("The update failed. See the error details.", "更新失败，请查看错误详情。"),
    "attention": ("An update is in progress. Please wait for the automatic restart.", "更新正在进行，请等待自动重启。"),
}


class StatusWindow:
    def __init__(self, language="en", attention=None, enabled=True):
        self.zh = language == "zh_CN"
        self.attention = Path(attention) if attention else None
        self.enabled = enabled
        self.messages = queue.Queue()
        self.ready = threading.Event()
        self.stopped = threading.Event()
        self.error = None
        self.thread = None

    def __enter__(self):
        if self.enabled:
            self.thread = threading.Thread(target=self._run, name="AVAS update status", daemon=True)
            self.thread.start()
            if not self.ready.wait(10) or self.error:
                self.stopped.set()
                raise RuntimeError(f"Could not open the update status window: {self.error or 'timeout'}")
        return self

    def __exit__(self, *args):
        self.stopped.set()
        if self.thread:
            self.thread.join(timeout=5)

    def set(self, stage, value=None):
        self.messages.put((stage, value))

    def phase_label(self, stage, value=None):
        """Measured percentages apply to the current phase, not the entire update."""
        names = ("准备", "备份", "安装", "检查", "重启") if self.zh else ("Prepare", "Backup", "Install", "Check", "Restart")
        index = {"waiting": 0, "checking": 0, "backup": 1, "installing": 2,
                 "dependencies": 2, "checking_startup": 3, "restarting": 4}.get(stage)
        if index is None:
            return TEXT[stage][int(self.zh)]
        trail = "  →  ".join(f"[{name}]" if i == index else name for i, name in enumerate(names))
        if value is not None and stage in ("backup", "installing"):
            trail += f"   ·   {round(max(0, min(1, value)) * 100)}%"
        return trail

    def _attention(self):
        if self.attention and self.attention.exists():
            try:
                self.attention.unlink()
            except OSError:
                pass
            return True
        return False

    def _run(self):
        try:
            if os.name == "nt":
                self._windows()
            else:
                self._tk()
        except Exception as exc:
            self.error = exc
            self.ready.set()

    def _labels(self):
        if self.zh:
            return "AVAS 更新", "正在更新 AVAS", "完成后会自动重启，请勿手动打开或关闭更新程序。"
        return "AVAS update", "Updating AVAS", "AVAS will restart automatically. Please do not open AVAS or close this updater."

    def _windows(self):
        import ctypes as c
        from ctypes import wintypes as w
        user = c.WinDLL("user32", use_last_error=True)
        gdi = c.WinDLL("gdi32", use_last_error=True)
        common = c.WinDLL("comctl32", use_last_error=True)
        kernel = c.WinDLL("kernel32", use_last_error=True)
        callback_type = c.WINFUNCTYPE(c.c_ssize_t, w.HWND, w.UINT, w.WPARAM, w.LPARAM)

        class WindowClass(c.Structure):
            _fields_ = [("style", w.UINT), ("procedure", callback_type), ("class_extra", c.c_int),
                        ("window_extra", c.c_int), ("instance", w.HINSTANCE), ("icon", w.HICON),
                        ("cursor", w.HANDLE), ("background", w.HBRUSH), ("menu", w.LPCWSTR), ("name", w.LPCWSTR)]

        user.RegisterClassW.argtypes = [c.POINTER(WindowClass)]
        user.UnregisterClassW.argtypes = [w.LPCWSTR, w.HINSTANCE]
        user.DefWindowProcW.argtypes = [w.HWND, w.UINT, w.WPARAM, w.LPARAM]
        user.DefWindowProcW.restype = c.c_ssize_t
        user.GetSysColorBrush.argtypes = [c.c_int]
        user.GetSysColorBrush.restype = w.HBRUSH
        kernel.GetModuleHandleW.argtypes = [w.LPCWSTR]
        kernel.GetModuleHandleW.restype = w.HINSTANCE
        user.CreateWindowExW.argtypes = [w.DWORD, w.LPCWSTR, w.LPCWSTR, w.DWORD, c.c_int, c.c_int,
                                        c.c_int, c.c_int, w.HWND, w.HMENU, w.HINSTANCE, c.c_void_p]
        user.CreateWindowExW.restype = w.HWND
        user.SendMessageW.argtypes = [w.HWND, w.UINT, w.WPARAM, w.LPARAM]
        user.SendMessageW.restype = c.c_ssize_t
        user.SetWindowTextW.argtypes = [w.HWND, w.LPCWSTR]
        user.ShowWindow.argtypes = [w.HWND, c.c_int]
        user.SetForegroundWindow.argtypes = [w.HWND]
        user.DestroyWindow.argtypes = [w.HWND]
        user.GetSystemMenu.argtypes = [w.HWND, w.BOOL]
        user.GetSystemMenu.restype = w.HMENU
        user.EnableMenuItem.argtypes = [w.HMENU, w.UINT, w.UINT]
        user.SetWindowLongW.argtypes = [w.HWND, c.c_int, w.LONG]
        user.PeekMessageW.argtypes = [c.POINTER(w.MSG), w.HWND, w.UINT, w.UINT, w.UINT]
        user.TranslateMessage.argtypes = [c.POINTER(w.MSG)]
        user.DispatchMessageW.argtypes = [c.POINTER(w.MSG)]
        user.DispatchMessageW.restype = c.c_ssize_t
        gdi.CreateFontW.argtypes = [c.c_int] * 5 + [w.DWORD] * 8 + [w.LPCWSTR]
        gdi.CreateFontW.restype = w.HANDLE
        gdi.DeleteObject.argtypes = [w.HANDLE]
        user.SetProcessDPIAware()
        scale = user.GetDpiForSystem() / 96 if hasattr(user, "GetDpiForSystem") else 1
        px = lambda n: round(n * scale)
        common.InitCommonControls()
        title, heading, note = self._labels()
        width, height = px(660), px(310)
        x = max(0, (user.GetSystemMetrics(0) - width) // 2)
        y = max(0, (user.GetSystemMetrics(1) - height) // 2)
        # Native system colours/fonts are deliberate: this helper cannot depend on
        # the React/WebView runtime while the installation is being replaced.
        @callback_type
        def procedure(hwnd, message, wp, lp):
            if message == 0x10:  # closing the status window must not interrupt installation
                return 0
            return user.DefWindowProcW(hwnd, message, wp, lp)

        instance = kernel.GetModuleHandleW(None)
        class_name = f"AVASUpdateStatus-{threading.get_ident()}"
        window_class = WindowClass(0, procedure, 0, 0, instance, None, None,
                                   user.GetSysColorBrush(15), None, class_name)
        if not user.RegisterClassW(c.byref(window_class)):
            raise c.WinError(c.get_last_error())
        window = user.CreateWindowExW(0x40000, class_name, title, 0x00CA0000, x, y, width, height,
                                      None, None, instance, None)
        if not window:
            user.UnregisterClassW(class_name, instance)
            raise c.WinError(c.get_last_error())
        font = None
        try:
            user.EnableMenuItem(user.GetSystemMenu(window, False), 0xF060, 1)  # disable Close during replacement
            font = gdi.CreateFontW(-px(15), 0, 0, 0, 400, 0, 0, 0, 1, 0, 0, 5, 0, "Segoe UI")

            def label(text, top, h=32):
                child = user.CreateWindowExW(0, "STATIC", text, 0x50000000, px(26), px(top), px(602), px(h),
                                             window, None, None, None)
                if not child:
                    raise c.WinError(c.get_last_error())
                user.SendMessageW(child, 0x30, font, 1)
                return child

            label("AVAS  /  " + heading, 22)
            phases = label(self.phase_label("waiting"), 66, 45)
            status = label(TEXT["waiting"][int(self.zh)], 122)
            progress = user.CreateWindowExW(0, "msctls_progress32", "", 0x50000008, px(26), px(164), px(602), px(8),
                                            window, None, None, None)
            if not progress:
                raise c.WinError(c.get_last_error())
            label(note, 195, 55)
            user.SendMessageW(progress, 0x406, 0, 100)  # PBM_SETRANGE32
            user.SendMessageW(progress, 0x40A, 1, 40)   # PBM_SETMARQUEE
            user.ShowWindow(window, 5)
            self.ready.set()
            message = w.MSG()
            while not self.stopped.is_set():
                while user.PeekMessageW(c.byref(message), None, 0, 0, 1):
                    user.TranslateMessage(c.byref(message))
                    user.DispatchMessageW(c.byref(message))
                while not self.messages.empty():
                    stage, value = self.messages.get_nowait()
                    user.SetWindowTextW(status, TEXT[stage][int(self.zh)])
                    user.SetWindowTextW(phases, self.phase_label(stage, value))
                    user.SetWindowLongW(progress, -16, 0x50000008 if value is None else 0x50000000)
                    user.SendMessageW(progress, 0x40A, int(value is None), 40)
                    if value is not None:
                        user.SendMessageW(progress, 0x402, round(max(0, min(1, value)) * 100), 0)
                if self._attention():
                    user.SetWindowTextW(status, TEXT["attention"][int(self.zh)])
                    user.ShowWindow(window, 9)
                    user.SetForegroundWindow(window)
                self.stopped.wait(0.05)
        finally:
            user.DestroyWindow(window)
            if font:
                gdi.DeleteObject(font)
            user.UnregisterClassW(class_name, instance)

    def _tk(self):
        import tkinter as tk
        from tkinter import ttk
        root = tk.Tk()
        try:
            title, heading, note = self._labels()
            root.title(title)
            root.resizable(False, False)
            root.protocol("WM_DELETE_WINDOW", lambda: None)
            frame = ttk.Frame(root, padding=24)
            frame.pack()
            ttk.Label(frame, text="AVAS  /  " + heading).pack(anchor="w", pady=(0, 18))
            phases = tk.StringVar(value=self.phase_label("waiting"))
            ttk.Label(frame, textvariable=phases, wraplength=580).pack(anchor="w")
            text = tk.StringVar(value=TEXT["waiting"][int(self.zh)])
            ttk.Label(frame, textvariable=text).pack(anchor="w", pady=16)
            bar = ttk.Progressbar(frame, length=580, mode="indeterminate")
            bar.pack()
            ttk.Label(frame, text=note, wraplength=580).pack(anchor="w", pady=(22, 0))
            bar.start()
            root.update()
            self.ready.set()
            while not self.stopped.is_set():
                while not self.messages.empty():
                    stage, value = self.messages.get_nowait()
                    text.set(TEXT[stage][int(self.zh)])
                    phases.set(self.phase_label(stage, value))
                    bar.stop()
                    bar.configure(mode="indeterminate" if value is None else "determinate")
                    if value is None:
                        bar.start()
                    else:
                        bar["value"] = max(0, min(1, value)) * 100
                if self._attention():
                    text.set(TEXT["attention"][int(self.zh)])
                    root.deiconify()
                    root.lift()
                root.update()
                time.sleep(0.05)
        finally:
            root.destroy()
