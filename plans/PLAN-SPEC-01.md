# Plan: LRU Cache Experiment Module

## Spec reference
`/Users/vpolto/Public/Neoversity_AI_Agentic_Engineering/js_playground/specs/SPEC-01-lru-cache.md`

## Execution mode: single-agent

This is a self-contained, two-file module with no surface overlap (no backend/frontend
split, no schema migration). One implementer runs both tasks sequentially: source first,
tests second.

## Goal

Add a bounded LRU key/value cache as a self-contained experiment module under `src/`,
matching the playground's conventions (ES modules, `node:test`/`node:assert`, no runtime
dependencies). The cache evicts the least-recently-used entry on overflow; only `get` and
`set` refresh recency; `has` is a non-mutating peek; `set` is chainable; a max-size of 0
is valid and produces an always-empty cache.

## Components affected

- `src/lru-cache.js` — new module: the `LRUCache` class
- `test/lru-cache.test.js` — new test file: 16 AC-mapped test cases

## Engineering Insights applied

No `INSIGHTS.md` files exist in this repository yet. Patterns are derived from the
existing `greet` module and the skills preloaded into this agent:

- **Validation throws `TypeError`** — matches the `greet` module (`src/greet.js:9–11`),
  which throws `TypeError` for invalid input rather than returning a sentinel.
- **Named class export** — the module exports a named `LRUCache` class (not a default),
  consistent with how `greet.js` uses named function exports and with the ES-modules-only
  convention in CLAUDE.md.
- **Private class fields (`#`)** — internal state (`#max`, `#map`) is encapsulated with
  private fields so callers cannot mutate the Map directly, preventing accidental bypass
  of recency tracking.
- **Prototype-pollution safety via `Map`** — using a `Map` for key/value storage means
  keys like `"__proto__"`, `"constructor"`, and `"prototype"` are stored as ordinary Map
  keys using SameValueZero equality, with no interaction with `Object.prototype`. This
  directly satisfies AC-15 and the security skill's "Prototype pollution" guidance without
  any extra sanitization step.
- **No Zod needed** — all inputs are opaque in-process values; the only structured
  validation is the constructor's integer check (`Number.isInteger`), done inline with a
  thrown `TypeError`. A Zod schema would add a runtime dependency, which CLAUDE.md
  prohibits.

## Recommendations

- **Use `Map` insertion-order trick instead of a doubly-linked list.** JavaScript's `Map`
  preserves insertion order. To move a key to "most recently used", delete it and
  re-insert it — the key migrates to the end of the iteration order. Evict by reading
  `map.keys().next().value` (the oldest inserted key = LRU). All operations remain
  amortized O(1) with a single data structure, no pointer bookkeeping, and no helper
  nodes — matching the spec's O(1) performance expectation at far lower implementation
  complexity than a doubly-linked list + separate hash map. This is the recommended
  approach.

## Architecture decisions

- **Single `Map` for O(1) LRU** — `Map` preserves insertion order and supports O(1)
  `.has()`, `.get()`, `.set()`, `.delete()`, and `.keys().next()`. The delete-and-reinsert
  idiom moves any entry to MRU in O(1). Eviction reads the first `Map` key in O(1). No
  auxiliary data structure is needed.
- **Private fields `#max` / `#map`** — prevent callers from reaching into the Map to
  bypass recency logic or reading the raw max. Aligns with side-effect-free module
  guidance in CLAUDE.md.
- **`set` returns `this`** — confirmed by the user (resolved clarification 2). This does
  not appear in any spec AC but is part of the service contract; one dedicated test
  asserts the return value.
- **`has` does not mutate** — confirmed by the user (resolved clarification 1), matching
  AC-9. Implemented as a plain `Map.has()` call with no delete/reinsert.
- **Max 0 is valid** — confirmed by the user (resolved clarification 3), matching AC-11.
  The constructor allows 0; `set` is an early-return no-op when `#max === 0`.
- **Validation uses `Number.isInteger(n) && n >= 0`** — rejects negatives, fractions,
  `NaN`, and non-numbers in one expression, matching AC-2 and the `greet` TypeError
  pattern.

## Tasks

### Task 1 — Source module: `src/lru-cache.js`

- [ ] Create `src/lru-cache.js` as an ES module (`export class LRUCache`).
- [ ] Add private field `#max` (integer, set in constructor) and `#map` (a `new Map()`).
- [ ] **Constructor** `constructor(maxSize)`:
  - Validate: `if (!Number.isInteger(maxSize) || maxSize < 0)` throw `new TypeError(...)`.
  - Assign `this.#max = maxSize; this.#map = new Map();`.
- [ ] **`get size()`** read-only getter: `return this.#map.size;`
- [ ] **`get(key)`** method:
  - If `!this.#map.has(key)` return `undefined` (no side effect).
  - Else: read `const value = this.#map.get(key)`, delete the key, re-insert it
    (`this.#map.set(key, value)`) to move it to MRU, then return `value`.
- [ ] **`set(key, value)`** method (chainable — must return `this`):
  - If `this.#max === 0` return `this` immediately (always-empty cache, AC-11).
  - If `this.#map.has(key)`: delete then re-insert with new value (refresh recency,
    no size change, no eviction — AC-4, AC-14).
  - Else (new key): if `this.#map.size >= this.#max`, evict LRU via
    `this.#map.delete(this.#map.keys().next().value)` — AC-5.
    Then `this.#map.set(key, value)`.
  - Return `this`.
- [ ] **`has(key)`** method: `return this.#map.has(key);` — pure peek, no mutation (AC-9).
- [ ] Keep the module small and side-effect free: no top-level code beyond the class export.

### Task 2 — Tests: `test/lru-cache.test.js`

Create `test/lru-cache.test.js` using `node:test` and `node:assert/strict`. Each test
block maps directly to one or more ACs. Use `assert.strictEqual`, `assert.throws`, and
`assert.ok` — no external assertion library.

- [ ] **AC-1** `'AC-1: new cache is empty'`
  - `new LRUCache(3)`: assert `size === 0` and `get('x') === undefined`.

- [ ] **AC-2** `'AC-2: invalid maxSize throws TypeError'`
  - Assert `new LRUCache(-1)`, `new LRUCache(1.5)`, `new LRUCache(NaN)`,
    `new LRUCache('3')`, `new LRUCache(null)` each throw `TypeError`.

- [ ] **AC-3 + chaining** `'AC-3: set new key stores entry and returns cache for chaining'`
  - `cache(3)`, call `const ret = cache.set('a', 1)`: assert `ret === cache` (chaining).
  - Assert `size === 1` and `get('a') === 1`.

- [ ] **AC-4** `'AC-4: set existing key updates value without growing size'`
  - `cache(3)`, `set('a',1)`, `set('a',2)`: assert `get('a') === 2`, `size === 1`.

- [ ] **AC-5** `'AC-5: set new key at capacity evicts LRU entry'`
  - `cache(2)`, `set('a',1)`, `set('b',2)`, `set('c',3)`:
    assert `size === 2`, `has('a') === false`, `has('b') === true`, `has('c') === true`.

- [ ] **AC-6** `'AC-6: get hit returns value'`
  - `cache(2)`, `set('a',1)`, `set('b',2)`, assert `get('a') === 1`.

- [ ] **AC-7** `'AC-7: get miss returns undefined without mutation'`
  - `cache(3)`, `get('missing')`: assert result `=== undefined`, `size === 0`.

- [ ] **AC-8** `'AC-8: get refreshes recency — got entry is not evicted on overflow'`
  - `cache(2)`, `set('a',1)`, `set('b',2)`, `get('a')` (refreshes a → b is now LRU),
    `set('c',3)`: assert `has('b') === false`, `has('a') === true`, `has('c') === true`.

- [ ] **AC-9** `'AC-9: has does not refresh recency (pure peek)'`
  - `cache(2)`, `set('a',1)`, `set('b',2)`.
  - Call `has('a')` — must NOT refresh a's recency.
  - `set('c',3)`: if has were mutating, b would be evicted; if pure peek, a is evicted.
  - Assert `has('a') === false` (a evicted) and `has('b') === true` (b survived).

- [ ] **AC-10** `'AC-10: size stays within [0, maxSize]'`
  - `cache(2)`: assert size at 0, after first set at 1, after second at 2, after third
    still at 2 (eviction kept it bounded).

- [ ] **AC-11** `'AC-11: maxSize 0 is always empty'`
  - `cache(0)`, `set('a',1)`: assert `size === 0`, `get('a') === undefined`,
    `has('a') === false`.

- [ ] **AC-12** `'AC-12: maxSize 1 retains only the latest entry'`
  - `cache(1)`, `set('a',1)`, `set('b',2)`:
    assert `has('a') === false`, `has('b') === true`, `size === 1`.

- [ ] **AC-13** `'AC-13: stored undefined is distinguishable from a miss via has'`
  - `cache(3)`, `set('a', undefined)`:
    assert `has('a') === true`, `get('a') === undefined`.
  - For absent `'b'`: assert `has('b') === false`.

- [ ] **AC-14** `'AC-14: updating existing key at full capacity does not evict'`
  - `cache(2)`, `set('a',1)`, `set('b',2)`, `set('a',9)`:
    assert `size === 2`, `has('a') === true`, `has('b') === true`, `get('a') === 9`.

- [ ] **AC-15** `'AC-15: prototype-property key names are treated as ordinary keys'`
  - `cache(5)`, `set('__proto__',1)`, `set('constructor',2)`, `set('prototype',3)`,
    `set('x',4)`:
    assert `get('__proto__') === 1`, `get('constructor') === 2`,
    `get('prototype') === 3`, `get('x') === 4`, `size === 4`.

- [ ] **AC-16** `'AC-16: key identity uses Map SameValueZero (objects and NaN)'`
  - Two distinct object keys: `const k1 = {}, k2 = {}`. `cache(5)`, `set(k1,1)`,
    `set(k2,2)`: assert `get(k1) === 1`, `get(k2) === 2`, `size === 2`.
  - `NaN` as key: `set(NaN,'nan-val')`: assert `get(NaN) === 'nan-val'`,
    `has(NaN) === true`, `size === 3`.

### Task 3 — Verify

- [ ] Run `npm test` from the repo root and confirm all tests pass (zero failures, zero
  skipped).
- [ ] Optionally run `npm run lint` — the module uses only standard JS so no lint errors
  are expected.

## Gotchas

- **`Map.keys().next().value` is the LRU end** — `Map` iterates in insertion order;
  the key inserted earliest (and never re-inserted since) is always first. Do not confuse
  "first in iteration" with MRU — it is the LRU.
- **`NaN` key uniqueness** — `Map` treats `NaN === NaN` (SameValueZero), so two `set(NaN,
  ...)` calls update the same entry. This is different from `NaN !== NaN` in normal JS
  equality. The test must verify only one entry is stored.
- **`undefined` as a stored value** — `Map.get(key)` returns `undefined` for both an
  absent key and a key stored with value `undefined`. The `has` check is the only way to
  distinguish them; the implementation must never short-circuit on the stored value.
- **Private fields are not inherited** — the class uses `#max` and `#map`. If a caller
  tries to subclass `LRUCache` and access these fields, a `TypeError` is thrown by the
  engine. This is intentional and consistent with the "side-effect free" convention.
- **`node --test` auto-discovers files** — `npm test` runs `node --test`, which scans
  `test/*.test.js`. No test runner configuration file is needed; just placing the file in
  `test/` is sufficient.
- **No `plans/` directory existed** — the `plans/` directory was created as part of
  producing this plan; it should be committed alongside `PLAN-SPEC-01.md`.

## Definition of done

- [ ] `npm test` passes with zero failures and zero skipped tests.
- [ ] `npm run lint` exits cleanly (no ESLint errors).
- [ ] AC-1 — cache created with maxSize >= 0 initializes with size 0.
- [ ] AC-2 — invalid maxSize (-1, 1.5, NaN, non-number) throws `TypeError`.
- [ ] AC-3 — `set` of a new key stores the entry and increases size by 1; `set` returns
  the cache instance.
- [ ] AC-4 — `set` of an existing key updates the value and leaves size unchanged.
- [ ] AC-5 — `set` of a new key at full capacity evicts exactly the LRU entry.
- [ ] AC-6 — `get` of a present key returns the stored value.
- [ ] AC-7 — `get` of an absent key returns `undefined` without mutation.
- [ ] AC-8 — `get` refreshes recency, protecting the accessed entry from eviction ahead
  of an older untouched entry.
- [ ] AC-9 — `has` does not refresh recency (pure peek); the LRU entry after a `has` call
  is the same as if `has` had not been called.
- [ ] AC-10 — `size` is always an integer in [0, maxSize].
- [ ] AC-11 — maxSize 0 is valid; `set` is always a no-op; size stays 0.
- [ ] AC-12 — maxSize 1 retains only the single most-recently-used entry.
- [ ] AC-13 — a key stored with value `undefined` reports `has` as `true` while `get`
  returns `undefined`; distinguishable from an absent key.
- [ ] AC-14 — updating an existing key at full capacity evicts no entry.
- [ ] AC-15 — `"__proto__"`, `"constructor"`, `"prototype"` behave as ordinary distinct
  keys.
- [ ] AC-16 — two distinct object references are distinct keys; `NaN` is a single usable
  key.
