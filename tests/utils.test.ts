import { CacheUtils, ValidationUtils } from '../src/utils';
import { CacheEntry } from '../src/types';

describe('CacheUtils', () => {
  describe('isExpired', () => {
    it('returns false if expiresAt is undefined', () => {
      const entry: CacheEntry = { value: 1, createdAt: Date.now(), lastAccessedAt: Date.now() };
      expect(CacheUtils.isExpired(entry)).toBe(false);
    });
    it('returns false if expiresAt is in the future', () => {
      const entry: CacheEntry = { value: 1, expiresAt: Date.now() + 10000, createdAt: Date.now(), lastAccessedAt: Date.now() };
      expect(CacheUtils.isExpired(entry)).toBe(false);
    });
    it('returns true if expiresAt is in the past', () => {
      const entry: CacheEntry = { value: 1, expiresAt: Date.now() - 10000, createdAt: Date.now(), lastAccessedAt: Date.now() };
      expect(CacheUtils.isExpired(entry)).toBe(true);
    });
  });

  describe('calculateExpiresAt', () => {
    it('returns Date.now() + ttl if ttl is provided', () => {
      const ttl = 1000;
      const expiresAt = CacheUtils.calculateExpiresAt(ttl);
      expect(expiresAt).toBeGreaterThanOrEqual(Date.now() + ttl - 5);
      expect(expiresAt).toBeLessThanOrEqual(Date.now() + ttl + 5);
    });
    it('returns Date.now() + defaultTtl if ttl is undefined and defaultTtl is provided', () => {
      const defaultTtl = 2000;
      const expiresAt = CacheUtils.calculateExpiresAt(undefined, defaultTtl);
      expect(expiresAt).toBeGreaterThanOrEqual(Date.now() + defaultTtl - 5);
      expect(expiresAt).toBeLessThanOrEqual(Date.now() + defaultTtl + 5);
    });
    it('returns undefined if neither ttl nor defaultTtl is provided', () => {
      expect(CacheUtils.calculateExpiresAt()).toBeUndefined();
    });
  });

  describe('createEntry', () => {
    it('creates a cache entry with correct fields', () => {
      const value = 'foo';
      const expiresAt = Date.now() + 1000;
      const entry = CacheUtils.createEntry(value, expiresAt);
      expect(entry.value).toBe(value);
      expect(entry.expiresAt).toBe(expiresAt);
      expect(typeof entry.createdAt).toBe('number');
      expect(typeof entry.lastAccessedAt).toBe('number');
    });
    it('createdAt and lastAccessedAt are close to now', () => {
      const entry = CacheUtils.createEntry('bar');
      expect(entry.createdAt).toBeGreaterThanOrEqual(Date.now() - 10);
      expect(entry.lastAccessedAt).toBeGreaterThanOrEqual(Date.now() - 10);
    });
  });

  describe('updateAccessTime', () => {
    it('updates lastAccessedAt to now', () => {
      const entry = CacheUtils.createEntry('baz');
      const before = entry.lastAccessedAt;
      CacheUtils.updateAccessTime(entry);
      expect(entry.lastAccessedAt).toBeGreaterThanOrEqual(before);
    });
  });

  describe('getKeyToEvict', () => {
    it('returns undefined for empty map', () => {
      const map = new Map();
      expect(CacheUtils.getKeyToEvict(map, 'FIFO')).toBeUndefined();
      expect(CacheUtils.getKeyToEvict(map, 'LRU')).toBeUndefined();
    });
    it('returns first key for FIFO', () => {
      const map = new Map([
        ['a', CacheUtils.createEntry(1)],
        ['b', CacheUtils.createEntry(2)]
      ]);
      expect(CacheUtils.getKeyToEvict(map, 'FIFO')).toBe('a');
    });
    //write for lru based on my implementation
    it('returns least recently used key for LRU', () => {
      const map = new Map([
        ['a', CacheUtils.createEntry(1)],
        ['b', CacheUtils.createEntry(2)]
      ]);
      // Simulate access to 'b'
      CacheUtils.updateAccessTime(map.get('b')!);
      expect(CacheUtils.getKeyToEvict(map, 'LRU')).toBe('a');
    });
  });

  describe('cleanupExpired', () => {
    it('removes expired entries and returns count', () => {
      const now = Date.now();
      const map = new Map([
        ['a', { value: 1, createdAt: now, lastAccessedAt: now, expiresAt: now - 100 }],
        ['b', { value: 2, createdAt: now, lastAccessedAt: now, expiresAt: now + 10000 }],
        ['c', { value: 3, createdAt: now, lastAccessedAt: now, expiresAt: now - 50 }]
      ]);
      const removed = CacheUtils.cleanupExpired(map);
      expect(removed).toBe(2);
      expect(map.size).toBe(1);
      expect(map.has('b')).toBe(true);
    });
  });

  describe('estimateEntrySize and estimateValueSize', () => {
    it('estimates size for string, number, boolean, object, array, null, undefined', () => {
      expect(CacheUtils.estimateValueSize('abc')).toBeGreaterThan(0);
      expect(CacheUtils.estimateValueSize(123)).toBe(8);
      expect(CacheUtils.estimateValueSize(true)).toBe(4);
      expect(CacheUtils.estimateValueSize(null)).toBe(0);
      expect(CacheUtils.estimateValueSize(undefined)).toBe(0);
      expect(CacheUtils.estimateValueSize([1, 2, 3])).toBeGreaterThan(0);
      expect(CacheUtils.estimateValueSize({ foo: 'bar' })).toBeGreaterThan(0);
    });
    it('estimateEntrySize includes key, value, and metadata', () => {
      const entry = CacheUtils.createEntry('abc');
      const size = CacheUtils.estimateEntrySize('key', entry);
      expect(size).toBeGreaterThan(0);
    });
  });

  describe('calculateMemoryUsage', () => {
    it('returns correct structure and values', () => {
      const map = new Map([
        ['a', CacheUtils.createEntry('foo')],
        ['b', CacheUtils.createEntry('bar')]
      ]);
      const usage = CacheUtils.calculateMemoryUsage(map);
      expect(usage).toHaveProperty('estimatedBytes');
      expect(usage).toHaveProperty('averageBytesPerEntry');
      expect(usage.estimatedBytes).toBeGreaterThan(0);
      expect(usage.averageBytesPerEntry).toBeGreaterThan(0);
    });
    it('returns zeros for empty map', () => {
      const usage = CacheUtils.calculateMemoryUsage(new Map());
      expect(usage.estimatedBytes).toBe(0);
      expect(usage.averageBytesPerEntry).toBe(0);
    });
  });
});

describe('ValidationUtils', () => {
  describe('validateKey', () => {
    it('throws if key is not a string', () => {
      // @ts-expect-error
      expect(() => ValidationUtils.validateKey(123)).toThrow('Cache key must be a string');
    });
    it('throws if key is empty', () => {
      expect(() => ValidationUtils.validateKey('')).toThrow('Cache key cannot be empty');
    });
    it('throws if key is too long', () => {
      expect(() => ValidationUtils.validateKey('a'.repeat(251))).toThrow('Cache key too long');
    });
    it('does not throw for valid key', () => {
      expect(() => ValidationUtils.validateKey('foo')).not.toThrow();
    });
  });

  describe('validateTTL', () => {
    it('throws if ttl is not a number', () => {
      // @ts-expect-error
      expect(() => ValidationUtils.validateTTL('abc')).toThrow('TTL must be a number');
    });
    it('throws if ttl is NaN', () => {
      expect(() => ValidationUtils.validateTTL(NaN)).toThrow('TTL must be a number');
    });
    it('throws if ttl is not finite', () => {
      expect(() => ValidationUtils.validateTTL(Infinity)).toThrow('TTL must be a finite number');
    });
    it('throws if ttl is negative', () => {
      expect(() => ValidationUtils.validateTTL(-1)).toThrow('TTL cannot be negative');
    });
    it('does not throw for valid ttl', () => {
      expect(() => ValidationUtils.validateTTL(1000)).not.toThrow();
    });
  });

  describe('validateCacheOptions', () => {
    it('throws for invalid ttl', () => {
      expect(() => ValidationUtils.validateCacheOptions({ ttl: 'abc' })).toThrow('TTL must be a number');
    });
    it('throws for invalid maxSize (not a number)', () => {
      expect(() => ValidationUtils.validateCacheOptions({ maxSize: 'foo' })).toThrow('maxSize must be a number');
    });
    it('throws for invalid maxSize (NaN)', () => {
      expect(() => ValidationUtils.validateCacheOptions({ maxSize: NaN })).toThrow('maxSize must be a number');
    });
    it('throws for invalid maxSize (< 1)', () => {
      expect(() => ValidationUtils.validateCacheOptions({ maxSize: 0 })).toThrow('maxSize must be at least 1');
    });
    it('throws for invalid maxSize (not integer)', () => {
      expect(() => ValidationUtils.validateCacheOptions({ maxSize: 1.5 })).toThrow('maxSize must be an integer');
    });
    it('throws for invalid evictionPolicy', () => {
      expect(() => ValidationUtils.validateCacheOptions({ evictionPolicy: 'RANDOM' })).toThrow('evictionPolicy must be one of: FIFO, LRU');
    });
    it('does not throw for valid options', () => {
      expect(() => ValidationUtils.validateCacheOptions({ ttl: 1000, maxSize: 10, evictionPolicy: 'FIFO' })).not.toThrow();
      expect(() => ValidationUtils.validateCacheOptions({})).not.toThrow();
    });
  });
});
