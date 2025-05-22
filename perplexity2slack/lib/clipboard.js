/**
 * Clipboard operations for Perplexity2Slack
 */

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

/**
 * Copy with visual feedback
 * @param {string} text - Text to copy
 * @param {HTMLElement} button - Button element to show feedback on
 * @returns {Promise<boolean>} - Resolves when copy and feedback is complete
 */
async function copyWithFeedback(text, button) {
  try {
    const success = await copyToClipboard(text);
    showFeedback(button, success ? 'success' : 'error');
    return success;
  } catch (error) {
    console.error('Copy with feedback failed:', error);
    showFeedback(button, 'error');
    return false;
  }
}

/**
 * Show feedback on a button
 * @param {HTMLElement} button - Button to show feedback on
 * @param {string} type - Type of feedback ('success' or 'error')
 */
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

module.exports = {
  copyToClipboard,
  fallbackCopyToClipboard,
  copyWithFeedback,
  showFeedback
};