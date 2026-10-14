import { useEffect, useState } from 'react'
import type { MessageParticipant } from '../../../types/messages'
import { cn } from '../../../lib/utils'
import { presenceLabel } from './presence'
import { useStageTheme } from '../../dashboard/Stage'

export function PresenceIndicator({ participant, className }: { participant: MessageParticipant; className?: string }) {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const t = window.setInterval(() => forceUpdate(n => n + 1), 10000)
    return () => window.clearInterval(t)
  }, [])

  const isDark = useStageTheme() === 'dark'
  const meta = presenceLabel(participant.presence, participant.lastSeen)
  const dotCls =
    participant.presence === 'online'
      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
      : participant.presence === 'away'
        ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]'
        : isDark ? 'bg-slate-500' : meta.dot
  const textCls =
    participant.presence === 'online'
      ? isDark ? 'text-emerald-300' : 'text-emerald-600'
      : participant.presence === 'away'
        ? isDark ? 'text-amber-300' : 'text-amber-600'
        : isDark ? 'text-slate-400' : meta.text

  return (
    <>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotCls)} />
      <span className={cn('font-medium', textCls, className)}>{meta.label}</span>
    </>
  )
}
