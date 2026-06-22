import { useNavigate } from 'react-router-dom';
import { Badge } from '../../ui/Badge';
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS, DPE_COLORS } from '../../../types/property';
import type { Property } from '../../../types/property';
import { Home, MapPin, Maximize2, Grid, User, Hash, Briefcase, Sun } from 'react-feather';
import { useOptionalConfidential } from '../confidentiality/ConfidentialContext';

interface PropertyCardProps {
  property: Property;
}

export const PropertyCard = ({ property }: PropertyCardProps) => {
  const navigate = useNavigate();
  const { revealed } = useOptionalConfidential();

  const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType] || property.propertyType;
  const transactionLabel = TRANSACTION_TYPE_LABELS[property.transactionType] || property.transactionType;
  const statusLabel = STATUS_LABELS[property.status] || property.status;
  const statusColor = STATUS_COLORS[property.status] || 'bg-gray-50 text-gray-700 border-gray-200';

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(p);

  return (
    <div
      className="bg-card rounded-xl border border-border/50 shadow-card hover:shadow-card-hover cursor-pointer transition-all duration-200 group overflow-hidden"
      onClick={() => navigate(`/properties/${property.id}`)}
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
      <div className="p-4 space-y-3">
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
          ) : (
            <>
              <span className="text-base font-bold text-accent">
                {revealed ? formatPrice(property.price) : '••••••••'}
              </span>
              {(property.transactionType === 'location_ld' || property.transactionType === 'location_saisonniere') && (
                <span className="text-[11px] text-text-secondary">
                  {property.transactionType === 'location_ld' ? '/mois' : '/nuit'}
                </span>
              )}
            </>
          )}
          {property.transactionType === 'location_saisonniere' && property.priceMin && property.priceMax && (
            <span className="text-[11px] text-text-secondary">
              ({revealed ? `${formatPrice(property.priceMin)} - ${formatPrice(property.priceMax)}` : '••••••••'})
            </span>
          )}
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
            <span>{property.rooms} pièces</span>
          </div>
          {property.bedrooms > 0 && (
            <div className="flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4v16h20V4M2 4h20M2 8h20M6 4v4M10 4v4M14 4v4M18 4v4" />
              </svg>
              <span>{property.bedrooms} ch.</span>
            </div>
          )}
          {property.sleepingCapacity && property.propertyType === 'vacation' && (
            <div className="flex items-center gap-1">
              <Sun size={11} />
              <span>{property.sleepingCapacity} pers.</span>
            </div>
          )}
          {property.dpe && (
            <div className={`ml-auto w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white ${DPE_COLORS[property.dpe.class] || 'bg-gray-400'}`}>
              {property.dpe.class}
            </div>
          )}
        </div>

        {/* Owner */}
        <div className="flex items-center gap-2 text-xs text-text-secondary/70 pt-1 border-t border-border/20">
          <User size={11} />
          <span className="text-text-secondary/40 font-medium">Propriétaire :</span>
          <span className="truncate">{revealed ? property.owner.name : '••••••••'}</span>
        </div>
      </div>
    </div>
  );
};
