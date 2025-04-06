
const COL = 'color:#3333ff';

console.log('%c background start', COL);

/** タブ1個返す */
const getTab = () => {
  return new Promise((resolve, reject) => {
    const param = {
      active: true, lastFocusedWindow: true,
    };
    chrome.tabs.query(param, (tabs) => {
      console.log('%c query callback', COL, tabs);
      if (chrome.runtime.lastError) {
        console.error('background error', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        resolve(tabs[0]);
      }
    });
  });
};

chrome.action.onClicked.addListener((tab) => {
  const url = '../index.html';
  chrome.tabs.create({
    url,
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('%c background message', COL, request, sender);
  switch (request.type) {
    case 'reqlist':
      {
        getTab()
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

