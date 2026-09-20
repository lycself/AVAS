"""Command-line interface.

::

    avas run  --input DIR --output DIR [--field DIR] [--mode ...] [--device cpu|gpu]
    avas plot TYPE --output DIR [--input DIR] [--save FILE] [--no-show]
    avas plot phase --dst FILE [--plane x-x1 --plane phi-w] [--save FILE]
    avas scan --input DIR --target Q1 --param G --values 10,12,14
    avas gui [--lang en|zh_CN]
    avas serve [--port 8765] [--host 127.0.0.1] [--open]
    avas info

``avas --input DIR --output DIR`` (without the word ``run``) is accepted too, so
``python run_avas.py --input ... --output ...`` starts a simulation directly.
"""
import argparse
import json
import os
import sys
import time

from avas import __version__

from avas.post.plot.dataset_plots import DATASET_PLOTS, DST_PLOTS, LATTICE_PLOTS   # plot type registry (no matplotlib)

RUN_INFO_FILE = "avas_run.json"

PLOT_TYPES = list(DATASET_PLOTS) + list(LATTICE_PLOTS) + list(DST_PLOTS)

DEFAULT_PLANES = ["x-x1", "y-y1", "phi-w"]
SIM_MODES = ["auto", "basic", "stat", "dyn", "stat_dyn"]


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
class CliError(Exception):
    pass


def _abs(path):
    return os.path.abspath(os.path.expanduser(path)) if path else path


def resolve_input_dir(path):
    """Accept either the input directory itself or a project directory
    containing ``InputFile/``."""
    path = _abs(path)
    if not os.path.isdir(path):
        raise CliError(f"input directory does not exist: {path}")
    if os.path.isfile(os.path.join(path, "input.txt")):
        return path
    nested = os.path.join(path, "InputFile")
    if os.path.isfile(os.path.join(nested, "input.txt")):
        return nested
    raise CliError(f"no input.txt found in {path} (or {nested})")


def check_input_files(input_dir):
    from avas.paths import lattice_source_path
    missing = [f for f in ("input.txt", "beam.txt") if not os.path.isfile(os.path.join(input_dir, f))]
    lattice = lattice_source_path(input_dir)
    if not os.path.isfile(lattice):
        missing.append(os.path.basename(lattice))
    if missing:
        raise CliError(f"missing input files in {input_dir}: {', '.join(missing)}")


def read_ini(input_dir):
    """Settings the GUI stores in ``ini.ini`` (error type, seed, device...)."""
    ini_path = os.path.join(input_dir, "ini.ini")
    if not os.path.isfile(ini_path):
        return {}
    from avas.utils.iniconfig import IniConfig
    res = IniConfig().create_from_file({"otherPath": ini_path})
    if not res or res.get("code", 0) != 0:
        return {}
    return res["data"]["iniParams"]


def write_run_info(output_dir, info):
    with open(os.path.join(output_dir, RUN_INFO_FILE), "w", encoding="utf-8") as fh:
        json.dump(info, fh, indent=2, ensure_ascii=False)


def read_run_info(output_dir):
    path = os.path.join(output_dir, RUN_INFO_FILE)
    if not os.path.isfile(path):
        return {}
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def guess_input_dir(output_dir, explicit=None):
    """Find the input directory that belongs to *output_dir*."""
    if explicit:
        return resolve_input_dir(explicit)
    info = read_run_info(output_dir)
    cand = info.get("input_dir")
    if cand and os.path.isdir(cand):
        return cand
    sibling = os.path.join(os.path.dirname(output_dir), "InputFile")
    if os.path.isfile(os.path.join(sibling, "input.txt")):
        return sibling
    raise CliError("cannot locate the input directory for this output; pass --input DIR")


# ---------------------------------------------------------------------------
# run
# ---------------------------------------------------------------------------
def cmd_run(args):
    import matplotlib
    matplotlib.use("Agg")  # simulations never need a window

    input_dir = resolve_input_dir(args.input)
    from avas.paths import LATTICE_ENV_VAR
    previous_override = os.environ.get(LATTICE_ENV_VAR)
    if args.lattice:
        os.environ[LATTICE_ENV_VAR] = args.lattice      # read by every module via avas.paths
    try:
        return _run(args, input_dir)
    finally:                                            # do not leak the override into later in-process calls
        if args.lattice:
            if previous_override is None:
                os.environ.pop(LATTICE_ENV_VAR, None)
            else:
                os.environ[LATTICE_ENV_VAR] = previous_override


def _run(args, input_dir):
    from avas.paths import lattice_source_name
    check_input_files(input_dir)
    output_dir = _abs(args.output)
    os.makedirs(output_dir, exist_ok=True)

    ini = read_ini(input_dir)
    mode = args.mode
    if mode == "auto":
        mode = ini.get("error", {}).get("error_type") or "basic"
        if mode not in SIM_MODES:
            mode = "basic"
    device = args.device or ini.get("input", {}).get("device") or "cpu"
    seed = args.seed if args.seed is not None else int(ini.get("error", {}).get("seed", 50) or 50)
    if_normal = 0 if args.no_normal else int(ini.get("error", {}).get("if_normal", 1))
    field_dir = _abs(args.field) if args.field else (ini.get("project", {}).get("fieldSource") or None)

    item = {
        "project_path": os.path.dirname(input_dir),
        "input_file": input_dir,
        "output_file": output_dir,
        "field_path": field_dir,
        "device": device,
        "seed": seed,
        "if_normal": if_normal,
    }

    info = {
        "avas_version": __version__,
        "input_dir": input_dir,
        "output_dir": output_dir,
        # every mode simulates a staged copy of the text inputs (+ the generated lattice.txt), see api.basic
        "inputs_dir": os.path.join(output_dir, "inputs"),
        "field_dir": field_dir,
        "mode": mode,
        "device": device,
        "seed": seed,
        "lattice": lattice_source_name(input_dir),
        "lattice_sha1": _lattice_fingerprint(input_dir),
        "started": time.strftime("%Y-%m-%d %H:%M:%S"),
        "status": "running",
    }
    write_run_info(output_dir, info)

    print(f"[avas] mode={mode} device={device}")
    print(f"[avas] input : {input_dir}")
    print(f"[avas] lattice: {lattice_source_name(input_dir)}")
    print(f"[avas] output: {output_dir}")

    from avas.api import basic as api
    t0 = time.time()
    try:
        if mode == "basic":
            api.basic_mulp(**item)
        elif mode == "stat":
            api.err_stat(**item)
        elif mode == "dyn":
            api.err_dyn(**item)
        elif mode == "stat_dyn":
            api.err_stat_dyn(**item)
    except Exception as exc:
        info.update(status="failed", error=str(exc), finished=time.strftime("%Y-%m-%d %H:%M:%S"))
        write_run_info(output_dir, info)
        raise
    info.update(status="finished", finished=time.strftime("%Y-%m-%d %H:%M:%S"),
                elapsed_s=round(time.time() - t0, 2))
    diagnostics = _diagnostics(output_dir) if mode == "basic" else None
    if diagnostics:
        info["diagnostics"] = diagnostics
    write_run_info(output_dir, info)
    if os.environ.get("AVAS_GUI_CHILD") != "1":          # the GUI logs them itself, translated
        for m in (diagnostics or {}).get("messages", []):
            print(f"[avas] {m['level']}: {m['text'][0]}")
    print(f"[avas] done in {info['elapsed_s']} s -> {output_dir}")
    return 0


def _lattice_fingerprint(input_dir):
    """Fingerprint of the lattice text this run uses (the GUI tells whether it was edited since)."""
    from avas.gui.textio import read_text, text_fingerprint
    from avas.paths import lattice_source_path
    try:
        return text_fingerprint(read_text(lattice_source_path(input_dir)))
    except OSError:
        return None


def _diagnostics(output_dir):
    """DataSet.txt health check (NaN columns, lost beam); never fails the run."""
    try:
        from avas.post.analysis.run_diagnostics import dataset_diagnostics
        return dataset_diagnostics(output_dir)
    except Exception:  # noqa: BLE001
        return None


# ---------------------------------------------------------------------------
# plot
# ---------------------------------------------------------------------------
def _parse_planes(planes):
    out = []
    for p in planes or DEFAULT_PLANES:
        parts = p.replace(",", "-").split("-")
        if len(parts) != 2:
            raise CliError(f"bad --plane '{p}', expected e.g. x-x1, y-y1, phi-w, z-z1")
        out.append(parts)
    return out


def _parse_ratio(pairs):
    ratio = {}
    for p in pairs or []:
        if "=" not in p:
            raise CliError(f"bad --ratio '{p}', expected NAME=VALUE")
        k, v = p.split("=", 1)
        ratio[k] = float(v)
    return ratio


def cmd_plot(args):
    import matplotlib
    show = not args.no_show and not args.save
    if not show:
        matplotlib.use("Agg")
    from avas.api import plotting as api

    save = _abs(args.save) if args.save else None
    kind = args.type

    if kind in DST_PLOTS:
        if not args.dst:
            raise CliError("plot phase needs --dst FILE (a .dst particle file)")
        dst = _abs(args.dst)
        if not os.path.isfile(dst):
            raise CliError(f"dst file not found: {dst}")
        fig = api.plot_dst({
            "dst_path": dst,
            "picture_type": _parse_planes(args.plane),
            "show_": 1 if show else 0,
            "platform": "qt",
        })
        if save and fig is not None:
            fig.savefig(save, dpi=args.dpi)
            print(f"[avas] saved {save}")
        return 0

    if not args.output:
        raise CliError(f"plot {kind} needs --output DIR (the simulation output directory)")
    output_dir = _abs(args.output)
    if not os.path.isdir(output_dir):
        raise CliError(f"output directory does not exist: {output_dir}")
    input_dir = guess_input_dir(output_dir, args.input)

    if kind in DATASET_PLOTS:
        if not os.path.isfile(os.path.join(output_dir, "DataSet.txt")):
            raise CliError(f"DataSet.txt not found in {output_dir}")
        fig = api.plot_dataset(pictureType=kind, inputDir=input_dir, outputDir=output_dir,
                               show_=1 if show else 0, sampleInterval=args.interval, savePath=None)
    elif kind == "cavity_voltage":
        ratio = _parse_ratio(args.ratio)
        if not ratio:
            raise CliError("plot cavity_voltage needs --ratio FIELD=VALUE (e.g. --ratio efield=1.0)")
        fig = api.plot_cavity_voltage(None, ratio, show_=1 if show else 0, input_dir=input_dir)
    elif kind == "syn_phase":
        fig = api.plot_cavity_syn_phase(inputDir=input_dir, show_=1 if show else 0)
    elif kind == "phase_advance":
        fig = api.plot_phase_advance(pictureType=args.unit, inputDir=input_dir, outputDir=output_dir,
                                     show_=1 if show else 0)
    else:  # pragma: no cover - argparse restricts choices
        raise CliError(f"unknown plot type {kind}")

    if save:
        if fig is None:
            raise CliError("nothing to save (plot returned no figure)")
        fig.savefig(save, dpi=args.dpi, bbox_inches="tight")
        print(f"[avas] saved {save}")
    return 0


# ---------------------------------------------------------------------------
# gui / info
# ---------------------------------------------------------------------------
def cmd_gui(args):
    from avas.gui.app import main as gui_main
    return gui_main(argv=[], language=args.lang)


def cmd_serve(args):
    from avas.gui.serve import main as serve_main
    return serve_main(args=args)


def cmd_info(args):
    from avas.buildinfo import build_info
    from avas.paths import ENGINE_DIR, LOG_DIR, STATIC_DIR
    b = build_info()
    stamp = ", ".join(x for x in (f"built {b['built']}" if b.get("built") else "",
                                  f"commit {b['commit']}{'+' if b.get('dirty') else ''}" if b.get("commit") else "",
                                  "stand-alone" if b.get("frozen") else "source") if x)
    print(f"AVAS {__version__} ({stamp})")
    print(f"python : {sys.version.split()[0]} ({sys.executable})")
    print(f"engine : {ENGINE_DIR}")
    print(f"static : {STATIC_DIR}")
    print(f"logs   : {LOG_DIR}")
    return 0


# ---------------------------------------------------------------------------
# parser
# ---------------------------------------------------------------------------
def build_parser():
    parser = argparse.ArgumentParser(
        prog="avas",
        description="AVAS - Advanced Virtual Accelerator Software",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "examples:\n"
            '  avas run --input "D:\\proj\\InputFile" --output "D:\\proj\\Results_001"\n'
            '  avas plot emittance_x --output "D:\\proj\\Results_001" --save emit_x.png\n'
            '  avas plot phase --dst "D:\\proj\\Results_001\\outData_0.210000.dst"\n'
            "  avas gui --lang zh_CN\n"
        ),
    )
    parser.add_argument("-V", "--version", action="version", version=f"avas {__version__}")
    sub = parser.add_subparsers(dest="command", metavar="COMMAND")

    # run ------------------------------------------------------------------
    p_run = sub.add_parser("run", help="run a simulation", description="Run a multi-particle simulation.")
    p_run.add_argument("-i", "--input", required=True, metavar="DIR",
                       help="input directory (contains input.txt, beam.txt and the lattice) "
                            "or a project directory containing InputFile/")
    p_run.add_argument("-o", "--output", required=True, metavar="DIR",
                       help="output directory (created if missing)")
    p_run.add_argument("-f", "--field", metavar="DIR", help="field-map directory (default: input dir)")
    p_run.add_argument("-l", "--lattice", metavar="FILE",
                       help="lattice file inside the input dir (default: [lattice] source in ini.ini, "
                            "else lattice_mulp.txt)")
    p_run.add_argument("-m", "--mode", choices=SIM_MODES, default="auto",
                       help="basic | stat | dyn | stat_dyn error study; auto = read ini.ini, else basic")
    p_run.add_argument("-d", "--device", choices=["cpu", "gpu"], help="compute device (default: ini.ini or cpu)")
    p_run.add_argument("--seed", type=int, help="random seed for error studies")
    p_run.add_argument("--no-normal", action="store_true", help="error study: skip the error-free reference run")
    p_run.set_defaults(func=cmd_run)

    # plot -----------------------------------------------------------------
    p_plot = sub.add_parser("plot", help="plot simulation results",
                            description="Plot simulation results.\n\nTYPE is one of:\n"
                                        f"  DataSet based : {', '.join(DATASET_PLOTS)}\n"
                                        f"  lattice based : {', '.join(LATTICE_PLOTS)}\n"
                                        "  particle file : phase (needs --dst)",
                            formatter_class=argparse.RawDescriptionHelpFormatter)
    p_plot.add_argument("type", choices=PLOT_TYPES, metavar="TYPE")
    p_plot.add_argument("-o", "--output", metavar="DIR", help="simulation output directory")
    p_plot.add_argument("-i", "--input", metavar="DIR",
                        help="input directory (default: recorded in avas_run.json, or ../InputFile)")
    p_plot.add_argument("--dst", metavar="FILE", help="particle .dst file for TYPE=phase")
    p_plot.add_argument("--plane", action="append", metavar="A-B",
                        help="phase-space plane for TYPE=phase, repeatable "
                             f"(default: {' '.join(DEFAULT_PLANES)})")
    p_plot.add_argument("--ratio", action="append", metavar="FIELD=VALUE",
                        help="cavity_voltage: actual/ke ratio per field name, repeatable")
    p_plot.add_argument("--unit", choices=["period", "meter"], default="period",
                        help="phase_advance unit (default: period)")
    p_plot.add_argument("--interval", type=int, default=1, help="sample interval for DataSet plots")
    p_plot.add_argument("-s", "--save", metavar="FILE", help="save the figure instead of showing it")
    p_plot.add_argument("--dpi", type=int, default=200, help="dpi used with --save (default 200)")
    p_plot.add_argument("--no-show", action="store_true", help="do not open a window")
    p_plot.set_defaults(func=cmd_plot)

    # gui / info ------------------------------------------------------------
    p_gui = sub.add_parser("gui", help="start the graphical interface")
    p_gui.add_argument("--lang", choices=["en", "zh_CN"], help="UI language (default: last used)")
    p_gui.set_defaults(func=cmd_gui)

    from avas.gui.serve import add_arguments as serve_arguments
    p_serve = sub.add_parser("serve", help="serve the interface to a web browser",
                             description="Serve the AVAS interface to a web browser and print its URL (with the access token).")
    serve_arguments(p_serve)
    p_serve.set_defaults(func=cmd_serve)

    p_info = sub.add_parser("info", help="show version and install locations")
    p_info.set_defaults(func=cmd_info)

    from avas.cli.scan_cmd import add_parser as add_scan_parser
    add_scan_parser(sub)

    p_doctor = sub.add_parser("doctor", help="check this installation (engine, WebView2, GUI, assistant, preview)")
    p_doctor.set_defaults(func=cmd_doctor)
    return parser


def cmd_doctor(args):
    """Quick self-test of an installation; exit code 1 when something essential fails."""
    import tempfile
    import traceback

    failures = 0

    def check(name, fn, essential=True):
        nonlocal failures
        try:
            detail = fn()
            print(f"  ok    {name}{': ' + str(detail) if detail else ''}")
        except Exception as exc:  # noqa: BLE001 - reported
            if essential:
                failures += 1
            print(f"  {'FAIL' if essential else 'warn'}  {name}: {exc}")
            if os.environ.get("AVAS_DEBUG"):
                traceback.print_exc()

    def engine():
        from avas.core.MultiParticleEngine import MultiParticleEngine
        return MultiParticleEngine().dll_path

    def webview():
        if sys.platform != "win32":
            return "not Windows"
        from avas.gui.webview2 import installed_version
        v = installed_version()
        if not v:
            raise RuntimeError("Microsoft Edge WebView2 runtime is not installed")
        return v

    def gui_services():
        from avas.gui import bridge, services  # noqa: F401
        return f"{len(bridge.handlers())} RPC handlers"

    def assistant():
        from avas.ai import PRESETS
        from avas.ai.avas_tools import build_tools
        from avas.ai.manual import search
        tools = build_tools(object())
        hits = search("superpose")
        if not hits.get("sections"):
            raise RuntimeError("the user manual text is missing")
        return f"{len(tools)} tools, {len(PRESETS)} provider presets, manual ok"

    def preview():
        from avas.sim.linear_optics import linear_preview
        beam = {"mass": 938.272, "charge": 1, "energy": 3.0, "current": 0.0, "frequency": 162.5e6,
                "twiss": {"x": (0.0, 0.5, 0.2), "y": (0.0, 0.5, 0.2), "z": (0.0, 0.5, 0.3)}}
        text = "start\ndrift 0.2 0.02 0\nquad 0.1 0.02 0 10\ndrift 0.2 0.02 0\nquad 0.1 0.02 0 -10\ndrift 0.2 0.02 0\nend\n"
        res = linear_preview(text, beam, [tempfile.gettempdir()], space_charge=False)
        return f"rms_x {res['rms_x'][0]:.3f} -> {res['rms_x'][-1]:.3f} mm in {res['model']['elapsed_ms']:.0f} ms"

    def user_data():
        from avas.paths import USER_DATA_DIR
        os.makedirs(USER_DATA_DIR, exist_ok=True)
        probe = os.path.join(USER_DATA_DIR, ".doctor")
        with open(probe, "w", encoding="utf-8") as fh:
            fh.write("ok")
        os.remove(probe)
        return USER_DATA_DIR

    def secrets():
        from avas.ai import backend_name
        return backend_name()

    from avas.buildinfo import build_info
    b = build_info()
    print(f"AVAS {__version__} ({'stand-alone' if b.get('frozen') else 'source'}"
          f"{', built ' + b['built'] if b.get('built') else ''}{', commit ' + b['commit'] if b.get('commit') else ''})")
    check("simulation engine", engine)
    check("WebView2 runtime", webview)
    check("GUI services", gui_services)
    check("AI assistant", assistant)
    check("linear envelope preview", preview)
    check("user data folder", user_data)
    check("API key store", secrets, essential=False)
    print("all checks passed" if not failures else f"{failures} check(s) failed")
    return 1 if failures else 0


def _normalize_argv(argv):
    """``avas --input X --output Y``  ->  ``avas run --input X --output Y``."""
    argv = list(argv)
    known = {"run", "plot", "gui", "serve", "info", "doctor", "-h", "--help", "-V", "--version"}
    if argv and argv[0] not in known and argv[0].startswith("-"):
        argv.insert(0, "run")
    return argv


def main(argv=None):
    from avas.installation_lock import acquire
    acquire()
    argv = sys.argv[1:] if argv is None else list(argv)
    parser = build_parser()
    args = parser.parse_args(_normalize_argv(argv))
    if not getattr(args, "func", None):
        parser.print_help()
        return 1
    try:
        return args.func(args) or 0
    except CliError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
