"""Independent updater status UI; no imports from the installation being replaced."""
import os
from pathlib import Path
import queue
import threading
import time
if __package__:
    from .update_view import normalize_presentation, run_windows, run_tk
else:
    from update_view import normalize_presentation, run_windows, run_tk


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
    def __init__(self, language="en", attention=None, enabled=True, presentation=None, versions=None, icon_path=None):
        self.zh = language == "zh_CN"
        self.attention = Path(attention) if attention else None
        self.enabled = enabled
        self.messages = queue.Queue()
        self.ready = threading.Event()
        self.stopped = threading.Event()
        self.error = None
        self.thread = None
        self.presentation = normalize_presentation(presentation)
        self.icon_path = str(icon_path) if icon_path else None
        self.versions = {key: str((versions or {}).get(key, "—"))[:80] for key in ("current", "target")}
        self.stage, self.value = "waiting", None

    def drain(self):
        changed = False
        while True:
            try:
                self.stage, value = self.messages.get_nowait()
                self.value = max(0, min(1, value)) if value is not None and self.stage in ("backup", "installing") else None
                changed = True
            except queue.Empty:
                return changed

    def model(self):
        return {"zh": self.zh, "stage": self.stage, "value": self.value,
                "message": TEXT[self.stage][int(self.zh)], "versions": self.versions,
                "colours": self.presentation["colours"], "step": self.step(self.stage),
                "phase": time.monotonic() % 1.2 / 1.2 if self.animating() else 0.5}

    def animating(self):
        return self.value is None and self.stage != "failed" and self.presentation["motion"] != "off"

    @staticmethod
    def step(stage):
        return 2 if stage in ("waiting", "checking") else 4 if stage == "restarting" else 3

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
        names = ("下载", "校验", "准备", "安装", "重启") if self.zh else ("Download", "Verify", "Prepare", "Install", "Restart")
        index = self.step(stage)
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
        run_windows(self)

    def _tk(self):
        run_tk(self)
