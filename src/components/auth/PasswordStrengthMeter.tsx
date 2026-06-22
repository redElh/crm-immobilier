import { useEffect, useState } from 'react'

export function PasswordStrengthMeter({ password }: { password: string }) {
  const [strength, setStrength] = useState(0)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (!password) {
      setStrength(0)
      setFeedback('')
      return
    }

    let score = 0
    const messages: string[] = []

    if (password.length >= 8) score += 1
    else messages.push('8 caractères minimum')

    if (/\d/.test(password)) score += 1
    else messages.push('Ajoutez des chiffres')

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
    else messages.push('Ajoutez un caractère spécial')

    if (/[A-Z]/.test(password)) score += 1
    else messages.push('Ajoutez une majuscule')

    setStrength(score)
    setFeedback(messages.join(', '))
  }, [password])

  const colors = ['bg-error', 'bg-orange-500', 'bg-amber-500', 'bg-accent', 'bg-emerald-500']
  const labels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort']

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i <= strength ? colors[strength] : 'bg-border'
            }`}
          />
        ))}
      </div>
      {password && (
        <p className="text-xs text-text-secondary">
          {labels[strength]} {feedback && `— ${feedback}`}
        </p>
      )}
    </div>
  )
}
