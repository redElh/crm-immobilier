import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Search, Home, Briefcase, Sun, TrendingUp,
  ChevronRight, UserCheck, UserX, ArrowUp, ArrowDown, Lock, UserPlus, ArrowUpRight
} from 'react-feather';
import { useState, useEffect, useMemo } from 'react';
import { fetchClients } from '../../../services/clientService';
import { api } from '../../../services/api';
import { useMyPermissions, permissionAllowed } from '../../../hooks/useMyPermissions';
import { useStageChrome } from '../../../components/modules/calendar/useStageChrome';
import {
  Stage, StageBadge, StagePanel, StageStatCard, StageButton,
  TiltCard, OrbIcon, STAGE_HUES, useStageTheme, AnimatedNumber,
} from '../../../components/dashboard/Stage';

const clientTypes = [
  { type: 'acheteur', title: 'Acheteurs', description: 'Recherche et acquisition de biens', icon: Search, hue: STAGE_HUES.emerald },
  { type: 'vendeur', title: 'Vendeurs', description: 'Biens proposés à la vente', icon: Home, hue: STAGE_HUES.amber },
  { type: 'bailleur', title: 'Bailleurs', description: 'Propriétaires et locations longue durée', icon: Briefcase, hue: STAGE_HUES.violet },
  { type: 'locataire', title: 'Locataires', description: 'Dossiers et baux en cours', icon: Users, hue: STAGE_HUES.fuchsia },
  { type: 'voyageur', title: 'Voyageurs', description: 'Séjours et réservations saisonnières', icon: Sun, hue: STAGE_HUES.sky },
];

function ClientTypeOrb({ clientType, index, onClick }: { clientType: any; index: number; onClick: () => void }) {
  const { dark } = useStageChrome();
  const theme = useStageTheme();
  const isDark = theme === 'dark';
  const Icon = clientType.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <TiltCard className="group relative flex h-full min-h-[310px] min-w-0 cursor-pointer flex-col overflow-hidden p-5" onClick={onClick}>
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full opacity-20 blur-3xl transition-opacity duration-300 group-hover:opacity-50"
          style={{ background: clientType.hue.glow }}
        />
        <div className="relative flex items-start justify-between">
          <OrbIcon icon={Icon} hue={clientType.hue} size={54} radius={17} />
          <span className={isDark ? 'text-slate-500 transition-colors group-hover:text-slate-200' : 'text-teal-900/35 transition-colors group-hover:text-teal-900/70'}>
            <ArrowUpRight size={18} />
          </span>
        </div>
        <div className="relative mt-5 min-h-[76px] flex-1">
          <div className="flex items-center gap-2">
            <h3 className={isDark ? 'min-w-0 text-lg font-bold text-white' : 'min-w-0 text-lg font-bold text-slate-950'}>{clientType.title}</h3>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: clientType.hue.a, boxShadow: `0 0 8px ${clientType.hue.glow}` }} />
          </div>
          <p className={isDark ? 'mt-1 max-w-[22ch] text-sm leading-relaxed text-slate-400' : 'mt-1 max-w-[22ch] text-sm leading-relaxed text-teal-900/60'}>{clientType.description}</p>
        </div>
        <div className={isDark ? 'relative mt-5 border-t border-white/10 pt-4' : 'relative mt-5 border-t border-teal-900/10 pt-4'}>
          <div className="flex min-h-[52px] items-end justify-between gap-3">
            <div>
              <AnimatedNumber value={clientType.total} className={isDark ? 'text-3xl font-extrabold text-white' : 'text-3xl font-extrabold text-slate-950'} />
              <p className={isDark ? 'mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500' : 'mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-900/45'}>clients suivis</p>
            </div>
            <StageBadge variant={clientType.active > 0 ? 'ok' : 'neutral'}>{clientType.active} actifs</StageBadge>
          </div>
          <div className={isDark ? 'mt-4 h-1.5 overflow-hidden rounded-full bg-white/10' : 'mt-4 h-1.5 overflow-hidden rounded-full bg-teal-900/10'}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${clientType.hue.a}, ${clientType.hue.b})` }}
              initial={{ width: 0 }}
              animate={{ width: `${clientType.total ? Math.max(8, (clientType.active / clientType.total) * 100) : 0}%` }}
              transition={{ duration: 0.9, delay: 0.3 + index * 0.06 }}
            />
          </div>
        </div>
        <div className={isDark ? 'relative mt-4 flex items-center gap-1 text-xs font-semibold text-violet-300 transition-colors group-hover:text-white' : 'relative mt-4 flex items-center gap-1 text-xs font-semibold text-teal-700 transition-colors group-hover:text-teal-900'}>
          Ouvrir le portefeuille <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
        </div>
      </TiltCard>
    </motion.div>
  );
}

export default function ClientTypesPage() {
  const navigate = useNavigate();
  const { dark } = useStageChrome();
  const theme = useStageTheme();
  const perms = useMyPermissions();
  const canRead = permissionAllowed(perms, 'clients-lecture');
  const permsLoaded = perms !== null;
  const [clients, setClients] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    api.get<any>('/auth/me').then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetchClients({ agent_id: String(currentUser.id) }).then(setClients).catch(() => {});
  }, [currentUser]);

  const stats = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);

    const globalKpis = [
      { label: 'Total clients', value: clients.length, evolution: '+0%', up: true, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Actifs', value: clients.filter(c => c.status === 'Actif').length, evolution: '+0%', up: true, icon: UserCheck, color: 'text-accent', bg: 'bg-accent-light' },
      { label: 'Inactifs', value: clients.filter(c => c.status === 'Inactif').length, evolution: '-0%', up: false, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-50' },
      { label: 'Prospects', value: clients.filter(c => c.statutMetier === 'En qualification' || c.status === 'En négociation').length, evolution: '+0%', up: true, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    const buildSummary = (typeClients: any[]) => {
      const total = typeClients.length;
      const actifs = typeClients.filter(c => c.status === 'Actif').length;
      const enNegociation = typeClients.filter(c => c.statutMetier === 'En negociation' || c.status === 'En négociation').length;
      const nouveauCeMois = typeClients.filter(c => c.createdAt?.startsWith(currentMonth)).length;
      const biensProposes = typeClients.reduce((sum, c) => sum + (c.pieces || 0), 0);
      return { total, actifs, enNegociation, nouveauCeMois, biensProposes };
    };

    const typeStats = clientTypes.map(({ type, title }) => {
      const typeClients = clients.filter(c => c.type === title.slice(0, -1));
      const s = buildSummary(typeClients);
      const summaries: Record<string, string> = {
        acheteur: `${s.total} client${s.total !== 1 ? 's' : ''} · ${s.actifs} actif${s.actifs !== 1 ? 's' : ''} · ${s.enNegociation} en négociation · ${s.nouveauCeMois} ce mois · ${s.biensProposes} biens proposés`,
        vendeur: `${s.total} client${s.total !== 1 ? 's' : ''} · ${s.actifs} actif${s.actifs !== 1 ? 's' : ''} · ${s.enNegociation} en négociation · ${s.nouveauCeMois} vendu${s.nouveauCeMois !== 1 ? 's' : ''} ce mois · ${s.biensProposes} biens en stock`,
        bailleur: `${s.total} client${s.total !== 1 ? 's' : ''} · ${s.actifs} actif${s.actifs !== 1 ? 's' : ''} · ${s.enNegociation} en négociation · ${s.nouveauCeMois} location${s.nouveauCeMois !== 1 ? 's' : ''} ce mois · ${s.biensProposes} biens en location`,
        locataire: `${s.total} client${s.total !== 1 ? 's' : ''} · ${s.actifs} actif${s.actifs !== 1 ? 's' : ''} · ${s.enNegociation} en dossier · ${s.nouveauCeMois} bail${s.nouveauCeMois !== 1 ? 's' : ''} signé${s.nouveauCeMois !== 1 ? 's' : ''} · ${s.biensProposes} biens proposés`,
        voyageur: `${s.total} client${s.total !== 1 ? 's' : ''} · ${s.actifs} actif${s.actifs !== 1 ? 's' : ''} · ${s.enNegociation} réservation${s.enNegociation !== 1 ? 's' : ''} confirmée${s.enNegociation !== 1 ? 's' : ''} · ${s.nouveauCeMois} séjour${s.nouveauCeMois !== 1 ? 's' : ''} ce mois`,
      };
      return { type, title, ...s, summary: summaries[type] || '' };
    });

    return { globalKpis, typeStats };
  }, [clients]);

  if (permsLoaded && !canRead) {
    return (
      <Stage theme={theme}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <OrbIcon icon={Lock} hue={STAGE_HUES.fuchsia} size={58} radius={18} />
          <h2 className={dark ? 'mt-5 text-lg font-bold text-white' : 'mt-5 text-lg font-bold text-slate-950'}>Clients verrouillés</h2>
          <p className={dark ? 'mt-1 max-w-sm text-sm text-slate-400' : 'mt-1 max-w-sm text-sm text-teal-900/60'}>Vous n'avez pas la permission d'accéder aux clients. Contactez votre administrateur.</p>
        </div>
      </Stage>
    );
  }

  const statCards = stats.globalKpis.map((kpi, index) => ({
    ...kpi,
    hue: [STAGE_HUES.violet, STAGE_HUES.emerald, STAGE_HUES.fuchsia, STAGE_HUES.amber][index],
    spark: index === 0 ? [4, 5, 4, 7, 6, clients.length] : [1, 2, 1, 3, 2, kpi.value],
  }));

  return (
    <Stage theme={theme}>
      <div className="space-y-6 animate-fade-in smooth-scroll">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" /></span>
              <p className={dark ? 'text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400/80' : 'text-[10px] font-bold uppercase tracking-[0.24em] text-teal-900/50'}>Mission control · Relation client</p>
            </div>
            <h1 className={dark ? 'mt-1 bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent' : 'mt-1 bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent'}>Types de clients</h1>
            <p className={dark ? 'mt-1 text-sm text-slate-400' : 'mt-1 text-sm text-teal-900/55'}>{clients.length} client{clients.length !== 1 ? 's' : ''} · {stats.typeStats.filter(t => t.total > 0).length} segments actifs</p>
          </div>
          <StageButton variant="primary" size="md" onClick={() => navigate('/clients/create')} icon={<UserPlus size={15} />}>Nouveau client</StageButton>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((stat, i) => <StageStatCard key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} hue={stat.hue} spark={stat.spark} trend={stat.evolution} trendUp={stat.up} delay={i * 0.05} />)}
        </div>

        <StagePanel title="Portefeuille client" icon={Users} hue={STAGE_HUES.violet}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className={dark ? 'text-xl font-bold text-white' : 'text-xl font-bold text-slate-900'}>Choisissez un segment</h2>
              <p className={dark ? 'mt-1 text-sm text-slate-400' : 'mt-1 text-sm text-teal-900/60'}>Accédez rapidement aux dossiers et aux actions de chaque clientèle.</p>
            </div>
            <StageBadge variant="violet">Vue personnelle</StageBadge>
          </div>
          <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {stats.typeStats.map((ct, index) => {
              const config = clientTypes.find(c => c.type === ct.type)!;
              return <ClientTypeOrb key={ct.type} clientType={{ ...config, ...ct, active: ct.actifs }} index={index} onClick={() => navigate(`/clients/type/${ct.type}`)} />;
            })}
          </div>
        </StagePanel>
      </div>
    </Stage>
  );
}
