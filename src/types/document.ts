export type DocumentCategory =
  | 'identite'
  | 'financier'
  | 'mandat'
  | 'juridique'
  | 'extranet'
  | 'technique'
  | 'diagnostic'
  | 'marketing'
  | 'media'
  | 'contrat'
  | 'autre'

export type DocumentEntityType = 'client' | 'property' | 'contract'

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  identite: 'Identité',
  financier: 'Financier',
  mandat: 'Mandat',
  juridique: 'Juridique',
  extranet: 'Extranet',
  technique: 'Technique',
  diagnostic: 'Diagnostic',
  marketing: 'Marketing',
  media: 'Média',
  contrat: 'Contrat',
  autre: 'Autre',
}

export const DOCUMENT_CATEGORY_COLORS: Record<DocumentCategory, string> = {
  identite: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  financier: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  mandat: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  juridique: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  extranet: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  technique: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  diagnostic: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  marketing: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  media: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  contrat: 'bg-red-500/10 text-red-500 border-red-500/20',
  autre: 'bg-text-secondary/10 text-text-secondary border-text-secondary/20',
}

export interface FlatDocument {
  id: string
  name: string
  type: string
  category: DocumentCategory
  entityType?: DocumentEntityType
  entityId?: string
  entityName?: string
  date: string
  size?: string
  url?: string
  status?: string
  confidential?: boolean
  version?: number
  notes?: string
  createdBy?: string
}

export interface GlobalDocumentEntry extends FlatDocument {
  entityType: DocumentEntityType
  entityId: string
  entityName: string
  createdBy: string
}

export type ClientDocumentCategory = 'identite' | 'financier' | 'mandat' | 'juridique' | 'extranet' | 'autre'

export type PropertyDocumentCategory = 'juridique' | 'technique' | 'diagnostic' | 'marketing' | 'media' | 'contrat' | 'autre'

export const CLIENT_DOC_CATEGORIES: { key: ClientDocumentCategory; label: string; description: string }[] = [
  { key: 'identite', label: 'Identité', description: "Pièces d'identité et justificatifs" },
  { key: 'financier', label: 'Financier', description: 'Revenus, relevés bancaires, avis fiscaux' },
  { key: 'mandat', label: 'Mandats', description: 'Mandats de vente, de recherche, de gestion' },
  { key: 'juridique', label: 'Juridique', description: 'Documents légaux et notariés' },
  { key: 'extranet', label: 'Extranet', description: "Consentements, règlements acceptés" },
  { key: 'autre', label: 'Autres', description: 'Documents divers' },
]

export const PROPERTY_DOC_CATEGORIES: { key: PropertyDocumentCategory; label: string; description: string }[] = [
  { key: 'juridique', label: 'Juridique', description: 'Titre de propriété, plans cadastraux' },
  { key: 'technique', label: 'Technique', description: 'Plans, études, métrés' },
  { key: 'diagnostic', label: 'Diagnostic', description: 'DPE, constats, diagnostics obligatoires' },
  { key: 'marketing', label: 'Marketing', description: 'Brochures, photos, visites virtuelles' },
  { key: 'media', label: 'Média', description: 'Photos et vidéos supplémentaires' },
  { key: 'contrat', label: 'Contrats liés', description: 'Mandats et contrats associés au bien' },
  { key: 'autre', label: 'Autres', description: 'Documents divers' },
]

export const GLOBAL_ALL_CATEGORIES: { key: DocumentCategory; label: string }[] = [
  { key: 'identite', label: 'Identité' },
  { key: 'financier', label: 'Financier' },
  { key: 'mandat', label: 'Mandat' },
  { key: 'juridique', label: 'Juridique' },
  { key: 'extranet', label: 'Extranet' },
  { key: 'technique', label: 'Technique' },
  { key: 'diagnostic', label: 'Diagnostic' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'media', label: 'Média' },
  { key: 'contrat', label: 'Contrat' },
  { key: 'autre', label: 'Autre' },
]

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  contract: 'Contrat',
  mandat: 'Mandat',
  dpe: 'DPE',
  loan: 'Prêt',
  inspection: 'État des lieux',
  policy: 'Règlement',
  id: 'Identité',
  brochure: 'Brochure',
  technical: 'Technique',
  identity: 'Identité',
  financial: 'Financier',
  legal: 'Juridique',
  photo: 'Photo',
  video: 'Vidéo',
  virtual_tour: 'Visite virtuelle',
  cadastral: 'Plan cadastral',
  title_deed: 'Titre de propriété',
  payslip: 'Fiche de paie',
  bank_statement: 'Relevé bancaire',
  tax_notice: 'Avis fiscal',
  proof_address: "Justificatif domicile",
  rental_agreement: 'Bail',
  seasonal_contract: 'Contrat saisonnier',
  mandate_sale: 'Mandat de vente',
  mandate_search: 'Mandat de recherche',
  mandate_management: 'Mandat de gestion',
  compromis: 'Compromis',
  acte: "Acte authentique",
}

export const getDocTypeLabel = (type: string) => DOCUMENT_TYPE_LABELS[type] || type
