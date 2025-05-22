# Perplexity to Slack

A Chrome Extension that adds a "Copy for Slack" button to Perplexity.ai pages. When clicked, the extension extracts the content, converts it to Slack's mrkdwn format, and copies it to the clipboard for easy pasting into Slack.

## Features

- Adds a Slack-branded button next to Perplexity.ai content
- Extracts content from the Perplexity.ai DOM
- Converts standard markdown to Slack's mrkdwn format
- Copies the converted content to clipboard
- Provides visual feedback when content is successfully copied

## Installation

### From Source

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run generate-icons` to generate icons (if needed)
4. Run `npm run build` to create a zip file in the `dist` directory
5. In Chrome, go to `chrome://extensions/`
6. Enable "Developer mode"
7. Click "Load unpacked" and select the `perplexity2slack` directory

## Development

### Project Structure

```
perplexity2slack/
├── manifest.json           # Extension configuration
├── background.js           # Background script for extension-wide functionality
├── content.js              # Main content script for DOM manipulation
├── lib/
│   ├── converter.js        # Conversion functionality using slackify-markdown
│   └── clipboard.js        # Clipboard operations
├── assets/
│   └── icons/              # Extension icons
└── styles/
    └── button.css          # CSS for the Slack button
```

### Build Process

- `npm run generate-icons` - Generates PNG icons from SVG source
- `npm run build` - Creates a ZIP file for distribution

## Libraries Used

- [slackify-markdown](https://www.npmjs.com/package/slackify-markdown) - Converts markdown to Slack's format

## License

ISC