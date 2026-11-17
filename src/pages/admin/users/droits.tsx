import { useState, useEffect, useMemo, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { useToast } from '../../../components/ui/Toast'
import { api } from '../../../services/api'
import { getUserDroits, saveUserDroits, type PermissionChoice } from '../../../services/permissionsService'
import {
  Calendar, Users, Target, UserCheck, FileText, Home,
  Book, Shield, RotateCcw, Check, Info, ArrowLeft,
  Mail, Grid, Sliders, CheckCircle, Eye, Edit3, Clock, RefreshCw,
} from 'react-feather'
import { cn } from '../../../lib/utils'
import {
  StageBadge, StageButton, OrbIcon, ShimmerProgress, STAGE_HUES,
  useStageTheme, useStageAccent, type StageHue,
} from '../../../components/dashboard/Stage'


interface PermissionRow {
  key: string
  name: string
  défaut: boolean
  résultat: boolean
}

interface PermissionTable {
  title: string
  rows: PermissionRow[]
}

interface PermissionTab {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  blurb: string
  hue: StageHue
  tables: PermissionTable[]
}

const PERMISSION_TABS: PermissionTab[] = [
  {
    id: 'calendrier',
    label: 'Calendrier',
    icon: Calendar,
    blurb: "Agenda de l'agent — création, modification et visibilité des rendez-vous du module.",
    hue: STAGE_HUES.sky,
    tables: [
      {
        title: 'Calendrier',
        rows: [
          { key: 'calendrier-lecture', name: 'Lecture', défaut: true, résultat: true },
          { key: 'calendrier-ecriture', name: 'Écriture', défaut: true, résultat: true },
        ],
      },
    ],
  },
  {
    id: 'contacts',
    label: 'Contacts',
    icon: Users,
    blurb: 'Répertoire de contacts — lecture, écriture, demandes clients, confidentialité et export.',
    hue: STAGE_HUES.emerald,
    tables: [
      {
        title: 'Contacts',
        rows: [
          { key: 'contacts-supprimer', name: 'Supprimer', défaut: true, résultat: true },
          { key: 'contacts-info-privees', name: 'Informations privées', défaut: true, résultat: true },
          { key: 'contacts-lecture', name: 'Lecture', défaut: true, résultat: true },
          { key: 'contacts-demandes', name: 'Demandes', défaut: true, résultat: true },
          { key: 'contacts-ecriture', name: 'Écriture', défaut: true, résultat: true },
        ],
      },
      {
        title: 'Contact • Général',
        rows: [
          { key: 'contacts-general-export', name: 'Export', défaut: true, résultat: true },
        ],
      },
    ],
  },
  {
    id: 'prospects',
    label: 'Prospects',
    icon: Target,
    blurb: 'Pipeline de prospection — suivi, qualification et conversion des leads entrants.',
    hue: STAGE_HUES.fuchsia,
    tables: [
      {
        title: 'Prospects',
        rows: [
          { key: 'prospects-lecture', name: 'Lecture', défaut: true, résultat: true },
          { key: 'prospects-ecriture', name: 'Écriture', défaut: true, résultat: true },
        ],
      },
    ],
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: UserCheck,
    blurb: 'Base clients — dossiers, visites, informations privées et export des fiches.',
    hue: STAGE_HUES.amber,
    tables: [
      {
        title: 'Clients (tous types)',
        rows: [
          { key: 'clients-supprimer', name: 'Supprimer', défaut: true, résultat: true },
          { key: 'clients-info-privees', name: 'Informations privées', défaut: true, résultat: true },
          { key: 'clients-lecture', name: 'Lecture', défaut: true, résultat: true },
          { key: 'clients-ecriture', name: 'Écriture', défaut: true, résultat: true },
          { key: 'clients-visite', name: 'Visite', défaut: true, résultat: true },
        ],
      },
      {
        title: 'Clients • Général',
        rows: [
          { key: 'clients-general-export', name: 'Export', défaut: true, résultat: true },
        ],
      },
    ],
  },
  {
    id: 'contrats',
    label: 'Contrats',
    icon: FileText,
    blurb: "Cycle contractuel — rédaction, historique, verrouillage et export des contrats.",
    hue: STAGE_HUES.violet,
    tables: [
      {
        title: 'Contrats',
        rows: [
          { key: 'contrats-supprimer', name: 'Supprimer', défaut: true, résultat: true },
          { key: 'contrats-info-privees', name: 'Informations privées', défaut: true, résultat: true },
          { key: 'contrats-lecture', name: 'Lecture', défaut: true, résultat: true },
          { key: 'contrats-ecriture', name: 'Écriture', défaut: true, résultat: true },
        ],
      },
      {
        title: 'Contrats • Général',
        rows: [
          { key: 'contrats-general-export', name: 'Export', défaut: true, résultat: true },
          { key: 'contrats-general-lock', name: "Vérouiller l'historique des contrats", défaut: false, résultat: false },
        ],
      },
    ],
  },
  {
    id: 'biens',
    label: 'Biens',
    icon: Home,
    blurb: 'Portefeuille de biens — publication, transfert, documents privés et visibilité.',
    hue: STAGE_HUES.emerald,
    tables: [
      {
        title: 'Biens',
        rows: [
          { key: 'biens-afficher-adresse', name: "Afficher l'adresse", défaut: true, résultat: true },
          { key: 'biens-afficher-nom-contact', name: 'Afficher le nom du propriétaire', défaut: true, résultat: true },
          { key: 'biens-afficher-coordonnees-contact', name: 'Afficher les coordonnées du propriétaire', défaut: true, résultat: true },
          { key: 'biens-documents-prives', name: 'Documents privés', défaut: false, résultat: false },
          { key: 'biens-transfert', name: 'Transfert', défaut: true, résultat: true },
          { key: 'biens-info-privees', name: 'Informations privées', défaut: false, résultat: false },
          { key: 'biens-lecture', name: 'Lecture', défaut: true, résultat: true },
          { key: 'biens-ecriture', name: 'Écriture', défaut: true, résultat: true },
        ],
      },
      {
        title: 'Biens • Commercial',
        rows: [
          { key: 'biens-commercial-export', name: 'Export', défaut: true, résultat: true },
          { key: 'biens-commercial-publier', name: 'Publier', défaut: true, résultat: true },
        ],
      },
    ],
  },
  {
    id: 'registre',
    label: 'Registre',
    icon: Book,
    blurb: "Registre des transactions — écriture, confidentialité et export des dossiers.",
    hue: STAGE_HUES.sky,
    tables: [
      {
        title: 'Registre',
        rows: [
          { key: 'registre-info-privees', name: 'Informations privées', défaut: false, résultat: false },
          { key: 'registre-lecture', name: 'Lecture', défaut: true, résultat: true },
          { key: 'registre-ecriture', name: 'Écriture', défaut: true, résultat: true },
          { key: 'registre-general-export', name: 'Export', défaut: true, résultat: true },
        ],
      },
    ],
  },
]

const TOTAL_RIGHTS = PERMISSION_TABS.reduce(
  (sum, tab) => sum + tab.tables.reduce((s, table) => s + table.rows.length, 0),
  0
)

const CHOICE_OPTIONS: PermissionChoice[] = ['défaut', 'non', 'oui']
const CHOICE_LABELS: Record<PermissionChoice, string> = {
  défaut: 'Défaut',
  non: 'non',
  oui: 'oui',
}

const GERANT_HUE: StageHue = {
  a: '#C9A0A0',
  b: '#905D5D',
  glow: 'rgba(144,93,93,0.38)',
  line: '#905D5D',
}

const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  gerant: 'Gérant',
  agent: 'Agent',
}

function resolveResult(row: PermissionRow, choice: PermissionChoice | undefined): boolean {
  if (choice === 'oui') return true
  if (choice === 'non') return false
  return row.résultat
}

function ValuePill({ value, animate }: { value: boolean; animate?: boolean }) {
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const cls = value
    ? isDark
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30 shadow-[0_0_10px_-4px_rgba(52,211,153,0.6)]'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-[0_2px_8px_-4px_rgba(5,150,105,0.25)]'
    : isDark
      ? 'bg-white/[0.04] text-slate-400 border-white/10'
      : 'bg-slate-50 text-slate-500 border-slate-200'
  const inner = (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tabular-nums border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${value ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-slate-400/50'}`} />
      {value ? 'oui' : 'non'}
    </span>
  )
  if (!animate) return inner
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={String(value)}
        initial={{ opacity: 0, scale: 0.8, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -4 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="inline-block"
      >
        {inner}
      </motion.span>
    </AnimatePresence>
  )
}

function ChoiceControl({
  rowKey,
  value,
  onChange,
  accent,
  isGerant,
}: {
  rowKey: string
  value: PermissionChoice
  onChange: (v: PermissionChoice) => void
  accent: StageHue
  isGerant: boolean
}) {
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  return (
    <div className={`inline-flex items-center gap-0.5 rounded-xl border p-1 ${isDark ? 'border-white/10 bg-white/[0.04] shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]' : 'border-orange-900/10 bg-white/70 shadow-[inset_0_1px_1px_rgba(15,23,42,0.06)]'}`}>
      {CHOICE_OPTIONS.map((opt) => {
        const active = value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            aria-pressed={active}
            className={`relative px-3.5 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-150 ${
              active ? 'text-white' : isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]' : 'text-slate-500 hover:text-slate-900 hover:bg-orange-50'
            }`}
          >
            {active && (
              <motion.span
                layoutId={`choice-pill-${rowKey}`}
                className="absolute inset-0 rounded-lg border border-white/25"
                style={isGerant
                  ? {
                      backgroundImage: 'linear-gradient(145deg, #D8B4B4 0%, #A47676 55%, #7D5050 100%)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.42), 0 4px 12px -4px rgba(144,93,93,0.55)',
                    }
                  : {
                      backgroundImage: `linear-gradient(145deg, ${accent.a} 0%, ${accent.b} 60%, ${accent.b} 100%)`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.42), 0 4px 12px -4px ${accent.glow}`,
                    }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10">{CHOICE_LABELS[opt]}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ---------------------------------------------------------------------
   CoverageLens — hue-aware neon ring with a gradient fraction readout.
   Draws itself on mount; glows in the admin/gerant hero hue.
   --------------------------------------------------------------------- */
function CoverageLens({
  granted,
  total,
  pct,
  hue,
  isGerant,
  isDark,
}: {
  granted: number
  total: number
  pct: number
  hue: StageHue
  isGerant: boolean
  isDark: boolean
}) {
  const uid = useId().replace(/:/g, '')
  const size = 68
  const stroke = 6
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const hint =
    pct >= 80 ? { label: 'Accès libéral', variant: 'ok' as const }
    : pct >= 50 ? { label: 'Accès équilibré', variant: 'warn' as const }
    : { label: 'Accès restreint', variant: 'danger' as const }
  const ink = isGerant ? (isDark ? '#E7C9C9' : '#7D5050') : isDark ? '#FFFFFF' : '#0F172A'

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center gap-4 overflow-hidden rounded-2xl border py-3 pl-4 pr-5 backdrop-blur-sm',
        isDark
          ? 'border-white/[0.08] bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
          : 'border-slate-200/70 bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.05)]'
      )}
      title={`${granted} droits effectifs sur ${total}`}
    >
      {/* ambient core wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-8 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full"
        style={{ background: `radial-gradient(circle at center, ${hue.a}33, transparent 65%)`, filter: 'blur(18px)' }}
      />
      {/* top specular hairline */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-4 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${hue.a}80, transparent)` }}
      />

      {/* neon ring */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <defs>
            <linearGradient id={`rights-grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={hue.a} />
              <stop offset="100%" stopColor={hue.b} />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            stroke={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)'}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#rights-grad-${uid})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c - (pct / 100) * c }}
            transition={{ duration: 1.1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: `drop-shadow(0 0 6px ${hue.glow})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="text-[17px] font-black tabular-nums tracking-[-0.5px]" style={{ color: ink }}>
            {pct}
            <span className="align-baseline text-[9px] font-extrabold">%</span>
          </span>
          <span className={cn('mt-0.5 text-[6px] font-extrabold uppercase tracking-[0.2em]', isDark ? 'text-slate-500' : 'text-slate-400')}>
            Couverture
          </span>
        </div>
      </div>

      {/* gradient fraction readout */}
      <div className="relative leading-none">
        <p className={cn('flex items-center gap-1.5 text-[8.5px] font-extrabold uppercase tracking-[0.24em]', isDark ? 'text-slate-500' : 'text-slate-400')}>
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: hue.line, boxShadow: `0 0 8px ${hue.glow}` }}
          />
          Droits accordés
        </p>
        <p className="mt-1.5 flex items-baseline gap-1.5">
          <span
            className="bg-clip-text text-[30px] font-black tabular-nums leading-none tracking-[-1px] text-transparent"
            style={{ backgroundImage: `linear-gradient(150deg, ${hue.a} 0%, ${hue.b} 78%)` }}
          >
            {granted}
          </span>
          <span className={cn('text-[13px] font-bold tabular-nums', isDark ? 'text-slate-500' : 'text-slate-400')}>
            / {total}
          </span>
        </p>
        <div className="mt-1.5">
          <StageBadge variant={hint.variant}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {hint.label}
          </StageBadge>
        </div>
      </div>
    </div>
  )
}

function PermissionTableCard({
  table,
  index,
  choices,
  onChoiceChange,
  hue,
  isGerant,
}: {
  table: PermissionTable
  index: number
  choices: Record<string, PermissionChoice>
  onChoiceChange: (rowKey: string, choice: PermissionChoice) => void
  hue: StageHue
  isGerant: boolean
}) {
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const accent = useStageAccent()
  const orbHue = isGerant ? GERANT_HUE : hue
  const granted = table.rows.filter((row) => resolveResult(row, choices[row.key])).length
  const total = table.rows.length
  const grantVariant = granted === total ? 'ok' : granted === 0 ? 'danger' : 'neutral'
  const isGeneral = table.title.includes('•')
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.035 } },
  }
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="stage-glass relative overflow-hidden">
        {/* ambient corner glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full opacity-60"
          style={{ background: `radial-gradient(circle at center, ${orbHue.a}26, transparent 65%)`, filter: 'blur(28px)' }}
        />

        {/* ── Header ── */}
        <div className={`relative flex flex-wrap items-center gap-3 border-b px-4 py-3.5 sm:px-5 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-orange-900/10 bg-white/45'}`}>
          <OrbIcon icon={Shield} hue={orbHue} size={40} radius={12} />
          <div className="min-w-0">
            <h3 className={`text-[14px] font-extrabold tracking-[-0.15px] leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{table.title}</h3>
            <p className={`mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {isGeneral ? 'Périmètre & paramètres' : "Droits d'accès du module"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <StageBadge variant="neutral">{total} droit{total > 1 ? 's' : ''}</StageBadge>
            <StageBadge variant={grantVariant}>
              {granted === total && <Check size={10} strokeWidth={3.5} />}
              <span title={`${granted} sur ${total} droits accordés`}>{granted}/{total} accordés</span>
            </StageBadge>
          </div>
        </div>

        {/* ── Matrix ── */}
        <div className="relative overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="min-w-[600px]">
            <div className={`grid grid-cols-[minmax(0,1fr)_76px_minmax(180px,auto)_76px] items-center gap-3 border-b px-4 py-2 sm:px-5 ${isDark ? 'border-white/[0.08] text-slate-500' : 'border-orange-900/[0.08] text-slate-400'}`}>
              <span className="text-[9.5px] font-extrabold uppercase tracking-[0.18em]">Droits</span>
              <span className="text-[9.5px] font-extrabold uppercase tracking-[0.18em]">Défaut</span>
              <span className="text-[9.5px] font-extrabold uppercase tracking-[0.18em]">Choix</span>
              <span className="text-[9.5px] font-extrabold uppercase tracking-[0.18em]">Résultat</span>
            </div>
            <motion.div variants={container} initial="hidden" animate="show">
              {table.rows.map((row) => {
                const choice = choices[row.key] || 'défaut'
                const result = resolveResult(row, choices[row.key])
                const custom = choice !== 'défaut'
                return (
                  <motion.div
                    key={row.key}
                    variants={item}
                    className={`grid grid-cols-[minmax(0,1fr)_76px_minmax(180px,auto)_76px] items-center gap-3 border-b px-4 py-2.5 transition-colors duration-150 last:border-b-0 sm:px-5 ${isDark ? 'border-white/5 hover:bg-white/[0.035]' : 'border-orange-900/5 hover:bg-orange-50/50'}`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      {custom && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          title="Valeur personnalisée (≠ défaut)"
                          style={{ background: orbHue.line, boxShadow: `0 0 6px ${orbHue.glow}` }}
                        />
                      )}
                      <span className={`truncate text-[12.5px] font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{row.name}</span>
                    </span>
                    <div>
                      <ValuePill value={row.défaut} />
                    </div>
                    <div>
                      <ChoiceControl
                        rowKey={row.key}
                        value={choice}
                        onChange={(v) => onChoiceChange(row.key, v)}
                        accent={accent}
                        isGerant={isGerant}
                      />
                    </div>
                    <div>
                      <ValuePill value={result} animate />
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function AdminUserDroitsPage() {
  const { adminId, id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const accent = useStageAccent()
  const [activeTab, setActiveTab] = useState(PERMISSION_TABS[0].id)
  const [choices, setChoices] = useState<Record<string, PermissionChoice>>({})
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [isGerant, setIsGerant] = useState(false)
  const [user, setUser] = useState<{
    id: number
    first_name: string
    last_name: string
    email: string
    role: string
    position: string
    status: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<any>('/auth/me').then(u => {
      if (u?.role === 'gerant') setIsGerant(true)
    }).catch(() => {})
  }, [])

  /* Hide the app shell scrollbar while on this page — tab switches change the
     content height, which would otherwise flash an overlay scrollbar. */
  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return
    main.classList.add('no-scrollbar')
    return () => { main.classList.remove('no-scrollbar') }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const users = await api.get<Array<{
          id: number
          first_name: string
          last_name: string
          email: string
          role: string
          position: string
          status: string
        }>>('/admin/users')
        if (!cancelled) {
          const found = users.find((u) => String(u.id) === String(id)) || null
          setUser(found)
        }
      } catch (err) {
        console.error('Error loading user for droits:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const stored = await getUserDroits(id as string)
        if (!cancelled) setChoices(stored)
      } catch (err) {
        console.error('Error loading droits:', err)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  const stats = useMemo(() => {
    let granted = 0
    let customized = 0
    for (const tab of PERMISSION_TABS) {
      for (const table of tab.tables) {
        for (const row of table.rows) {
          if (resolveResult(row, choices[row.key])) granted += 1
        }
      }
    }
    for (const v of Object.values(choices)) {
      if (v !== 'défaut') customized += 1
    }
    const pct = TOTAL_RIGHTS > 0 ? Math.round((granted / TOTAL_RIGHTS) * 100) : 0
    return { granted, customized, pct, total: TOTAL_RIGHTS }
  }, [choices])

  const handleChoiceChange = (rowKey: string, choice: PermissionChoice) => {
    setChoices((prev) => ({ ...prev, [rowKey]: choice }))
    setDirty(true)
  }

  const handleReset = async () => {
    setChoices({})
    setSaving(true)
    try {
      await saveUserDroits(id as string, {}, true)
      setDirty(false)
      toast('success', 'Tous les choix ont été réinitialisés aux valeurs par défaut.')
    } catch {
      toast('error', "Erreur lors de la réinitialisation des droits.")
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveUserDroits(id as string, choices)
      setDirty(false)
      toast('success', 'Les droits ont été enregistrés.')
    } catch {
      toast('error', "Erreur lors de l'enregistrement des droits.")
    } finally {
      setSaving(false)
    }
  }

  const roleLabel = user
    ? user.role === 'agent'
      ? user.position || 'Agent'
      : roleLabels[user.role] || user.role
    : ''

  const heroHue = isGerant ? GERANT_HUE : accent
  const statusDot = user?.status === 'actif'
    ? 'linear-gradient(145deg, #34D399, #059669)'
    : user?.status === 'suspendu'
      ? 'linear-gradient(145deg, #FB7185, #E11D48)'
      : 'linear-gradient(145deg, #FCD34D, #D97706)'
  const statusMeta = !user
    ? null
    : user.status === 'actif'
      ? { label: 'Actif', variant: 'ok' as const }
      : user.status === 'suspendu'
        ? { label: 'Suspendu', variant: 'danger' as const }
        : { label: 'Inactif', variant: 'warn' as const }

  const gradientTitle = isGerant
    ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#C99B9B] via-[#A47676] to-[#6E4444]'
    : isDark
      ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#FDA4AF] via-[#F43F5E] to-[#C084FC]'
      : 'bg-clip-text text-transparent bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FBBF24]'

  const activeModule = PERMISSION_TABS.find((tab) => tab.id === activeTab) || PERMISSION_TABS[0]
  const activeHue = isGerant ? GERANT_HUE : activeModule.hue
  const ActiveModuleIcon = activeModule.icon
  const activeStats = useMemo(() => {
    let total = 0
    let granted = 0
    for (const table of activeModule.tables) {
      for (const row of table.rows) {
        total += 1
        if (resolveResult(row, choices[row.key])) granted += 1
      }
    }
    return { total, granted, pct: total > 0 ? Math.round((granted / total) * 100) : 0 }
  }, [activeModule, choices])

  const tabRightCount = (tab: PermissionTab) =>
    tab.tables.reduce((sum, table) => sum + table.rows.length, 0)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* ── Top bar : back + sync state ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
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
        <div className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.16em] backdrop-blur-md',
          dirty
            ? isDark ? 'border-amber-400/25 bg-amber-400/10 text-amber-300' : 'border-amber-500/30 bg-amber-50 text-amber-700'
            : isDark ? 'border-emerald-400/20 bg-emerald-400/5 text-emerald-300' : 'border-emerald-500/25 bg-emerald-50 text-emerald-700'
        )}>
          <span className={cn('h-1.5 w-1.5 rounded-full', dirty ? 'bg-amber-400' : 'bg-emerald-400')} style={{ boxShadow: dirty ? '0 0 6px rgba(251,191,36,0.7)' : '0 0 6px rgba(52,211,153,0.7)' }} />
          {dirty ? 'Modifications non enregistrées' : 'Droits synchronisés'}
        </div>
      </div>

      {/* ══════════ HERO — agent staged identity ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="stage-glass relative overflow-hidden !rounded-[24px]"
      >
        {/* accent crown line */}
        <div
          className="absolute inset-x-0 top-0 z-10 h-[3px]"
          style={{ background: `linear-gradient(90deg, transparent, ${heroHue.a}, ${heroHue.b}, transparent)`, boxShadow: `0 0 18px ${heroHue.glow}` }}
        />
        {/* ambient wash */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: isDark
              ? `radial-gradient(110% 85% at 50% 0%, ${heroHue.a}26, transparent 62%), radial-gradient(70% 55% at 100% 100%, ${heroHue.b}14, transparent 60%)`
              : `radial-gradient(110% 85% at 50% 0%, ${heroHue.a}1F, transparent 62%), radial-gradient(70% 55% at 100% 100%, ${heroHue.a}10, transparent 60%)`,
          }}
        />

        <div className="relative p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
            {/* identity cluster */}
            <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">
              {loading || !user ? (
                <div className="flex w-full items-center gap-4">
                  <div className={cn('h-[72px] w-[72px] shrink-0 animate-pulse rounded-[22px]', isDark ? 'bg-white/10' : 'bg-orange-100')} />
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className={cn('h-2.5 w-36 animate-pulse rounded-full', isDark ? 'bg-white/10' : 'bg-orange-100')} />
                    <div className={cn('h-7 w-56 animate-pulse rounded-lg', isDark ? 'bg-white/10' : 'bg-orange-100')} />
                    <div className={cn('h-3 w-44 animate-pulse rounded-full', isDark ? 'bg-white/5' : 'bg-orange-50')} />
                  </div>
                </div>
              ) : (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="relative shrink-0"
                  >
                    <div
                      className="orb-icon select-none text-[22px] font-extrabold tracking-tight"
                      style={{ width: 72, height: 72, borderRadius: 22, '--orb-a': heroHue.a, '--orb-b': heroHue.b, '--orb-glow': heroHue.glow } as React.CSSProperties}
                    >
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </div>
                    <span
                      className="absolute -bottom-1.5 -right-1.5 h-5 w-5 rounded-full border-2"
                      style={{ borderColor: isDark ? '#0B1022' : '#FFFFFF', background: statusDot, boxShadow: '0 2px 8px rgba(0,0,0,0.35)' }}
                      title={user.status}
                    />
                  </motion.div>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                      className={cn('flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.3em]', isDark ? 'text-slate-400' : 'text-orange-900/50')}
                    >
                      <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Square Immo · Contrôle d'accès · {roleLabels[user.role] || 'Agent'}
                    </motion.p>
                    <motion.h1
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                      className={cn('mt-1 text-[30px] font-black leading-[1.05] tracking-[-1.2px] sm:text-4xl', gradientTitle)}
                    >
                      {user.first_name} {user.last_name}
                    </motion.h1>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                      className="mt-2 flex flex-wrap items-center gap-1.5"
                    >
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] backdrop-blur-md"
                        style={isDark
                          ? { background: `${heroHue.a}2E`, color: '#fff', border: `1px solid ${heroHue.a}5C`, boxShadow: `0 2px 12px ${heroHue.glow}, inset 0 1px 0 rgba(255,255,255,0.14)` }
                          : { background: `${heroHue.a}1C`, color: heroHue.b, border: `1px solid ${heroHue.a}42`, boxShadow: `0 2px 10px ${heroHue.glow}, inset 0 1px 0 rgba(255,255,255,0.7)` }}
                      >
                        <Shield size={10} className="mr-0.5" strokeWidth={2.5} />
                        {roleLabel}
                      </span>
                      {statusMeta && (
                        <StageBadge variant={statusMeta.variant}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'currentColor' }} />
                          {statusMeta.label}
                        </StageBadge>
                      )}
                      <span className={cn(
                        'inline-flex max-w-[240px] items-center gap-1.5 truncate rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm',
                        isDark ? 'border-white/10 bg-white/[0.04] text-slate-300' : 'border-slate-200/80 bg-white/70 text-slate-500'
                      )}>
                        <Mail size={10} className="shrink-0 opacity-70" />
                        <span className="truncate">{user.email}</span>
                      </span>
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.22 }}
                      className={cn('mt-2 max-w-md text-[12.5px] leading-snug', isDark ? 'text-slate-400' : 'text-slate-500')}
                    >
                      Configuration des droits d'accès — contrôlez ce que cet agent peut voir et faire dans chaque module.
                    </motion.p>
                  </div>
                </>
              )}
            </div>

            {/* coverage lens + actions */}
            <motion.div
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'flex shrink-0 flex-wrap items-center gap-4 lg:justify-end lg:border-l lg:pl-6',
                isDark ? 'lg:border-white/10' : 'lg:border-orange-900/10'
              )}
            >
              {/* neon coverage lens */}
              <CoverageLens granted={stats.granted} total={stats.total} pct={stats.pct} hue={heroHue} isGerant={isGerant} isDark={isDark} />

              {/* actions */}
              <div className="flex flex-col gap-2">
                <StageButton
                  size="md"
                  icon={saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </StageButton>
                <StageButton variant="glass" size="md" icon={<RotateCcw size={14} />} onClick={handleReset} disabled={saving}>
                  Réinitialiser
                </StageButton>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── KPI chips deck ── */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          { icon: Grid, label: 'Modules', value: String(PERMISSION_TABS.length), suffix: 'contrôlés', delay: 0 },
          { icon: Shield, label: 'Droits', value: String(TOTAL_RIGHTS), suffix: 'au total', delay: 0.06 },
          { icon: Sliders, label: 'Personnalisés', value: String(stats.customized), suffix: 'choix ≠ défaut', delay: 0.12 },
          { icon: CheckCircle, label: 'Accordés', value: String(stats.granted), suffix: `sur ${TOTAL_RIGHTS} effectifs`, delay: 0.18 },
        ].map((chip) => {
          const Icon = chip.icon
          return (
            <motion.div
              key={chip.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: chip.delay + 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'rounded-2xl border p-3.5 backdrop-blur-sm',
                isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]'
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                  style={isDark
                    ? { background: `${heroHue.a}14`, borderColor: `${heroHue.a}30`, color: heroHue.a }
                    : { background: `${heroHue.a}12`, borderColor: `${heroHue.a}33`, color: heroHue.b }}
                >
                  <Icon size={13} />
                </span>
                <span className={cn('truncate text-[9.5px] font-bold uppercase tracking-[0.14em]', isDark ? 'text-slate-500' : 'text-slate-400')}>
                  {chip.label}
                </span>
              </div>
              <p className={cn('mt-1.5 text-[22px] font-extrabold leading-none tracking-[-0.5px] tabular-nums', isDark ? 'text-white' : 'text-slate-900')}>
                {chip.value}
                <span className={cn('ml-1.5 text-[10px] font-semibold tracking-normal', isDark ? 'text-slate-500' : 'text-slate-400')}>{chip.suffix}</span>
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* ══════════ TABS — even rail, premium pills ══════════ */}
      <div
        role="tablist"
        aria-label="Modules de droits"
        className="stage-glass flex items-stretch gap-1 overflow-x-auto p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {PERMISSION_TABS.map((tab) => {
          const active = tab.id === activeTab
          const Icon = tab.icon
          const count = tabRightCount(tab)
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex flex-1 min-w-[96px] items-center justify-center gap-2 rounded-2xl px-2 py-2.5 text-[12px] font-bold transition-colors duration-200',
                active
                  ? 'text-white'
                  : isDark
                    ? 'text-slate-400 hover:text-slate-100'
                    : 'text-slate-500 hover:text-slate-900'
              )}
            >
              {active && (
                <motion.span
                  layoutId="droits-tab-pill"
                  className="absolute inset-0 rounded-2xl border border-white/25"
                  style={{
                    backgroundImage: isGerant
                      ? 'linear-gradient(145deg, #D8B4B4 0%, #A47676 55%, #7D5050 100%)'
                      : isDark
                        ? 'linear-gradient(145deg, #F43F5E 0%, #C2266B 55%, #6D28D9 100%)'
                        : 'linear-gradient(145deg, #FDBA74 0%, #F97316 55%, #C2410C 100%)',
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.42), 0 10px 26px -8px ${heroHue.glow}`,
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              {!active && (
                <span className={cn('absolute inset-0 rounded-2xl transition-colors duration-200', isDark ? 'hover:bg-white/5' : 'hover:bg-orange-900/5')} />
              )}
              <Icon size={15} className="relative z-10 shrink-0" />
              <span className="relative z-10 hidden min-[430px]:inline">{tab.label}</span>
              <span
                className={cn(
                  'relative z-10 hidden items-center justify-center rounded-full px-1.5 text-[9px] font-extrabold tabular-nums xl:inline-flex',
                  active
                    ? 'bg-white/20 text-white'
                    : isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-900/[0.06] text-slate-500'
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ══════════ CONTENT — staged module banner + tables ══════════ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          {/* module banner */}
          <div className="stage-glass relative overflow-hidden p-4 sm:p-5">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background: isDark
                  ? `radial-gradient(120% 90% at 0% 0%, ${activeHue.a}22, transparent 55%)`
                  : `radial-gradient(120% 90% at 0% 0%, ${activeHue.a}18, transparent 55%)`,
              }}
            />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
              <OrbIcon icon={ActiveModuleIcon} hue={activeHue} size={48} radius={14} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className={cn('text-[15px] font-extrabold tracking-[-0.2px]', isDark ? 'text-white' : 'text-slate-900')}>
                    Module {activeModule.label}
                  </h2>
                  <StageBadge variant="neutral">{activeStats.total} droit{activeStats.total > 1 ? 's' : ''}</StageBadge>
                  {activeStats.granted === activeStats.total && <StageBadge variant="ok">Complet</StageBadge>}
                </div>
                <p className={cn('mt-1 text-[11.5px] leading-snug', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  {activeModule.blurb}
                </p>
                <div className="mt-2 flex items-center gap-2.5">
                  <div className="w-40">
                    <ShimmerProgress pct={activeStats.pct} colorFrom={activeHue.a} colorTo={activeHue.b} glow={activeHue.glow} height={6} />
                  </div>
                  <span className={cn('text-[10px] font-bold tabular-nums', isDark ? 'text-slate-400' : 'text-slate-500')}>
                    {activeStats.granted}/{activeStats.total} accordés
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* tables */}
          {activeModule.tables.map((table, i) => (
            <PermissionTableCard
              key={table.title}
              table={table}
              index={i}
              choices={choices}
              onChoiceChange={handleChoiceChange}
              hue={activeModule.hue}
              isGerant={isGerant}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* ══════════ NOTE — premium explainer ══════════ */}
      <div className="stage-glass relative overflow-hidden p-4 sm:p-5">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full"
          style={{
            background: isGerant ? 'rgba(144,93,93,0.22)' : isDark ? 'rgba(244,63,94,0.22)' : 'rgba(249,115,22,0.2)',
            filter: 'blur(44px)',
          }}
        />
        <div className="relative flex items-start gap-3.5">
          <OrbIcon icon={Info} hue={heroHue} size={42} radius={12} className="mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className={cn('text-[13px] font-extrabold tracking-[-0.1px]', isDark ? 'text-slate-100' : 'text-slate-800')}>
                À propos des droits
              </p>
              <StageBadge variant="violet">Activation progressive</StageBadge>
            </div>
            <ul className="mt-2.5 space-y-2">
              {[
                {
                  icon: Eye,
                  text: <>Les modules <b className={isDark ? 'text-slate-200' : 'text-slate-800'}>Calendrier, Contacts et Prospects</b> sont actifs : <b className={isDark ? 'text-slate-200' : 'text-slate-800'}>« Lecture » à « non »</b> masque l'onglet de l'agent.</>,
                },
                {
                  icon: Edit3,
                  text: <><b className={isDark ? 'text-slate-200' : 'text-slate-800'}>« Écriture » à « non »</b> empêche l'agent d'ajouter ou de modifier des éléments.</>,
                },
                {
                  icon: Clock,
                  text: <>Les autres modules prendront effet <b className={isDark ? 'text-slate-200' : 'text-slate-800'}>au fur et à mesure de leur activation</b>.</>,
                },
              ].map((line, i) => {
                const Icon = line.icon
                return (
                  <li key={i} className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                        isDark ? 'border-white/10 bg-white/[0.05] text-slate-400' : 'border-orange-900/10 bg-white/80 text-slate-500'
                      )}
                    >
                      <Icon size={11} />
                    </span>
                    <span className={cn('text-[11.5px] leading-relaxed', isDark ? 'text-slate-400' : 'text-slate-600')}>
                      {line.text}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

