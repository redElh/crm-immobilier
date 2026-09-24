import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Navigation, Maximize2, X } from 'react-feather';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStageChrome } from '../../calendar/useStageChrome';
import { STAGE_HUES } from '../../../dashboard/Stage';

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function stageMarkerIcon(color: string): L.DivIcon {
  return new L.DivIcon({
    className: '',
    iconSize: [44, 56],
    iconAnchor: [22, 52],
    popupAnchor: [0, -52],
    html: `
      <div style="position:relative;width:44px;height:56px;display:flex;flex-direction:column;align-items:center;">
        <style>@keyframes pd-pin-pulse{0%{transform:scale(0.6);opacity:0.8}70%{transform:scale(1.8);opacity:0}100%{transform:scale(1.8);opacity:0}}</style>
        <div style="position:absolute;top:10px;width:44px;height:44px;border-radius:50%;background:${color};opacity:0.5;animation:pd-pin-pulse 2s ease-out infinite;"></div>
        <div style="width:40px;height:40px;margin-top:4px;display:flex;align-items:center;justify-content:center;background:linear-gradient(145deg,${color},#5646C9);border-radius:50%;border:2px solid rgba(255,255,255,0.75);box-shadow:0 0 22px ${color}B3,0 6px 16px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.35);">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <div style="width:7px;height:7px;background:${color};border-radius:50%;margin-top:-3px;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.4));"></div>
      </div>
    `,
  });
}

const DEFAULT_CENTER: [number, number] = [46.2276, 2.2137];

interface LocationMapProps {
  latitude: number;
  longitude: number;
  onLatitudeChange: (v: number) => void;
  onLongitudeChange: (v: number) => void;
}

function MapClickHandler({ onClick }: { onClick: (latlng: L.LatLng) => void }) {
  useMapEvents({ click(e) { onClick(e.latlng); } });
  return null;
}
function MapViewSync({ center }: { center: [number, number] }) {
  const map = useMap();
  const prev = useRef(center);
  useEffect(() => { if (prev.current[0] !== center[0] || prev.current[1] !== center[1]) { map.setView(center, map.getZoom()); prev.current = center; } }, [center, map]);
  return null;
}

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const c = map.getContainer();
        if (c?.isConnected && (map as any)._mapPane) map.invalidateSize();
      } catch {}
    }, 220);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function StageZoomControls({ mapRef }: { mapRef: React.MutableRefObject<LeafletMap | null> }) {
  const map = useMap();
  useEffect(() => { mapRef.current = map; return () => { if (mapRef.current === map) mapRef.current = null; }; }, [map, mapRef]);
  return null;
}

function MapContent({ latitude, longitude, onLocationSelect, height, zoomControl = true, mapRefSet }: {
  latitude: number; longitude: number; onLocationSelect: (lat: number, lng: number) => void; height: number; zoomControl?: boolean; mapRefSet?: (m: LeafletMap | null) => void;
}) {
  const center: [number, number] = latitude !== 0 || longitude !== 0 ? [latitude, longitude] : DEFAULT_CENTER;
  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-xl">
      <MapContainer
        center={center}
        zoom={13}
        className="w-full h-full"
        scrollWheelZoom
        zoomControl={zoomControl}
        ref={mapRefSet as any}
      >
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <InvalidateSize />
        <MapClickHandler onClick={(latlng) => onLocationSelect(latlng.lat, latlng.lng)} />
        <MapViewSync center={center} />
        {(latitude !== 0 || longitude !== 0) && <Marker position={[latitude, longitude]} icon={defaultIcon} />}
      </MapContainer>
    </div>
  );
}

function StageMapContent({ latitude, longitude, onLocationSelect, height, dark, mapRef }: {
  latitude: number; longitude: number; onLocationSelect: (lat: number, lng: number) => void; height: number; dark: boolean; mapRef: React.MutableRefObject<LeafletMap | null>;
}) {
  const center: [number, number] = latitude !== 0 || longitude !== 0 ? [latitude, longitude] : DEFAULT_CENTER;
  const pinColor = dark ? '#A78BFA' : '#14B8A6';
  return (
    <div style={{ height }} className={`relative w-full overflow-hidden rounded-xl ${dark ? 'pd-map-dark' : ''}`}>
      <style>{`.pd-map-dark .leaflet-tile{filter:invert(1) hue-rotate(190deg) brightness(0.92) contrast(0.92) saturate(0.65)}.pd-map-dark .leaflet-tile-pane{background:#0B1022}`}</style>
      <MapContainer
        center={center}
        zoom={13}
        className="w-full h-full bg-transparent"
        scrollWheelZoom
        zoomControl={false}
      >
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <InvalidateSize />
        <StageZoomControls mapRef={mapRef} />
        <MapClickHandler onClick={(latlng) => onLocationSelect(latlng.lat, latlng.lng)} />
        <MapViewSync center={center} />
        {(latitude !== 0 || longitude !== 0) && <Marker position={[latitude, longitude]} icon={stageMarkerIcon(pinColor)} />}
      </MapContainer>
      {/* coords chip */}
      <div
        className={`absolute left-3 top-3 z-[400] rounded-lg border px-2.5 py-1 font-mono text-[10px] font-semibold tabular-nums backdrop-blur-md ${dark ? 'text-slate-300' : 'text-slate-600'}`}
        style={{ borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.10)', background: dark ? 'rgba(10,15,36,0.72)' : 'rgba(255,255,255,0.85)' }}
      >
        {latitude !== 0 || longitude !== 0 ? `${Number(latitude).toFixed(5)}° , ${Number(longitude).toFixed(5)}°` : '— , —'}
      </div>
      {/* zoom rail */}
      <div
        className="absolute right-3 top-1/2 z-[400] flex -translate-y-1/2 flex-col overflow-hidden rounded-xl border backdrop-blur-xl"
        style={{ borderColor: dark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.12)', background: dark ? 'rgba(10,15,36,0.78)' : 'rgba(255,255,255,0.85)', boxShadow: dark ? '0 10px 30px -12px rgba(0,0,0,0.7)' : '0 10px 30px -14px rgba(13,148,136,0.45)' }}
      >
        {[
          { l: '+', t: 'Zoom avant', fn: () => mapRef.current?.zoomIn() },
          { l: '−', t: 'Zoom arrière', fn: () => mapRef.current?.zoomOut() },
        ].map((b, i) => (
          <button key={i} type="button" aria-label={b.t} onClick={b.fn} className={`relative flex h-8 w-8 items-center justify-center text-base font-bold transition-colors active:scale-90 ${dark ? 'text-slate-200 hover:bg-white/10' : 'text-slate-600 hover:bg-teal-900/[0.06]'}`}>
            {i === 1 && <span aria-hidden className="absolute inset-x-2 top-0 h-px" style={{ background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.10)' }} />}
            {b.l}
          </button>
        ))}
      </div>
      {/* HUD */}
      <div
        className="absolute bottom-3 left-1/2 z-[400] max-w-[90%] -translate-x-1/2 rounded-xl border px-3 py-1.5 text-center backdrop-blur-xl"
        style={{ borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)', background: dark ? 'rgba(10,15,36,0.82)' : 'rgba(255,255,255,0.88)', boxShadow: '0 8px 26px -10px rgba(0,0,0,0.5)' }}
      >
        <p className={`text-xs font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{latitude !== 0 || longitude !== 0 ? 'Cliquez pour repositionner le marqueur' : 'Cliquez sur la carte pour placer le bien'}</p>
      </div>
    </div>
  );
}

export function LocationMap({ latitude, longitude, onLatitudeChange, onLongitudeChange }: LocationMapProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { staged, dark } = useStageChrome();
  const mapRef = useRef<LeafletMap | null>(null);
  const modalMapRef = useRef<LeafletMap | null>(null);
  const handleLocationSelect = (lat: number, lng: number) => {
    onLatitudeChange(Math.round(lat * 1000000) / 1000000);
    onLongitudeChange(Math.round(lng * 1000000) / 1000000);
  };

  if (staged) {
    return (
      <>
        <div
          className="relative overflow-hidden rounded-2xl border p-3"
          style={{
            borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.10)',
            background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)',
            boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 60px -28px rgba(2,4,18,0.95)' : 'inset 0 1px 0 rgba(255,255,255,0.9), 0 24px 60px -30px rgba(13,148,136,0.45)',
          }}
        >
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg border ${dark ? 'border-white/10 bg-white/5 text-violet-300' : 'border-teal-900/10 bg-white text-teal-700'}`}>
                <Navigation size={13} />
              </span>
              <div>
                <p className={`text-xs font-bold uppercase tracking-[0.14em] ${dark ? 'text-slate-400' : 'text-teal-900/55'}`}>Localisation</p>
                <p className={`text-[11px] ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>Cliquez pour positionner</p>
              </div>
            </div>
            <button type="button" onClick={() => setModalOpen(true)} className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold transition-colors active:scale-95 ${dark ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white' : 'border-teal-900/10 bg-white/70 text-teal-700 hover:bg-white'}`}>
              <Maximize2 size={12} /> Agrandir
            </button>
          </div>
          <StageMapContent latitude={latitude} longitude={longitude} onLocationSelect={handleLocationSelect} height={260} dark={dark} mapRef={mapRef} />
          <p className={`mt-2 flex items-center gap-1.5 text-[11px] ${dark ? 'text-slate-600' : 'text-teal-900/30'}`}><Layers size={11} /> Molette pour zoomer · glisser pour naviguer · clic pour marquer</p>
        </div>
        <AnimatePresence>
          {modalOpen && (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalOpen(false)}>
              <motion.div className={`relative w-full max-w-6xl overflow-hidden rounded-3xl border shadow-2xl ${dark ? 'border-white/10 bg-[#0B1022]' : 'border-white/60 bg-white'}`} initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }} onClick={e => e.stopPropagation()}>
                <div className="absolute right-4 top-4 z-[500] flex gap-2">
                  <div className={`rounded-lg border px-3 py-1 font-mono text-xs backdrop-blur-md ${dark ? 'border-white/10 bg-black/30 text-slate-300' : 'border-teal-900/10 bg-white/80 text-slate-600'}`}>Lat: {latitude.toFixed(5)} · Lng: {longitude.toFixed(5)}</div>
                  <button type="button" onClick={() => setModalOpen(false)} className={`flex h-8 w-8 items-center justify-center rounded-xl border backdrop-blur-md transition-colors active:scale-95 ${dark ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white' : 'border-teal-900/10 bg-white text-teal-700 hover:bg-teal-50'}`}><X size={14} /></button>
                </div>
                <div className="p-2">
                  <StageMapContent latitude={latitude} longitude={longitude} onLocationSelect={handleLocationSelect} height={560} dark={dark} mapRef={modalMapRef} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <div className="p-4 rounded-lg bg-background/50 border border-border/30">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm text-text">Localisation sur la carte</h4>
          <button type="button" onClick={() => setModalOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-all">
            <Maximize2 size={12} /> Agrandir
          </button>
        </div>
        <MapContent latitude={latitude} longitude={longitude} onLocationSelect={handleLocationSelect} height={220} />
        <p className="text-xs text-text-secondary mt-2">Cliquez sur la carte pour positionner le bien</p>
      </div>
      <AnimatePresence>
        {modalOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="relative w-[90vw] h-[85vh] max-w-6xl bg-card rounded-2xl shadow-2xl border border-border/40 overflow-hidden" initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}>
              <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-card text-text border border-border/40 hover:bg-background shadow-lg"><X size={14} />Fermer</button>
              </div>
              <MapContent latitude={latitude} longitude={longitude} onLocationSelect={handleLocationSelect} height={500} />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-card/90 backdrop-blur-sm border border-border/40 rounded-lg px-4 py-2 shadow-lg text-sm text-text flex items-center gap-4"><span>Lat: {latitude}</span><span className="text-text-secondary">|</span><span>Lng: {longitude}</span></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
