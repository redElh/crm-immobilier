import { motion } from 'framer-motion';
import { Clock, RefreshCw, Share2 } from 'react-feather';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { MotionCard } from '../../ui/Card';
import { PORTAL_PARTNER_GROUPS, PORTAL_PARTNERS } from '../../../data/portalPartners';
import type { PortalPartner } from '../../../data/portalPartners';
import type { Property } from '../../../types/property';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const portalLabels: Record<string, string> = {
  published: 'Publié',
  pending: 'En attente',
  error: 'Erreur',
  not_sent: 'Non envoyé',
};

const badgeVariants: Record<PortalStatusKey, 'success' | 'warning' | 'error' | 'secondary'> = {
  published: 'success',
  pending: 'warning',
  error: 'error',
  not_sent: 'secondary',
};

interface PropertyTransferProps {
  property?: Property;
  isGerant?: boolean;
}

type PortalStatusKey = 'published' | 'pending' | 'error' | 'not_sent';

const portalImageSrc = (image: string) => encodeURI(`/portail/${image}`);

const formatSync = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const actionFor = (status: PortalStatusKey) => {
  if (status === 'not_sent') return { label: 'Publier', variant: 'outline' as const, icon: <Share2 size={12} /> };
  if (status === 'error') return { label: 'Réessayer', variant: 'outline' as const, icon: <RefreshCw size={12} /> };
  return { label: 'Détails', variant: 'ghost' as const, icon: undefined };
};

export const PropertyTransfer = ({ property, isGerant = false }: PropertyTransferProps) => {
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
    <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }} className="p-0 overflow-hidden">
      <div className="px-6 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-text">TRANSFERT / DIFFUSION</h3>
            <p className="text-sm text-text-secondary mt-0.5">Diffusion sur les portails partenaires</p>
          </div>
          <Button
            variant="default"
            size="sm"
            icon={<RefreshCw size={14} />}
            className={isGerant ? 'bg-[#905D5D] hover:bg-[#7D5050] border-[#905D5D] hover:border-[#7D5050] text-white' : ''}
          >
            Synchroniser tout
          </Button>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          {PORTAL_PARTNER_GROUPS.map(group => (
            <motion.div key={group.id} variants={item}>
              <div className="rounded-2xl border border-border/40 bg-background/40 p-4 sm:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-text">{group.label}</h4>
                    <p className="mt-1 text-xs text-text-secondary">Portails de diffusion de ce groupe.</p>
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                    {group.partners.filter(portal => selected[portal.key]).length}/{group.partners.length} diffusés
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {group.partners.map(portal => {
                    const { status, lastSync } = rowFor(portal);
                    const action = actionFor(status);

                    return (
                      <div
                        key={portal.key}
                        className="relative flex h-full flex-col items-center rounded-2xl border border-border/40 bg-white p-3 text-center shadow-[0_1px_3px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(15,23,42,0.08)]"
                      >
                        <div className="flex min-h-[72px] w-full items-center justify-center px-2 pt-2">
                          <img
                            src={portalImageSrc(portal.image)}
                            alt={portal.label}
                            className="max-h-14 max-w-full object-contain"
                            loading="lazy"
                          />
                        </div>

                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text">{portal.label}</p>

                        <div className="mt-2">
                          <Badge
                            size="sm"
                            variant={badgeVariants[status]}
                            className={status === 'pending' && isGerant ? 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]' : undefined}
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {portalLabels[status]}
                            </span>
                          </Badge>
                        </div>

                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-text-secondary">
                          <Clock size={10} className="shrink-0" />
                          <span>Dernière sync : {formatSync(lastSync)}</span>
                        </div>

                        <div className="mt-auto w-full pt-3 pb-1">
                          <Button variant={action.variant} size="sm" className="w-full" icon={action.icon}>
                            {action.label}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="p-3 rounded-xl bg-background border border-border/40 text-center">
            <p className="text-lg font-semibold text-emerald-600">{counts.published}</p>
            <p className="text-xs text-text-secondary mt-0.5">Publiés</p>
          </div>
          <div className="p-3 rounded-xl bg-background border border-border/40 text-center">
            <p className={`text-lg font-semibold ${isGerant ? 'text-[#905D5D]' : 'text-amber-600'}`}>{counts.pending}</p>
            <p className="text-xs text-text-secondary mt-0.5">En attente</p>
          </div>
          <div className="p-3 rounded-xl bg-background border border-border/40 text-center">
            <p className="text-lg font-semibold text-red-600">{counts.error}</p>
            <p className="text-xs text-text-secondary mt-0.5">Erreurs</p>
          </div>
          <div className="p-3 rounded-xl bg-background border border-border/40 text-center">
            <p className="text-lg font-semibold text-gray-500">{counts.not_sent}</p>
            <p className="text-xs text-text-secondary mt-0.5">Non envoyé</p>
          </div>
        </div>
      </div>
    </MotionCard>
  );
};
