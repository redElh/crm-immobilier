import { useState } from 'react'
import { User, DollarSign, FileText, Shield, Globe, Plus } from 'react-feather'
import { DocumentCategorySection } from '../documents/DocumentCategorySection'
import { CLIENT_DOC_CATEGORIES } from '../../../types/document'
import type { Client } from '../../../types/client'
import type { ClientDocumentCategory } from '../../../types/document'

const CATEGORY_ICONS: Record<ClientDocumentCategory, React.ReactNode> = {
  identite: <User size={16} />,
  financier: <DollarSign size={16} />,
  mandat: <FileText size={16} />,
  juridique: <Shield size={16} />,
  extranet: <Globe size={16} />,
  autre: <FileText size={16} />,
}

interface ClientDocumentsViewProps {
  client: Client
  onAdd?: (category: ClientDocumentCategory) => void
  onDelete?: (docId: string) => void
  onDownload?: (docId: string) => void
}

const docMatches = (docName: string, searchTerms: string[]): boolean =>
  searchTerms.some(term => docName.toLowerCase().includes(term))

export const ClientDocumentsView = ({ client, onAdd, onDelete, onDownload }: ClientDocumentsViewProps) => {
  const docs = client.documents || []

  const handleAdd = (category: ClientDocumentCategory) => {
    if (onAdd) onAdd(category)
  }

  const handleDelete = (doc: any) => {
    if (onDelete) onDelete(doc.id || doc.name)
  }

  const handleDownload = (doc: any) => {
    if (onDownload) onDownload(doc.id || doc.name)
  }

  const handleView = (doc: any) => {
    if (doc.url) window.open(doc.url, '_blank')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text-secondary">
            {docs.length} document{docs.length !== 1 ? 's' : ''} pour <span className="font-medium text-text">{client.name}</span>
          </p>
        </div>
      </div>

      {CLIENT_DOC_CATEGORIES.map(({ key, label, description }) => {
        const categoryDocs = docs.filter(d => (d.category || 'autre') === key)
        return (
          <DocumentCategorySection
            key={key}
            title={label}
            description={description}
            icon={CATEGORY_ICONS[key]}
            documents={categoryDocs.map(d => ({
              id: d.name,
              name: d.name,
              type: d.type,
              date: d.uploadedAt,
              url: d.url,
              size: d.size,
              category: d.category,
            }))}
            onAdd={() => handleAdd(key)}
            onDelete={handleDelete}
            onDownload={handleDownload}
            onView={handleView}
            emptyMessage="Aucun document dans cette catégorie"
            defaultOpen={categoryDocs.length > 0}
          />
        )
      })}

      {client.type === 'Vendeur' && <SellerRequiredDocs docs={docs} />}
      {client.type === 'Bailleur' && <BailleurRequiredDocs docs={docs} />}
      {client.type === 'Locataire' && <LocataireRequiredDocs docs={docs} />}
      {client.type === 'Voyageur' && <VoyageurRequiredDocs docs={docs} />}
      {client.type === 'Acheteur' && <AcheteurRequiredDocs docs={docs} />}
    </div>
  )
}

const ChecklistItem = ({ label, required, checked }: { label: string; required: boolean; checked: boolean }) => (
  <div className="flex items-center gap-2.5">
    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
      checked ? 'bg-emerald-500 border-emerald-500' : 'bg-background border-border'
    }`}>
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
    <span className={`text-sm ${checked ? 'text-text line-through opacity-50' : 'text-text'}`}>{label}</span>
    {required && <span className="text-[10px] font-medium text-error uppercase">Requis</span>}
  </div>
)

interface RequiredDocsCardProps {
  title: string
  items: { label: string; required: boolean; matchTerms: string[] }[]
  docs: { name: string }[]
}

const RequiredDocsCard = ({ title, items, docs }: RequiredDocsCardProps) => (
  <div className="rounded-xl border border-border/50 bg-background/50 p-4 space-y-2.5">
    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{title}</p>
    {items.map((item, i) => {
      const checked = docs.some(d => docMatches(d.name, item.matchTerms))
      return <ChecklistItem key={i} label={item.label} required={item.required} checked={checked} />
    })}
  </div>
)

const SellerRequiredDocs = ({ docs }: { docs: { name: string }[] }) => (
  <RequiredDocsCard
    title="Documents requis pour la vente"
    docs={docs}
    items={[
      { label: "Pièce d'identité du vendeur", required: true, matchTerms: ['cin', 'identité', 'passeport', 'carte'] },
      { label: 'Titre de propriété', required: true, matchTerms: ['titre de propriété', 'titre'] },
      { label: 'Diagnostic technique DPE', required: true, matchTerms: ['dpe', 'diagnostic'] },
      { label: 'Règlement de copropriété', required: false, matchTerms: ['règlement', 'copropriété'] },
      { label: 'Mandat signé PDF', required: true, matchTerms: ['mandat'] },
    ]}
  />
)

const BailleurRequiredDocs = ({ docs }: { docs: { name: string }[] }) => (
  <RequiredDocsCard
    title="Documents requis pour la location"
    docs={docs}
    items={[
      { label: "Pièce d'identité du bailleur", required: true, matchTerms: ['cin', 'identité', 'passeport', 'carte'] },
      { label: 'Titre de propriété', required: true, matchTerms: ['titre de propriété', 'titre'] },
      { label: 'Diagnostic technique DPE', required: true, matchTerms: ['dpe', 'diagnostic'] },
      { label: 'Règlement de copropriété', required: false, matchTerms: ['règlement', 'copropriété'] },
      { label: 'Mandat de gestion signé PDF', required: true, matchTerms: ['mandat de gestion', 'mandat'] },
      { label: 'Attestation assurance PNO', required: false, matchTerms: ['assurance', 'pno'] },
      { label: "État des lieux entrant", required: false, matchTerms: ['état des lieux', 'etat des lieux'] },
    ]}
  />
)

const LocataireRequiredDocs = ({ docs }: { docs: { name: string }[] }) => (
  <RequiredDocsCard
    title="Documents requis pour le dossier locataire"
    docs={docs}
    items={[
      { label: "Pièce d'identité (passeport ou CIN)", required: true, matchTerms: ['cin', 'identité', 'passeport', 'carte'] },
      { label: 'Justificatif de domicile actuel', required: true, matchTerms: ['justificatif de domicile', 'domicile'] },
      { label: '3 dernières fiches de paie', required: true, matchTerms: ['fiches de paie', 'fiche de paie'] },
      { label: 'Contrat de travail', required: true, matchTerms: ['contrat de travail'] },
      { label: "Relevé d'identité bancaire (RIB)", required: true, matchTerms: ['relevé', 'rib', 'bancaire'] },
      { label: 'Dossier garant', required: false, matchTerms: ['garant'] },
    ]}
  />
)

const VoyageurRequiredDocs = ({ docs }: { docs: { name: string }[] }) => (
  <RequiredDocsCard
    title="Documents requis pour la location saisonnière"
    docs={docs}
    items={[
      { label: "Pièce d'identité (passeport ou CIN)", required: true, matchTerms: ['cin', 'identité', 'passeport', 'carte'] },
      { label: 'Contrat de location signé', required: true, matchTerms: ['contrat de location', 'location saisonnière'] },
      { label: 'Preuve de paiement acompte', required: true, matchTerms: ['paiement', 'acompte'] },
      { label: 'Justificatif de domicile', required: false, matchTerms: ['justificatif de domicile', 'domicile'] },
    ]}
  />
)

const AcheteurRequiredDocs = ({ docs }: { docs: { name: string }[] }) => (
  <RequiredDocsCard
    title="Documents recommandés pour l'achat"
    docs={docs}
    items={[
      { label: "Pièce d'identité", required: true, matchTerms: ['cin', 'identité', 'passeport', 'carte'] },
      { label: 'Justificatif de domicile', required: true, matchTerms: ['justificatif de domicile', 'domicile'] },
      { label: 'Accord de principe bancaire', required: false, matchTerms: ['accord', 'bancaire', 'prêt', 'pret'] },
      { label: '3 dernières fiches de paie', required: false, matchTerms: ['fiches de paie', 'fiche de paie'] },
      { label: "Avis d'imposition", required: false, matchTerms: ['avis', 'imposition'] },
    ]}
  />
)
