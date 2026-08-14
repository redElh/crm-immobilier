import { API_ORIGIN } from '../../utils/config'
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useReactToPrint } from 'react-to-print'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Search, X, User, Home, Download, CheckSquare,
  Trash2, Mail, Eye, Folder, MoreVertical, Printer,
  ZoomIn, ZoomOut, RotateCcw, AlertTriangle, Users, Layers,
} from 'react-feather'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
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

function isAdminRoute() {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/admin')
}

function isImageDoc(doc: GlobalDocumentEntry) {
  const n = doc.name.toLowerCase()
  return /\.(jpg|jpeg|png|gif|webp|svg)$/.test(n)
}

const entityTypeColor = (type: string) => {
  switch (type) {
    case 'client': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    case 'property': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    default: return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'
  }
}

const entityTypeLabel = (type: string) => {
  switch (type) {
    case 'client': return 'Client'
    case 'property': return 'Bien'
    default: return type
  }
}

const entityIcon = (type: string) => {
  switch (type) {
    case 'client': return <User size={12} />
    case 'property': return <Home size={12} />
    default: return <FileText size={12} />
  }
}

export default function GlobalDocumentsPage() {
  const admin = isAdminRoute()
  const { toast } = useToast()

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
        setAllDocuments(docs)
        setUsers(userList)
      } else {
        const me = await api.get<any>('/auth/me').catch(() => null)
        if (me) {
          const docs = await fetchDocuments(String(me.id))
          setAllDocuments(docs)
        }
      }
    } catch {
      setAllDocuments([])
    } finally {
      setLoading(false)
    }
  }, [admin])

  useEffect(() => {
    load()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') load(false)
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [load])

  // close menu on outside click
  useEffect(() => {
    if (!openMenuId) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenuId])

  const filtered = useMemo(() => {
    return allDocuments.filter(doc => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matches =
          doc.name.toLowerCase().includes(q) ||
          doc.entityName.toLowerCase().includes(q) ||
          getDocTypeLabel(doc.type).toLowerCase().includes(q) ||
          (doc.folderPath || '').toLowerCase().includes(q)
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
    allDocuments.forEach(d => {
      byCategory[d.category] = (byCategory[d.category] || 0) + 1
    })
    const uniqueFolders = Array.from(new Set(allDocuments.filter(d => d.entityType === 'property' && d.folderPath).map(d => d.folderPath!))).sort()
    return { total, clients, properties, byCategory, uniqueFolders }
  }, [allDocuments])

  const clearFilters = () => {
    setSearchQuery('')
    setFilterCategory('')
    setFilterEntity('')
    setFilterAgent('')
    setFilterFolderSearch('')
    setFilterFolderPath('')
  }

  const hasActiveFilters = searchQuery || filterCategory || filterEntity || filterAgent || filterFolderPath || filterFolderSearch

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(d => d.id)))
    }
  }

  const showCategory = filterEntity !== 'property'
  const showFolderPath = filterEntity === 'property'

  const agentName = (id: string) => {
    const u = users.find(u => String(u.id) === String(id))
    if (u) return `${u.first_name || ''} ${u.last_name || ''}`.trim() || id
    return id
  }

  const inputClass = "h-9 px-3 text-sm rounded-lg border border-border bg-background text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"

  const colCount = (admin ? 1 : 0) + 1 + 1 + (showCategory ? 1 : 0) + 1 + (showFolderPath ? 1 : 0) + (admin ? 1 : 0) + 1 + 1 + 1

  // ── Action handlers ──

  const fullUrl = (doc: GlobalDocumentEntry) =>
    doc.url?.startsWith('http') ? doc.url : `${API_ORIGIN}${doc.url}`

  const handleView = (doc: GlobalDocumentEntry) => {
    setOpenMenuId(null)
    if (!doc.url) { toast('info', 'Aucun fichier à prévisualiser'); return }
    if (isImageDoc(doc)) {
      setViewerDoc(doc)
      setZoom(100)
    } else {
      window.open(fullUrl(doc), '_blank')
    }
  }

  const handlePrint = (doc: GlobalDocumentEntry) => {
    setOpenMenuId(null)
    if (!doc.url) { toast('info', 'Aucun fichier à imprimer'); return }
    if (isImageDoc(doc)) {
      setPrintDoc(doc)
    } else {
      window.open(fullUrl(doc), '_blank')
    }
  }

  const handleReactToPrint = useReactToPrint({
    contentRef: printContentRef,
    documentTitle: printDoc?.name || 'Document',
    onAfterPrint: () => setPrintDoc(null),
  })

  const handleDownload = async (doc: GlobalDocumentEntry) => {
    setOpenMenuId(null)
    if (!doc.url) { toast('info', 'Aucun fichier à télécharger'); return }
    const fullUrl = doc.url.startsWith('http') ? doc.url : `${API_ORIGIN}${doc.url}`
    try {
      const res = await fetch(fullUrl)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = doc.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      toast('error', 'Échec du téléchargement')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteDocument(deleteTarget.id)
      toast('success', `"${deleteTarget.name}" supprimé avec succès`)
      setAllDocuments(prev => prev.filter(d => d.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch {
      toast('error', 'Échec de la suppression du document')
    } finally {
      setDeleting(false)
    }
  }

  const selectedDocs = useMemo(
    () => allDocuments.filter(d => selectedIds.has(d.id)),
    [allDocuments, selectedIds]
  )

  const handleBulkExport = async () => {
    for (const doc of selectedDocs) {
      if (!doc.url) continue
      const url = doc.url.startsWith('http') ? doc.url : `${API_ORIGIN}${doc.url}`
      try {
        const res = await fetch(url)
        const blob = await res.blob()
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = doc.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(blobUrl)
        await new Promise(r => setTimeout(r, 300))
      } catch {}
    }
    toast('success', `${selectedDocs.length} document${selectedDocs.length > 1 ? 's' : ''} exporté${selectedDocs.length > 1 ? 's' : ''}`)
    setSelectedIds(new Set())
    setExportOpen(false)
  }

  const handleBulkDelete = async () => {
    setBulkDeleting(true)
    let ok = 0
    for (const doc of selectedDocs) {
      try {
        await deleteDocument(doc.id)
        ok++
      } catch {}
    }
    if (ok > 0) {
      toast('success', `${ok} document${ok > 1 ? 's' : ''} supprimé${ok > 1 ? 's' : ''}`)
      setAllDocuments(prev => prev.filter(d => !selectedIds.has(d.id)))
    } else {
      toast('error', 'Échec de la suppression')
    }
    setSelectedIds(new Set())
    setBulkDeleting(false)
    setBulkDeleteOpen(false)
  }

  const filteredAgentEmails = useMemo(() => {
    if (!emailAgentSearch) return users
    const q = emailAgentSearch.toLowerCase()
    return users.filter(u =>
      `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    )
  }, [users, emailAgentSearch])

  const handleSendEmail = async () => {
    if (!emailTo || !selectedDocs.length) return
    try {
      const senderName = admin ? 'Un administrateur' : 'Votre agent'
      await sendDocumentEmail({
        to: emailTo,
        subject: emailSubject || 'Documents partagés',
        message: emailMessage,
        senderName,
        documents: selectedDocs.map(d => ({
          id: d.id,
          name: d.name,
          size: d.size,
          url: d.url,
        })),
      })
      toast('success', `Email envoyé à ${emailTo} avec ${selectedDocs.length} pièce${selectedDocs.length > 1 ? 's' : ''} jointe${selectedDocs.length > 1 ? 's' : ''}`)
      setEmailOpen(false)
      setEmailTo('')
      setEmailSubject('')
      setEmailMessage('')
      setEmailAgentSearch('')
    } catch {
      toast('error', 'Échec de l\'envoi de l\'email')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-sm text-text-secondary mt-1">
            {admin ? `Portail général — ${stats.total} documents dans l'agence` : 'Mes documents'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-card rounded-xl border border-border/50 shadow-card p-4 hover:shadow-card-hover transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Total</p>
              <div className="p-2 rounded-lg bg-accent-light">
                <Layers size={14} className="text-accent" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-text-secondary/60 mt-0.5">{admin ? 'documents dans l\'agence' : 'mes documents'}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card rounded-xl border border-border/50 shadow-card p-4 hover:shadow-card-hover transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Clients</p>
              <div className="p-2 rounded-lg bg-blue-50">
                <Users size={14} className="text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats.clients}</p>
            <p className="text-xs text-text-secondary/60 mt-0.5">documents associés</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border border-border/50 shadow-card p-4 hover:shadow-card-hover transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Biens</p>
              <div className="p-2 rounded-lg bg-emerald-50">
                <Home size={14} className="text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats.properties}</p>
            <p className="text-xs text-text-secondary/60 mt-0.5">documents associés</p>
          </motion.div>

          {Object.keys(stats.byCategory).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card rounded-xl border border-border/50 shadow-card p-4 hover:shadow-card-hover transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Catégories</p>
                <div className="p-2 rounded-lg bg-violet-50">
                  <Folder size={14} className="text-violet-600" />
                </div>
              </div>
              <div className="space-y-2">
                {Object.entries(stats.byCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, count]) => {
                    const dotColor: Record<string, string> = {
                      identite: 'bg-blue-500', financier: 'bg-emerald-500', mandat: 'bg-purple-500',
                      juridique: 'bg-amber-500', technique: 'bg-sky-500', diagnostic: 'bg-orange-500',
                      marketing: 'bg-pink-500', media: 'bg-rose-500', contrat: 'bg-red-500', autre: 'bg-gray-400',
                    }
                    const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                    return (
                      <div key={cat} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor[cat] || 'bg-gray-400'}`} />
                        <span className="text-xs text-text-secondary truncate flex-1">{DOCUMENT_CATEGORY_LABELS[cat as DocumentCategory]}</span>
                        <span className="text-xs font-semibold">{count}</span>
                        <span className="text-[10px] text-text-secondary/50 w-8 text-right">{pct}%</span>
                      </div>
                    )
                  })}
              </div>
            </motion.div>
          )}
        </div>

      <div className="bg-card rounded-xl border border-border/50 shadow-card p-4">
        <div className="flex items-center gap-4">
          <div className={`relative min-w-[200px] ${admin ? 'w-80' : 'w-1/2'}`}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60" />
            <input
              type="text"
              placeholder="Rechercher un document..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-8 text-sm rounded-lg border border-border bg-background text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary/60 hover:text-text">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex-1 flex items-center justify-end gap-2 flex-wrap">
            <select
              value={filterEntity}
              onChange={e => {
                setFilterEntity(e.target.value)
                setFilterFolderPath('')
                setFilterFolderSearch('')
                setFilterCategory('')
              }}
              className={inputClass}
            >
              <option value="">Toutes entités</option>
              <option value="client">Client</option>
              <option value="property">Bien</option>
            </select>

            {showCategory && (
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value as DocumentCategory | '')}
                className={inputClass}
              >
                <option value="">Toutes catégories</option>
                {GLOBAL_ALL_CATEGORIES.map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
            )}

            {showFolderPath && (
              <select
                value={filterFolderPath}
                onChange={e => setFilterFolderPath(e.target.value)}
                className={inputClass}
              >
                <option value="">Tous les dossiers</option>
                {stats.uniqueFolders.map(folder => (
                  <option key={folder} value={folder}>{folder || '(racine)'}</option>
                ))}
              </select>
            )}

            {showFolderPath && (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60" />
                <input
                  type="text"
                  placeholder="Chemin..."
                  value={filterFolderSearch}
                  onChange={e => setFilterFolderSearch(e.target.value)}
                  className="h-9 pl-9 pr-8 text-sm rounded-lg border border-border bg-background text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent w-32"
                />
                {filterFolderSearch && (
                  <button onClick={() => setFilterFolderSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary/60 hover:text-text">
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {admin && (
              <select
                value={filterAgent}
                onChange={e => setFilterAgent(e.target.value)}
                className={inputClass}
              >
                <option value="">Tous les agents</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{`${u.first_name || ''} ${u.last_name || ''}`.trim()}</option>
                ))}
              </select>
            )}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="h-9 px-3 text-xs text-accent hover:text-accent/80 transition-colors flex items-center gap-1 border border-accent/30 rounded-lg flex-shrink-0"
              >
                <X size={12} /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-card rounded-xl border border-border/50 shadow-card p-16 text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-secondary">Chargement des documents...</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background border-b border-border/50">
                  {admin && (
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary w-8">
                      <button onClick={toggleSelectAll} className="p-0.5 rounded hover:bg-background">
                        <CheckSquare size={14} className={selectedIds.size > 0 ? 'text-accent' : 'text-text-secondary/40'} />
                      </button>
                    </th>
                  )}
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Nom du document</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Type</th>
                  {showCategory && (
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Catégorie</th>
                  )}
                  {showFolderPath && (
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Chemin</th>
                  )}
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Entité</th>
                  {admin && <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Géré par</th>}
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Taille</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary w-10">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={colCount} className="px-4 py-16 text-center text-text-secondary">
                      <FileText size={32} className="mx-auto mb-3 opacity-40" />
                      <p className="text-sm">Aucun document trouvé</p>
                      <p className="text-xs text-text-secondary/60 mt-1">Essayez de modifier vos filtres</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((doc, index) => (
                    <motion.tr
                      key={doc.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.01, duration: 0.15 }}
                      className="hover:bg-background/50 transition-colors group"
                    >
                      {admin && (
                        <td className="px-4 py-3">
                          <button onClick={() => toggleSelect(doc.id)} className="p-0.5 rounded hover:bg-background">
                            <CheckSquare
                              size={14}
                              className={selectedIds.has(doc.id) ? 'text-accent' : 'text-text-secondary/30 group-hover:text-text-secondary/60'}
                            />
                          </button>
                        </td>
                      )}
                      <td className="px-4 py-3 font-medium text-text max-w-[260px] truncate">{doc.name}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-text-secondary">{getDocTypeLabel(doc.type)}</span>
                      </td>
                      {showCategory && (
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded border ${DOCUMENT_CATEGORY_COLORS[doc.category]}`}>
                            {DOCUMENT_CATEGORY_LABELS[doc.category]}
                          </span>
                        </td>
                      )}
                      {showFolderPath && (
                        <td className="px-4 py-3">
                          {doc.folderPath ? (
                            <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border font-medium bg-amber-500/10 text-amber-500 border-amber-500/20">
                              <Folder size={10} />
                              {doc.folderPath}
                            </span>
                          ) : (
                            <span className="text-[11px] text-text-secondary/40">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {entityIcon(doc.entityType)}
                          <span className={`text-[11px] px-1.5 py-0.5 rounded border font-medium ${entityTypeColor(doc.entityType)}`}>
                            {entityTypeLabel(doc.entityType)}
                          </span>
                          <span className="text-sm text-text truncate max-w-[140px]">{doc.entityName}</span>
                        </div>
                      </td>
                      {admin && (
                        <td className="px-4 py-3">
                          {(() => {
                            const u = users.find(u => String(u.id) === String(doc.createdBy))
                            const name = u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : null
                            const role = u?.role
                            return (
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-text">{name || 'Non assigné'}</span>
                                {name && role ? (
                                  <span className={`inline-flex items-center w-fit px-1.5 py-0.5 text-[10px] font-medium rounded border ${
                                    role === 'admin'
                                      ? 'bg-violet-500/10 text-violet-500 border-violet-500/20'
                                      : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                  }`}>
                                    {role === 'admin' ? 'Admin' : 'Agent'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center w-fit px-1.5 py-0.5 text-[10px] font-medium rounded border bg-gray-500/10 text-gray-400 border-gray-500/20">
                                    —
                                  </span>
                                )}
                              </div>
                            )
                          })()}
                        </td>
                      )}
                      <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
                        {new Date(doc.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary/70">{doc.size || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              if (openMenuId === doc.id) {
                                setOpenMenuId(null)
                                setMenuPos(null)
                              } else {
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                                const menuW = 192
                                const menuH = 200
                                let left = rect.right - menuW
                                let top = rect.bottom + 4
                                if (left + menuW > window.innerWidth - 8) left = window.innerWidth - menuW - 8
                                if (left < 8) left = 8
                                if (top + menuH > window.innerHeight - 8) top = rect.top - menuH - 4
                                setMenuPos({ top, left })
                                setOpenMenuId(doc.id)
                              }
                            }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all mx-auto opacity-0 group-hover:opacity-100"
                            title="Actions"
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-border/50 text-xs text-text-secondary/60">
            <span>{filtered.length} document{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {admin && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 shadow-card p-5">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <BarChartIcon size={16} className="text-accent" />
              Répartition par catégorie
            </h3>
            <div className="space-y-2.5">
              {Object.entries(stats.byCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, count]) => {
                  const pct = Math.round((count / stats.total) * 100)
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-text">
                          <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${DOCUMENT_CATEGORY_COLORS[cat as DocumentCategory].split(' ')[0]}`} />
                          {DOCUMENT_CATEGORY_LABELS[cat as DocumentCategory]}
                        </span>
                        <span className="text-text-secondary">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-background border border-border/30 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${DOCUMENT_CATEGORY_COLORS[cat as DocumentCategory].split(' ')[0]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <ZapIcon size={16} className="text-accent" />
              Actions rapides
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setExportOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-text transition-colors"
              >
                <Download size={14} className="text-text-secondary" />
                Exporter les documents sélectionnés {selectedIds.size > 0 && `(${selectedIds.size})`}
              </button>
              <button
                onClick={() => setEmailOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-text transition-colors"
              >
                <Mail size={14} className="text-text-secondary" />
                Envoyer par email {selectedIds.size > 0 && `(${selectedIds.size})`}
              </button>
              <button
                onClick={() => setBulkDeleteOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-text transition-colors"
              >
                <Trash2 size={14} className="text-text-secondary" />
                Supprimer les documents sélectionnés {selectedIds.size > 0 && `(${selectedIds.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Portaled actions menu ── */}
      {openMenuId && menuPos && createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => { setOpenMenuId(null); setMenuPos(null) }} />
          <AnimatePresence>
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="fixed z-[61] w-48 bg-card border border-border/50 rounded-xl shadow-modal p-1.5"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              {(() => {
                const doc = filtered.find(d => d.id === openMenuId)
                if (!doc) return null
                return (
                  <>
                    <button
                      onClick={() => handleView(doc)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-text transition-colors"
                    >
                      <Eye size={14} className="text-text-secondary" /> Voir
                    </button>
                    <button
                      onClick={() => handlePrint(doc)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-text transition-colors"
                    >
                      <Printer size={14} className="text-text-secondary" /> Imprimer
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-text transition-colors"
                    >
                      <Download size={14} className="text-text-secondary" /> Télécharger
                    </button>
                    <div className="border-t border-border/30 my-1" />
                    <button
                      onClick={() => { setOpenMenuId(null); setMenuPos(null); setDeleteTarget(doc) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-error transition-colors"
                    >
                      <Trash2 size={14} /> Supprimer
                    </button>
                  </>
                )
              })()}
            </motion.div>
          </AnimatePresence>
        </>,
        document.body
      )}

      {/* ── File viewer modal (images only) ── */}
      <Dialog
        isOpen={!!viewerDoc}
        onClose={() => setViewerDoc(null)}
        title={viewerDoc?.name || ''}
        size="full"
      >
        {viewerDoc && viewerDoc.url && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(z => Math.max(25, z - 25))}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-border hover:bg-background transition-colors"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-xs text-text-secondary font-medium w-12 text-center">{zoom}%</span>
              <button
                onClick={() => setZoom(z => Math.min(400, z + 25))}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-border hover:bg-background transition-colors"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => setZoom(100)}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-border hover:bg-background transition-colors"
                title="Réinitialiser le zoom"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            <div className="w-full max-h-[70vh] overflow-auto rounded-lg border border-border/50 bg-background flex items-center justify-center">
              <img
                src={fullUrl(viewerDoc)}
                alt={viewerDoc.name}
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
                className="max-w-full transition-transform duration-150"
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* ── Delete confirmation dialog ── */}
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
                  Cette action est irréversible. Le fichier sera définitivement supprimé.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
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

      {/* ── Print modal (images) ── */}
      <Dialog
        isOpen={!!printDoc}
        onClose={() => setPrintDoc(null)}
        title={`Imprimer — ${printDoc?.name || ''}`}
        size="full"
      >
        {printDoc && printDoc.url && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                icon={<Printer size={14} />}
                onClick={() => handleReactToPrint()}
              >
                Imprimer
              </Button>
            </div>
            <div ref={printContentRef} className="flex items-center justify-center bg-white rounded-lg border border-border/50" style={{ minHeight: '60vh' }}>
              <img
                src={fullUrl(printDoc)}
                alt={printDoc.name}
                className="max-w-full max-h-[65vh] object-contain"
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* ── Export modal ── */}
      <Dialog isOpen={exportOpen} onClose={() => setExportOpen(false)} title="Exporter les documents" size="md">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            {selectedDocs.length} document{selectedDocs.length > 1 ? 's' : ''} seront téléchargé{selectedDocs.length > 1 ? 's' : ''}.
          </p>
          <div className="max-h-64 overflow-auto rounded-lg border border-border/50 divide-y divide-border/30">
            {selectedDocs.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 px-3 py-2.5">
                <FileText size={14} className="text-text-secondary flex-shrink-0" />
                <span className="text-sm truncate flex-1">{doc.name}</span>
                <span className="text-xs text-text-secondary/60 flex-shrink-0">{doc.size || '—'}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setExportOpen(false)}>Annuler</Button>
            <Button variant="primary" size="sm" icon={<Download size={14} />} onClick={handleBulkExport}>
              Télécharger tout
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ── Bulk delete modal ── */}
      <Dialog isOpen={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} title="Supprimer les documents" size="md">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle size={18} className="text-error" />
            </div>
            <div>
              <p className="text-sm text-text">
                Voulez-vous vraiment supprimer <strong>{selectedDocs.length} document{selectedDocs.length > 1 ? 's' : ''}</strong> ?
              </p>
              <p className="text-xs text-text-secondary mt-1">Cette action est irréversible.</p>
            </div>
          </div>
          <div className="max-h-48 overflow-auto rounded-lg border border-border/50 divide-y divide-border/30">
            {selectedDocs.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 px-3 py-2">
                <FileText size={12} className="text-text-secondary flex-shrink-0" />
                <span className="text-sm truncate flex-1">{doc.name}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleting}>Annuler</Button>
            <Button variant="danger" size="sm" icon={bulkDeleting ? undefined : <Trash2 size={14} />} onClick={handleBulkDelete} disabled={bulkDeleting}>
              {bulkDeleting ? 'Suppression...' : 'Supprimer tout'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ── Email modal ── */}
      <Dialog isOpen={emailOpen} onClose={() => setEmailOpen(false)} title="Envoyer par email" size="lg">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Destinataire</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60" />
              <input
                type="text"
                placeholder="Rechercher un agent..."
                value={emailAgentSearch}
                onChange={e => {
                  setEmailAgentSearch(e.target.value)
                  setEmailTo('')
                }}
                className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border bg-background text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            {emailAgentSearch && !emailTo && (
              <div className="mt-1 max-h-32 overflow-auto rounded-lg border border-border/50 bg-card shadow-sm divide-y divide-border/30">
                {filteredAgentEmails.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-text-secondary">Aucun agent trouvé</p>
                ) : (
                  filteredAgentEmails.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setEmailTo(u.email || `${u.first_name || ''}.${u.last_name || ''}@agence.fr`.toLowerCase())
                        setEmailAgentSearch(`${u.first_name || ''} ${u.last_name || ''}`.trim())
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-background transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <User size={12} className="text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{`${u.first_name || ''} ${u.last_name || ''}`.trim()}</p>
                        <p className="text-xs text-text-secondary truncate">{u.email || '—'}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Objet</label>
            <input
              type="text"
              value={emailSubject}
              onChange={e => setEmailSubject(e.target.value)}
              placeholder="Objet de l'email..."
              className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Message</label>
            <textarea
              value={emailMessage}
              onChange={e => setEmailMessage(e.target.value)}
              placeholder="Votre message..."
              rows={4}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
            />
          </div>

          {selectedDocs.length > 0 && (
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Pièces jointes ({selectedDocs.length})</label>
              <div className="flex flex-wrap gap-1.5">
                {selectedDocs.map(doc => (
                  <span key={doc.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-accent/5 border border-accent/20 text-accent rounded-lg">
                    <FileText size={11} />
                    <span className="max-w-[140px] truncate">{doc.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setEmailOpen(false)}>Annuler</Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Mail size={14} />}
              onClick={handleSendEmail}
              disabled={!emailTo}
            >
              Envoyer
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

function BarChartIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  )
}

function ZapIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}
