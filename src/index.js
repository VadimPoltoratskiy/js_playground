// Entry point for the playground.
// Run with: npm start

import { greet } from './greet.js';

const name = process.argv[2] ?? 'world';
console.log(greet(name));
