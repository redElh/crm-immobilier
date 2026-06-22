import { Badge } from '../../ui/Badge';
import { User, Phone, Mail, MapPin, Calendar } from 'react-feather';
import { Prospect } from '../../../types/prospect';

interface ProspectCardProps {
  prospect: Prospect;
  onClick?: () => void;
}

const statusBadge: Record<string, 'primary' | 'warning' | 'success' | 'secondary'> = {
  Nouveau: 'primary',
  Contacté: 'warning',
  Qualifié: 'success',
  Perdu: 'secondary',
  Converti: 'success',
};

const typeColors: Record<string, string> = {
  Acheter: 'text-accent',
  Louer: 'text-emerald-600',
  Vendre: 'text-amber-600',
  'Faire estimer': 'text-violet-600',
};

export const ProspectCard = ({ prospect, onClick }: ProspectCardProps) => {
  const fullName = `${prospect.civility} ${prospect.firstName} ${prospect.lastName}`;

  return (
    <div
      className="bg-card rounded-xl border border-border/50 shadow-card hover:shadow-card-hover p-4 cursor-pointer transition-all duration-200 group"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-light flex items-center justify-center">
            <User size={16} className="text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-sm truncate max-w-[180px]">{fullName}</h3>
            <p className={`text-xs font-medium ${typeColors[prospect.type] || 'text-text-secondary'}`}>
              {prospect.type}
            </p>
          </div>
        </div>
        <Badge variant={statusBadge[prospect.status] || 'default'} size="sm">
          {prospect.status}
        </Badge>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Mail size={12} />
          <span className="truncate">{prospect.email}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Phone size={12} />
          <span>{prospect.phone}</span>
        </div>
        {prospect.location && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <MapPin size={12} />
            <span>{prospect.location}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-text-secondary/60">
          <Calendar size={12} />
          <span>Créé le {new Date(prospect.createdAt).toLocaleDateString('fr-FR')}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 pt-3 border-t border-border/30">
        {prospect.categories && (
          <span className="px-2 py-0.5 text-[11px] rounded-md bg-background text-text-secondary border border-border/50">
            {prospect.categories}
          </span>
        )}
        {prospect.propertyTypes.map((pt) => (
          <span key={pt} className="px-2 py-0.5 text-[11px] rounded-md bg-accent-light text-accent border border-accent/20">
            {pt}
          </span>
        ))}
      </div>
    </div>
  );
};
