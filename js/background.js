'use strict';

// opens the given ticket in current or new tab
var openTicket = (ticket, newTab) => {
  chrome.storage.sync.set({
    lastTicket: ticket
  });

  chrome.storage.sync.get({
    jiraURL: ''
  }, options => {
    // get saved JIRA URL
    let jiraURL = options.jiraURL;
    let newURL;
    if (!jiraURL) {
      // go to options page
      chrome.runtime.openOptionsPage();
      return;
    } else {
      // make URL
      newURL = jiraURL + ticket;
    }

    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      if (newTab) {
        // open in new tab
        chrome.tabs.create({ url: newURL });
      } else {
        // update current tab
        chrome.tabs.update(tabs[0].id, {
          url: newURL
        });
      }
    });
  });
};

let handleSelectionCurrent = selection => {
  openTicket(selection.selectionText, false);
};

let handleSelectionNew = selection => {
  openTicket(selection.selectionText, true);
};

let parentId = chrome.contextMenus.create({
  'title': 'Quick JIRA',
  'contexts': ['selection']
});

let currentTabString = chrome.i18n.getMessage('openInCurrentTab');
chrome.contextMenus.create({
  'title': currentTabString,
  'parentId': parentId,
  'contexts': ['selection'],
  'onclick': handleSelectionCurrent
});

let newTabString = chrome.i18n.getMessage('openInNewTab');
chrome.contextMenus.create({
  'title': newTabString,
  'parentId': parentId,
  'contexts': ['selection'],
  'onclick': handleSelectionNew
});

// listen to omnibox jira
chrome.omnibox.onInputEntered.addListener(text => {
  chrome.storage.sync.get({
    // fallback
    defaultOption: 0
  }, options => {
    openTicket(text, options.defaultOption !== 0);
  });
});

let funcToInject = () => {
  'use strict';
  let selection = window.getSelection();
  return (selection.rangeCount > 0) ? selection.toString() : '';
};

const jsCodeStr = `;(${funcToInject})();`;

// Listen to commands
chrome.commands.onCommand.addListener((cmd) => {
  chrome.tabs.executeScript({
    code: jsCodeStr,
    allFrames: true
  }, function(selectedTextPerFrame) {
    if (!chrome.runtime.lastError && ((selectedTextPerFrame.length > 0) && (typeof(selectedTextPerFrame[0]) === 'string'))) {
      let selectedText = selectedTextPerFrame[0];
      if (cmd === 'open-ticket-in-current-tab') {
        openTicket(selectedText, false);
      } else if (cmd === 'open-ticket-in-new-tab') {
        openTicket(selectedText, true);
      }
    }
  });
});

// Listen to install
chrome.runtime.onInstalled.addListener(details => {
  switch(details.reason) {
  case 'install':
    chrome.runtime.openOptionsPage();
    break;
  }
});
