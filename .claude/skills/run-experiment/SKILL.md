---
name: run-experiment
description: Run a single experiment file from src/ and show its output. Use when the user wants to execute one snippet/module directly (e.g. "run greet", "run src/foo.js") instead of the whole app or test suite.
---

# Run experiment

Execute one file under `src/` and report its output.

## Steps

1. Resolve the target file:
   - If the user gives a path, use it.
   - If they give a bare name (e.g. `greet`), resolve to `src/<name>.js`.
   - If unclear, list `src/*.js` and ask which one.
2. Run it with Node, passing through any extra args the user provided:
   ```bash
   node src/<name>.js [args...]
   ```
3. If the file exports functions but has no top-level output (nothing logged),
   run a quick one-off instead so there's something to see:
   ```bash
   node --input-type=module -e "import('./src/<name>.js').then(m => console.log(Object.keys(m)))"
   ```
   and report the exported names.
4. Show stdout/stderr and the exit code. On error, quote the stack and point
   at the file:line.

## Notes

- ES modules only. Node >= 20.
- Don't install anything or modify source to make it run — just run it.
