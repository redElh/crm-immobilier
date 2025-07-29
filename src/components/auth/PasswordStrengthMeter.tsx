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

    // Simple strength calculation
    let score = 0
    let messages = []

    // Length check
    if (password.length >= 8) score += 1
    else messages.push('Au moins 8 caractères')

    // Contains numbers
    if (/\d/.test(password)) score += 1
    else messages.push('Ajoutez des chiffres')

    // Contains special chars
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
    else messages.push('Ajoutez des caractères spéciaux')

    // Contains uppercase
    if (/[A-Z]/.test(password)) score += 1
    else messages.push('Ajoutez des majuscules')

    setStrength(score)
    setFeedback(messages.join(', '))
  }, [password])

  const strengthColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-green-500'
  ]

  const strengthLabels = [
    'Très faible',
    'Faible',
    'Moyen',
    'Fort',
    'Très fort'
  ]

  return (
    <div className="mt-2">
      <div className="flex space-x-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i <= strength ? strengthColors[strength] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      {password && (
        <p className="mt-1 text-xs text-gray-500">
          {strengthLabels[strength]}
          {feedback && ` - ${feedback}`}
        </p>
      )}
    </div>
  )
}