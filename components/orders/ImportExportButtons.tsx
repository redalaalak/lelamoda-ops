'use client'

import { useState, useRef } from 'react'

export default function ImportExportButtons() {
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    window.location.href = '/api/orders/export'
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
      setShowModal(true)
      if (data.imported > 0) {
        setTimeout(() => window.location.reload(), 2000)
      }
    } catch (e: any) {
      setResult({ error: e.message })
      setShowModal(true)
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
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleImport}
            className="hidden"
          />
        </label>

        {/* Export */}
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>
      </div>

      {/* Result Modal */}
      {showModal && result && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
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
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
