import { useNavigate, useParams } from 'react-router-dom';
import { useState, useMemo, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Sliders, X, Grid, List, Lock, Home, MapPin, Maximize2,
  User, Hash, Briefcase, Sun, Percent, ArrowUpRight,
  RotateCcw, TrendingUp, Filter, BarChart2, Shield, ShieldOff, AlertTriangle, ChevronLeft
} from 'react-feather';
import { fetchProperties } from '../../services/propertyService';
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS, STATUS_LABELS } from '../../types/property';
import type { Property } from '../../types/property';
import { ConfidentialProvider, useOptionalConfidential } from '../../components/modules/confidentiality/ConfidentialContext';
import { DraftSection } from '../../components/modules/properties/DraftSection';
import { PropertyCompletionModal } from '../../components/modules/properties/PropertyCompletionModal';
import { api } from '../../services/api';
import { usePermission, useRestriction } from '../../hooks/usePermission';
import { BackLink } from '../../components/ui/BackLink';
import { useStageChrome } from '../../components/modules/calendar/useStageChrome';
import {
  Stage, StageTabs, StageBadge,
  StageButton, OrbIcon, TiltCard, STAGE_HUES, useStageTheme,
  ShimmerProgress, AnimatedNumber, GlowSparkline
} from '../../components/dashboard/Stage';
import type { StageHue } from '../../components/dashboard/Stage';
import { Select } from '../../components/ui/Select';

/* ──────────────────────────────────────────────────────────────
   Constants
────────────────────────────────────────────────────────────── */

const CITY_GROUPS: Record<string, string[]> = {
  Essaouira: [
    'Argana', 'Azlef', 'Douar Laraab', 'Erraounak', 'Ghazoua', 'Medina',
    'Ounagha', 'Arbaa Ida Ougourd', 'Sidi Kaouki', 'Sidi Magdoul',
    'Sidi Ahmed Essayeh', 'Tidzi',
  ],
};

const TOP_CITIES = ['Essaouira', 'Marrakech', 'Agadir'];

const SLATE_HUE: StageHue = {
  a: '#94A3B8', b: '#475569', glow: 'rgba(148,163,184,0.40)', line: '#94A3B8',
};

const TYPE_HUE_MAP: Record<string, StageHue> = {
  residential: STAGE_HUES.violet,
  commercial: STAGE_HUES.sky,
  land: STAGE_HUES.emerald,
  vacation: STAGE_HUES.amber,
  luxury: STAGE_HUES.fuchsia,
};

const STATUS_HUE_MAP: Record<string, StageHue> = {
  for_sale: STAGE_HUES.emerald,
  for_rent: STAGE_HUES.emerald,
  for_sale_or_rent: STAGE_HUES.emerald,
  mandate_pending: STAGE_HUES.amber,
  negotiation: STAGE_HUES.amber,
  under_compromise: STAGE_HUES.fuchsia,
  under_promise: STAGE_HUES.fuchsia,
  signing: STAGE_HUES.amber,
  sold: STAGE_HUES.sky,
  rented: STAGE_HUES.violet,
  sold_or_rented: STAGE_HUES.sky,
  available: STAGE_HUES.emerald,
  option: STAGE_HUES.amber,
  reserved: STAGE_HUES.fuchsia,
  occupied: STAGE_HUES.violet,
  unavailable: SLATE_HUE,
  confidential: SLATE_HUE,
  urbanism: STAGE_HUES.amber,
  withdrawn: { a: '#F87171', b: '#B91C1C', glow: 'rgba(248,113,113,0.4)', line: '#F87171' },
};

const TRANSACTION_HUE_MAP: Record<string, StageHue> = {
  vente: STAGE_HUES.emerald,
  location_ld: STAGE_HUES.sky,
  location_saisonniere: STAGE_HUES.amber,
};

/* ──────────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────────── */

const formatPrice = (p: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(p);

const getDisplayPrice = (p: any) => {
  if (p?.prixNetVendeur && p?.honorairesPct && p?.honorairesType === 'inclus') {
    return Math.round(Number(p.prixNetVendeur) * (1 + Number(p.honorairesPct) / 100));
  }
  return p?.prixNetVendeur || p?.price || 0;
};

/* ──────────────────────────────────────────────────────────────
   PropertyCardStage — Futuristic property card with TiltCard
────────────────────────────────────────────────────────────── */

function PropertyCardStage({ property, index }: { property: Property; index: number }) {
  const navigate = useNavigate();
  const { agentId, adminId, type } = useParams<{ agentId?: string; adminId?: string; type?: string }>();
  const { revealed } = useOptionalConfidential();
  const restricted = useRestriction('biens-info-privees');
  const canSeeName = usePermission('biens-afficher-nom-contact');
  const canWrite = usePermission('biens-ecriture');
  const theme = useStageTheme();
  const isDark = theme === 'dark';
  const [showCompletion, setShowCompletion] = useState(false);
  const [display, setDisplay] = useState<Property>(property);

  useEffect(() => { setDisplay(property); }, [property]);

  const typeHue = TYPE_HUE_MAP[property.propertyType] || STAGE_HUES.violet;
  const statusHue = STATUS_HUE_MAP[property.status] || SLATE_HUE;
  const transHue = TRANSACTION_HUE_MAP[property.transactionType] || STAGE_HUES.violet;
  const completion = display.completion;
  const completionHue = completion != null
    ? completion >= 80 ? STAGE_HUES.emerald : completion >= 50 ? STAGE_HUES.amber : { a: '#F87171', b: '#B91C1C', glow: 'rgba(248,113,113,0.4)', line: '#F87171' }
    : null;

  const isSeasonal = property.transactionType === 'location_saisonniere';
  const displayPrice = property.transactionType === 'location_ld'
    ? (property.loyerHC || 0)
    : isSeasonal
      ? (property.seasonalPriceMin || 0)
      : getDisplayPrice(property);

  const ownerName = property.owner?.name
    || [(property.owner as any)?.firstName, (property.owner as any)?.lastName].filter(Boolean).join(' ')
    || [(property as any).owner_firstName, (property as any).owner_lastName].filter(Boolean).join(' ')
    || '';

  const handleNavigate = () => {
    if (restricted) return;
    const propType = type || property.propertyType || 'residential';
    if (adminId) navigate(`/admin/${adminId}/properties/type/${propType}/${property.id}`);
    else if (agentId) navigate(`/${agentId}/properties/type/${propType}/${property.id}`);
    else navigate(`/properties/${property.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
    >
      <TiltCard className="h-full" onClick={handleNavigate}>
        <div className="relative flex flex-col h-full">
          {/* ── Image Section ── */}
          <div className="relative h-44 overflow-hidden">
            {property.images?.[0] ? (
              <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full"
                style={{
                  background: isDark
                    ? `linear-gradient(135deg, ${typeHue.a}15, ${typeHue.b}08)`
                    : `linear-gradient(135deg, ${typeHue.a}12, ${typeHue.b}06)`,
                }}
              >
                <OrbIcon icon={Home} hue={typeHue} size={52} radius={16} />
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 pointer-events-none"
              style={{
                background: isDark
                  ? 'linear-gradient(to top, rgba(10,15,36,0.95) 0%, transparent 50%)'
                  : 'linear-gradient(to top, rgba(255,255,255,0.95) 0%, transparent 50%)',
              }}
            />

            {/* Status badge */}
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg backdrop-blur-md"
                style={{
                  background: isDark ? `${statusHue.a}35` : `${statusHue.a}28`,
                  color: '#fff',
                  border: `1px solid ${statusHue.a}66`,
                  boxShadow: `0 2px 8px ${statusHue.glow}`,
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusHue.line, boxShadow: `0 0 6px ${statusHue.glow}` }} />
                {STATUS_LABELS[property.status] || property.status}
              </span>
            </div>

            {/* Transaction badge */}
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg backdrop-blur-md"
                style={{
                  background: isDark ? `${transHue.a}35` : `${transHue.a}30`,
                  color: '#fff',
                  border: `1px solid ${transHue.a}66`,
                  boxShadow: `0 2px 8px ${transHue.glow}`,
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: transHue.line, boxShadow: `0 0 6px ${transHue.glow}` }} />
                {TRANSACTION_TYPE_LABELS[property.transactionType] || property.transactionType}
              </span>
            </div>

            {/* Restricted overlay */}
            {restricted && (
              <div className="absolute inset-0 backdrop-blur-[6px] flex flex-col items-center justify-center gap-2"
                style={{ backgroundColor: isDark ? 'rgba(10,15,36,0.8)' : 'rgba(255,255,255,0.8)' }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.1)'}`,
                  }}
                >
                  <Lock size={18} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                </div>
                <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bien verrouillé</span>
              </div>
            )}

            {/* Price overlay */}
            {!restricted && (
              <div className="absolute bottom-3 left-3 right-3">
                {property.prixSurDemande ? (
                  <span className="text-lg font-extrabold tracking-tight" style={{ color: typeHue.a }}>
                    Prix sur demande
                  </span>
                ) : displayPrice ? (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-extrabold tracking-tight" style={{ color: isDark ? '#FFF' : '#0F172A' }}>
                      {revealed ? formatPrice(displayPrice) : '••••••••'}
                    </span>
                    {isSeasonal && <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/nuit</span>}
                    {property.transactionType === 'location_ld' && <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/mois</span>}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* ── Content ── */}
          <div className="flex-1 p-4 flex flex-col min-h-0">
            {/* Reference */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <Hash size={10} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
              <span className={`text-[11px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{property.reference}</span>
            </div>

            {/* Title */}
            <h3 className={`font-bold text-sm leading-snug line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {property.title}
            </h3>

            {/* Location */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <MapPin size={11} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
              <span className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {property.city}{property.district ? ` · ${property.district}` : ''}
              </span>
            </div>

            {/* Type + State */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-md"
                style={{
                  background: `${typeHue.a}15`,
                  color: typeHue.a,
                  border: `1px solid ${typeHue.a}28`,
                }}
              >
                {PROPERTY_TYPE_LABELS[property.propertyType]}
              </span>
              {property.mandateType && (
                <span className={`text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {property.mandateType}
                </span>
              )}
            </div>

            {/* Details */}
            <div className={`flex items-center gap-3 mt-3 pt-3 border-t ${isDark ? 'border-white/8' : 'border-slate-200/60'}`}>
              <div className="flex items-center gap-1">
                <Maximize2 size={11} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                <span className={`text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{property.surface} m²</span>
              </div>
              <div className="flex items-center gap-1">
                <Grid size={11} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                <span className={`text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {((property as any).bathroom_count ?? property.bathrooms)} sdb
                </span>
              </div>
              {((property as any).bedrooms_total ?? property.bedrooms) > 0 && (
                <div className="flex items-center gap-1">
                  <Home size={11} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                  <span className={`text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {((property as any).bedrooms_total ?? property.bedrooms)} ch.
                  </span>
                </div>
              )}
              {property.sleepingCapacity && property.propertyType === 'vacation' && (
                <div className="flex items-center gap-1">
                  <Sun size={11} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                  <span className={`text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {property.sleepingCapacity} pers.
                  </span>
                </div>
              )}
            </div>

            {/* Owner */}
            {ownerName && (
              <div className={`flex items-center gap-2 mt-2 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <User size={11} />
                <span className="truncate">{revealed && canSeeName ? ownerName : '••••••••'}</span>
              </div>
            )}

            {/* Completion bar */}
            <div className="mt-auto pt-3">
              {completion != null && completionHue ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Complétion
                    </span>
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: completionHue.a }}>
                      {completion}%
                    </span>
                  </div>
                  <ShimmerProgress
                    pct={completion}
                    colorFrom={completionHue.a}
                    colorTo={completionHue.b}
                    glow={completionHue.glow}
                    height={5}
                  />
                </div>
              ) : (
                <div className={`flex items-center justify-center py-1.5 text-[10px] font-semibold uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>
                  Complétion
                </div>
              )}
            </div>
          </div>

          {/* Completion button */}
          {canWrite && (
            <div className={`px-4 pb-3`}>
              <button
                type="button"
                title="Suivi de complétion"
                onClick={(e) => { e.stopPropagation(); setShowCompletion(true); }}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all duration-200"
                style={{
                  background: completionHue ? `${completionHue.a}12` : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)',
                  border: `1px solid ${completionHue ? `${completionHue.a}28` : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)'}`,
                  color: completionHue ? completionHue.a : isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)',
                }}
              >
                <Percent size={12} />
                Complétion
              </button>
            </div>
          )}
        </div>

        <PropertyCompletionModal
          property={display}
          isOpen={showCompletion}
          onClose={() => setShowCompletion(false)}
          onSaved={(updated) => setDisplay(updated)}
        />
      </TiltCard>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────
   PropertyRowStage — Futuristic list-view row
────────────────────────────────────────────────────────────── */

function PropertyRowStage({ property, index }: { property: Property; index: number }) {
  const navigate = useNavigate();
  const { agentId, adminId, type } = useParams<{ agentId?: string; adminId?: string; type?: string }>();
  const { revealed } = useOptionalConfidential();
  const restricted = useRestriction('biens-info-privees');
  const theme = useStageTheme();
  const isDark = theme === 'dark';
  const typeHue = TYPE_HUE_MAP[property.propertyType] || STAGE_HUES.violet;
  const statusHue = STATUS_HUE_MAP[property.status] || SLATE_HUE;

  const isSeasonal = property.transactionType === 'location_saisonniere';
  const displayPrice = property.transactionType === 'location_ld'
    ? (property.loyerHC || 0)
    : isSeasonal
      ? (property.seasonalPriceMin || 0)
      : getDisplayPrice(property);

  const handleNavigate = () => {
    if (restricted) return;
    const propType = type || property.propertyType || 'residential';
    if (adminId) navigate(`/admin/${adminId}/properties/type/${propType}/${property.id}`);
    else if (agentId) navigate(`/${agentId}/properties/type/${propType}/${property.id}`);
    else navigate(`/properties/${property.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.02, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative flex items-center gap-4 px-5 py-3.5 transition-all duration-200 cursor-pointer ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50/80'}`}
      onClick={handleNavigate}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(to bottom, ${typeHue.a}, ${typeHue.b})`, boxShadow: `0 0 8px ${typeHue.glow}` }}
      />

      {/* Thumbnail */}
      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border"
        style={{
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
          background: isDark
            ? `linear-gradient(135deg, ${typeHue.a}18, ${typeHue.b}08)`
            : `linear-gradient(135deg, ${typeHue.a}12, ${typeHue.b}06)`,
        }}
      >
        {property.images?.[0] ? (
          <img src={property.images[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Home size={16} style={{ color: typeHue.a, opacity: 0.5 }} />
          </div>
        )}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{property.reference}</span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md"
            style={{ background: `${typeHue.a}18`, color: typeHue.a, border: `1px solid ${typeHue.a}25` }}
          >
            {PROPERTY_TYPE_LABELS[property.propertyType]}
          </span>
        </div>
        <h4 className={`text-sm font-semibold truncate mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {property.title}
        </h4>
        <div className="flex items-center gap-1.5 mt-0.5">
          <MapPin size={10} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
          <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {property.city}
          </span>
        </div>
      </div>

      {/* Specs */}
      <div className={`hidden md:flex items-center gap-3 text-[11px] w-[180px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        <span className="flex items-center gap-1">
          <Maximize2 size={10} />
          {property.surface} m²
        </span>
        <span className={`w-px h-3 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
        <span className="flex items-center gap-1">
          <Grid size={10} />
          {((property as any).bathroom_count ?? property.bathrooms)} sdb
        </span>
        {((property as any).bedrooms_total ?? property.bedrooms) > 0 && (
          <>
            <span className={`w-px h-3 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
            <span className="flex items-center gap-1">
              <Home size={10} />
              {((property as any).bedrooms_total ?? property.bedrooms)} ch.
            </span>
          </>
        )}
      </div>

      {/* Price */}
      <div className="text-right w-[120px] flex-shrink-0">
        {property.prixSurDemande ? (
          <span className="text-xs font-bold" style={{ color: typeHue.a }}>Sur demande</span>
        ) : displayPrice ? (
          <span className={`text-xs font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {revealed ? formatPrice(displayPrice) : '••••••••'}
          </span>
        ) : null}
      </div>

      {/* Status */}
      <div className="w-[120px] flex-shrink-0">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md"
          style={{
            background: isDark ? `${statusHue.a}25` : `${statusHue.a}20`,
            color: isDark ? '#fff' : statusHue.b,
            border: `1px solid ${statusHue.a}40`,
          }}
        >
          <span className="h-1 w-1 rounded-full" style={{ background: statusHue.line, boxShadow: `0 0 4px ${statusHue.glow}` }} />
          {STATUS_LABELS[property.status] || property.status}
        </span>
      </div>

      {/* Completion */}
      <div className="hidden lg:flex w-[60px] flex-shrink-0 justify-center">
        {property.completion != null ? (
          <span className="text-[11px] font-bold tabular-nums"
            style={{ color: property.completion >= 80 ? STAGE_HUES.emerald.a : property.completion >= 50 ? STAGE_HUES.amber.a : '#F87171' }}
          >
            {property.completion}%
          </span>
        ) : (
          <span className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>—</span>
        )}
      </div>

      {/* Arrow */}
      <div className="w-[20px] flex-shrink-0 flex justify-center">
        <ArrowUpRight size={13} className={`opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────
   StageConfidentialBanner — Futuristic confidentiality toggle
────────────────────────────────────────────────────────────── */

function StageConfidentialBanner({ isDark, typeHue }: { isDark: boolean; typeHue: StageHue }) {
  const { revealed, reveal, hide } = useOptionalConfidential();
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-xl border"
        style={{
          background: revealed
            ? isDark ? 'rgba(251,191,36,0.08)' : 'rgba(251,191,36,0.06)'
            : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
          borderColor: revealed
            ? isDark ? 'rgba(251,191,36,0.25)' : 'rgba(251,191,36,0.3)'
            : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
          backdropFilter: 'blur(12px)',
          boxShadow: revealed
            ? isDark ? '0 4px 20px rgba(251,191,36,0.12)' : '0 4px 20px rgba(251,191,36,0.08)'
            : isDark ? 'inset 0 1px 0 rgba(255,255,255,0.04)' : 'inset 0 1px 0 rgba(255,255,255,0.8)',
        }}
      >
        {/* Glow accent */}
        {revealed && (
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${STAGE_HUES.amber.glow}, transparent 70%)`, opacity: 0.4 }}
          />
        )}

        <div className="relative flex items-center gap-4 p-4">
          {/* Icon orb */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: revealed
                  ? `linear-gradient(135deg, ${STAGE_HUES.amber.a}, ${STAGE_HUES.amber.b})`
                  : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
                border: `1px solid ${revealed ? 'rgba(251,191,36,0.3)' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'}`,
                boxShadow: revealed ? `0 4px 12px ${STAGE_HUES.amber.glow}` : 'none',
              }}
            >
              {revealed ? (
                <ShieldOff size={18} className="text-white" />
              ) : (
                <Shield size={18} style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)' }} />
              )}
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Informations confidentielles
              </h4>
              {revealed && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md"
                  style={{
                    background: `${STAGE_HUES.amber.a}20`,
                    color: STAGE_HUES.amber.a,
                    border: `1px solid ${STAGE_HUES.amber.a}35`,
                  }}
                >
                  <span className="h-1 w-1 rounded-full" style={{ background: STAGE_HUES.amber.line, boxShadow: `0 0 6px ${STAGE_HUES.amber.glow}` }} />
                  Dévoilées
                </span>
              )}
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {revealed
                ? 'Les prix et informations sensibles sont visibles'
                : 'Masquez les prix et informations sensibles des biens'
              }
            </p>
          </div>

          {/* Action */}
          {revealed ? (
            <button
              onClick={hide}
              className="shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-semibold transition-all duration-200 border"
              style={{
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)',
                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Lock size={12} />
              Masquer
            </button>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold text-white transition-all duration-200"
              style={{
                background: `linear-gradient(135deg, ${STAGE_HUES.amber.a}, ${STAGE_HUES.amber.b})`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 12px -4px ${STAGE_HUES.amber.glow}`,
              }}
            >
              <AlertTriangle size={12} />
              Afficher les infos confidentielles
            </button>
          )}
        </div>
      </motion.div>

      {/* Confirm modal — portaled to body */}
      {createPortal(
        <AnimatePresence>
          {showConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
              style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
              onClick={() => setShowConfirm(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-sm rounded-2xl border overflow-hidden"
                style={{
                  background: isDark
                    ? 'linear-gradient(180deg, rgba(17,24,50,0.95), rgba(9,13,30,0.97))'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.97), rgba(240,253,250,0.95))',
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)',
                  backdropFilter: 'blur(24px)',
                  boxShadow: isDark
                    ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 60px -18px rgba(0,0,0,0.85)'
                    : 'inset 0 1px 0 rgba(255,255,255,1), 0 24px 55px -20px rgba(13,148,136,0.45)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top accent beam */}
                <div className="h-[3px] w-full"
                  style={{ background: `linear-gradient(90deg, transparent, ${STAGE_HUES.amber.a}, ${STAGE_HUES.amber.b}, transparent)` }}
                />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${STAGE_HUES.amber.a}30, ${STAGE_HUES.amber.b}18)`,
                        border: `1px solid ${STAGE_HUES.amber.a}30`,
                        boxShadow: `0 4px 12px ${STAGE_HUES.amber.glow}`,
                      }}
                    >
                      <AlertTriangle size={18} style={{ color: STAGE_HUES.amber.a }} />
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Afficher les informations ?
                      </h3>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Les prix et données sensibles seront visibles
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="h-9 px-4 rounded-xl text-xs font-semibold border transition-all duration-200"
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)',
                        color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)',
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => { reveal(); setShowConfirm(false); }}
                      className="h-9 px-4 rounded-xl text-xs font-bold text-white transition-all duration-200"
                      style={{
                        background: `linear-gradient(135deg, ${STAGE_HUES.amber.a}, ${STAGE_HUES.amber.b})`,
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 12px -4px ${STAGE_HUES.amber.glow}`,
                      }}
                    >
                      Confirmer
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   Main Page Component
────────────────────────────────────────────────────────────── */

export default function PropertiesPageWithType() {
  const navigate = useNavigate();
  const { type, agentId } = useParams<{ type: string; agentId: string }>();
  const canRead = usePermission('biens-lecture');
  const canWrite = usePermission('biens-ecriture');
  const { staged, dark } = useStageChrome();
  const theme = useStageTheme();
  const isDark = theme === 'dark';

  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    api.get<any>('/auth/me')
      .then(u => u && setCurrentUserId(String(u.id)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    setLoading(true);
    fetchProperties({ agent_id: currentUserId })
      .then(setAllProperties)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUserId]);

  /* ── Filter state ── */
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [transactionFilter, setTransactionFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [citySubFilter, setCitySubFilter] = useState<string>('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [surfaceMin, setSurfaceMin] = useState('');
  const [surfaceMax, setSurfaceMax] = useState('');
  const [bedroomsMin, setBedroomsMin] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const typeLabel = ({ residential: 'Résidentiel', commercial: 'Commercial', land: 'Terrains', vacation: 'Vacances', luxury: 'Luxe' } as Record<string, string>)[type || ''] || '';
  const typeHue = TYPE_HUE_MAP[type || ''] || STAGE_HUES.violet;

  const STATUS_BY_TYPE: Record<string, string[]> = {
    residential: ['for_sale', 'for_rent', 'mandate_pending', 'negotiation', 'under_compromise', 'signing', 'sold', 'rented', 'withdrawn'],
    commercial: ['for_sale_or_rent', 'negotiation', 'under_promise', 'sold_or_rented', 'withdrawn'],
    land: ['for_sale', 'under_promise', 'urbanism', 'sold', 'withdrawn'],
    vacation: ['available', 'option', 'reserved', 'occupied', 'unavailable', 'withdrawn'],
    luxury: ['for_sale_or_rent', 'confidential', 'negotiation', 'sold_or_rented', 'withdrawn'],
  };

  const TRANSACTION_BY_TYPE: Record<string, string[]> = {
    residential: ['vente', 'location_ld'],
    commercial: ['vente', 'location_ld'],
    land: ['vente'],
    vacation: ['location_saisonniere'],
    luxury: ['vente', 'location_ld'],
  };

  function getStatusOptions() {
    const statuses = type ? (STATUS_BY_TYPE[type] || Object.keys(STATUS_LABELS)) : Object.keys(STATUS_LABELS);
    return [
      { value: 'all', label: 'Tous les statuts' },
      ...statuses.map(v => ({ value: v, label: STATUS_LABELS[v] || v })),
    ];
  }

  function getTransactionOptions() {
    if (!type) {
      return [
        { value: 'all', label: 'Toutes les transactions' },
        ...Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => ({ value, label })),
      ];
    }
    const transactions = TRANSACTION_BY_TYPE[type] || [];
    return [
      { value: 'all', label: 'Toutes les transactions' },
      ...transactions.map(v => ({ value: v, label: TRANSACTION_TYPE_LABELS[v as keyof typeof TRANSACTION_TYPE_LABELS] || v })),
    ];
  }

  const statusOptions = getStatusOptions();
  const transactionOptions = getTransactionOptions();
  const typeOptions = [
    { value: 'all', label: 'Tous les types' },
    ...Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({ value, label })),
  ];
  const cityOptions = [
    { value: 'all', label: 'Toutes les villes' },
    ...TOP_CITIES.map(c => ({
      value: c,
      label: CITY_GROUPS[c] ? `${c} ▸` : c,
    })),
  ];
  const subCityOptions = cityFilter === 'Essaouira'
    ? [{ value: 'all', label: 'Toutes les localités' }, ...CITY_GROUPS['Essaouira'].map(c => ({ value: c, label: c }))]
    : [];

  /* ── Filtered properties ── */
  const filteredProperties = useMemo(() => {
    return allProperties
      .filter((p: any) => type ? p.propertyType === type : true)
      .filter(p =>
        !searchTerm ||
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.reference.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(p => statusFilter === 'all' || p.status === statusFilter)
      .filter(p => typeFilter === 'all' || type === undefined || p.propertyType === typeFilter)
      .filter(p => transactionFilter === 'all' || p.transactionType === transactionFilter)
      .filter(p => {
        if (cityFilter === 'all') return true;
        if (cityFilter === 'Essaouira') return citySubFilter === 'all' || p.city === citySubFilter;
        return p.city === cityFilter;
      })
      .filter(p => !priceMin || p.price >= Number(priceMin))
      .filter(p => !priceMax || p.price <= Number(priceMax))
      .filter(p => !surfaceMin || p.surface >= Number(surfaceMin))
      .filter(p => !surfaceMax || p.surface <= Number(surfaceMax))
      .filter(p => !bedroomsMin || (p.bedrooms ?? 0) >= Number(bedroomsMin));
  }, [type, searchTerm, statusFilter, typeFilter, transactionFilter, cityFilter, citySubFilter, priceMin, priceMax, surfaceMin, surfaceMax, bedroomsMin, allProperties]);

  const activeFiltersCount = [
    statusFilter !== 'all',
    typeFilter !== 'all' && !type,
    transactionFilter !== 'all',
    cityFilter !== 'all',
    citySubFilter !== 'all',
    priceMin !== '',
    priceMax !== '',
    surfaceMin !== '',
    surfaceMax !== '',
    bedroomsMin !== '',
  ].filter(Boolean).length;

  /* ── Stats ── */
  const stats = useMemo(() => {
    const forSale = filteredProperties.filter(p => p.transactionType === 'vente').length;
    const forRent = filteredProperties.filter(p => p.transactionType === 'location_ld' || p.transactionType === 'location_saisonniere').length;
    const avgPrice = filteredProperties.length > 0
      ? Math.round(filteredProperties.reduce((s, p) => s + getDisplayPrice(p), 0) / filteredProperties.length)
      : 0;
    const avgSurface = filteredProperties.length > 0
      ? Math.round(filteredProperties.reduce((s, p) => s + (p.surface || 0), 0) / filteredProperties.length)
      : 0;
    return { forSale, forRent, avgPrice, avgSurface };
  }, [filteredProperties]);

  /* ── Hero text ── */
  const heroText = staged
    ? isDark
      ? { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400/80', title: 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent', sub: 'text-sm text-slate-400' }
      : { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-teal-900/50', title: 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent', sub: 'text-sm text-teal-900/55' }
    : { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-text-secondary', title: 'text-text', sub: 'text-sm text-text-secondary' };

  /* ── Loading ── */
  if (loading) {
    return (
      <Stage theme={theme}>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-3 border-transparent animate-spin"
              style={{ borderTopColor: typeHue.a, borderRightColor: `${typeHue.a}40` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full" style={{ background: typeHue.a, boxShadow: `0 0 16px ${typeHue.glow}` }} />
            </div>
          </div>
        </div>
      </Stage>
    );
  }

  if (!canRead) {
    return (
      <Stage theme={theme}>
        <div className="flex items-center justify-center h-[60vh]">
          <TiltCard className="p-12 text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${STAGE_HUES.sky.a}30, ${STAGE_HUES.sky.b}15)`,
                border: `1px solid ${STAGE_HUES.sky.a}33`,
              }}
            >
              <Lock size={24} style={{ color: STAGE_HUES.sky.a }} />
            </div>
            <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Accès refusé</h3>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Vous n'avez pas le droit de consulter les biens
            </p>
          </TiltCard>
        </div>
      </Stage>
    );
  }

  return (
    <ConfidentialProvider>
    <Stage theme={theme}>
      <div className="space-y-6 animate-fade-in smooth-scroll">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/${agentId}/properties`)}
            className={`inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors rounded-lg px-2.5 py-1.5 ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ChevronLeft size={15} />
            Retour
          </button>
        </div>
        <DraftSection propertyType={type} agentSlug={agentId} />

        {/* ── Hero Header ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: typeHue.a }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: typeHue.a, boxShadow: `0 0 8px ${typeHue.glow}` }} />
              </span>
              <p className={heroText.eyebrow}>
                Mission control · {typeLabel || 'Biens'}
              </p>
            </div>
            <h1 className={`mt-1 text-3xl font-extrabold tracking-tight ${heroText.title}`}>
              Biens {typeLabel}
            </h1>
            <p className={`mt-0.5 ${heroText.sub}`}>
              <AnimatedNumber value={filteredProperties.length} className="inline font-bold" />
              {' '}bien{filteredProperties.length !== 1 ? 's' : ''} trouvé{filteredProperties.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {canWrite && (
              <StageButton variant="primary" size="md" onClick={() => navigate(`/${agentId}/properties/type/${type}/add`)} icon={<Plus size={15} />}>
                Ajouter un bien
              </StageButton>
            )}
          </div>
        </div>

        {/* ── Confidential Banner ── */}
        {!loading && allProperties.length > 0 && <StageConfidentialBanner isDark={isDark} typeHue={typeHue} />}

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { icon: Home, label: 'Total biens', value: filteredProperties.length, hue: typeHue },
            { icon: TrendingUp, label: 'En vente', value: stats.forSale, hue: STAGE_HUES.emerald },
            { icon: Briefcase, label: 'En location', value: stats.forRent, hue: STAGE_HUES.sky },
            { icon: BarChart2, label: 'Prix moyen', value: stats.avgPrice, hue: STAGE_HUES.amber },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="stage-glass p-4 flex items-center gap-3.5 rounded-xl">
                <div className="relative shrink-0">
                  <div className="absolute -inset-2 rounded-xl pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at center, ${stat.hue.glow} 0%, transparent 70%)`, opacity: 0.5 }}
                  />
                  <OrbIcon icon={stat.icon} hue={stat.hue} size={38} radius={12} />
                </div>
                <div className="min-w-0">
                  <p className={`text-[10px] font-semibold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>
                    {stat.label}
                  </p>
                  <AnimatedNumber
                    value={stat.value}
                    className={`text-xl font-extrabold leading-tight tracking-tight tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Search + Controls ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative group">
            <div className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
              style={{
                background: `radial-gradient(ellipse at center, ${typeHue.glow} 0%, transparent 70%)`,
                filter: 'blur(16px)',
                transform: 'scale(1.05)',
              }}
            />
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center z-10"
                style={{
                  background: isDark
                    ? `linear-gradient(135deg, ${typeHue.a}30, ${typeHue.b}18)`
                    : `linear-gradient(135deg, ${typeHue.a}25, ${typeHue.b}12)`,
                  border: `1px solid ${typeHue.a}28`,
                  boxShadow: `0 2px 8px ${typeHue.glow}`,
                }}
              >
                <Search size={14} style={{ color: typeHue.a }} />
              </div>
              <input
                type="text"
                placeholder="Rechercher par nom, localisation ou référence..."
                className={`w-full h-11 pl-12 pr-4 text-sm rounded-xl border outline-none transition-all duration-200 ${
                  isDark
                    ? 'bg-gradient-to-b from-white/[0.08] to-white/[0.02] [background-color:transparent] border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-violet-400/70'
                    : 'bg-gradient-to-b from-white to-teal-50/70 [background-color:transparent] border-teal-900/15 text-teal-950 placeholder:text-teal-900/35 focus:border-teal-500/70'
                }`}
                style={{
                  boxShadow: isDark
                    ? 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -8px 16px -12px rgba(0,0,0,0.7), 0 6px 18px -8px rgba(3,5,14,0.9)'
                    : 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -6px 14px -10px rgba(13,148,136,0.35), 0 6px 18px -10px rgba(13,148,136,0.45)',
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = isDark
                    ? 'inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -8px 16px -12px rgba(0,0,0,0.6), 0 0 0 3px rgba(124,92,255,0.28), 0 10px 30px -8px rgba(124,92,255,0.55)'
                    : 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -6px 14px -10px rgba(13,148,136,0.4), 0 0 0 3px rgba(20,184,166,0.25), 0 10px 28px -10px rgba(13,148,136,0.6)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = isDark
                    ? 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -8px 16px -12px rgba(0,0,0,0.7), 0 6px 18px -8px rgba(3,5,14,0.9)'
                    : 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -6px 14px -10px rgba(13,148,136,0.35), 0 6px 18px -10px rgba(13,148,136,0.45)';
                }}
              />
            </div>
          </div>

          {/* Filter + View toggle */}
          <div className="flex gap-2">
            <button
              className="relative flex items-center gap-2.5 h-11 px-4 rounded-xl text-sm font-semibold transition-all duration-200 border"
              style={{
                backdropFilter: 'blur(12px)',
                background: showFilters || activeFiltersCount > 0
                  ? isDark ? 'rgba(139,124,255,0.1)' : 'rgba(13,148,136,0.08)'
                  : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)',
                borderColor: showFilters || activeFiltersCount > 0
                  ? isDark ? 'rgba(139,124,255,0.3)' : 'rgba(13,148,136,0.3)'
                  : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                color: showFilters || activeFiltersCount > 0
                  ? isDark ? '#C4B5FD' : '#0D9488'
                  : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.5)',
                boxShadow: isDark
                  ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.2)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 8px rgba(0,0,0,0.04)',
              }}
              onClick={() => setShowFilters(!showFilters)}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: showFilters || activeFiltersCount > 0
                    ? `linear-gradient(135deg, ${typeHue.a}30, ${typeHue.b}18)`
                    : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
                  border: `1px solid ${showFilters || activeFiltersCount > 0 ? `${typeHue.a}28` : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'}`,
                  boxShadow: showFilters || activeFiltersCount > 0 ? `0 2px 8px ${typeHue.glow}` : 'none',
                }}
              >
                <Sliders size={14} style={{ color: showFilters || activeFiltersCount > 0 ? typeHue.a : undefined }} />
              </div>
              Filtres
              {activeFiltersCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${typeHue.a}, ${typeHue.b})`, boxShadow: `0 0 8px ${typeHue.glow}` }}
                >
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <div className="flex rounded-xl border overflow-hidden"
              style={{
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                backdropFilter: 'blur(12px)',
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)',
                boxShadow: isDark
                  ? 'inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 8px rgba(0,0,0,0.15)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <button
                className={`h-11 px-3 transition-all duration-200 ${viewMode === 'grid' ? 'text-white' : isDark ? 'text-slate-500 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                style={viewMode === 'grid' ? {
                  background: `linear-gradient(135deg, ${typeHue.a}, ${typeHue.b})`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 12px -4px ${typeHue.glow}`,
                } : undefined}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={14} />
              </button>
              <button
                className={`h-11 px-3 transition-all duration-200 ${viewMode === 'list' ? 'text-white' : isDark ? 'text-slate-500 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                style={viewMode === 'list' ? {
                  background: `linear-gradient(135deg, ${typeHue.a}, ${typeHue.b})`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 12px -4px ${typeHue.glow}`,
                } : undefined}
                onClick={() => setViewMode('list')}
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Advanced Filters Panel ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="stage-glass rounded-2xl p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${typeHue.a}30, ${typeHue.b}18)`,
                        border: `1px solid ${typeHue.a}28`,
                        boxShadow: `0 2px 8px ${typeHue.glow}`,
                      }}
                    >
                      <Filter size={14} style={{ color: typeHue.a }} />
                    </div>
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Filtres avancés</h4>
                  </div>
                  <button
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-semibold transition-all duration-200 border"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)',
                    }}
                    onClick={() => {
                      setStatusFilter('all'); setTypeFilter('all'); setTransactionFilter('all'); setCityFilter('all'); setCitySubFilter('all');
                      setPriceMin(''); setPriceMax(''); setSurfaceMin(''); setSurfaceMax('');
                      setBedroomsMin('');
                    }}
                  >
                    <RotateCcw size={11} />
                    Réinitialiser
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {!type && (
                    <div>
                      <label className={isDark ? 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400/85' : 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-teal-900/55'}>Type</label>
                      <div style={{ boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -8px 16px -12px rgba(0,0,0,0.7), 0 6px 18px -8px rgba(3,5,14,0.9)' : 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -6px 14px -10px rgba(13,148,136,0.35), 0 6px 18px -10px rgba(13,148,136,0.45)' }} className="rounded-xl">
                        <Select
                          options={typeOptions}
                          value={typeFilter}
                          onValueChange={setTypeFilter}
                          className={`w-full h-10 px-3 text-sm rounded-xl border outline-none transition-all duration-200 ${
                            isDark
                              ? 'bg-gradient-to-b from-white/[0.08] to-white/[0.02] [background-color:transparent] border-white/10 text-slate-100'
                              : 'bg-gradient-to-b from-white to-teal-50/70 [background-color:transparent] border-teal-900/15 text-teal-950'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className={isDark ? 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400/85' : 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-teal-900/55'}>Statut</label>
                    <div style={{ boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -8px 16px -12px rgba(0,0,0,0.7), 0 6px 18px -8px rgba(3,5,14,0.9)' : 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -6px 14px -10px rgba(13,148,136,0.35), 0 6px 18px -10px rgba(13,148,136,0.45)' }} className="rounded-xl">
                      <Select
                        options={statusOptions}
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                        className={`w-full h-10 px-3 text-sm rounded-xl border outline-none transition-all duration-200 ${
                          isDark
                            ? 'bg-gradient-to-b from-white/[0.08] to-white/[0.02] [background-color:transparent] border-white/10 text-slate-100'
                            : 'bg-gradient-to-b from-white to-teal-50/70 [background-color:transparent] border-teal-900/15 text-teal-950'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={isDark ? 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400/85' : 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-teal-900/55'}>Transaction</label>
                    <div style={{ boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -8px 16px -12px rgba(0,0,0,0.7), 0 6px 18px -8px rgba(3,5,14,0.9)' : 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -6px 14px -10px rgba(13,148,136,0.35), 0 6px 18px -10px rgba(13,148,136,0.45)' }} className="rounded-xl">
                      <Select
                        options={transactionOptions}
                        value={transactionFilter}
                        onValueChange={setTransactionFilter}
                        className={`w-full h-10 px-3 text-sm rounded-xl border outline-none transition-all duration-200 ${
                          isDark
                            ? 'bg-gradient-to-b from-white/[0.08] to-white/[0.02] [background-color:transparent] border-white/10 text-slate-100'
                            : 'bg-gradient-to-b from-white to-teal-50/70 [background-color:transparent] border-teal-900/15 text-teal-950'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={isDark ? 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400/85' : 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-teal-900/55'}>Ville</label>
                    <div style={{ boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -8px 16px -12px rgba(0,0,0,0.7), 0 6px 18px -8px rgba(3,5,14,0.9)' : 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -6px 14px -10px rgba(13,148,136,0.35), 0 6px 18px -10px rgba(13,148,136,0.45)' }} className="rounded-xl">
                      <Select
                        options={cityOptions}
                        value={cityFilter}
                        onValueChange={(v) => { setCityFilter(v); setCitySubFilter('all'); }}
                        className={`w-full h-10 px-3 text-sm rounded-xl border outline-none transition-all duration-200 ${
                          isDark
                            ? 'bg-gradient-to-b from-white/[0.08] to-white/[0.02] [background-color:transparent] border-white/10 text-slate-100'
                            : 'bg-gradient-to-b from-white to-teal-50/70 [background-color:transparent] border-teal-900/15 text-teal-950'
                        }`}
                      />
                    </div>
                  </div>
                  {cityFilter === 'Essaouira' && subCityOptions.length > 0 && (
                    <div>
                      <label className={isDark ? 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400/85' : 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-teal-900/55'}>Quartier</label>
                      <div style={{ boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -8px 16px -12px rgba(0,0,0,0.7), 0 6px 18px -8px rgba(3,5,14,0.9)' : 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -6px 14px -10px rgba(13,148,136,0.35), 0 6px 18px -10px rgba(13,148,136,0.45)' }} className="rounded-xl">
                        <Select
                          options={subCityOptions}
                          value={citySubFilter}
                          onValueChange={setCitySubFilter}
                          className={`w-full h-10 px-3 text-sm rounded-xl border outline-none transition-all duration-200 ${
                            isDark
                              ? 'bg-gradient-to-b from-white/[0.08] to-white/[0.02] [background-color:transparent] border-white/10 text-slate-100'
                              : 'bg-gradient-to-b from-white to-teal-50/70 [background-color:transparent] border-teal-900/15 text-teal-950'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className={isDark ? 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400/85' : 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-teal-900/55'}>Prix (MAD)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        className={`w-full h-10 px-3 text-sm rounded-xl border outline-none transition-all duration-200 ${
                          isDark
                            ? 'bg-gradient-to-b from-white/[0.08] to-white/[0.02] [background-color:transparent] border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-violet-400/70'
                            : 'bg-gradient-to-b from-white to-teal-50/70 [background-color:transparent] border-teal-900/15 text-teal-950 placeholder:text-teal-900/35 focus:border-teal-500/70'
                        }`}
                        style={{
                          boxShadow: isDark
                            ? 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -8px 16px -12px rgba(0,0,0,0.7), 0 6px 18px -8px rgba(3,5,14,0.9)'
                            : 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -6px 14px -10px rgba(13,148,136,0.35), 0 6px 18px -10px rgba(13,148,136,0.45)',
                        }}
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                      />
                      <span className={`text-xs font-medium ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>–</span>
                      <input
                        type="number"
                        placeholder="Max"
                        className={`w-full h-10 px-3 text-sm rounded-xl border outline-none transition-all duration-200 ${
                          isDark
                            ? 'bg-gradient-to-b from-white/[0.08] to-white/[0.02] [background-color:transparent] border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-violet-400/70'
                            : 'bg-gradient-to-b from-white to-teal-50/70 [background-color:transparent] border-teal-900/15 text-teal-950 placeholder:text-teal-900/35 focus:border-teal-500/70'
                        }`}
                        style={{
                          boxShadow: isDark
                            ? 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -8px 16px -12px rgba(0,0,0,0.7), 0 6px 18px -8px rgba(3,5,14,0.9)'
                            : 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -6px 14px -10px rgba(13,148,136,0.35), 0 6px 18px -10px rgba(13,148,136,0.45)',
                        }}
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={isDark ? 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400/85' : 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-teal-900/55'}>Surface (m²)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        className={`w-full h-10 px-3 text-sm rounded-xl border outline-none transition-all duration-200 ${
                          isDark
                            ? 'bg-gradient-to-b from-white/[0.08] to-white/[0.02] [background-color:transparent] border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-violet-400/70'
                            : 'bg-gradient-to-b from-white to-teal-50/70 [background-color:transparent] border-teal-900/15 text-teal-950 placeholder:text-teal-900/35 focus:border-teal-500/70'
                        }`}
                        style={{
                          boxShadow: isDark
                            ? 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -8px 16px -12px rgba(0,0,0,0.7), 0 6px 18px -8px rgba(3,5,14,0.9)'
                            : 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -6px 14px -10px rgba(13,148,136,0.35), 0 6px 18px -10px rgba(13,148,136,0.45)',
                        }}
                        value={surfaceMin}
                        onChange={(e) => setSurfaceMin(e.target.value)}
                      />
                      <span className={`text-xs font-medium ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>–</span>
                      <input
                        type="number"
                        placeholder="Max"
                        className={`w-full h-10 px-3 text-sm rounded-xl border outline-none transition-all duration-200 ${
                          isDark
                            ? 'bg-gradient-to-b from-white/[0.08] to-white/[0.02] [background-color:transparent] border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-violet-400/70'
                            : 'bg-gradient-to-b from-white to-teal-50/70 [background-color:transparent] border-teal-900/15 text-teal-950 placeholder:text-teal-900/35 focus:border-teal-500/70'
                        }`}
                        style={{
                          boxShadow: isDark
                            ? 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -8px 16px -12px rgba(0,0,0,0.7), 0 6px 18px -8px rgba(3,5,14,0.9)'
                            : 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -6px 14px -10px rgba(13,148,136,0.35), 0 6px 18px -10px rgba(13,148,136,0.45)',
                        }}
                        value={surfaceMax}
                        onChange={(e) => setSurfaceMax(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={isDark ? 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400/85' : 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-teal-900/55'}>Chambres min</label>
                    <input
                      type="number"
                      placeholder="Ex: 3"
                      className={`w-full h-10 px-3 text-sm rounded-xl border outline-none transition-all duration-200 ${
                        isDark
                          ? 'bg-gradient-to-b from-white/[0.08] to-white/[0.02] [background-color:transparent] border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-violet-400/70'
                          : 'bg-gradient-to-b from-white to-teal-50/70 [background-color:transparent] border-teal-900/15 text-teal-950 placeholder:text-teal-900/35 focus:border-teal-500/70'
                      }`}
                      style={{
                        boxShadow: isDark
                          ? 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -8px 16px -12px rgba(0,0,0,0.7), 0 6px 18px -8px rgba(3,5,14,0.9)'
                          : 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -6px 14px -10px rgba(13,148,136,0.35), 0 6px 18px -10px rgba(13,148,136,0.45)',
                      }}
                      value={bedroomsMin}
                      onChange={(e) => setBedroomsMin(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results ── */}
        {filteredProperties.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProperties.map((property, i) => (
                <PropertyCardStage key={property.id} property={property} index={i} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="stage-glass rounded-2xl overflow-hidden"
            >
              {/* List header */}
              <div className="flex items-center justify-between px-5 py-3 border-b"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)' }}
              >
                <div className="flex items-center gap-2.5">
                  <OrbIcon icon={List} hue={typeHue} size={26} radius={8} />
                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Liste des biens</span>
                </div>
                <StageBadge variant="neutral">
                  <AnimatedNumber value={filteredProperties.length} className="inline font-bold" /> bien{filteredProperties.length !== 1 ? 's' : ''}
                </StageBadge>
              </div>

              {/* Column headers */}
              <div className="flex items-center gap-4 px-5 py-2 border-b text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)',
                  color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.35)',
                }}
              >
                <div className="w-[56px] shrink-0" />
                <div className="flex-1 min-w-0">Bien</div>
                <div className="hidden md:block w-[180px]">Spécifications</div>
                <div className="text-right w-[120px]">Prix</div>
                <div className="w-[120px]">Statut</div>
                <div className="hidden lg:block w-[60px] text-center">Compl.</div>
                <div className="w-[20px]" />
              </div>

              {/* Rows */}
              <div className="divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)' }}>
                {filteredProperties.map((property, i) => (
                  <PropertyRowStage key={property.id} property={property} index={i} />
                ))}
              </div>
            </motion.div>
          )
        ) : (
          <div className="flex items-center justify-center py-16">
            <TiltCard className="p-12 text-center max-w-sm">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)'}`,
                }}
              >
                <Search size={24} style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.2)' }} />
              </div>
              <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Aucun bien trouvé</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Essayez de modifier vos filtres ou d'ajouter un nouveau bien
              </p>
            </TiltCard>
          </div>
        )}
      </div>
    </Stage>
    </ConfidentialProvider>
  );
}
