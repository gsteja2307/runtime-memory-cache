import RuntimeMemoryCache, { CacheOptions, CacheStats, EvictionPolicy, MemoryUsage } from '../src/index';

describe('RuntimeMemoryCache - Basic Operations', () => {
  let cache: RuntimeMemoryCache;

  beforeEach(() => {
    cache = new RuntimeMemoryCache({ enableStats: true });
  });

  afterEach(() => {
    cache.clear();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default options', () => {
      const defaultCache = new RuntimeMemoryCache();
      expect(defaultCache.size()).toBe(0);
      expect(defaultCache.getEvictionPolicy()).toBe('FIFO');
      expect(defaultCache.getStats()).toBeNull(); // Stats disabled by default
    });

    it('should initialize with custom options', () => {
      const customCache = new RuntimeMemoryCache({
        ttl: 5000,
        maxSize: 50,
        enableStats: true,
        evictionPolicy: 'LRU'
      });

      expect(customCache.size()).toBe(0);
      expect(customCache.getEvictionPolicy()).toBe('LRU');
      const stats = customCache.getStats();
      expect(stats).not.toBeNull();
      expect(stats?.maxSize).toBe(50);
    });

    it('should throw error for invalid options', () => {
      expect(() => {
        new RuntimeMemoryCache({ maxSize: 0 });
      }).toThrow('maxSize must be at least 1');

      expect(() => {
        new RuntimeMemoryCache({ maxSize: 1.5 });
      }).toThrow('maxSize must be an integer');

      expect(() => {
        new RuntimeMemoryCache({ ttl: -100 });
      }).toThrow('TTL cannot be negative');

      expect(() => {
        new RuntimeMemoryCache({ evictionPolicy: 'INVALID' as EvictionPolicy });
      }).toThrow('evictionPolicy must be one of: FIFO, LRU');
    });
  });

  describe('Basic CRUD Operations', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', { name: 'John', age: 30 });
      cache.set('key3', 123);
      cache.set('key4', [1, 2, 3]);
      cache.set('key5', true);

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toEqual({ name: 'John', age: 30 });
      expect(cache.get('key3')).toBe(123);
      expect(cache.get('key4')).toEqual([1, 2, 3]);
      expect(cache.get('key5')).toBe(true);
      expect(cache.size()).toBe(5);
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
      expect(cache.get('')).toBeUndefined();
      expect(cache.get('never-set')).toBeUndefined();
    });

    it('should check if keys exist', () => {
      cache.set('existing', 'value');
      cache.set('zero', 0);
      cache.set('null', null);
      cache.set('false', false);

      expect(cache.has('existing')).toBe(true);
      expect(cache.has('zero')).toBe(true);
      expect(cache.has('null')).toBe(true);
      expect(cache.has('false')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.del('key1')).toBe(true);
      expect(cache.del('nonexistent')).toBe(false);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      expect(cache.size()).toBe(2);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.size()).toBe(3);
      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.keys()).toEqual([]);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should return all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      const keys = cache.keys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });
  });

  describe('Complex Data Types', () => {
    it('should handle null and undefined values', () => {
      cache.set('null', null);
      cache.set('undefined', undefined);

      expect(cache.get('null')).toBeNull();
      expect(cache.get('undefined')).toBeUndefined();
      expect(cache.has('null')).toBe(true);
      expect(cache.has('undefined')).toBe(true);
    });

    it('should handle objects with nested structures', () => {
      const complexObject = {
        user: {
          id: 1,
          name: 'John Doe',
          preferences: {
            theme: 'dark',
            language: 'en',
            notifications: {
              email: true,
              push: false
            }
          }
        },
        metadata: {
          createdAt: new Date().toISOString(),
          tags: ['important', 'user'],
          scores: [85, 92, 78]
        }
      };

      cache.set('complex', complexObject);
      const retrieved = cache.get('complex');

      expect(retrieved).toEqual(complexObject);
      expect(retrieved.user.preferences.notifications.email).toBe(true);
    });

    it('should handle arrays with mixed types', () => {
      const mixedArray = [
        1,
        'string',
        { key: 'value' },
        [1, 2, 3],
        null,
        undefined,
        true,
        new Date('2023-01-01')
      ];

      cache.set('mixed', mixedArray);
      expect(cache.get('mixed')).toEqual(mixedArray);
    });

    it('should handle functions and special objects', () => {
      const testFunc = function () { return 'test'; };
      const testDate = new Date('2023-01-01');
      const testRegex = /test[0-9]+/g;

      cache.set('function', testFunc);
      cache.set('date', testDate);
      cache.set('regex', testRegex);

      expect(cache.get('function')).toBe(testFunc);
      expect(cache.get('date')).toEqual(testDate);
      expect(cache.get('regex')).toEqual(testRegex);
    });
  });

  describe('Memory Usage', () => {
    it('should return zero memory usage for empty cache', () => {
      const memUsage = cache.getMemoryUsage();
      expect(memUsage.estimatedBytes).toBe(0);
      expect(memUsage.averageBytesPerEntry).toBe(0);
    });

    it('should calculate memory usage for entries', () => {
      cache.set('key1', 'hello');
      cache.set('key2', 'world');

      const memUsage = cache.getMemoryUsage();
      expect(memUsage.estimatedBytes).toBeGreaterThan(0);
      expect(memUsage.averageBytesPerEntry).toBeGreaterThan(0);
      expect(memUsage.averageBytesPerEntry).toBe(Math.round(memUsage.estimatedBytes / 2));
    });

    it('should update memory usage as cache changes', () => {
      const initialUsage = cache.getMemoryUsage();
      expect(initialUsage.estimatedBytes).toBe(0);

      cache.set('key1', 'small');
      const afterFirst = cache.getMemoryUsage();
      expect(afterFirst.estimatedBytes).toBeGreaterThan(0);

      cache.set('key2', { large: 'object with more data' });
      const afterSecond = cache.getMemoryUsage();
      expect(afterSecond.estimatedBytes).toBeGreaterThan(afterFirst.estimatedBytes);

      cache.del('key2');
      const afterDeletion = cache.getMemoryUsage();
      expect(afterDeletion.estimatedBytes).toBeLessThan(afterSecond.estimatedBytes);

      cache.clear();
      const afterClear = cache.getMemoryUsage();
      expect(afterClear.estimatedBytes).toBe(0);
    });
  });
});
