# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [0.3.1] - 2025-01-03

### Changed
- **Enhanced Access Tracking**: The `lastAccessedAt` property is now updated on all cache entries during `.get()` and `.has()` operations, regardless of eviction policy (FIFO/LRU)
- **Improved Consistency**: Previously, `lastAccessedAt` was only updated when eviction policy was set to 'LRU', now it's consistently maintained across all eviction policies
- **Future Compatibility**: This change enables future features that may depend on access time tracking

### Added
- **Comprehensive Test Coverage**: Added specific tests to verify `lastAccessedAt` updates work correctly for FIFO caches
- **Cross-Policy Verification**: Added tests to ensure consistent behavior between FIFO and LRU policies for access tracking


## [0.3.0] - 2025-07-28

### Added
- **Memory Tracking Released**: `getMemoryUsage()` method is now available in the public API, providing memory usage statistics:
  - `estimatedBytes`: Total estimated memory usage in bytes
  - `averageBytesPerEntry`: Average memory usage per cache entry
- **Comprehensive Test Coverage**: All features, edge cases, validation, eviction, TTL, statistics, and utility logic are now fully covered by automated tests.

### Changed
- **Documentation**: Updated README to document `getMemoryUsage` as a released feature and highlight improved test coverage.


## [0.2.0] - 2025-07-21

### Added

- **Input Validation**: Comprehensive validation for all cache operations
  - Empty key validation with descriptive error messages
  - Maximum key length validation (250 characters)
  - TTL validation (must be positive numbers)
  - Graceful error handling for invalid inputs
- **Enhanced Statistics**: Memory usage tracking integrated into cache statistics
  - Updated `CacheStats` interface with `memoryUsage` property
  - Real-time memory usage calculation and tracking
- **LRU (Least Recently Used) eviction policy** - New eviction option alongside existing FIFO
- **Configurable eviction policies** - Choose between FIFO and LRU eviction strategies
- **Access time tracking** - Tracks last access time for LRU implementation
- **New API method**: `getEvictionPolicy()` - Get current eviction policy
- **Enhanced playground examples** - Demonstrates both FIFO and LRU eviction policies

### Changed
- **Improved cache entry structure** - Added `lastAccessedAt` field for LRU support
- **Enhanced utility functions** - New `getKeyToEvict()` method for policy-based eviction
- **Updated documentation** - Comprehensive eviction policy documentation in README
- **Error Handling**: More robust error handling with specific error messages

### Fixed  
- **Better has() method** - Now properly updates access time for LRU without calling get()

## [0.1.1] - 2025-07-20

### Changed
- **Simplified publish script** - Made publishing easier with one simple command and removed extra scripts.

## [0.1.0] - 2025-07-20

### Added
- **Initial release** of runtime-memory-cache
- **Core caching functionality** with Map-based storage
- **TTL (Time To Live) support** for automatic expiration
- **Configurable maximum cache size** with FIFO eviction
- **Essential API methods**: `set()`, `get()`, `has()`, `del()`
- **Statistics tracking functionality** (optional) - Track cache hits, misses, evictions
- **Manual cleanup method** - `cleanup()` to remove expired entries
- **Cache size management** - New methods: `size()`, `clear()`, `keys()`
- **Modular architecture** - Separated into specialized modules:
  - `types.ts` - TypeScript interfaces and type definitions
  - `utils.ts` - Utility functions for cache operations  
  - `stats.ts` - Statistics tracking functionality
  - `exports.ts` - Centralized exports
- **Comprehensive JSDoc documentation** - Full API documentation
- **Enhanced playground examples** - Real-world usage scenarios
- **Detailed README** - Complete API reference with examples
- **Build and publish scripts** - `prepublishOnly` and `publish` commands
- **Zero dependencies** - Lightweight and self-contained
- **TypeScript support** with type definitions
- **MIT license** for open source usage
- **Package configuration** for npm publishing

### Changed


### Fixed


### Features
- **O(1) average case performance** for all operations
- **Automatic cleanup** of expired entries on access
- **Lightweight design** with minimal memory footprint
- **Node.js and TypeScript compatibility**
- **Simple and intuitive API**

---

## Release Notes

### v0.1.1 - Updated Publish Script
Made publishing easier with one simple command and removed extra scripts.

### v0.1.0 - Initial Release
This is the first release of runtime-memory-cache, providing a comprehensive in-memory caching solution for Node.js applications. The focus was on performance, modularity, and developer experience while maintaining zero dependencies.

**🏗️ Architecture:**
- Modular codebase for better maintainability
- Comprehensive TypeScript definitions
- Statistics tracking for performance monitoring

**📊 Core Functionality:**
- Fast lookups using native JavaScript Map
- Automatic TTL expiration with robust handling
- Size limiting with FIFO eviction policy
- Cache analytics and statistics (optional)
- Manual cleanup utilities
- Extended API with utility methods

**📚 Documentation & Examples:**
- Complete API documentation
- Real-world usage examples in playground
- Comprehensive README with multiple use cases
- Professional changelog following standards

**🔧 Developer Experience:**
- TypeScript support with type safety
- Zero dependencies for lightweight deployment
- Simple and intuitive API design

---

## Release Notes

### v0.2.0 - LRU Eviction Policy
Added support for Least Recently Used (LRU) eviction policy alongside the existing FIFO policy.

### v0.1.1 - Workflow Optimization
Made publishing easier with one simple command and removed extra scripts.

### v0.1.0 - Initial Release
First version with all the main features - fast caching, TTL support, statistics tracking, and clean modular code.