import { BookOpen, Video, HelpCircle, Mail, Phone, ChevronRight, ArrowLeft } from 'react-feather'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Stage,
  StageButton,
  OrbIcon,
  STAGE_HUES,
  useStageTheme,
} from '../../../components/dashboard/Stage'

const helpItems = [
  { icon: BookOpen, title: 'Documentation CRM', description: 'Consultez notre documentation complète', hue: STAGE_HUES.violet },
  { icon: Video, title: 'Tutoriels vidéos', description: 'Accédez aux tutoriels vidéo', hue: STAGE_HUES.sky },
  { icon: HelpCircle, title: 'FAQ', description: 'Questions fréquemment posées', hue: STAGE_HUES.amber },
]

export default function AidePage() {
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const location = useLocation()
  const settingsPrefix = location.pathname.startsWith('/admin') ? `/admin/${location.pathname.split('/')[2]}/settings` : '/settings'

  return (
    <Stage theme={theme}>
      <div className="space-y-6">
        <button onClick={() => navigate(-1)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors w-fit ${isDark ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-teal-900/10 text-slate-600 hover:bg-white'}`}><ArrowLeft size={13} /> Retour</button>

        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" /></span>
            <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>Paramètres · Aide & Support</p>
          </div>
          <h1 className={`mt-1 text-3xl font-extrabold tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent' : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent'}`}>Aide & Support</h1>
          <p className={`mt-0.5 text-sm ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>Documentation, tutoriels et assistance</p>
        </div>

        <div className="stage-glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <OrbIcon icon={BookOpen} hue={STAGE_HUES.violet} size={40} radius={12} />
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
              <div className={`p-2 rounded-xl ${isDark ? 'bg-violet-500/15 text-violet-300' : 'bg-teal-50 text-teal-700'}`}><Mail size={14} /></div>
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
    </Stage>
  )
}
