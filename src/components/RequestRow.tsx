import type { CapturedRequest } from '../types'
import { CATEGORY_LABEL, categoryOf, formatBytes } from '../lib/contentType'

export function statusClass(status: number): string {
  if (status === 0) return 'status-pending'
  if (status >= 500) return 'status-5xx'
  if (status >= 400) return 'status-4xx'
  if (status >= 300) return 'status-3xx'
  return 'status-2xx'
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
}

export function RequestRow({ req, selected, onSelect }: Props) {
  const cat = categoryOf(req.responseMimeType)
  return (
    <div
      className={`request-row ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(req.id)}
    >
      <span className="method">{req.method}</span>
      <span className={`status ${statusClass(req.status)}`}>
        {req.status || '···'}
      </span>
      <span className={`ctype ctype-${cat}`}>{CATEGORY_LABEL[cat]}</span>
      <span className="size">{formatBytes(req.responseBodySize)}</span>
      <span className="duration">{req.durationMs >= 0 ? `${req.durationMs}` : '···'}</span>
      <span className="url" title={req.url}>
        {shortPath(req.url)}
      </span>
    </div>
  )
}
