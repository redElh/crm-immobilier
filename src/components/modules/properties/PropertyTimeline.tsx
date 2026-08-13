import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

interface ActionMeta {
  category: ActionCategory
  label: string
  icon: React.ReactNode
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
      color: found.color,
      bgColor: found.bgColor,
    }
  }
  return {
    category: 'systeme' as ActionCategory,
    label: type.replace(/_/g, ' '),
    icon: <Info size={14} />,
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
  const [apiEvents, setApiEvents] = useState<TimelineEvent[]>([])
  const [loadingTimeline, setLoadingTimeline] = useState(true)
  const [timelineError, setTimelineError] = useState('')
  const PER_PAGE = 8

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
    { label: 'Total actions', count: totalActions, color: '#6366f1', bg: '#eef2ff' },
    { label: 'Modifications', count: stats.modification, color: '#dc2626', bg: '#fef2f2' },
    { label: 'Statuts', count: stats.statut, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Visites', count: stats.visite, color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Offres', count: stats.offre, color: '#eab308', bg: '#fefce8' },
    { label: 'Documents', count: stats.document, color: '#ea580c', bg: '#fff7ed' },
    { label: 'Commentaires', count: stats.commentaire, color: '#0891b2', bg: '#ecfeff' },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
              <Clock size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text">Historique du bien</h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Suivi complet des actions sur ce bien · {totalActions} action{totalActions !== 1 ? 's' : ''}
                {loadingTimeline && <span className={`ml-1.5 inline-block w-3 h-3 border-2 border-t-transparent rounded-full animate-spin align-middle ${isGerant ? 'border-[#905D5D]' : 'border-accent'}`} />}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refreshTimeline}
              className="p-2 rounded-lg border border-border/40 text-text-secondary hover:text-text hover:border-border transition-all"
              title="Actualiser">
              <RefreshCw size={14} className={loadingTimeline ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg border transition-all ${showFilters ? (isGerant ? 'bg-[#905D5D]/10 border-[#905D5D]/40 text-[#905D5D]' : 'bg-accent/10 border-accent/40 text-accent') : 'border-border/40 text-text-secondary hover:text-text hover:border-border'}`}
              title="Filtres">
              <Filter size={14} />
            </button>
            <div className="relative group">
              <button className="p-2 rounded-lg border border-border/40 text-text-secondary hover:text-text hover:border-border transition-all" title="Exporter">
                <Download size={14} />
              </button>
              <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border/40 rounded-xl shadow-xl py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                <button onClick={exportCSV} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text hover:bg-background/80 transition-colors">
                  <Download size={12} /> Exporter CSV
                </button>
                <button onClick={exportPDF} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text hover:bg-background/80 transition-colors">
                  <FileText size={12} /> Exporter PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card">
        <div className="p-4">
          <div className="relative">
            <SearchInput
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Rechercher par action, auteur, client..."
              className="h-10 pr-9"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/40 hover:text-text transition-colors">
                <X size={14} />
              </button>
            )}
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 mt-4 border-t border-border/30">
                  <div>
                    <label className="text-[11px] font-medium text-text-secondary/70 uppercase tracking-wider mb-1.5 block">Type d'action</label>
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
                      <label className="text-[11px] font-medium text-text-secondary/70 uppercase tracking-wider mb-1.5 block">Auteur</label>
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
                    <label className="text-[11px] font-medium text-text-secondary/70 uppercase tracking-wider mb-1.5 block">Période</label>
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
                      <label className="text-[11px] font-medium text-text-secondary/70 uppercase tracking-wider mb-1.5 block">Du</label>
                      <DatePicker
                        value={dateFrom}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setDateFrom(e.target.value); setPage(1) }}
                        placeholder="Date début"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-[11px] font-medium text-text-secondary/70 uppercase tracking-wider mb-1.5 block">Au</label>
                      <DatePicker
                        value={dateTo}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setDateTo(e.target.value); setPage(1) }}
                        placeholder="Date fin"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-border/30">
                  {(search || categoryFilter !== 'all' || authorFilter !== 'all' || periodFilter !== 'all' || dateFrom || dateTo) && (
                    <button onClick={resetFilters}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/40 text-text-secondary hover:text-text hover:bg-background/80 transition-all">
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
        {statCards.map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border/50 shadow-card p-3 text-center">
            <p className="text-xs text-text-secondary/60 truncate">{s.label}</p>
            <p className="text-lg font-bold mt-0.5" style={{ color: s.color }}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Action list */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
        {timelineError ? (
          <div className="p-10 text-center">
            <AlertCircle size={28} className="text-red-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-red-500">Erreur de chargement</p>
            <p className="text-xs text-red-400/70 mt-1">{timelineError}</p>
            <button onClick={refreshTimeline}
              className={`mt-3 px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] hover:bg-[#905D5D]/20' : 'bg-accent/10 text-accent hover:bg-accent/20'}`}>
              Réessayer
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Clock size={28} className="text-text-secondary/20 mx-auto mb-3" />
            <p className="text-sm font-medium text-text-secondary">Aucune action trouvée</p>
            <p className="text-xs text-text-secondary/50 mt-1">Essayez de modifier vos filtres de recherche</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className={`hidden md:grid ${isAdmin ? 'grid-cols-[1fr_0.8fr_1.2fr_2.5fr_0.5fr]' : 'grid-cols-[1fr_0.8fr_1.2fr_2.5fr]'} gap-3 px-5 py-3 bg-background/50 border-b border-border/30 text-[11px] font-medium text-text-secondary/60 uppercase tracking-wider`}>
              <span>Date</span>
              <span className="text-center">Type</span>
              <span>Auteur</span>
              <span>Action / Détail</span>
              {isAdmin && <span className="text-center">Actions</span>}
            </div>

            <div className="divide-y divide-border/20">
              {paged.map((event, i) => {
                const meta = getActionMeta(event.type)
                const d = formatDate(event.date)
                const cat = getCategoryFromType(event.type)
                const catColor = getCategoryColor(cat)
                const catBg = getCategoryBgColor(cat)

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedEvent(event)}
                    className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-[1fr_0.8fr_1.2fr_2.5fr_0.5fr]' : 'md:grid-cols-[1fr_0.8fr_1.2fr_2.5fr]'} gap-3 px-5 py-3.5 cursor-pointer hover:bg-background/50 transition-colors`}
                  >
                    {/* Mobile layout: all info stacked */}
                    <div className="md:hidden flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: catBg, color: catColor }}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium" style={{ color: catColor }}>{meta.label}</span>
                          <span className="text-[10px] text-text-secondary/40">{d.full}</span>
                          <span className="text-[10px] text-text-secondary/30">{d.time}</span>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5 leading-relaxed line-clamp-2">{event.notes || 'Aucun détail'}</p>
                        {event.agent && (
                          <p className="text-[10px] text-text-secondary/50 mt-1 flex items-center gap-1">
                            <User size={9} /> {displayAgent(event.agent)}
                          </p>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="md:hidden flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border/20" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleEdit(event)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg text-text-secondary/60 hover:text-blue-600 hover:bg-blue-50 transition-all">
                          <Edit3 size={11} /> Modifier
                        </button>
                        <button onClick={() => handleDelete(event)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg text-text-secondary/60 hover:text-red-600 hover:bg-red-50 transition-all">
                          <Trash2 size={11} /> Supprimer
                        </button>
                      </div>
                    )}

                    {/* Desktop layout */}
                    <div className="hidden md:flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: catBg, color: catColor }}>
                        {meta.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text">{d.full}</p>
                        <p className="text-[11px] text-text-secondary/50">{d.time}</p>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center justify-center">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-md" style={{ backgroundColor: catBg, color: catColor }}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="hidden md:flex items-center text-sm text-text-secondary">
                      {event.agent ? (
                        <span className="flex items-center gap-1.5">
                          <User size={12} className="text-text-secondary/40" />
                          {displayAgent(event.agent)}
                        </span>
                      ) : (
                        <span className="text-text-secondary/40">—</span>
                      )}
                    </div>
                    <div className="hidden md:flex items-center min-w-0">
                      <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">{event.notes || 'Aucun détail'}</p>
                    </div>
                    {isAdmin && (
                      <div className="hidden md:flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
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
                  </motion.div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border/20 bg-background/30">
                <span className="text-xs text-text-secondary/50">
                  {filtered.length > 0
                    ? `Affichage ${(page - 1) * PER_PAGE + 1}-${Math.min(page * PER_PAGE, filtered.length)} sur ${filtered.length} action${filtered.length !== 1 ? 's' : ''}`
                    : 'Aucune action'}
                </span>
                <div className="flex items-center gap-1">
                  <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-border/40 text-text-secondary hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-7 h-7 text-xs font-medium rounded-lg transition-all ${p === page ? (isGerant ? 'bg-[#905D5D] text-white' : 'bg-accent text-white') : 'text-text-secondary hover:bg-background/80'}`}>
                      {p}
                    </button>
                  ))}
                  <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-border/40 text-text-secondary hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Admin actions bar */}
            {isAdmin && (
              <div className="px-5 py-3 border-t border-border/20 bg-background/30 flex items-center gap-2 flex-wrap">
                <button onClick={() => { setShowAddAction(true); setNewActionType(''); setNewActionNotes('') }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] hover:bg-[#905D5D]/20' : 'bg-accent/10 text-accent hover:bg-accent/20'}`}>
                  <Plus size={12} /> Ajouter une action
                </button>
                <button onClick={() => { setShowAddNote(true); setNoteText('') }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] hover:bg-[#905D5D]/20' : 'bg-accent/10 text-accent hover:bg-accent/20'}`}>
                  <MessageSquare size={12} /> Ajouter une note
                </button>
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
            className="fixed inset-0 z-[99999] bg-black/40 flex items-center justify-center p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-2xl border border-border/50 shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: getActionMeta(selectedEvent.type).bgColor, color: getActionMeta(selectedEvent.type).color }}>
                    {getActionMeta(selectedEvent.type).icon}
                  </div>
                  <h3 className="font-semibold text-text">Détail de l'action</h3>
                </div>
                <button onClick={() => setSelectedEvent(null)}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-background/80 transition-all">
                  <X size={16} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-medium text-text-secondary/60 uppercase tracking-wider mb-1">Date</p>
                    <p className="text-sm text-text">{formatDate(selectedEvent.date).dateTime}</p>
                    <p className="text-[11px] text-text-secondary/50">{formatDate(selectedEvent.date).time}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-text-secondary/60 uppercase tracking-wider mb-1">Type</p>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md"
                      style={{ backgroundColor: getActionMeta(selectedEvent.type).bgColor, color: getActionMeta(selectedEvent.type).color }}>
                      {getActionMeta(selectedEvent.type).icon}
                      {getActionMeta(selectedEvent.type).label}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-text-secondary/60 uppercase tracking-wider mb-1">Auteur</p>
                  <p className="text-sm text-text flex items-center gap-1.5">
                    <User size={13} className="text-text-secondary/40" />
                    {displayAgent(selectedEvent.agent)}
                  </p>
                </div>

                {property && (
                  <div>
                    <p className="text-[11px] font-medium text-text-secondary/60 uppercase tracking-wider mb-1">Bien</p>
                    <p className="text-sm text-text">{property.title}</p>
                    <p className="text-[11px] text-text-secondary/50">{property.reference}</p>
                  </div>
                )}

                <div className="border-t border-border/20 pt-4">
                  <p className="text-[11px] font-medium text-text-secondary/60 uppercase tracking-wider mb-2">Action / Détail</p>
                  <div className="p-3 rounded-lg bg-background/60 border border-border/30">
                    <p className="text-sm text-text leading-relaxed">{selectedEvent.notes || 'Aucun détail'}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border/30 flex justify-end">
                <button onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-border/40 text-text-secondary hover:text-text hover:bg-background/80 transition-all">
                  Fermer
                </button>
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
            className="fixed inset-0 z-[99999] bg-black/40 flex items-center justify-center p-4"
            onClick={() => setEditingEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-2xl border border-border/50 shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
                <h3 className="font-semibold text-text">Modifier l'action</h3>
                <button onClick={() => setEditingEvent(null)}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-background/80 transition-all">
                  <X size={16} />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-medium text-text-secondary/60 uppercase tracking-wider mb-1">Type</p>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md"
                      style={{ backgroundColor: getActionMeta(editingEvent.type).bgColor, color: getActionMeta(editingEvent.type).color }}>
                      {getActionMeta(editingEvent.type).icon}
                      {getActionMeta(editingEvent.type).label}
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-text-secondary/60 uppercase tracking-wider mb-1">Auteur</p>
                    <p className="text-sm text-text">{displayAgent(editingEvent.agent)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-text-secondary/60 uppercase tracking-wider mb-1.5 block">Notes / Détail</label>
                  <textarea
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    rows={4}
                    className={`w-full rounded-lg border border-border/60 bg-card text-text text-sm px-3 py-2 focus:outline-none focus:ring-2 transition-all resize-none ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]' : 'focus:ring-accent/20 focus:border-accent'}`}
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-border/30 flex justify-end gap-2">
                <button onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-border/40 text-text-secondary hover:text-text hover:bg-background/80 transition-all">
                  Annuler
                </button>
                <button onClick={handleSaveEdit} disabled={saving}
                  className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-all disabled:opacity-50 ${isGerant ? 'bg-[#905D5D] hover:bg-[#905D5D]/90' : 'bg-accent hover:bg-accent/90'}`}>
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
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
            className="fixed inset-0 z-[99999] bg-black/40 flex items-center justify-center p-4"
            onClick={() => setDeletingEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-2xl border border-border/50 shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-border/30 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-50 text-red-500">
                  <Trash2 size={16} />
                </div>
                <h3 className="font-semibold text-text">Supprimer l'action</h3>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-text-secondary">
                  Êtes-vous sûr de vouloir supprimer cette action ? Cette action est irréversible.
                </p>
                <div className="mt-3 p-3 rounded-lg bg-background/60 border border-border/30">
                  <p className="text-xs font-medium text-text">{getActionMeta(deletingEvent.type).label}</p>
                  <p className="text-xs text-text-secondary mt-1">{deletingEvent.notes || 'Aucun détail'}</p>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-border/30 flex justify-end gap-2">
                <button onClick={() => setDeletingEvent(null)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-border/40 text-text-secondary hover:text-text hover:bg-background/80 transition-all">
                  Annuler
                </button>
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
            className="fixed inset-0 z-[99999] bg-black/40 flex items-center justify-center p-4"
            onClick={() => setShowAddAction(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-2xl border border-border/50 shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
                    <Plus size={16} />
                  </div>
                  <h3 className="font-semibold text-text">Ajouter une action</h3>
                </div>
                <button onClick={() => setShowAddAction(false)}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-background/80 transition-all">
                  <X size={16} />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="text-[11px] font-medium text-text-secondary/60 uppercase tracking-wider mb-1.5 block">Type d'action</label>
                  <select
                    value={newActionType}
                    onChange={e => setNewActionType(e.target.value)}
                    className={`w-full h-10 rounded-lg border border-border/60 bg-card text-text text-sm px-3 focus:outline-none focus:ring-2 transition-all ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]' : 'focus:ring-accent/20 focus:border-accent'}`}
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
                  <label className="text-[11px] font-medium text-text-secondary/60 uppercase tracking-wider mb-1.5 block">Notes / Détail</label>
                  <textarea
                    value={newActionNotes}
                    onChange={e => setNewActionNotes(e.target.value)}
                    placeholder="Détails de l'action..."
                    rows={4}
                    className={`w-full rounded-lg border border-border/60 bg-card text-text text-sm px-3 py-2 focus:outline-none focus:ring-2 transition-all resize-none ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]' : 'focus:ring-accent/20 focus:border-accent'}`}
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-border/30 flex justify-end gap-2">
                <button onClick={() => setShowAddAction(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-border/40 text-text-secondary hover:text-text hover:bg-background/80 transition-all">
                  Annuler
                </button>
                <button onClick={handleAddAction} disabled={!newActionType || saving}
                  className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isGerant ? 'bg-[#905D5D] hover:bg-[#905D5D]/90' : 'bg-accent hover:bg-accent/90'}`}>
                  {saving ? 'Ajout...' : 'Ajouter'}
                </button>
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
            className="fixed inset-0 z-[99999] bg-black/40 flex items-center justify-center p-4"
            onClick={() => setShowAddNote(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-2xl border border-border/50 shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-cyan-50 text-cyan-600">
                    <MessageSquare size={16} />
                  </div>
                  <h3 className="font-semibold text-text">Ajouter une note</h3>
                </div>
                <button onClick={() => setShowAddNote(false)}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-background/80 transition-all">
                  <X size={16} />
                </button>
              </div>
              <div className="px-6 py-5">
                <label className="text-[11px] font-medium text-text-secondary/60 uppercase tracking-wider mb-1.5 block">Note</label>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Saisissez le contenu de la note..."
                  rows={4}
                  className={`w-full rounded-lg border border-border/60 bg-card text-text text-sm px-3 py-2 focus:outline-none focus:ring-2 transition-all resize-none ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]' : 'focus:ring-accent/20 focus:border-accent'}`}
                />
              </div>
              <div className="px-6 py-4 border-t border-border/30 flex justify-end gap-2">
                <button onClick={() => setShowAddNote(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-border/40 text-text-secondary hover:text-text hover:bg-background/80 transition-all">
                  Annuler
                </button>
                <button onClick={handleAddNote} disabled={!noteText.trim() || saving}
                  className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isGerant ? 'bg-[#905D5D] hover:bg-[#905D5D]/90' : 'bg-accent hover:bg-accent/90'}`}>
                  {saving ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PropertyTimeline
