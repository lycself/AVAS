"""Unit tests for the linear model object (avas.model): full-resolution results, centroid, knobs, cache.

No engine runs; every expectation is analytic or a consistency check between two routes.
"""
import math
import os
import sys

import numpy as np
import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXAMPLE = os.path.join(ROOT, "examples", "hwr010")
sys.path.insert(0, ROOT)

from avas.model import LinearModel, ModelError  # noqa: E402
from avas.model.common import MEV_TM  # noqa: E402
from avas.model.elements import quad_matrix  # noqa: E402
from avas.sim import linear_optics as lo  # noqa: E402

PROTON = 938.272088
needs_example = pytest.mark.skipif(not os.path.isfile(os.path.join(EXAMPLE, "InputFile", "sol.bsz")),
                                   reason="example field maps not installed")


def make_beam(energy=10.0, current=0.0, dc=False, tx=(0.5, 1.2, 0.2), ty=(-0.3, 0.8, 0.25), tz=(0.1, 1.0, 0.3)):
    return {"mass": PROTON, "charge": 1.0, "energy": energy, "current": current, "frequency": 162.5e6, "dc": dc,
            "twiss": {"x": tx, "y": ty, "z": tz}}


def momentum(energy, mass=PROTON):
    gamma = 1 + energy / mass
    return mass * math.sqrt(gamma * gamma - 1), math.sqrt(1 - 1 / gamma ** 2)


def write_uniform_map(folder, base, length, values, nz=50, half=0.02, n_t=4):
    """Static magnetic map with uniform components ``{"bsx": Bx, "bsy": By, "bsz": Bz}`` [T]."""
    for ext in ("bsx", "bsy", "bsz"):
        with open(os.path.join(folder, f"{base}.{ext}"), "w") as fh:
            fh.write(f"{nz} {length}\n{n_t} {-half} {half}\n{n_t} {-half} {half}\n1\n")
            np.savetxt(fh, np.full((nz + 1) * (n_t + 1) ** 2, float(values.get(ext, 0.0))))


def symplectic_error4(m):
    j = np.kron(np.eye(2), np.array([[0, 1], [-1, 0]]))
    return np.abs(m.T @ j @ m - j).max()


# --------------------------------------------------------------------------- full results
def test_full_resolution_matches_the_preview():
    text = "start\ndrift 0.3 0.05 0\nquad 0.1 0.05 0 12\ndrift 0.5 0.05 0\nsolenoid 0.2 0.05 0 0.6\ndrift 0.4 0.05 0\nend\n"
    beam = make_beam(current=5.0)
    res = LinearModel(text, beam).evaluate()
    prev = lo.linear_preview(text, beam, [])
    assert len(res.z) == len(prev["z"])
    for plane in "xyz":
        assert np.allclose(res.rms(plane) * 1e3, prev[f"rms_{plane}"], rtol=1e-13)
    assert res.sigma.shape == (len(res.z), 6, 6) and res.mats.shape == (len(res.z) - 1, 6, 6)
    assert np.allclose(res.sigma, res.sigma.transpose(0, 2, 1))


def test_emittance_twiss_and_matched_fodo_phase_advance():
    cell = "drift 0.2 0.05 0\nquad 0.1 0.05 0 10\ndrift 0.4 0.05 0\nquad 0.1 0.05 0 -10\ndrift 0.2 0.05 0\n"
    probe = LinearModel("start\n" + cell + "end\n", make_beam()).evaluate()
    m = probe.transfer()
    twiss = {}
    for plane, i in (("x", 0), ("y", 2)):
        cos_mu = (m[i, i] + m[i + 1, i + 1]) / 2
        mu = math.acos(cos_mu)
        sin_mu = math.copysign(math.sin(mu), m[i, i + 1])
        twiss[plane] = ((m[i, i] - m[i + 1, i + 1]) / (2 * sin_mu), m[i, i + 1] / sin_mu, 0.2, abs(math.acos(cos_mu)))
    beam = make_beam(tx=twiss["x"][:3], ty=twiss["y"][:3])
    res = LinearModel("start\n" + cell * 3 + "end\n", beam).evaluate()
    for plane in "xy":
        alpha0, beta0, emit_n, mu = twiss[plane]
        assert np.allclose(res.emittance(plane, normalized=True), emit_n * 1e-6, rtol=1e-12)
        alpha, beta = res.twiss(plane)
        assert alpha[-1] == pytest.approx(alpha0, abs=1e-9) and beta[-1] == pytest.approx(beta0, rel=1e-9)
        assert res.phase_advance(plane)[-1] == pytest.approx(3 * mu, rel=1e-9)
    # quantities at an element, by name-free addresses
    assert res.at(("z", 1.0))["z"] == pytest.approx(1.0)
    q = res.at((3, "exit"))
    assert q["z"] == pytest.approx(0.3) and q["planes"]["x"]["beta"] > 0


def test_space_charge_depresses_the_phase_advance():
    cell = "drift 0.2 0.05 0\nquad 0.1 0.05 0 10\ndrift 0.4 0.05 0\nquad 0.1 0.05 0 -10\ndrift 0.2 0.05 0\n"
    text = "start\n" + cell * 4 + "end\n"
    zero = LinearModel(text, make_beam(energy=3.0, current=20.0, dc=True)).evaluate(space_charge=False)
    full = LinearModel(text, make_beam(energy=3.0, current=20.0, dc=True)).evaluate()
    assert full.info["space_charge"]
    assert 0 < full.phase_advance("x")[-1] < zero.phase_advance("x")[-1]
    assert full.phase_advance("x", space_charge=False)[-1] == pytest.approx(zero.phase_advance("x")[-1], rel=1e-12)
    # the effective matrices reproduce the moments
    t = full.transfer(space_charge=True)
    assert np.allclose(t @ full.sigma[0] @ t.T, full.sigma[-1], rtol=1e-8, atol=1e-20)


# --------------------------------------------------------------------------- centroid
@pytest.mark.parametrize("kind", [0, 1])
def test_steerer_kick_is_spread_over_the_next_element(kind):
    energy, field, length, drift = 10.0, 2e-3 if kind == 0 else 2e5, 0.25, 1.0
    fields = f"0 {field}" if kind == 0 else f"{field} 0"          # By bends in x, Ex pushes in x
    text = f"start\nsteerer 0 0.05 0 {fields} {kind} 1e9\ndrift {length} 0.05 0\ndrift {drift} 0.05 0\nend\n"
    res = LinearModel(text, make_beam(energy)).evaluate()
    p, beta = momentum(energy)
    theta = -MEV_TM * field * length / p if kind == 0 else field * 1e-6 * length / (beta * p)
    x_mid = res.centroid[res.index(length, "right")]
    assert x_mid[1] == pytest.approx(theta, rel=1e-12) and x_mid[0] == pytest.approx(theta * length / 2, rel=1e-12)
    assert res.centroid[-1, 0] == pytest.approx(theta * (length / 2 + drift), rel=1e-12)
    plain = LinearModel(text.replace(f"{field}", "0"), make_beam(energy)).evaluate()
    assert res.centroid[-1, 2] == 0 and not plain.centroid.any() and np.allclose(res.sigma, plain.sigma)


def test_steerer_and_uniform_map_field_deflect_alike(tmp_path):
    by, length = 0.01, 0.2
    write_uniform_map(str(tmp_path), "um", length, {"bsy": by, "bsx": 0.004})
    by_map = LinearModel(f"start\nfield {length} 0.03 0 3 0 0 0 1 um\ndrift 0.5 0.03 0\nend\n", make_beam(),
                         [str(tmp_path)]).evaluate()
    by_steerer = LinearModel(f"start\nsteerer 0 0.03 0 0.004 {by} 0 1\ndrift {length} 0.03 0\ndrift 0.5 0.03 0\nend\n",
                             make_beam()).evaluate()
    assert by_map.centroid[-1, 0] < 0 < by_map.centroid[-1, 2]        # positive charge, By > 0 bends to −x
    assert np.allclose(by_map.centroid[-1], by_steerer.centroid[-1], rtol=1e-9, atol=1e-15)
    off = LinearModel(f"start\nfield {length} 0.03 0 3 0 0 0 1 um\nend\n", make_beam(), [str(tmp_path)],
                      map_dipoles=False).evaluate()
    assert not off.centroid.any()


def test_offset_quad_steers_like_a_shifted_frame():
    k_grad, length, dx, dy = 12.0, 0.1, 1e-3, -0.5e-3
    text = "start\ndrift 0.1 0.05 0\nQ1: quad 0.1 0.05 0 12\ndrift 0.3 0.05 0\nend\n"
    c0 = np.array([0.2e-3, 0.1e-3, -0.3e-3, 0.0, 0.0, 0.0])
    res = LinearModel(text, make_beam()).evaluate(errors={"Q1": {"dx": dx, "dy": dy}}, centroid0=c0)
    i0, i1 = res.span("Q1")
    p, _beta = momentum(10.0)
    m = quad_matrix(length, k_grad * MEV_TM / p, 1 + 10.0 / PROTON)
    shift = np.array([dx, 0, dy, 0, 0, 0])
    assert np.allclose(res.centroid[i1], m @ (res.centroid[i0] - shift) + shift, rtol=1e-9, atol=1e-15)
    # the envelope does not care about the offset; the affine transfer reproduces the centroid
    assert np.allclose(res.sigma, LinearModel(text, make_beam()).evaluate().sigma)
    mat, d = res.transfer(affine=True)
    assert np.allclose(mat @ c0 + d, res.centroid[-1], rtol=1e-12, atol=1e-18)


def test_rolled_quad_couples_and_a_quarter_turn_flips_it():
    text = "start\nQ1: quad 0.1 0.05 0 12\ndrift 0.5 0.05 0\nend\n"
    flipped = LinearModel(text.replace(" 12\n", " -12\n"), make_beam()).evaluate()
    turned = LinearModel(text, make_beam()).evaluate(errors={"Q1": {"roll": math.pi / 2}})
    assert np.allclose(turned.sigma, flipped.sigma, rtol=1e-9, atol=1e-18)
    skew = LinearModel(text, make_beam()).evaluate(errors={"Q1": {"roll": math.radians(20)}})
    assert abs(skew.sigma[-1, 0, 2]) > 1e-3 * math.sqrt(skew.sigma[-1, 0, 0] * skew.sigma[-1, 2, 2])
    assert symplectic_error4(skew.transfer()[:4, :4]) < 1e-12


def test_centroid_ignores_linear_space_charge_and_responses_add_up():
    text = ("start\nS1: steerer 0 0.05 0 0.001 0.002 0 0.01\ndrift 0.2 0.05 0\nquad 0.1 0.05 0 8\n"
            "S2: steerer 0 0.05 0 -0.002 0.001 0 0.01\ndrift 0.3 0.05 0\nquad 0.1 0.05 0 -8\ndrift 1 0.05 0\nend\n")
    model = LinearModel(text, make_beam(energy=3.0, current=10.0))
    with_sc, without = model.evaluate(), model.evaluate(space_charge=False)
    assert not np.allclose(with_sc.sigma[-1], without.sigma[-1], rtol=1e-3)
    assert np.allclose(with_sc.centroid, without.centroid, rtol=1e-12, atol=1e-18)
    off = {"S1": {"Bx": 0, "By": 0}, "S2": {"Bx": 0, "By": 0}}
    only1 = model.evaluate(knobs={"S2": off["S2"]}).centroid[-1]
    only2 = model.evaluate(knobs={"S1": off["S1"]}).centroid[-1]
    assert np.allclose(with_sc.centroid[-1], only1 + only2, rtol=1e-9, atol=1e-18)


def test_bad_addresses_and_errors_are_reported():
    text = "start\nQ1: quad 0.1 0.05 0 12\nsuperpose 0\nfield 0.2 0.05 0 3 0 0 0 1 a\nsuperpose 0\n" \
           "field 0.2 0.05 0 3 0 0 0 1 b\nsuperposeend\nend\n"
    model = LinearModel(text, make_beam())
    with pytest.raises(ModelError, match="No element named"):
        model.evaluate(errors={"Q9": {"dx": 1e-3}})
    with pytest.raises(ModelError, match="Unknown error"):
        model.evaluate(errors={"Q1": {"dz": 1e-3}})
    with pytest.raises(ModelError, match="superpose block"):
        model.evaluate(errors={4: {"dx": 1e-3}})
    with pytest.raises(ModelError, match="not a parameter"):
        model.evaluate(knobs={"Q1": {"Kb": 1}})


# --------------------------------------------------------------------------- knobs and cache
@needs_example
def test_knobs_reuse_unchanged_field_sections():
    period = ("field 0.35 0.02 0 3 0 0 0 0.3 sol\ndrift 0.1 0.02 0\n"
              "field 0.21 0.02 0 1 162.5e6 -30 0.8 -0.8 hwr010\ndrift 0.1 0.02 0\n")
    text = ("start\ndrift 0.05 0.02 0\n" + period * 3 + "drift 0.2 0.02 0\n"
            "Q9: quad 0.1 0.02 0 5\ndrift 0.1 0.02 0\nend\n")
    dirs = [os.path.join(EXAMPLE, "InputFile")]
    beam = lo.read_beam(dirs[0])
    model = LinearModel(text, beam, dirs)
    base = model.evaluate()
    sections = model.cache.misses
    assert sections >= 6 and model.cache.hits == 0
    tuned = model.evaluate(knobs={"Q9": {"G": 7}})
    assert model.cache.misses == sections and model.cache.hits == sections
    fresh = LinearModel(model.with_knobs({"Q9": {"G": 7}}), beam, dirs, cache_size=0).evaluate()
    assert np.array_equal(tuned.sigma, fresh.sigma) and np.array_equal(tuned.energy, fresh.energy)
    assert not np.allclose(tuned.sigma[-1], base.sigma[-1])
    # a field knob re-tracks its own section; downstream ones are reused only when the energy is unchanged
    first_sol = next(e["line"] for e in base.elements if e["key"] == "field") + 1
    model.evaluate(knobs={first_sol: {"Kb": 0.31}})
    assert model.cache.misses == sections + 1
    preview = lo.linear_preview(text, beam, dirs)
    assert np.allclose(base.rms("x") * 1e3, np.interp(base.z, preview["z"], preview["rms_x"]), rtol=2e-2)


@needs_example
def test_model_of_a_project_folder():
    res = LinearModel.from_project(EXAMPLE).evaluate()
    beam = lo.read_beam(os.path.join(EXAMPLE, "InputFile"))
    text = open(os.path.join(EXAMPLE, "InputFile", "lattice_mulp.txt")).read()
    prev = lo.linear_preview(text, beam, [os.path.join(EXAMPLE, "InputFile")])
    assert res.energy[-1] == pytest.approx(prev["energy"][-1], rel=1e-12)
    assert res.rf and res.info["centroid_checked"] is True
