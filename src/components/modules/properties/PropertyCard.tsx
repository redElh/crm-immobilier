import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../../ui/Badge';
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from '../../../types/property';
import type { Property } from '../../../types/property';
import { Home, MapPin, Maximize2, Grid, User, Hash, Briefcase, Sun, Percent, Lock } from 'react-feather';
import { useOptionalConfidential } from '../confidentiality/ConfidentialContext';
import { usePermission, useRestriction } from '../../../hooks/usePermission';
import { PropertyCompletionModal } from './PropertyCompletionModal';

interface PropertyCardProps {
  property: Property;
}

export const PropertyCard = ({ property }: PropertyCardProps) => {
  const navigate = useNavigate();
  const { agentId, adminId, type } = useParams<{ agentId?: string; adminId?: string; type?: string }>();
  const { revealed } = useOptionalConfidential();
  const restricted = useRestriction('biens-info-privees');
  const canSeeName = usePermission('biens-afficher-nom-contact');
  const canWrite = usePermission('biens-ecriture');
  const [showCompletion, setShowCompletion] = useState(false);
  const [display, setDisplay] = useState<Property>(property);

  useEffect(() => {
    setDisplay(property);
  }, [property]);

  const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType] || property.propertyType;
  const transactionLabel = TRANSACTION_TYPE_LABELS[property.transactionType] || property.transactionType;
  const statusLabel = STATUS_LABELS[property.status] || property.status;
  const statusColor = STATUS_COLORS[property.status] || 'bg-gray-50 text-gray-700 border-gray-200';
  const completion = display.completion;
  const waveColor = completion != null ? (completion >= 80 ? '#16a34a' : completion >= 50 ? '#d97706' : '#dc2626') : '#9ca3af';

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(p);

  const isSeasonal = property.transactionType === 'location_saisonniere';
  const displayPrice = property.transactionType === 'location_ld'
    ? (property.loyerHC || 0)
    : isSeasonal
      ? (property.seasonalPriceMin || 0)
      : (property.prixNetVendeur && property.honorairesPct && property.honorairesType === 'inclus'
        ? Math.round(Number(property.prixNetVendeur) * (1 + Number(property.honorairesPct) / 100))
        : (property.prixNetVendeur ?? property.price));
  const ownerName = property.owner?.name
    || [(property.owner as any)?.firstName, (property.owner as any)?.lastName].filter(Boolean).join(' ')
    || [(property as any).owner_firstName, (property as any).owner_lastName].filter(Boolean).join(' ')
    || '';

  return (
    <div
      className={`bg-card rounded-xl border border-border/50 ${!restricted ? 'hover:shadow-card-hover cursor-pointer' : ''} transition-all duration-200 group overflow-hidden relative h-full flex flex-col`}
      onClick={() => {
        if (restricted) return;
        const propType = type || property.propertyType || 'residential';
        if (adminId) {
          navigate(`/admin/${adminId}/properties/type/${propType}/${property.id}`);
        } else if (agentId) {
          navigate(`/${agentId}/properties/type/${propType}/${property.id}`);
        } else {
          navigate(`/properties/${property.id}`);
        }
      }}
    >
      {/* Image */}
      <div className="relative h-44 bg-gradient-to-br from-accent-light via-background to-violet-50">
        {property.images?.[0] ? (
          <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Home size={36} className="text-text-secondary/20" />
          </div>
        )}
        {restricted && (
          <div className="absolute inset-0 bg-card/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-card border border-border/60 shadow-sm flex items-center justify-center">
              <Lock size={16} className="text-text-secondary" />
            </div>
            <span className="text-xs font-medium text-text-secondary">Bien verrouillé</span>
          </div>
        )}
        {/* Status badge overlay */}
        <div className="absolute top-3 left-3">
          <Badge className={statusColor}>{statusLabel}</Badge>
        </div>
        {/* Transaction type badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="primary" size="sm">{transactionLabel}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 flex-1">
        {/* Reference + Title */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-text-secondary/60 mb-0.5">
            <Hash size={10} />
            <span>{property.reference}</span>
          </div>
          <h3 className="font-semibold text-sm leading-snug group-hover:text-accent transition-colors line-clamp-1">
            {property.title}
          </h3>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <MapPin size={11} />
          <span className="truncate">
            {property.city}{property.district ? ` - ${property.district}` : ''}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          {property.prixSurDemande ? (
            <span className="text-base font-bold text-accent">Prix sur demande</span>
          ) : isSeasonal && property.seasonalPriceMin && property.seasonalPriceMax ? (
            <>
              <span className="text-base font-bold text-accent">
                {revealed ? `${formatPrice(property.seasonalPriceMin)} ~ ${formatPrice(property.seasonalPriceMax)}` : '••••••••'}
              </span>
              <span className="text-[11px] text-text-secondary">/nuit</span>
            </>
          ) : displayPrice ? (
            <>
              <span className="text-base font-bold text-accent">
                {revealed ? formatPrice(displayPrice) : '••••••••'}
              </span>
              {(property.transactionType === 'location_ld') && (
                <span className="text-[11px] text-text-secondary">/mois</span>
              )}
            </>
          ) : null}
        </div>

        {/* Type info badge */}
        <div className="flex items-center gap-1.5 text-[11px] text-text-secondary/70">
          <Briefcase size={11} />
          <span>{typeLabel}</span>
          {property.propertyState && (
            <>
              <span className="text-text-secondary/40">•</span>
              <span>État: {property.propertyState}</span>
            </>
          )}
          {property.mandateType && (
            <>
              <span className="text-text-secondary/40">•</span>
              <span>Mandat: {property.mandateType}</span>
            </>
          )}
        </div>

        {/* Details row */}
        <div className="flex items-center gap-3 pt-2 border-t border-border/30 text-xs text-text-secondary">
          <div className="flex items-center gap-1">
            <Maximize2 size={11} />
            <span>{property.surface} m²</span>
          </div>
          <div className="flex items-center gap-1">
            <Grid size={11} />
            <span>{((property as any).bathroom_count ?? property.bathrooms)} sdb</span>
          </div>
          {((property as any).bedrooms_total ?? property.bedrooms) > 0 && (
            <div className="flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4v16h20V4M2 4h20M2 8h20M6 4v4M10 4v4M14 4v4M18 4v4" />
              </svg>
              <span>{((property as any).bedrooms_total ?? property.bedrooms)} ch.</span>
            </div>
          )}
          {property.sleepingCapacity && property.propertyType === 'vacation' && (
            <div className="flex items-center gap-1">
              <Sun size={11} />
              <span>{property.sleepingCapacity} pers.</span>
            </div>
          )}
        </div>

        {/* Owner */}
        {ownerName && (
        <div className="flex items-center gap-2 text-xs text-text-secondary/70 pt-1 border-t border-border/20">
          <User size={11} />
          <span className="text-text-secondary/40 font-medium">Propriétaire :</span>
          <span className="truncate">{revealed && canSeeName ? ownerName : '••••••••'}</span>
        </div>
        )}
      </div>

      <div className="flex items-stretch border-t border-border/30">
        <div className="relative flex-1 flex flex-col overflow-hidden">
          {completion != null ? (
            <>
              <svg className="w-full h-3 block shrink-0" viewBox="0 0 400 12" preserveAspectRatio="none">
                <path
                  d="M0,6 Q12.5,0 25,6 T50,6 T75,6 T100,6 T125,6 T150,6 T175,6 T200,6 T225,6 T250,6 T275,6 T300,6 T325,6 T350,6 T375,6 T400,6 V12 H0 Z"
                  fill={waveColor}
                />
              </svg>
              <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: waveColor }}>
                <span className="text-[9px] font-bold text-white/90 uppercase tracking-widest">
                  {completion}%
                </span>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-text-secondary/40">
                Complétion
              </span>
            </div>
          )}
        </div>
        {canWrite ? (
          <button
            type="button"
            title="Suivi de complétion"
            onClick={(e) => {
              e.stopPropagation();
              setShowCompletion(true);
            }}
            className="mt-1.5 mr-1.5 ml-1.5 mb-0 flex items-center justify-center w-8 h-8 rounded-lg border border-border/60 text-text-secondary hover:text-accent hover:border-accent/40 hover:bg-accent/10 transition-colors"
            style={completion != null ? { color: waveColor, borderColor: waveColor + '66' } : undefined}
          >
            <Percent size={14} />
          </button>
        ) : (
          <span
            title="Suivi de complétion"
            className="mt-1.5 mr-1.5 ml-1.5 mb-0 flex items-center justify-center w-8 h-8 rounded-lg border border-border/60 text-text-secondary select-none"
            style={completion != null ? { color: waveColor, borderColor: waveColor + '66' } : undefined}
          >
            <Percent size={14} />
          </span>
        )}
      </div>

      <PropertyCompletionModal
        property={display}
        isOpen={showCompletion}
        onClose={() => setShowCompletion(false)}
        onSaved={(updated) => setDisplay(updated)}
      />
    </div>
  );
};
