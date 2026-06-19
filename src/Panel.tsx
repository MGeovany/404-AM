import { useMemo, useState } from 'react'
import { useNetworkRequests } from './hooks/useNetworkRequests'
import { RequestList } from './components/RequestList'
import { RequestDetail } from './components/RequestDetail'
import { Filters, type FilterState } from './components/Filters'
import { downloadFile, toHar, toJson } from './lib/export'
import { categoryOf } from './lib/contentType'

const API_TYPES = ['xhr', 'fetch']

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

export function Panel() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    onlyErrors: false,
    onlySlow: false,
    slowThresholdMs: 1000,
    groupByDomain: false,
    contentType: 'all',
    preserveLog: true,
  })

  const { requests, navigations, clear } = useNetworkRequests(filters.preserveLog)

  const apiRequests = useMemo(
    () => requests.filter((r) => API_TYPES.includes(r.resourceType)),
    [requests],
  )

  const filtered = useMemo(() => {
    const search = filters.search.toLowerCase()
    return apiRequests.filter((r) => {
      if (filters.onlyErrors && r.status < 400) return false
      if (filters.onlySlow && r.durationMs < filters.slowThresholdMs) return false
      if (filters.contentType !== 'all' && categoryOf(r.responseMimeType) !== filters.contentType)
        return false
      if (search && !r.url.toLowerCase().includes(search)) return false
      return true
    })
  }, [apiRequests, filters])

  const selected = apiRequests.find((r) => r.id === selectedId) ?? null

  const handleClear = () => {
    clear()
    setSelectedId(null)
  }

  const handleExportJson = () => {
    downloadFile(`404-am-${timestamp()}.json`, toJson(filtered), 'application/json')
  }

  const handleExportHar = async () => {
    setExporting(true)
    try {
      const har = await toHar(filtered)
      downloadFile(`404-am-${timestamp()}.har`, har, 'application/json')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="panel">
      <div className="split">
        <aside className="sidebar">
          <Filters
            filters={filters}
            onChange={setFilters}
            total={apiRequests.length}
            shown={filtered.length}
            onClear={handleClear}
            onExportHar={handleExportHar}
            onExportJson={handleExportJson}
            exporting={exporting}
          />
          <div className="sidebar-list">
            <RequestList
              requests={filtered}
              navigations={navigations}
              selectedId={selectedId}
              onSelect={setSelectedId}
              groupByDomain={filters.groupByDomain}
              slowThresholdMs={filters.slowThresholdMs}
            />
          </div>
        </aside>
        <main className="workspace">
          <RequestDetail req={selected} />
        </main>
      </div>
    </div>
  )
}
