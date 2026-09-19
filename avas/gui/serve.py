"""Browser mode: ``avas serve`` runs the GUI back end and prints the page URL.

    avas serve [--port 8765] [--host 127.0.0.1] [--open]

Open the printed URL (it carries the access token) in any modern browser.
Native dialogs are replaced by the page's own file chooser; "open" on a
result file downloads it.  ``--host 0.0.0.0`` exposes the server to the
network: the token is the only protection, there is no user management
yet, so do that only on a trusted network.

Development options: ``--settings`` keeps preferences in a separate file,
``--token`` fixes the token (or ``--no-token`` disables it), ``--fake-engine``
replays an existing DataSet.txt instead of running the engine
(:mod:`avas.gui.fake_engine`).
"""
import argparse
import os
import time


def add_arguments(ap):
    """The ``avas serve`` options (shared with the CLI's sub-parser)."""
    ap.add_argument("--port", type=int, default=8765, help="TCP port (default 8765, 0 = any free port)")
    ap.add_argument("--host", default="127.0.0.1", help="bind address (default 127.0.0.1, this machine only)")
    ap.add_argument("--open", action="store_true", help="open the page in the default browser")
    ap.add_argument("--settings", metavar="FILE", help="GUI preferences file (default: the user's gui.json)")
    ap.add_argument("--token", metavar="TOKEN", help="fixed access token instead of a random one (development)")
    ap.add_argument("--no-token", action="store_true", help="no access token at all (development, local only)")
    ap.add_argument("--fake-engine", type=float, metavar="SECONDS",
                    help="runs replay the DataSet.txt already in the output folder over SECONDS (avas.gui.fake_engine)")
    ap.add_argument("--fake-lose", type=float, default=0.0, help="with --fake-engine: fraction of macro-particles lost")
    return ap


def build_parser(prog="avas serve"):
    return add_arguments(argparse.ArgumentParser(prog=prog, description="Serve the AVAS interface to a web browser."))


def main(argv=None, args=None, parser=None):
    if args is None:
        args = (parser or build_parser()).parse_args(argv)
    if args.settings:
        os.environ["AVAS_GUI_SETTINGS"] = os.path.abspath(args.settings)
    if args.fake_engine:
        import sys
        from avas.gui.services import runner

        def fake_command(input_dir, output_dir, mode):
            return [sys.executable, "-u", "-m", "avas.gui.fake_engine", "--input", input_dir, "--output", output_dir,
                    "--mode", mode or "basic", "--duration", str(args.fake_engine), "--lose", str(args.fake_lose)]
        runner.simulation_command = fake_command

    from avas.gui import app as gui_app
    from avas.gui import logbridge, server
    logbridge.install()
    from avas import i18n
    i18n.set_language(gui_app.app_settings().get("ui/language"))
    from avas.gui import services  # noqa: F401 - registers RPC handlers

    token = None if args.no_token else (args.token or "")
    srv = server.start(host=args.host, port=args.port, token=token)
    gui_app.state()["server"], gui_app.state()["base_url"] = srv, srv.base_url
    url = srv.page_url("browser")
    print(f"AVAS interface: {url}", flush=True)
    if args.host not in ("127.0.0.1", "localhost"):
        print("WARNING: reachable from the network; the access token in the URL is the only protection.", flush=True)
    if args.open:
        import webbrowser
        webbrowser.open(url)
    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        pass
    finally:
        services.runner.shutdown()
        services.assistant.shutdown()
        srv.shutdown()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
