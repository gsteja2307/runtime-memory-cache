import RuntimeMemoryCache from './index';

console.log('🚀 Runtime Memory Cache - Playground\n');

// Example 1: Basic usage with statistics and memory tracking
console.log('📊 Example 1: Basic usage with statistics and memory tracking');
const cache = new RuntimeMemoryCache({
  ttl: 2000,
  maxSize: 5,
  enableStats: true
});

cache.set('user:123', { name: 'John', age: 30, email: 'john@example.com' });
cache.set('user:456', { name: 'Jane', age: 25, email: 'jane@example.com' });
cache.set('product:789', { title: 'Laptop', price: 999, description: 'High-performance laptop' });

console.log('User 123:', cache.get('user:123'));
console.log('User 456:', cache.get('user:456'));
console.log('Non-existent:', cache.get('user:999'));

const stats = cache.getStats();
console.log('Cache stats:', stats);
// console.log('Memory usage:', cache.getMemoryUsage());
console.log('Cache size:', cache.size());
console.log('Cache keys:', cache.keys());
console.log('Eviction policy:', cache.getEvictionPolicy());
console.log();

// Example 2: Error handling and validation
console.log('🚨 Example 2: Error handling and validation');
try {
  cache.set('', 'empty key'); // Should throw error
} catch (error) {
  console.log('Error caught (empty key):', (error as Error).message);
}

try {
  cache.set('a'.repeat(1001), 'too long key'); // Should throw error
} catch (error) {
  console.log('Error caught (long key):', (error as Error).message);
}

try {
  cache.set('valid-key', 'value', -100); // Should throw error
} catch (error) {
  console.log('Error caught (negative TTL):', (error as Error).message);
}

// Test graceful handling in get/has/del operations
console.log('Get with empty key:', cache.get('')); // Should return undefined
console.log('Has with empty key:', cache.has('')); // Should return false
console.log('Del with empty key:', cache.del('')); // Should return false
console.log();

// Example 3: TTL expiration
console.log('⏰ Example 3: TTL expiration');
cache.set('temp-data', 'This will expire', 1000); // 1 second TTL
console.log('Temp data (immediate):', cache.get('temp-data'));

setTimeout(() => {
  console.log('Temp data (after 1.1s):', cache.get('temp-data')); // Should be undefined
  console.log('Final stats after expiration:', cache.getStats());
}, 1100);

// Example 4: FIFO Cache eviction
console.log('🔄 Example 4: FIFO Cache eviction');
const fifoCache = new RuntimeMemoryCache({ maxSize: 3, enableStats: true, evictionPolicy: 'FIFO' });

// Fill cache to capacity
fifoCache.set('item1', 'value1');
fifoCache.set('item2', 'value2');
fifoCache.set('item3', 'value3');
console.log('FIFO - After filling (size 3):', fifoCache.keys());
// console.log('FIFO - Memory usage:', fifoCache.getMemoryUsage());

// This should evict 'item1' (oldest)
fifoCache.set('item4', 'value4');
console.log('FIFO - After adding item4:', fifoCache.keys());
console.log('FIFO - item1 still exists?', fifoCache.has('item1')); // Should be false
console.log('FIFO - Eviction stats:', fifoCache.getStats());
console.log();

// Example 5: LRU Cache eviction  
console.log('🔄 Example 5: LRU Cache eviction');
const lruCache = new RuntimeMemoryCache({ maxSize: 3, enableStats: true, evictionPolicy: 'LRU' });

// Fill cache to capacity
lruCache.set('item1', 'value1');
lruCache.set('item2', 'value2');
lruCache.set('item3', 'value3');
console.log('LRU - After filling (size 3):', lruCache.keys());

// Wait a moment, then access item1 to make it recently used
setTimeout(() => {
  console.log('LRU - Accessing item1 to make it recently used');
  lruCache.get('item1');

  // Wait a moment, then add item4 - this should evict item2 (least recently used)
  setTimeout(() => {
    lruCache.set('item4', 'value4');
    console.log('LRU - After adding item4:', lruCache.keys());
    console.log('LRU - item1 still exists?', lruCache.has('item1')); // Should be true
    console.log('LRU - item2 still exists?', lruCache.has('item2')); // Should be false
    console.log('LRU - item3 still exists?', lruCache.has('item3')); // Should be true
    const lruStats = lruCache.getStats();
    console.log('LRU - Final stats:', lruStats);
    // console.log('LRU - Memory usage:', lruCache.getMemoryUsage());
    console.log();
  }, 10);
}, 10);

// Example 6: Skip Touch Feature for has() method
console.log('👆 Example 6: Skip Touch Feature for has() method');
const skipTouchCache = new RuntimeMemoryCache({ maxSize: 3, enableStats: true, evictionPolicy: 'LRU' });

// Fill cache to capacity
skipTouchCache.set('touch-a', 'value_a');
skipTouchCache.set('touch-b', 'value_b');
skipTouchCache.set('touch-c', 'value_c');
console.log('SkipTouch - Initial cache:', skipTouchCache.keys());

setTimeout(() => {
  console.log('SkipTouch - Checking touch-a with skipTouch=true (should NOT affect LRU order)');
  console.log('Has touch-a (skipTouch=true):', skipTouchCache.has('touch-a', true));
  
  setTimeout(() => {
    // Add new item - should evict 'touch-a' since it wasn't "touched"
    skipTouchCache.set('touch-d', 'value_d');
    console.log('SkipTouch - After adding touch-d:', skipTouchCache.keys());
    console.log('SkipTouch - touch-a still exists?', skipTouchCache.has('touch-a')); // Should be false
    
    // Now demonstrate normal has() behavior
    console.log('SkipTouch - Checking touch-b with default behavior (should affect LRU order)');
    console.log('Has touch-b (default):', skipTouchCache.has('touch-b'));
    
    setTimeout(() => {
      // Add another item - should evict 'touch-c' since 'touch-b' was recently accessed
      skipTouchCache.set('touch-e', 'value_e');
      console.log('SkipTouch - After adding touch-e:', skipTouchCache.keys());
      console.log('SkipTouch - touch-b still exists?', skipTouchCache.has('touch-b')); // Should be true
      console.log('SkipTouch - touch-c still exists?', skipTouchCache.has('touch-c')); // Should be false
      console.log('SkipTouch - Final stats:', skipTouchCache.getStats());
      console.log();
    }, 10);
  }, 10);
}, 10);

// Example 7: Manual cleanup
console.log('🧹 Example 7: Manual cleanup');
const cleanupCache = new RuntimeMemoryCache({ ttl: 500, enableStats: true });
cleanupCache.set('expire1', 'data1');
cleanupCache.set('expire2', 'data2');
cleanupCache.set('expire3', 'data3');

setTimeout(() => {
  console.log('Size before cleanup:', cleanupCache.size());
  // console.log('Memory before cleanup:', cleanupCache.getMemoryUsage());
  const removed = cleanupCache.cleanup();
  console.log('Expired entries removed:', removed);
  console.log('Size after cleanup:', cleanupCache.size());
  // console.log('Memory after cleanup:', cleanupCache.getMemoryUsage());
}, 600);
