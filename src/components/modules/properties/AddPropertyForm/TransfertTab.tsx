import { Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';
import { DatePicker } from '../../../../components/ui/DatePicker';
import { Input } from '../../../../components/ui/Input';
import { Checkbox } from '../../../../components/ui/Checkbox';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

interface TransfertTabProps {
  register: any;
  control: any;
}

const PORTAL_PARTNERS = [
  'Mubawab', 'Properstar', 'Green-Acres', 'Kyero',
  'LuxuryEstate', 'JamesEdition', 'Avito', 'M2 Square Meter (site)',
];

const STATUS_OPTIONS = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'publie', label: 'Publié' },
  { value: 'erreur', label: 'Erreur' },
];

export function TransfertTab({ register, control }: TransfertTabProps) {
  return (
    <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="p-0 overflow-hidden">
      <div className="px-6 py-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text">TRANSFERT / DIFFUSION</h3>
          <p className="text-sm text-text-secondary mt-0.5">Diffusion sur les portails partenaires</p>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item}>
            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
              <h4 className="font-medium text-sm text-text mb-3">Partenaires actifs</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PORTAL_PARTNERS.map(partner => (
                  <Controller
                    key={partner}
                    name={`transfert.portals.${partner.toLowerCase().replace(/[()]/g, '').replace(/\s+/g, '_')}`}
                    control={control}
                    render={({ field }) => (
                      <Checkbox label={partner} checked={field.value} onChange={(c) => field.onChange(c)} />
                    )}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={item}>
            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
              <h4 className="font-medium text-sm text-text mb-3">Statut</h4>
              <div className="flex items-center gap-6">
                {STATUS_OPTIONS.map(opt => (
                  <Controller
                    key={opt.value}
                    name="transfert.status"
                    control={control}
                    render={({ field }) => (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          className="w-4 h-4 text-accent border-border bg-card focus:ring-accent"
                          value={opt.value}
                          checked={field.value === opt.value}
                          onChange={() => field.onChange(opt.value)}
                        />
                        <span className="text-sm text-text">{opt.label}</span>
                      </label>
                    )}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={item}>
            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
              <DatePicker
                label="Dernière publication"
                defaultValue="2026-06-10"
                {...register('transfert.lastPublication')}
              />
            </div>
          </motion.div>

          <motion.div variants={item}>
            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
              <label className="text-sm font-medium text-text">Actions</label>
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-all active:scale-[0.98]"
                >
                  Diffuser maintenant
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-text hover:bg-background transition-all active:scale-[0.98]"
                >
                  Voir les statistiques
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </MotionCard>
  );
}
