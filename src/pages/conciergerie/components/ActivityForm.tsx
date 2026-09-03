import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Select } from '../../../components/ui/Select'
import { Button } from '../../../components/ui/Button'
import { API_ORIGIN } from '../../../utils/config'
import { getAuthToken } from '../../../utils/auth'
import { Compass, DollarSign, Package, Image, Clock, ChevronDown, Plus, Edit3, Trash2, X, ChevronLeft, ChevronRight, Upload } from 'react-feather'
import { motion, AnimatePresence } from 'framer-motion'
import { useStageChrome } from '../../../components/modules/calendar/useStageChrome'
import { useStageFormClasses } from '../../../components/modules/calendar/StageModal'
import { cn } from '../../../lib/utils'
import { OrbIcon, STAGE_HUES } from '../../../components/dashboard/Stage'

const CATEGORIES = [
  { value: 'Nautique', label: 'Nautique' },
  { value: 'Gastronomie', label: 'Gastronomie' },
  { value: 'Bien-être', label: 'Bien-être' },
  { value: 'Culture', label: 'Culture' },
  { value: 'Aventure', label: 'Aventure' },
  { value: 'Bienfait', label: 'Bienfait' },
  { value: 'Autre', label: 'Autre' },
]

function formatMAD(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' MAD'
}

function tierApi(path: string, opts?: RequestInit) {
  const token = getAuthToken()
  return fetch(`${API_ORIGIN}/api/conciergerie${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers },
  })
}

interface PricingTier {
  id?: number
  activity_id?: number
  min_persons: number
  max_persons: number
  price_per_person: number
  commission_rate?: number | null
  _local?: boolean
}

interface ActivityFormProps {
  form: any
  setForm: (f: any) => void
  partners: { id: number; name: string }[]
  editing?: boolean
  activityId?: number | null
  onSaved?: () => void
}

function Section({ title, icon: Icon, hue = STAGE_HUES.violet, children, defaultOpen = true }: { title: string; icon: any; hue?: any; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const { staged, dark } = useStageChrome()
  return (
    <div className={cn('overflow-hidden rounded-2xl border', staged ? (dark ? 'border-white/5 bg-white/[0.03]' : 'border-slate-200 bg-white shadow-sm') : 'border-border/40 bg-card')}>
      <button type="button" onClick={() => setOpen(!open)}
        className={cn('w-full flex items-center gap-3 px-5 py-3.5 transition-colors text-left', staged ? (dark ? 'bg-white/[0.02] hover:bg-white/[0.05]' : 'bg-slate-50/70 hover:bg-white') : 'bg-background/50 hover:bg-background')}>
        <OrbIcon icon={Icon} hue={hue} size={26} radius={8} />
        <span className={cn('text-sm font-bold flex-1', staged ? (dark ? 'text-white' : 'text-slate-900') : 'text-text')}>{title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className={dark ? 'text-slate-400' : 'text-slate-500'} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className={cn('px-5 py-4 space-y-4 border-t', staged ? (dark ? 'border-white/5' : 'border-slate-100') : 'border-border/30')}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ActivityForm({ form, setForm, partners, editing, activityId, onSaved }: ActivityFormProps) {
  const [included, setIncluded] = useState<string[]>(form.included_items || [])
  const [notIncluded, setNotIncluded] = useState<string[]>(form.not_included_items || [])
  const [newIncluded, setNewIncluded] = useState('')
  const [newNotIncluded, setNewNotIncluded] = useState('')

  const tiers: PricingTier[] = form.pricing_tiers || []
  const [showTierModal, setShowTierModal] = useState(false)
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null)
  const [tierForm, setTierForm] = useState<Partial<PricingTier>>({})
  const [savingTier, setSavingTier] = useState(false)

  const commission = Number(form.price || 0) * Number(form.commission_rate || 0) / 100
  const netPrice = Number(form.price || 0) - commission

  const allPhotos: string[] = []
  if (form.photo_url) allPhotos.push(form.photo_url)
  if (form.photos?.length) allPhotos.push(...form.photos)
  const [photoViewIndex, setPhotoViewIndex] = useState(0)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { input: stageInput, label: stageLabel, staged, dark } = useStageFormClasses()
  const ctrl = (extra?: string) => (staged ? stageInput(extra) : undefined)
  const isDark = dark

  useEffect(() => { setIncluded(form.included_items || []) }, [form.included_items])
  useEffect(() => { setNotIncluded(form.not_included_items || []) }, [form.not_included_items])

  const addIncluded = () => {
    if (!newIncluded.trim()) return
    const updated = [...included, newIncluded.trim()]
    setIncluded(updated)
    setForm({ ...form, included_items: updated })
    setNewIncluded('')
  }

  const removeIncluded = (idx: number) => {
    const updated = included.filter((_, i) => i !== idx)
    setIncluded(updated)
    setForm({ ...form, included_items: updated })
  }

  const addNotIncluded = () => {
    if (!newNotIncluded.trim()) return
    const updated = [...notIncluded, newNotIncluded.trim()]
    setNotIncluded(updated)
    setForm({ ...form, not_included_items: updated })
    setNewNotIncluded('')
  }

  const removeNotIncluded = (idx: number) => {
    const updated = notIncluded.filter((_, i) => i !== idx)
    setNotIncluded(updated)
    setForm({ ...form, not_included_items: updated })
  }

  const formRef = useRef(form)
  formRef.current = form

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      const fd = new FormData()
      for (const f of Array.from(files)) fd.append('files', f)
      const token = getAuthToken()
      const res = await fetch(`${API_ORIGIN}/api/conciergerie/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur upload' }))
        throw new Error(err.error || `Erreur ${res.status}`)
      }
      const data = await res.json()
      const newUrls: string[] = data.urls || []
      if (newUrls.length > 0) {
        const current = formRef.current
        const updates: any = { ...current }
        if (!current.photo_url) {
          updates.photo_url = newUrls[0]
          updates.photos = [...(current.photos || []), ...newUrls.slice(1)]
        } else {
          updates.photos = [...(current.photos || []), ...newUrls]
        }
        setForm(updates)
      }
    } catch (err: any) {
      console.error('Photo upload error:', err)
      alert(err?.message || 'Erreur lors du téléchargement des photos')
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePhoto = (idx: number) => {
    const updated = allPhotos.filter((_, i) => i !== idx)
    const updates: any = { ...form, photos: updated.slice(1), photo_url: updated[0] || '' }
    setForm(updates)
    if (photoViewIndex >= updated.length) setPhotoViewIndex(Math.max(0, updated.length - 1))
  }

  const openAddTier = () => {
    setEditingTier(null)
    setTierForm({ min_persons: 1, max_persons: 2, price_per_person: 0, commission_rate: Number(form.commission_rate) || 10 })
    setShowTierModal(true)
  }

  const openEditTier = (tier: PricingTier) => {
    setEditingTier(tier)
    setTierForm({ ...tier })
    setShowTierModal(true)
  }

  const saveTier = async () => {
    if (!tierForm.min_persons || !tierForm.max_persons || !tierForm.price_per_person) return
    setSavingTier(true)
    try {
      const id = activityId || form._serverId
      if (editingTier?.id) {
        await tierApi(`/tiers/${editingTier.id}`, { method: 'PUT', body: JSON.stringify(tierForm) })
      } else if (id) {
        await tierApi(`/activities/${id}/tiers`, { method: 'POST', body: JSON.stringify(tierForm) })
      }
      if (id) {
        const res = await tierApi(`/activities/${id}/tiers`)
        if (res.ok) {
          const freshTiers = await res.json()
          setForm({ ...form, pricing_tiers: freshTiers })
        }
        if (onSaved) onSaved()
      } else {
        const localTier = { ...tierForm, id: Date.now(), _local: true }
        const updated = editingTier?.id
          ? tiers.map(t => t.id === editingTier.id ? localTier : t)
          : [...tiers, localTier]
        setForm({ ...form, pricing_tiers: updated })
      }
      setShowTierModal(false)
    } catch { }
    setSavingTier(false)
  }

  const deleteTier = async (tier: PricingTier) => {
    if (tier.id && !tier._local) {
      try { await tierApi(`/tiers/${tier.id}`, { method: 'DELETE' }) } catch { }
    }
    if (activityId || form._serverId) {
      const id = activityId || form._serverId
      const res = await tierApi(`/activities/${id}/tiers`)
      if (res.ok) {
        const freshTiers = await res.json()
        setForm({ ...form, pricing_tiers: freshTiers })
      }
      if (onSaved) onSaved()
    } else {
      const updated = tiers.filter(t => t.id !== tier.id)
      setForm({ ...form, pricing_tiers: updated })
    }
  }

  const tierCommission = (price: number, rate: number | null | undefined) => {
    const r = rate != null ? rate : Number(form.commission_rate || 0)
    return (price || 0) * r / 100
  }

  const tierNet = (price: number, rate: number | null | undefined) => {
    return (price || 0) - tierCommission(price, rate)
  }

  return (
    <div className="space-y-4">
      <Section title="Informations générales" icon={Compass} hue={STAGE_HUES.violet} defaultOpen={true}>
        <div>
          <label className={stageLabel}>Nom de l'activité <span className="text-rose-500">*</span></label>
          <input
            value={form.name || ''}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Ex : Excursion en mer"
            className={stageInput('h-10')}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={stageLabel}>Catégorie</label>
            <Select
              options={CATEGORIES}
              value={form.category || 'Nautique'}
              onChange={v => setForm({ ...form, category: v })}
              className={ctrl('h-10')}
            />
          </div>
          <div>
            <label className={stageLabel}>Partenaire</label>
            <Select
              options={partners.map(p => ({ value: String(p.id), label: p.name }))}
              value={form.partner_id || ''}
              onChange={v => setForm({ ...form, partner_id: v })}
              placeholder="Sélectionner..."
              className={ctrl('h-10')}
            />
          </div>
        </div>
        <div>
          <label className={stageLabel}>Statut</label>
          <div className={cn('flex items-center gap-2 p-1 rounded-xl border w-fit', staged ? (isDark ? 'border-white/10 bg-white/[0.04]' : 'border-teal-900/10 bg-white/70') : 'bg-background rounded-xl border border-border/40')}>
            <button type="button" onClick={() => setForm({ ...form, is_active: true })}
              className={cn('relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200', form.is_active !== false ? 'text-white shadow-sm' : staged ? (isDark ? 'text-slate-400 hover:text-white' : 'text-teal-900/60 hover:text-teal-900') : 'text-text-secondary hover:text-text')}
              style={form.is_active !== false ? { backgroundImage: isDark ? 'linear-gradient(135deg, #8B7CFF, #6C5ECF)' : 'linear-gradient(135deg, #2DD4BF, #0D9488)', boxShadow: '0 4px 12px rgba(124,92,255,0.3)' } : undefined}>
              <span className="flex items-center gap-2">
                <span className={cn('w-1.5 h-1.5 rounded-full', form.is_active !== false ? 'bg-white' : 'bg-emerald-500')} />
                Actif
              </span>
            </button>
            <button type="button" onClick={() => setForm({ ...form, is_active: false })}
              className={cn('relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200', form.is_active === false ? 'text-white shadow-sm' : staged ? (isDark ? 'text-slate-400 hover:text-white' : 'text-teal-900/60 hover:text-teal-900') : 'text-text-secondary hover:text-text')}
              style={form.is_active === false ? { backgroundImage: isDark ? 'linear-gradient(135deg, #8B7CFF, #6C5ECF)' : 'linear-gradient(135deg, #2DD4BF, #0D9488)' } : undefined}>
              <span className="flex items-center gap-2">
                <span className={cn('w-1.5 h-1.5 rounded-full', form.is_active === false ? 'bg-white' : 'bg-slate-400')} />
                Inactif
              </span>
            </button>
          </div>
        </div>
        <div>
          <label className={stageLabel}>Description courte</label>
          <input value={form.short_description || ''} onChange={e => setForm({ ...form, short_description: e.target.value })}
            placeholder="Résumé en une ligne..."
            className={stageInput('h-10')} />
        </div>
        <div>
          <label className={stageLabel}>Description longue</label>
          <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={4}
            placeholder="Décrivez l'activité en détail..."
            className={stageInput('resize-none py-2 min-h-[90px]')} />
        </div>
      </Section>

      <Section title="Caractéristiques" icon={Clock} hue={STAGE_HUES.sky} defaultOpen={true}>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={stageLabel}>Durée (heures) <span className="text-rose-500">*</span></label>
            <input type="number" value={form.duration_hours || ''} onChange={e => setForm({ ...form, duration_hours: e.target.value })} placeholder="4" className={stageInput('h-10')} />
          </div>
          <div>
            <label className={stageLabel}>Capacité min</label>
            <input type="number" value={form.min_capacity || '1'} onChange={e => setForm({ ...form, min_capacity: e.target.value })} className={stageInput('h-10')} />
          </div>
          <div>
            <label className={stageLabel}>Capacité max</label>
            <input type="number" value={form.max_capacity || '12'} onChange={e => setForm({ ...form, max_capacity: e.target.value })} className={stageInput('h-10')} />
          </div>
        </div>
        <div>
          <label className={stageLabel}>Disponibilité</label>
          <Select options={[
            { value: 'sur_demande', label: 'Sur demande (7/7)' },
            { value: 'hebdomadaire', label: 'Hebdomadaire' },
            { value: 'weekends', label: 'Weekends uniquement' },
            { value: 'saisonnier', label: 'Saisonnier' },
          ]} value={form.availability || 'sur_demande'} onChange={v => setForm({ ...form, availability: v })} className={ctrl('h-10')} />
        </div>
      </Section>

      <Section title="Tarifs et commission" icon={DollarSign} hue={STAGE_HUES.amber} defaultOpen={true}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={stageLabel}>Prix public de référence (MAD) <span className="text-rose-500">*</span></label>
            <input type="number" value={form.price || ''} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="450" className={stageInput('h-10')} />
          </div>
          <div>
            <label className={stageLabel}>Commission (%)</label>
            <input type="number" value={form.commission_rate || '10'} onChange={e => setForm({ ...form, commission_rate: e.target.value })} className={stageInput('h-10')} />
          </div>
        </div>
        {form.price && form.commission_rate && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3">
            <div className={cn('rounded-xl p-3 border', staged ? (isDark ? 'bg-violet-500/10 border-violet-500/20' : 'bg-violet-50 border-violet-200') : 'bg-accent/5 border-accent/10')}>
              <p className={cn('text-[11px] uppercase tracking-wider mb-1 font-bold', isDark ? 'text-violet-300' : 'text-violet-600')}>Commission</p>
              <p className="text-sm font-extrabold" style={{ color: STAGE_HUES.violet.a }}>{formatMAD(commission)}</p>
            </div>
            <div className={cn('rounded-xl p-3 border', staged ? (isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200') : 'bg-emerald-50 border-emerald-200/50')}>
              <p className={cn('text-[11px] uppercase tracking-wider mb-1 font-bold', isDark ? 'text-emerald-300' : 'text-emerald-600')}>Prix net partenaire</p>
              <p className="text-sm font-extrabold text-emerald-600">{formatMAD(netPrice)}</p>
            </div>
          </motion.div>
        )}

        {/* Grille tarifaire */}
        <div className={cn('rounded-xl overflow-hidden border', staged ? (isDark ? 'border-white/5' : 'border-slate-200') : 'border-border/40')}>
          <div className={cn('px-4 py-3 flex items-center justify-between', staged ? (isDark ? 'bg-white/[0.03]' : 'bg-slate-50') : 'bg-background/50')}>
            <div className="flex items-center gap-2">
              <p className={cn('text-sm font-bold', staged ? (isDark ? 'text-white' : 'text-slate-900') : 'text-text')}>Grille tarifaire</p>
              {tiers.length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-violet-500/15 text-violet-600 rounded-full border border-violet-500/20">{tiers.length}</span>
              )}
            </div>
            <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={openAddTier}>
              <Plus size={13} /> Ajouter un palier
            </Button>
          </div>
          {tiers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={cn('border-t text-left text-[11px] uppercase tracking-wider font-bold', staged ? (isDark ? 'border-white/5 text-slate-500 bg-white/[0.02]' : 'border-slate-100 text-slate-500 bg-white') : 'border-border/30 text-text-secondary')}>
                    <th className="px-4 py-2.5">Nombre de pers.</th>
                    <th className="px-4 py-2.5 text-right">Prix / pers.</th>
                    <th className="px-4 py-2.5 text-right">Commission</th>
                    <th className="px-4 py-2.5 text-right">Net partenaire</th>
                    <th className="px-4 py-2.5 w-20"></th>
                  </tr>
                </thead>
                <tbody className={cn('divide-y', staged ? (isDark ? 'divide-white/5' : 'divide-slate-100') : 'divide-border/20')}>
                  {tiers.map((t, i) => {
                    const rate = t.commission_rate != null ? t.commission_rate : Number(form.commission_rate || 0)
                    const comm = tierCommission(t.price_per_person, t.commission_rate)
                    const net = tierNet(t.price_per_person, t.commission_rate)
                    return (
                      <motion.tr key={t.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className={cn(staged ? (isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50') : 'hover:bg-background/50')}>
                        <td className={cn('px-4 py-2.5 font-semibold', staged ? (isDark ? 'text-white' : 'text-slate-900') : 'text-text')}>
                          {t.min_persons === t.max_persons ? `${t.min_persons} pers.` : `${t.min_persons}-${t.max_persons} pers.`}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium">{formatMAD(Number(t.price_per_person))}</td>
                        <td className={cn('px-4 py-2.5 text-right', isDark ? 'text-slate-400' : 'text-slate-500')}>{rate}% · {formatMAD(comm)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-600">{formatMAD(net)}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => openEditTier(t)} className={cn('p-1 rounded-lg transition-colors', isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100')}>
                              <Edit3 size={13} />
                            </button>
                            <button type="button" onClick={() => deleteTier(t)} className="p-1 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={cn('px-4 py-6 text-center text-xs border-t', staged ? (isDark ? 'text-slate-500 border-white/5' : 'text-slate-400 border-slate-100') : 'text-text-secondary/50 border-border/20')}>
              Aucun palier tarifaire. Ajoutez des grilles de prix selon le nombre de personnes.
            </div>
          )}
        </div>
      </Section>

      <Section title="Inclus / Non inclus" icon={Package} hue={STAGE_HUES.emerald} defaultOpen={false}>
        <div className="space-y-3">
          <div>
            <label className={stageLabel}>Inclus</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {included.map((item, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-500/15 text-emerald-700 border border-emerald-500/20 rounded-full">
                  {item}
                  <button type="button" onClick={() => removeIncluded(idx)} className="hover:text-emerald-900 transition-colors"><X size={11} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newIncluded} onChange={e => setNewIncluded(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addIncluded())}
                placeholder="Ajouter un élément..."
                className={cn(stageInput('h-9 flex-1'))} />
              <button type="button" onClick={addIncluded} className={cn('px-3 rounded-xl border text-sm font-bold transition-colors', staged ? (isDark ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-violet-200 bg-violet-500 text-white hover:bg-violet-600') : 'bg-accent text-white')}>+</button>
            </div>
          </div>
          <div>
            <label className={stageLabel}>Non inclus</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {notIncluded.map((item, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-rose-500/10 text-rose-700 border border-rose-500/20 rounded-full">
                  {item}
                  <button type="button" onClick={() => removeNotIncluded(idx)} className="hover:text-red-900 transition-colors"><X size={11} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newNotIncluded} onChange={e => setNewNotIncluded(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addNotIncluded())}
                placeholder="Ajouter un élément..."
                className={cn(stageInput('h-9 flex-1'))} />
              <button type="button" onClick={addNotIncluded} className={cn('px-3 rounded-xl border text-sm font-bold transition-colors', staged ? (isDark ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-rose-200 bg-rose-500 text-white') : 'bg-accent text-white')}>+</button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Contact et médias" icon={Image} hue={STAGE_HUES.sky} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={stageLabel}>WhatsApp</label>
            <input value={form.whatsapp || ''} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="+212 6 00 00 00 00" className={stageInput('h-10')} />
          </div>
          <div>
            <label className={stageLabel}>Email</label>
            <input type="email" value={form.contact_email || ''} onChange={e => setForm({ ...form, contact_email: e.target.value })} placeholder="contact@..." className={stageInput('h-10')} />
          </div>
        </div>

        {/* Photo gallery */}
        <div>
          <label className={stageLabel}>Photos ({allPhotos.length})</label>
          {allPhotos.length > 0 && (
            <div className={cn('rounded-xl overflow-hidden border mb-3', staged ? (isDark ? 'border-white/5' : 'border-slate-200') : 'border-border/30')}>
              <div className="relative aspect-[16/9] overflow-hidden bg-gray-900 group">
                <img src={`${API_ORIGIN}${allPhotos[photoViewIndex]}`} alt="Photo"
                  className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {allPhotos.length > 1 && (
                  <>
                    <button type="button" onClick={() => setPhotoViewIndex((photoViewIndex - 1 + allPhotos.length) % allPhotos.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm">
                      <ChevronLeft size={16} />
                    </button>
                    <button type="button" onClick={() => setPhotoViewIndex((photoViewIndex + 1) % allPhotos.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm">
                      <ChevronRight size={16} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {allPhotos.map((_, idx) => (
                        <button key={idx} type="button" onClick={() => setPhotoViewIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${idx === photoViewIndex ? 'bg-white scale-110' : 'bg-white/50 hover:bg-white/70'}`} />
                      ))}
                    </div>
                  </>
                )}
                <button type="button" onClick={() => removePhoto(photoViewIndex)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-rose-500/80 text-white hover:bg-rose-600 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm">
                  <Trash2 size={14} />
                </button>
                <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/50 text-white text-xs font-bold backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  {photoViewIndex + 1} / {allPhotos.length}
                </div>
              </div>
              {allPhotos.length > 1 && (
                <div className={cn('flex gap-2 p-3 justify-center overflow-x-auto', staged ? (isDark ? 'bg-white/[0.03]' : 'bg-slate-50') : 'bg-background/80')}>
                  {allPhotos.map((p, idx) => (
                    <button key={idx} type="button" onClick={() => setPhotoViewIndex(idx)}
                      className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 hover:scale-105 ${idx === photoViewIndex ? 'border-violet-500 shadow-md shadow-violet-500/20' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <img src={`${API_ORIGIN}${p}`} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple
            className="hidden" onChange={e => handlePhotoUpload(e.target.files)} />
          <button type="button" onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn('w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition-all text-sm font-semibold', staged ? (isDark ? 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-white' : 'border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-400 hover:bg-violet-100') : 'border-border/60 bg-background/50 hover:border-accent/40 hover:bg-accent/5 text-text-secondary')}>
            {uploading ? (
              <div className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {uploading ? 'Téléchargement...' : 'Ajouter des photos'}
          </button>
          <p className={cn('text-[10px] mt-1.5', isDark ? 'text-slate-500' : 'text-slate-400')}>JPG, PNG, WebP • Max 10 Mo par photo</p>
        </div>
      </Section>

      {/* Tier sub-modal — portal z-[110] above outer z-[100] */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showTierModal && (
            <motion.div
              className="fixed inset-0 z-[110] flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowTierModal(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                className="relative w-full max-w-md rounded-2xl border flex flex-col overflow-hidden max-h-[90vh]"
                style={{
                  background: isDark ? 'linear-gradient(180deg, rgba(17,24,50,0.98), rgba(9,13,30,0.99))' : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.99))',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                  boxShadow: isDark ? '0 24px 60px -18px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.06)' : '0 24px 60px -20px rgba(13,148,136,0.35), inset 0 1px 0 rgba(255,255,255,1)',
                }}
              >
                <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${STAGE_HUES.violet.a}, ${STAGE_HUES.violet.b})` }} />
                <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)', background: `radial-gradient(90% 140% at 0% 0%, ${isDark ? 'rgba(139,124,255,0.08)' : 'rgba(20,184,166,0.06)'}, transparent 65%)` }}>
                  <h2 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                    {editingTier ? 'Modifier le palier' : 'Ajouter un palier'}
                  </h2>
                  <button onClick={() => setShowTierModal(false)} className={cn('w-8 h-8 rounded-xl flex items-center justify-center border transition-all', isDark ? 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900')}>
                    <X size={16} />
                  </button>
                </div>
                <div
                  className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-4"
                  style={{
                    overscrollBehavior: 'contain',
                    WebkitOverflowScrolling: 'touch' as any,
                    transform: 'translateZ(0)',
                    willChange: 'scroll-position',
                  }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={stageLabel}>De (personnes) <span className="text-rose-500">*</span></label>
                      <input type="number" value={tierForm.min_persons || ''} onChange={e => setTierForm({ ...tierForm, min_persons: Number(e.target.value) })} placeholder="1" className={stageInput('h-10')} />
                    </div>
                    <div>
                      <label className={stageLabel}>À (personnes) <span className="text-rose-500">*</span></label>
                      <input type="number" value={tierForm.max_persons || ''} onChange={e => setTierForm({ ...tierForm, max_persons: Number(e.target.value) })} placeholder="2" className={stageInput('h-10')} />
                    </div>
                  </div>
                  <div>
                    <label className={stageLabel}>Prix par personne (MAD) <span className="text-rose-500">*</span></label>
                    <input type="number" value={tierForm.price_per_person || ''} onChange={e => setTierForm({ ...tierForm, price_per_person: Number(e.target.value) })} placeholder="550" className={stageInput('h-10')} />
                  </div>
                  <div>
                    <label className={stageLabel}>Commission (%)</label>
                    <input type="number" value={tierForm.commission_rate ?? form.commission_rate ?? 10} onChange={e => setTierForm({ ...tierForm, commission_rate: Number(e.target.value) })} className={stageInput('h-10')} />
                  </div>
                  {tierForm.price_per_person != null && tierForm.price_per_person > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn('rounded-xl p-3 border space-y-1', isDark ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50 border-slate-100')}>
                      <p className={cn('text-[11px] font-bold uppercase tracking-wider mb-2', isDark ? 'text-slate-400' : 'text-slate-500')}>Résumé</p>
                      <div className="flex justify-between text-sm">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Commission :</span>
                        <span className="font-bold" style={{ color: STAGE_HUES.violet.a }}>{formatMAD(tierCommission(tierForm.price_per_person, tierForm.commission_rate))}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Net partenaire :</span>
                        <span className="font-bold text-emerald-600">{formatMAD(tierNet(tierForm.price_per_person, tierForm.commission_rate))}</span>
                      </div>
                    </motion.div>
                  )}
                </div>
                <div className={cn('flex items-center justify-end gap-3 px-6 py-4 border-t shrink-0', isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50')}>
                  <button onClick={() => setShowTierModal(false)} className={cn('h-9 px-4 rounded-xl border text-sm font-semibold transition-colors', isDark ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>Annuler</button>
                  <button onClick={saveTier} disabled={!!savingTier} className="h-9 px-4 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50" style={{ backgroundImage: isDark ? 'linear-gradient(135deg, #8B7CFF, #6C5ECF)' : 'linear-gradient(135deg, #2DD4BF, #0D9488)', boxShadow: '0 4px 14px rgba(124,92,255,0.3)' }}>
                    {savingTier ? '...' : editingTier ? 'Enregistrer' : 'Ajouter'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}
