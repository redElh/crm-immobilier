import { useEffect, useState } from 'react'
import type { MessageParticipant } from '../../../types/messages'
import { cn } from '../../../lib/utils'
import { presenceLabel } from './presence'

export function PresenceIndicator({ participant, className }: { participant: MessageParticipant; className?: string }) {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const t = window.setInterval(() => forceUpdate(n => n + 1), 10000)
    return () => window.clearInterval(t)
  }, [])

  const meta = presenceLabel(participant.presence, participant.lastSeen)

  return (
    <>
      <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot)} />
      <span className={cn(meta.text, className)}>{meta.label}</span>
    </>
  )
}
