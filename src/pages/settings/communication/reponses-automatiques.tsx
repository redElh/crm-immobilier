import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DatePicker } from '../../../components/ui/DatePicker'
import { TimePicker } from '../../../components/ui/TimePicker'
import { Textarea } from '../../../components/ui/Textarea'
import { Switch } from '../../../components/ui/Switch'
import { Save, Clock } from 'react-feather'
import {
  StageButton,
  OrbIcon,
  useStageTheme,
} from '../../../components/dashboard/Stage'
import {
  CommunicationSettingsTabs,
  SettingsBackButton,
  SettingsHero,
  useSettingsChrome,
} from '../../../components/settings/SettingsChrome'

const TEMPLATE_MESSAGE = `Bonjour,

Je suis actuellement absent(e) et je ne pourrai pas répondre à votre message avant mon retour.

Pour toute urgence, veuillez contacter mon agence au 01 23 45 67 89.

Cordialement,
{{agent.prenom}} {{agent.nom}}`

export default function ReponsesAutomatiquesPage() {
  const theme = useStageTheme()
  const { isDark, isAdmin, accent } = useSettingsChrome()
  const navigate = useNavigate()
  const [enabled, setEnabled] = useState(false)
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [heureDebut, setHeureDebut] = useState('')
  const [heureFin, setHeureFin] = useState('')
  const [message, setMessage] = useState(TEMPLATE_MESSAGE)
  const [oncePerSender, setOncePerSender] = useState(true)

  return (
    
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <SettingsBackButton />
          <CommunicationSettingsTabs />
        </div>

        <SettingsHero
          eyebrow="Communication · Absence"
          title="Réponses automatiques"
          subtitle="Un message automatique sera envoyé en votre absence"
        />

        <div className="stage-glass p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <OrbIcon icon={Clock} hue={accent} size={40} radius={12} />
              <div>
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Activer les réponses automatiques</p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Un message automatique sera envoyé en votre absence</p>
              </div>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>

        <div className={`stage-glass p-6 space-y-6 transition-opacity ${!enabled ? 'opacity-60' : ''}`}>
          <div>
            <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span className="h-1 w-6 rounded-full" style={{ background: `linear-gradient(90deg, ${accent.a}, ${accent.b})` }} />
              Période d'absence
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DatePicker label="Du" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} disabled={!enabled} />
              <DatePicker label="Au" value={dateFin} onChange={(e) => setDateFin(e.target.value)} disabled={!enabled} />
              <TimePicker label="À partir de" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} disabled={!enabled} />
              <TimePicker label="Jusqu'à" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} disabled={!enabled} />
            </div>
          </div>

          <div>
            <label className={`text-[11px] font-bold uppercase tracking-[0.14em] mb-2 block ${isDark ? 'text-slate-400' : isAdmin ? 'text-orange-900/60' : 'text-teal-900/60'}`}>Message d'absence</label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[180px]" placeholder={TEMPLATE_MESSAGE} disabled={!enabled} />
          </div>

          <div className={`flex items-center justify-between py-3 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>N'envoyer la réponse qu'une seule fois par expéditeur</p>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Évite les réponses répétées pour chaque message du même contact</p>
            </div>
            <Switch checked={oncePerSender} onCheckedChange={setOncePerSender} disabled={!enabled} />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <StageButton variant="glass" onClick={() => navigate(-1)}>Annuler</StageButton>
          <StageButton variant="primary" icon={<Save size={14} />}>Enregistrer</StageButton>
        </div>
      </div>
    
  )
}
