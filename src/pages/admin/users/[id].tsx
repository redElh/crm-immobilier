import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import {
  User, Shield, Mail, Phone, Activity, Clock,
  Lock, Eye, Edit3, ChevronRight, MapPin,
  Calendar, TrendingUp, CheckCircle,
  Smartphone, Monitor, XCircle,
  ArrowLeft, Copy, Check, Home,
  Target, FileText, DollarSign, Globe,
} from 'react-feather'
import { useState } from 'react'
import { cn } from '../../../lib/utils'
import {
  StageBadge, StageButton, OrbIcon, STAGE_HUES,
  useStageTheme, useStageAccent,
  type StageHue,
} from '../../../components/dashboard/Stage'
import { AdminStatCard } from '../../../components/dashboard/AdminStatCard'

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

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  gerant: 'Gérant',
  agent: 'Agent',
}

const ACTIVITY_META: Array<{ match: RegExp; icon: React.ComponentType<{ size?: number | string; className?: string }>; hue: StageHue }> = [
  { match: /visite/i, icon: Home, hue: STAGE_HUES.amber },
  { match: /appel/i, icon: Phone, hue: STAGE_HUES.sky },
  { match: /sign|mandat|contrat/i, icon: FileText, hue: STAGE_HUES.emerald },
  { match: /prospect/i, icon: Target, hue: STAGE_HUES.fuchsia },
  { match: /document|upload/i, icon: FileText, hue: STAGE_HUES.violet },
]
const activityMeta = (action: string) =>
  ACTIVITY_META.find((a) => a.match.test(action)) || { icon: Activity, hue: STAGE_HUES.emerald }

export default function AdminUserDetailPage() {
  const { id: _id, adminId } = useParams()
  const navigate = useNavigate()
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const accent = useStageAccent()
  const [copied, setCopied] = useState<string | null>(null)
  const profile = mockProfile

  const fullName = `${profile.firstName} ${profile.lastName}`.trim()
  const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase() || 'IM'
  const roleLabel = ROLE_LABELS[profile.role] || profile.role

  const copy = (value: string, key: string) => {
    if (!value) return
    navigator.clipboard?.writeText(value).catch(() => {})
    setCopied(key)
    window.setTimeout(() => setCopied(null), 1800)
  }

  const copyPill = (icon: React.ReactNode, value: string, keyName: string) => (
    <button
      type="button"
      onClick={() => copy(value, keyName)}
      title="Copier"
      className={cn(
        'group inline-flex min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-medium backdrop-blur-md transition-all duration-200',
        isDark
          ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white'
          : 'border-slate-200/80 bg-white/70 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900'
      )}
    >
      <span className="shrink-0 opacity-70">{icon}</span>
      <span className="truncate">{value || '—'}</span>
      {copied === keyName
        ? <Check size={11} className="shrink-0 text-emerald-500" />
        : <Copy size={11} className="shrink-0 opacity-40 transition-opacity group-hover:opacity-90" />}
    </button>
  )

  const gradientTitle = isDark
    ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#FDA4AF] via-[#F43F5E] to-[#C084FC]'
    : 'bg-clip-text text-transparent bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FBBF24]'

  const softSurface = isDark
    ? 'border-white/[0.06] bg-white/[0.03]'
    : 'border-slate-200/60 bg-white/60'
  const panelBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-10">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigate(`/admin/${adminId}/users`)}
          className={cn(
            'group inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] backdrop-blur-md transition-all duration-200',
            isDark
              ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:bg-white/[0.08] hover:text-white'
              : 'border-orange-900/10 bg-white/70 text-orange-900/70 hover:border-orange-900/20 hover:bg-white hover:text-orange-950'
          )}
        >
          <ArrowLeft size={12} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
          Retour
        </button>
        <StageButton variant="glass" size="sm" icon={<Eye size={13} />} onClick={() => navigate(`/admin/${adminId}/users/${profile.id}/droits`)}>
          Gérer les droits
        </StageButton>
      </div>

      {/* ══════════ HERO — staged identity ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="stage-glass relative overflow-hidden !rounded-[26px]"
      >
        {/* crown line */}
        <div
          className="absolute inset-x-0 top-0 z-10 h-[3px]"
          style={{ background: `linear-gradient(90deg, transparent, ${accent.a}, ${accent.b}, transparent)`, boxShadow: `0 0 18px ${accent.glow}` }}
        />
        {/* ambient wash */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: isDark
              ? `radial-gradient(120% 90% at 50% 0%, ${accent.a}26, transparent 62%), radial-gradient(60% 55% at 100% 100%, ${accent.b}16, transparent 60%)`
              : `radial-gradient(120% 90% at 50% 0%, ${accent.a}1F, transparent 62%), radial-gradient(60% 55% at 100% 100%, ${accent.a}12, transparent 60%)`,
          }}
        />
        {/* oversized outline watermark — left of the actions block, never overlapping */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-[312px] top-1/2 hidden -translate-y-1/2 select-none text-[110px] font-black leading-none tracking-[-5px] text-transparent xl:block"
          style={{ WebkitTextStroke: isDark ? '1.5px #475569' : '1.5px #94A3B8' }}
        >
          {initials}
        </span>

        <div className="relative p-6 sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            {/* ── Identity cluster ── */}
            <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row sm:items-center">
              {/* holo avatar */}
              <div className="relative shrink-0">
                <div aria-hidden="true" className="holo-spin absolute -inset-[5px] rounded-[34px] opacity-80" />
                <div
                  className={cn(
                    'orb-icon relative flex h-[104px] w-[104px] select-none items-center justify-center overflow-hidden rounded-[28px] text-[32px] font-black tracking-[-1px] text-white',
                    isDark ? 'border-2 border-white/15' : 'border-2 border-white'
                  )}
                  style={{
                    ...({ '--orb-a': accent.a, '--orb-b': accent.b, '--orb-glow': accent.glow } as React.CSSProperties),
                    boxShadow: isDark
                      ? `0 16px 40px -14px ${accent.glow}, inset 0 1px 0 rgba(255,255,255,0.12)`
                      : `0 16px 40px -16px ${accent.glow}, inset 0 1px 0 rgba(255,255,255,0.95)`,
                  }}
                >
                  {initials}
                </div>
                {/* presence dot */}
                <span
                  className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full border-2"
                  style={{
                    borderColor: isDark ? '#0B1022' : '#ffffff',
                    background: profile.is_active
                      ? 'linear-gradient(145deg, #34D399, #059669)'
                      : 'linear-gradient(145deg, #FB7185, #E11D48)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                  }}
                  title={profile.is_active ? 'Actif' : 'Inactif'}
                />
              </div>

              {/* name + badges + contact pills */}
              <div className="min-w-0 flex-1">
                <p className={cn(
                  'flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.3em]',
                  isDark ? 'text-slate-400' : 'text-orange-900/50'
                )}>
                  <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Square Immo · Fiche agent · {roleLabel}
                </p>
                <h1 className={cn('mt-1.5 text-[32px] font-black leading-[1.02] tracking-[-1.4px] sm:text-5xl', gradientTitle)}>
                  {fullName}
                </h1>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.09em] backdrop-blur-md"
                    style={isDark
                      ? { background: `${accent.a}2E`, color: '#fff', border: `1px solid ${accent.a}5C`, boxShadow: `0 2px 12px ${accent.glow}, inset 0 1px 0 rgba(255,255,255,0.14)` }
                      : { background: `${accent.a}1C`, color: accent.b, border: `1px solid ${accent.a}42`, boxShadow: `0 2px 10px ${accent.glow}, inset 0 1px 0 rgba(255,255,255,0.7)` }}
                  >
                    <Shield size={10} strokeWidth={2.75} />
                    {roleLabel}
                  </span>
                  <StageBadge variant={profile.is_active ? 'ok' : 'danger'}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {profile.is_active ? 'Actif' : 'Inactif'}
                  </StageBadge>
                  {profile.twoFA
                    ? <StageBadge variant="ok"><Shield size={10} strokeWidth={3} />2FA activée</StageBadge>
                    : <StageBadge variant="neutral">2FA désactivée</StageBadge>}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {copyPill(<Mail size={11} />, profile.email, 'email')}
                  {copyPill(<Phone size={11} />, profile.phone, 'phone')}
                </div>
              </div>
            </div>

            {/* ── Actions ── */}
            <motion.div
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center lg:border-l lg:pl-7',
                isDark ? 'lg:border-slate-600' : 'lg:border-slate-400'
              )}
            >
              <div className="flex flex-col gap-2">
                <StageButton size="md" icon={<Edit3 size={14} />}>
                  Modifier le profil
                </StageButton>
                <p className={cn('text-center text-[9px] font-extrabold uppercase tracking-[0.16em]', isDark ? 'text-slate-600' : 'text-slate-400')}>
                  {profile.position} · {profile.agency}
                </p>
                <p className={cn('text-center text-[8.5px] font-semibold uppercase tracking-[0.16em]', isDark ? 'text-slate-600' : 'text-slate-400')}>
                  Dernière connexion · {profile.last_login}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ══════════ KPI DECK — dashboard AdminStatCards (facts + sparklines) ══════════ */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard
          icon={TrendingUp}
          label="Ventes du mois"
          value={profile.stats.ventes}
          unit="ventes"
          detail="Objectif : 8 ce mois"
          hue={accent}
          spark={[2, 3, 2, 4, 3, 5, profile.stats.ventes]}
          facts={[
            { label: 'Objectif', value: '8' },
            { label: 'Atteint', value: '63%' },
          ]}
          delay={0}
        />
        <AdminStatCard
          icon={Phone}
          label="Appels passés"
          value={profile.stats.appels}
          unit="appels"
          detail="Prospection active"
          hue={STAGE_HUES.sky}
          spark={[18, 22, 27, 25, 30, 34, profile.stats.appels]}
          facts={[
            { label: 'Moy. / jour', value: '6' },
            { label: 'Réponses', value: '24' },
          ]}
          delay={0.06}
        />
        <AdminStatCard
          icon={Calendar}
          label="Visites réalisées"
          value={profile.stats.visites}
          unit="visites"
          detail="Visites terrain"
          hue={STAGE_HUES.emerald}
          spark={[4, 6, 5, 8, 9, 10, profile.stats.visites]}
          facts={[
            { label: 'Moy. / semaine', value: '3' },
            { label: 'Qualifiées', value: '5' },
          ]}
          delay={0.12}
        />
        <AdminStatCard
          icon={DollarSign}
          label="CA du mois"
          value={profile.stats.caGenere}
          unit="MAD"
          detail="Chiffre d'affaires généré"
          hue={STAGE_HUES.amber}
          spark={[12, 18, 22, 30, 42, 58, 75]}
          facts={[
            { label: 'Moy. / vente', value: '15 000 MAD' },
            { label: 'Ventes', value: '5' },
          ]}
          delay={0.18}
        />
        <AdminStatCard
          icon={Target}
          label="Conversion"
          value={profile.stats.tauxConversion}
          suffix="%"
          unit="visites → ventes"
          detail="Performance de closing"
          hue={STAGE_HUES.fuchsia}
          spark={[10, 12, 11, 15, 17, 19, profile.stats.tauxConversion]}
          facts={[
            { label: 'Appels → visites', value: '32%' },
            { label: 'Visites → ventes', value: '42%' },
          ]}
          action={
            <button
              type="button"
              onClick={() => navigate(`/admin/${adminId}/dashboard?tab=equipe`)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] transition-all duration-200 hover:-translate-y-px',
                isDark
                  ? 'border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-300 hover:border-fuchsia-400/50 hover:bg-fuchsia-400/20'
                  : 'border-fuchsia-600/25 bg-fuchsia-50 text-fuchsia-700 hover:border-fuchsia-600/40 hover:bg-fuchsia-100'
              )}
            >
              Voir le détail
              <ChevronRight size={10} strokeWidth={3} />
            </button>
          }
          delay={0.24}
        />
      </div>

      {/* ══════════ INFOS + SÉCURITÉ ══════════ */}
      <div className="grid gap-5 xl:grid-cols-5">
        {/* personal info — staged record rows */}
        <section className="stage-glass relative overflow-hidden p-6 xl:col-span-3">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full"
            style={{ background: `radial-gradient(circle at center, ${accent.a}1F, transparent 65%)`, filter: 'blur(28px)' }}
          />
          <div className="relative flex flex-wrap items-center gap-3">
            <OrbIcon icon={User} hue={accent} size={40} radius={12} />
            <div className="min-w-0">
              <h2 className={cn('text-[15px] font-extrabold tracking-[-0.2px]', isDark ? 'text-white' : 'text-slate-900')}>
                Informations personnelles
              </h2>
              <p className={cn('mt-0.5 text-[11.5px]', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Coordonnées et rattachement de l'agent
              </p>
            </div>
            <StageBadge variant="neutral" className="ml-auto">
              <Calendar size={10} strokeWidth={2.5} />
              Créé le {profile.created_at}
            </StageBadge>
          </div>

          <div className="relative mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {[
              { icon: User, label: 'Prénom', value: profile.firstName },
              { icon: User, label: 'Nom', value: profile.lastName },
              { icon: Mail, label: 'Email', value: profile.email },
              { icon: Phone, label: 'Téléphone', value: profile.phone },
              { icon: MapPin, label: 'Poste', value: profile.position },
              { icon: Home, label: 'Agence', value: profile.agency },
              { icon: Shield, label: 'Rôle', value: roleLabel },
              { icon: Calendar, label: 'Date de création', value: profile.created_at },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className={cn(
                    'group/row flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 transition-all duration-200 hover:-translate-y-px',
                    isDark
                      ? 'border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.05]'
                      : 'border-slate-200/60 bg-white/60 hover:border-slate-300/70 hover:bg-white hover:shadow-[0_6px_18px_-12px_rgba(15,23,42,0.25)]'
                  )}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-transform duration-200 group-hover/row:scale-105"
                    style={isDark
                      ? { background: `${accent.a}12`, borderColor: `${accent.a}28`, color: accent.a }
                      : { background: `${accent.a}10`, borderColor: `${accent.a}26`, color: accent.b }}
                  >
                    <Icon size={13} />
                  </span>
                  <span className="min-w-0">
                    <span className={cn('block text-[8.5px] font-extrabold uppercase tracking-[0.16em]', isDark ? 'text-slate-500' : 'text-slate-400')}>
                      {item.label}
                    </span>
                    <span className={cn('mt-0.5 block truncate text-[12.5px] font-semibold', isDark ? 'text-slate-100' : 'text-slate-800')} title={item.value}>
                      {item.value}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        {/* security — staged panel */}
        <section className="stage-glass relative overflow-hidden p-6 xl:col-span-2">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full"
            style={{ background: `radial-gradient(circle at center, ${STAGE_HUES.amber.a}1F, transparent 65%)`, filter: 'blur(26px)' }}
          />
          <div className="relative flex items-center gap-3">
            <OrbIcon icon={Lock} hue={STAGE_HUES.amber} size={40} radius={12} />
            <div>
              <h2 className={cn('text-[15px] font-extrabold tracking-[-0.2px]', isDark ? 'text-white' : 'text-slate-900')}>
                Sécurité
              </h2>
              <p className={cn('mt-0.5 text-[11.5px]', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Accès du compte et dernière activité
              </p>
            </div>
          </div>

          <dl className="relative mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {[
              {
                label: 'Statut',
                node: (
                  <span className="inline-flex items-center gap-1.5">
                    <span className={cn('h-1.5 w-1.5 rounded-full', profile.is_active ? 'bg-emerald-500' : 'bg-slate-400')} style={{ boxShadow: profile.is_active ? '0 0 8px rgba(52,211,153,0.8)' : 'none' }} />
                    <span className={cn('font-bold', profile.is_active ? 'text-emerald-500' : isDark ? 'text-slate-400' : 'text-slate-500')}>
                      {profile.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </span>
                ),
              },
              { label: 'Dernière connexion', value: profile.last_login },
              { label: 'Dernière IP', value: profile.last_ip, mono: true },
              {
                label: '2FA',
                node: <StageBadge variant={profile.twoFA ? 'ok' : 'neutral'}>{profile.twoFA ? 'Activée' : 'Désactivée'}</StageBadge>,
              },
            ].map((item) => (
              <div key={item.label} className={cn('rounded-2xl border px-4 py-3', softSurface)}>
                <dt className={cn('text-[8.5px] font-extrabold uppercase tracking-[0.18em]', isDark ? 'text-slate-500' : 'text-slate-400')}>
                  {item.label}
                </dt>
                <dd className={cn('mt-1.5 text-[12px] font-semibold', isDark ? 'text-slate-100' : 'text-slate-800', item.mono && 'font-mono text-[11px]')}>
                  {item.node ?? item.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="relative mt-4 flex flex-wrap items-center gap-2">
            <StageButton variant="glass" size="sm" icon={<Lock size={12} />}>
              Réinitialiser le mot de passe
            </StageButton>
            <StageButton
              variant="glass"
              size="sm"
              icon={profile.is_active ? <XCircle size={12} /> : <CheckCircle size={12} />}
              className={isDark
                ? 'border-rose-400/30 bg-rose-500/10 text-rose-300 hover:border-rose-400/45 hover:bg-rose-500/20 hover:text-rose-100'
                : 'border-rose-300/70 bg-rose-50 text-rose-600 hover:border-rose-400 hover:bg-rose-100 hover:text-rose-700'}
            >
              {profile.is_active ? 'Désactiver le compte' : 'Activer le compte'}
            </StageButton>
          </div>
        </section>
      </div>

      {/* ══════════ HISTORIQUE + ACTIVITÉ ══════════ */}
      <div className="grid gap-5 xl:grid-cols-5">
        {/* login history — staged session cards */}
        <section className="stage-glass relative flex flex-col overflow-hidden xl:col-span-3">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full"
            style={{ background: `radial-gradient(circle at center, ${STAGE_HUES.amber.a}1F, transparent 65%)`, filter: 'blur(26px)' }}
          />
          {/* header */}
          <div className="relative flex flex-wrap items-center gap-3 border-b px-5 py-4" style={{ borderColor: panelBorder }}>
            <OrbIcon icon={Clock} hue={STAGE_HUES.amber} size={40} radius={12} />
            <div className="min-w-0">
              <h2 className={cn('text-[15px] font-extrabold tracking-[-0.2px]', isDark ? 'text-white' : 'text-slate-900')}>
                Historique des connexions
              </h2>
              <p className={cn('mt-0.5 text-[11px]', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Sessions récentes du compte
              </p>
            </div>
            <StageBadge variant="neutral" className="ml-auto">{profile.loginHistory.length} sessions</StageBadge>
          </div>

          {/* sessions — staged rows */}
          <div className="relative flex-1 space-y-2.5 p-4">
            {profile.loginHistory.map((entry, i) => {
              const isMobile = /ios|android|mobile/i.test(entry.device)
              const hue = isMobile ? STAGE_HUES.fuchsia : STAGE_HUES.sky
              const Icon = isMobile ? Smartphone : Monitor
              const success = entry.success
              return (
                <div
                  key={i}
                  className={cn(
                    'group/row flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200',
                    isDark
                      ? 'border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.05]'
                      : 'border-slate-200/60 bg-white/60 hover:border-slate-300/70 hover:bg-white hover:shadow-[0_8px_24px_-14px_rgba(15,23,42,0.3)]'
                  )}
                >
                  {/* device orb */}
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover/row:scale-110"
                    style={isDark
                      ? { background: `linear-gradient(150deg, ${hue.a}30, ${hue.b}1F)`, borderColor: `${hue.a}38`, color: hue.a, boxShadow: `0 4px 16px -8px ${hue.glow}` }
                      : { background: `linear-gradient(150deg, ${hue.a}26, ${hue.b}14)`, borderColor: `${hue.a}35`, color: hue.b, boxShadow: `0 4px 14px -10px ${hue.glow}` }}
                  >
                    <Icon size={17} strokeWidth={2.25} />
                  </span>
                  {/* device + meta */}
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate text-[13px] font-extrabold tracking-[-0.1px]', isDark ? 'text-white' : 'text-slate-900')}>
                      {entry.device}
                    </p>
                    <div className={cn('mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9.5px] font-medium', isDark ? 'text-slate-500' : 'text-slate-400')}>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Calendar size={10} />
                        {entry.date}
                      </span>
                      <span aria-hidden="true" className="opacity-40">·</span>
                      <span className="inline-flex items-center gap-1 font-mono text-[9.5px]">
                        <Globe size={10} />
                        {entry.ip}
                      </span>
                    </div>
                  </div>
                  {/* status */}
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StageBadge variant={success ? 'ok' : 'danger'}>
                      {success ? <CheckCircle size={10} strokeWidth={3} /> : <XCircle size={10} strokeWidth={3} />}
                      {success ? 'Succès' : 'Échec'}
                    </StageBadge>
                    <span className={cn('text-[8px] font-bold uppercase tracking-[0.16em]', isDark ? 'text-slate-600' : 'text-slate-400')}>
                      {entry.action}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* footer hairline */}
          <div className="relative flex items-center justify-between gap-2 border-t px-5 py-3" style={{ borderColor: panelBorder }}>
            <span className={cn('inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em]', isDark ? 'text-slate-600' : 'text-slate-400')}>
              <Shield size={10} />
              Sessions surveillées par Square Immo
            </span>
            <span className={cn('text-[9px] font-extrabold tabular-nums uppercase tracking-[0.18em]', isDark ? 'text-emerald-400' : 'text-emerald-600')}>
              {profile.loginHistory.filter((e) => e.success).length}/{profile.loginHistory.length} réussies
            </span>
          </div>
        </section>

        {/* recent activity — hue-coded staged timeline */}
        <section className="stage-glass relative flex flex-col overflow-hidden xl:col-span-2">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full"
            style={{ background: `radial-gradient(circle at center, ${accent.a}1F, transparent 65%)`, filter: 'blur(26px)' }}
          />
          {/* header */}
          <div className="relative flex flex-wrap items-center gap-3 border-b px-5 py-4" style={{ borderColor: panelBorder }}>
            <OrbIcon icon={Activity} hue={accent} size={40} radius={12} />
            <div className="min-w-0">
              <h2 className={cn('text-[15px] font-extrabold tracking-[-0.2px]', isDark ? 'text-white' : 'text-slate-900')}>
                Activité récente
              </h2>
              <p className={cn('mt-0.5 text-[11px]', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Dernières actions de l'agent
              </p>
            </div>
            <StageBadge variant="violet" className="ml-auto">{profile.recentActivity.length} actions</StageBadge>
          </div>

          {/* timeline */}
          <div className="relative flex-1 p-4">
            <div className="relative space-y-2.5">
              {profile.recentActivity.map((act, i) => {
                const meta = activityMeta(act.action)
                const Icon = meta.icon
                const [date, time] = act.date.split(' ')
                return (
                  <div
                    key={i}
                    className={cn(
                      'group/row flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200',
                      isDark
                        ? 'border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.05]'
                        : 'border-slate-200/60 bg-white/60 hover:border-slate-300/70 hover:bg-white hover:shadow-[0_8px_24px_-14px_rgba(15,23,42,0.3)]'
                    )}
                  >
                    {/* hue orb node */}
                    <span
                      className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover/row:scale-110"
                      style={isDark
                        ? { background: `linear-gradient(150deg, ${meta.hue.a}30, ${meta.hue.b}1F)`, borderColor: `${meta.hue.a}38`, color: meta.hue.a, boxShadow: `0 4px 16px -8px ${meta.hue.glow}` }
                        : { background: `linear-gradient(150deg, ${meta.hue.a}26, ${meta.hue.b}14)`, borderColor: `${meta.hue.a}35`, color: meta.hue.b, boxShadow: `0 4px 14px -10px ${meta.hue.glow}` }}
                    >
                      <Icon size={17} strokeWidth={2.25} />
                    </span>
                    {/* text */}
                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate text-[13px] font-extrabold leading-snug tracking-[-0.1px]', isDark ? 'text-white' : 'text-slate-900')}>
                        {act.action}
                      </p>
                      <p className={cn('mt-1 truncate text-[11px] font-medium', isDark ? 'text-slate-500' : 'text-slate-400')} title={act.detail}>
                        {act.detail}
                      </p>
                    </div>
                    {/* date chip */}
                    <span
                      className={cn(
                        'flex h-11 w-[74px] shrink-0 flex-col items-center justify-center rounded-xl border leading-none',
                        isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/80'
                      )}
                    >
                      <span className={cn('text-[9.5px] font-extrabold tabular-nums', isDark ? 'text-slate-300' : 'text-slate-600')}>{date}</span>
                      <span className={cn('mt-1.5 text-[8px] font-bold tabular-nums', isDark ? 'text-slate-600' : 'text-slate-400')}>{time}</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* footer hairline */}
          <div className="relative flex items-center justify-between gap-2 border-t px-5 py-3" style={{ borderColor: panelBorder }}>
            <span className={cn('text-[9px] font-bold uppercase tracking-[0.18em]', isDark ? 'text-slate-600' : 'text-slate-400')}>
              {profile.recentActivity.length} événements cette semaine
            </span>
            <button
              type="button"
              className={cn(
                'group inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-[0.18em] transition-colors',
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              Voir toutes les actions
              <ChevronRight size={10} strokeWidth={3} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </div>
        </section>
      </div>
    </motion.div>
  )
}
