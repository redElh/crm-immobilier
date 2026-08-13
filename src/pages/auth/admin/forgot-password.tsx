import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthFormContainer } from '../../../components/auth/AuthFormContainer'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { getAuthToken } from '../../../utils/auth'
import { Mail, Loader } from 'react-feather'

export default function AdminForgotPasswordPage() {
  const navigate = useNavigate()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:5000/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) { setError(data.error || 'Une erreur est survenue'); return }
      setIsSubmitted(true)
    } catch (err) {
      setError('Une erreur inattendue est survenue.')
    } finally { setIsLoading(false) }
  }

  return (
    <AuthFormContainer
      title="Réinitialiser votre mot de passe"
      subtitle={
        isSubmitted
          ? "Consultez votre boîte mail pour les instructions"
          : "Entrez votre email pour recevoir un lien de réinitialisation"
      }
      backgroundImage="/CRM_Official_Image.jfif"
    >
      {isSubmitted ? (
        <div className="text-center space-y-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <Mail size={24} className="text-green-600" />
          </div>
          <p className="text-sm text-gray-600">
            Nous avons envoyé un email à <span className="font-medium">{email}</span> avec un lien
            pour réinitialiser votre mot de passe.
          </p>
          <div className="text-sm text-gray-600">
            Vous ne l'avez pas reçu ?{' '}
            <button
              onClick={() => setIsSubmitted(false)}
              className="font-medium text-accent hover:text-accent/80"
            >
              Renvoyer l'email
            </button>
          </div>
          <Link
            to="/auth/admin/login"
            className="block mt-6 w-full flex justify-center py-2 px-4 text-sm font-medium text-accent hover:text-accent/80"
          >
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-error/5 border border-error/20 rounded-lg">
              <p className="text-sm text-error font-medium">{error}</p>
            </div>
          )}

          <Input
            label="Email professionnel"
            type="email"
            placeholder="admin@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="default"
            size="lg"
            className="w-full golden-border-animated"
            loading={isLoading}
          >
            Envoyer les instructions
          </Button>

          <div className="text-center text-sm text-gray-600">
            <Link
              to="/auth/admin/login"
              className="font-medium text-accent hover:text-accent/80"
            >
              Retour à la connexion
            </Link>
          </div>
        </form>
      )}
    </AuthFormContainer>
  )
}
