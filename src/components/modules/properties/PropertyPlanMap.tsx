import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '../../ui/Button';
import { MapPin, ExternalLink, Navigation, Eye, EyeOff, Layers } from 'react-feather';
import { useConfidential } from '../confidentiality/ConfidentialContext';
import { useStageChrome } from '../calendar/useStageChrome';
import { StagePanel, OrbIcon, STAGE_HUES } from '../../dashboard/Stage';

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

function stageMarkerIcon(color: string): L.DivIcon {
  return new L.DivIcon({
    className: '',
    iconSize: [44, 56],
    iconAnchor: [22, 52],
    popupAnchor: [0, -52],
    html: `
      <div style="
        position: relative;
        width: 44px; height: 56px;
        display: flex; flex-direction: column; align-items: center;
      ">
        <style>
          @keyframes pd-pin-pulse {
            0%   { transform: scale(0.6); opacity: 0.8; }
            70%  { transform: scale(1.8); opacity: 0; }
            100% { transform: scale(1.8); opacity: 0; }
          }
        </style>
        <div style="
          position: absolute; top: 10px;
          width: 44px; height: 44px;
          border-radius: 50%;
          background: ${color};
          opacity: 0.5;
          animation: pd-pin-pulse 2s ease-out infinite;
        "></div>
        <div style="
          width: 40px; height: 40px; margin-top: 4px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(145deg, ${color}, #5646C9);
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.75);
          box-shadow: 0 0 22px ${color}B3, 0 6px 16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.35);
        ">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div style="
          width: 7px; height: 7px;
          background: ${color};
          border-radius: 50%;
          margin-top: -3px;
          filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));
        "></div>
      </div>
    `,
  });
}

const DEFAULT_CENTER: [number, number] = [31.6295, -7.9811];

export const PropertyPlanMap = ({ property }: { property: any }) => {
  const { revealed } = useConfidential();
  const { staged, dark } = useStageChrome();
  const [hideAddress, setHideAddress] = useState(property?.hideExactAddress || false);
  const mapRef = useState<{ current: LeafletMap | null }>(() => ({ current: null }))[0];
  const effectivelyHidden = !revealed || hideAddress;

  const hasCoords = property?.latitude && property?.longitude;
  const center: [number, number] = hasCoords
    ? [property.latitude, property.longitude]
    : DEFAULT_CENTER;

  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${property.latitude},${property.longitude}`
    : `https://www.google.com/maps?q=${encodeURIComponent(property?.address || '')}`;

  /* =================================================================
     STAGE variant — holographic tactical map
  ================================================================= */
  if (staged) {
    const pinColor = dark ? '#A78BFA' : '#14B8A6';
    const cellBorder = dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)';
    const cellBg = dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)';

    return (
      <StagePanel title="Localisation" icon={Navigation} hue={dark ? STAGE_HUES.violet : STAGE_HUES.emerald}
        badge={
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{
              color: effectivelyHidden ? STAGE_HUES.amber.a : STAGE_HUES.emerald.a,
              borderColor: effectivelyHidden ? `${STAGE_HUES.amber.a}40` : `${STAGE_HUES.emerald.a}40`,
              backgroundColor: effectivelyHidden ? `${STAGE_HUES.amber.a}0F` : `${STAGE_HUES.emerald.a}0F`,
            }}
          >
            {effectivelyHidden ? <EyeOff size={10} /> : <Eye size={10} />}
            {effectivelyHidden ? 'Adresse masquée' : 'Adresse visible'}
          </span>
        }
      >
        <div className="space-y-4">
          {/* Map frame */}
          <div
            className="relative overflow-hidden rounded-2xl border"
            style={{
              borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.10)',
              boxShadow: dark
                ? `inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 60px -28px rgba(2,4,18,0.95), 0 0 50px -20px ${pinColor}55`
                : 'inset 0 1px 0 rgba(255,255,255,0.9), 0 24px 60px -30px rgba(13,148,136,0.45)',
            }}
          >
            <div style={{ height: 420 }} className={`relative w-full ${dark ? 'pd-map-dark' : ''}`}>
              <style>{`
                .pd-map-dark .leaflet-tile {
                  filter: invert(1) hue-rotate(190deg) brightness(0.92) contrast(0.92) saturate(0.65);
                }
                .pd-map-dark .leaflet-tile-pane {
                  background-color: #0B1022;
                }
              `}</style>
              <MapContainer
                key={dark ? 'dark' : 'light'}
                ref={(map: LeafletMap | null) => {
                  mapRef.current = map;
                  if (map) setTimeout(() => map.invalidateSize(), 150);
                }}
                center={center}
                zoom={15}
                className="w-full h-full bg-transparent"
                scrollWheelZoom={true}
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {hasCoords && (
                  <Marker position={center} icon={stageMarkerIcon(pinColor)}>
                    <Popup>
                      <div className="text-sm font-medium">
                        {effectivelyHidden
                          ? 'Adresse masquée (confidentiel)'
                          : property.address || property.city || 'Propriété'}
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>

              {/* Address HUD overlay */}
              <div
                className="absolute bottom-4 left-1/2 z-[1000] max-w-[90%] -translate-x-1/2 rounded-xl border px-4 py-2.5 text-center backdrop-blur-xl"
                style={{
                  borderColor: effectivelyHidden ? `${STAGE_HUES.amber.a}45` : cellBorder,
                  background: dark ? 'rgba(10,15,36,0.82)' : 'rgba(255,255,255,0.85)',
                  boxShadow: effectivelyHidden
                    ? `0 8px 26px -10px rgba(0,0,0,0.6), 0 0 20px -6px ${STAGE_HUES.amber.glow}`
                    : '0 8px 26px -10px rgba(0,0,0,0.5)',
                }}
              >
                {effectivelyHidden ? (
                  <p className="flex items-center justify-center gap-2 text-sm font-semibold" style={{ color: STAGE_HUES.amber.a }}>
                    <EyeOff size={13} />
                    Adresse masquée (confidentiel)
                  </p>
                ) : (
                  <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
                    {property?.address || 'Adresse non renseignée'}
                  </p>
                )}
              </div>

              {/* corner coordinates readout */}
              {hasCoords && (
                <div
                  className={`absolute left-3 top-3 z-[1000] rounded-lg border px-2.5 py-1 font-mono text-[10px] font-semibold tabular-nums backdrop-blur-md ${
                    dark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                  style={{
                    borderColor: cellBorder,
                    background: dark ? 'rgba(10,15,36,0.72)' : 'rgba(255,255,255,0.80)',
                    letterSpacing: '0.08em',
                  }}
                >
                  {revealed
                    ? `${Number(property.latitude).toFixed(5)}° , ${Number(property.longitude).toFixed(5)}°`
                    : '••.••••° , ••.••••°'}
                </div>
              )}

              {/* Stage zoom controllers */}
              <div
                className="absolute right-3 top-1/2 z-[1000] flex -translate-y-1/2 flex-col overflow-hidden rounded-xl border backdrop-blur-xl"
                style={{
                  borderColor: dark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.12)',
                  background: dark ? 'rgba(10,15,36,0.78)' : 'rgba(255,255,255,0.85)',
                  boxShadow: dark
                    ? `0 10px 30px -12px rgba(0,0,0,0.7), 0 0 24px -8px ${pinColor}66`
                    : '0 10px 30px -14px rgba(13,148,136,0.45)',
                }}
              >
                {[
                  {
                    label: '+',
                    title: 'Zoom avant',
                    onClick: () => mapRef.current?.zoomIn(),
                    divider: false,
                  },
                  {
                    label: '−',
                    title: 'Zoom arrière',
                    onClick: () => mapRef.current?.zoomOut(),
                    divider: true,
                  },
                ].map((btn, i) => (
                  <button
                    key={i}
                    type="button"
                    title={btn.title}
                    aria-label={btn.title}
                    onClick={() => btn.onClick()}
                    className={`relative flex h-9 w-9 items-center justify-center text-lg font-bold transition-all duration-150 active:scale-90 ${
                      dark ? 'text-slate-200 hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:bg-teal-900/[0.06] hover:text-teal-900'
                    }`}
                  >
                    {btn.divider && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-2 top-0 h-px"
                        style={{ background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.10)' }}
                      />
                    )}
                    <span
                      className="leading-none"
                      style={{
                        filter: dark ? 'drop-shadow(0 0 6px rgba(167,139,250,0.55))' : 'drop-shadow(0 0 5px rgba(20,184,166,0.45))',
                      }}
                    >
                      {btn.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {revealed ? (
              <button
                type="button"
                onClick={() => setHideAddress(!hideAddress)}
                className="inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all duration-200 active:scale-95"
                style={effectivelyHidden ? {
                  color: dark ? '#6EE7B7' : '#047857',
                  borderColor: `${STAGE_HUES.emerald.a}40`,
                  backgroundImage: `linear-gradient(145deg, ${STAGE_HUES.emerald.a}12, transparent)`,
                } : {
                  color: dark ? '#FDA4AF' : '#BE123C',
                  borderColor: 'rgba(251,113,133,0.30)',
                  backgroundImage: 'linear-gradient(145deg, rgba(251,113,133,0.08), transparent)',
                }}
              >
                {effectivelyHidden ? <><Eye size={12} /> Afficher l'adresse</> : <><EyeOff size={12} /> Masquer l'adresse</>}
              </button>
            ) : null}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all duration-200 hover:-translate-y-px active:scale-95"
              style={{
                color: dark ? 'rgba(226,232,240,0.75)' : 'rgba(15,23,42,0.65)',
                borderColor: cellBorder,
                backgroundImage: dark
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.5))',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              <ExternalLink size={12} /> Google Maps
            </a>
          </div>

          {/* Quick info cells */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: 'Ville', value: property?.city || '-', icon: MapPin },
              ...(property?.district ? [{ label: 'Quartier', value: property.district, icon: MapPin }] : []),
              ...(hasCoords ? [{
                label: 'Coordonnées',
                value: revealed
                  ? `${Number(property.latitude).toFixed(4)}, ${Number(property.longitude).toFixed(4)}`
                  : '••••••••',
                icon: Navigation,
                mono: true,
              }] : []),
            ].map((cell: any, i: number) => (
              <div
                key={i}
                className={`rounded-xl border p-3 transition-transform duration-200 hover:-translate-y-px ${cell.mono ? 'font-mono' : ''}`}
                style={{ borderColor: cellBorder, background: cellBg, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
              >
                <div className="mb-1 flex items-center gap-1.5">
                  <cell.icon size={12} style={{ color: (dark ? STAGE_HUES.violet : STAGE_HUES.emerald).a }} />
                  <span className={`text-[10px] font-bold uppercase tracking-[0.14em] ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>
                    {cell.label}
                  </span>
                </div>
                <p className={`text-sm font-semibold break-words ${dark ? 'text-slate-100' : 'text-slate-800'}`}>{cell.value}</p>
              </div>
            ))}
          </div>

          {/* legend hint */}
          <p className={`flex items-center gap-1.5 text-[11px] ${dark ? 'text-slate-600' : 'text-teal-900/30'}`}>
            <Layers size={11} />
            Fond de carte {dark ? 'holographique' : 'clair'} · molette pour zoomer · glisser pour naviguer
          </p>
        </div>
      </StagePanel>
    );
  }

  /* =================================================================
     Legacy variant (admin shell)
  ================================================================= */
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
          icon={<MapPin size={14} />}
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
