// Basic benchmarking for RuntimeMemoryCache
const { RuntimeMemoryCache } = require('./dist/index.js');
const fs = require('fs');

function hrtimeMs(start) {
  const diff = process.hrtime(start);
  return diff[0] * 1000 + diff[1] / 1e6;
}

function logBoth(...args) {
  const msg = args.join(' ') + '\n';
  process.stdout.write(msg);
  fs.appendFileSync('bench-results.txt', msg);
}

const cache = new RuntimeMemoryCache({ maxSize: 1_000_000, ttl: 60000 });
const N = 500_000;

fs.writeFileSync('bench-results.txt', ''); // Clear file at start

logBoth('Benchmark: set() x', N);
let start = process.hrtime();
for (let i = 0; i < N; i++) {
  cache.set('key' + i, i);
}
logBoth('set() time:', hrtimeMs(start).toFixed(2), 'ms');

logBoth('Benchmark: get() x', N);
start = process.hrtime();
let sum = 0;
for (let i = 0; i < N; i++) {
  sum += cache.get('key' + i);
}
logBoth('get() time:', hrtimeMs(start).toFixed(2), 'ms');

logBoth('Benchmark: has() x', N);
start = process.hrtime();
let found = 0;
for (let i = 0; i < N; i++) {
  if (cache.has('key' + i)) found++;
}
logBoth('has() time:', hrtimeMs(start).toFixed(2), 'ms');

logBoth('Benchmark: del() x', N);
start = process.hrtime();
for (let i = 0; i < N; i++) {
  cache.del('key' + i);
}
logBoth('del() time:', hrtimeMs(start).toFixed(2), 'ms');

logBoth('Done.');
