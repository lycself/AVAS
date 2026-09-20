# AVAS user manual

Keep this manual open while working. Drag the title bar to move it or its edges to resize it. Maximize and restore using the title buttons; press Esc to close. Reopening restores the default position and size. Search filters chapter titles and content; select a contents entry to jump to it. The manual follows the interface language.

## Quick start

1. Open a project or create one from the File menu. For a first run, work on a copy of examples/hwr010.
2. Check the beam energy, particle count and distribution, then the lattice, field maps and simulation settings.
3. Confirm the file marked for simulation in the Lattice page, save changes and start the run.
4. Follow progress, logs and live envelopes in Run; inspect plots and phase space in Results afterwards.
5. Keep the completed run in the run records before starting another calculation if you need its results.

## Projects and input files

ini.ini defines the project inputs and outputs. InputFile holds beam, settings, lattice and field-map files; OutputFile holds the latest full run. The lattice/source setting selects the simulation lattice; its filename is not necessarily lattice_mulp.txt.

Use the File menu or project switcher to open another project. Unsaved changes are checked before switching or closing. Files supports viewing, importing, duplicating, renaming and recycling input files.

Inputs are read-only during a run. You can still inspect files and results.

## Beam settings

Use Beam to configure energy, current, particle count and distribution. Saving updates beam.txt while retaining unmanaged keywords and comments. Ctrl+Z and Ctrl+Y undo and redo changes.

The beam reference entries below provide keyword meanings, units and choices. Prepare any external distribution file before using it and check that the distribution and particle count suit the study.

## Lattice editing

The file selector opens a lattice for viewing or editing. Use the separate Set as run lattice button to choose the simulation input.

Text + Structure shows the text and physical parameter panels together. Select an element to inspect its parameters, position and diagnostics. Text, structure and visual edits share one source and undo history.

Visual mode starts in read-only browsing. Enter editing before changing elements or parameters. Finishing with unsaved changes offers save, discard this editing session or continue editing. TraceWin .dat files are currently read-only.

The top-left controls in 2D and 3D zoom and fit the view. Double-click the 2D view to fit all; in 3D, double-click empty space to fit all or an element to focus it. Manual 3D zoom stops roaming and bunch following.

## Simulation settings

Settings manages simulation options in input.txt with undo and redo. See the input reference entries for individual fields.

CPU multithreading writes multithreading 1 when enabled and removes the line when disabled. Do not manually write multithreading 0: the engine loses all particles at the start with that value.

Resolve lattice errors and missing field maps before running. The linear envelope preview is a quick estimate; use engine results for final conclusions.

## Running and keeping results

Only one task can run at a time. Starting checks and saves modified pages. If the previous completed result has not been kept, choose Keep and run, Run directly or Cancel.

Pause suspends the process; resume continues it and stop ends it. Inputs remain read-only while paused. Full runs use the inputs snapshot in the output directory without rewriting original inputs.

A full run overwrites OutputFile. Keeping a run copies its results and input snapshot into a separate Runs directory. Completed records can be replayed; unwanted records can be recycled.

Segment runs write under Segments without replacing full-run results. Use the segment workflow for the required RF phase conversion.

## Live envelopes and replay

Run shows the current live envelope and can replay it after completion. Replay on a run record selects a historical result. A new run switches back to the current calculation.

Lattice replays the last run against the edited lattice, so results may be outdated after edits. Last-run curves start hidden and appear when replay begins. The × to the left of a legend item hides its curve.

The bunch and particle cloud are illustrations based on rms envelopes, not actual particle distributions. Comparison with the preceding run is off by default. Animation follows View > Motion settings.

## Parameter scans

Choose a lattice element parameter or a beam.txt / input.txt keyword, supply values and start the scan. Each value runs on an input copy without replacing original inputs or the full-run result.

Follow the table, curve and run status. Results live under Scans, with a run_NNN directory per value and scan.json / scan.csv summaries. A normal run cannot start during a scan.

## Results analysis

Choose the latest output, a kept run, a segment result or another output directory in Results, then select plots or phase-space views. Interactive zoom and figure export are available.

Compare runs overlays the same quantity from multiple runs. Check units, inputs and coordinate ranges before comparing. Multithreaded simulations can differ slightly; output need not be byte-identical.

Replay lives in Run; Results is for analysis. NaN rms columns can be normal for a single-particle calculation; check surviving particles and logs as well.

## AI assistant

Open the assistant with Ctrl+Shift+A and configure an OpenAI-compatible endpoint or local model. API keys are stored in Windows Credential Manager. Use a local model service when data must remain on your machine.

The assistant can read the project, explain results and run trials on copies. Project changes appear as proposals applied after approval, unless automatic application is enabled for the conversation. Changes are backed up and can be undone.

Trials write under .avas_ai/runs without changing InputFile or OutputFile. Modification proposals are refused while project inputs are locked; request them again after the run.

## Troubleshooting

### Missing field maps or lattice errors

Check referenced files, names and paths, then resolve the Lattice diagnostics before running.

### All particles lost at the start

First check for multithreading 0, then inspect beam settings, apertures, field maps and logs. Remove the keyword line to disable multithreading.

### Source changes do not appear in the desktop executable

Packaged executables need rebuilding after source changes. Users of release packages do not need Node.js or Word.


## Further help

[Cases and verification conditions](#cases-setup) · [Parameters and files](#reference-home) · [Acceptance](#cases-acceptance)

## Error studies

Choose static, dynamic or combined errors and a seed in Settings. Configure err_step, amplitudes and enable commands in the lattice, then save and run. Results are stored in error_output.

[Error tutorial](#cases-errors)
