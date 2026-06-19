/**
 * Attempts to pretty-print `text` as JSON. Falls back to the raw text when it
 * is not valid JSON (or does not look like it).
 */
export function tryFormatJson(
  text: string,
  mimeType?: string,
): { isJson: boolean; formatted: string } {
  const looksJson = (mimeType?.includes('json') ?? false) || /^\s*[{[]/.test(text)
  if (!looksJson) return { isJson: false, formatted: text }
  try {
    const parsed = JSON.parse(text)
    return { isJson: true, formatted: JSON.stringify(parsed, null, 2) }
  } catch {
    return { isJson: false, formatted: text }
  }
}
