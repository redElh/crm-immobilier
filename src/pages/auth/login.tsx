import { API_ORIGIN } from '../../utils/config'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthFormContainer } from '../../components/auth/AuthFormContainer'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { setAuthToken, getAuthToken, setSessionId } from '../../utils/auth'
import { ensureE2EEIdentity } from '../../services/e2ee/session'
import { myIdFromToken } from '../../services/e2ee/conversation'
import TwoFactorVerify from '../../components/auth/TwoFactorVerify'
import { getDeviceInfo, getPublicIP } from '../../utils/device'
import { Mail, Lock, Check, Key, Loader } from 'react-feather'

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [twoFactorRequired, setTwoFactorRequired] = useState(false)
  const [twoFactorUserId, setTwoFactorUserId] = useState(0)
  const [clientIP, setClientIP] = useState<string | undefined>(undefined)
  const [requirePasswordChange, setRequirePasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    getPublicIP().then(setClientIP)
  }, [])

  useEffect(() => {
    const check = async () => {
      let user = null
      try {
        const res = await fetch(`${API_ORIGIN}/api/auth/me`, { credentials: 'include' })
        if (res.ok) user = await res.json()
      } catch (_) {}

      if (!user) {
        const token = getAuthToken()
        if (token) {
          try {
            const res = await fetch(`${API_ORIGIN}/api/auth/me`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) user = await res.json()
          } catch (_) {}
        }
      }

      if (user && user.role === 'agent') {
        navigate(`/${user.id}`, { replace: true })
      } else if (user && (user.role === 'admin' || user.role === 'gerant')) {
        navigate(`/admin/${user.id}`, { replace: true })
      }
      setCheckingAuth(false)
    }
    check()
  }, [navigate])

  if (checkingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader size={32} className="animate-spin text-accent" />
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => { const newErrors = { ...prev }; delete newErrors[name]; return newErrors })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.email.trim()) newErrors.email = "L'email est requis"
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Veuillez entrer un email valide'
    if (!formData.password) newErrors.password = 'Le mot de passe est requis'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsLoading(true)
    setErrors({})

    try {
      const deviceInfo = { ...(await getDeviceInfo()), ...(clientIP ? { ip: clientIP } : {}) }
      const response = await fetch(`${API_ORIGIN}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, deviceInfo }),
      })
      const data = await response.json()

      if (response.status === 401) {
        const userCheck = await fetch(`${API_ORIGIN}/api/auth/check-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email }),
        })
        const userData = await userCheck.json()
        if (!userData.exists) {
          setErrors({ form: 'Votre compte n\'existe pas. Veuillez contacter l\'administrateur pour obtenir vos identifiants.' })
          return
        }
        setErrors({ form: 'Identifiants invalides' })
        return
      }

      if (!response.ok) { setErrors({ form: data.error || 'Identifiants invalides' }); return }
      if (data.twoFactorRequired) {
        setTwoFactorUserId(data.id)
        setTwoFactorRequired(true)
        setErrors({})
        return
      }
      if (data.requirePasswordChange) {
        setRequirePasswordChange(true)
        setErrors({})
        return
      }
      setAuthToken(data.token, rememberMe)
      if (data.sessionId) setSessionId(data.sessionId, rememberMe)
      // First login on this device = crypto birth: generate the Identity Key
      // + prekeys now (never blocks navigation; layout bootstrap is idempotent).
      try {
        const uid = myIdFromToken()
        if (uid) ensureE2EEIdentity(uid)
      } catch {
        // encryption stays unavailable until the next bootstrap
      }
      toast('success', 'Connexion réussie ! Bienvenue sur votre espace agent.')
      navigate('/')
    } catch (error) {
      setErrors({ form: 'Une erreur inattendue est survenue. Veuillez réessayer.' })
    } finally { setIsLoading(false) }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) { setErrors({ newPassword: 'Le mot de passe doit contenir au moins 6 caractères' }); return }
    if (newPassword !== confirmNewPassword) { setErrors({ confirmNewPassword: 'Les mots de passe ne correspondent pas' }); return }
    setIsLoading(true)
    try {
      const loginRes = await fetch(`${API_ORIGIN}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      })
      const loginData = await loginRes.json()
      if (!loginRes.ok || !loginData.token) { setErrors({ form: 'Session expirée, veuillez vous reconnecter.' }); setRequirePasswordChange(false); setIsLoading(false); return }

      setAuthToken(loginData.token, rememberMe)
      if (loginData.sessionId) setSessionId(loginData.sessionId, rememberMe)
      try {
        const uid = myIdFromToken()
        if (uid) ensureE2EEIdentity(uid)
      } catch {
        // encryption stays unavailable until the next bootstrap
      }

      const res = await fetch(`${API_ORIGIN}/api/auth/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginData.token}` },
        body: JSON.stringify({ currentPassword: formData.password, newPassword }),
      })
      if (!res.ok) { const d = await res.json(); setErrors({ form: d.error || 'Erreur lors du changement' }); return }
      toast('success', 'Mot de passe modifié avec succès. Bienvenue !')
      navigate('/')
    } catch (error) {
      setErrors({ form: 'Une erreur est survenue.' })
    } finally { setIsLoading(false) }
  }

  return (
    <AuthFormContainer title="Connexion Agent" subtitle="Connectez-vous à votre compte" backgroundImage="/CRM_Official_Image.jfif">
      {(errors.form || Object.keys(errors).length > 0) && (
        <div className="mb-4 p-3 bg-error/5 border border-error/20 rounded-lg">
          <p className="text-sm text-error font-medium">{errors.form || 'Veuillez corriger les erreurs'}</p>
        </div>
      )}

      {twoFactorRequired ? (
        <TwoFactorVerify
          userId={twoFactorUserId}
          email={formData.email}
          rememberMe={rememberMe}
          role="agent"
        />
      ) : requirePasswordChange ? (
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
            Vous devez changer votre mot de passe avant de continuer.
          </div>
          <div className="space-y-3">
            <Input label="Nouveau mot de passe" type="password" name="newPassword" placeholder="••••••••" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setErrors({}) }} error={errors.newPassword} icon={<Key size={14} />} revealable />
            <Input label="Confirmer le mot de passe" type="password" name="confirmNewPassword" placeholder="••••••••" value={confirmNewPassword} onChange={(e) => { setConfirmNewPassword(e.target.value); setErrors({}) }} error={errors.confirmNewPassword} icon={<Key size={14} />} revealable />
          </div>
          <Button type="submit" variant="primary" className="w-full golden-border-animated" loading={isLoading}>Changer le mot de passe</Button>
        </form>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <Input label="Email" type="email" name="email" placeholder="agent@email.com" value={formData.email} onChange={handleChange} error={errors.email} icon={<Mail size={14} />} />
          <Input label="Mot de passe" type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} error={errors.password} icon={<Lock size={14} />} revealable />
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="group flex cursor-pointer select-none items-center gap-2.5">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="peer sr-only" />
            <span className={`relative flex h-[18px] w-[18px] items-center justify-center rounded-[6px] border transition-all duration-200 ${rememberMe ? 'border-transparent bg-gradient-to-br from-[var(--auth-accent)] to-[var(--auth-accent2)] shadow-[0_0_12px_var(--auth-accent)]' : 'border-white/15 bg-white/[0.04] group-hover:border-white/35'}`}>
              <Check size={12} strokeWidth={3} className={`text-white transition-all duration-200 ${rememberMe ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} />
            </span>
            <span className="text-xs font-medium normal-case tracking-normal text-white/55 transition-colors duration-200 group-hover:text-white/85">Se souvenir de moi</span>
          </label>
          <Link to="/auth/forgot-password" className="group relative whitespace-nowrap text-xs font-semibold text-white/55 transition-colors duration-200 hover:text-[var(--auth-accent)]">
            Mot de passe oublié ?
            <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-[var(--auth-accent)] transition-all duration-300 group-hover:w-full" />
          </Link>
        </div>

        <Button type="submit" variant="primary" className="w-full golden-border-animated" loading={isLoading}>Se connecter</Button>

        <p className="text-center text-xs text-text-secondary">
          Vous n'avez pas de compte ? Veuillez contacter votre administrateur.
        </p>
      </form>
      )}
    </AuthFormContainer>
  )
}
