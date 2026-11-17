import type { ComponentType } from 'react'
import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { Settings, User, Mail, Bell, Paperclip, Users, Download, HelpCircle, ArrowRight } from 'react-feather'
import {
  StageBadge,
  OrbIcon,
  TiltCard,
  STAGE_HUES,
} from '../../../components/dashboard/Stage'
import type { StageHue } from '../../../components/dashboard/Stage'
import {
  SettingsHero,
  useSettingsBasePath,
  useSettingsChrome,
} from '../../../components/settings/SettingsChrome'

interface SettingsCategory {
  title: string
  description: string
  icon: ComponentType<{ size?: number | string; className?: string }>
  path: string
  hue: StageHue
}

export default function AdminSettingsPage() {
  const { isDark, isAdmin, accent, link } = useSettingsChrome()
  const base = useSettingsBasePath()

  const categories: SettingsCategory[] = [
    { title: 'Mon Compte', description: 'Profil, sécurité et préférences', icon: User, path: '/compte/profil', hue: isAdmin ? accent : STAGE_HUES.violet },
    { title: 'Communication', description: 'Signature email, réponses automatiques', icon: Mail, path: '/communication/signature', hue: STAGE_HUES.sky },
    { title: 'Notifications', description: 'Configurez vos préférences de notification', icon: Bell, path: '/notifications', hue: STAGE_HUES.amber },
    { title: 'Intégrations', description: 'Google Calendar, API', icon: Paperclip, path: '/integrations', hue: STAGE_HUES.emerald },
    { title: 'Données', description: 'Import, export et sauvegarde', icon: Download, path: '/donnees', hue: STAGE_HUES.fuchsia },
    { title: 'Équipe', description: 'Membres, rôles et permissions', icon: Users, path: '/equipe', hue: STAGE_HUES.sky },
    { title: 'Aide & Support', description: "Centre d'aide, support et à propos", icon: HelpCircle, path: '/aide', hue: { a: '#F472B6', b: '#BE185D', glow: 'rgba(244,114,182,0.45)', line: '#F472B6' } },
  ]

  return (
    <div className="space-y-6">
      <SettingsHero
          eyebrow="Mission control · Paramètres"
          title="Paramètres"
          subtitle="Personnalisez votre expérience CRM — tout votre espace en un coup d'œil"
          right={
            <div className="flex items-center gap-2">
              <OrbIcon icon={Settings} hue={accent} size={42} radius={13} />
              <div className={`hidden sm:block text-right ${isDark ? 'text-slate-400' : isAdmin ? 'text-orange-900/60' : 'text-teal-900/60'}`}>
                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{categories.length} espaces</p>
                <p className="text-[11px]">configurables</p>
              </div>
            </div>
          }
        />

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
          }}
        >
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <motion.div
                key={category.title}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <TiltCard className="group h-full">
                  <NavLink to={`${base}${category.path}`} className="flex h-full flex-col p-5">
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
                    <div className={`mt-4 inline-flex items-center gap-1.5 text-xs font-bold transition-colors ${link}`}>
                      <span>Configurer</span>
                      <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </NavLink>
                </TiltCard>
              </motion.div>
            )
          })}
        </motion.div>

        <div className="flex items-center gap-3 py-2">
          <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : isAdmin ? 'bg-orange-900/10' : 'bg-teal-900/10'}`} />
          <p className={`text-xs whitespace-nowrap ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>CRM Immobilier — Version 1.0.0</p>
          <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : isAdmin ? 'bg-orange-900/10' : 'bg-teal-900/10'}`} />
        </div>
    </div>
  )
}
