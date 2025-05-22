/**
 * Content extraction library for Perplexity2Slack
 * Handles DOM parsing and citation removal
 */

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
  // Get all top-level elements in document order
  const topLevelElements = Array.from(
    element.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre')
  );
  
  // If no structure is found, fall back to extracting text directly
  if (topLevelElements.length === 0) {
    return cleanTextContent(element.textContent);
  }
  
  // Process elements in their original order
  let result = '';
  let lastElementType = null;
  
  topLevelElements.forEach(el => {
    // Add appropriate spacing between different element types
    if (lastElementType && lastElementType !== el.tagName) {
      result += '\n';
    }
    
    // Process based on element type
    if (el.tagName.match(/^H[1-6]$/)) {
      // Headings become bold in Slack
      result += `*${cleanTextContent(el.textContent)}*\n\n`;
    } 
    else if (el.tagName === 'UL' || el.tagName === 'OL') {
      // Process list items
      const items = Array.from(el.querySelectorAll('li'));
      items.forEach(item => {
        result += `• ${cleanTextContent(item.textContent)}\n`;
      });
      result += '\n';
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
      // Regular paragraphs and other elements
      const cleanedText = cleanTextContent(el.textContent);
      if (cleanedText.trim()) {
        result += cleanedText + '\n\n';
      }
    }
    
    lastElementType = el.tagName;
  });
  
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

// Export the functions
module.exports = {
  extractContent,
  cleanTextContent,
  removeCitationElements,
  extractStructuredText
};