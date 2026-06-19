import type { CapturedRequest } from '../types'
import { maskValue } from './headers'

interface CopyOptions {
  /** When false, sensitive header values are masked in the output too. */
  reveal: boolean
}

function shellQuote(s: string): string {
  // Wrap in single quotes; escape embedded single quotes the POSIX way.
  return `'${s.replace(/'/g, `'\\''`)}'`
}

// HTTP/2 pseudo-headers (":method", ":authority", ...) are not real request
// headers and break curl/fetch, so we drop them.
function isPseudoHeader(name: string): boolean {
  return name.startsWith(':')
}

export function toCurl(req: CapturedRequest, opts: CopyOptions): string {
  const parts = [`curl ${shellQuote(req.url)}`, `-X ${req.method}`]
  for (const h of req.requestHeaders) {
    if (isPseudoHeader(h.name)) continue
    const value = opts.reveal ? h.value : maskValue(h.name, h.value)
    parts.push(`-H ${shellQuote(`${h.name}: ${value}`)}`)
  }
  if (req.requestBody?.text) {
    parts.push(`--data-raw ${shellQuote(req.requestBody.text)}`)
  }
  return parts.join(' \\\n  ')
}

export function toFetch(req: CapturedRequest, opts: CopyOptions): string {
  const headers: Record<string, string> = {}
  for (const h of req.requestHeaders) {
    if (isPseudoHeader(h.name)) continue
    headers[h.name] = opts.reveal ? h.value : maskValue(h.name, h.value)
  }
  const init: Record<string, unknown> = { method: req.method, headers }
  if (req.requestBody?.text) init.body = req.requestBody.text
  return `fetch(${JSON.stringify(req.url)}, ${JSON.stringify(init, null, 2)});`
}
