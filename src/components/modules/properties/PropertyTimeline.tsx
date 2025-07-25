import Card from '../../ui/Card'
import { Icon } from '../../ui/Icon'
import { Button } from '../../ui/Button'

interface PropertyTimelineProps {
  events: {
    id: string
    date: string
    type: string
    agent?: string
    notes?: string
  }[]
}

const eventIcons = {
  visit: 'calendar',
  price_adjustment: 'currency',
  status_change: 'badge',
  note: 'file-text',
  document: 'folder',
  call: 'phone',
  email: 'mail'
}

const eventColors = {
  visit: 'bg-blue-100 text-blue-800',
  price_adjustment: 'bg-amber-100 text-amber-800',
  status_change: 'bg-purple-100 text-purple-800',
  note: 'bg-gray-100 text-gray-800',
  document: 'bg-green-100 text-green-800',
  call: 'bg-red-100 text-red-800',
  email: 'bg-indigo-100 text-indigo-800'
}

export const PropertyTimeline = ({ events }: PropertyTimelineProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-lg">Historique d'activité</h3>
        <Button variant="outline" icon="plus">
          Ajouter une note
        </Button>
      </div>

      <div className="space-y-8">
        {events.length > 0 ? (
          events.map((event) => (
            <div key={event.id} className="relative pl-8">
              <div className={`absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full ${eventColors[event.type as keyof typeof eventColors]}`}>
                <Icon name={eventIcons[event.type as keyof typeof eventIcons] || 'circle'} className="h-4 w-4" />
              </div>
              
              <div className="flex justify-between items-baseline">
                <h4 className="text-sm font-medium capitalize">
                  {event.type.replace('_', ' ')}
                </h4>
                <time className="text-xs text-gray-500">
                  {formatTime(event.date)} • {formatDate(event.date)}
                </time>
              </div>
              
              {event.agent && (
                <p className="mt-1 text-sm text-gray-500">
                  Par {event.agent}
                </p>
              )}
              
              {event.notes && (
                <p className="mt-2 text-sm text-gray-700">
                  {event.notes}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Icon name="clock" className="mx-auto h-12 w-12 text-gray-400" />
            <h4 className="mt-2 text-sm font-medium text-gray-900">Aucune activité récente</h4>
            <p className="mt-1 text-sm text-gray-500">Les actions sur ce bien apparaîtront ici</p>
          </div>
        )}
      </div>
    </Card>
  )
}