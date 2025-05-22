<!-- It's important to note that this document reflects earlier design phases and specific instructions for AI collaboration (like with Claude). Much of the technical detail here may be outdated. For current project structure, implementation details, and up-to-date best practices, please refer to README.md. -->

# Perplexity to Slack - AI Development Notes & Lessons Learned

## Project Overview (Historical Context)

This document originally outlined a Chrome Extension to add a "Copy for Slack" button to web pages, extract markdown, convert it to Slack's mrkdwn format, and copy it to the clipboard. The project has since focused specifically on Perplexity.ai.

## Core Features (Original Intent)

1. **Button Injection**: Add a Slack-branded button next to Perplexity.ai content.
2. **Content Extraction**: Extract content from the Perplexity.ai DOM.
3. **Format Conversion**: Convert extracted content to Slack's mrkdwn format.
4. **Clipboard Integration**: Copy the converted content to clipboard.
5. **Visual Feedback**: Provide feedback when content is successfully copied.

## Technical Requirements (Historical Context)

### Dependencies

- **Standard Chrome Extension APIs**: For DOM manipulation and clipboard access. (Note: An earlier idea of using `slackify-markdown` was discarded).

### File Structure (Historical - See README.md for current structure)

<!-- The file structure below is outdated. Refer to README.md -->
```
markdown-to-slack/ (Original Project Name)
├── manifest.json
├── background.js
├── content.js
├── lib/ (No longer used, logic integrated into content.js)
│   ├── extractor.js
│   ├── converter.js
│   └── clipboard.js
├── assets/
│   ├── icons/
│   └── slack-icon.svg (Now assets/icons/icon.svg)
└── styles/
    └── button.css
```

## General DOM Interaction Principles (for AI Agents)

When working with the Perplexity.ai interface, AI agents should aim to:

1. **Identify Key Containers:** Accurately target main response containers and button toolbars. Class names and exact structures can change, so focus on semantic roles and relative positioning if possible.
2. **Preserve Structure and Style:** When modifying or injecting content, strive to match existing font styles, layout properties (flex, grid), and dark/light mode conventions.
3. **Maintain Functionality:** Be careful not to disrupt existing interactive elements or responsive layouts.
4. **Focus States:** Ensure any new interactive elements have clear focus states for accessibility.

The primary goal is to update content or add features while maintaining visual consistency and the existing functionality of the Perplexity interface.

## Lessons Learned (Still Relevant)

- Chrome extensions require careful handling of cross-origin permissions and content script limitations.
- Browser clipboard APIs have specific security and permission constraints (e.g., `document.execCommand('copy')` is often more reliable in content scripts than `navigator.clipboard.writeText`).
- User experience is critical - visual feedback and smooth interaction are key to extension usability.
- Testing across different Perplexity page structures (if they vary) is essential for reliability.
- Performance optimization can be important, especially for content extraction on complex pages.
- DOM structure preservation is crucial - always aim to maintain the original document order when extracting content.
- Content extraction regressions can occur when improving other features - test both UI and functionality after each change.
- Overengineering content extraction can lead to unexpected behavior - simpler solutions are often more robust.
- When content has a specific visual structure, preserving that structure in the extraction is as important as the content itself.

## DOM Content Extraction Lessons (Still Relevant)

1. **Preserve Original Document Structure**: When extracting content from DOM, always maintain the original document order. Processing different element types (lists, paragraphs, headings) in a fixed order rather than their document order can rearrange content unintentionally.
2. **Use Document Order Traversal**: Gather all content nodes first in document order before processing them, rather than processing by element type.
3. **Maintain Context**: Bold, italic, and other formatting should be preserved within their original context, not extracted and processed separately.
4. **Punctuation and Spacing**: When removing citations or cleaning up text, be careful to preserve proper spacing around punctuation. Always ensure there's a space after periods, commas, and other punctuation marks, but not before them.
5. **Multiple Cleanup Passes**: For complex text processing, sometimes multiple passes are needed - first to clean citations, then to ensure proper spacing. Adding a final pass to standardize spacing helps ensure consistent output.

## Architectural Principles (General Goals - See README.md for current implementation)

These were guiding principles for a robust architecture:

1. **Separation of Concerns**: Aim to organize functionality into logical sections (e.g., content extraction, formatting, clipboard operations), even if currently co-located in `content.js` for extension simplicity.
2. **Sequential Processing Pipeline**:
   - Remove citation elements from DOM
   - Extract text in document order
   - Apply formatting for Slack
   - Copy to clipboard
3. **Test-Driven Development (Aspirational)**:
   - Aim for a comprehensive test suite for extraction and formatting.
   - Tests should cover real-world examples and edge cases.
4. **Reduced Complexity**:
   - Strive for simpler, focused functions with clear responsibilities.
   - Implement proper error handling.
5. **Browser Compatibility**:
   - Maintain a self-contained approach for Chrome extension compatibility.
   - Avoid Node.js-style imports not supported in extensions.

## Development Workflow and Build Process (Historical - See README.md for current process)

### Build Instructions

1. **Development Setup**:
   - Run `npm install` to install all dependencies (if any beyond devDependencies for linting/future testing).
   - Run `npm run generate-icons` if icon changes are needed.

2. **Building the Extension**:
   - Run `./build.sh` to create a distribution package.

3. **Testing (Historical - See README.md for current process)**:
   - Earlier ideas involved `node tests/run-tests.js` for specific unit tests.

4. **Installation for Testing**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode".
   - Click "Load unpacked" and select the project directory, or drag the `dist/perplexity2slack.zip` file.

## AI Collaboration Reminders (General Advice)

- Ensure all functional changes result in a buildable and testable extension state.
- After fixing any content extraction issues, test with a variety of content types to ensure the fix is robust.
- Always test dark mode alongside light mode to ensure proper rendering in both contexts.
- If automated tests are (re-)introduced, run them after any changes to verify functionality.
- Always test the actual extension in Chrome to verify the user experience.