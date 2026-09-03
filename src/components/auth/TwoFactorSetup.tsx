import { API_ORIGIN } from '../../utils/config'
import { useState, useEffect, useRef } from 'react'
import { getAuthToken } from '../../utils/auth'
import StageModal, { useStageFormClasses, useStageModalButtons } from '../modules/calendar/StageModal'
import { STAGE_HUES, OrbIcon, StageBadge } from '../dashboard/Stage'
import {
  Smartphone, Download, Shield, Check, Copy, ChevronRight,
  Loader, AlertTriangle, ArrowLeft, Lock, Key, Clock
} from 'react-feather'
import { motion } from 'framer-motion'

interface TwoFactorSetupProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export default function TwoFactorSetup({ isOpen, onClose, onComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState(1)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [savedCodes, setSavedCodes] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { input, staged, dark } = useStageFormClasses()
  const btns = useStageModalButtons()

  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setQrCode('')
      setSecret('')
      setVerificationCode(['', '', '', '', '', ''])
      setBackupCodes([])
      setSavedCodes(false)
      setError('')
    }
  }, [isOpen])

  useEffect(() => {
    if (step === 1 && isOpen && !generating) generateSecret()
  }, [step, isOpen]) // eslint-disable-line

  useEffect(() => {
    if (step !== 3 || !isOpen) return
    const timer = setInterval(() => setCountdown(prev => (prev <= 1 ? 30 : prev - 1)), 1000)
    return () => clearInterval(timer)
  }, [step, isOpen])

  const generateSecret = async () => {
    setGenerating(true); setError('')
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_ORIGIN}/api/auth/2fa/generate-secret`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) { setQrCode(data.qrCode); setSecret(data.secret) } else setError(data.error || 'Failed to generate secret')
    } catch (_) { setError('Network error') }
    setGenerating(false)
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return
    const newCode = [...verificationCode]; newCode[index] = value; setVerificationCode(newCode)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }
  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) inputRefs.current[index - 1]?.focus()
    if (e.key === 'Enter') verifyCode()
  }
  const verifyCode = async () => {
    const code = verificationCode.join('')
    if (code.length !== 6) { setError('Veuillez entrer le code à 6 chiffres'); return }
    setLoading(true); setError('')
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_ORIGIN}/api/auth/2fa/verify-enable`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ token: code }) })
      const data = await res.json()
      if (res.ok) { setBackupCodes(data.backupCodes); setStep(4) } else setError(data.error || 'Code invalide')
    } catch (_) { setError('Erreur réseau') }
    setLoading(false)
  }
  const handleCopyCodes = () => navigator.clipboard.writeText(backupCodes.join('\n'))
  const handleCopySecret = () => { if (secret) navigator.clipboard.writeText(secret) }
  const handleFinish = () => { onComplete(); onClose() }
  const formattedSecret = secret ? secret.match(/.{1,4}/g)?.join(' ') || secret : ''

  const stepMeta: Record<number, { icon: any; hue: typeof STAGE_HUES.violet; eyebrow: string; title: string; subtitle: string }> = {
    1: { icon: Smartphone, hue: STAGE_HUES.violet, eyebrow: `Étape 1 / 4 · Installation`, title: 'Activer la double authentification', subtitle: "Installez une app d'authentification sur votre téléphone" },
    2: { icon: Shield, hue: STAGE_HUES.sky, eyebrow: `Étape 2 / 4 · Liaison`, title: 'Scanner le QR Code', subtitle: "Liez votre application à votre compte" },
    3: { icon: Lock, hue: STAGE_HUES.emerald, eyebrow: `Étape 3 / 4 · Vérification`, title: 'Vérifier le code', subtitle: 'Entrez le code à 6 chiffres de votre app' },
    4: { icon: Key, hue: STAGE_HUES.amber, eyebrow: `Étape 4 / 4 · Sécurisation`, title: 'Codes de récupération', subtitle: 'Conservez-les précieusement — usage unique' },
  }
  const meta = stepMeta[step]
  const pct = (step / 4) * 100
  const sectionTitle = 'mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80'

  return (
    <StageModal
      open={isOpen}
      onClose={onClose}
      eyebrow={meta.eyebrow}
      title={meta.title}
      subtitle={meta.subtitle}
      icon={meta.icon}
      hue={meta.hue}
      maxWidth="max-w-[560px]"
      bodyClassName="space-y-5"
      footer={
        step === 1 ? (
          <>
            <button onClick={onClose} className={btns.ghost}>Annuler</button>
            <button onClick={() => setStep(2)} disabled={generating || !!error} className={btns.primary + (generating || !!error ? ' opacity-40 pointer-events-none' : '')}>
              Continuer <ChevronRight size={14} />
            </button>
          </>
        ) : step === 2 ? (
          <>
            <button onClick={() => setStep(1)} className={btns.ghost}><ArrowLeft size={14} /> Retour</button>
            <button onClick={() => setStep(3)} className={btns.primary}>Suivant <ChevronRight size={14} /></button>
          </>
        ) : step === 3 ? (
          <>
            <button onClick={() => setStep(2)} className={btns.ghost}><ArrowLeft size={14} /> Retour</button>
            <button onClick={verifyCode} disabled={loading} className={btns.primary}>{loading ? <><Loader size={14} className="animate-spin" /> Vérification…</> : 'Vérifier et activer'}</button>
          </>
        ) : (
          <>
            <button onClick={handleCopyCodes} className={btns.ghost}><Copy size={14} /> Copier</button>
            <button onClick={handleFinish} disabled={!savedCodes} className={btns.primary + (!savedCodes ? ' opacity-40 pointer-events-none' : '')}>Terminer <Check size={14} /></button>
          </>
        )
      }
    >
      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: staged && dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="h-full rounded-full" style={{ backgroundImage: `linear-gradient(90deg, ${meta.hue.b}, ${meta.hue.a})`, boxShadow: `0 0 14px ${meta.hue.glow}` }} />
        </div>
        <span className={`text-xs font-bold tabular-nums ${staged ? (dark ? 'text-slate-400' : 'text-teal-900/60') : 'text-text-secondary'}`}>{step}/4</span>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-1.5">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={
                step === s
                  ? { backgroundImage: `linear-gradient(135deg, ${meta.hue.a}, ${meta.hue.b})`, color: '#fff', boxShadow: `0 4px 14px -4px ${meta.hue.glow}, inset 0 1px 0 rgba(255,255,255,0.4)` }
                  : step > s
                    ? { background: staged && dark ? 'rgba(52,211,153,0.18)' : 'rgba(16,185,129,0.14)', color: '#10B981', border: `1px solid rgba(16,185,129,0.35)` }
                    : { background: staged && dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)', color: staged && dark ? '#64748B' : '#94A3B8', border: `1px solid ${staged && dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'}` }
              }
            >
              {step > s ? <Check size={13} strokeWidth={2.75} /> : s}
            </div>
            {s < 4 && <div className="w-6 h-0.5 rounded-full transition-colors" style={{ background: step > s ? '#10B981' : staged && dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)' }} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <section>
            <p className={`${sectionTitle} ${staged ? (dark ? 'text-violet-400' : 'text-violet-600') : 'text-text-secondary'}`}><span className="h-px w-4 bg-gradient-to-r from-violet-400 to-transparent" /> Applications recommandées</p>
            <div className={`rounded-2xl border p-4 ${staged ? (dark ? 'border-white/5 bg-white/[0.02]' : 'border-teal-900/5 bg-slate-50/60') : 'bg-background border-border/50'}`}>
              <div className="space-y-2.5">
                {[
                  { name: 'Google Authenticator', sub: 'iOS / Android' },
                  { name: 'Authy', sub: 'iOS / Android / Desktop' },
                  { name: 'Microsoft Authenticator', sub: 'iOS / Android' },
                ].map(app => (
                  <div key={app.name} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${staged ? (dark ? 'border-white/5 bg-white/[0.03]' : 'border-teal-900/5 bg-white') : 'border-border/50 bg-card'}`}>
                    <div className={`p-1.5 rounded-lg ${staged ? (dark ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-500/10 text-violet-600') : 'bg-accent-light text-accent'}`}><Download size={14} /></div>
                    <div><p className={`text-sm font-semibold ${staged ? (dark ? 'text-slate-100' : 'text-teal-950') : 'text-text'}`}>{app.name}</p><p className={`text-xs ${staged ? (dark ? 'text-slate-500' : 'text-teal-900/50') : 'text-text-secondary'}`}>{app.sub}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          {error && <p className="text-xs text-rose-400 text-center bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{error}</p>}
          {generating && <div className={`flex items-center justify-center gap-2 text-xs ${staged ? (dark ? 'text-slate-400' : 'text-teal-900/60') : 'text-text-secondary'}`}><Loader size={12} className="animate-spin" /> Génération du secret…</div>}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className={`p-4 rounded-3xl border ${staged ? (dark ? 'bg-white/[0.03] border-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]' : 'bg-white border-teal-900/10 shadow-[0_20px_60px_-20px_rgba(13,148,136,0.3)]') : 'bg-card border-border/50'}`}>
              {qrCode ? (
                <img src={qrCode} alt="QR Code" className="w-48 h-48 rounded-2xl" />
              ) : (
                <div className={`w-48 h-48 rounded-2xl flex items-center justify-center ${staged ? (dark ? 'bg-white/[0.04]' : 'bg-slate-50') : 'bg-background'}`}><Loader size={22} className="animate-spin text-slate-400" /></div>
              )}
            </div>
          </div>

          {formattedSecret && (
            <div className="text-center space-y-2">
              <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${staged ? (dark ? 'text-slate-400' : 'text-teal-900/50') : 'text-text-secondary'}`}>Ou code manuel</p>
              <div className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 ${staged ? (dark ? 'bg-white/[0.04] border-white/10' : 'bg-slate-50 border-teal-900/10') : 'bg-background border-border'}`}>
                <code className={`text-sm font-mono tracking-widest ${staged ? (dark ? 'text-violet-300' : 'text-teal-700') : 'text-accent'}`}>{formattedSecret}</code>
                <button onClick={handleCopySecret} className={`p-1.5 rounded-lg transition-colors ${staged ? (dark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-white text-teal-900/60 hover:text-teal-900') : 'hover:bg-card text-text-secondary'}`} title="Copier"><Copy size={14} /></button>
              </div>
            </div>
          )}

          <div className={`flex items-start gap-3 rounded-2xl border p-3 ${staged ? (dark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200') : 'bg-amber-50 border-amber-200'}`}>
            <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
            <p className={`text-xs leading-relaxed ${staged ? (dark ? 'text-amber-200/90' : 'text-amber-800') : 'text-amber-800'}`}>Ouvrez votre application d'authentification et scannez ce QR code. Un code à 6 chiffres apparaîtra, changeant toutes les 30 secondes.</p>
          </div>
          {error && <p className="text-xs text-rose-400 text-center bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{error}</p>}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <section>
            <p className={`${sectionTitle} ${staged ? (dark ? 'text-emerald-400' : 'text-emerald-600') : 'text-text-secondary'}`}><span className="h-px w-4 bg-gradient-to-r from-emerald-400 to-transparent" /> Code de vérification</p>
            <div className="flex justify-center gap-2">
              {verificationCode.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleCodeChange(i, e.target.value)}
                  onKeyDown={e => handleCodeKeyDown(i, e)}
                  className={`${input('w-12 h-14 text-center text-lg font-extrabold tabular-nums')} ${digit ? (dark ? '!border-violet-400/50 !shadow-[0_0_18px_-6px_rgba(124,92,255,0.6)]' : '!border-teal-500/50') : ''}`}
                  style={{ paddingLeft: 0, paddingRight: 0 }}
                />
              ))}
            </div>
          </section>

          <div className="flex items-center justify-center gap-2">
            <Clock size={13} className={staged ? (dark ? 'text-slate-500' : 'text-teal-900/50') : 'text-text-secondary'} />
            <p className={`text-xs tabular-nums ${countdown <= 5 ? 'text-amber-500 font-bold' : staged ? (dark ? 'text-slate-400' : 'text-teal-900/60') : 'text-text-secondary'}`}>
              Code expire dans <span className={countdown <= 5 ? 'animate-pulse' : ''}>{countdown}s</span>
            </p>
            <div className="flex-1 max-w-[80px] h-1.5 rounded-full overflow-hidden ml-2" style={{ background: staged && dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)' }}>
              <motion.div className="h-full rounded-full" style={{ background: countdown <= 5 ? '#F59E0B' : `linear-gradient(90deg, ${STAGE_HUES.emerald.b}, ${STAGE_HUES.emerald.a})` }} animate={{ width: `${(countdown / 30) * 100}%` }} transition={{ duration: 0.4 }} />
            </div>
          </div>

          {error && <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-rose-400 text-center bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{error}</motion.p>}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="flex flex-col items-center text-center">
            <OrbIcon icon={Shield} hue={STAGE_HUES.emerald} size={52} radius={16} />
            <p className={`mt-3 text-sm leading-relaxed max-w-[420px] ${staged ? (dark ? 'text-slate-400' : 'text-teal-900/60') : 'text-text-secondary'}`}>Conservez ces codes précieusement. Chaque code ne peut être utilisé qu'une seule fois si vous perdez votre téléphone.</p>
          </div>

          <div className={`rounded-2xl border p-4 ${staged ? (dark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-teal-900/10') : 'bg-background border-border/50'}`}>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, i) => (
                <div key={i} className={`font-mono text-xs tracking-wider rounded-xl px-3 py-2 border flex items-center gap-2 ${staged ? (dark ? 'bg-white/[0.04] border-white/5 text-slate-200' : 'bg-white border-teal-900/5 text-teal-900') : 'bg-card border-border/50 text-text'}`}>
                  <span className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${staged ? (dark ? 'bg-violet-500/20 text-violet-300' : 'bg-teal-500/15 text-teal-700') : 'bg-accent-light text-accent'}`}>{i + 1}</span> {code}
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleCopyCodes} className={`flex items-center justify-center gap-2 w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${staged ? (dark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white' : 'border-teal-900/10 bg-white text-teal-700 hover:bg-teal-50') : 'border-border text-accent hover:bg-background'}`}>
            <Copy size={14} /> Copier les codes
          </button>

          <label className={`flex items-center gap-3 cursor-pointer rounded-2xl border p-3 transition-colors ${savedCodes ? (staged ? (dark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200') : 'bg-emerald-50 border-emerald-200') : staged ? (dark ? 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]' : 'bg-white border-teal-900/10 hover:bg-slate-50') : 'border-border hover:bg-background'}`}>
            <input type="checkbox" checked={savedCodes} onChange={e => setSavedCodes(e.target.checked)} className="sr-only" />
            <span className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${savedCodes ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_12px_-2px_rgba(16,185,129,0.7)]' : staged ? (dark ? 'border-white/15 bg-white/5' : 'border-teal-900/15 bg-white') : 'border-border bg-card'}`}>
              {savedCodes && <Check size={12} strokeWidth={2.75} className="text-white" />}
            </span>
            <span className={`text-sm font-medium ${savedCodes ? (staged ? (dark ? 'text-emerald-200' : 'text-emerald-800') : 'text-emerald-700') : staged ? (dark ? 'text-slate-300' : 'text-teal-900/70') : 'text-text-secondary'}`}>J'ai sauvegardé ces codes en lieu sûr</span>
          </label>

          {error && <p className="text-xs text-rose-400 text-center">{error}</p>}
        </div>
      )}
    </StageModal>
  )
}
