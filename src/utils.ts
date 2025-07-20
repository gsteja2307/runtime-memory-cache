import { CacheEntry } from './types';

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
    return {
      value,
      expiresAt,
      createdAt: Date.now()
    };
  }

  /**
   * Get the first key from a Map (for FIFO eviction)
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
}
