import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthFormContainer } from '../../components/auth/AuthFormContainer'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons'
import { setAuthToken } from '../../utils/auth'
import { Mail, Lock, Check } from 'react-feather'

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const navigate = useNavigate()

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
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (!response.ok) { setErrors({ form: data.error || 'Identifiants invalides' }); return }
      setAuthToken(data.token, rememberMe)
      navigate('/')
    } catch (error) {
      setErrors({ form: 'Une erreur inattendue est survenue. Veuillez réessayer.' })
    } finally { setIsLoading(false) }
  }

  return (
    <AuthFormContainer title="Connexion Agent" subtitle="Connectez-vous à votre compte" backgroundImage="/images/auth-bg.jpg">
      {(errors.form || Object.keys(errors).length > 0) && (
        <div className="mb-4 p-3 bg-error/5 border border-error/20 rounded-lg">
          <p className="text-sm text-error font-medium">{errors.form || 'Veuillez corriger les erreurs'}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <Input label="Email" type="email" name="email" placeholder="agent@email.com" value={formData.email} onChange={handleChange} error={errors.email} icon={<Mail size={14} />} />
          <Input label="Mot de passe" type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} error={errors.password} icon={<Lock size={14} />} />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="sr-only" />
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-accent border-accent' : 'border-border'}`}>
                {rememberMe && <Check size={10} className="text-white" />}
              </div>
            </div>
            <span className="text-xs text-text-secondary">Se souvenir de moi</span>
          </label>
          <Link to="/auth/forgot-password" className="text-xs font-medium text-accent hover:text-accent-hover transition-colors">
            Mot de passe oublié ?
          </Link>
        </div>

        <Button type="submit" variant="primary" className="w-full" loading={isLoading}>Se connecter</Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs"><span className="px-2 bg-card text-text-secondary">Ou continuer avec</span></div>
        </div>

        <SocialAuthButtons />

        <p className="text-center text-xs text-text-secondary">Première connexion ? Veuillez changer votre mot de passe après connexion.</p>
      </form>
    </AuthFormContainer>
  )
}
