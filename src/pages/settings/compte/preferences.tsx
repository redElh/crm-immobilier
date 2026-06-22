import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Select } from '../../../components/ui/Select'
import { Switch } from '../../../components/ui/Switch'
import { BackLink } from '../../../components/ui/BackLink'
import { Globe, Sun, Eye, Clock, DollarSign, User, Shield } from 'react-feather'

const compteTabs = [
  { label: 'Profil', icon: User, to: '/settings/compte/profil' },
  { label: 'Sécurité', icon: Shield, to: '/settings/compte/securite' },
  { label: 'Préférences', icon: Sun, to: '/settings/compte/preferences' },
]

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

const themes = [
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
  { value: 'system', label: 'Système' },
]

export default function PreferencesSettingsPage() {
  const [langue, setLangue] = useState('fr')
  const [theme, setTheme] = useState('light')
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
    setTimeout(() => setSaving(false), 1500)
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

  const location = useLocation()

  return (
    <div className="space-y-6">
      <BackLink />
      <div className="flex gap-1 p-1 rounded-lg bg-background border border-border/50 w-fit">
        {compteTabs.map((tab) => {
          const TabIcon = tab.icon
          const isActive = location.pathname === tab.to
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                isActive
                  ? 'bg-card text-text shadow-sm'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              <TabIcon size={15} />
              {tab.label}
            </NavLink>
          )
        })}
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Préférences</h1>

      <Card className="p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="p-2.5 rounded-lg bg-accent-light text-accent">
            <Globe size={18} />
          </div>
          <h3 className="font-semibold text-sm mt-1">Langue</h3>
        </div>
        <Select options={languages} value={langue} onValueChange={setLangue} />
      </Card>

      <Card className="p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="p-2.5 rounded-lg bg-accent-light text-accent">
            <Sun size={18} />
          </div>
          <h3 className="font-semibold text-sm mt-1">Thème</h3>
        </div>
        <div className="flex gap-2">
          {themes.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTheme(t.value)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all duration-200 ${
                theme === t.value
                  ? 'bg-accent text-white border-accent shadow-sm'
                  : 'bg-card text-text-secondary border-border hover:border-text-secondary/30 hover:text-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="p-2.5 rounded-lg bg-accent-light text-accent">
            <Eye size={18} />
          </div>
          <h3 className="font-semibold text-sm mt-1">Affichage</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <p className="text-sm font-medium">Afficher les notifications dans le CRM</p>
            <Switch checked={showNotifications} onCheckedChange={setShowNotifications} />
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border/30">
            <p className="text-sm font-medium">Afficher les aperçus de messages</p>
            <Switch checked={showMessagePreviews} onCheckedChange={setShowMessagePreviews} />
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border/30">
            <p className="text-sm font-medium">Afficher les biens vendus</p>
            <Switch checked={showSoldProperties} onCheckedChange={setShowSoldProperties} />
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border/30">
            <p className="text-sm font-medium">Compacter l'affichage</p>
            <Switch checked={compactDisplay} onCheckedChange={setCompactDisplay} />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="p-2.5 rounded-lg bg-accent-light text-accent">
            <Clock size={18} />
          </div>
          <h3 className="font-semibold text-sm mt-1">Date et heure</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select label="Fuseau horaire" options={timezones} value={timezone} onValueChange={setTimezone} />
          <Select label="Format date" options={dateFormats} value={dateFormat} onValueChange={setDateFormat} />
          <Select label="Format heure" options={timeFormats} value={timeFormat} onValueChange={setTimeFormat} />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="p-2.5 rounded-lg bg-accent-light text-accent">
            <DollarSign size={18} />
          </div>
          <h3 className="font-semibold text-sm mt-1">Devise</h3>
        </div>
        <Select options={currencies} value={devise} onValueChange={setDevise} />
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleCancel}>Annuler</Button>
        <Button variant="default" onClick={handleSave} loading={saving}>Enregistrer</Button>
      </div>
    </div>
  )
}
