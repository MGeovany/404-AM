import { useEffect, useState, type ReactNode } from 'react'
import type { CapturedRequest, HarHeader } from '../types'
import { getTraceIds, isImportant, isSensitive, maskValue } from '../lib/headers'
import { tryFormatJson } from '../lib/json'
import { toCurl, toFetch } from '../lib/curl'
import { formatBytes } from '../lib/contentType'
import { countMatches, highlightJson } from '../lib/highlight'
import { methodClass, statusClass } from './RequestRow'

type Tab = 'preview' | 'headers' | 'body' | 'traces'

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  const nodes: ReactNode[] = []
  let i = 0
  let key = 0
  for (;;) {
    const idx = lower.indexOf(q, i)
    if (idx === -1) {
      nodes.push(text.slice(i))
      break
    }
    if (idx > i) nodes.push(text.slice(i, idx))
    nodes.push(<mark key={key++}>{text.slice(idx, idx + q.length)}</mark>)
    i = idx + q.length
  }
  return <>{nodes}</>
}

function HeaderTable({ headers, reveal }: { headers: HarHeader[]; reveal: boolean }) {
  if (headers.length === 0) return <div className="muted">None</div>
  const sorted = [...headers].sort(
    (a, b) => Number(isImportant(b.name)) - Number(isImportant(a.name)),
  )
  return (
    <div className="headers-wrap">
      <table className="headers">
        <tbody>
          {sorted.map((h, i) => {
            const showRaw = reveal || !isSensitive(h.name)
            return (
              <tr key={i} className={isImportant(h.name) ? 'important' : ''}>
                <td className="hname">
                  {h.name}
                  {isImportant(h.name) && <span className="badge">key</span>}
                </td>
                <td className="hvalue">{showRaw ? h.value : maskValue(h.name, h.value)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function BodyBlock({
  text,
  mimeType,
  query = '',
}: {
  text: string
  mimeType?: string
  query?: string
}) {
  if (!text) return <div className="muted">Empty</div>
  const { isJson, formatted } = tryFormatJson(text, mimeType)

  if (query) {
    return (
      <pre className="body">
        <code>
          <Highlighted text={formatted} query={query} />
        </code>
      </pre>
    )
  }

  if (isJson) {
    return (
      <pre className="body json">
        <code>
          {highlightJson(formatted).map((t, i) =>
            t.cls ? (
              <span key={i} className={t.cls}>
                {t.text}
              </span>
            ) : (
              <span key={i}>{t.text}</span>
            ),
          )}
        </code>
      </pre>
    )
  }

  return (
    <pre className="body">
      <code>{formatted}</code>
    </pre>
  )
}

function EmptyDetailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  )
}

function shortPath(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname + u.search
  } catch {
    return url
  }
}

export function RequestDetail({ req }: { req: CapturedRequest | null }) {
  const [reveal, setReveal] = useState(false)
  const [body, setBody] = useState<{ content: string; encoding: string } | null>(null)
  const [loadingBody, setLoadingBody] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [bodyQuery, setBodyQuery] = useState('')
  const [tab, setTab] = useState<Tab>('preview')

  useEffect(() => {
    setBody(null)
    setBodyQuery('')
    setTab('preview')
    if (!req) return
    let cancelled = false
    setLoadingBody(true)
    req.getContent().then((res) => {
      if (cancelled) return
      setBody(res)
      setLoadingBody(false)
    })
    return () => {
      cancelled = true
    }
  }, [req])

  if (!req) {
    return (
      <div className="detail empty">
        <div className="empty-icon">
          <EmptyDetailIcon />
        </div>
        <span className="empty-title">Select a request</span>
        <span className="empty-hint">Choose one from the sidebar</span>
      </div>
    )
  }

  const flash = async (label: string, text: string) => {
    await copyText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 1500)
  }

  const traceIds = getTraceIds(req.requestHeaders, req.responseHeaders)
  const isBinary = body?.encoding === 'base64'
  const responseText = !isBinary && body ? body.content : ''
  const formattedResponse = responseText
    ? tryFormatJson(responseText, req.responseMimeType).formatted
    : ''
  const matchCount = bodyQuery ? countMatches(formattedResponse, bodyQuery) : 0

  const tabs: { id: Tab; label: string; hidden?: boolean }[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'headers', label: 'Headers' },
    { id: 'body', label: 'Body' },
    { id: 'traces', label: 'Traces', hidden: traceIds.length === 0 },
  ]

  return (
    <div className="detail">
      <div className="url-bar">
        <span className={`method-pill ${methodClass(req.method)}`}>{req.method}</span>
        <span className="url-bar-path" title={req.url}>
          {shortPath(req.url)}
        </span>
        <div className="url-bar-meta">
          <span className={`status-pill ${statusClass(req.status)}`}>
            {req.status || '···'}
          </span>
          <span className="meta-chip">
            {req.durationMs >= 0 ? `${req.durationMs} ms` : '···'}
          </span>
          <span className="meta-chip">{formatBytes(req.responseBodySize)}</span>
        </div>
      </div>

      <div className="tab-bar">
        {tabs
          .filter((t) => !t.hidden)
          .map((t) => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        <span className="spacer" />
        <label className="check">
          <input
            type="checkbox"
            checked={reveal}
            onChange={(e) => setReveal(e.target.checked)}
          />
          Sensitive
        </label>
        <button onClick={() => flash('curl', toCurl(req, { reveal }))}>
          {copied === 'curl' ? 'Copied' : 'cURL'}
        </button>
        <button onClick={() => flash('fetch', toFetch(req, { reveal }))}>
          {copied === 'fetch' ? 'Copied' : 'fetch'}
        </button>
      </div>

      <div className="detail-body">
        {tab === 'preview' && (
          <section>
            <dl className="overview">
              <dt>Status</dt>
              <dd className={statusClass(req.status)}>
                {req.status || 'pending'} {req.statusText}
              </dd>
              <dt>Duration</dt>
              <dd>{req.durationMs >= 0 ? `${req.durationMs} ms` : 'pending'}</dd>
              <dt>Type</dt>
              <dd>{req.resourceType}</dd>
              <dt>Content-Type</dt>
              <dd>{req.responseMimeType || 'unknown'}</dd>
              <dt>Size</dt>
              <dd>{formatBytes(req.responseBodySize)}</dd>
              <dt>URL</dt>
              <dd className="url-value">{req.url}</dd>
            </dl>
          </section>
        )}

        {tab === 'headers' && (
          <>
            <section style={{ marginBottom: 20 }}>
              <h3>Request</h3>
              <HeaderTable headers={req.requestHeaders} reveal={reveal} />
            </section>
            <section>
              <h3>Response</h3>
              <HeaderTable headers={req.responseHeaders} reveal={reveal} />
            </section>
          </>
        )}

        {tab === 'body' && (
          <>
            {req.requestBody && (
              <section style={{ marginBottom: 20 }}>
                <h3>Request</h3>
                <BodyBlock text={req.requestBody.text ?? ''} mimeType={req.requestBody.mimeType} />
              </section>
            )}
            <section>
              <div className="section-head">
                <h3>Response</h3>
                {responseText && (
                  <div className="body-search">
                    <input
                      type="text"
                      placeholder="Find in body"
                      value={bodyQuery}
                      onChange={(e) => setBodyQuery(e.target.value)}
                    />
                    {bodyQuery && (
                      <span className="match-count">
                        {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {loadingBody ? (
                <div className="muted">Loading</div>
              ) : isBinary ? (
                <div className="muted">
                  Binary {req.responseBodySize} bytes {req.responseMimeType}
                </div>
              ) : (
                <BodyBlock text={responseText} mimeType={req.responseMimeType} query={bodyQuery} />
              )}
            </section>
          </>
        )}

        {tab === 'traces' && (
          <section>
            <div className="trace-ids">
              {traceIds.map((t, i) => (
                <div key={i} className="trace-id">
                  <span className="trace-name">{t.name}</span>
                  <span className="trace-value">{t.value}</span>
                  <button onClick={() => flash(`trace-${i}`, t.value)}>
                    {copied === `trace-${i}` ? 'Copied' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
