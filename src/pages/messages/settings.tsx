import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCheck } from 'lucide-react'
import {
  Save, ArrowLeft, Bell, MessageSquare, Edit3, User, Shield, Moon,
  Sun, Monitor, Download, Trash2, EyeOff, Settings as SettingsIcon,
  Smile, Mail, Clock, Camera, Loader,
} from 'react-feather'
import { Switch } from '../../components/ui/Switch'
import { Select } from '../../components/ui/Select'
import { defaultSettings } from '../../types/messages'
import type { MessagingSettings } from '../../types/messages'
import { Avatar } from '../../components/modules/messages/Avatar'
import { cn, getAdminBasePath } from '../../lib/utils'
import { useToast } from '../../components/ui/Toast'
import {
  OrbIcon, STAGE_HUES, StageBadge, StageButton, GERANT_MAUVE_HUE, useStageAccent, useStageTheme,
  type StageHue,
} from '../../components/dashboard/Stage'
import {
  fetchCurrentUser, uploadProfileImage, currentUserToParticipant,
  fetchMessagingSettings, saveMessagingSettings,
} from '../../services/messageService'
import { refreshMessagingSettings } from '../../services/realtime'
import { invalidateAppearance } from '../../services/messageAppearance'
import type { CurrentUser } from '../../services/messageService'

function isAdminRoute() {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/admin')
}

const THEME_OPTIONS = [
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'system', label: 'Système', icon: Monitor },
]

const SIZE_OPTIONS = [
  { value: 'small', label: 'Petit' },
  { value: 'medium', label: 'Moyen' },
  { value: 'large', label: 'Grand' },
]

function SettingRow({
  Icon, title, description, children, isDark,
}: {
  Icon: React.ComponentType<{ size?: number | string; className?: string }>
  title: string
  description: string
  children: React.ReactNode
  isDark: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border',
          'bg-[var(--msg-accent-soft)] text-[color:var(--msg-accent-line)] border-[color:var(--msg-accent-border)]')}>
          <Icon size={15} />
        </span>
        <div className="min-w-0">
          <p className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-slate-900')}>{title}</p>
          <p className={cn('text-xs mt-0.5 leading-relaxed', isDark ? 'text-slate-400' : 'text-slate-500')}>{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function SectionCard({
  Icon, hue, title, description, children, className, isDark,
}: {
  Icon: React.ComponentType<{ size?: number | string; className?: string }>
  hue: StageHue
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  isDark: boolean
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn('stage-glass p-5 overflow-hidden', className)}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <OrbIcon icon={Icon} hue={hue} size={36} radius={12} />
        <div className="min-w-0">
          <h2 className={cn('text-sm font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{title}</h2>
          {description && <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-slate-500')}>{description}</p>}
        </div>
      </div>
      <div className={cn('divide-y divide-[color:var(--msg-hairline)]')}>{children}</div>
    </motion.section>
  )
}

export default function MessagingSettingsPage() {
  const navigate = useNavigate()
  const admin = isAdminRoute()
  const backPath = `${admin ? getAdminBasePath() : ''}/messages`
  const { toast } = useToast()
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const stageAccent = useStageAccent()
  const [settings, setSettings] = useState<MessagingSettings>({ ...defaultSettings })
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [me, setMe] = useState<CurrentUser | null>(null)
  const isGerant = admin && me?.role === 'gerant'
  const interfaceHue = isGerant ? GERANT_MAUVE_HUE : stageAccent

  const updateSetting = <K extends keyof MessagingSettings>(key: K, value: MessagingSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const toggleDisableReadReceipts = (on: boolean) => {
    // Disabling only turns off receipt sending: the other switches keep their
    // values so the backend can leave messages sent before the disable moment
    // exactly as they were displayed.
    setSettings(prev => ({ ...prev, disableReadReceipts: on }))
  }

  const toggleShowReadReceipts = (on: boolean) => {
    setSettings(prev => {
      if (on && !prev.showReadReceipts) {
        // Read receipts were just (re)enabled: only messages sent from now on
        // should show the blue checks.
        return { ...prev, showReadReceipts: true, readReceiptsEnabledAt: new Date().toISOString() }
      }
      return { ...prev, showReadReceipts: on }
    })
  }

  const toggleShowOthersReadReceipts = (on: boolean) => {
    setSettings(prev => {
      if (on && !prev.showOthersReadReceipts) {
        // Showing read times was just (re)enabled: only messages sent from now
        // on should show when they were read.
        return { ...prev, showOthersReadReceipts: true, showOthersReadReceiptsEnabledAt: new Date().toISOString() }
      }
      return { ...prev, showOthersReadReceipts: on }
    })
  }

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    fetchCurrentUser()
      .then(u => { if (!cancelled) setMe(u) })
      .catch(() => { if (!cancelled) setMe(null) })
    fetchMessagingSettings()
      .then(s => { if (!cancelled) setSettings({ ...defaultSettings, ...s }) })
      .catch(() => { if (!cancelled) setSettings({ ...defaultSettings }) })
    return () => { cancelled = true }
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      const data = await uploadProfileImage(file)
      setMe(prev => (prev ? { ...prev, profile_image: data.profile_image } : prev))
      window.dispatchEvent(new CustomEvent('profileImageUpdated'))
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erreur lors du téléchargement')
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const saved = await saveMessagingSettings(settings)
      setSettings({ ...defaultSettings, ...saved })
      refreshMessagingSettings()
      invalidateAppearance()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      toast('success', 'Paramètres enregistrés')
    } catch {
      toast('error', "Impossible d'enregistrer les paramètres.")
    }
    setIsSaving(false)
  }

  const currentUser = me
    ? currentUserToParticipant(me)
    : {
        id: admin ? 'admin-1' : 'agent-2',
        name: 'Chargement...',
        type: admin ? ('admin' as const) : ('agent' as const),
        role: admin ? 'Administrateur' : 'Agent',
        email: '',
        presence: 'online' as const,
      }

  const notifCount = [settings.notifyOnNewMessage, settings.dailyDigest, settings.emailNotifications].filter(Boolean).length
  const receiptsOn = !settings.disableReadReceipts && (settings.showReadReceipts || settings.showOthersReadReceipts)
  const themeLabel = THEME_OPTIONS.find(t => t.value === settings.theme)?.label ?? 'Clair'
  const sizeLabel = SIZE_OPTIONS.find(s => s.value === settings.messageSize)?.label ?? 'Moyen'

  const msgVars = {
    '--msg-accent-a': interfaceHue.a,
    '--msg-accent-b': interfaceHue.b,
    '--msg-accent-line': interfaceHue.line,
    '--msg-accent-glow': interfaceHue.glow,
    '--msg-accent-soft': `${interfaceHue.a}18`,
    '--msg-accent-border': `${interfaceHue.a}42`,
    '--msg-hairline': isDark ? 'rgba(255,255,255,0.10)' : `${interfaceHue.line}1F`,
    '--msg-hairline-soft': isDark ? 'rgba(255,255,255,0.05)' : `${interfaceHue.line}12`,
    '--msg-ink': isDark ? '#E2E8F0' : interfaceHue.line,
    '--msg-ink-soft': isDark ? 'rgba(148,163,184,0.8)' : `${interfaceHue.line}B3`,
  } as CSSProperties
  const gradientTitle = isDark
    ? (admin ? 'from-[#F43F5E] via-[#FB7185] to-[#8B7CFF]' : 'from-white via-indigo-100 to-indigo-300')
    : (isGerant
        ? 'from-[#905D5D] via-[#A56E6E] to-[#C89292]'
        : admin ? 'from-[#EA580C] via-[#F97316] to-[#FBBF24]' : 'from-teal-900 via-teal-700 to-emerald-600')
  const lightInk = isDark ? 'text-slate-400' : isGerant ? 'text-[#905D5D]/65' : admin ? 'text-orange-900/60' : 'text-teal-900/60'

  const glowTextarea = isDark
    ? 'bg-white/[0.05] border-white/10 text-white placeholder:text-slate-500 focus:border-[color:var(--msg-accent-line)] focus:ring-2 focus:ring-[var(--msg-accent-soft)] focus:shadow-[0_0_0_1px_var(--msg-accent-border),0_0_44px_-12px_var(--msg-accent-glow)]'
    : 'bg-white border-[color:var(--msg-hairline)] text-slate-900 placeholder:text-slate-400 focus:border-[color:var(--msg-accent-line)] focus:ring-2 focus:ring-[var(--msg-accent-soft)] focus:shadow-[0_0_0_1px_var(--msg-accent-border),0_0_44px_-14px_var(--msg-accent-glow)]'

  return (
    <div className={cn('h-full w-full animate-fade-in')} style={msgVars}>
      {/* Défilement interne : la classe stage impose overflow:hidden (canvas aurora) */}
      <div className="flex flex-col h-full w-full overflow-y-auto scrollbar-thin">
      {/* Hero */}
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-4 shrink-0 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(backPath)}
            className={cn('w-10 h-10 rounded-xl border flex items-center justify-center transition-colors shrink-0',
              isDark ? 'border-white/10 text-slate-300 hover:text-white hover:bg-white/5' : 'border-[color:var(--msg-hairline)] text-slate-500 hover:text-[color:var(--msg-ink)] hover:bg-white/70 bg-white/60')}
            title="Retour à la messagerie"
          >
            <ArrowLeft size={17} />
          </button>
          <OrbIcon icon={SettingsIcon} hue={interfaceHue} size={48} radius={14} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              </span>
              <p className={cn('text-[10px] font-bold uppercase tracking-[0.24em] truncate', isDark ? 'text-slate-400/80' : lightInk)}>
                Messagerie · Paramètres
              </p>
            </div>
            <h1 className={cn('mt-1 bg-gradient-to-r bg-clip-text text-2xl sm:text-3xl font-extrabold tracking-tight truncate text-transparent', gradientTitle)}>
              Paramètres
            </h1>
            <p className={cn('mt-0.5 text-sm truncate', lightInk)}>
              Messagerie, confidentialité et notifications
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saved && (
            <StageBadge variant="ok">
              <CheckCheck size={13} /> Enregistré
            </StageBadge>
          )}
          <StageButton
            variant="primary"
            icon={isSaving ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Enregistrement…' : 'Enregistrer'}
          </StageButton>
        </div>
      </div>

      {/* Aperçu rapide */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 shrink-0 pb-4">
        {[
          { label: 'Notifications', value: `${notifCount}/3 actives`, Icon: Bell, hue: STAGE_HUES.amber },
          { label: 'Accusés de lecture', value: receiptsOn ? 'Activés' : 'Désactivés', Icon: Shield, hue: interfaceHue },
          { label: 'Affichage', value: `${themeLabel} · ${sizeLabel}`, Icon: Sun, hue: STAGE_HUES.sky },
        ].map(stat => (
          <div key={stat.label} className="stage-glass !rounded-2xl px-4 py-3 flex items-center gap-3 min-w-0">
            <OrbIcon icon={stat.Icon} hue={stat.hue} size={38} radius={12} />
            <div className="min-w-0">
              <p className={cn('text-sm font-extrabold leading-tight tracking-tight truncate', isDark ? 'text-white' : 'text-slate-900')}>{stat.value}</p>
              <p className={cn('text-[11px] truncate', isDark ? 'text-slate-400' : 'text-slate-500')}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cartes */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 pb-4">
        {/* Profil */}
        <SectionCard Icon={User} hue={STAGE_HUES.sky} title="Profil" description="Vos informations de messagerie" isDark={isDark}>
          <div className="py-4 flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar participant={currentUser} size="lg" showPresence />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Changer la photo de profil"
                className={cn('absolute -bottom-1 -right-1 w-7 h-7 rounded-full border flex items-center justify-center transition-all disabled:opacity-50 backdrop-blur-md',
                  isDark
                    ? 'bg-[#1b2342]/90 border-white/15 hover:bg-[var(--msg-accent-soft)] shadow-[0_4px_14px_-4px_var(--msg-accent-glow)]'
                    : 'bg-white border-[color:var(--msg-hairline)] hover:bg-[var(--msg-accent-soft)] shadow-sm')}
              >
                {uploading
                  ? <Loader size={12} className="animate-spin text-[color:var(--msg-accent-line)]" />
                  : <Camera size={12} className="text-[color:var(--msg-accent-line)]" />}
              </button>
            </div>
            <div className="min-w-0">
              <p className={cn('text-sm font-bold truncate', isDark ? 'text-white' : 'text-slate-900')}>{currentUser.name}</p>
              <p className={cn('text-xs truncate', isDark ? 'text-slate-400' : 'text-slate-500')}>{currentUser.role} · M2 Square Meter</p>
              {currentUser.email && (
                <p className={cn('text-xs truncate mt-0.5', isDark ? 'text-slate-500' : 'text-slate-400')}>{currentUser.email}</p>
              )}
              {uploadError && <p className="text-xs text-rose-400 mt-1">{uploadError}</p>}
            </div>
          </div>
        </SectionCard>

        {/* Notifications */}
        <SectionCard Icon={Bell} hue={STAGE_HUES.amber} title="Notifications" description="Choisissez comment être alerté des nouveaux messages" isDark={isDark}>
          <SettingRow Icon={Mail} title="Nouveau message" description="Notifier pour chaque nouveau message reçu" isDark={isDark}>
            <Switch checked={settings.notifyOnNewMessage} onCheckedChange={c => updateSetting('notifyOnNewMessage', c)} />
          </SettingRow>
          <SettingRow Icon={Clock} title="Résumé quotidien" description="Recevoir un récapitulatif des messages non lus chaque jour" isDark={isDark}>
            <Switch checked={settings.dailyDigest} onCheckedChange={c => updateSetting('dailyDigest', c)} />
          </SettingRow>
          <SettingRow Icon={Mail} title="Notification par email" description="Recevoir un email hors CRM pour les nouveaux messages" isDark={isDark}>
            <Switch checked={settings.emailNotifications} onCheckedChange={c => updateSetting('emailNotifications', c)} />
          </SettingRow>
        </SectionCard>

        {/* Confidentialité */}
        <SectionCard Icon={Shield} hue={interfaceHue} title="Confidentialité" description="Gérez les accusés de réception" isDark={isDark}>
          <SettingRow Icon={CheckCheck} title="Afficher les accusés de réception" description="Afficher les coches bleues (lu) sur vos messages" isDark={isDark}>
            <Switch
              checked={settings.showReadReceipts}
              disabled={settings.disableReadReceipts}
              onCheckedChange={toggleShowReadReceipts}
            />
          </SettingRow>
          <SettingRow Icon={EyeOff} title="Voir les accusés des autres" description="Afficher l'heure à laquelle vos messages ont été lus" isDark={isDark}>
            <Switch
              checked={settings.showOthersReadReceipts}
              disabled={settings.disableReadReceipts}
              onCheckedChange={toggleShowOthersReadReceipts}
            />
          </SettingRow>
          <SettingRow Icon={EyeOff} title="Désactiver les accusés" description="Ne plus envoyer ni recevoir d'accusés de lecture" isDark={isDark}>
            <Switch checked={settings.disableReadReceipts} onCheckedChange={toggleDisableReadReceipts} />
          </SettingRow>
          {settings.disableReadReceipts && (
            <p className={cn('pt-2 pb-1 text-xs leading-relaxed', isDark ? 'text-slate-500' : 'text-slate-400')}>
              Les accusés de réception sont désactivés pour vos nouveaux messages, envoyés et reçus. Les messages envoyés avant cette désactivation conservent leurs accusés.
            </p>
          )}
        </SectionCard>

        {/* Apparence */}
        <SectionCard Icon={Sun} hue={STAGE_HUES.fuchsia} title="Apparence" description="Personnalisez l'affichage de votre messagerie" isDark={isDark}>
          <div className="py-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border',
                'bg-[var(--msg-accent-soft)] text-[color:var(--msg-accent-line)] border-[color:var(--msg-accent-border)]')}>
                <Moon size={15} />
              </span>
              <div className="flex-1 min-w-[140px]">
                <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>Thème de la messagerie</p>
                <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-slate-500')}>Clair, sombre ou selon le système</p>
              </div>
              <div className="w-full sm:w-44 shrink-0">
                <Select
                  value={settings.theme}
                  onChange={val => updateSetting('theme', val as MessagingSettings['theme'])}
                  options={THEME_OPTIONS}
                />
              </div>
            </div>
          </div>
          <div className="py-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border',
                'bg-[var(--msg-accent-soft)] text-[color:var(--msg-accent-line)] border-[color:var(--msg-accent-border)]')}>
                <MessageSquare size={15} />
              </span>
              <div className="flex-1 min-w-[140px]">
                <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>Taille des messages</p>
                <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-slate-500')}>Taille du texte dans les conversations</p>
              </div>
              <div className="w-full sm:w-44 shrink-0">
                <Select
                  value={settings.messageSize}
                  onChange={val => updateSetting('messageSize', val as MessagingSettings['messageSize'])}
                  options={SIZE_OPTIONS}
                />
              </div>
            </div>
          </div>
          <SettingRow Icon={Smile} title="Émoticônes" description="Activer les émoticônes dans le composeur" isDark={isDark}>
            <Switch checked={settings.showEmojis} onCheckedChange={c => updateSetting('showEmojis', c)} />
          </SettingRow>
        </SectionCard>

        {/* Réponses automatiques */}
        <SectionCard Icon={Edit3} hue={STAGE_HUES.emerald} title="Réponses automatiques" description="Gérez votre réponse automatique en cas d'absence" className="lg:col-span-2" isDark={isDark}>
          <SettingRow Icon={Mail} title="Réponses automatiques (absence)" description="Un message sera envoyé automatiquement aux expéditeurs" isDark={isDark}>
            <Switch checked={settings.autoReplyEnabled} onCheckedChange={c => updateSetting('autoReplyEnabled', c)} />
          </SettingRow>
          {settings.autoReplyEnabled && (
            <div className="py-3">
              <p className={cn('text-sm font-semibold mb-2', isDark ? 'text-white' : 'text-slate-900')}>Message d'absence</p>
              <div className="relative rounded-2xl">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-8 top-0 h-px z-10"
                  style={{ background: `linear-gradient(90deg, transparent, ${interfaceHue.line}${isDark ? '99' : 'B3'}, ${interfaceHue.a}66, transparent)` }}
                />
                <textarea
                  value={settings.autoReplyMessage}
                  onChange={e => updateSetting('autoReplyMessage', e.target.value)}
                  rows={3}
                  placeholder="Votre message d'absence…"
                  className={cn('w-full rounded-2xl border px-4 py-3 text-sm leading-relaxed focus:outline-none transition-all duration-300 resize-y', glowTextarea)}
                />
              </div>
            </div>
          )}
        </SectionCard>

        {/* Données */}
        <SectionCard Icon={Download} hue={STAGE_HUES.sky} title="Données & actions" description="Exporter, sauvegarder ou nettoyer vos conversations" className="lg:col-span-2" isDark={isDark}>
          <SettingRow Icon={Download} title="Exporter les conversations" description="Télécharger l'historique complet en CSV" isDark={isDark}>
            <button className={cn('flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all',
              isDark
                ? 'border-white/10 text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] hover:border-[color:var(--msg-accent-border)]'
                : 'border-[color:var(--msg-hairline)] text-slate-600 bg-white hover:border-[color:var(--msg-accent-border)] hover:text-[color:var(--msg-ink)]')}>
              <Download size={13} /> Exporter
            </button>
          </SettingRow>
          <SettingRow Icon={Trash2} title="Supprimer les conversations" description="Effacer définitivement tous les échanges" isDark={isDark}>
            <button className={cn('flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all',
              isDark
                ? 'border-rose-400/30 text-rose-300 bg-rose-500/10 hover:bg-rose-500/20'
                : 'border-rose-500/30 text-rose-600 bg-rose-50 hover:bg-rose-100')}>
              <Trash2 size={13} /> Supprimer
            </button>
          </SettingRow>
        </SectionCard>
      </div>

      {/* Pied de page */}
      <div className="relative z-10 flex justify-center pb-6">
        <div className="stage-glass !rounded-full px-4 py-2 flex items-center gap-2">
          <Monitor size={12} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
          <span className={cn('text-[11px] font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>
            Thème : {themeLabel} · Taille : {sizeLabel}
          </span>
        </div>
      </div>
      </div>
    </div>
  )
}
