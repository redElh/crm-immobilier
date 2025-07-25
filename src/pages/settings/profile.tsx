import { useState } from 'react'
import Card from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Switch } from '../../components/ui/Switch'

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
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon="arrow-left" onClick={() => window.history.back()} />
        <h1 className="text-2xl font-bold">Profil</h1>
      </div>

      <Card>
        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  <Icon name="user" className="w-12 h-12 text-gray-400" />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="absolute -bottom-2 -right-2 rounded-full p-2"
                >
                  <Icon name="camera" className="w-4 h-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm">
                Changer la photo
              </Button>
            </div>

            <div className="flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Prénom" defaultValue="Karim" />
                <Input label="Nom" defaultValue="Eloui" />
                <Input label="Email" type="email" defaultValue="karim@m2squaremeter.com" />
                <Input label="Téléphone" type="tel" defaultValue="+212 6 12 34 56 78" />
              </div>

              <Select 
                label="Agence" 
                options={agencies} 
                defaultValue="m2" 
              />

              <Textarea 
                label="Signature email" 
                defaultValue="Karim Eloui\nAgent Commercial\nM2 Square Meter\nTél: +212 6 12 34 56 78" 
                rows={4} 
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4">Préférences</h3>
            <div className="space-y-4">
              <Select 
                label="Langue" 
                options={languages} 
                defaultValue="fr" 
              />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mode sombre</p>
                  <p className="text-sm text-gray-600">Activez l'interface sombre</p>
                </div>
                <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Calendrier Google</p>
                  <p className="text-sm text-gray-600">Synchroniser avec mon calendrier</p>
                </div>
                <Switch checked={isGoogleCalendarEnabled} onCheckedChange={setIsGoogleCalendarEnabled} className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400"/>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button variant="outline">Annuler</Button>
            <Button variant="default">Enregistrer</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}