import { useState } from 'react'
import { Switch } from '../../../components/ui/Switch'
import { Calendar, Copy, RefreshCw, Link, HelpCircle } from 'react-feather'
import {
  StageBadge,
  StageButton,
  OrbIcon,
  STAGE_HUES,
  useStageTheme,
} from '../../../components/dashboard/Stage'
import {
  SettingsBackButton,
  SettingsHero,
  useSettingsChrome,
} from '../../../components/settings/SettingsChrome'

export default function IntegrationsPage() {
  const [crmToGoogle, setCrmToGoogle] = useState(true)
  const [googleToCrm, setGoogleToCrm] = useState(true)
  const theme = useStageTheme()
  const { isDark, isAdmin, accent } = useSettingsChrome()

  return (
    
      <div className="space-y-6">
        <SettingsBackButton />

        <SettingsHero
          eyebrow="Paramètres · Intégrations"
          title="Intégrations"
          subtitle="Connectez vos outils externes au CRM"
        />

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
            <OrbIcon icon={HelpCircle} hue={accent} size={40} radius={12} />
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
          <p className={`text-xs mt-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Consultez notre <a href="/docs/api" className={`${isDark ? (isAdmin ? 'text-rose-300 hover:text-white' : 'text-violet-300 hover:text-white') : (isAdmin ? 'text-orange-700 hover:text-orange-900' : 'text-teal-700 hover:text-teal-900')} underline`}>documentation API</a> pour plus d'informations.</p>
        </div>

        <div className="flex justify-end">
          <StageButton variant="primary">Enregistrer</StageButton>
        </div>
      </div>
    
  )
}
