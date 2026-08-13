import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone, Video, Mic, MicOff, VideoOff, Volume2, PhoneOff, Shield,
} from 'react-feather'
import type { MessageParticipant } from '../../../types/messages'
import { Avatar } from './Avatar'
import { cn } from '../../../lib/utils'

interface CallOverlayProps {
  participant: MessageParticipant
  type: 'audio' | 'video'
  onClose: () => void
}

function formatDuration(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function CallOverlay({ participant, type, onClose }: CallOverlayProps) {
  const [seconds, setSeconds] = useState(0)
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [speaker, setSpeaker] = useState(true)

  useEffect(() => {
    const t = window.setInterval(() => setSeconds(s => s + 1), 1000)
    return () => window.clearInterval(t)
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ scale: 0.92, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className={cn(
            'relative z-10 w-[420px] max-w-[92vw] rounded-3xl overflow-hidden shadow-modal border border-white/10',
            type === 'video'
              ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950'
              : 'bg-gradient-to-br from-indigo-600 to-violet-700'
          )}
        >
          <div className="relative flex flex-col items-center pt-12 pb-28 min-h-[420px]">
            {/* Security hint */}
            <div className="flex items-center gap-1.5 text-white/60 text-[11px]">
              <Shield size={12} />
              <span>Appel sécurisé de bout en bout</span>
            </div>

            <div className="mt-8">
              <Avatar participant={participant} size="lg" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-white">{participant.name}</h3>
            <p className="text-white/70 text-sm mt-1">
              {type === 'video' ? 'Appel vidéo en cours...' : 'Appel audio en cours...'}
            </p>

            <div className="mt-2 flex items-center gap-1.5 text-emerald-300 font-medium tabular-nums">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{formatDuration(seconds)}</span>
            </div>

            {/* Video preview window */}
            {type === 'video' && (
              <div className="absolute top-16 right-5 w-28 h-40 rounded-2xl bg-slate-700/80 border border-white/10 flex items-center justify-center overflow-hidden">
                <Video size={20} className="text-white/50" />
                <span className="absolute bottom-2 text-[9px] text-white/60">Vous</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-0 inset-x-0 p-6">
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setMuted(m => !m)}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                  muted ? 'bg-white text-slate-900' : 'bg-white/15 text-white hover:bg-white/25'
                )}
                title={muted ? 'Activer le micro' : 'Couper le micro'}
              >
                {muted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {type === 'video' && (
                <button
                  type="button"
                  onClick={() => setCameraOff(c => !c)}
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                    cameraOff ? 'bg-white text-slate-900' : 'bg-white/15 text-white hover:bg-white/25'
                  )}
                  title={cameraOff ? 'Activer la caméra' : 'Couper la caméra'}
                >
                  {cameraOff ? <VideoOff size={20} /> : <Video size={20} />}
                </button>
              )}

              <button
                type="button"
                onClick={() => setSpeaker(s => !s)}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                  speaker ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white text-slate-900'
                )}
                title="Haut-parleur"
              >
                <Volume2 size={20} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all shadow-lg"
                title="Raccrocher"
              >
                <PhoneOff size={22} />
              </button>
            </div>
            <p className="text-center text-white/60 text-[11px] mt-3">
              {muted ? 'Micro coupé' : 'Micro actif'}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
