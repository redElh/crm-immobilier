import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

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

  const hues = [
    { a: '#EF4444', b: '#B91C1C', glow: 'rgba(239,68,68,0.4)' },
    { a: '#F97316', b: '#C2410C', glow: 'rgba(249,115,22,0.4)' },
    { a: '#F59E0B', b: '#B45309', glow: 'rgba(245,158,11,0.4)' },
    { a: '#8B7CFF', b: '#5B4BD4', glow: 'rgba(139,124,255,0.45)' },
    { a: '#10B981', b: '#047857', glow: 'rgba(16,185,129,0.4)' },
  ]
  const labels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort']
  const hue = hues[strength] || hues[0]
  const pct = (strength / 4) * 100

  return (
    <div className="mt-2.5 space-y-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map(i => {
          const active = i <= strength
          return (
            <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: active ? `linear-gradient(90deg, ${hue.b}, ${hue.a})` : 'transparent',
                  boxShadow: active ? `0 0 10px ${hue.glow}` : 'none',
                }}
                initial={{ width: 0 }}
                animate={{ width: active ? '100%' : '0%' }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
              />
            </div>
          )
        })}
      </div>
      {password && (
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold"
            style={{ background: `${hue.a}18`, borderColor: `${hue.a}30`, color: hue.a }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: hue.a, boxShadow: `0 0 6px ${hue.glow}` }} />
            {labels[strength]}
          </span>
          {feedback && <span className="text-[11px] text-white/45">{feedback}</span>}
        </div>
      )}
      {/* shimmer progress for overall */}
      {password && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full relative overflow-hidden"
            style={{ background: `linear-gradient(90deg, ${hue.b}, ${hue.a})`, boxShadow: `0 0 12px ${hue.glow}` }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" style={{ animation: 'shimmer 1.8s linear infinite' }} />
          </motion.div>
        </div>
      )}
    </div>
  )
}
