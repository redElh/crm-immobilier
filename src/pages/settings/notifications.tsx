import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TimePicker } from '../../components/ui/TimePicker'
import { Switch } from '../../components/ui/Switch'
import { Mail, Bell, Smartphone, Edit3, Save, ArrowLeft } from 'react-feather'
import {
  Stage,
  StageBadge,
  StageButton,
  OrbIcon,
  STAGE_HUES,
  useStageTheme,
} from '../../components/dashboard/Stage'

type ChannelKey = 'email' | 'app' | 'sms'
interface NotificationRow { id: string; label: string; channels: Record<ChannelKey, boolean> }
interface NotificationSection { title: string; rows: NotificationRow[] }

const sections: NotificationSection[] = [
  { title: 'Nouveaux leads', rows: [{ id: 'new-lead', label: 'Notification pour chaque nouveau lead', channels: { email: true, app: true, sms: false } }, { id: 'daily-summary', label: 'Résumé quotidien', channels: { email: false, app: true, sms: false } }] },
  { title: 'Croisements', rows: [{ id: 'cross-match', label: 'Nouveau croisement trouvé', channels: { email: true, app: true, sms: false } }, { id: 'price-drop', label: 'Alerte baisse de prix', channels: { email: true, app: true, sms: false } }] },
  { title: 'Messages', rows: [{ id: 'new-message', label: 'Nouveau message reçu', channels: { email: true, app: true, sms: true } }, { id: 'unread-24h', label: 'Message non lu après 24h', channels: { email: false, app: true, sms: false } }] },
  { title: 'Rendez-vous', rows: [{ id: 'reminder-1h', label: 'Rappel 1h avant', channels: { email: true, app: true, sms: true } }, { id: 'reminder-1d', label: 'Rappel 1 jour avant', channels: { email: true, app: true, sms: false } }] },
  { title: 'Documents', rows: [{ id: 'signed', label: 'Document signé par un client', channels: { email: true, app: true, sms: false } }, { id: 'pending-signature', label: 'Document en attente de signature', channels: { email: false, app: true, sms: false } }] },
  { title: 'Équipe', rows: [{ id: 'team-actions', label: "Notification des actions de mon équipe", channels: { email: false, app: true, sms: false } }] },
]

function initState() {
  const state: Record<string, boolean> = {}
  sections.forEach(s => s.rows.forEach(r => { (['email', 'app', 'sms'] as ChannelKey[]).forEach(ch => { state[`${r.id}-${ch}`] = r.channels[ch] }) }))
  state['channel-email'] = true; state['channel-app'] = true; state['channel-sms'] = false
  return state
}

export default function NotificationSettingsPage() {
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const [toggles, setToggles] = useState<Record<string, boolean>>(initState)
  const [dndStart, setDndStart] = useState('22:00')
  const [dndEnd, setDndEnd] = useState('08:00')
  const [dndEnabled, setDndEnabled] = useState(false)
  const toggle = (key: string) => setToggles(prev => ({ ...prev, [key]: !prev[key] }))

  const channels = [
    { key: 'channel-email', icon: Mail, label: 'Email', value: 'karim@m2squaremeter.com', hue: STAGE_HUES.violet },
    { key: 'channel-app', icon: Bell, label: 'Application', value: 'Notifications dans le CRM', hue: STAGE_HUES.sky },
    { key: 'channel-sms', icon: Smartphone, label: 'SMS', value: '+212 6 12 34 56 78', hue: STAGE_HUES.emerald },
  ]

  return (
    <Stage theme={theme}>
      <div className="space-y-6">
        <button onClick={() => navigate(-1)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors w-fit ${isDark ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-teal-900/10 text-slate-600 hover:bg-white'}`}><ArrowLeft size={13} /> Retour</button>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" /></span>
              <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>Paramètres · Notifications</p>
            </div>
            <h1 className={`mt-1 text-3xl font-extrabold tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent' : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent'}`}>Notifications</h1>
            <p className={`mt-0.5 text-sm ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>Choisissez comment et quand vous êtes notifié</p>
          </div>
          <StageBadge variant="neutral">{Object.values(toggles).filter(Boolean).length} canaux actifs</StageBadge>
        </div>

        <div className="stage-glass p-6">
          <div className="flex items-center gap-3 mb-5">
            <OrbIcon icon={Bell} hue={STAGE_HUES.amber} size={36} radius={11} />
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Canaux</h3>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Activez vos canaux de diffusion</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {channels.map(ch => {
              const ChIcon = ch.icon
              const enabled = toggles[ch.key]
              return (
                <div key={ch.key} className={`p-4 rounded-2xl border transition-all ${enabled ? (isDark ? 'border-violet-400/20 bg-violet-500/5' : 'border-teal-500/20 bg-teal-50/50') : isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <OrbIcon icon={ChIcon} hue={ch.hue} size={34} radius={10} />
                      <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{ch.label}</p>
                    </div>
                    <Switch checked={toggles[ch.key]} onCheckedChange={() => toggle(ch.key)} />
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{ch.value}</p>
                  {ch.key === 'channel-sms' && <button className={`text-xs font-semibold inline-flex items-center gap-1 mt-2 ${isDark ? 'text-violet-300 hover:text-white' : 'text-teal-700 hover:text-teal-900'}`}><Edit3 size={11} />Configurer</button>}
                </div>
              )
            })}
          </div>
        </div>

        <div className="stage-glass p-6">
          <div className="flex items-center gap-3 mb-5">
            <OrbIcon icon={Mail} hue={STAGE_HUES.violet} size={36} radius={11} />
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Types de notifications</h3>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Activez finement chaque type par canal</p>
            </div>
          </div>
          <div className="space-y-6">
            {sections.map(section => (
              <div key={section.title} className={`rounded-2xl border p-4 ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/40'}`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isDark ? 'text-violet-300' : 'text-teal-700'}`}>
                  <span className="h-1 w-4 rounded-full" style={{ background: `linear-gradient(90deg, ${STAGE_HUES.violet.a}, ${STAGE_HUES.violet.b})` }} />
                  {section.title}
                </h4>
                <div className="grid grid-cols-[1fr_48px_48px_48px] gap-x-2 gap-y-1 items-center">
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Type</div>
                  <div className="flex justify-center"><Mail size={13} className={isDark ? 'text-violet-300' : 'text-teal-600'} /></div>
                  <div className="flex justify-center"><Bell size={13} className={isDark ? 'text-sky-300' : 'text-sky-600'} /></div>
                  <div className="flex justify-center"><Smartphone size={13} className={isDark ? 'text-emerald-300' : 'text-emerald-600'} /></div>
                  {section.rows.map(row => (
                    <div key={row.id} className="contents">
                      <span className={`text-sm py-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{row.label}</span>
                      {(['email', 'app', 'sms'] as ChannelKey[]).map(ch => (
                        <div key={ch} className="flex justify-center py-2"><Switch checked={toggles[`${row.id}-${ch}`]} onCheckedChange={() => toggle(`${row.id}-${ch}`)} /></div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="stage-glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <OrbIcon icon={Smartphone} hue={STAGE_HUES.fuchsia} size={36} radius={11} />
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Horaires — Ne pas déranger</h3>
          </div>
          <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/40'}`}>
            <div>
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Activer le mode Ne pas déranger</p>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Aucune notification ne sera émise pendant la plage définie</p>
            </div>
            <Switch checked={dndEnabled} onCheckedChange={setDndEnabled} />
          </div>
          <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4 ${!dndEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} whitespace-nowrap`}>Ne pas notifier entre</span>
            <TimePicker value={dndStart} onChange={e => setDndStart(e.target.value)} disabled={!dndEnabled} className="w-32" />
            <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>et</span>
            <TimePicker value={dndEnd} onChange={e => setDndEnd(e.target.value)} disabled={!dndEnabled} className="w-32" />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <StageButton variant="glass" onClick={() => setToggles(initState())}>Réinitialiser</StageButton>
          <StageButton variant="primary" icon={<Save size={14} />}>Enregistrer</StageButton>
        </div>
      </div>
    </Stage>
  )
}
