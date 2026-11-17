import { BookOpen, Video, HelpCircle, Mail, Phone, ChevronRight } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import {
  StageButton,
  OrbIcon,
  STAGE_HUES,
  useStageTheme,
} from '../../../components/dashboard/Stage'
import {
  SettingsBackButton,
  SettingsHero,
  useSettingsBasePath,
  useSettingsChrome,
} from '../../../components/settings/SettingsChrome'

const helpItems = [
  { icon: BookOpen, title: 'Documentation CRM', description: 'Consultez notre documentation complète', hue: STAGE_HUES.violet },
  { icon: Video, title: 'Tutoriels vidéos', description: 'Accédez aux tutoriels vidéo', hue: STAGE_HUES.sky },
  { icon: HelpCircle, title: 'FAQ', description: 'Questions fréquemment posées', hue: STAGE_HUES.amber },
]

export default function AidePage() {
  const theme = useStageTheme()
  const { isDark, isAdmin, accent } = useSettingsChrome()
  const navigate = useNavigate()
  const settingsPrefix = useSettingsBasePath()

  return (
    
      <div className="space-y-6">
        <SettingsBackButton />

        <SettingsHero
          eyebrow="Paramètres · Aide & Support"
          title="Aide & Support"
          subtitle="Documentation, tutoriels et assistance"
        />

        <div className="stage-glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <OrbIcon icon={BookOpen} hue={accent} size={40} radius={12} />
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Centre d'aide</h3>
          </div>
          <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
            {helpItems.map(item => {
              const Icon = item.icon
              return (
                <button key={item.title} className={`flex items-center gap-4 py-4 w-full text-left group rounded-xl px-2 -mx-2 transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'}`}>
                  <div className={`p-2 rounded-xl ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}><Icon size={16} /></div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.description}</p>
                  </div>
                  <ChevronRight size={16} className={`${isDark ? 'text-slate-600' : 'text-slate-400'} group-hover:translate-x-0.5 transition-transform`} />
                </button>
              )
            })}
          </div>
        </div>

        <div className="stage-glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <OrbIcon icon={Mail} hue={STAGE_HUES.sky} size={40} radius={12} />
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Contacter le support</h3>
          </div>
          <StageButton variant="primary" icon={<Mail size={14} />} className="w-full justify-center mb-5">Envoyer un message au support</StageButton>
          <div className="space-y-3">
            <div className={`flex items-center gap-3 p-3 rounded-2xl border ${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <div className={`p-2 rounded-xl ${isDark ? (isAdmin ? 'bg-rose-500/15 text-rose-300' : 'bg-violet-500/15 text-violet-300') : (isAdmin ? 'bg-orange-50 text-orange-700' : 'bg-teal-50 text-teal-700')}`}><Mail size={14} /></div>
              <div><p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Email</p><p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>support@squaremeter.com</p></div>
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-2xl border ${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <div className={`p-2 rounded-xl ${isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}><Phone size={14} /></div>
              <div><p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Téléphone</p><p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>+212 5 22 12 34 56</p></div>
            </div>
          </div>
        </div>

        <div className="stage-glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <OrbIcon icon={HelpCircle} hue={STAGE_HUES.amber} size={40} radius={12} />
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>À propos</h3>
          </div>
          <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>CRM Immobilier — Version 1.0.0</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>© 2026 Square Meter. Tous droits réservés.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <StageButton variant="glass" size="sm" onClick={() => navigate(`${settingsPrefix}/terms`)}>Conditions d'utilisation</StageButton>
            <StageButton variant="glass" size="sm" onClick={() => navigate(`${settingsPrefix}/privacy`)}>Politique de confidentialité</StageButton>
          </div>
        </div>
      </div>
    
  )
}
