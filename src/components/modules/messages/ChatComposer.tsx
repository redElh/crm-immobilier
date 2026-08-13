import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Paperclip, Smile, Mic, Send, X, Image as ImageIcon, Video, FileText,
  Camera, Square, Check, Play, Pause,
} from 'react-feather'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import { cn } from '../../../lib/utils'
import { useMessagingAppearance } from '../../../services/messageAppearance'
import { uploadVoice } from '../../../services/messageService'

type AttachKind = 'image' | 'video' | 'document' | 'audio'

interface ChatComposerProps {
  onSendText: (text: string) => void
  onSendVoice: (duration: string, audioUrl?: string, audioSize?: string) => void
  onAttach: (kind: AttachKind, file: File) => Promise<boolean> | boolean
  onCapture: (file: File) => Promise<boolean> | boolean
  showEmojis?: boolean
  onTypingChange?: (active: boolean) => void
  onRecordingChange?: (active: boolean) => void
}

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

const ATTACH_LABELS: Record<AttachKind | 'camera', string> = {
  image: 'Photo',
  video: 'Vidéo',
  document: 'Document',
  audio: 'Audio',
  camera: 'Caméra',
}

const DOCUMENT_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip'

export function ChatComposer({ onSendText, onSendVoice, onAttach, onCapture, showEmojis = true, onTypingChange, onRecordingChange }: ChatComposerProps) {
  const [text, setText] = useState('')
  const [attachOpen, setAttachOpen] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recSeconds, setRecSeconds] = useState(0)
  const [recorded, setRecorded] = useState<string | null>(null)
  const [previewPlaying, setPreviewPlaying] = useState(false)
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingKind, setPendingKind] = useState<AttachKind | 'camera'>('image')
  const [pendingPreview, setPendingPreview] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const timerRef = useRef<number | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const recordedBlobRef = useRef<Blob | null>(null)
  const recordedUrlRef = useRef<string | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingKindRef = useRef<AttachKind | 'camera'>('image')
  const pendingPreviewRef = useRef<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const appearance = useMessagingAppearance()

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      cameraStreamRef.current?.getTracks().forEach(t => t.stop())
      cameraStreamRef.current = null
      previewAudioRef.current?.pause()
      if (recordedUrlRef.current) URL.revokeObjectURL(recordedUrlRef.current)
      if (pendingPreviewRef.current) URL.revokeObjectURL(pendingPreviewRef.current)
    }
  }, [])

  useEffect(() => {
    if (recording) {
      timerRef.current = window.setInterval(() => setRecSeconds(s => s + 1), 1000)
      return () => {
        if (timerRef.current) window.clearInterval(timerRef.current)
      }
    }
  }, [recording])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [text])

  // Start / stop the live camera preview while the modal is open
  useEffect(() => {
    if (!cameraOpen) return
    let cancelled = false
    const start = async () => {
      setCameraReady(false)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        cameraStreamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      } catch {
        // Camera unavailable or permission denied: fall back to the system
        // camera picker (capture attribute) on supporting devices.
        if (!cancelled) {
          setCameraOpen(false)
          openPicker('camera')
        }
      }
    }
    start()
    return () => {
      cancelled = true
      cameraStreamRef.current?.getTracks().forEach(t => t.stop())
      cameraStreamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOpen])

  const handleSend = () => {
    const value = text.trim()
    if (!value) return
    onSendText(value)
    setText('')
    setEmojiOpen(false)
    onTypingChange?.(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const startRecording = async () => {
    setRecording(true)
    setRecSeconds(0)
    setRecorded(null)
    setPreviewPlaying(false)
    recordedBlobRef.current = null
    if (recordedUrlRef.current) {
      URL.revokeObjectURL(recordedUrlRef.current)
      recordedUrlRef.current = null
    }
    onRecordingChange?.(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }
      rec.onstop = () => {
        if (chunksRef.current.length === 0) return
        const type = rec.mimeType && rec.mimeType.includes('audio') ? rec.mimeType : 'audio/webm'
        const blob = new Blob(chunksRef.current, { type })
        recordedBlobRef.current = blob
        if (recordedUrlRef.current) URL.revokeObjectURL(recordedUrlRef.current)
        recordedUrlRef.current = URL.createObjectURL(blob)
      }
      setRecorder(rec)
      rec.start()
    } catch {
      // Microphone unavailable or denied: fall back to timer-only mode.
    }
  }

  const stopRecording = () => {
    setRecording(false)
    if (timerRef.current) window.clearInterval(timerRef.current)
    const secs = recSeconds
    if (secs >= 1) setRecorded(formatSeconds(secs))
    setRecSeconds(0)
    onRecordingChange?.(false)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (recorder && recorder.state !== 'inactive') recorder.stop()
  }

  const cancelRecording = () => {
    setRecording(false)
    if (timerRef.current) window.clearInterval(timerRef.current)
    setRecSeconds(0)
    setRecorded(null)
    setPreviewPlaying(false)
    recordedBlobRef.current = null
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (recorder && recorder.state !== 'inactive') recorder.stop()
    if (recordedUrlRef.current) {
      URL.revokeObjectURL(recordedUrlRef.current)
      recordedUrlRef.current = null
    }
    onRecordingChange?.(false)
  }

  const togglePreview = () => {
    if (!recordedUrlRef.current) return
    if (previewAudioRef.current && !previewAudioRef.current.paused) {
      previewAudioRef.current.pause()
      return
    }
    const audio = previewAudioRef.current || new Audio(recordedUrlRef.current)
    previewAudioRef.current = audio
    audio.onended = () => setPreviewPlaying(false)
    audio.onpause = () => setPreviewPlaying(false)
    audio.play()
    setPreviewPlaying(true)
  }

  const confirmVoice = async () => {
    if (sending) return
    setSending(true)
    try {
      const duration = recorded
      const blob = recordedBlobRef.current
      let url: string | undefined
      let size: string | undefined
      if (blob) {
        try {
          const res = await uploadVoice(blob)
          url = res.url
          size = res.size
        } catch {
          console.warn('Voice upload failed, sending without audio')
        }
      }
      if (duration) onSendVoice(duration, url, size)
      cancelRecording()
    } finally {
      setSending(false)
    }
  }

  const attachItems = [
    { kind: 'image' as const, label: 'Photo', icon: <ImageIcon size={16} /> },
    { kind: 'video' as const, label: 'Vidéo', icon: <Video size={16} /> },
    { kind: 'document' as const, label: 'Document', icon: <FileText size={16} /> },
    { kind: 'audio' as const, label: 'Audio', icon: <Mic size={16} /> },
  ]

  const openPicker = (kind: AttachKind | 'camera') => {
    const input = fileInputRef.current
    if (!input) return
    pendingKindRef.current = kind
    input.value = ''
    if (kind === 'camera') {
      input.setAttribute('accept', 'image/*')
      input.setAttribute('capture', 'environment')
    } else if (kind === 'image') {
      input.setAttribute('accept', 'image/*')
      input.removeAttribute('capture')
    } else if (kind === 'video') {
      input.setAttribute('accept', 'video/*')
      input.removeAttribute('capture')
    } else if (kind === 'audio') {
      input.setAttribute('accept', 'audio/*')
      input.removeAttribute('capture')
    } else {
      input.setAttribute('accept', DOCUMENT_ACCEPT)
      input.removeAttribute('capture')
    }
    input.click()
  }

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    stageFile(pendingKindRef.current, file)
    e.target.value = ''
  }

  const stageFile = (kind: AttachKind | 'camera', file: File) => {
    if (pendingPreviewRef.current) {
      URL.revokeObjectURL(pendingPreviewRef.current)
      pendingPreviewRef.current = null
    }
    const previewUrl = ['image', 'camera', 'video'].includes(kind)
      ? URL.createObjectURL(file)
      : null
    pendingPreviewRef.current = previewUrl
    setPendingKind(kind)
    setPendingFile(file)
    setPendingPreview(previewUrl)
  }

  const clearPending = () => {
    if (pendingPreviewRef.current) {
      URL.revokeObjectURL(pendingPreviewRef.current)
      pendingPreviewRef.current = null
    }
    setPendingFile(null)
    setPendingPreview(null)
  }

  const confirmAttachment = async () => {
    if (!pendingFile || sending) return
    setSending(true)
    try {
      const ok = pendingKind === 'camera'
        ? await onCapture(pendingFile)
        : await onAttach(pendingKind, pendingFile)
      if (ok) clearPending()
    } finally {
      setSending(false)
    }
  }

  const capturePhoto = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })
      setCameraOpen(false)
      stageFile('camera', file)
    }, 'image/jpeg', 0.9)
  }

  const closeAll = () => {
    setAttachOpen(false)
    setEmojiOpen(false)
  }

  return (
    <div className="px-4 py-3 border-t border-border/40 bg-card shrink-0 relative">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={onFileSelected}
      />

      <div className="flex items-end gap-2">
        {/* Attach */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setAttachOpen(o => !o); setEmojiOpen(false) }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
            title="Pièce jointe"
          >
            <Paperclip size={20} />
          </button>
          <AnimatePresence>
            {attachOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={closeAll} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-12 left-0 z-40 w-48 bg-card border border-border/60 rounded-xl shadow-modal p-1.5"
                >
                  {attachItems.map(item => (
                    <button
                      key={item.kind}
                      type="button"
                      onClick={() => { openPicker(item.kind); closeAll() }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg text-text hover:bg-background transition-colors"
                    >
                      <span className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Pending attachment preview */}
        {pendingFile ? (
          <div className="flex-1 flex items-center gap-3 bg-accent/5 border border-accent/20 rounded-2xl px-3 py-2">
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-background flex items-center justify-center">
              {pendingKind !== 'document' && pendingPreview ? (
                pendingKind === 'video' ? (
                  <video src={pendingPreview} className="w-full h-full object-cover" muted playsInline />
                ) : (
                  <img src={pendingPreview} alt="" className="w-full h-full object-cover" />
                )
              ) : pendingKind === 'audio' ? (
                <Mic size={16} className="text-accent" />
              ) : (
                <FileText size={16} className="text-accent" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text truncate">{pendingFile.name}</p>
              <p className="text-[11px] text-text-secondary">
                {sending
                  ? 'Envoi en cours...'
                  : `${formatFileSize(pendingFile.size)} · ${ATTACH_LABELS[pendingKind]}`}
              </p>
            </div>
            {sending ? (
              <span className="w-9 h-9 flex items-center justify-center shrink-0" title="Envoi en cours...">
                <span className="w-5 h-5 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={clearPending}
                  className="w-9 h-9 rounded-full text-text-secondary hover:bg-background flex items-center justify-center transition-colors shrink-0"
                  title="Annuler"
                >
                  <X size={16} />
                </button>
                <button
                  type="button"
                  onClick={confirmAttachment}
                  className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-hover active:scale-95 transition-all shrink-0"
                  title="Envoyer"
                >
                  <Check size={16} />
                </button>
              </>
            )}
          </div>
        ) : recording ? (
          <div className="flex-1 flex items-center gap-3 bg-error/5 border border-error/20 rounded-2xl px-4 py-2.5 animate-pulse-soft">
            <span className="w-3 h-3 rounded-full bg-error animate-pulse" />
            <span className="text-sm font-medium text-error">Enregistrement en cours...</span>
            <span className="text-sm font-semibold text-text tabular-nums ml-auto">{formatSeconds(recSeconds)}</span>
            <button
              type="button"
              onClick={stopRecording}
              className="w-9 h-9 rounded-full bg-error text-white flex items-center justify-center hover:bg-error/90 transition-colors"
              title="Arrêter"
            >
              <Square size={14} />
            </button>
            <button
              type="button"
              onClick={cancelRecording}
              className="w-9 h-9 rounded-full text-text-secondary hover:bg-background flex items-center justify-center transition-colors"
              title="Annuler"
            >
              <X size={16} />
            </button>
          </div>
        ) : recorded ? (
          <div className="flex-1 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2.5">
            <Mic size={16} className="text-emerald-600 shrink-0" />
            <button
              type="button"
              onClick={togglePreview}
              disabled={!recordedUrlRef.current}
              className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              title={previewPlaying ? 'Pause' : 'Écouter'}
            >
              {previewPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <span className="text-sm font-medium text-text flex-1">Message vocal prêt ({recorded})</span>
            <button
              type="button"
              onClick={cancelRecording}
              disabled={sending}
              className="w-9 h-9 rounded-full text-text-secondary hover:bg-background flex items-center justify-center transition-colors disabled:opacity-40"
              title="Supprimer"
            >
              <X size={16} />
            </button>
            {sending ? (
              <span className="w-9 h-9 flex items-center justify-center shrink-0" title="Envoi en cours...">
                <span className="w-5 h-5 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
              </span>
            ) : (
              <button
                type="button"
                onClick={confirmVoice}
                className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-hover transition-colors"
                title="Envoyer"
              >
                <Check size={16} />
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Emoji */}
            {showEmojis && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setEmojiOpen(o => !o); setAttachOpen(false) }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
                  title="Émoticônes"
                >
                  <Smile size={20} />
                </button>
                <AnimatePresence>
                  {emojiOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={closeAll} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-12 left-0 z-40 overflow-hidden rounded-xl border border-border/60 shadow-modal"
                      >
                        <EmojiPicker
                          width={336}
                          height={400}
                          theme={appearance.theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                          onEmojiClick={({ emoji }) => {
                            setText(t => t + emoji)
                            textareaRef.current?.focus()
                          }}
                          searchPlaceHolder="Rechercher un émoji"
                          previewConfig={{ showPreview: false }}
                          lazyLoadEmojis
                        />
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => {
                setText(e.target.value)
                onTypingChange?.(e.target.value.trim().length > 0)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre message..."
              rows={1}
              className="flex-1 resize-none bg-background border border-border/60 rounded-2xl px-4 py-2.5 text-sm text-text placeholder:text-text-secondary/40 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-all max-h-[120px]"
            />

            {text.trim() ? (
              <button
                type="button"
                onClick={handleSend}
                className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-hover active:scale-95 shadow-sm transition-all"
                title="Envoyer"
              >
                <Send size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-hover active:scale-95 shadow-sm transition-all"
                title="Message vocal"
              >
                <Mic size={18} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Camera quick actions */}
      <div className={cn('flex items-center gap-1 mt-2 transition-opacity', attachOpen ? 'opacity-0' : 'opacity-100')}>
        <button
          type="button"
          onClick={() => setCameraOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-text-secondary hover:text-accent hover:bg-accent/5 rounded-lg transition-colors"
        >
          <Camera size={13} /> Caméra
        </button>
      </div>

      {/* Camera capture modal */}
      <AnimatePresence>
        {cameraOpen && (
          <>
            <div className="fixed inset-0 z-50 bg-black/85" onClick={() => setCameraOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.16 }}
              className="fixed inset-0 z-50 m-auto flex items-center justify-center p-4"
            >
              <div className="relative w-full max-w-lg bg-black rounded-2xl overflow-hidden shadow-modal">
                <div className="relative aspect-[4/3] bg-black">
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                    onCanPlay={() => setCameraReady(true)}
                  />
                  {!cameraReady && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80">
                      <span className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white/80 animate-spin" />
                      <span className="text-sm">Démarrage de la caméra...</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-6 p-4 bg-black">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={!cameraReady}
                    className="w-14 h-14 rounded-full bg-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                    title="Prendre la photo"
                  >
                    <span className="w-11 h-11 rounded-full border-4 border-slate-300" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraOpen(false)}
                    className="absolute right-3 top-3 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                    title="Fermer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
