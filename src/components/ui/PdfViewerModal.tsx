import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, ZoomOut, Download, RotateCcw, FileText } from 'react-feather'
import { useStageTheme, useStageScope } from '../dashboard/Stage'

interface PdfViewerModalProps {
  isOpen: boolean
  onClose: () => void
  html: string
  title?: string
  filename?: string
}

export function PdfViewerModal({ isOpen, onClose, html, title = 'Aperçu du document', filename = 'document' }: PdfViewerModalProps) {
  const [zoom, setZoom] = useState(110)
  const iframeRef = useRef<HTMLIFrameElement>(null)
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
    if (isOpen && iframeRef.current && html) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(html)
        doc.close()
      }
    }
  }, [isOpen, html])

  useEffect(() => {
    if (isOpen) {
      setZoom(110)
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

  const handleZoomIn = () => setZoom(z => Math.min(z + 15, 220))
  const handleZoomOut = () => setZoom(z => Math.max(z - 15, 50))
  const handleReset = () => setZoom(110)

  const handleDownload = () => {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.html`
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
                  className={`relative flex h-[88vh] w-full min-w-0 max-w-5xl flex-col overflow-hidden rounded-3xl border shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] ${
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
                        <FileText size={19} />
                      </span>
                      <div className="min-w-0">
                        <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${isDark ? 'text-violet-300/80' : isAdmin ? 'text-orange-700/70' : 'text-teal-700/70'}`}>
                          Export PDF
                        </p>
                        <h2 className={`truncate text-lg font-extrabold tracking-[-0.3px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
                        {filename && (
                          <span className={`mt-1 inline-flex max-w-full items-center gap-1 truncate rounded-full border px-2 py-0.5 text-[10px] font-bold ${isDark ? 'border-white/10 bg-white/[0.05] text-slate-300' : 'border-slate-200/80 bg-white/70 text-slate-500'}`}>
                            <FileText size={9} />
                            <span className="truncate font-mono">{filename}.html</span>
                          </span>
                        )}
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
                    <div className={`flex items-center gap-0.5 rounded-xl border px-1.5 py-1 ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200/80 bg-white/80'}`}>
                      <button onClick={handleZoomOut} className={`rounded-lg p-1.5 transition-colors ${isDark ? 'text-slate-400 hover:bg-white/[0.08] hover:text-white' : 'text-slate-500 hover:bg-slate-900/[0.05] hover:text-slate-900'}`} title="Zoom arrière">
                        <ZoomOut size={14} />
                      </button>
                      <span className={`w-12 text-center text-[11px] font-bold tabular-nums ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{zoom}%</span>
                      <button onClick={handleZoomIn} className={`rounded-lg p-1.5 transition-colors ${isDark ? 'text-slate-400 hover:bg-white/[0.08] hover:text-white' : 'text-slate-500 hover:bg-slate-900/[0.05] hover:text-slate-900'}`} title="Zoom avant">
                        <ZoomIn size={14} />
                      </button>
                      <div className={`mx-1 h-4 w-px ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                      <button onClick={handleReset} className={`rounded-lg p-1.5 transition-colors ${isDark ? 'text-slate-400 hover:bg-white/[0.08] hover:text-white' : 'text-slate-500 hover:bg-slate-900/[0.05] hover:text-slate-900'}`} title="Réinitialiser le zoom">
                        <RotateCcw size={13} />
                      </button>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={handleDownload}
                      className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl border border-white/25 px-4 py-2 text-xs font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_10px_26px_-8px_rgba(0,0,0,0.55)] transition-all"
                      style={{ backgroundImage: accentBg }}
                    >
                      <Download size={13} />
                      Télécharger
                    </motion.button>
                  </div>

                  {/* Canvas */}
                  <div ref={scrollRef} className="relative flex-1 overflow-y-auto scrollbar-thin" style={{ scrollBehavior: 'smooth' }}>
                    <div className="flex min-h-full justify-center p-5" style={{ background: isDark ? 'radial-gradient(60% 45% at 50% 0%, rgba(124,92,255,0.06), transparent), #05070F' : 'radial-gradient(60% 45% at 50% 0%, rgba(13,148,136,0.05), transparent), #EAF3F2' }}>
                      <div
                        className="origin-top transition-transform duration-300 ease-out"
                        style={{ transform: `scale(${zoom / 110})` }}
                      >
                        <iframe
                          ref={iframeRef}
                          title={title}
                          className="rounded-xl shadow-[0_30px_70px_-25px_rgba(0,0,0,0.65)] ring-1 ring-black/10"
                          style={{ width: '820px', minHeight: '1160px', border: 'none', background: 'white' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className={`relative flex items-center justify-between gap-3 border-t px-5 py-2.5 text-[11px] font-semibold ${isDark ? 'border-white/[0.07] bg-white/[0.02] text-slate-500' : 'border-slate-200/70 bg-white/60 text-slate-400'}`}>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${isDark ? 'rgba(124,92,255,0.8)' : 'rgba(13,148,136,0.6)'}` }} />
                      Aperçu du document généré
                    </span>
                    <span className={`hidden font-mono text-[10px] sm:inline ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>{zoom}%</span>
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
