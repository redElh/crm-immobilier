import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { BackLink } from '../../../components/ui/BackLink'
import { User, Camera, Shield, Sun } from 'react-feather'

const compteTabs = [
  { label: 'Profil', icon: User, to: '/settings/compte/profil' },
  { label: 'Sécurité', icon: Shield, to: '/settings/compte/securite' },
  { label: 'Préférences', icon: Sun, to: '/settings/compte/preferences' },
]

const agencies = [
  { value: 'm2', label: 'M2 Square Meter' },
  { value: 'other', label: 'Autre agence' }
]

export default function ProfilSettingsPage() {
  const [prenom, setPrenom] = useState('Karim')
  const [nom, setNom] = useState('Eloui')
  const [email, setEmail] = useState('karim@m2squaremeter.com')
  const [telephone, setTelephone] = useState('+212 6 12 34 56 78')
  const [poste, setPoste] = useState('Agent commercial')
  const [agence, setAgence] = useState('m2')
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 1500)
  }

  const handleCancel = () => {
    setPrenom('Karim')
    setNom('Eloui')
    setEmail('karim@m2squaremeter.com')
    setTelephone('+212 6 12 34 56 78')
    setPoste('Agent commercial')
    setAgence('m2')
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
              <Input
                label="Prénom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
              />
              <Input
                label="Nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Téléphone"
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-5">Informations professionnelles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Poste"
            value={poste}
            onChange={(e) => setPoste(e.target.value)}
          />
          <Select
            label="Agence"
            options={agencies}
            value={agence}
            onValueChange={setAgence}
          />
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleCancel}>Annuler</Button>
        <Button variant="default" onClick={handleSave} loading={saving}>Enregistrer</Button>
      </div>
    </div>
  )
}
