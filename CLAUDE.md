# Markdown to Slack Converter Chrome Extension

## Project Overview

Create a Chrome Extension that adds a "Copy for Slack" button to web pages containing markdown content. When clicked, the extension will extract the markdown, convert it to Slack's mrkdwn format, and copy it to the clipboard for easy pasting into Slack.

## Core Features

1. **Button Injection**: Add a Slack-branded button next to markdown content
2. **Markdown Extraction**: Extract markdown content from the DOM
3. **Format Conversion**: Convert standard markdown to Slack's mrkdwn format
4. **Clipboard Integration**: Copy the converted content to clipboard
5. **Visual Feedback**: Provide feedback when content is successfully copied

## Technical Requirements

### Dependencies

- **slackify-markdown**: Primary library for converting markdown to Slack format
- **Standard Chrome Extension APIs**: For DOM manipulation and clipboard access

### File Structure

```
markdown-to-slack/
├── manifest.json           # Extension configuration
├── background.js           # Background script for extension-wide functionality
├── content.js              # Main content script for DOM manipulation
├── lib/
│   ├── extractor.js        # Logic to extract markdown from DOM
│   ├── converter.js        # Conversion functionality using slackify-markdown
│   └── clipboard.js        # Clipboard operations
├── assets/
│   ├── icons/              # Extension icons
│   └── slack-icon.svg      # Icon for the copy button
└── styles/
    └── button.css          # CSS for the Slack button
```

## DOM Update Instructions for Claude Code

When working with the Perplexity.ai interface, you'll need to:

1. Target the main response container with the class `border-borderMain/50` which contains the text response about supplements for a 50-year-old with high-normal blood pressure.

2. Replace or modify content within the `<div class="relative font-sans text-base text-textMain dark:text-textMainDark">` element that contains the current text about supplement recommendations.

3. When updating buttons, work with elements inside the `<div class="buttons-container mt-2 flex items-center gap-2">` container.

4. For any icons or SVG elements, note they use the attributes `aria-hidden="true"` and often have classes like `svg-inline--fa`.

5. Preserve the overall structure while modifying content, particularly maintaining:
   - The flex layout properties
   - Proper dark/light mode class alternations (classes with `dark:` prefixes)
   - Interactive elements like the "Copy clean" button

6. When injecting new content, match the existing font styles using classes like `font-sans`, `text-sm`, and appropriate text color classes.

7. Be careful not to disrupt the responsive layout, which uses classes like `gap-y-sm`, `flex-col`, and various margin/padding utilities.

8. For any new interactive elements, ensure proper focus states are defined with classes like `focus:outline-none` and `focus-visible:bg-offsetPlus`.

The primary goal is to update the content while maintaining the visual consistency and functionality of the Perplexity interface.

## Lessons Learned

- Chrome extensions require careful handling of cross-origin permissions and content script limitations
- Markdown conversion is nuanced and requires robust parsing of different markdown variants
- Browser clipboard APIs have specific security and permission constraints
- User experience is critical - visual feedback and smooth interaction are key to extension usability
- Testing across different websites and markdown implementations is essential for reliability
- Performance optimization is important, especially for content extraction and conversion
- DOM structure preservation is crucial - always maintain the original document order when extracting content
- Content extraction regression can occur when improving other features - test both UI and functionality after each change
- Overengineering content extraction can lead to unexpected behavior - simpler solutions are often more robust
- When content has a specific visual structure, preserving that structure in the extraction is as important as the content itself

## DOM Content Extraction Lessons

The "content extraction regression" taught us several valuable lessons:

1. **Preserve Original Document Structure**: When extracting content from DOM, always maintain the original document order. Processing different element types (lists, paragraphs, headings) in a fixed order rather than their document order can rearrange content unintentionally.

2. **Use Document Order Traversal**: Gather all content nodes first in document order before processing them, rather than processing by element type.

3. **Content Maps for Complex Processing**: When multiple transformations are needed, use a map to track processed content while preserving relationships between elements.

4. **Test Real-world Content**: Always test extraction with a variety of real content structures from the target site, not just the basic cases.

5. **Maintain Context**: Bold, italic, and other formatting should be preserved within their original context, not extracted and processed separately.

6. **Punctuation and Spacing**: When removing citations or cleaning up text, be careful to preserve proper spacing around punctuation. Always ensure there's a space after periods, commas, and other punctuation marks, but not before them.

7. **Multiple Cleanup Passes**: For complex text processing, sometimes multiple passes are needed - first to clean citations, then to ensure proper spacing. Adding a final pass to standardize spacing helps ensure consistent output.

## New Architecture

After encountering numerous issues with our initial approach, we've completely redesigned the content extraction pipeline with a more robust architecture:

1. **Separation of Concerns**: Organized functionality into logical sections:
   - Content extraction - Handles DOM parsing and citation removal
   - Formatting - Converts content to Slack's mrkdwn format
   - Clipboard operations - Manages copying to clipboard
   
2. **Sequential Processing Pipeline**:
   - Remove citation elements from DOM
   - Extract text in document order
   - Apply formatting for Slack
   - Copy to clipboard
   
3. **Test-Driven Development**:
   - Comprehensive test suite for extraction and formatting
   - Tests cover real-world examples and edge cases
   - Separate validation for each transformation step
   
4. **Reduced Complexity**:
   - Simpler, focused functions with clear responsibilities
   - Proper error handling
   - Consistent organization
   
5. **Browser Compatibility**:
   - Self-contained approach for Chrome extension compatibility
   - No external dependencies in runtime code
   - No Node.js-style imports that aren't supported in extensions

## Development Workflow and Build Process

### Build Instructions

1. **Development Setup**:
   - Run `npm install` to install all dependencies
   - Run `npm run generate-icons` if icon changes are needed

2. **Building the Extension**:
   - Run `./build.sh` to create a distribution package
   - This script will:
     - Clean any existing build directories
     - Create a temporary build directory
     - Copy necessary files (manifest.json, JS files, styles, icons)
     - Create a zip file in the `dist` directory
     - Clean up the temporary directory

3. **Testing**:
   - Run `node tests/run-tests.js` to execute all test suites
   - Tests cover content extraction, formatting, and citation handling

4. **Installation for Testing**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top-right corner
   - Click "Load unpacked" and select the project directory
   - Alternatively, drag the zip file from `dist/` onto the extensions page

### Development Workflow Reminders

- Make sure that all changes result in updates to the extension for testing when the task is complete. Don't wait for me to ask you to build.
- After fixing any content extraction issues, test with a variety of content types to ensure the fix is robust
- Always test dark mode alongside light mode to ensure proper rendering in both contexts
- Run the test suite after any changes to verify functionality
- Test the actual extension in Chrome to verify the user experience