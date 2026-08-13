import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { BackLink } from '../../../components/ui/BackLink'
import { useToast } from '../../../components/ui/Toast'
import { api } from '../../../services/api'
import { getUserDroits, saveUserDroits, type PermissionChoice } from '../../../services/permissionsService'
import {
  Calendar, Users, Target, UserCheck, FileText, Home,
  Book, Shield, RotateCcw, Check, Info
} from 'react-feather'

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
  tables: PermissionTable[]
}

const PERMISSION_TABS: PermissionTab[] = [
  {
    id: 'calendrier',
    label: 'Calendrier',
    icon: Calendar,
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

const CHOICE_OPTIONS: PermissionChoice[] = ['défaut', 'non', 'oui']
const CHOICE_LABELS: Record<PermissionChoice, string> = {
  défaut: 'Défaut',
  non: 'non',
  oui: 'oui',
}

const roleBadgeVariants: Record<string, 'primary' | 'warning' | 'default'> = {
  admin: 'primary',
  gerant: 'warning',
  agent: 'default',
}

const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  gerant: 'Gérant',
  agent: 'Agent',
}

function ValuePill({ value, animate }: { value: boolean; animate?: boolean }) {
  const cls = value
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : 'bg-border/40 text-text-secondary border-border/40'
  const inner = (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${value ? 'bg-emerald-500' : 'bg-text-secondary/50'}`} />
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
  isGerant,
}: {
  rowKey: string
  value: PermissionChoice
  onChange: (v: PermissionChoice) => void
  isGerant: boolean
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-border/50 bg-background p-1">
      {CHOICE_OPTIONS.map((opt) => {
        const active = value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 ${
              active ? 'text-white' : 'text-text-secondary hover:text-text hover:bg-card'
            }`}
          >
            {active && (
              <motion.span
                layoutId={`choice-pill-${rowKey}`}
                className="absolute inset-0 rounded-md bg-accent shadow-[0_2px_8px_rgba(79,70,229,0.3)]"
                style={isGerant ? { backgroundColor: '#905D5D' } : undefined}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">{CHOICE_LABELS[opt]}</span>
          </button>
        )
      })}
    </div>
  )
}

function PermissionTableCard({
  table,
  index,
  choices,
  onChoiceChange,
  isGerant,
}: {
  table: PermissionTable
  index: number
  choices: Record<string, PermissionChoice>
  onChoiceChange: (rowKey: string, choice: PermissionChoice) => void
  isGerant: boolean
}) {
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: 'easeOut' }}
    >
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/40 bg-background/60">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isGerant ? 'bg-[#E7D5D5] text-[#905D5D]' : 'bg-accent-light text-accent'}`}>
            <Shield size={15} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{table.title}</h3>
            <p className="text-xs text-text-secondary/70">Droits d'accès du module</p>
          </div>
          <Badge variant="secondary" size="sm" className="ml-auto">
            {table.rows.length} droit{table.rows.length > 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-[minmax(0,1fr)_80px_minmax(180px,auto)_80px] items-center gap-3 px-5 py-2.5 border-b border-border/20 text-[11px] uppercase tracking-wider text-text-secondary/70 font-medium">
              <span>Droits</span>
              <span>Défaut</span>
              <span>Choix</span>
              <span>Résultat</span>
            </div>
            <motion.div variants={container} initial="hidden" animate="show">
              {table.rows.map((row) => {
                const choice = choices[row.key] || 'défaut'
                const result = choice === 'oui' ? true : choice === 'non' ? false : row.résultat
                return (
                  <motion.div
                    key={row.key}
                    variants={item}
                    className="grid grid-cols-[minmax(0,1fr)_80px_minmax(180px,auto)_80px] items-center gap-3 px-5 py-3 border-b border-border/10 last:border-b-0 transition-colors hover:bg-background/50"
                  >
                    <span className="text-sm font-medium">{row.name}</span>
                    <div>
                      <ValuePill value={row.défaut} />
                    </div>
                    <div>
                      <ChoiceControl
                        rowKey={row.key}
                        value={choice}
                        onChange={(v) => onChoiceChange(row.key, v)}
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
      </Card>
    </motion.div>
  )
}

export default function AdminUserDroitsPage() {
  const { adminId, id } = useParams()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState(PERMISSION_TABS[0].id)
  const [choices, setChoices] = useState<Record<string, PermissionChoice>>({})
  const [saving, setSaving] = useState(false)
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

  const handleChoiceChange = (rowKey: string, choice: PermissionChoice) => {
    setChoices((prev) => ({ ...prev, [rowKey]: choice }))
  }

  const handleReset = async () => {
    setChoices({})
    setSaving(true)
    try {
      await saveUserDroits(id as string, {}, true)
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

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <BackLink to={`/admin/${adminId}/users`} />

      {/* Header */}
      <Card className="p-6 relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br via-transparent to-transparent pointer-events-none ${isGerant ? 'from-[#E7D5D5]/50' : 'from-accent-light/50'}`} />
        <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-2xl pointer-events-none ${isGerant ? 'bg-[#905D5D]/5' : 'bg-accent/5'}`} />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {loading || !user ? (
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-border/40 animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 w-44 bg-border/40 rounded animate-pulse" />
                <div className="h-3 w-28 bg-border/30 rounded animate-pulse" />
              </div>
            </div>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className={`w-16 h-16 rounded-2xl text-white flex items-center justify-center text-2xl font-bold shadow-lg flex-shrink-0 ${isGerant
                  ? 'bg-gradient-to-br from-[#905D5D] to-[#7D5050] shadow-[#905D5D]/25'
                  : 'bg-gradient-to-br from-accent to-accent-hover shadow-accent/25'}`}
              >
                {user.first_name[0]}{user.last_name[0]}
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-semibold tracking-tight truncate">
                    {user.first_name} {user.last_name}
                  </h1>
                  <Badge variant={roleBadgeVariants[user.role] || 'default'}>
                    <Shield size={11} className="mr-1" />
                    {roleLabel}
                  </Badge>
                </div>
                <p className="text-sm text-text-secondary mt-1.5">
                  Configuration des droits d'accès — contrôlez ce que cet agent peut voir et faire dans chaque module.
                </p>
              </div>
            </>
          )}
          <div className="flex items-center gap-2 sm:flex-col lg:flex-row">
            <Button variant="outline" size="sm" icon={<RotateCcw size={13} />} onClick={handleReset}>
              Réinitialiser
            </Button>
            <Button
              variant="default"
              size="sm"
              icon={<Check size={13} />}
              onClick={handleSave}
              disabled={saving}
              className={isGerant
                ? 'bg-[#905D5D] text-white hover:bg-[#7D5050] border-[#905D5D] shadow-[0_10px_24px_rgba(144,93,93,0.35)]'
                : 'bg-accent text-white hover:bg-accent-hover border-accent shadow-[0_10px_24px_rgba(79,70,229,0.35)]'}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-border/40 bg-card p-1.5 shadow-sm">
        {PERMISSION_TABS.map((tab) => {
          const active = tab.id === activeTab
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                active ? 'text-white' : 'text-text-secondary hover:text-text hover:bg-background'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="active-tab-pill"
                  className={`absolute inset-0 rounded-xl bg-gradient-to-br shadow-[0_2px_8px_rgba(79,70,229,0.35)] ${isGerant
                    ? 'from-[#905D5D] to-[#7D5050] shadow-[0_2px_8px_rgba(144,93,93,0.35)]'
                    : 'from-accent to-accent-hover shadow-[0_2px_8px_rgba(79,70,229,0.35)]'}`}
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                />
              )}
              <Icon size={15} className="relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="space-y-4"
        >
          {PERMISSION_TABS
            .filter((tab) => tab.id === activeTab)
            .map((tab) => (
              <div key={tab.id} className="space-y-4">
                {tab.tables.map((table, i) => (
                  <PermissionTableCard
                    key={table.title}
                    table={table}
                    index={i}
                    choices={choices}
                    onChoiceChange={handleChoiceChange}
                    isGerant={isGerant}
                  />
                ))}
              </div>
            ))}
        </motion.div>
      </AnimatePresence>

      {/* Footer note */}
      <div className="flex items-start gap-3 text-xs text-text-secondary/80 bg-card rounded-xl border border-border/40 p-4">
        <Info size={14} className={`mt-0.5 flex-shrink-0 ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`} />
        <p>
          Les modules Calendrier, Contacts et Prospects sont actifs : « Lecture » à « non » masque l'onglet
          de l'agent, et « Écriture » à « non » l'empêche d'ajouter ou de modifier des éléments.
          Les autres modules prendront effet au fur et à mesure de leur activation.
        </p>
      </div>
    </motion.div>
  )
}
