import { useState } from 'react'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { Briefcase, User, FileText, ChevronDown } from 'react-feather'
import { motion, AnimatePresence } from 'framer-motion'

const CONTRACT_STATUSES: Record<string, string> = {
  signe: 'Signé',
  en_cours: 'En cours',
  expire: 'Expiré',
}

interface PartnerFormProps {
  form: any
  setForm: (f: any) => void
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

export default function PartnerForm({ form, setForm }: PartnerFormProps) {
  return (
    <div className="space-y-4">
      <Section title="Informations du partenaire" icon={Briefcase} defaultOpen={true}>
        <Input
          label="Nom du partenaire"
          required
          value={form.name || ''}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="Ex : Habibis"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Personne de contact"
            value={form.contact_name || ''}
            onChange={e => setForm({ ...form, contact_name: e.target.value })}
            placeholder="Nom du contact"
          />
          <Input
            label="Téléphone"
            value={form.phone || ''}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            placeholder="+212..."
          />
        </div>
        <Input
          label="Email"
          type="email"
          value={form.email || ''}
          onChange={e => setForm({ ...form, email: e.target.value })}
          placeholder="email@..."
        />
        <Input
          label="Adresse"
          value={form.address || ''}
          onChange={e => setForm({ ...form, address: e.target.value })}
          placeholder="Adresse du partenaire"
        />
      </Section>

      <Section title="Contrat et commission" icon={FileText} defaultOpen={true}>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Taux de commission (%)"
            type="number"
            value={form.commission_rate || '10'}
            onChange={e => setForm({ ...form, commission_rate: e.target.value })}
          />
          <Select
            label="Statut du contrat"
            options={Object.entries(CONTRACT_STATUSES).map(([k, v]) => ({ value: k, label: v }))}
            value={form.contract_status || 'en_cours'}
            onChange={v => setForm({ ...form, contract_status: v })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-text mb-1.5 block">Notes internes</label>
          <textarea
            value={form.notes || ''}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Notes sur le partenaire..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent transition-all resize-none"
          />
        </div>
      </Section>
    </div>
  )
}
