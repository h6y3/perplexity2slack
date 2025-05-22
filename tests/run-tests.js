/**
 * Test runner for Perplexity2Slack
 * Runs all test suites
 */

// Import test suites
const extractorTests = require('./extractor.test');
const formatterTests = require('./formatter.test');

// Run all test suites
console.log('=== Running Perplexity2Slack Test Suite ===\n');

// Track overall success
let allPassed = true;

// Run extractor tests
console.log('Running Extractor Tests:');
const extractorPassed = extractorTests.runTests();
allPassed = allPassed && extractorPassed;

console.log('\n----------------------------------------\n');

// Run formatter tests
console.log('Running Formatter Tests:');
const formatterPassed = formatterTests.runTests();
allPassed = allPassed && formatterPassed;

// Print overall results
console.log('\n=== Test Suite Summary ===');
if (allPassed) {
  console.log('✅ All tests passed');
  process.exit(0);
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}