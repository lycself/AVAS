"""Standalone update presentation: shared scene, Win32 GDI and Tk canvas adapters.

No imports from AVAS or third-party GUI runtimes. Colours normally come from the
active frontend CSS tokens; the fallback mirrors those tokens for older callers.
"""
import math
import os
import re
import time


def normalize_layout(value):
    """Validate the plain drawing snapshot received from the authenticated UI."""
    if not isinstance(value, dict):
        return None
    def number(n):
        return isinstance(n, (int, float)) and not isinstance(n, bool) and math.isfinite(n)
    def rect(r):
        return (isinstance(r, list) and len(r) == 4 and all(number(n) and abs(n) <= 32000 for n in r)
                and r[2] >= r[0] and r[3] >= r[1])
    if not all(number(value.get(k)) and 100 <= value[k] <= 16000 for k in ("width", "height")):
        return None
    if not all(rect(value.get(k)) for k in ("header", "body", "footer", "message", "track", "title")):
        return None
    nodes, commands = value.get("nodes"), value.get("commands")
    if not isinstance(nodes, list) or len(nodes) != 5 or not all(rect(r) for r in nodes):
        return None
    labels = value.get("labels")
    if not isinstance(labels, list) or len(labels) != 5 or not all(rect(r) for r in labels):
        return None
    if not isinstance(commands, list) or len(commands) > 2000:
        return None
    total = 0
    for cmd in commands:
        if not (isinstance(cmd, list) and len(cmd) == 8 and cmd[0] == "text" and rect(cmd[1])
                and isinstance(cmd[2], str) and re.fullmatch(r"#[0-9a-fA-F]{6}", cmd[2])
                and isinstance(cmd[3], str) and number(cmd[4]) and 1 <= cmd[4] <= 200
                and cmd[5] == "left" and number(cmd[6]) and 100 <= cmd[6] <= 1000
                and isinstance(cmd[7], list) and len(cmd[7]) == len(cmd[3].encode("utf-16-le", errors="surrogatepass"))//2
                and all(number(n) and 0 <= n <= 400 for n in cmd[7])):
            return None
        total += len(cmd[3])
    if total > 32000 or not number(value.get("grid")) or not 4 <= value["grid"] <= 400:
        return None
    if not number(value.get("scroll")) or not 0 <= value["scroll"] <= 10000000:
        return None
    rules = value.get("rules", [])
    if not isinstance(rules, list) or len(rules) > 10 or not all(rect(r) for r in rules):
        return None
    return {**{k: value[k] for k in ("width", "height", "header", "body", "footer", "message", "track", "nodes", "labels", "title", "commands", "grid", "scroll")}, "rules": rules}


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
    motion = value.get("motion", "full")
    epoch = value.get("animationEpoch")
    if not isinstance(epoch, (int, float)) or isinstance(epoch, bool) or not math.isfinite(epoch) or abs(time.time()*1000-epoch) > 86400000:
        epoch = None
    return {"theme": theme, "colours": colours, "bounds": bounds,
            "layout": normalize_layout(value.get("layout")),
            "animationEpoch": epoch,
            "motion": motion if motion in ("full", "lite", "off", "auto") else "full"}


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


def activity_segment(width, phase):
    """Match CSS progress-slide: 30% segment, left -30% -> 100%, ease-in-out."""
    low, high = 0.0, 1.0
    phase = max(0, min(1, phase))
    for _ in range(16):
        t = (low+high)/2
        x = 3*(1-t)**2*t*.42 + 3*(1-t)*t*t*.58 + t**3
        if x < phase: low = t
        else: high = t
    eased = 3*t*t-2*t**3
    left = width*(-.3+1.3*eased)
    return max(0, left), min(width, left+width*.3)


def scene(model, width, height):
    """Logical-pixel draw commands shared by both adapters; no generated percentages."""
    if model.get("layout"):
        return handoff_scene(model)
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
    for i in range(4):
        box(pad+(i+.5)*spacing+14, node_y+14, max(0, spacing-28), 1, "border")
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
        if model["stage"] != "failed":
            track = width-2*pad
            # A moving segment indicates activity, never a completion percentage.
            left, right = activity_segment(track, model.get("phase", 0.5))
            if right > left:
                box(pad+left, bar_y, right-left, 5, "accent", "activity")
        text("正在处理中…" if zh else "Working…", pad, bar_y+12, width-2*pad, 24, 12, "muted")
    if not compact:
        text("请等待自动重启。你的项目与个人设置将保留。" if zh else "Please wait for the automatic restart. Your projects and settings are preserved.",
             pad, height-157, width-2*pad, 65, 13, "muted")
    box(0, height-64, width, 64, "surface")
    text("安装中，请等待自动重启。无法取消。" if zh else "Installation in progress. Please wait for automatic restart. Cannot cancel.",
         pad, height-52, width-2*pad, 46, 12, "muted")
    return commands


def handoff_scene(model):
    layout, colours = model["layout"], model["colours"]
    width, height = layout["width"], layout["height"]
    commands = [("rect", (0, 0, width, height), colours["bg"])]
    left, top, right, bottom = layout["body"]
    grid = layout["grid"]
    unit = grid/40
    for x in range(math.ceil((right-left)/grid)):
        commands.append(("rect", (left+x*grid, top, left+x*grid+1, bottom), colours["grid"]))
    y = top - layout["scroll"] % grid
    while y < bottom:
        if y >= top:
            commands.append(("rect", (left, y, right, y+1), colours["grid"]))
        y += grid
    for key in ("header", "footer"):
        commands.append(("rect", layout[key], colours["surface"]))
    for r in ((0, 0, width, unit), (0, height-unit, width, height), (0, 0, unit, height), (width-unit, 0, width, height)):
        commands.append(("rect", r, colours["border"]))
    for r in layout["rules"]:
        commands.append(("rect", r, colours["border"]))
    heading_added = False
    for command in layout["commands"]:
        r, title = command[1], layout["title"]
        if model["stage"] not in ("waiting", "checking") and title[0] <= r[0] < title[2] and title[1] <= r[1] < title[3]:
            if heading_added:
                continue
            heading_added = True
            zh = model["zh"]
            heading = ("正在自动重启" if zh else "Restarting AVAS") if model["stage"] == "restarting" else (
                ("更新需要处理" if zh else "Update needs attention") if model["stage"] == "failed" else ("正在安装更新" if zh else "Installing your update"))
            commands.append(("text", title, command[2], heading, command[4], "left", command[6]))
        else:
            commands.append(command)
    header = layout["header"]
    commands.append(("text", (width-55*unit, header[1]+10*unit, width-15*unit, header[3]), colours["muted"], "—", 15*unit, "center"))
    nodes = layout["nodes"]
    labels = ["下载", "校验", "准备", "安装", "重启"] if model["zh"] else ["Download", "Verify", "Prepare", "Install", "Restart"]
    centres = [(r[0]+r[2])/2 for r in nodes]
    cy = (nodes[0][1]+nodes[0][3])/2
    for previous, following in zip(nodes, nodes[1:]):
        if following[0] > previous[2]:
            commands.append(("rect", (previous[2], cy, following[0], cy+unit), colours["border"]))
    for index, r in enumerate(nodes):
        active = index == model["step"]
        commands.append(("ellipse", r, colours["accent"] if active else colours["border"]))
        if not active:
            commands.append(("ellipse", (r[0]+1, r[1]+1, r[2]-1, r[3]-1), colours["bg"]))
        commands.append(("text", (r[0], r[1]+5*unit, r[2], r[3]), colours["onAccent"] if active else colours["accent"] if index < model["step"] else colours["muted"],
                         "✓" if index < model["step"] else str(index+1), 12*unit, "center"))
        # The captured browser span is only as wide as its text. At high DPI
        # the native font can be one pixel wider, which made DrawText wrap a
        # two-character Chinese label and clip its second line. Give the
        # native renderer the whole stage column while retaining the captured
        # vertical position.
        captured = layout["labels"][index]
        left = layout["body"][0] if index == 0 else (centres[index-1]+centres[index])/2
        right = layout["body"][2] if index == len(nodes)-1 else (centres[index]+centres[index+1])/2
        commands.append(("text", (left, captured[1], right, captured[3]),
                         colours["text"] if active else colours["muted"], labels[index], 12*unit, "center"))
    message = model["message"]
    if model["value"] is not None:
        message += f"   {round(model['value']*100)}%"
    commands.append(("text", layout["message"], colours["text"], message, 13*unit, "left"))
    track = layout["track"]
    commands.append(("rect", track, colours["border"]))
    if model["value"] is not None:
        commands.append(("rect", (track[0], track[1], track[0]+(track[2]-track[0])*model["value"], track[3]), colours["accent"]))
    elif model["stage"] != "failed":
        left, right = activity_segment(track[2]-track[0], model.get("phase", .5))
        commands.append(("activity", (track[0]+left, track[1], track[0]+right, track[3]), colours["accent"]))
    return commands


def progress_rect(model, width, height):
    if model.get("layout"):
        return model["layout"]["track"]
    pad = 28 if width >= 450 else 18
    y = 278 if height < 550 else 332
    return (pad, y, width-pad, y+5)


def frame_delay(start, now, animating):
    """Drawing time counts towards the frame interval instead of adding to it."""
    return max(0, (1/60 if animating else .05) - (now-start))


def run_windows(status):
    import ctypes as c
    from ctypes import wintypes as w
    user, gdi, kernel = (c.WinDLL(name, use_last_error=True) for name in ("user32", "gdi32", "kernel32"))
    winmm = c.WinDLL("winmm")
    winmm.timeBeginPeriod.argtypes = winmm.timeEndPeriod.argtypes = [w.UINT]
    timer_active = False
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
    shell = c.WinDLL("shell32", use_last_error=True)
    api(shell, "SetCurrentProcessExplicitAppUserModelID", c.c_long, w.LPCWSTR)("AVAS.Update")
    if status.presentation["motion"] == "auto":
        enabled = w.BOOL(True)
        api(user, "SystemParametersInfoW", w.BOOL, w.UINT, w.UINT, c.c_void_p, w.UINT)(0x1042, 0, c.byref(enabled), 0)
        status.presentation["motion"] = "full" if enabled.value else "off"
    api(user, "LoadImageW", w.HANDLE, w.HINSTANCE, w.LPCWSTR, w.UINT, c.c_int, c.c_int, w.UINT)
    api(user, "SendMessageW", c.c_ssize_t, w.HWND, w.UINT, w.WPARAM, w.LPARAM)
    api(user, "DestroyIcon", w.BOOL, w.HICON)
    api(user, "IsIconic", w.BOOL, w.HWND)
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
    api(user, "SetWindowRgn", c.c_int, w.HWND, w.HANDLE, w.BOOL)
    api(user, "PeekMessageW", w.BOOL, c.POINTER(w.MSG), w.HWND, w.UINT, w.UINT, w.UINT)
    api(user, "TranslateMessage", w.BOOL, c.POINTER(w.MSG))
    api(user, "DispatchMessageW", c.c_ssize_t, c.POINTER(w.MSG))
    api(gdi, "CreateCompatibleDC", w.HDC, w.HDC)
    api(gdi, "CreateCompatibleBitmap", w.HBITMAP, w.HDC, c.c_int, c.c_int)
    api(gdi, "SelectObject", w.HANDLE, w.HDC, w.HANDLE)
    api(gdi, "DeleteObject", w.BOOL, w.HANDLE)
    api(gdi, "DeleteDC", w.BOOL, w.HDC)
    api(gdi, "CreateSolidBrush", w.HBRUSH, w.DWORD)
    api(gdi, "CreateRoundRectRgn", w.HANDLE, *([c.c_int]*6))
    api(gdi, "GetStockObject", w.HANDLE, c.c_int)
    api(gdi, "SetTextColor", w.DWORD, w.HDC, w.DWORD)
    api(gdi, "SetBkMode", c.c_int, w.HDC, c.c_int)
    api(gdi, "ExtTextOutW", w.BOOL, w.HDC, c.c_int, c.c_int, w.UINT, c.POINTER(w.RECT), w.LPCWSTR, w.UINT, c.POINTER(c.c_int))
    api(gdi, "Ellipse", w.BOOL, w.HDC, c.c_int, c.c_int, c.c_int, c.c_int)
    api(gdi, "BitBlt", w.BOOL, w.HDC, c.c_int, c.c_int, c.c_int, c.c_int, w.HDC, c.c_int, c.c_int, w.DWORD)
    api(gdi, "StretchBlt", w.BOOL, w.HDC, c.c_int, c.c_int, c.c_int, c.c_int, w.HDC, c.c_int, c.c_int, c.c_int, c.c_int, w.DWORD)
    api(gdi, "SetStretchBltMode", c.c_int, w.HDC, c.c_int)
    api(gdi, "SetBrushOrgEx", w.BOOL, w.HDC, c.c_int, c.c_int, c.c_void_p)
    api(gdi, "CreateFontW", w.HANDLE, *([c.c_int]*5 + [w.DWORD]*8 + [w.LPCWSTR]))
    bounds = status.presentation["bounds"]
    probe = w.RECT(*([round(bounds[0]), round(bounds[1]), round(bounds[0]+bounds[2]), round(bounds[1]+bounds[3])] if bounds else [0, 0, 1, 1]))
    monitor = user.MonitorFromRect(c.byref(probe), 2)
    mi = MI(); mi.size = c.sizeof(mi)
    if not user.GetMonitorInfoW(monitor, c.byref(mi)):
        raise c.WinError(c.get_last_error())
    default_scale = user.GetDpiForSystem()/96 if hasattr(user, "GetDpiForSystem") else 1
    x, y, width, height, scale = fit_bounds(bounds, (mi.work.left, mi.work.top, mi.work.right, mi.work.bottom), default_scale)
    def round_window(hwnd):
        unit = status.presentation["layout"]["grid"]/40 if status.presentation["layout"] else 1
        radius = round(12*scale*unit)
        region = gdi.CreateRoundRectRgn(0, 0, width+1, height+1, radius, radius)
        if region and not user.SetWindowRgn(hwnd, region, True):
            gdi.DeleteObject(region)  # successful SetWindowRgn transfers ownership
    def colour(value):
        return int(value[1:3], 16) | int(value[3:5], 16)<<8 | int(value[5:7], 16)<<16
    cache = {}
    activity_brushes = {key: gdi.CreateSolidBrush(colour(status.presentation["colours"][key]))
                        for key in ("accent", "border")}
    def clear_cache():
        if cache:
            gdi.SelectObject(cache["dc"], cache["old"])
            gdi.DeleteObject(cache["bitmap"])
            gdi.DeleteDC(cache["dc"])
            cache.clear()

    def present(dc, ps, model):
        # Update the tiny animation strip offscreen, then present in one buffered pass.
        if model["value"] is None and model["stage"] != "failed":
            track = progress_rect(model, width/scale, height/scale)
            track_rect = w.RECT(*(round(v*scale) for v in track))
            user.FillRect(cache["dc"], c.byref(track_rect), activity_brushes["border"])
            left, right = activity_segment(track[2]-track[0], model["phase"])
            segment = w.RECT(round((track[0]+left)*scale), round(track[1]*scale),
                             round((track[0]+right)*scale), round(track[3]*scale))
            user.FillRect(cache["dc"], c.byref(segment), activity_brushes["accent"])
        r = ps.rect
        gdi.BitBlt(dc, r.left, r.top, r.right-r.left, r.bottom-r.top,
                   cache["dc"], r.left, r.top, 0x00CC0020)

    def paint(hwnd):
        ps = PS(); dc = user.BeginPaint(hwnd, c.byref(ps))
        rect = w.RECT(); user.GetClientRect(hwnd, c.byref(rect))
        model = status.model()
        key = (rect.right, rect.bottom, scale, model["stage"], model["value"])
        if cache.get("key") == key:
            try:
                present(dc, ps, model)
            finally:
                user.EndPaint(hwnd, c.byref(ps))
            return
        clear_cache()
        # Supersample geometry at physical DPI; draw text at native resolution below.
        samples = 2 if rect.right*rect.bottom <= 4000000 else 1
        draw_scale = scale*samples
        mem = gdi.CreateCompatibleDC(dc); bitmap = gdi.CreateCompatibleBitmap(dc, rect.right*samples, rect.bottom*samples)
        if not mem or not bitmap:
            if bitmap: gdi.DeleteObject(bitmap)
            if mem: gdi.DeleteDC(mem)
            user.EndPaint(hwnd, c.byref(ps)); raise OSError("Cannot allocate update window surface")
        old_bitmap = gdi.SelectObject(mem, bitmap)
        final = gdi.CreateCompatibleDC(dc)
        final_bitmap = gdi.CreateCompatibleBitmap(dc, rect.right, rect.bottom)
        if not final or not final_bitmap:
            if final_bitmap: gdi.DeleteObject(final_bitmap)
            if final: gdi.DeleteDC(final)
            gdi.SelectObject(mem, old_bitmap); gdi.DeleteObject(bitmap); gdi.DeleteDC(mem)
            user.EndPaint(hwnd, c.byref(ps)); raise OSError("Cannot allocate update window text surface")
        old_final = gdi.SelectObject(final, final_bitmap)
        gdi.SetBkMode(mem, 1)
        try:
            commands = scene(model, rect.right/scale, rect.bottom/scale)
            for cmd in commands:
                kind, coords, ink = cmd[:3]
                r = w.RECT(*(round(v*draw_scale) for v in coords))
                if kind in ("text", "activity"):
                    continue
                else:
                    brush = gdi.CreateSolidBrush(colour(ink))
                    if kind == "ellipse":
                        old = gdi.SelectObject(mem, brush); pen = gdi.SelectObject(mem, gdi.GetStockObject(8))
                        gdi.Ellipse(mem, r.left, r.top, r.right, r.bottom)
                        gdi.SelectObject(mem, old); gdi.SelectObject(mem, pen)
                    else:
                        user.FillRect(mem, c.byref(r), brush)
                    gdi.DeleteObject(brush)
            gdi.SetStretchBltMode(final, 4)  # HALFTONE: antialiased circles and lines
            gdi.SetBrushOrgEx(final, 0, 0, None)
            gdi.StretchBlt(final, 0, 0, rect.right, rect.bottom, mem, 0, 0, rect.right*samples, rect.bottom*samples, 0x00CC0020)
            # Text is not scaled as a bitmap: retain ClearType at the monitor's DPI.
            gdi.SetBkMode(final, 1)
            for cmd in commands:
                if cmd[0] != "text": continue
                r = w.RECT(*(round(v*scale) for v in cmd[1]))
                font = gdi.CreateFontW(-round(cmd[4]*scale), 0, 0, 0, round(cmd[6]) if len(cmd) > 6 else 400, 0, 0, 0, 1, 0, 0, 5, 0,
                                       "Microsoft YaHei UI" if status.zh else "Segoe UI")
                old = gdi.SelectObject(final, font); gdi.SetTextColor(final, colour(cmd[2]))
                if len(cmd) > 7:
                    # Browser line breaks and glyph advances survive the renderer switch.
                    position = 0.0
                    advances = []
                    for advance in cmd[7]:
                        advances.append(round((position+advance)*scale)-round(position*scale))
                        position += advance
                    dx = (c.c_int*len(advances))(*advances)
                    body = model["layout"]["body"] if model.get("layout") else None
                    clip = w.RECT(*(round(v*scale) for v in body)) if body and cmd[1][3] > body[1] and cmd[1][1] < body[3] else None
                    gdi.ExtTextOutW(final, r.left, r.top, 4 if clip is not None else 0,
                                   c.byref(clip) if clip is not None else None, cmd[3], len(advances), dx)
                else:
                    user.DrawTextW(final, cmd[3], -1, c.byref(r), 0x10 | 0x800 | (1 if cmd[5] == "center" else 0))
                gdi.SelectObject(final, old); gdi.DeleteObject(font)
            cache.update(dc=final, bitmap=final_bitmap, old=old_final, key=key)
            present(dc, ps, model)
        finally:
            if not cache:
                gdi.SelectObject(final, old_final); gdi.DeleteObject(final_bitmap); gdi.DeleteDC(final)
            gdi.SelectObject(mem, old_bitmap); gdi.DeleteObject(bitmap); gdi.DeleteDC(mem); user.EndPaint(hwnd, c.byref(ps))
    @callback_type
    def procedure(hwnd, msg, wp, lp):
        nonlocal scale, width, height
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
                width, height = r.right-r.left, r.bottom-r.top
                user.SetWindowPos(hwnd, None, r.left, r.top, r.right-r.left, r.bottom-r.top, 0x14)
                round_window(hwnd)
                user.InvalidateRect(hwnd, None, False); return 0
            return user.DefWindowProcW(hwnd, msg, wp, lp)
        except Exception as exc:
            status.error = exc; status.stopped.set(); status.ready.set(); return 0
    instance = kernel.GetModuleHandleW(None); name = f"AVASUpdateCanvas-{id(status)}"
    wc = WC(0x20000, procedure, 0, 0, instance, None, None, None, None, name)
    window = None
    icons = []
    try:
        if not user.RegisterClassW(c.byref(wc)): raise c.WinError(c.get_last_error())
        window = user.CreateWindowExW(0x40000, name, status._labels()[0], 0x800A0000, x, y, width, height, None, None, instance, None)
        if not window: raise c.WinError(c.get_last_error())
        round_window(window)
        if hasattr(user, "GetDpiForWindow"):
            api(user, "GetDpiForWindow", w.UINT, w.HWND); status._dpi = user.GetDpiForWindow(window)
        if status.icon_path:
            for kind, size in ((0, 16), (1, 32)):
                pixels = round(size*getattr(status, "_dpi", 96)/96)
                icon = user.LoadImageW(None, status.icon_path, 1, pixels, pixels, 0x10)
                if icon:
                    icons.append(icon)
                    user.SendMessageW(window, 0x80, kind, icon)
        user.ShowWindow(window, 5); user.UpdateWindow(window)
        status.ready.set()  # only after first paint, before main process exits
        message = w.MSG()
        while not status.stopped.is_set():
            frame_start = time.monotonic()
            while user.PeekMessageW(c.byref(message), None, 0, 0, 1):
                user.TranslateMessage(c.byref(message)); user.DispatchMessageW(c.byref(message))
            changed = status.drain()
            if changed:
                user.SetWindowTextW(window, status._labels()[0] + " — " + status.model()["message"])
            visible = not user.IsIconic(window)
            animating = visible and status.animating()
            if animating != timer_active:
                if animating:
                    timer_active = winmm.timeBeginPeriod(1) == 0
                else:
                    winmm.timeEndPeriod(1); timer_active = False
            if (changed or animating) and visible:
                dirty = None if changed else w.RECT(*(round(v*scale) for v in progress_rect(status.model(), width/scale, height/scale)))
                user.InvalidateRect(window, c.byref(dirty) if dirty is not None else None, False)
                user.UpdateWindow(window)
            if status._attention():
                user.ShowWindow(window, 9); user.SetForegroundWindow(window)
            status.stopped.wait(frame_delay(frame_start, time.monotonic(), animating))
    finally:
        if timer_active:
            winmm.timeEndPeriod(1)
        clear_cache()
        for brush in activity_brushes.values():
            gdi.DeleteObject(brush)
        if window: user.DestroyWindow(window)
        for icon in icons: user.DestroyIcon(icon)
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
            changed = status.drain()
            if (changed or status.animating()) and root.state() != "iconic": draw()
            if status._attention(): root.deiconify(); root.lift()
            root.update(); status.stopped.wait(0.05)
    finally:
        root.destroy()
