// Registers a new tab in Chrome DevTools called "Network Summary".
// The third argument is the page rendered inside that tab.
chrome.devtools.panels.create(
  'Network Summary',
  'icons/icon32.png', // icon shown on the panel tab
  'panel.html',
)
