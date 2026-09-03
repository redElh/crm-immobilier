import { motion } from 'framer-motion';
import { Clock, RefreshCw, Share2, Globe, CheckCircle, AlertCircle, Send, EyeOff } from 'react-feather';
import { PORTAL_PARTNER_GROUPS, PORTAL_PARTNERS } from '../../../data/portalPartners';
import type { PortalPartner } from '../../../data/portalPartners';
import type { Property } from '../../../types/property';
import { useStageChrome } from '../calendar/useStageChrome';
import {
  OrbIcon, TiltCard, StageBadge, StageButton,
  STAGE_HUES, SLATE_HUE, AnimatedNumber,
} from '../../dashboard/Stage';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const portalLabels: Record<string, string> = {
  published: 'Publié',
  pending: 'En attente',
  error: 'Erreur',
  not_sent: 'Non envoyé',
};

const badgeMap: Record<PortalStatusKey, 'ok' | 'warn' | 'danger' | 'neutral'> = {
  published: 'ok',
  pending: 'warn',
  error: 'danger',
  not_sent: 'neutral',
};

interface PropertyTransferProps {
  property?: Property;
  isGerant?: boolean;
}

type PortalStatusKey = 'published' | 'pending' | 'error' | 'not_sent';

const portalImageSrc = (image: string) => encodeURI(`/portail/${image}`);

const formatSync = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const actionFor = (status: PortalStatusKey) => {
  if (status === 'not_sent') return { label: 'Publier', icon: <Send size={12} /> };
  if (status === 'error') return { label: 'Réessayer', icon: <RefreshCw size={12} /> };
  if (status === 'pending') return { label: 'En attente', icon: <Clock size={12} /> };
  return { label: 'Détails', icon: <Globe size={12} /> };
};

export const PropertyTransfer = ({ property, isGerant = false }: PropertyTransferProps) => {
  const { staged, dark } = useStageChrome();
  const selected = ((property as any)?.transfert as any)?.portals || {};
  const portalStatuses = property?.portalStatus || [];

  const rowFor = (portal: PortalPartner): { status: PortalStatusKey; lastSync?: string } => {
    const synced = portalStatuses.find(p => p.portalName === portal.label);
    const status = (synced?.status || (selected[portal.key] ? 'pending' : 'not_sent')) as PortalStatusKey;
    return { status, lastSync: synced?.lastSync };
  };

  const counts = PORTAL_PARTNERS.reduce(
    (acc, portal) => {
      acc[rowFor(portal).status] += 1;
      return acc;
    },
    { published: 0, pending: 0, error: 0, not_sent: 0 },
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={staged ? { opacity: 0, y: 12 } : undefined}
        animate={staged ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`rounded-2xl p-5 ${staged ? (dark ? 'bg-white/[0.04] border border-white/[0.08]' : 'bg-white/80 border border-teal-900/10') : 'bg-card border border-border/50 shadow-card'}`}
      >
        {staged && (
          <div className="pointer-events-none absolute top-0 left-[10%] right-[10%] h-px" style={{
            background: dark
              ? 'linear-gradient(90deg, transparent, rgba(139,124,255,0.5), rgba(94,234,212,0.3), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(13,148,136,0.5), rgba(124,92,255,0.25), transparent)'
          }} />
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <OrbIcon icon={Share2} hue={STAGE_HUES.sky} size={40} radius={12} className="shrink-0" />
            <div className="min-w-0">
              <h3 className={`text-[15px] font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>Transfert / Diffusion</h3>
              <p className={`text-xs mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Diffusion sur les portails partenaires · {PORTAL_PARTNERS.length} portails</p>
            </div>
          </div>
          <StageButton variant="primary" size="sm" icon={<RefreshCw size={13} />}>
            Synchroniser tout
          </StageButton>
        </div>
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <StageBadge variant="ok">{counts.published} publiés</StageBadge>
          <StageBadge variant="warn">{counts.pending} en attente</StageBadge>
          <StageBadge variant="danger">{counts.error} erreurs</StageBadge>
          <StageBadge variant="neutral">{counts.not_sent} non envoyés</StageBadge>
        </div>
      </motion.div>

      {/* Groups */}
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        {PORTAL_PARTNER_GROUPS.map(group => (
          <motion.div key={group.id} variants={item}>
            <div className={`rounded-2xl overflow-hidden p-4 sm:p-5 ${staged ? (dark ? 'bg-white/[0.04] border border-white/[0.08]' : 'bg-white/80 border border-teal-900/10') : 'bg-card border border-border/50 shadow-card'}`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <OrbIcon icon={Globe} hue={STAGE_HUES.violet} size={32} radius={10} />
                  <div>
                    <h4 className={`text-sm font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>{group.label}</h4>
                    <p className={`text-xs mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Portails de diffusion de ce groupe</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${dark ? 'bg-white/[0.06] border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {group.partners.filter(portal => selected[portal.key]).length}/{group.partners.length} diffusés
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {group.partners.map(portal => {
                  const { status, lastSync } = rowFor(portal);
                  const action = actionFor(status);

                  const cardInner = (
                    <>
                      <div className={`flex min-h-[72px] w-full items-center justify-center px-2 pt-2 rounded-xl border ${dark ? 'bg-white/[0.04] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                        <img
                          src={portalImageSrc(portal.image)}
                          alt={portal.label}
                          className="max-h-14 max-w-full object-contain"
                          loading="lazy"
                        />
                      </div>

                      <p className={`mt-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-center truncate w-full ${dark ? 'text-white' : 'text-slate-900'}`}>{portal.label}</p>

                      <div className="mt-2">
                        <StageBadge variant={badgeMap[status]}>
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {portalLabels[status]}
                          </span>
                        </StageBadge>
                      </div>

                      <div className={`mt-2 flex items-center justify-center gap-1 text-[10px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <Clock size={10} className="shrink-0" />
                        <span className="truncate">Sync : {formatSync(lastSync)}</span>
                      </div>

                      <div className="mt-auto w-full pt-3">
                        {status === 'published' ? (
                          <StageButton variant="glass" size="sm" icon={action.icon} className="w-full justify-center">
                            {action.label}
                          </StageButton>
                        ) : status === 'not_sent' ? (
                          <StageButton variant="primary" size="sm" icon={action.icon} className="w-full justify-center">
                            {action.label}
                          </StageButton>
                        ) : (
                          <StageButton variant="glass" size="sm" icon={action.icon} className="w-full justify-center">
                            {action.label}
                          </StageButton>
                        )}
                      </div>
                    </>
                  );

                  return staged ? (
                    <TiltCard key={portal.key} className="p-3 flex flex-col items-center text-center min-h-[220px]">
                      {cardInner}
                    </TiltCard>
                  ) : (
                    <div
                      key={portal.key}
                      className="relative flex flex-col items-center rounded-2xl border border-border/40 bg-white p-3 text-center shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 min-h-[220px]"
                    >
                      {cardInner}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: 'Publiés', value: counts.published, hue: STAGE_HUES.emerald, icon: CheckCircle },
          { label: 'En attente', value: counts.pending, hue: STAGE_HUES.amber, icon: Clock },
          { label: 'Erreurs', value: counts.error, hue: STAGE_HUES.fuchsia, icon: AlertCircle },
          { label: 'Non envoyés', value: counts.not_sent, hue: SLATE_HUE, icon: EyeOff },
        ].map((s, i) => (
          <motion.div key={s.label} initial={staged ? { opacity: 0, y: 14 } : undefined} animate={staged ? { opacity: 1, y: 0 } : undefined} transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            {staged ? (
              <TiltCard className="p-3 text-center">
                <div className="flex items-center justify-center mb-2"><OrbIcon icon={s.icon} hue={s.hue} size={30} radius={9} /></div>
                <p className={`text-[9px] font-bold uppercase tracking-[0.16em] ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>{s.label}</p>
                <p className={`text-lg font-extrabold leading-tight tabular-nums ${dark ? 'text-white' : 'text-slate-900'}`}><AnimatedNumber value={s.value} /></p>
              </TiltCard>
            ) : (
              <div className="bg-card rounded-xl border border-border/50 shadow-card p-3 text-center">
                <p className="text-xs text-text-secondary/60 truncate">{s.label}</p>
                <p className="text-lg font-bold mt-0.5" style={{ color: s.hue.line }}>{s.value}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
