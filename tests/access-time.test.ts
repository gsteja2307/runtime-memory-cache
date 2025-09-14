import RuntimeMemoryCache from '../src/index';
import { CacheUtils } from '../src/utils';

describe('RuntimeMemoryCache - Access Time Updates', () => {
  describe('Access Time Updates for All Eviction Policies', () => {
    it('should update lastAccessedAt on get() for both FIFO and LRU policies', (done) => {
      const fifoCache = new RuntimeMemoryCache({ evictionPolicy: 'FIFO' });
      const lruCache = new RuntimeMemoryCache({ evictionPolicy: 'LRU' });

      // Add entries to both caches
      fifoCache.set('key1', 'value1');
      lruCache.set('key1', 'value1');

      // Get the internal entry to check initial lastAccessedAt
      const fifoStore = (fifoCache as any).store;
      const lruStore = (lruCache as any).store;

      const initialFifoAccess = fifoStore.get('key1').lastAccessedAt;
      const initialLruAccess = lruStore.get('key1').lastAccessedAt;

      setTimeout(() => {
        // Access both entries
        fifoCache.get('key1');
        lruCache.get('key1');

        // Check that lastAccessedAt was updated
        const updatedFifoAccess = fifoStore.get('key1').lastAccessedAt;
        const updatedLruAccess = lruStore.get('key1').lastAccessedAt;

        expect(updatedFifoAccess).toBeGreaterThan(initialFifoAccess);
        expect(updatedLruAccess).toBeGreaterThan(initialLruAccess);

        done();
      }, 10);
    });

    it('should update lastAccessedAt on has() for both FIFO and LRU policies', (done) => {
      const fifoCache = new RuntimeMemoryCache({ evictionPolicy: 'FIFO' });
      const lruCache = new RuntimeMemoryCache({ evictionPolicy: 'LRU' });

      // Add entries to both caches
      fifoCache.set('key1', 'value1');
      lruCache.set('key1', 'value1');

      // Get the internal entry to check initial lastAccessedAt
      const fifoStore = (fifoCache as any).store;
      const lruStore = (lruCache as any).store;

      const initialFifoAccess = fifoStore.get('key1').lastAccessedAt;
      const initialLruAccess = lruStore.get('key1').lastAccessedAt;

      setTimeout(() => {
        // Check existence of both entries
        fifoCache.has('key1');
        lruCache.has('key1');

        // Check that lastAccessedAt was updated
        const updatedFifoAccess = fifoStore.get('key1').lastAccessedAt;
        const updatedLruAccess = lruStore.get('key1').lastAccessedAt;

        expect(updatedFifoAccess).toBeGreaterThan(initialFifoAccess);
        expect(updatedLruAccess).toBeGreaterThan(initialLruAccess);

        done();
      }, 10);
    });

    it('should update lastAccessedAt on set() when overwriting existing key', (done) => {
      const cache = new RuntimeMemoryCache({ evictionPolicy: 'FIFO' });

      // Add initial entry
      cache.set('key1', 'value1');

      // Get the internal entry to check initial lastAccessedAt
      const store = (cache as any).store;
      const initialAccess = store.get('key1').lastAccessedAt;

      setTimeout(() => {
        // Overwrite the existing key
        cache.set('key1', 'value2');

        // Check that lastAccessedAt was updated
        const updatedAccess = store.get('key1').lastAccessedAt;
        expect(updatedAccess).toBeGreaterThan(initialAccess);
        expect(cache.get('key1')).toBe('value2');

        done();
      }, 10);
    });
  });

  describe('Access Time Consistency', () => {
    it('should maintain consistent access time behavior across all cache operations', (done) => {
      const cache = new RuntimeMemoryCache({ 
        evictionPolicy: 'FIFO',
        maxSize: 5  // Increase size to avoid eviction during testing
      });

      // Add entries
      cache.set('a', '1');
      cache.set('b', '2');
      cache.set('c', '3');

      const store = (cache as any).store;
      const initialAccessA = store.get('a').lastAccessedAt;
      const initialAccessB = store.get('b').lastAccessedAt;
      const initialAccessC = store.get('c').lastAccessedAt;

      setTimeout(() => {
        // Perform various operations
        cache.get('a');        // Should update access time
        cache.has('b');        // Should update access time
        cache.set('c', '3.1'); // Should update access time when overwriting

        // Verify all access times were updated
        const updatedAccessA = store.get('a').lastAccessedAt;
        const updatedAccessB = store.get('b').lastAccessedAt;
        const updatedAccessC = store.get('c').lastAccessedAt;

        expect(updatedAccessA).toBeGreaterThan(initialAccessA);
        expect(updatedAccessB).toBeGreaterThan(initialAccessB);
        expect(updatedAccessC).toBeGreaterThan(initialAccessC);

        // Now fill cache to trigger eviction and verify FIFO behavior
        cache.set('d', '4');
        cache.set('e', '5');
        cache.set('f', '6'); // This should evict 'a' (oldest insertion)
        
        expect(cache.has('a')).toBe(false); // 'a' should be evicted despite being accessed
        expect(cache.has('b')).toBe(true);
        expect(cache.has('c')).toBe(true);
        expect(cache.has('d')).toBe(true);
        expect(cache.has('e')).toBe(true);

        done();
      }, 10);
    });

    it('should ensure access time tracking works correctly with expired entries', (done) => {
      const cache = new RuntimeMemoryCache();

      // Add entry with short TTL
      cache.set('shortLived', 'value', 50);
      cache.set('longLived', 'value');

      setTimeout(() => {
        // Try to access expired entry - should not update access time
        const result = cache.get('shortLived');
        expect(result).toBeUndefined();

        // Access non-expired entry - should update access time
        const store = (cache as any).store;
        const beforeAccess = store.get('longLived')?.lastAccessedAt;
        
        cache.get('longLived');
        
        const afterAccess = store.get('longLived')?.lastAccessedAt;
        expect(afterAccess).toBeGreaterThan(beforeAccess);

        done();
      }, 100);
    });
  });

  describe('CacheUtils.updateAccessTime Direct Tests', () => {
    it('should properly update access time using utility function', () => {
      const entry = CacheUtils.createEntry('test value');
      const originalTime = entry.lastAccessedAt;

      // Wait a bit to ensure time difference
      setTimeout(() => {
        CacheUtils.updateAccessTime(entry);
        expect(entry.lastAccessedAt).toBeGreaterThan(originalTime);
      }, 5);
    });

    it('should preserve other entry properties when updating access time', () => {
      const originalCreatedAt = Date.now();
      const originalExpiresAt = Date.now() + 10000;
      const originalValue = 'test value';
      
      const entry = {
        value: originalValue,
        createdAt: originalCreatedAt,
        expiresAt: originalExpiresAt,
        lastAccessedAt: originalCreatedAt
      };

      CacheUtils.updateAccessTime(entry);

      // Should preserve all other properties
      expect(entry.value).toBe(originalValue);
      expect(entry.createdAt).toBe(originalCreatedAt);
      expect(entry.expiresAt).toBe(originalExpiresAt);
      
      // Should only update lastAccessedAt
      expect(entry.lastAccessedAt).toBeGreaterThanOrEqual(originalCreatedAt);
    });
  });
});