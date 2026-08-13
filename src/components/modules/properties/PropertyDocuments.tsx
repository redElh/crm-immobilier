import { useState, useEffect } from 'react'
import { Save } from 'react-feather'
import { FileTreeEditor, FileNode, cleanTree } from './FileTreeEditor'
import { updatePropertyDocuments } from '../../../services/propertyService'
import { uploadFiles } from '../../../services/uploadService'
import type { Property } from '../../../types/property'

interface PropertyDocumentsProps {
  property: Property
  isGerant?: boolean
}

function cloneTree(nodes: FileNode[]): FileNode[] {
  return nodes.map(n => ({
    ...n,
    children: n.children ? cloneTree(n.children) : undefined,
  }))
}

function collectPendingFiles(nodes: FileNode[]): { node: FileNode; file: File }[] {
  const pending: { node: FileNode; file: File }[] = []
  for (const n of nodes) {
    if (n.type === 'file' && !n.url && n.file instanceof File) {
      pending.push({ node: n, file: n.file })
    }
    if (n.children) {
      pending.push(...collectPendingFiles(n.children))
    }
  }
  return pending
}

function setUrlsOnTree(nodes: FileNode[], urlMap: Map<File, string>): FileNode[] {
  return nodes.map(n => {
    if (n.type === 'file' && !n.url && n.file instanceof File) {
      const url = urlMap.get(n.file)
      if (url) return { ...n, url, file: undefined }
    }
    if (n.children) {
      return { ...n, children: setUrlsOnTree(n.children, urlMap) }
    }
    return n
  })
}

export const PropertyDocuments = ({ property, isGerant = false }: PropertyDocumentsProps) => {
  const [tree, setTree] = useState<FileNode[]>(() => {
    const docs = (property as any).documents
    if (docs && typeof docs === 'object' && !Array.isArray(docs) && Array.isArray(docs.fileTree)) {
      return cleanTree(docs.fileTree)
    }
    return []
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSaved(false)
  }, [tree])

  const handleSave = async () => {
    setSaving(true)
    try {
      let treeToSave = cloneTree(tree)
      const pending = collectPendingFiles(treeToSave)
      if (pending.length > 0) {
        const urlMap = new Map<File, string>()
        const batchSize = 10
        for (let i = 0; i < pending.length; i += batchSize) {
          const batch = pending.slice(i, i + batchSize)
          const files = batch.map(p => p.file)
          const urls = await uploadFiles(files)
          batch.forEach((p, idx) => {
            if (urls[idx]) urlMap.set(p.file, urls[idx])
          })
        }
        treeToSave = setUrlsOnTree(treeToSave, urlMap)
        setTree(treeToSave)
      }
      await updatePropertyDocuments(property.id, treeToSave)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error('Failed to save documents:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary">
          <span className="font-medium text-text">{property.title}</span>
        </p>
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
            saved
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : isGerant ? `border-border/40 bg-card text-text-secondary hover:text-[#905D5D] hover:border-[#905D5D]/40` : 'border-border/40 bg-card text-text-secondary hover:text-accent hover:border-accent/40'
          } disabled:opacity-50`}
        >
          <Save size={13} />
          {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé' : 'Sauvegarder'}
        </button>
      </div>

      <FileTreeEditor tree={tree} onChange={setTree} />
    </div>
  )
}
