// Data source for the DevTools build (Chrome/Firefox/Edge/Opera).
// Re-exports the DevTools-API hooks under the host-agnostic names that
// `Panel` consumes via the `@source` alias. The Safari build provides a
// matching `injectedSource.ts` with the same signatures.
export { useNetworkRequests as useRequestSource } from '../hooks/useNetworkRequests'
export { useConsoleLogs as useConsoleSource } from '../hooks/useConsoleLogs'
export type { NavMarker } from '../hooks/useNetworkRequests'
export type { ConsoleEntry } from '../hooks/useConsoleLogs'
