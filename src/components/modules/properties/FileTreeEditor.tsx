import { API_ORIGIN } from '../../../utils/config'
import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Share2, Lock } from 'react-feather'
import { useCurrentUser, isManagerRole } from '../../../hooks/useCurrentUser'
import { useRestriction } from '../../../hooks/usePermission'
import { useToast } from '../../ui/Toast'
import { getAuthToken } from '../../../utils/auth'
import { downloadMedia } from '../../../utils/mediaUrl'
import { BASE } from '../../../services/api'

export interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  createdAt?: string
  file?: File
  url?: string
  private?: boolean
}

interface FileTreeEditorProps {
  tree: FileNode[]
  onChange: (tree: FileNode[]) => void
}

let _idCounter = 0
function uid(): string {
  return `n_${Date.now()}_${++_idCounter}`
}

function cloneTree(nodes: FileNode[]): FileNode[] {
  return nodes.map(n => ({ ...n, children: n.children ? cloneTree(n.children) : undefined }))
}

function findNode(nodes: FileNode[], id: string): FileNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) {
      const found = findNode(n.children, id)
      if (found) return found
    }
  }
  return null
}

function removeNode(nodes: FileNode[], id: string): boolean {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) { nodes.splice(i, 1); return true }
    if (nodes[i].children && removeNode(nodes[i].children!, id)) return true
  }
  return false
}

function isDescendantOf(nodes: FileNode[], ancestorId: string, targetId: string): boolean {
  const ids: string[] = []
  function collect(ns: FileNode[]) {
    for (const n of ns) {
      ids.push(n.id)
      if (n.children) collect(n.children)
    }
  }
  const ancestor = findNode(nodes, ancestorId)
  if (!ancestor || !ancestor.children) return false
  collect(ancestor.children)
  return ids.includes(targetId)
}

function countItems(nodes: FileNode[]): number {
  let c = 0
  for (const n of nodes) {
    c++
    if (n.children) c += countItems(n.children)
  }
  return c
}

function formatFileSize(bytes: number): string {
  if (typeof bytes !== 'number' || isNaN(bytes)) return ''
  if (bytes < 1024) return bytes + ' o'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko'
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo'
}

const ACCEPTED_TYPES = '.pdf,image/png,image/jpeg,image/jpg,image/gif,image/webp'

const LEGACY_FOLDER_NAMES = new Set(['Juridique', 'Technique', 'Marketing', 'Autres'])

function isLegacyEmptyFolder(node: FileNode): boolean {
  return node.type === 'folder' && LEGACY_FOLDER_NAMES.has(node.name) && (!node.children || node.children.length === 0)
}

function cleanTree(nodes: FileNode[]): FileNode[] {
  return nodes.filter(n => !isLegacyEmptyFolder(n)).map(n => ({
    ...n,
    children: n.children ? cleanTree(n.children) : undefined,
  }))
}

export { cleanTree }

async function fetchPropertyFileUrl(url: string): Promise<string | null> {
  const m = url.match(/^\/uploads\/properties\/([^/]+)$/)
  if (!m) return url.startsWith('http') || url.startsWith('blob:') ? url : null
  const token = getAuthToken()
  try {
    const res = await fetch(`${BASE}/files/property/${encodeURIComponent(m[1])}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    })
    if (!res.ok) return null
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

export function FileTreeEditor({ tree, onChange }: FileTreeEditorProps) {
  const { toast } = useToast()
  const currentUser = useCurrentUser()
  const isManager = isManagerRole(currentUser?.role)
  const privDocsRestricted = useRestriction('biens-documents-prives')
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const s = new Set<string>()
    function expandAll(nodes: FileNode[]) {
      for (const n of nodes) {
        if (n.type === 'folder') { s.add(n.id); if (n.children) expandAll(n.children) }
      }
    }
    expandAll(tree)
    return s
  })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string | null } | null>(null)
  const [clipboard, setClipboard] = useState<{ action: 'copy' | 'cut'; nodes: FileNode[] } | null>(null)
  const [viewerFile, setViewerFile] = useState<FileNode | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState(false)
  const [creatingFolderIn, setCreatingFolderIn] = useState<string | null>(null)
  const [folderNameValue, setFolderNameValue] = useState('')
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputTarget = useRef<string | null>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const folderNameInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => { if (renamingId) renameInputRef.current?.focus() }, [renamingId])
  useEffect(() => { if (creatingFolderIn) setTimeout(() => folderNameInputRef.current?.focus(), 50) }, [creatingFolderIn])
  useEffect(() => {
    const handler = () => setContextMenu(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])
  useEffect(() => { setZoom(1) }, [viewerFile])
  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false
    setPreviewUrl(null)
    setPreviewError(false)
    if (!viewerFile) return
    if (viewerFile.file instanceof File) {
      objectUrl = URL.createObjectURL(viewerFile.file)
      setPreviewUrl(objectUrl)
      return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
    }
    const url = viewerFile.url
    if (!url) return
    if (!url.startsWith('/uploads/properties/')) {
      setPreviewUrl(url)
      return
    }
    fetchPropertyFileUrl(url).then(blobUrl => {
      if (cancelled) return
      if (!blobUrl) { setPreviewError(true); return }
      objectUrl = blobUrl
      setPreviewUrl(blobUrl)
    })
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [viewerFile])
  useEffect(() => {
    if (!contextMenu || !menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    const margin = 8
    let x = contextMenu.x
    let y = contextMenu.y
    if (x + rect.width + margin > window.innerWidth) x = window.innerWidth - rect.width - margin
    if (y + rect.height + margin > window.innerHeight) y = window.innerHeight - rect.height - margin
    if (x < margin) x = margin
    if (y < margin) y = margin
    setMenuPos({ x, y })
  }, [contextMenu])

  const toggleExpand = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const handleFileClick = useCallback((node: FileNode) => {
    if (node.type === 'folder') {
      toggleExpand(node.id)
    } else {
      if (node.private && !isManager) {
        toast('error', 'Ce document est privé. Seuls les administrateurs et gérants peuvent le consulter.')
        return
      }
      if (node.url || node.file instanceof File) setViewerFile(node)
    }
  }, [toggleExpand, isManager, toast])

  const handleSelect = useCallback((id: string, ctrl?: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(ctrl ? prev : [])
      if (ctrl && prev.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent, nodeId: string | null) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId })
    setMenuPos({ x: e.clientX, y: e.clientY })
  }, [])

  const getSelectedNodes = useCallback((): FileNode[] => {
    if (selectedIds.size === 0 && contextMenu?.nodeId) {
      const n = findNode(tree, contextMenu.nodeId)
      return n ? [n] : []
    }
    return Array.from(selectedIds).map(id => findNode(tree, id)).filter(Boolean) as FileNode[]
  }, [selectedIds, contextMenu, tree])

  const handleRenameStart = useCallback((id: string) => {
    const node = findNode(tree, id)
    if (node) { setRenamingId(id); setRenameValue(node.name) }
    setContextMenu(null)
  }, [tree])

  const handleShare = useCallback((node: FileNode) => {
    if (node.private && !isManager) {
      toast('error', 'Ce document est privé et ne peut pas être partagé.')
      setContextMenu(null)
      return
    }
    setContextMenu(null)
    const rawUrl = node.url
    if (!rawUrl) return toast('info', 'Ce document ne peut pas encore être partagé (fichier non enregistré)')
    const fullUrl = rawUrl.startsWith('http') ? rawUrl : `${API_ORIGIN}${rawUrl}`
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(fullUrl)
        .then(() => toast('success', 'Lien du document copié dans le presse-papiers'))
        .catch(() => toast('info', 'Impossible de copier le lien automatiquement'))
    } else {
      toast('info', 'Impossible de copier le lien automatiquement')
    }
  }, [isManager, toast])

  const handleRenameConfirm = useCallback(() => {
    if (!renamingId || !renameValue.trim()) { setRenamingId(null); return }
    const next = cloneTree(tree)
    const node = findNode(next, renamingId)
    if (node) node.name = renameValue.trim()
    onChange(next)
    setRenamingId(null)
  }, [renamingId, renameValue, tree, onChange])

  const handleAddFolder = useCallback((parentId: string | null) => {
    setCreatingFolderIn(parentId)
    setFolderNameValue('')
    setContextMenu(null)
  }, [])

  const handleFolderNameConfirm = useCallback(() => {
    if (creatingFolderIn === null || !folderNameValue.trim()) { setCreatingFolderIn(null); return }
    const newNode: FileNode = { id: uid(), name: folderNameValue.trim(), type: 'folder', children: [], createdAt: new Date().toISOString() }
    const next = cloneTree(tree)
    if (creatingFolderIn === 'ROOT') {
      next.push(newNode)
    } else {
      const parent = findNode(next, creatingFolderIn)
      if (parent) {
        if (!parent.children) parent.children = []
        parent.children.push(newNode)
      }
    }
    setExpanded(ex => { const e2 = new Set(ex); e2.add(newNode.id); return e2 })
    onChange(next)
    setCreatingFolderIn(null)
  }, [creatingFolderIn, folderNameValue, tree, onChange])

  const handleAddFiles = useCallback((parentId: string | null) => {
    fileInputTarget.current = parentId === 'ROOT' ? null : parentId
    fileInputRef.current?.click()
    setContextMenu(null)
  }, [])

  const handleFilesSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const newNodes: FileNode[] = Array.from(files).map(f => ({
      id: uid(),
      name: f.name,
      type: 'file' as const,
      file: f,
      createdAt: new Date().toISOString(),
    }))
    const next = cloneTree(tree)
    const target = fileInputTarget.current ? findNode(next, fileInputTarget.current) : null
    if (target && target.children) {
      target.children.push(...newNodes)
      setExpanded(ex => { const e2 = new Set(ex); e2.add(target.id); return e2 })
    } else if (target) {
      target.children = [...newNodes]
      setExpanded(ex => { const e2 = new Set(ex); e2.add(target.id); return e2 })
    } else {
      next.push(...newNodes)
    }
    onChange(next)
    e.target.value = ''
  }, [tree, onChange])

  const handleDelete = useCallback((targetIds?: string[]) => {
    const ids = targetIds || Array.from(selectedIds)
    if (ids.length === 0) return
    const next = cloneTree(tree)
    ids.forEach(id => removeNode(next, id))
    onChange(next)
    setSelectedIds(new Set())
    setContextMenu(null)
  }, [selectedIds, tree, onChange])

  const handleCopy = useCallback((action: 'copy' | 'cut') => {
    const nodes = getSelectedNodes()
    if (nodes.length === 0) return
    setClipboard({ action, nodes: cloneTree(nodes) })
    if (action === 'cut') {
      const ids = nodes.map(n => n.id)
      const next = cloneTree(tree)
      ids.forEach(id => removeNode(next, id))
      onChange(next)
      setSelectedIds(new Set())
    }
    setContextMenu(null)
  }, [getSelectedNodes, tree, onChange])

  const handlePaste = useCallback((targetId: string | null) => {
    if (!clipboard) return
    const pasted = cloneTree(clipboard.nodes)
    const next = cloneTree(tree)
    if (targetId === null || targetId === 'ROOT') {
      next.push(...pasted)
    } else {
      const parent = findNode(next, targetId)
      if (parent) {
        if (!parent.children) parent.children = []
        parent.children.push(...pasted)
        setExpanded(ex => { const e2 = new Set(ex); e2.add(targetId); return e2 })
      } else { next.push(...pasted) }
    }
    onChange(next)
    setClipboard(null)
    setContextMenu(null)
  }, [clipboard, tree, onChange])

  const [dragSourceIds, setDragSourceIds] = useState<string[] | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, nodeId: string) => {
    e.stopPropagation()
    const ids = selectedIds.has(nodeId) ? Array.from(selectedIds) : [nodeId]
    setDragSourceIds(ids)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', nodeId)
  }, [selectedIds])

  const handleDragOver = useCallback((e: React.DragEvent, nodeId: string | null) => {
    if (!dragSourceIds) return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    if (nodeId && !dragSourceIds.includes(nodeId)) {
      const target = findNode(tree, nodeId)
      if (target?.type === 'folder') setDragOverId(nodeId)
    } else if (nodeId === null) {
      setDragOverId(null)
    }
  }, [dragSourceIds, tree])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation()
    setDragOverId(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetId: string | null) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverId(null)
    if (!dragSourceIds || dragSourceIds.length === 0) return
    const allowedTarget = targetId && findNode(tree, targetId)?.type === 'folder' ? targetId : null
    const finalTarget = allowedTarget
    if (finalTarget && dragSourceIds.includes(finalTarget)) return
    for (const srcId of dragSourceIds) {
      if (finalTarget && isDescendantOf(tree, srcId, finalTarget)) return
    }
    const next = cloneTree(tree)
    const movedNodes: FileNode[] = []
    dragSourceIds.forEach(id => {
      const node = findNode(next, id)
      if (node) {
        movedNodes.push(node)
        removeNode(next, id)
      }
    })
    if (finalTarget) {
      const parent = findNode(next, finalTarget)
      if (parent) {
        if (!parent.children) parent.children = []
        parent.children.push(...movedNodes)
        setExpanded(ex => { const e2 = new Set(ex); e2.add(finalTarget); return e2 })
      } else { next.push(...movedNodes) }
    } else {
      next.push(...movedNodes)
    }
    onChange(next)
    setDragSourceIds(null)
    setSelectedIds(new Set())
  }, [dragSourceIds, tree, onChange])

  const handleDragEnd = useCallback(() => {
    setDragOverId(null)
    setDragSourceIds(null)
  }, [])

  const isFileImage = useCallback((node: FileNode): boolean => {
    if (node.url) return /\.(png|jpe?g|gif|webp)$/i.test(node.url)
    if (node.file) return node.file.type.startsWith('image/')
    return false
  }, [])

  const isFilePdf = useCallback((node: FileNode): boolean => {
    if (node.url) return /\.pdf$/i.test(node.url)
    if (node.file) return node.file.type === 'application/pdf'
    return false
  }, [])

  function renderNode(node: FileNode, depth: number): React.ReactNode {
    const isExpanded = expanded.has(node.id)
    const isSelected = selectedIds.has(node.id)
    const isRenaming = renamingId === node.id
    const isFolder = node.type === 'folder'
    const isCreatingFolder = creatingFolderIn === node.id
    const isDragOver = dragOverId === node.id

    return (
      <div key={node.id}>
        <div
          draggable
          className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors ${
            isSelected ? 'bg-accent/10 text-accent' : 'hover:bg-background/80 text-text-secondary hover:text-text'
          } ${isDragOver ? 'ring-2 ring-accent/40 bg-accent/5' : ''}`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={(e) => {
            e.stopPropagation()
            if (e.ctrlKey || e.metaKey) {
              handleSelect(node.id, true)
            } else {
              handleFileClick(node)
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, node.id)}
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragOver={(e) => handleDragOver(e, node.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node.id)}
        >
          {isFolder && (
            <button type="button"
              onClick={(e) => { e.stopPropagation(); toggleExpand(node.id) }}
              className="w-4 h-4 flex items-center justify-center text-text-secondary hover:text-text transition-colors"
            >
              <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {!isFolder && <div className="w-4 h-4 flex items-center justify-center" />}
          <span className="flex-shrink-0 w-4 h-4">
            {isFolder ? (
              <svg className={`w-4 h-4 ${isExpanded ? 'text-accent' : 'text-amber-500'}`} fill={isExpanded ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isExpanded ? 0 : 2}>
                {isExpanded
                  ? <path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v2H2V6z" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                }
              </svg>
            ) : (
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            )}
          </span>
          {isRenaming ? (
            <input
              ref={renameInputRef}
              className="flex-1 bg-background border border-accent rounded px-1.5 py-0.5 text-sm text-text outline-none"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRenameConfirm(); if (e.key === 'Escape') setRenamingId(null) }}
              onBlur={handleRenameConfirm}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 truncate">{node.name}</span>
          )}
          {node.file instanceof File && (
            <span className="text-[10px] text-text-secondary/40 mr-1">{formatFileSize(node.file.size)}</span>
          )}
          {!isFolder && node.private && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 flex-shrink-0"
              title="Document privé — visible uniquement par les administrateurs et gérants"
            >
              <Lock size={9} />
              Privé
            </span>
          )}
          {isFolder && !isRenaming && (
            <button type="button"
              onClick={(e) => { e.stopPropagation(); handleAddFiles(node.id) }}
              className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-text-secondary hover:text-accent transition-all"
              title="Ajouter des fichiers"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-2.828-2.828a2 2 0 00-1.414-.586H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5.172z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m-3-3h6" />
              </svg>
            </button>
          )}
        </div>
        {isFolder && isExpanded && (
          <div
            onDragOver={(e) => handleDragOver(e, node.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, node.id)}
          >
            {isCreatingFolder && (
              <div className="flex items-center gap-1.5 px-2 py-1.5" style={{ paddingLeft: `${12 + (depth + 1) * 16}px` }}>
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <input
                  ref={folderNameInputRef}
                  className="flex-1 bg-background border border-accent rounded px-1.5 py-0.5 text-sm text-text outline-none"
                  placeholder="Nom du dossier"
                  value={folderNameValue}
                  onChange={e => setFolderNameValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleFolderNameConfirm(); if (e.key === 'Escape') setCreatingFolderIn(null) }}
                  onBlur={handleFolderNameConfirm}
                  onClick={e => e.stopPropagation()}
                />
              </div>
            )}
            {node.children && node.children.length > 0 && (
              node.children.map(child => renderNode(child, depth + 1))
            )}
            {(!node.children || node.children.length === 0) && !isCreatingFolder && (
              <div className="text-xs text-text-secondary/30 italic px-2 py-2" style={{ paddingLeft: `${12 + (depth + 1) * 16}px` }}>
                Dossier vide — glissez-déposez des fichiers ou utilisez le menu contextuel
              </div>
            )}
          </div>
        )}
        {isFolder && !isExpanded && isCreatingFolder && (
          <div className="flex items-center gap-1.5 px-2 py-1.5" style={{ paddingLeft: `${12 + (depth + 1) * 16}px` }}>
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <input
              ref={folderNameInputRef}
              className="flex-1 bg-background border border-accent rounded px-1.5 py-0.5 text-sm text-text outline-none"
              placeholder="Nom du dossier"
              value={folderNameValue}
              onChange={e => setFolderNameValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleFolderNameConfirm(); if (e.key === 'Escape') setCreatingFolderIn(null) }}
              onBlur={handleFolderNameConfirm}
              onClick={e => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    )
  }

  const selectedCount = selectedIds.size
  const totalItems = countItems(tree)
  const canPaste = clipboard !== null

  return (
    <>
      <div className="flex items-center gap-2">
        <button type="button"
          onClick={(e) => { e.stopPropagation(); handleAddFolder('ROOT') }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/40 bg-card text-text-secondary hover:text-accent hover:border-accent/40 transition-all"
          title="Nouveau dossier"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-5 4h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Nouveau dossier
        </button>
        <button type="button"
          onClick={(e) => { e.stopPropagation(); handleAddFiles('ROOT') }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/40 bg-card text-text-secondary hover:text-accent hover:border-accent/40 transition-all"
          title="Ajouter des fichiers"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-2.828-2.828a2 2 0 00-1.414-.586H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5.172z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m-3-3h6" />
          </svg>
          Ajouter des fichiers
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={handleFilesSelected}
        />
      </div>

      {creatingFolderIn === 'ROOT' && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-background/30 border border-border/20" style={{ paddingLeft: '12px' }} onClick={e => e.stopPropagation()}>
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <input
            ref={folderNameInputRef}
            className="flex-1 bg-background border border-accent rounded px-1.5 py-0.5 text-sm text-text outline-none"
            placeholder="Nom du dossier"
            value={folderNameValue}
            onChange={e => setFolderNameValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleFolderNameConfirm(); if (e.key === 'Escape') setCreatingFolderIn(null) }}
            onBlur={handleFolderNameConfirm}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      <div className="border border-border/30 rounded-xl bg-card/50 overflow-hidden" onClick={() => setContextMenu(null)}>
        <div className="max-h-[400px] overflow-y-auto py-2 space-y-0.5">
          {tree.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <svg className="w-10 h-10 mx-auto text-text-secondary/30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <p className="text-sm text-text-secondary/60">Aucun document</p>
              <p className="text-xs text-text-secondary/40 mt-1">Créez un dossier ou ajoutez des fichiers</p>
            </div>
          ) : (
            tree.map(node => renderNode(node, 0))
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-text-secondary/60">
        <span>{totalItems} élément{totalItems !== 1 ? 's' : ''}{selectedCount > 0 && ` (${selectedCount} sélectionné${selectedCount !== 1 ? 's' : ''})`}</span>
        {canPaste && (
          <span className="text-accent/80">
            Presse-papiers: {clipboard!.nodes.length} élément{clipboard!.nodes.length !== 1 ? 's' : ''} ({clipboard!.action === 'copy' ? 'copié' : 'coupé'})
          </span>
        )}
      </div>

      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-[9999] min-w-[200px] bg-card border border-border/40 rounded-xl shadow-xl py-1.5 backdrop-blur-md"
          style={{ left: menuPos?.x ?? contextMenu.x, top: menuPos?.y ?? contextMenu.y, visibility: menuPos ? 'visible' : 'hidden' }}
          onClick={e => e.stopPropagation()}
        >
          <button type="button"
            onClick={() => { handleAddFolder(contextMenu.nodeId); setContextMenu(null) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-text-secondary hover:text-text hover:bg-background/80 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-5 4h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Nouveau dossier
          </button>
          <button type="button"
            onClick={() => { handleAddFiles(contextMenu.nodeId); setContextMenu(null) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-text-secondary hover:text-text hover:bg-background/80 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-2.828-2.828a2 2 0 00-1.414-.586H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5.172z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m-3-3h6" />
            </svg>
            Ajouter des fichiers
          </button>
          {contextMenu.nodeId && (
            <button type="button"
              onClick={() => { handleRenameStart(contextMenu.nodeId!); setContextMenu(null) }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-text-secondary hover:text-text hover:bg-background/80 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Renommer
            </button>
          )}
          {contextMenu.nodeId && (() => {
            const node = findNode(tree, contextMenu.nodeId!)
            if (!node || node.type !== 'file' || node.private) return null
            if (privDocsRestricted) return null
            return (
              <button type="button"
                onClick={() => handleShare(node)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-text-secondary hover:text-text hover:bg-background/80 transition-colors"
              >
                <Share2 size={16} className="text-text-secondary" />
                Partager
              </button>
            )
          })()}
          <div className="h-px bg-border/30 my-1" />
          <button type="button"
            onClick={() => handleCopy('copy')}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-text-secondary hover:text-text hover:bg-background/80 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copier
          </button>
          <button type="button"
            onClick={() => handleCopy('cut')}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-text-secondary hover:text-text hover:bg-background/80 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121M12 12l2.879 2.879M12 12L9.121 14.121M12 12l2.879-2.879" />
            </svg>
            Couper
          </button>
          {canPaste && (
            <button type="button"
              onClick={() => { handlePaste(contextMenu.nodeId); setContextMenu(null) }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-text-secondary hover:text-text hover:bg-background/80 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Coller
            </button>
          )}
          <div className="h-px bg-border/30 my-1" />
          <button type="button"
            onClick={() => { handleDelete(contextMenu.nodeId ? [contextMenu.nodeId] : undefined); setContextMenu(null) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Supprimer
          </button>
        </div>
      )}

      {viewerFile && (
        <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-8" onClick={() => setViewerFile(null)}>
          <div className="relative w-full max-w-4xl h-[80vh] bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-sm border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700 truncate">{viewerFile.name}</span>
              <div className="flex items-center gap-2">
                {isFileImage(viewerFile) && (
                  <div className="flex items-center gap-1 mr-2">
                    <button type="button"
                      onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
                      className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      title="Zoom arrière"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="text-[10px] text-gray-400 min-w-[32px] text-center">{Math.round(zoom * 100)}%</span>
                    <button type="button"
                      onClick={() => setZoom(z => Math.min(5, z + 0.25))}
                      className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      title="Zoom avant"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <button type="button"
                      onClick={() => setZoom(1)}
                      className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      title="Réinitialiser le zoom"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <span className="w-px h-4 bg-gray-200 mx-1" />
                  </div>
                )}
                {viewerFile.file instanceof File && (
                  <span className="text-[10px] text-gray-400">{formatFileSize(viewerFile.file.size)}</span>
                )}
                <button type="button"
                  onClick={() => {
                    if (viewerFile.url) {
                      downloadMedia(viewerFile.url, viewerFile.name).catch(() => toast('error', 'Échec du téléchargement'))
                    } else if (viewerFile.file instanceof File) {
                      const url = URL.createObjectURL(viewerFile.file)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = viewerFile.name
                      a.click()
                      setTimeout(() => URL.revokeObjectURL(url), 1000)
                    }
                  }}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-accent hover:bg-gray-100 transition-colors"
                  title="Télécharger"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button type="button" onClick={() => setViewerFile(null)} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="w-full h-full pt-12">
              {previewError ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center px-8">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-gray-400 text-sm">Aperçu indisponible</p>
                    <p className="text-gray-400 text-xs mt-1">Impossible de charger ce document</p>
                  </div>
                </div>
              ) : previewUrl == null && !(viewerFile.file instanceof File) ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center px-8">
                    <svg className="w-8 h-8 mx-auto text-gray-300 mb-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <p className="text-gray-400 text-sm">Chargement de l'aperçu...</p>
                  </div>
                </div>
              ) : isFileImage(viewerFile) ? (
                <div
                  className="w-full h-full flex items-center justify-center bg-gray-50 p-4 overflow-auto cursor-grab active:cursor-grabbing"
                  onWheel={(e) => { e.preventDefault(); setZoom(z => Math.max(0.25, Math.min(5, z - e.deltaY * 0.001))) }}
                >
                  <img
                    src={previewUrl || undefined}
                    alt={viewerFile.name}
                    className="rounded-lg transition-transform duration-100"
                    style={{ transform: `scale(${zoom})`, maxWidth: zoom <= 1 ? '100%' : 'none', maxHeight: zoom <= 1 ? '100%' : 'none' }}
                    draggable={false}
                  />
                </div>
              ) : isFilePdf(viewerFile) ? (
                <iframe
                  src={previewUrl || undefined}
                  className="w-full h-full"
                  title={viewerFile.name}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center px-8">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-400 text-sm">Aperçu non disponible</p>
                    <p className="text-gray-400 text-xs mt-1">Format de fichier non supporté</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
