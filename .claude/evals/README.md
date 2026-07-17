# Evals

Lightweight, dependency-free behavior checks for the playground's modules.
Unlike the unit tests in `test/` (which assert internal correctness), these
evals describe expected *behavior* as data — easy to extend and to reason
about at a glance.

## Layout

```
.claude/evals/
├── run.js            # the runner (plain Node, no deps)
├── cases/            # one JSON file per module under eval
│   └── greet.json
└── README.md
```

## Run

```bash
node .claude/evals/run.js
```

Exit code is non-zero if any case fails, so it works in CI too.

## Case format

Each file in `cases/` targets one module in `src/` and one exported function:

```json
{
  "module": "greet.js",
  "export": "greet",
  "cases": [
    { "name": "basic",  "args": ["Ada"], "expect": "Hello, Ada!" },
    { "name": "empty",  "args": [""],     "throws": true }
  ]
}
```

- `args`    — arguments passed to the function.
- `expect`  — deep-equal expected return value.
- `throws`  — set `true` if the call is expected to throw (then `expect` is ignored).

Add a new module's evals by dropping another JSON file in `cases/`.
