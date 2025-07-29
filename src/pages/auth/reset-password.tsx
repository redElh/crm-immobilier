import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthFormContainer } from '../../components/auth/AuthFormContainer'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { PasswordStrengthMeter } from '../../components/auth/PasswordStrengthMeter'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsSuccess(true)
      setIsLoading(false)
    }, 1500)
  }

  return (
    <AuthFormContainer
      title={isSuccess ? "Mot de passe réinitialisé !" : "Créer un nouveau mot de passe"}
      subtitle={
        isSuccess
          ? "Votre mot de passe a été mis à jour avec succès"
          : "Choisissez un mot de passe sécurisé pour votre compte"
      }
      backgroundImage="/auth-bg-3.jpg"
    >
      {isSuccess ? (
        <div className="text-center space-y-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <Icon name="check" className="h-6 w-6 text-green-600" />
          </div>
          <Link
            to="/auth/login"
            className="block w-full flex justify-center py-2 px-4 text-sm font-medium text-white bg-accent rounded-md hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
          >
            Se connecter
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="token" value={token || ''} />
          
          <div>
            <Input
              label="Nouveau mot de passe"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              icon="lock"
            />
            <PasswordStrengthMeter password={password} />
          </div>

          <Input
            label="Confirmer le mot de passe"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            icon="lock"
          />

          <Button
            type="submit"
            variant="default"
            size="lg"
            className="w-full"
            loading={isLoading}
            disabled={password !== confirmPassword || password.length < 8}
          >
            Réinitialiser le mot de passe
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