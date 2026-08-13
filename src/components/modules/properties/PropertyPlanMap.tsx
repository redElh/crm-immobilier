import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '../../ui/Button';
import { MapPin, ExternalLink, Navigation } from 'react-feather';
import { useConfidential } from '../confidentiality/ConfidentialContext';

const customIcon = new L.DivIcon({
  className: '',
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -48],
  html: `
    <div style="
      width: 48px; height: 48px;
      display: flex; align-items: center; justify-content: center;
      background: #dc2626;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(220,38,38,0.4), 0 0 0 4px white;
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
    <div style="
      width: 8px; height: 8px;
      background: #dc2626;
      border-radius: 50%;
      margin: -2px auto 0;
    "></div>
  `,
});

const DEFAULT_CENTER: [number, number] = [31.6295, -7.9811];

export const PropertyPlanMap = ({ property }: { property: any }) => {
  const { revealed } = useConfidential();
  const [hideAddress, setHideAddress] = useState(property?.hideExactAddress || false);
  const effectivelyHidden = !revealed || hideAddress;

  const hasCoords = property?.latitude && property?.longitude;
  const center: [number, number] = hasCoords
    ? [property.latitude, property.longitude]
    : DEFAULT_CENTER;

  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${property.latitude},${property.longitude}`
    : `https://www.google.com/maps?q=${encodeURIComponent(property?.address || '')}`;

  return (
    <div className="space-y-4">
      {/* Real map */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
        <div style={{ height: 320 }} className="w-full relative">
          <MapContainer
            center={center}
            zoom={15}
            className="w-full h-full"
            scrollWheelZoom={true}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {hasCoords && (
              <Marker position={center} icon={customIcon}>
                <Popup>
                  <div className="text-sm font-medium">
                    {property.address || property.city || 'Propriété'}
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Address overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-card/90 backdrop-blur-sm rounded-lg shadow-dropdown px-4 py-2 border border-border/50 text-center">
            {effectivelyHidden ? (
              <p className="text-sm text-text-secondary flex items-center gap-2 justify-center">
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
          icon={effectivelyHidden ? <MapPin size={14} /> : <MapPin size={14} />}
          onClick={() => setHideAddress(!hideAddress)}
          disabled={!revealed}
        >
          {effectivelyHidden ? "Afficher l'adresse" : "Masquer l'adresse"}
        </Button>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-border/50 bg-card text-text hover:bg-background transition-all"
        >
          <ExternalLink size={14} />
          Google Maps
        </a>
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
        {hasCoords && (
          <div className="p-3 rounded-xl bg-background">
            <p className="text-xs text-text-secondary">Coordonnées</p>
            <p className="text-sm font-medium mt-0.5">
              {revealed
                ? `${Number(property.latitude).toFixed(4)}, ${Number(property.longitude).toFixed(4)}`
                : '••••••••'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
