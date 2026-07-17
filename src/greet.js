// A tiny example module so there's something to import and test.

/**
 * Build a friendly greeting.
 * @param {string} name - who to greet
 * @returns {string}
 */
export function greet(name) {
  if (typeof name !== 'string' || name.trim() === '') {
    throw new TypeError('name must be a non-empty string');
  }
  return `Hello, ${name}!`;
}
