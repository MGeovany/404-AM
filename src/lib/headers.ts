import type { HarHeader } from '../types'

/** Headers we surface prominently in the detail view. */
export const IMPORTANT_HEADERS = [
  'authorization',
  'content-type',
  'cookie',
  'set-cookie',
  'x-request-id',
  'x-correlation-id',
  'x-trace-id',
]

/** Headers whose values we mask by default. */
export const SENSITIVE_HEADERS = ['authorization', 'cookie', 'set-cookie']

export function isImportant(name: string): boolean {
  return IMPORTANT_HEADERS.includes(name.toLowerCase())
}

export function isSensitive(name: string): boolean {
  return SENSITIVE_HEADERS.includes(name.toLowerCase())
}

/**
 * Returns a redacted version of a sensitive header value, keeping just enough
 * context (e.g. the auth scheme) to be useful while hiding the secret.
 */
export function maskValue(name: string, value: string): string {
  if (!isSensitive(name)) return value
  if (name.toLowerCase() === 'authorization') {
    const [scheme, ...rest] = value.split(' ')
    return rest.length ? `${scheme} ••••••••` : '••••••••'
  }
  return '•••••••• (hidden)'
}

export function getImportantHeaders(headers: HarHeader[]): HarHeader[] {
  return headers.filter((h) => isImportant(h.name))
}

/** Correlation/trace headers useful for cross-referencing backend logs. */
export const TRACE_HEADERS = ['x-request-id', 'x-correlation-id', 'x-trace-id']

export function isTrace(name: string): boolean {
  return TRACE_HEADERS.includes(name.toLowerCase())
}

/**
 * Collects trace/correlation IDs from both request and response headers,
 * de-duplicated by name + value. These are not secrets, so values are shown.
 */
export function getTraceIds(...headerLists: HarHeader[][]): HarHeader[] {
  const seen = new Set<string>()
  const out: HarHeader[] = []
  for (const list of headerLists) {
    for (const h of list) {
      if (!isTrace(h.name)) continue
      const key = `${h.name.toLowerCase()}=${h.value}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(h)
    }
  }
  return out
}
