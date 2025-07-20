import { CacheEntry, EvictionPolicy, MemoryUsage } from './types';

/**
 * Utility class for cache-related operations
 */
export class CacheUtils {
  /**
   * Check if a cache entry is expired
   */
  static isExpired(entry: CacheEntry): boolean {
    return entry.expiresAt !== undefined && entry.expiresAt < Date.now();
  }

  /**
   * Calculate expiration timestamp
   */
  static calculateExpiresAt(ttl?: number, defaultTtl?: number): number | undefined {
    if (ttl !== undefined) {
      return Date.now() + ttl;
    }
    if (defaultTtl !== undefined) {
      return Date.now() + defaultTtl;
    }
    return undefined;
  }

  /**
   * Create a new cache entry
   */
  static createEntry(value: any, expiresAt?: number): CacheEntry {
    const now = Date.now();
    return {
      value,
      expiresAt,
      createdAt: now,
      lastAccessedAt: now
    };
  }

  /**
   * Update access time for LRU tracking
   */
  static updateAccessTime(entry: CacheEntry): void {
    entry.lastAccessedAt = Date.now();
  }

  /**
   * Get the key to evict based on eviction policy
   */
  static getKeyToEvict<K>(store: Map<K, CacheEntry>, evictionPolicy: EvictionPolicy): K | undefined {
    if (store.size === 0) return undefined;

    if (evictionPolicy === 'FIFO') {
      // Return the first key (oldest inserted)
      return store.keys().next().value;
    } else {
      // LRU: Find the least recently used entry
      let lruKey: K | undefined = undefined;
      let oldestAccessTime = Number.MAX_SAFE_INTEGER;

      for (const [key, entry] of store.entries()) {
        if (entry.lastAccessedAt < oldestAccessTime) {
          oldestAccessTime = entry.lastAccessedAt;
          lruKey = key;
        }
      }

      return lruKey;
    }
  }

  /**
   * Get the first key from a Map (for FIFO eviction)
   * @deprecated Use getKeyToEvict instead
   */
  static getFirstKey<K>(map: Map<K, any>): K | undefined {
    const iterator = map.keys().next();
    return iterator.done ? undefined : iterator.value;
  }

  /**
   * Remove expired entries from the cache
   */
  static cleanupExpired<K>(store: Map<K, CacheEntry>): number {
    let removedCount = 0;
    for (const [key, entry] of store.entries()) {
      if (CacheUtils.isExpired(entry)) {
        store.delete(key);
        removedCount++;
      }
    }
    return removedCount;
  }

  /**
   * Estimate memory usage of a cache entry
   */
  static estimateEntrySize(key: string, entry: CacheEntry): number {
    const keySize = new Blob([key]).size;
    const valueSize = CacheUtils.estimateValueSize(entry.value);
    const metadataSize = 24; // Approximate size of timestamps and metadata

    return keySize + valueSize + metadataSize;
  }

  /**
   * Estimate memory size of a value
   */
  static estimateValueSize(value: any): number {
    if (value === null || value === undefined) return 0;

    const type = typeof value;

    switch (type) {
      case 'boolean':
        return 4;
      case 'number':
        return 8;
      case 'string':
        return new Blob([value]).size;
      case 'object':
        if (Array.isArray(value)) {
          return value.reduce((acc, item) => acc + CacheUtils.estimateValueSize(item), 0);
        }
        return new Blob([JSON.stringify(value)]).size;
      default:
        return new Blob([String(value)]).size;
    }
  }

  /**
   * Calculate total memory usage of cache
   */
  static calculateMemoryUsage<K>(store: Map<K, CacheEntry>): MemoryUsage {
    let totalBytes = 0;
    let entryCount = 0;

    for (const [key, entry] of store.entries()) {
      totalBytes += CacheUtils.estimateEntrySize(String(key), entry);
      entryCount++;
    }

    return {
      estimatedBytes: totalBytes,
      averageBytesPerEntry: entryCount > 0 ? Math.round(totalBytes / entryCount) : 0
    };
  }
}

/**
 * Validation utilities for cache operations
 */
export class ValidationUtils {
  /**
   * Validate cache key
   */
  static validateKey(key: string): void {
    if (typeof key !== 'string') {
      throw new TypeError('Cache key must be a string');
    }
    if (key.length === 0) {
      throw new Error('Cache key cannot be empty');
    }
    if (key.length > 250) {
      throw new Error('Cache key too long (maximum 250 characters)');
    }
  }

  /**
   * Validate TTL value
   */
  static validateTTL(ttl: number): void {
    if (typeof ttl !== 'number') {
      throw new TypeError('TTL must be a number');
    }
    if (ttl < 0) {
      throw new Error('TTL cannot be negative');
    }
    if (!isFinite(ttl)) {
      throw new Error('TTL must be a finite number');
    }
  }

  /**
   * Validate cache options
   */
  static validateCacheOptions(options: any): void {
    if (options.ttl !== undefined) {
      ValidationUtils.validateTTL(options.ttl);
    }

    if (options.maxSize !== undefined) {
      if (typeof options.maxSize !== 'number') {
        throw new TypeError('maxSize must be a number');
      }
      if (options.maxSize < 1) {
        throw new Error('maxSize must be at least 1');
      }
      if (!Number.isInteger(options.maxSize)) {
        throw new Error('maxSize must be an integer');
      }
    }

    if (options.evictionPolicy !== undefined) {
      const validPolicies = ['FIFO', 'LRU'];
      if (!validPolicies.includes(options.evictionPolicy)) {
        throw new Error(`evictionPolicy must be one of: ${validPolicies.join(', ')}`);
      }
    }
  }
}
