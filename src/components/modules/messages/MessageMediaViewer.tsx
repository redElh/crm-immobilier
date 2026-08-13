import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Download, ZoomIn, ZoomOut, Maximize, FileText, Mic } from 'react-feather'
import type { Message } from '../../../types/messages'
import { cn } from '../../../lib/utils'
import { resolveMediaUrl, downloadMedia } from '../../../utils/mediaUrl'
import { AudioPlayer } from './AudioPlayer'

interface MessageMediaViewerProps {
  message: Message
  onClose: () => void
}

export function MessageMediaViewer({ message, onClose }: MessageMediaViewerProps) {
  const kind = message.kind ?? (message.attachments.length > 0 ? 'file' : 'text')
  const attachment = message.attachments[0]
  const name = attachment?.name || 'piece-jointe'
  const url = resolveMediaUrl(
    message.audioUrl ||
      message.attachmentUrl ||
      (attachment && attachment.url && attachment.url !== '#' ? attachment.url : undefined)
  )
  const isPdf = (attachment?.name || '').toLowerCase().endsWith('.pdf')
  const [scale, setScale] = useState(1)
  const [downloadError, setDownloadError] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleDownload = async () => {
    if (!url) return
    try {
      setDownloadError(false)
      await downloadMedia(url, name)
    } catch {
      setDownloadError(true)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/90 flex flex-col"
        onClick={onClose}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/40 text-white shrink-0" onClick={e => e.stopPropagation()}>
          <p className="text-sm font-medium truncate max-w-[60%]">{name}</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!url}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/90 hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Télécharger"
            >
              <Download size={15} /> Télécharger
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors"
              title="Fermer"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        {downloadError && (
          <div className="px-4 py-2 bg-red-500/20 text-red-100 text-xs shrink-0" onClick={e => e.stopPropagation()}>
            Impossible de télécharger ce fichier.
          </div>
        )}

        {/* Body */}
        <div className="flex-1 min-h-0 flex items-center justify-center" onClick={e => e.stopPropagation()}>
          {kind === 'image' && url ? (
            <div className="w-full h-full overflow-auto flex items-center justify-center">
              <motion.img
                src={url}
                alt={name}
                className="max-w-none select-none"
                style={{ width: `${Math.round(100 * scale)}%`, maxWidth: 'none' }}
                animate={{ scale: 1 }}
                draggable={false}
              />
            </div>
          ) : kind === 'video' && url ? (
            <video src={url} controls autoPlay className="max-w-full max-h-full rounded-lg" onClick={e => e.stopPropagation()} />
          ) : kind === 'audio' && url ? (
            <div className="w-full max-w-md px-6">
              <div className="flex flex-col items-center gap-4 bg-card border border-border/60 rounded-2xl p-6">
                <span className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                  <Mic size={26} />
                </span>
                <p className="text-sm font-medium text-text truncate max-w-full">{name}</p>
                <AudioPlayer src={url} fallbackDuration={message.duration} className="w-full max-w-xs px-0" />
              </div>
            </div>
          ) : isPdf && url ? (
            <iframe src={url} title={name} className="w-full h-full bg-white" />
          ) : (
            <div className="flex flex-col items-center gap-4 px-6 text-center">
              <span className="w-20 h-20 rounded-3xl bg-white/10 text-white/70 flex items-center justify-center">
                <FileText size={36} />
              </span>
              <div>
                <p className="text-white text-sm font-medium mb-1">{name}</p>
                <p className="text-white/50 text-xs">Aperçu non disponible pour ce type de fichier</p>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!url}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40"
              >
                <Download size={15} /> Télécharger
              </button>
            </div>
          )}
        </div>

        {/* Zoom controls (image only) */}
        {kind === 'image' && url && (
          <div className="flex items-center justify-center gap-2 pb-5 pt-2 bg-black/40 shrink-0" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setScale(s => Math.max(0.5, Number((s / 1.25).toFixed(2))))}
              className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
              title="Zoom arrière"
            >
              <ZoomOut size={18} />
            </button>
            <button
              type="button"
              onClick={() => setScale(1)}
              className={cn('w-10 h-10 rounded-full text-white flex items-center justify-center transition-colors', scale === 1 ? 'bg-white/10 text-white/40 cursor-default' : 'bg-white/10 hover:bg-white/20')}
              title="Réinitialiser"
            >
              <Maximize size={18} />
            </button>
            <button
              type="button"
              onClick={() => setScale(s => Math.min(3, Number((s * 1.25).toFixed(2))))}
              className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
              title="Zoom avant"
            >
              <ZoomIn size={18} />
            </button>
            <span className="text-white/60 text-xs ml-2">{Math.round(scale * 100)}%</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
