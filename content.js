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

  console.log('Extracting content from:', element);

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
  // Enhanced content container detection for Perplexity's structure
  const possibleContainers = [
    element.querySelector('.prose'),
    element.querySelector('[data-testid="answer-body"]'),
    element.querySelector('[role="article"]'),
    element.querySelector('#markdown-content-0'),
    element.querySelector('.perplexity-response')
  ];

  const contentContainer = possibleContainers.find(el => el) || element;

  // Get all content elements in document order
  const contentElements = Array.from(
    contentContainer.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre, div > strong')
  );

  // If no structure is found, fall back to extracting text directly
  if (contentElements.length === 0) {
    return cleanTextContent(contentContainer.textContent);
  }

  // Track processed content to avoid duplicates
  const processedContent = new Set();
  let result = '';

  // First, check if there's a list with items that might be duplicated later as paragraphs
  const lists = contentElements.filter(el => el.tagName === 'UL' || el.tagName === 'OL');
  if (lists.length > 0) {
    // Extract list items first
    lists.forEach(list => {
      const items = Array.from(list.querySelectorAll('li'));
      items.forEach(item => {
        const itemText = cleanTextContent(item.textContent);
        if (!processedContent.has(itemText.toLowerCase())) {
          // Find ALL strong/bold elements and format them properly
          const strongEls = item.querySelectorAll('strong, b');
          if (strongEls.length > 0) {
            // Make a copy of the text to work with
            let formattedText = itemText;

            // Process each bold element
            Array.from(strongEls).forEach(strongEl => {
              const strongText = strongEl.textContent.trim();
              // Only replace if not already formatted and if the text exists in our processed text
              if (strongText && formattedText.includes(strongText)) {
                formattedText = formattedText.replace(
                  strongText,
                  `*${strongText}*`
                );
              }
            });

            result += `• ${formattedText}\n`;
          } else {
            result += `• ${itemText}\n`;
          }
          processedContent.add(itemText.toLowerCase());
        }
      });
      result += '\n';
    });
  }

  // Now process the rest of the content, skipping any duplicates
  for (const el of contentElements) {
    // Skip lists - we already processed them
    if (el.tagName === 'UL' || el.tagName === 'OL') continue;

    const elementText = cleanTextContent(el.textContent);
    if (!elementText.trim() || elementText.length < 5) continue;

    // Process based on element type
    if (el.tagName.match(/^H[1-6]$/) || (el.tagName === 'STRONG' && el.parentElement.tagName === 'DIV')) {
      // Headings and standalone strong elements become bold in Slack
      if (!processedContent.has(elementText.toLowerCase())) {
        // Headers get bold and double newline for spacing
        result += `*${elementText}*\n\n`;
        processedContent.add(elementText.toLowerCase());
      }
    }
    else if (el.tagName === 'PRE') {
      // Code blocks
      if (!processedContent.has(elementText.toLowerCase())) {
        result += '```\n' + el.textContent + '\n```\n\n';
        processedContent.add(elementText.toLowerCase());
      }
    }
    else if (el.tagName === 'BLOCKQUOTE') {
      // Blockquotes
      if (!processedContent.has(elementText.toLowerCase())) {
        result += '> ' + elementText + '\n\n';
        processedContent.add(elementText.toLowerCase());
      }
    }
    else {
      // Check if this paragraph is a duplicate of a list item or heading
      let isDuplicate = false;
      for (const content of processedContent) {
        if (content.includes(elementText.toLowerCase()) ||
          elementText.toLowerCase().includes(content)) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        // Look for ALL strong/bold elements in the paragraph
        const strongEls = el.querySelectorAll('strong, b');
        if (strongEls.length > 0) {
          // Make a copy of the text to work with
          let formattedText = elementText;

          // Process each bold element
          Array.from(strongEls).forEach(strongEl => {
            const strongText = strongEl.textContent.trim();
            // Only replace if not already formatted and if the text exists in our processed text
            if (strongText && formattedText.includes(strongText)) {
              formattedText = formattedText.replace(
                strongText,
                `*${strongText}*`
              );
            }
          });

          result += formattedText + '\n\n';
        } else {
          result += elementText + '\n\n';
        }
        processedContent.add(elementText.toLowerCase());
      }
    }
  }

  // Handle citations section separately if present
  const citationsSection = contentContainer.querySelector('div:has(> p:contains("Citations:"))');
  if (citationsSection) {
    const citationsText = cleanTextContent(citationsSection.textContent);
    if (!processedContent.has(citationsText.toLowerCase())) {
      result += citationsText + '\n';
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
  // Direct citation removal - completely eliminate bracketed citations
  let cleaned = text;

  // Remove citation patterns like [1], [2], [10], etc.
  cleaned = cleaned.replace(/\s?\[\d+\]\s?/g, ' ');

  // Handle consecutive citations like [1][2][3]
  cleaned = cleaned.replace(/\s?\[\d+\](?:\[\d+\])+\s?/g, ' ');

  // Fix any remaining citation formats like [ 1 ] with spaces inside
  cleaned = cleaned.replace(/\s?\[\s*\d+\s*\]\s?/g, ' ');

  // Remove unbracketed citations at end of sentences
  cleaned = cleaned.replace(/\s?\d+(?:\d+)*\s?(?=\.|,|;|$)/g, '');

  // Fix spacing issues (double spaces, etc.)
  cleaned = cleaned.replace(/\s{2,}/g, ' ');

  // Fix spacing around punctuation
  cleaned = cleaned.replace(/\s+([.,;:!?])/g, '$1');
  cleaned = cleaned.replace(/([.,;:!?])(?![\s\n]|$)/g, '$1 ');

  return cleaned.trim();
}

// -------------------- Formatting Functions --------------------

/**
 * Converts text to Slack's mrkdwn format
 * @param {string} text - The text to convert
 * @returns {string} - The text formatted for Slack
 */
function formatForSlack(text) {
  if (!text) return '';

  // Handle markdown headers (# Heading -> *Heading*)
  let formatted = text.replace(/^#\s+(.*?)$/gm, '*$1*');

  // Handle multi-level markdown headers (## Heading -> *Heading*)
  formatted = formatted.replace(/^#{2,6}\s+(.*?)$/gm, '*$1*');

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
  // Log the text we're trying to copy (for debugging)
  console.log('Attempting to copy text:', text.substring(0, 50) + '...');

  // Use a simple method for copying text
  const textArea = document.createElement('textarea');
  textArea.value = text;

  // Position off-screen but make sure it's visible and selectable
  textArea.style.position = 'fixed';
  textArea.style.top = '10px';
  textArea.style.left = '10px';
  textArea.style.width = '2em';
  textArea.style.height = '2em';
  textArea.style.opacity = '0';
  textArea.style.zIndex = '-1';

  // Add to DOM
  document.body.appendChild(textArea);

  try {
    // Select and copy
    textArea.select();
    const success = document.execCommand('copy');
    console.log('Copy result:', success);

    if (!success) {
      // If execCommand fails, try clipboard API as backup
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(text);
          console.log('Clipboard API succeeded');
          return true;
        } catch (clipboardErr) {
          console.error('Clipboard API failed:', clipboardErr);
        }
      }
    } else {
      return true;
    }

    return success;
  } catch (err) {
    console.error('Copy failed:', err);
    return false;
  } finally {
    // Always clean up
    textArea.remove();
  }
}

// -------------------- UI Functions --------------------

// Get Slack icon SVG
function getSlackIconSVG() {
  return `<svg class="slack-icon" width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.194 14.644c0 1.16-.943 2.107-2.103 2.107-1.16 0-2.103-.946-2.103-2.107 0-1.16.943-2.106 2.103-2.106h2.103v2.106zm1.061 0c0-1.16.943-2.106 2.103-2.106 1.16 0 2.103.946 2.103 2.106v5.274c0 1.16-.943 2.107-2.103 2.107-1.16 0-2.103-.946-2.103-2.107v-5.274z" fill="#E01E5A"/>
    <path d="M9.358 6.161c-1.16 0-2.103-.946-2.103-2.106 0-1.16.943-2.107 2.103-2.107 1.16 0 2.103.946 2.103 2.107v2.106H9.358zm0 1.06c1.16 0 2.103.946 2.103 2.107 0 1.16-.943 2.107-2.103 2.107H4.09c-1.16 0-2.103-.946-2.103-2.107 0-1.16.943-2.106 2.103-2.106h5.27z" fill="#36C5F0"/>
    <path d="M17.81 9.328c0-1.16.943-2.106 2.103-2.106 1.16 0 2.103.946 2.103 2.106 0 1.16-.943 2.107-2.103 2.107h-2.103V9.328zm-1.062 0c0 1.16-.943 2.107-2.103 2.107-1.16 0-2.103-.946-2.103-2.107V4.054c0-1.16.943-2.107 2.103-2.107 1.16 0 2.103.946 2.103 2.107v5.274z" fill="#2EB67D"/>
    <path d="M14.645 17.812c1.16 0 2.103.946 2.103 2.106 0 1.16-.943 2.107-2.103 2.107-1.16 0-2.103-.946-2.103-2.107v-2.106h2.103zm0-1.061c-1.16 0-2.103-.946-2.103-2.107 0-1.16.943-2.106 2.103-2.106h5.27c1.16 0 2.103.946 2.103 2.106 0 1.16-.943 2.107-2.103 2.107h-5.27z" fill="#ECB22E"/>
  </svg>`;
}

// Get check mark SVG for success state - Updated to match Perplexity's style
function getCheckMarkSVG() {
  return `<svg class="checkmark tabler-icon tabler-icon-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 12l5 5l10 -10"></path>
  </svg>`;
}

/**
 * Show feedback when a button is clicked
 * @param {HTMLElement} button - The button element
 * @param {string} type - The feedback type ('success' or 'error')
 */
function showFeedback(button, type) {
  // Clear previous classes and timeouts
  button.classList.remove('active', 'success', 'error');

  if (button._feedbackTimeout) {
    clearTimeout(button._feedbackTimeout);
    button._feedbackTimeout = null;
  }

  // Add appropriate class based on type
  button.classList.add('active', type);

  // Show appropriate tooltip message
  const tooltipElement = button.parentNode.querySelector('.slack-button-tooltip');
  if (tooltipElement) {
    if (type === 'success') {
      tooltipElement.textContent = 'Copied!';
      tooltipElement.style.opacity = '1';
    } else if (type === 'error') {
      tooltipElement.textContent = 'Failed to copy';
      tooltipElement.style.opacity = '1';
    }
  }

  // Reset after delay
  button._feedbackTimeout = setTimeout(() => {
    button.classList.remove('active', 'success', 'error');
    if (tooltipElement) {
      tooltipElement.textContent = 'Copy for Slack';
      tooltipElement.style.opacity = '';
    }
    button._feedbackTimeout = null;
  }, 2000);
}

// Find the main Perplexity response container
function findPerplexityResponses() {
  // Look specifically for copy icons in the toolbar
  const copySvgIcons = document.querySelectorAll('svg.tabler-icon-copy');
  const responseContainers = [];

  console.log('Found copy icons:', copySvgIcons.length);

  if (copySvgIcons.length > 0) {
    // We found at least one copy icon, so add our button next to it
    copySvgIcons.forEach(copyIcon => {
      // Get the parent button
      const copyButton = copyIcon.closest('button');
      if (!copyButton) {
        console.log('No parent button for copy icon');
        return;
      }

      // Get the parent toolbar/container
      const toolbar = copyButton.parentElement;
      if (!toolbar) {
        console.log('No parent toolbar for copy button');
        return;
      }

      // Find the parent response container
      const responseSelectors = '.border-borderMain\\/50, .answer-container, .response-container, [data-answer-id], [role="article"], .answer';
      const responseContainer = toolbar.closest(responseSelectors);

      if (responseContainer && !responseContainers.includes(responseContainer)) {
        console.log('Found response container:', responseContainer);
        responseContainers.push(responseContainer);
      } else {
        console.log('No response container found for toolbar', toolbar);
      }
    });
  }

  // If we couldn't find any containers with copy buttons, fall back to the old method
  if (responseContainers.length === 0) {
    console.log('No response containers found with copy buttons, using fallback selectors');
    const fallbackSelectors = '.border-borderMain\\/50, .answer-container, .response-container, [data-answer-id], [role="article"], .answer';
    const fallbackContainers = document.querySelectorAll(fallbackSelectors);
    console.log('Found fallback containers:', fallbackContainers.length);
    return fallbackContainers;
  }

  return responseContainers;
}

/**
 * Add a Slack copy button to a response element
 * @param {HTMLElement} responseElement - The response element to add a button to
 */
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
    btn.querySelector('svg.tabler-icon-dots') ||
    btn.getAttribute('aria-label')?.includes('More')
  );

  let menuButton = null;
  if (menuButtonIndex > -1) {
    menuButton = menuButtons[menuButtonIndex];
  }

  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'slack-button-container';

  // Create the tooltip
  const tooltip = document.createElement('span');
  tooltip.className = 'slack-button-tooltip';
  tooltip.textContent = 'Copy for Slack';
  buttonContainer.appendChild(tooltip);

  // Create the button
  const button = document.createElement('button');
  button.className = 'slack-copy-button focus-visible:bg-offsetPlus dark:focus-visible:bg-offsetPlusDark hover:bg-offsetPlus text-textOff dark:text-textOffDark hover:text-textMain dark:hover:bg-offsetPlusDark dark:hover:text-textMainDark';
  button.title = 'Copy for Slack';
  button.setAttribute('aria-label', 'Copy for Slack');
  button.setAttribute('type', 'button');
  button.innerHTML = getSlackIconSVG() + getCheckMarkSVG();

  // Add click event to the button
  button.addEventListener('click', async () => {
    try {
      // Get all text from the response element
      console.log('Response element:', responseElement);

      // Enhanced content extraction
      let extractedContent = '';

      try {
        // First check if we can find a specific container with the main content
        const possibleContainers = [
          responseElement.querySelector('.prose'),
          responseElement.querySelector('[data-testid="answer-body"]'),
          responseElement.querySelector('[role="article"]')
        ];

        const contentContainer = possibleContainers.find(el => el) || responseElement;
        console.log('Using content container:', contentContainer);

        // Remove citation section if present
        // Need to search for text content with "Citations:" since we can't use :contains
        const allDivs = contentContainer.querySelectorAll('div');
        let citationSection = null;
        for (const div of allDivs) {
          if (div.textContent.includes('Citations:')) {
            citationSection = div;
            break;
          }
        }

        if (citationSection) {
          console.log('Found citation section, removing');
          citationSection.remove();
        }

        // Get all significant elements in order
        const allElements = contentContainer.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, li');
        console.log('Found elements:', allElements.length);

        // Process elements
        const processedContent = [];
        const processedTexts = new Set(); // Avoid duplicates

        for (const el of allElements) {
          // Skip if this is a list item that will be processed with its parent list
          if (el.tagName === 'LI' && (el.parentElement.tagName === 'UL' || el.parentElement.tagName === 'OL')) {
            continue;
          }

          // Clean text content
          let text = el.textContent
            // Remove citation references [1], [2], etc.
            .replace(/\s?\[\d+\](?:\[\d+\])*\s?/g, ' ')
            // Remove other citation format
            .replace(/\[\s*\d+\s*\]/g, '')
            // Remove unbracketed citations at end
            .replace(/\s\d+(?:\s\d+)*\s?(?=\.|,|;|$)/g, '')
            .trim();

          // Skip empty or already processed content
          if (!text || processedTexts.has(text.toLowerCase())) {
            continue;
          }

          // Format based on element type
          if (el.tagName.match(/^H[1-6]$/)) {
            // Headings become bold
            processedContent.push(`*${text}*\n`);
          }
          else if (el.tagName === 'UL' || el.tagName === 'OL') {
            // Process list items
            const items = Array.from(el.querySelectorAll('li'));
            for (const item of items) {
              const itemText = item.textContent
                .replace(/\s?\[\d+\](?:\[\d+\])*\s?/g, ' ')
                .replace(/\[\s*\d+\s*\]/g, '')
                .replace(/\s\d+(?:\s\d+)*\s?(?=\.|,|;|$)/g, '')
                .trim();

              if (itemText && !processedTexts.has(itemText.toLowerCase())) {
                processedContent.push(`• ${itemText}`);
                processedTexts.add(itemText.toLowerCase());
              }
            }
            processedContent.push(''); // Add spacing after list
          }
          else {
            // Regular paragraphs
            processedContent.push(`${text}\n`);
          }

          processedTexts.add(text.toLowerCase());
        }

        // Join all processed content
        extractedContent = processedContent.join('\n');

        // If we somehow got no content, fall back to simple text extraction
        if (!extractedContent.trim()) {
          console.log('No structured content found, falling back to text extraction');
          extractedContent = contentContainer.textContent || '';

          // Clean up the fallback text
          extractedContent = extractedContent
            .replace(/\s?\[\d+\](?:\[\d+\])*\s?/g, ' ')
            .replace(/\[\s*\d+\s*\]/g, '')
            .replace(/\s\d+(?:\s\d+)*\s?(?=\.|,|;|$)/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
        }

        console.log('Extracted content length:', extractedContent.length);
        console.log('Sample:', extractedContent.substring(0, 100) + '...');
      } catch (extractError) {
        console.error('Error extracting content:', extractError);
        // Fallback to simple text extraction
        extractedContent = responseElement.textContent || '';

        // Clean up the fallback text
        extractedContent = extractedContent
          .replace(/\s?\[\d+\](?:\[\d+\])*\s?/g, ' ')
          .replace(/\[\s*\d+\s*\]/g, '')
          .replace(/\s\d+(?:\s\d+)*\s?(?=\.|,|;|$)/g, '')
          .replace(/\s{2,}/g, ' ')
          .trim();
      }

      // Format for Slack - simple formatting
      const slackContent = extractedContent
        // Convert markdown bold to Slack bold
        .replace(/\*\*([^*]+?)\*\*/g, '*$1*')
        // Format bullet points
        .replace(/^[-*]\s+(.*)$/gm, '• $1');

      // Try to copy the content
      console.log('Attempting to copy extracted content');
      const success = await copyToClipboard(slackContent);

      console.log('Copy success:', success);

      // Show feedback
      showFeedback(button, success ? 'success' : 'error');
    } catch (error) {
      console.error('Error processing content:', error);
      showFeedback(button, 'error');
    }
  });

  // Add the button to the container
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
async function initPerplexityToSlack() {
  // Wait for content to be available
  const content = await waitForPerplexityContent();

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
  return function () {
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

// Enhanced MutationObserver setup
function waitForPerplexityContent() {
  return new Promise(resolve => {
    // First check if content already exists
    const content = document.querySelector('.prose, [data-testid="answer-body"], [role="article"]');
    if (content) {
      resolve(content);
      return;
    }

    // Otherwise, set up an observer to wait for it
    const observer = new MutationObserver((mutations, obs) => {
      const content = document.querySelector('.prose, [data-testid="answer-body"], [role="article"]');
      if (content) {
        obs.disconnect();
        resolve(content);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Timeout after 10 seconds to prevent infinite waiting
    setTimeout(() => {
      observer.disconnect();
      resolve(document.body); // Fallback to body if content not found
    }, 10000);
  });
}