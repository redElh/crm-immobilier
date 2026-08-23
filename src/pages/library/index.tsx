import { useState, useEffect, useMemo, useCallback } from 'react'
import type { ComponentType } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Library as LibraryIcon, Search, X, LayoutGrid, List, Download, Eye, Globe,
  FolderOpen, TrendingUp, FileText, Share2, Pencil, Trash2, Plus,
  ChevronLeft, ChevronRight, AlertTriangle, Languages, CalendarDays, Copy,
  Home, Building2, KeyRound, Handshake, ClipboardList, FileSignature,
  Info, Zap, ExternalLink, CheckCircle2, Clock3, FileUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../components/ui/Toast'
import { getAuthToken } from '../../utils/auth'
import {
  LIBRARY_CATEGORIES,
  LIBRARY_CATEGORY_ORDER,
  LIBRARY_LANGUAGES,
  LIBRARY_ALL_LANGS,
  LIBRARY_TYPE_LABELS,
  LIBRARY_TEMPLATES,
  templateFileUrl,
} from '../../data/libraryTemplates'
import type {
  LibraryTemplate,
  LibraryCategoryKey,
  LibraryDocType,
  LibraryLang,
} from '../../data/libraryTemplates'

type RuntimeTemplate = LibraryTemplate

const PAGE_SIZE = 8

const CATEGORY_ICONS: Record<LibraryCategoryKey, LucideIcon> = {
  vente: Home,
  location: Building2,
  baux: KeyRound,
  interne: Handshake,
  avenants: ClipboardList,
}

const TYPE_ICONS: Record<LibraryDocType, LucideIcon> = {
  mandat: FileSignature,
  bail: KeyRound,
  contrat: Handshake,
  avenant: ClipboardList,
  document: FileText,
}

type SelectIconType = ComponentType<{ size?: number; className?: string }>

const makeColorDot = (color: string): SelectIconType => {
  const Dot = ({ className }: { size?: number; className?: string }) => (
    <span
      className={className}
      style={{ width: 10, height: 10, backgroundColor: color, borderRadius: '9999px', display: 'inline-block', flexShrink: 0 }}
    />
  )
  return Dot
}

const CATEGORY_DOT_ICONS = Object.fromEntries(
  LIBRARY_CATEGORY_ORDER.map(key => [key, makeColorDot(LIBRARY_CATEGORIES[key].color)])
) as Record<LibraryCategoryKey, SelectIconType>

const makeLangIcon = (code: string): SelectIconType => {
  const LangIcon = ({ className }: { size?: number; className?: string }) => (
    <span className={`text-[9px] font-bold uppercase tracking-wide ${className || ''}`}>{code}</span>
  )
  return LangIcon
}

const LANG_CODE_ICONS = Object.fromEntries(
  LIBRARY_ALL_LANGS.map(code => [code, makeLangIcon(code)])
) as Record<LibraryLang, SelectIconType>

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeLS(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

function hexA(hex: string, alpha: number): string {
  return `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return iso
  }
}

function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(() => window.location.pathname.startsWith('/admin'))
  useEffect(() => {
    const token = getAuthToken()
    if (!token) return
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setIsAdmin(payload.role === 'admin' || payload.role === 'gerant')
    } catch {}
  }, [])
  return isAdmin
}

interface PreviewState {
  template: RuntimeTemplate
  lang?: LibraryLang
}

export default function LibrairiePage() {
  const admin = useIsAdmin()
  const { toast } = useToast()

  const [hiddenIds, setHiddenIds] = useState<string[]>(() => readLS<string[]>('librairie_hidden', []))
  const [customDocs, setCustomDocs] = useState<LibraryTemplate[]>(() => readLS<LibraryTemplate[]>('librairie_custom', []))
  const [overrides, setOverrides] = useState<Record<string, Partial<LibraryTemplate>>>(() => readLS('librairie_overrides', {}))
  const [dlCounts, setDlCounts] = useState<Record<string, number>>(() => readLS('librairie_dl_counts', {}))
  const [sessionUrls, setSessionUrls] = useState<Record<string, string>>({})
  const [monthTotal, setMonthTotal] = useState<number>(() => {
    const m = readLS<{ ym: string; total: number }>('librairie_month', { ym: '', total: 0 })
    return m.ym === new Date().toISOString().slice(0, 7) ? m.total : 0
  })

  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [fCategory, setFCategory] = useState<LibraryCategoryKey | ''>('')
  const [fLang, setFLang] = useState<LibraryLang | ''>('')
  const [fType, setFType] = useState<LibraryDocType | ''>('')
  const [page, setPage] = useState(1)

  const [detailId, setDetailId] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RuntimeTemplate | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [formOpen, setFormOpen] = useState<'add' | RuntimeTemplate | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState<LibraryCategoryKey>('vente')
  const [formType, setFormType] = useState<LibraryDocType>('mandat')
  const [formLangs, setFormLangs] = useState<Set<LibraryLang>>(new Set(LIBRARY_ALL_LANGS))
  const [formFile, setFormFile] = useState<File | null>(null)

  const docs = useMemo<RuntimeTemplate[]>(() => {
    const base = LIBRARY_TEMPLATES.filter(t => !hiddenIds.includes(t.id)).map(
      t => (overrides[t.id] ? { ...t, ...overrides[t.id] } : t)
    )
    const customs = customDocs.filter(t => !hiddenIds.includes(t.id)).map(t => ({ ...t, custom: true }))
    return [...base, ...customs]
  }, [hiddenIds, customDocs, overrides])

  const resolveUrl = useCallback(
    (t: RuntimeTemplate, lang?: LibraryLang) =>
      t ? sessionUrls[t.id] || templateFileUrl(t, lang) : null,
    [sessionUrls]
  )

  const hasFile = useCallback(
    (t: RuntimeTemplate | null | undefined, lang?: LibraryLang) => Boolean(t && resolveUrl(t, lang)),
    [resolveUrl]
  )

  const downloadsOf = useCallback(
    (t: RuntimeTemplate) => {
      if (!t) return 0
      let extra = 0
      Object.entries(dlCounts).forEach(([key, count]) => {
        if (key.startsWith(`${t.id}:`)) extra += count
      })
      return t.baseDownloads + extra
    },
    [dlCounts]
  )

  const filtered = useMemo(() => {
    return docs.filter(doc => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const catLabel = LIBRARY_CATEGORIES[doc.category].label.toLowerCase()
        const typeLabel = LIBRARY_TYPE_LABELS[doc.type].toLowerCase()
        const matches =
          doc.name.toLowerCase().includes(q) ||
          doc.description.toLowerCase().includes(q) ||
          catLabel.includes(q) ||
          typeLabel.includes(q)
        if (!matches) return false
      }
      if (fCategory && doc.category !== fCategory) return false
      if (fType && doc.type !== fType) return false
      if (fLang && !doc.languages.includes(fLang)) return false
      return true
    })
  }, [docs, searchQuery, fCategory, fLang, fType])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, fCategory, fLang, fType])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageDocs = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage]
  )

  const stats = useMemo(() => {
    const categories = new Set(docs.map(d => d.category))
    const langs = new Set<LibraryLang>()
    docs.forEach(d => d.languages.forEach(l => langs.add(l)))
    return {
      total: docs.length,
      categories: categories.size,
      languages: langs.size,
    }
  }, [docs])

  const detailDoc = detailId ? docs.find(d => d.id === detailId) || null : null

  const hasActiveFilters = Boolean(searchQuery || fCategory || fLang || fType)

  const clearFilters = () => {
    setSearchQuery('')
    setFCategory('')
    setFLang('')
    setFType('')
  }

  const bumpMonth = useCallback((n: number) => {
    const ym = new Date().toISOString().slice(0, 7)
    const cur = readLS<{ ym: string; total: number }>('librairie_month', { ym: '', total: 0 })
    const next = cur.ym === ym ? { ym, total: cur.total + n } : { ym, total: n }
    writeLS('librairie_month', next)
    setMonthTotal(next.total)
  }, [])

  const bumpDownload = useCallback(
    (id: string, lang: LibraryLang | undefined, n: number) => {
      setDlCounts(prev => {
        const key = `${id}:${lang || '*'}`
        const next = { ...prev, [key]: (prev[key] || 0) + n }
        writeLS('librairie_dl_counts', next)
        return next
      })
    },
    []
  )

  const triggerBlobDownload = async (url: string, filename: string) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename.replace(/[\\/:*?"<>|]/g, '-')
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
      return true
    } catch {
      return false
    }
  }

  const handleDownload = async (template: RuntimeTemplate, lang?: LibraryLang) => {
    const url = resolveUrl(template, lang)
    if (!url) {
      toast('info', 'Le fichier de ce template est en préparation')
      return
    }
    const suffix = lang ? ` - ${LIBRARY_LANGUAGES[lang].nativeLabel}` : ''
    const ok = await triggerBlobDownload(url, `${template.name}${suffix}.pdf`)
    if (ok) {
      bumpDownload(template.id, lang, 1)
      bumpMonth(1)
      toast('success', `"${template.name}" téléchargé${lang ? ` (${LIBRARY_LANGUAGES[lang].label})` : ''}`)
    } else {
      toast('error', 'Échec du téléchargement')
    }
  }

  const handleDownloadAll = async (template: RuntimeTemplate) => {
    if (!template.languages.some(lang => hasFile(template, lang))) {
      toast('info', 'Le fichier de ce template est en préparation')
      return
    }
    for (const lang of template.languages) {
      await handleDownload(template, lang)
      await new Promise(r => setTimeout(r, 350))
    }
  }

  const handlePreview = (template: RuntimeTemplate, lang?: LibraryLang) => {
    const url = resolveUrl(template, lang)
    if (!url) {
      toast('info', 'Le fichier de ce template est en préparation')
      return
    }
    setPreview({ template, lang })
  }

  const handleShare = async (template: RuntimeTemplate) => {
    const url = resolveUrl(template)
    const absolute = url && !url.startsWith('blob:') ? new URL(url, window.location.origin).href : window.location.href
    try {
      await navigator.clipboard.writeText(absolute)
      toast('success', 'Lien copié dans le presse-papiers')
    } catch {
      toast('error', "Impossible de copier le lien")
    }
  }

  const handleDuplicate = (template: RuntimeTemplate) => {
    const copy: LibraryTemplate = {
      ...template,
      id: `${template.id}-copie-${Date.now()}`,
      name: `${template.name} (copie)`,
      custom: true,
      baseDownloads: 0,
    }
    const nextCustoms = [...customDocs, copy]
    setCustomDocs(nextCustoms)
    writeLS('librairie_custom', nextCustoms)
    toast('success', `"${template.name}" dupliqué`)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const nextHidden = Array.from(new Set([...hiddenIds, deleteTarget.id]))
      setHiddenIds(nextHidden)
      writeLS('librairie_hidden', nextHidden)
      if (deleteTarget.custom) {
        const nextCustoms = customDocs.filter(c => c.id !== deleteTarget.id)
        setCustomDocs(nextCustoms)
        writeLS('librairie_custom', nextCustoms)
      }
      toast('success', `"${deleteTarget.name}" supprimé de la librairie`)
      setDeleteTarget(null)
      if (detailId === deleteTarget.id) setDetailId(null)
    } finally {
      setDeleting(false)
    }
  }

  const openForm = (target: 'add' | RuntimeTemplate) => {
    if (target === 'add') {
      setFormName('')
      setFormDescription('')
      setFormCategory('vente')
      setFormType('mandat')
      setFormLangs(new Set(LIBRARY_ALL_LANGS))
      setFormFile(null)
    } else {
      setFormName(target.name)
      setFormDescription(target.description)
      setFormCategory(target.category)
      setFormType(target.type)
      setFormLangs(new Set(target.languages))
      setFormFile(null)
    }
    setFormOpen(target)
  }

  const handleFormSave = () => {
    if (!formOpen || !formName.trim()) return
    const baseData = {
      name: formName.trim(),
      description: formDescription.trim(),
      category: formCategory,
      type: formType,
      languages: Array.from(formLangs),
      updatedAt: new Date().toISOString().slice(0, 10),
    }
    if (formOpen === 'add') {
      const id = `custom-${Date.now()}`
      const entry: LibraryTemplate = { ...baseData, id, baseDownloads: 0, custom: true }
      const nextCustoms = [...customDocs, entry]
      setCustomDocs(nextCustoms)
      writeLS('librairie_custom', nextCustoms)
      if (formFile) {
        setSessionUrls(prev => ({ ...prev, [id]: URL.createObjectURL(formFile) }))
      }
      toast('success', `"${entry.name}" ajouté à la librairie`)
    } else {
      const target = formOpen as RuntimeTemplate
      if (target.custom) {
        const nextCustoms = customDocs.map(c => (c.id === target.id ? { ...c, ...baseData } : c))
        setCustomDocs(nextCustoms)
        writeLS('librairie_custom', nextCustoms)
      } else {
        const nextOverrides = { ...overrides, [target.id]: { ...overrides[target.id], ...baseData } }
        setOverrides(nextOverrides)
        writeLS('librairie_overrides', nextOverrides)
      }
      if (formFile) {
        setSessionUrls(prev => ({ ...prev, [target.id]: URL.createObjectURL(formFile) }))
      }
      toast('success', `"${baseData.name}" mis à jour`)
    }
    setFormOpen(null)
  }

  useEffect(() => {
    if (!preview) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreview(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [preview])

  const inputClass =
    'h-9 px-3 text-sm rounded-lg border border-border bg-background text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent'

  const statCards = [
    {
      label: 'Documents total',
      value: stats.total,
      sub: 'templates prêts à l\'emploi',
      icon: LibraryIcon,
      chipClass: 'bg-accent-light text-accent',
      delay: 0,
    },
    {
      label: 'Catégories',
      value: stats.categories,
      sub: 'familles de documents',
      icon: FolderOpen,
      chipClass: 'bg-violet-50 text-violet-600',
      delay: 0.05,
    },
    {
      label: 'Langues disponibles',
      value: stats.languages,
      sub: 'FR · EN · ES · DE · IT',
      icon: Globe,
      chipClass: 'bg-sky-50 text-sky-600',
      delay: 0.1,
    },
    {
      label: 'Téléchargés ce mois',
      value: monthTotal,
      sub: 'par toute l\'équipe',
      icon: TrendingUp,
      chipClass: 'bg-emerald-50 text-emerald-600',
      delay: 0.15,
    },
  ]

  const renderDocActions = (doc: RuntimeTemplate, compact = false) => (
    <div className={compact ? 'flex items-center gap-1' : 'flex items-center gap-2'}>
      <button
        onClick={e => {
          e.stopPropagation()
          handleDownload(doc)
        }}
        disabled={!hasFile(doc)}
        title={hasFile(doc) ? 'Télécharger' : 'Fichier en préparation'}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${
          compact ? 'w-8 h-8' : 'h-9 px-3 text-xs'
        } ${hasFile(doc) ? 'bg-[hsl(var(--button-bg))] text-white hover:bg-[hsl(var(--button-bg-hover))]' : 'bg-background text-text-secondary border border-border'}`}
      >
        <Download size={compact ? 14 : 13} />
        {!compact && 'Télécharger'}
      </button>
      <button
        onClick={e => {
          e.stopPropagation()
          handlePreview(doc)
        }}
        disabled={!hasFile(doc)}
        title={hasFile(doc) ? 'Aperçu' : 'Fichier en préparation'}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${
          compact ? 'w-8 h-8' : 'h-9 px-3 text-xs'
        } bg-card text-text border border-border hover:bg-background hover:border-text-secondary/30`}
      >
        <Eye size={compact ? 14 : 13} />
        {!compact && 'Aperçu'}
      </button>
    </div>
  )

  const renderGridCard = (doc: RuntimeTemplate, index: number) => {
    const color = LIBRARY_CATEGORIES[doc.category].color
    const TypeIcon = TYPE_ICONS[doc.type]
    return (
      <motion.div
        key={doc.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.25 }}
        onClick={() => setDetailId(doc.id)}
        className="group relative cursor-pointer bg-card rounded-xl border border-border/50 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-1" style={{ background: `linear-gradient(90deg, ${color}, ${hexA(color, 0.15)})` }} />
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
              style={{ backgroundColor: hexA(color, 0.1), color }}
            >
              <TypeIcon size={20} />
            </div>
            {hasFile(doc) ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-success/10 text-success border border-success/20">
                <CheckCircle2 size={11} />
                Disponible
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-warning/10 text-warning border border-warning/20">
                <Clock3 size={11} />
                En préparation
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold leading-snug line-clamp-2 min-h-[36px]">{doc.name}</h3>
          <p className="text-xs text-text-secondary line-clamp-2 mt-1 min-h-[32px]">{doc.description}</p>

          <div className="flex items-center gap-1.5 mt-3">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[11px] text-text-secondary truncate">
              {LIBRARY_CATEGORIES[doc.category].label} · {LIBRARY_TYPE_LABELS[doc.type]}
            </span>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
            <div className="flex items-center gap-1">
              {doc.languages.map(lang => (
                <span
                  key={lang}
                  title={LIBRARY_LANGUAGES[lang].label}
                  className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border border-border/60 bg-background text-text-secondary"
                >
                  {lang}
                </span>
              ))}
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] text-text-secondary/70">
              <Download size={11} />
              {downloadsOf(doc)}
            </span>
          </div>

          <div className="mt-4" onClick={e => e.stopPropagation()}>
            {renderDocActions(doc)}
          </div>
        </div>
      </motion.div>
    )
  }

  const renderListRow = (doc: RuntimeTemplate, index: number) => {
    const color = LIBRARY_CATEGORIES[doc.category].color
    const TypeIcon = TYPE_ICONS[doc.type]
    return (
      <motion.tr
        key={doc.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.02, duration: 0.15 }}
        onClick={() => setDetailId(doc.id)}
        className="hover:bg-background/50 transition-colors cursor-pointer"
      >
        <td className="px-4 py-3 text-xs text-text-secondary/60">{(safePage - 1) * PAGE_SIZE + index + 1}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexA(color, 0.1), color }}>
              <TypeIcon size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate max-w-[280px]">{doc.name}</p>
              <p className="text-[11px] text-text-secondary/70 truncate max-w-[280px]">{doc.description}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium rounded border whitespace-nowrap"
            style={{ backgroundColor: hexA(color, 0.08), color, borderColor: hexA(color, 0.25) }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            {LIBRARY_CATEGORIES[doc.category].label}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center gap-1 text-xs text-text-secondary whitespace-nowrap">
            <Globe size={12} className="text-text-secondary/60" />
            {doc.languages.length} langues
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
            <Download size={12} className="text-text-secondary/60" />
            {downloadsOf(doc)}
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
          {formatDate(doc.updatedAt)}
        </td>
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => handleDownload(doc)}
              disabled={!hasFile(doc)}
              title="Télécharger"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <Download size={14} />
            </button>
            <button
              onClick={() => handlePreview(doc)}
              disabled={!hasFile(doc)}
              title="Aperçu"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <Eye size={14} />
            </button>
            {admin && (
              <>
                <button
                  onClick={() => openForm(doc)}
                  title="Modifier"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setDeleteTarget(doc)}
                  title="Supprimer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-error hover:bg-error/10 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </td>
      </motion.tr>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-premium to-premium-light shadow-lg shadow-premium/25 flex items-center justify-center flex-shrink-0">
            <LibraryIcon size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Librairie</h1>
            <p className="text-sm text-text-secondary mt-0.5">Centralisation des documents templates de l&apos;agence</p>
          </div>
        </div>
        {admin && (
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => openForm('add')}>
            Ajouter un document
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: card.delay }}
              className="bg-card rounded-xl border border-border/50 shadow-card p-4 hover:shadow-card-hover transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">{card.label}</p>
                <div className={`p-2 rounded-lg ${card.chipClass}`}>
                  <Icon size={14} />
                </div>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-text-secondary/60 mt-0.5">{card.sub}</p>
            </motion.div>
          )
        })}
      </div>

      <div className="bg-card rounded-xl border border-border/50 shadow-card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60" />
            <input
              type="text"
              placeholder="Rechercher un document..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-8 text-sm rounded-lg border border-border bg-white shadow-sm text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary/60 hover:text-text"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="w-full sm:w-[190px]">
            <Select
              value={fCategory}
              onValueChange={v => setFCategory(v as LibraryCategoryKey | '')}
              options={[
                { value: '', label: 'Toutes les catégories' },
                ...LIBRARY_CATEGORY_ORDER.map(key => ({
                  value: key,
                  label: LIBRARY_CATEGORIES[key].label,
                  icon: CATEGORY_DOT_ICONS[key],
                })),
              ]}
              className="bg-white shadow-sm"
            />
          </div>

          <div className="w-full sm:w-[160px]">
            <Select
              value={fLang}
              onValueChange={v => setFLang(v as LibraryLang | '')}
              options={[
                { value: '', label: 'Toutes les langues' },
                ...LIBRARY_ALL_LANGS.map(code => ({
                  value: code,
                  label: LIBRARY_LANGUAGES[code].label,
                  icon: LANG_CODE_ICONS[code],
                })),
              ]}
              className="bg-white shadow-sm"
            />
          </div>

          <div className="w-full sm:w-[150px]">
            <Select
              value={fType}
              onValueChange={v => setFType(v as LibraryDocType | '')}
              options={[
                { value: '', label: 'Tous les types' },
                ...(Object.keys(LIBRARY_TYPE_LABELS) as LibraryDocType[]).map(key => ({
                  value: key,
                  label: LIBRARY_TYPE_LABELS[key],
                })),
              ]}
              className="bg-white shadow-sm"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="h-9 px-3 text-xs text-accent hover:text-accent/80 transition-colors flex items-center gap-1 border border-accent/30 rounded-lg flex-shrink-0"
            >
              <X size={12} /> Réinitialiser
            </button>
          )}

          <div className="flex ml-auto rounded-lg border border-border p-0.5 bg-white flex-shrink-0">
            <button
              onClick={() => setView('grid')}
              title="Vue grille"
              className={`w-8 h-7 rounded-md flex items-center justify-center transition-all ${
                view === 'grid' ? 'bg-accent text-white shadow-tab' : 'text-text-secondary hover:text-text'
              }`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setView('list')}
              title="Vue liste"
              className={`w-8 h-7 rounded-md flex items-center justify-center transition-all ${
                view === 'list' ? 'bg-accent text-white shadow-tab' : 'text-text-secondary hover:text-text'
              }`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 px-1">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <FileText size={16} className="text-accent" />
            Documents disponibles
            <span className="text-xs font-normal text-text-secondary">({filtered.length})</span>
          </h2>
          <p className="text-xs text-text-secondary/60">
            Affichage {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} sur {filtered.length} documents
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-card rounded-xl border border-border/50 shadow-card p-16 text-center">
            <Search size={32} className="mx-auto mb-3 text-text-secondary opacity-40" />
            <p className="text-sm text-text-secondary">Aucun document trouvé</p>
            <p className="text-xs text-text-secondary/60 mt-1">Essayez de modifier vos filtres</p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" className="mt-4 mx-auto" onClick={clearFilters}>
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {pageDocs.map((doc, i) => renderGridCard(doc, i))}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-background border-b border-border/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary w-10">#</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Document</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Catégorie</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Langues</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Téléch.</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Mise à jour</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary w-44">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {pageDocs.map((doc, i) => renderListRow(doc, i))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                  p === safePage
                    ? 'bg-accent text-white shadow-tab'
                    : 'border border-border text-text-secondary hover:text-text hover:bg-background'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(pageCount, p + 1))}
              disabled={safePage === pageCount}
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {detailDoc && (() => {
          const doc = detailDoc
          const color = LIBRARY_CATEGORIES[doc.category].color
          const CatIcon = CATEGORY_ICONS[doc.category]
          const available = hasFile(doc)
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setDetailId(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-2xl max-h-[90vh] bg-card rounded-2xl border border-border/50 shadow-modal flex flex-col overflow-hidden"
              >
                <div className="relative px-6 py-5 border-b border-border/40 overflow-hidden flex-shrink-0" style={{ background: `linear-gradient(135deg, ${hexA(color, 0.08)}, transparent 60%)` }}>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexA(color, 0.12), color }}>
                      <CatIcon size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold leading-tight pr-8">{doc.name}</h2>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium rounded border"
                          style={{ backgroundColor: hexA(color, 0.08), color, borderColor: hexA(color, 0.25) }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                          {LIBRARY_CATEGORIES[doc.category].label}
                        </span>
                        <span className="text-[11px] text-text-secondary">{LIBRARY_TYPE_LABELS[doc.type]}</span>
                        {available ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-success/10 text-success border border-success/20">
                            <CheckCircle2 size={10} />
                            Disponible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-warning/10 text-warning border border-warning/20">
                            <Clock3 size={10} />
                            En préparation
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setDetailId(null)}
                      className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5">
                  <section>
                    <h3 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5 mb-3">
                      <Info size={13} className="text-accent" />
                      Informations du document
                    </h3>
                    <div className="rounded-xl border border-border/50 divide-y divide-border/30 overflow-hidden">
                      {[
                        {
                          label: 'Nom',
                          value: <span className="text-sm font-medium">{doc.name}</span>,
                        },
                        {
                          label: 'Catégorie',
                          value: (
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded border"
                              style={{ backgroundColor: hexA(color, 0.08), color, borderColor: hexA(color, 0.25) }}
                            >
                              {LIBRARY_CATEGORIES[doc.category].label}
                            </span>
                          ),
                        },
                        {
                          label: 'Description',
                          value: <span className="text-sm text-text-secondary">{doc.description}</span>,
                        },
                        {
                          label: 'Langues disponibles',
                          value: (
                            <span className="inline-flex items-center gap-1.5 flex-wrap">
                              <Globe size={13} className="text-text-secondary/60" />
                              {doc.languages.map(l => (
                                <span key={l} className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border border-border/60 bg-background text-text-secondary">
                                  {l}
                                </span>
                              ))}
                              <span className="text-xs text-text-secondary">
                                ({doc.languages.map(l => LIBRARY_LANGUAGES[l].label).join(', ')})
                              </span>
                            </span>
                          ),
                        },
                        {
                          label: 'Dernière mise à jour',
                          value: (
                            <span className="inline-flex items-center gap-1.5 text-sm">
                              <CalendarDays size={13} className="text-text-secondary/60" />
                              {formatDate(doc.updatedAt)}
                            </span>
                          ),
                        },
                        {
                          label: 'Téléchargements',
                          value: (
                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                              <TrendingUp size={13} className="text-text-secondary/60" />
                              {downloadsOf(doc)}
                            </span>
                          ),
                        },
                      ].map(row => (
                        <div key={row.label} className="flex items-start gap-4 px-4 py-2.5">
                          <span className="w-40 flex-shrink-0 text-[11px] font-medium text-text-secondary uppercase tracking-wide pt-0.5">{row.label}</span>
                          <div className="flex-1 min-w-0">{row.value}</div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5 mb-3">
                      <Languages size={13} className="text-accent" />
                      Langues disponibles
                    </h3>
                    <div className="rounded-xl border border-border/50 divide-y divide-border/30 overflow-hidden">
                      {doc.languages.map(lang => {
                        const langAvailable = hasFile(doc, lang)
                        return (
                        <div key={lang} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-background/50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-9 h-7 rounded-md border border-border/60 bg-background flex items-center justify-center text-[10px] font-bold uppercase text-text-secondary flex-shrink-0">
                              {lang}
                            </span>
                            <span className="text-sm font-medium truncate">{LIBRARY_LANGUAGES[lang].label}</span>
                          </div>
                          {langAvailable ? (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button variant="outline" size="sm" icon={<Download size={12} />} onClick={() => handleDownload(doc, lang)}>
                                Télécharger
                              </Button>
                              <Button variant="ghost" size="sm" icon={<Eye size={12} />} onClick={() => handlePreview(doc, lang)}>
                                Aperçu
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[11px] italic text-text-secondary/50">Fichier en préparation</span>
                          )}
                        </div>
                        )
                      })}
                    </div>
                  </section>
                </div>

                <div className="border-t border-border/40 px-6 py-4 flex-shrink-0">
                  <h3 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <Zap size={13} className="text-accent" />
                    Actions
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Download size={13} />}
                      onClick={() => handleDownloadAll(doc)}
                      disabled={!available}
                    >
                      Télécharger toutes les langues
                    </Button>
                    <Button variant="outline" size="sm" icon={<Share2 size={13} />} onClick={() => handleShare(doc)}>
                      Partager
                    </Button>
                    {admin && (
                      <>
                        <Button variant="outline" size="sm" icon={<Pencil size={13} />} onClick={() => openForm(doc)}>
                          Modifier
                        </Button>
                        <Button variant="outline" size="sm" icon={<Copy size={13} />} onClick={() => handleDuplicate(doc)}>
                          Dupliquer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Trash2 size={13} />}
                          className="!text-error !border-error/30 hover:!bg-error/5"
                          onClick={() => setDeleteTarget(doc)}
                        >
                          Supprimer
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {preview && (() => {
          const url = resolveUrl(preview.template, preview.lang)
          const suffix = preview.lang ? ` — ${LIBRARY_LANGUAGES[preview.lang].label}` : ''
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setPreview(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-5xl h-[88vh] bg-card rounded-2xl border border-border/50 shadow-modal flex flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/40 flex-shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                      <FileText size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{preview.template.name}{suffix}</p>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wider">Aperçu du template</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => url && window.open(url, '_blank')}
                      title="Ouvrir dans un nouvel onglet"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
                    >
                      <ExternalLink size={15} />
                    </button>
                    <button
                      onClick={() => handleDownload(preview.template, preview.lang)}
                      className="flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-lg bg-[hsl(var(--button-bg))] text-white hover:bg-[hsl(var(--button-bg-hover))] transition-all"
                    >
                      <Download size={13} />
                      Télécharger
                    </button>
                    <button
                      onClick={() => setPreview(null)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 bg-gray-100">
                  {url && <iframe src={url} title={preview.template.name} className="w-full h-full border-0" />}
                </div>
              </motion.div>
            </div>
          )
        })()}
      </AnimatePresence>

      <Dialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer le document"
        size="sm"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle size={18} className="text-error" />
              </div>
              <div>
                <p className="text-sm text-text">
                  Voulez-vous vraiment supprimer <strong>{deleteTarget.name}</strong> ?
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  Le template sera retiré de la librairie pour toute l&apos;équipe.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Annuler
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={deleting ? undefined : <Trash2 size={14} />}
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        isOpen={!!formOpen}
        onClose={() => setFormOpen(null)}
        title={formOpen === 'add' ? 'Ajouter un document' : 'Modifier le document'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Nom du document *</label>
            <input
              type="text"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="Ex : Mandat de vente exclusif"
              className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Description</label>
            <textarea
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              rows={2}
              placeholder="Description du document..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Catégorie</label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value as LibraryCategoryKey)}
                className={`${inputClass} w-full`}
              >
                {LIBRARY_CATEGORY_ORDER.map(key => (
                  <option key={key} value={key}>{LIBRARY_CATEGORIES[key].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Type</label>
              <select
                value={formType}
                onChange={e => setFormType(e.target.value as LibraryDocType)}
                className={`${inputClass} w-full`}
              >
                {(Object.keys(LIBRARY_TYPE_LABELS) as LibraryDocType[]).map(key => (
                  <option key={key} value={key}>{LIBRARY_TYPE_LABELS[key]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Langues disponibles</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {LIBRARY_ALL_LANGS.map(code => {
                const active = formLangs.has(code)
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() =>
                      setFormLangs(prev => {
                        const next = new Set(prev)
                        if (next.has(code)) next.delete(code)
                        else next.add(code)
                        return next.size > 0 ? next : prev
                      })
                    }
                    className={`px-2.5 h-7 text-xs font-semibold uppercase rounded-lg border transition-all ${
                      active
                        ? 'bg-accent/10 border-accent/40 text-accent'
                        : 'bg-background border-border text-text-secondary/50 hover:text-text-secondary'
                    }`}
                  >
                    {code}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">
              Fichier PDF {formOpen === 'add' ? '' : '(remplacer le fichier actuel)'}
            </label>
            <label className="flex items-center justify-center gap-2 h-16 rounded-lg border border-dashed border-border bg-background cursor-pointer hover:border-accent/40 hover:bg-accent/5 transition-all text-text-secondary hover:text-accent">
              <FileUp size={16} />
              <span className="text-xs">
                {formFile ? formFile.name : 'Cliquer pour sélectionner un fichier PDF'}
              </span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={e => setFormFile(e.target.files?.[0] || null)}
              />
            </label>
            {formOpen !== 'add' && formOpen !== null && !formFile && hasFile(formOpen) && (
              <p className="text-[11px] text-text-secondary/60 mt-1">
                Laissez vide pour conserver le fichier actuel.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setFormOpen(null)}>
              Annuler
            </Button>
            <Button variant="primary" size="sm" icon={<CheckCircle2 size={14} />} onClick={handleFormSave} disabled={!formName.trim()}>
              {formOpen === 'add' ? 'Ajouter' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
