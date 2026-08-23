import { useState } from 'react'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { Calendar, User, ChevronDown } from 'react-feather'
import { motion, AnimatePresence } from 'framer-motion'

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

function Section({ title, icon: Icon, children, defaultOpen = true }: { title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-border/40 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-3.5 bg-background/50 hover:bg-background transition-colors text-left">
        <div className="p-1.5 rounded-lg bg-accent/10">
          <Icon size={14} className="text-accent" />
        </div>
        <span className="text-sm font-semibold text-text flex-1">{title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-text-secondary" />
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
            <div className="px-5 py-4 space-y-4 border-t border-border/30">
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

  return (
    <div className="space-y-4">
      <Section title="Détails de la réservation" icon={Calendar} defaultOpen={true}>
        <Select
          label="Activité"
          required
          options={activities.filter(a => a.is_active).map(a => ({
            value: String(a.id),
            label: `${a.name} (${formatPrice(a.price)})`,
          }))}
          value={form.activity_id || ''}
          onChange={v => setForm({ ...form, activity_id: v })}
          placeholder="Sélectionner..."
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date"
            required
            type="date"
            value={form.reservation_date || ''}
            onChange={e => setForm({ ...form, reservation_date: e.target.value })}
          />
          <Input
            label="Nombre de participants"
            type="number"
            value={form.participants || '1'}
            onChange={e => setForm({ ...form, participants: e.target.value })}
          />
        </div>
        {editing && (
          <Select
            label="Statut"
            options={Object.entries(RESERVATION_STATUSES).map(([k, v]) => ({ value: k, label: v }))}
            value={form.status || 'en_attente'}
            onChange={v => setForm({ ...form, status: v })}
          />
        )}
      </Section>

      <Section title="Informations voyageur" icon={User} defaultOpen={true}>
        <Input
          label="Nom du voyageur"
          required
          value={form.client_name || ''}
          onChange={e => setForm({ ...form, client_name: e.target.value })}
          placeholder="Prénom Nom"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            value={form.client_email || ''}
            onChange={e => setForm({ ...form, client_email: e.target.value })}
            placeholder="email@..."
          />
          <Input
            label="Téléphone"
            value={form.client_phone || ''}
            onChange={e => setForm({ ...form, client_phone: e.target.value })}
            placeholder="+212..."
          />
        </div>
      </Section>

      {selectedActivity && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-accent/5 rounded-xl p-4 border border-accent/10"
        >
          <p className="text-[11px] text-text-secondary uppercase tracking-wider mb-2">Estimation</p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-accent">{formatPrice(estimatedTotal)}</span>
            <span className="text-xs text-text-secondary">{participants} participant{participants > 1 ? 's' : ''}</span>
          </div>
        </motion.div>
      )}

      <div>
        <label className="text-sm font-medium text-text mb-1.5 block">Notes</label>
        <textarea
          value={form.notes || ''}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          rows={2}
          placeholder="Notes supplémentaires..."
          className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent transition-all resize-none"
        />
      </div>
    </div>
  )
}
