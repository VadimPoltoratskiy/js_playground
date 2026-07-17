import { test } from 'node:test';
import assert from 'node:assert/strict';

import { LRUCache } from '../src/lru-cache.js';

// ---------------------------------------------------------------------------
// AC-1: new cache is empty
// ---------------------------------------------------------------------------
test('AC-1: new cache is empty', () => {
  const cache = new LRUCache(3);
  assert.strictEqual(cache.size, 0);
  assert.strictEqual(cache.get('x'), undefined);
});

// ---------------------------------------------------------------------------
// AC-2: invalid maxSize throws TypeError
// ---------------------------------------------------------------------------
test('AC-2: invalid maxSize throws TypeError', () => {
  assert.throws(() => new LRUCache(-1), TypeError);
  assert.throws(() => new LRUCache(1.5), TypeError);
  assert.throws(() => new LRUCache(NaN), TypeError);
  assert.throws(() => new LRUCache('3'), TypeError);
  assert.throws(() => new LRUCache(null), TypeError);
});

// ---------------------------------------------------------------------------
// AC-3: set new key stores entry and returns cache for chaining
// ---------------------------------------------------------------------------
test('AC-3: set new key stores entry and returns cache for chaining', () => {
  const cache = new LRUCache(3);
  const ret = cache.set('a', 1);
  assert.ok(ret === cache, 'set must return the cache instance');
  assert.strictEqual(cache.size, 1);
  assert.strictEqual(cache.get('a'), 1);
});

// ---------------------------------------------------------------------------
// AC-4: set existing key updates value without growing size
// ---------------------------------------------------------------------------
test('AC-4: set existing key updates value without growing size', () => {
  const cache = new LRUCache(3);
  cache.set('a', 1);
  cache.set('a', 2);
  assert.strictEqual(cache.get('a'), 2);
  assert.strictEqual(cache.size, 1);
});

// ---------------------------------------------------------------------------
// AC-5: set new key at capacity evicts LRU entry
// ---------------------------------------------------------------------------
test('AC-5: set new key at capacity evicts LRU entry', () => {
  const cache = new LRUCache(2);
  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3); // 'a' is LRU — should be evicted
  assert.strictEqual(cache.size, 2);
  assert.strictEqual(cache.has('a'), false);
  assert.strictEqual(cache.has('b'), true);
  assert.strictEqual(cache.has('c'), true);
});

// ---------------------------------------------------------------------------
// AC-6: get hit returns value
// ---------------------------------------------------------------------------
test('AC-6: get hit returns value', () => {
  const cache = new LRUCache(2);
  cache.set('a', 1);
  cache.set('b', 2);
  assert.strictEqual(cache.get('a'), 1);
});

// ---------------------------------------------------------------------------
// AC-7: get miss returns undefined without mutation
// ---------------------------------------------------------------------------
test('AC-7: get miss returns undefined without mutation', () => {
  const cache = new LRUCache(3);
  const result = cache.get('missing');
  assert.strictEqual(result, undefined);
  assert.strictEqual(cache.size, 0);
});

// ---------------------------------------------------------------------------
// AC-8: get refreshes recency — got entry is not evicted on overflow
// ---------------------------------------------------------------------------
test('AC-8: get refreshes recency — got entry is not evicted on overflow', () => {
  const cache = new LRUCache(2);
  cache.set('a', 1);
  cache.set('b', 2);
  // Access 'a' to refresh it — now 'b' is the LRU.
  cache.get('a');
  cache.set('c', 3); // should evict 'b', not 'a'
  assert.strictEqual(cache.has('b'), false);
  assert.strictEqual(cache.has('a'), true);
  assert.strictEqual(cache.has('c'), true);
});

// ---------------------------------------------------------------------------
// AC-9: has does not refresh recency (pure peek)
// ---------------------------------------------------------------------------
test('AC-9: has does not refresh recency (pure peek)', () => {
  const cache = new LRUCache(2);
  cache.set('a', 1);
  cache.set('b', 2);
  // has('a') must NOT refresh 'a' — 'a' must remain the LRU.
  cache.has('a');
  cache.set('c', 3); // if has were mutating, 'b' would be LRU; if pure peek, 'a' is LRU
  assert.strictEqual(cache.has('a'), false); // 'a' was evicted (still LRU)
  assert.strictEqual(cache.has('b'), true);  // 'b' survived
});

// ---------------------------------------------------------------------------
// AC-10: size stays within [0, maxSize]
// ---------------------------------------------------------------------------
test('AC-10: size stays within [0, maxSize]', () => {
  const cache = new LRUCache(2);
  assert.strictEqual(cache.size, 0);
  cache.set('a', 1);
  assert.strictEqual(cache.size, 1);
  cache.set('b', 2);
  assert.strictEqual(cache.size, 2);
  cache.set('c', 3); // eviction keeps size at maxSize
  assert.strictEqual(cache.size, 2);
});

// ---------------------------------------------------------------------------
// AC-11: maxSize 0 is always empty
// ---------------------------------------------------------------------------
test('AC-11: maxSize 0 is always empty', () => {
  const cache = new LRUCache(0);
  cache.set('a', 1);
  assert.strictEqual(cache.size, 0);
  assert.strictEqual(cache.get('a'), undefined);
  assert.strictEqual(cache.has('a'), false);
});

// ---------------------------------------------------------------------------
// AC-12: maxSize 1 retains only the latest entry
// ---------------------------------------------------------------------------
test('AC-12: maxSize 1 retains only the latest entry', () => {
  const cache = new LRUCache(1);
  cache.set('a', 1);
  cache.set('b', 2); // evicts 'a'
  assert.strictEqual(cache.has('a'), false);
  assert.strictEqual(cache.has('b'), true);
  assert.strictEqual(cache.size, 1);
});

// ---------------------------------------------------------------------------
// AC-13: stored undefined is distinguishable from a miss via has
// ---------------------------------------------------------------------------
test('AC-13: stored undefined is distinguishable from a miss via has', () => {
  const cache = new LRUCache(3);
  cache.set('a', undefined);
  assert.strictEqual(cache.has('a'), true);
  assert.strictEqual(cache.get('a'), undefined);
  // Absent key
  assert.strictEqual(cache.has('b'), false);
});

// ---------------------------------------------------------------------------
// AC-14: updating existing key at full capacity does not evict
// ---------------------------------------------------------------------------
test('AC-14: updating existing key at full capacity does not evict', () => {
  const cache = new LRUCache(2);
  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('a', 9); // update existing — must NOT evict 'b'
  assert.strictEqual(cache.size, 2);
  assert.strictEqual(cache.has('a'), true);
  assert.strictEqual(cache.has('b'), true);
  assert.strictEqual(cache.get('a'), 9);
});

// ---------------------------------------------------------------------------
// AC-15: prototype-property key names are treated as ordinary keys
// ---------------------------------------------------------------------------
test('AC-15: prototype-property key names are treated as ordinary keys', () => {
  const cache = new LRUCache(5);
  cache.set('__proto__', 1);
  cache.set('constructor', 2);
  cache.set('prototype', 3);
  cache.set('x', 4);
  assert.strictEqual(cache.get('__proto__'), 1);
  assert.strictEqual(cache.get('constructor'), 2);
  assert.strictEqual(cache.get('prototype'), 3);
  assert.strictEqual(cache.get('x'), 4);
  assert.strictEqual(cache.size, 4);
});

// ---------------------------------------------------------------------------
// AC-16: key identity uses Map SameValueZero (objects and NaN)
// ---------------------------------------------------------------------------
test('AC-16: key identity uses Map SameValueZero (objects and NaN)', () => {
  const k1 = {};
  const k2 = {};
  const cache = new LRUCache(5);
  cache.set(k1, 1);
  cache.set(k2, 2);
  assert.strictEqual(cache.get(k1), 1);
  assert.strictEqual(cache.get(k2), 2);
  assert.strictEqual(cache.size, 2);

  // NaN as key — Map uses SameValueZero so NaN === NaN in Map lookups.
  cache.set(NaN, 'nan-val');
  assert.strictEqual(cache.get(NaN), 'nan-val');
  assert.strictEqual(cache.has(NaN), true);
  assert.strictEqual(cache.size, 3);
});
