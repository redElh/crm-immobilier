import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, ZoomOut, Download, RotateCcw } from 'react-feather'

interface PdfViewerModalProps {
  isOpen: boolean
  onClose: () => void
  html: string
  title?: string
  filename?: string
}

export function PdfViewerModal({ isOpen, onClose, html, title = 'Aperçu du document', filename = 'document' }: PdfViewerModalProps) {
  const [zoom, setZoom] = useState(100)
  const iframeRef = useRef<HTMLIFrameElement>(null)

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
    if (isOpen) setZoom(100)
  }, [isOpen])

  const handleZoomIn = () => setZoom(z => Math.min(z + 15, 200))
  const handleZoomOut = () => setZoom(z => Math.max(z - 15, 50))
  const handleReset = () => setZoom(100)

  const handleDownload = () => {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.html`
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
            className="relative w-full max-w-5xl mx-4 bg-card rounded-xl border border-border/50 shadow-modal flex flex-col"
            style={{ height: '85vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border/40">
              <h2 className="text-sm font-semibold">{title}</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleZoomOut}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
                  title="Zoom arrière"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="text-xs text-text-secondary w-10 text-center font-mono">{zoom}%</span>
                <button
                  onClick={handleZoomIn}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
                  title="Zoom avant"
                >
                  <ZoomIn size={15} />
                </button>
                <button
                  onClick={handleReset}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
                  title="Réinitialiser"
                >
                  <RotateCcw size={15} />
                </button>
                <div className="w-px h-5 bg-border/40 mx-1" />
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent-hover transition-all"
                >
                  <Download size={13} />
                  Télécharger
                </button>
                <div className="w-px h-5 bg-border/40 mx-1" />
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto bg-gray-100 p-4">
              <div className="flex justify-center">
                <div
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.15s ease' }}
                >
                  <iframe
                    ref={iframeRef}
                    title={title}
                    style={{ width: '800px', minHeight: '1000px', border: 'none', background: 'white' }}
                    className="shadow-lg rounded"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
