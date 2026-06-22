import { useState, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Textarea } from '../../../components/ui/Textarea'
import { Switch } from '../../../components/ui/Switch'
import { BackLink } from '../../../components/ui/BackLink'
import { motion } from 'framer-motion'
import { Save, Plus, Edit3, MessageSquare, FileText } from 'react-feather'

const commTabs = [
  { label: 'Signature', icon: Edit3, to: '/settings/communication/signature' },
  { label: 'Réponses auto', icon: MessageSquare, to: '/settings/communication/reponses-automatiques' },
  { label: 'Modèles', icon: FileText, to: '/messages/templates' },
]

const VARIABLES = [
  { label: 'Prénom agent', value: '{{agent.prenom}}' },
  { label: 'Nom agent', value: '{{agent.nom}}' },
  { label: 'Email agent', value: '{{agent.email}}' },
  { label: 'Téléphone agent', value: '{{agent.telephone}}' },
  { label: "Nom agence", value: '{{agence.nom}}' },
  { label: 'Slogan agence', value: '{{agence.slogan}}' },
]

const DEFAULT_SIGNATURE = `--\n{{agent.prenom}} {{agent.nom}}\nAgent Commercial\n{{agence.nom}}\n{{agent.email}} | {{agent.telephone}}`

export default function SignaturePage() {
  const [signature, setSignature] = useState(DEFAULT_SIGNATURE)
  const [autoAdd, setAutoAdd] = useState(true)
  const [newMessagesOnly, setNewMessagesOnly] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertVariable = (value: string) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = signature.slice(0, start)
    const after = signature.slice(end)
    const updated = before + value + after
    setSignature(updated)
    requestAnimationFrame(() => {
      textarea.focus()
      const pos = start + value.length
      textarea.setSelectionRange(pos, pos)
    })
  }

  const preview = signature || 'Aucune signature'

  const location = useLocation()

  return (
    <div className="space-y-6">
      <BackLink />
      <div className="flex gap-1 p-1 rounded-lg bg-background border border-border/50 w-fit">
        {commTabs.map((tab) => {
          const TabIcon = tab.icon
          const isActive = location.pathname === tab.to
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                isActive
                  ? 'bg-card text-text shadow-sm'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              <TabIcon size={15} />
              {tab.label}
            </NavLink>
          )
        })}
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Signature email</h1>

      <Card className="p-6 space-y-6">
        <div>
          <label className="text-sm font-medium text-text mb-2 block">Aperçu</label>
          <div className="border border-border/50 rounded-lg bg-background p-4 min-h-[100px] text-sm whitespace-pre-wrap">
            {preview}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-text mb-2 block">Contenu</label>
          <Textarea
            ref={textareaRef}
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
            placeholder="Votre signature..."
          />
        </div>

        <div>
          <label className="text-sm font-medium text-text mb-2 block">Variables dynamiques</label>
          <div className="flex flex-wrap gap-2">
            {VARIABLES.map((v) => (
              <motion.button
                key={v.value}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => insertVariable(v.value)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-border bg-card text-text-secondary hover:bg-background hover:border-text-secondary/30 transition-colors"
              >
                <Plus size={12} />
                {v.label}
              </motion.button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
          <div>
            <p className="text-sm font-medium">Ajouter automatiquement cette signature à tous les emails</p>
            <p className="text-xs text-text-secondary mt-0.5">La signature sera jointe à chaque nouvel email envoyé</p>
          </div>
          <Switch checked={autoAdd} onCheckedChange={setAutoAdd} />
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium">Ajouter la signature uniquement aux nouveaux messages</p>
            <p className="text-xs text-text-secondary mt-0.5">Ignorer les réponses et transferts</p>
          </div>
          <Switch checked={newMessagesOnly} onCheckedChange={setNewMessagesOnly} />
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline">Annuler</Button>
        <Button variant="default" icon={<Save size={14} />}>Enregistrer</Button>
      </div>
    </div>
  )
}
