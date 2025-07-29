import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthFormContainer } from '../../components/auth/AuthFormContainer'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons'
import { motion } from 'framer-motion'
import { setAuthToken } from '../../utils/auth'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeField, setActiveField] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Effacer l'erreur lorsqu'on modifie le champ
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis'
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Veuillez entrer un email valide'
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ form: data.error || 'Identifiants invalides' })
        return
      }

      // Stocker le token et rediriger
      setAuthToken(data.token, rememberMe)
      navigate('/') // Rediriger vers le tableau de bord

    } catch (error) {
      console.error('Erreur de connexion:', error)
      setErrors({ form: 'Une erreur inattendue est survenue. Veuillez réessayer.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthFormContainer
      title="Connexion Agent"
      subtitle="Connectez-vous à votre compte"
      backgroundImage="/images/auth-bg.jpg"
    >
      {/* Affichage des erreurs */}
      {(errors.form || Object.keys(errors).length > 0) && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {errors.form ? 'Erreur' : 'Veuillez corriger les erreurs suivantes'}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {errors.form && <li>{errors.form}</li>}
                  {Object.entries(errors).map(([field, message]) => (
                    field !== 'form' && <li key={field}>{message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="agent@email.com"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => setActiveField('email')}
              onBlur={() => setActiveField(null)}
              error={errors.email}
              icon="mail"
              isActive={activeField === 'email'}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Input
              label="Mot de passe"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setActiveField('password')}
              onBlur={() => setActiveField(null)}
              error={errors.password}
              icon="lock"
              isActive={activeField === 'password'}
            />
          </motion.div>
        </div>

        <motion.div 
          className="flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <label className="flex items-center cursor-pointer space-x-2">
            <div className="relative">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only"
              />
              <div className={`box block w-4 h-4 rounded border ${rememberMe ? 'bg-accent border-accent' : 'border-gray-300'}`}>
                {rememberMe && (
                  <Icon name="check" className="w-2.5 h-2.5 text-white mx-auto mt-px" />
                )}
              </div>
            </div>
            <span className="text-xs text-gray-600">Se souvenir de moi</span>
          </label>

          <Link
            to="/auth/forgot-password"
            className="text-xs font-medium text-accent hover:text-accent/80 transition-colors"
          >
            Mot de passe oublié ?
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full group relative"
            loading={isLoading}
          >
            <span className="relative z-10">Se connecter</span>
            <span className="absolute inset-0 bg-gradient-to-r from-accent to-accent-dark rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          </Button>
        </motion.div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-gray-500">Ou continuer avec</span>
          </div>
        </div>

        <SocialAuthButtons />

        <motion.div
          className="text-center text-xs text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Première connexion ? Veuillez changer votre mot de passe après connexion.
        </motion.div>
      </form>
    </AuthFormContainer>
  )
}