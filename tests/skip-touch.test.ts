import { RuntimeMemoryCache } from '../src/index';

describe('Skip Touch Functionality', () => {
  let lruCache: RuntimeMemoryCache;
  let fifoCache: RuntimeMemoryCache;

  beforeEach(() => {
    lruCache = new RuntimeMemoryCache({
      maxSize: 3,
      evictionPolicy: 'LRU'
    });
    fifoCache = new RuntimeMemoryCache({
      maxSize: 3,
      evictionPolicy: 'FIFO'
    });
  });

  describe('has() default behavior (skipTouch = false)', () => {
    it('should update access time and affect LRU order by default', (done) => {
      lruCache.set('a', '1');
      lruCache.set('b', '2');
      lruCache.set('c', '3');

      setTimeout(() => {
        // Access 'a' via has() without skipTouch (should update access time)
        expect(lruCache.has('a')).toBe(true);

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

    it('should update access time and affect LRU order with explicit skipTouch = false', (done) => {
      lruCache.set('a', '1');
      lruCache.set('b', '2');
      lruCache.set('c', '3');

      setTimeout(() => {
        // Access 'a' via has() with explicit skipTouch = false
        expect(lruCache.has('a', false)).toBe(true);

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
  });

  describe('has() with skipTouch = true', () => {
    it('should NOT update access time or affect LRU order when skipTouch = true', (done) => {
      lruCache.set('a', '1');
      lruCache.set('b', '2');
      lruCache.set('c', '3');

      setTimeout(() => {
        // Access 'a' via has() with skipTouch = true (should NOT update access time)
        expect(lruCache.has('a', true)).toBe(true);

        setTimeout(() => {
          // Add new item - should evict 'a' (first inserted, not accessed since skipTouch = true)
          lruCache.set('d', '4');

          expect(lruCache.has('a')).toBe(false); // Should be evicted (was not "touched")
          expect(lruCache.has('b')).toBe(true);  // Should remain
          expect(lruCache.has('c')).toBe(true);
          expect(lruCache.has('d')).toBe(true);
          done();
        }, 10);
      }, 10);
    });

    it('should still work for existence check even with skipTouch = true', () => {
      lruCache.set('existing', 'value');
      
      // Should return true even with skipTouch
      expect(lruCache.has('existing', true)).toBe(true);
      
      // Should return false for non-existent key
      expect(lruCache.has('nonexistent', true)).toBe(false);
    });

    it('should not affect FIFO cache behavior when skipTouch = true', (done) => {
      // FIFO should not be affected by access patterns anyway, but let's test
      fifoCache.set('a', '1');
      fifoCache.set('b', '2');
      fifoCache.set('c', '3');

      setTimeout(() => {
        // Access 'a' via has() with skipTouch = true
        expect(fifoCache.has('a', true)).toBe(true);

        setTimeout(() => {
          // Add new item - should evict 'a' (first in, first out for FIFO)
          fifoCache.set('d', '4');

          expect(fifoCache.has('a')).toBe(false); // Should be evicted (FIFO behavior)
          expect(fifoCache.has('b')).toBe(true);
          expect(fifoCache.has('c')).toBe(true);
          expect(fifoCache.has('d')).toBe(true);
          done();
        }, 10);
      }, 10);
    });

    it('should not affect FIFO cache behavior when skipTouch = false', (done) => {
      // FIFO should not be affected by access patterns anyway
      fifoCache.set('a', '1');
      fifoCache.set('b', '2');
      fifoCache.set('c', '3');

      setTimeout(() => {
        // Access 'a' via has() with skipTouch = false
        expect(fifoCache.has('a', false)).toBe(true);

        setTimeout(() => {
          // Add new item - should evict 'a' (first in, first out for FIFO)
          fifoCache.set('d', '4');

          expect(fifoCache.has('a')).toBe(false); // Should be evicted (FIFO behavior)
          expect(fifoCache.has('b')).toBe(true);
          expect(fifoCache.has('c')).toBe(true);
          expect(fifoCache.has('d')).toBe(true);
          done();
        }, 10);
      }, 10);
    });
  });

  describe('has() with expired entries', () => {
    it('should handle expired entries correctly regardless of skipTouch value', (done) => {
      lruCache.set('temp', 'will expire', 50);
      
      // Should exist initially
      expect(lruCache.has('temp')).toBe(true);
      expect(lruCache.has('temp', true)).toBe(true);
      expect(lruCache.has('temp', false)).toBe(true);
      
      setTimeout(() => {
        // Should be expired and removed
        expect(lruCache.has('temp')).toBe(false);
        expect(lruCache.has('temp', true)).toBe(false);
        expect(lruCache.has('temp', false)).toBe(false);
        done();
      }, 60);
    });
  });

  describe('has() with invalid keys', () => {
    it('should handle invalid keys correctly regardless of skipTouch value', () => {
      // Should return false for invalid keys
      expect(lruCache.has('', true)).toBe(false);
      expect(lruCache.has('', false)).toBe(false);
      expect(lruCache.has('')).toBe(false);
      
      expect(lruCache.has('a'.repeat(251), true)).toBe(false);
      expect(lruCache.has('a'.repeat(251), false)).toBe(false);
      expect(lruCache.has('a'.repeat(251))).toBe(false);
    });
  });

  describe('complex LRU scenarios with mixed skipTouch usage', () => {
    it('should handle mixed usage of skipTouch correctly', (done) => {
      lruCache.set('a', '1');
      lruCache.set('b', '2');
      lruCache.set('c', '3');

      setTimeout(() => {
        // Access 'a' with skipTouch = true (should NOT affect order)
        expect(lruCache.has('a', true)).toBe(true);
        
        // Access 'b' with skipTouch = false (should affect order)
        expect(lruCache.has('b', false)).toBe(true);

        setTimeout(() => {
          // Add new item - should evict 'a' (oldest, not touched)
          lruCache.set('d', '4');

          expect(lruCache.has('a')).toBe(false); // Should be evicted
          expect(lruCache.has('b')).toBe(true);  // Recently accessed
          expect(lruCache.has('c')).toBe(true);
          expect(lruCache.has('d')).toBe(true);
          done();
        }, 10);
      }, 10);
    });
  });
});