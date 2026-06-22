import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, ChevronDown, Download, Trash2, Link, Plus, Eye } from 'react-feather'
import { getDocTypeLabel } from '../../../types/document'

interface Doc {
  id: string
  name: string
  type: string
  date: string
  url?: string
  size?: string
  category?: string
}

interface DocumentCategorySectionProps {
  title: string
  description?: string
  icon?: React.ReactNode
  documents: Doc[]
  onAdd?: () => void
  onDownload?: (doc: Doc) => void
  onDelete?: (doc: Doc) => void
  onLink?: (doc: Doc) => void
  onView?: (doc: Doc) => void
  emptyMessage?: string
  defaultOpen?: boolean
  showLinkedContracts?: boolean
}

export const DocumentCategorySection = ({
  title,
  description,
  icon,
  documents,
  onAdd,
  onDownload,
  onDelete,
  onLink,
  onView,
  emptyMessage = 'Aucun document',
  defaultOpen = true,
}: DocumentCategorySectionProps) => {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-background/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-accent shrink-0">{icon}</span>}
          <div className="text-left">
            <p className="text-sm font-semibold text-text">{title}</p>
            {description && <p className="text-[11px] text-text-secondary/60">{description}</p>}
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-background border border-border text-text-secondary ml-1">
            {documents.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onAdd && (
            <button
              onClick={(e) => { e.stopPropagation(); onAdd() }}
              className="p-1.5 rounded-lg hover:bg-accent-light text-text-secondary hover:text-accent transition-all"
              title="Ajouter un document"
            >
              <Plus size={14} />
            </button>
          )}
          <ChevronDown
            size={15}
            className={`text-text-secondary transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/30">
              {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-text-secondary">
                  <FileText size={22} className="mb-2 opacity-30" />
                  <p className="text-xs">{emptyMessage}</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {documents.map((doc, i) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.15 }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-background/30 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <FileText size={14} className="text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-text-secondary/70">{getDocTypeLabel(doc.type)}</span>
                          {doc.size && (
                            <>
                              <span className="text-[10px] text-text-secondary/40">•</span>
                              <span className="text-[11px] text-text-secondary/70">{doc.size}</span>
                            </>
                          )}
                          <span className="text-[10px] text-text-secondary/40">•</span>
                          <span className="text-[11px] text-text-secondary/70">
                            {new Date(doc.date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onView && (
                          <button onClick={() => onView(doc)} className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-colors" title="Voir">
                            <Eye size={13} />
                          </button>
                        )}
                        {onDownload && (
                          <button onClick={() => onDownload(doc)} className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-colors" title="Télécharger">
                            <Download size={13} />
                          </button>
                        )}
                        {onLink && (
                          <button onClick={() => onLink(doc)} className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-accent transition-colors" title="Lier à un contrat">
                            <Link size={13} />
                          </button>
                        )}
                        {onDelete && (
                          <button onClick={() => onDelete(doc)} className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-red-500 transition-colors" title="Supprimer">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
