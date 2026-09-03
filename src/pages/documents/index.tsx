import { API_ORIGIN } from '../../utils/config'
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useReactToPrint } from 'react-to-print'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Search, X, User, Home, Download, CheckSquare,
  Trash2, Mail, Eye, Folder, MoreVertical, Printer,
  ZoomIn, ZoomOut, RotateCcw, AlertTriangle, Users, Layers,
  Filter, Grid, ChevronDown, File as FileIcon
} from 'react-feather'
import { useToast } from '../../components/ui/Toast'
import { api } from '../../services/api'
import { fetchDocuments, deleteDocument, sendDocumentEmail } from '../../services/documentService'
import {
  GLOBAL_ALL_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_CATEGORY_COLORS,
  getDocTypeLabel,
} from '../../types/document'
import type { DocumentCategory, GlobalDocumentEntry } from '../../types/document'
import { cn } from '../../lib/utils'
import {
  Stage, OrbIcon, StageBadge, StageButton, TiltCard,
  STAGE_HUES, SLATE_HUE, useStageTheme,
} from '../../components/dashboard/Stage'
import StageModal, { useStageFormClasses, useStageModalButtons } from '../../components/modules/calendar/StageModal'
import { Select } from '../../components/ui/Select'

function isAdminRoute() {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/admin')
}
function isImageDoc(doc: GlobalDocumentEntry) {
  const n = doc.name.toLowerCase()
  return /\.(jpg|jpeg|png|gif|webp|svg)$/.test(n)
}

const CATEGORY_HUE_MAP: Record<string, any> = {
  identite: STAGE_HUES.sky,
  financier: STAGE_HUES.emerald,
  mandat: STAGE_HUES.violet,
  juridique: STAGE_HUES.amber,
  technique: STAGE_HUES.sky,
  diagnostic: STAGE_HUES.amber,
  marketing: STAGE_HUES.fuchsia,
  media: { a: '#FB7185', b: '#BE123C', glow: 'rgba(251,113,133,0.5)', line: '#FB7185' },
  contrat: { a: '#EF4444', b: '#991B1B', glow: 'rgba(239,68,68,0.45)', line: '#EF4444' },
  autre: SLATE_HUE,
}

export default function GlobalDocumentsPage() {
  const admin = isAdminRoute()
  const { toast } = useToast()
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const { input, label } = useStageFormClasses()
  const btns = useStageModalButtons()

  const [allDocuments, setAllDocuments] = useState<GlobalDocumentEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<DocumentCategory | ''>('')
  const [filterEntity, setFilterEntity] = useState('')
  const [filterAgent, setFilterAgent] = useState('')
  const [filterFolderSearch, setFilterFolderSearch] = useState('')
  const [filterFolderPath, setFilterFolderPath] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [viewerDoc, setViewerDoc] = useState<GlobalDocumentEntry | null>(null)
  const [printDoc, setPrintDoc] = useState<GlobalDocumentEntry | null>(null)
  const [zoom, setZoom] = useState(100)
  const printContentRef = useRef<HTMLDivElement>(null)
  const [deleteTarget, setDeleteTarget] = useState<GlobalDocumentEntry | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [emailAgentSearch, setEmailAgentSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(true)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      if (admin) {
        const [docs, userList] = await Promise.all([
          fetchDocuments(),
          api.get<any[]>('/admin/users').catch(() => []),
        ])
        setAllDocuments(docs); setUsers(userList)
      } else {
        const me = await api.get<any>('/auth/me').catch(() => null)
        if (me) { const docs = await fetchDocuments(String(me.id)); setAllDocuments(docs) }
      }
    } catch { setAllDocuments([]) } finally { setLoading(false) }
  }, [admin])

  useEffect(() => {
    load()
    const handleVisibility = () => { if (document.visibilityState === 'visible') load(false) }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [load])

  useEffect(() => {
    if (!openMenuId) return
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenuId])

  const filtered = useMemo(() => {
    return allDocuments.filter(doc => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matches = doc.name.toLowerCase().includes(q) || doc.entityName.toLowerCase().includes(q) || getDocTypeLabel(doc.type).toLowerCase().includes(q) || (doc.folderPath || '').toLowerCase().includes(q)
        if (!matches) return false
      }
      if (filterCategory && doc.category !== filterCategory) return false
      if (filterEntity && doc.entityType !== filterEntity) return false
      if (admin && filterAgent && doc.createdBy !== filterAgent) return false
      if (filterEntity === 'property' && filterFolderPath && doc.folderPath !== filterFolderPath) return false
      if (filterEntity === 'property' && filterFolderSearch) {
        const q = filterFolderSearch.toLowerCase()
        if (!(doc.folderPath || '').toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [allDocuments, searchQuery, filterCategory, filterEntity, admin, filterAgent, filterFolderPath, filterFolderSearch])

  const stats = useMemo(() => {
    const total = allDocuments.length
    const clients = allDocuments.filter(d => d.entityType === 'client').length
    const properties = allDocuments.filter(d => d.entityType === 'property').length
    const byCategory: Record<string, number> = {}
    allDocuments.forEach(d => { byCategory[d.category] = (byCategory[d.category] || 0) + 1 })
    const uniqueFolders = Array.from(new Set(allDocuments.filter(d => d.entityType === 'property' && d.folderPath).map(d => d.folderPath!))).sort()
    return { total, clients, properties, byCategory, uniqueFolders }
  }, [allDocuments])

  const clearFilters = () => { setSearchQuery(''); setFilterCategory(''); setFilterEntity(''); setFilterAgent(''); setFilterFolderSearch(''); setFilterFolderPath('') }
  const hasActiveFilters = !!(searchQuery || filterCategory || filterEntity || filterAgent || filterFolderPath || filterFolderSearch)
  const toggleSelect = (id: string) => setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  const toggleSelectAll = () => { if (selectedIds.size === filtered.length) setSelectedIds(new Set()); else setSelectedIds(new Set(filtered.map(d => d.id))) }
  const showCategory = filterEntity !== 'property'
  const showFolderPath = filterEntity === 'property'
  const fullUrl = (doc: GlobalDocumentEntry) => doc.url?.startsWith('http') ? doc.url : `${API_ORIGIN}${doc.url}`
  const handleView = (doc: GlobalDocumentEntry) => { setOpenMenuId(null); if (!doc.url) { toast('info', 'Aucun fichier à prévisualiser'); return }; if (isImageDoc(doc)) { setViewerDoc(doc); setZoom(100) } else window.open(fullUrl(doc), '_blank') }
  const handlePrint = (doc: GlobalDocumentEntry) => { setOpenMenuId(null); if (!doc.url) { toast('info', 'Aucun fichier à imprimer'); return }; if (isImageDoc(doc)) setPrintDoc(doc); else window.open(fullUrl(doc), '_blank') }
  const handleReactToPrint = useReactToPrint({ contentRef: printContentRef, documentTitle: printDoc?.name || 'Document', onAfterPrint: () => setPrintDoc(null) })
  const handleDownload = async (doc: GlobalDocumentEntry) => { setOpenMenuId(null); if (!doc.url) { toast('info', 'Aucun fichier à télécharger'); return }; const url = doc.url.startsWith('http') ? doc.url : `${API_ORIGIN}${doc.url}`; try { const res = await fetch(url); const blob = await res.blob(); const blobUrl = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = blobUrl; a.download = doc.name; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(blobUrl) } catch { toast('error', 'Échec du téléchargement') } }
  const handleDeleteConfirm = async () => { if (!deleteTarget) return; setDeleting(true); try { await deleteDocument(deleteTarget.id); toast('success', `"${deleteTarget.name}" supprimé`); setAllDocuments(prev => prev.filter(d => d.id !== deleteTarget.id)); setDeleteTarget(null) } catch { toast('error', 'Échec suppression') } finally { setDeleting(false) } }
  const selectedDocs = useMemo(() => allDocuments.filter(d => selectedIds.has(d.id)), [allDocuments, selectedIds])
  const handleBulkExport = async () => { for (const doc of selectedDocs) { if (!doc.url) continue; const url = doc.url.startsWith('http') ? doc.url : `${API_ORIGIN}${doc.url}`; try { const res = await fetch(url); const blob = await res.blob(); const blobUrl = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = blobUrl; a.download = doc.name; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(blobUrl); await new Promise(r => setTimeout(r, 300)) } catch {} } toast('success', `${selectedDocs.length} document(s) exporté(s)`); setSelectedIds(new Set()); setExportOpen(false) }
  const handleBulkDelete = async () => { setBulkDeleting(true); let ok = 0; for (const doc of selectedDocs) { try { await deleteDocument(doc.id); ok++ } catch {} } if (ok > 0) { toast('success', `${ok} document(s) supprimé(s)`); setAllDocuments(prev => prev.filter(d => !selectedIds.has(d.id))) } else toast('error', 'Échec suppression'); setSelectedIds(new Set()); setBulkDeleting(false); setBulkDeleteOpen(false) }
  const filteredAgentEmails = useMemo(() => { if (!emailAgentSearch) return users; const q = emailAgentSearch.toLowerCase(); return users.filter(u => `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)) }, [users, emailAgentSearch])
  const handleSendEmail = async () => { if (!emailTo || !selectedDocs.length) return; try { const senderName = admin ? 'Un administrateur' : 'Votre agent'; await sendDocumentEmail({ to: emailTo, subject: emailSubject || 'Documents partagés', message: emailMessage, senderName, documents: selectedDocs.map(d => ({ id: d.id, name: d.name, size: d.size, url: d.url })) }); toast('success', `Email envoyé à ${emailTo} avec ${selectedDocs.length} pièce(s)`); setEmailOpen(false); setEmailTo(''); setEmailSubject(''); setEmailMessage(''); setEmailAgentSearch('') } catch { toast('error', "Échec de l'envoi") } }

  const sectionTitle = 'mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80'
  const ctrl = (extra?: string) => input(extra)
  const colCount = (admin ? 1 : 0) + 1 + 1 + (showCategory ? 1 : 0) + 1 + (showFolderPath ? 1 : 0) + (admin ? 1 : 0) + 1 + 1 + 1

  return (
    <Stage theme={theme}>
      <div className="space-y-6">
        {/* ── Hero ── */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              </span>
              <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>Mission control · Documents</p>
            </div>
            <h1 className={`mt-1 text-3xl font-extrabold tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent' : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent'}`}>Documents</h1>
            <p className={`mt-0.5 text-sm ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>{admin ? `Portail général — ${stats.total} documents dans l'agence` : 'Mes documents centralisés'}</p>
          </div>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <StageBadge variant="violet">{selectedIds.size} sélectionné(s)</StageBadge>
              <StageButton variant="primary" icon={<Download size={13} />} onClick={() => setExportOpen(true)}>Exporter</StageButton>
              <StageButton variant="glass" icon={<Mail size={13} />} onClick={() => setEmailOpen(true)}>Envoyer</StageButton>
            </div>
          )}
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, sub: admin ? "documents dans l'agence" : 'mes documents', icon: Layers, hue: STAGE_HUES.violet },
            { label: 'Clients', value: stats.clients, sub: 'documents associés', icon: Users, hue: STAGE_HUES.sky },
            { label: 'Biens', value: stats.properties, sub: 'documents associés', icon: Home, hue: STAGE_HUES.emerald },
            { label: 'Catégories', value: Object.keys(stats.byCategory).length, sub: `${Object.keys(stats.byCategory).length} types`, icon: Folder, hue: STAGE_HUES.amber },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}>
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

        {Object.keys(stats.byCategory).length > 0 && (
          <div className="stage-glass p-5">
            <div className="flex items-center gap-3 mb-4">
              <OrbIcon icon={FileText} hue={STAGE_HUES.fuchsia} size={36} radius={11} />
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Répartition par catégorie</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(stats.byCategory).sort(([,a],[,b])=> (b as number)-(a as number)).map(([cat,count])=> {
                const hue = CATEGORY_HUE_MAP[cat] || SLATE_HUE
                const pct = stats.total>0? Math.round((count as number)/stats.total*100):0
                return (
                  <div key={cat} className={`rounded-2xl border p-3 flex items-center gap-2.5 ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/40'}`}>
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: hue.line, boxShadow: `0 0 8px ${hue.glow}` }} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{DOCUMENT_CATEGORY_LABELS[cat as DocumentCategory]}</p>
                      <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{count} · {pct}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Command bar — Recherche + Filtres ── */}
        <div className={cn('overflow-hidden', isDark ? 'pop-glass rounded-3xl border border-white/10' : 'stage-glass rounded-2xl')}>
          <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${isDark ? 'rgba(139,124,255,0.9)' : 'rgba(20,184,166,0.9)'} 18%, ${isDark ? '#8B7CFF' : '#14B8A6'} 50%, transparent)` }} />
          <div className="px-5 pt-5 pb-4 space-y-5" style={{ background: isDark ? 'radial-gradient(90% 140% at 0% 0%, rgba(139,124,255,0.07), transparent 65%)' : 'radial-gradient(90% 140% at 0% 0%, rgba(20,184,166,0.06), transparent 65%)' }}>
            {/* Recherche */}
            <section>
              <p className={`${sectionTitle} ${isDark ? 'text-violet-400' : 'text-violet-600'}`}><span className="h-px w-4 bg-gradient-to-r from-violet-400 to-transparent" /> Recherche</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isDark ? '#8B7CFF' : '#0D9488' }} />
                  <input placeholder="Rechercher un document, entité, dossier..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={input('h-10 pl-9 pr-9')} />
                  {searchQuery && <button onClick={() => setSearchQuery('')} className={cn('absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center', isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-teal-900/40 hover:text-teal-900 hover:bg-teal-900/5')}><X size={13} /></button>}
                </div>
                {hasActiveFilters && <button onClick={clearFilters} className={cn('h-10 inline-flex items-center gap-1.5 rounded-xl border px-4 text-xs font-semibold transition-colors shrink-0', isDark ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white' : 'border-teal-900/10 bg-white text-teal-700 hover:bg-teal-50')}><X size={12} /> Réinitialiser</button>}
              </div>
            </section>

            {/* Filtres */}
            <section>
              <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={() => setFiltersOpen(o => !o)} className="group flex items-center gap-2 text-left">
                  <p className={`${sectionTitle} !mb-0 ${isDark ? 'text-sky-400' : 'text-sky-600'} group-hover:opacity-100 transition-opacity`}><span className="h-px w-4 bg-gradient-to-r from-sky-400 to-transparent" /> Filtres
                    {(filterEntity || filterCategory || filterFolderPath || filterFolderSearch || filterAgent) && (
                      <span className={cn('ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold border', isDark ? 'bg-sky-500/20 text-sky-300 border-sky-400/30' : 'bg-sky-500/15 text-sky-700 border-sky-500/20')}>
                        {[filterEntity, filterCategory, filterFolderPath, filterFolderSearch, filterAgent].filter(Boolean).length}
                      </span>
                    )}
                  </p>
                  <motion.span animate={{ rotate: filtersOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className={cn('flex h-6 w-6 items-center justify-center rounded-lg border', isDark ? 'border-white/10 bg-white/[0.04] text-slate-400 group-hover:bg-white/10 group-hover:text-white' : 'border-teal-900/10 bg-white/60 text-teal-900/50 group-hover:bg-white group-hover:text-teal-900')}><ChevronDown size={13} /></motion.span>
                </button>
                <span className={cn('text-[11px]', isDark ? 'text-slate-500' : 'text-slate-400')}>{filtersOpen ? 'Réduire' : 'Développer'}</span>
              </div>

              <AnimatePresence initial={false}>
                {filtersOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-3">
                      <div>
                        <label className={label}>Entité</label>
                        <Select value={filterEntity} onValueChange={v => { setFilterEntity(v); setFilterFolderPath(''); setFilterFolderSearch(''); setFilterCategory('') }} options={[{ value: '', label: 'Toutes entités' }, { value: 'client', label: 'Client' }, { value: 'property', label: 'Bien' }]} className={ctrl('h-10')} />
                      </div>
                      {showCategory && (
                        <div>
                          <label className={label}>Catégorie</label>
                          <Select value={filterCategory} onValueChange={v => setFilterCategory(v as any)} options={[{ value: '', label: 'Toutes catégories' }, ...GLOBAL_ALL_CATEGORIES.map(c => ({ value: c.key, label: c.label }))]} className={ctrl('h-10')} />
                        </div>
                      )}
                      {showFolderPath && (
                        <div>
                          <label className={label}>Dossier</label>
                          <Select value={filterFolderPath} onValueChange={setFilterFolderPath} options={[{ value: '', label: 'Tous les dossiers' }, ...stats.uniqueFolders.map(f => ({ value: f, label: f || '(racine)' }))]} className={ctrl('h-10')} />
                        </div>
                      )}
                      {showFolderPath && (
                        <div>
                          <label className={label}>Chemin</label>
                          <div className="relative">
                            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isDark ? '#64748B' : '#64748B' }} />
                            <input placeholder="Chemin..." value={filterFolderSearch} onChange={e => setFilterFolderSearch(e.target.value)} className={input('h-10 pl-9')} />
                          </div>
                        </div>
                      )}
                      {admin && (
                        <div>
                          <label className={label}>Agent</label>
                          <Select value={filterAgent} onValueChange={setFilterAgent} options={[{ value: '', label: 'Tous les agents' }, ...users.map((u: any) => ({ value: String(u.id), label: `${u.first_name || ''} ${u.last_name || ''}`.trim() || String(u.id) }))]} className={ctrl('h-10')} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!filtersOpen && (filterEntity || filterCategory || filterFolderPath || filterFolderSearch || filterAgent) && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {filterEntity && <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border', isDark ? 'bg-white/[0.06] border-white/10 text-slate-300' : 'bg-white border-teal-900/10 text-slate-700')}><Grid size={11} /> {filterEntity === 'client' ? 'Client' : 'Bien'}</span>}
                  {filterCategory && <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border', isDark ? 'bg-white/[0.06] border-white/10 text-slate-300' : 'bg-white border-teal-900/10 text-slate-700')}><FileText size={11} /> {DOCUMENT_CATEGORY_LABELS[filterCategory as DocumentCategory]}</span>}
                  {filterFolderPath && <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border', isDark ? 'bg-white/[0.06] border-white/10 text-slate-300' : 'bg-white border-teal-900/10 text-slate-700')}><Folder size={11} /> {filterFolderPath}</span>}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="stage-glass p-16 text-center">
            <motion.div className="h-10 w-10 rounded-full border-[3px] border-indigo-400/30 border-t-indigo-400 mx-auto animate-spin" style={{ filter: 'drop-shadow(0 0 14px rgba(139,124,255,0.6))' }} />
            <p className={`text-sm mt-3 ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>Chargement des documents...</p>
          </div>
        ) : (
          <div className="stage-glass overflow-hidden p-0">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className={cn('border-b', isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/40')}>
                    {admin && (
                      <th className={`text-left px-3 py-3 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'} w-8`}>
                        <button onClick={toggleSelectAll} className={cn('p-1 rounded-lg transition-colors', isDark ? 'hover:bg-white/5' : 'hover:bg-white')}><CheckSquare size={15} className={selectedIds.size > 0 ? (isDark ? 'text-violet-300' : 'text-teal-600') : 'text-slate-400/40'} /></button>
                      </th>
                    )}
                    <th className={`text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Nom du document</th>
                    <th className={`text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Type</th>
                    {showCategory && <th className={`text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Catégorie</th>}
                    {showFolderPath && <th className={`text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Chemin</th>}
                    <th className={`text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Entité</th>
                    {admin && <th className={`text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Géré par</th>}
                    <th className={`text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Date</th>
                    <th className={`text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Taille</th>
                    <th className={`text-right px-4 py-3 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'} w-10`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={cn('divide-y', isDark ? 'divide-white/5' : 'divide-slate-100')}>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={colCount} className="px-4 py-16 text-center">
                      <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-100'}`}><FileText size={22} className={isDark ? 'text-slate-500' : 'text-slate-400'} /></div>
                      <p className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Aucun document trouvé</p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Essayez de modifier vos filtres</p>
                    </td></tr>
                  ) : filtered.map((doc, index) => (
                    <motion.tr key={doc.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.008, duration: 0.18 }} className={cn('group transition-colors', isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50/60')}>
                      {admin && <td className="px-3 py-3"><button onClick={() => toggleSelect(doc.id)} className={cn('p-1 rounded-lg', isDark ? 'hover:bg-white/5' : 'hover:bg-white')}><CheckSquare size={14} className={selectedIds.has(doc.id) ? (isDark ? 'text-violet-300' : 'text-teal-600') : 'text-slate-400/30 group-hover:text-slate-400/60'} /></button></td>}
                      <td className="px-4 py-3 max-w-[260px]">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-100'}`}><FileIcon size={14} className={isDark ? 'text-slate-400' : 'text-slate-500'} /></div>
                          <span className={`font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{doc.name}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{getDocTypeLabel(doc.type)}</td>
                      {showCategory && <td className="px-4 py-3"><StageBadge variant="neutral" className="text-[10px] !px-2 !py-1" style={{ borderColor: `${(CATEGORY_HUE_MAP[doc.category]||SLATE_HUE).a}30`, color: (CATEGORY_HUE_MAP[doc.category]||SLATE_HUE).a }}>{DOCUMENT_CATEGORY_LABELS[doc.category]}</StageBadge></td>}
                      {showFolderPath && <td className="px-4 py-3">{doc.folderPath ? <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border font-semibold bg-amber-500/10 text-amber-600 border-amber-500/20"><Folder size={10} /> {doc.folderPath}</span> : <span className={`text-[11px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>—</span>}</td>}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border font-semibold ${doc.entityType === 'client' ? (isDark ? 'bg-sky-500/10 text-sky-300 border-sky-500/20' : 'bg-sky-50 text-sky-700 border-sky-200') : (isDark ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200')}`}>
                            {doc.entityType === 'client' ? <User size={11} /> : <Home size={11} />} {doc.entityType === 'client' ? 'Client' : 'Bien'}
                          </span>
                          <span className={`text-sm truncate max-w-[140px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{doc.entityName}</span>
                        </div>
                      </td>
                      {admin && <td className="px-4 py-3">{(() => { const u = users.find((u:any) => String(u.id)===String(doc.createdBy)); const name = u ? `${u.first_name||''} ${u.last_name||''}`.trim() : null; return <div className="flex flex-col gap-1"><span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{name||'Non assigné'}</span>{name && u?.role ? <StageBadge variant={u.role==='admin'?'violet':'neutral'} className="text-[10px] w-fit">{u.role==='admin'?'Admin':'Agent'}</StageBadge> : <StageBadge variant="neutral" className="text-[10px] w-fit">—</StageBadge>}</div> })()}</td>}
                      <td className={`px-4 py-3 text-xs whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{new Date(doc.date).toLocaleDateString('fr-FR')}</td>
                      <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{doc.size || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={e => { if (openMenuId===doc.id){ setOpenMenuId(null); setMenuPos(null)} else { const rect=(e.currentTarget as HTMLElement).getBoundingClientRect(); const menuW=192, menuH=200; let left=rect.right-menuW, top=rect.bottom+4; if(left+menuW>window.innerWidth-8) left=window.innerWidth-menuW-8; if(left<8) left=8; if(top+menuH>window.innerHeight-8) top=rect.top-menuH-4; setMenuPos({top,left}); setOpenMenuId(doc.id) } }} className={cn('w-7 h-7 rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100', isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100')}><MoreVertical size={14} /></button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={cn('px-4 py-3 border-t text-xs flex items-center justify-between', isDark ? 'border-white/5 text-slate-500 bg-white/[0.02]' : 'border-slate-100 text-slate-400 bg-slate-50/30')}>
              <span>{filtered.length} document(s) affiché(s)</span>
              {selectedIds.size>0 && <span className={isDark ? 'text-violet-300' : 'text-teal-700'}>{selectedIds.size} sélectionné(s)</span>}
            </div>
          </div>
        )}

        {admin && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 stage-glass p-5">
              <div className="flex items-center gap-3 mb-4">
                <OrbIcon icon={Layers} hue={STAGE_HUES.violet} size={36} radius={11} />
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Répartition par catégorie</h3>
              </div>
              <div className="space-y-2.5">
                {Object.entries(stats.byCategory).sort(([,a],[,b])=> (b as number)-(a as number)).map(([cat,count])=> {
                  const hue = CATEGORY_HUE_MAP[cat]||SLATE_HUE
                  const pct = stats.total>0? Math.round((count as number)/stats.total*100):0
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}><span className="w-2 h-2 rounded-full" style={{ background: hue.line, boxShadow: `0 0 8px ${hue.glow}` }} /> {DOCUMENT_CATEGORY_LABELS[cat as DocumentCategory]}</span>
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{count} ({pct}%)</span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-100 border border-slate-200/50'}`}>
                        <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${hue.b}, ${hue.a})`, boxShadow: `0 0 10px ${hue.glow}` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="stage-glass p-5">
              <div className="flex items-center gap-3 mb-4">
                <OrbIcon icon={FileText} hue={STAGE_HUES.emerald} size={36} radius={11} />
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Actions rapides</h3>
              </div>
              <div className="space-y-2">
                <button onClick={()=>setExportOpen(true)} className={cn('w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl border transition-colors', isDark ? 'border-white/5 bg-white/[0.02] text-slate-300 hover:bg-white/[0.06] hover:text-white' : 'border-slate-100 bg-slate-50/50 text-slate-700 hover:bg-white')}><Download size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} /> Exporter {selectedIds.size>0 && `(${selectedIds.size})`}</button>
                <button onClick={()=>setEmailOpen(true)} className={cn('w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl border transition-colors', isDark ? 'border-white/5 bg-white/[0.02] text-slate-300 hover:bg-white/[0.06] hover:text-white' : 'border-slate-100 bg-slate-50/50 text-slate-700 hover:bg-white')}><Mail size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} /> Envoyer par email {selectedIds.size>0 && `(${selectedIds.size})`}</button>
                <button onClick={()=>setBulkDeleteOpen(true)} className={cn('w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl border transition-colors text-rose-500 hover:text-rose-600', isDark ? 'border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10' : 'border-rose-200 bg-rose-50 hover:bg-rose-100')}><Trash2 size={14} /> Supprimer {selectedIds.size>0 && `(${selectedIds.size})`}</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Portaled menu ── */}
        {openMenuId && menuPos && createPortal(
          <>
            <div className="fixed inset-0 z-[60]" onClick={()=>{setOpenMenuId(null); setMenuPos(null)}} />
            <motion.div ref={menuRef} initial={{ opacity:0, scale:0.95, y:-4 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:-4 }} transition={{ duration:0.12 }} className={cn('fixed z-[61] w-48 rounded-2xl border p-1.5 shadow-xl', isDark ? 'bg-[#111832] border-white/10' : 'bg-white border-slate-200')} style={{ top: menuPos.top, left: menuPos.left }}>
              {(() => { const doc=filtered.find(d=>d.id===openMenuId); if(!doc) return null; return (
                <>
                  <button onClick={()=>handleView(doc)} className={cn('w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl transition-colors', isDark ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-slate-700 hover:bg-slate-50')}><Eye size={14} className={isDark?'text-slate-500':'text-slate-400'} /> Voir</button>
                  <button onClick={()=>handlePrint(doc)} className={cn('w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl transition-colors', isDark ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-slate-700 hover:bg-slate-50')}><Printer size={14} className={isDark?'text-slate-500':'text-slate-400'} /> Imprimer</button>
                  <button onClick={()=>handleDownload(doc)} className={cn('w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl transition-colors', isDark ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-slate-700 hover:bg-slate-50')}><Download size={14} className={isDark?'text-slate-500':'text-slate-400'} /> Télécharger</button>
                  <div className={cn('my-1 border-t', isDark?'border-white/5':'border-slate-100')} />
                  <button onClick={()=>{setOpenMenuId(null); setMenuPos(null); setDeleteTarget(doc)}} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-rose-500/10 text-rose-500 transition-colors"><Trash2 size={14} /> Supprimer</button>
                </>
              )})()}
            </motion.div>
          </>,
          document.body
        )}

        {/* ── Modals — StageModal ── */}
        <StageModal open={!!viewerDoc} onClose={()=>setViewerDoc(null)} title={viewerDoc?.name||''} subtitle={viewerDoc ? `${getDocTypeLabel(viewerDoc.type)} · ${viewerDoc.entityName}` : ''} icon={Eye} hue={STAGE_HUES.sky} maxWidth="max-w-3xl" centered>
          {viewerDoc?.url && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <button onClick={()=>setZoom(z=>Math.max(25,z-25))} className={cn('w-8 h-8 rounded-xl flex items-center justify-center border transition-colors', isDark?'border-white/10 text-slate-400 hover:bg-white/5':'border-slate-200 text-slate-600 hover:bg-slate-50')}><ZoomOut size={14} /></button>
                <span className={`text-xs font-semibold w-12 text-center ${isDark?'text-slate-400':'text-slate-500'}`}>{zoom}%</span>
                <button onClick={()=>setZoom(z=>Math.min(400,z+25))} className={cn('w-8 h-8 rounded-xl flex items-center justify-center border transition-colors', isDark?'border-white/10 text-slate-400 hover:bg-white/5':'border-slate-200 text-slate-600 hover:bg-slate-50')}><ZoomIn size={14} /></button>
                <button onClick={()=>setZoom(100)} className={cn('w-8 h-8 rounded-xl flex items-center justify-center border', isDark?'border-white/10 text-slate-400':'border-slate-200 text-slate-600')}><RotateCcw size={14} /></button>
              </div>
              <div className={cn('w-full max-h-[65vh] overflow-auto rounded-2xl border flex items-center justify-center p-4', isDark?'border-white/5 bg-white/[0.02]':'border-slate-100 bg-slate-50')}>
                <img src={fullUrl(viewerDoc)} alt={viewerDoc.name} style={{ transform:`scale(${zoom/100})`, transformOrigin:'center center' }} className="max-w-full transition-transform duration-150 rounded-xl" />
              </div>
            </div>
          )}
        </StageModal>

        <StageModal open={!!deleteTarget} onClose={()=>setDeleteTarget(null)} title="Supprimer le document" icon={AlertTriangle} hue={{ a:'#FB7185', b:'#BE123C', glow:'rgba(251,113,133,0.5)', line:'#FB7185' }} maxWidth="max-w-md" centered footer={<><button onClick={()=>setDeleteTarget(null)} className={btns.ghost}>Annuler</button><button onClick={handleDeleteConfirm} disabled={deleting} className={btns.primary + ' !from-rose-500 !to-rose-600'}>{deleting?'Suppression...':'Supprimer'}</button></>}>
          {deleteTarget && (
            <div className={cn('rounded-2xl border p-4 flex gap-3', isDark?'bg-rose-500/5 border-rose-500/20':'bg-rose-50 border-rose-200')}>
              <OrbIcon icon={Trash2} hue={{ a:'#FB7185', b:'#BE123C', glow:'rgba(251,113,133,0.4)', line:'#FB7185' }} size={36} radius={11} />
              <div><p className={`text-sm ${isDark?'text-white':'text-slate-900'}`}>Voulez-vous vraiment supprimer <strong>{deleteTarget.name}</strong> ?</p><p className={`text-xs mt-1 ${isDark?'text-slate-400':'text-slate-500'}`}>Cette action est irréversible. Le fichier sera définitivement supprimé.</p></div>
            </div>
          )}
        </StageModal>

        <StageModal open={!!printDoc} onClose={()=>setPrintDoc(null)} title={`Imprimer — ${printDoc?.name||''}`} icon={Printer} hue={STAGE_HUES.emerald} maxWidth="max-w-3xl" centered footer={<button onClick={()=>handleReactToPrint()} className={btns.primary}><Printer size={14} /> Imprimer</button>}>
          {printDoc?.url && <div ref={printContentRef} className="flex items-center justify-center bg-white rounded-2xl border border-slate-200 p-6" style={{ minHeight:'50vh' }}><img src={fullUrl(printDoc)} alt={printDoc.name} className="max-w-full max-h-[60vh] object-contain" /></div>}
        </StageModal>

        <StageModal open={exportOpen} onClose={()=>setExportOpen(false)} title="Exporter les documents" icon={Download} hue={STAGE_HUES.violet} maxWidth="max-w-md" footer={<><button onClick={()=>setExportOpen(false)} className={btns.ghost}>Annuler</button><button onClick={handleBulkExport} className={btns.primary}><Download size={14} /> Télécharger tout</button></>}>
          <p className={`text-sm ${isDark?'text-slate-400':'text-slate-500'}`}>{selectedDocs.length} document(s) seront téléchargé(s).</p>
          <div className={cn('max-h-64 overflow-auto rounded-2xl border divide-y', isDark?'border-white/5 divide-white/5':'border-slate-100 divide-slate-100')}>
            {selectedDocs.map(doc=> <div key={doc.id} className={cn('flex items-center gap-3 px-3 py-2.5', isDark?'hover:bg-white/[0.03]':'hover:bg-slate-50')}><FileText size={14} className={isDark?'text-slate-500':'text-slate-400'} /><span className={`text-sm truncate flex-1 ${isDark?'text-slate-200':'text-slate-700'}`}>{doc.name}</span><span className="text-xs text-slate-400">{doc.size||'—'}</span></div>)}
          </div>
        </StageModal>

        <StageModal open={bulkDeleteOpen} onClose={()=>setBulkDeleteOpen(false)} title="Supprimer les documents" icon={AlertTriangle} hue={{ a:'#FB7185', b:'#BE123C', glow:'rgba(251,113,133,0.5)', line:'#FB7185' }} maxWidth="max-w-md" footer={<><button onClick={()=>setBulkDeleteOpen(false)} className={btns.ghost}>Annuler</button><button onClick={handleBulkDelete} disabled={bulkDeleting} className={btns.primary + ' !from-rose-500 !to-rose-600'}>{bulkDeleting?'Suppression...':'Supprimer tout'}</button></>}>
          <div className={cn('rounded-2xl border p-4 flex gap-3', isDark?'bg-rose-500/5 border-rose-500/20':'bg-rose-50 border-rose-200')}><OrbIcon icon={Trash2} hue={{ a:'#FB7185', b:'#BE123C', glow:'rgba(251,113,133,0.4)', line:'#FB7185' }} size={36} radius={11} /><div><p className={`text-sm ${isDark?'text-white':'text-slate-900'}`}>Voulez-vous vraiment supprimer <strong>{selectedDocs.length} document(s)</strong> ?</p><p className={`text-xs mt-1 ${isDark?'text-slate-400':'text-slate-500'}`}>Cette action est irréversible.</p></div></div>
          <div className={cn('max-h-48 overflow-auto rounded-2xl border divide-y', isDark?'border-white/5 divide-white/5':'border-slate-100 divide-slate-100')}>
            {selectedDocs.map(doc=> <div key={doc.id} className="flex items-center gap-3 px-3 py-2"><FileText size={12} className="text-slate-400" /><span className={`text-sm truncate ${isDark?'text-slate-300':'text-slate-700'}`}>{doc.name}</span></div>)}
          </div>
        </StageModal>

        <StageModal open={emailOpen} onClose={()=>setEmailOpen(false)} title="Envoyer par email" icon={Mail} hue={STAGE_HUES.sky} maxWidth="max-w-lg" footer={<><button onClick={()=>setEmailOpen(false)} className={btns.ghost}>Annuler</button><button onClick={handleSendEmail} disabled={!emailTo} className={btns.primary}><Mail size={14} /> Envoyer</button></>}>
          <div className="space-y-4">
            <div>
              <label className={label}>Destinataire</label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isDark?'#8B7CFF':'#0D9488' }} />
                <input placeholder="Rechercher un agent..." value={emailAgentSearch} onChange={e=>{setEmailAgentSearch(e.target.value); setEmailTo('')}} className={input('h-10 pl-9')} />
              </div>
              {emailAgentSearch && !emailTo && (
                <div className={cn('mt-2 max-h-36 overflow-auto rounded-2xl border divide-y shadow-lg', isDark?'bg-[#0F1220] border-white/10 divide-white/5':'bg-white border-slate-200 divide-slate-100')}>
                  {filteredAgentEmails.length===0 ? <p className={`px-3 py-3 text-xs ${isDark?'text-slate-500':'text-slate-400'}`}>Aucun agent trouvé</p> : filteredAgentEmails.map((u:any)=>(
                    <button key={u.id} onClick={()=>{ setEmailTo(u.email||`${u.first_name||''}.${u.last_name||''}@agence.fr`.toLowerCase()); setEmailAgentSearch(`${u.first_name||''} ${u.last_name||''}`.trim()) }} className={cn('w-full flex items-center gap-3 px-3 py-2 text-left transition-colors', isDark?'hover:bg-white/5':'hover:bg-slate-50')}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isDark?'bg-violet-500/15 text-violet-300':'bg-teal-50 text-teal-700'}`}><User size={12} /></div>
                      <div className="min-w-0"><p className={`text-sm font-medium truncate ${isDark?'text-white':'text-slate-900'}`}>{`${u.first_name||''} ${u.last_name||''}`.trim()}</p><p className={`text-xs truncate ${isDark?'text-slate-500':'text-slate-400'}`}>{u.email||'—'}</p></div>
                    </button>
                  ))}
                </div>
              )}
              {emailTo && <p className={`mt-2 text-xs px-3 py-2 rounded-xl border ${isDark?'bg-emerald-500/10 border-emerald-500/20 text-emerald-300':'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>→ {emailTo}</p>}
            </div>
            <div><label className={label}>Objet</label><input value={emailSubject} onChange={e=>setEmailSubject(e.target.value)} placeholder="Objet de l'email..." className={input('h-10')} /></div>
            <div><label className={label}>Message</label><textarea value={emailMessage} onChange={e=>setEmailMessage(e.target.value)} placeholder="Votre message..." rows={4} className={input('min-h-[100px] py-2 resize-none')} /></div>
            {selectedDocs.length>0 && (
              <div>
                <label className={label}>Pièces jointes ({selectedDocs.length})</label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDocs.map(doc=> <span key={doc.id} className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-xl border', isDark?'bg-violet-500/10 border-violet-500/20 text-violet-300':'bg-teal-50 border-teal-200 text-teal-700')}><FileText size={11} /> <span className="max-w-[140px] truncate">{doc.name}</span></span>)}
                </div>
              </div>
            )}
          </div>
        </StageModal>
      </div>
    </Stage>
  )
}
