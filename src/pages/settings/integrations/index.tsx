import { useState } from 'react'
import Card from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Switch } from '../../../components/ui/Switch'
import { BackLink } from '../../../components/ui/BackLink'
import { Calendar, Download, HelpCircle, Copy, RefreshCw, Link } from 'react-feather'
import { motion } from 'framer-motion'

export default function IntegrationsPage() {
  const [crmToGoogle, setCrmToGoogle] = useState(true)
  const [googleToCrm, setGoogleToCrm] = useState(true)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <BackLink />
      <h1 className="text-2xl font-semibold tracking-tight">Intégrations</h1>

      <Card className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-accent-light text-accent">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="font-semibold">Google Calendar</h3>
              <p className="text-xs text-text-secondary mt-0.5">Synchronisez vos rendez-vous</p>
            </div>
          </div>
          <Badge variant="success">
            <span className="mr-1">✅</span> Connecté à karim@m2squaremeter.com
          </Badge>
        </div>

        <div className="space-y-4 mb-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Synchroniser les rendez-vous CRM → Google Agenda</p>
            </div>
            <Switch checked={crmToGoogle} onCheckedChange={setCrmToGoogle} />
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border/30">
            <div>
              <p className="text-sm font-medium">Synchroniser les rendez-vous Google Agenda → CRM</p>
            </div>
            <Switch checked={googleToCrm} onCheckedChange={setGoogleToCrm} />
          </div>
        </div>

        <p className="text-xs text-text-secondary mb-4">
          Dernière synchronisation : 13/06/2026 08:30
        </p>

        <div className="flex gap-3">
          <Button variant="outline" icon={<RefreshCw size={14} />}>Synchroniser maintenant</Button>
          <Button variant="outline" className="border-error/50 text-error hover:bg-red-50 hover:text-error">Déconnecter</Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-accent-light text-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <h3 className="font-semibold">Google Contacts</h3>
              <p className="text-xs text-text-secondary mt-0.5">Importez vos contacts Google</p>
            </div>
          </div>
          <Badge variant="warning">
            <span className="mr-1">❌</span> Non connecté
          </Badge>
        </div>

        <Button variant="outline" icon={<Link size={14} />}>Connecter Google Contacts</Button>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-lg bg-accent-light text-accent">
            <HelpCircle size={18} />
          </div>
          <div>
            <h3 className="font-semibold">API (pour développeur)</h3>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-background border border-border/50 mb-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              Clé API : <span className="font-mono text-text">sk_••••••••••••••••a3f8</span>
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" icon={<Copy size={14} />}>Copier la clé</Button>
          <Button variant="ghost" className="text-error hover:text-error">Régénérer</Button>
        </div>

        <p className="text-xs text-text-secondary mt-4">
          Consultez notre{' '}
          <a href="/docs/api" className="text-accent hover:underline">documentation API</a>
          {' '}pour plus d'informations.
        </p>
      </Card>

      <div className="flex justify-end">
        <Button variant="default">Enregistrer</Button>
      </div>
    </motion.div>
  )
}
