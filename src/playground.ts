import RuntimeMemoryCache from './index';

console.log('🚀 Runtime Memory Cache - Playground\n');

// Example 1: Basic usage with statistics
console.log('📊 Example 1: Basic usage with statistics');
const cache = new RuntimeMemoryCache({
  ttl: 2000,
  maxSize: 5,
  enableStats: true
});

cache.set('user:123', { name: 'John', age: 30 });
cache.set('user:456', { name: 'Jane', age: 25 });
cache.set('product:789', { title: 'Laptop', price: 999 });

console.log('User 123:', cache.get('user:123'));
console.log('User 456:', cache.get('user:456'));
console.log('Non-existent:', cache.get('user:999'));

console.log('Cache stats:', cache.getStats());
console.log('Cache size:', cache.size());
console.log('Cache keys:', cache.keys());
console.log();

// Example 2: TTL expiration
console.log('⏰ Example 2: TTL expiration');
cache.set('temp-data', 'This will expire', 1000); // 1 second TTL
console.log('Temp data (immediate):', cache.get('temp-data'));

setTimeout(() => {
  console.log('Temp data (after 1.1s):', cache.get('temp-data')); // Should be undefined
  console.log('Final stats:', cache.getStats());
}, 1100);

// Example 3: Cache eviction (FIFO)
console.log('🔄 Example 3: Cache eviction');
const smallCache = new RuntimeMemoryCache({ maxSize: 3, enableStats: true });

// Fill cache to capacity
smallCache.set('item1', 'value1');
smallCache.set('item2', 'value2');
smallCache.set('item3', 'value3');
console.log('After filling (size 3):', smallCache.keys());

// This should evict 'item1'
smallCache.set('item4', 'value4');
console.log('After adding item4:', smallCache.keys());
console.log('item1 still exists?', smallCache.has('item1')); // Should be false
console.log('Eviction stats:', smallCache.getStats());
console.log();

// Example 4: Manual cleanup
console.log('🧹 Example 4: Manual cleanup');
const cleanupCache = new RuntimeMemoryCache({ ttl: 500 });
cleanupCache.set('expire1', 'data1');
cleanupCache.set('expire2', 'data2');
cleanupCache.set('expire3', 'data3');

setTimeout(() => {
  console.log('Size before cleanup:', cleanupCache.size());
  const removed = cleanupCache.cleanup();
  console.log('Expired entries removed:', removed);
  console.log('Size after cleanup:', cleanupCache.size());
}, 600);
