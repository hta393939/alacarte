
const COL = 'color:#3333ff';

console.log('%c background', COL);

chrome.action.onClicked.addListener((tab) => {
  const url = '../index.html';
  chrome.tabs.create({
    url,
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('%c message', COL);
  switch (request.type) {
    case 'reqlist':
      {
        chrome.tabs.getCurrent()
          .then(tab => {
            const tabId = tab.id;
            console.log('%c tab', COL, tab);
            const obj = { type: 'reqlist' };
            return chrome.tabs.sendMessage(tabId, obj);
          })
          .then(res => {
            sendResponse(res);
          })
          .catch(e => {
            console.warn('%c catch', COL, e);
          });
      }
      return true; // 非同期応答
      break;
    case 'ping':
      break;
  }
  sendResponse({ type: 'res' });
});

