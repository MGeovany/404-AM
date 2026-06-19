import { useEffect, useRef } from 'react'
import type { ConsoleEntry } from '../hooks/useConsoleLogs'

interface Props {
  logs: ConsoleEntry[]
  collapsed: boolean
  onToggle: () => void
  onClear: () => void
}

function formatTime(ms: number): string {
  try {
    const d = new Date(ms)
    return d.toLocaleTimeString(undefined, { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0')
  } catch {
    return ''
  }
}

export function ConsolePanel({ logs, collapsed, onToggle, onClear }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null)

  // Stick to the bottom as new logs arrive (unless the user scrolled up).
  useEffect(() => {
    if (collapsed) return
    const el = bodyRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
    if (nearBottom) el.scrollTop = el.scrollHeight
  }, [logs, collapsed])

  return (
    <section className={`console ${collapsed ? 'collapsed' : ''}`}>
      <div className="console-head" onClick={onToggle}>
        <span className="caret">{collapsed ? '▸' : '▾'}</span>
        <span className="console-title">Console</span>
        <span className="console-count">{logs.length}</span>
        <span className="spacer" />
        <button
          className="ghost"
          onClick={(e) => {
            e.stopPropagation()
            onClear()
          }}
        >
          Clear
        </button>
      </div>
      {!collapsed && (
        <div className="console-body" ref={bodyRef}>
          {logs.length === 0 ? (
            <div className="muted console-empty">
              No console output captured yet. Logs emitted before the panel opened are not retroactive.
            </div>
          ) : (
            logs.map((l) => (
              <div key={l.id} className={`log-row log-${l.level}`}>
                <span className="log-time">{formatTime(l.time)}</span>
                <span className="log-level">{l.level}</span>
                <span className="log-text">{l.text}</span>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  )
}
