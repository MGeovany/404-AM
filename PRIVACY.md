# Privacy Policy — 404-AM

_Last updated: 2026-06-19_

404-AM is a Chrome DevTools extension that helps developers inspect and debug
the network requests and console output of the web page they are actively
inspecting.

## Data we collect

**None.** 404-AM does not collect, transmit, sell, or share any data. There are
no analytics, no tracking, and no remote servers. Everything runs locally in
your browser.

## What the extension accesses, and why

- **Network requests of the inspected page** — read via the Chrome DevTools API
  (`chrome.devtools.network`) only while you have DevTools open on a tab. Used to
  display methods, URLs, status codes, headers, payloads, and response bodies in
  the panel. This data never leaves your machine.
- **Console output of the inspected page** — read by evaluating a small logging
  hook in the page via `chrome.devtools.inspectedWindow.eval`, shown in the
  Console panel. Not stored or transmitted.
- **Local preferences** (`chrome.storage.local`) — used solely to remember your
  UI settings (active filters, sort order, sidebar width) on your own device.

## Actions you initiate

- **Export (HAR/JSON)** and **Copy** actions place data into a file or your
  clipboard on your device. What you do with that output is your choice.
- **Copy for AI** masks sensitive header values (e.g. `Authorization`,
  `Cookie`) by default before copying, so secrets are not included.

## Permissions

- `storage` — store UI preferences locally.
- `devtools_page` — the entire feature set is a DevTools panel.

404-AM requests **no host permissions**, injects **no content scripts**, and
runs **no remote code**.

## Contact

For questions about this policy, open an issue in the project repository.
