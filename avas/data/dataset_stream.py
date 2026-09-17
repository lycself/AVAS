"""DataSet.txt as the GUI draws it: beam envelope along the beam line, also while the engine writes it.

The engine recreates DataSet.txt when a run starts and appends one row per
output step (verified 2026-09-17 on the hwr010 example: a few rows every
0.3 s).  :class:`DatasetTail` reads only the rows added since the last call
and keeps an incomplete last line for the next one; :class:`PathLength`
continues the position along the beam line across calls.
"""
import math
import os

import numpy as np

from avas.post.analysis.run_diagnostics import normalise_tokens, parse_dataset_lines, read_dataset_array

MAX_LOSS_EVENTS = 2000


class PathLength:
    """Position z (m) along the beam line of DataSet rows, continued across calls.

    Without bends z = column 5 + column 33.  Inside a bend (column 35 non-zero) the
    path length accumulates the step length; rows after the second one of a bend
    step are dropped (the same rules as ``DatasetParameter``).
    """

    def __init__(self):
        self.s1 = 0
        self.s2 = 0
        self.last = 0.0

    def update(self, d):
        """``(z, keep)`` for the rows *d* (float array ``(n, 41)``)."""
        n = len(d)
        sign = d[:, 35]
        if self.s1 == 0 and np.all(sign == 0):
            z = d[:, 5] + d[:, 33]
            if n:
                self.last = float(z[-1])
            return z, np.ones(n, dtype=bool)
        z = np.zeros(n)
        keep = np.ones(n, dtype=bool)
        for i in range(n):
            step = math.hypot(d[i, 37], d[i, 38])
            if sign[i] == 0:
                self.s2 = 0
                self.last = d[i, 5] + d[i, 33] if self.s1 == 0 else self.last + d[i, 38]
            elif sign[i] == 1:
                self.last, self.s1, self.s2 = self.last + step, 1, 0
            elif self.s2 == 0:
                self.last, self.s2 = self.last + step, 1
            else:
                keep[i] = False
                continue
            z[i] = self.last
        return z, keep


def envelope_rows(d, z):
    """The columns the GUI draws, in mm (sizes, centroids), MeV and macro-particles."""
    return {
        "z": np.asarray(z, dtype=float),
        "rmsX": d[:, 16] * 1e3, "rmsY": d[:, 18] * 1e3, "rmsZ": d[:, 20] * 1e3,
        "maxX": d[:, 22] * 1e3, "maxY": d[:, 24] * 1e3,
        "cx": (d[:, 1] + d[:, 29]) * 1e3, "cy": (d[:, 3] + d[:, 31]) * 1e3,
        "energy": d[:, 0], "alive": d[:, 28],
    }


def loss_events(z, alive, previous=None):
    """``[{z, n}]`` where the number of macro-particles drops (*previous*: the count before the first row)."""
    alive = np.asarray(alive, dtype=float)
    if not len(alive):
        return []
    before = np.concatenate([[alive[0] if previous is None else previous], alive[:-1]])
    idx = np.flatnonzero(alive < before)
    return [{"z": float(z[i]), "n": float(before[i] - alive[i])} for i in idx[:MAX_LOSS_EVENTS]]


def dataset_envelope(output_dir, max_points=3000):
    """Envelope along z from ``<output_dir>/DataSet.txt``, downsampled; ``None`` without a DataSet."""
    path = os.path.join(output_dir, "DataSet.txt")
    if not os.path.isfile(path):
        return None
    d = read_dataset_array(path)
    if not d.shape[0]:
        return None
    z, keep = PathLength().update(d)
    d, z = d[keep], z[keep]
    env = envelope_rows(d, z)
    losses = loss_events(z, env["alive"])
    stride = max(1, int(math.ceil(len(d) / max_points)))
    out = {k: v[::stride] for k, v in env.items()}
    out.update(losses=losses, particles=float(env["alive"][0]), rows=int(len(d)))
    return out


class DatasetTail:
    """Reads the rows appended to a DataSet.txt since the previous :meth:`poll`.

    *not_before* (a time stamp): a file last modified before it is the previous run's,
    still there while the engine starts up; it is ignored until the engine rewrites it.
    """

    def __init__(self, path, not_before=None):
        self.path = path
        self.not_before = not_before
        self.reset()

    def reset(self):
        self.offset = 0
        self.partial = b""
        self.path_length = PathLength()
        self.last_alive = None
        self.first_alive = None

    def poll(self, max_bytes=16 << 20):
        """``(restarted, rows, losses)``: *rows* is an :func:`envelope_rows` dict or ``None``.

        *restarted* is true when the file shrank since the last call (a new engine run
        rewrote it); reading then starts again from its beginning.
        """
        try:
            st = os.stat(self.path)
        except OSError:
            return False, None, []
        if self.not_before is not None and self.offset == 0 and st.st_mtime < self.not_before:
            return False, None, []
        size = st.st_size
        restarted = size < self.offset
        if restarted:
            self.reset()
        if size == self.offset:
            return restarted, None, []
        try:
            with open(self.path, "rb") as fh:
                fh.seek(self.offset)
                data = fh.read(min(size - self.offset, max_bytes))
        except OSError:
            return restarted, None, []
        self.offset += len(data)
        data = self.partial + data
        cut = max(data.rfind(b"\n"), data.rfind(b"\r"))
        if cut < 0:
            self.partial = data
            return restarted, None, []
        self.partial = data[cut + 1:]
        d = parse_dataset_lines(normalise_tokens(data[:cut + 1]).splitlines())
        if not len(d):
            return restarted, None, []
        z, keep = self.path_length.update(d)
        d, z = d[keep], z[keep]
        if not len(d):
            return restarted, None, []
        rows = envelope_rows(d, z)
        alive = rows["alive"]
        if self.first_alive is None:
            self.first_alive = float(alive[0])
        losses = loss_events(z, alive, self.last_alive)
        self.last_alive = float(alive[-1])
        return restarted, rows, losses
