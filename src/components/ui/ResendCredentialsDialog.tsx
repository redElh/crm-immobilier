import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle, Key, Mail, RefreshCw, Send, Shield, X,
} from 'react-feather'
import { cn } from '../../lib/utils'
import {
  OrbIcon, STAGE_HUES, useStageAccent, useStageScope, useStageTheme,
} from '../dashboard/Stage'

export interface ResendCredentialsUser {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  roleLabel?: string | null
}

interface ResendCredentialsDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  pending?: boolean
  user: ResendCredentialsUser | null
}

export function ResendCredentialsDialog({
  open,
  onClose,
  onConfirm,
  pending = false,
  user,
}: ResendCredentialsDialogProps) {
  const theme = useStageTheme()
  const scope = useStageScope()
  const accent = useStageAccent()
  const isDark = theme === 'dark'
  const isAdmin = scope === 'admin'

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, pending, onClose])

  const firstName = user?.first_name?.trim() || ''
  const lastName = user?.last_name?.trim() || ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Ce membre'
  const email = user?.email?.trim() || ''
  const initials = (`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?')

  const steps = [
    { icon: Key, hue: STAGE_HUES.amber, label: 'Un nouveau mot de passe temporaire est généré' },
    { icon: Shield, hue: STAGE_HUES.fuchsia, label: "L'ancien mot de passe est invalidé immédiatement" },
    { icon: Mail, hue: STAGE_HUES.sky, label: `Les identifiants sont envoyés par email${email ? ' à' : ''}` },
  ]

  return createPortal(
    <div className={cn(isAdmin ? 'admin-theme stage-admin' : 'agent-theme cosmic-scope', isDark ? 'stage-dark dark' : 'stage-light')}>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-labelledby="resend-credentials-title">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
              transition={{ duration: 0.22 }}
              className="absolute inset-0 backdrop-blur-md"
              style={{
                background: isDark
                  ? isAdmin
                    ? 'radial-gradient(120% 90% at 50% 0%, rgba(60,12,40,0.58), rgba(8,3,14,0.80))'
                    : 'radial-gradient(120% 90% at 50% 0%, rgba(20,16,60,0.55), rgba(3,5,14,0.78))'
                  : isAdmin
                    ? 'radial-gradient(120% 90% at 50% 0%, rgba(249,115,22,0.22), rgba(67,20,7,0.48))'
                    : 'radial-gradient(120% 90% at 50% 0%, rgba(13,148,136,0.18), rgba(4,24,22,0.45))',
              }}
              onClick={() => { if (!pending) onClose() }}
            />
            <motion.div
              initial={{ opacity: 0, y: 26, scale: 0.94, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 14, scale: 0.96, filter: 'blur(6px)', transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="pop-glass relative w-full max-w-md overflow-hidden rounded-3xl"
            >
              <div
                aria-hidden="true"
                className="h-[3px] w-full"
                style={{ background: `linear-gradient(90deg, transparent, ${accent.a} 28%, ${accent.b} 52%, transparent)` }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full opacity-60"
                style={{ background: `radial-gradient(circle, ${accent.glow}, transparent 70%)` }}
              />

              <div className={cn('relative flex items-start gap-3 px-5 pb-4 pt-4', isDark ? 'border-b border-white/[0.07]' : 'border-b border-orange-900/[0.07]')}>
                <OrbIcon icon={Mail} hue={accent} size={44} radius={13} />
                <div className="min-w-0 flex-1">
                  <p className={cn('text-[9px] font-extrabold uppercase tracking-[0.22em]', isDark ? 'text-slate-500' : 'text-orange-900/50')}>
                    Sécurité du compte
                  </p>
                  <h2
                    id="resend-credentials-title"
                    className={cn('mt-0.5 text-lg font-extrabold leading-tight tracking-tight', isDark ? 'text-white' : 'text-slate-900')}
                  >
                    Renvoyer les identifiants&nbsp;?
                  </h2>
                  <p className={cn('mt-0.5 text-[11px]', isDark ? 'text-slate-500' : 'text-slate-500')}>
                    Un nouvel accès sécurisé sera généré pour ce membre.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { if (!pending) onClose() }}
                  aria-label="Fermer"
                  disabled={pending}
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 disabled:opacity-40',
                    isDark
                      ? 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                      : 'border-orange-900/10 bg-white/70 text-orange-900/55 hover:bg-white hover:text-orange-900',
                  )}
                >
                  <X size={15} />
                </button>
              </div>

              <div className="relative space-y-4 px-5 py-4">
                <div className={cn(
                  'flex items-center gap-3 rounded-2xl border p-3',
                  isDark ? 'border-white/[0.08] bg-white/[0.03]' : 'border-orange-900/[0.08] bg-white/60',
                )}>
                  <span
                    className="orb-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[13px] font-extrabold"
                    style={{ '--orb-a': accent.a, '--orb-b': accent.b, '--orb-glow': accent.glow } as React.CSSProperties}
                  >
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className={cn('truncate text-[13px] font-extrabold tracking-[-0.1px]', isDark ? 'text-white' : 'text-slate-900')}>
                        {fullName}
                      </p>
                      {user?.roleLabel && (
                        <span
                          className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-[0.12em]"
                          style={{
                            color: isDark ? accent.a : accent.b,
                            borderColor: `${accent.a}45`,
                            backgroundColor: `${accent.a}14`,
                          }}
                        >
                          {user.roleLabel}
                        </span>
                      )}
                    </div>
                    <p className={cn('mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px]', isDark ? 'text-slate-400' : 'text-slate-500')}>
                      <Mail size={11} className="shrink-0 opacity-70" />
                      <span className="truncate" title={email}>{email || '—'}</span>
                    </p>
                  </div>
                </div>

                <ol className="space-y-2">
                  {steps.map((step, i) => (
                    <li
                      key={i}
                      className={cn(
                        'flex items-center gap-2.5 rounded-xl border px-3 py-2',
                        isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-orange-900/[0.06] bg-white/50',
                      )}
                    >
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                        style={{
                          color: step.hue.line,
                          borderColor: `${step.hue.a}3D`,
                          backgroundColor: `${step.hue.a}14`,
                        }}
                      >
                        <step.icon size={13} />
                      </span>
                      <span className={cn('text-[11px] font-medium leading-snug', isDark ? 'text-slate-300' : 'text-slate-600')}>
                        {step.label}
                        {i === 2 && email && <span className={cn('font-semibold', isDark ? 'text-slate-100' : 'text-slate-800')}> {email}</span>}
                      </span>
                    </li>
                  ))}
                </ol>

                <div className={cn(
                  'flex items-start gap-2.5 rounded-xl border px-3 py-2.5',
                  isDark
                    ? 'border-amber-400/20 bg-amber-400/[0.06]'
                    : 'border-amber-500/25 bg-amber-50/70',
                )}>
                  <AlertTriangle size={14} className={cn('mt-0.5 shrink-0', isDark ? 'text-amber-300' : 'text-amber-600')} />
                  <p className={cn('text-[10.5px] leading-relaxed', isDark ? 'text-amber-200/80' : 'text-amber-800')}>
                    L'ancien mot de passe sera définitivement invalidé. Le membre devra utiliser le nouveau mot de passe dès sa prochaine connexion.
                  </p>
                </div>
              </div>

              <div className={cn(
                'relative flex items-center justify-end gap-2.5 border-t px-5 py-3.5',
                isDark ? 'border-white/[0.07] bg-white/[0.02]' : 'border-orange-900/[0.07] bg-white/40',
              )}>
                <button
                  type="button"
                  onClick={() => { if (!pending) onClose() }}
                  disabled={pending}
                  autoFocus
                  className={cn(
                    'inline-flex h-9 items-center gap-1.5 rounded-xl border px-4 text-[13px] font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-50',
                    isDark
                      ? 'border-white/12 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                      : 'border-orange-900/12 bg-white/70 text-orange-900/70 hover:bg-white hover:text-orange-950',
                  )}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={pending}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/25 px-4 text-[13px] font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70"
                  style={{
                    backgroundImage: `linear-gradient(145deg, ${accent.a}, ${accent.b})`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 12px 28px -10px ${accent.glow}`,
                  }}
                >
                  {pending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  {pending ? 'Envoi en cours...' : 'Renvoyer les identifiants'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
