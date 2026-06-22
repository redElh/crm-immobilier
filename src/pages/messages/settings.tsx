import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Save, ArrowLeft, Bell, Mail, MessageSquare, Edit3, User, Shield, Globe,
  Calendar, Code, Users, Download, Upload, Database, HelpCircle, ChevronRight,
  Camera, Check, X, MoreVertical, Search,
} from 'react-feather'
import { Switch } from '../../components/ui/Switch'
import { Select } from '../../components/ui/Select'
import { defaultSettings } from '../../types/messages'
import type { MessagingSettings } from '../../types/messages'

const NAV_ITEMS = [
  { id: 'account', label: 'Mon Compte', icon: <User size={16} /> },
  { id: 'communication', label: 'Communication', icon: <Mail size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { id: 'integrations', label: 'Intégrations', icon: <Code size={16} /> },
  { id: 'team', label: 'Équipe', icon: <Users size={16} /> },
  { id: 'data', label: 'Données', icon: <Database size={16} /> },
  { id: 'help', label: 'Aide & Support', icon: <HelpCircle size={16} /> },
] as const

type SectionId = (typeof NAV_ITEMS)[number]['id']

const languages = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
]

const TEAM_MEMBERS = [
  { id: '1', name: 'Myriam ABABOU', email: 'myriam@squaremeter.com', role: 'Admin', status: 'Actif', avatar: 'MA' },
  { id: '2', name: 'Karim Eloui', email: 'karim@squaremeter.com', role: 'Agent', status: 'Actif', avatar: 'KE' },
  { id: '3', name: 'Yasmine AATIC', email: 'yasmine@squaremeter.com', role: 'Agent', status: 'Actif', avatar: 'YA' },
  { id: '4', name: 'Dimitri DJEDJE', email: 'dimitri@squaremeter.com', role: 'Agent', status: 'Inactif', avatar: 'DD' },
  { id: '5', name: 'Hayat OUAKRIM', email: 'hayat@squaremeter.com', role: 'Agent', status: 'Actif', avatar: 'HO' },
  { id: '6', name: 'Leila BENBRAHIM', email: 'leila@squaremeter.com', role: 'Agent', status: 'Actif', avatar: 'LB' },
]

const ROLES = [
  { name: 'Admin', description: 'Accès total, gestion équipe, paramètres système', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  { name: 'Agent', description: 'Gestion clients, biens, transactions, calendrier', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { name: 'Stagiaire', description: 'Consultation uniquement, aucune modification', color: 'text-text-secondary bg-background border-border/50' },
]

const inputClass = "h-9 w-full px-3 text-sm rounded-lg border border-border bg-background text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"

export default function MessagingSettingsPage() {
  const navigate = useNavigate()
  const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
  const [settings, setSettings] = useState<MessagingSettings>({ ...defaultSettings })
  const [isSaving, setIsSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionId>('account')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isGoogleCalendarEnabled, setIsGoogleCalendarEnabled] = useState(false)
  const [teamSearch, setTeamSearch] = useState('')

  const updateSetting = <K extends keyof MessagingSettings>(key: K, value: MessagingSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      console.log('Settings saved:', settings)
      setIsSaving(false)
    }, 1000)
  }

  const backPath = `${isAdmin ? '/admin' : ''}/messages`

  const filteredMembers = TEAM_MEMBERS.filter(m =>
    !teamSearch || m.name.toLowerCase().includes(teamSearch.toLowerCase()) || m.email.toLowerCase().includes(teamSearch.toLowerCase())
  )

  const teamStats = {
    total: TEAM_MEMBERS.length,
    admins: TEAM_MEMBERS.filter(m => m.role === 'Admin').length,
    agents: TEAM_MEMBERS.filter(m => m.role === 'Agent').length,
    inactive: TEAM_MEMBERS.filter(m => m.status === 'Inactif').length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(backPath)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-text rounded-lg hover:bg-background transition-colors"
          >
            <ArrowLeft size={16} />
            Retour
          </button>
          <h1 className="text-2xl font-bold">Paramètres</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-60"
        >
          <Save size={15} />
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      <div className="flex gap-6">
        <nav className="w-52 shrink-0 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-accent-light/40 text-accent font-medium'
                    : 'text-text-secondary hover:bg-background hover:text-text'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="flex-1 min-w-0 space-y-6">
          {activeSection === 'account' && (
            <>
              <div className="bg-card rounded-xl border border-border/50 shadow-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-accent/10"><User size={18} className="text-accent" /></div>
                  <h2 className="text-lg font-semibold">Profil</h2>
                </div>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center">
                        <User size={32} className="text-accent" />
                      </div>
                      <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-background transition-colors">
                        <Camera size={12} className="text-text-secondary" />
                      </button>
                    </div>
                    <button className="text-xs text-accent hover:text-accent/80 transition-colors">Changer la photo</button>
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">Prénom</label>
                      <input type="text" defaultValue="Myriam" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">Nom</label>
                      <input type="text" defaultValue="Ababou" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
                      <input type="email" defaultValue="myriam@squaremeter.com" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">Téléphone</label>
                      <input type="tel" defaultValue="+212 6 12 34 56 78" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">Fonction</label>
                      <input type="text" defaultValue="Agent immobilier" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">Agence</label>
                      <input type="text" defaultValue="M2 Square Meter" className={inputClass} readOnly />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border/50 shadow-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-accent/10"><Shield size={18} className="text-accent" /></div>
                  <h2 className="text-lg font-semibold">Sécurité</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-border/30">
                    <div>
                      <p className="text-sm font-medium">Mot de passe</p>
                      <p className="text-xs text-text-secondary">Dernière modification il y a 3 mois</p>
                    </div>
                    <button className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-text hover:bg-background transition-colors">
                      Modifier
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">Authentification à deux facteurs</p>
                      <p className="text-xs text-text-secondary">Sécurisez votre compte avec une vérification en deux étapes</p>
                    </div>
                    <Switch checked={false} onCheckedChange={() => {}} />
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border/50 shadow-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-accent/10"><Globe size={18} className="text-accent" /></div>
                  <h2 className="text-lg font-semibold">Préférences</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Langue</label>
                    <Select options={languages} defaultValue="fr" className="w-full" />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border/30">
                    <div>
                      <p className="text-sm font-medium">Mode sombre</p>
                      <p className="text-xs text-text-secondary">Activer l'interface sombre</p>
                    </div>
                    <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">Fuseau horaire</p>
                      <p className="text-xs text-text-secondary">Afrique/Casablanca (UTC+1)</p>
                    </div>
                    <button className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-text hover:bg-background transition-colors">
                      Modifier
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'communication' && (
            <>
              <div className="bg-card rounded-xl border border-border/50 shadow-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-accent/10"><Edit3 size={18} className="text-accent" /></div>
                  <h2 className="text-lg font-semibold">Signature automatique</h2>
                </div>
                <textarea
                  className="w-full min-h-[140px] p-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-y"
                  value={settings.signature}
                  onChange={e => updateSetting('signature', e.target.value)}
                />
              </div>

              <div className="bg-card rounded-xl border border-border/50 shadow-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-accent/10"><MessageSquare size={18} className="text-accent" /></div>
                  <h2 className="text-lg font-semibold">Réponses automatiques</h2>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/30">
                  <div>
                    <p className="text-sm font-medium">Activer les réponses automatiques (absence)</p>
                    <p className="text-xs text-text-secondary">Un message sera envoyé automatiquement aux expéditeurs</p>
                  </div>
                  <Switch
                    checked={settings.autoReplyEnabled}
                    onCheckedChange={checked => updateSetting('autoReplyEnabled', checked)}
                  />
                </div>
                {settings.autoReplyEnabled && (
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Message d'absence</label>
                    <textarea
                      className="w-full min-h-[120px] p-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-y"
                      value={settings.autoReplyMessage}
                      onChange={e => updateSetting('autoReplyMessage', e.target.value)}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {activeSection === 'notifications' && (
            <div className="bg-card rounded-xl border border-border/50 shadow-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-accent/10"><Bell size={18} className="text-accent" /></div>
                <h2 className="text-lg font-semibold">Notifications</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-text-secondary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Nouveau message</p>
                      <p className="text-xs text-text-secondary">Recevoir une notification pour chaque nouveau message</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifyOnNewMessage}
                    onCheckedChange={checked => updateSetting('notifyOnNewMessage', checked)}
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <MessageSquare size={16} className="text-text-secondary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Résumé quotidien</p>
                      <p className="text-xs text-text-secondary">Recevoir un résumé des messages non lus chaque jour</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.dailyDigest}
                    onCheckedChange={checked => updateSetting('dailyDigest', checked)}
                  />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-text-secondary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Notification par email</p>
                      <p className="text-xs text-text-secondary">Recevoir un email hors CRM pour les nouveaux messages</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={checked => updateSetting('emailNotifications', checked)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'integrations' && (
            <>
              <div className="bg-card rounded-xl border border-border/50 shadow-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-accent/10"><Calendar size={18} className="text-accent" /></div>
                  <h2 className="text-lg font-semibold">Google Calendar</h2>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">Synchronisation calendrier</p>
                    <p className="text-xs text-text-secondary">Synchroniser vos événements avec Google Calendar</p>
                  </div>
                  <Switch checked={isGoogleCalendarEnabled} onCheckedChange={setIsGoogleCalendarEnabled} />
                </div>
                {isGoogleCalendarEnabled && (
                  <div className="mt-4 p-3 bg-accent/5 border border-accent/20 rounded-lg">
                    <p className="text-xs text-accent">Connecté à votre compte Google. Les événements sont synchronisés en temps réel.</p>
                  </div>
                )}
              </div>

              <div className="bg-card rounded-xl border border-border/50 shadow-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-accent/10"><Code size={18} className="text-accent" /></div>
                  <h2 className="text-lg font-semibold">API & Webhooks</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-border/30">
                    <div>
                      <p className="text-sm font-medium">Clé API</p>
                      <p className="text-xs text-text-secondary">sk_live_xxxxxxxxxxxxxx</p>
                    </div>
                    <button className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-text hover:bg-background transition-colors">
                      Régénérer
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">Webhook URL</p>
                      <p className="text-xs text-text-secondary">https://api.squaremeter.com/webhooks</p>
                    </div>
                    <button className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-text hover:bg-background transition-colors">
                      Tester
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'team' && (
            <>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border/50 shadow-card p-4">
                  <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Total</p>
                  <p className="text-2xl font-semibold mt-1">{teamStats.total}</p>
                  <p className="text-xs text-text-secondary/60 mt-0.5">membres</p>
                </div>
                <div className="bg-card rounded-xl border border-border/50 shadow-card p-4">
                  <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Admin</p>
                  <p className="text-2xl font-semibold mt-1">{teamStats.admins}</p>
                  <p className="text-xs text-text-secondary/60 mt-0.5">administrateurs</p>
                </div>
                <div className="bg-card rounded-xl border border-border/50 shadow-card p-4">
                  <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Agents</p>
                  <p className="text-2xl font-semibold mt-1">{teamStats.agents}</p>
                  <p className="text-xs text-text-secondary/60 mt-0.5">agents</p>
                </div>
                <div className="bg-card rounded-xl border border-border/50 shadow-card p-4">
                  <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Inactifs</p>
                  <p className="text-2xl font-semibold mt-1">{teamStats.inactive}</p>
                  <p className="text-xs text-text-secondary/60 mt-0.5">membres inactifs</p>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                  <div className="relative w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60" />
                    <input
                      type="text"
                      placeholder="Rechercher un membre..."
                      value={teamSearch}
                      onChange={e => setTeamSearch(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border bg-background text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
                    <Users size={14} />
                    Inviter un membre
                  </button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-background border-b border-border/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Membre</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Rôle</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Statut</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredMembers.map(m => (
                      <tr key={m.id} className="hover:bg-background/50 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-[11px] font-bold text-accent shrink-0">
                              {m.avatar}
                            </div>
                            <span className="font-medium text-text">{m.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{m.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded border ${
                            m.role === 'Admin' ? 'text-purple-500 bg-purple-500/10 border-purple-500/20' : 'text-blue-500 bg-blue-500/10 border-blue-500/20'
                          }`}>
                            {m.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'Actif' ? 'bg-emerald-500' : 'bg-text-secondary/30'}`} />
                            <span className="text-xs text-text-secondary">{m.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="p-1.5 rounded-lg hover:bg-background text-text-secondary/50 hover:text-text transition-colors opacity-0 group-hover:opacity-100">
                            <MoreVertical size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-card rounded-xl border border-border/50 shadow-card p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 rounded-lg bg-accent/10"><Shield size={18} className="text-accent" /></div>
                  <h2 className="text-lg font-semibold">Rôles et permissions</h2>
                </div>
                <div className="space-y-3">
                  {ROLES.map(r => (
                    <div key={r.name} className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                      <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded border shrink-0 mt-0.5 ${r.color}`}>
                        {r.name}
                      </span>
                      <p className="text-sm text-text-secondary">{r.description}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <button className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors">
                    Gérer les rôles <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </>
          )}

          {activeSection === 'data' && (
            <>
              <div className="bg-card rounded-xl border border-border/50 shadow-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-accent/10"><Download size={18} className="text-accent" /></div>
                  <h2 className="text-lg font-semibold">Export de données</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-b border-border/30">
                    <div>
                      <p className="text-sm font-medium">Exporter tous les clients</p>
                      <p className="text-xs text-text-secondary">CSV • Données complètes des clients</p>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-text hover:bg-background transition-colors">
                      <Download size={13} /> Exporter
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border/30">
                    <div>
                      <p className="text-sm font-medium">Exporter les biens</p>
                      <p className="text-xs text-text-secondary">CSV • Liste complète des biens avec propriétaires</p>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-text hover:bg-background transition-colors">
                      <Download size={13} /> Exporter
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">Exporter les transactions</p>
                      <p className="text-xs text-text-secondary">CSV • Historique des ventes et locations</p>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-text hover:bg-background transition-colors">
                      <Download size={13} /> Exporter
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border/50 shadow-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-accent/10"><Upload size={18} className="text-accent" /></div>
                  <h2 className="text-lg font-semibold">Import de données</h2>
                </div>
                <div className="p-6 border-2 border-dashed border-border/50 rounded-xl text-center">
                  <Upload size={28} className="mx-auto mb-2 text-text-secondary/40" />
                  <p className="text-sm font-medium text-text">Glissez-déposez vos fichiers ici</p>
                  <p className="text-xs text-text-secondary/60 mt-1">CSV, XLSX, ou JSON • Taille max: 50 Mo</p>
                  <button className="mt-3 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
                    Sélectionner un fichier
                  </button>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border/50 shadow-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-accent/10"><Database size={18} className="text-accent" /></div>
                  <h2 className="text-lg font-semibold">Sauvegarde</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-b border-border/30">
                    <div>
                      <p className="text-sm font-medium">Dernière sauvegarde</p>
                      <p className="text-xs text-text-secondary">16 juin 2026 à 23:00</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-emerald-500">
                      <Check size={12} /> Succès
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">Sauvegarde automatique</p>
                      <p className="text-xs text-text-secondary">Tous les jours à 23:00</p>
                    </div>
                    <Switch checked={true} onCheckedChange={() => {}} />
                  </div>
                </div>
                <div className="mt-4">
                  <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border text-text hover:bg-background transition-colors">
                    <Database size={14} />
                    Lancer une sauvegarde maintenant
                  </button>
                </div>
              </div>
            </>
          )}

          {activeSection === 'help' && (
            <div className="bg-card rounded-xl border border-border/50 shadow-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-accent/10"><HelpCircle size={18} className="text-accent" /></div>
                <h2 className="text-lg font-semibold">Aide & Support</h2>
              </div>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 rounded-lg bg-background hover:bg-background/80 transition-colors text-left">
                  <div>
                    <p className="text-sm font-medium text-text">Centre d'aide</p>
                    <p className="text-xs text-text-secondary">Consultez notre documentation et nos guides</p>
                  </div>
                  <ChevronRight size={14} className="text-text-secondary/40" />
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-lg bg-background hover:bg-background/80 transition-colors text-left">
                  <div>
                    <p className="text-sm font-medium text-text">Contacter le support</p>
                    <p className="text-xs text-text-secondary">Envoyez un message à notre équipe technique</p>
                  </div>
                  <ChevronRight size={14} className="text-text-secondary/40" />
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-lg bg-background hover:bg-background/80 transition-colors text-left">
                  <div>
                    <p className="text-sm font-medium text-text">Guide de démarrage</p>
                    <p className="text-xs text-text-secondary">Les bases pour bien commencer avec Square Meter</p>
                  </div>
                  <ChevronRight size={14} className="text-text-secondary/40" />
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-lg bg-background hover:bg-background/80 transition-colors text-left">
                  <div>
                    <p className="text-sm font-medium text-text">Signaler un bug</p>
                    <p className="text-xs text-text-secondary">Vous avez rencontré un problème ? Faites-le nous savoir</p>
                  </div>
                  <ChevronRight size={14} className="text-text-secondary/40" />
                </button>
              </div>
              <div className="mt-4 p-4 rounded-lg bg-accent/5 border border-accent/20">
                <p className="text-sm font-medium text-accent">Besoin d'aide supplémentaire ?</p>
                <p className="text-xs text-accent/70 mt-1">Notre équipe est disponible du lundi au vendredi de 9h à 18h.</p>
                <button className="mt-2 px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent/90 transition-colors">
                  Nous contacter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
