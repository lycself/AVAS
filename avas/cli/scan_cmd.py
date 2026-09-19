"""``avas scan``: run one parameter over a list of values from the command line.

::

    avas scan --input DIR --target Q1 --param G --values 10,12,14
    avas scan --input DIR --target 12 --param phase --values -40:-20:5          # line 12, start:stop:count
    avas scan --input DIR --keyword beam.particlenumber --values 1000,5000
    avas scan --input DIR --keyword input.stepsize --values 0.001,0.002 --metrics transmission,energy_out

Results go to ``<project>/Scans/<label>_<time>/`` (``scan.json``, ``scan.csv``,
one ``run_NNN/`` folder per value) or to ``--output DIR``.  The project's
input files are never changed.
"""
import os
import sys


def add_parser(sub):
    p = sub.add_parser("scan", help="run one parameter over several values",
                       description="Run the simulation once per value of one parameter and tabulate the results.")
    p.add_argument("--input", required=True, help="input directory (or project directory containing InputFile/)")
    p.add_argument("--output", help="folder for the scan (default: <project>/Scans/<label>_<time>)")
    p.add_argument("--target", help="lattice element: name, element index, or line number (1-based)")
    p.add_argument("--param", help="parameter of the element: G, B, phase, Ke, L ... or p4 (4th parameter)")
    p.add_argument("--keyword", help="beam.KEY or input.KEY[:position] instead of a lattice element")
    p.add_argument("--values", required=True, help="comma-separated values or start:stop:count")
    p.add_argument("--metrics", help="comma-separated metric names (default: transmission, energy_out, emittance growth, rms maxima)")
    p.add_argument("--label", default="", help="name of the scan folder")
    p.add_argument("--lattice", help="lattice file inside the input directory (default: [lattice] source of ini.ini)")
    p.set_defaults(func=cmd_scan)
    return p


class _Project:
    def __init__(self, input_dir):
        self.input_dir = input_dir
        self.path = os.path.dirname(input_dir)

    def field_dirs(self):
        field = os.path.join(self.input_dir, "field")
        return [d for d in (self.input_dir, field) if os.path.isdir(d)]

    def lattice_name(self):
        from avas.paths import lattice_source_name
        return lattice_source_name(self.input_dir)

    def last_run(self):
        return {}


def cmd_scan(args):
    from avas.cli.main import CliError, resolve_input_dir
    from avas.paths import LATTICE_ENV_VAR
    from avas.sim import scan

    input_dir = resolve_input_dir(args.input)
    if args.lattice:
        os.environ[LATTICE_ENV_VAR] = args.lattice
    if bool(args.keyword) == bool(args.target):
        raise CliError("give either --target ELEMENT --param NAME or --keyword beam.KEY / input.KEY")
    if args.target:
        if not args.param:
            raise CliError("--param is needed with --target")
        spec = {"kind": "lattice", "target": args.target, "param": args.param}
    else:
        file, _, rest = args.keyword.partition(".")
        key, _, pos = rest.partition(":")
        if file not in ("beam", "input") or not key:
            raise CliError("--keyword must be beam.KEY or input.KEY[:position]")
        spec = {"kind": file, "keyword": key, "position": int(pos or 1)}
    metrics = [m.strip() for m in args.metrics.split(",")] if args.metrics else None
    project = _Project(input_dir)
    try:
        values = scan.parse_values(args.values)
    except scan.ScanError as exc:
        raise CliError(str(exc)) from exc

    def progress(result):
        row = result["rows"][-1]
        cells = [f"{row['value']:g}"] + [_cell(row.get(m)) for m in result["metrics"]]
        if row.get("error"):
            cells.append(f"error: {row['error']}")
        print(f"[avas] {len(result['rows'])}/{len(result['values'])}  " + "  ".join(cells), flush=True)

    print(f"[avas] scan {spec} over {len(values)} values", flush=True)
    try:
        result = scan.run_scan(project, spec, values, metrics, args.label, root=os.path.abspath(args.output) if args.output else None,
                               on_progress=progress)
    except scan.ScanError as exc:
        raise CliError(str(exc)) from exc
    print(f"[avas] {result['status']} -> {result['folder']}")
    _print_table(result)
    return 0 if result["status"] == "finished" else 1


def _cell(v):
    if v is None:
        return "-"
    if isinstance(v, float):
        return f"{v:.6g}"
    return str(v)


def _print_table(result, out=sys.stdout):
    cols = ["value"] + list(result["metrics"])
    rows = [[_cell(r.get(c)) for c in cols] for r in result["rows"]]
    widths = [max(len(c), *(len(r[i]) for r in rows)) if rows else len(c) for i, c in enumerate(cols)]
    print("  ".join(c.rjust(w) for c, w in zip(cols, widths)), file=out)
    for r in rows:
        print("  ".join(c.rjust(w) for c, w in zip(r, widths)), file=out)
