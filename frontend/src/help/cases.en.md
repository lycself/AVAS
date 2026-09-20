# Case tutorials {#cases-home}

Source: all six fragments in docs/案例.docx plus the acceptance chapter of the original manual. Original code is retained; revisions are explicit. Legacy cases are not advertised as runnable current features.

## Preparation and verification conditions {#cases-setup}

1. Copy examples/hwr010 into a new practice directory.
2. For the first three cases retain the example beam settings, but set particlenumber to 300 for this short verification and randomseed in input.txt to 12345. The separate Python error seed is 7. Other inputs remain those of the example.
3. Create InputFile/manual_case.txt in the copy, paste the case code, open it in Lattice and set it as the run lattice. Save and choose the stated run mode.
4. Check logs, trajectory extent, survivors and targets after completion. Keep results through run records before replacing them.

Verified on 2026-09-20, once per case. Engine runs left the prepared inputs unchanged. Values identify gross errors, not precision reference tolerances. The original Word file lacks complete beam/input files; these reproduction conditions are explicitly added.

From the practice directory:

```text
avas run --input InputFile --output OutputFile --lattice manual_case.txt --mode basic
```

Use stat_dyn for the error study or stat for correction, adding --seed 7.

## Overlapping-field multi-particle example {#cases-superpose}

> Verification: Executed: all 300 particles survived; 305 DataSet rows; final energy approximately 1.87937 MeV. This verifies completion for these inputs, not equivalence for arbitrary beam settings.

Study superpose and overlapping static magnetic / RF fields. Copy the example project and retain all sol and hwr010 field components. Use basic mode.

```text
start
drift      0.085  0.02   0
superpose  0 0 0 0 0 0
field      0.35   0.02     0   3   0   0   1    0.531  sol
superpose  0.345 0 0 0 0 0 0
field      0.21   0.02     0   1   162.5e6   -33   1.36    -1.36   hwr010
superposeend
end
```

Inspect the Run envelope and Results energy, survivors and particle distributions. A block contains at most one RF cavity; its first superpose is all zero.

[Overlapping-field rules](#ref-superpose)

## Static and dynamic error study {#cases-errors}

> Verification: Revised example executed: reference plus 2 groups × 2 runs, all with 353 DataSet rows. Error-run final energies were approximately 2.36336–2.36582 MeV; 283–287 of 300 particles survived. The original has a missing parameter.

Select static + dynamic errors (stat_dyn), error seed 7 and keep the reference run enabled. err_step 2 2 means two groups with two repeats each.

The revision only adds the third parameter 0 to the last drift. The original `drift 0.000001 0.02` produced a missing-parameter error and only four DataSet rows.

### Current revision

```text
start
err_step 2 2
err_cav_stat_on 1 0 0 0 0 0 0
err_cav_ncpl_stat 10 1 2 0 0.0 0.0 0.0 0.0 0.0
err_cav_dyn_on 1 0 0 0 0 0 0
err_cav_ncpl_dyn 10 1 2 0 0.0 0.0 0.0 0.0 0.0
drift 0.0835 0.02 0
field 0.1 0.02 0 3 0 0 1 0.677098 sol
field 0.1 0.02 0 3 0 0 1 0.677098 sol
field      0.21   0.02     0   1   162.5e6   -33  1.36    -1.36   hwr010
field      0.21   0.02     0   1   162.5e6   -33  -1.36    -1.36   hwr010
drift 0.0835 0.02 0
drift 0.000001 0.02 0
end
```

### Original fragment (comparison only)

```text
start
err_step 2 2
err_cav_stat_on 1 0 0 0 0 0 0
err_cav_ncpl_stat 10 1 2 0 0.0 0.0 0.0 0.0 0.0
err_cav_dyn_on 1 0 0 0 0 0 0
err_cav_ncpl_dyn 10 1 2 0 0.0 0.0 0.0 0.0 0.0
drift 0.0835 0.02 0
field 0.1 0.02 0 3 0 0 1 0.677098 sol
field 0.1 0.02 0 3 0 0 1 0.677098 sol
field      0.21   0.02     0   1   162.5e6   -33  1.36    -1.36   hwr010
field      0.21   0.02     0   1   162.5e6   -33  -1.36    -1.36   hwr010
drift 0.0835 0.02 0
drift 0.000001 0.02
end
```

Compare error_output/output_0_0 with output_1_1 through output_2_2 and inspect errors_par.txt / errors_par_tot.txt. This is not a loss-free beamline.

[Error kinds and sampling](#ref-errors)

## Static-error correction example {#cases-correction}

> Verification: Executed but target not reached: DIAG_ENERGY requests 5 MeV. The observed reference final energy was about 2.31270 MeV and error_adjust/output_0 about 2.28948 MeV. This is an advanced diagnostic example, not a demonstrated successful correction.

Use static-error mode (stat) to understand ADJUST parameter selection, bounds and DIAG_ENERGY targets. The original target is not a validated converged design.

```text
start
err_step 1 1
err_cav_stat_on 1 0 0 0 0 0 0
err_cav_ncpl_stat 1 0 1.0 0 0.0 0.0 0.0 0.0 0.0
drift 0.0835 0.02 0
field 0.1 0.02 0 3 0 0 1 0.677098 sol
ADJUST 1 7 5 0 3 0
field      0.21  0.02     0   1   162.5e6   -33  3    -1.36   hwr010
drift 0.0835 0.02 0
DIAG_ENERGY 1 5 0
drift 0.000001 0.02 0
end
```

Check physical reachability within the Ke bounds and inspect pre/post-correction outputs. Exit code 0 does not certify convergence. A changed target or bound is a new study requiring verification.

[Correction and diagnostics](#ref-correction)

## Legacy envelope model {#cases-legacy-envelope}

> Verification: Legacy / unverified: no validated current workflow for this old syntax.

The source is only an element fragment. Its QUAD parameter count differs from the current multi-particle format; do not paste it as a runnable multi-particle lattice.

```text
DRIFT 0.76486 1 1
QUAD 0.97277 1 0.40328
DRIFT 0.1355 1 1
QUAD 0.15 1 -2.2265
DRIFT 0.381 1 1
QUAD 0.324 1 0.664
DRIFT 0.59197 1 1
```

Keep the original for migration. The current linear envelope preview is not a replacement claim for this old algorithm.

## Legacy Twiss matching {#cases-legacy-matching}

> Verification: Legacy / unverified: the MATCHING and SETTWISS workflow has not been verified in the current interface.

Retain the original bounds and targets; check algorithm, format, target definitions and units before migration.

```text
MATCHING 1 1 0.1 1
DRIFT 0.76486 1 1
MATCHING 1 1 0.1 1
MATCHING 1 3 0 10
QUAD 0.97277 1 0.40328
MATCHING 1 1 0.1 1
DRIFT 0.1355 1 1
MATCHING 1 1 0.1 1
MATCHING 1 3 -10 0
QUAD 0.150 1 -2.2265
MATCHING 1 1 0.1 1
DRIFT 0.381 1 1
MATCHING 1 1 0.1 1
MATCHING 1 3 0 10
QUAD 0.324 1 0.664
MATCHING 1 1 0.1 1
DRIFT 0.59197 1 1
SETTWISS 1 2 3 2 3
```

Do not relabel it as AI optimization, which may use different objectives and algorithms.

## Legacy periodic matching {#cases-legacy-periodic}

> Verification: Legacy / unverified: the current entry point and behavior of CIRCLE_MATCH and RF_GAP have not been established.

The original defines four cells but lacks full project inputs and expected results.

```text
CIRCLE_MATCH 1 2 0
LATTICE 1 4 5
;cell1
DRIFT 1 0 0
SOLENOID 1 0 1
DRIFT 1 0 0
RF_GAP 100000 0 162.5E6
DRIFT 1 0 0
;cell2
DRIFT 1 0 0
SOLENOID 1 0 1
DRIFT 1 0 0
RF_GAP 100000 0 162.5E6
DRIFT 1 0 0
;cell3
DRIFT 1 0 0
SOLENOID 1 0 1
DRIFT 1 0 0
RF_GAP 100000 0 162.5E6
DRIFT 1 0 0
;cell4
DRIFT 1 0 0
SOLENOID 1 0 1
DRIFT 1 0 0
RF_GAP 100000 0 162.5E6
DRIFT 1 0 0
LATTICE_END
```

Preserve the original LATTICE structure; do not treat it as current multi-particle grouping syntax.

## Acceptance measurement {#cases-acceptance}

> Source: the acceptance chapter of 使用说明20260427.docx. Steps follow the current interface and result service. Acceptance values have not been verified on a representative loss distribution in this migration.

1. Prepare the beam. When importing a dst, inspect the distribution and parameters in Beam. The old “Import all beam parameters from file” button workflow no longer applies. To generate a new Twiss distribution, switch back to generated distribution and confirm parameters; deleting a path alone is insufficient.
2. Choose the study plane and initial emittance. The original suggests enlarging that emittance to sample the acceptance boundary; choose the magnitude for your beamline.
3. In Settings, set “Output every N steps (plt)” above zero, for example 1. Particle dumps may consume substantial disk space.
4. After simulation, select its output in Results, open Acceptance and choose x-x′, y-y′, z-z′ or φ-E.
5. Inspect the ellipse, emittance, normalized emittance and position/angle together with losses. All particles passing or missing dumps may prevent computation; an error is not zero acceptance.

Acceptance now lives in Results, not the old standalone accept page. Current written steps replace the three legacy screenshots.

[Particle-dump format](#ref-beamset)
