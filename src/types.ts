/**
 * Internal cache entry structure
 */
export type CacheEntry = {
  value: any;
  expiresAt?: number;
  createdAt: number;
  lastAccessedAt: number;
};

/**
 * Eviction policy options
 */
export type EvictionPolicy = 'FIFO' | 'LRU';

/**
 * Memory usage information
 */
export interface MemoryUsage {
  estimatedBytes: number;
  averageBytesPerEntry: number;
}

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
  /** Eviction policy - FIFO (default) or LRU */
  evictionPolicy?: EvictionPolicy;
  /** Optional custom serialization function */
  serialize?: (value: any) => string;
  /** Optional custom deserialization function */
  deserialize?: (value: string) => any;
}
