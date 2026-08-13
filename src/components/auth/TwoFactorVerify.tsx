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
      const res = await fetch('http://localhost:5000/api/auth/2fa/verify-login', {
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
      const res = await fetch('http://localhost:5000/api/auth/2fa/verify-login', {
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
        <div className="w-12 h-12 rounded-xl bg-accent-light text-accent flex items-center justify-center mx-auto mb-3">
          <Shield size={24} />
        </div>
        <h3 className="text-lg font-semibold">Authentification à deux facteurs</h3>
        <p className="text-sm text-text-secondary mt-1">
          {useBackup
            ? 'Entrez l\'un de vos codes de récupération'
            : `Entrez le code à 6 chiffres depuis votre application d'authentification`
          }
        </p>
      </div>

      {!useBackup ? (
        <>
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-10 h-12 text-center text-lg font-semibold rounded-lg border border-border bg-card text-text focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
              />
            ))}
          </div>

          {error && <p className="text-xs text-error text-center">{error}</p>}

          <Button variant="primary" className="w-full" onClick={handleVerify} loading={loading}>
            <Lock size={14} className="mr-1.5" />
            Vérifier
          </Button>

          <div className="text-center">
            <button
              onClick={() => { setUseBackup(true); setError('') }}
              className="text-xs text-accent hover:text-accent-hover transition-colors"
            >
              Utiliser un code de récupération
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                Chaque code de récupération ne peut être utilisé qu'une seule fois.
                Après utilisation, il sera retiré de votre liste.
              </p>
            </div>
          </div>

          <div>
            <input
              type="text"
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value)}
              placeholder="XXXX-XXXX-XXXX"
              className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent"
              onKeyDown={(e) => e.key === 'Enter' && handleBackupVerify()}
            />
          </div>

          {error && <p className="text-xs text-error text-center">{error}</p>}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { setUseBackup(false); setError(''); setBackupCode('') }}>
              Retour
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleBackupVerify} loading={loading}>
              Vérifier
            </Button>
          </div>
        </>
      )}

      <p className="text-xs text-text-secondary text-center">
        {email}
      </p>
    </div>
  )
}
