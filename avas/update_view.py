"""Standalone update presentation: shared scene, Win32 GDI and Tk canvas adapters.

No imports from AVAS or third-party GUI runtimes. Colours normally come from the
active frontend CSS tokens; the fallback mirrors those tokens for older callers.
"""
import math
import os
import re


PALETTES = {
    "dark": dict(bg="#101923", surface="#14202c", accent="#5bd7ed", grid="#192936",
                 onAccent="#102330", text="#e7e7e7", muted="#9d9d9d", border="#3c3c3c"),
    "light": dict(bg="#f5f9fc", surface="#ffffff", accent="#007c9c", grid="#e7f0f5",
                  onAccent="#ffffff", text="#1f1f1f", muted="#616161", border="#cecece"),
}


def normalize_presentation(value):
    value = value if isinstance(value, dict) else {}
    theme = "dark" if value.get("theme") == "dark" else "light"
    colours = dict(PALETTES[theme])
    supplied = value.get("colours", {})
    if isinstance(supplied, dict):
        for key in colours:
            colour = supplied.get(key)
            if isinstance(colour, str) and re.fullmatch(r"#[0-9a-fA-F]{6}", colour):
                colours[key] = colour
    bounds = value.get("bounds")
    if not (isinstance(bounds, list) and len(bounds) == 5 and all(
            isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) for v in bounds)
            and 100 <= bounds[2] <= 16000 and 100 <= bounds[3] <= 16000 and 0.5 <= bounds[4] <= 8
            and abs(bounds[0]) <= 100000 and abs(bounds[1]) <= 100000):
        bounds = None
    return {"theme": theme, "colours": colours, "bounds": bounds}


def map_panel_rect(panel, viewport, client):
    """Browser CSS coordinates -> physical client coordinates, including WebView zoom."""
    try:
        values = [panel[k] for k in ("x", "y", "width", "height")] + [viewport[k] for k in ("width", "height")]
        if not all(isinstance(v, (float, int)) and not isinstance(v, bool) and math.isfinite(v) for v in values):
            return None
        x, y, width, height, vw, vh = values
        if vw <= 0 or vh <= 0 or width < 100 or height < 100 or x < -1 or y < -1 or x + width > vw + 2 or y + height > vh + 2:
            return None
        ox, oy, cw, ch = client
        sx, sy = cw / vw, ch / vh
        return normalize_presentation({"bounds": [round(ox + x * sx), round(oy + y * sy),
                                                  round(width * sx), round(height * sy), sx]})["bounds"]
    except (TypeError, KeyError, ZeroDivisionError):
        return None


def panel_screen_rect(window, presentation):
    if os.name != "nt" or not isinstance(presentation, dict):
        return None
    try:
        import ctypes as c
        from ctypes import wintypes as w
        user = c.WinDLL("user32", use_last_error=True)
        user.SetThreadDpiAwarenessContext.argtypes = [c.c_void_p]
        user.SetThreadDpiAwarenessContext.restype = c.c_void_p
        user.GetClientRect.argtypes = [w.HWND, c.POINTER(w.RECT)]
        user.ClientToScreen.argtypes = [w.HWND, c.POINTER(w.POINT)]
        previous = user.SetThreadDpiAwarenessContext(c.c_void_p(-4))
        try:
            native = window.native
            control = getattr(native, "webview", native)
            hwnd = int(control.Handle.ToInt64())
            rect, origin = w.RECT(), w.POINT(0, 0)
            if not user.GetClientRect(hwnd, c.byref(rect)) or not user.ClientToScreen(hwnd, c.byref(origin)):
                return None
            return map_panel_rect(presentation.get("panel"), presentation.get("viewport"),
                                  (origin.x, origin.y, rect.right, rect.bottom))
        finally:
            if previous:
                user.SetThreadDpiAwarenessContext(previous)
    except (AttributeError, TypeError, OSError, ValueError):
        return None  # older hosts: centre on the current monitor


def fit_bounds(bounds, work, scale):
    left, top, right, bottom = work
    x, y, width, height, scale = bounds or [left + (right-left-680*scale)/2,
                                           top + (bottom-top-610*scale)/2, 680*scale, 610*scale, scale]
    width = min(right-left, max(340*scale, width))
    height = min(bottom-top, max(380*scale, height))
    return round(max(left, min(x, right-width))), round(max(top, min(y, bottom-height))), round(width), round(height), scale


def scene(model, width, height):
    """Logical-pixel draw commands shared by both adapters; no generated percentages."""
    zh, colours = model["zh"], model["colours"]
    commands = []
    def box(x, y, w, h, colour, kind="rect"):
        commands.append((kind, (x, y, x+w, y+h), colours[colour]))
    def text(value, x, y, w, h, size=13, colour="text", align="left"):
        commands.append(("text", (x, y, x+w, y+h), colours[colour], value, size, align))
    box(0, 0, width, height, "bg")
    for x in range(28, int(width), 40):
        box(x, 44, 1, height-108, "grid")
    for y in range(44, int(height)-64, 40):
        box(0, y, width, 1, "grid")
    box(0, 0, width, 44, "surface")
    text("AVAS  /  " + ("软件更新" if zh else "Software update"), 16, 10, width-85, 25, 14)
    text("—", width-55, 10, 40, 24, 15, "muted", "center")
    pad = 28 if width >= 450 else 18
    compact = height < 550
    text("先进虚拟加速器软件" if zh else "Advanced Virtual Accelerator Software", pad, 62, width-2*pad, 25, 11, "muted")
    title = ("正在自动重启" if zh else "Restarting AVAS") if model["stage"] == "restarting" else (
        ("更新需要处理" if zh else "Update needs attention") if model["stage"] == "failed" else ("正在安装更新" if zh else "Installing your update"))
    text(title, pad, 84 if compact else 90, width-2*pad, 30 if compact else 38, 20 if compact else 23)
    versions_y = 120 if compact else 136
    half = (width-2*pad-20)/2
    text("当前版本" if zh else "Current version", pad, versions_y, half, 20, 11, "muted")
    text("目标版本" if zh else "Target version", pad+half+20, versions_y, half, 20, 11, "muted")
    text(model["versions"].get("current", "—"), pad, versions_y+23, half, 26)
    text(model["versions"].get("target", "—"), pad+half+20, versions_y+23, half, 26)
    node_y = 174 if compact else 208
    names = ["下载", "校验", "准备", "安装", "重启"] if zh else ["Download", "Verify", "Prepare", "Install", "Restart"]
    spacing = (width-2*pad)/5
    box(pad+spacing/2, node_y+14, 4*spacing, 1, "border")
    for i, name in enumerate(names):
        cx = pad+(i+.5)*spacing
        active = i == model["step"]
        if active:
            box(cx-20, node_y-6, 40, 40, "surface", "ellipse")
        box(cx-14, node_y, 28, 28, "accent" if active else "border", "ellipse")
        if not active:
            box(cx-13, node_y+1, 26, 26, "bg", "ellipse")
        text("✓" if i < model["step"] else str(i+1), cx-14, node_y+3, 28, 22, 12,
             "onAccent" if active else "accent" if i < model["step"] else "muted", "center")
        text(name, cx-spacing/2, node_y+38, spacing, 24, 12, "text" if active else "muted", "center")
    y = 241 if compact else 282
    text(model["message"], pad, y, width-2*pad, 32 if compact else 46, 13 if compact else 14)
    bar_y = y + (37 if compact else 50)
    box(pad, bar_y, width-2*pad, 5, "border")
    if model["value"] is not None:
        box(pad, bar_y, (width-2*pad)*model["value"], 5, "accent")
        text(("当前步骤 " if zh else "Current operation ") + f"{round(model['value']*100)}%", pad, bar_y+12, width-2*pad, 24, 12, "muted")
    else:
        text("正在处理中…" if zh else "Working…", pad, bar_y+12, width-2*pad, 24, 12, "muted")
    if not compact:
        text("请等待自动重启。你的项目与个人设置将保留。" if zh else "Please wait for the automatic restart. Your projects and settings are preserved.",
             pad, height-157, width-2*pad, 65, 13, "muted")
    box(0, height-64, width, 64, "surface")
    text("安装中，请等待自动重启。无法取消。" if zh else "Installation in progress. Please wait for automatic restart. Cannot cancel.",
         pad, height-52, width-2*pad, 46, 12, "muted")
    return commands


def run_windows(status):
    import ctypes as c
    from ctypes import wintypes as w
    user, gdi, kernel = (c.WinDLL(name, use_last_error=True) for name in ("user32", "gdi32", "kernel32"))
    callback_type = c.WINFUNCTYPE(c.c_ssize_t, w.HWND, w.UINT, w.WPARAM, w.LPARAM)
    class WC(c.Structure):
        _fields_ = [("style", w.UINT), ("proc", callback_type), ("ce", c.c_int), ("we", c.c_int),
                    ("instance", w.HINSTANCE), ("icon", w.HICON), ("cursor", w.HANDLE), ("brush", w.HBRUSH), ("menu", w.LPCWSTR), ("name", w.LPCWSTR)]
    class PS(c.Structure):
        _fields_ = [("dc", w.HDC), ("erase", w.BOOL), ("rect", w.RECT), ("restore", w.BOOL), ("inc", w.BOOL), ("reserved", c.c_byte*32)]
    class MI(c.Structure):
        _fields_ = [("size", w.DWORD), ("monitor", w.RECT), ("work", w.RECT), ("flags", w.DWORD)]
    def api(lib, name, restype, *args):
        fn = getattr(lib, name); fn.restype = restype; fn.argtypes = list(args); return fn
    api(user, "SetThreadDpiAwarenessContext", c.c_void_p, c.c_void_p)
    previous = user.SetThreadDpiAwarenessContext(c.c_void_p(-4))
    api(user, "DefWindowProcW", c.c_ssize_t, w.HWND, w.UINT, w.WPARAM, w.LPARAM)
    api(user, "RegisterClassW", w.ATOM, c.POINTER(WC))
    api(user, "UnregisterClassW", w.BOOL, w.LPCWSTR, w.HINSTANCE)
    api(kernel, "GetModuleHandleW", w.HINSTANCE, w.LPCWSTR)
    api(user, "CreateWindowExW", w.HWND, w.DWORD, w.LPCWSTR, w.LPCWSTR, w.DWORD, c.c_int, c.c_int, c.c_int, c.c_int, w.HWND, w.HMENU, w.HINSTANCE, c.c_void_p)
    api(user, "MonitorFromRect", w.HANDLE, c.POINTER(w.RECT), w.DWORD)
    api(user, "GetMonitorInfoW", w.BOOL, w.HANDLE, c.POINTER(MI))
    api(user, "BeginPaint", w.HDC, w.HWND, c.POINTER(PS))
    api(user, "EndPaint", w.BOOL, w.HWND, c.POINTER(PS))
    api(user, "GetClientRect", w.BOOL, w.HWND, c.POINTER(w.RECT))
    api(user, "GetWindowRect", w.BOOL, w.HWND, c.POINTER(w.RECT))
    api(user, "ScreenToClient", w.BOOL, w.HWND, c.POINTER(w.POINT))
    api(user, "FillRect", c.c_int, w.HDC, c.POINTER(w.RECT), w.HBRUSH)
    api(user, "DrawTextW", c.c_int, w.HDC, w.LPCWSTR, c.c_int, c.POINTER(w.RECT), w.UINT)
    api(user, "ShowWindow", w.BOOL, w.HWND, c.c_int)
    api(user, "UpdateWindow", w.BOOL, w.HWND)
    api(user, "SetForegroundWindow", w.BOOL, w.HWND)
    api(user, "SetWindowTextW", w.BOOL, w.HWND, w.LPCWSTR)
    api(user, "DestroyWindow", w.BOOL, w.HWND)
    api(user, "InvalidateRect", w.BOOL, w.HWND, c.c_void_p, w.BOOL)
    api(user, "SetWindowPos", w.BOOL, w.HWND, w.HWND, c.c_int, c.c_int, c.c_int, c.c_int, w.UINT)
    api(user, "PeekMessageW", w.BOOL, c.POINTER(w.MSG), w.HWND, w.UINT, w.UINT, w.UINT)
    api(user, "TranslateMessage", w.BOOL, c.POINTER(w.MSG))
    api(user, "DispatchMessageW", c.c_ssize_t, c.POINTER(w.MSG))
    api(gdi, "CreateCompatibleDC", w.HDC, w.HDC)
    api(gdi, "CreateCompatibleBitmap", w.HBITMAP, w.HDC, c.c_int, c.c_int)
    api(gdi, "SelectObject", w.HANDLE, w.HDC, w.HANDLE)
    api(gdi, "DeleteObject", w.BOOL, w.HANDLE)
    api(gdi, "DeleteDC", w.BOOL, w.HDC)
    api(gdi, "CreateSolidBrush", w.HBRUSH, w.DWORD)
    api(gdi, "GetStockObject", w.HANDLE, c.c_int)
    api(gdi, "SetTextColor", w.DWORD, w.HDC, w.DWORD)
    api(gdi, "SetBkMode", c.c_int, w.HDC, c.c_int)
    api(gdi, "Ellipse", w.BOOL, w.HDC, c.c_int, c.c_int, c.c_int, c.c_int)
    api(gdi, "BitBlt", w.BOOL, w.HDC, c.c_int, c.c_int, c.c_int, c.c_int, w.HDC, c.c_int, c.c_int, w.DWORD)
    api(gdi, "CreateFontW", w.HANDLE, *([c.c_int]*5 + [w.DWORD]*8 + [w.LPCWSTR]))
    bounds = status.presentation["bounds"]
    probe = w.RECT(*([round(bounds[0]), round(bounds[1]), round(bounds[0]+bounds[2]), round(bounds[1]+bounds[3])] if bounds else [0, 0, 1, 1]))
    monitor = user.MonitorFromRect(c.byref(probe), 2)
    mi = MI(); mi.size = c.sizeof(mi)
    if not user.GetMonitorInfoW(monitor, c.byref(mi)):
        raise c.WinError(c.get_last_error())
    default_scale = user.GetDpiForSystem()/96 if hasattr(user, "GetDpiForSystem") else 1
    x, y, width, height, scale = fit_bounds(bounds, (mi.work.left, mi.work.top, mi.work.right, mi.work.bottom), default_scale)
    def colour(value):
        return int(value[1:3], 16) | int(value[3:5], 16)<<8 | int(value[5:7], 16)<<16
    def paint(hwnd):
        ps = PS(); dc = user.BeginPaint(hwnd, c.byref(ps))
        rect = w.RECT(); user.GetClientRect(hwnd, c.byref(rect))
        mem = gdi.CreateCompatibleDC(dc); bitmap = gdi.CreateCompatibleBitmap(dc, rect.right, rect.bottom)
        if not mem or not bitmap:
            if bitmap: gdi.DeleteObject(bitmap)
            if mem: gdi.DeleteDC(mem)
            user.EndPaint(hwnd, c.byref(ps)); raise OSError("Cannot allocate update window surface")
        old_bitmap = gdi.SelectObject(mem, bitmap)
        gdi.SetBkMode(mem, 1)
        try:
            for cmd in scene(status.model(), rect.right/scale, rect.bottom/scale):
                kind, coords, ink = cmd[:3]
                r = w.RECT(*(round(v*scale) for v in coords))
                if kind == "text":
                    font = gdi.CreateFontW(-round(cmd[4]*scale), 0, 0, 0, 400, 0, 0, 0, 1, 0, 0, 5, 0, "Segoe UI")
                    old = gdi.SelectObject(mem, font); gdi.SetTextColor(mem, colour(ink))
                    user.DrawTextW(mem, cmd[3], -1, c.byref(r), 0x10 | 0x800 | (1 if cmd[5] == "center" else 0))
                    gdi.SelectObject(mem, old); gdi.DeleteObject(font)
                else:
                    brush = gdi.CreateSolidBrush(colour(ink))
                    if kind == "ellipse":
                        old = gdi.SelectObject(mem, brush); pen = gdi.SelectObject(mem, gdi.GetStockObject(8))
                        gdi.Ellipse(mem, r.left, r.top, r.right, r.bottom)
                        gdi.SelectObject(mem, old); gdi.SelectObject(mem, pen)
                    else:
                        user.FillRect(mem, c.byref(r), brush)
                    gdi.DeleteObject(brush)
            gdi.BitBlt(dc, 0, 0, rect.right, rect.bottom, mem, 0, 0, 0x00CC0020)
        finally:
            gdi.SelectObject(mem, old_bitmap); gdi.DeleteObject(bitmap); gdi.DeleteDC(mem); user.EndPaint(hwnd, c.byref(ps))
    @callback_type
    def procedure(hwnd, msg, wp, lp):
        nonlocal scale
        try:
            if msg == 0x10: return 0  # WM_CLOSE: never interrupt installation
            if msg == 0x14: return 1  # background is painted in a single buffered pass
            if msg == 0xF:
                paint(hwnd); return 0
            if msg == 0x84:
                p = w.POINT(c.c_short(lp & 65535).value, c.c_short((lp >> 16) & 65535).value)
                user.ScreenToClient(hwnd, c.byref(p)); r = w.RECT(); user.GetClientRect(hwnd, c.byref(r))
                if p.y < 44*scale and p.x < r.right-60*scale: return 2  # drag title
            if msg == 0x202:
                r = w.RECT(); user.GetClientRect(hwnd, c.byref(r))
                if (lp >> 16 & 65535) < 44*scale and (lp & 65535) >= r.right-60*scale:
                    user.ShowWindow(hwnd, 6)
            if msg == 0x2E0:  # monitor DPI change; preserve user UI zoom
                ratio = (wp & 65535) / getattr(status, "_dpi", (wp & 65535))
                status._dpi = wp & 65535; scale *= ratio
                r = c.cast(lp, c.POINTER(w.RECT)).contents
                user.SetWindowPos(hwnd, None, r.left, r.top, r.right-r.left, r.bottom-r.top, 0x14)
                user.InvalidateRect(hwnd, None, False); return 0
            return user.DefWindowProcW(hwnd, msg, wp, lp)
        except Exception as exc:
            status.error = exc; status.stopped.set(); status.ready.set(); return 0
    instance = kernel.GetModuleHandleW(None); name = f"AVASUpdateCanvas-{id(status)}"
    wc = WC(0, procedure, 0, 0, instance, None, None, None, None, name)
    window = None
    try:
        if not user.RegisterClassW(c.byref(wc)): raise c.WinError(c.get_last_error())
        window = user.CreateWindowExW(0x40000, name, status._labels()[0], 0x800A0000, x, y, width, height, None, None, instance, None)
        if not window: raise c.WinError(c.get_last_error())
        if hasattr(user, "GetDpiForWindow"):
            api(user, "GetDpiForWindow", w.UINT, w.HWND); status._dpi = user.GetDpiForWindow(window)
        user.ShowWindow(window, 5); user.UpdateWindow(window)
        status.ready.set()  # only after first paint, before main process exits
        message = w.MSG()
        while not status.stopped.is_set():
            while user.PeekMessageW(c.byref(message), None, 0, 0, 1):
                user.TranslateMessage(c.byref(message)); user.DispatchMessageW(c.byref(message))
            if status.drain():
                user.SetWindowTextW(window, status._labels()[0] + " — " + status.model()["message"])
                user.InvalidateRect(window, None, False)
            if status._attention():
                user.ShowWindow(window, 9); user.SetForegroundWindow(window)
            status.stopped.wait(0.05)
    finally:
        if window: user.DestroyWindow(window)
        user.UnregisterClassW(name, instance)
        if previous: user.SetThreadDpiAwarenessContext(previous)


def run_tk(status):
    import tkinter as tk
    root = tk.Tk()
    try:
        root.title(status._labels()[0]); root.protocol("WM_DELETE_WINDOW", lambda: None)
        root.resizable(False, False)
        x, y, width, height, scale = fit_bounds(status.presentation["bounds"], (0, 0, root.winfo_screenwidth(), root.winfo_screenheight()), 1)
        root.geometry(f"{width}x{height}+{x}+{y}")
        canvas = tk.Canvas(root, highlightthickness=0); canvas.pack(fill="both", expand=True)
        def draw():
            canvas.delete("all")
            for command in scene(status.model(), width/scale, height/scale):
                kind, coords, colour = command[:3]; rect = [v*scale for v in coords]
                if kind == "text":
                    canvas.create_text((rect[0]+rect[2])/2 if command[5] == "center" else rect[0], rect[1],
                                       text=command[3], fill=colour, font=("Arial", -round(command[4]*scale)),
                                       width=rect[2]-rect[0], anchor="n" if command[5] == "center" else "nw")
                elif kind == "ellipse": canvas.create_oval(*rect, fill=colour, outline="")
                else: canvas.create_rectangle(*rect, fill=colour, outline="")
        draw(); root.update(); status.ready.set()
        while not status.stopped.is_set():
            if status.drain(): draw()
            if status._attention(): root.deiconify(); root.lift()
            root.update(); status.stopped.wait(0.05)
    finally:
        root.destroy()
