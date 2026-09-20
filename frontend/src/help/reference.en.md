# Parameters and files {#reference-home}

Source: docs/使用说明20260427.docx, reconciled with current schema and documented engine checks. This reference preserves file formats and technical rules while replacing obsolete interface instructions. Source-only formats are not certified by this migration. Current keyword tables follow these chapters and are loaded from the editor schema. The original Word file is retained unchanged.

## Field elements and RF phase {#ref-field}

Field-map elements use time-based tracking (t-code). Drift parameters are length (m), aperture radius (m), and a reserved 0. Field parameters are length, radius, V3, field type, frequency, phase, Ke, Kb and map basename. Types are 1 RF, 2 electrostatic and 3 magnetostatic; unused magnetic-field parameters may be zero.

V3=0 specifies synchronous phase, V3=1 the entrance RF phase, and V3=2 the absolute RF phase at t=0. Electric fields are MV/m × Ke; magnetic fields are T × Kb. RF electric fields use cos(ωt+φ₀), magnetic fields sin. The synchronous phase is atan2(∫E sinφ, ∫E cosφ). Determine map storage order from a complete component group.

Example map names must be replaced with files present in the project:

```text
start
drift 0.0835 0.02 0
field 0.1 0.02 0 3 0 0 1 0.677098 sol_1
field 0.1 0.02 0 1 162.5e6 -33 3 -1.36 hwr010b
end
```

[Field parameters](#lattice-field)

## Matrix elements and endpoint limitations {#ref-matrix}

Matrix elements use longitudinal tracking (z-code). Quad takes length, radius, reserved 0 and gradient (T/m); Solenoid takes length, radius, reserved 0 and field (T). Bend takes length (0 lets the program calculate the arc), radius, reserved 0, bend angle (deg), curvature radius (m), field index and plane (0 horizontal, 1 vertical). Arc length is |α|ρ with α converted to radians.

Edge takes 0, aperture radius, 0, pole-face angle β (deg), curvature radius ρ (m), total gap G (m), fringe factors K1/K2 and plane. Steerer takes 0, radius, 0, Bx/Ex, By/Ey, type and maximum; type 0 is magnetic, 1 electric. The original states that the steerer acts at the midpoint of the next element with its effective length.

The original advises avoiding matrix elements at the first and last position by inserting short drifts. This endpoint limitation was not independently tested during migration. Use the live parameter entries for exact field definitions.

[Bend](#lattice-bend), [Edge](#lattice-edge), [Steerer](#lattice-steerer)

## Errors and distribution kinds {#ref-errors}

err_step a b defines a groups and b repeats per group. Results are stored under error_output. Beam, magnetic-element and cavity errors have separate static and dynamic commands:

```text
err_beam_dyn r dx dy dφ dxp dyp de dEx dEy dEz mx my mz dib
err_beam_stat r dx dy dφ dxp dyp de dEx dEy dEz mx my mz dib
err_quad_ncpl_dyn N r dx dy dφx dφy dφz dG dz Nb
err_quad_ncpl_stat N r dx dy dφx dφy dφz dG dz Nb
err_cav_ncpl_dyn N r dx dy dφx dφy kekb φs dz Nb
err_cav_ncpl_stat N r dx dy dφx dφy kekb φs dz Nb
```

Offsets are mm, angular errors degrees, beam slopes mrad, energy MeV, relative emittance/mismatch/field errors percent and current mA. Consult the keyword entries for each position; trailing unspecified error parameters default to no error. N controls how many following elements are affected.

Current schema and Python sampling agree on 0 fixed, 1 uniform, 2 Gaussian and -1 equal steps. The original example swaps 2 and -1; this is corrected here. For the cavity example below, group amplitudes are 1 then 2: uniform bounds ±1 then ±2 for r=1, Gaussian standard deviations 1 then 2 for r=2, and fixed steps 1 then 2 for r=-1.

```text
err_step 2 2
err_cav_stat_on 1 0 0 0 0 0 0
err_cav_ncpl_stat 10 r 2 0 0 0 0 0 0
```

The beam equal-step branch differs from the element branch; inspect generated samples before applying this cavity example to beam errors. Fixed-value errors are not group-scaled. Each corresponding err_beam/quad/cav_dyn_on or _stat_on uses 0/1 switches in the same order. Python error sampling and engine random seeds are separate settings.

[Executed error tutorial](#cases-errors)

## Static correction and diagnostics {#ref-correction}

ADJUST N v n min max first_step changes parameter v of the following element. N is unused; use 0. Equal nonzero grouping identifiers n tie corrected values together. min/max bound the parameter. first_step=1 starts from its lattice value; 0 does not. The original example uses v=7 for field Ke.

```text
DIAG_ENERGY 0 W 0
DIAG_SIZE 0 sx sy 0
DIAG_POSITION 0 x y 0
```

W is target energy in MeV; sx/sy are envelope sizes in mm and x/y centroid positions in mm. Reserved diagnostic fields are written as 0. The source correction example has not reached its requested 5 MeV under the documented reproduction conditions.

[Original correction case and observed result](#cases-correction)

## Overlapping fields {#ref-superpose}

Superpose and Superposeout take z0 x0 y0 θz0 θx0 θy0 (m and degrees). The first superpose is all zero, defining the reference entrance plane. Every field in the block has exactly one preceding superpose. End with superposeend or superposeout; only superposeout makes transverse offsets and angles effective. A block has at most one RF cavity.

[Overlapping-field tutorial](#cases-superpose)

## Lattice grouping and folding {#ref-lattice}

The source describes lattice n1 n2, with n1 the number of elements in a basic lattice and n2=1; lattice_end closes it. Use current keyword definitions when writing a simulation input. The old periodic-envelope example uses a different syntax and is not a current multi-particle recipe.

The spelling sction is retained from the source. It groups editor content for folding:

```text
sction mebt
{
drift 0.05089 0.025 0
drift 0.1254 0.025 0
}
```

## Output planes {#ref-planes}

outputplane V1 writes a distribution at a relative downstream (positive) or upstream (negative) position in metres. automaticoutput V1 V2 V3 inserts equally spaced planes: first relative position, spacing and maximum span, all metres.

Verified engine restrictions: planes beyond the lattice end fail; 5 mm from the end can fail, while a 2 cm test worked. Segment generation omits planes within 5 cm of the end. The engine writes a final distribution at the endpoint.

## Input organization and simulation settings {#ref-inputs}

beam.txt describes the beam, input.txt simulation settings, and the ini.ini-selected lattice describes elements. Keywords are case-insensitive and ! begins comments. Full/error runs generate engine lattice.txt in the output inputs/ snapshot without rewriting original inputs.

The live input entries replace the original keyword table. In particular, write multithreading 1 or omit the line to disable; 0 is unsafe for this engine. The original stepPerCycle time formula is dimensionally questionable and is not reproduced as a verified equation.

meshRms dimensions are Lx=V1×2×rms_x, Ly=V2×2×rms_y and Lz=V3×2×rms_z. The source states that longitudinal periodic boundaries select FFT and set longitudinal mesh length to the bunch period; sufficient longitudinal grid points are needed. Separate boundary mode ignores lattice aperture radii and uses Boundary.txt. Secondary transport requires synchronous-particle settings.

[Multithreading](#input-multithreading)

## Beam files and Twiss convention {#ref-beam}

Current beam entries replace the original table. β is mm/mrad; ε is normalized rms emittance in π·mm·mrad. rms_x = sqrt(β_x·ε_x/(β_rel·γ)); longitudinal z′ is Δp/p. The original β unit wording is superseded by the verified convention.

For ordinary distribution import, the source states that generation keywords except numofcharge do not apply. Secondary-particle inputs still require synchronous-particle information, so this is not a universal rule for every import mode.

[Twiss parameters](#beam-twissx)

## Run lattice source {#ref-source}

The source describes content after the first start and before the first end as active. The current run filename comes from ini.ini [lattice] source and need not be lattice_mulp.txt. Opening a file for inspection does not select it for simulation.

## scanData.txt {#ref-scan-data}

Records RF phase scans or manually supplied phases. Each row gives cavity entrance phase (degrees) and entrance time (s), in lattice RF-cavity order. This is distinct from parameter-scan scan.csv.

## SeParticle.txt {#ref-secondary}

Source/schema format; secondary-particle transport was not exercised during this migration. With secondarybeam=1, ReadParticleDistribution can reference this file, one particle per row. Synchronous-particle information must still be configured in beam.txt.

```text
x y z vx vy vz charge mass weight time Kind
m m m m/s m/s m/s e MeV double s string
```

## Boundary.txt {#ref-boundary}

Source format, not independently exercised here. boundary=1 selects separate loss boundaries instead of element apertures. Lost-particle information is written to CollisionData.txt.

```text
type material Length r1 r2 RLP z0 x0 y0 θz0 θx0 θy0
int string m m m m m m m deg deg deg
```

## edst mixed distributions {#ref-edst}

Original binary specification, not byte-verified for mixed species in this migration. The source spelling esdt is corrected to edst. ReadParticleDistribution with .edst switches to mixed distributions, and distribution outputs use .edst.

```text
2×CHAR + INT(Np) + DOUBLE(Ib[mA]) + DOUBLE(freq[MHz]) + CHAR
+ (Np+1)×[9×DOUBLE(x[cm], x′[rad], y[cm], y′[rad], phi[rad], Energie[MeV], Charge[e], mc2[MeV], weight)]
+ DOUBLE(mc2[MeV])
```

The last particle is synchronous. weight is the number of real particles represented by a macroparticle. CHAR is 1 byte, INT 4, DOUBLE 8. Np is particle count; the source says Ib is not effective here. Do not infer endian conventions absent from the specification.

## inData.dst and outData_x.dst {#ref-dst}

inData.dst records the initial simulated distribution; outData_x.dst records the binary distribution at output position x. Use the inputs snapshot alongside a kept result to understand the run settings.

## DataSet.txt {#ref-dataset}

41 columns per row; indices below are zero-based. Straight-line longitudinal position is column 5 + column 33. With bends use current dataset_envelope arc accumulation. rms x/y/z are columns 16/18/20 in metres, surviving macroparticles column 28, energy column 0 in MeV. Discard an incomplete last row while reading live output.

| Index (zero-based) | Quantity |
| --- | --- |
| 0 | `mean(E_k)` |
| 1 | `mean(x)` |
| 2 | `mean(γβ_x)` |
| 3 | `mean(y)` |
| 4 | `mean(γβ_y)` |
| 5 | `mean(z)` |
| 6 | `mean(γβ_z)` |
| 7 | `α_x` |
| 8 | `α_y` |
| 9 | `α_z` |
| 10 | `β_x` |
| 11 | `β_y` |
| 12 | `β_z` |
| 13 | `Emit_x` |
| 14 | `Emit_y` |
| 15 | `Emit_z` |
| 16 | `SizeX_RMS` |
| 17 | `SizeX'_RMS` |
| 18 | `SizeY_RMS` |
| 19 | `SizeY'_RMS` |
| 20 | `SizeZ_RMS` |
| 21 | `SizeZ'_RMS` |
| 22 | `MaxX` |
| 23 | `MaxX'` |
| 24 | `MaxY` |
| 25 | `MaxY'` |
| 26 | `MaxZ` |
| 27 | `MaxZ'` |
| 28 | `N_p` |
| 29 | `x_s` |
| 30 | `γβ_xs` |
| 31 | `y_s` |
| 32 | `γβ_ys` |
| 33 | `z_s` |
| 34 | `γβ_zs` |
| 35 | `sign` |
| 36 | `dir` |
| 37 | `∆x/∆y` |
| 38 | `∆z` |
| 39 | `Index` |
| 40 | `t` |

The source defines sign=0 straight, 1 curved, 2 invalid (skip). x centroid = column 29 + column 1; the source example maximum x adds column 22. mean(...) preserves the source overbar, not a derivative; underscores denote subscripts.

## Phase.txt {#ref-phase}

Source format: two rows per RF cavity, entrance then exit, each with cavity index, time (s), position (m) and synchronous energy (MeV). Check actual filename case.

## synParticle.txt {#ref-syn-particle}

Source trajectory fields:

```text
T zs Eks xs ys γβx γβy γβz dir α
```

T is time. dir=0 along z, 1 bends toward x, 2 toward y. α is bend angle in radians.

## DynamicErrorData.txt {#ref-dynamic-errors}

The original says row 1 records initial-beam errors and subsequent rows element errors. Current Python error studies also produce Error_Datas_<group>_<repeat>.txt; distinguish sampled settings from engine outputs.

## BeamSet.plt {#ref-beamset}

Source binary layouts are preserved below. Mixed/double-beam layout has not been byte-verified in this migration. dumpPeriodicity must exceed zero for particle dumps and acceptance analysis.

```text
CHAR + CHAR + dumpPeriodicity(INT) + Np(INT)
+ Ib[mA](DOUBLE) + freq[MHz](DOUBLE) + mc2[MeV](DOUBLE)
+ Nx×[CHAR + type(INT) + Index(INT) + time[s](DOUBLE) + location[m](DOUBLE)
      + Np×[x(DOUBLE)+px(DOUBLE)+y(DOUBLE)+py(DOUBLE)+z(DOUBLE)+pz(DOUBLE)+lossFlag(INT)]]
```

For matrix tracking replace z with t and lossFlag with recordFlag. type=0 t-code or 1 z-code. p is βγ. lossFlag=1 lost, 2 passed output plane, 0 not lost; matrix recordFlag=1 surviving, 0 lost. Time/location refer to the synchronous particle for t-code and particle means for z-code. mc2 is rest energy, not kinetic energy. Index 0 is the initial distribution; check the reader for alignment with DataSet when records are absent.

The source double-beam particle record extends the six coordinates and lossFlag with particleIndex(INT), charge[e](INT), RestMass[MeV/c²](DOUBLE), weight(DOUBLE); header and step structure remain as listed.

[Acceptance workflow](#cases-acceptance)

## density {#ref-density}

Original layout; f/i denote the source float/integer notation, without an independently verified width/endian contract here.

```text
zg(f) + emit_x(f) + emit_y(f) + emit_z(f) + rms_x(f) + rms_y(f) + rms_z(f) + nownumofp(i)
+ lost(i) + maxlost(i) + minlost(i) + moy(4*f) + maxb(4*f) + minb(4*f) + maxr(4*f) + minr(4*f)
+ tab_x(i*300) + tab_y(i*300) + tab_r(i*300) + tab_z(i*300)
```

zg is longitudinal distance, emit emittance, rms envelope, nownumofp particle count, lost loss count. moy contains x/y/r/z averages. Each histogram has 300 bins spanning its minimum to maximum. Original maxb/minb/maxr/minr descriptions are ambiguous and cross maximum/minimum wording; their exact meanings remain unverified. Do not use those descriptions as verified computational definitions.

## synData.txt {#ref-syn-data}

Records synchronous-particle entrance time and energy for each element. The original lists order name length zstart tin γβ ϕs ϕRF, but its numerical labels disagree with the listed field count; no unverified index mapping is supplied here.

Verified phase relation: φRF = phase_t0 + 360·f·t_in. For a segment with entry time T_entry, phase_t0,new = φRF − 360·f·(t_in − T_entry). Use Hz, seconds and degrees; do not directly reuse an intermediate absolute phase.

## pchistogram.dat {#ref-histogram}

Original binary format, not byte-verified here. pchistogram V1=1 enables it. V2 is the number of bins spanning each coordinate's minimum/maximum.

```text
CHAR + Index(INT) + V2(INT)
+ V2×tabx(INT) + V2×taby(INT) + V2×tabr(INT) + V2×tabz(INT)
+ xmin(DOUBLE)+xmax(DOUBLE)+avex(DOUBLE)
+ ymin(DOUBLE)+ymax(DOUBLE)+avey(DOUBLE)
+ rmin(DOUBLE)+rmax(DOUBLE)+aver(DOUBLE)
+ zmin(DOUBLE)+zmax(DOUBLE)+avez(DOUBLE)
```

## SingleParticle.txt {#ref-single}

particlenumber=1 enables single-particle tracking. Fields: x/y/z (m), γβx/γβy/γβz, Ek (MeV), time (s). Multi-particle generation settings such as Twiss/current/distribution do not apply as in bunch tracking.

Verified correction: displacepos dx dy dz is read by the engine in mm, despite metres in the original manual. displacedpos dpx dpy dpz uses percent. rms columns may be NaN; interpret trajectory and survivor data instead.

## errors_par.txt {#ref-error-summary}

Original group-summary field order (m for positions/envelopes, rad for slopes, MeV for energy differences):

```text
step_err  group
ave(ratio_loss)
ave(emit_x_increase)
ave(emit_y_increase)
ave(emit_z_increase)
ave(x_center(m))
ave(y_center(m))
ave(x_'(rad))
ave(y_'(rad))
ave(rms_x(m))
ave(rms_y(m))
ave(rms_x'(rad))
ave(rms_y'(rad))
ave(delat_energy)
rms(x_center(m))
rms(y_center(m))
rms(x_'(rad))
rms(y_'(rad))
rms(rms_x(m))
rms(rms_y(m))
rms(rms_x'(rad))
rms(rms_y'(rad))
rms(delat_energy(MeV))
```

## errors_par_tot.txt {#ref-error-detail}

Original per-repeat field order. ratio_loss is lost/initial particles; emittance growth is emit(output)/emit(input)−1. Position/envelope units are m, slopes rad, energy differences MeV.

```text
step_err group and repeat
ratio_loss lost / initial particles
emit_x_increase   emit_x(output)/ emit_x(input) - 1
emit_y_increase   emit_y(output)/ emit_y(input) - 1
emit_z_increase   emit_z(output)/ emit_z(input) - 1
x_center(m)
y_center(m)
x_'(rad)
y_'(rad)
rms_x(m)
rms_y(m)
rms_x'(rad)
rms_y'(rad)
delat_energy(MeV),
alpha_xx’,
beta_xx’,
alpha_yy’,
beta_yy’,
alpha_zz’,
beta_zz’,
```
