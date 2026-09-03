import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Percent, CheckSquare, Square } from 'react-feather'
import { useToast } from '../../ui/Toast'
import { useStageTheme } from '../../dashboard/Stage'
import { STAGE_HUES } from '../../dashboard/Stage'
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

export function PropertyCompletionModal({ property, isOpen, onClose, onSaved, isGerant = false }: PropertyCompletionModalProps) {
  const { toast } = useToast()
  const theme = useStageTheme()
  const isDark = theme === 'dark'
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
  }, [isOpen, property.id, property.completionTabs, tabs])

  const doneCount = tabs.filter((tab) => checked[tab.id]).length
  const percent = tabs.length > 0 ? Math.round((doneCount / tabs.length) * 100) : 0
  const percentHue = percent === 100
    ? STAGE_HUES.emerald
    : percent >= 50
      ? STAGE_HUES.violet
      : STAGE_HUES.amber

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
            className="absolute inset-0"
            style={{
              backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={onClose}
          />
          <motion.div
            className={`relative w-full max-w-md rounded-2xl border overflow-hidden ${isDark ? 'stage-dark' : 'stage-light'}`}
            style={{
              background: isDark
                ? 'linear-gradient(180deg, rgba(17,24,50,0.95), rgba(9,13,30,0.97))'
                : 'linear-gradient(180deg, rgba(255,255,255,0.97), rgba(240,253,250,0.95))',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)',
              boxShadow: isDark
                ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 40px 100px -24px rgba(0,0,0,0.9)'
                : 'inset 0 1px 0 rgba(255,255,255,1), 0 30px 70px -24px rgba(13,148,136,0.5)',
            }}
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            {/* Top accent beam */}
            <div className="h-[3px] w-full"
              style={{ background: `linear-gradient(90deg, transparent, ${percentHue.a}, ${percentHue.b}, transparent)` }}
            />

            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4"
              style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)'}` }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${percentHue.a}30, ${percentHue.b}18)`,
                    border: `1px solid ${percentHue.a}28`,
                    boxShadow: `0 4px 12px ${percentHue.glow}`,
                  }}
                >
                  <Percent size={16} style={{ color: percentHue.a }} />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Complétion du dossier
                  </h3>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {property.reference} — {property.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 border shrink-0"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.03)',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                  color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)',
                }}
                aria-label="Fermer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Progress */}
            <div className="px-6 pt-5">
              <div className="flex items-end justify-between mb-2.5">
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400/80' : 'text-slate-500'}`}>
                  {doneCount} / {tabs.length} étapes complétées
                </span>
                <span
                  key={percent}
                  className="text-2xl font-extrabold tabular-nums transition-colors duration-300"
                  style={{ color: percentHue.a }}
                >
                  {percent}%
                </span>
              </div>
              <div className="relative h-2.5 rounded-full overflow-hidden"
                style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)' }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${percent}%`,
                    background: `linear-gradient(90deg, ${percentHue.a}, ${percentHue.b})`,
                    boxShadow: `0 0 12px ${percentHue.glow}`,
                  }}
                />
                {percent > 0 && (
                  <div className="absolute inset-0 rounded-full overflow-hidden" style={{ width: `${percent}%` }}>
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Checklist — zero Framer Motion, pure CSS transitions */}
            <ul
              className="px-4 py-4 max-h-[46vh] overflow-y-auto scrollbar-thin space-y-1.5"
              style={{
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch' as any,
                transform: 'translateZ(0)',
                willChange: 'scroll-position',
              }}
            >
              {tabs.map((tab) => {
                const isDone = !!checked[tab.id]
                return (
                  <li key={tab.id}>
                    <button
                      type="button"
                      onClick={() => toggle(tab.id)}
                      className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left"
                      style={{
                        borderColor: isDone
                          ? `${STAGE_HUES.emerald.a}40`
                          : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
                        background: isDone
                          ? `${STAGE_HUES.emerald.a}08`
                          : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.6)',
                        transition: 'background 0.2s, border-color 0.2s',
                      }}
                    >
                      {/* Checkbox — CSS-only transition */}
                      <span
                        className="relative flex items-center justify-center w-5 h-5 rounded-md border-2 shrink-0"
                        style={{
                          borderColor: isDone ? STAGE_HUES.emerald.a : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.15)',
                          background: isDone ? STAGE_HUES.emerald.a : 'transparent',
                          boxShadow: isDone ? `0 2px 8px ${STAGE_HUES.emerald.glow}` : 'none',
                          transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                      >
                        <Check
                          size={12}
                          strokeWidth={3}
                          className="text-white"
                          style={{
                            transform: isDone ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-45deg)',
                            opacity: isDone ? 1 : 0,
                            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s ease',
                          }}
                        />
                      </span>
                      {/* Label */}
                      <span
                        className="flex-1 text-sm font-medium"
                        style={{
                          color: isDone ? STAGE_HUES.emerald.a : isDark ? '#e2e8f0' : '#1e293b',
                          textDecoration: isDone ? 'line-through' : 'none',
                          textDecorationColor: isDone ? `${STAGE_HUES.emerald.a}80` : 'transparent',
                          transition: 'color 0.2s, text-decoration-color 0.2s',
                        }}
                      >
                        {tab.label}
                      </span>
                      {/* Status icon */}
                      {isDone ? (
                        <CheckSquare size={16} className="shrink-0" style={{ color: STAGE_HUES.emerald.a }} />
                      ) : (
                        <Square size={16} className="shrink-0" style={{ color: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.12)' }} />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-4"
              style={{
                borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)'}`,
                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.4)',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-xl text-xs font-semibold border transition-all duration-200"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)',
                  color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)',
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="h-9 px-4 rounded-xl text-xs font-bold text-white transition-all duration-200 flex items-center gap-1.5"
                style={{
                  background: `linear-gradient(135deg, ${percentHue.a}, ${percentHue.b})`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 12px -4px ${percentHue.glow}`,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                Enregistrer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
