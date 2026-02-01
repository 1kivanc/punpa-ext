chrome.action.onClicked.addListener(async () => {
  const existingWindows = await chrome.windows.getAll({ populate: true });
  const popupUrl = chrome.runtime.getURL("popup.html");
  
  const existingWindow = existingWindows.find(w => 
    w.tabs.some(t => t.url === popupUrl)
  );

  if (existingWindow) {
    chrome.windows.update(existingWindow.id, { focused: true });
  } else {
    chrome.windows.create({
      url: "popup.html",
      type: "popup",
      width: 400,
      height: 600
    });
  }
});
