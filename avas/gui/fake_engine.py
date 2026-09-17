"""Development stand-in for ``avas run``: replays a DataSet.txt row by row (see devserver ``--fake-engine``).

    python -m avas.gui.fake_engine --input IN --output OUT --duration 40 [--lose 0.2]

It reads the DataSet.txt already in OUT (or makes a smooth synthetic one from the
lattice length), rewrites the file from scratch like the engine does, appends
the rows over *duration* seconds and prints the engine's progress lines.  With
``--lose`` a fraction of the macro-particles is lost along the way.  Only for
checking the live display; it computes nothing.
"""
import argparse
import json
import math
import os
import sys
import time


def _synthetic_rows(length, n=200):
    rows = []
    for i in range(n):
        z = length * i / (n - 1)
        v = [0.0] * 41
        v[0] = 1.5 + 2.0 * z / max(length, 1e-9)
        v[5] = z
        v[16] = (1.0 + 0.4 * math.sin(12 * z / max(length, 1e-9))) * 1e-3
        v[18] = (1.0 + 0.4 * math.cos(12 * z / max(length, 1e-9))) * 1e-3
        v[20] = 2e-3
        v[22], v[24] = 3 * v[16], 3 * v[18]
        v[28] = 5000
        rows.append(" ".join(f"{x:.8g}" for x in v))
    return rows


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--duration", type=float, default=40.0)
    ap.add_argument("--lose", type=float, default=0.0, help="fraction of macro-particles lost along the line")
    ap.add_argument("--mode", default="basic")
    ap.add_argument("--field")
    ap.add_argument("--lattice")
    args, _unknown = ap.parse_known_args(argv)
    os.makedirs(args.output, exist_ok=True)
    path = os.path.join(args.output, "DataSet.txt")
    rows = []
    if os.path.isfile(path):
        with open(path, encoding="utf-8", errors="replace") as fh:
            rows = [ln.rstrip("\n") for ln in fh if len(ln.split()) == 41]
    from avas.gui.textio import read_text, text_fingerprint
    from avas.paths import lattice_source_path
    lattice = os.path.join(args.input, args.lattice) if args.lattice else lattice_source_path(args.input)
    if not rows:
        from avas.data.lattice_doc import LatticeDocument
        doc = LatticeDocument(read_text(lattice)) if os.path.isfile(lattice) else None
        rows = _synthetic_rows(getattr(doc, "total_length", 1.0) or 1.0)
    info = {"mode": args.mode, "lattice": os.path.basename(lattice), "started": time.strftime("%Y-%m-%d %H:%M:%S"),
            "status": "running", "fake_engine": True,
            "lattice_sha1": text_fingerprint(read_text(lattice)) if os.path.isfile(lattice) else None}
    with open(os.path.join(args.output, "avas_run.json"), "w", encoding="utf-8") as fh:
        json.dump(info, fh, indent=2)
    print("[avas] fake engine: replaying", len(rows), "rows", flush=True)
    time.sleep(1.5)                                   # the engine initialises before writing
    def z_of(values):
        return float(values[5]) + float(values[33])

    z_end = z_of(rows[-1].split()) or 1.0
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        t0 = time.time()
        last_print = 0.0
        for i, line in enumerate(rows):
            v = line.split()
            z = z_of(v)
            if args.lose > 0:
                v[28] = f"{max(1.0, round(float(v[28]) * (1 - args.lose * z / z_end))):.0f}"
            fh.write(" ".join(v) + "\n")
            fh.flush()
            target = t0 + args.duration * (i + 1) / len(rows)
            if time.time() - last_print > 3.0:
                last_print = time.time()
                pct = 100.0 * (i + 1) / len(rows)
                eta = max(0.0, target - time.time() + args.duration * (1 - (i + 1) / len(rows)))
                print(f"Simulate progress {pct:.2f}%. Estimated remaining time {eta:.0f}s. Run time {time.time() - t0:.0f}s."
                      f"  {int(float(v[28]))}  {z:.2f}m", flush=True)
            time.sleep(max(0.0, target - time.time()))
    info.update(status="finished", finished=time.strftime("%Y-%m-%d %H:%M:%S"))
    with open(os.path.join(args.output, "avas_run.json"), "w", encoding="utf-8") as fh:
        json.dump(info, fh, indent=2)
    print("[avas] fake engine: done", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
