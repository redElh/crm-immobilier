import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import { Save, Check, Folder, FileText, UploadCloud, Lock } from 'react-feather'
import { FileTreeEditor, FileNode, cleanTree } from './FileTreeEditor'
import { updatePropertyDocuments } from '../../../services/propertyService'
import { uploadFiles } from '../../../services/uploadService'
import type { Property } from '../../../types/property'
import { useStageChrome } from '../calendar/useStageChrome'
import { OrbIcon, STAGE_HUES, SLATE_HUE, ShimmerProgress, TiltCard } from '../../dashboard/Stage'

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

function countNodes(nodes: FileNode[]): { folders: number; files: number; pending: number; privates: number } {
  const acc = { folders: 0, files: 0, pending: 0, privates: 0 }
  for (const n of nodes) {
    if (n.type === 'folder') {
      acc.folders++
      if (n.private) acc.privates++
    } else {
      acc.files++
      if (n.file instanceof File) acc.pending++
      if (n.private) acc.privates++
    }
    if (n.children) {
      const sub = countNodes(n.children)
      acc.folders += sub.folders
      acc.files += sub.files
      acc.pending += sub.pending
      acc.privates += sub.privates
    }
  }
  return acc
}

export const PropertyDocuments = ({ property, isGerant = false }: PropertyDocumentsProps) => {
  const { staged, dark } = useStageChrome()
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

  const stats = useMemo(() => countNodes(tree), [tree])
  const total = stats.folders + stats.files

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

  /* ===================================================================
     STAGE variant — Explorer command bar + stats strip
  =================================================================== */
  if (staged) {
    return (
      <div className="space-y-4">
        {/* Command bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <OrbIcon icon={Folder} hue={STAGE_HUES.violet} size={38} radius={12} />
            <div className="min-w-0">
              <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>
                Explorateur de documents
              </p>
              <p className={`truncate text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
                {property.title}
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-4 text-xs font-bold transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed ${
              saved
                ? ''
                : 'text-white disabled:opacity-50'
            }`}
            style={saved ? {
              color: STAGE_HUES.emerald.line,
              borderColor: `${STAGE_HUES.emerald.a}50`,
              backgroundColor: `${STAGE_HUES.emerald.a}14`,
              boxShadow: `0 0 14px ${STAGE_HUES.emerald.glow}`,
            } : {
              borderColor: dark ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.5)',
              backgroundImage: dark
                ? 'linear-gradient(to bottom, #8B7CFF, #5646C9)'
                : 'linear-gradient(to bottom, #2DD4BF, #059669)',
              boxShadow: dark
                ? 'inset 0 1px 0 rgba(255,255,255,0.45), 0 8px 20px -8px rgba(124,92,255,0.7)'
                : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 20px -10px rgba(13,148,136,0.7)',
            }}
          >
            {saved ? <Check size={13} strokeWidth={3} /> : <Save size={13} />}
            {saving ? 'Sauvegarde…' : saved ? 'Sauvegardé' : 'Sauvegarder'}
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Folder, hue: STAGE_HUES.amber, label: 'Dossiers', value: stats.folders },
            { icon: FileText, hue: STAGE_HUES.sky, label: 'Fichiers', value: stats.files },
            { icon: Lock, hue: STAGE_HUES.fuchsia, label: 'Privés', value: stats.privates },
            { icon: UploadCloud, hue: stats.pending > 0 ? STAGE_HUES.emerald : SLATE_HUE, label: 'En attente', value: stats.pending },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <TiltCard className="flex items-center gap-3 p-3">
                <OrbIcon icon={item.icon} hue={item.hue} size={36} radius={11} />
                <div className="min-w-0">
                  <p className={`truncate text-[9px] font-bold uppercase tracking-[0.16em] ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>
                    {item.label}
                  </p>
                  <AnimatedCounter value={item.value} dark={dark} />
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>

        {/* Pending uploads shimmer */}
        {stats.pending > 0 && !saved && (
          <div>
            <ShimmerProgress pct={Math.min(100, (stats.files - stats.pending + 1) * Math.max(1, Math.round(100 / Math.max(stats.files, 1))))} colorFrom={STAGE_HUES.emerald.a} colorTo={STAGE_HUES.emerald.b} glow={STAGE_HUES.emerald.glow} height={4} />
            <p className={`mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>
              {stats.pending} fichier{stats.pending > 1 ? 's' : ''} en attente d'upload à la sauvegarde
            </p>
          </div>
        )}

        <FileTreeEditor tree={tree} onChange={setTree} />
      </div>
    )
  }

  /* ===================================================================
     Legacy variant (admin shell) — unchanged
  =================================================================== */
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

function AnimatedCounter({ value, dark }: { value: number; dark: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionVal = useMotionValue(0)
  const springVal = useSpring(motionVal, { stiffness: 200, damping: 18 })
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) { motionVal.set(value); return }
    motionVal.set(0)
    const t = setTimeout(() => motionVal.set(value), 60)
    return () => clearTimeout(t)
  }, [value, reduced, motionVal])

  useEffect(() => {
    const unsub = springVal.on('change', (v) => {
      if (ref.current) ref.current.textContent = Math.round(v).toLocaleString('fr-FR')
    })
    return unsub
  }, [springVal])

  return (
    <p className={`text-base font-extrabold leading-tight tabular-nums ${dark ? 'text-white' : 'text-slate-900'}`}>
      <span ref={ref}>{reduced ? value.toLocaleString('fr-FR') : '0'}</span>
    </p>
  )
}
