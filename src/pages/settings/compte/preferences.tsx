import { useState } from 'react'
import { Switch } from '../../../components/ui/Switch'
import { Select } from '../../../components/ui/Select'
import { useTheme, type ThemePreference } from '../../../contexts/ThemeContext'
import { Globe, Sun, Eye, Clock, DollarSign } from 'react-feather'
import {
  StageButton,
  OrbIcon,
  STAGE_HUES,
  useStageTheme,
} from '../../../components/dashboard/Stage'
import {
  CompteSettingsTabs,
  SettingsBackButton,
  SettingsHero,
  useSettingsChrome,
} from '../../../components/settings/SettingsChrome'

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



export default function PreferencesSettingsPage() {
  const theme = useStageTheme()
  const { isDark, isAdmin, accent } = useSettingsChrome()
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
    
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <SettingsBackButton />
          <CompteSettingsTabs />
        </div>

        <SettingsHero
          eyebrow="Mon compte · Préférences"
          title="Préférences"
          subtitle="Langue, thème, affichage et formats régionaux"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="stage-glass p-5">
            <div className="flex items-center gap-3 mb-4">
              <OrbIcon icon={Globe} hue={accent} size={36} radius={11} />
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
                        : isAdmin
                          ? 'bg-white text-slate-600 border-orange-900/10 hover:border-orange-900/20 hover:text-orange-900'
                          : 'bg-white text-slate-600 border-teal-900/10 hover:border-teal-900/20 hover:text-teal-900'
                  }`}
                  style={
                    appTheme === t.value
                      ? {
                          backgroundImage: `linear-gradient(145deg, ${accent.a} 0%, ${accent.b} 100%)`,
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
    
  )
}
