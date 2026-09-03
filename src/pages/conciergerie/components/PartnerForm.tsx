import { useState } from 'react'
import { Select } from '../../../components/ui/Select'
import { Briefcase, User, FileText, ChevronDown } from 'react-feather'
import { motion, AnimatePresence } from 'framer-motion'
import { useStageChrome } from '../../../components/modules/calendar/useStageChrome'
import { useStageFormClasses } from '../../../components/modules/calendar/StageModal'
import { cn } from '../../../lib/utils'
import { OrbIcon, STAGE_HUES } from '../../../components/dashboard/Stage'

const CONTRACT_STATUSES: Record<string, string> = {
  signe: 'Signé',
  en_cours: 'En cours',
  expire: 'Expiré',
}

interface PartnerFormProps {
  form: any
  setForm: (f: any) => void
}

function Section({ title, icon: Icon, hue = STAGE_HUES.violet, children, defaultOpen = true }: { title: string; icon: any; hue?: any; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const { staged, dark } = useStageChrome()
  return (
    <div className={cn('overflow-hidden rounded-2xl border', staged ? (dark ? 'border-white/5 bg-white/[0.03]' : 'border-slate-200 bg-white shadow-sm') : 'border-border/40 bg-card')}>
      <button type="button" onClick={() => setOpen(!open)}
        className={cn('w-full flex items-center gap-3 px-5 py-3.5 transition-colors text-left', staged ? (dark ? 'bg-white/[0.02] hover:bg-white/[0.05]' : 'bg-slate-50/70 hover:bg-white') : 'bg-background/50 hover:bg-background')}>
        <OrbIcon icon={Icon} hue={hue} size={26} radius={8} />
        <span className={cn('text-sm font-bold flex-1', staged ? (dark ? 'text-white' : 'text-slate-900') : 'text-text')}>{title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className={dark ? 'text-slate-400' : 'text-slate-500'} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className={cn('px-5 py-4 space-y-4 border-t', staged ? (dark ? 'border-white/5' : 'border-slate-100') : 'border-border/30')}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PartnerForm({ form, setForm }: PartnerFormProps) {
  const { input: stageInput, label: stageLabel, staged, dark } = useStageFormClasses()
  const ctrl = (extra?: string) => (staged ? stageInput(extra) : undefined)

  return (
    <div className="space-y-4">
      <Section title="Informations du partenaire" icon={Briefcase} hue={STAGE_HUES.violet} defaultOpen={true}>
        <div>
          <label className={stageLabel}>Nom du partenaire <span className="text-rose-500">*</span></label>
          <input
            value={form.name || ''}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Ex : Habibis"
            className={stageInput('h-10')}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={stageLabel}>Personne de contact</label>
            <input
              value={form.contact_name || ''}
              onChange={e => setForm({ ...form, contact_name: e.target.value })}
              placeholder="Nom du contact"
              className={stageInput('h-10')}
            />
          </div>
          <div>
            <label className={stageLabel}>Téléphone</label>
            <input
              value={form.phone || ''}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="+212..."
              className={stageInput('h-10')}
            />
          </div>
        </div>
        <div>
          <label className={stageLabel}>Email</label>
          <input
            type="email"
            value={form.email || ''}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="email@..."
            className={stageInput('h-10')}
          />
        </div>
        <div>
          <label className={stageLabel}>Adresse</label>
          <input
            value={form.address || ''}
            onChange={e => setForm({ ...form, address: e.target.value })}
            placeholder="Adresse du partenaire"
            className={stageInput('h-10')}
          />
        </div>
      </Section>

      <Section title="Contrat et commission" icon={FileText} hue={STAGE_HUES.amber} defaultOpen={true}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={stageLabel}>Taux de commission (%)</label>
            <input
              type="number"
              value={form.commission_rate || '10'}
              onChange={e => setForm({ ...form, commission_rate: e.target.value })}
              className={stageInput('h-10')}
            />
          </div>
          <div>
            <label className={stageLabel}>Statut du contrat</label>
            <Select
              options={Object.entries(CONTRACT_STATUSES).map(([k, v]) => ({ value: k, label: v }))}
              value={form.contract_status || 'en_cours'}
              onChange={v => setForm({ ...form, contract_status: v })}
              className={ctrl('h-10')}
            />
          </div>
        </div>
        <div>
          <label className={stageLabel}>Notes internes</label>
          <textarea
            value={form.notes || ''}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Notes sur le partenaire..."
            className={stageInput('resize-none py-2 min-h-[80px]')}
          />
        </div>
      </Section>
    </div>
  )
}
