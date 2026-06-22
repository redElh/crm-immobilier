import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Search, X, User, Home, Download, ChevronRight, Filter, CheckSquare, Trash2, Mail, Upload, Share2, Eye } from 'react-feather'
import { Button } from '../../components/ui/Button'
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

const AGENTS = [
  { id: 'myriam', name: 'Myriam ABABOU' },
  { id: 'dimitri', name: 'Dimitri DJEDJE' },
  { id: 'hayat', name: 'Hayat OUAKRIM' },
  { id: 'yasmine', name: 'Yasmine AATIC' },
  { id: 'square', name: 'Square Meter AGENCE' },
]

const agentName = (id: string) => AGENTS.find(a => a.id === id)?.name ?? id

const allDocuments: GlobalDocumentEntry[] = [
  { id: 'gd-1', name: 'CIN - Hassan El Fassi.pdf', type: 'identity', category: 'identite', entityType: 'client', entityId: '4', entityName: 'Hassan El Fassi', date: '2026-06-01', size: '1.8 Mo', createdBy: 'myriam' },
  { id: 'gd-2', name: 'Justificatif de domicile - Hassan El Fassi.pdf', type: 'proof_address', category: 'identite', entityType: 'client', entityId: '4', entityName: 'Hassan El Fassi', date: '2026-05-15', size: '1.2 Mo', createdBy: 'myriam' },
  { id: 'gd-3', name: 'Mandat de vente exclusif - Villa Argana.pdf', type: 'mandate_sale', category: 'mandat', entityType: 'client', entityId: '4', entityName: 'Hassan El Fassi', date: '2026-06-01', size: '2.4 Mo', createdBy: 'myriam' },
  { id: 'gd-4', name: 'CIN - Pierre Martin.pdf', type: 'identity', category: 'identite', entityType: 'client', entityId: '1', entityName: 'Pierre Martin', date: '2025-06-01', size: '2.1 Mo', createdBy: 'dimitri' },
  { id: 'gd-5', name: 'Fiches de paie - Pierre Martin.pdf', type: 'payslip', category: 'financier', entityType: 'client', entityId: '1', entityName: 'Pierre Martin', date: '2025-06-05', size: '3.2 Mo', createdBy: 'dimitri' },
  { id: 'gd-6', name: "Avis d'imposition 2025 - Pierre Martin.pdf", type: 'tax_notice', category: 'financier', entityType: 'client', entityId: '1', entityName: 'Pierre Martin', date: '2025-06-05', size: '1.8 Mo', createdBy: 'dimitri' },
  { id: 'gd-7', name: 'Mandat de recherche - Pierre Martin.pdf', type: 'mandate_search', category: 'mandat', entityType: 'client', entityId: '1', entityName: 'Pierre Martin', date: '2025-06-01', size: '0.9 Mo', createdBy: 'dimitri' },
  { id: 'gd-8', name: 'CIN - Nadia El Fassi.pdf', type: 'identity', category: 'identite', entityType: 'client', entityId: '8', entityName: 'Nadia El Fassi', date: '2026-05-20', size: '1.9 Mo', createdBy: 'hayat' },
  { id: 'gd-9', name: 'Mandat de gestion - Nadia El Fassi.pdf', type: 'mandate_management', category: 'mandat', entityType: 'client', entityId: '8', entityName: 'Nadia El Fassi', date: '2026-06-01', size: '2.1 Mo', createdBy: 'hayat' },
  { id: 'gd-10', name: 'Passeport - Thomas Berger.pdf', type: 'identity', category: 'identite', entityType: 'client', entityId: '11', entityName: 'Thomas & Emma Berger', date: '2026-06-01', size: '2.2 Mo', createdBy: 'hayat' },
  { id: 'gd-11', name: 'Contrat de location saisonnière signé.pdf', type: 'seasonal_contract', category: 'extranet', entityType: 'client', entityId: '11', entityName: 'Thomas & Emma Berger', date: '2026-06-05', size: '1.6 Mo', createdBy: 'hayat' },
  { id: 'gd-12', name: 'CIN - Sophie Laurent.pdf', type: 'identity', category: 'identite', entityType: 'client', entityId: '9', entityName: 'Sophie Laurent', date: '2026-06-01', size: '1.5 Mo', createdBy: 'myriam' },
  { id: 'gd-13', name: 'Fiches de paie - Sophie Laurent.pdf', type: 'payslip', category: 'financier', entityType: 'client', entityId: '9', entityName: 'Sophie Laurent', date: '2026-06-03', size: '2.8 Mo', createdBy: 'myriam' },
  { id: 'gd-14', name: 'Titre de propriété - Villa Argana.pdf', type: 'title_deed', category: 'juridique', entityType: 'property', entityId: '1', entityName: 'Villa luxe avec piscine', date: '2023-05-10', size: '3.8 Mo', createdBy: 'myriam' },
  { id: 'gd-15', name: 'Plan cadastral - Villa Argana.pdf', type: 'cadastral', category: 'technique', entityType: 'property', entityId: '1', entityName: 'Villa luxe avec piscine', date: '2023-05-10', size: '2.4 Mo', createdBy: 'dimitri' },
  { id: 'gd-16', name: 'DPE - Villa Argana - Classe B.pdf', type: 'dpe', category: 'diagnostic', entityType: 'property', entityId: '1', entityName: 'Villa luxe avec piscine', date: '2023-04-20', size: '1.5 Mo', createdBy: 'myriam' },
  { id: 'gd-17', name: 'Brochure commerciale - Villa Argana.pdf', type: 'brochure', category: 'marketing', entityType: 'property', entityId: '1', entityName: 'Villa luxe avec piscine', date: '2023-06-01', size: '4.2 Mo', createdBy: 'myriam' },
  { id: 'gd-18', name: 'Visite virtuelle - Villa Argana.html', type: 'virtual_tour', category: 'marketing', entityType: 'property', entityId: '1', entityName: 'Villa luxe avec piscine', date: '2023-06-01', size: '12 Mo', createdBy: 'myriam' },
  { id: 'gd-19', name: 'DPE - Appartement Agadir - Classe A.pdf', type: 'dpe', category: 'diagnostic', entityType: 'property', entityId: '4', entityName: 'Appartement front de mer', date: '2026-01-10', size: '1.8 Mo', createdBy: 'dimitri' },
  { id: 'gd-20', name: 'Brochure été 2026 - Appartement Agadir.pdf', type: 'brochure', category: 'marketing', entityType: 'property', entityId: '4', entityName: 'Appartement front de mer', date: '2026-02-01', size: '5.6 Mo', createdBy: 'dimitri' },
  { id: 'gd-21', name: 'Compromis de vente - Pierre Martin.pdf', type: 'compromis', category: 'contrat', entityType: 'property', entityId: '1', entityName: 'Villa luxe avec piscine', date: '2026-04-01', size: '3.6 Mo', createdBy: 'myriam' },
  { id: 'gd-22', name: 'Mandat de vente - Hassan El Fassi.pdf', type: 'mandate_sale', category: 'contrat', entityType: 'property', entityId: '1', entityName: 'Villa luxe avec piscine', date: '2026-06-01', size: '2.4 Mo', createdBy: 'myriam' },
  { id: 'gd-23', name: 'Acte authentique - Karim Benali.pdf', type: 'acte', category: 'contrat', entityType: 'client', entityId: '3', entityName: 'Karim Benali', date: '2026-03-15', size: '4.1 Mo', createdBy: 'yasmine' },
  { id: 'gd-24', name: 'Bail signé - Sophie Laurent.pdf', type: 'rental_agreement', category: 'contrat', entityType: 'client', entityId: '9', entityName: 'Sophie Laurent', date: '2026-05-15', size: '2.3 Mo', createdBy: 'myriam' },
  { id: 'gd-25', name: "État des lieux entrant - Sophie Laurent.pdf", type: 'inspection', category: 'juridique', entityType: 'client', entityId: '9', entityName: 'Sophie Laurent', date: '2026-05-30', size: '1.7 Mo', createdBy: 'myriam' },
  { id: 'gd-26', name: "Pièce d'identité - Thomas Berger.pdf", type: 'identity', category: 'identite', entityType: 'client', entityId: '11', entityName: 'Thomas & Emma Berger', date: '2026-06-01', size: '2.2 Mo', createdBy: 'hayat' },
  { id: 'gd-27', name: 'Relevé bancaire - Pierre Martin.pdf', type: 'bank_statement', category: 'financier', entityType: 'client', entityId: '1', entityName: 'Pierre Martin', date: '2025-06-05', size: '1.3 Mo', createdBy: 'dimitri' },
  { id: 'gd-28', name: 'Titre de propriété - Appartement Agadir.pdf', type: 'title_deed', category: 'juridique', entityType: 'property', entityId: '4', entityName: 'Appartement front de mer', date: '2026-01-10', size: '3.2 Mo', createdBy: 'dimitri' },
  { id: 'gd-29', name: 'Constat de risque - Villa Argana.pdf', type: 'dpe', category: 'diagnostic', entityType: 'property', entityId: '1', entityName: 'Villa luxe avec piscine', date: '2023-04-20', size: '0.9 Mo', createdBy: 'myriam' },
  { id: 'gd-30', name: 'Consentement RGPD - Thomas Berger.pdf', type: 'policy', category: 'extranet', entityType: 'client', entityId: '11', entityName: 'Thomas & Emma Berger', date: '2026-06-01', size: '0.3 Mo', createdBy: 'square' },
]

const entityTypeColor = (type: string) => {
  switch (type) {
    case 'client': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    case 'property': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    case 'contract': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    default: return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'
  }
}

const entityTypeLabel = (type: string) => {
  switch (type) {
    case 'client': return 'Client'
    case 'property': return 'Bien'
    case 'contract': return 'Contrat'
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
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<DocumentCategory | ''>('')
  const [filterEntity, setFilterEntity] = useState('')
  const [filterAgent, setFilterAgent] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [contextDoc, setContextDoc] = useState<GlobalDocumentEntry | null>(null)

  const baseDocuments = useMemo(() => {
    if (admin) return allDocuments
    return allDocuments.filter(d => d.createdBy === 'myriam')
  }, [admin])

  const filtered = useMemo(() => {
    return baseDocuments.filter(doc => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matches =
          doc.name.toLowerCase().includes(q) ||
          doc.entityName.toLowerCase().includes(q) ||
          getDocTypeLabel(doc.type).toLowerCase().includes(q)
        if (!matches) return false
      }
      if (filterCategory && doc.category !== filterCategory) return false
      if (filterEntity && doc.entityType !== filterEntity) return false
      if (admin && filterAgent && doc.createdBy !== filterAgent) return false
      return true
    })
  }, [baseDocuments, searchQuery, filterCategory, filterEntity, admin, filterAgent])

  const stats = useMemo(() => {
    const total = baseDocuments.length
    const clients = new Set(baseDocuments.filter(d => d.entityType === 'client').map(d => d.entityId)).size
    const properties = new Set(baseDocuments.filter(d => d.entityType === 'property').map(d => d.entityId)).size
    const contracts = new Set(baseDocuments.filter(d => d.entityType === 'contract').map(d => d.entityId)).size
    const byCategory: Record<string, number> = {}
    baseDocuments.forEach(d => {
      byCategory[d.category] = (byCategory[d.category] || 0) + 1
    })
    return { total, clients, properties, contracts, byCategory }
  }, [baseDocuments])

  const clearFilters = () => {
    setSearchQuery('')
    setFilterCategory('')
    setFilterEntity('')
    setFilterAgent('')
  }

  const hasActiveFilters = searchQuery || filterCategory || filterEntity || filterAgent

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

  const inputClass = "h-9 px-3 text-sm rounded-lg border border-border bg-background text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-sm text-text-secondary mt-1">
            {admin ? `Portail général — ${stats.total} documents dans l'agence` : 'Mes documents'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {admin && (
            <Button variant="outline" size="sm" icon={<Upload size={14} />}>
              Importer
            </Button>
          )}
        </div>
      </div>

      {admin && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border/50 shadow-card p-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Total documents</p>
            <p className="text-2xl font-semibold mt-1">{stats.total}</p>
            <p className="text-xs text-text-secondary/60 mt-0.5">dans l'agence</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 shadow-card p-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Clients</p>
            <p className="text-2xl font-semibold mt-1">{stats.clients}</p>
            <p className="text-xs text-text-secondary/60 mt-0.5">documents associés</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 shadow-card p-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Biens</p>
            <p className="text-2xl font-semibold mt-1">{stats.properties}</p>
            <p className="text-xs text-text-secondary/60 mt-0.5">documents associés</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 shadow-card p-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Contrats</p>
            <p className="text-2xl font-semibold mt-1">{stats.contracts}</p>
            <p className="text-xs text-text-secondary/60 mt-0.5">documents associés</p>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border/50 shadow-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
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

          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-text-secondary/60" />
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

            <select
              value={filterEntity}
              onChange={e => setFilterEntity(e.target.value)}
              className={inputClass}
            >
              <option value="">Toutes entités</option>
              <option value="client">Client</option>
              <option value="property">Bien</option>
              <option value="contract">Contrat</option>
            </select>

            {admin && (
              <select
                value={filterAgent}
                onChange={e => setFilterAgent(e.target.value)}
                className={inputClass}
              >
                <option value="">Tous les agents</option>
                {AGENTS.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
            >
              <X size={12} /> Réinitialiser
            </button>
          )}
        </div>
      </div>

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
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Catégorie</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Entité</th>
                {admin && <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Agent</th>}
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Taille</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={admin ? 9 : 7} className="px-4 py-16 text-center text-text-secondary">
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
                    className="hover:bg-background/50 transition-colors group relative"
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
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded border ${DOCUMENT_CATEGORY_COLORS[doc.category]}`}>
                        {DOCUMENT_CATEGORY_LABELS[doc.category]}
                      </span>
                    </td>
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
                      <td className="px-4 py-3 text-xs text-text-secondary">{agentName(doc.createdBy)}</td>
                    )}
                    <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
                      {new Date(doc.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary/70">{doc.size}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {}}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
                            title="Télécharger"
                          >
                            <Download size={13} />
                          </button>
                          {admin && (
                            <button
                              onClick={() => setContextDoc(contextDoc?.id === doc.id ? null : doc)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
                              title="Plus d'actions"
                            >
                              <ChevronRight size={13} />
                            </button>
                          )}
                        </div>
                        {admin && contextDoc?.id === doc.id && (
                          <div className="absolute right-0 top-8 z-20 w-52 bg-card border border-border/50 rounded-xl shadow-modal p-1.5">
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-text transition-colors">
                              <Eye size={14} className="text-text-secondary" /> Aperçu rapide
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-text transition-colors">
                              <Download size={14} className="text-text-secondary" /> Télécharger
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-text transition-colors">
                              <FileText size={14} className="text-text-secondary" /> Modifier
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-text transition-colors">
                              <Mail size={14} className="text-text-secondary" /> Envoyer par email
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-text transition-colors">
                              <Share2 size={14} className="text-text-secondary" /> Lien de partage
                            </button>
                            <div className="border-t border-border/30 my-1" />
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-error transition-colors">
                              <Trash2 size={14} /> Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between text-xs text-text-secondary/60">
          <span>{filtered.length} document{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}</span>
          {admin && (
            <div className="flex items-center gap-4">
              <span>{stats.clients} client{stats.clients !== 1 ? 's' : ''}</span>
              <span>{stats.properties} bien{stats.properties !== 1 ? 's' : ''}</span>
              <span>{stats.contracts} contrat{stats.contracts !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {admin && (
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
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-text transition-colors">
                <Download size={14} className="text-text-secondary" />
                Exporter les documents sélectionnés {selectedIds.size > 0 && `(${selectedIds.size})`}
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-text transition-colors">
                <Mail size={14} className="text-text-secondary" />
                Envoyer par email
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-text transition-colors">
                <Trash2 size={14} className="text-text-secondary" />
                Supprimer les documents sélectionnés {selectedIds.size > 0 && `(${selectedIds.size})`}
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-text transition-colors">
                <Upload size={14} className="text-text-secondary" />
                Importer des documents
              </button>
            </div>
          </div>
        </div>
      )}

      {admin && contextDoc && (
        <div className="fixed inset-0 z-40" onClick={() => setContextDoc(null)} />
      )}
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
