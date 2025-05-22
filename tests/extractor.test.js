/**
 * Tests for the content extraction functionality
 */

// Import the extractor module
const { cleanTextContent } = require('../lib/extractor');

// Test cases for citation cleaning
const citationTests = [
  {
    name: "Basic citation removal",
    input: "This text has citations [1][2][3].",
    expected: "This text has citations."
  },
  {
    name: "Citation in the middle of text",
    input: "Porsche 911 [1] is a popular car.",
    expected: "Porsche 911 is a popular car."
  },
  {
    name: "Multiple citations",
    input: "This statement [1][2] has multiple citations [3][4].",
    expected: "This statement has multiple citations."
  },
  {
    name: "Citations with spaces",
    input: "Text with spaced citations [ 1 ] [ 2 ].",
    expected: "Text with spaced citations."
  },
  {
    name: "Unbracketed citations",
    input: "This has a citation at the end 123.",
    expected: "This has a citation at the end."
  },
  {
    name: "Mixed citation formats",
    input: "Text with mixed citations [1] and 123.",
    expected: "Text with mixed citations and."
  }
];

// Test cases for punctuation spacing
const punctuationTests = [
  {
    name: "Space after period",
    input: "First sentence.Second sentence",
    expected: "First sentence. Second sentence"
  },
  {
    name: "Space after comma",
    input: "One,two,three",
    expected: "One, two, three"
  },
  {
    name: "Multiple punctuation marks",
    input: "Item one;item two:item three",
    expected: "Item one; item two: item three"
  },
  {
    name: "Already correct spacing",
    input: "This is correct. This is also correct.",
    expected: "This is correct. This is also correct."
  },
  {
    name: "Extra spaces before punctuation",
    input: "Too many   spaces , before punctuation .",
    expected: "Too many spaces, before punctuation."
  }
];

// Combined test cases
const combinedTests = [
  {
    name: "Real-world example",
    input: "Porsche 911 [1][2]: Frequently mentioned as an alternative [3].",
    expected: "Porsche 911: Frequently mentioned as an alternative."
  },
  {
    name: "Citations and spacing issues",
    input: "Item one[1],item two[2].Item three",
    expected: "Item one, item two. Item three"
  }
];

// Run tests for text cleaning
function runTests() {
  let passCount = 0;
  let failCount = 0;
  
  function testFunction(testCases, description) {
    console.log(`\n--- Testing ${description} ---`);
    
    testCases.forEach(test => {
      const result = cleanTextContent(test.input);
      const passed = result === test.expected;
      
      if (passed) {
        console.log(`✅ PASS: ${test.name}`);
        passCount++;
      } else {
        console.log(`❌ FAIL: ${test.name}`);
        console.log(`  Input:    "${test.input}"`);
        console.log(`  Expected: "${test.expected}"`);
        console.log(`  Actual:   "${result}"`);
        failCount++;
      }
    });
  }
  
  // Run the test groups
  testFunction(citationTests, 'Citation Removal');
  testFunction(punctuationTests, 'Punctuation Spacing');
  testFunction(combinedTests, 'Combined Functionality');
  
  // Print summary
  console.log(`\n--- Test Summary ---`);
  console.log(`${passCount} tests passed, ${failCount} tests failed`);
  
  return failCount === 0;
}

// Execute tests
if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = {
  runTests
};