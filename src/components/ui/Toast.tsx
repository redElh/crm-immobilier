import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info } from 'react-feather'
import { OrbIcon, STAGE_HUES, type StageHue } from '../dashboard/Stage'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0

function getStageDark(): boolean {
  // Mirrors useStageChrome but works outside Stage provider (toasts are portalled at body)
  if (typeof document === 'undefined') return false
  // Prefer explicit stage-dark; fallback to .dark (admin) or localStorage
  if (document.querySelector('.stage-dark')) return true
  if (document.querySelector('.stage-light')) return false
  if (document.documentElement.classList.contains('dark') || document.body.classList.contains('dark')) return true
  try {
    return localStorage.getItem('stage-theme') === 'dark'
  } catch { return false }
}

const TYPE_META: Record<ToastType, { hue: StageHue; Icon: typeof CheckCircle; title: string }> = {
  success: { hue: STAGE_HUES.emerald, Icon: CheckCircle, title: 'Succès' },
  error: {
    hue: { a: '#F87171', b: '#DC2626', glow: 'rgba(248,113,113,0.45)', line: '#F87171' },
    Icon: AlertCircle,
    title: 'Erreur',
  },
  info: { hue: STAGE_HUES.sky, Icon: Info, title: 'Information' },
}

function ToastCard({ t, onRemove, dark }: { t: Toast; onRemove: (id: number) => void; dark: boolean }) {
  const meta = TYPE_META[t.type]
  const hue = meta.hue
  const Icon = meta.Icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 48, scale: 0.96, filter: 'blur(8px)' }}
      animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: 48, scale: 0.96, filter: 'blur(6px)' }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className="pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-2xl border px-4 py-3.5 backdrop-blur-xl"
      style={{
        minWidth: 340,
        maxWidth: 440,
        background: dark
          ? `linear-gradient(180deg, rgba(30,41,68,0.88), rgba(15,23,42,0.82))`
          : `linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.88))`,
        borderColor: dark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)',
        boxShadow: dark
          ? `inset 0 1px 0 rgba(255,255,255,0.10), 0 16px 40px -12px rgba(0,0,0,0.65), 0 0 22px -6px ${hue.glow}`
          : `inset 0 1px 0 rgba(255,255,255,1), 0 16px 40px -16px rgba(0,0,0,0.14), 0 0 18px -8px ${hue.glow}`,
      }}
    >
      {/* top hairline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[10%] right-[10%] top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${hue.line}55, transparent)`,
        }}
      />
      {/* accent glow blob */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full blur-2xl opacity-30"
        style={{ background: hue.glow }}
      />

      <OrbIcon icon={Icon} hue={hue} size={34} radius={11} className="shrink-0 mt-0.5" />

      <div className="min-w-0 flex-1">
        <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${dark ? 'text-slate-400' : 'text-teal-900/45'}`}>{meta.title}</p>
        <p className={`mt-0.5 text-sm font-semibold leading-snug break-words ${dark ? 'text-white' : 'text-slate-900'}`}>{t.message}</p>
      </div>

      <button
        onClick={() => onRemove(t.id)}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border transition-all active:scale-95 ${
          dark
            ? 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600'
        }`}
        aria-label="Fermer"
      >
        <X size={13} />
      </button>

      {/* progress — shrinks over 4000ms */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${hue.a}, ${hue.b})`, transformOrigin: 'left' }}
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 4, ease: 'linear' }}
      />
    </motion.div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const update = () => setDark(getStageDark())
    update()
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    window.addEventListener('storage', update)
    return () => {
      obs.disconnect()
      window.removeEventListener('storage', update)
    }
  }, [])

  const toast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const remove = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none px-4 sm:px-0">
        <AnimatePresence initial={false}>
          {toasts.map(t => (
            <ToastCard key={t.id} t={t} onRemove={remove} dark={dark} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
