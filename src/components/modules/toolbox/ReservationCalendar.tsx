import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Check, ChevronLeft, ChevronRight, Save, Trash2 } from 'react-feather'
import { getVacancesReservations, putVacancesReservations } from '../../../services/toolboxService'
import { StageButton, useStageTheme } from '../../dashboard/Stage'
import { useToast } from '../../ui/Toast'

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function startWeekday(year: number, month: number) {
  // Monday = 0 ... Sunday = 6 (FR)
  const d = new Date(year, month, 1).getDay()
  return (d + 6) % 7
}
function toISO(d: Date) { return d.toISOString().slice(0, 10) }

export function ReservationCalendarModal({
  open,
  onClose,
  propertyId,
  propertyTitle,
  imageUrl,
}: {
  open: boolean
  onClose: () => void
  propertyId: string | number
  propertyTitle?: string
  imageUrl?: string
}) {
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reservedSet, setReservedSet] = useState<Set<string>>(new Set())
  const [cursor, setCursor] = useState(() => {
    const n = new Date()
    return { y: n.getFullYear(), m: n.getMonth() }
  })
  const [rangeStart, setRangeStart] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getVacancesReservations(propertyId)
      .then(res => {
        const arr = (res.dates as any) as (string | { date: string })[]
        const dates: string[] = arr.map(d => typeof d === 'string' ? d : d.date).filter(Boolean)
        setReservedSet(new Set(dates))
      })
      .catch(() => toast('error', 'Impossible de charger les réservations'))
      .finally(() => setLoading(false))
  }, [open, propertyId])

  const year = cursor.y
  const month = cursor.m
  const dim = daysInMonth(year, month)
  const offset = startWeekday(year, month)
  const cells: (string | null)[] = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= dim; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push(iso)
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const monthLabel = new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const toggleSingle = (iso: string) => {
    setReservedSet(prev => {
      const n = new Set(prev)
      if (n.has(iso)) n.delete(iso)
      else n.add(iso)
      return n
    })
  }

  const handleDayClick = (iso: string | null) => {
    if (!iso) return
    // shift-range selection if rangeStart exists
    if (rangeStart && rangeStart !== iso) {
      const a = new Date(rangeStart)
      const b = new Date(iso)
      const [lo, hi] = a < b ? [a, b] : [b, a]
      const toAdd: string[] = []
      const cur = new Date(lo)
      while (cur <= hi) {
        toAdd.push(toISO(cur))
        cur.setDate(cur.getDate() + 1)
      }
      // if all in range already reserved => unreserve range, else reserve range
      setReservedSet(prev => {
        const allReserved = toAdd.every(d => prev.has(d))
        const n = new Set(prev)
        if (allReserved) toAdd.forEach(d => n.delete(d))
        else toAdd.forEach(d => n.add(d))
        return n
      })
      setRangeStart(null)
      return
    }
    // normal toggle; also set range anchor on click if user intends range next click with shift
    toggleSingle(iso)
    setRangeStart(iso)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const dates = Array.from(reservedSet).sort()
      await putVacancesReservations(propertyId, dates)
      toast('success', 'Calendrier enregistré')
      onClose()
    } catch {
      toast('error', 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleClearMonth = () => {
    const monthDates = cells.filter(Boolean) as string[]
    setReservedSet(prev => {
      const n = new Set(prev)
      monthDates.forEach(d => n.delete(d))
      return n
    })
  }

  const handleFillMonth = () => {
    const monthDates = cells.filter(Boolean) as string[]
    setReservedSet(prev => {
      const n = new Set(prev)
      monthDates.forEach(d => n.add(d))
      return n
    })
  }

  if (!open) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center p-4"
        style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[640px] max-h-[92vh] overflow-hidden rounded-[20px] border flex flex-col"
          style={{
            background: isDark ? 'linear-gradient(180deg, rgba(17,24,50,0.98), rgba(9,13,30,0.98))' : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(240,253,250,0.98))',
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)',
            boxShadow: isDark ? '0 24px 60px -18px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.08)' : '0 24px 60px -20px rgba(13,148,136,0.35), inset 0 1px 0 rgba(255,255,255,1)'
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, transparent, #F59E0B, #B45309, transparent)' }} />
          {/* Header */}
          <div className="px-5 py-4 flex items-start justify-between gap-4 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)' }}>
            <div className="flex gap-3 min-w-0">
              <div className="h-12 w-12 rounded-xl overflow-hidden border shrink-0" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)' }}>
                {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center"><Calendar size={18} className={isDark ? 'text-slate-500' : 'text-slate-400'} /></span>}
              </div>
              <div className="min-w-0">
                <h3 className={`text-sm font-extrabold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Calendrier des réservations</h3>
                <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{propertyTitle || `Bien #${propertyId}`} • cliquez pour marquer les jours réservés</p>
                <p className={`text-[11px] mt-1 ${isDark ? 'text-amber-300/80' : 'text-amber-700'}`}>Astuce : cliquez un jour puis un autre pour réserver une plage.</p>
              </div>
            </div>
            <button onClick={onClose} className={`h-8 w-8 rounded-xl border flex items-center justify-center shrink-0 ${isDark ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900'}`}>
              <X size={14} />
            </button>
          </div>

          {/* Month nav */}
          <div className="px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setCursor(c => c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 })}
                className={`h-8 w-8 rounded-xl border flex items-center justify-center ${isDark ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <ChevronLeft size={16} />
              </button>
              <span className={`text-sm font-bold capitalize min-w-[160px] text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>{monthLabel}</span>
              <button onClick={() => setCursor(c => c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 })}
                className={`h-8 w-8 rounded-xl border flex items-center justify-center ${isDark ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{reservedSet.size} jour(s) réservés</span>
            </div>
          </div>

          {/* Grid */}
          <div className="px-5 pb-2">
            <div className="grid grid-cols-7 gap-1.5">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                <div key={d} className={`text-center text-[10px] font-extrabold uppercase tracking-widest py-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{d}</div>
              ))}
              {cells.map((iso, idx) => {
                if (!iso) return <div key={idx} className="h-10" />
                const isReserved = reservedSet.has(iso)
                const isToday = iso === toISO(new Date())
                const isWeekend = new Date(iso).getDay() === 0 || new Date(iso).getDay() === 6
                return (
                  <button
                    key={iso}
                    onClick={() => handleDayClick(iso)}
                    className={`relative h-10 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5
                      ${isReserved
                        ? 'text-white border-amber-400/40 shadow-[0_4px_14px_rgba(245,158,11,0.35)]'
                        : isDark
                          ? 'bg-white/[0.03] border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-200'
                      }
                      ${isToday && !isReserved ? (isDark ? 'ring-1 ring-amber-400/40' : 'ring-1 ring-amber-400/40') : ''}
                    `}
                    style={isReserved ? { background: 'linear-gradient(135deg,#F59E0B,#B45309)' } : undefined}
                  >
                    <span>{Number(iso.slice(-2))}</span>
                    {isReserved && <Check size={10} className="text-white/90" />}
                    {isWeekend && !isReserved && <span className={`h-1 w-1 rounded-full ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`} />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Actions bar */}
          <div className="px-5 py-3 flex items-center justify-between gap-2 border-t mt-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.6)' }}>
            <div className="flex items-center gap-1.5">
              <button onClick={handleFillMonth} className={`h-8 px-3 rounded-xl text-xs font-semibold border ${isDark ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                Remplir mois
              </button>
              <button onClick={handleClearMonth} className={`h-8 px-3 rounded-xl text-xs font-semibold border inline-flex items-center gap-1 ${isDark ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900'}`}>
                <Trash2 size={12} /> Vider mois
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className={`h-9 px-4 rounded-xl text-xs font-semibold border ${isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>Annuler</button>
              <StageButton variant="primary" size="sm" onClick={handleSave} icon={saving ? undefined : <Save size={12} />} disabled={saving || loading}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </StageButton>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
