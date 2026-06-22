import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Switch } from '../../../components/ui/Switch'
import { BackLink } from '../../../components/ui/BackLink'
import { Shield, Smartphone, Monitor, AlertTriangle, User, Sun } from 'react-feather'

const compteTabs = [
  { label: 'Profil', icon: User, to: '/settings/compte/profil' },
  { label: 'Sécurité', icon: Shield, to: '/settings/compte/securite' },
  { label: 'Préférences', icon: Sun, to: '/settings/compte/preferences' },
]

const sessions = [
  { id: 1, browser: 'Chrome 124.0', os: 'Windows 11', ip: '192.168.1.42', date: '12 juin 2026, 14:32', current: true },
  { id: 2, browser: 'Safari 18.0', os: 'iOS 18', ip: '10.0.0.85', date: '11 juin 2026, 09:15', current: false },
]

const history = [
  { date: '12 juin 2026, 14:32', browser: 'Chrome 124.0 / Windows 11', ip: '192.168.1.42', success: true },
  { date: '11 juin 2026, 09:15', browser: 'Safari 18.0 / iOS 18', ip: '10.0.0.85', success: true },
  { date: '10 juin 2026, 22:04', browser: 'Chrome 124.0 / Windows 11', ip: '192.168.1.42', success: false },
]

export default function SecuriteSettingsPage() {
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)

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
      <h1 className="text-2xl font-semibold tracking-tight">Sécurité</h1>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-accent-light text-accent mt-0.5">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Mot de passe</h3>
              <p className="text-xs text-text-secondary mt-1">Dernière modification : il y a 45 jours</p>
            </div>
          </div>
          <Button variant="outline" size="sm">Changer mon mot de passe</Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-accent-light text-accent mt-0.5">
              <Smartphone size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Authentification à deux facteurs (2FA)</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-medium ${twoFAEnabled ? 'text-emerald-600' : 'text-text-secondary'}`}>
                  {twoFAEnabled ? 'Activé (recommandé)' : 'Désactivé'}
                </span>
                <Switch checked={twoFAEnabled} onCheckedChange={setTwoFAEnabled} />
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm">Configurer</Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-sm">Sessions actives</h3>
          <Button variant="danger" size="sm" icon={<AlertTriangle size={14} />}>Déconnecter toutes les sessions</Button>
        </div>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-start justify-between py-3 border-b border-border/30 last:border-0">
              <div className="flex items-start gap-3">
                <Monitor size={16} className="text-text-secondary mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{session.browser}</p>
                    {session.current && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-light text-accent font-medium">Actuelle</span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">{session.os} — {session.ip}</p>
                  <p className="text-xs text-text-secondary/60 mt-0.5">{session.date}</p>
                </div>
              </div>
              {!session.current && (
                <Button variant="ghost" size="sm">Déconnecter</Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-sm mb-4">Historique des connexions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left text-xs text-text-secondary font-medium pb-2 pr-4">Date</th>
                <th className="text-left text-xs text-text-secondary font-medium pb-2 pr-4">Navigateur / Appareil</th>
                <th className="text-left text-xs text-text-secondary font-medium pb-2 pr-4">Adresse IP</th>
                <th className="text-left text-xs text-text-secondary font-medium pb-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row, i) => (
                <tr key={i} className="border-b border-border/20 last:border-0">
                  <td className="py-3 pr-4 text-text">{row.date}</td>
                  <td className="py-3 pr-4 text-text">{row.browser}</td>
                  <td className="py-3 pr-4 text-text-secondary">{row.ip}</td>
                  <td className="py-3">
                    <span className={`text-xs font-medium ${row.success ? 'text-emerald-600' : 'text-error'}`}>
                      {row.success ? 'Succès' : 'Échec'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
