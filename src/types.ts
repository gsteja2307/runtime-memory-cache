/**
 * Internal cache entry structure
 */
export type CacheEntry = {
  value: any;
  expiresAt?: number;
  createdAt: number;
};

/**
 * Cache statistics interface
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  evictions: number;
}

/**
 * Cache configuration options
 */
export interface CacheOptions {
  /** Time to live in milliseconds */
  ttl?: number;
  /** Maximum number of entries allowed in cache */
  maxSize?: number;
  /** Enable statistics tracking */
  enableStats?: boolean;
}
