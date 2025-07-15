import { Clock, Mail, Phone, Home, FileText } from "react-feather";

interface TimelineEvent {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'property_visit';
  date: string;
  summary: string;
  agent?: string;
}

interface ClientTimelineProps {
  events?: TimelineEvent[]; // Rend la prop optionnelle
}

export const ClientTimeline = ({ events = [] }: ClientTimelineProps) => {
  const getEventIcon = (type: string) => {
    switch(type) {
      case 'email': return <Mail size={16} className="text-blue-500" />;
      case 'call': return <Phone size={16} className="text-green-500" />;
      case 'property_visit': return <Home size={16} className="text-purple-500" />;
      default: return <FileText size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Clock size={18} className="text-accent" />
        Historique des interactions
      </h2>

      {events.length === 0 ? (
        <p className="text-sm text-text/60 text-center py-4">
          Aucune interaction enregistrée
        </p>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="relative pl-6">
              {/* Ligne verticale */}
              <div className="absolute left-[11px] top-4 bottom-0 w-px bg-accent/10"></div>
              
              {/* Point */}
              <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-accent flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-card"></div>
              </div>

              {/* Contenu */}
              <div className="space-y-1 pb-4">
                <div className="flex items-center gap-2">
                  {getEventIcon(event.type)}
                  <span className="text-sm font-medium capitalize">
                    {event.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-text/50 ml-auto">
                    {new Date(event.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-sm text-text/80 pl-6">{event.summary}</p>
                {event.agent && (
                  <p className="text-xs text-text/60 pl-6">Par {event.agent}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};