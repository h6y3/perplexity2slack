# Perplexity to Slack

A Chrome Extension that adds a "Copy for Slack" button to Perplexity.ai pages. When clicked, the extension extracts the content, converts it to Slack's mrkdwn format, and copies it to the clipboard for easy pasting into Slack.

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
├── content.js              # Main content script for DOM manipulation
├── lib/
│   ├── extractor.js        # Logic to extract markdown from DOM
│   ├── converter.js        # Conversion functionality
│   ├── formatter.js        # Text formatting utilities
│   └── clipboard.js        # Clipboard operations
├── assets/
│   └── icons/              # Extension icons
├── styles/
│   └── button.css          # CSS for the Slack button
└── tests/
    ├── extractor.test.js   # Tests for content extraction
    ├── formatter.test.js   # Tests for formatting utilities
    └── run-tests.js        # Test runner
```

### Build and Test Process

```bash
# Install dependencies
npm install

# Generate icons from SVG source (if needed)
npm run generate-icons

# Run tests
npm test
# Or directly with:
node tests/run-tests.js

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