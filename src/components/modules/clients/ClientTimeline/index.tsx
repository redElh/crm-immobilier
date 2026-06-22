import { Clock, Mail, Phone, Home, FileText } from "react-feather";

interface TimelineEvent { id: string; type: 'email' | 'call' | 'meeting' | 'property_visit'; date: string; summary: string; agent?: string; }

export const ClientTimeline = ({ events = [] }: { events?: TimelineEvent[] }) => {
  const getEventIcon = (type: string) => {
    switch(type) {
      case 'email': return <Mail size={14} className="text-accent" />;
      case 'call': return <Phone size={14} className="text-emerald-600" />;
      case 'property_visit': return <Home size={14} className="text-violet-600" />;
      default: return <FileText size={14} className="text-text-secondary" />;
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
      <h2 className="font-semibold flex items-center gap-2 mb-4">
        <Clock size={16} className="text-accent" />
        Historique des interactions
      </h2>

      {events.length === 0 ? (
        <p className="text-sm text-text-secondary text-center py-6">Aucune interaction enregistrée</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="relative pl-6">
              <div className="absolute left-[7px] top-3 bottom-0 w-px bg-border" />
              <div className="absolute left-0 top-1.5 w-[14px] h-[14px] rounded-full border-2 border-accent bg-card flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              </div>
              <div className="pb-3">
                <div className="flex items-center gap-2">
                  {getEventIcon(event.type)}
                  <span className="text-xs font-medium capitalize">{event.type.replace('_', ' ')}</span>
                  <span className="text-[11px] text-text-secondary/60 ml-auto">
                    {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5 ml-6">{event.summary}</p>
                {event.agent && <p className="text-[11px] text-text-secondary/50 ml-6">Par {event.agent}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
