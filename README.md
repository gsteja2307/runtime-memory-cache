# Runtime Memory Cache
[![NPM version](https://img.shields.io/npm/v/runtime-memory-cache.svg)](https://www.npmjs.com/package/runtime-memory-cache)
[![NPM downloads](https://img.shields.io/npm/dm/runtime-memory-cache.svg)](https://www.npmjs.com/package/runtime-memory-cache)
[![GitHub stars](https://img.shields.io/github/stars/gsteja2307/runtime-memory-cache.svg)](https://github.com/gsteja2307/runtime-memory-cache/stargazers)

A lightweight, high-performance in-memory cache for Node.js with TTL support, automatic cleanup, memory usage tracking, and zero dependencies.

## ✨ Features

- **Fast O(1) lookups** using native JavaScript Map
- **TTL (Time To Live) support** with automatic expiration
- **Size limiting** with FIFO or LRU eviction policy
- **Statistics tracking** (optional)
- **Manual cleanup** of expired entries
- **Memory usage tracking** with `getMemoryUsage()`
- **Zero dependencies**
- **TypeScript support** with full type definitions
- **Memory efficient** with automatic garbage collection
## 🧪 Test Coverage

This package includes comprehensive test coverage for all features, including edge cases, validation, eviction, TTL, statistics, and utility logic. Run `npm test` to verify all tests pass.

## 📦 Installation

### Using npm
```bash
npm install runtime-memory-cache
```

### Using yarn
```bash
yarn add runtime-memory-cache
```

### Using pnpm
```bash
pnpm add runtime-memory-cache
```

### Requirements
- Node.js 14+ (recommended: Node.js 16+)
- No additional dependencies required (zero-dependency package)

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
Get estimated memory usage of the cache.

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

interface MemoryUsage {       // Memory usage tracking
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
- Tracks access time for consistency (but doesn't use it for eviction)

### **LRU (Least Recently Used)**
- Removes the entry that hasn't been accessed for the longest time
- Better cache hit rates for access-pattern-based scenarios
- Uses access time tracking for eviction decisions
- On `get()` and `has()`, the accessed key is reordered via delete-and-reinsert to the Map, preserving `createdAt` and `expiresAt` while updating `lastAccessedAt`.

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
4. Update access time on `get()` and `has()` operations for consistency

## ⚡ Performance

- **O(1) average case** for get, set, has, and delete operations
- **Memory efficient** with automatic cleanup of expired entries
- **Zero dependencies** - no external libraries
- **TypeScript optimized** with proper type inference

## 📄 License

MIT

## 🔧 Development Setup

### Prerequisites
- Node.js 16+ and npm
- TypeScript knowledge for contributing

### Getting Started
```bash
# Clone the repository
git clone https://github.com/gsteja2307/runtime-memory-cache.git
cd runtime-memory-cache

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch

# Clean build artifacts
npm run clean

# Run the playground examples
npm run play
```

### Project Structure
```
src/
├── index.ts      # Main cache implementation
├── types.ts      # TypeScript interfaces and types
├── utils.ts      # Utility functions for cache operations
├── stats.ts      # Statistics tracking functionality
├── exports.ts    # Centralized exports
└── playground.ts # Usage examples and testing

tests/
├── basic.test.ts        # Basic cache operations
├── ttl.test.ts          # TTL and expiration tests
├── eviction.test.ts     # Eviction policy tests
├── statistics.test.ts   # Statistics tracking tests
├── validation.test.ts   # Input validation tests
├── utils.test.ts        # Utility function tests
└── integration.test.ts  # Integration and performance tests
```

### Available Scripts
- `npm run build` - Compile TypeScript to JavaScript
- `npm run test` - Run all tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:watch` - Run tests in watch mode
- `npm run clean` - Remove build artifacts
- `npm run dev` - Run development version with ts-node
- `npm run play` - Run playground examples
- `npm run publishPackage` - Build, test, and publish to npm

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests to our repository.

### Contribution Guidelines
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Build the project (`npm run build`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

## 📞 Support

- GitHub Issues: [Create an issue](https://github.com/gsteja2307/runtime-memory-cache/issues)
- Documentation: This README
- Examples: See `src/playground.ts`

