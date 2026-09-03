import { API_ORIGIN } from '../../utils/config'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { setAuthToken, setSessionId } from '../../utils/auth'
import { getDeviceInfo, getPublicIP } from '../../utils/device'
import { useToast } from '../ui/Toast'
import { Shield, Lock, AlertTriangle } from 'react-feather'

interface TwoFactorVerifyProps {
  userId: number
  email: string
  rememberMe: boolean
  role: 'agent' | 'admin'
}

export default function TwoFactorVerify({ userId, email, rememberMe, role }: TwoFactorVerifyProps) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [useBackup, setUseBackup] = useState(false)
  const [backupCode, setBackupCode] = useState('')
  const [clientIP, setClientIP] = useState<string | undefined>(undefined)
  const navigate = useNavigate()
  const { toast } = useToast()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    getPublicIP().then(setClientIP)
  }, [])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = [...code]
    pasted.split('').forEach((char, i) => { newCode[i] = char })
    setCode(newCode)
    const nextIndex = Math.min(pasted.length, 5)
    inputRefs.current[nextIndex]?.focus()
  }

  const handleVerify = async () => {
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setError('Veuillez entrer le code à 6 chiffres')
      return
    }
    setLoading(true)
    setError('')
    try {
      const deviceInfo = { ...(await getDeviceInfo()), ...(clientIP ? { ip: clientIP } : {}) }
      const res = await fetch(`${API_ORIGIN}/api/auth/2fa/verify-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token: fullCode, deviceInfo })
      })
      const data = await res.json()
      if (res.ok) {
        setAuthToken(data.token, rememberMe)
        if (data.sessionId) setSessionId(data.sessionId, rememberMe)
        toast('success', 'Connexion réussie !')
        navigate(role === 'admin' ? `/admin/${userId}` : '/')
      } else {
        setError(data.error || 'Code invalide')
      }
    } catch (_) {
      setError('Erreur réseau')
    }
    setLoading(false)
  }

  const handleBackupVerify = async () => {
    if (!backupCode.trim()) {
      setError('Veuillez entrer un code de récupération')
      return
    }
    setLoading(true)
    setError('')
    try {
      const deviceInfo = { ...(await getDeviceInfo()), ...(clientIP ? { ip: clientIP } : {}) }
      const res = await fetch(`${API_ORIGIN}/api/auth/2fa/verify-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, backupCode: backupCode.trim(), deviceInfo })
      })
      const data = await res.json()
      if (res.ok) {
        setAuthToken(data.token, rememberMe)
        if (data.sessionId) setSessionId(data.sessionId, rememberMe)
        toast('success', 'Connexion réussie !')
        navigate(role === 'admin' ? `/admin/${userId}` : '/')
      } else {
        setError(data.error || 'Code de récupération invalide')
      }
    } catch (_) {
      setError('Erreur réseau')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
          <Shield size={22} className="text-white" />
        </div>
        <h3 className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-lg font-extrabold text-transparent">Authentification à deux facteurs</h3>
        <p className="mt-1 text-sm text-white/55">
          {useBackup ? "Entrez l'un de vos codes de récupération" : "Entrez le code à 6 chiffres depuis votre application d'authentification"}
        </p>
      </div>

      {!useBackup ? (
        <>
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="h-12 w-10 rounded-xl border border-white/10 bg-white/[0.06] text-center text-lg font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] outline-none backdrop-blur-xl transition-all placeholder:text-white/30 focus:border-violet-400/60 focus:bg-white/[0.09] focus:shadow-[0_0_0_3px_rgba(139,124,255,0.25)]"
              />
            ))}
          </div>

          {error && (
            <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300 backdrop-blur-xl">{error}</div>
          )}

          <Button variant="primary" className="w-full !bg-[linear-gradient(145deg,#8B7CFF,#6C5ECF)] !border-white/15 !text-white shadow-[0_10px_24px_-6px_rgba(124,92,255,0.55)]" onClick={handleVerify} loading={loading}>
            <Lock size={14} className="mr-1.5" />
            Vérifier
          </Button>

          <div className="text-center">
            <button onClick={() => { setUseBackup(true); setError('') }} className="text-xs font-medium text-violet-300 transition-colors hover:text-white">
              Utiliser un code de récupération
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 backdrop-blur-xl">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" />
              <p className="text-xs leading-relaxed text-amber-200/90">
                Chaque code de récupération ne peut être utilisé qu'une seule fois. Après utilisation, il sera retiré de votre liste.
              </p>
            </div>
          </div>
          <div>
            <input
              type="text"
              value={backupCode}
              onChange={e => setBackupCode(e.target.value)}
              placeholder="XXXX-XXXX-XXXX"
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 text-sm text-white placeholder:text-white/30 outline-none backdrop-blur-xl transition-all focus:border-violet-400/60 focus:bg-white/[0.09] focus:shadow-[0_0_0_3px_rgba(139,124,255,0.25)]"
              onKeyDown={e => e.key === 'Enter' && handleBackupVerify()}
            />
          </div>
          {error && <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300">{error}</div>}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 !border-white/10 !bg-white/[0.06] !text-white hover:!bg-white/[0.10]" onClick={() => { setUseBackup(false); setError(''); setBackupCode('') }}>
              Retour
            </Button>
            <Button variant="primary" className="flex-1 !bg-[linear-gradient(145deg,#8B7CFF,#6C5ECF)] !border-white/15 !text-white" onClick={handleBackupVerify} loading={loading}>
              Vérifier
            </Button>
          </div>
        </>
      )}

      <p className="text-center text-xs text-white/35">{email}</p>
    </div>
  )
}
