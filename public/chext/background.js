

chrome.action.onClicked.addListener((tab) => {
  const url = '../index.html';
  chrome.tabs.create({
    url,
  });
});
