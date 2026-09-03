import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Switch } from '../../../components/ui/Switch'
import { Calendar, ArrowLeft, Copy, RefreshCw, Link, HelpCircle } from 'react-feather'
import {
  Stage,
  StageBadge,
  StageButton,
  OrbIcon,
  STAGE_HUES,
  useStageTheme,
} from '../../../components/dashboard/Stage'

export default function IntegrationsPage() {
  const [crmToGoogle, setCrmToGoogle] = useState(true)
  const [googleToCrm, setGoogleToCrm] = useState(true)
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()

  return (
    <Stage theme={theme}>
      <div className="space-y-6">
        <button onClick={() => navigate(-1)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors w-fit ${isDark ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-teal-900/10 text-slate-600 hover:bg-white'}`}><ArrowLeft size={13} /> Retour</button>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" /></span>
              <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>Paramètres · Intégrations</p>
            </div>
            <h1 className={`mt-1 text-3xl font-extrabold tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent' : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent'}`}>Intégrations</h1>
            <p className={`mt-0.5 text-sm ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>Connectez vos outils externes au CRM</p>
          </div>
        </div>

        <div className="stage-glass p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <OrbIcon icon={Calendar} hue={STAGE_HUES.emerald} size={40} radius={12} />
              <div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Google Calendar</h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Synchronisez vos rendez-vous</p>
              </div>
            </div>
            <StageBadge variant="ok">✅ Connecté à karim@m2squaremeter.com</StageBadge>
          </div>

          <div className={`rounded-2xl border p-4 space-y-0 mb-4 ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/40'}`}>
            <div className="flex items-center justify-between py-2">
              <p className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Synchroniser les rendez-vous CRM → Google Agenda</p>
              <Switch checked={crmToGoogle} onCheckedChange={setCrmToGoogle} />
            </div>
            <div className={`flex items-center justify-between py-3 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Synchroniser les rendez-vous Google Agenda → CRM</p>
              <Switch checked={googleToCrm} onCheckedChange={setGoogleToCrm} />
            </div>
          </div>

          <p className={`text-xs mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Dernière synchronisation : 13/06/2026 08:30</p>

          <div className="flex flex-wrap gap-3">
            <StageButton variant="primary" icon={<RefreshCw size={14} />}>Synchroniser maintenant</StageButton>
            <StageButton variant="glass" className="!text-rose-400 hover:!text-rose-300">Déconnecter</StageButton>
          </div>
        </div>

        <div className="stage-glass p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <OrbIcon icon={Link} hue={STAGE_HUES.sky} size={40} radius={12} />
              <div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Google Contacts</h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Importez vos contacts Google</p>
              </div>
            </div>
            <StageBadge variant="warn">❌ Non connecté</StageBadge>
          </div>
          <StageButton variant="primary" icon={<Link size={14} />}>Connecter Google Contacts</StageButton>
        </div>

        <div className="stage-glass p-6">
          <div className="flex items-center gap-3 mb-5">
            <OrbIcon icon={HelpCircle} hue={STAGE_HUES.violet} size={40} radius={12} />
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>API — pour développeur</h3>
          </div>
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 mb-4 ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Clé API : <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>sk_••••••••••••••••a3f8</span></p>
            <StageBadge variant="neutral" className="hidden sm:inline-flex">Secret</StageBadge>
          </div>
          <div className="flex flex-wrap gap-3">
            <StageButton variant="glass" icon={<Copy size={14} />}>Copier la clé</StageButton>
            <StageButton variant="glass" className="!text-rose-400">Régénérer</StageButton>
          </div>
          <p className={`text-xs mt-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Consultez notre <a href="/docs/api" className={`${isDark ? 'text-violet-300 hover:text-white' : 'text-teal-700 hover:text-teal-900'} underline`}>documentation API</a> pour plus d'informations.</p>
        </div>

        <div className="flex justify-end">
          <StageButton variant="primary">Enregistrer</StageButton>
        </div>
      </div>
    </Stage>
  )
}
