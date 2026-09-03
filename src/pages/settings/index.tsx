import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { User, Mail, Bell, Paperclip, Download, HelpCircle, ArrowRight, Settings, Users } from 'react-feather'
import {
  Stage,
  StageBadge,
  OrbIcon,
  TiltCard,
  STAGE_HUES,
  useStageTheme,
} from '../../components/dashboard/Stage'
import type { StageHue } from '../../components/dashboard/Stage'

interface SettingsCategory {
  title: string
  description: string
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  to: string
  hue: StageHue
}

const settingsCategories: SettingsCategory[] = [
  { title: 'Mon Compte', description: 'Profil, sécurité et préférences', icon: User, to: '/settings/compte/profil', hue: STAGE_HUES.violet },
  { title: 'Communication', description: 'Signature email, réponses automatiques', icon: Mail, to: '/settings/communication/signature', hue: STAGE_HUES.sky },
  { title: 'Notifications', description: 'Configurez vos préférences de notification', icon: Bell, to: '/settings/notifications', hue: STAGE_HUES.amber },
  { title: 'Intégrations', description: 'Google Calendar, API', icon: Paperclip, to: '/settings/integrations', hue: STAGE_HUES.emerald },
  { title: 'Données', description: 'Import, export et sauvegarde', icon: Download, to: '/settings/donnees', hue: STAGE_HUES.fuchsia },
  { title: 'Équipe', description: 'Membres, rôles et permissions', icon: Users, to: '/settings/equipe', hue: STAGE_HUES.sky },
  { title: 'Aide & Support', description: "Centre d'aide, support et à propos", icon: HelpCircle, to: '/settings/aide', hue: { a: '#F472B6', b: '#BE185D', glow: 'rgba(244,114,182,0.45)', line: '#F472B6' } },
]

export default function SettingsPage() {
  const theme = useStageTheme()
  const isDark = theme === 'dark'

  return (
    <Stage theme={theme}>
      <div className="space-y-6">
        {/* ── Hero ── */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              </span>
              <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>
                Mission control · Paramètres
              </p>
            </div>
            <h1
              className={`mt-1 text-3xl font-extrabold tracking-tight ${
                isDark
                  ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent'
              }`}
            >
              Paramètres
            </h1>
            <p className={`mt-0.5 text-sm ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>
              Personnalisez votre expérience CRM — tout votre espace en un coup d'œil
            </p>
          </div>
          <div className="flex items-center gap-2">
            <OrbIcon icon={Settings} hue={STAGE_HUES.violet} size={42} radius={13} />
            <div className={`hidden sm:block text-right ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>
              <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{settingsCategories.length} espaces</p>
              <p className="text-[11px]">configurables</p>
            </div>
          </div>
        </div>

        {/* ── Categories grid — Stage TiltCards ── */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
          }}
        >
          {settingsCategories.map((category, i) => {
            const Icon = category.icon
            return (
              <motion.div
                key={category.title}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <TiltCard className="group h-full">
                  <NavLink to={category.to} className="flex h-full flex-col p-5">
                    {/* top accent */}
                    <div
                      className="absolute top-0 inset-x-0 h-[3px]"
                      style={{
                        background: `linear-gradient(90deg, ${category.hue.a}, ${category.hue.b})`,
                        boxShadow: `0 0 12px ${category.hue.glow}`,
                      }}
                    />
                    <div className="flex items-start justify-between mb-4">
                      <OrbIcon icon={Icon} hue={category.hue} size={44} radius={12} />
                      <StageBadge variant="neutral" className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                        Configurer
                      </StageBadge>
                    </div>
                    <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{category.title}</h3>
                    <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{category.description}</p>
                    <div
                      className={`mt-4 inline-flex items-center gap-1.5 text-xs font-bold transition-colors ${
                        isDark ? 'text-indigo-300 group-hover:text-white' : 'text-teal-700 group-hover:text-teal-900'
                      }`}
                    >
                      <span>Configurer</span>
                      <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </NavLink>
                </TiltCard>
              </motion.div>
            )
          })}
        </motion.div>

        {/* ── Footer divider ── */}
        <div className="flex items-center gap-3 py-2">
          <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-teal-900/10'}`} />
          <p className={`text-xs whitespace-nowrap ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>CRM Immobilier — Version 1.0.0</p>
          <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-teal-900/10'}`} />
        </div>
      </div>
    </Stage>
  )
}
