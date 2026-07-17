import { test } from 'node:test';
import assert from 'node:assert/strict';

import { greet } from '../src/greet.js';

test('greets a given name', () => {
  assert.equal(greet('Ada'), 'Hello, Ada!');
});

test('throws on empty name', () => {
  assert.throws(() => greet(''), TypeError);
});

test('throws on non-string input', () => {
  assert.throws(() => greet(42), TypeError);
});
