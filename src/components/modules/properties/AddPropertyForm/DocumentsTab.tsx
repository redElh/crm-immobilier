import React, { useState, useEffect, useRef } from 'react'
import { useWatch } from 'react-hook-form'
import { MotionCard } from '../../../../components/ui/Card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion'
import { FileTreeEditor, FileNode, cleanTree } from '../FileTreeEditor'
import { uploadFiles } from '../../../../services/uploadService'

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

export function DocumentsTab({ control, setFormValue, isGerant = false }: DocumentsTabProps) {
  const watchedTree = useWatch({ control, name: 'documents.fileTree' })
  const initialLoaded = useRef(false)
  const [tree, setTree] = useState<FileNode[]>([])

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

  return (
    <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="p-0 overflow-hidden">
      <Accordion type="multiple" defaultValue={['documents']} className="space-y-0">
        <AccordionItem value="documents" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`} />
              <span className="font-medium text-text">Documents</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="space-y-3">
              <FileTreeEditor tree={tree} onChange={setTree} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  )
}
