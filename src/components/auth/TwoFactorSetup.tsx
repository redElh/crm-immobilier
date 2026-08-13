import { useState, useEffect, useRef } from 'react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { getAuthToken } from '../../utils/auth'
import {
  Smartphone, Download, Shield, Check, Copy, ChevronRight,
  Loader, AlertTriangle, ArrowLeft
} from 'react-feather'

interface TwoFactorSetupProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export default function TwoFactorSetup({ isOpen, onClose, onComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState(1)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [savedCodes, setSavedCodes] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setQrCode('')
      setSecret('')
      setEmail('')
      setVerificationCode(['', '', '', '', '', ''])
      setBackupCodes([])
      setSavedCodes(false)
      setError('')
    }
  }, [isOpen])

  useEffect(() => {
    if (step === 1 && isOpen && !generating) {
      generateSecret()
    }
  }, [step, isOpen])

  useEffect(() => {
    if (step !== 3 || !isOpen) return
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return 30
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [step, isOpen])

  const generateSecret = async () => {
    setGenerating(true)
    setError('')
    try {
      const token = getAuthToken()
      const res = await fetch('http://localhost:5000/api/auth/2fa/generate-secret', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setQrCode(data.qrCode)
        setSecret(data.secret)
        setEmail(data.email)
      } else {
        setError(data.error || 'Failed to generate secret')
      }
    } catch (_) {
      setError('Network error')
    }
    setGenerating(false)
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return
    const newCode = [...verificationCode]
    newCode[index] = value
    setVerificationCode(newCode)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const verifyCode = async () => {
    const code = verificationCode.join('')
    if (code.length !== 6) {
      setError('Veuillez entrer le code à 6 chiffres')
      return
    }
    setLoading(true)
    setError('')
    try {
      const token = getAuthToken()
      const res = await fetch('http://localhost:5000/api/auth/2fa/verify-enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ token: code })
      })
      const data = await res.json()
      if (res.ok) {
        setBackupCodes(data.backupCodes)
        setStep(4)
      } else {
        setError(data.error || 'Code invalide')
      }
    } catch (_) {
      setError('Erreur réseau')
    }
    setLoading(false)
  }

  const handleCopyCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
  }

  const handleFinish = () => {
    onComplete()
    onClose()
  }

  const formattedSecret = secret ? secret.match(/.{1,4}/g)?.join(' ') || secret : ''

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="" size="lg">
      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
              step === s ? 'bg-accent text-white' :
              step > s ? 'bg-emerald-100 text-emerald-600' :
              'bg-background text-text-secondary'
            }`}>
              {step > s ? <Check size={12} /> : s}
            </div>
            {s < 4 && (
              <div className={`w-8 h-0.5 transition-colors ${step > s ? 'bg-emerald-400' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-accent-light text-accent flex items-center justify-center mx-auto mb-3">
              <Smartphone size={24} />
            </div>
            <h3 className="text-lg font-semibold">Activer l'authentification à deux facteurs</h3>
            <p className="text-sm text-text-secondary mt-1">Étape 1 sur 3 : Installer une application d'authentification</p>
          </div>

          <div className="space-y-3 bg-background rounded-lg p-4">
            <p className="text-sm font-medium text-text">Téléchargez l'une de ces applications :</p>
            {[
              'Google Authenticator (iOS / Android)',
              'Authy (iOS / Android / Desktop)',
              'Microsoft Authenticator'
            ].map((app, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-text-secondary">
                <Download size={14} className="shrink-0" />
                <span>{app}</span>
              </div>
            ))}
          </div>

          {error && <p className="text-xs text-error text-center">{error}</p>}

          <div className="flex justify-end pt-2">
            <Button variant="default" onClick={() => setStep(2)} disabled={generating || !!error}>
              Continuer
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Étape 2 sur 3 : Scanner le QR Code</h3>
            <p className="text-sm text-text-secondary mt-1">Scannez ce code avec votre application d'authentification</p>
          </div>

          <div className="flex justify-center">
            {qrCode ? (
              <img src={qrCode} alt="QR Code" className="w-48 h-48 rounded-lg border border-border" />
            ) : (
              <div className="w-48 h-48 rounded-lg bg-background flex items-center justify-center">
                <Loader size={24} className="animate-spin text-text-secondary" />
              </div>
            )}
          </div>

          {formattedSecret && (
            <div className="text-center">
              <p className="text-xs text-text-secondary mb-1">Ou entrez ce code manuellement :</p>
              <div className="inline-flex items-center gap-2 bg-background rounded-lg px-4 py-2 border border-border">
                <code className="text-sm font-mono tracking-wider text-accent">{formattedSecret}</code>
                <button
                  onClick={handleCopyCodes}
                  className="p-1 hover:bg-card rounded transition-colors"
                  title="Copier"
                >
                  <Copy size={14} className="text-text-secondary" />
                </button>
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                Ouvrez votre application d'authentification et scannez ce QR code.
                Un code à 6 chiffres apparaîtra, changeant toutes les 30 secondes.
              </p>
            </div>
          </div>

          {error && <p className="text-xs text-error text-center">{error}</p>}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft size={14} className="mr-1.5" />
              Retour
            </Button>
            <Button variant="default" onClick={() => setStep(3)}>
              Suivant
              <ChevronRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Étape 3 sur 3 : Vérifier le code</h3>
            <p className="text-sm text-text-secondary mt-1">
              Entrez le code à 6 chiffres de votre application
            </p>
          </div>

          <div className="flex justify-center gap-2">
            {verificationCode.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(i, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(i, e)}
                className="w-10 h-12 text-center text-lg font-semibold rounded-lg border border-border bg-card text-text focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
              />
            ))}
          </div>

          <p className="text-center text-xs text-text-secondary">
            Code expire dans {countdown} secondes
          </p>

          {error && <p className="text-xs text-error text-center">{error}</p>}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft size={14} className="mr-1.5" />
              Retour
            </Button>
            <Button variant="default" onClick={verifyCode} loading={loading}>
              Vérifier et activer
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Shield size={24} />
            </div>
            <h3 className="text-lg font-semibold">Codes de récupération</h3>
            <p className="text-sm text-text-secondary mt-1">
              Conservez ces codes précieusement. Chaque code ne peut être utilisé qu'une seule fois
              pour accéder à votre compte si vous perdez votre téléphone.
            </p>
          </div>

          <div className="bg-background rounded-lg border border-border p-4">
            <div className="space-y-2">
              {backupCodes.map((code, i) => (
                <div key={i} className="font-mono text-sm text-text tracking-wider">
                  {i + 1}. {code}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleCopyCodes}
            className="flex items-center justify-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors w-full"
          >
            <Copy size={14} />
            Copier les codes
          </button>

          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={savedCodes}
                onChange={(e) => setSavedCodes(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                savedCodes ? 'bg-emerald-500 border-emerald-500' : 'border-border'
              }`}>
                {savedCodes && <Check size={10} className="text-white" />}
              </div>
            </div>
            <span className="text-sm text-text-secondary">J'ai sauvegardé ces codes</span>
          </label>

          {error && <p className="text-xs text-error text-center">{error}</p>}

          <div className="flex justify-end pt-2">
            <Button variant="default" onClick={handleFinish} disabled={!savedCodes}>
              Terminer
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  )
}
