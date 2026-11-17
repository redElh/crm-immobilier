import { useEffect } from 'react'
import {
  User, Mail, Shield, Briefcase, UserCheck, Lock, Key,
  Eye, EyeOff, Edit3, UserPlus, X, Check, Info, RefreshCw,
} from 'react-feather'
import { cn } from '../../../lib/utils'
import { PhoneInput } from '../../../components/ui/PhoneInput'
import StageModal, { useStageModalButtons } from '../../../components/modules/calendar/StageModal'
import {
  StageBadge, OrbIcon, AnimatedNumber, ShimmerProgress, STAGE_HUES,
  type StageHue,
} from '../../../components/dashboard/Stage'

export interface UserFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  role: string
  position: string
  sendEmail: boolean
  requirePasswordChange: boolean
}

export interface UserFormErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export const AGENT_POSITIONS = [
  { value: 'Responsable agence', label: 'Responsable agence' },
  { value: 'Responsable secteur', label: 'Responsable secteur' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Secrétariat', label: 'Secrétariat' },
  { value: 'Stagiaire', label: 'Stagiaire' },
  { value: 'Traducteur', label: 'Traducteur' },
  { value: 'Conciergerie', label: 'Conciergerie' },
]

const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  gerant: 'Gérant',
  agent: 'Agent',
}

const ROLE_HUES: Record<string, StageHue> = {
  admin: STAGE_HUES.amber,
  gerant: STAGE_HUES.violet,
  agent: STAGE_HUES.sky,
}

const ROLE_OPTIONS = [
  {
    value: 'admin',
    label: 'Administrateur',
    desc: "Contrôle total de l'agence et des comptes.",
    icon: Shield,
    hue: ROLE_HUES.admin,
  },
  {
    value: 'gerant',
    label: 'Gérant',
    desc: "Direction opérationnelle, tous les droits sauf l'admin d'origine.",
    icon: Briefcase,
    hue: ROLE_HUES.gerant,
  },
  {
    value: 'agent',
    label: 'Agent',
    desc: 'Accès terrain limité aux dossiers assignés.',
    icon: UserCheck,
    hue: ROLE_HUES.agent,
  },
]

function getRoleHue(role: string): StageHue {
  return ROLE_HUES[role] || STAGE_HUES.sky
}

function getStatusMeta(status: string): { label: string; variant: 'neutral' | 'violet' | 'ok' | 'warn' | 'danger' } {
  if (status === 'actif') return { label: 'Actif', variant: 'ok' }
  if (status === 'inactif') return { label: 'Inactif', variant: 'warn' }
  if (status === 'suspendu') return { label: 'Suspendu', variant: 'danger' }
  return { label: status || '—', variant: 'neutral' }
}

function getPasswordStrength(pw: string): { label: string; color: string; score: number } {
  if (!pw) return { label: '', color: '', score: 0 }
  const score = Math.min(
    (pw.length >= 8 ? 1 : 0) +
    (/[a-z]/.test(pw) ? 1 : 0) +
    (/[A-Z]/.test(pw) ? 1 : 0) +
    (/[0-9]/.test(pw) ? 1 : 0) +
    (/[^a-zA-Z0-9]/.test(pw) ? 1 : 0),
    5
  )
  if (score <= 2) return { label: 'Faible', color: 'bg-rose-500', score }
  if (score <= 3) return { label: 'Moyen', color: 'bg-amber-500', score }
  if (score <= 4) return { label: 'Fort', color: 'bg-emerald-500', score }
  return { label: 'Très fort', color: 'bg-emerald-600', score }
}

function ModalSectionHeader({
  step,
  icon: Icon,
  title,
  subtitle,
  isDark,
  accent,
}: {
  step: string
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  title: string
  subtitle: string
  isDark: boolean
  accent: StageHue
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-[10.5px] font-black tabular-nums"
        style={{
          color: isDark ? '#fff' : accent.b,
          borderColor: `${accent.a}45`,
          background: isDark
            ? `linear-gradient(145deg, ${accent.a}35, ${accent.b}16)`
            : `linear-gradient(145deg, ${accent.a}1F, ${accent.b}0D)`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,${isDark ? '0.14' : '0.75'}), 0 8px 18px -12px ${accent.glow}`,
        }}
      >
        {step}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn('flex items-center gap-1.5 text-[13px] font-bold', isDark ? 'text-white' : 'text-slate-900')}>
            <Icon size={12} className="opacity-60" />
            {title}
          </p>
          <span
            aria-hidden="true"
            className="h-px flex-1"
            style={{ background: `linear-gradient(90deg, ${accent.a}66, transparent)` }}
          />
        </div>
        <p className={cn('mt-0.5 text-[10.5px] leading-snug', isDark ? 'text-slate-500' : 'text-slate-500')}>{subtitle}</p>
      </div>
    </div>
  )
}

interface UserFormModalProps {
  open: boolean
  editingUser: { status: string } | null
  formData: UserFormData
  formErrors: UserFormErrors
  showPassword: boolean
  showConfirmPassword: boolean
  savingUser: boolean
  isDark: boolean
  accent: StageHue
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  setFormData: React.Dispatch<React.SetStateAction<UserFormData>>
  setFormErrors: React.Dispatch<React.SetStateAction<UserFormErrors>>
  setShowPassword: (value: boolean) => void
  setShowConfirmPassword: (value: boolean) => void
}

export function UserFormModal({
  open,
  editingUser,
  formData,
  formErrors,
  showPassword,
  showConfirmPassword,
  savingUser,
  isDark,
  accent,
  onClose,
  onSubmit,
  setFormData,
  setFormErrors,
  setShowPassword,
  setShowConfirmPassword,
}: UserFormModalProps) {
  const editing = !!editingUser
  const btns = useStageModalButtons()
  const pwStrength = getPasswordStrength(formData.password)
  const previewHue = getRoleHue(formData.role)
  const previewStatus = getStatusMeta(editingUser?.status || 'actif')
  const previewInitials = `${formData.firstName.trim().charAt(0)}${formData.lastName.trim().charAt(0)}`.toUpperCase() || '?'
  const previewName = [formData.firstName.trim(), formData.lastName.trim()].filter(Boolean).join(' ') || 'Nouveau membre'
  const previewEmail = formData.email.trim() || 'email@agence.ma'
  const previewRole = roleLabels[formData.role] || 'Agent'

  const completionFields = editing
    ? [formData.firstName, formData.lastName, formData.email]
    : [formData.firstName, formData.lastName, formData.email, formData.password, formData.confirmPassword]
  const completion = Math.round((completionFields.filter(v => v.trim().length > 0).length / completionFields.length) * 100)

  const rolePermissions = formData.role === 'agent'
    ? [
        { label: 'Interface agent dédiée', granted: true },
        { label: `Sous-rôle : ${formData.position || 'Agent immobilier'}`, granted: true },
        { label: 'Dossiers et contacts assignés', granted: true },
        { label: 'Accès administrateur', granted: false },
      ]
    : [
        { label: 'Accès à tous les modules', granted: true },
        { label: 'Gestion des utilisateurs', granted: true },
        { label: "Gestion de l'agence", granted: true },
        { label: 'Exports de données', granted: true },
        { label: 'Paramètres système', granted: true },
      ]

  const roleTip = formData.role === 'admin'
    ? "Un seul administrateur d'origine est autorisé. Ce compte ne peut pas être supprimé."
    : formData.role === 'gerant'
      ? "Le gérant dispose des mêmes droits que l'admin, sauf sur le compte administrateur d'origine."
      : "L'agent accède uniquement à son interface et aux dossiers qui lui sont assignés."

  const identityReady = Boolean(
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    /^\S+@\S+\.\S+$/.test(formData.email)
  )
  const passwordReady = editing
    ? !formData.password || (formData.password.length >= 6 && formData.password === formData.confirmPassword)
    : formData.password.length >= 6 && formData.password === formData.confirmPassword

  const checklist = [
    { label: 'Identité complète', done: identityReady },
    { label: 'Rôle & accès définis', done: Boolean(formData.role) },
    { label: editing ? 'Sécurité inchangée ou valide' : 'Mot de passe sécurisé', done: passwordReady },
  ]

  const fieldClass = (invalid?: boolean) => cn(
    'h-11 w-full rounded-xl border px-3.5 text-sm outline-none transition-all duration-200',
    isDark
      ? 'border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] [background-color:transparent] text-white placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-8px_16px_-12px_rgba(0,0,0,0.6)]'
      : 'border-orange-900/12 bg-gradient-to-b from-white to-orange-50/40 [background-color:transparent] text-slate-900 placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-6px_14px_-10px_rgba(249,115,22,0.18)]',
    invalid
      ? (isDark
        ? 'border-rose-400/60 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.18)]'
        : 'border-rose-400 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.14)]')
      : 'focus:border-[color:var(--field-accent)] focus:shadow-[0_0_0_3px_var(--field-accent-soft),0_10px_24px_-14px_var(--field-accent-glow)]'
  )

  const fieldAccentStyle = {
    '--field-accent': accent.a,
    '--field-accent-soft': `${accent.a}2E`,
    '--field-accent-glow': accent.glow,
  } as React.CSSProperties

  const labelClass = cn(
    'mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.14em]',
    isDark ? 'text-slate-400/85' : 'text-orange-900/60'
  )

  const sectionCard = cn(
    'relative overflow-hidden rounded-2xl border p-4',
    isDark ? 'border-white/[0.07] bg-white/[0.025]' : 'border-orange-900/[0.07] bg-white/55'
  )

  const panelCard = cn(
    'relative overflow-hidden rounded-2xl border p-4',
    isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-orange-900/[0.07] bg-white/60'
  )

  const fieldIconClass = cn(
    'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2',
    isDark ? 'text-slate-500' : 'text-orange-900/35'
  )

  const updateField = (patch: Partial<UserFormData>) => setFormData(prev => ({ ...prev, ...patch }))
  const clearError = (field: keyof UserFormErrors) => setFormErrors(prev => ({ ...prev, [field]: undefined }))

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !savingUser) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, savingUser, onClose])

  const footer = (
    <>
      <div className="mr-auto hidden items-center gap-2 sm:flex">
        <span className={cn(
          'flex h-7 w-7 items-center justify-center rounded-lg border',
          isDark ? 'border-white/10 bg-white/[0.04] text-emerald-300' : 'border-emerald-600/15 bg-emerald-500/10 text-emerald-700'
        )}>
          <Shield size={12} />
        </span>
        <div>
          <p className={cn('text-[10.5px] font-bold', isDark ? 'text-slate-300' : 'text-slate-700')}>Identifiants chiffrés</p>
          <p className={cn('text-[9.5px]', isDark ? 'text-slate-500' : 'text-slate-400')}>Accès contrôlé · Email automatique</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        disabled={savingUser}
        className={btns.ghost}
      >
        Annuler
      </button>
      <button
        type="submit"
        form="user-form"
        disabled={savingUser}
        className={btns.primary}
      >
        {savingUser ? <RefreshCw size={14} className="animate-spin" /> : editing ? <Edit3 size={14} /> : <UserPlus size={14} />}
        {savingUser ? 'Enregistrement...' : editing ? 'Enregistrer les modifications' : "Créer l'utilisateur"}
      </button>
    </>
  )

  return (
    <StageModal
      open={open}
      onClose={onClose}
      eyebrow={editing ? 'Modification du compte' : 'Création de compte'}
      title={editing ? "Modifier l'utilisateur" : 'Ajouter un utilisateur'}
      subtitle={editing
        ? 'Mettez à jour les informations, le rôle et les accès du compte.'
        : 'Créez un compte premium, attribuez son rôle et envoyez ses identifiants.'}
      icon={editing ? Edit3 : UserPlus}
      hue={accent}
      accent={accent.glow}
      badge={<StageBadge variant="ok" className="!px-1.5 !py-0.5 !text-[9px]"><Shield size={9} /> Sécurisé</StageBadge>}
      maxWidth="max-w-5xl"
      centered
      bodyClassName="max-h-[calc(100dvh-16rem)] overflow-y-auto scrollbar-thin pt-1"
      footer={footer}
    >
      <form id="user-form" onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <section className={sectionCard}>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full opacity-50"
              style={{ background: `radial-gradient(circle, ${accent.a}2E, transparent 70%)` }}
            />
            <ModalSectionHeader
              step="01"
              icon={User}
              title="Identité"
              subtitle="Les informations qui identifient le membre dans l'agence."
              isDark={isDark}
              accent={accent}
            />
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="user-first-name" className={labelClass}>Prénom <span className="text-rose-400">*</span></label>
                <div className="relative">
                  <User size={14} className={fieldIconClass} />
                  <input
                    id="user-first-name"
                    type="text"
                    autoComplete="given-name"
                    placeholder="Yassine"
                    value={formData.firstName}
                    onChange={(e) => { updateField({ firstName: e.target.value }); clearError('firstName') }}
                    aria-invalid={!!formErrors.firstName}
                    style={fieldAccentStyle}
                    className={cn(fieldClass(!!formErrors.firstName), 'pl-10')}
                  />
                </div>
                {formErrors.firstName && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500"><Info size={10} /> {formErrors.firstName}</p>
                )}
              </div>
              <div>
                <label htmlFor="user-last-name" className={labelClass}>Nom <span className="text-rose-400">*</span></label>
                <div className="relative">
                  <User size={14} className={fieldIconClass} />
                  <input
                    id="user-last-name"
                    type="text"
                    autoComplete="family-name"
                    placeholder="El Amrani"
                    value={formData.lastName}
                    onChange={(e) => { updateField({ lastName: e.target.value }); clearError('lastName') }}
                    aria-invalid={!!formErrors.lastName}
                    style={fieldAccentStyle}
                    className={cn(fieldClass(!!formErrors.lastName), 'pl-10')}
                  />
                </div>
                {formErrors.lastName && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500"><Info size={10} /> {formErrors.lastName}</p>
                )}
              </div>
              <div>
                <label htmlFor="user-email" className={labelClass}>Email <span className="text-rose-400">*</span></label>
                <div className="relative">
                  <Mail size={14} className={fieldIconClass} />
                  <input
                    id="user-email"
                    type="email"
                    autoComplete="email"
                    placeholder="membre@agence.ma"
                    value={formData.email}
                    onChange={(e) => { updateField({ email: e.target.value }); clearError('email') }}
                    aria-invalid={!!formErrors.email}
                    style={fieldAccentStyle}
                    className={cn(fieldClass(!!formErrors.email), 'pl-10')}
                  />
                </div>
                {formErrors.email && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500"><Info size={10} /> {formErrors.email}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Téléphone <span className={cn('normal-case tracking-normal', isDark ? 'text-slate-500' : 'text-slate-400')}>· optionnel</span></label>
                <div className="[&_button]:!h-11 [&_input]:!h-11">
                  <PhoneInput
                    value={formData.phone || ''}
                    onChange={(v) => updateField({ phone: v })}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className={sectionCard}>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full opacity-50"
              style={{ background: `radial-gradient(circle, ${accent.a}2E, transparent 70%)` }}
            />
            <ModalSectionHeader
              step="02"
              icon={Shield}
              title="Rôle & accès"
              subtitle="Choisissez le niveau de responsabilité et les accès associés."
              isDark={isDark}
              accent={accent}
            />
            <div className={cn(
              'mb-3 flex items-center gap-2.5 rounded-xl border p-3',
              isDark ? 'border-white/[0.07] bg-white/[0.02]' : 'border-orange-900/[0.07] bg-white/60'
            )}>
              <span
                className="orb-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ '--orb-a': STAGE_HUES.amber.a, '--orb-b': STAGE_HUES.amber.b, '--orb-glow': STAGE_HUES.amber.glow } as React.CSSProperties}
              >
                <Briefcase size={13} />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('text-[9px] font-bold uppercase tracking-[0.16em]', isDark ? 'text-slate-500' : 'text-orange-900/45')}>Agence</p>
                <p className={cn('text-xs font-bold', isDark ? 'text-slate-200' : 'text-slate-800')}>M2 Square Meter</p>
              </div>
              <StageBadge variant="neutral" className="!px-1.5 !py-0.5 !text-[9px]">Principale</StageBadge>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {ROLE_OPTIONS.map((opt) => {
                const selected = formData.role === opt.value
                return (
                  <label
                    key={opt.value}
                    className={cn(
                      'relative cursor-pointer overflow-hidden rounded-2xl border p-3.5 transition-all duration-200',
                      selected
                        ? ''
                        : isDark
                          ? 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                          : 'border-orange-900/10 bg-white/50 hover:border-orange-400/30 hover:bg-white'
                    )}
                    style={selected
                      ? {
                          borderColor: `${opt.hue.a}80`,
                          background: isDark ? `${opt.hue.a}16` : `${opt.hue.a}0F`,
                          boxShadow: `0 0 0 1px ${opt.hue.a}33, 0 14px 30px -18px ${opt.hue.glow}`,
                        }
                      : undefined}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={opt.value}
                      checked={selected}
                      onChange={() => updateField({
                        role: opt.value,
                        position: opt.value === 'agent' ? (formData.position || AGENT_POSITIONS[0].value) : '',
                      })}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between gap-2">
                      <OrbIcon icon={opt.icon} hue={opt.hue} size={32} radius={10} />
                      <span
                        className={cn(
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                          selected ? 'border-transparent' : (isDark ? 'border-white/20' : 'border-slate-300')
                        )}
                        style={selected ? { backgroundColor: opt.hue.a } : undefined}
                      >
                        {selected && <Check size={11} className="text-white" />}
                      </span>
                    </div>
                    <p className={cn('mt-3 text-[13px] font-bold', isDark ? 'text-white' : 'text-slate-900')}>{opt.label}</p>
                    <p className={cn('mt-1 text-[10px] leading-snug', isDark ? 'text-slate-400' : 'text-slate-500')}>{opt.desc}</p>
                  </label>
                )
              })}
            </div>

            {formData.role === 'agent' && (
              <div className={cn(
                'mt-3 rounded-xl border p-3',
                isDark ? 'border-white/[0.07] bg-white/[0.02]' : 'border-orange-900/[0.07] bg-white/55'
              )}>
                <p className={labelClass}>Sous-rôle de l'agent <span className="text-rose-400">*</span></p>
                <div className="flex flex-wrap gap-1.5">
                  {AGENT_POSITIONS.map((pos) => {
                    const selected = formData.position === pos.value
                    return (
                      <label
                        key={pos.value}
                        className={cn(
                          'cursor-pointer rounded-full border px-2.5 py-1.5 text-[10.5px] font-semibold transition-all',
                          selected
                            ? 'border-transparent text-white'
                            : isDark
                              ? 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]'
                              : 'border-orange-900/10 bg-white/70 text-slate-600 hover:border-orange-400/30 hover:bg-white'
                        )}
                        style={selected
                          ? {
                              backgroundImage: `linear-gradient(145deg, ${previewHue.a}, ${previewHue.b})`,
                              boxShadow: `0 6px 16px -8px ${previewHue.glow}`,
                            }
                          : undefined}
                      >
                        <input
                          type="radio"
                          name="position"
                          value={pos.value}
                          checked={selected}
                          onChange={() => updateField({ position: pos.value })}
                          className="sr-only"
                        />
                        {pos.label}
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </section>

          <section className={sectionCard}>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full opacity-50"
              style={{ background: `radial-gradient(circle, ${accent.a}2E, transparent 70%)` }}
            />
            <ModalSectionHeader
              step="03"
              icon={Lock}
              title="Sécurité"
              subtitle="Définissez un mot de passe robuste et les règles d'accès."
              isDark={isDark}
              accent={accent}
            />
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="user-password" className={labelClass}>
                  Mot de passe {!editing && <span className="text-rose-400">*</span>}
                </label>
                <div className="relative">
                  <Lock size={14} className={fieldIconClass} />
                  <input
                    id="user-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder={editing ? 'Laisser vide pour conserver' : '••••••••'}
                    value={formData.password}
                    onChange={(e) => { updateField({ password: e.target.value }); clearError('password') }}
                    aria-invalid={!!formErrors.password}
                    style={fieldAccentStyle}
                    className={cn(fieldClass(!!formErrors.password), 'pl-10 pr-10')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className={cn('absolute right-3 top-1/2 -translate-y-1/2 transition-colors', isDark ? 'text-slate-500 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700')}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500"><Info size={10} /> {formErrors.password}</p>
                )}
              </div>
              <div>
                <label htmlFor="user-confirm-password" className={labelClass}>
                  Confirmer {!editing && <span className="text-rose-400">*</span>}
                </label>
                <div className="relative">
                  <Lock size={14} className={fieldIconClass} />
                  <input
                    id="user-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => { updateField({ confirmPassword: e.target.value }); clearError('confirmPassword') }}
                    aria-invalid={!!formErrors.confirmPassword}
                    style={fieldAccentStyle}
                    className={cn(fieldClass(!!formErrors.confirmPassword), 'pl-10 pr-10')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                    className={cn('absolute right-3 top-1/2 -translate-y-1/2 transition-colors', isDark ? 'text-slate-500 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700')}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500"><Info size={10} /> {formErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            {formData.password && (
              <div className={cn(
                'mt-3 rounded-xl border p-3',
                isDark ? 'border-white/[0.07] bg-white/[0.02]' : 'border-orange-900/[0.07] bg-white/55'
              )}>
                <div className="flex items-center justify-between gap-3">
                  <span className={cn('text-[9px] font-bold uppercase tracking-[0.14em]', isDark ? 'text-slate-500' : 'text-orange-900/45')}>
                    Force du mot de passe
                  </span>
                  <span className={cn('text-[10.5px] font-bold', pwStrength.label === 'Faible' ? 'text-rose-500' : pwStrength.label === 'Moyen' ? 'text-amber-500' : 'text-emerald-500')}>
                    {pwStrength.label}
                  </span>
                </div>
                <div className="mt-2 flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        'h-1.5 flex-1 rounded-full transition-all duration-300',
                        i <= pwStrength.score ? pwStrength.color : (isDark ? 'bg-white/10' : 'bg-orange-900/10')
                      )}
                    />
                  ))}
                </div>
                <p className={cn('mt-2 text-[9.5px]', isDark ? 'text-slate-500' : 'text-slate-400')}>
                  6 caractères minimum. Ajoutez majuscule, chiffre et symbole pour renforcer.
                </p>
              </div>
            )}

            {editing ? (
              <div className={cn(
                'mt-3 flex items-start gap-2.5 rounded-xl border p-3',
                isDark ? 'border-white/[0.07] bg-white/[0.02]' : 'border-orange-900/[0.07] bg-white/55'
              )}>
                <Info size={13} className={cn('mt-0.5 shrink-0', isDark ? 'text-slate-400' : 'text-orange-700')} />
                <p className={cn('text-[10.5px] leading-relaxed', isDark ? 'text-slate-400' : 'text-slate-600')}>
                  Laissez le mot de passe vide pour conserver l'actuel. Aucun email ne sera envoyé lors d'une modification.
                </p>
              </div>
            ) : (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className={cn(
                  'flex items-center gap-2.5 rounded-xl border p-3',
                  isDark ? 'border-white/[0.07] bg-white/[0.02]' : 'border-orange-900/[0.07] bg-white/55'
                )}>
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-500/10 text-emerald-700')}>
                    <Mail size={13} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-[11px] font-bold', isDark ? 'text-slate-200' : 'text-slate-800')}>Identifiants par email</p>
                    <p className={cn('text-[9.5px]', isDark ? 'text-slate-500' : 'text-slate-400')}>Envoi automatique</p>
                  </div>
                  <StageBadge variant="ok" className="!px-1.5 !py-0.5 !text-[9px]">Actif</StageBadge>
                </div>
                <div className={cn(
                  'flex items-center gap-2.5 rounded-xl border p-3',
                  isDark ? 'border-white/[0.07] bg-white/[0.02]' : 'border-orange-900/[0.07] bg-white/55'
                )}>
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-500/10 text-amber-700')}>
                    <Key size={13} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-[11px] font-bold', isDark ? 'text-slate-200' : 'text-slate-800')}>Changement requis</p>
                    <p className={cn('text-[9.5px]', isDark ? 'text-slate-500' : 'text-slate-400')}>À la première connexion</p>
                  </div>
                  <StageBadge variant="warn" className="!px-1.5 !py-0.5 !text-[9px]">Requis</StageBadge>
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4 self-start lg:sticky lg:top-0">
          <div className={panelCard}>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-14 h-32 w-32 rounded-full opacity-60"
              style={{ background: `radial-gradient(circle, ${previewHue.a}33, transparent 70%)` }}
            />
            <div className="flex items-center justify-between gap-2">
              <p className={cn('text-[9px] font-extrabold uppercase tracking-[0.2em]', isDark ? 'text-slate-500' : 'text-orange-900/45')}>Aperçu du compte</p>
              <StageBadge variant="neutral" className="!px-1.5 !py-0.5 !text-[9px]">{editing ? 'Édition' : 'Nouveau'}</StageBadge>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span
                className="orb-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold"
                style={{ '--orb-a': previewHue.a, '--orb-b': previewHue.b, '--orb-glow': previewHue.glow } as React.CSSProperties}
              >
                {previewInitials}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('truncate text-sm font-extrabold tracking-[-0.2px]', isDark ? 'text-white' : 'text-slate-900')}>{previewName}</p>
                <p className={cn('truncate text-[10.5px]', isDark ? 'text-slate-500' : 'text-slate-400')}>{previewEmail}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <StageBadge
                variant="neutral"
                style={{
                  color: isDark ? previewHue.a : previewHue.b,
                  backgroundColor: isDark ? `${previewHue.a}1F` : `${previewHue.a}14`,
                  borderColor: isDark ? `${previewHue.a}42` : `${previewHue.a}38`,
                }}
              >
                {previewRole}
              </StageBadge>
              <StageBadge variant={previewStatus.variant}>{previewStatus.label}</StageBadge>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between gap-2">
                <span className={cn('text-[9px] font-bold uppercase tracking-[0.16em]', isDark ? 'text-slate-500' : 'text-orange-900/45')}>Complétion</span>
                <span className="text-[10.5px] font-extrabold tabular-nums" style={{ color: isDark ? accent.a : accent.b }}>
                  <AnimatedNumber value={completion} suffix="%" />
                </span>
              </div>
              <div className="mt-1.5">
                <ShimmerProgress pct={completion} colorFrom={accent.a} colorTo={accent.b} glow={accent.glow} height={5} />
              </div>
            </div>
          </div>

          <div className={panelCard}>
            <div className="flex items-center justify-between gap-2">
              <p className={cn('text-[9px] font-extrabold uppercase tracking-[0.2em]', isDark ? 'text-slate-500' : 'text-orange-900/45')}>Accès du rôle</p>
              <StageBadge variant={formData.role === 'agent' ? 'neutral' : 'violet'} className="!px-1.5 !py-0.5 !text-[9px]">{previewRole}</StageBadge>
            </div>
            <div className="mt-3 space-y-2">
              {rolePermissions.map((perm) => (
                <div key={perm.label} className="flex items-start gap-2">
                  <span className={cn(
                    'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                    perm.granted
                      ? (isDark ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : 'border-emerald-600/20 bg-emerald-500/10 text-emerald-700')
                      : (isDark ? 'border-white/10 bg-white/[0.04] text-slate-500' : 'border-slate-200 bg-white/70 text-slate-400')
                  )}>
                    {perm.granted ? <Check size={9} /> : <X size={9} />}
                  </span>
                  <span className={cn(
                    'text-[10.5px] font-medium leading-snug',
                    perm.granted
                      ? (isDark ? 'text-slate-300' : 'text-slate-600')
                      : (isDark ? 'text-slate-500' : 'text-slate-400')
                  )}>
                    {perm.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={panelCard}>
            <p className={cn('text-[9px] font-extrabold uppercase tracking-[0.2em]', isDark ? 'text-slate-500' : 'text-orange-900/45')}>Prêt à créer</p>
            <div className="mt-3 space-y-2">
              {checklist.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                      item.done
                        ? 'border-transparent text-white'
                        : (isDark ? 'border-white/12 bg-white/[0.03] text-slate-600' : 'border-orange-900/10 bg-white/70 text-slate-300')
                    )}
                    style={item.done
                      ? {
                          backgroundImage: `linear-gradient(145deg, ${accent.a}, ${accent.b})`,
                          boxShadow: `0 4px 12px -6px ${accent.glow}`,
                        }
                      : undefined}
                  >
                    {item.done ? <Check size={9} /> : <span className="h-1 w-1 rounded-full bg-current" />}
                  </span>
                  <span className={cn(
                    'text-[10.5px] font-medium',
                    item.done
                      ? (isDark ? 'text-slate-300' : 'text-slate-700')
                      : (isDark ? 'text-slate-500' : 'text-slate-400')
                  )}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={cn(
            'relative overflow-hidden rounded-2xl border p-3.5',
            isDark ? 'border-white/[0.07] bg-white/[0.02]' : 'border-orange-900/[0.07] bg-orange-50/50'
          )}>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full opacity-50"
              style={{ background: `radial-gradient(circle, ${accent.a}26, transparent 70%)` }}
            />
            <div className="flex items-start gap-2.5">
              <span className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                isDark ? 'bg-white/[0.05] text-slate-300' : 'bg-white text-orange-700'
              )}>
                <Info size={13} />
              </span>
              <div>
                <p className={cn('text-[9px] font-bold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-orange-900/60')}>Bon à savoir</p>
                <p className={cn('mt-1 text-[10.5px] leading-relaxed', isDark ? 'text-slate-400' : 'text-slate-600')}>{roleTip}</p>
              </div>
            </div>
          </div>
        </aside>
      </form>
    </StageModal>
  )
}
