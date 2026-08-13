import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { X, Check, Percent, CheckSquare, Square } from 'react-feather'
import { Button } from '../../ui/Button'
import { useToast } from '../../ui/Toast'
import type { Property } from '../../../types/property'
import { getPropertyTabs } from '../../../utils/propertyTabs'
import { updatePropertyCompletion } from '../../../services/propertyService'

interface PropertyCompletionModalProps {
  property: Property
  isOpen: boolean
  onClose: () => void
  onSaved: (updated: Property) => void
  isGerant?: boolean
}

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
}

export function PropertyCompletionModal({ property, isOpen, onClose, onSaved, isGerant = false }: PropertyCompletionModalProps) {
  const { toast } = useToast()
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)

  const tabs = useMemo(
    () => getPropertyTabs(property.propertyType, property.furnishing, property.constructionType),
    [property.propertyType, property.furnishing, property.constructionType],
  )

  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, boolean> = {}
      for (const tab of tabs) {
        initial[tab.id] = !!property.completionTabs?.[tab.id]
      }
      setChecked(initial)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, property.id, property.completionTabs, tabs])

  const doneCount = tabs.filter((tab) => checked[tab.id]).length
  const percent = tabs.length > 0 ? Math.round((doneCount / tabs.length) * 100) : 0
  const barColor =
    percent === 100
      ? 'from-emerald-400 to-emerald-500'
      : percent >= 50
        ? isGerant ? 'from-[#905D5D] to-violet-500' : 'from-accent to-violet-500'
        : isGerant ? 'from-[#905D5D] to-[#D2A8A8]' : 'from-amber-400 to-orange-500'
  const percentColor =
    percent === 100 ? 'text-emerald-500' : percent >= 50 ? (isGerant ? 'text-[#905D5D]' : 'text-accent') : (isGerant ? 'text-[#905D5D]' : 'text-amber-500')

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updatePropertyCompletion(property.id, {
        completion: percent,
        completionTabs: checked,
      })
      onSaved(updated)
      toast('success', 'Complétion mise à jour avec succès')
      onClose()
    } catch (e: any) {
      toast('error', e.message || 'Erreur lors de la mise à jour de la complétion')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-md bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border/40">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
                    <Percent size={16} />
                  </span>
                  <h3 className="text-lg font-bold text-text">Complétion du dossier</h3>
                </div>
                <p className="text-xs text-text-secondary mt-1.5">
                  {property.reference} — {property.title}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-background transition-colors"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Progress */}
            <div className="px-6 pt-5">
              <div className="flex items-end justify-between mb-2">
                <span className="text-xs font-medium text-text-secondary">
                  {doneCount} / {tabs.length} étapes complétées
                </span>
                <motion.span
                  key={percent}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-2xl font-bold tabular-nums ${percentColor}`}
                >
                  {percent}%
                </motion.span>
              </div>
              <div className="h-2.5 rounded-full bg-background overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                  initial={false}
                  animate={{ width: `${percent}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>
            </div>

            {/* Checklist */}
            <motion.ul
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="px-4 py-4 max-h-[46vh] overflow-y-auto space-y-1.5"
            >
              {tabs.map((tab) => {
                const isDone = !!checked[tab.id]
                return (
                  <motion.li key={tab.id} variants={itemVariants}>
                    <button
                      type="button"
                      onClick={() => toggle(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 text-left ${
                        isDone
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : isGerant ? 'border-border/60 bg-background/40 hover:border-[#905D5D]/40 hover:bg-[#905D5D]/5' : 'border-border/60 bg-background/40 hover:border-accent/40 hover:bg-accent/5'
                      }`}
                    >
                      <span
                        className={`relative flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all duration-200 ${
                          isDone
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : isGerant ? 'border-text-secondary/40 text-transparent group-hover:border-[#905D5D]' : 'border-text-secondary/40 text-transparent group-hover:border-accent'
                        }`}
                      >
                        <AnimatePresence>
                          {isDone && (
                            <motion.span
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 45 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <Check size={12} strokeWidth={3} />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </span>
                      <span
                        className={`flex-1 text-sm font-medium transition-all duration-200 ${
                          isDone ? 'text-emerald-600 line-through decoration-emerald-500/50' : 'text-text'
                        }`}
                      >
                        {tab.label}
                      </span>
                      {isDone ? (
                        <CheckSquare size={16} className="text-emerald-500 shrink-0" />
                      ) : (
                        <Square size={16} className="text-text-secondary/30 shrink-0" />
                      )}
                    </button>
                  </motion.li>
                )
              })}
            </motion.ul>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/40">
              <Button type="button" variant="ghost" onClick={onClose}>
                Annuler
              </Button>
              <Button type="button" onClick={handleSave} loading={saving}>
                <Check size={15} />
                Enregistrer
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
