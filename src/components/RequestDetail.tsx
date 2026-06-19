import { useEffect, useState } from 'react'
import type { CapturedRequest, HarHeader } from '../types'
import { getTraceIds, isImportant, isSensitive, maskValue } from '../lib/headers'
import { tryFormatJson } from '../lib/json'
import { toCurl, toFetch } from '../lib/curl'
import { statusClass } from './RequestRow'

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

function HeaderTable({ headers, reveal }: { headers: HarHeader[]; reveal: boolean }) {
  if (headers.length === 0) return <div className="muted">None</div>
  const sorted = [...headers].sort(
    (a, b) => Number(isImportant(b.name)) - Number(isImportant(a.name)),
  )
  return (
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
              <td className="hvalue">
                {showRaw ? h.value : maskValue(h.name, h.value)}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function BodyBlock({ text, mimeType }: { text: string; mimeType?: string }) {
  if (!text) return <div className="muted">Empty</div>
  const { isJson, formatted } = tryFormatJson(text, mimeType)
  return (
    <pre className={`body ${isJson ? 'json' : ''}`}>
      <code>{formatted}</code>
    </pre>
  )
}

function EmptyDetailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 9h6M9 13h4" />
    </svg>
  )
}

export function RequestDetail({ req }: { req: CapturedRequest | null }) {
  const [reveal, setReveal] = useState(false)
  const [body, setBody] = useState<{ content: string; encoding: string } | null>(null)
  const [loadingBody, setLoadingBody] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    setBody(null)
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
        <span className="empty-hint">Pick one from the list to inspect it</span>
      </div>
    )
  }

  const flash = async (label: string, text: string) => {
    await copyText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 1500)
  }

  const traceIds = getTraceIds(req.requestHeaders, req.responseHeaders)

  return (
    <div className="detail">
      <div className="detail-toolbar">
        <label className="check">
          <input
            type="checkbox"
            checked={reveal}
            onChange={(e) => setReveal(e.target.checked)}
          />
          Show sensitive data
        </label>
        <span className="spacer" />
        <button onClick={() => flash('curl', toCurl(req, { reveal }))}>
          {copied === 'curl' ? 'Copied' : 'cURL'}
        </button>
        <button onClick={() => flash('fetch', toFetch(req, { reveal }))}>
          {copied === 'fetch' ? 'Copied' : 'fetch'}
        </button>
      </div>

      <div className="detail-body">
        <section>
          <h3>Summary</h3>
          <dl className="overview">
            <dt>Method</dt>
            <dd>{req.method}</dd>
            <dt>Status</dt>
            <dd className={statusClass(req.status)}>
              {req.status || 'pending'} {req.statusText}
            </dd>
            <dt>Duration</dt>
            <dd>{req.durationMs >= 0 ? `${req.durationMs} ms` : 'pending'}</dd>
            <dt>Type</dt>
            <dd>{req.resourceType}</dd>
            <dt>URL</dt>
            <dd className="url-value">{req.url}</dd>
          </dl>
        </section>

        {traceIds.length > 0 && (
          <section>
            <h3>Traces</h3>
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

        <section>
          <h3>Request headers</h3>
          <HeaderTable headers={req.requestHeaders} reveal={reveal} />
        </section>

        <section>
          <h3>Response headers</h3>
          <HeaderTable headers={req.responseHeaders} reveal={reveal} />
        </section>

        {req.requestBody && (
          <section>
            <h3>Request body</h3>
            <BodyBlock text={req.requestBody.text ?? ''} mimeType={req.requestBody.mimeType} />
          </section>
        )}

        <section>
          <h3>Response body</h3>
          {loadingBody ? (
            <div className="muted">Loading</div>
          ) : body?.encoding === 'base64' ? (
            <div className="muted">
              Binary {req.responseBodySize} bytes {req.responseMimeType}
            </div>
          ) : (
            <BodyBlock text={body?.content ?? ''} mimeType={req.responseMimeType} />
          )}
        </section>
      </div>
    </div>
  )
}
