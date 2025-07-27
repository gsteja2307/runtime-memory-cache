import RuntimeMemoryCache from '../src/index';

describe('RuntimeMemoryCache - Statistics Tracking', () => {
  let cache: RuntimeMemoryCache;

  beforeEach(() => {
    cache = new RuntimeMemoryCache({ maxSize: 10, enableStats: true });
  });

  it('should track hits, misses, evictions, and size', () => {
    expect(cache.getStats()).not.toBeNull();
    expect(cache.getStats()!.hits).toBe(0);
    expect(cache.getStats()!.misses).toBe(0);
    expect(cache.getStats()!.evictions).toBe(0);
    expect(cache.getStats()!.size).toBe(0);
    expect(cache.getStats()!.maxSize).toBe(10);

    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    expect(cache.get('a')).toBe(1);
    expect(cache.get('x')).toBeUndefined();
    expect(cache.getStats()!.hits).toBe(1);
    expect(cache.getStats()!.misses).toBe(1);
    expect(cache.getStats()!.size).toBe(3);
    expect(cache.getStats()!.evictions).toBe(0);

    // Fill and trigger eviction
    cache.set('d', 4);
    cache.set('e', 5);
    cache.set('f', 6);
    cache.set('g', 7);
    cache.set('h', 8);
    cache.set('i', 9);
    cache.set('j', 10);
    cache.set('k', 11); // Should evict one
    expect(cache.getStats()!.evictions).toBeGreaterThan(0);
    expect(cache.getStats()!.size).toBe(10);
  });

  it('should return null stats if disabled', () => {
    const noStats = new RuntimeMemoryCache({ enableStats: false });
    noStats.set('a', 1);
    expect(noStats.getStats()).toBeNull();
  });
});
