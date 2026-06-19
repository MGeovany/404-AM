# 404-AM

Chrome DevTools panel to inspect `fetch` and XHR requests: status, duration, headers, payload and response body. Sensitive values are masked by default. Copy as cURL or fetch.

## Develop

```bash
pnpm install
pnpm build
pnpm watch
```

## Load in Chrome

1. Run `pnpm build` (creates `dist/`).
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `dist/` folder.
5. Open DevTools on any page → **404-AM** tab.

After changing code, run `pnpm build` or keep `pnpm watch` running, then close and reopen DevTools.

## Architecture

- `manifest.json` → `devtools_page: devtools.html`
- `devtools.ts` → `chrome.devtools.panels.create("404-AM", …, "panel.html")`
- `panel.html` → React app listening to `chrome.devtools.network.onRequestFinished`

No background service worker is needed.
