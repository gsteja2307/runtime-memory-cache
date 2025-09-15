import { RuntimeMemoryCache } from '../src/index';

describe('lastAccessedAt Updates for set() Operations', () => {
  let fifoCache: RuntimeMemoryCache;
  let lruCache: RuntimeMemoryCache;

  beforeEach(() => {
    fifoCache = new RuntimeMemoryCache({
      maxSize: 3,
      evictionPolicy: 'FIFO'
    });
    lruCache = new RuntimeMemoryCache({
      maxSize: 3,
      evictionPolicy: 'LRU'
    });
  });

  describe('FIFO cache set() behavior', () => {
    it('should update lastAccessedAt when setting existing key while preserving createdAt', (done) => {
      // Set initial value
      fifoCache.set('key1', 'initial_value');
      
      // Access the internal store to check timestamps
      const store = (fifoCache as any).store;
      const initialEntry = store.get('key1');
      const initialCreatedAt = initialEntry.createdAt;
      const initialLastAccessed = initialEntry.lastAccessedAt;
      
      expect(initialCreatedAt).toBe(initialLastAccessed); // Should be same initially
      
      setTimeout(() => {
        // Update the value
        fifoCache.set('key1', 'updated_value');
        
        const updatedEntry = store.get('key1');
        
        // Verify the behavior
        expect(updatedEntry.value).toBe('updated_value');
        expect(updatedEntry.createdAt).toBe(initialCreatedAt); // Should be preserved
        expect(updatedEntry.lastAccessedAt).toBeGreaterThan(initialLastAccessed); // Should be updated
        
        done();
      }, 10);
    });

    it('should create new entry with same createdAt and lastAccessedAt for new keys', () => {
      fifoCache.set('newKey', 'new_value');
      
      const store = (fifoCache as any).store;
      const entry = store.get('newKey');
      
      expect(entry.createdAt).toBe(entry.lastAccessedAt);
      expect(entry.value).toBe('new_value');
    });

    it('should handle updating with TTL while preserving createdAt', (done) => {
      fifoCache.set('key1', 'initial');
      
      const store = (fifoCache as any).store;
      const initialCreatedAt = store.get('key1').createdAt;
      
      setTimeout(() => {
        fifoCache.set('key1', 'updated', 5000); // Set with TTL
        
        const updatedEntry = store.get('key1');
        expect(updatedEntry.createdAt).toBe(initialCreatedAt);
        expect(updatedEntry.value).toBe('updated');
        expect(updatedEntry.expiresAt).toBeGreaterThan(Date.now() + 4000);
        
        done();
      }, 10);
    });
  });

  describe('LRU cache set() behavior', () => {
    it('should update lastAccessedAt and move key to most recent position', (done) => {
      // Fill cache
      lruCache.set('a', 'value_a');
      lruCache.set('b', 'value_b');
      lruCache.set('c', 'value_c');
      
      const store = (lruCache as any).store;
      const initialCreatedAt = store.get('a').createdAt;
      
      setTimeout(() => {
        // Update 'a' - should move it to most recent position
        lruCache.set('a', 'updated_a');
        
        setTimeout(() => {
          // Add new item - should evict 'b' (least recently used)
          lruCache.set('d', 'value_d');
          
          // Verify LRU behavior
          expect(lruCache.has('a')).toBe(true);  // Should still exist (was made recent)
          expect(lruCache.has('b')).toBe(false); // Should be evicted
          expect(lruCache.has('c')).toBe(true);  // Should still exist
          expect(lruCache.has('d')).toBe(true);  // Should exist (newly added)
          
          // Verify value was updated
          expect(lruCache.get('a')).toBe('updated_a');
          
          // Verify createdAt was preserved
          const updatedEntry = store.get('a');
          expect(updatedEntry.createdAt).toBe(initialCreatedAt);
          
          done();
        }, 10);
      }, 10);
    });

    it('should preserve createdAt when updating existing LRU entries', (done) => {
      lruCache.set('key1', 'initial');
      
      const store = (lruCache as any).store;
      const initialEntry = store.get('key1');
      const initialCreatedAt = initialEntry.createdAt;
      const initialLastAccessed = initialEntry.lastAccessedAt;
      
      setTimeout(() => {
        lruCache.set('key1', 'updated');
        
        const updatedEntry = store.get('key1');
        
        expect(updatedEntry.value).toBe('updated');
        expect(updatedEntry.createdAt).toBe(initialCreatedAt);
        expect(updatedEntry.lastAccessedAt).toBeGreaterThan(initialLastAccessed);
        
        done();
      }, 10);
    });
  });

  describe('Cross-policy consistency', () => {
    it('should update lastAccessedAt consistently for both FIFO and LRU', (done) => {
      // Set same key in both caches
      fifoCache.set('test', 'initial');
      lruCache.set('test', 'initial');
      
      const fifoStore = (fifoCache as any).store;
      const lruStore = (lruCache as any).store;
      
      const fifoInitialAccess = fifoStore.get('test').lastAccessedAt;
      const lruInitialAccess = lruStore.get('test').lastAccessedAt;
      
      setTimeout(() => {
        // Update both caches
        fifoCache.set('test', 'updated');
        lruCache.set('test', 'updated');
        
        const fifoUpdatedAccess = fifoStore.get('test').lastAccessedAt;
        const lruUpdatedAccess = lruStore.get('test').lastAccessedAt;
        
        // Both should have updated lastAccessedAt
        expect(fifoUpdatedAccess).toBeGreaterThan(fifoInitialAccess);
        expect(lruUpdatedAccess).toBeGreaterThan(lruInitialAccess);
        
        done();
      }, 10);
    });
  });
});