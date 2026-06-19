// Data source for the Safari build. Backed by the in-memory store that the
// content script fills from inject.js messages. Same signatures as
// devtoolsSource so `Panel` is host-agnostic.
import { useEffect, useSyncExternalStore } from 'react'
import * as store from '../safari/store'

export type { NavMarker } from '../hooks/useNetworkRequests'
export type { ConsoleEntry } from '../hooks/useConsoleLogs'

export function useRequestSource(preserveLog: boolean) {
  useEffect(() => {
    store.setPreserve(preserveLog)
  }, [preserveLog])
  const requests = useSyncExternalStore(store.subscribe, store.getRequests)
  const navigations = useSyncExternalStore(store.subscribe, store.getNavigations)
  return { requests, navigations, clear: store.clearRequests }
}

export function useConsoleSource(_preserveLog: boolean) {
  const logs = useSyncExternalStore(store.subscribe, store.getLogs)
  return { logs, clear: store.clearLogs }
}
