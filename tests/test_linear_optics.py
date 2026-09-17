"""Unit tests for the linear envelope preview (avas.sim.linear_optics); no engine runs."""
import math
import os
import struct
import sys

import numpy as np
import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXAMPLE_INPUT = os.path.join(ROOT, "examples", "hwr010", "InputFile")
sys.path.insert(0, ROOT)

from avas.sim import linear_optics as lo  # noqa: E402

PROTON = 938.272088
C = 299792458.0


# --------------------------------------------------------------------------- helpers
def make_beam(energy=10.0, mass=PROTON, charge=1.0, current=0.0, freq=162.5e6, dc=False,
              tx=(0.5, 1.2, 0.2), ty=(-0.3, 0.8, 0.25), tz=(0.1, 1.0, 0.3)):
    return {"mass": mass, "charge": charge, "energy": energy, "current": current, "frequency": freq, "dc": dc,
            "twiss": {"x": tx, "y": ty, "z": tz}}


def kin(energy, mass=PROTON):
    gamma = 1 + energy / mass
    bg = math.sqrt(gamma * gamma - 1)
    return gamma, bg, bg / gamma, mass * bg


def sigma2(twiss, bg):
    alpha, beta, emit_n = twiss
    e = emit_n / bg * 1e-6
    return np.array([[beta * e, -alpha * e], [-alpha * e, (1 + alpha * alpha) / beta * e]])


def rms_after(m2, twiss, bg):
    s = m2 @ sigma2(twiss, bg) @ m2.T
    return math.sqrt(s[0, 0]) * 1e3


def write_map(path, func, length, nz, half_width=0.01, n_t=4, norm=1.0):
    """ASCII map (layout of avas.data.fieldmap): values func(z, y, x) stored z outermost, then y, then x."""
    z = np.linspace(0, length, nz + 1)
    t = np.linspace(-half_width, half_width, n_t + 1)
    zz, yy, xx = np.meshgrid(z, t, t, indexing="ij")
    values = np.broadcast_to(func(zz, yy, xx), zz.shape).astype(float)
    with open(path, "w") as fh:
        fh.write(f"{nz} {length}\n{n_t} {-half_width} {half_width}\n{n_t} {-half_width} {half_width}\n{norm}\n")
        np.savetxt(fh, values.reshape(-1))


def texts(result):
    return " | ".join(en for en, _zh in result["warnings"])


# --------------------------------------------------------------------------- matrix elements
def test_drift_matches_analytic():
    beam = make_beam()
    res = lo.linear_preview("start\ndrift 1.5 0.05 0\nend\n", beam, [])
    _g, bg, _b, _p = kin(beam["energy"])
    for length in (0.75, 1.5):
        i = int(np.argmin(np.abs(res["z"] - length)))
        assert res["z"][i] == pytest.approx(length)
        m = np.array([[1, length], [0, 1]])
        assert res["rms_x"][i] == pytest.approx(rms_after(m, beam["twiss"]["x"], bg), rel=1e-9)
        assert res["rms_y"][i] == pytest.approx(rms_after(m, beam["twiss"]["y"], bg), rel=1e-9)
    assert np.all(res["energy"] == beam["energy"])
    assert res["warnings"] == []
    assert not res["model"]["space_charge"]


@pytest.mark.parametrize("gradient", [8.0, -5.0])
def test_thick_quad_matches_analytic(gradient):
    beam = make_beam(energy=20.0)
    length = 0.3
    res = lo.linear_preview(f"start\nquad {length} 0.05 0 {gradient}\nend\n", beam, [])
    _g, bg, _b, p = kin(beam["energy"])
    k = gradient * lo.MEV_TM / p

    def thick(kk):
        r = math.sqrt(abs(kk))
        if kk > 0:
            return np.array([[math.cos(r * length), math.sin(r * length) / r], [-r * math.sin(r * length), math.cos(r * length)]])
        return np.array([[math.cosh(r * length), math.sinh(r * length) / r], [r * math.sinh(r * length), math.cosh(r * length)]])

    assert res["rms_x"][-1] == pytest.approx(rms_after(thick(k), beam["twiss"]["x"], bg), rel=1e-9)
    assert res["rms_y"][-1] == pytest.approx(rms_after(thick(-k), beam["twiss"]["y"], bg), rel=1e-9)
    m = lo.quad_matrix(length, k)
    assert np.linalg.det(m) == pytest.approx(1.0)


def test_solenoid_round_beam_follows_larmor_frame():
    twiss = (0.4, 1.0, 0.3)
    beam = make_beam(energy=5.0, tx=twiss, ty=twiss)
    length, field = 0.4, 2.0
    res = lo.linear_preview(f"start\nsolenoid {length} 0.05 0 {field}\nend\n", beam, [])
    _g, bg, _b, p = kin(beam["energy"])
    k = field * lo.MEV_TM / p / 2
    larmor = np.array([[math.cos(k * length), math.sin(k * length) / k], [-k * math.sin(k * length), math.cos(k * length)]])
    expected = rms_after(larmor, twiss, bg)
    assert res["rms_x"][-1] == pytest.approx(expected, rel=1e-9)
    assert res["rms_y"][-1] == pytest.approx(expected, rel=1e-9)
    assert np.allclose(res["rms_x"], res["rms_y"], rtol=1e-12)


def test_solenoid_body_plus_edge_kicks_is_hard_edge():
    k, length = np.array([3.0]), 0.25
    entry = np.eye(4)
    entry[1, 2], entry[3, 0] = k[0], -k[0]
    exit_ = np.eye(4)
    exit_[1, 2], exit_[3, 0] = -k[0], k[0]
    assert np.allclose(exit_ @ lo._solenoid_body4(k, length)[0] @ entry, lo._solenoid4(k, length)[0])
    # slices of one solenoid compose
    assert np.allclose(lo._solenoid4(k, 0.1)[0] @ lo._solenoid4(k, 0.15)[0], lo._solenoid4(k, 0.25)[0])


def _symplectic_error(m):
    j = np.zeros((6, 6))
    for i in (0, 2, 4):
        j[i, i + 1], j[i + 1, i] = 1, -1
    return np.abs(m.T @ j @ m - j).max()


@pytest.mark.parametrize("n_index,plane", [(0.0, 0), (0.4, 0), (0.0, 1), (1.5, 1)])
def test_bend_is_symplectic_and_matches_sector_formulas(n_index, plane):
    rho, angle = 1.2, math.radians(30)
    m = lo.bend_matrix(rho * angle, angle, n_index, plane)
    assert _symplectic_error(m) < 1e-12
    if n_index == 0:
        b = 0 if plane == 0 else 2
        assert m[b, b] == pytest.approx(math.cos(angle))
        assert m[b, b + 1] == pytest.approx(rho * math.sin(angle))
        assert m[b, 5] == pytest.approx(rho * (1 - math.cos(angle)))
    edge = lo.edge_matrix(20.0, rho, 0.05, 0.45, 2.8, plane)
    assert _symplectic_error(edge) < 1e-12
    res = lo.linear_preview(f"start\nedge 0 0.05 0 20 {rho} 0.05 0.45 2.8 {plane}\n"
                            f"bend 0 0.05 0 30 {rho} {n_index} {plane}\nedge 0 0.05 0 20 {rho} 0.05 0.45 2.8 {plane}\nend\n",
                            make_beam(), [])
    assert res["z"][-1] == pytest.approx(rho * angle)
    assert res["warnings"] == []


# --------------------------------------------------------------------------- field maps
def test_rf_map_energy_gain_and_phase_references(tmp_path):
    e0, length = 2.0, 0.2
    write_map(tmp_path / "flat.edz", lambda z, y, x: e0 + 0 * z, length, 40)
    beam = make_beam(energy=10.0, charge=2.0)
    # nearly static RF (1 Hz): gain = q·Ke·E·L·cos(phase)
    for phase, factor in ((0.0, 1.0), (60.0, 0.5)):
        res = lo.linear_preview(f"start\nfield {length} 0.02 1 1 1 {phase} 1.5 0 flat\nend\n", beam, [str(tmp_path)])
        assert res["energy"][-1] - beam["energy"] == pytest.approx(2.0 * 1.5 * e0 * length * factor, rel=1e-6)
        cav = [e for e in res["elements"] if e["phase_rf"] is not None][0]
        assert cav["phase_rf"] == pytest.approx(phase)
        assert cav["w_out"] == pytest.approx(res["energy"][-1])

    # V3 = 0: the requested synchronous phase is reached; the gain agrees with an independent RK4 integration
    beam = make_beam(energy=2.0)
    freq = 162.5e6
    res = lo.linear_preview(f"start\nfield {length} 0.02 0 1 {freq} -30 1 0 flat\nend\n", beam, [str(tmp_path)])
    cav = [e for e in res["elements"] if e["phase_rf"] is not None][0]
    assert cav["phase_s"] == pytest.approx(-30.0, abs=1e-6)
    w, t, n = beam["energy"], 0.0, 4000
    h = length / n
    phi0 = math.radians(cav["phase_rf"])

    def deriv(wl, tl):
        _g, _bg, b, _p = kin(wl)
        return e0 * math.cos(2 * math.pi * freq * tl + phi0), 1 / (b * C)

    for _ in range(n):
        k1 = deriv(w, t)
        k2 = deriv(w + h / 2 * k1[0], t + h / 2 * k1[1])
        k3 = deriv(w + h / 2 * k2[0], t + h / 2 * k2[1])
        k4 = deriv(w + h * k3[0], t + h * k3[1])
        w += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])
        t += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])
    assert res["energy"][-1] == pytest.approx(w, rel=1e-6)

    # V3 = 2: phase at t = 0, the entry phase advances with the time of flight through the drift
    res = lo.linear_preview(f"start\ndrift 0.5 0.02 0\nfield {length} 0.02 2 1 {freq} 10 1 0 flat\nend\n",
                            beam, [str(tmp_path)])
    cav = [e for e in res["elements"] if e["phase_rf"] is not None][0]
    t_in = 0.5 / (kin(beam["energy"])[2] * C)
    assert cav["phase_rf"] == pytest.approx(lo._wrap(10 + 360 * freq * t_in), abs=1e-6)


def test_superposed_static_electric_maps_add(tmp_path):
    write_map(tmp_path / "es.esz", lambda z, y, x: 1.0 + 0 * z, 0.2, 20)
    lattice = ("start\nsuperpose 0 0 0 0 0 0\nfield 0.2 0.02 0 2 0 0 0.5 0 es\n"
               "superpose 0.1 0 0 0 0 0\nfield 0.2 0.02 0 2 0 0 1.0 0 es\nsuperposeend\ndrift 0.1 0.02 0\nend\n")
    res = lo.linear_preview(lattice, make_beam(), [str(tmp_path)])
    assert res["energy"][-1] - 10.0 == pytest.approx(0.5 * 0.2 + 1.0 * 0.2, rel=1e-9)
    assert res["z"][-1] == pytest.approx(0.4)
    elements = res["elements"]
    assert elements[1]["z0"] == pytest.approx(0.1) and elements[1]["w_out"] == pytest.approx(10.3)


def test_quadrupole_field_map_matches_quad_matrix(tmp_path):
    gradient, length = 6.0, 0.3
    write_map(tmp_path / "qm.bsx", lambda z, y, x: gradient * y, length, 30)
    write_map(tmp_path / "qm.bsy", lambda z, y, x: gradient * x, length, 30)
    write_map(tmp_path / "qm.bsz", lambda z, y, x: 0 * z, length, 30)
    beam = make_beam(energy=20.0)
    by_map = lo.linear_preview(f"start\nfield {length} 0.03 0 3 0 0 1 1 qm\nend\n", beam, [str(tmp_path)])
    by_matrix = lo.linear_preview(f"start\nquad {length} 0.03 0 {gradient}\nend\n", beam, [])
    assert by_map["rms_x"][-1] == pytest.approx(by_matrix["rms_x"][-1], rel=2e-3)
    assert by_map["rms_y"][-1] == pytest.approx(by_matrix["rms_y"][-1], rel=2e-3)
    assert by_map["warnings"] == []


def test_uniform_solenoid_map_matches_hard_edge_solenoid(tmp_path):
    field, length = 1.5, 0.3
    write_map(tmp_path / "sm.bsz", lambda z, y, x: field + 0 * z, length, 60)
    twiss = (0.2, 0.9, 0.3)
    beam = make_beam(energy=5.0, tx=twiss, ty=(-0.4, 1.3, 0.2))
    by_map = lo.linear_preview(f"start\nfield {length} 0.03 0 3 0 0 1 1 sm\ndrift 0.2 0.03 0\nend\n", beam, [str(tmp_path)])
    by_matrix = lo.linear_preview(f"start\nsolenoid {length} 0.03 0 {field}\ndrift 0.2 0.03 0\nend\n", beam, [])
    assert by_map["rms_x"][-1] == pytest.approx(by_matrix["rms_x"][-1], rel=1e-2)
    assert by_map["rms_y"][-1] == pytest.approx(by_matrix["rms_y"][-1], rel=1e-2)


def test_missing_field_map_is_a_warning_not_an_exception(tmp_path):
    beam = make_beam()
    res = lo.linear_preview("start\nfield 0.3 0.02 0 3 0 0 1 1 nomap\nfield 0.2 0.02 0 1 162.5e6 -30 1 1 nocav\nend\n",
                            beam, [str(tmp_path)])
    assert "nomap" in texts(res) and "nocav" in texts(res)
    assert all(isinstance(w, tuple) and len(w) == 2 for w in res["warnings"])
    drift = lo.linear_preview("start\ndrift 0.5 0.02 0\nend\n", beam, [])
    assert res["z"][-1] == pytest.approx(0.5)
    assert res["rms_x"][-1] == pytest.approx(drift["rms_x"][-1], rel=1e-9)
    assert np.all(res["energy"] == beam["energy"])


def test_field_map_cache_follows_file_changes(tmp_path):
    path = tmp_path / "es.esz"
    write_map(path, lambda z, y, x: 1.0 + 0 * z, 0.2, 20)
    lattice = "start\nfield 0.2 0.02 0 2 0 0 1 0 es\nend\n"
    first = lo.linear_preview(lattice, make_beam(), [str(tmp_path)])
    size = len(lo._MAP_CACHE)
    again = lo.linear_preview(lattice, make_beam(), [str(tmp_path)])
    assert len(lo._MAP_CACHE) == size
    assert again["energy"][-1] == first["energy"][-1]
    write_map(path, lambda z, y, x: 2.0 + 0 * z, 0.2, 20)
    os.utime(path, ns=(os.stat(path).st_atime_ns, os.stat(path).st_mtime_ns + 10**9))
    changed = lo.linear_preview(lattice, make_beam(), [str(tmp_path)])
    assert changed["energy"][-1] - 10.0 == pytest.approx(0.4, rel=1e-9)


# --------------------------------------------------------------------------- robustness
@pytest.mark.parametrize("gradient", ["nan", "1e7"])
def test_nan_or_diverging_envelope_stops_with_warning(gradient):
    res = lo.linear_preview(f"start\ndrift 0.2 0.02 0\nquad 0.5 0.02 0 {gradient}\ndrift 1 0.02 0\nend\n", make_beam(), [])
    assert "diverges" in texts(res)
    assert res["z"][-1] <= 0.7 + 1e-9
    assert np.all(np.isfinite(res["rms_x"])) and np.all(np.isfinite(res["rms_y"]))


def test_decelerated_reference_particle_stops(tmp_path):
    write_map(tmp_path / "wall.esz", lambda z, y, x: -100.0 + 0 * z, 0.5, 50)
    res = lo.linear_preview("start\ndrift 0.1 0.02 0\nfield 0.5 0.02 0 2 0 0 1 0 wall\ndrift 1 0.02 0\nend\n",
                            make_beam(energy=10.0), [str(tmp_path)])
    assert "stops" in texts(res)
    assert res["z"][-1] < 0.3
    assert np.all(res["energy"] > 0)


def test_garbage_parameters_do_not_raise():
    lattice = "start\nbend 0 0.05 0 abc 1 nan nan\nedge 0 0.05 0 x y z 1 2 nan\nfield 0.1\nsteerer 0 0.05\nfoo 1 2\nend\n"
    res = lo.linear_preview(lattice, make_beam(), ["does-not-exist"])
    assert "foo" in texts(res)


def test_preview_errors_for_unusable_input():
    with pytest.raises(lo.PreviewError):
        lo.linear_preview("drift 1 0.02 0\n", make_beam(), [])
    bad = make_beam()
    del bad["twiss"]["y"]
    with pytest.raises(lo.PreviewError):
        lo.linear_preview("start\ndrift 1 0.02 0\nend\n", bad, [])
    with pytest.raises(lo.PreviewError):
        lo.linear_preview("start\ndrift 1 0.02 0\nend\n", make_beam(energy=0), [])


def test_output_is_downsampled_and_only_active_lines_count():
    res = lo.linear_preview("drift 5 0.02 0\nstart\ndrift 30 0.02 0\nend\ndrift 7 0.02 0\n", make_beam(), [], max_points=500)
    assert len(res["z"]) <= 500 and res["z"][-1] == pytest.approx(30.0)
    assert res["model"]["slices"] == 3000
    assert [e["line"] for e in res["elements"]] == [2]


# --------------------------------------------------------------------------- space charge
def test_dc_space_charge_matches_rms_envelope_equation():
    from scipy.integrate import solve_ivp

    energy, current, length = 3.0, 20.0, 1.0
    twiss = (0.0, 0.5, 0.2)
    beam = make_beam(energy=energy, current=current, dc=True, tx=twiss, ty=twiss)
    res = lo.linear_preview(f"start\ndrift {length} 0.05 0\nend\n", beam, [])
    assert res["model"]["space_charge"]
    gamma, bg, beta, _p = kin(energy)
    emit = twiss[2] / bg * 1e-6
    # uniform round beam of radius 2σ: σ'' = ε²/σ³ + K/(4σ), K = 2qI/(4πε0 m c³ (βγ)³)
    perveance = 2 * current * 1e-3 / (4 * math.pi * lo.EPS0 * PROTON * 1e6 * C * bg ** 3)
    s0 = math.sqrt(twiss[1] * emit)
    sol = solve_ivp(lambda _z, y: [y[1], emit ** 2 / y[0] ** 3 + perveance / (4 * y[0])], (0, length), [s0, 0.0],
                    rtol=1e-10, atol=1e-14)
    assert res["rms_x"][-1] == pytest.approx(sol.y[0, -1] * 1e3, rel=5e-3)
    no_sc = lo.linear_preview(f"start\ndrift {length} 0.05 0\nend\n", beam, [], space_charge=False)
    assert res["rms_x"][-1] > no_sc["rms_x"][-1] * 1.05


def test_bunched_space_charge_defocuses_all_planes():
    beam = make_beam(energy=3.0, current=10.0)
    lattice = "start\ndrift 1 0.05 0\nend\n"
    with_sc = lo.linear_preview(lattice, beam, [])
    without = lo.linear_preview(lattice, beam, [], space_charge=False)
    assert with_sc["model"]["space_charge"] and not without["model"]["space_charge"]
    for key in ("rms_x", "rms_y", "rms_z"):
        assert with_sc[key][-1] > without[key][-1]
    for p in (0.5, 1.0 - 1e-7, 1.0, 3.0, 1e8):
        assert 0 < lo._longitudinal_factor(p) <= 1


# --------------------------------------------------------------------------- beam file / example project
def test_read_beam_keywords_and_dst(tmp_path):
    (tmp_path / "beam.txt").write_text(
        "numofcharge 14\nparticlerestmass 44660.33805\ncurrent 0.04\nfrequency 162500000.0\nkneticenergy 65.22\n"
        "beamtype notdc\ntwissx -0.1 0.2 0.15\ntwissy -0.11 0.35 0.12\ntwissz -0.08 0.75 0.12\n! comment\n")
    beam = lo.read_beam(str(tmp_path))
    assert beam["charge"] == 14 and beam["mass"] == pytest.approx(44660.33805)
    assert beam["twiss"]["y"] == (-0.11, 0.35, 0.12) and not beam["dc"]

    rng = np.random.default_rng(1)
    n, mass, energy = 20000, PROTON, 3.0
    _g, bg, _b, _p = kin(energy)
    emit = 0.25 / bg * 1e-6
    cov = np.array([[1.0 * emit, -0.5 * emit], [-0.5 * emit, 1.25 * emit]])      # α = 0.5, β = 1
    xs = rng.multivariate_normal([0, 0], cov, n)
    parts = np.zeros((n, 6))
    parts[:, 0], parts[:, 1] = xs[:, 0] * 100, xs[:, 1]
    parts[:, 2], parts[:, 3] = xs[:, 0] * 100, xs[:, 1]
    parts[:, 4] = rng.normal(0, 0.05, n)
    parts[:, 5] = energy + rng.normal(0, 0.01, n)
    with open(tmp_path / "beam.dst", "wb") as fh:
        fh.write(b"ab" + struct.pack("<idd", n, 5.0, 162.5) + b"c" + parts.astype("<f8").tobytes() + struct.pack("<d", mass))
    (tmp_path / "beam.txt").write_text("readparticledistribution beam.dst\nuse_dst 1\nnumofcharge 1\n")
    beam = lo.read_beam(str(tmp_path))
    assert beam["source"] == "dst" and beam["current"] == 5.0 and beam["frequency"] == pytest.approx(162.5e6)
    alpha, beta, emit_n = beam["twiss"]["x"]
    assert alpha == pytest.approx(0.5, abs=0.03) and beta == pytest.approx(1.0, rel=0.03)
    assert emit_n == pytest.approx(0.25, rel=0.03)


@pytest.mark.skipif(not os.path.isfile(os.path.join(EXAMPLE_INPUT, "efield.edz")), reason="example project missing")
def test_hwr010_example_matches_engine_energy_and_phase():
    beam = lo.read_beam(EXAMPLE_INPUT)
    with open(os.path.join(EXAMPLE_INPUT, "lattice_mulp.txt")) as fh:
        res = lo.linear_preview(fh.read(), beam, [EXAMPLE_INPUT], space_charge=False)
    cav = [e for e in res["elements"] if e["phase_rf"] is not None][0]
    # AVAS engine: phi_0 52.6614, exit energy 1.86654 MeV, rms_x 1.8106 mm / rms_y 1.7753 mm at 0.21 m
    assert cav["phase_s"] == pytest.approx(-33.0, abs=1e-6)
    assert cav["phase_rf"] == pytest.approx(52.6614, abs=0.05)
    assert res["energy"][-1] == pytest.approx(1.86654, rel=3e-4)
    assert res["rms_x"][-1] == pytest.approx(1.8106, rel=0.03)
    assert res["rms_y"][-1] == pytest.approx(1.7753, rel=0.03)
    assert res["warnings"] == []
