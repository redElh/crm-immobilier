import { API_ORIGIN } from '../../../utils/config'
import { Users } from 'react-feather'
import type { MessageParticipant } from '../../../types/messages'
import { cn } from '../../../lib/utils'
import { avatarColor, initials, presenceDotClass } from './presence'

interface AvatarProps {
  participant: MessageParticipant
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showPresence?: boolean
  className?: string
}

const sizeClasses = {
  xs: 'w-8 h-8 text-[11px]',
  sm: 'w-10 h-10 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-lg',
}

const dotClasses = {
  xs: 'w-2.5 h-2.5',
  sm: 'w-3 h-3',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
}

const iconSizes = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 24,
}

export function Avatar({ participant, size = 'md', showPresence = false, className }: AvatarProps) {
  const isGroup = participant.type === 'group'
  return (
    <div className={cn('relative shrink-0', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold text-white select-none overflow-hidden',
          sizeClasses[size],
          avatarColor(isGroup ? 'Groupe Équipe' : participant.name)
        )}
      >
        {participant.picture ? (
          <img
            src={`${API_ORIGIN}${participant.picture}`}
            alt={participant.name}
            className="w-full h-full object-cover"
          />
        ) : isGroup ? (
          <Users size={iconSizes[size]} />
        ) : (
          initials(participant.name)
        )}
      </div>
      {showPresence && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-card',
            dotClasses[size],
            presenceDotClass(participant.presence)
          )}
        />
      )}
    </div>
  )
}
