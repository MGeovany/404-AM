import type { CapturedRequest } from '../types'
import { categoryOf, formatBytes } from '../lib/contentType'

export function statusClass(status: number): string {
  if (status === 0) return 'status-pending'
  if (status >= 500) return 'status-5xx'
  if (status >= 400) return 'status-4xx'
  if (status >= 300) return 'status-3xx'
  return 'status-2xx'
}

export function methodClass(method: string): string {
  const m = method.toUpperCase()
  if (m === 'GET') return 'method-get'
  if (m === 'POST') return 'method-post'
  if (m === 'PUT') return 'method-put'
  if (m === 'PATCH') return 'method-patch'
  if (m === 'DELETE') return 'method-delete'
  return 'method-other'
}

function shortPath(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname + u.search
  } catch {
    return url
  }
}

interface Props {
  req: CapturedRequest
  selected: boolean
  onSelect: (id: number) => void
  slowThresholdMs: number
}

export function RequestRow({ req, selected, onSelect, slowThresholdMs }: Props) {
  const cat = categoryOf(req.responseMimeType)
  const isSlow = slowThresholdMs > 0 && req.durationMs >= slowThresholdMs

  return (
    <div
      className={`request-row ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(req.id)}
      title={req.url}
    >
      <div className="request-row-main">
        <div className="request-row-top">
          <span className={`method-pill ${methodClass(req.method)}`}>{req.method}</span>
          <span className="url">
            {isSlow && (
              <span className="slow-badge" title={`Slower than ${slowThresholdMs} ms`}>
                SLOW
              </span>
            )}
            {shortPath(req.url)}
          </span>
        </div>
        <div className="request-row-meta">
          <span className={`status ${statusClass(req.status)}`}>
            {req.status || '···'}
          </span>
          <span className={`duration ${isSlow ? 'slow' : ''}`}>
            {req.durationMs >= 0 ? `${req.durationMs} ms` : '···'}
          </span>
          <span className="size">{formatBytes(req.responseBodySize)}</span>
          <span className={`ctype ctype-${cat}`}>{cat.toUpperCase()}</span>
        </div>
      </div>
    </div>
  )
}
