import { useState, type ReactNode } from 'react'
import type { CapturedRequest } from '../types'
import type { NavMarker } from '../hooks/useNetworkRequests'
import { RequestRow } from './RequestRow'

interface Props {
  requests: CapturedRequest[]
  navigations: NavMarker[]
  selectedId: number | null
  onSelect: (id: number) => void
  groupByDomain: boolean
}

function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return 'unknown'
  }
}

function EmptyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

function NavMarkerRow({ url }: { url: string }) {
  let label = url
  try {
    label = new URL(url).pathname || url
  } catch {
    /* keep raw url */
  }

  return (
    <div className="nav-marker" title={url}>
      Navigated to {label}
    </div>
  )
}

export function RequestList({
  requests,
  navigations,
  selectedId,
  onSelect,
  groupByDomain,
}: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  if (requests.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">
          <EmptyIcon />
        </div>
        <span className="empty-title">No requests yet</span>
        <span className="empty-hint">Make some API calls on the inspected page</span>
      </div>
    )
  }

  const row = (r: CapturedRequest) => (
    <RequestRow key={r.id} req={r} selected={r.id === selectedId} onSelect={onSelect} />
  )

  const listHeader = (
    <div className="list-header">
      <span>Method</span>
      <span>Status</span>
      <span>Type</span>
      <span>Size</span>
      <span>Time</span>
      <span>Path</span>
    </div>
  )

  if (!groupByDomain) {
    const navs = [...navigations].sort((a, b) => a.boundaryId - b.boundaryId)
    const items: ReactNode[] = []
    let mi = 0
    for (const r of requests) {
      while (mi < navs.length && navs[mi].boundaryId <= r.id) {
        items.push(<NavMarkerRow key={`nav-${mi}`} url={navs[mi].url} />)
        mi++
      }
      items.push(row(r))
    }
    while (mi < navs.length) {
      items.push(<NavMarkerRow key={`nav-${mi}`} url={navs[mi].url} />)
      mi++
    }
    return (
      <div className="request-list">
        {listHeader}
        {items}
      </div>
    )
  }

  const groups = new Map<string, CapturedRequest[]>()
  for (const r of requests) {
    const host = hostOf(r.url)
    const list = groups.get(host)
    if (list) list.push(r)
    else groups.set(host, [r])
  }

  const toggle = (host: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(host) ? next.delete(host) : next.add(host)
      return next
    })
  }

  return (
    <div className="request-list">
      {listHeader}
      {[...groups.entries()].map(([host, list]) => {
        const isCollapsed = collapsed.has(host)
        return (
          <div key={host} className="group">
            <div className="group-header" onClick={() => toggle(host)}>
              <span className="caret">{isCollapsed ? '▸' : '▾'}</span>
              <span className="group-host">{host}</span>
              <span className="group-count">{list.length}</span>
            </div>
            {!isCollapsed && list.map(row)}
          </div>
        )
      })}
    </div>
  )
}
