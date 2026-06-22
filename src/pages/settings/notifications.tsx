import { useState } from 'react'
import Card from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { TimePicker } from '../../components/ui/TimePicker'
import { Input } from '../../components/ui/Input'
import { Switch } from '../../components/ui/Switch'
import { BackLink } from '../../components/ui/BackLink'
import { Mail, Bell, Smartphone, Edit3, Save } from 'react-feather'

type ChannelKey = 'email' | 'app' | 'sms'

interface NotificationRow {
  id: string
  label: string
  channels: Record<ChannelKey, boolean>
}

interface NotificationSection {
  title: string
  rows: NotificationRow[]
}

const channelDefaults = {
  email: true,
  app: true,
  sms: false,
}

const sections: NotificationSection[] = [
  {
    title: 'Nouveaux leads',
    rows: [
      { id: 'new-lead', label: 'Notification pour chaque nouveau lead', channels: { email: true, app: true, sms: false } },
      { id: 'daily-summary', label: 'Résumé quotidien', channels: { email: false, app: true, sms: false } },
    ],
  },
  {
    title: 'Croisements',
    rows: [
      { id: 'cross-match', label: 'Nouveau croisement trouvé', channels: { email: true, app: true, sms: false } },
      { id: 'price-drop', label: 'Alerte baisse de prix', channels: { email: true, app: true, sms: false } },
    ],
  },
  {
    title: 'Messages',
    rows: [
      { id: 'new-message', label: 'Nouveau message reçu', channels: { email: true, app: true, sms: true } },
      { id: 'unread-24h', label: 'Message non lu après 24h', channels: { email: false, app: true, sms: false } },
    ],
  },
  {
    title: 'Rendez-vous',
    rows: [
      { id: 'reminder-1h', label: 'Rappel 1h avant', channels: { email: true, app: true, sms: true } },
      { id: 'reminder-1d', label: 'Rappel 1 jour avant', channels: { email: true, app: true, sms: false } },
    ],
  },
  {
    title: 'Documents',
    rows: [
      { id: 'signed', label: 'Document signé par un client', channels: { email: true, app: true, sms: false } },
      { id: 'pending-signature', label: 'Document en attente de signature', channels: { email: false, app: true, sms: false } },
    ],
  },
  {
    title: 'Équipe',
    rows: [
      { id: 'team-actions', label: 'Notification des actions de mon équipe', channels: { email: false, app: true, sms: false } },
    ],
  },
]

function initState() {
  const state: Record<string, boolean> = {}
  sections.forEach((s) =>
    s.rows.forEach((r) => {
      ;(['email', 'app', 'sms'] as ChannelKey[]).forEach((ch) => {
        state[`${r.id}-${ch}`] = r.channels[ch]
      })
    }),
  )
  state['channel-email'] = channelDefaults.email
  state['channel-app'] = channelDefaults.app
  state['channel-sms'] = channelDefaults.sms
  return state
}

export default function NotificationSettingsPage() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(initState)
  const [dndStart, setDndStart] = useState('22:00')
  const [dndEnd, setDndEnd] = useState('08:00')
  const [dndEnabled, setDndEnabled] = useState(false)

  const toggle = (key: string) => setToggles((prev) => ({ ...prev, [key]: !prev[key] }))

  const channels = [
    { key: 'channel-email', icon: Mail, label: 'Email', value: 'karim@m2squaremeter.com', color: 'text-accent', bg: 'bg-accent-light' },
    { key: 'channel-app', icon: Bell, label: 'Application', value: 'Notifications dans le CRM', color: 'text-violet-600', bg: 'bg-violet-50' },
    { key: 'channel-sms', icon: Smartphone, label: 'SMS', value: '+212 6 12 34 56 78', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  const channelIcons: Record<ChannelKey, React.ReactNode> = {
    email: <Mail size={13} className="text-accent" />,
    app: <Bell size={13} className="text-violet-600" />,
    sms: <Smartphone size={13} className="text-emerald-600" />,
  }

  return (
    <div className="space-y-6">
      <BackLink />
      <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>

      <Card className="p-6">
        <h3 className="font-semibold mb-5">Canaux</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {channels.map((ch) => {
            const ChIcon = ch.icon
            return (
              <div key={ch.key} className="p-4 rounded-xl border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${ch.bg} ${ch.color}`}>
                    <ChIcon size={16} />
                  </div>
                  <Switch checked={toggles[ch.key]} onCheckedChange={() => toggle(ch.key)} />
                </div>
                <p className="text-sm font-medium">{ch.label}</p>
                <p className="text-xs text-text-secondary mt-0.5">{ch.value}</p>
                {ch.key === 'channel-sms' && (
                  <button className="text-xs text-accent hover:underline mt-2 inline-flex items-center gap-1">
                    <Edit3 size={11} />
                    Configurer
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-5">Types de notifications</h3>
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">{section.title}</h4>
              <div className="grid grid-cols-[1fr_48px_48px_48px] gap-x-2 gap-y-2 items-center">
                <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">Type</div>
                <div className="flex justify-center" title="Email">{channelIcons.email}</div>
                <div className="flex justify-center" title="Application">{channelIcons.app}</div>
                <div className="flex justify-center" title="SMS">{channelIcons.sms}</div>
                {section.rows.map((row) => (
                  <div key={row.id} className="contents">
                    <span className="text-sm py-2">{row.label}</span>
                    {(['email', 'app', 'sms'] as ChannelKey[]).map((ch) => (
                      <div key={ch} className="flex justify-center py-2">
                        <Switch
                          checked={toggles[`${row.id}-${ch}`]}
                          onCheckedChange={() => toggle(`${row.id}-${ch}`)}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-5">
        <h3 className="font-semibold">Horaires</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Activer le mode Ne pas déranger</p>
            <p className="text-xs text-text-secondary mt-0.5">Aucune notification ne sera émise pendant la plage définie</p>
          </div>
          <Switch checked={dndEnabled} onCheckedChange={setDndEnabled} />
        </div>
        <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 ${!dndEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <span className="text-sm text-text-secondary whitespace-nowrap">Ne pas notifier entre</span>
          <TimePicker
            value={dndStart}
            onChange={(e) => setDndStart(e.target.value)}
            disabled={!dndEnabled}
            className="w-32"
          />
          <span className="text-sm text-text-secondary">et</span>
          <TimePicker
            value={dndEnd}
            onChange={(e) => setDndEnd(e.target.value)}
            disabled={!dndEnabled}
            className="w-32"
          />
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline">Réinitialiser</Button>
        <Button variant="default" icon={<Save size={14} />}>Enregistrer</Button>
      </div>
    </div>
  )
}
