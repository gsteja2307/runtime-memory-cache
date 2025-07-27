import RuntimeMemoryCache from '../src/index';

describe('RuntimeMemoryCache - Input Validation', () => {
  let cache: RuntimeMemoryCache;

  beforeEach(() => {
    cache = new RuntimeMemoryCache({ enableStats: true });
  });

  describe('Constructor Validation', () => {
    it('should validate maxSize parameter', () => {
      // Invalid maxSize values
      expect(() => {
        new RuntimeMemoryCache({ maxSize: 0 });
      }).toThrow('maxSize must be at least 1');

      expect(() => {
        new RuntimeMemoryCache({ maxSize: -5 });
      }).toThrow('maxSize must be at least 1');

      expect(() => {
        new RuntimeMemoryCache({ maxSize: 1.5 });
      }).toThrow('maxSize must be an integer');

      expect(() => {
        new RuntimeMemoryCache({ maxSize: NaN });
      }).toThrow('maxSize must be a number');

      expect(() => {
        new RuntimeMemoryCache({ maxSize: 'invalid' as any });
      }).toThrow('maxSize must be a number');

      // Valid maxSize values
      expect(() => {
        new RuntimeMemoryCache({ maxSize: 1 });
      }).not.toThrow();

      expect(() => {
        new RuntimeMemoryCache({ maxSize: 1000 });
      }).not.toThrow();
    });

    it('should validate TTL parameter', () => {
      // Invalid TTL values
      expect(() => {
        new RuntimeMemoryCache({ ttl: -100 });
      }).toThrow('TTL cannot be negative');

      expect(() => {
        new RuntimeMemoryCache({ ttl: NaN });
      }).toThrow('TTL must be a number');

      expect(() => {
        new RuntimeMemoryCache({ ttl: Infinity });
      }).toThrow('TTL must be a finite number');

      expect(() => {
        new RuntimeMemoryCache({ ttl: -Infinity });
      }).toThrow('TTL must be a finite number');

      expect(() => {
        new RuntimeMemoryCache({ ttl: 'invalid' as any });
      }).toThrow('TTL must be a number');

      // Valid TTL values
      expect(() => {
        new RuntimeMemoryCache({ ttl: 0 });
      }).not.toThrow();

      expect(() => {
        new RuntimeMemoryCache({ ttl: 1000 });
      }).not.toThrow();

      expect(() => {
        new RuntimeMemoryCache({ ttl: 3600000 });
      }).not.toThrow();
    });

    it('should validate evictionPolicy parameter', () => {
      // Invalid eviction policies
      expect(() => {
        new RuntimeMemoryCache({ evictionPolicy: 'INVALID' as any });
      }).toThrow('evictionPolicy must be one of: FIFO, LRU');

      expect(() => {
        new RuntimeMemoryCache({ evictionPolicy: 'fifo' as any });
      }).toThrow('evictionPolicy must be one of: FIFO, LRU');

      expect(() => {
        new RuntimeMemoryCache({ evictionPolicy: 'random' as any });
      }).toThrow('evictionPolicy must be one of: FIFO, LRU');

      expect(() => {
        new RuntimeMemoryCache({ evictionPolicy: 123 as any });
      }).toThrow('evictionPolicy must be one of: FIFO, LRU');

      // Valid eviction policies
      expect(() => {
        new RuntimeMemoryCache({ evictionPolicy: 'FIFO' });
      }).not.toThrow();

      expect(() => {
        new RuntimeMemoryCache({ evictionPolicy: 'LRU' });
      }).not.toThrow();
    });

    it('should handle undefined parameters gracefully', () => {
      expect(() => {
        new RuntimeMemoryCache({
          ttl: undefined,
          maxSize: undefined,
          enableStats: undefined,
          evictionPolicy: undefined
        });
      }).not.toThrow();
    });
  });

  describe('Key Validation in set() operations', () => {
    it('should reject invalid key types', () => {
      expect(() => {
        cache.set(123 as any, 'value');
      }).toThrow('Cache key must be a string');

      expect(() => {
        cache.set(null as any, 'value');
      }).toThrow('Cache key must be a string');

      expect(() => {
        cache.set(undefined as any, 'value');
      }).toThrow('Cache key must be a string');

      expect(() => {
        cache.set({} as any, 'value');
      }).toThrow('Cache key must be a string');

      expect(() => {
        cache.set([] as any, 'value');
      }).toThrow('Cache key must be a string');

      expect(() => {
        cache.set(true as any, 'value');
      }).toThrow('Cache key must be a string');
    });

    it('should reject empty keys', () => {
      expect(() => {
        cache.set('', 'value');
      }).toThrow('Cache key cannot be empty');
    });

    it('should reject keys that are too long', () => {
      const maxKey = 'a'.repeat(250); // At limit
      const tooLongKey = 'a'.repeat(251); // Over limit

      expect(() => {
        cache.set(maxKey, 'value');
      }).not.toThrow();

      expect(() => {
        cache.set(tooLongKey, 'value');
      }).toThrow('Cache key too long');

      const veryLongKey = 'a'.repeat(1000);
      expect(() => {
        cache.set(veryLongKey, 'value');
      }).toThrow('Cache key too long');
    });

    it('should accept valid keys', () => {
      const validKeys = [
        'a',
        'simple_key',
        'key-with-dashes',
        'key.with.dots',
        'key123',
        'KEY_WITH_CAPS',
        'key with spaces',
        'key:with:colons',
        'key/with/slashes',
        'key@with@symbols',
        'unicode_key_测试',
        '🔑emoji_key',
        'a'.repeat(250) // Max length
      ];

      validKeys.forEach(key => {
        expect(() => {
          cache.set(key, `value for ${key}`);
        }).not.toThrow();

        expect(cache.get(key)).toBe(`value for ${key}`);
      });
    });
  });

  describe('TTL Validation in set() operations', () => {
    it('should reject invalid TTL types', () => {
      expect(() => {
        cache.set('key', 'value', 'invalid' as any);
      }).toThrow('TTL must be a number');

      expect(() => {
        cache.set('key', 'value', null as any);
      }).toThrow('TTL must be a number');

      expect(() => {
        cache.set('key', 'value', {} as any);
      }).toThrow('TTL must be a number');

      expect(() => {
        cache.set('key', 'value', [] as any);
      }).toThrow('TTL must be a number');
    });

    it('should reject negative TTL values', () => {
      expect(() => {
        cache.set('key', 'value', -1);
      }).toThrow('TTL cannot be negative');

      expect(() => {
        cache.set('key', 'value', -1000);
      }).toThrow('TTL cannot be negative');
    });

    it('should reject infinite TTL values', () => {
      expect(() => {
        cache.set('key', 'value', Infinity);
      }).toThrow('TTL must be a finite number');

      expect(() => {
        cache.set('key', 'value', -Infinity);
      }).toThrow('TTL must be a finite number');

      expect(() => {
        cache.set('key', 'value', NaN);
      }).toThrow('TTL must be a number');
    });

    it('should accept valid TTL values', () => {
      const validTTLs = [0, 1, 100, 1000, 3600000];

      validTTLs.forEach(ttl => {
        expect(() => {
          cache.set(`key_${ttl}`, 'value', ttl);
        }).not.toThrow();
      });
    });
  });

  describe('Graceful Error Handling for Read Operations', () => {
    it('should handle invalid keys gracefully in get() operations', () => {
      // Should return undefined instead of throwing
      expect(cache.get('')).toBeUndefined();
      expect(cache.get('a'.repeat(251))).toBeUndefined();
      expect(cache.get(123 as any)).toBeUndefined();
      expect(cache.get(null as any)).toBeUndefined();
      expect(cache.get(undefined as any)).toBeUndefined();
    });

    it('should handle invalid keys gracefully in has() operations', () => {
      // Should return false instead of throwing
      expect(cache.has('')).toBe(false);
      expect(cache.has('a'.repeat(251))).toBe(false);
      expect(cache.has(123 as any)).toBe(false);
      expect(cache.has(null as any)).toBe(false);
      expect(cache.has(undefined as any)).toBe(false);
    });

    it('should handle invalid keys gracefully in del() operations', () => {
      // Should return false instead of throwing
      expect(cache.del('')).toBe(false);
      expect(cache.del('a'.repeat(251))).toBe(false);
      expect(cache.del(123 as any)).toBe(false);
      expect(cache.del(null as any)).toBe(false);
      expect(cache.del(undefined as any)).toBe(false);
    });
  });

  describe('Value Types Acceptance', () => {
    it('should accept all JavaScript value types', () => {
      const testValues = [
        { key: 'string', value: 'hello world' },
        { key: 'number', value: 42 },
        { key: 'boolean_true', value: true },
        { key: 'boolean_false', value: false },
        { key: 'null', value: null },
        { key: 'undefined', value: undefined },
        { key: 'object', value: { name: 'test', nested: { data: 'value' } } },
        { key: 'array', value: [1, 'two', { three: 3 }] },
        { key: 'function', value: function test() { return 'test'; } },
        { key: 'date', value: new Date('2023-01-01') },
        { key: 'regex', value: /test[0-9]+/gi },
        { key: 'symbol', value: Symbol('test') },
        { key: 'bigint', value: BigInt(123) },
        { key: 'empty_object', value: {} },
        { key: 'empty_array', value: [] },
        { key: 'zero', value: 0 },
        { key: 'negative', value: -42 },
        { key: 'float', value: 3.14159 }
      ];

      testValues.forEach(({ key, value }) => {
        expect(() => {
          cache.set(key, value);
        }).not.toThrow();

        const retrieved = cache.get(key);
        if (typeof value === 'function') {
          expect(typeof retrieved).toBe('function');
        } else {
          expect(retrieved).toEqual(value);
        }
      });
    });
  });

  describe('Error Message Quality', () => {
    it('should provide descriptive error messages', () => {
      try {
        cache.set('', 'value');
      } catch (error) {
        expect((error as any).message).toBe('Cache key cannot be empty');
      }

      try {
        cache.set('a'.repeat(251), 'value');
      } catch (error) {
        expect((error as any).message).toContain('Cache key too long');
      }

      try {
        cache.set(123 as any, 'value');
      } catch (error) {
        expect((error as any).message).toBe('Cache key must be a string');
      }

      try {
        cache.set('key', 'value', -100);
      } catch (error) {
        expect((error as any).message).toBe('TTL cannot be negative');
      }

      try {
        new RuntimeMemoryCache({ maxSize: 0 });
      } catch (error) {
        expect((error as any).message).toBe('maxSize must be at least 1');
      }

      try {
        new RuntimeMemoryCache({ evictionPolicy: 'invalid' as any });
      } catch (error) {
        expect((error as any).message).toContain('evictionPolicy must be one of: FIFO, LRU');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle operations on cache after errors', () => {
      // Try invalid operation
      try {
        cache.set('', 'value');
      } catch (error) {
        // Ignore error
      }

      // Cache should still be functional
      cache.set('valid', 'value');
      expect(cache.get('valid')).toBe('value');
      expect(cache.size()).toBe(1);
    });

    it('should maintain state consistency after validation errors', () => {
      cache.set('initial', 'value');
      const initialSize = cache.size();

      // Try several invalid operations
      const invalidOperations = [
        () => cache.set('', 'empty key'),
        () => cache.set('key', 'value', -100),
        () => cache.set(null as any, 'null key'),
        () => cache.set('a'.repeat(300), 'too long')
      ];

      invalidOperations.forEach(operation => {
        try {
          operation();
        } catch (error) {
          // Expected to throw
        }
      });

      // Cache state should be unchanged
      expect(cache.size()).toBe(initialSize);
      expect(cache.get('initial')).toBe('value');
    });
  });
});
