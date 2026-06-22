import { useState } from 'react'
import { Shield, FileText, Activity, Camera, Link, Image, Plus } from 'react-feather'
import { DocumentCategorySection } from '../documents/DocumentCategorySection'
import { PROPERTY_DOC_CATEGORIES } from '../../../types/document'
import type { Property } from '../../../types/property'
import type { PropertyDocumentCategory } from '../../../types/document'

const CATEGORY_ICONS: Record<PropertyDocumentCategory, React.ReactNode> = {
  juridique: <Shield size={16} />,
  technique: <Activity size={16} />,
  diagnostic: <FileText size={16} />,
  marketing: <Camera size={16} />,
  media: <Image size={16} />,
  contrat: <Link size={16} />,
  autre: <FileText size={16} />,
}

interface PropertyDocumentsProps {
  property: Property
}

export const PropertyDocuments = ({ property }: PropertyDocumentsProps) => {
  const docs = property.documents || []

  const handleDownload = (doc: any) => {}
  const handleDelete = (doc: any) => {}
  const handleView = (doc: any) => {}

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary">
          {docs.length} document{docs.length !== 1 ? 's' : ''} pour <span className="font-medium text-text">{property.title}</span>
        </p>
      </div>

      {PROPERTY_DOC_CATEGORIES.map(({ key, label, description }) => {
        const categoryDocs = docs.filter(d => (d.category || 'autre') === key)
        return (
          <DocumentCategorySection
            key={key}
            title={label}
            description={description}
            icon={CATEGORY_ICONS[key]}
            documents={categoryDocs}
            onAdd={key !== 'contrat' ? () => {} : undefined}
            onDelete={handleDelete}
            onDownload={handleDownload}
            onView={handleView}
            emptyMessage={key === 'contrat' ? 'Aucun contrat lié à ce bien' : `Aucun document ${label.toLowerCase()}`}
            defaultOpen={categoryDocs.length > 0 || key === 'contrat'}
          />
        )
      })}
    </div>
  )
}
