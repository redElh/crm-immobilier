import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Switch } from '../../../components/ui/Switch'
import { Select } from '../../../components/ui/Select'
import { useTheme, type ThemePreference } from '../../../contexts/ThemeContext'
import { Globe, Sun, Eye, Clock, DollarSign, User, Shield, ArrowLeft } from 'react-feather'
import { motion } from 'framer-motion'
import {
  Stage,
  StageButton,
  OrbIcon,
  STAGE_HUES,
  useStageTheme,
} from '../../../components/dashboard/Stage'

const languages = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
]
const timezones = [
  { value: 'africa/casablanca', label: 'Africa/Casablanca' },
  { value: 'europe/paris', label: 'Europe/Paris' },
  { value: 'utc', label: 'UTC' },
]
const dateFormats = [
  { value: 'dd/mm/yyyy', label: 'DD/MM/YYYY' },
  { value: 'mm/dd/yyyy', label: 'MM/DD/YYYY' },
  { value: 'yyyy-mm-dd', label: 'YYYY-MM-DD' },
]
const timeFormats = [
  { value: '24h', label: '24h' },
  { value: '12h', label: '12h (AM/PM)' },
]
const currencies = [
  { value: 'mad', label: 'MAD - Dirham marocain' },
  { value: 'eur', label: 'EUR - Euro' },
  { value: 'usd', label: 'USD - Dollar américain' },
]
const themes: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
  { value: 'system', label: 'Système' },
]

function CompteTabs({ basePath }: { basePath: string }) {
  const location = useLocation()
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const tabs = [
    { label: 'Profil', icon: User, to: `${basePath}/profil` },
    { label: 'Sécurité', icon: Shield, to: `${basePath}/securite` },
    { label: 'Préférences', icon: Sun, to: `${basePath}/preferences` },
  ]
  return (
    <div className="stage-glass flex gap-1 p-1 w-fit rounded-2xl">
      {tabs.map(tab => {
        const TabIcon = tab.icon
        const isActive = location.pathname === tab.to
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={`relative flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${isActive ? 'text-white' : isDark ? 'text-slate-400 hover:text-slate-100' : 'text-slate-500 hover:text-teal-900'}`}
          >
            {isActive && (
              <motion.span
                layoutId="compte-tab-pill-pref"
                className="absolute inset-0 rounded-xl border border-white/20"
                style={{
                  backgroundImage: isDark
                    ? 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)'
                    : 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)',
                  boxShadow: isDark
                    ? 'inset 0 1px 0 rgba(255,255,255,0.4), 0 8px 20px -6px rgba(124,92,255,0.6)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 20px -8px rgba(13,148,136,0.55)',
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <TabIcon size={14} className="relative z-10" />
            <span className="relative z-10">{tab.label}</span>
          </NavLink>
        )
      })}
    </div>
  )
}

export default function PreferencesSettingsPage() {
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const [langue, setLangue] = useState('fr')
  const { theme: appTheme, setTheme } = useTheme()
  const [showNotifications, setShowNotifications] = useState(true)
  const [showMessagePreviews, setShowMessagePreviews] = useState(true)
  const [showSoldProperties, setShowSoldProperties] = useState(false)
  const [compactDisplay, setCompactDisplay] = useState(false)
  const [timezone, setTimezone] = useState('africa/casablanca')
  const [dateFormat, setDateFormat] = useState('dd/mm/yyyy')
  const [timeFormat, setTimeFormat] = useState('24h')
  const [devise, setDevise] = useState('mad')
  const [saving, setSaving] = useState(false)
  const location = useLocation()
  const basePath = location.pathname.substring(0, location.pathname.lastIndexOf('/'))

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 1200)
  }
  const handleCancel = () => {
    setLangue('fr')
    setTheme('light')
    setShowNotifications(true)
    setShowMessagePreviews(true)
    setShowSoldProperties(false)
    setCompactDisplay(false)
    setTimezone('africa/casablanca')
    setDateFormat('dd/mm/yyyy')
    setTimeFormat('24h')
    setDevise('mad')
  }

  return (
    <Stage theme={theme}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${isDark ? 'border-white/10 text-slate-300 hover:bg-white/5 hover:text-white' : 'border-teal-900/10 text-slate-600 hover:bg-white hover:text-teal-900'}`}
          >
            <ArrowLeft size={13} /> Retour
          </button>
          <CompteTabs basePath={basePath} />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              </span>
              <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>Mon compte · Préférences</p>
            </div>
            <h1 className={`mt-1 text-3xl font-extrabold tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent' : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent'}`}>
              Préférences
            </h1>
            <p className={`mt-0.5 text-sm ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>Langue, thème, affichage et formats régionaux</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="stage-glass p-5">
            <div className="flex items-center gap-3 mb-4">
              <OrbIcon icon={Globe} hue={STAGE_HUES.violet} size={36} radius={11} />
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Langue</h3>
            </div>
            <Select options={languages} value={langue} onValueChange={setLangue} />
          </div>

          <div className="stage-glass p-5">
            <div className="flex items-center gap-3 mb-4">
              <OrbIcon icon={Sun} hue={STAGE_HUES.amber} size={36} radius={11} />
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Thème</h3>
            </div>
            <div className="flex gap-2">
              {themes.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTheme(t.value)}
                  className={`flex-1 px-3 py-2.5 text-xs font-bold rounded-xl border transition-all duration-200 ${
                    appTheme === t.value
                      ? 'text-white border-white/20 shadow-lg'
                      : isDark
                        ? 'bg-white/[0.04] text-slate-400 border-white/10 hover:bg-white/[0.08] hover:text-white'
                        : 'bg-white text-slate-600 border-teal-900/10 hover:border-teal-900/20 hover:text-teal-900'
                  }`}
                  style={
                    appTheme === t.value
                      ? {
                          backgroundImage: isDark
                            ? 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)'
                            : 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)',
                        }
                      : undefined
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="stage-glass p-5">
          <div className="flex items-center gap-3 mb-4">
            <OrbIcon icon={Eye} hue={STAGE_HUES.sky} size={36} radius={11} />
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Affichage</h3>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Personnalisez la densité et le contenu visible</p>
            </div>
          </div>
          <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
            {[
              { label: 'Afficher les notifications dans le CRM', value: showNotifications, setter: setShowNotifications },
              { label: 'Afficher les aperçus de messages', value: showMessagePreviews, setter: setShowMessagePreviews },
              { label: 'Afficher les biens vendus', value: showSoldProperties, setter: setShowSoldProperties },
              { label: "Compacter l'affichage", value: compactDisplay, setter: setCompactDisplay },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-3">
                <p className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{item.label}</p>
                <Switch checked={item.value} onCheckedChange={item.setter as any} />
              </div>
            ))}
          </div>
        </div>

        <div className="stage-glass p-5">
          <div className="flex items-center gap-3 mb-4">
            <OrbIcon icon={Clock} hue={STAGE_HUES.emerald} size={36} radius={11} />
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Date et heure</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select label="Fuseau horaire" options={timezones} value={timezone} onValueChange={setTimezone} />
            <Select label="Format date" options={dateFormats} value={dateFormat} onValueChange={setDateFormat} />
            <Select label="Format heure" options={timeFormats} value={timeFormat} onValueChange={setTimeFormat} />
          </div>
        </div>

        <div className="stage-glass p-5">
          <div className="flex items-center gap-3 mb-4">
            <OrbIcon icon={DollarSign} hue={STAGE_HUES.fuchsia} size={36} radius={11} />
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Devise</h3>
          </div>
          <Select options={currencies} value={devise} onValueChange={setDevise} />
        </div>

        <div className="flex justify-end gap-3">
          <StageButton variant="glass" onClick={handleCancel}>Annuler</StageButton>
          <StageButton variant="primary" onClick={handleSave}>{saving ? 'Enregistrement...' : 'Enregistrer'}</StageButton>
        </div>
      </div>
    </Stage>
  )
}
