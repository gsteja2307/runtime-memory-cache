import { CacheEntry, CacheOptions, CacheStats, EvictionPolicy, MemoryUsage } from './types';
import { CacheUtils, ValidationUtils } from './utils';
import { StatsTracker } from './stats';

/**
 * A lightweight in-memory cache with TTL support, configurable eviction policies, 
 * memory tracking, and comprehensive error handling
 */
export class RuntimeMemoryCache {
  private readonly store = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private readonly ttl?: number;
  private readonly evictionPolicy: EvictionPolicy;
  private readonly statsTracker?: StatsTracker;

  constructor(options: CacheOptions = {}) {
    // Validate options
    ValidationUtils.validateCacheOptions(options);

    this.ttl = options.ttl;
    this.maxSize = options.maxSize || 1000;
    this.evictionPolicy = options.evictionPolicy || 'FIFO';
    this.statsTracker = options.enableStats ? new StatsTracker(this.maxSize) : undefined;
  }

  /**
   * Store a value in the cache with optional TTL override
   */
  set(key: string, value: any, ttl?: number): void {
    try {
      // Validate inputs
      ValidationUtils.validateKey(key);
      if (ttl !== undefined) {
        ValidationUtils.validateTTL(ttl);
      }

      const existingEntry = this.store.get(key);
      const isUpdate = !!existingEntry && !CacheUtils.isExpired(existingEntry);

      // Handle cache size limit with configurable eviction policy
      if (!isUpdate && this.store.size >= this.maxSize) {
        this.evictEntry();
      }

      const expiresAt = CacheUtils.calculateExpiresAt(ttl, this.ttl);
      
      let entry: CacheEntry;
      if (isUpdate) {
        // Preserve createdAt, update lastAccessedAt for existing entries
        entry = {
          value,
          expiresAt,
          createdAt: existingEntry.createdAt,
          lastAccessedAt: Date.now()
        };
        
        // For LRU: remove and re-add to move to end (most recent position)
        if (this.evictionPolicy === 'LRU') {
          this.store.delete(key);
        }
      } else {
        // Create new entry for new keys
        entry = CacheUtils.createEntry(value, expiresAt);
      }

      this.store.set(key, entry);
      this.updateStats();
    } catch (error) {
      // Re-throw validation errors
      throw error;
    }
  }

  /**
   * Retrieve a value from the cache
   */
  get(key: string): any {
    try {
      ValidationUtils.validateKey(key);
    } catch (error) {
      // For get operations, return undefined for invalid keys instead of throwing
      return undefined;
    }

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

    CacheUtils.updateAccessTime(entry);
    // LRU: move the key to the end by reinserting while preserving createdAt/expiresAt
    if (this.evictionPolicy === 'LRU') {
      this.store.delete(key);
      this.store.set(key, entry);
    }

    this.statsTracker?.recordHit();
    return entry.value;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    try {
      ValidationUtils.validateKey(key);
    } catch (error) {
      // For has operations, return false for invalid keys
      return false;
    }

    const entry = this.store.get(key);

    if (!entry) {
      return false;
    }

    if (CacheUtils.isExpired(entry)) {
      this.store.delete(key);
      this.updateStats();
      return false;
    }
    // TODO: Add logic to update the access time for a cache entry only if the user has configured the cache to update access time on access ("touch").
    // Update the access time for the entry.
    CacheUtils.updateAccessTime(entry);
    // LRU: move the key to the end by reinserting while preserving createdAt/expiresAt
    if (this.evictionPolicy === 'LRU') {
      this.store.delete(key);
      this.store.set(key, entry);
    }

    return true;
  }

  /**
   * Delete a specific key from the cache
   */
  del(key: string): boolean {
    try {
      ValidationUtils.validateKey(key);
    } catch (error) {
      // For delete operations, return false for invalid keys
      return false;
    }

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
   * Get current eviction policy
   */
  getEvictionPolicy(): EvictionPolicy {
    return this.evictionPolicy;
  }

  /**
   * Get estimated memory usage
   */
  getMemoryUsage(): MemoryUsage {
    return CacheUtils.calculateMemoryUsage(this.store);
  }

  /**
   * Evict an entry based on the configured eviction policy
   */
  private evictEntry(): void {
    const keyToEvict = CacheUtils.getKeyToEvict(this.store, this.evictionPolicy);
    if (keyToEvict) {
      this.store.delete(keyToEvict);
      this.statsTracker?.recordEviction();
    }
  }

  /**
   * Update internal statistics
   */
  private updateStats(): void {
    if (this.statsTracker) {
      this.statsTracker.updateSize(this.store.size);
    }
  }
}

// Export types and interfaces for consumers
export { CacheOptions, CacheStats, EvictionPolicy, MemoryUsage } from './types';
export default RuntimeMemoryCache;
