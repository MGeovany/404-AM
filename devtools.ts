// Registers a new tab in Chrome DevTools called "404-AM".
// The third argument is the page rendered inside that tab.
chrome.devtools.panels.create(
  '404-AM',
  'icons/icon32.png', // icon shown on the panel tab
  'panel.html',
)
