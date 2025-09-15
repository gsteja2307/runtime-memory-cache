// Quick test to verify current lastAccessedAt behavior
const RuntimeMemoryCache = require('./dist/index.js').default;

// Test FIFO cache
console.log('Testing FIFO cache lastAccessedAt behavior:');
const fifoCache = new RuntimeMemoryCache({ maxSize: 3, evictionPolicy: 'FIFO' });

// Set some values
fifoCache.set('key1', 'value1');
fifoCache.set('key2', 'value2');

// Get the internal store to check lastAccessedAt
const store = fifoCache.store || fifoCache._store;
if (!store) {
  console.log('Cannot access internal store - need to examine API');
} else {
  console.log('Initial lastAccessedAt for key1:', store.get('key1')?.lastAccessedAt);
  
  // Wait a bit, then access the key
  setTimeout(() => {
    fifoCache.get('key1');
    console.log('After get() - lastAccessedAt for key1:', store.get('key1')?.lastAccessedAt);
    
    fifoCache.has('key2');
    console.log('After has() - lastAccessedAt for key2:', store.get('key2')?.lastAccessedAt);
  }, 10);
}

// Test LRU cache
console.log('\nTesting LRU cache lastAccessedAt behavior:');
const lruCache = new RuntimeMemoryCache({ maxSize: 3, evictionPolicy: 'LRU' });

lruCache.set('key1', 'value1');
lruCache.set('key2', 'value2');

console.log('Both caches should now update lastAccessedAt on access.');