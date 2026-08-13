import { motion } from 'framer-motion'
import { useParams } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { BackLink } from '../../../components/ui/BackLink'
import {
  User, Shield, Mail, Phone, Activity, Clock,
  Lock, Eye, Edit3, ChevronRight, MapPin,
  Calendar, TrendingUp, ArrowUpRight, CheckCircle,
  AlertTriangle, Smartphone, Monitor, XCircle
} from 'react-feather'

interface UserProfile {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  position: string
  agency: string
  is_active: boolean
  created_at: string
  last_login: string
  last_ip: string
  twoFA: boolean
  stats: {
    ventes: number
    appels: number
    visites: number
    tauxConversion: number
    caGenere: number
  }
  loginHistory: Array<{ date: string; ip: string; device: string; action: string; success: boolean }>
  recentActivity: Array<{ date: string; action: string; detail: string }>
}

const mockProfile: UserProfile = {
  id: 2,
  firstName: 'Karim',
  lastName: 'Eloui',
  email: 'karim@squaremeter.com',
  phone: '+212 6 23 45 67 89',
  role: 'agent',
  position: 'Agent Commercial',
  agency: 'M2 Square Meter',
  is_active: true,
  created_at: '20/02/2025',
  last_login: '13/06/2026 08:15',
  last_ip: '192.168.1.1',
  twoFA: false,
  stats: { ventes: 5, appels: 38, visites: 12, tauxConversion: 22, caGenere: 75000 },
  loginHistory: [
    { date: '13/06/2026 08:15', ip: '192.168.1.1', device: 'Chrome/Windows', action: 'Connexion', success: true },
    { date: '12/06/2026 17:45', ip: '192.168.1.2', device: 'Safari/iOS', action: 'Connexion', success: true },
    { date: '11/06/2026 09:30', ip: '192.168.1.1', device: 'Chrome/Windows', action: 'Connexion', success: true },
    { date: '10/06/2026 14:00', ip: '192.168.1.3', device: 'Firefox/Windows', action: 'Connexion', success: false },
    { date: '09/06/2026 11:00', ip: '192.168.1.1', device: 'Chrome/Windows', action: 'Connexion', success: true },
  ],
  recentActivity: [
    { date: '13/06/2026 09:30', action: 'Visite', detail: 'Villa Marrakech (Sophie Martin)' },
    { date: '12/06/2026 14:00', action: 'Appel proposition', detail: 'Ahmed Benali' },
    { date: '11/06/2026 16:30', action: 'Signature mandat', detail: 'Mme Dupont' },
    { date: '10/06/2026 10:00', action: 'Nouveau prospect', detail: 'Leila Benbrahim - Appartement Casa' },
    { date: '09/06/2026 15:00', action: 'Document uploadé', detail: 'DPE Villa Marrakech' },
  ],
}

export default function AdminUserDetailPage() {
  const { id: _id, adminId } = useParams()
  const profile = mockProfile

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <BackLink to={`/admin/${adminId}/users`} />

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-accent-light text-accent flex items-center justify-center text-xl font-bold flex-shrink-0">
          {profile.firstName[0]}{profile.lastName[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {profile.firstName} {profile.lastName}
            </h1>
            <Badge variant={profile.is_active ? 'success' : 'error'} size="sm">
              {profile.is_active ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
          <p className="text-sm text-text-secondary mt-0.5">
            {profile.position} - {profile.agency}
          </p>
        </div>
        <Button variant="outline" icon={<Edit3 size={14} />}>Modifier le profil</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-text" />
            <h2 className="font-semibold">Informations personnelles</h2>
          </div>
          <div className="space-y-3.5">
            {[
              { icon: User, label: 'Prénom', value: profile.firstName },
              { icon: User, label: 'Nom', value: profile.lastName },
              { icon: Mail, label: 'Email', value: profile.email },
              { icon: Phone, label: 'Téléphone', value: profile.phone },
              { icon: MapPin, label: 'Poste', value: profile.position },
              { icon: Shield, label: 'Agence', value: profile.agency },
              { icon: Shield, label: 'Rôle', value: profile.role.charAt(0).toUpperCase() + profile.role.slice(1) },
              { icon: Calendar, label: 'Date de création', value: profile.created_at },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-center gap-3 text-sm">
                  <div className="w-7 h-7 rounded-lg bg-background flex items-center justify-center flex-shrink-0 text-text-secondary/60">
                    <Icon size={13} />
                  </div>
                  <span className="text-text-secondary w-28">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Stats */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-text" />
            <h2 className="font-semibold">Statistiques</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-accent-light/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-accent">{profile.stats.ventes}</p>
              <p className="text-xs text-text-secondary mt-0.5">Ventes ce mois</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{profile.stats.appels}</p>
              <p className="text-xs text-text-secondary mt-0.5">Appels</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{profile.stats.visites}</p>
              <p className="text-xs text-text-secondary mt-0.5">Visites</p>
            </div>
            <div className="bg-violet-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-violet-600">{profile.stats.caGenere.toLocaleString('fr-FR')}</p>
              <p className="text-xs text-text-secondary mt-0.5">CA généré (MAD)</p>
            </div>
          </div>
          <div className="bg-background rounded-xl p-4">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-text-secondary">Taux de conversion</span>
              <span className="font-semibold text-emerald-600">{profile.stats.tauxConversion}%</span>
            </div>
            <div className="w-full h-2 bg-border/60 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${profile.stats.tauxConversion}%` }} />
            </div>
          </div>
          <button className="mt-4 text-sm text-accent hover:text-accent-hover font-medium transition-colors inline-flex items-center gap-1">
            Voir le détail
            <ChevronRight size={14} />
          </button>
        </Card>
      </div>

      {/* Security */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-text" />
            <h2 className="font-semibold">Sécurité</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-text-secondary w-36">Statut</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${profile.is_active ? 'bg-emerald-500' : 'bg-text-secondary/40'}`} />
                <span className={`font-medium ${profile.is_active ? 'text-emerald-600' : 'text-text-secondary'}`}>
                  {profile.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-text-secondary w-36">Dernière connexion</span>
              <span className="font-medium">{profile.last_login}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-text-secondary w-36">Dernière adresse IP</span>
              <span className="font-medium text-text-secondary">{profile.last_ip}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-text-secondary w-36">2FA</span>
              <Badge variant={profile.twoFA ? 'success' : 'default'} size="sm">
                {profile.twoFA ? 'Activé' : 'Désactivé'}
              </Badge>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <Button variant="outline" size="sm" icon={<Lock size={12} />}>
              Réinitialiser le mot de passe
            </Button>
            <Button
              variant={profile.is_active ? 'danger' : 'default'}
              size="sm"
              icon={profile.is_active ? <XCircle size={12} /> : <CheckCircle size={12} />}
            >
              {profile.is_active ? 'Désactiver le compte' : 'Activer le compte'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Login History */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-text" />
          <h2 className="font-semibold">Historique des connexions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 text-left text-xs text-text-secondary">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">IP</th>
                <th className="pb-3 font-medium">Appareil</th>
                <th className="pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {profile.loginHistory.map((entry, i) => (
                <tr key={i} className="border-b border-border/20 hover:bg-background/50 transition-colors">
                  <td className="py-3 text-sm">{entry.date}</td>
                  <td className="py-3 text-sm text-text-secondary">{entry.ip}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {entry.device.toLowerCase().includes('ios') || entry.device.toLowerCase().includes('mobile')
                        ? <Smartphone size={13} className="text-text-secondary/60" />
                        : <Monitor size={13} className="text-text-secondary/60" />
                      }
                      <span className="text-sm text-text-secondary">{entry.device}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5">
                      {entry.success ? (
                        <CheckCircle size={12} className="text-emerald-500" />
                      ) : (
                        <XCircle size={12} className="text-error" />
                      )}
                      <span className={`text-sm ${entry.success ? 'text-text' : 'text-error'}`}>
                        {entry.action}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-text" />
            <h2 className="font-semibold">Activité récente</h2>
          </div>
          <Badge variant="primary" size="sm">5 actions</Badge>
        </div>
        <div className="space-y-2">
          {profile.recentActivity.map((act, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-background transition-colors">
              <div className="w-8 h-8 rounded-lg bg-accent-light text-accent flex items-center justify-center flex-shrink-0">
                <Activity size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{act.action}</p>
                <p className="text-xs text-text-secondary mt-0.5">{act.detail}</p>
              </div>
              <span className="text-xs text-text-secondary/60 whitespace-nowrap flex-shrink-0">{act.date}</span>
            </div>
          ))}
        </div>
        <button className="mt-4 text-sm text-accent hover:text-accent-hover font-medium transition-colors inline-flex items-center gap-1">
          Voir toutes les actions
          <ChevronRight size={14} />
        </button>
      </Card>
    </motion.div>
  )
}
