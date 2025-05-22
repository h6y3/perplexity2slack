/**
 * Background script for Perplexity to Slack extension
 */

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Perplexity to Slack extension installed');
});

// Add context menu item for text selection
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'copy-for-slack',
    title: 'Copy for Slack',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'copy-for-slack') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'copySelection',
      text: info.selectionText
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'notify') {
    // Could be used for notifications or badge updates
    console.log('Notification:', request.message);
  }
  
  // Always return true for async response
  return true;
});