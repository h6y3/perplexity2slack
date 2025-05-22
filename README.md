# Perplexity to Slack

A Chrome Extension that adds a "Copy for Slack" button to Perplexity.ai pages. When clicked, the extension extracts the content, converts it to Slack's mrkdwn format, and copies it to the clipboard for easy pasting into Slack.

## Cursor Coding Rules

**Always Use `extractContent()` for Response Extraction**

> When extracting text from a Perplexity response for copying or formatting, always use the `extractContent()` function, not `extractStructuredText()` directly.
> - `extractContent()` handles citation removal and DOM preprocessing.
> - `extractStructuredText()` is an internal helper and should only be called from within `extractContent()`.
>
> **Rationale:** Calling `extractStructuredText()` directly may result in incomplete or incorrect extraction, breaking copy functionality.

---

## Best Practices & Lessons Learned

This section is for both human contributors and AI agents (like Cursor or Claude) to ensure robust, maintainable, and user-friendly extraction and formatting.

### DOM Extraction & Formatting
- **Preserve Document Order:** Always process elements in their original DOM order. Do not process by element type, as this can rearrange content unintentionally.
- **Preserve Formatting Context:** Keep bold, italic, and other formatting within their original context. Do not extract and process formatting separately from its content.
- **Test with Real Content:** Use a variety of real Perplexity responses for testing, not just simple or synthetic cases.
- **Punctuation & Spacing:** When cleaning up text, ensure proper spacing after punctuation, but not before. Multiple cleanup passes may be needed for complex text.
- **Avoid Overengineering:** Simpler extraction logic is often more robust. Overly complex solutions can introduce subtle bugs.

### Architecture & Workflow
- **Separation of Concerns:** Keep content extraction, formatting, and clipboard operations in separate modules.
- **Sequential Pipeline:** The extraction pipeline should:
  1. Remove citation elements from the DOM
  2. Extract text in document order
  3. Apply Slack formatting
  4. Copy to clipboard
- **Regression Testing:** After any change to extraction or formatting, test both UI and copy functionality to avoid regressions.
- **Test Light & Dark Modes:** Always verify the extension in both light and dark mode.
- **Run Tests After Changes:** Run the test suite after any code changes to ensure reliability.
- **Test in Chrome:** Always test the actual extension in Chrome to verify the user experience.

---

## Features

- Adds a Slack-branded button next to Perplexity.ai content
- Extracts content from the Perplexity.ai DOM
- Converts standard markdown to Slack's mrkdwn format
- Copies the converted content to clipboard
- Provides visual feedback when content is successfully copied
- Intelligently removes citations and fixes formatting
- Preserves bold text and headers

## Installation

### From Chrome Web Store
*Coming soon*

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/h6y3/perplexity2slack.git
   cd perplexity2slack
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   # Generate icons if needed
   npm run generate-icons
   
   # Build the extension package
   ./build.sh
   ```

4. Install in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top-right corner
   - Either:
     - Click "Load unpacked" and select the project directory
     - Drag the zip file from `dist/perplexity2slack.zip` onto the extensions page

## Development

### Project Structure

```
perplexity2slack/
├── manifest.json           # Extension configuration
├── background.js           # Background script for extension-wide functionality
├── content.js              # Main content script for DOM manipulation, content extraction, formatting, and clipboard operations
├── assets/
│   └── icons/              # Extension icons
├── styles/
│   └── button.css          # CSS for the Slack button
└── tests/
    └── example_raw.html    # Example HTML for manual testing or future test development
    └── example_raw complex.html # Complex example HTML for testing
    └── slack-button-test.html # Test HTML for visualizing button implementation
```

### Build and Test Process

```bash
# Install dependencies
npm install

# Generate icons from SVG source (if needed, primarily for initial setup or icon changes)
npm run generate-icons

# Run tests (Currently, manual testing is the primary method using the example HTML files in tests/)
# Future: npm test (if a dedicated test runner and suites are re-established)

# Build the extension package
./build.sh
```

The build script (`build.sh`) performs the following steps:
1. Cleans any existing build directories
2. Creates a temporary build directory
3. Copies necessary files (manifest.json, JS files, styles, icons)
4. Creates a zip file in the `dist` directory
5. Cleans up the temporary directory

### Key Features

#### Citation Removal
The extension intelligently removes citation references like [1], [2], etc. from the text to provide clean content for Slack.

#### Text Formatting
- Preserves bold formatting from the original content
- Converts headers to bold text in Slack format
- Maintains proper list formatting with bullets
- Cleans up spacing around punctuation

#### Content Extraction
- Extracts content while preserving the document structure
- Handles paragraphs, headers, lists, and other elements
- Avoids duplicating content

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT - See [LICENSE](LICENSE) for more information.