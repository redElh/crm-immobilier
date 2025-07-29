import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthFormContainer } from '../../components/auth/AuthFormContainer'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsSubmitted(true)
      setIsLoading(false)
    }, 1500)
  }

  return (
    <AuthFormContainer
      title="Réinitialiser votre mot de passe"
      subtitle={
        isSubmitted
          ? "Consultez votre boîte mail pour les instructions"
          : "Entrez votre email pour recevoir un lien de réinitialisation"
      }
      backgroundImage="/images/auth-bg.jpg"
    >
      {isSubmitted ? (
        <div className="text-center space-y-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <Icon name="mail" className="h-6 w-6 text-green-600" />
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
            to="/auth/login"
            className="block mt-6 w-full flex justify-center py-2 px-4 text-sm font-medium text-accent hover:text-accent/80"
          >
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email professionnel"
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            icon="mail"
          />

          <Button
            type="submit"
            variant="default"
            size="lg"
            className="w-full"
            loading={isLoading}
          >
            Envoyer les instructions
          </Button>

          <div className="text-center text-sm text-gray-600">
            <Link
              to="/auth/login"
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