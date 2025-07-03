# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

- **Build the extension**: `./build.sh` - Creates a packaged extension in `./dist/perplexity2slack.zip`
- **Manual testing**: Open the example HTML files in `tests/` directory in a browser, or load the extension in Chrome developer mode
- **Chrome extension testing**: 
  1. Go to `chrome://extensions/`
  2. Enable "Developer mode"
  3. Click "Load unpacked" and select the project directory, OR drag `dist/perplexity2slack.zip` onto the extensions page

## Architecture Overview

This is a Chrome Extension (Manifest V3) that adds a "Copy for Slack" button to Perplexity.ai responses. The extension converts Perplexity's formatted content into Slack-compatible markdown.

### Core Components

- **`content.js`**: Main content script that handles DOM manipulation, text extraction, and UI injection on Perplexity.ai pages
- **`background.js`**: Service worker that handles extension lifecycle, context menus, and inter-script communication
- **`manifest.json`**: Chrome extension configuration
- **`styles/button.css`**: Styling for the injected Slack button
- **`build.sh`**: Build script that packages the extension

### Key Functionality

1. **Content Extraction** (`content.js:11-233`): Complex text processing that removes citation references, preserves formatting, and handles various DOM structures
2. **Slack Formatting** (`content.js:242-284`): Converts markdown and HTML to Slack's mrkdwn format
3. **Dynamic Button Injection** (`content.js:457-675`): Adds Slack copy buttons next to Perplexity's existing copy buttons
4. **Clipboard Operations** (`content.js:294-343`): Handles copying text with fallback mechanisms

### Content Processing Rules

The extension follows specific rules for text cleaning and formatting (see `.cursorrules`):

- **Regex patterns**: Always test against real data, use flexible spacing patterns (`\s?` vs `\s`)
- **CSS selectors**: Use partial matching for robustness, inspect actual DOM structure
- **Text processing**: Maintain identical patterns across all instances, extract common cleaning logic
- **Edge cases**: Test against complex real-world examples, handle punctuation adjacency

### DOM Targeting Strategy

The extension targets Perplexity's dynamic content by:
- Looking for `svg.tabler-icon-copy` elements to find response containers
- Using multiple fallback selectors: `.border-borderMain/50`, `.answer-container`, `[data-testid="answer-body"]`
- Employing MutationObserver to handle dynamically loaded content
- Positioning buttons relative to existing toolbar elements

### Testing Approach

- Use the HTML files in `tests/` directory for development testing
- Test content extraction against complex real-world Perplexity responses
- Verify button positioning works across different response formats
- Test clipboard functionality in various browser contexts