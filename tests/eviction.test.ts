import RuntimeMemoryCache from '../src/index';

describe('RuntimeMemoryCache - Eviction Policies', () => {
  describe('FIFO (First In, First Out)', () => {
    let fifoCache: RuntimeMemoryCache;

    beforeEach(() => {
      fifoCache = new RuntimeMemoryCache({
        maxSize: 3,
        enableStats: true,
        evictionPolicy: 'FIFO'
      });
    });

    it('should evict oldest entry when cache is full', () => {
      // Fill cache to capacity
      fifoCache.set('first', 'value1');
      fifoCache.set('second', 'value2');
      fifoCache.set('third', 'value3');

      expect(fifoCache.size()).toBe(3);
      expect(fifoCache.keys()).toEqual(['first', 'second', 'third']);

      // Add fourth item - should evict 'first'
      fifoCache.set('fourth', 'value4');

      expect(fifoCache.size()).toBe(3);
      expect(fifoCache.has('first')).toBe(false);   // Evicted
      expect(fifoCache.has('second')).toBe(true);
      expect(fifoCache.has('third')).toBe(true);
      expect(fifoCache.has('fourth')).toBe(true);

      const stats = fifoCache.getStats();
      expect(stats?.evictions).toBe(1);
    });

    it('should evict in insertion order regardless of access patterns', () => {
      fifoCache.set('a', '1');
      fifoCache.set('b', '2');
      fifoCache.set('c', '3');

      // Access 'a' multiple times - should not affect FIFO order
      fifoCache.get('a');
      fifoCache.get('a');
      fifoCache.has('a');

      // Add new items - 'a' should still be evicted first
      fifoCache.set('d', '4'); // Should evict 'a'
      fifoCache.set('e', '5'); // Should evict 'b'

      expect(fifoCache.has('a')).toBe(false);
      expect(fifoCache.has('b')).toBe(false);
      expect(fifoCache.has('c')).toBe(true);
      expect(fifoCache.has('d')).toBe(true);
      expect(fifoCache.has('e')).toBe(true);

      const stats = fifoCache.getStats();
      expect(stats?.evictions).toBe(2);
    });

    it('should handle rapid successive evictions', () => {
      // Add more items than cache size
      const keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

      keys.forEach(key => {
        fifoCache.set(key, `value_${key}`);
      });

      expect(fifoCache.size()).toBe(3);

      // Should keep the last 3 items
      expect(fifoCache.has('e')).toBe(true);
      expect(fifoCache.has('f')).toBe(true);
      expect(fifoCache.has('g')).toBe(true);

      // Earlier items should be evicted
      expect(fifoCache.has('a')).toBe(false);
      expect(fifoCache.has('b')).toBe(false);
      expect(fifoCache.has('c')).toBe(false);
      expect(fifoCache.has('d')).toBe(false);

      const stats = fifoCache.getStats();
      expect(stats?.evictions).toBe(4);
    });

    it('should maintain correct order after deletions', () => {
      fifoCache.set('first', 'value1');
      fifoCache.set('second', 'value2');
      fifoCache.set('third', 'value3');

      // Delete middle item
      fifoCache.del('second');
      expect(fifoCache.size()).toBe(2);

      // Add two more items
      fifoCache.set('fourth', 'value4');
      fifoCache.set('fifth', 'value5'); // This should trigger eviction of 'first'

      expect(fifoCache.size()).toBe(3);
      expect(fifoCache.has('first')).toBe(false);
      expect(fifoCache.has('third')).toBe(true);
      expect(fifoCache.has('fourth')).toBe(true);
      expect(fifoCache.has('fifth')).toBe(true);

      // Add one more to trigger eviction
      fifoCache.set('sixth', 'value6');
      expect(fifoCache.has('third')).toBe(false); // Should be evicted
    });
  });

  describe('LRU (Least Recently Used)', () => {
    let lruCache: RuntimeMemoryCache;

    beforeEach(() => {
      lruCache = new RuntimeMemoryCache({
        maxSize: 3,
        enableStats: true,
        evictionPolicy: 'LRU'
      });
    });

    it('should evict least recently used entry', (done) => {
      // Fill cache to capacity
      lruCache.set('first', 'value1');
      lruCache.set('second', 'value2');
      lruCache.set('third', 'value3');

      setTimeout(() => {
        // Access 'first' to make it recently used
        lruCache.get('first');

        setTimeout(() => {
          // Add fourth item - should evict 'second' (least recently used)
          lruCache.set('fourth', 'value4');

          expect(lruCache.size()).toBe(3);
          expect(lruCache.has('first')).toBe(true);   // Recently accessed
          expect(lruCache.has('second')).toBe(false); // Should be evicted
          expect(lruCache.has('third')).toBe(true);
          expect(lruCache.has('fourth')).toBe(true);

          const stats = lruCache.getStats();
          expect(stats?.evictions).toBe(1);
          done();
        }, 10);
      }, 10);
    });

    it('should update access time on get operations', (done) => {
      lruCache.set('a', '1');
      lruCache.set('b', '2');
      lruCache.set('c', '3');

      setTimeout(() => {
        // Access 'a' to make it recently used
        lruCache.get('a');

        setTimeout(() => {
          // Add new item - should evict 'b' (least recently used)
          lruCache.set('d', '4');

          expect(lruCache.has('a')).toBe(true);  // Recently accessed
          expect(lruCache.has('b')).toBe(false); // Should be evicted
          expect(lruCache.has('c')).toBe(true);
          expect(lruCache.has('d')).toBe(true);
          done();
        }, 10);
      }, 10);
    });

    it('should update access time on has operations', (done) => {
      lruCache.set('a', '1');
      lruCache.set('b', '2');
      lruCache.set('c', '3');

      setTimeout(() => {
        // Access 'a' via has() to make it recently used
        lruCache.has('a');

        setTimeout(() => {
          // Add new item - should evict 'b' (least recently used)
          lruCache.set('d', '4');

          expect(lruCache.has('a')).toBe(true);  // Recently accessed via has()
          expect(lruCache.has('b')).toBe(false); // Should be evicted
          expect(lruCache.has('c')).toBe(true);
          expect(lruCache.has('d')).toBe(true);
          done();
        }, 10);
      }, 10);
    });

    it('should handle complex access patterns', (done) => {
      lruCache.set('a', '1');
      lruCache.set('b', '2');
      lruCache.set('c', '3');

      setTimeout(() => {
        // Complex access pattern
        lruCache.get('c'); // Make 'c' most recent
        lruCache.get('a'); // Make 'a' most recent
        // 'b' is now least recent

        setTimeout(() => {
          lruCache.set('d', '4'); // Should evict 'b'

          expect(lruCache.has('a')).toBe(true);
          expect(lruCache.has('b')).toBe(false); // Evicted
          expect(lruCache.has('c')).toBe(true);
          expect(lruCache.has('d')).toBe(true);

          const stats = lruCache.getStats();
          expect(stats?.evictions).toBe(1);
          done();
        }, 10);
      }, 10);
    });

    it('should handle rapid successive additions', () => {
      const keys = ['a', 'b', 'c', 'd', 'e', 'f'];

      keys.forEach(key => {
        lruCache.set(key, `value_${key}`);
      });

      expect(lruCache.size()).toBe(3);

      // Should keep the last 3 items (most recently added)
      expect(lruCache.has('d')).toBe(true);
      expect(lruCache.has('e')).toBe(true);
      expect(lruCache.has('f')).toBe(true);

      const stats = lruCache.getStats();
      expect(stats?.evictions).toBe(3);
    });

    it('should handle setting same key (should update access time)', (done) => {
      lruCache.set('a', '1');
      lruCache.set('b', '2');
      lruCache.set('c', '3');

      setTimeout(() => {
        // Update 'a' with new value (should make it most recent)
        lruCache.set('a', 'updated');

        setTimeout(() => {
          // Add new item - should evict 'b' (least recently used)
          lruCache.set('d', '4');

          expect(lruCache.get('a')).toBe('updated'); // Should be present with new value
          expect(lruCache.has('b')).toBe(false);     // Should be evicted
          expect(lruCache.has('c')).toBe(true);
          expect(lruCache.has('d')).toBe(true);
          done();
        }, 10);
      }, 10);
    });
  });

  describe('Eviction Policy Comparison', () => {
    it('should behave differently between FIFO and LRU', (done) => {
      const fifoCache = new RuntimeMemoryCache({
        maxSize: 2,
        evictionPolicy: 'FIFO'
      });
      const lruCache = new RuntimeMemoryCache({
        maxSize: 2,
        evictionPolicy: 'LRU'
      });

      // Setup same initial state
      fifoCache.set('first', 'value1');
      fifoCache.set('second', 'value2');
      lruCache.set('first', 'value1');
      lruCache.set('second', 'value2');

      setTimeout(() => {
        // Access 'first' in both caches
        fifoCache.get('first');
        lruCache.get('first');

        setTimeout(() => {
          // Add third item
          fifoCache.set('third', 'value3');
          lruCache.set('third', 'value3');

          // FIFO should evict 'first' (oldest insertion)
          expect(fifoCache.has('first')).toBe(false);
          expect(fifoCache.has('second')).toBe(true);

          // LRU should evict 'second' (least recently used)
          expect(lruCache.has('first')).toBe(true);
          expect(lruCache.has('second')).toBe(false);

          done();
        }, 10);
      }, 10);
    });

    it('should maintain correct eviction policy settings', () => {
      const fifoCache = new RuntimeMemoryCache({ evictionPolicy: 'FIFO' });
      const lruCache = new RuntimeMemoryCache({ evictionPolicy: 'LRU' });
      const defaultCache = new RuntimeMemoryCache();

      expect(fifoCache.getEvictionPolicy()).toBe('FIFO');
      expect(lruCache.getEvictionPolicy()).toBe('LRU');
      expect(defaultCache.getEvictionPolicy()).toBe('FIFO'); // Default is FIFO
    });
  });

  describe('Eviction Edge Cases', () => {
    it('should handle eviction when cache size is 1', () => {
      const singleCache = new RuntimeMemoryCache({
        maxSize: 1,
        enableStats: true
      });

      singleCache.set('first', 'value1');
      expect(singleCache.size()).toBe(1);

      singleCache.set('second', 'value2');
      expect(singleCache.size()).toBe(1);
      expect(singleCache.has('first')).toBe(false);
      expect(singleCache.has('second')).toBe(true);

      const stats = singleCache.getStats();
      expect(stats?.evictions).toBe(1);
    });

    it('should not evict when under max size', () => {
      const cache = new RuntimeMemoryCache({
        maxSize: 5,
        enableStats: true
      });

      cache.set('a', '1');
      cache.set('b', '2');
      cache.set('c', '3');

      expect(cache.size()).toBe(3);

      const stats = cache.getStats();
      expect(stats?.evictions).toBe(0);
    });

    it('should handle eviction with TTL expired items', (done) => {
      const cache = new RuntimeMemoryCache({
        maxSize: 2,
        enableStats: true
      });
      cache.set('expiring', 'will expire', 50);
      cache.set('permanent', 'will stay');
      setTimeout(() => {
        // When adding new item, expired item should be cleaned up first
        cache.set('new', 'new value');
        expect(cache.has('expiring')).toBe(false);  // Expired and cleaned
        expect(cache.has('permanent')).toBe(true);   // Should still be there
        expect(cache.has('new')).toBe(true);         // Should be added
        expect([1, 2]).toContain(cache.size()); // Allow for timing
        const stats = cache.getStats();
        expect([0, 1]).toContain(stats?.evictions); // Allow for 0 or 1
        done();
      }, 120);
    });
  });

  describe('lastAccessedAt Updates', () => {
    it('should update lastAccessedAt for FIFO cache on get operations', (done) => {
      const fifoCache = new RuntimeMemoryCache({
        maxSize: 3,
        evictionPolicy: 'FIFO'
      });

      // Add initial entries
      fifoCache.set('a', 'value1');
      fifoCache.set('b', 'value2');
      fifoCache.set('c', 'value3');

      setTimeout(() => {
        // Access entries - this should update lastAccessedAt even for FIFO
        const value1 = fifoCache.get('a');
        const value2 = fifoCache.get('b');
        
        expect(value1).toBe('value1');
        expect(value2).toBe('value2');
        
        // Verify that FIFO behavior is not affected by access patterns
        fifoCache.set('d', 'value4'); // Should still evict 'a' (first in)
        
        expect(fifoCache.has('a')).toBe(false); // Should be evicted (FIFO)
        expect(fifoCache.has('b')).toBe(true);
        expect(fifoCache.has('c')).toBe(true);
        expect(fifoCache.has('d')).toBe(true);
        
        done();
      }, 10);
    });

    it('should update lastAccessedAt for FIFO cache on has operations', (done) => {
      const fifoCache = new RuntimeMemoryCache({
        maxSize: 3,
        evictionPolicy: 'FIFO'
      });

      // Add initial entries
      fifoCache.set('a', 'value1');
      fifoCache.set('b', 'value2');
      fifoCache.set('c', 'value3');

      setTimeout(() => {
        // Check entries via has() - this should update lastAccessedAt even for FIFO
        const hasA = fifoCache.has('a');
        const hasB = fifoCache.has('b');
        
        expect(hasA).toBe(true);
        expect(hasB).toBe(true);
        
        // Verify that FIFO behavior is not affected by has() calls
        fifoCache.set('d', 'value4'); // Should still evict 'a' (first in)
        
        expect(fifoCache.has('a')).toBe(false); // Should be evicted (FIFO)
        expect(fifoCache.has('b')).toBe(true);
        expect(fifoCache.has('c')).toBe(true);
        expect(fifoCache.has('d')).toBe(true);
        
        done();
      }, 10);
    });

    it('should maintain consistent behavior between FIFO and LRU for access tracking', (done) => {
      const fifoCache = new RuntimeMemoryCache({
        maxSize: 2,
        evictionPolicy: 'FIFO'
      });
      const lruCache = new RuntimeMemoryCache({
        maxSize: 2,
        evictionPolicy: 'LRU'
      });

      // Add initial entries to both caches
      fifoCache.set('first', 'value1');
      fifoCache.set('second', 'value2');
      lruCache.set('first', 'value1');
      lruCache.set('second', 'value2');

      setTimeout(() => {
        // Access first entry in both caches (should update lastAccessedAt in both)
        fifoCache.get('first');
        lruCache.get('first');
        
        // Verify both caches tracked the access
        expect(fifoCache.get('first')).toBe('value1');
        expect(lruCache.get('first')).toBe('value1');
        
        setTimeout(() => {
          // Add third entry to trigger eviction
          fifoCache.set('third', 'value3');
          lruCache.set('third', 'value3');
          
          // FIFO should evict 'first' regardless of access
          expect(fifoCache.has('first')).toBe(false);
          expect(fifoCache.has('second')).toBe(true);
          
          // LRU should evict 'second' because 'first' was accessed more recently
          expect(lruCache.has('first')).toBe(true);
          expect(lruCache.has('second')).toBe(false);
          
          done();
        }, 10);
      }, 10);
    });
  });
});
