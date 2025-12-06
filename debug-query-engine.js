// Debug script to test QueryEngine directly
const { QueryEngine } = require('./dist/js/core/query/QueryEngine.js');

// Test data
const TEST_DATA = [
  { id: 1, name: 'Test User 1', age: 25, active: true },
  { id: 2, name: 'Test User 2', age: 30, active: false },
  { id: 3, name: 'Test User 3', age: 35, active: true },
];

console.log('Testing QueryEngine directly...');
console.log('Test data:', TEST_DATA);

// Test $in operator
console.log('\nTesting $in operator (id: [1, 3]):');
const result = QueryEngine.filter(TEST_DATA, { id: { $in: [1, 3] } });
console.log('Result:', result);

// Test $eq operator
console.log('\nTesting $eq operator (id: 1):');
const eqResult = QueryEngine.filter(TEST_DATA, { id: 1 });
console.log('Result:', eqResult);

// Test AND operator
console.log('\nTesting AND operator (active: true, age: > 25):');
const andResult = QueryEngine.filter(TEST_DATA, { $and: [{ active: true }, { age: { $gt: 25 } }] });
console.log('Result:', andResult);

// Test LIKE operator
console.log('\nTesting LIKE operator (name: %User%):');
const likeResult = QueryEngine.filter(TEST_DATA, { name: { $like: '%User%' } });
console.log('Result:', likeResult);
