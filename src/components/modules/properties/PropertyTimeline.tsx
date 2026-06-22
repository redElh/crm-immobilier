import { Clock, User, DollarSign, Camera, FileText, Phone, Plus, Home } from 'react-feather';
import type { TimelineEvent } from '../../../types/property';

const eventIcons: Record<string, React.ReactNode> = {
  visit: <User size={14} />,
  price_adjustment: <DollarSign size={14} />,
  photo: <Camera size={14} />,
  document: <FileText size={14} />,
  contact: <Phone size={14} />,
  creation: <Plus size={14} />,
  default: <Clock size={14} />,
};

const eventColors: Record<string, string> = {
  visit: 'bg-blue-100 text-blue-600',
  price_adjustment: 'bg-amber-100 text-amber-600',
  photo: 'bg-purple-100 text-purple-600',
  document: 'bg-emerald-100 text-emerald-600',
  contact: 'bg-rose-100 text-rose-600',
  creation: 'bg-gray-100 text-gray-600',
  default: 'bg-accent-light text-accent',
};

export const PropertyTimeline = ({ events }: { events: TimelineEvent[] }) => {
  if (events.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border/50 shadow-card p-8 text-center">
        <Clock size={24} className="text-text-secondary/20 mx-auto mb-2" />
        <p className="text-sm text-text-secondary">Aucun historique</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
      <h3 className="font-semibold flex items-center gap-2 mb-6">
        <Clock size={16} className="text-accent" />
        Historique
      </h3>
      <div className="relative">
        {events.map((event, index) => {
          const Icon = eventIcons[event.type] || eventIcons.default;
          const colorClass = eventColors[event.type] || eventColors.default;
          const isLast = index === events.length - 1;

          return (
            <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute left-[18px] top-10 bottom-0 w-px bg-border/60" />
              )}

              {/* Icon */}
              <div className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                {Icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium capitalize">
                    {event.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] text-text-secondary/50">
                    {new Date(event.date).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                  {event.notes}
                </p>
                {event.agent && (
                  <p className="text-[11px] text-text-secondary/50 mt-0.5 flex items-center gap-1">
                    <User size={10} />
                    Par {event.agent}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
