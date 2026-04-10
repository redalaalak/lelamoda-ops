'use client'

import { useState, useRef } from 'react'

export default function ImportExportButtons() {
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [showImportResult, setShowImportResult] = useState(false)
  const [showExportPanel, setShowExportPanel] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Export filters
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [exportStatus, setExportStatus] = useState('')

  const handleExport = () => {
    const params = new URLSearchParams()
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo) params.set('to', dateTo)
    if (exportStatus) params.set('status', exportStatus)
    window.location.href = `/api/orders/export?${params.toString()}`
    setShowExportPanel(false)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/orders/import', { method: 'POST', body: formData })
      const data = await res.json()
      setResult(data)
      setShowImportResult(true)
      if (data.imported > 0) setTimeout(() => window.location.reload(), 2000)
    } catch (e: any) {
      setResult({ error: e.message })
      setShowImportResult(true)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Import */}
        <label className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition cursor-pointer ${importing ? 'opacity-60 pointer-events-none' : ''}`}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {importing ? 'Importing...' : 'Import'}
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleImport} className="hidden" />
        </label>

        {/* Export */}
        <button
          onClick={() => setShowExportPanel(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>
      </div>

      {/* Export Panel — right sidebar like EGROW */}
      {showExportPanel && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1" onClick={() => setShowExportPanel(false)} />
          <div className="w-80 h-full bg-white border-l border-gray-200 shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-semibold text-gray-900">Export Filters</span>
              <button onClick={() => setShowExportPanel(false)} className="text-gray-400 hover:text-gray-600">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

              {/* Created Date */}
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Created Date</div>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">From</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">To</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                </div>

                {/* Quick date shortcuts */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    { label: 'Today', days: 0 },
                    { label: 'Last 7 days', days: 7 },
                    { label: 'Last 30 days', days: 30 },
                    { label: 'This month', days: -1 },
                  ].map(({ label, days }) => (
                    <button
                      key={label}
                      onClick={() => {
                        const to = new Date()
                        const from = new Date()
                        if (days === 0) {
                          setDateFrom(to.toISOString().slice(0, 10))
                          setDateTo(to.toISOString().slice(0, 10))
                        } else if (days === -1) {
                          from.setDate(1)
                          setDateFrom(from.toISOString().slice(0, 10))
                          setDateTo(to.toISOString().slice(0, 10))
                        } else {
                          from.setDate(from.getDate() - days)
                          setDateFrom(from.toISOString().slice(0, 10))
                          setDateTo(to.toISOString().slice(0, 10))
                        }
                      }}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-emerald-50 hover:text-emerald-700 transition"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stage */}
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Stage</div>
                <select
                  value={exportStatus}
                  onChange={e => setExportStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-400 text-gray-600"
                >
                  <option value="">All stages</option>
                  <option value="pending_confirmation">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="to_edit">To Edit</option>
                  <option value="canceled_confirmation">Canceled</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="returned">Returned</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>

            </div>

            {/* Actions */}
            <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); setExportStatus('') }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Clear all
              </button>
              <button
                onClick={handleExport}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Result Modal */}
      {showImportResult && result && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowImportResult(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            {result.error ? (
              <>
                <div className="text-red-500 font-semibold mb-2">Import Failed</div>
                <div className="text-sm text-gray-600">{result.error}</div>
              </>
            ) : (
              <>
                <div className="text-emerald-600 font-semibold mb-3">
                  {result.imported > 0 ? '✅ Import Successful' : 'Import Complete'}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total rows</span>
                    <span className="font-medium">{result.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Imported</span>
                    <span className="font-semibold text-emerald-600">{result.imported}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Skipped (duplicates)</span>
                    <span className="text-gray-500">{result.skipped}</span>
                  </div>
                </div>
                {result.errors?.length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
                    <div className="text-xs font-medium text-red-600 mb-1">Errors:</div>
                    {result.errors.map((e: string, i: number) => (
                      <div key={i} className="text-xs text-red-500">{e}</div>
                    ))}
                  </div>
                )}
                {result.imported > 0 && (
                  <div className="mt-3 text-xs text-gray-400">Page will refresh automatically...</div>
                )}
              </>
            )}
            <button onClick={() => setShowImportResult(false)} className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
