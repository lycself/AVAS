"""Suspend, resume and kill a child process together with its descendants.

A simulation is ``python -m avas run`` which loads the engine DLL in-process;
error studies may start helper processes.  Pausing freezes every thread of the
whole tree (``NtSuspendProcess`` on Windows, ``SIGSTOP`` elsewhere), so the
engine continues exactly where it stopped once resumed.  The pause lives in
memory only: a paused tree that is killed is gone like a stopped run.
"""
import os
import signal
import subprocess
import sys

if sys.platform == "win32":
    import ctypes
    from ctypes import wintypes

    _k32 = ctypes.WinDLL("kernel32", use_last_error=True)
    _ntdll = ctypes.WinDLL("ntdll")
    TH32CS_SNAPPROCESS = 0x00000002
    PROCESS_SUSPEND_RESUME = 0x0800
    INVALID_HANDLE_VALUE = ctypes.c_void_p(-1).value

    class PROCESSENTRY32W(ctypes.Structure):
        _fields_ = [("dwSize", wintypes.DWORD), ("cntUsage", wintypes.DWORD), ("th32ProcessID", wintypes.DWORD),
                    ("th32DefaultHeapID", ctypes.c_size_t), ("th32ModuleID", wintypes.DWORD),
                    ("cntThreads", wintypes.DWORD), ("th32ParentProcessID", wintypes.DWORD),
                    ("pcPriClassBase", ctypes.c_long), ("dwFlags", wintypes.DWORD),
                    ("szExeFile", ctypes.c_wchar * 260)]

    _k32.CreateToolhelp32Snapshot.restype = wintypes.HANDLE
    _k32.CreateToolhelp32Snapshot.argtypes = [wintypes.DWORD, wintypes.DWORD]
    _k32.Process32FirstW.argtypes = [wintypes.HANDLE, ctypes.POINTER(PROCESSENTRY32W)]
    _k32.Process32NextW.argtypes = [wintypes.HANDLE, ctypes.POINTER(PROCESSENTRY32W)]
    _k32.OpenProcess.restype = wintypes.HANDLE
    _k32.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    _k32.CloseHandle.argtypes = [wintypes.HANDLE]
    _ntdll.NtSuspendProcess.argtypes = [wintypes.HANDLE]
    _ntdll.NtResumeProcess.argtypes = [wintypes.HANDLE]


def _parents():
    """{pid: parent pid} of every process on the machine."""
    out = {}
    if sys.platform == "win32":
        snap = _k32.CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0)
        if not snap or snap == INVALID_HANDLE_VALUE:
            return out
        try:
            entry = PROCESSENTRY32W()
            entry.dwSize = ctypes.sizeof(PROCESSENTRY32W)
            ok = _k32.Process32FirstW(snap, ctypes.byref(entry))
            while ok:
                out[entry.th32ProcessID] = entry.th32ParentProcessID
                ok = _k32.Process32NextW(snap, ctypes.byref(entry))
        finally:
            _k32.CloseHandle(snap)
        return out
    try:
        for name in os.listdir("/proc"):
            if name.isdigit():
                with open(f"/proc/{name}/stat", "rb") as fh:
                    stat = fh.read().rsplit(b")", 1)[1].split()
                out[int(name)] = int(stat[1])
    except OSError:
        pass
    return out


def tree(pid):
    """*pid* followed by all of its descendants (parents before children)."""
    parents = _parents()
    children = {}
    for child, parent in parents.items():
        if child != parent:
            children.setdefault(parent, []).append(child)
    order, todo, seen = [], [pid], set()
    while todo:
        p = todo.pop(0)
        if p in seen:
            continue
        seen.add(p)
        order.append(p)
        todo.extend(children.get(p, []))
    return order


def _nt(pid, suspend):
    handle = _k32.OpenProcess(PROCESS_SUSPEND_RESUME, False, pid)
    if not handle:
        return False
    try:
        status = (_ntdll.NtSuspendProcess if suspend else _ntdll.NtResumeProcess)(handle)
        return status == 0
    finally:
        _k32.CloseHandle(handle)


def suspend(pid):
    """Freeze *pid* and its descendants; True if the root process was suspended."""
    pids = tree(pid)
    ok = False
    for p in pids:                      # parents first: a frozen parent cannot start new children
        if sys.platform == "win32":
            done = _nt(p, True)
        else:
            try:
                os.kill(p, signal.SIGSTOP)
                done = True
            except OSError:
                done = False
        ok = ok or (done and p == pid)
    return ok


def resume(pid):
    """Continue *pid* and its descendants; True if the root process was resumed."""
    pids = tree(pid)
    ok = False
    for p in reversed(pids):
        if sys.platform == "win32":
            done = _nt(p, False)
        else:
            try:
                os.kill(p, signal.SIGCONT)
                done = True
            except OSError:
                done = False
        ok = ok or (done and p == pid)
    return ok


def kill(proc):
    """Kill a :class:`subprocess.Popen` child and its descendants (suspended or not)."""
    if proc.poll() is not None:
        return
    try:
        if sys.platform == "win32":
            subprocess.run(["taskkill", "/T", "/F", "/PID", str(proc.pid)], capture_output=True,
                           creationflags=subprocess.CREATE_NO_WINDOW)
        else:
            for p in reversed(tree(proc.pid)):
                try:
                    os.kill(p, signal.SIGKILL)
                except OSError:
                    pass
    except OSError:
        proc.kill()
