import { Select } from '../../../components/ui/Select'
import { Calendar, User, ChevronDown } from 'react-feather'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useStageChrome } from '../../../components/modules/calendar/useStageChrome'
import { useStageFormClasses } from '../../../components/modules/calendar/StageModal'
import { cn } from '../../../lib/utils'
import { OrbIcon, STAGE_HUES } from '../../../components/dashboard/Stage'

const RESERVATION_STATUSES: Record<string, string> = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  terminee: 'Terminée',
  annulee: 'Annulée',
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(n) + ' MAD'
}

interface ReservationFormProps {
  form: any
  setForm: (f: any) => void
  activities: { id: number; name: string; price: number; is_active: boolean }[]
  editing?: boolean
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

export default function ReservationForm({ form, setForm, activities, editing }: ReservationFormProps) {
  const selectedActivity = activities.find(a => String(a.id) === String(form.activity_id))
  const participants = Number(form.participants || 1)
  const estimatedTotal = selectedActivity ? selectedActivity.price * participants : 0
  const { input: stageInput, label: stageLabel, staged, dark } = useStageFormClasses()
  const ctrl = (extra?: string) => (staged ? stageInput(extra) : undefined)

  return (
    <div className="space-y-4">
      <Section title="Détails de la réservation" icon={Calendar} hue={STAGE_HUES.violet} defaultOpen={true}>
        <div>
          <label className={stageLabel}>Activité <span className="text-rose-500">*</span></label>
          <Select
            options={activities.filter(a => a.is_active).map(a => ({
              value: String(a.id),
              label: `${a.name} (${formatPrice(a.price)})`,
            }))}
            value={form.activity_id || ''}
            onChange={v => setForm({ ...form, activity_id: v })}
            placeholder="Sélectionner..."
            className={ctrl('h-10')}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={stageLabel}>Date <span className="text-rose-500">*</span></label>
            <input
              type="date"
              value={form.reservation_date || ''}
              onChange={e => setForm({ ...form, reservation_date: e.target.value })}
              className={stageInput('h-10')}
            />
          </div>
          <div>
            <label className={stageLabel}>Nombre de participants</label>
            <input
              type="number"
              value={form.participants || '1'}
              onChange={e => setForm({ ...form, participants: e.target.value })}
              className={stageInput('h-10')}
            />
          </div>
        </div>
        {editing && (
          <div>
            <label className={stageLabel}>Statut</label>
            <Select
              options={Object.entries(RESERVATION_STATUSES).map(([k, v]) => ({ value: k, label: v }))}
              value={form.status || 'en_attente'}
              onChange={v => setForm({ ...form, status: v })}
              className={ctrl('h-10')}
            />
          </div>
        )}
      </Section>

      <Section title="Informations voyageur" icon={User} hue={STAGE_HUES.sky} defaultOpen={true}>
        <div>
          <label className={stageLabel}>Nom du voyageur <span className="text-rose-500">*</span></label>
          <input
            value={form.client_name || ''}
            onChange={e => setForm({ ...form, client_name: e.target.value })}
            placeholder="Prénom Nom"
            className={stageInput('h-10')}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={stageLabel}>Email</label>
            <input
              type="email"
              value={form.client_email || ''}
              onChange={e => setForm({ ...form, client_email: e.target.value })}
              placeholder="email@..."
              className={stageInput('h-10')}
            />
          </div>
          <div>
            <label className={stageLabel}>Téléphone</label>
            <input
              value={form.client_phone || ''}
              onChange={e => setForm({ ...form, client_phone: e.target.value })}
              placeholder="+212..."
              className={stageInput('h-10')}
            />
          </div>
        </div>
      </Section>

      {selectedActivity && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('rounded-xl p-4 border', staged ? (dark ? 'bg-violet-500/10 border-violet-500/20' : 'bg-violet-50 border-violet-200') : 'bg-accent/5 border-accent/10')}
        >
          <p className={cn('text-[11px] uppercase tracking-wider mb-2 font-bold', dark ? 'text-violet-300' : 'text-violet-600')}>Estimation</p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold" style={{ color: STAGE_HUES.violet.a }}>{formatPrice(estimatedTotal)}</span>
            <span className={cn('text-xs', dark ? 'text-slate-400' : 'text-slate-500')}>{participants} participant{participants > 1 ? 's' : ''}</span>
          </div>
        </motion.div>
      )}

      <div>
        <label className={stageLabel}>Notes</label>
        <textarea
          value={form.notes || ''}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          rows={2}
          placeholder="Notes supplémentaires..."
          className={stageInput('resize-none py-2 min-h-[70px]')}
        />
      </div>
    </div>
  )
}
