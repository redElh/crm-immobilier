import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { AuthFormContainer } from '../../components/auth/AuthFormContainer'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(30)

  useEffect(() => {
    // Simulate email verification
    const timer = setTimeout(() => {
      if (token) {
        // In a real app, you would verify the token with your backend
        setStatus('success')
      } else {
        setStatus('error')
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [token])

  useEffect(() => {
    if (countdown > 0 && status === 'error') {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown, status])

  const handleResendEmail = () => {
    setIsResending(true)
    // Simulate API call
    setTimeout(() => {
      setIsResending(false)
      setCountdown(30)
    }, 1000)
  }

  return (
    <AuthFormContainer
      title={
        status === 'verifying'
          ? "Vérification en cours..."
          : status === 'success'
          ? "Email vérifié avec succès !"
          : "Problème de vérification"
      }
      subtitle={
        status === 'verifying'
          ? "Nous vérifions votre adresse email"
          : status === 'success'
          ? "Votre compte est maintenant activé et sécurisé"
          : "Le lien de vérification est invalide ou a expiré"
      }
      backgroundImage="/auth-bg-4.jpg"
    >
      <div className="text-center space-y-6">
        {status === 'verifying' && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <Icon name="check" className="h-6 w-6 text-green-600" />
            </div>
            <Link
              to="/auth/login"
              className="block w-full flex justify-center py-2 px-4 text-sm font-medium text-white bg-accent rounded-md hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
            >
              Se connecter
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <Icon name="x" className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-sm text-gray-600">
              {countdown > 0
                ? `Vous pouvez demander un nouvel email dans ${countdown} secondes`
                : "Cliquez ci-dessous pour recevoir un nouveau lien de vérification"}
            </p>
            <Button
              onClick={handleResendEmail}
              variant="default"
              className="w-full"
              loading={isResending}
              disabled={countdown > 0}
            >
              Renvoyer l'email de vérification
            </Button>
            <div className="text-sm text-gray-600">
              <Link
                to="/auth/login"
                className="font-medium text-accent hover:text-accent/80"
              >
                Retour à la connexion
              </Link>
            </div>
          </>
        )}
      </div>
    </AuthFormContainer>
  )
}