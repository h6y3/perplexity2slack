/**
 * Tests for the Slack formatting functionality
 */

// Import the formatter module
const { formatForSlack } = require('../lib/formatter');

// Test cases for Slack formatting
const slackFormatTests = [
  {
    name: "Bold formatting",
    input: "This has **bold** text in it.",
    expected: "This has *bold* text in it."
  },
  {
    name: "Link formatting",
    input: "Here is a [link](https://example.com) to click.",
    expected: "Here is a <https://example.com|link> to click."
  },
  {
    name: "List formatting - bullets",
    input: "* Item one\n* Item two\n* Item three",
    expected: "• Item one\n• Item two\n• Item three"
  },
  {
    name: "List formatting - dashes",
    input: "- Item one\n- Item two\n- Item three",
    expected: "• Item one\n• Item two\n• Item three"
  },
  {
    name: "List formatting - numbered",
    input: "1. First item\n2. Second item\n3. Third item",
    expected: "• First item\n• Second item\n• Third item"
  },
  {
    name: "Code block formatting",
    input: "```javascript\nconst x = 1;\n```",
    expected: "```\nconst x = 1;\n```"
  },
  {
    name: "Inline code formatting",
    input: "Use the `console.log()` function.",
    expected: "Use the `console.log()` function."
  },
  {
    name: "Punctuation spacing",
    input: "First sentence.Second sentence",
    expected: "First sentence. Second sentence"
  },
  {
    name: "Preserve existing formatting",
    input: "*Already* in _Slack_ format.",
    expected: "*Already* in _Slack_ format."
  }
];

// Test cases for complete examples
const complexExamples = [
  {
    name: "Complex document with multiple elements",
    input: `# Heading

**Bold text** with [link](https://example.com).

* List item one
* List item two

1. Numbered item
2. Another numbered item

\`\`\`
code block
\`\`\``,
    expected: `*Heading*

*Bold text* with <https://example.com|link>.

• List item one
• List item two

• Numbered item
• Another numbered item

\`\`\`
code block
\`\`\``
  },
  {
    name: "Real-world Perplexity example",
    input: "Cars owned by enthusiasts include:\n* **Porsche 911**: Popular sports car.\n* **BMW M3**: Performance sedan.",
    expected: "Cars owned by enthusiasts include:\n• *Porsche 911*: Popular sports car.\n• *BMW M3*: Performance sedan."
  }
];

// Run tests for formatting
function runTests() {
  let passCount = 0;
  let failCount = 0;
  
  function testFunction(testCases, description) {
    console.log(`\n--- Testing ${description} ---`);
    
    testCases.forEach(test => {
      const result = formatForSlack(test.input);
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
  testFunction(slackFormatTests, 'Basic Slack Formatting');
  testFunction(complexExamples, 'Complex Examples');
  
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