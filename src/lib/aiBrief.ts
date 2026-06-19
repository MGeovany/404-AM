import type { CapturedRequest, HarHeader } from '../types'
import type { ConsoleEntry } from '../hooks/useConsoleLogs'
import { getTraceIds, isImportant, maskValue } from './headers'
import { tryFormatJson } from './json'

const MAX_BODY = 4000

function classify(status: number): string {
  if (status === 0) return 'the request never completed (network error / blocked / CORS)'
  if (status >= 500) return 'a 5xx server-side error'
  if (status >= 400) return 'a 4xx client-side error (request was rejected)'
  if (status >= 300) return 'a 3xx redirect'
  return 'a successful response'
}

function pathOf(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

// Sensitive values are always masked here — this text is meant to be pasted
// into an AI chat, so secrets must not leak.
function headerLines(headers: HarHeader[], onlyImportant: boolean): string {
  const list = onlyImportant ? headers.filter((h) => isImportant(h.name)) : headers
  if (list.length === 0) return '  (none)'
  return list.map((h) => `  ${h.name}: ${maskValue(h.name, h.value)}`).join('\n')
}

function truncate(text: string): string {
  if (text.length <= MAX_BODY) return text
  return text.slice(0, MAX_BODY) + `\n… [truncated ${text.length - MAX_BODY} chars]`
}

function fence(text: string, lang = ''): string {
  return '```' + lang + '\n' + text + '\n```'
}

interface BriefOptions {
  responseBody: string
  isBinary: boolean
  consoleLogs?: ConsoleEntry[]
}

/**
 * Builds a self-contained, AI-friendly debugging brief for a request — telling
 * the assistant what failed, where to look in the codebase, and including the
 * full (secret-masked) request/response context plus recent console errors.
 */
export function toAiBrief(req: CapturedRequest, opts: BriefOptions): string {
  const path = pathOf(req.url)
  const traces = getTraceIds(req.requestHeaders, req.responseHeaders)
  const reqJson = req.requestBody?.text
    ? tryFormatJson(req.requestBody.text, req.requestBody.mimeType)
    : null
  const resJson =
    !opts.isBinary && opts.responseBody
      ? tryFormatJson(opts.responseBody, req.responseMimeType)
      : null
  const relevantLogs = (opts.consoleLogs ?? [])
    .filter((l) => l.level === 'error' || l.level === 'warn')
    .slice(-15)

  const lines: string[] = []
  lines.push('# Failed network request — debug brief')
  lines.push('')
  lines.push(
    'A network request in my web app failed. Help me find the root cause in my codebase and propose a fix.',
  )
  lines.push('')
  lines.push('## What failed')
  lines.push(`- \`${req.method} ${req.url}\``)
  lines.push(
    `- Result: **${req.status || 'no status'} ${req.statusText}** — ${classify(req.status)}`,
  )
  lines.push(`- Duration: ${req.durationMs >= 0 ? `${req.durationMs} ms` : 'unknown'}`)
  lines.push('')
  lines.push('## Where to look')
  lines.push(`- Endpoint path: \`${path}\``)
  lines.push(
    `- Find the call site in the codebase: search for \`${path}\` (or the surrounding URL) in fetch/axios/XHR calls.`,
  )
  if (traces.length > 0) {
    lines.push(
      `- Correlate with backend logs using: ${traces
        .map((t) => `\`${t.name}=${t.value}\``)
        .join(', ')}`,
    )
  }
  lines.push('')
  lines.push('## Request')
  lines.push('Headers (important):')
  lines.push(fence(headerLines(req.requestHeaders, true)))
  if (req.requestBody?.text) {
    lines.push('Body:')
    lines.push(fence(truncate(reqJson?.formatted ?? req.requestBody.text), reqJson?.isJson ? 'json' : ''))
  }
  lines.push('')
  lines.push('## Response')
  lines.push('Headers (important):')
  lines.push(fence(headerLines(req.responseHeaders, true)))
  lines.push('Body:')
  if (opts.isBinary) {
    lines.push(`(binary content, ${req.responseBodySize} bytes, ${req.responseMimeType})`)
  } else if (!opts.responseBody) {
    lines.push('(empty)')
  } else {
    lines.push(fence(truncate(resJson?.formatted ?? opts.responseBody), resJson?.isJson ? 'json' : ''))
  }

  if (relevantLogs.length > 0) {
    lines.push('')
    lines.push('## Recent console errors/warnings')
    lines.push(fence(relevantLogs.map((l) => `[${l.level}] ${l.text}`).join('\n')))
  }

  lines.push('')
  lines.push('## Ask')
  lines.push(
    '1. Explain the most likely cause of this failure. 2. Point me to the specific file/function to inspect first. 3. Suggest a concrete fix.',
  )
  return lines.join('\n')
}
