import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Search } from 'react-feather'

interface CsvPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  csv: string
  filename?: string
  title?: string
}

export function CsvPreviewModal({ isOpen, onClose, csv, filename = 'export.csv', title = 'Aperçu CSV' }: CsvPreviewModalProps) {
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isOpen) setSearchQuery('')
  }, [isOpen])

  const parsed = useMemo(() => {
    if (!csv) return { headers: [], rows: [] }
    const lines = csv.split('\n').filter(l => l.trim())
    const parsedRows = lines.map(line => {
      const cells: string[] = []
      let current = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (inQuotes) {
          if (ch === '"') {
            if (i + 1 < line.length && line[i + 1] === '"') {
              current += '"'
              i++
            } else {
              inQuotes = false
            }
          } else {
            current += ch
          }
        } else {
          if (ch === '"') {
            inQuotes = true
          } else if (ch === ',') {
            cells.push(current.trim())
            current = ''
          } else {
            current += ch
          }
        }
      }
      cells.push(current.trim())
      return cells
    })
    return { headers: parsedRows[0] || [], rows: parsedRows.slice(1) }
  }, [csv])

  const isSection = (row: string[]) => row.length === 2 && row[1] === '' && row[0] !== ''

  const filteredRows = useMemo(() => {
    if (!searchQuery) return parsed.rows
    const q = searchQuery.toLowerCase()
    return parsed.rows.filter(row => row.some(cell => cell.toLowerCase().includes(q)))
  }, [parsed.rows, searchQuery])

  const handleDownload = () => {
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-3xl mx-4 bg-card rounded-xl border border-border/50 shadow-modal flex flex-col"
            style={{ height: '80vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border/40">
              <h2 className="text-sm font-semibold">{title}</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border/50 bg-background text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-1 focus:ring-primary/30 w-36"
                  />
                </div>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent-hover transition-all"
                >
                  <Download size={13} />
                  Télécharger
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background z-10">
                  <tr className="border-b border-border/40">
                    <th className="px-4 py-2 text-left font-semibold text-text-secondary w-8">#</th>
                    {parsed.headers.map((h, i) => (
                      <th key={i} className="px-4 py-2 text-left font-semibold text-text-secondary">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, ri) => {
                    const section = isSection(row)
                    return (
                      <tr
                        key={ri}
                        className={`border-b border-border/20 ${section ? 'bg-primary/5 font-semibold text-primary' : 'hover:bg-background/50'}`}
                      >
                        <td className="px-4 py-2 text-text-secondary/40">{ri + 1}</td>
                        {section ? (
                          <td colSpan={parsed.headers.length || 1} className="px-4 py-2 text-xs uppercase tracking-wide">
                            {row[0]}
                          </td>
                        ) : (
                          row.map((cell, ci) => (
                            <td key={ci} className="px-4 py-2 text-text">
                              {cell}
                            </td>
                          ))
                        )}
                      </tr>
                    )
                  })}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={parsed.headers.length + 1} className="px-4 py-8 text-center text-text-secondary/50">
                        Aucun résultat
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-2 border-t border-border/40 text-xs text-text-secondary/60">
              {filteredRows.length} ligne{filteredRows.length !== 1 ? 's' : ''} affichée{filteredRows.length !== 1 ? 's' : ''}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
