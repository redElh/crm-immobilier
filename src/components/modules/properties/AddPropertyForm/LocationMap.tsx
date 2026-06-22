import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER: [number, number] = [46.2276, 2.2137];

interface LocationMapProps {
  latitude: number;
  longitude: number;
  onLatitudeChange: (v: number) => void;
  onLongitudeChange: (v: number) => void;
}

function MapClickHandler({ onClick }: { onClick: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

function MapViewSync({ center }: { center: [number, number] }) {
  const map = useMap();
  const prev = useRef(center);
  useEffect(() => {
    if (prev.current[0] !== center[0] || prev.current[1] !== center[1]) {
      map.setView(center, map.getZoom());
      prev.current = center;
    }
  }, [center, map]);
  return null;
}

function MapContent({ latitude, longitude, onLocationSelect, height }: {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lng: number) => void;
  height: number;
}) {
  const center: [number, number] =
    latitude !== 0 || longitude !== 0 ? [latitude, longitude] : DEFAULT_CENTER;

  return (
    <div style={{ height }} className="w-full rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={13}
        className="w-full h-full"
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onClick={(latlng) => onLocationSelect(latlng.lat, latlng.lng)} />
        <MapViewSync center={center} />
        {(latitude !== 0 || longitude !== 0) && (
          <Marker position={[latitude, longitude]} icon={defaultIcon} />
        )}
      </MapContainer>
    </div>
  );
}

export function LocationMap({ latitude, longitude, onLatitudeChange, onLongitudeChange }: LocationMapProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleLocationSelect = (lat: number, lng: number) => {
    onLatitudeChange(Math.round(lat * 1000000) / 1000000);
    onLongitudeChange(Math.round(lng * 1000000) / 1000000);
  };

  return (
    <>
      <div className="p-4 rounded-lg bg-background/50 border border-border/30">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm text-text">Localisation sur la carte</h4>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Agrandir
          </button>
        </div>
        <MapContent
          latitude={latitude}
          longitude={longitude}
          onLocationSelect={handleLocationSelect}
          height={220}
        />
        <p className="text-xs text-text-secondary mt-2">Cliquez sur la carte pour positionner le bien</p>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="relative w-[90vw] h-[85vh] max-w-6xl bg-card rounded-2xl shadow-2xl border border-border/40 overflow-hidden"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-card text-text border border-border/40 hover:bg-background shadow-lg transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Fermer
                </button>
              </div>
              <MapContent
                latitude={latitude}
                longitude={longitude}
                onLocationSelect={handleLocationSelect}
                height={500}
              />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-card/90 backdrop-blur-sm border border-border/40 rounded-lg px-4 py-2 shadow-lg text-sm text-text flex items-center gap-4">
                <span>Lat: {latitude}</span>
                <span className="text-text-secondary">|</span>
                <span>Lng: {longitude}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
