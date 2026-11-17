import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Search, Table } from 'react-feather'
import { useStageTheme, useStageScope } from '../dashboard/Stage'

interface CsvPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  csv: string
  filename?: string
  title?: string
}

export function CsvPreviewModal({ isOpen, onClose, csv, filename = 'export.csv', title = 'Aperçu CSV' }: CsvPreviewModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const isAdmin = useStageScope() === 'admin'
  const accent = isDark ? '#8B7CFF' : isAdmin ? '#F97316' : '#0D9488'
  const accentBg = isDark
    ? 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)'
    : isAdmin
      ? 'linear-gradient(145deg, #FDBA74 0%, #F97316 60%, #C2410C 100%)'
      : 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)'

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      scrollRef.current?.scrollTo({ top: 0 })
      document.body.style.overflow = 'hidden'
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
      window.addEventListener('keydown', onKey)
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', onKey)
      }
    }
    return undefined
  }, [isOpen, onClose])

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

  return createPortal(
    <div className={`agent-theme ${!isDark ? 'stage-light' : ''}${isAdmin ? ' stage-admin' : ''} cosmic-scope`}>
      <div className={isDark ? 'dark' : undefined}>
        <div className="stage-form">
          <AnimatePresence>
            {isOpen && (
              <div className="fixed inset-0 z-[85] flex items-center justify-center p-3 sm:p-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 bg-[#05060F]/70 backdrop-blur-md"
                  onClick={onClose}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 26, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.94, y: 18, filter: 'blur(6px)' }}
                  transition={{ type: 'spring', stiffness: 330, damping: 30 }}
                  className={`relative flex h-[82vh] w-full min-w-0 max-w-4xl flex-col overflow-hidden rounded-3xl border shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] ${
                    isDark
                      ? 'border-white/10 bg-[#0A0D1F]/95'
                      : 'border-white/80 bg-white/95 shadow-[0_40px_90px_-32px_rgba(13,148,136,0.4),inset_0_1px_0_rgba(255,255,255,0.95)]'
                  }`}
                >
                  <div className="absolute inset-x-0 top-0 z-10 h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, boxShadow: isDark ? '0 0 18px rgba(124,92,255,0.6)' : isAdmin ? '0 0 18px rgba(249,115,22,0.45)' : '0 0 18px rgba(13,148,136,0.45)' }} />
                  <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: isDark ? 'radial-gradient(80% 60% at 50% -10%, rgba(124,92,255,0.10), transparent 60%)' : isAdmin ? 'radial-gradient(80% 60% at 50% -10%, rgba(249,115,22,0.08), transparent 60%)' : 'radial-gradient(80% 60% at 50% -10%, rgba(13,148,136,0.08), transparent 60%)' }} />

                  {/* Hero header */}
                  <div className="relative flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
                        style={isDark
                          ? { background: 'rgba(124,92,255,0.12)', borderColor: 'rgba(124,92,255,0.30)', color: '#8B7CFF', boxShadow: '0 0 22px rgba(124,92,255,0.30), inset 0 1px 0 rgba(255,255,255,0.18)' }
                          : isAdmin
                            ? { background: 'rgba(249,115,22,0.10)', borderColor: 'rgba(234,88,12,0.28)', color: '#C2410C', boxShadow: '0 0 18px rgba(249,115,22,0.22), inset 0 1px 0 rgba(255,255,255,0.85)' }
                            : { background: 'rgba(13,148,136,0.10)', borderColor: 'rgba(13,148,136,0.28)', color: '#0D9488', boxShadow: '0 0 18px rgba(13,148,136,0.22), inset 0 1px 0 rgba(255,255,255,0.85)' }}
                      >
                        <Table size={19} />
                      </span>
                      <div className="min-w-0">
                        <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${isDark ? 'text-violet-300/80' : isAdmin ? 'text-orange-700/70' : 'text-teal-700/70'}`}>
                          Export CSV
                        </p>
                        <h2 className={`truncate text-lg font-extrabold tracking-[-0.3px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className={`shrink-0 rounded-xl border p-2 transition-all ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.10] hover:text-white' : 'border-slate-200/80 bg-white/70 text-slate-500 hover:bg-white hover:text-slate-900'}`}
                      title="Fermer (Échap)"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Toolbar */}
                  <div className="relative mt-4 flex flex-wrap items-center justify-between gap-2 px-5 pb-3 sm:px-6">
                    <div className={`relative flex h-9 w-52 items-center ${isDark ? 'rounded-xl border border-white/10 bg-white/[0.04]' : 'rounded-xl border border-teal-900/15 bg-white/80'}`}>
                      <Search size={13} className={`absolute left-3 ${isDark ? 'text-violet-300/60' : 'text-teal-700/60'}`} />
                      <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className={`h-full w-full rounded-xl border-0 bg-transparent pl-8 pr-3 text-xs outline-none ${isDark ? 'text-slate-100 placeholder:text-slate-500' : 'text-teal-950 placeholder:text-teal-900/35'}`}
                      />
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={handleDownload}
                      className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl border border-white/25 px-4 py-2 text-xs font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_10px_26px_-8px_rgba(0,0,0,0.55)] transition-all"
                      style={{ backgroundImage: accentBg }}
                    >
                      <Download size={13} />
                      Télécharger le CSV
                    </motion.button>
                  </div>

                  {/* Table */}
                  <div ref={scrollRef} className="relative flex-1 overflow-y-auto overflow-x-auto scrollbar-thin" style={{ scrollBehavior: 'smooth' }}>
                    <table className="w-full text-xs">
                      <thead className={`sticky top-0 z-10 backdrop-blur-xl ${isDark ? 'bg-[#0D1128]/95' : 'bg-white/95'}`}>
                        <tr className={`border-b ${isDark ? 'border-white/[0.08]' : 'border-slate-200/80'}`}>
                          <th className={`px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] ${isDark ? 'text-slate-500' : 'text-slate-400'} w-10`}>#</th>
                          {parsed.headers.map((h, i) => (
                            <th key={i} className={`px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
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
                              className={`transition-colors border-b ${
                                section
                                  ? isDark ? 'bg-violet-500/[0.07]' : 'bg-teal-500/[0.06]'
                                  : isDark ? 'border-white/[0.05] hover:bg-white/[0.04]' : 'border-slate-100 hover:bg-teal-900/[0.03]'
                              }`}
                            >
                              <td className={`px-4 py-2 font-mono text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>{ri + 1}</td>
                              {section ? (
                                <td
                                  colSpan={parsed.headers.length || 1}
                                  className={`px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] ${isDark ? 'text-violet-300' : 'text-teal-800'}`}
                                >
                                  <span className="inline-flex items-center gap-1.5">
                                    <span className="h-1 w-1 rounded-full" style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
                                    {row[0]}
                                  </span>
                                </td>
                              ) : (
                                row.map((cell, ci) => (
                                  <td key={ci} className={`px-4 py-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {cell}
                                  </td>
                                ))
                              )}
                            </tr>
                          )
                        })}
                        {filteredRows.length === 0 && (
                          <tr>
                            <td colSpan={parsed.headers.length + 1} className={`px-4 py-12 text-center text-sm font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              Aucun résultat
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer */}
                  <div className={`relative flex items-center justify-between gap-3 border-t px-5 py-2.5 text-[11px] font-semibold ${isDark ? 'border-white/[0.07] bg-white/[0.02] text-slate-500' : 'border-slate-200/70 bg-white/60 text-slate-400'}`}>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${isDark ? 'rgba(124,92,255,0.8)' : 'rgba(13,148,136,0.6)'}` }} />
                      {filteredRows.length} ligne{filteredRows.length !== 1 ? 's' : ''} affichée{filteredRows.length !== 1 ? 's' : ''}
                    </span>
                    <span className={`hidden truncate font-mono text-[10px] sm:inline ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>{filename}</span>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>,
    document.body,
  )
}
