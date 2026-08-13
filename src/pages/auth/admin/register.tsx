import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthFormContainer } from '../../../components/auth/AuthFormContainer'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { SocialAuthButtons } from '../../../components/auth/SocialAuthButtons'
import { PasswordStrengthMeter } from '../../../components/auth/PasswordStrengthMeter'
import { getAuthToken } from '../../../utils/auth'
import { useToast } from '../../../components/ui/Toast'
import { User, Mail, Phone, Lock, Loader } from 'react-feather'

export default function AdminRegisterPage() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const navigate = useNavigate()

  useEffect(() => {
    const check = async () => {
      const storedToken = getAuthToken()
      if (!storedToken) { setCheckingAuth(false); return }
      try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` }
        })
        if (res.ok) {
          const user = await res.json()
          if (user.role === 'admin' || user.role === 'gerant') navigate(`/admin/${user.id}`, { replace: true })
        }
      } catch (_) {}
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
      setErrors(prev => { const n = { ...prev }; delete n[name]; return n })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis'
    if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis'
    if (!formData.email.trim()) newErrors.email = "L'email est requis"
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Email invalide'
    if (!formData.phone.trim()) newErrors.phone = 'Le téléphone est requis'
    else if (!/^\+?[\d\s-]+$/.test(formData.phone)) newErrors.phone = 'Numéro invalide'
    if (!formData.password) newErrors.password = 'Le mot de passe est requis'
    else if (formData.password.length < 8) newErrors.password = 'Minimum 8 caractères'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch('http://localhost:5000/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'admin', is_active: true }),
      })
      const data = await response.json()
      if (!response.ok) {
        if (data.errors) {
          const serverErrors = data.errors.reduce((acc: Record<string, string>, error: { param: string; msg: string }) => {
            acc[error.param] = error.msg
            return acc
          }, {})
          setErrors(serverErrors)
        } else setErrors({ form: data.error || "Échec de l'inscription" })
        return
      }
      setErrors({})
      toast('success', 'Compte administrateur créé avec succès ! Vous pouvez maintenant vous connecter.')
      navigate('/auth/admin/login')
    } catch (error) {
      setErrors({ form: 'Une erreur inattendue est survenue.' })
    } finally { setIsLoading(false) }
  }

  return (
    <AuthFormContainer title="Inscription Admin" subtitle="Créez votre compte administrateur" backgroundImage="/CRM_Official_Image.jfif">
      {(errors.form || Object.keys(errors).length > 0) && (
        <div className="mb-4 p-3 bg-error/5 border border-error/20 rounded-lg">
          <p className="text-sm text-error font-medium">{errors.form || 'Veuillez corriger les erreurs'}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prénom" name="firstName" placeholder="Votre prénom" value={formData.firstName} onChange={handleChange} error={errors.firstName} icon={<User size={14} />} />
            <Input label="Nom" name="lastName" placeholder="Votre nom" value={formData.lastName} onChange={handleChange} error={errors.lastName} icon={<User size={14} />} />
          </div>
          <Input label="Email" type="email" name="email" placeholder="admin@email.com" value={formData.email} onChange={handleChange} error={errors.email} icon={<Mail size={14} />} />
          <Input label="Téléphone" type="tel" name="phone" placeholder="+212 6 12 34 56 78" value={formData.phone} onChange={handleChange} error={errors.phone} icon={<Phone size={14} />} />
          <div>
            <Input label="Mot de passe" type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} error={errors.password} icon={<Lock size={14} />} />
            <PasswordStrengthMeter password={formData.password} />
          </div>
        </div>

        <Button type="submit" variant="primary" className="w-full golden-border-animated" loading={isLoading}>
          Créer mon compte administrateur
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs"><span className="px-2 bg-card text-text-secondary">Ou continuer avec</span></div>
        </div>

        <SocialAuthButtons />

        <p className="text-center text-xs text-text-secondary">
          Vous avez déjà un compte ?{' '}
          <Link to="/auth/admin/login" className="font-medium text-accent hover:text-accent-hover">
            Connectez-vous
          </Link>
        </p>
      </form>
    </AuthFormContainer>
  )
}
