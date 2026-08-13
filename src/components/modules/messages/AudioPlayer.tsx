import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Square } from 'react-feather'
import { cn } from '../../../lib/utils'

function formatTime(total: number): string {
  if (!isFinite(total) || total < 0) return '0:00'
  const m = Math.floor(total / 60)
  const s = Math.floor(total % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function parseFallback(duration?: string): number {
  if (!duration) return 0
  const parts = duration.split(':').map(Number)
  if (parts.some(n => !isFinite(n))) return 0
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] || 0
}

// Fixed pseudo-random bar heights for the waveform.
const BARS = [10, 22, 14, 28, 16, 24, 12, 30, 18, 26, 8, 20, 14, 26, 22, 30, 12, 24, 16, 28, 20, 10, 18, 26]

interface AudioPlayerProps {
  src: string
  isMine?: boolean
  fallbackDuration?: string
  className?: string
}

export function AudioPlayer({ src, isMine = false, fallbackDuration, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const seekingRef = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  const total = duration > 0 ? duration : parseFallback(fallbackDuration)
  const progress = total > 0 ? Math.min(1, Math.max(0, current / total)) : 0
  const activeBars = Math.round(progress * BARS.length)

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) {
      el.play().catch(() => {})
    } else {
      el.pause()
    }
  }

  const updateFromClientX = (clientX: number) => {
    const el = audioRef.current
    const track = trackRef.current
    if (!el || !track || total === 0) return
    const rect = track.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    el.currentTime = ratio * total
    setCurrent(el.currentTime)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!audioRef.current || total === 0) return
    seekingRef.current = true
    e.currentTarget.setPointerCapture?.(e.pointerId)
    updateFromClientX(e.clientX)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!seekingRef.current) return
    updateFromClientX(e.clientX)
  }
  const onPointerUp = () => {
    seekingRef.current = false
  }

  const barColor = isMine ? 'bg-white' : 'bg-accent'
  const barInactive = isMine ? 'bg-white/30' : 'bg-accent/25'

  return (
    <div className={cn('w-64 flex items-center gap-2.5 px-3 py-2.5', className)}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        onTimeUpdate={e => setCurrent(e.currentTarget.currentTime)}
        onSeeked={e => setCurrent(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          setCurrent(audioRef.current?.duration ?? 0)
        }}
      />
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors',
          isMine ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-accent/10 text-accent hover:bg-accent/20'
        )}
        title={playing ? 'Pause' : 'Écouter'}
      >
        {playing ? <Square size={12} /> : <Play size={14} />}
      </button>

      <div
        ref={trackRef}
        className="flex-1 min-w-0 select-none touch-none cursor-pointer"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div className="relative h-6">
          <div className="absolute inset-0 flex items-end gap-[3px]">
            {BARS.map((h, i) => (
              <motion.span
                key={i}
                className={cn('w-[3px] rounded-sm origin-bottom', i < activeBars ? barColor : barInactive)}
                style={{ height: `${h}px`, transformOrigin: 'bottom' }}
                animate={playing ? { scaleY: [1, 0.35, 1] } : { scaleY: 1 }}
                transition={playing
                  ? { duration: 0.8, repeat: Infinity, delay: i * 0.07, ease: 'easeInOut' }
                  : { duration: 0.2 }}
              />
            ))}
          </div>
          <span
            className={cn('absolute top-0 bottom-0 w-0.5 rounded-full pointer-events-none', isMine ? 'bg-white/80' : 'bg-accent')}
            style={{ left: `${progress * 100}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className={cn('text-[10px] leading-none tabular-nums', isMine ? 'text-white/70' : 'text-text-secondary/70')}>
            {formatTime(current)}
          </span>
          <span className={cn('text-[10px] leading-none tabular-nums', isMine ? 'text-white/70' : 'text-text-secondary/70')}>
            {total > 0 ? formatTime(total) : '--:--'}
          </span>
        </div>
      </div>
    </div>
  )
}
