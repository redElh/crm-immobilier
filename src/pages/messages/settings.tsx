import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCheck } from 'lucide-react'
import {
  Save, ArrowLeft, Bell, MessageSquare, Edit3, User, Shield, Moon,
  Sun, Monitor, Download, Trash2, EyeOff,
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
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
  { value: 'system', label: 'Système' },
]

const SIZE_OPTIONS = [
  { value: 'small', label: 'Petit' },
  { value: 'medium', label: 'Moyen' },
  { value: 'large', label: 'Grand' },
]

function SettingRow({
  icon, title, description, children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text">{title}</p>
          <p className="text-xs text-text-secondary mt-0.5">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function SectionCard({
  icon, title, description, children, className,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('bg-card rounded-2xl border border-border/50 shadow-card p-5', className)}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-text">{title}</h2>
          {description && <p className="text-xs text-text-secondary mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="divide-y divide-border/30">{children}</div>
    </div>
  )
}

export default function MessagingSettingsPage() {
  const navigate = useNavigate()
  const admin = isAdminRoute()
  const backPath = `${admin ? getAdminBasePath() : ''}/messages`
  const { toast } = useToast()
  const [settings, setSettings] = useState<MessagingSettings>({ ...defaultSettings })
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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

  const [me, setMe] = useState<CurrentUser | null>(null)
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

  return (
    <div className={cn('animate-fade-in', settings.theme === 'dark' && 'dark bg-background')}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(backPath)}
            className="p-2 rounded-lg text-text-secondary hover:text-text hover:bg-card border border-border/60 transition-colors"
            title="Retour"
          >
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Paramètres</h1>
            <p className="text-xs text-text-secondary">Messagerie, confidentialité et notifications</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <CheckCheck size={14} />
              Paramètres enregistrés
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover active:scale-[0.98] shadow-sm transition-all disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save size={15} />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Profil */}
      <SectionCard icon={<User size={16} />} title="Profil" description="Vos informations de messagerie">
        <div className="py-4 flex items-center gap-4">
          <div className="relative shrink-0">
            <Avatar participant={currentUser} size="lg" />
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
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-background transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader size={12} className="animate-spin" /> : <Camera size={12} className="text-text-secondary" />}
            </button>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text">{currentUser.name}</p>
            <p className="text-xs text-text-secondary">{currentUser.role} · M2 Square Meter</p>
            <p className="text-xs text-text-secondary/60 mt-0.5">{currentUser.email}</p>
            {uploadError && <p className="text-xs text-error mt-1">{uploadError}</p>}
          </div>
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard
        icon={<Bell size={16} />}
        title="Notifications"
        description="Choisissez comment être alerté des nouveaux messages"
      >
        <SettingRow icon={<Mail size={15} />} title="Nouveau message" description="Notifier pour chaque nouveau message reçu">
          <Switch checked={settings.notifyOnNewMessage} onCheckedChange={c => updateSetting('notifyOnNewMessage', c)} />
        </SettingRow>
        <SettingRow icon={<Clock size={15} />} title="Résumé quotidien" description="Recevoir un récapitulatif des messages non lus chaque jour">
          <Switch checked={settings.dailyDigest} onCheckedChange={c => updateSetting('dailyDigest', c)} />
        </SettingRow>
        <SettingRow icon={<Mail size={15} />} title="Notification par email" description="Recevoir un email hors CRM pour les nouveaux messages">
          <Switch checked={settings.emailNotifications} onCheckedChange={c => updateSetting('emailNotifications', c)} />
        </SettingRow>
      </SectionCard>

      {/* Confidentialité */}
      <SectionCard
        icon={<Shield size={16} />}
        title="Confidentialité"
        description="Gérez les accusés de réception"
      >
        <SettingRow icon={<CheckCheck size={15} />} title="Afficher les accusés de réception" description="Afficher les coches bleues (lu) sur vos messages">
          <Switch
            checked={settings.showReadReceipts}
            disabled={settings.disableReadReceipts}
            onCheckedChange={toggleShowReadReceipts}
          />
        </SettingRow>
        <SettingRow icon={<EyeOff size={15} />} title="Voir les accusés des autres" description="Afficher l'heure à laquelle vos messages ont été lus">
          <Switch
            checked={settings.showOthersReadReceipts}
            disabled={settings.disableReadReceipts}
            onCheckedChange={toggleShowOthersReadReceipts}
          />
        </SettingRow>
        <SettingRow icon={<EyeOff size={15} />} title="Désactiver les accusés" description="Ne plus envoyer ni recevoir d'accusés de lecture">
          <Switch checked={settings.disableReadReceipts} onCheckedChange={toggleDisableReadReceipts} />
        </SettingRow>
        {settings.disableReadReceipts && (
          <p className="pt-2 pb-1 text-xs text-text-secondary/70">
            Les accusés de réception sont désactivés pour vos nouveaux messages, envoyés et reçus. Les messages envoyés avant cette désactivation conservent leurs accusés.
          </p>
        )}
      </SectionCard>

      {/* Apparence */}
      <SectionCard
        icon={<Sun size={16} />}
        title="Apparence"
        description="Personnalisez l'affichage de votre messagerie"
      >
        <div className="py-3">
          <div className="flex items-center gap-3 mb-2.5">
            <span className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Moon size={15} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-text">Thème de la messagerie</p>
              <p className="text-xs text-text-secondary mt-0.5">Clair, sombre ou selon le système</p>
            </div>
            <div className="w-44 shrink-0">
              <Select
                value={settings.theme}
                onChange={val => updateSetting('theme', val as MessagingSettings['theme'])}
                options={THEME_OPTIONS}
              />
            </div>
          </div>
        </div>
        <div className="py-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <MessageSquare size={15} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-text">Taille des messages</p>
              <p className="text-xs text-text-secondary mt-0.5">Taille du texte dans les conversations</p>
            </div>
            <div className="w-44 shrink-0">
              <Select
                value={settings.messageSize}
                onChange={val => updateSetting('messageSize', val as MessagingSettings['messageSize'])}
                options={SIZE_OPTIONS}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Smile size={15} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text">Émoticônes</p>
              <p className="text-xs text-text-secondary mt-0.5">Activer les émoticônes dans le composeur</p>
            </div>
          </div>
          <Switch checked={settings.showEmojis} onCheckedChange={c => updateSetting('showEmojis', c)} />
        </div>
      </SectionCard>

      {/* Réponses automatiques */}
      <SectionCard
        icon={<Edit3 size={16} />}
        title="Réponses automatiques"
        description="Gérez votre réponse automatique en cas d'absence"
        className="lg:col-span-2"
      >
        <div className="py-3">
          <SettingRow icon={<Mail size={15} />} title="Réponses automatiques (absence)" description="Un message sera envoyé automatiquement aux expéditeurs">
            <Switch checked={settings.autoReplyEnabled} onCheckedChange={c => updateSetting('autoReplyEnabled', c)} />
          </SettingRow>
          {settings.autoReplyEnabled && (
            <div className="py-3">
              <p className="text-sm font-medium text-text mb-2">Message d'absence</p>
              <textarea
                value={settings.autoReplyMessage}
                onChange={e => updateSetting('autoReplyMessage', e.target.value)}
                rows={3}
                className="w-full rounded-xl bg-background border border-border/60 px-4 py-3 text-sm text-text placeholder:text-text-secondary/40 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-all resize-y"
              />
            </div>
          )}
        </div>
      </SectionCard>

      {/* Données */}
      <SectionCard
        icon={<Download size={16} />}
        title="Données & actions"
        description="Exporter, sauvegarder ou nettoyer vos conversations"
        className="lg:col-span-2"
      >
        <div className="py-3">
          <SettingRow icon={<Download size={15} />} title="Exporter les conversations" description="Télécharger l'historique complet en CSV">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-text hover:bg-background transition-colors">
              <Download size={13} /> Exporter
            </button>
          </SettingRow>
        </div>
        <div className="py-3">
          <SettingRow icon={<Trash2 size={15} />} title="Supprimer les conversations" description="Effacer définitivement tous les échanges">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-error/30 text-error hover:bg-error/5 transition-colors">
              <Trash2 size={13} /> Supprimer
            </button>
          </SettingRow>
        </div>
      </SectionCard>

      </div>

      {/* Status / privacy footer */}
      <div className="flex items-center justify-center gap-1.5 py-2 text-xs text-text-secondary/50">
        <Monitor size={12} />
        <span>Thème actuel : {THEME_OPTIONS.find(t => t.value === settings.theme)?.label} · Taille : {SIZE_OPTIONS.find(s => s.value === settings.messageSize)?.label}</span>
      </div>
    </div>
  )
}
