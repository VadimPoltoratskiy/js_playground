# js_playground

A playground for JavaScript experiments and snippets.

## Requirements

- Node.js >= 20

## Setup

```bash
npm install
```

## Usage

```bash
npm start            # run src/index.js
npm start -- Ada     # → "Hello, Ada!"
```

## Testing

```bash
npm test             # run all tests (node --test)
npm run test:watch   # watch mode
```

## Structure

```
src/    source modules and experiments (entry point: src/index.js)
test/   tests, named *.test.js
```

Add an experiment as `src/<name>.js` and a matching test as
`test/<name>.test.js`. See `CLAUDE.md` for conventions.
