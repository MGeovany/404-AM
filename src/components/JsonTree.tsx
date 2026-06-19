import { useState } from 'react'

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

/** Builds an accessor path segment, bracketing array indices and unsafe keys. */
function pathJoin(parent: string, key: string | number, isIndex: boolean): string {
  if (isIndex) return `${parent}[${key}]`
  const k = String(key)
  const safe = /^[A-Za-z_$][\w$]*$/.test(k)
  if (!parent) return safe ? k : `["${k}"]`
  return safe ? `${parent}.${k}` : `${parent}["${k}"]`
}

function preview(v: any): { text: string; cls: string } {
  if (v === null) return { text: 'null', cls: 'tok-keyword' }
  switch (typeof v) {
    case 'string':
      return { text: `"${v}"`, cls: 'tok-string' }
    case 'number':
      return { text: String(v), cls: 'tok-number' }
    case 'boolean':
      return { text: String(v), cls: 'tok-keyword' }
    default:
      return { text: String(v), cls: '' }
  }
}

function rawValue(v: any): string {
  return typeof v === 'string' ? v : v === null ? 'null' : String(v)
}

interface NodeProps {
  k?: string | number
  value: any
  path: string
  isIndex: boolean
  depth: number
  copied: string | null
  onCopy: (text: string, marker: string) => void
}

function JsonNode({ k, value, path, isIndex, depth, copied, onCopy }: NodeProps) {
  const isObj = value !== null && typeof value === 'object'
  const [open, setOpen] = useState(depth < 2)

  const entries: { key: string | number; value: any; isIndex: boolean }[] = isObj
    ? Array.isArray(value)
      ? value.map((v, i) => ({ key: i, value: v, isIndex: true }))
      : Object.entries(value).map(([kk, vv]) => ({ key: kk, value: vv, isIndex: false }))
    : []

  const keyLabel = k === undefined ? '$' : isIndex ? `[${k}]` : String(k)
  const summary = isObj ? (Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`) : ''
  const pv = preview(value)

  return (
    <div className="jt-node">
      <div className="jt-row" style={{ paddingLeft: depth * 14 + 8 }}>
        {isObj ? (
          <span className="jt-caret" onClick={() => setOpen((o) => !o)}>
            {open ? '▾' : '▸'}
          </span>
        ) : (
          <span className="jt-caret jt-caret-spacer" />
        )}
        <span className="jt-key" title={`Copy path: ${path}`} onClick={() => onCopy(path, path)}>
          {keyLabel}
        </span>
        <span className="jt-colon">:</span>
        {isObj ? (
          <span className="jt-summary" onClick={() => setOpen((o) => !o)}>
            {summary}
          </span>
        ) : (
          <span
            className={`jt-value ${pv.cls}`}
            title="Copy value"
            onClick={() => onCopy(rawValue(value), `${path}#v`)}
          >
            {pv.text}
          </span>
        )}
        {(copied === path || copied === `${path}#v`) && <span className="jt-copied">copied</span>}
      </div>
      {isObj &&
        open &&
        entries.map((e) => (
          <JsonNode
            key={String(e.key)}
            k={e.key}
            value={e.value}
            isIndex={e.isIndex}
            path={pathJoin(path, e.key, e.isIndex)}
            depth={depth + 1}
            copied={copied}
            onCopy={onCopy}
          />
        ))}
    </div>
  )
}

export function JsonTree({ data }: { data: any }) {
  const [copied, setCopied] = useState<string | null>(null)
  const onCopy = (text: string, marker: string) => {
    copyText(text)
    setCopied(marker)
    setTimeout(() => setCopied((c) => (c === marker ? null : c)), 1200)
  }
  return (
    <div className="json-tree">
      <JsonNode value={data} path="$" isIndex={false} depth={0} copied={copied} onCopy={onCopy} />
    </div>
  )
}
