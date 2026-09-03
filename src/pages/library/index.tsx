import { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { ComponentType } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Library as LibraryIcon, Search, X, LayoutGrid, List, Download, Eye, Globe,
  FolderOpen, TrendingUp, FileText, Share2, Pencil, Trash2, Plus,
  ChevronLeft, ChevronRight, ChevronDown, AlertTriangle, Languages, CalendarDays, Copy,
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
import { useStageChrome } from '../../components/modules/calendar/useStageChrome'
import { useStageFormClasses, useStageModalButtons } from '../../components/modules/calendar/StageModal'
import { cn } from '../../lib/utils'
import {
  Stage,
  StageBadge,
  StageButton,
  OrbIcon,
  TiltCard,
  STAGE_HUES,
  useStageTheme,
} from '../../components/dashboard/Stage'
import type { StageHue } from '../../components/dashboard/Stage'

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

const CATEGORY_HUES: Record<LibraryCategoryKey, StageHue> = {
  vente: STAGE_HUES.fuchsia,
  location: STAGE_HUES.sky,
  baux: STAGE_HUES.emerald,
  interne: STAGE_HUES.violet,
  avenants: STAGE_HUES.amber,
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
  const { staged } = useStageChrome()
  const theme = useStageTheme()
  const isDark = theme === 'dark'

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
  const [filtersOpen, setFiltersOpen] = useState(true)

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
    if (!preview && !detailId) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (preview) setPreview(null)
        else if (detailId) setDetailId(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [preview, detailId])

  // Prevent background scroll while a fullscreen portal is open
  useEffect(() => {
    const locked = Boolean(detailId || preview)
    if (locked) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [detailId, preview])

  const heroText = staged
    ? isDark
      ? { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400/80', title: 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent', sub: 'text-sm text-slate-400' }
      : { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-teal-900/50', title: 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent', sub: 'text-sm text-teal-900/55' }
    : { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-text-secondary', title: 'text-text', sub: 'text-sm text-text-secondary' }

  const { input: stageInput, label: stageLabel } = useStageFormClasses()
  const stageBtns = useStageModalButtons()
  const ctrl = (extra?: string) => (staged ? stageInput(extra) : undefined)
  const sectionTitle = 'mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80'

  const renderGridCard = (doc: RuntimeTemplate, index: number) => {
    const hue = CATEGORY_HUES[doc.category]
    const TypeIcon = TYPE_ICONS[doc.type]
    const available = hasFile(doc)
    return (
      <motion.div
        key={doc.id}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <TiltCard className="h-full" onClick={() => setDetailId(doc.id)}>
          <div className="relative flex flex-col h-full p-5">
            {/* top accent */}
            <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${hue.a}, ${hue.b})`, boxShadow: `0 0 12px ${hue.glow}` }} />
            {/* header */}
            <div className="flex items-start justify-between mb-3">
              <OrbIcon icon={TypeIcon} hue={hue} size={46} radius={14} />
              <StageBadge variant={available ? 'ok' : 'warn'} className="text-[10px]">
                {available ? <span className="inline-flex items-center gap-1"><CheckCircle2 size={11} /> Disponible</span> : <span className="inline-flex items-center gap-1"><Clock3 size={11} /> En préparation</span>}
              </StageBadge>
            </div>

            <h3 className={`text-sm font-bold leading-snug line-clamp-2 min-h-[38px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{doc.name}</h3>
            <p className={`text-xs line-clamp-2 mt-1 min-h-[32px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{doc.description}</p>

            <div className="flex items-center gap-1.5 mt-3">
              <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: hue.line, boxShadow: `0 0 6px ${hue.glow}` }} />
              <span className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {LIBRARY_CATEGORIES[doc.category].label} · {LIBRARY_TYPE_LABELS[doc.type]}
              </span>
            </div>

            <div className={`flex items-center justify-between mt-3 pt-3 border-t ${isDark ? 'border-white/8' : 'border-teal-900/8'}`}>
              <div className="flex items-center gap-1">
                {doc.languages.map(lang => (
                  <span
                    key={lang}
                    title={LIBRARY_LANGUAGES[lang].label}
                    className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border ${isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-teal-900/10 text-slate-600'}`}
                  >
                    {lang}
                  </span>
                ))}
              </div>
              <span className={`inline-flex items-center gap-1 text-[11px] tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <Download size={11} />
                {downloadsOf(doc)}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <StageButton
                variant="primary"
                size="sm"
                icon={<Download size={13} />}
                onClick={available ? () => handleDownload(doc) : undefined}
                className={!available ? 'opacity-40 pointer-events-none' : ''}
              >
                Télécharger
              </StageButton>
              <StageButton
                variant="glass"
                size="sm"
                icon={<Eye size={13} />}
                onClick={available ? () => handlePreview(doc) : undefined}
                className={!available ? 'opacity-40 pointer-events-none' : ''}
              >
                Aperçu
              </StageButton>
            </div>
          </div>
        </TiltCard>
      </motion.div>
    )
  }

  return (
    <Stage theme={theme}>
      <div className="space-y-6">
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              </span>
              <p className={heroText.eyebrow}>Mission control · Librairie</p>
            </div>
            <h1 className={`mt-1 text-3xl font-extrabold tracking-tight ${heroText.title}`}>Librairie</h1>
            <p className={`mt-0.5 ${heroText.sub}`}>Centralisation des documents templates de l'agence</p>
          </div>
          {admin && (
            <StageButton variant="primary" size="md" icon={<Plus size={15} />} onClick={() => openForm('add')}>
              Ajouter un document
            </StageButton>
          )}
        </div>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Documents total', value: stats.total, sub: "templates prêts à l'emploi", icon: LibraryIcon, hue: STAGE_HUES.violet },
            { label: 'Catégories', value: stats.categories, sub: 'familles de documents', icon: FolderOpen, hue: STAGE_HUES.sky },
            { label: 'Langues', value: stats.languages, sub: 'FR · EN · ES · DE · IT', icon: Globe, hue: STAGE_HUES.emerald },
            { label: 'Téléchargés ce mois', value: monthTotal, sub: "par toute l'équipe", icon: TrendingUp, hue: STAGE_HUES.amber },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="stage-glass flex items-center gap-3.5 p-4 h-full">
                <OrbIcon icon={card.icon} hue={card.hue} size={42} radius={13} />
                <div className="min-w-0">
                  <p className={`text-[10px] font-bold uppercase tracking-[1.4px] ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>{card.label}</p>
                  <p className={`text-2xl font-extrabold leading-none tracking-tight tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{card.value}</p>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{card.sub}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Command bar — 3D glass fields like add/modify event modal ─────── */}
        <div
          className={cn(
            'overflow-hidden',
            staged ? 'pop-glass rounded-3xl' : 'stage-glass rounded-2xl',
            staged && isDark && 'border border-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]',
            staged && !isDark && 'border border-white/80 shadow-[0_20px_60px_-20px_rgba(13,148,136,0.25)]',
          )}
        >
          <div
            className="h-[3px] w-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${isDark ? 'rgba(139,124,255,0.9)' : 'rgba(20,184,166,0.9)'} 18%, ${isDark ? '#8B7CFF' : '#14B8A6'} 50%, transparent)`,
            }}
          />
          <div
            className="px-5 pt-5 pb-4 space-y-5"
            style={
              staged
                ? {
                    background: `radial-gradient(90% 140% at 0% 0%, ${isDark ? 'rgba(139,124,255,0.07)' : 'rgba(20,184,166,0.06)'}, transparent 65%)`,
                  }
                : undefined
            }
          >
            {/* Recherche */}
            <section>
              <p className={`${sectionTitle} ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                <span className="h-px w-4 bg-gradient-to-r from-violet-400 to-transparent" />
                Recherche
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 min-w-0">
                  <label className={stageLabel}>Rechercher un document</label>
                  <div className="relative">
                    <Search
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: isDark ? '#8B7CFF' : '#0D9488' }}
                    />
                    <input
                      type="text"
                      placeholder="Rechercher par nom, catégorie ou type..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className={stageInput('h-10 pl-9 pr-9')}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className={cn(
                          'absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                          isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-teal-900/40 hover:text-teal-900 hover:bg-teal-900/5',
                        )}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={cn(
                      'flex rounded-xl border p-1 gap-1',
                      staged
                        ? isDark
                          ? 'border-white/10 bg-white/[0.04]'
                          : 'border-teal-900/10 bg-white/70'
                        : 'border-border bg-card',
                    )}
                  >
                    <button
                      onClick={() => setView('grid')}
                      title="Vue grille"
                      className={cn(
                        'w-9 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
                        view === 'grid'
                          ? 'text-white shadow-lg'
                          : staged
                            ? isDark
                              ? 'text-slate-400 hover:text-white hover:bg-white/5'
                              : 'text-teal-900/60 hover:text-teal-900 hover:bg-white'
                            : 'text-text-secondary hover:text-text',
                      )}
                      style={
                        view === 'grid'
                          ? {
                              backgroundImage: isDark ? 'linear-gradient(135deg, #8B7CFF, #6C5ECF)' : 'linear-gradient(135deg, #2DD4BF, #0D9488)',
                              boxShadow: isDark ? '0 4px 14px -4px rgba(124,92,255,0.6)' : '0 4px 14px -4px rgba(13,148,136,0.5)',
                            }
                          : undefined
                      }
                    >
                      <LayoutGrid size={14} />
                    </button>
                    <button
                      onClick={() => setView('list')}
                      title="Vue liste"
                      className={cn(
                        'w-9 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
                        view === 'list'
                          ? 'text-white shadow-lg'
                          : staged
                            ? isDark
                              ? 'text-slate-400 hover:text-white hover:bg-white/5'
                              : 'text-teal-900/60 hover:text-teal-900 hover:bg-white'
                            : 'text-text-secondary hover:text-text',
                      )}
                      style={
                        view === 'list'
                          ? {
                              backgroundImage: isDark ? 'linear-gradient(135deg, #8B7CFF, #6C5ECF)' : 'linear-gradient(135deg, #2DD4BF, #0D9488)',
                              boxShadow: isDark ? '0 4px 14px -4px rgba(124,92,255,0.6)' : '0 4px 14px -4px rgba(13,148,136,0.5)',
                            }
                          : undefined
                      }
                    >
                      <List size={14} />
                    </button>
                  </div>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className={cn(stageBtns.ghost, 'h-10 whitespace-nowrap')}>
                      <X size={12} />
                      Réinitialiser
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Filtres — collapsible */}
            <section>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(o => !o)}
                  className="group flex items-center gap-2 text-left"
                >
                  <p className={`${sectionTitle} !mb-0 ${isDark ? 'text-sky-400' : 'text-sky-600'} group-hover:opacity-100 transition-opacity`}>
                    <span className="h-px w-4 bg-gradient-to-r from-sky-400 to-transparent" />
                    Filtres
                    {(fCategory || fLang || fType) && (
                      <span
                        className={cn(
                          'ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold',
                          isDark
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                            : 'bg-sky-500/15 text-sky-700 border border-sky-500/20',
                        )}
                      >
                        {(fCategory ? 1 : 0) + (fLang ? 1 : 0) + (fType ? 1 : 0)}
                      </span>
                    )}
                  </p>
                  <motion.span
                    animate={{ rotate: filtersOpen ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-lg border transition-colors',
                      staged
                        ? isDark
                          ? 'border-white/10 bg-white/[0.04] text-slate-400 group-hover:bg-white/10 group-hover:text-white'
                          : 'border-teal-900/10 bg-white/60 text-teal-900/50 group-hover:bg-white group-hover:text-teal-900'
                        : 'border-border bg-card text-text-secondary',
                    )}
                  >
                    <ChevronDown size={13} />
                  </motion.span>
                </button>
                <div className="flex items-center gap-2">
                  {(fCategory || fLang || fType) && (
                    <button
                      onClick={clearFilters}
                      className={cn(
                        'inline-flex items-center gap-1 text-[11px] font-semibold transition-colors',
                        isDark ? 'text-slate-400 hover:text-white' : 'text-teal-900/60 hover:text-teal-900',
                      )}
                    >
                      <X size={11} />
                      Effacer
                    </button>
                  )}
                  <span className={cn('text-[11px]', isDark ? 'text-slate-500' : 'text-slate-400')}>
                    {filtersOpen ? 'Réduire' : 'Développer'}
                  </span>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {filtersOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-3 sm:grid-cols-3 pt-3">
                      <div>
                        <label className={stageLabel}>Catégorie</label>
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
                          className={ctrl('h-10')}
                        />
                      </div>
                      <div>
                        <label className={stageLabel}>Langue</label>
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
                          className={ctrl('h-10')}
                        />
                      </div>
                      <div>
                        <label className={stageLabel}>Type</label>
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
                          className={ctrl('h-10')}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!filtersOpen && (fCategory || fLang || fType) && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {fCategory && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border',
                        isDark
                          ? 'bg-white/[0.06] border-white/10 text-slate-300'
                          : 'bg-teal-50 border-teal-900/10 text-teal-800',
                      )}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: LIBRARY_CATEGORIES[fCategory].color }} />
                      {LIBRARY_CATEGORIES[fCategory].label}
                    </span>
                  )}
                  {fLang && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border uppercase',
                        isDark
                          ? 'bg-white/[0.06] border-white/10 text-slate-300'
                          : 'bg-white border-teal-900/10 text-teal-800',
                      )}
                    >
                      <Globe size={11} />
                      {LIBRARY_LANGUAGES[fLang].label}
                    </span>
                  )}
                  {fType && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border',
                        isDark
                          ? 'bg-white/[0.06] border-white/10 text-slate-300'
                          : 'bg-white border-teal-900/10 text-teal-800',
                      )}
                    >
                      <FileText size={11} />
                      {LIBRARY_TYPE_LABELS[fType]}
                    </span>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ── Documents ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: isDark ? 'rgba(139,124,255,0.12)' : 'rgba(13,148,136,0.10)', border: `1px solid ${isDark ? 'rgba(139,124,255,0.18)' : 'rgba(13,148,136,0.15)'}` }}>
                <FileText size={13} style={{ color: isDark ? '#8B7CFF' : '#0D9488' }} />
              </span>
              Documents disponibles
              <StageBadge variant="neutral" className="ml-1">{filtered.length}</StageBadge>
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Affichage {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} sur {filtered.length}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="stage-glass p-12 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}` }}>
                <Search size={22} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
              </div>
              <p className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Aucun document trouvé</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Essayez de modifier vos filtres</p>
              {hasActiveFilters && (
                <div className="mt-4 flex justify-center">
                  <StageButton variant="glass" size="sm" onClick={clearFilters}>Réinitialiser les filtres</StageButton>
                </div>
              )}
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {pageDocs.map((doc, i) => renderGridCard(doc, i))}
            </div>
          ) : (
            <div className="stage-glass overflow-hidden p-0">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-teal-900/5 bg-slate-50/60'}`}>
                      <th className={`text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'} w-10`}>#</th>
                      <th className={`text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Document</th>
                      <th className={`text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Catégorie</th>
                      <th className={`text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Langues</th>
                      <th className={`text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Téléch.</th>
                      <th className={`text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Mise à jour</th>
                      <th className={`text-right px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'} w-44`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                    {pageDocs.map((doc, index) => {
                      const hue = CATEGORY_HUES[doc.category]
                      const TypeIcon = TYPE_ICONS[doc.type]
                      return (
                        <motion.tr
                          key={doc.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02, duration: 0.25 }}
                          onClick={() => setDetailId(doc.id)}
                          className={`group relative cursor-pointer transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-teal-50/50'}`}
                        >
                          <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{(safePage - 1) * PAGE_SIZE + index + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${hue.a}18, ${hue.b}10)`, border: `1px solid ${hue.a}20`, boxShadow: `0 2px 8px ${hue.glow}` }}>
                                <TypeIcon size={15} style={{ color: hue.a }} />
                              </div>
                              <div className="min-w-0">
                                <p className={`text-sm font-semibold truncate max-w-[280px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{doc.name}</p>
                                <p className={`text-[11px] truncate max-w-[280px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{doc.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold rounded-lg border whitespace-nowrap"
                              style={{ backgroundColor: `${hue.a}12`, color: hue.a, borderColor: `${hue.a}22` }}
                            >
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hue.line, boxShadow: `0 0 6px ${hue.glow}` }} />
                              {LIBRARY_CATEGORIES[doc.category].label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} whitespace-nowrap`}>
                              <Globe size={12} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                              {doc.languages.length} langues
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              <Download size={12} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                              {downloadsOf(doc)}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-xs whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {formatDate(doc.updatedAt)}
                          </td>
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleDownload(doc)}
                                disabled={!hasFile(doc)}
                                title="Télécharger"
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                              >
                                <Download size={14} />
                              </button>
                              <button
                                onClick={() => handlePreview(doc)}
                                disabled={!hasFile(doc)}
                                title="Aperçu"
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                              >
                                <Eye size={14} />
                              </button>
                              {admin && (
                                <>
                                  <button
                                    onClick={() => openForm(doc)}
                                    title="Modifier"
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget(doc)}
                                    title="Supprimer"
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
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
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none ${isDark ? 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5' : 'border-teal-900/10 text-slate-500 hover:text-slate-900 hover:bg-white'}`}
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    p === safePage
                      ? 'text-white shadow-lg'
                      : isDark ? 'border border-white/10 text-slate-400 hover:text-white hover:bg-white/5' : 'border border-teal-900/10 text-slate-500 hover:text-slate-900 hover:bg-white'
                  }`}
                  style={p === safePage ? { backgroundImage: isDark ? 'linear-gradient(135deg, #8B7CFF, #6C5ECF)' : 'linear-gradient(135deg, #2DD4BF, #0D9488)' } : undefined}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                disabled={safePage === pageCount}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none ${isDark ? 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5' : 'border-teal-900/10 text-slate-500 hover:text-slate-900 hover:bg-white'}`}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>

        {/* ── Detail modal — portalled to body, covers entire viewport (sidebar + topbar) ── */}
        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {detailDoc && (() => {
              const doc = detailDoc
              const hue = CATEGORY_HUES[doc.category]
              const CatIcon = CATEGORY_ICONS[doc.category]
              const available = hasFile(doc)
              return (
                <motion.div
                  className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={e => e.stopPropagation()}
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setDetailId(null)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl border flex flex-col overflow-hidden"
                    style={{
                      background: isDark ? 'linear-gradient(180deg, rgba(17,24,50,0.98), rgba(9,13,30,0.99))' : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.99))',
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                      boxShadow: isDark ? '0 24px 60px -18px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.06)' : '0 24px 60px -20px rgba(13,148,136,0.35), inset 0 1px 0 rgba(255,255,255,1)',
                    }}
                  >
                    <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${hue.a}, ${hue.b})` }} />
                    <div className="relative px-6 py-5 border-b flex-shrink-0" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)', background: `radial-gradient(ellipse at 20% 0%, ${hue.glow}, transparent 60%)` }}>
                      <div className="flex items-start gap-3">
                        <OrbIcon icon={CatIcon} hue={hue} size={48} radius={14} />
                        <div className="min-w-0 flex-1">
                          <h2 className={`text-lg font-extrabold leading-tight pr-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>{doc.name}</h2>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold rounded-lg border"
                              style={{ backgroundColor: `${hue.a}12`, color: hue.a, borderColor: `${hue.a}22` }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hue.line, boxShadow: `0 0 6px ${hue.glow}` }} />
                              {LIBRARY_CATEGORIES[doc.category].label}
                            </span>
                            <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{LIBRARY_TYPE_LABELS[doc.type]}</span>
                            <StageBadge variant={available ? 'ok' : 'warn'}>{available ? 'Disponible' : 'En préparation'}</StageBadge>
                          </div>
                        </div>
                        <button
                          onClick={() => setDetailId(null)}
                          className={`absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${isDark ? 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900'}`}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    <div
                      className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5"
                      style={{
                        overscrollBehavior: 'contain',
                        WebkitOverflowScrolling: 'touch' as any,
                        transform: 'translateZ(0)',
                        willChange: 'scroll-position',
                        scrollBehavior: 'smooth' as any,
                      }}
                    >
                    <section>
                      <h3 className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <Info size={13} style={{ color: hue.a }} />
                        Informations du document
                      </h3>
                      <div className={`rounded-xl border divide-y overflow-hidden ${isDark ? 'border-white/8 divide-white/5' : 'border-slate-200 divide-slate-100'}`}>
                        {[
                          {
                            label: 'Nom',
                            value: <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{doc.name}</span>,
                          },
                          {
                            label: 'Catégorie',
                            value: (
                              <span
                                className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold rounded-lg border"
                                style={{ backgroundColor: `${hue.a}12`, color: hue.a, borderColor: `${hue.a}22` }}
                              >
                                {LIBRARY_CATEGORIES[doc.category].label}
                              </span>
                            ),
                          },
                          {
                            label: 'Description',
                            value: <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{doc.description}</span>,
                          },
                          {
                            label: 'Langues',
                            value: (
                              <span className="inline-flex items-center gap-1.5 flex-wrap">
                                <Globe size={13} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                                {doc.languages.map(l => (
                                  <span key={l} className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border ${isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                                    {l}
                                  </span>
                                ))}
                              </span>
                            ),
                          },
                          {
                            label: 'Mise à jour',
                            value: (
                              <span className={`inline-flex items-center gap-1.5 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                <CalendarDays size={13} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                                {formatDate(doc.updatedAt)}
                              </span>
                            ),
                          },
                          {
                            label: 'Téléchargements',
                            value: (
                              <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                <TrendingUp size={13} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                                {downloadsOf(doc)}
                              </span>
                            ),
                          },
                        ].map(row => (
                          <div key={row.label} className="flex items-start gap-4 px-4 py-2.5">
                            <span className={`w-40 flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide pt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{row.label}</span>
                            <div className="flex-1 min-w-0">{row.value}</div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <Languages size={13} style={{ color: hue.a }} />
                        Langues disponibles
                      </h3>
                      <div className={`rounded-xl border divide-y overflow-hidden ${isDark ? 'border-white/8 divide-white/5' : 'border-slate-200 divide-slate-100'}`}>
                        {doc.languages.map(lang => {
                          const langAvailable = hasFile(doc, lang)
                          return (
                            <div key={lang} className={`flex items-center justify-between gap-3 px-4 py-2.5 transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'}`}>
                              <div className="flex items-center gap-3 min-w-0">
                                <span className={`w-9 h-7 rounded-lg border flex items-center justify-center text-[10px] font-bold uppercase flex-shrink-0 ${isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                                  {lang}
                                </span>
                                <span className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{LIBRARY_LANGUAGES[lang].label}</span>
                              </div>
                              {langAvailable ? (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <StageButton variant="glass" size="sm" icon={<Download size={12} />} onClick={() => handleDownload(doc, lang)}>
                                    Télécharger
                                  </StageButton>
                                  <StageButton variant="glass" size="sm" icon={<Eye size={12} />} onClick={() => handlePreview(doc, lang)}>
                                    Aperçu
                                  </StageButton>
                                </div>
                              ) : (
                                <span className={`text-[11px] italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Fichier en préparation</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  </div>

                  <div className={`border-t px-6 py-4 flex-shrink-0 ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'}`}>
                    <h3 className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <Zap size={13} style={{ color: hue.a }} />
                      Actions
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StageButton
                        variant="primary"
                        size="sm"
                        icon={<Download size={13} />}
                        onClick={() => handleDownloadAll(doc)}
                        className={!available ? 'opacity-40 pointer-events-none' : ''}
                      >
                        Télécharger toutes les langues
                      </StageButton>
                      <StageButton variant="glass" size="sm" icon={<Share2 size={13} />} onClick={() => handleShare(doc)}>
                        Partager
                      </StageButton>
                      {admin && (
                        <>
                          <StageButton variant="glass" size="sm" icon={<Pencil size={13} />} onClick={() => openForm(doc)}>
                            Modifier
                          </StageButton>
                          <StageButton variant="glass" size="sm" icon={<Copy size={13} />} onClick={() => handleDuplicate(doc)}>
                            Dupliquer
                          </StageButton>
                          <button
                            onClick={() => setDeleteTarget(doc)}
                            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-xl border text-rose-400 border-rose-400/20 bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
                          >
                            <Trash2 size={13} />
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )
          })()}
          </AnimatePresence>,
          document.body,
        )}

        {/* ── Preview modal — portalled full viewport, like dossier de completion ── */}
        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {preview && (() => {
              const url = resolveUrl(preview.template, preview.lang)
              const suffix = preview.lang ? ` — ${LIBRARY_LANGUAGES[preview.lang].label}` : ''
              return (
                <motion.div
                  className="fixed inset-0 z-[100] flex flex-col p-2 sm:p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={e => e.stopPropagation()}
                >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                  onClick={() => setPreview(null)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 12 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  className="relative w-full h-full flex flex-col overflow-hidden rounded-2xl border"
                  style={{
                    background: isDark ? '#0F1220' : '#FFF',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                    boxShadow: isDark ? '0 24px 80px -18px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.06)' : '0 24px 80px -20px rgba(13,148,136,0.4), inset 0 1px 0 rgba(255,255,255,1)',
                  }}
                >
                  <div className={`flex items-center justify-between gap-3 px-4 py-3 border-b flex-shrink-0 ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <OrbIcon icon={FileText} hue={STAGE_HUES.violet} size={34} radius={10} />
                      <div className="min-w-0">
                        <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{preview.template.name}{suffix}</p>
                        <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Aperçu du template — plein écran</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => url && window.open(url, '_blank')}
                        title="Ouvrir dans un nouvel onglet"
                        className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${isDark ? 'border-white/10 bg-white/5 text-slate-400 hover:text-white' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900'}`}
                      >
                        <ExternalLink size={15} />
                      </button>
                      <StageButton variant="primary" size="sm" icon={<Download size={13} />} onClick={() => handleDownload(preview.template, preview.lang)}>
                        Télécharger
                      </StageButton>
                      <button
                        onClick={() => setPreview(null)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${isDark ? 'border-white/10 bg-white/5 text-slate-400 hover:text-white' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900'}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <div
                    className="flex-1 bg-gray-100 overflow-hidden"
                    style={{
                      WebkitOverflowScrolling: 'touch' as any,
                      transform: 'translateZ(0)',
                    }}
                  >
                    {url && <iframe src={url} title={preview.template.name} className="w-full h-full border-0" style={{ display: 'block' }} />}
                  </div>
                </motion.div>
              </motion.div>
            )
          })()}
          </AnimatePresence>,
          document.body,
        )}

        <Dialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Supprimer le document"
          size="sm"
        >
          {deleteTarget && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={18} className="text-rose-500" />
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    Voulez-vous vraiment supprimer <strong>{deleteTarget.name}</strong> ?
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    Le template sera retiré de la librairie pour toute l'équipe.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <StageButton variant="glass" size="sm" onClick={() => setDeleteTarget(null)} className={deleting ? 'opacity-50 pointer-events-none' : ''}>
                  Annuler
                </StageButton>
                <StageButton
                  variant="primary"
                  size="sm"
                  icon={deleting ? undefined : <Trash2 size={14} />}
                  onClick={deleting ? undefined : handleDeleteConfirm}
                  className={`${deleting ? 'opacity-50 pointer-events-none' : ''} !bg-gradient-to-r !from-rose-500 !to-red-600`}
                >
                  {deleting ? 'Suppression...' : 'Supprimer'}
                </StageButton>
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
              <label className={`text-xs font-semibold mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Nom du document *</label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Ex : Mandat de vente exclusif"
                className={`w-full h-10 px-3 text-sm rounded-xl border outline-none transition-all ${isDark ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-slate-500 focus:border-violet-400/40' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-teal-500/30'}`}
              />
            </div>

            <div>
              <label className={`text-xs font-semibold mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Description</label>
              <textarea
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                rows={2}
                placeholder="Description du document..."
                className={`w-full px-3 py-2.5 text-sm rounded-xl border outline-none resize-none transition-all ${isDark ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-slate-500 focus:border-violet-400/40' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-teal-500/30'}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-xs font-semibold mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Catégorie</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value as LibraryCategoryKey)}
                  className={`w-full h-10 px-3 text-sm rounded-xl border outline-none transition-all ${isDark ? 'bg-white/[0.04] border-white/10 text-white focus:border-violet-400/40' : 'bg-white border-slate-200 text-slate-900 focus:border-teal-500/30'}`}
                >
                  {LIBRARY_CATEGORY_ORDER.map(key => (
                    <option key={key} value={key}>{LIBRARY_CATEGORIES[key].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`text-xs font-semibold mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Type</label>
                <select
                  value={formType}
                  onChange={e => setFormType(e.target.value as LibraryDocType)}
                  className={`w-full h-10 px-3 text-sm rounded-xl border outline-none transition-all ${isDark ? 'bg-white/[0.04] border-white/10 text-white focus:border-violet-400/40' : 'bg-white border-slate-200 text-slate-900 focus:border-teal-500/30'}`}
                >
                  {(Object.keys(LIBRARY_TYPE_LABELS) as LibraryDocType[]).map(key => (
                    <option key={key} value={key}>{LIBRARY_TYPE_LABELS[key]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={`text-xs font-semibold mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Langues disponibles</label>
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
                      className={`px-2.5 h-7 text-xs font-bold uppercase rounded-xl border transition-all ${
                        active
                          ? isDark ? 'bg-violet-500/15 border-violet-400/30 text-violet-300' : 'bg-teal-500/10 border-teal-500/25 text-teal-700'
                          : isDark ? 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {code}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className={`text-xs font-semibold mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Fichier PDF {formOpen === 'add' ? '' : '(remplacer le fichier actuel)'}
              </label>
              <label className={`flex items-center justify-center gap-2 h-16 rounded-xl border border-dashed cursor-pointer transition-all ${isDark ? 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-violet-400/30 hover:bg-violet-500/5 hover:text-violet-300' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-teal-500/30 hover:bg-teal-50 hover:text-teal-700'}`}>
                <FileUp size={16} />
                <span className="text-xs font-medium">
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
                <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Laissez vide pour conserver le fichier actuel.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <StageButton variant="glass" size="sm" onClick={() => setFormOpen(null)}>
                Annuler
              </StageButton>
              <StageButton variant="primary" size="sm" icon={<CheckCircle2 size={14} />} onClick={!formName.trim() ? undefined : handleFormSave} className={!formName.trim() ? 'opacity-50 pointer-events-none' : ''}>
                {formOpen === 'add' ? 'Ajouter' : 'Enregistrer'}
              </StageButton>
            </div>
          </div>
        </Dialog>
      </div>
    </Stage>
  )
}
