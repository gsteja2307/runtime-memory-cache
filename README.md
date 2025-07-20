# Runtime Memory Cache

A lightweight, high-performance in-memory cache for Node.js with TTL support, automatic cleanup, and zero dependencies.

## ✨ Features

- **Fast O(1) lookups** using native JavaScript Map
- **TTL (Time To Live) support** with automatic expiration
- **Size limiting** with FIFO eviction policy
- **Statistics tracking** (optional)
- **Manual cleanup** of expired entries
- **Zero dependencies**
- **TypeScript support** with full type definitions
- **Memory efficient** with automatic garbage collection

## 📦 Installation

```bash
npm install runtime-memory-cache
```

## 🚀 Quick Start

```typescript
import RuntimeMemoryCache from 'runtime-memory-cache';

// Create cache with options
const cache = new RuntimeMemoryCache({
  ttl: 60000,           // 1 minute default TTL
  maxSize: 1000,        // Maximum 1000 entries
  enableStats: true,    // Enable statistics tracking
  evictionPolicy: 'LRU' // Use LRU eviction policy
});

// Store data
cache.set('user:123', { name: 'John', age: 30 });

// Retrieve data
const user = cache.get('user:123');
console.log(user); // { name: 'John', age: 30 }

// Check if key exists
if (cache.has('user:123')) {
  console.log('User exists!');
}
```

## 📚 API Reference

### Constructor Options

```typescript
interface CacheOptions {
  ttl?: number;        // Default TTL in milliseconds
  maxSize?: number;    // Maximum cache entries (default: 1000)
  enableStats?: boolean; // Enable statistics tracking (default: false)
  evictionPolicy?: 'FIFO' | 'LRU'; // Eviction policy (default: 'FIFO')
}
```

### Methods

#### `set(key: string, value: any, ttl?: number): void`
Store a value with optional TTL override.

```typescript
cache.set('key', 'value');                    // Uses default TTL
cache.set('key', 'value', 30000);            // 30 second TTL
cache.set('key', 'value', undefined);        // No expiration
```

#### `get(key: string): any`
Retrieve a value. Returns `undefined` if key doesn't exist or has expired.

```typescript
const value = cache.get('key');
```

#### `has(key: string): boolean`
Check if key exists and is not expired.

```typescript
if (cache.has('key')) {
  // Key exists and is valid
}
```

#### `del(key: string): boolean`
Delete a specific key. Returns `true` if key existed.

```typescript
const wasDeleted = cache.del('key');
```

#### `size(): number`
Get current number of entries in cache.

```typescript
console.log(cache.size()); // 42
```

#### `clear(): void`
Remove all entries from cache.

```typescript
cache.clear();
```

#### `keys(): string[]`
Get array of all keys in cache.

```typescript
const allKeys = cache.keys();
```

#### `cleanup(): number`
Manually remove expired entries. Returns number of entries removed.

```typescript
const removedCount = cache.cleanup();
console.log(`Removed ${removedCount} expired entries`);
```

#### `getStats(): CacheStats | null`
Get cache statistics (if enabled).

```typescript
const stats = cache.getStats();
if (stats) {
  console.log(`Hits: ${stats.hits}, Misses: ${stats.misses}`);
}
```

#### `resetStats(): void`
Reset statistics counters (if enabled).

#### `getEvictionPolicy(): 'FIFO' | 'LRU'`
Get the current eviction policy being used.

```typescript
console.log(cache.getEvictionPolicy()); // 'FIFO' or 'LRU'
```

#### `getMemoryUsage(): { estimatedBytes: number; averageBytesPerEntry: number }`
Get estimated memory usage of the cache. (NOT RELEASED)

```typescript
const memInfo = cache.getMemoryUsage();
console.log(`Cache uses ~${memInfo.estimatedBytes} bytes`);
console.log(`Average: ${memInfo.averageBytesPerEntry} bytes per entry`);
```

## 📊 Statistics

When `enableStats: true`, you can track cache performance:

```typescript
interface CacheStats {
  hits: number;        // Cache hits
  misses: number;      // Cache misses  
  size: number;        // Current cache size
  maxSize: number;     // Maximum allowed size
  evictions: number;   // Number of evicted entries
}
(NOT RELEASED)
interface memoryUsage {       // Memory usage tracking
    estimatedBytes: number;        // Total estimated bytes
    averageBytesPerEntry: number;  // Average bytes per entry
  };
```

## 🔧 Usage Examples

### API Response Caching

```typescript
const apiCache = new RuntimeMemoryCache({ 
  ttl: 300000,    // 5 minutes
  maxSize: 1000,
  enableStats: true 
});

async function fetchUser(userId: string) {
  const cacheKey = `user:${userId}`;
  
  // Try cache first
  let user = apiCache.get(cacheKey);
  if (user) return user;
  
  // Fetch from API and cache
  user = await fetch(`/api/users/${userId}`).then(r => r.json());
  apiCache.set(cacheKey, user);
  
  return user;
}
```

### Database Query Caching

```typescript
const dbCache = new RuntimeMemoryCache({ ttl: 120000 }); // 2 minutes

async function getProductById(id: string) {
  const cacheKey = `product:${id}`;
  
  let product = dbCache.get(cacheKey);
  if (product) return product;
  
  product = await db.query('SELECT * FROM products WHERE id = ?', [id]);
  dbCache.set(cacheKey, product);
  
  return product;
}
```

### Session Management

```typescript
const sessionCache = new RuntimeMemoryCache({ 
  ttl: 1800000,  // 30 minutes
  maxSize: 10000 
});

function createSession(userId: string, data: any): string {
  const sessionId = generateId();
  sessionCache.set(`session:${sessionId}`, { userId, ...data });
  return sessionId;
}

function getSession(sessionId: string) {
  return sessionCache.get(`session:${sessionId}`);
}
```

### Rate Limiting

```typescript
const rateLimiter = new RuntimeMemoryCache({ ttl: 60000 }); // 1 minute window

function checkRateLimit(clientId: string, maxRequests: number = 100): boolean {
  const key = `rate:${clientId}`;
  const current = rateLimiter.get(key) || 0;
  
  if (current >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  rateLimiter.set(key, current + 1);
  return true;
}
```

## 🏗️ Architecture

The cache is built with a modular architecture:

- **`types.ts`** - TypeScript interfaces and type definitions
- **`utils.ts`** - Utility functions for cache operations  
- **`stats.ts`** - Statistics tracking functionality
- **`index.ts`** - Main cache implementation

This structure makes the code maintainable, testable, and easy to extend.

## 🔄 Eviction Policies

When the cache reaches `maxSize`, it automatically removes entries based on the configured eviction policy:

### **FIFO (First In, First Out)** - Default
- Removes the oldest inserted entry first
- Simple and predictable behavior
- Good for time-based caching scenarios

### **LRU (Least Recently Used)**
- Removes the entry that hasn't been accessed for the longest time
- Better cache hit rates for access-pattern-based scenarios
- Tracks access time on `get()` and `has()` operations

```typescript
// FIFO Cache (default)
const fifoCache = new RuntimeMemoryCache({ 
  maxSize: 100, 
  evictionPolicy: 'FIFO' 
});

// LRU Cache  
const lruCache = new RuntimeMemoryCache({ 
  maxSize: 100, 
  evictionPolicy: 'LRU' 
});
```

Both policies:
1. Automatically remove entries when cache is full
2. Track eviction count in statistics
3. Maintain O(1) average performance

## ⚡ Performance

- **O(1) average case** for get, set, has, and delete operations
- **Memory efficient** with automatic cleanup of expired entries
- **Zero dependencies** - no external libraries
- **TypeScript optimized** with proper type inference

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests to our repository.

## 📞 Support

- GitHub Issues: [Create an issue](https://github.com/gsteja2307/runtime-memory-cache/issues)
- Documentation: This README
- Examples: See `src/playground.ts`

