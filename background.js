// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Perplexity to Slack extension installed');
  
  // Create context menu item
  chrome.contextMenus.create({
    id: 'copy-for-slack',
    title: 'Copy for Slack',
    contexts: ['selection'],
    documentUrlPatterns: ['*://www.perplexity.ai/*']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'copy-for-slack') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'copySelection',
      text: info.selectionText
    }, response => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError);
      } else if (response && response.success) {
        console.log('Content copied to clipboard');
      } else {
        console.error('Failed to copy to clipboard');
      }
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'log') {
    console.log('Content script log:', message.text);
    sendResponse({ received: true });
  }
  
  return true; // Indicate asynchronous response
});

// Handle browser action click (toolbar icon)
chrome.action.onClicked.addListener((tab) => {
  // Only activate on Perplexity
  if (tab.url && tab.url.includes('perplexity.ai')) {
    chrome.tabs.sendMessage(tab.id, { 
      action: 'toggleButtons' 
    }, response => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError);
      }
    });
  } else {
    // Open Perplexity in a new tab if we're not already there
    chrome.tabs.create({ url: 'https://www.perplexity.ai' });
  }
});