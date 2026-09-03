import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import type { TimelineEvent, Property } from '../../../types/property'
import {
  Clock, User, FileText, Plus,
  CheckCircle, XCircle, MessageSquare, Users, Globe,
  Download, Search, X, Filter, ChevronLeft, ChevronRight,
  Eye, Tag, Edit3, Trash2, RefreshCw, Archive,
  AlertCircle, Info, Camera, Share2, DollarSign,
  ArrowDownRight, Calendar
} from 'react-feather'
import { Select } from '../../ui/Select'
import { DatePicker } from '../../ui/DatePicker'
import { SearchInput } from '../../ui/SearchInput'
import { getActionsForPropertyType, getActionCategoryLabel, getCategoryColor, getCategoryBgColor, ACTION_META } from '../../../types/actions'
import type { ActionCategory, ActionType as ActionTypeDef } from '../../../types/actions'
import { addTimelineEvent, deleteTimelineEvent as deleteTimelineEventApi, updateTimelineEvent as updateTimelineEventApi, fetchTimeline } from '../../../services/propertyService'
import { useStageChrome } from '../calendar/useStageChrome'
import {
  OrbIcon, TiltCard, StageBadge, StageButton,
  STAGE_HUES, SLATE_HUE, AnimatedNumber,
} from '../../dashboard/Stage'
import type { StageHue } from '../../dashboard/Stage'

const ALL_CATEGORIES: ActionCategory[] = [
  'creation', 'modification', 'statut', 'mandat', 'visite', 'offre',
  'document', 'commentaire', 'agent', 'client', 'transfert', 'systeme',
  'location', 'bail', 'reservation', 'sejour', 'paiement', 'diligence',
]

const ICON_MAP: Record<string, React.ReactNode> = {
  Plus:              <Plus size={14} />,
  DollarSign:        <DollarSign size={14} />,
  Edit3:             <Edit3 size={14} />,
  Camera:            <Camera size={14} />,
  Trash2:            <Trash2 size={14} />,
  Tag:               <Tag size={14} />,
  FileText:          <FileText size={14} />,
  MessageSquare:     <MessageSquare size={14} />,
  User:              <User size={14} />,
  Users:             <Users size={14} />,
  Globe:             <Globe size={14} />,
  X:                 <X size={14} />,
  Download:          <Download size={14} />,
  Share2:            <Share2 size={14} />,
  Archive:           <Archive size={14} />,
  RefreshCw:         <RefreshCw size={14} />,
  AlertCircle:       <AlertCircle size={14} />,
  ArrowDownRight:    <ArrowDownRight size={14} />,
  CheckCircle:       <CheckCircle size={14} />,
  XCircle:           <XCircle size={14} />,
  Calendar:          <Calendar size={14} />,
  Eye:               <Eye size={14} />,
  Search:            <Search size={14} />,
  Info:              <Info size={14} />,
}

const ICON_COMPONENTS: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  Plus, DollarSign, Edit3, Camera, Trash2, Tag, FileText, MessageSquare,
  User, Users, Globe, X, Download, Share2, Archive, RefreshCw,
  AlertCircle, ArrowDownRight, CheckCircle, XCircle, Calendar, Eye, Search, Info,
}

interface ActionMeta {
  category: ActionCategory
  label: string
  icon: React.ReactNode
  iconComponent: React.ComponentType<{ size?: number | string; className?: string }>
  color: string
  bgColor: string
}

function getActionMeta(type: string): ActionMeta {
  const found = ACTION_META[type]
  if (found) {
    return {
      category: found.category as ActionCategory,
      label: found.label,
      icon: ICON_MAP[found.icon] || <Info size={14} />,
      iconComponent: ICON_COMPONENTS[found.icon] || Info,
      color: found.color,
      bgColor: found.bgColor,
    }
  }
  return {
    category: 'systeme' as ActionCategory,
    label: type.replace(/_/g, ' '),
    icon: <Info size={14} />,
    iconComponent: Info,
    color: '#78716c',
    bgColor: '#f5f5f4',
  }
}

function getCategoryFromType(type: string): ActionCategory {
  const found = ACTION_META[type]
  if (found) return found.category as ActionCategory
  return 'systeme'
}



function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return {
    full: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    dateTime: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
    iso: d.toISOString().slice(0, 16),
  }
}

interface PropertyTimelineProps {
  propertyId: string
  events?: TimelineEvent[]
  property?: Property
  isAdmin?: boolean
  currentAgent?: string
  propertyType?: string
  transactionType?: string
  isGerant?: boolean
}

export const PropertyTimeline = ({ propertyId, events: propEvents, property, isAdmin = false, currentAgent, propertyType, transactionType, isGerant = false }: PropertyTimelineProps) => {
  const { staged, dark } = useStageChrome()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ActionCategory | 'all'>('all')
  const [authorFilter, setAuthorFilter] = useState<string>('all')
  const [periodFilter, setPeriodFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [deletingEvent, setDeletingEvent] = useState<TimelineEvent | null>(null)
  const [showAddNote, setShowAddNote] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [showAddAction, setShowAddAction] = useState(false)
  const [newActionType, setNewActionType] = useState('')
  const [newActionNotes, setNewActionNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportBtnRef = useRef<HTMLButtonElement>(null)
  const [exportRect, setExportRect] = useState<{ top: number; right: number } | null>(null)
  const [apiEvents, setApiEvents] = useState<TimelineEvent[]>([])
  const [loadingTimeline, setLoadingTimeline] = useState(true)
  const [timelineError, setTimelineError] = useState('')
  const PER_PAGE = 8

  useEffect(() => {
    if (!showExportMenu) { setExportRect(null); return }
    const pos = () => {
      if (!exportBtnRef.current) return
      const r = exportBtnRef.current.getBoundingClientRect()
      setExportRect({ top: r.bottom + 8, right: window.innerWidth - r.right })
    }
    pos()
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (exportBtnRef.current && !exportBtnRef.current.contains(t)) {
        const menu = document.getElementById('history-export-menu')
        if (menu && menu.contains(t)) return
        setShowExportMenu(false)
      }
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowExportMenu(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', pos, true)
    window.addEventListener('resize', pos)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', pos, true)
      window.removeEventListener('resize', pos)
    }
  }, [showExportMenu])

  const loadTimeline = useCallback(() => {
    if (!propertyId) return
    setLoadingTimeline(true)
    setTimelineError('')
    fetchTimeline(propertyId)
      .then(data => setApiEvents(Array.isArray(data) ? data : []))
      .catch(err => {
        setApiEvents([])
        setTimelineError(err?.message || 'Erreur lors du chargement de l\'historique')
      })
      .finally(() => setLoadingTimeline(false))
  }, [propertyId])

  useEffect(() => { loadTimeline() }, [loadTimeline])

  const refreshTimeline = useCallback(() => {
    loadTimeline()
  }, [loadTimeline])

  const availableActions = useMemo(() => {
    return getActionsForPropertyType(
      propertyType || property?.propertyType || 'residential',
      transactionType || property?.transactionType
    )
  }, [propertyType, transactionType, property])

  const timeline = useMemo(() => {
    if (apiEvents.length > 0) return apiEvents
    if (Array.isArray(propEvents) && propEvents.length > 0) return propEvents
    return []
  }, [apiEvents, propEvents])

  const allAuthors = useMemo(() => {
    const s = new Set(timeline.map(e => e.agent).filter(Boolean) as string[])
    return Array.from(s).sort()
  }, [timeline])

  const currentAgentName = currentAgent || allAuthors[0] || 'Agent'

  const authors = useMemo(() => {
    if (!isAdmin && currentAgentName) {
      return [currentAgentName]
    }
    return allAuthors
  }, [allAuthors, isAdmin, currentAgentName])

  const displayAgent = (agent: string | undefined | null) => {
    if (!agent) return '—'
    return agent === currentAgent ? `${agent} (Vous)` : agent
  }

  const relevantCategories = useMemo(() => {
    const cats = new Set<ActionCategory>()
    for (const actionType of availableActions) {
      const cat = getCategoryFromType(actionType)
      if (cat) cats.add(cat)
    }
    return ALL_CATEGORIES.filter(c => cats.has(c))
  }, [availableActions])

  const stats = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const cat of ALL_CATEGORIES) counts[cat] = 0
    for (const ev of timeline) {
      const cat = getCategoryFromType(ev.type)
      counts[cat]++
    }
    return counts
  }, [timeline])
  const totalActions = timeline.length

  const filtered = useMemo(() => {
    let list = timeline

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.notes?.toLowerCase().includes(q) ||
        e.agent?.toLowerCase().includes(q) ||
        getActionMeta(e.type).label.toLowerCase().includes(q)
      )
    }

    if (categoryFilter !== 'all') {
      list = list.filter(e => getCategoryFromType(e.type) === categoryFilter)
    }

    if (authorFilter !== 'all') {
      list = list.filter(e => e.agent === authorFilter)
    }

    if (periodFilter === 'today') {
      const today = new Date().toDateString()
      list = list.filter(e => new Date(e.date).toDateString() === today)
    } else if (periodFilter === '7d') {
      const cutoff = new Date(Date.now() - 7 * 86400000)
      list = list.filter(e => new Date(e.date) >= cutoff)
    } else if (periodFilter === '30d') {
      const cutoff = new Date(Date.now() - 30 * 86400000)
      list = list.filter(e => new Date(e.date) >= cutoff)
    }

    if (dateFrom) {
      const from = new Date(dateFrom)
      list = list.filter(e => new Date(e.date) >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      list = list.filter(e => new Date(e.date) <= to)
    }

    return list
  }, [timeline, search, categoryFilter, authorFilter, periodFilter, dateFrom, dateTo])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const resetFilters = () => {
    setSearch('')
    setCategoryFilter('all')
    setAuthorFilter('all')
    setPeriodFilter('all')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const handleEdit = (event: TimelineEvent) => {
    setEditingEvent(event)
    setEditNotes(event.notes || '')
  }

  const handleSaveEdit = async () => {
    if (!editingEvent) return
    setSaving(true)
    try {
      await updateTimelineEventApi(propertyId, editingEvent.id, { notes: editNotes })
      refreshTimeline()
      setEditingEvent(null)
      setEditNotes('')
    } catch (e: any) {
      console.error('Failed to update event:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (event: TimelineEvent) => {
    setDeletingEvent(event)
  }

  const confirmDelete = async () => {
    if (!deletingEvent) return
    setSaving(true)
    try {
      await deleteTimelineEventApi(propertyId, deletingEvent.id)
      refreshTimeline()
      setDeletingEvent(null)
    } catch (e: any) {
      console.error('Failed to delete event:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleAddAction = async () => {
    if (!newActionType) return
    setSaving(true)
    try {
      await addTimelineEvent(propertyId, {
        type: newActionType,
        notes: newActionNotes.trim(),
      })
      refreshTimeline()
      setNewActionType('')
      setNewActionNotes('')
      setShowAddAction(false)
      setPage(1)
    } catch (e: any) {
      console.error('Failed to add action:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    setSaving(true)
    try {
      await addTimelineEvent(propertyId, {
        type: 'note_ajoutee',
        notes: noteText.trim(),
      })
      refreshTimeline()
      setNoteText('')
      setShowAddNote(false)
      setPage(1)
    } catch (e: any) {
      console.error('Failed to add note:', e)
    } finally {
      setSaving(false)
    }
  }

  const exportCSV = () => {
    const header = 'Date;Type;Auteur;Action;Détail'
    const rows = timeline.map(e => {
      const meta = getActionMeta(e.type)
      return `${formatDate(e.date).full} ${formatDate(e.date).time};${meta.label};${e.agent ? displayAgent(e.agent) : '-'};${(e.notes || '').replace(/;/g, ',')}`
    })
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `historique_${property?.reference || 'bien'}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = () => {
    const win = window.open('', '_blank')
    if (!win) return
    const rows = timeline.map(e => {
      const meta = getActionMeta(e.type)
      const d = formatDate(e.date)
      return `<tr><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;white-space:nowrap">${d.full}<br><span style="font-size:10px;color:#9ca3af">${d.time}</span></td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${meta.label}</td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${e.agent ? displayAgent(e.agent) : '-'}</td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px">${e.notes || ''}</td></tr>`
    }).join('')
    win.document.write(`
      <html><head><meta charset="utf-8"><title>Historique - ${property?.reference || 'Bien'}</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;font-size:13px;color:#1f2937}
      h1{font-size:18px;margin:0 0 4px}h2{font-size:13px;font-weight:400;color:#6b7280;margin:0 0 20px}
      table{width:100%;border-collapse:collapse}th{text-align:left;padding:8px 10px;border-bottom:2px solid #374151;font-size:11px;text-transform:uppercase;color:#6b7280}
      .footer{margin-top:20px;font-size:10px;color:#9ca3af;text-align:center}
      </style></head><body>
      <h1>Historique - ${property?.title || 'Bien'}</h1>
      <h2>${property?.reference || ''} · ${timeline.length} actions · Généré le ${new Date().toLocaleDateString('fr-FR')}</h2>
      <table><thead><tr><th>Date</th><th>Type</th><th>Auteur</th><th>Action / Détail</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="footer">Document généré automatiquement depuis l'application CRM</div>
      </body></html>`)
    win.document.close()
  }

  const statCards = [
    { label: 'Total actions', count: totalActions, hue: STAGE_HUES.violet, icon: Clock },
    { label: 'Modifications', count: stats.modification, hue: STAGE_HUES.fuchsia, icon: Edit3 },
    { label: 'Statuts', count: stats.statut, hue: STAGE_HUES.sky, icon: RefreshCw },
    { label: 'Visites', count: stats.visite, hue: STAGE_HUES.emerald, icon: Eye },
    { label: 'Offres', count: stats.offre, hue: STAGE_HUES.amber, icon: DollarSign },
    { label: 'Documents', count: stats.document, hue: STAGE_HUES.amber, icon: FileText },
    { label: 'Commentaires', count: stats.commentaire, hue: STAGE_HUES.sky, icon: MessageSquare },
  ]

  const catHueMap: Record<string, StageHue> = {
    creation: STAGE_HUES.emerald,
    modification: STAGE_HUES.fuchsia,
    statut: STAGE_HUES.sky,
    mandat: STAGE_HUES.violet,
    visite: STAGE_HUES.emerald,
    offre: STAGE_HUES.amber,
    document: STAGE_HUES.amber,
    commentaire: STAGE_HUES.sky,
    agent: STAGE_HUES.violet,
    client: STAGE_HUES.fuchsia,
    transfert: STAGE_HUES.sky,
    systeme: SLATE_HUE,
    location: STAGE_HUES.emerald,
    bail: STAGE_HUES.emerald,
    reservation: STAGE_HUES.amber,
    sejour: STAGE_HUES.amber,
    paiement: STAGE_HUES.emerald,
    diligence: STAGE_HUES.violet,
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={staged ? { opacity: 0, y: 12 } : undefined}
        animate={staged ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`rounded-2xl p-5 ${staged ? (dark ? 'bg-white/[0.04] border border-white/[0.08]' : 'bg-white/80 border border-teal-900/10') : 'bg-card border border-border/50 shadow-card'}`}
      >
        {staged && (
          <div className="pointer-events-none absolute top-0 left-[10%] right-[10%] h-px" style={{
            background: dark
              ? 'linear-gradient(90deg, transparent, rgba(139,124,255,0.5), rgba(94,234,212,0.3), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(13,148,136,0.5), rgba(124,92,255,0.25), transparent)'
          }} />
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <OrbIcon icon={Clock} hue={STAGE_HUES.violet} size={40} radius={12} className="shrink-0" />
            <div className="min-w-0">
              <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-text'}`}>Historique du bien</h2>
              <p className={`text-xs mt-0.5 ${dark ? 'text-slate-400' : 'text-text-secondary'}`}>
                Suivi complet des actions sur ce bien ·{' '}
                <AnimatedNumber value={totalActions} className={`font-semibold ${dark ? 'text-white' : 'text-text'}`} />
                {' '}action{totalActions !== 1 ? 's' : ''}
                {loadingTimeline && (
                  <span className={`ml-1.5 inline-block w-3 h-3 border-2 border-t-transparent rounded-full animate-spin align-middle ${dark ? 'border-violet-400' : 'border-accent'}`} />
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StageButton variant="glass" size="sm" icon={<RefreshCw size={13} className={loadingTimeline ? 'animate-spin' : ''} />} onClick={refreshTimeline} />
            <StageButton variant="glass" size="sm" icon={<Filter size={13} />} onClick={() => setShowFilters(!showFilters)} />
            <button
              ref={exportBtnRef}
              type="button"
              onClick={() => setShowExportMenu(v => !v)}
              className={`inline-flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-xl border transition-colors shrink-0 ${
                staged
                  ? dark
                    ? 'border-white/12 text-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] hover:text-white hover:border-white/15'
                    : 'border-teal-900/12 text-slate-600 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.5))] hover:text-teal-800 hover:border-teal-900/15'
                  : 'border-border/40 bg-card text-text-secondary hover:text-text hover:bg-background/80'
              }`}
            >
              <Download size={13} />
              Exporter
            </button>
          </div>
        </div>
      </motion.div>

      {/* Export menu — portal to body to escape ancestor filter containing blocks */}
      {createPortal(
        <AnimatePresence>
          {showExportMenu && exportRect && (
            <motion.div
              id="history-export-menu"
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'fixed', top: exportRect.top, right: exportRect.right, width: 220, zIndex: 99999, background: staged ? (dark ? 'linear-gradient(180deg, rgba(18,24,58,0.98), rgba(10,15,36,0.98))' : 'rgba(255,255,255,0.92)') : undefined, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
              className={`overflow-hidden rounded-2xl ${
                staged
                  ? 'border border-white/[0.10] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)]'
                  : 'border border-border/40 shadow-xl'
              }`}
            >
              {staged && (
                <div className="pointer-events-none h-[2px] w-full" style={{
                  background: dark
                    ? 'linear-gradient(90deg, transparent, rgba(139,124,255,0.6), rgba(94,234,212,0.4), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(13,148,136,0.5), rgba(124,92,255,0.3), transparent)'
                }} />
              )}
              <div className={`px-3.5 pt-3 pb-1.5 flex items-center gap-2.5 border-b ${dark ? 'border-white/[0.07]' : 'border-border/30'}`}>
                <OrbIcon icon={Download} hue={STAGE_HUES.sky} size={28} radius={8} />
                <div>
                  <p className={`text-xs font-bold leading-none ${dark ? 'text-white' : 'text-slate-900'}`}>Exporter</p>
                  <p className={`text-[10px] mt-0.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{filtered.length} action{filtered.length !== 1 ? 's' : ''} · {timeline.length} au total</p>
                </div>
              </div>
              <div className="p-1.5 space-y-1">
                <button
                  onClick={() => { setShowExportMenu(false); exportCSV() }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-xs font-medium text-left transition-all group/item ${
                    dark ? 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.06]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-200/60'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover/item:scale-105 ${dark ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/15'}`}>
                    <Download size={13} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block leading-none">Exporter CSV</span>
                    <span className={`block text-[10px] font-normal mt-0.5 leading-none ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Tableur · séparateur ;</span>
                  </span>
                  <ChevronRight size={12} className={`shrink-0 opacity-40 group-hover/item:opacity-100 group-hover/item:translate-x-0.5 transition-all ${dark ? 'text-slate-400' : 'text-slate-400'}`} />
                </button>
                <button
                  onClick={() => { setShowExportMenu(false); exportPDF() }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-xs font-medium text-left transition-all group/item ${
                    dark ? 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.06]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-200/60'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover/item:scale-105 ${dark ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20' : 'bg-violet-500/10 text-violet-600 border border-violet-500/15'}`}>
                    <FileText size={13} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block leading-none">Exporter PDF</span>
                    <span className={`block text-[10px] font-normal mt-0.5 leading-none ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Impression · mise en page</span>
                  </span>
                  <ChevronRight size={12} className={`shrink-0 opacity-40 group-hover/item:opacity-100 group-hover/item:translate-x-0.5 transition-all ${dark ? 'text-slate-400' : 'text-slate-400'}`} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Search & Filters */}
      <div className={`rounded-2xl overflow-hidden ${staged ? (dark ? 'bg-white/[0.04] border border-white/[0.08]' : 'bg-white/80 border border-teal-900/10') : 'bg-card border border-border/50 shadow-card'}`}>
        <div className="p-4">
          <div className="relative">
            <SearchInput
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Rechercher par action, auteur, client..."
              className={`h-10 pr-9 ${staged ? (dark ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:ring-violet-500/20 focus:border-violet-500/50' : 'bg-white/60 border-teal-900/10 text-slate-900 focus:ring-teal-600/20 focus:border-teal-600/40') : ''}`}
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1) }}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${dark ? 'text-slate-500 hover:text-white' : 'text-text-secondary/40 hover:text-text'}`}>
                <X size={14} />
              </button>
            )}
          </div>

          <AnimatePresence initial={false}>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ height: { duration: 0.15, ease: [0.25, 1, 0.5, 1] }, opacity: { duration: 0.1 } }}
                style={{ overflow: 'hidden' }}>
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 mt-4 border-t ${dark ? 'border-white/[0.07]' : 'border-border/30'}`}>
                  <div>
                    <label className={`text-[11px] font-medium uppercase tracking-wider mb-1.5 block ${dark ? 'text-slate-500' : 'text-text-secondary/70'}`}>Type d'action</label>
                    <Select
                      value={categoryFilter}
                      onChange={(val: string) => { setCategoryFilter(val as ActionCategory | 'all'); setPage(1) }}
                      options={[
                        { value: 'all', label: 'Tous les types' },
                        ...relevantCategories.map(cat => ({ value: cat, label: `${getActionCategoryLabel(cat)} (${stats[cat] || 0})` }))
                      ]}
                    />
                  </div>
                  {isAdmin && (
                    <div>
                      <label className={`text-[11px] font-medium uppercase tracking-wider mb-1.5 block ${dark ? 'text-slate-500' : 'text-text-secondary/70'}`}>Auteur</label>
                      <Select
                        value={authorFilter}
                        onChange={(val: string) => { setAuthorFilter(val); setPage(1) }}
                        options={[
                          { value: 'all', label: 'Tous les auteurs' },
                          ...authors.map(a => ({ value: a, label: a }))
                        ]}
                      />
                    </div>
                  )}
                  <div>
                    <label className={`text-[11px] font-medium uppercase tracking-wider mb-1.5 block ${dark ? 'text-slate-500' : 'text-text-secondary/70'}`}>Période</label>
                    <Select
                      value={periodFilter}
                      onChange={(val: string) => { setPeriodFilter(val); setPage(1) }}
                      options={[
                        { value: 'all', label: 'Toutes les dates' },
                        { value: 'today', label: "Aujourd'hui" },
                        { value: '7d', label: '7 derniers jours' },
                        { value: '30d', label: '30 derniers jours' },
                      ]}
                    />
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 min-w-0">
                      <label className={`text-[11px] font-medium uppercase tracking-wider mb-1.5 block ${dark ? 'text-slate-500' : 'text-text-secondary/70'}`}>Du</label>
                      <DatePicker
                        value={dateFrom}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setDateFrom(e.target.value); setPage(1) }}
                        placeholder="Date début"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className={`text-[11px] font-medium uppercase tracking-wider mb-1.5 block ${dark ? 'text-slate-500' : 'text-text-secondary/70'}`}>Au</label>
                      <DatePicker
                        value={dateTo}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setDateTo(e.target.value); setPage(1) }}
                        placeholder="Date fin"
                      />
                    </div>
                  </div>
                </div>
                <div className={`flex items-center justify-end gap-2 pt-4 mt-4 border-t ${dark ? 'border-white/[0.07]' : 'border-border/30'}`}>
                  {(search || categoryFilter !== 'all' || authorFilter !== 'all' || periodFilter !== 'all' || dateFrom || dateTo) && (
                    <button onClick={resetFilters}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${dark ? 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5' : 'border-border/40 text-text-secondary hover:text-text hover:bg-background/80'}`}>
                      <X size={12} /> Réinitialiser
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={staged ? { opacity: 0, y: 14 } : undefined}
            animate={staged ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {staged ? (
              <TiltCard className="p-3 text-center">
                <div className="flex items-center justify-center mb-2">
                  <OrbIcon icon={s.icon} hue={s.hue} size={30} radius={9} />
                </div>
                <p className={`text-[9px] font-bold uppercase tracking-[0.16em] ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>{s.label}</p>
                <p className={`text-lg font-extrabold leading-tight tabular-nums ${dark ? 'text-white' : 'text-slate-900'}`}>
                  <AnimatedNumber value={s.count} />
                </p>
              </TiltCard>
            ) : (
              <div className="bg-card rounded-xl border border-border/50 shadow-card p-3 text-center">
                <p className="text-xs text-text-secondary/60 truncate">{s.label}</p>
                <p className="text-lg font-bold mt-0.5" style={{ color: s.hue.line }}>{s.count}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Action list — vertical timeline */}
      <div className={`rounded-2xl overflow-hidden ${staged ? (dark ? 'bg-white/[0.04] border border-white/[0.08]' : 'bg-white/80 border border-teal-900/10') : 'bg-card border border-border/50 shadow-card'}`}>
        {timelineError ? (
          <div className="p-10 text-center">
            <OrbIcon icon={AlertCircle} hue={STAGE_HUES.fuchsia} size={48} radius={14} className="mx-auto mb-3" />
            <p className={`text-sm font-medium ${dark ? 'text-red-400' : 'text-red-500'}`}>Erreur de chargement</p>
            <p className={`text-xs mt-1 ${dark ? 'text-red-400/60' : 'text-red-400/70'}`}>{timelineError}</p>
            <StageButton variant="glass" size="sm" onClick={refreshTimeline} className="mt-3">
              Réessayer
            </StageButton>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <OrbIcon icon={Clock} hue={SLATE_HUE} size={52} radius={16} className="mx-auto mb-3 opacity-40" />
            <p className={`text-sm font-medium ${dark ? 'text-slate-400' : 'text-text-secondary'}`}>Aucune action trouvée</p>
            <p className={`text-xs mt-1 ${dark ? 'text-slate-500' : 'text-text-secondary/50'}`}>Essayez de modifier vos filtres de recherche</p>
          </div>
        ) : (
          <>
            {/* Timeline */}
            <div className="px-5 pt-5 pb-2">
              <div className="relative">
                {/* Vertical line */}
                <div
                  className="absolute left-[19px] top-0 bottom-0 w-[2px]"
                  style={staged ? {
                    background: dark
                      ? 'linear-gradient(180deg, rgba(139,124,255,0.5), rgba(94,234,212,0.3), rgba(139,124,255,0.15))'
                      : 'linear-gradient(180deg, rgba(13,148,136,0.45), rgba(124,92,255,0.25), rgba(13,148,136,0.1))',
                  } : {
                    background: 'linear-gradient(180deg, rgba(99,102,241,0.25), rgba(99,102,241,0.08))',
                  }}
                />

                {/* Event cards */}
                <div className="space-y-1">
                  {paged.map((event, i) => {
                    const meta = getActionMeta(event.type)
                    const d = formatDate(event.date)
                    const cat = getCategoryFromType(event.type)
                    const catColor = getCategoryColor(cat)
                    const catBg = getCategoryBgColor(cat)
                    const hue = catHueMap[cat] || SLATE_HUE

                    return (
                      <motion.div
                        key={event.id}
                        initial={staged ? { opacity: 0, x: -18 } : { opacity: 0, y: 6 }}
                        animate={staged ? { opacity: 1, x: 0 } : { opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="relative flex items-start gap-4 pl-0 py-2 group"
                      >
                        {/* Timeline node */}
                        <div className="relative z-10 flex-shrink-0 ml-[8px]">
                          {staged ? (
                            <OrbIcon icon={meta.iconComponent} hue={hue} size={24} radius={7} />
                          ) : (
                            <div
                              className="w-[24px] h-[24px] rounded-[7px] flex items-center justify-center"
                              style={{ backgroundColor: catBg, color: catColor }}
                            >
                              {meta.icon}
                            </div>
                          )}
                        </div>

                        {/* Card content */}
                        {staged ? (
                          <TiltCard className="flex-1 min-w-0 p-3.5">
                            <div className="relative flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                  <StageBadge variant={
                                    cat === 'modification' ? 'danger' :
                                    cat === 'statut' || cat === 'agent' ? 'violet' :
                                    cat === 'visite' || cat === 'creation' || cat === 'paiement' ? 'ok' :
                                    cat === 'offre' || cat === 'reservation' ? 'warn' : 'neutral'
                                  }>
                                    {meta.label}
                                  </StageBadge>
                                  <span className={`text-[10px] tabular-nums ${dark ? 'text-slate-500' : 'text-teal-900/40'}`}>{d.full} · {d.time}</span>
                                </div>
                                <p className={`text-sm leading-relaxed line-clamp-2 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                                  {event.notes || 'Aucun détail'}
                                </p>
                                {event.agent && (
                                  <p className={`text-[11px] mt-1.5 flex items-center gap-1 ${dark ? 'text-slate-500' : 'text-teal-900/40'}`}>
                                    <User size={10} /> {displayAgent(event.agent)}
                                  </p>
                                )}
                              </div>
                              {isAdmin && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={e => e.stopPropagation()}>
                                  <button onClick={() => handleEdit(event)}
                                    className={`p-1.5 rounded-lg transition-all ${dark ? 'text-slate-500 hover:text-sky-300 hover:bg-sky-500/10' : 'text-text-secondary/50 hover:text-blue-600 hover:bg-blue-50'}`} title="Modifier">
                                    <Edit3 size={13} />
                                  </button>
                                  <button onClick={() => handleDelete(event)}
                                    className={`p-1.5 rounded-lg transition-all ${dark ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' : 'text-text-secondary/50 hover:text-red-600 hover:bg-red-50'}`} title="Supprimer">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </TiltCard>
                        ) : (
                          <div
                            className={`flex-1 min-w-0 p-3.5 rounded-xl border transition-all cursor-pointer ${dark ? 'border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]' : 'border-border/30 hover:border-border/60 hover:bg-background/40'}`}
                            onClick={() => setSelectedEvent(event)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                  <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={{ backgroundColor: catBg, color: catColor }}>
                                    {meta.label}
                                  </span>
                                  <span className="text-[10px] text-text-secondary/40 tabular-nums">{d.full} · {d.time}</span>
                                </div>
                                <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
                                  {event.notes || 'Aucun détail'}
                                </p>
                                {event.agent && (
                                  <p className="text-[11px] text-text-secondary/50 mt-1.5 flex items-center gap-1">
                                    <User size={10} /> {displayAgent(event.agent)}
                                  </p>
                                )}
                              </div>
                              {isAdmin && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={e => e.stopPropagation()}>
                                  <button onClick={() => handleEdit(event)}
                                    className="p-1.5 rounded-lg text-text-secondary/50 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Modifier">
                                    <Edit3 size={13} />
                                  </button>
                                  <button onClick={() => handleDelete(event)}
                                    className="p-1.5 rounded-lg text-text-secondary/50 hover:text-red-600 hover:bg-red-50 transition-all" title="Supprimer">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={`flex items-center justify-between px-5 py-3.5 border-t ${staged ? (dark ? 'border-white/[0.07] bg-white/[0.02]' : 'border-teal-900/10 bg-teal-900/[0.02]') : 'border-border/20 bg-background/30'}`}>
                <span className={`text-xs flex items-center gap-1.5 ${staged ? (dark ? 'text-slate-400' : 'text-teal-900/55') : 'text-text-secondary/60'}`}>
                  {filtered.length > 0 ? (
                    <>
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold shrink-0 ${staged ? (dark ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20' : 'bg-teal-600/10 text-teal-700 border border-teal-600/15') : 'bg-accent/10 text-accent'}`}>
                        {filtered.length}
                      </span>
                      <span>
                        Affichage{' '}
                        <strong className={staged ? (dark ? 'text-slate-200 font-semibold' : 'text-teal-900 font-semibold') : 'text-text font-semibold'}>
                          {(page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, filtered.length)}
                        </strong>
                        {' '}sur{' '}
                        <strong className={staged ? (dark ? 'text-slate-200 font-semibold' : 'text-teal-900 font-semibold') : 'text-text font-semibold'}>
                          {filtered.length}
                        </strong>
                        {' '}action{filtered.length !== 1 ? 's' : ''}
                      </span>
                    </>
                  ) : 'Aucune action'}
                </span>
                <div className="flex items-center gap-1">
                  <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                    className={`p-1.5 rounded-xl border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                      staged
                        ? dark ? 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/15' : 'border-teal-900/10 text-teal-800/60 hover:text-teal-900 hover:bg-white/70 hover:border-teal-900/15'
                        : 'border-border/40 text-text-secondary hover:text-text'
                    }`}>
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                    const isActive = p === page
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-7 h-7 text-xs font-bold rounded-xl transition-all relative ${
                          isActive
                            ? staged
                              ? dark
                                ? 'text-white border border-white/20'
                                : 'text-white border border-white/40'
                              : 'bg-accent text-white shadow-sm border border-accent'
                            : staged
                              ? dark ? 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent' : 'text-teal-800/50 hover:text-teal-900 hover:bg-white/60 border border-transparent'
                              : 'text-text-secondary hover:bg-background/80 border border-transparent'
                        }`}
                        style={isActive && staged ? {
                          backgroundImage: dark
                            ? 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 55%, #5646C9 100%)'
                            : 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 55%, #0D9488 100%)',
                          boxShadow: dark
                            ? 'inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 12px -2px rgba(124,92,255,0.55), 0 8px 20px -8px rgba(124,92,255,0.4), 0 1px 3px rgba(0,0,0,0.3)'
                            : 'inset 0 1px 0 rgba(255,255,255,0.55), 0 4px 12px -2px rgba(13,148,136,0.45), 0 8px 20px -8px rgba(13,148,136,0.3), 0 1px 3px rgba(0,0,0,0.08)',
                          transform: 'translateY(-1px)',
                        } : isActive ? undefined : undefined}
                      >
                        {p}
                      </button>
                    )
                  })}
                  <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className={`p-1.5 rounded-xl border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                      staged
                        ? dark ? 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/15' : 'border-teal-900/10 text-teal-800/60 hover:text-teal-900 hover:bg-white/70 hover:border-teal-900/15'
                        : 'border-border/40 text-text-secondary hover:text-text'
                    }`}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Admin actions bar */}
            {isAdmin && (
              <div className={`px-5 py-3 border-t flex items-center gap-2 flex-wrap ${dark ? 'border-white/[0.07]' : 'border-border/20 bg-background/30'}`}>
                <StageButton variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => { setShowAddAction(true); setNewActionType(''); setNewActionNotes('') }}>
                  Ajouter une action
                </StageButton>
                <StageButton variant="glass" size="sm" icon={<MessageSquare size={12} />} onClick={() => { setShowAddNote(true); setNoteText('') }}>
                  Ajouter une note
                </StageButton>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 ${staged ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/40'}`}
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={`w-full max-w-lg overflow-hidden ${staged ? 'stage-glass rounded-2xl shadow-[0_40px_90px_-24px_rgba(0,0,0,0.8)]' : 'bg-card rounded-2xl border border-border/50 shadow-2xl'}`}
              onClick={e => e.stopPropagation()}
            >
              {staged && (
                <div className="pointer-events-none h-[2px] w-full" style={{
                  background: dark
                    ? 'linear-gradient(90deg, transparent, rgba(139,124,255,0.6), rgba(94,234,212,0.4), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(13,148,136,0.5), rgba(124,92,255,0.3), transparent)'
                }} />
              )}
              <div className={`px-6 py-4 border-b flex items-center justify-between ${dark ? 'border-white/[0.08]' : 'border-border/30'}`}>
                <div className="flex items-center gap-3">
                  <OrbIcon icon={getActionMeta(selectedEvent.type).icon ? Info : Info} hue={catHueMap[getCategoryFromType(selectedEvent.type)] || SLATE_HUE} size={36} radius={10} />
                  <h3 className={`font-semibold ${dark ? 'text-white' : 'text-text'}`}>Détail de l'action</h3>
                </div>
                <button onClick={() => setSelectedEvent(null)}
                  className={`p-1.5 rounded-lg transition-all ${dark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-text-secondary hover:text-text hover:bg-background/80'}`}>
                  <X size={16} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-[11px] font-medium uppercase tracking-wider mb-1 ${dark ? 'text-slate-500' : 'text-text-secondary/60'}`}>Date</p>
                    <p className={`text-sm ${dark ? 'text-white' : 'text-text'}`}>{formatDate(selectedEvent.date).dateTime}</p>
                    <p className={`text-[11px] ${dark ? 'text-slate-500' : 'text-text-secondary/50'}`}>{formatDate(selectedEvent.date).time}</p>
                  </div>
                  <div>
                    <p className={`text-[11px] font-medium uppercase tracking-wider mb-1 ${dark ? 'text-slate-500' : 'text-text-secondary/60'}`}>Type</p>
                    <StageBadge variant={
                      getCategoryFromType(selectedEvent.type) === 'modification' ? 'danger' :
                      getCategoryFromType(selectedEvent.type) === 'statut' ? 'violet' :
                      getCategoryFromType(selectedEvent.type) === 'visite' ? 'ok' : 'neutral'
                    }>
                      {getActionMeta(selectedEvent.type).label}
                    </StageBadge>
                  </div>
                </div>

                <div>
                  <p className={`text-[11px] font-medium uppercase tracking-wider mb-1 ${dark ? 'text-slate-500' : 'text-text-secondary/60'}`}>Auteur</p>
                  <p className={`text-sm flex items-center gap-1.5 ${dark ? 'text-white' : 'text-text'}`}>
                    <User size={13} className={dark ? 'text-slate-500' : 'text-text-secondary/40'} />
                    {displayAgent(selectedEvent.agent)}
                  </p>
                </div>

                {property && (
                  <div>
                    <p className={`text-[11px] font-medium uppercase tracking-wider mb-1 ${dark ? 'text-slate-500' : 'text-text-secondary/60'}`}>Bien</p>
                    <p className={`text-sm ${dark ? 'text-white' : 'text-text'}`}>{property.title}</p>
                    <p className={`text-[11px] ${dark ? 'text-slate-500' : 'text-text-secondary/50'}`}>{property.reference}</p>
                  </div>
                )}

                <div className={`border-t pt-4 ${dark ? 'border-white/[0.07]' : 'border-border/20'}`}>
                  <p className={`text-[11px] font-medium uppercase tracking-wider mb-2 ${dark ? 'text-slate-500' : 'text-text-secondary/60'}`}>Action / Détail</p>
                  <div className={`p-3 rounded-lg ${staged ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-background/60 border border-border/30'}`}>
                    <p className={`text-sm leading-relaxed ${dark ? 'text-slate-300' : 'text-text'}`}>{selectedEvent.notes || 'Aucun détail'}</p>
                  </div>
                </div>
              </div>

              <div className={`px-6 py-4 border-t flex justify-end ${dark ? 'border-white/[0.08]' : 'border-border/30'}`}>
                <StageButton variant="glass" size="sm" onClick={() => setSelectedEvent(null)}>
                  Fermer
                </StageButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editingEvent && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 ${staged ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/40'}`}
            onClick={() => setEditingEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={`w-full max-w-lg overflow-hidden ${staged ? 'stage-glass rounded-2xl shadow-[0_40px_90px_-24px_rgba(0,0,0,0.8)]' : 'bg-card rounded-2xl border border-border/50 shadow-2xl'}`}
              onClick={e => e.stopPropagation()}
            >
              {staged && (
                <div className="pointer-events-none h-[2px] w-full" style={{
                  background: dark
                    ? 'linear-gradient(90deg, transparent, rgba(56,189,248,0.6), rgba(139,124,255,0.4), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(13,148,136,0.5), rgba(56,189,248,0.3), transparent)'
                }} />
              )}
              <div className={`px-6 py-4 border-b flex items-center justify-between ${dark ? 'border-white/[0.08]' : 'border-border/30'}`}>
                <h3 className={`font-semibold ${dark ? 'text-white' : 'text-text'}`}>Modifier l'action</h3>
                <button onClick={() => setEditingEvent(null)}
                  className={`p-1.5 rounded-lg transition-all ${dark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-text-secondary hover:text-text hover:bg-background/80'}`}>
                  <X size={16} />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-[11px] font-medium uppercase tracking-wider mb-1 ${dark ? 'text-slate-500' : 'text-text-secondary/60'}`}>Type</p>
                    <StageBadge variant={
                      getCategoryFromType(editingEvent.type) === 'modification' ? 'danger' :
                      getCategoryFromType(editingEvent.type) === 'statut' ? 'violet' :
                      getCategoryFromType(editingEvent.type) === 'visite' ? 'ok' : 'neutral'
                    }>
                      {getActionMeta(editingEvent.type).label}
                    </StageBadge>
                  </div>
                  <div>
                    <p className={`text-[11px] font-medium uppercase tracking-wider mb-1 ${dark ? 'text-slate-500' : 'text-text-secondary/60'}`}>Auteur</p>
                    <p className={`text-sm ${dark ? 'text-white' : 'text-text'}`}>{displayAgent(editingEvent.agent)}</p>
                  </div>
                </div>
                <div>
                  <label className={`text-[11px] font-medium uppercase tracking-wider mb-1.5 block ${dark ? 'text-slate-500' : 'text-text-secondary/60'}`}>Notes / Détail</label>
                  <textarea
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    rows={4}
                    className={`w-full rounded-lg border text-sm px-3 py-2 focus:outline-none focus:ring-2 transition-all resize-none ${
                      staged
                        ? dark
                          ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:ring-violet-500/20 focus:border-violet-500/50'
                          : 'border-teal-900/10 bg-white/60 text-slate-900 focus:ring-teal-600/20 focus:border-teal-600/40'
                        : 'border-border/60 bg-card text-text focus:ring-accent/20 focus:border-accent'
                    }`}
                  />
                </div>
              </div>
              <div className={`px-6 py-4 border-t flex justify-end gap-2 ${dark ? 'border-white/[0.08]' : 'border-border/30'}`}>
                <StageButton variant="glass" size="sm" onClick={() => setEditingEvent(null)}>
                  Annuler
                </StageButton>
                <StageButton variant="primary" size="sm" onClick={handleSaveEdit} className={saving ? 'opacity-50 pointer-events-none' : ''}>
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </StageButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deletingEvent && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 ${staged ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/40'}`}
            onClick={() => setDeletingEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={`w-full max-w-sm overflow-hidden ${staged ? 'stage-glass rounded-2xl shadow-[0_40px_90px_-24px_rgba(0,0,0,0.8)]' : 'bg-card rounded-2xl border border-border/50 shadow-2xl'}`}
              onClick={e => e.stopPropagation()}
            >
              {staged && (
                <div className="pointer-events-none h-[2px] w-full" style={{
                  background: 'linear-gradient(90deg, transparent, rgba(244,63,94,0.6), rgba(251,113,133,0.4), transparent)'
                }} />
              )}
              <div className={`px-6 py-4 border-b flex items-center gap-3 ${dark ? 'border-white/[0.08]' : 'border-border/30'}`}>
                <OrbIcon icon={Trash2} hue={STAGE_HUES.fuchsia} size={36} radius={10} />
                <h3 className={`font-semibold ${dark ? 'text-white' : 'text-text'}`}>Supprimer l'action</h3>
              </div>
              <div className="px-6 py-5">
                <p className={`text-sm ${dark ? 'text-slate-300' : 'text-text-secondary'}`}>
                  Êtes-vous sûr de vouloir supprimer cette action ? Cette action est irréversible.
                </p>
                <div className={`mt-3 p-3 rounded-lg ${staged ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-background/60 border border-border/30'}`}>
                  <p className={`text-xs font-medium ${dark ? 'text-white' : 'text-text'}`}>{getActionMeta(deletingEvent.type).label}</p>
                  <p className={`text-xs mt-1 ${dark ? 'text-slate-400' : 'text-text-secondary'}`}>{deletingEvent.notes || 'Aucun détail'}</p>
                </div>
              </div>
              <div className={`px-6 py-4 border-t flex justify-end gap-2 ${dark ? 'border-white/[0.08]' : 'border-border/30'}`}>
                <StageButton variant="glass" size="sm" onClick={() => setDeletingEvent(null)}>
                  Annuler
                </StageButton>
                <button onClick={confirmDelete} disabled={saving}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50">
                  {saving ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add action modal */}
      <AnimatePresence>
        {showAddAction && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 ${staged ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/40'}`}
            onClick={() => setShowAddAction(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={`w-full max-w-lg overflow-hidden ${staged ? 'stage-glass rounded-2xl shadow-[0_40px_90px_-24px_rgba(0,0,0,0.8)]' : 'bg-card rounded-2xl border border-border/50 shadow-2xl'}`}
              onClick={e => e.stopPropagation()}
            >
              {staged && (
                <div className="pointer-events-none h-[2px] w-full" style={{
                  background: dark
                    ? 'linear-gradient(90deg, transparent, rgba(139,124,255,0.6), rgba(52,211,153,0.4), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(13,148,136,0.5), rgba(52,211,153,0.3), transparent)'
                }} />
              )}
              <div className={`px-6 py-4 border-b flex items-center justify-between ${dark ? 'border-white/[0.08]' : 'border-border/30'}`}>
                <div className="flex items-center gap-3">
                  <OrbIcon icon={Plus} hue={STAGE_HUES.emerald} size={36} radius={10} />
                  <h3 className={`font-semibold ${dark ? 'text-white' : 'text-text'}`}>Ajouter une action</h3>
                </div>
                <button onClick={() => setShowAddAction(false)}
                  className={`p-1.5 rounded-lg transition-all ${dark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-text-secondary hover:text-text hover:bg-background/80'}`}>
                  <X size={16} />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className={`text-[11px] font-medium uppercase tracking-wider mb-1.5 block ${dark ? 'text-slate-500' : 'text-text-secondary/60'}`}>Type d'action</label>
                  <select
                    value={newActionType}
                    onChange={e => setNewActionType(e.target.value)}
                    className={`w-full h-10 rounded-lg border text-sm px-3 focus:outline-none focus:ring-2 transition-all ${
                      staged
                        ? dark
                          ? 'border-white/10 bg-white/5 text-white focus:ring-violet-500/20 focus:border-violet-500/50'
                          : 'border-teal-900/10 bg-white/60 text-slate-900 focus:ring-teal-600/20 focus:border-teal-600/40'
                        : 'border-border/60 bg-card text-text focus:ring-accent/20 focus:border-accent'
                    }`}
                  >
                    <option value="">Sélectionner une action...</option>
                    {availableActions.map(actionType => (
                      <option key={actionType} value={actionType}>
                        {ACTION_META[actionType]?.label || actionType.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`text-[11px] font-medium uppercase tracking-wider mb-1.5 block ${dark ? 'text-slate-500' : 'text-text-secondary/60'}`}>Notes / Détail</label>
                  <textarea
                    value={newActionNotes}
                    onChange={e => setNewActionNotes(e.target.value)}
                    placeholder="Détails de l'action..."
                    rows={4}
                    className={`w-full rounded-lg border text-sm px-3 py-2 focus:outline-none focus:ring-2 transition-all resize-none ${
                      staged
                        ? dark
                          ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:ring-violet-500/20 focus:border-violet-500/50'
                          : 'border-teal-900/10 bg-white/60 text-slate-900 placeholder:text-teal-900/30 focus:ring-teal-600/20 focus:border-teal-600/40'
                        : 'border-border/60 bg-card text-text focus:ring-accent/20 focus:border-accent'
                    }`}
                  />
                </div>
              </div>
              <div className={`px-6 py-4 border-t flex justify-end gap-2 ${dark ? 'border-white/[0.08]' : 'border-border/30'}`}>
                <StageButton variant="glass" size="sm" onClick={() => setShowAddAction(false)}>
                  Annuler
                </StageButton>
                <StageButton variant="primary" size="sm" onClick={handleAddAction} className={!newActionType || saving ? 'opacity-50 pointer-events-none' : ''}>
                  {saving ? 'Ajout...' : 'Ajouter'}
                </StageButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add note modal */}
      <AnimatePresence>
        {showAddNote && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 ${staged ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/40'}`}
            onClick={() => setShowAddNote(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={`w-full max-w-lg overflow-hidden ${staged ? 'stage-glass rounded-2xl shadow-[0_40px_90px_-24px_rgba(0,0,0,0.8)]' : 'bg-card rounded-2xl border border-border/50 shadow-2xl'}`}
              onClick={e => e.stopPropagation()}
            >
              {staged && (
                <div className="pointer-events-none h-[2px] w-full" style={{
                  background: dark
                    ? 'linear-gradient(90deg, transparent, rgba(56,189,248,0.6), rgba(139,124,255,0.4), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(13,148,136,0.5), rgba(56,189,248,0.3), transparent)'
                }} />
              )}
              <div className={`px-6 py-4 border-b flex items-center justify-between ${dark ? 'border-white/[0.08]' : 'border-border/30'}`}>
                <div className="flex items-center gap-3">
                  <OrbIcon icon={MessageSquare} hue={STAGE_HUES.sky} size={36} radius={10} />
                  <h3 className={`font-semibold ${dark ? 'text-white' : 'text-text'}`}>Ajouter une note</h3>
                </div>
                <button onClick={() => setShowAddNote(false)}
                  className={`p-1.5 rounded-lg transition-all ${dark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-text-secondary hover:text-text hover:bg-background/80'}`}>
                  <X size={16} />
                </button>
              </div>
              <div className="px-6 py-5">
                <label className={`text-[11px] font-medium uppercase tracking-wider mb-1.5 block ${dark ? 'text-slate-500' : 'text-text-secondary/60'}`}>Note</label>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Saisissez le contenu de la note..."
                  rows={4}
                  className={`w-full rounded-lg border text-sm px-3 py-2 focus:outline-none focus:ring-2 transition-all resize-none ${
                    staged
                      ? dark
                        ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:ring-sky-500/20 focus:border-sky-500/50'
                        : 'border-teal-900/10 bg-white/60 text-slate-900 placeholder:text-teal-900/30 focus:ring-teal-600/20 focus:border-teal-600/40'
                      : 'border-border/60 bg-card text-text focus:ring-accent/20 focus:border-accent'
                  }`}
                />
              </div>
              <div className={`px-6 py-4 border-t flex justify-end gap-2 ${dark ? 'border-white/[0.08]' : 'border-border/30'}`}>
                <StageButton variant="glass" size="sm" onClick={() => setShowAddNote(false)}>
                  Annuler
                </StageButton>
                <StageButton variant="primary" size="sm" onClick={handleAddNote} className={!noteText.trim() || saving ? 'opacity-50 pointer-events-none' : ''}>
                  {saving ? 'Ajout...' : 'Ajouter'}
                </StageButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PropertyTimeline
