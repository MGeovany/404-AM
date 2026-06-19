# Network Summary Extension

A Chrome DevTools panel ("Network Summary") to quickly understand what happened
with each `fetch`/`xhr` request in a web app: status, duration, important
headers, payload, response body, with sensitive values masked by default and
"Copy as cURL / fetch".

## Develop

```bash
npm install
npm run build      # one-off build into dist/
npm run watch      # rebuild on change (reload the panel to pick up changes)
```

## Load in Chrome

1. Run `npm run build` (creates `dist/`).
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked** and select the `dist/` folder.
5. Open DevTools (F12) on any page → **Network Summary** tab.

After changing code, run `npm run build` (or keep `npm run watch` running),
then close & reopen DevTools — DevTools-page scripts are only re-read when the
DevTools window is reopened.

## Architecture

- `manifest.json` → `devtools_page: devtools.html`
- `devtools.ts` → `chrome.devtools.panels.create("Network Summary", …, "panel.html")`
- `panel.html` → React app that listens to
  `chrome.devtools.network.onRequestFinished` and reads bodies via
  `request.getContent()`.

No background service worker is needed: capture and inspection both happen in
the DevTools panel context.
