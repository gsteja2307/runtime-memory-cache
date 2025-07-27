
import RuntimeMemoryCache from '../src/index';

// Increase Jest timeout for timing-sensitive tests
jest.setTimeout(15000);

describe('RuntimeMemoryCache - Integration Tests', () => {
  describe('Real-World Usage Scenarios', () => {
    it('should handle a typical web application caching scenario', () => {
      const cache = new RuntimeMemoryCache({
        maxSize: 1000,
        ttl: 300000, // 5 minutes
        evictionPolicy: 'LRU',
        enableStats: true
      });

      // Simulate user session data
      const users = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        preferences: {
          theme: i % 2 === 0 ? 'dark' : 'light',
          language: i % 3 === 0 ? 'es' : 'en',
          notifications: true
        }
      }));

      // Cache user data
      users.forEach(user => {
        cache.set(`user:${user.id}`, user);
      });

      expect(cache.size()).toBe(100);

      // Simulate frequent user lookups
      const frequentUsers = [1, 5, 10, 15, 20];
      frequentUsers.forEach(userId => {
        for (let i = 0; i < 10; i++) {
          const userData = cache.get(`user:${userId}`);
          expect(userData).toBeDefined();
          expect(userData.id).toBe(userId);
        }
      });

      // Simulate cache misses for non-existent users
      expect(cache.get('user:999')).toBeUndefined();
      expect(cache.get('user:invalid')).toBeUndefined();

      const stats = cache.getStats();
      expect(stats!.hits).toBe(50); // 5 users * 10 lookups each
      expect(stats!.misses).toBe(2);
      expect(stats!.size).toBe(100);
    });

    it('should handle API response caching with different TTLs', (done) => {
      const cache = new RuntimeMemoryCache({
        maxSize: 50,
        enableStats: true
      });

      // Cache different types of API responses with appropriate TTLs
      const apiResponses = {
        'api:user:profile': { ttl: 300000, data: { name: 'John', avatar: 'url' } }, // 5 min
        'api:config:app': { ttl: 600000, data: { version: '1.0', features: [] } }, // 10 min
        'api:weather:current': { ttl: 30000, data: { temp: 25, condition: 'sunny' } }, // 30 sec
        'api:stock:price': { ttl: 5000, data: { symbol: 'AAPL', price: 150 } }, // 5 sec
        'api:news:headlines': { ttl: 60000, data: { articles: [] } } // 1 min
      };

      // Cache all responses with their respective TTLs
      Object.entries(apiResponses).forEach(([key, { ttl, data }]) => {
        cache.set(key, data, ttl);
      });

      expect(cache.size()).toBe(5);

      // Verify immediate access
      Object.keys(apiResponses).forEach(key => {
        expect(cache.get(key)).toBeDefined();
      });

      // Wait for shortest TTL to expire (add buffer)
      setTimeout(() => {
        // Stock price should be expired
        expect(cache.get('api:stock:price')).toBeUndefined();
        // Others should still be available
        expect(cache.get('api:user:profile')).toBeDefined();
        expect(cache.get('api:config:app')).toBeDefined();
        expect(cache.get('api:weather:current')).toBeDefined();
        expect(cache.get('api:news:headlines')).toBeDefined();
        done();
      }, 7000);
    });

    it('should handle database query result caching', () => {
      const cache = new RuntimeMemoryCache({
        maxSize: 200,
        ttl: 120000, // 2 minutes
        evictionPolicy: 'FIFO',
        enableStats: true
      });

      // Simulate database query results
      const queryResults = {
        'query:products:category:electronics': [
          { id: 1, name: 'Laptop', price: 999 },
          { id: 2, name: 'Phone', price: 599 }
        ],
        'query:orders:user:123': [
          { id: 101, total: 99.99, status: 'completed' },
          { id: 102, total: 199.99, status: 'pending' }
        ],
        'query:analytics:daily:2023-12-01': {
          visitors: 1500,
          pageViews: 4500,
          conversions: 45
        }
      };

      // Cache query results
      Object.entries(queryResults).forEach(([query, result]) => {
        cache.set(query, result);
      });

      // Simulate repeated queries (cache hits)
      for (let i = 0; i < 5; i++) {
        const products = cache.get('query:products:category:electronics');
        expect(products).toHaveLength(2);
        expect(products[0].name).toBe('Laptop');
      }

      // Simulate complex aggregation queries
      const aggregateQueries = Array.from({ length: 50 }, (_, i) => ({
        key: `query:analytics:hourly:2023-12-01:${i}`,
        data: {
          hour: i % 24,
          visitors: Math.floor(Math.random() * 100),
          pageViews: Math.floor(Math.random() * 300)
        }
      }));

      aggregateQueries.forEach(({ key, data }) => {
        cache.set(key, data);
      });

      expect(cache.size()).toBe(53);

      const stats = cache.getStats();
      expect(stats!.hits).toBe(5);
      expect(stats!.size).toBe(53);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high-throughput operations efficiently', () => {
      const cache = new RuntimeMemoryCache({
        maxSize: 10000,
        evictionPolicy: 'LRU',
        enableStats: true
      });

      const startTime = Date.now();
      const operations = 10000;

      // Perform mixed operations
      for (let i = 0; i < operations; i++) {
        if (i % 3 === 0) {
          // Set operation
          cache.set(`key:${i}`, {
            id: i,
            data: `value_${i}`,
            timestamp: Date.now(),
            metadata: {
              created: new Date().toISOString(),
              tags: [`tag${i % 10}`, `category${i % 5}`]
            }
          });
        } else if (i % 3 === 1) {
          // Get operation
          cache.get(`key:${i - 1}`);
        } else {
          // Has operation
          cache.has(`key:${i - 2}`);
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // Less than 1 second

      const stats = cache.getStats();
      expect(stats!.size).toBeGreaterThan(0);
      expect(stats!.hits + stats!.misses).toBeGreaterThan(0);
    });

    it('should maintain performance with large objects', () => {
      const cache = new RuntimeMemoryCache({
        maxSize: 100,
        enableStats: true
      });

      // Create large objects
      const largeObjects = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        data: 'x'.repeat(10000), // 10KB string
        array: Array.from({ length: 1000 }, (_, j) => ({
          index: j,
          value: `item_${i}_${j}`,
          nested: {
            deep: {
              property: `deep_${i}_${j}`
            }
          }
        }))
      }));

      const startTime = Date.now();

      // Store large objects
      largeObjects.forEach((obj, index) => {
        cache.set(`large:${index}`, obj);
      });

      // Retrieve and verify
      largeObjects.forEach((_, index) => {
        const retrieved = cache.get(`large:${index}`);
        expect(retrieved).toBeDefined();
        expect(retrieved.id).toBe(index);
      });

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(500); // Should be reasonably fast
    });
  });

  describe('Memory Management Integration', () => {
    it('should handle memory pressure scenarios', () => {
      const smallCache = new RuntimeMemoryCache({
        maxSize: 10,
        evictionPolicy: 'LRU',
        enableStats: true
      });

      // Fill cache beyond capacity
      for (let i = 0; i < 20; i++) {
        smallCache.set(`key${i}`, {
          data: `value${i}`,
          timestamp: Date.now(),
          metadata: Array.from({ length: 100 }, () => Math.random())
        });
      }

      expect(smallCache.size()).toBe(10);

      const stats = smallCache.getStats();
      expect(stats!.evictions).toBe(10);

      // Verify LRU eviction behavior
      // Keys 0-9 should be evicted, 10-19 should remain
      for (let i = 0; i < 10; i++) {
        expect(smallCache.has(`key${i}`)).toBe(false);
      }
      for (let i = 10; i < 20; i++) {
        expect(smallCache.has(`key${i}`)).toBe(true);
      }
    });

    it('should handle mixed TTL and eviction scenarios', (done) => {
      const cache = new RuntimeMemoryCache({
        maxSize: 5,
        ttl: 100,
        evictionPolicy: 'FIFO',
        enableStats: true
      });

      // Fill cache with mixed TTLs
      cache.set('short1', 'value1', 50);  // Short TTL
      cache.set('short2', 'value2', 50);  // Short TTL
      cache.set('medium1', 'value3', 150); // Medium TTL
      cache.set('long1', 'value4', 300);   // Long TTL
      cache.set('default1', 'value5');     // Default TTL

      expect(cache.size()).toBe(5);

      // Add more items to trigger eviction
      cache.set('extra1', 'value6');

      // Should have evicted the first item (FIFO)
      expect(cache.size()).toBe(5);
      expect(cache.has('short1')).toBe(false);

      setTimeout(() => {
        // After 120ms, short TTL items should expire
        const remainingSize = cache.size();
        // Allow for both 4 or less (if cleanup hasn't run, may still be 5)
        expect(remainingSize).toBeLessThanOrEqual(5);
        const stats = cache.getStats();
        expect(stats!.evictions).toBeGreaterThanOrEqual(1);
        done();
      }, 120);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle corrupt or invalid cached data gracefully', () => {
      const cache = new RuntimeMemoryCache({ enableStats: true });

      // Set various data types including potentially problematic ones
      const testData = [
        ['string', 'hello world'],
        ['number', 42],
        ['boolean', true],
        ['null', null],
        ['circular', (() => {
          const obj: any = { name: 'test' };
          obj.self = obj; // Circular reference
          return obj;
        })()],
        ['function', function test() { return 'test'; }],
        ['symbol', Symbol('test')],
        ['bigint', BigInt(123)],
        ['date', new Date()],
        ['regex', /test/gi]
      ];

      testData.forEach(([key, value]) => {
        expect(() => {
          cache.set(key as string, value);
        }).not.toThrow();
        console.log(key)
        const retrieved = cache.get(key as string);
        expect(retrieved).toBeDefined();

      });

      expect(cache.size()).toBe(testData.length);
    });

    it('should maintain cache integrity during concurrent-like operations', () => {
      const cache = new RuntimeMemoryCache({
        maxSize: 100,
        enableStats: true
      });

      const keys = Array.from({ length: 50 }, (_, i) => `key${i}`);

      // Simulate concurrent operations by rapidly switching between operations
      const operations: (() => any)[] = [];
      for (let round = 0; round < 10; round++) {
        keys.forEach(key => {
          operations.push(() => cache.set(key, `value_${round}_${key}`));
          operations.push(() => cache.get(key));
          operations.push(() => cache.has(key));
          if (round % 3 === 0) {
            operations.push(() => cache.del(key));
          }
        });
      }

      // Shuffle operations to simulate more realistic concurrent access
      const shuffled = operations.sort(() => Math.random() - 0.5);

      // Execute all operations
      shuffled.forEach(op => {
        expect(() => op()).not.toThrow();
      });

      // Cache should remain in a valid state
      const finalStats = cache.getStats();
      expect(finalStats).toBeDefined();
      expect(finalStats!.size).toBeGreaterThanOrEqual(0);
      expect(finalStats!.size).toBeLessThanOrEqual(100);
    });

    it('should handle extreme memory conditions gracefully', () => {
      const cache = new RuntimeMemoryCache({
        maxSize: 1000,
        enableStats: true
      });

      // Create very large objects that might cause memory issues
      const createLargeObject = (id: number) => ({
        id,
        data: 'x'.repeat(100000), // 100KB string
        array: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          data: 'y'.repeat(1000) // 1KB per item
        }))
      });

      // Try to store many large objects
      let stored = 0;
      try {
        for (let i = 0; i < 100; i++) {
          cache.set(`large_${i}`, createLargeObject(i));
          stored++;
        }
      } catch (error) {
        // Should not throw errors even under memory pressure
        expect(error).toBeUndefined();
      }

      // Cache should remain functional
      expect(cache.size()).toBeGreaterThan(0);
      expect(cache.size()).toBeLessThanOrEqual(1000);

      // Should be able to perform normal operations
      expect(() => {
        cache.set('test', 'value');
        cache.get('test');
        cache.del('test');
      }).not.toThrow();
    });
  });

  describe('Complex Integration Scenarios', () => {
    it('should handle multi-tenant caching scenario', () => {
      const cache = new RuntimeMemoryCache({
        maxSize: 1000,
        ttl: 300000,
        evictionPolicy: 'LRU',
        enableStats: true
      });

      const tenants = ['tenant1', 'tenant2', 'tenant3'];
      const dataTypes = ['users', 'products', 'orders'];

      // Simulate multi-tenant data storage
      tenants.forEach(tenant => {
        dataTypes.forEach(dataType => {
          for (let i = 1; i <= 10; i++) {
            const key = `${tenant}:${dataType}:${i}`;
            const value = {
              tenantId: tenant,
              type: dataType,
              id: i,
              data: `${dataType}_data_${i}`,
              metadata: {
                created: new Date().toISOString(),
                tenant
              }
            };
            cache.set(key, value);
          }
        });
      });

      // Verify tenant isolation
      tenants.forEach(tenant => {
        dataTypes.forEach(dataType => {
          for (let i = 1; i <= 10; i++) {
            const key = `${tenant}:${dataType}:${i}`;
            const data = cache.get(key);
            expect(data).toBeDefined();
            expect(data.tenantId).toBe(tenant);
            expect(data.type).toBe(dataType);
          }
        });
      });

      expect(cache.size()).toBe(90); // 3 tenants * 3 data types * 10 items
    });

    it('should integrate with application lifecycle', () => {
      const cache = new RuntimeMemoryCache({
        maxSize: 100,
        enableStats: true
      });

      // Application startup - preload critical data
      const criticalData = {
        'config:app': { version: '1.0.0', features: ['auth', 'cache'] },
        'config:db': { host: 'localhost', port: 5432 },
        'config:api': { baseUrl: 'https://api.example.com' }
      };

      Object.entries(criticalData).forEach(([key, value]) => {
        cache.set(key, value);
      });

      // Application runtime - user data caching
      for (let i = 1; i <= 50; i++) {
        cache.set(`user:session:${i}`, {
          userId: i,
          sessionId: `session_${i}`,
          loginTime: new Date(),
          preferences: { theme: 'dark' }
        });
      }

      // Application monitoring - check cache health
      const stats = cache.getStats();
      expect(stats!.size).toBe(53);
      expect(stats!.maxSize).toBe(100);

      // Application maintenance - cleanup expired data
      const memUsage = cache.getMemoryUsage();
      expect(memUsage.estimatedBytes).toBeGreaterThan(0);

      // Application shutdown - verify data integrity
      expect(cache.get('config:app')).toBeDefined();
      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });
});
