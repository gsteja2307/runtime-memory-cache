# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2025-07-20

### Changed
- 🔧 **Simplified publish script** - Made publishing easier with one simple command and removed extra scripts.

## [0.1.0] - 2025-07-20

### Added
- 🚀 **Initial release** of runtime-memory-cache
- 💾 **Core caching functionality** with Map-based storage
- ⏰ **TTL (Time To Live) support** for automatic expiration
- 📏 **Configurable maximum cache size** with FIFO eviction
- 🔧 **Essential API methods**: `set()`, `get()`, `has()`, `del()`
- 📊 **Statistics tracking functionality** (optional) - Track cache hits, misses, evictions
- 🧹 **Manual cleanup method** - `cleanup()` to remove expired entries
- 📏 **Cache size management** - New methods: `size()`, `clear()`, `keys()`
- 🏗️ **Modular architecture** - Separated into specialized modules:
  - `types.ts` - TypeScript interfaces and type definitions
  - `utils.ts` - Utility functions for cache operations  
  - `stats.ts` - Statistics tracking functionality
  - `exports.ts` - Centralized exports
- 📚 **Comprehensive JSDoc documentation** - Full API documentation
- 🎯 **Enhanced playground examples** - Real-world usage scenarios
- 📖 **Detailed README** - Complete API reference with examples
- 🔧 **Build and publish scripts** - `prepublishOnly` and `publish` commands
- 🚫 **Zero dependencies** - Lightweight and self-contained
- 📘 **TypeScript support** with type definitions
- 📄 **MIT license** for open source usage
- 📦 **Package configuration** for npm publishing

### Changed


### Fixed


### Features
- ⚡ **O(1) average case performance** for all operations
- 🔄 **Automatic cleanup** of expired entries on access
- 🪶 **Lightweight design** with minimal memory footprint
- 🟢 **Node.js and TypeScript compatibility**
- 🎯 **Simple and intuitive API**

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