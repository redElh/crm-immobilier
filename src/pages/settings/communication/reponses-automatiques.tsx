import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { DatePicker } from '../../../components/ui/DatePicker'
import { TimePicker } from '../../../components/ui/TimePicker'
import { Input } from '../../../components/ui/Input'
import { Textarea } from '../../../components/ui/Textarea'
import { Switch } from '../../../components/ui/Switch'
import { BackLink } from '../../../components/ui/BackLink'
import { Save, Clock, Edit3, MessageSquare, FileText } from 'react-feather'

const commTabs = [
  { label: 'Signature', icon: Edit3, to: '/settings/communication/signature' },
  { label: 'Réponses auto', icon: MessageSquare, to: '/settings/communication/reponses-automatiques' },
  { label: 'Modèles', icon: FileText, to: '/messages/templates' },
]

const TEMPLATE_MESSAGE = `Bonjour,

Je suis actuellement absent(e) et je ne pourrai pas répondre à votre message avant mon retour.

Pour toute urgence, veuillez contacter mon agence au 01 23 45 67 89.

Cordialement,
{{agent.prenom}} {{agent.nom}}`

export default function ReponsesAutomatiquesPage() {
  const [enabled, setEnabled] = useState(false)
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [heureDebut, setHeureDebut] = useState('')
  const [heureFin, setHeureFin] = useState('')
  const [message, setMessage] = useState(TEMPLATE_MESSAGE)
  const [oncePerSender, setOncePerSender] = useState(true)

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
      <h1 className="text-2xl font-semibold tracking-tight">Réponses automatiques (absence)</h1>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 mt-0.5">
              <Clock size={16} />
            </div>
            <div>
              <p className="text-sm font-medium">Activer les réponses automatiques</p>
              <p className="text-xs text-text-secondary mt-0.5">Un message automatique sera envoyé en votre absence</p>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </Card>

      <Card className="p-6 space-y-6">
        <div>
          <h3 className="font-semibold mb-4">Période d'absence</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DatePicker
              label="Du"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              disabled={!enabled}
              className={!enabled ? 'opacity-50 cursor-not-allowed' : ''}
            />
            <DatePicker
              label="Au"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              disabled={!enabled}
              className={!enabled ? 'opacity-50 cursor-not-allowed' : ''}
            />
            <TimePicker
              label="À partir de"
              value={heureDebut}
              onChange={(e) => setHeureDebut(e.target.value)}
              disabled={!enabled}
              className={!enabled ? 'opacity-50 cursor-not-allowed' : ''}
            />
            <TimePicker
              label="Jusqu'à"
              value={heureFin}
              onChange={(e) => setHeureFin(e.target.value)}
              disabled={!enabled}
              className={!enabled ? 'opacity-50 cursor-not-allowed' : ''}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-text mb-2 block">Message d'absence</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[180px]"
            placeholder={TEMPLATE_MESSAGE}
            disabled={!enabled}
          />
        </div>

        <div className="flex items-center justify-between py-3 border-t border-border/30">
          <div>
            <p className="text-sm font-medium">N'envoyer la réponse qu'une seule fois par expéditeur</p>
            <p className="text-xs text-text-secondary mt-0.5">Évite les réponses répétées pour chaque message du même contact</p>
          </div>
          <Switch checked={oncePerSender} onCheckedChange={setOncePerSender} disabled={!enabled} />
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline">Annuler</Button>
        <Button variant="default" icon={<Save size={14} />}>Enregistrer</Button>
      </div>
    </div>
  )
}
