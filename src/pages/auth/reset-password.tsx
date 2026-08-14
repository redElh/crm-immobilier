import { API_ORIGIN } from '../../utils/config'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthFormContainer } from '../../components/auth/AuthFormContainer'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { PasswordStrengthMeter } from '../../components/auth/PasswordStrengthMeter'
import { CheckCircle, Lock } from 'react-feather'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return }
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_ORIGIN}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await response.json()
      if (!response.ok) { setError(data.error || 'Une erreur est survenue'); return }
      setIsSuccess(true)
    } catch (err) {
      setError('Une erreur inattendue est survenue.')
    } finally { setIsLoading(false) }
  }

  return (
    <AuthFormContainer
      title={isSuccess ? 'Mot de passe réinitialisé !' : 'Créer un nouveau mot de passe'}
      subtitle={
        isSuccess
          ? 'Votre mot de passe a été mis à jour avec succès'
          : 'Choisissez un mot de passe sécurisé pour votre compte'
      }
      backgroundImage="/CRM_Official_Image.jfif"
    >
      {isSuccess ? (
        <div className="text-center space-y-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <Link
            to="/auth/login"
            className="block w-full py-2 px-4 text-sm font-medium text-white bg-accent rounded-md hover:bg-accent/90"
          >
            Se connecter
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-error/5 border border-error/20 rounded-lg">
              <p className="text-sm text-error font-medium">{error}</p>
            </div>
          )}

          <input type="hidden" name="token" value={token || ''} />

          <div>
            <Input
              label="Nouveau mot de passe"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              icon={<Lock size={14} />}
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
            icon={<Lock size={14} />}
          />

          <Button
            type="submit"
            variant="default"
            size="lg"
            className="w-full golden-border-animated"
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
