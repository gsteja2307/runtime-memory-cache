// Test to verify set() behavior with existing keys
const RuntimeMemoryCache = require('./dist/index.js').default;

console.log('Testing set() behavior on existing keys:');
const cache = new RuntimeMemoryCache({ maxSize: 3, evictionPolicy: 'FIFO' });

// Set initial value
cache.set('key1', 'value1');

// Get initial timestamps (we'll need to access the store somehow)
// Since store is private, let's test the behavior indirectly
console.log('Initial value:', cache.get('key1'));

// Wait a bit
setTimeout(() => {
  console.log('Setting new value for existing key...');
  cache.set('key1', 'updated_value1');
  
  console.log('Updated value:', cache.get('key1'));
  console.log('Test complete - need to verify if createdAt was preserved');
}, 10);