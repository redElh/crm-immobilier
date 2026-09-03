import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Switch } from '../../components/ui/Switch'
import { User, Camera, ArrowLeft } from 'react-feather'
import {
  Stage,
  OrbIcon,
  StageButton,
  STAGE_HUES,
  useStageTheme,
} from '../../components/dashboard/Stage'

const languages = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' }
]
const agencies = [
  { value: 'm2', label: 'M2 Square Meter' },
  { value: 'other', label: 'Autre agence' }
]

export default function ProfileSettingsPage() {
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isGoogleCalendarEnabled, setIsGoogleCalendarEnabled] = useState(false)
  return (
    <Stage theme={theme}>
      <div className="space-y-6">
        <button onClick={() => navigate(-1)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border w-fit ${isDark ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-teal-900/10 text-slate-600 hover:bg-white'}`}><ArrowLeft size={13} /> Retour</button>
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" /></span>
            <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>Paramètres · Profil</p>
          </div>
          <h1 className={`mt-1 text-3xl font-extrabold tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent' : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent'}`}>Profil</h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>Ancienne page — utilisez Mon Compte → Profil</p>
        </div>

        <div className="stage-glass p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-teal-50 border-teal-900/10'}`}><User size={32} className={isDark ? 'text-violet-300' : 'text-teal-700'} /></div>
                <button className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border flex items-center justify-center ${isDark ? 'bg-[#111832] border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}><Camera size={12} /></button>
              </div>
              <StageButton variant="glass" size="sm">Changer la photo</StageButton>
            </div>
            <div className="flex-1 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Prénom" defaultValue="Karim" />
                <Input label="Nom" defaultValue="Eloui" />
                <Input label="Email" type="email" defaultValue="karim@m2squaremeter.com" />
                <Input label="Téléphone" type="tel" defaultValue="+212 6 12 34 56 78" />
              </div>
              <Select label="Agence" options={agencies} defaultValue="m2" />
              <Textarea label="Signature email" defaultValue="Karim Eloui\nAgent Commercial\nM2 Square Meter" rows={3} />
            </div>
          </div>
        </div>

        <div className="stage-glass p-6">
          <div className="flex items-center gap-3 mb-4"><OrbIcon icon={User} hue={STAGE_HUES.amber} size={34} radius={11} /><h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Préférences</h3></div>
          <div className="space-y-5">
            <Select label="Langue" options={languages} defaultValue="fr" />
            <div className={`flex items-center justify-between py-3 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}><div><p className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Mode sombre</p><p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Activez l'interface sombre</p></div><Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} /></div>
            <div className="flex items-center justify-between py-3"><div><p className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Calendrier Google</p><p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Synchroniser avec mon calendrier</p></div><Switch checked={isGoogleCalendarEnabled} onCheckedChange={setIsGoogleCalendarEnabled} /></div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <StageButton variant="glass">Annuler</StageButton>
          <StageButton variant="primary">Enregistrer</StageButton>
        </div>
      </div>
    </Stage>
  )
}
