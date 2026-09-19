"""ctypes wrapper of the simulation engine (``AVAS.dll`` on Windows, ``libAVAS.so`` on Linux)."""
import ctypes
import os
import platform
import sys
from ctypes import POINTER, c_char_p, c_int, c_wchar_p

from avas.paths import ENGINE_DIR

_WINDOWS = platform.system() == "Windows"


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
    if not _WINDOWS or sys.stdout is None or sys.stdout.isatty():
        return
    try:
        ucrt = ctypes.CDLL("ucrtbase")
        ucrt.__acrt_iob_func.restype = ctypes.c_void_p
        ucrt.setvbuf.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_int, ctypes.c_size_t]
        _IONBF = 4
        ucrt.setvbuf(ucrt.__acrt_iob_func(1), None, _IONBF, 0)
    except (OSError, AttributeError):
        pass


class MultiParticleEngine:
    """Loads the engine once; ``get_path`` sets the folders, ``main_agent`` runs (1) or stops (2) it.

    The loaded library is ``self.library`` on every platform.  The engine's
    ``path`` takes three wide strings on Windows and three UTF-8 byte strings
    on Linux; ``main_agent`` takes a pointer to an int and returns its status.
    """

    def __init__(self):
        _unbuffer_c_stdout()
        self.dll_dir = ENGINE_DIR
        self.dll_path = os.path.join(ENGINE_DIR, "AVAS.dll" if _WINDOWS else "libAVAS.so")
        self.so_path = self.dll_path                     # old name, kept for callers that print it
        try:
            if _WINDOWS and hasattr(os, "add_dll_directory"):
                # make libfftw3*.dll / MSVCP140.dll next to AVAS.dll resolvable
                os.add_dll_directory(ENGINE_DIR)
            self.library = ctypes.CDLL(self.dll_path)
        except OSError as e:
            raise ValueError(f"Failed to load the simulation engine '{self.dll_path}'. Reason: {e}") from e
        text = c_wchar_p if _WINDOWS else c_char_p
        self.library.path.argtypes = [text, text, text]
        self.library.path.restype = c_int
        self.library.main_agent.argtypes = [POINTER(c_int)]
        self.library.main_agent.restype = c_int

    def get_path(self, inputfilepath, outputfilePath, fieldfilePath):
        """Tell the engine where to read the inputs / field maps and where to write; returns its status."""
        args = (str(inputfilepath), str(outputfilePath), str(fieldfilePath))
        if not _WINDOWS:
            args = tuple(a.encode("utf-8") for a in args)
        res = self.library.path(*args)
        if res not in (0, None):
            raise RuntimeError(f"the engine rejected the folders (path() returned {res}): "
                               f"input={inputfilepath}, output={outputfilePath}, field={fieldfilePath}")
        return res

    def main_agent(self, value):
        """``value`` 1 = run, 2 = stop.  Returns the engine status (0 ok; 1 / 2 = error, see ErrorLog.txt)."""
        return self.library.main_agent(ctypes.byref(c_int(int(value))))
