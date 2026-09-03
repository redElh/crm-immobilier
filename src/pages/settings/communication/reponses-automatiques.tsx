import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { DatePicker } from '../../../components/ui/DatePicker'
import { TimePicker } from '../../../components/ui/TimePicker'
import { Textarea } from '../../../components/ui/Textarea'
import { Switch } from '../../../components/ui/Switch'
import { motion } from 'framer-motion'
import { Save, Clock, Edit3, MessageSquare, ArrowLeft } from 'react-feather'
import {
  Stage,
  StageButton,
  OrbIcon,
  STAGE_HUES,
  useStageTheme,
} from '../../../components/dashboard/Stage'

const commTabs = [
  { label: 'Signature', icon: Edit3, to: '/settings/communication/signature' },
  { label: 'Réponses auto', icon: MessageSquare, to: '/settings/communication/reponses-automatiques' },
]

function CommTabs() {
  const location = useLocation()
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  return (
    <div className="stage-glass flex gap-1 p-1 w-fit rounded-2xl">
      {commTabs.map(tab => {
        const TabIcon = tab.icon
        const isActive = location.pathname === tab.to
        return (
          <NavLink key={tab.to} to={tab.to} className={`relative flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${isActive ? 'text-white' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-teal-900'}`}>
            {isActive && <motion.span layoutId="comm-tab-auto" className="absolute inset-0 rounded-xl border border-white/20" style={{ backgroundImage: isDark ? 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)' : 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)' }} transition={{ type: 'spring', stiffness: 380, damping: 32 } as any} />}
            <TabIcon size={14} className="relative z-10" /><span className="relative z-10">{tab.label}</span>
          </NavLink>
        )
      })}
    </div>
  )
}

const TEMPLATE_MESSAGE = `Bonjour,

Je suis actuellement absent(e) et je ne pourrai pas répondre à votre message avant mon retour.

Pour toute urgence, veuillez contacter mon agence au 01 23 45 67 89.

Cordialement,
{{agent.prenom}} {{agent.nom}}`

export default function ReponsesAutomatiquesPage() {
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const [enabled, setEnabled] = useState(false)
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [heureDebut, setHeureDebut] = useState('')
  const [heureFin, setHeureFin] = useState('')
  const [message, setMessage] = useState(TEMPLATE_MESSAGE)
  const [oncePerSender, setOncePerSender] = useState(true)

  return (
    <Stage theme={theme}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${isDark ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-teal-900/10 text-slate-600 hover:bg-white'}`}><ArrowLeft size={13} /> Retour</button>
          <CommTabs />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" /></span>
            <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>Communication · Absence</p>
          </div>
          <h1 className={`mt-1 text-3xl font-extrabold tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent' : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent'}`}>Réponses automatiques</h1>
          <p className={`mt-0.5 text-sm ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>Un message automatique sera envoyé en votre absence</p>
        </div>

        <div className="stage-glass p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <OrbIcon icon={Clock} hue={STAGE_HUES.amber} size={40} radius={12} />
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
              <span className="h-1 w-6 rounded-full" style={{ background: `linear-gradient(90deg, ${STAGE_HUES.sky.a}, ${STAGE_HUES.sky.b})` }} />
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
            <label className={`text-[11px] font-bold uppercase tracking-[0.14em] mb-2 block ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>Message d'absence</label>
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
    </Stage>
  )
}
