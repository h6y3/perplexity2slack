/**
 * Convert markdown to Slack's mrkdwn format
 * @param {string} markdown - Standard markdown content
 * @returns {string} - Slack-compatible markdown
 */
export function convertToSlack(markdown) {
  // Basic conversion
  let slackContent = applySlackFormatting(markdown);
  
  // Apply additional transformations for Slack compatibility
  slackContent = applySlackCustomRules(slackContent);
  
  return slackContent;
}

/**
 * Apply basic Slack markdown formatting rules
 * @param {string} content - Original markdown content
 * @returns {string} - Content with Slack formatting
 */
function applySlackFormatting(content) {
  return content
    // Convert links [text](url) to Slack format <url|text>
    .replace(/\[(.*?)\]\((.*?)\)/g, '<$2|$1>')
    // Keep bold formatting (already using *text*)
    // Keep italic formatting (already using _text_)
    // Keep strikethrough (already using ~text~)
    // Code blocks are already in ```code``` format
    // Handle inline code
    .replace(/`([^`]+)`/g, '`$1`')
    // Standardize lists
    .replace(/^\s*[-*+]\s+/gm, '• ')
    // Convert numbered lists to bullet points (Slack handles numbered lists poorly)
    .replace(/^\s*\d+\.\s+/gm, '• ')
    .trim();
}

/**
 * Apply Slack-specific formatting rules beyond basic formatting
 * @param {string} content - Content after initial conversion
 * @returns {string} - Further optimized content for Slack
 */
function applySlackCustomRules(content) {
  // Fix code block formatting if needed
  content = fixCodeBlocks(content);
  
  // Handle any other edge cases
  content = handleEdgeCases(content);
  
  return content;
}

/**
 * Fix code block formatting specifically for Slack
 * @param {string} content - Content to process
 * @returns {string} - Content with fixed code blocks
 */
function fixCodeBlocks(content) {
  // Ensure code blocks have proper formatting
  // Slack uses ```code``` format
  return content.replace(/```(\w*)\n([\s\S]*?)```/g, (match, language, code) => {
    // Trim extra blank lines in code blocks that might cause issues in Slack
    const trimmedCode = code.trim();
    return '```' + language + '\n' + trimmedCode + '\n```';
  });
}

/**
 * Handle edge cases in Slack formatting
 * @param {string} content - Content to process
 * @returns {string} - Content with fixed edge cases
 */
function handleEdgeCases(content) {
  // Prevent Slack from auto-linking by adding zero-width space after http/https
  content = content.replace(/(https?:\/\/)/g, '$1​'); // Includes a zero-width space
  
  // Fix cases where bold/italic formatting might break due to adjacent punctuation
  content = content.replace(/(\*\w+)([.,;:!?])(\*)/g, '$1$3$2');
  content = content.replace(/(_\w+)([.,;:!?])(_)/g, '$1$3$2');
  
  // Remove spaces around punctuation that might have been introduced during extraction
  content = content.replace(/\s+([.,;:!?])/g, '$1');
  
  // Fix Slack's handling of multiple paragraphs
  content = content.replace(/\n\n\n+/g, '\n\n');
  
  return content;
}

/**
 * Remove citation numbers from text
 * @param {string} text - Text with citation numbers
 * @returns {string} - Text with citations removed
 */
export function removeCitations(text) {
  return text
    // Remove bracketed citations [1][2][3]
    .replace(/\s?\[\d+\](?:\[\d+\])*\s?/g, '')
    // Remove unbracketed citations 123
    .replace(/\s?\d+(?:\d+)*\s?(?=\.|,|;|$)/g, '')
    // Remove space before punctuation
    .replace(/\s+([.,;:])/g, '$1')
    .trim();
}