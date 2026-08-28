import assert from 'node:assert/strict';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const count = 200;
const started = performance.now();
const responses = await Promise.all(Array.from({ length: count }, () => fetch(`${baseURL}/health`)));
const elapsedSeconds = (performance.now() - started) / 1000;
assert.equal(responses.filter((response) => response.ok).length, count);
const rate = Math.round(count / elapsedSeconds);
assert.ok(rate >= 100, `Expected at least 100 requests/second, measured ${rate}`);
console.log(`Load smoke passed: ${count} health requests at ${rate} requests/second.`);
