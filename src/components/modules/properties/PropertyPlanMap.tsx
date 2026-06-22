import { useState } from 'react';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { MapPin, Eye, EyeOff, Navigation } from 'react-feather';
import { useConfidential } from '../confidentiality/ConfidentialContext';

export const PropertyPlanMap = ({ property }: { property: any }) => {
  const { revealed } = useConfidential();
  const [hideAddress, setHideAddress] = useState(property?.hideExactAddress || false);
  const effectivelyHidden = !revealed || hideAddress;

  return (
    <div className="space-y-4">
      {/* Map placeholder */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
        <div className="relative h-80 bg-gradient-to-br from-accent-light via-background to-emerald-50 flex items-center justify-center">
          {/* Simulated map */}
          <div className="absolute inset-0 opacity-10">
            <svg viewBox="0 0 800 400" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Center pin */}
          <div className="relative z-10 flex flex-col items-center animate-bounce">
            <div className="w-10 h-10 rounded-full bg-accent shadow-lg flex items-center justify-center">
              <MapPin size={18} className="text-white" />
            </div>
            <div className="w-2 h-2 bg-accent rounded-full mt-0.5" />
          </div>

          {/* Address tooltip */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm rounded-lg shadow-dropdown px-4 py-2 border border-border/50">
            {effectivelyHidden ? (
              <p className="text-sm text-text-secondary flex items-center gap-2">
                <EyeOff size={14} />
                Adresse masquée (confidentiel)
              </p>
            ) : (
              <p className="text-sm font-medium">{property?.address || 'Adresse non renseignée'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant={effectivelyHidden ? 'default' : 'outline'}
          size="sm"
          icon={effectivelyHidden ? <EyeOff size={14} /> : <Eye size={14} />}
          onClick={() => setHideAddress(!hideAddress)}
          disabled={!revealed}
        >
          {effectivelyHidden ? 'Afficher l\'adresse' : 'Masquer l\'adresse'}
        </Button>
        <Button variant="outline" size="sm" icon={<Navigation size={14} />}>
          Voir sur Google Maps
        </Button>
      </div>

      {/* Quick info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-background">
          <p className="text-xs text-text-secondary">Ville</p>
          <p className="text-sm font-medium mt-0.5">{property?.city || '-'}</p>
        </div>
        {property?.district && (
          <div className="p-3 rounded-xl bg-background">
            <p className="text-xs text-text-secondary">Quartier</p>
            <p className="text-sm font-medium mt-0.5">{property.district}</p>
          </div>
        )}
        {property?.latitude && property?.longitude && (
          <div className="p-3 rounded-xl bg-background">
            <p className="text-xs text-text-secondary">Coordonnées</p>
            <p className="text-sm font-medium mt-0.5 text-xs">
              {revealed ? `${property.latitude.toFixed(4)}, ${property.longitude.toFixed(4)}` : '••••••••'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
