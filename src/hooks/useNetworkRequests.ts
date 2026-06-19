import { useCallback, useEffect, useRef, useState } from 'react'
import type { CapturedRequest, HarHeader } from '../types'

function toHeaders(list: ReadonlyArray<{ name: string; value: string }>): HarHeader[] {
  return list.map((h) => ({ name: h.name, value: h.value }))
}

/** A page navigation that happened while preserving the log. */
export interface NavMarker {
  /** The id the next captured request will receive; the marker renders before it. */
  boundaryId: number
  url: string
}

/**
 * Subscribes to finished network requests for the inspected page and exposes
 * them as a growing list. When `preserveLog` is false, the list is cleared on
 * each navigation (mirroring the Network panel); when true, a navigation
 * marker is recorded instead so history survives page reloads.
 */
export function useNetworkRequests(preserveLog: boolean) {
  const [requests, setRequests] = useState<CapturedRequest[]>([])
  const [navigations, setNavigations] = useState<NavMarker[]>([])
  const idRef = useRef(0)
  const preserveRef = useRef(preserveLog)

  useEffect(() => {
    preserveRef.current = preserveLog
  }, [preserveLog])

  useEffect(() => {
    const onFinished = (entry: chrome.devtools.network.Request) => {
      const resourceType =
        (entry as unknown as { _resourceType?: string })._resourceType ?? 'other'

      const captured: CapturedRequest = {
        id: idRef.current++,
        method: entry.request.method,
        url: entry.request.url,
        status: entry.response.status,
        statusText: entry.response.statusText,
        resourceType,
        durationMs: Math.round(entry.time),
        startedDateTime: entry.startedDateTime,
        requestHeaders: toHeaders(entry.request.headers),
        responseHeaders: toHeaders(entry.response.headers),
        requestBody: entry.request.postData
          ? {
              mimeType: entry.request.postData.mimeType,
              text: entry.request.postData.text,
            }
          : undefined,
        responseMimeType: entry.response.content?.mimeType ?? '',
        responseBodySize: entry.response.content?.size ?? 0,
        getContent: () =>
          new Promise((resolve) => {
            entry.getContent((content, encoding) =>
              resolve({ content: content ?? '', encoding: encoding ?? '' }),
            )
          }),
      }

      setRequests((prev) => [...prev, captured])
    }

    const onNavigated = (url: string) => {
      if (preserveRef.current) {
        setNavigations((prev) => [...prev, { boundaryId: idRef.current, url }])
      } else {
        setRequests([])
        setNavigations([])
      }
    }

    chrome.devtools.network.onRequestFinished.addListener(onFinished)
    chrome.devtools.network.onNavigated.addListener(onNavigated)
    return () => {
      chrome.devtools.network.onRequestFinished.removeListener(onFinished)
      chrome.devtools.network.onNavigated.removeListener(onNavigated)
    }
  }, [])

  const clear = useCallback(() => {
    setRequests([])
    setNavigations([])
  }, [])

  return { requests, navigations, clear }
}
