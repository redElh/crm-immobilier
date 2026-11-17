import { useState, useEffect, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, User, DollarSign, MapPin, Home, Calendar, FileText, TrendingUp, CheckCircle, MessageSquare, Compass, ExternalLink } from "react-feather";
import { CompletionRing } from "../../ui/CompletionRing";
import { calcClientCompletion } from "../../../utils/clientCompletion";
import { api } from "../../../services/api";
import { useStageTheme, useStageScope, useStageAccent, STAGE_HUES, type StageHue } from "../../dashboard/Stage";
import { getClientStatusHue, getClientInitials } from "./ClientCard";

/* =====================================================================
   ClientHeader — premium Stage edition (fluid, staged):
   dark = per-type hue identity · light = sidebar emerald shades ·
   gerant = rose identity. Status badge uses the per-status convenient
   color (shared with the client cards). Orb initials avatar with
   completion lens, KPI chips, glass contact pills, staged CTA.
   ===================================================================== */

const TYPE_HUE: Record<string, StageHue> = {
  Acheteur: STAGE_HUES.violet,
  Vendeur: STAGE_HUES.sky,
  Bailleur: STAGE_HUES.emerald,
  Locataire: STAGE_HUES.amber,
  Voyageur: STAGE_HUES.fuchsia,
};

const SIDEBAR_EMERALD: StageHue = {
  a: '#2DD4BF',
  b: '#0D9488',
  glow: 'rgba(13,148,136,0.35)',
  line: '#14B8A6',
};
const LIGHT_INK = '#0F766E';

interface ClientActivity {
  id: string | number;
  type: string;
  status?: string;
  activity_date?: string;
  notes?: string;
}

interface Client {
  id?: string | number; name: string; phone: string; email: string; status: string; type?: string;
  statutMetier?: string; classification?: string; createdAt?: string;
  budget?: number; prixMin?: number; prixMax?: number; secteur?: string;
  propertyType?: string; pieces?: number; loyer?: number; source?: string;
  localisation?: string; categorie?: string; latitude?: number; longitude?: number;
  agentId?: string; agentDesigne?: string; prixVenteFAI?: number; contactId?: string;
}

const USER_CACHE: Record<string, { name: string; role: string; position?: string }> = {};
const NAME_TO_ROLE: Record<string, string> = {};
const NAME_TO_POSITION: Record<string, string> = {};

const getRoleBadge = (role?: string, position?: string, _isGerant = false) => {
  void _isGerant;
  if (role === 'agent') return { label: position || 'Agent', hue: STAGE_HUES.emerald };
  if (role === 'gerant') return { label: 'Gérant', hue: STAGE_HUES.amber };
  if (role === 'admin') return { label: 'Admin', hue: STAGE_HUES.violet };
  return null;
};

const COMPLETION_LOW_HUE: StageHue = { a: '#F87171', b: '#B91C1C', glow: 'rgba(248,113,113,0.40)', line: '#F87171' };

export const ClientHeader = ({ client, isGerant = false }: { client: Client; isGerant?: boolean }) => {
  const theme = useStageTheme();
  const isDark = theme === 'dark';
  const scope = useStageScope();
  const stageAccent = useStageAccent();
  const [nextRdv, setNextRdv] = useState<string | null>(null);
  const [visitsThisMonth, setVisitsThisMonth] = useState<number | null>(null);
  const completion = (client as any).completion ?? calcClientCompletion(client);
  const [, setUsersFetched] = useState(false);

  const typeHue = TYPE_HUE[client.type || ''] || STAGE_HUES.violet;
  const accent = scope === 'admin' ? stageAccent : (isDark ? typeHue : SIDEBAR_EMERALD);
  const ink = scope === 'admin' ? (isDark ? stageAccent.a : stageAccent.b) : (isDark ? typeHue.a : LIGHT_INK);
  const statusLabel = client.statutMetier || client.status;
  const statusHue = getClientStatusHue(statusLabel) || accent;
  const badgeStyle: CSSProperties = isDark
    ? { background: `${statusHue.a}2E`, color: '#fff', border: `1px solid ${statusHue.a}5C`, boxShadow: `0 2px 12px ${statusHue.glow}, inset 0 1px 0 rgba(255,255,255,0.14)` }
    : { background: `${statusHue.a}1C`, color: statusHue.b, border: `1px solid ${statusHue.a}42`, boxShadow: `0 2px 10px ${statusHue.glow}, inset 0 1px 0 rgba(255,255,255,0.7)` };

  /* Completion lens hue — semantic, readable in both themes. */
  const completionHue = completion >= 80 ? STAGE_HUES.emerald : completion >= 50 ? STAGE_HUES.amber : COMPLETION_LOW_HUE;
  const completionInk = isDark ? completionHue.a : completionHue.b;
  const completionHint = completion >= 80 ? 'Dossier complet' : completion >= 50 ? 'En cours' : 'À compléter';

  const fetchNextRdv = useCallback(() => {
    const clientId = (client as any).id;
    if (!clientId) return;
    api.get<any>(`/clients/${clientId}/activities?limit=100`).then((data) => {
      const list = (data as any)?.activities || data || [];
      const arr = Array.isArray(list) ? list : [];
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
      setVisitsThisMonth(
        arr.filter((a: any) => a.type === 'visite' && a.activity_date)
          .filter((a: any) => {
            const t = new Date(a.activity_date).getTime();
            return t >= monthStart && t < monthEnd;
          }).length
      );
      const upcoming = arr
        .filter((a: any) =>
          a.type === 'rendez_vous' &&
          (a.status === 'en_attente' || a.status === 'confirme') &&
          a.activity_date
        )
        .sort((a: any, b: any) => new Date(a.activity_date).getTime() - new Date(b.activity_date).getTime())
        .find((a: any) => new Date(a.activity_date) >= new Date());
      if (upcoming) {
        const d = new Date(upcoming.activity_date);
        const formatted = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        setNextRdv(formatted);
      } else {
        setNextRdv(null);
      }
    }).catch(() => { setNextRdv(null); setVisitsThisMonth(null); });
  }, [client]);

  useEffect(() => {
    fetchNextRdv();
    const interval = setInterval(fetchNextRdv, 30000);
    return () => clearInterval(interval);
  }, [fetchNextRdv]);

  const notesHref = (() => {
    const base = window.location.pathname.replace(/\/clients\/.*/, '');
    return `${base}/clients/${(client as any).id}?tab=notes_activite`;
  })();

  const typeKpis = getTypeKpis(client, nextRdv, visitsThisMonth, notesHref);

  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string; position?: string } | null>(null);

  useEffect(() => {
    api.get<any>('/auth/me').then((u: any) => {
      if (u) {
        const name = [u.first_name || '', u.last_name || ''].filter(Boolean).join(' ').trim() || u.email || 'Inconnu';
        USER_CACHE[String(u.id)] = { name, role: u.role || '', position: u.position || '' };
        NAME_TO_ROLE[name.toLowerCase()] = u.role || '';
        NAME_TO_POSITION[name.toLowerCase()] = u.position || '';
        setCurrentUser({ id: String(u.id), name, role: u.role || '', position: u.position || '' });
      }
      setUsersFetched(true);
    }).catch(() => { setUsersFetched(true); });
    api.get<any[]>('/admin/users').then((list: any[]) => {
      if (Array.isArray(list)) {
        for (const u of list) {
          const name = [u.first_name || '', u.last_name || ''].filter(Boolean).join(' ').trim() || u.email || 'Inconnu';
          USER_CACHE[String(u.id)] = { name, role: u.role || '', position: u.position || '' };
          NAME_TO_ROLE[name.toLowerCase()] = u.role || '';
          NAME_TO_POSITION[name.toLowerCase()] = u.position || '';
        }
      }
      setUsersFetched(true);
    }).catch(() => {});
  }, []);

  const agentId = client.agentId || '';
  const agentDesigne = client.agentDesigne || '';
  const agentInfo = agentId ? USER_CACHE[agentId] : undefined;
  const agentName = agentInfo?.name || agentDesigne || agentId || currentUser?.name || 'Non assigné';
  const agentRole = agentInfo?.role || (agentDesigne ? NAME_TO_ROLE[agentDesigne.toLowerCase()] : '') || currentUser?.role || '';
  const agentPosition = agentInfo?.position || (agentDesigne ? NAME_TO_POSITION[agentDesigne.toLowerCase()] : '') || currentUser?.position || '';
  const agentBadge = getRoleBadge(agentRole, agentPosition, isGerant);

  const contactPill = `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold backdrop-blur-md transition-all duration-200 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white/70 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900'}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="stage-glass relative overflow-hidden !rounded-[24px]"
    >
      {/* top gradient line */}
      <div
        className="absolute inset-x-0 top-0 z-10 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${accent.a}, ${accent.b})`, boxShadow: `0 0 14px ${accent.glow}` }}
      />
      {/* ambient wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDark
            ? `radial-gradient(110% 80% at 50% 0%, ${accent.a}26, transparent 62%), radial-gradient(70% 55% at 100% 100%, ${accent.b}14, transparent 60%)`
            : `radial-gradient(110% 80% at 50% 0%, ${accent.a}1F, transparent 62%), radial-gradient(70% 55% at 100% 100%, ${accent.a}10, transparent 60%)`,
        }}
      />

      <div className="relative space-y-5 p-5 sm:p-6">
        {/* ── Identity row: avatar + name (left), completion lens (right) ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="shrink-0"
            >
              <div
                className="orb-icon select-none text-xl font-extrabold tracking-tight"
                style={{ width: 64, height: 64, borderRadius: 20, '--orb-a': accent.a, '--orb-b': accent.b, '--orb-glow': accent.glow } as CSSProperties}
              >
                {getClientInitials(client.name)}
              </div>
            </motion.div>

          <div className="min-w-0 flex-1 pt-0.5">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className={`truncate text-xl font-extrabold tracking-[-0.4px] sm:text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}
            >
              {client.name}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mt-2 flex flex-wrap items-center gap-1.5"
            >
              {statusLabel ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] backdrop-blur-md"
                  style={badgeStyle}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: statusHue.line }} />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: statusHue.line, boxShadow: `0 0 8px ${statusHue.glow}` }} />
                  </span>
                  <span className="max-w-[220px] truncate">{statusLabel}</span>
                </span>
              ) : null}
              {client.type && (
                <span
                  className="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold"
                  style={isDark
                    ? { background: `${accent.a}14`, color: accent.a, border: `1px solid ${accent.a}30` }
                    : { background: `${accent.a}12`, color: ink, border: `1px solid ${accent.a}30` }}
                >
                  {client.type}
                </span>
              )}
              {client.classification && (
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300' : 'border-slate-200/80 bg-white/70 text-slate-500'}`}
                >
                  {client.classification}
                </span>
              )}
              {(client as any).contactId && (
                <a
                  href={(() => {
                    const base = window.location.pathname.replace(/\/clients\/.*/, '');
                    return `${base}/contacts/${(client as any).contactId}`;
                  })()}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold transition-opacity hover:opacity-80"
                  style={isDark
                    ? { background: `${accent.a}14`, color: accent.a, border: `1px solid ${accent.a}30` }
                    : { background: `${accent.a}12`, color: ink, border: `1px solid ${accent.a}30` }}
                  title="Voir le contact d'origine"
                >
                  <User size={10} /> Contact d'origine <ExternalLink size={9} />
                </a>
              )}
            </motion.div>
            <div className={`mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {client.type && <span className="font-semibold capitalize" style={{ color: ink }}>{client.type}</span>}
              {client.createdAt && <span>· Client depuis {new Date(client.createdAt).toLocaleDateString('fr-FR')}</span>}
            </div>
          </div>
          </div>

          {/* ── Completion lens: standalone staged chip (no avatar overlap) ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            title={`Profil complété à ${completion}%`}
            className={`flex shrink-0 items-center gap-3 rounded-2xl border px-3.5 py-2.5 backdrop-blur-sm sm:ml-auto ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]'}`}
          >
            <CompletionRing percent={completion} size={46} strokeWidth={4} showLabel={true} />
            <div className="leading-tight">
              <p className={`text-[9px] font-bold uppercase tracking-[0.14em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Complétion
              </p>
              <p className="text-base font-extrabold tabular-nums" style={{ color: completionInk }}>
                {completion}%
              </p>
              <p className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {completionHint}
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── KPI chips ── */}
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {typeKpis.map((kpi, i) => {
            const Icon = kpi.icon;
            const chip = (
              <>
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                    style={isDark
                      ? { background: `${accent.a}14`, borderColor: `${accent.a}30`, color: accent.a }
                      : { background: `${accent.a}12`, borderColor: `${accent.a}30`, color: ink }}
                  >
                    <Icon size={13} className={kpi.iconColor} style={kpi.iconColor ? undefined : { color: 'inherit' }} />
                  </span>
                  <span className={`truncate text-[10px] font-bold uppercase tracking-[0.12em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {kpi.label}
                  </span>
                </div>
                <p className={`mt-1.5 truncate text-sm font-extrabold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {kpi.value}
                </p>
              </>
            );
            const cls = `rounded-2xl border p-3 backdrop-blur-sm transition-all duration-300 ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]'} ${kpi.link ? (isDark ? 'hover:border-white/20 hover:bg-white/[0.07]' : 'hover:bg-white hover:shadow-md') : ''}`;
            return kpi.link ? (
              <motion.a
                key={i}
                href={kpi.link}
                title="Voir dans Notes & Activité"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className={`${cls} group block`}
              >
                {chip}
              </motion.a>
            ) : (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className={cls}
              >
                {chip}
              </motion.div>
            );
          })}
        </div>

        {/* ── Contact + agent bar ── */}
        <div className={`flex flex-col gap-3 border-t pt-4 lg:flex-row lg:items-center ${isDark ? 'border-white/[0.06]' : scope === 'admin' ? 'border-orange-900/10' : 'border-teal-900/10'}`}>
          <div className="flex flex-wrap items-center gap-1.5">
            <a href={`tel:${client.phone}`} className={contactPill}>
              <Phone size={12} style={{ color: ink }} /> {client.phone}
            </a>
            {client.email && (
              <a href={`mailto:${client.email}`} className={contactPill}>
                <Mail size={12} style={{ color: ink }} /> <span className="max-w-[220px] truncate">{client.email}</span>
              </a>
            )}
            {client.localisation && (
              <span className={contactPill}>
                <MapPin size={12} style={{ color: ink }} /> <span className="max-w-[180px] truncate">{client.localisation}</span>
              </span>
            )}
            {client.categorie && (
              <span className={contactPill}>
                <Home size={12} style={{ color: ink }} /> {client.categorie}
              </span>
            )}
            {client.latitude !== undefined && client.latitude !== 0 && client.longitude !== undefined && client.longitude !== 0 && (
              <a
                href={`https://www.google.com/maps?q=${client.latitude},${client.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className={contactPill}
              >
                <Compass size={12} style={{ color: ink }} /> {client.latitude.toFixed(4)}, {client.longitude.toFixed(4)}
              </a>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <div className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75 shadow-sm'}`}>
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold text-white"
                style={{ background: `linear-gradient(145deg, ${accent.a}, ${accent.b})`, boxShadow: `0 4px 12px -4px ${accent.glow}` }}
              >
                {agentName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'NA'}
              </div>
              <div className="leading-tight">
                <p className={`text-[9px] font-bold uppercase tracking-[0.12em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Assigné à</p>
                <p className={`max-w-[140px] truncate text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{agentName}</p>
              </div>
              {agentBadge && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider backdrop-blur-md"
                  style={isDark
                    ? { background: `${agentBadge.hue.a}2E`, color: '#fff', border: `1px solid ${agentBadge.hue.a}5C`, boxShadow: `0 2px 8px ${agentBadge.hue.glow}` }
                    : { background: `${agentBadge.hue.a}1C`, color: agentBadge.hue.b, border: `1px solid ${agentBadge.hue.a}42`, boxShadow: `0 2px 8px ${agentBadge.hue.glow}` }}
                >
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{ background: agentBadge.hue.line, boxShadow: `0 0 6px ${agentBadge.hue.glow}` }}
                  />
                  {agentBadge.label}
                </span>
              )}
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-xs font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95"
              style={scope === 'admin'
                ? { backgroundImage: `linear-gradient(145deg, ${stageAccent.a} 0%, ${stageAccent.b} 100%)`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 26px -10px ${stageAccent.glow}` }
                : isDark
                  ? { backgroundImage: 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 26px -8px rgba(124,92,255,0.65)' }
                  : { backgroundImage: 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 26px -10px rgba(13,148,136,0.6)' }}
            >
              <MessageSquare size={13} />
              Nouveau message
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

function getTypeKpis(client: Client, nextRdv: string | null, visitsThisMonth: number | null, notesHref: string) {
  const type = client.type || '';
  const baseKpis = (label: string, value: string, icon: any, iconColor?: string, link?: string) => ({ label, value, icon, iconColor, link });
  const rdvValue = nextRdv || '—';
  const visitsValue = visitsThisMonth === null ? '—' : String(visitsThisMonth);

  switch (type) {
    case 'Acheteur':
      return [
        baseKpis('Budget', client.prixMin && client.prixMax ? `${(client.prixMin / 1000).toLocaleString()}k-${(client.prixMax / 1000).toLocaleString()}k MAD` : '—', DollarSign),
        baseKpis('Secteur', client.secteur || '—', MapPin),
        baseKpis('Origine', client.source || '—', Home),
        baseKpis('RDV à venir', rdvValue, Calendar),
      ];
    case 'Vendeur':
      return [
        baseKpis('Prix', client.prixVenteFAI ? `${client.prixVenteFAI.toLocaleString('fr-FR')} MAD` : '—', DollarSign),
        baseKpis('Origine', client.source || '—', Home),
        baseKpis('Visites ce mois', visitsValue, Calendar, undefined, notesHref),
        baseKpis('Demandes reçues', '—', FileText),
      ];
    case 'Bailleur': {
      const loyerHC = Number((client as any).loyerHC) || 0;
      const charges = Number((client as any).charges) || 0;
      const devise = (client as any).devise || 'MAD';
      const loyerValue = loyerHC ? `${loyerHC.toLocaleString('fr-FR')} ${devise}` : '—';
      const revenusValue = loyerHC + charges ? `${(loyerHC + charges).toLocaleString('fr-FR')} ${devise}` : '—';
      return [
        baseKpis('Bien', client.propertyType || '—', Home),
        baseKpis('Loyer', loyerValue, DollarSign),
        baseKpis('Visites ce mois', visitsValue, Calendar, undefined, notesHref),
        baseKpis('Revenus mensuels', revenusValue, TrendingUp),
      ];
    }
    case 'Locataire':
      return [
        baseKpis('Budget', client.budget ? `${client.budget.toLocaleString()} MAD` : '—', DollarSign),
        baseKpis('Secteur', client.secteur || '—', MapPin),
        baseKpis('Origine', client.source || '—', Home),
        baseKpis('RDV à venir', rdvValue, Calendar),
      ];
    case 'Voyageur':
      return [
        baseKpis('Montant', (client as any).montantTotalAvecOptions ? `${(client as any).montantTotalAvecOptions.toLocaleString('fr-FR')} ${(client as any).devise || 'MAD'}` : (client as any).budgetTotal ? `${(client as any).budgetTotal.toLocaleString('fr-FR')} ${(client as any).devise || 'MAD'}` : '—', DollarSign),
        baseKpis('Bien', (client as any).bienReserveNom || ((client as any).bienReserve ? `Bien #${(client as any).bienReserve}` : client.propertyType || '—'), Home),
        baseKpis('Séjour', (client as any).dateArrivee && (client as any).dateDepart ? `${new Date((client as any).dateArrivee).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} → ${new Date((client as any).dateDepart).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} · ${(client as any).nbNuits || 0}n` : '—', Calendar),
        baseKpis('Statut', (client as any).statutReservation || client.statutMetier || '—', CheckCircle),
      ];
    default:
      return [
        baseKpis('Budget', '—', DollarSign),
        baseKpis('Secteur', '—', MapPin),
        baseKpis('Origine', client.source || '—', Home),
        baseKpis('RDV à venir', rdvValue, Calendar),
      ];
  }
}
