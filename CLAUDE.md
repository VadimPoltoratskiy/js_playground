# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository.

## What this is

A JavaScript playground — a place to drop experiments, snippets, and small
modules. Code lives in `src/`, tests live in `test/`. ES modules (`"type":
"module"`) and modern Node.js are assumed.

## Layout

```
js_playground/
├── src/           # source: modules and experiments
│   ├── index.js   # entry point (npm start)
│   └── greet.js   # example module
├── test/          # tests, named *.test.js (node:test runner)
├── .claude/       # Claude Code config
│   ├── settings.json
│   ├── agents/    # test-runner, experiment-scaffolder
│   ├── skills/    # run-experiment
│   └── evals/     # behavior evals + runner (npm run eval)
├── package.json   # scripts, deps, engines
└── CLAUDE.md
```

## .claude assets

- **Agents** (`.claude/agents/`): `test-runner` (run + diagnose tests),
  `experiment-scaffolder` (create `src/` + `test/` pair for a new experiment).
- **Skills** (`.claude/skills/`): `run-experiment` — run a single file from `src/`.
- **Evals** (`.claude/evals/`): data-driven behavior checks. `npm run eval`
  runs every `cases/*.json` against the matching `src/` module. See
  `.claude/evals/README.md` to add cases.

## Requirements

- Node.js >= 20 (uses the built-in `node:test` runner and ESM).
- No runtime dependencies. Dev tooling only (eslint, prettier).

## Commands

```bash
npm install       # install dev dependencies
npm start         # run src/index.js  (npm start -- Ada  → "Hello, Ada!")
npm test          # run all tests in test/ via node --test
npm run test:watch# re-run tests on change
npm run eval      # run behavior evals (.claude/evals)
npm run lint      # eslint
npm run format    # prettier --write
```

## Conventions

- ES modules only (`import`/`export`), no CommonJS `require`.
- Each experiment is its own file under `src/`; give it a matching
  `*.test.js` under `test/`.
- Keep modules small and side-effect free so they're easy to test and import.
- Prefer the standard library (`node:test`, `node:assert`) over adding deps.

## Adding an experiment

1. Create `src/my-thing.js` exporting the thing.
2. Create `test/my-thing.test.js` importing from `../src/my-thing.js`.
3. `npm test` to verify.
