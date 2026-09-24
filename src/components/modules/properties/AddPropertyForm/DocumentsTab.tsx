import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useWatch } from 'react-hook-form'
import { FileText, Folder, HardDrive, Upload, Shield, Info } from 'react-feather'
import { FileTreeEditor, FileNode, cleanTree } from '../FileTreeEditor'
import { uploadFiles } from '../../../../services/uploadService'
import { SectionCard } from './stage'
import { useStageChrome } from '../../calendar/useStageChrome'
import { useStageTheme } from '../../../dashboard/Stage'

interface DocumentsTabProps {
  register: any
  control: any
  propertyType: string
  setFormValue?: (name: string, value: any) => void
  isGerant?: boolean
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

function stripFiles(nodes: FileNode[]): any[] {
  return nodes.map(n => {
    const { file, ...rest } = n as any
    if (rest.children) {
      rest.children = stripFiles(rest.children)
    }
    return rest
  })
}

function countStats(nodes: FileNode[]) {
  let files = 0
  let folders = 0
  let total = 0
  function walk(ns: FileNode[]) {
    for (const n of ns) {
      total++
      if (n.type === 'file') files++
      else folders++
      if (n.children) walk(n.children)
    }
  }
  walk(nodes)
  return { files, folders, total }
}

export function DocumentsTab({ control, setFormValue, isGerant = false }: DocumentsTabProps) {
  const watchedTree = useWatch({ control, name: 'documents.fileTree' })
  const initialLoaded = useRef(false)
  const [tree, setTree] = useState<FileNode[]>([])
  const { staged, dark } = useStageChrome()
  const theme = useStageTheme()
  const isDark = staged ? dark : theme === 'dark'

  useEffect(() => {
    if (!initialLoaded.current && watchedTree !== undefined) {
      const arr = Array.isArray(watchedTree) ? cleanTree(watchedTree) : []
      setTree(arr)
      initialLoaded.current = true
    }
  }, [watchedTree])

  useEffect(() => {
    if (!setFormValue) return
    const pending = collectPendingFiles(tree)
    if (pending.length === 0) {
      setFormValue('documents.fileTree', stripFiles(tree))
      return
    }
    let cancelled = false
    const upload = async () => {
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
      if (cancelled) return
      const updatedTree = setUrlsOnTree(tree, urlMap)
      setTree(updatedTree)
      setFormValue('documents.fileTree', stripFiles(updatedTree))
    }
    upload()
    return () => { cancelled = true }
  }, [tree, setFormValue])

  const stats = useMemo(() => countStats(tree), [tree])
  const hasAny = stats.total > 0

  return (
    <div className="space-y-5">
      <SectionCard value="documents" title="Documents" icon={FileText} subtitle={staged ? 'Arborescence holographique du bien' : 'Arborescence des fichiers du bien'} defaultOpen>
        {staged && (
          <div
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3"
            style={{
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)',
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.62)',
              boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.05)' : 'inset 0 1px 0 rgba(255,255,255,0.85), 0 8px 22px -14px rgba(13,148,136,0.18)',
            }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide"
                style={{
                  color: isDark ? '#A78BFA' : '#0D9488',
                  borderColor: isDark ? 'rgba(167,139,250,0.30)' : 'rgba(13,148,136,0.20)',
                  background: isDark ? 'rgba(167,139,250,0.12)' : 'rgba(20,184,166,0.10)',
                }}
              >
                <HardDrive size={11} />
                {stats.total} {stats.total === 1 ? 'élément' : 'éléments'}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  color: hasAny ? (isDark ? '#6EE7B7' : '#047857') : isDark ? 'rgba(226,232,240,0.55)' : 'rgba(15,23,42,0.45)',
                  borderColor: hasAny ? (isDark ? 'rgba(52,211,153,0.28)' : 'rgba(52,211,153,0.22)') : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                  background: hasAny ? (isDark ? 'rgba(52,211,153,0.10)' : 'rgba(52,211,153,0.08)') : 'transparent',
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: hasAny ? (isDark ? '#6EE7B7' : '#10B981') : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.18)'), boxShadow: hasAny ? `0 0 8px ${isDark ? 'rgba(110,231,183,0.6)' : 'rgba(16,185,129,0.35)'}` : 'none' }} />
                {stats.files} fichier{stats.files !== 1 ? 's' : ''} · {stats.folders} dossier{stats.folders !== 1 ? 's' : ''}
              </span>
            </div>
            <span className={`hidden items-center gap-1.5 text-[11px] sm:flex ${isDark ? 'text-slate-500' : 'text-teal-900/40'}`}>
              <Shield size={12} />
              Glissez-déposez • clic droit pour actions
            </span>
          </div>
        )}

        <div
          className={
            staged
              ? 'overflow-hidden rounded-2xl border'
              : ''
          }
          style={
            staged
              ? {
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)',
                  background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.45)',
                  boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.04)' : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 12px 28px -18px rgba(13,148,136,0.16)',
                }
              : undefined
          }
        >
          {staged && (
            <div
              className="flex items-center gap-2 px-4 py-2.5 text-[11px]"
              style={{
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}`,
                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)',
                color: isDark ? 'rgba(148,163,184,0.7)' : 'rgba(15,23,42,0.5)',
              }}
            >
              <Folder size={11} className={isDark ? 'text-amber-400/70' : 'text-amber-500'} />
              Arborescence · {stats.folders} dossiers · {stats.files} fichiers
              <span className="ml-auto hidden items-center gap-1.5 sm:flex" style={{ color: isDark ? 'rgba(148,163,184,0.5)' : 'rgba(15,23,42,0.4)' }}>
                <Upload size={11} />
                PDF, images · 10 Mo max
              </span>
            </div>
          )}
          <div className={staged ? 'p-2' : ''}>
            <FileTreeEditor tree={tree} onChange={setTree} />
          </div>
          {staged && (
            <div
              className="flex items-center gap-1.5 px-4 py-2.5 text-[11px]"
              style={{
                borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}`,
                background: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.35)',
                color: isDark ? 'rgba(148,163,184,0.6)' : 'rgba(15,23,42,0.45)',
              }}
            >
              <Info size={11} className={isDark ? 'text-violet-300/60' : 'text-teal-700/50'} />
              Astuce : créez des dossiers par catégorie (Juridique, Technique, Photos) puis ajoutez vos fichiers
            </div>
          )}
        </div>

        {!staged && (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-text-secondary/60">
            <Info size={11} />
            Créez des dossiers et ajoutez vos fichiers · PDF, JPG, PNG acceptés
          </p>
        )}
      </SectionCard>
    </div>
  )
}
