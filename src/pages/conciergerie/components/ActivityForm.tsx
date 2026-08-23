import { useState, useRef, useEffect } from 'react'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { Button } from '../../../components/ui/Button'
import { Dialog } from '../../../components/ui/Dialog'
import { API_ORIGIN } from '../../../utils/config'
import { getAuthToken } from '../../../utils/auth'
import { Compass, DollarSign, Package, Image, Clock, ChevronDown, Plus, Edit3, Trash2, X, ChevronLeft, ChevronRight, Upload } from 'react-feather'
import { motion, AnimatePresence } from 'framer-motion'

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

function Section({ title, icon: Icon, children, defaultOpen = true }: { title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-border/40 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-3.5 bg-background/50 hover:bg-background transition-colors text-left">
        <div className="p-1.5 rounded-lg bg-accent/10">
          <Icon size={14} className="text-accent" />
        </div>
        <span className="text-sm font-semibold text-text flex-1">{title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-text-secondary" />
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
            <div className="px-5 py-4 space-y-4 border-t border-border/30">
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
      <Section title="Informations générales" icon={Compass} defaultOpen={true}>
        <Input
          label="Nom de l'activité"
          required
          value={form.name || ''}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="Ex : Excursion en mer"
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Catégorie"
            options={CATEGORIES}
            value={form.category || 'Nautique'}
            onChange={v => setForm({ ...form, category: v })}
          />
          <Select
            label="Partenaire"
            options={partners.map(p => ({ value: String(p.id), label: p.name }))}
            value={form.partner_id || ''}
            onChange={v => setForm({ ...form, partner_id: v })}
            placeholder="Sélectionner..."
          />
        </div>
        <div>
          <label className="text-sm font-medium text-text mb-2 block">Statut</label>
          <div className="flex items-center gap-2 p-1 bg-background rounded-xl border border-border/40 w-fit">
            <button type="button" onClick={() => setForm({ ...form, is_active: true })}
              className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${form.is_active !== false ? 'bg-accent text-white shadow-sm' : 'text-text-secondary hover:text-text'}`}>
              <span className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${form.is_active !== false ? 'bg-white' : 'bg-emerald-500'}`} />
                Actif
              </span>
            </button>
            <button type="button" onClick={() => setForm({ ...form, is_active: false })}
              className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${form.is_active === false ? 'bg-accent text-white shadow-sm' : 'text-text-secondary hover:text-text'}`}>
              <span className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${form.is_active === false ? 'bg-white' : 'bg-text-secondary/40'}`} />
                Inactif
              </span>
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-text mb-1.5 block">Description courte</label>
          <input value={form.short_description || ''} onChange={e => setForm({ ...form, short_description: e.target.value })}
            placeholder="Résumé en une ligne..."
            className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent transition-all" />
        </div>
        <div>
          <label className="text-sm font-medium text-text mb-1.5 block">Description longue</label>
          <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={4}
            placeholder="Décrivez l'activité en détail..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent transition-all resize-none" />
        </div>
      </Section>

      <Section title="Caractéristiques" icon={Clock} defaultOpen={true}>
        <div className="grid grid-cols-3 gap-4">
          <Input label="Durée (heures)" required type="number" value={form.duration_hours || ''} onChange={e => setForm({ ...form, duration_hours: e.target.value })} placeholder="4" />
          <Input label="Capacité min" type="number" value={form.min_capacity || '1'} onChange={e => setForm({ ...form, min_capacity: e.target.value })} />
          <Input label="Capacité max" type="number" value={form.max_capacity || '12'} onChange={e => setForm({ ...form, max_capacity: e.target.value })} />
        </div>
        <Select label="Disponibilité" options={[
          { value: 'sur_demande', label: 'Sur demande (7/7)' },
          { value: 'hebdomadaire', label: 'Hebdomadaire' },
          { value: 'weekends', label: 'Weekends uniquement' },
          { value: 'saisonnier', label: 'Saisonnier' },
        ]} value={form.availability || 'sur_demande'} onChange={v => setForm({ ...form, availability: v })} />
      </Section>

      <Section title="Tarifs et commission" icon={DollarSign} defaultOpen={true}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Prix public de référence (MAD)" required type="number" value={form.price || ''} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="450" />
          <Input label="Commission (%)" type="number" value={form.commission_rate || '10'} onChange={e => setForm({ ...form, commission_rate: e.target.value })} />
        </div>
        {form.price && form.commission_rate && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3">
            <div className="bg-accent/5 rounded-lg p-3 border border-accent/10">
              <p className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Commission</p>
              <p className="text-sm font-bold text-accent">{formatMAD(commission)}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200/50">
              <p className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Prix net partenaire</p>
              <p className="text-sm font-bold text-emerald-600">{formatMAD(netPrice)}</p>
            </div>
          </motion.div>
        )}

        {/* Grille tarifaire */}
        <div className="border border-border/40 rounded-xl overflow-hidden mt-2">
          <div className="px-4 py-3 bg-background/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-text">Grille tarifaire</p>
              {tiers.length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-accent/10 text-accent rounded">{tiers.length}</span>
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
                  <tr className="border-t border-border/30 text-left text-[11px] text-text-secondary uppercase tracking-wider">
                    <th className="px-4 py-2.5 font-medium">Nombre de pers.</th>
                    <th className="px-4 py-2.5 font-medium text-right">Prix / pers.</th>
                    <th className="px-4 py-2.5 font-medium text-right">Commission</th>
                    <th className="px-4 py-2.5 font-medium text-right">Net partenaire</th>
                    <th className="px-4 py-2.5 font-medium w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((t, i) => {
                    const rate = t.commission_rate != null ? t.commission_rate : Number(form.commission_rate || 0)
                    const comm = tierCommission(t.price_per_person, t.commission_rate)
                    const net = tierNet(t.price_per_person, t.commission_rate)
                    return (
                      <motion.tr key={t.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="border-t border-border/20 hover:bg-background/50 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-text">
                          {t.min_persons === t.max_persons ? `${t.min_persons} pers.` : `${t.min_persons}-${t.max_persons} pers.`}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium">{formatMAD(Number(t.price_per_person))}</td>
                        <td className="px-4 py-2.5 text-right text-text-secondary">{rate}% · {formatMAD(comm)}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-emerald-600">{formatMAD(net)}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => openEditTier(t)} className="p-1 rounded hover:bg-background transition-colors text-text-secondary hover:text-text">
                              <Edit3 size={13} />
                            </button>
                            <button type="button" onClick={() => deleteTier(t)} className="p-1 rounded hover:bg-error/5 transition-colors text-text-secondary hover:text-error">
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
            <div className="px-4 py-6 text-center text-xs text-text-secondary/50 border-t border-border/20">
              Aucun palier tarifaire. Ajoutez des grilles de prix selon le nombre de personnes.
            </div>
          )}
        </div>
      </Section>

      <Section title="Inclus / Non inclus" icon={Package} defaultOpen={false}>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-text mb-2 block">Inclus</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {included.map((item, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  {item}
                  <button type="button" onClick={() => removeIncluded(idx)} className="hover:text-emerald-900 transition-colors">&times;</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newIncluded} onChange={e => setNewIncluded(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addIncluded())}
                placeholder="Ajouter un élément..."
                className="flex-1 h-8 px-3 text-sm rounded-lg border border-border bg-card text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent transition-all" />
              <Button type="button" variant="secondary" size="sm" onClick={addIncluded}>+</Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-text mb-2 block">Non inclus</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {notIncluded.map((item, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-full">
                  {item}
                  <button type="button" onClick={() => removeNotIncluded(idx)} className="hover:text-red-900 transition-colors">&times;</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newNotIncluded} onChange={e => setNewNotIncluded(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addNotIncluded())}
                placeholder="Ajouter un élément..."
                className="flex-1 h-8 px-3 text-sm rounded-lg border border-border bg-card text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent transition-all" />
              <Button type="button" variant="secondary" size="sm" onClick={addNotIncluded}>+</Button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Contact et médias" icon={Image} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="WhatsApp" value={form.whatsapp || ''} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="+212 6 00 00 00 00" />
          <Input label="Email" type="email" value={form.contact_email || ''} onChange={e => setForm({ ...form, contact_email: e.target.value })} placeholder="contact@..." />
        </div>

        {/* Photo gallery */}
        <div>
          <label className="text-sm font-medium text-text mb-2 block">Photos ({allPhotos.length})</label>
          {allPhotos.length > 0 && (
            <div className="rounded-xl overflow-hidden border border-border/30 mb-3">
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
                  className="absolute top-3 right-3 p-2 rounded-full bg-red-500/80 text-white hover:bg-red-60 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm">
                  <Trash2 size={14} />
                </button>
                <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/50 text-white text-xs font-medium backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  {photoViewIndex + 1} / {allPhotos.length}
                </div>
              </div>
              {allPhotos.length > 1 && (
                <div className="flex gap-2 p-3 bg-background/80 justify-center overflow-x-auto">
                  {allPhotos.map((p, idx) => (
                    <button key={idx} type="button" onClick={() => setPhotoViewIndex(idx)}
                      className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 hover:scale-105 ${idx === photoViewIndex ? 'border-accent shadow-md shadow-accent/20' : 'border-transparent opacity-60 hover:opacity-100'}`}>
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
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border/60 bg-background/50 hover:border-accent/40 hover:bg-accent/5 transition-all text-sm text-text-secondary disabled:opacity-50">
            {uploading ? (
              <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {uploading ? 'Téléchargement...' : 'Ajouter des photos'}
          </button>
          <p className="text-[10px] text-text-secondary/50 mt-1.5">JPG, PNG, WebP • Max 10 Mo par photo</p>
        </div>
      </Section>

      {/* Tier sub-modal */}
      <Dialog isOpen={showTierModal} onClose={() => setShowTierModal(false)} size="md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 -mx-6 -mt-4 mb-0">
          <h2 className="text-lg font-bold text-text">
            {editingTier ? 'Modifier le palier' : 'Ajouter un palier'}
          </h2>
          <button onClick={() => setShowTierModal(false)} className="p-1.5 rounded-lg hover:bg-background transition-colors text-text-secondary hover:text-text">
            <X size={18} />
          </button>
        </div>
        <div className="py-5 space-y-4 -mx-6 px-6">
          <div className="grid grid-cols-2 gap-4">
            <Input label="De (personnes)" required type="number" value={tierForm.min_persons || ''} onChange={e => setTierForm({ ...tierForm, min_persons: Number(e.target.value) })} placeholder="1" />
            <Input label="À (personnes)" required type="number" value={tierForm.max_persons || ''} onChange={e => setTierForm({ ...tierForm, max_persons: Number(e.target.value) })} placeholder="2" />
          </div>
          <Input label="Prix par personne (MAD)" required type="number" value={tierForm.price_per_person || ''} onChange={e => setTierForm({ ...tierForm, price_per_person: Number(e.target.value) })} placeholder="550" />
          <Input label="Commission (%)" type="number" value={tierForm.commission_rate ?? form.commission_rate ?? 10} onChange={e => setTierForm({ ...tierForm, commission_rate: Number(e.target.value) })} />
          {tierForm.price_per_person != null && tierForm.price_per_person > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-background rounded-lg p-3 border border-border/40 space-y-1">
              <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Résumé</p>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Commission :</span>
                <span className="font-medium text-accent">{formatMAD(tierCommission(tierForm.price_per_person, tierForm.commission_rate))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Net partenaire :</span>
                <span className="font-medium text-emerald-600">{formatMAD(tierNet(tierForm.price_per_person, tierForm.commission_rate))}</span>
              </div>
            </motion.div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/30 -mx-6 -mb-4 mt-0">
          <Button variant="outline" onClick={() => setShowTierModal(false)}>Annuler</Button>
          <Button onClick={saveTier} loading={savingTier}>{editingTier ? 'Enregistrer' : 'Ajouter'}</Button>
        </div>
      </Dialog>
    </div>
  )
}
