import { Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Check } from 'react-feather';
import { MotionCard } from '../../../../components/ui/Card';
import { PORTAL_PARTNER_GROUPS } from '../../../../data/portalPartners';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

interface TransfertTabProps {
  control: any;
  setValue: any;
  isGerant?: boolean;
}

export function TransfertTab({ control, setValue, isGerant = false }: TransfertTabProps) {
  const portalImageSrc = (image: string) => encodeURI(`/portail/${image}`);

  const updateGroup = (groupId: string, checked: boolean) => {
    const group = PORTAL_PARTNER_GROUPS.find(item => item.id === groupId);
    if (!group) return;

    group.partners.forEach(portal => {
      setValue(`transfert.portals.${portal.key}`, checked, { shouldDirty: true, shouldTouch: true });
    });
  };

  return (
    <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="p-0 overflow-hidden">
      <div className="px-6 py-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text">TRANSFERT / DIFFUSION</h3>
          <p className="text-sm text-text-secondary mt-0.5">Diffusion sur les portails partenaires</p>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          {PORTAL_PARTNER_GROUPS.map(group => (
            <motion.div key={group.id} variants={item}>
              <div className="rounded-2xl border border-border/40 bg-background/40 p-4 sm:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-text">{group.label}</h4>
                    <p className="mt-1 text-xs text-text-secondary">Choisissez les portails de diffusion pour ce groupe.</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                    <button
                      type="button"
                      className={`transition-colors ${isGerant ? 'text-[#905D5D] hover:text-[#7D5050]' : 'text-accent hover:text-accent/80'}`}
                      onClick={() => updateGroup(group.id, false)}
                    >
                      Décocher tous
                    </button>
                    <span className="text-text-secondary/40">|</span>
                    <button
                      type="button"
                      className={`transition-colors ${isGerant ? 'text-[#905D5D] hover:text-[#7D5050]' : 'text-accent hover:text-accent/80'}`}
                      onClick={() => updateGroup(group.id, true)}
                    >
                      Cocher tous
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {group.partners.map(portal => (
                    <Controller
                      key={portal.key}
                      name={`transfert.portals.${portal.key}`}
                      control={control}
                      render={({ field }) => {
                        const isSelected = Boolean(field.value);

                        return (
                          <button
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => field.onChange(!isSelected)}
                            className={`group relative min-h-[150px] rounded-2xl border bg-white p-3 text-left shadow-[0_1px_3px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(15,23,42,0.08)] ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/15' : 'border-border/40 hover:border-emerald-300'}`}
                          >
                            <span className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border transition-all ${isSelected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border/40 bg-white text-transparent group-hover:border-emerald-300'}`}>
                              <Check size={14} strokeWidth={3} />
                            </span>

                            <div className="flex h-full flex-col justify-between gap-3">
                              <div className="flex min-h-[84px] items-center justify-center px-2 pt-2">
                                <img
                                  src={portalImageSrc(portal.image)}
                                  alt={portal.label}
                                  className="max-h-16 max-w-full object-contain"
                                  loading="lazy"
                                />
                              </div>

                              <div className="space-y-1.5 text-center">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text">{portal.label}</p>
                                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-secondary/70">{group.label}</p>
                              </div>
                            </div>
                          </button>
                        );
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </MotionCard>
  );
}
