import { CacheEntry, CacheOptions, CacheStats } from './types';
import { CacheUtils } from './utils';
import { StatsTracker } from './stats';

/**
 * A lightweight in-memory cache with TTL support and performance optimizations
 */
export class RuntimeMemoryCache {
  private readonly store = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private readonly ttl?: number;
  private readonly statsTracker?: StatsTracker;

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl;
    this.maxSize = options.maxSize || 1000;
    this.statsTracker = options.enableStats ? new StatsTracker(this.maxSize) : undefined;
  }

  /**
   * Store a value in the cache with optional TTL override
   */
  set(key: string, value: any, ttl?: number): void {
    // Handle cache size limit with FIFO eviction
    if (this.store.size >= this.maxSize) {
      this.evictOldest();
    }

    const expiresAt = CacheUtils.calculateExpiresAt(ttl, this.ttl);
    const entry = CacheUtils.createEntry(value, expiresAt);

    this.store.set(key, entry);
    this.updateStats();
  }

  /**
   * Retrieve a value from the cache
   */
  get(key: string): any {
    const entry = this.store.get(key);

    if (!entry) {
      this.statsTracker?.recordMiss();
      return undefined;
    }

    if (CacheUtils.isExpired(entry)) {
      this.store.delete(key);
      this.statsTracker?.recordMiss();
      this.updateStats();
      return undefined;
    }

    this.statsTracker?.recordHit();
    return entry.value;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete a specific key from the cache
   */
  del(key: string): boolean {
    const deleted = this.store.delete(key);
    if (deleted) {
      this.updateStats();
    }
    return deleted;
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.store.size;
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.store.clear();
    this.updateStats();
  }

  /**
   * Get all keys in the cache
   */
  keys(): string[] {
    return Array.from(this.store.keys());
  }

  /**
   * Manually cleanup expired entries
   */
  cleanup(): number {
    const removedCount = CacheUtils.cleanupExpired(this.store);
    if (removedCount > 0) {
      this.updateStats();
    }
    return removedCount;
  }

  /**
   * Get cache statistics (if enabled)
   */
  getStats(): CacheStats | null {
    return this.statsTracker?.getStats() || null;
  }

  /**
   * Reset statistics (if enabled)
   */
  resetStats(): void {
    this.statsTracker?.reset();
  }

  /**
   * Evict the oldest entry from the cache
   */
  private evictOldest(): void {
    const firstKey = CacheUtils.getFirstKey(this.store);
    if (firstKey) {
      this.store.delete(firstKey);
      this.statsTracker?.recordEviction();
    }
  }

  /**
   * Update internal statistics
   */
  private updateStats(): void {
    this.statsTracker?.updateSize(this.store.size);
  }
}

// Export types and interfaces for consumers
export { CacheOptions, CacheStats } from './types';
export default RuntimeMemoryCache;
