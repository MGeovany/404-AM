export type ContentCategory = 'json' | 'html' | 'js' | 'css' | 'image' | 'text' | 'other'

export const CONTENT_CATEGORIES: ContentCategory[] = [
  'json',
  'html',
  'js',
  'css',
  'image',
  'text',
  'other',
]

export const CATEGORY_LABEL: Record<ContentCategory, string> = {
  json: 'JSON',
  html: 'HTML',
  js: 'JS',
  css: 'CSS',
  image: 'IMG',
  text: 'TXT',
  other: 'OTHER',
}

/** Maps a response MIME type to a coarse, human-friendly category. */
export function categoryOf(mimeType: string): ContentCategory {
  const m = (mimeType || '').toLowerCase()
  if (m.includes('json')) return 'json'
  if (m.includes('html')) return 'html'
  if (m.includes('javascript') || m.includes('ecmascript')) return 'js'
  if (m.includes('css')) return 'css'
  if (m.startsWith('image/')) return 'image'
  if (m.startsWith('text/')) return 'text'
  return 'other'
}

export function formatBytes(n: number): string {
  if (n < 0) return '···'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}
