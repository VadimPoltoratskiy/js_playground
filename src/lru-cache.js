/**
 * A bounded LRU (Least-Recently-Used) cache backed by a single Map.
 *
 * Map preserves insertion order, so the delete-and-reinsert idiom moves an
 * entry to the most-recently-used (MRU) end in O(1), and eviction reads the
 * least-recently-used (LRU) end via map.keys().next().value, also O(1).
 *
 * @example
 * const cache = new LRUCache(2);
 * cache.set('a', 1).set('b', 2);
 * cache.get('a'); // 1  (refreshes 'a' to MRU)
 * cache.set('c', 3); // evicts 'b' (LRU)
 */
export class LRUCache {
  #max;
  #map;

  /**
   * @param {number} maxSize - Maximum number of entries. Must be a non-negative integer.
   * @throws {TypeError} if maxSize is not a non-negative integer.
   */
  constructor(maxSize) {
    if (!Number.isInteger(maxSize) || maxSize < 0) {
      throw new TypeError(
        `LRUCache maxSize must be a non-negative integer, got ${maxSize}`,
      );
    }
    this.#max = maxSize;
    this.#map = new Map();
  }

  /** Returns the number of entries currently stored. */
  get size() {
    return this.#map.size;
  }

  /**
   * Returns the value for key and refreshes its recency, or undefined on miss.
   * A miss has no side effects.
   *
   * @param {*} key
   * @returns {*}
   */
  get(key) {
    if (!this.#map.has(key)) {
      return undefined;
    }
    const value = this.#map.get(key);
    // Move to MRU by deleting and reinserting.
    this.#map.delete(key);
    this.#map.set(key, value);
    return value;
  }

  /**
   * Stores key/value, refreshing recency. Evicts the LRU entry if the cache
   * is at capacity. Chainable — returns `this`.
   *
   * A maxSize of 0 turns every set into a no-op.
   *
   * @param {*} key
   * @param {*} value
   * @returns {this}
   */
  set(key, value) {
    if (this.#max === 0) {
      return this;
    }
    if (this.#map.has(key)) {
      // Refresh recency for existing key — no size change, no eviction.
      this.#map.delete(key);
    } else if (this.#map.size >= this.#max) {
      // Evict the least-recently-used entry (first key in insertion order).
      this.#map.delete(this.#map.keys().next().value);
    }
    this.#map.set(key, value);
    return this;
  }

  /**
   * Returns true if key is present. Pure peek — does NOT refresh recency.
   *
   * @param {*} key
   * @returns {boolean}
   */
  has(key) {
    return this.#map.has(key);
  }
}
