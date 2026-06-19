// Safari content-script entry. Injects the MAIN-world capture script, relays
// its messages into the store, and mounts the React panel as a Shadow-DOM
// overlay (a floating button toggles it).
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Panel } from '../Panel'
import * as store from './store'
import panelCss from '../styles.css?inline'
import overlayCss from './overlay.css?inline'

// 1. Inject the MAIN-world capture script from the extension's resources.
const s = document.createElement('script')
s.src = chrome.runtime.getURL('inject.js')
s.onload = () => s.remove()
;(document.head || document.documentElement).appendChild(s)

// 2. Relay window messages from inject.js into the store.
window.addEventListener('message', (e) => {
  if (e.source !== window) return
  const d = e.data
  if (!d || d.__source !== '404am') return
  if (d.kind === 'request') store.addRequest(d.payload)
  else if (d.kind === 'log') store.addLog(d.payload)
  else if (d.kind === 'nav') store.addNavigation(d.payload?.url ?? '')
})

function Overlay() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        className="overlay-fab"
        title="404-AM"
        onClick={() => setOpen((o) => !o)}
      >
        404
      </button>
      {open && (
        <div className="overlay-panel">
          <Panel />
        </div>
      )}
    </>
  )
}

// 3. Mount in a Shadow DOM so page styles and our styles stay isolated.
function mount() {
  if (document.getElementById('__404am_host')) return
  const host = document.createElement('div')
  host.id = '__404am_host'
  document.documentElement.appendChild(host)
  const shadow = host.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  // The panel stylesheet defines tokens on :root, which does not match inside
  // a shadow root — rewrite to :host so the variables cascade in.
  style.textContent = overlayCss + '\n' + panelCss.replace(/:root/g, ':host')
  shadow.appendChild(style)

  const mountEl = document.createElement('div')
  shadow.appendChild(mountEl)
  createRoot(mountEl).render(<Overlay />)
}

if (document.documentElement) mount()
else document.addEventListener('DOMContentLoaded', mount)
