// Perplexity to Slack Converter
// All functionality is self-contained in this file for Chrome Extension compatibility

// -------------------- Content Extraction Functions --------------------

/**
 * Removes citation elements and references from the DOM and extracts the text
 * @param {Element} element - The DOM element containing the content
 * @returns {string} - The cleaned content with citations removed
 */
function extractContent(element) {
  if (!element) return '';
  
  // Clone the element to avoid modifying the original
  const clone = element.cloneNode(true);
  
  // Step 1: Remove citation elements from the DOM
  removeCitationElements(clone);
  
  // Step 2: Extract text content with structure preserved
  return extractStructuredText(clone);
}

/**
 * Removes citation elements from the DOM
 * @param {Element} element - The DOM element to clean
 */
function removeCitationElements(element) {
  // Remove citation sections
  const citationSections = element.querySelectorAll(
    '.citation-list, .references, [data-citation-list], .footnotes'
  );
  citationSections.forEach(section => section.remove());
  
  // Remove individual citation elements
  element.querySelectorAll(
    '[data-citation], .citation, .citation.ml-xs.inline, a[href^="#cite"]'
  ).forEach(el => el.remove());
}

/**
 * Extracts text from the DOM while preserving structure
 * @param {Element} element - The DOM element to extract text from
 * @returns {string} - The extracted text with structure preserved
 */
function extractStructuredText(element) {
  // Try to find the main content container - Perplexity often has these
  const contentContainer = element.querySelector('#markdown-content-0, .prose');
  const targetElement = contentContainer || element;
  
  // Get all paragraphs and lists in document order
  const contentElements = Array.from(
    targetElement.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre')
  );
  
  // If no structure is found, fall back to extracting text directly
  if (contentElements.length === 0) {
    return cleanTextContent(targetElement.textContent);
  }
  
  // Track content to avoid duplicates - Perplexity often has redundant content
  const processedContent = new Set();
  let result = '';
  
  // First, check if there's a list with items that might be duplicated later as paragraphs
  const lists = contentElements.filter(el => el.tagName === 'UL' || el.tagName === 'OL');
  if (lists.length > 0) {
    // Extract list items first
    lists.forEach(list => {
      const items = Array.from(list.querySelectorAll('li'));
      items.forEach(item => {
        // Get the text and add to our processed content set
        const itemText = cleanTextContent(item.textContent);
        processedContent.add(itemText.toLowerCase());
        
        // Find any strong/bold elements and format them properly
        const strongEl = item.querySelector('strong');
        if (strongEl) {
          const strongText = strongEl.textContent.trim();
          const restText = itemText.replace(strongText, '').trim();
          result += `• *${strongText}*${restText}\n`;
        } else {
          result += `• ${itemText}\n`;
        }
      });
      result += '\n';
    });
  }
  
  // Now process the rest of the content, skipping any duplicates
  for (const el of contentElements) {
    // Skip lists - we already processed them
    if (el.tagName === 'UL' || el.tagName === 'OL') continue;
    
    // Process based on element type
    if (el.tagName.match(/^H[1-6]$/)) {
      // Headings become bold in Slack
      const headingText = cleanTextContent(el.textContent);
      result += `*${headingText}*\n\n`;
    } 
    else if (el.tagName === 'PRE') {
      // Code blocks
      result += '```\n' + el.textContent + '\n```\n\n';
    }
    else if (el.tagName === 'BLOCKQUOTE') {
      // Blockquotes
      result += '> ' + cleanTextContent(el.textContent) + '\n\n';
    }
    else {
      // Regular paragraphs - check for duplicates first
      const paragraphText = cleanTextContent(el.textContent);
      
      // Skip if it's a duplicate of a list item or too short
      if (paragraphText.length < 5 || processedContent.has(paragraphText.toLowerCase())) {
        continue;
      }
      
      // Special case for Perplexity: Check if this paragraph starts with a car name 
      // that's already in our list (could be a duplicate in paragraph form)
      let isDuplicate = false;
      for (const content of processedContent) {
        // Check if this paragraph starts with a car name already listed
        const firstColon = paragraphText.indexOf(':');
        if (firstColon > 0) {
          const potentialCarName = paragraphText.substring(0, firstColon).trim();
          if (content.includes(potentialCarName.toLowerCase())) {
            isDuplicate = true;
            break;
          }
        }
      }
      
      // Only add if it's not a duplicate
      if (!isDuplicate && paragraphText.trim()) {
        // Look for strong/bold elements
        const strongEl = el.querySelector('strong');
        if (strongEl) {
          const strongText = strongEl.textContent.trim();
          result += `*${strongText}*${paragraphText.replace(strongText, '')}\n\n`;
        } else {
          result += paragraphText + '\n\n';
        }
        
        // Add to processed content
        processedContent.add(paragraphText.toLowerCase());
      }
    }
  }
  
  return result.trim();
}

/**
 * Cleans text content by removing citations and fixing spacing
 * @param {string} text - The text to clean
 * @returns {string} - The cleaned text
 */
function cleanTextContent(text) {
  return text
    // Remove citation references [1], [2], etc.
    .replace(/\s?\[\d+\](?:\[\d+\])*\s?/g, ' ')
    // Remove other citation format [1]
    .replace(/\[\s*\d+\s*\]/g, '')
    // Remove unbracketed citations at end of sentences
    .replace(/\s?\d+(?:\d+)*\s?(?=\.|,|;|$)/g, '')
    // Fix spacing before punctuation (remove extra spaces)
    .replace(/\s+([.,;:!?])/g, '$1')
    // Add space after punctuation if not already present
    .replace(/([.,;:!?])(?![\s\n]|$)/g, '$1 ')
    // Fix double spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// -------------------- Formatting Functions --------------------

/**
 * Converts text to Slack's mrkdwn format
 * @param {string} text - The text to convert
 * @returns {string} - The text formatted for Slack
 */
function formatForSlack(text) {
  if (!text) return '';
  
  // Handle headings (# Heading -> *Heading*)
  let formatted = text.replace(/^#\s+(.*?)$/gm, '*$1*');
  
  // Convert standard markdown bold to Slack bold
  formatted = formatted.replace(/\*\*([^*]+?)\*\*/g, '*$1*');
  
  // Convert markdown links to Slack format
  formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<$2|$1>');
  
  // Fix spaces in punctuation
  formatted = formatted.replace(/\s+([.,;:!?])/g, '$1');
  
  // Add space after punctuation when followed by a letter
  formatted = formatted.replace(/([.,;:!?])([a-zA-Z])/g, '$1 $2');
  
  // Handle code blocks with proper line breaks
  formatted = formatted.replace(/```(?:\w*)\n([\s\S]*?)```/g, '```\n$1\n```');
  
  // Handle inline code (preserve exact contents)
  formatted = formatted.replace(/`([^`]+)`/g, '`$1`');
  
  // Standardize list formatting for Slack
  formatted = formatted.replace(/^\s*[-*+]\s+(.*)$/gm, '• $1');
  formatted = formatted.replace(/^\s*\d+\.\s+(.*)$/gm, '• $1');
  
  // Fix formatting issues around punctuation with formatting
  formatted = formatted.replace(/(\*\w+)([.,;:!?])(\*)/g, '$1$3$2');
  formatted = formatted.replace(/(_\w+)([.,;:!?])(_)/g, '$1$3$2');
  
  // Preserve paragraph structure by ensuring double newlines between paragraphs
  if (formatted.includes('\n\n')) {
    const paragraphs = formatted.split(/\n\n+/);
    formatted = paragraphs.join('\n\n');
  }
  
  return formatted.trim();
}

// -------------------- Clipboard Functions --------------------

/**
 * Copies text to the clipboard using the modern Clipboard API
 * with fallback to older execCommand method
 * @param {string} text - The text to copy to clipboard
 * @returns {Promise<boolean>} - True if the copy was successful
 */
async function copyToClipboard(text) {
  try {
    // Try the modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fall back to older method if Clipboard API is unavailable
    return fallbackCopyToClipboard(text);
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    
    // Try fallback method
    return fallbackCopyToClipboard(text);
  }
}

/**
 * Fallback method for copying to clipboard using execCommand
 * @param {string} text - The text to copy to clipboard
 * @returns {boolean} - True if the copy was successful
 */
function fallbackCopyToClipboard(text) {
  // Create temporary textarea
  const textarea = document.createElement('textarea');
  textarea.value = text;
  
  // Make the textarea not visible
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  
  document.body.appendChild(textarea);
  textarea.select();
  
  // Execute copy command
  try {
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (error) {
    console.error('Fallback copy failed:', error);
    document.body.removeChild(textarea);
    return false;
  }
}

// -------------------- UI Functions --------------------

// Get Slack icon SVG
function getSlackIconSVG() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.194 14.644c0 1.16-.943 2.107-2.103 2.107-1.16 0-2.103-.946-2.103-2.107 0-1.16.943-2.106 2.103-2.106h2.103v2.106zm1.061 0c0-1.16.943-2.106 2.103-2.106 1.16 0 2.103.946 2.103 2.106v5.274c0 1.16-.943 2.107-2.103 2.107-1.16 0-2.103-.946-2.103-2.107v-5.274z" fill="#E01E5A"/>
    <path d="M9.358 6.161c-1.16 0-2.103-.946-2.103-2.106 0-1.16.943-2.107 2.103-2.107 1.16 0 2.103.946 2.103 2.107v2.106H9.358zm0 1.06c1.16 0 2.103.946 2.103 2.107 0 1.16-.943 2.107-2.103 2.107H4.09c-1.16 0-2.103-.946-2.103-2.107 0-1.16.943-2.106 2.103-2.106h5.27z" fill="#36C5F0"/>
    <path d="M17.81 9.328c0-1.16.943-2.106 2.103-2.106 1.16 0 2.103.946 2.103 2.106 0 1.16-.943 2.107-2.103 2.107h-2.103V9.328zm-1.062 0c0 1.16-.943 2.107-2.103 2.107-1.16 0-2.103-.946-2.103-2.107V4.054c0-1.16.943-2.107 2.103-2.107 1.16 0 2.103.946 2.103 2.107v5.274z" fill="#2EB67D"/>
    <path d="M14.645 17.812c1.16 0 2.103.946 2.103 2.106 0 1.16-.943 2.107-2.103 2.107-1.16 0-2.103-.946-2.103-2.107v-2.106h2.103zm0-1.061c-1.16 0-2.103-.946-2.103-2.107 0-1.16.943-2.106 2.103-2.106h5.27c1.16 0 2.103.946 2.103 2.106 0 1.16-.943 2.107-2.103 2.107h-5.27z" fill="#ECB22E"/>
  </svg>`;
}

// Show feedback on the button after clicking
function showFeedback(button, type) {
  const originalTitle = button.title;
  button.classList.add(type);
  button.classList.add('active');
  
  if (type === 'success') {
    button.title = 'Copied to clipboard!';
  } else {
    button.title = 'Failed to copy';
  }
  
  // Reset after animation
  setTimeout(() => {
    button.classList.remove(type);
    button.classList.remove('active');
    button.title = originalTitle;
  }, 2000);
}

// Find the main Perplexity response container
function findPerplexityResponses() {
  // Look specifically for copy icons in the toolbar
  const copySvgIcons = document.querySelectorAll('svg.tabler-icon-copy');
  const responseContainers = [];
  
  if (copySvgIcons.length > 0) {
    // We found at least one copy icon, so add our button next to it
    copySvgIcons.forEach(copyIcon => {
      // Get the parent button
      const copyButton = copyIcon.closest('button');
      if (!copyButton) return;
      
      // Get the parent toolbar/container
      const toolbar = copyButton.parentElement;
      if (!toolbar) return;
      
      // Find the parent response container
      const responseContainer = toolbar.closest('.border-borderMain\\/50, .answer-container, .response-container, [data-answer-id]');
      if (responseContainer && !responseContainers.includes(responseContainer)) {
        responseContainers.push(responseContainer);
      }
    });
  }
  
  // If we couldn't find any containers with copy buttons, fall back to the old method
  if (responseContainers.length === 0) {
    return document.querySelectorAll('.border-borderMain\\/50, .answer-container, .response-container, [data-answer-id]');
  }
  
  return responseContainers;
}

// Create and add the Slack copy button
function addSlackButton(responseElement) {
  // Check if we already added a button to this element
  if (responseElement.querySelector('.slack-copy-button')) return;
  
  // Check if there's already a button anywhere on the page
  if (document.querySelector('.slack-copy-button')) {
    // Remove any existing buttons (to handle page changes)
    document.querySelectorAll('.slack-copy-button').forEach(btn => {
      const container = btn.closest('.slack-button-container');
      if (container) container.remove();
    });
  }
  
  // Find the copy button in this response
  const copyButton = responseElement.querySelector('button svg.tabler-icon-copy')?.closest('button');
  if (!copyButton) return;
  
  // Get the toolbar containing the copy button
  const toolbar = copyButton.parentElement;
  if (!toolbar) return;
  
  // Make sure we position our button after the copy button
  const nextButton = copyButton.nextElementSibling;
  
  // Find the menu button ("...") to position our button before it
  const menuButtons = Array.from(toolbar.querySelectorAll('button'));
  const menuButtonIndex = menuButtons.findIndex(btn => 
    btn.querySelector('svg.tabler-icon-dots-vertical') || 
    btn.getAttribute('aria-label')?.includes('More')
  );
  
  let menuButton = null;
  if (menuButtonIndex > -1) {
    menuButton = menuButtons[menuButtonIndex];
  }
  
  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'slack-button-container';
  
  // Create the button
  const button = document.createElement('button');
  button.className = 'slack-copy-button';
  button.title = 'Copy for Slack';
  button.setAttribute('aria-label', 'Copy for Slack');
  button.innerHTML = getSlackIconSVG();
  
  // Add click handler
  button.addEventListener('click', async () => {
    try {
      // Find the content container in this response
      const contentContainer = responseElement.querySelector(
        '.relative.font-sans.text-base.text-textMain, ' + // Standard text container
        '.text-textMain.dark\\:text-textMainDark, ' + // Dark mode container
        '#markdown-content-0, ' + // Direct markdown container
        '.prose, ' + // Prose class containers (often used for rendered markdown)
        '.markdown-content, ' + // Generic markdown content
        '[data-testid="response-content"]' // Test ID for response content
      );
      
      if (!contentContainer) {
        console.error('Could not find content container');
        showFeedback(button, 'error');
        return;
      }
      
      // Extract the content using our new modular approach
      const extractedContent = extractContent(contentContainer);
      
      // Format for Slack
      const slackContent = formatForSlack(extractedContent);
      
      // Copy to clipboard
      const success = await copyToClipboard(slackContent);
      
      // Show feedback
      showFeedback(button, success ? 'success' : 'error');
    } catch (error) {
      console.error('Error processing content:', error);
      showFeedback(button, 'error');
    }
  });
  
  // Add button to container
  buttonContainer.appendChild(button);
  
  // Insert the button in the right position
  if (nextButton) {
    // Insert after copy button and before the next button
    toolbar.insertBefore(buttonContainer, nextButton);
  } else if (menuButton) {
    // Insert before the menu button if found
    toolbar.insertBefore(buttonContainer, menuButton);
  } else {
    // Last resort - insert at the end of the toolbar
    toolbar.appendChild(buttonContainer);
  }
}

// Initialize the extension
function initPerplexityToSlack() {
  // Find response containers
  const responses = findPerplexityResponses();
  
  // Add buttons to each response
  responses.forEach(response => {
    addSlackButton(response);
  });
}

// Set up observer for dynamically added content
function observeDynamicContent() {
  const observer = new MutationObserver(mutations => {
    // Check if we need to update buttons based on DOM changes
    let shouldUpdate = false;
    
    mutations.forEach(mutation => {
      // Look for copy button or menu button additions
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Look for added copy icons or menu icons
            if (node.querySelector('svg.tabler-icon-copy') || 
                node.querySelector('svg.tabler-icon-dots-vertical') ||
                (node.tagName === 'svg' && 
                 (node.classList.contains('tabler-icon-copy') || 
                  node.classList.contains('tabler-icon-dots-vertical')))) {
              shouldUpdate = true;
              break;
            }
          }
        }
      }
      
      // If we already determined we need to update, no need to check further
      if (shouldUpdate) return;
    });
    
    // Only update if needed
    if (shouldUpdate) {
      // Remove any existing buttons first
      document.querySelectorAll('.slack-copy-button').forEach(btn => {
        const container = btn.closest('.slack-button-container');
        if (container) container.remove();
      });
      
      // Re-add buttons to the correct locations
      const responses = findPerplexityResponses();
      responses.forEach(response => {
        addSlackButton(response);
      });
    }
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'copySelection') {
    const slackContent = formatForSlack(message.text);
    copyToClipboard(slackContent)
      .then(success => {
        sendResponse({ success });
      })
      .catch(error => {
        console.error('Error copying to clipboard:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Indicates async response
  }
});

// Add a debounce function to avoid too many updates
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// Debounced initialization to prevent duplicate buttons
const debouncedInit = debounce(() => {
  // First, clean up any existing buttons
  document.querySelectorAll('.slack-copy-button').forEach(btn => {
    const container = btn.closest('.slack-button-container');
    if (container) container.remove();
  });
  
  // Then add new buttons to the correct places
  initPerplexityToSlack();
}, 300);

// Initialize when the page is loaded
window.addEventListener('load', debouncedInit);

// Also run now in case the page is already loaded
observeDynamicContent();
debouncedInit();