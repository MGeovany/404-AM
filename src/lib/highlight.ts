export interface Token {
  text: string
  cls?: 'tok-key' | 'tok-string' | 'tok-number' | 'tok-keyword'
}

// Matches: quoted strings (optionally followed by a colon => object key),
// the literals true/false/null, and numbers.
const TOKEN_RE =
  /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g

/**
 * Tokenizes already-pretty-printed JSON into colorable spans. Falls back
 * gracefully: anything not recognized is emitted as a plain (class-less) token.
 */
export function highlightJson(src: string): Token[] {
  const out: Token[] = []
  let last = 0
  let m: RegExpExecArray | null
  TOKEN_RE.lastIndex = 0
  while ((m = TOKEN_RE.exec(src)) !== null) {
    if (m.index > last) out.push({ text: src.slice(last, m.index) })
    if (m[1] !== undefined) {
      if (m[2] !== undefined) {
        out.push({ text: m[1], cls: 'tok-key' })
        out.push({ text: m[2] }) // the colon + any spaces
      } else {
        out.push({ text: m[1], cls: 'tok-string' })
      }
    } else if (m[3] !== undefined) {
      out.push({ text: m[3], cls: 'tok-keyword' })
    } else if (m[4] !== undefined) {
      out.push({ text: m[4], cls: 'tok-number' })
    }
    last = TOKEN_RE.lastIndex
  }
  if (last < src.length) out.push({ text: src.slice(last) })
  return out
}

/** Counts case-insensitive occurrences of `query` in `text`. */
export function countMatches(text: string, query: string): number {
  if (!query) return 0
  let count = 0
  let i = 0
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  while ((i = lower.indexOf(q, i)) !== -1) {
    count++
    i += q.length
  }
  return count
}
