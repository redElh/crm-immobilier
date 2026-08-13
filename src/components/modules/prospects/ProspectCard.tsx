import { useState } from 'react';
import { Phone, Mail, MapPin, Calendar, DollarSign, Maximize2, Grid, Tag, Compass, ShoppingCart, Key, Heart, Edit3, ExternalLink, Trash2, MessageSquare, Star, Award, Clock, XOctagon, RotateCcw } from 'react-feather';
import { Prospect } from '../../../types/prospect';
import { CompletionRing } from '../../ui/CompletionRing';
import { calcProspectCompletion } from '../../../utils/prospectCompletion';
import { getQualifiedCountdown } from '../../../utils/qualifiedCountdown';
import { StatusChangeDropdown } from './StatusChangeDropdown';

interface ProspectCardProps {
  prospect: Prospect;
  onClick?: () => void;
  onEdit?: (prospect: Prospect) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (prospectId: string, status: Prospect['status']) => void;
  onCalendarClick?: (prospectId: string, prospectName: string) => void;
  onQualifyClick?: (prospect: Prospect) => void;
  onQualify?: (prospectId: string) => void;
  onMarkLost?: (prospectId: string) => void;
  onViewContact?: (contactId: string) => void;
  canWrite?: boolean;
}

const TYPE_CONFIG: Record<string, {
  icon: any;
  label: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  accentRing: string;
  gradient: string;
  pillBg: string;
}> = {
  Acheter: {
    icon: ShoppingCart,
    label: 'Acheter',
    accent: 'text-blue-600',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-l-blue-500',
    accentRing: 'ring-blue-500/20',
    gradient: 'from-blue-500/5 to-transparent',
    pillBg: 'bg-blue-50/80 text-blue-600 border-blue-100',
  },
  Louer: {
    icon: Key,
    label: 'Louer',
    accent: 'text-violet-600',
    accentBg: 'bg-violet-50',
    accentBorder: 'border-l-violet-500',
    accentRing: 'ring-violet-500/20',
    gradient: 'from-violet-500/5 to-transparent',
    pillBg: 'bg-violet-50/80 text-violet-600 border-violet-100',
  },
  Vendre: {
    icon: Tag,
    label: 'Vendre',
    accent: 'text-emerald-600',
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-l-emerald-500',
    accentRing: 'ring-emerald-500/20',
    gradient: 'from-emerald-500/5 to-transparent',
    pillBg: 'bg-emerald-50/80 text-emerald-600 border-emerald-100',
  },
  'Faire estimer': {
    icon: Compass,
    label: 'Faire estimer',
    accent: 'text-amber-600',
    accentBg: 'bg-amber-50',
    accentBorder: 'border-l-amber-500',
    accentRing: 'ring-amber-500/20',
    gradient: 'from-amber-500/5 to-transparent',
    pillBg: 'bg-amber-50/80 text-amber-600 border-amber-100',
  },
};

const STATUS_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  Nouveau: { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  Contacté: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  Qualifié: { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'En attente': { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  Perdu: { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  Converti: { text: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
};

const InfoPill = ({ icon: Icon, label, value, accent }: { icon: any; label?: string; value: string | number | undefined | null; accent: string }) => (
  <div className="flex items-center gap-1.5 min-w-0">
    <Icon size={11} className={`${accent} shrink-0 opacity-60`} />
    {label && <span className="text-[10px] text-text-secondary/60 shrink-0">{label}:</span>}
    <span className="text-[11px] text-text-secondary truncate">{value ?? '—'}</span>
  </div>
);

const MiniTag = ({ label, colorClass }: { label: string; colorClass: string }) => (
  <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded border ${colorClass}`}>
    {label}
  </span>
);

export const ProspectCard = ({ prospect, onClick, onEdit, onDelete, onStatusChange, onCalendarClick, onQualifyClick, onQualify, onMarkLost, onViewContact, canWrite = true }: ProspectCardProps) => {
  const [liked, setLiked] = useState(false);
  const fullName = `${prospect.civility} ${prospect.firstName} ${prospect.lastName}`;
  const config = TYPE_CONFIG[prospect.type] || TYPE_CONFIG.Acheter;
  const TypeIcon = config.icon;
  const statusColor = STATUS_COLORS[prospect.status] || STATUS_COLORS.Nouveau;
  const devise = prospect.currency || 'MAD';
  const formatPrice = (val?: number) => val ? val.toLocaleString() : null;
  const completion = calcProspectCompletion(prospect);

  return (
    <div
      className={`bg-card rounded-xl border border-border/50 shadow-card hover:shadow-card-hover cursor-pointer transition-all duration-300 group relative flex flex-col overflow-hidden border-l-[3px] ${config.accentBorder} hover:-translate-y-0.5`}
      onClick={onClick}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

      <div className="relative p-4 pb-0">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`w-10 h-10 rounded-xl ${config.accentBg} flex items-center justify-center ring-2 ${config.accentRing} shrink-0 transition-transform duration-300 group-hover:scale-105`}>
              <TypeIcon size={18} className={config.accent} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm truncate">{fullName}</h3>
                {prospect.status === 'Nouveau' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                    <Star size={9} className="text-blue-500" />
                    Nouveau
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className={`text-[10px] font-medium ${config.accent}`}>{config.label}</span>
                <span className="text-text-secondary/30">·</span>
                {onStatusChange && canWrite ? (
                  <StatusChangeDropdown
                    currentStatus={prospect.status}
                    onStatusChange={(status) => onStatusChange(prospect.id, status)}
                    onCalendarClick={() => onCalendarClick?.(prospect.id, `${prospect.civility} ${prospect.firstName} ${prospect.lastName}`)}
                    onQualifyClick={() => onQualifyClick?.(prospect)}
                    compact
                  />
                ) : (
                  <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                    {prospect.status}
                  </span>
                )}
                {prospect.status === 'Qualifié' && (() => {
                  const cd = getQualifiedCountdown(prospect.qualifiedAt);
                  if (!cd) return null;
                  const colors = {
                    safe: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    warning: 'bg-amber-50 text-amber-700 border-amber-200',
                    critical: 'bg-red-50 text-red-700 border-red-200',
                    expired: 'bg-red-100 text-red-800 border-red-300',
                  };
                  return (
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-semibold rounded border ${colors[cd.urgency]}`}>
                      <Clock size={8} />
                      {cd.label}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <CompletionRing percent={completion} size={36} strokeWidth={3} showLabel={true} />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-secondary mb-3">
          <Phone size={12} className="shrink-0 opacity-60" />
          <span className="truncate">{prospect.phone}</span>
          {prospect.mobile && (
            <>
              <span className="text-text-secondary/30">·</span>
              <span className="truncate text-[11px]">{prospect.mobile}</span>
            </>
          )}
        </div>
      </div>

      <div className="relative px-4 pb-3 flex-1">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {prospect.email && (
            <InfoPill icon={Mail} label="Email" value={prospect.email} accent={config.accent} />
          )}
          {prospect.location && (
            <InfoPill icon={MapPin} label="Localisation" value={prospect.location} accent={config.accent} />
          )}
          {prospect.rooms && (
            <InfoPill icon={Grid} label="Pièces" value={prospect.rooms} accent={config.accent} />
          )}
          {prospect.bedrooms && (
            <InfoPill icon={Grid} label="Chambres" value={prospect.bedrooms} accent={config.accent} />
          )}
          {prospect.minSurface && (
            <InfoPill icon={Maximize2} label="Surface" value={`${prospect.minSurface} m²`} accent={config.accent} />
          )}
          {prospect.maxPrice && (
            <InfoPill icon={DollarSign} label="Budget" value={`${formatPrice(prospect.maxPrice)} ${devise}`} accent={config.accent} />
          )}
          {prospect.origin && (
            <InfoPill icon={Compass} label="Origine" value={prospect.origin} accent={config.accent} />
          )}
          {prospect.spokenLanguage && (
            <InfoPill icon={Tag} label="Langue" value={prospect.spokenLanguage} accent={config.accent} />
          )}
        </div>

        {(prospect.viewType || prospect.viewDetail) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {prospect.viewType && <MiniTag label={`Vue: ${prospect.viewType}`} colorClass={config.pillBg} />}
            {prospect.viewDetail && <MiniTag label={prospect.viewDetail} colorClass={config.pillBg} />}
          </div>
        )}

        {(prospect.categories || prospect.propertyTypes.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/30">
            {prospect.categories && (
              <MiniTag label={prospect.categories} colorClass="bg-background text-text-secondary border-border/50" />
            )}
            {prospect.propertyTypes.map((pt) => (
              <MiniTag key={pt} label={pt} colorClass={`${config.pillBg}`} />
            ))}
          </div>
        )}

        {prospect.message && (
          <div className="mt-2 pt-2 border-t border-border/30">
            <div className="flex items-center gap-1.5 text-[10px] text-text-secondary/50">
              <MessageSquare size={10} className="shrink-0" />
              <span className="truncate">{prospect.message}</span>
            </div>
          </div>
        )}
      </div>

      <div className="relative px-4 py-2.5 border-t border-border/30 flex items-center justify-between bg-background/30">
        <div className="flex items-center gap-1.5 text-[10px] text-text-secondary/40">
          <Calendar size={10} />
          <span>Créé le {new Date(prospect.createdAt).toLocaleDateString('fr-FR')}</span>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${liked ? 'text-red-500 bg-red-50' : 'text-text-secondary hover:text-text hover:bg-background'}`}
          >
            <Heart size={13} />
          </button>
          {prospect.status === 'Contacté' && canWrite && (
            <button
              onClick={(e) => { e.stopPropagation(); onCalendarClick?.(prospect.id, `${prospect.civility} ${prospect.firstName} ${prospect.lastName}`); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-all"
              title="Programmer un rappel"
            >
              <Calendar size={13} />
            </button>
          )}
          {!['Qualifié', 'Perdu', 'Converti'].includes(prospect.status) && canWrite && (
            <button
              onClick={(e) => { e.stopPropagation(); onQualify?.(prospect.id); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
              title="Qualifier le prospect"
            >
              <Award size={13} />
            </button>
          )}
          {canWrite && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(prospect); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
            >
              <Edit3 size={13} />
            </button>
          )}
          {prospect.status === 'Converti' && prospect.contactId ? (
            <button
              onClick={(e) => { e.stopPropagation(); onViewContact?.(prospect.contactId!); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-violet-500 hover:text-violet-600 hover:bg-violet-50 transition-all"
              title="Voir le contact"
            >
              <ExternalLink size={13} />
            </button>
          ) : prospect.status === 'Perdu' && canWrite ? (
            <button
              onClick={(e) => { e.stopPropagation(); onStatusChange?.(prospect.id, 'Contacté'); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
              title="Recontacter"
            >
              <RotateCcw size={13} />
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
            >
              <ExternalLink size={13} />
            </button>
          )}
          {!['Perdu', 'Converti'].includes(prospect.status) && canWrite && (
            <button
              onClick={(e) => { e.stopPropagation(); onMarkLost?.(prospect.id); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
              title="Marquer comme perdu"
            >
              <XOctagon size={13} />
            </button>
          )}
          {canWrite && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(prospect.id); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-error hover:bg-error/5 transition-all"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
