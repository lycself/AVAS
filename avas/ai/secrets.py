"""API-key storage for the AI assistant.

Design
------
* Windows: the Credential Manager ("Windows Credentials" -> generic
  credentials) through ``advapi32`` via ``ctypes``; target name
  ``AVAS/ai/<name>``, persisted for the local machine user profile
  (``CRED_PERSIST_LOCAL_MACHINE``), secret stored as UTF-16-LE like the
  system's own tools.  The OS encrypts it with the user's logon credentials.
* Elsewhere: a JSON file ``ai_secrets.json`` in ``avas.paths.USER_DATA_DIR``
  created with 0600 permissions.  This is obfuscation-free plain text protected
  only by file permissions, the same level as most CLI tools' config files.
* :func:`get_secret` falls back to the ``AVAS_AI_API_KEY`` environment variable
  when nothing is stored (handy for CI and shared machines).
* Secrets are never logged.
"""
from __future__ import annotations

import json
import logging
import os
import sys

log = logging.getLogger("avas.gui")

TARGET_PREFIX = "AVAS/ai/"
ENV_FALLBACK = "AVAS_AI_API_KEY"
SECRETS_FILENAME = "ai_secrets.json"


class SecretStoreError(OSError):
    """The credential store could not be read or written."""


def _check_name(name):
    name = str(name or "").strip()
    if not name:
        raise ValueError("secret name must not be empty")
    return name


# =========================================================================== Windows Credential Manager
if sys.platform.startswith("win"):
    import ctypes
    from ctypes import wintypes

    _CRED_TYPE_GENERIC = 1
    _CRED_PERSIST_LOCAL_MACHINE = 2
    _ERROR_NOT_FOUND = 1168
    _CRED_MAX_BLOB = 5 * 512

    class _CREDENTIAL(ctypes.Structure):
        _fields_ = [
            ("Flags", wintypes.DWORD),
            ("Type", wintypes.DWORD),
            ("TargetName", wintypes.LPWSTR),
            ("Comment", wintypes.LPWSTR),
            ("LastWritten", wintypes.FILETIME),
            ("CredentialBlobSize", wintypes.DWORD),
            ("CredentialBlob", ctypes.POINTER(ctypes.c_ubyte)),
            ("Persist", wintypes.DWORD),
            ("AttributeCount", wintypes.DWORD),
            ("Attributes", ctypes.c_void_p),
            ("TargetAlias", wintypes.LPWSTR),
            ("UserName", wintypes.LPWSTR),
        ]

    _PCREDENTIAL = ctypes.POINTER(_CREDENTIAL)
    _advapi32 = ctypes.WinDLL("advapi32", use_last_error=True)
    _CredWriteW = _advapi32.CredWriteW
    _CredWriteW.argtypes = [_PCREDENTIAL, wintypes.DWORD]
    _CredWriteW.restype = wintypes.BOOL
    _CredReadW = _advapi32.CredReadW
    _CredReadW.argtypes = [wintypes.LPCWSTR, wintypes.DWORD, wintypes.DWORD, ctypes.POINTER(_PCREDENTIAL)]
    _CredReadW.restype = wintypes.BOOL
    _CredDeleteW = _advapi32.CredDeleteW
    _CredDeleteW.argtypes = [wintypes.LPCWSTR, wintypes.DWORD, wintypes.DWORD]
    _CredDeleteW.restype = wintypes.BOOL
    _CredFree = _advapi32.CredFree
    _CredFree.argtypes = [ctypes.c_void_p]
    _CredFree.restype = None

    def _win_error(action):
        code = ctypes.get_last_error()
        return SecretStoreError(code, f"Windows Credential Manager: {action} failed ({ctypes.FormatError(code)})")

    def _win_get(name):
        pcred = _PCREDENTIAL()
        if not _CredReadW(TARGET_PREFIX + name, _CRED_TYPE_GENERIC, 0, ctypes.byref(pcred)):
            if ctypes.get_last_error() == _ERROR_NOT_FOUND:
                return ""
            raise _win_error("read")
        try:
            cred = pcred.contents
            blob = ctypes.string_at(cred.CredentialBlob, cred.CredentialBlobSize) if cred.CredentialBlobSize else b""
        finally:
            _CredFree(pcred)
        if len(blob) % 2 == 0:
            try:
                return blob.decode("utf-16-le")
            except UnicodeDecodeError:
                pass
        return blob.decode("utf-8", "replace")

    def _win_set(name, value):
        blob = value.encode("utf-16-le")
        if len(blob) > _CRED_MAX_BLOB:
            raise ValueError(f"secret is too long for the Windows Credential Manager ({len(value)} characters)")
        buf = (ctypes.c_ubyte * max(len(blob), 1)).from_buffer_copy(blob or b"\0")
        cred = _CREDENTIAL()
        cred.Type = _CRED_TYPE_GENERIC
        cred.TargetName = TARGET_PREFIX + name
        cred.Comment = "AVAS AI assistant"
        cred.CredentialBlobSize = len(blob)
        cred.CredentialBlob = ctypes.cast(buf, ctypes.POINTER(ctypes.c_ubyte))
        cred.Persist = _CRED_PERSIST_LOCAL_MACHINE
        cred.UserName = "AVAS"
        if not _CredWriteW(ctypes.byref(cred), 0):
            raise _win_error("write")

    def _win_delete(name):
        if _CredDeleteW(TARGET_PREFIX + name, _CRED_TYPE_GENERIC, 0):
            return True
        if ctypes.get_last_error() == _ERROR_NOT_FOUND:
            return False
        raise _win_error("delete")


# =========================================================================== JSON file (non-Windows)
def secrets_file():
    from avas.paths import USER_DATA_DIR
    return os.path.join(USER_DATA_DIR, SECRETS_FILENAME)


def _file_load(path):
    try:
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        return data if isinstance(data, dict) else {}
    except FileNotFoundError:
        return {}
    except (OSError, ValueError) as exc:
        raise SecretStoreError(f"cannot read {path}: {exc}") from None


def _file_save(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=1)
        try:
            os.chmod(tmp, 0o600)
        except OSError:
            pass
        os.replace(tmp, path)
    except BaseException:
        try:
            os.remove(tmp)
        except OSError:
            pass
        raise


class _FileBackend:
    name = "file"

    def __init__(self, path=None):
        self.path = path

    def _path(self):
        return self.path or secrets_file()

    def get(self, name):
        value = _file_load(self._path()).get(name, "")
        return value if isinstance(value, str) else ""

    def set(self, name, value):
        data = _file_load(self._path())
        data[name] = value
        _file_save(self._path(), data)

    def delete(self, name):
        path = self._path()
        data = _file_load(path)
        if name not in data:
            return False
        del data[name]
        _file_save(path, data)
        return True


class _WindowsBackend:
    name = "windows-credential-manager"

    def get(self, name):
        return _win_get(name)

    def set(self, name, value):
        _win_set(name, value)

    def delete(self, name):
        return _win_delete(name)


_backend = _WindowsBackend() if sys.platform.startswith("win") else _FileBackend()


def backend_name() -> str:
    """``"windows-credential-manager"`` or ``"file"``."""
    return _backend.name


# =========================================================================== public API
def get_secret(name, env_fallback=True) -> str:
    """Stored secret *name*, else ``$AVAS_AI_API_KEY`` (if *env_fallback*), else ``""``."""
    name = _check_name(name)
    try:
        value = _backend.get(name)
    except SecretStoreError as exc:
        log.warning("Could not read AI secret '%s': %s", name, exc)
        value = ""
    if not value and env_fallback:
        value = os.environ.get(ENV_FALLBACK, "").strip()
    return value


def set_secret(name, value) -> None:
    """Store *value* under *name*; an empty value deletes the entry."""
    name = _check_name(name)
    value = "" if value is None else str(value)
    if not value:
        delete_secret(name)
        return
    _backend.set(name, value)


def delete_secret(name) -> bool:
    """Remove *name*; returns whether something was deleted."""
    return _backend.delete(_check_name(name))
