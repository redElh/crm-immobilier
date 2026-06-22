import { useState } from 'react'
import Card from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Switch } from '../../components/ui/Switch'
import { BackLink } from '../../components/ui/BackLink'
import { User, Camera } from 'react-feather'

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
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isGoogleCalendarEnabled, setIsGoogleCalendarEnabled] = useState(false)

  return (
    <div className="space-y-6">
      <BackLink />
      <h1 className="text-2xl font-semibold tracking-tight">Profil</h1>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-accent-light flex items-center justify-center">
                <User size={32} className="text-accent" />
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-background transition-colors">
                <Camera size={12} className="text-text-secondary" />
              </button>
            </div>
            <Button variant="outline" size="sm">Changer la photo</Button>
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
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-5">Préférences</h3>
        <div className="space-y-5">
          <Select label="Langue" options={languages} defaultValue="fr" />

          <div className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
            <div>
              <p className="text-sm font-medium">Mode sombre</p>
              <p className="text-xs text-text-secondary">Activez l'interface sombre</p>
            </div>
            <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">Calendrier Google</p>
              <p className="text-xs text-text-secondary">Synchroniser avec mon calendrier</p>
            </div>
            <Switch checked={isGoogleCalendarEnabled} onCheckedChange={setIsGoogleCalendarEnabled} />
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline">Annuler</Button>
        <Button variant="default">Enregistrer</Button>
      </div>
    </div>
  )
}
