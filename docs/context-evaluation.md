# Context evaluation

Use this protocol to compare Mux's existing prompt-only workflow with explicit context. No baseline results are claimed here.

1. Collect 20 real tasks from the projects and users you intend to support. Include bug fixes, explanation, tests, refactoring and cross-file changes. Remove credentials and private data from any shared records.
2. Define acceptance checks before running each task, including relevant test commands and any constraints. Reserve some tasks for later confirmation rather than adjusting the workflow to all 20 at once.
3. Run each task twice from equivalent clean checkouts, using the same provider, model and settings. Randomize whether the prompt-only or context-assisted run goes first. For the assisted run, supply a reviewed task brief and selected files. Keep the original task request identical.
4. A reviewer blinded to the variant checks task completion and records failed checks, corrective turns, elapsed time and provider-reported usage when available. Record provider failures separately from task failures.
5. Compare paired outcomes, inspect failure cases, and repeat promising changes on the reserved tasks. Report the sample size and do not interpret token totals as remaining context-window capacity.

Suggested record per run: task ID, checkout revision, provider and model, variant, selected file paths and hashes, task brief version, acceptance result, failed checks, corrective turns, elapsed time, token usage if reported, and reviewer notes. Record actual outcomes; do not fabricate benchmark numbers.
