import { CacheStats } from './types';

/**
 * Statistics tracker for cache operations
 */
export class StatsTracker {
  private stats: CacheStats;

  constructor(maxSize: number) {
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      maxSize,
      evictions: 0
    };
  }

  recordHit(): void {
    this.stats.hits++;
  }

  recordMiss(): void {
    this.stats.misses++;
  }

  recordEviction(): void {
    this.stats.evictions++;
  }

  updateSize(size: number): void {
    this.stats.size = size;
  }

  getStats(): Readonly<CacheStats> {
    return { ...this.stats };
  }

  reset(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.evictions = 0;
    // Keep size and maxSize as they represent current state
  }
}
