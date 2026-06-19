export interface HarHeader {
  name: string
  value: string
}

export interface RequestBody {
  mimeType: string
  text?: string
}

/**
 * A normalized view of a single finished network request, derived from the
 * HAR entry that `chrome.devtools.network.onRequestFinished` hands us.
 */
export interface CapturedRequest {
  id: number
  method: string
  url: string
  status: number
  statusText: string
  /** 'xhr' | 'fetch' | 'document' | 'script' | ... */
  resourceType: string
  /** Total round-trip time in ms (-1 when unavailable). */
  durationMs: number
  startedDateTime: string
  requestHeaders: HarHeader[]
  responseHeaders: HarHeader[]
  requestBody?: RequestBody
  responseMimeType: string
  responseBodySize: number
  /** Lazily fetches the response body (async, may return base64). */
  getContent: () => Promise<{ content: string; encoding: string }>
}
