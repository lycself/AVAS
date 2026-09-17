"""Development server: the GUI in an ordinary browser, without pywebview.

    python -m avas.gui.devserver [--port 8765]

then open http://127.0.0.1:8765/index.html?devrpc.  Calls go over HTTP
(``POST /rpc``) and events over an event stream (``GET /events``).  Native
dialogs and window functions are unavailable.  Binds to 127.0.0.1 only.
"""
import argparse
import os
import time

from avas.gui import app as gui_app
from avas.gui import logbridge, server


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--settings", help="settings file (default: a separate dev file)")
    ap.add_argument("--fake-engine", type=float, metavar="SECONDS",
                    help="runs replay the DataSet.txt already in the output folder over SECONDS (avas.gui.fake_engine)")
    ap.add_argument("--fake-lose", type=float, default=0.0, help="with --fake-engine: fraction of macro-particles lost")
    args = ap.parse_args()
    if args.fake_engine:
        import sys
        from avas.gui.services import runner

        def fake_command(input_dir, output_dir, mode):
            return [sys.executable, "-u", "-m", "avas.gui.fake_engine", "--input", input_dir, "--output", output_dir,
                    "--mode", mode or "basic", "--duration", str(args.fake_engine), "--lose", str(args.fake_lose)]
        runner.simulation_command = fake_command
    os.environ.setdefault("AVAS_GUI_SETTINGS", args.settings or os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".dev-gui.json"))
    logbridge.install()
    from avas import i18n
    i18n.set_language(gui_app.app_settings().get("ui/language"))
    from avas.gui import services  # noqa: F401
    srv, base = server.start(port=args.port, dev_rpc=True)
    gui_app.state()["base_url"] = base
    print(f"AVAS dev server: {base}/index.html?devrpc", flush=True)
    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        srv.shutdown()


if __name__ == "__main__":
    main()
