import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { API_ORIGIN } from '../../utils/config'
import { getAuthToken } from '../../utils/auth'
import { Badge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../components/ui/Toast'
import { cn } from '../../lib/utils'
import {
  Search, Plus, Compass, Calendar, DollarSign, MoreHorizontal,
  Edit3, Trash2, X, Star, MapPin, Clock, Briefcase, Users,
  TrendingUp, BarChart, Activity, UserCheck, Clipboard,
  Anchor, Coffee, Heart, BookOpen, Zap, Camera, ChevronLeft, ChevronRight, ChevronDown,
  MessageCircle, Mail, Check, XCircle, Image, Hash
} from 'react-feather'
import { motion, AnimatePresence } from 'framer-motion'
import ActivityForm from './components/ActivityForm'
import PartnerForm from './components/PartnerForm'
import ReservationForm from './components/ReservationForm'
import { useStageChrome } from '../../components/modules/calendar/useStageChrome'
import { useStageFormClasses, useStageModalButtons } from '../../components/modules/calendar/StageModal'
import {
  Stage, StageTabs, StagePanel, StageBadge, StageButton, OrbIcon, TiltCard,
  STAGE_HUES, SLATE_HUE, useStageTheme, AnimatedNumber,
} from '../../components/dashboard/Stage'
import type { StageHue } from '../../components/dashboard/Stage'

const CATEGORIES = [
  { value: 'Nautique', label: 'Nautique' },
  { value: 'Gastronomie', label: 'Gastronomie' },
  { value: 'Bien-être', label: 'Bien-être' },
  { value: 'Culture', label: 'Culture' },
  { value: 'Aventure', label: 'Aventure' },
  { value: 'Bienfait', label: 'Bienfait' },
  { value: 'Autre', label: 'Autre' },
]

const CATEGORY_CONFIG: Record<string, { icon: any; color: string; bg: string; gradient: string; lightBg: string }> = {
  Nautique: { icon: Anchor, color: 'text-blue-600', bg: 'bg-blue-100', gradient: 'from-blue-500 to-cyan-500', lightBg: 'bg-blue-50' },
  Gastronomie: { icon: Coffee, color: 'text-orange-600', bg: 'bg-orange-100', gradient: 'from-orange-500 to-red-500', lightBg: 'bg-orange-50' },
  'Bien-être': { icon: Heart, color: 'text-emerald-600', bg: 'bg-emerald-100', gradient: 'from-emerald-500 to-teal-500', lightBg: 'bg-emerald-50' },
  Culture: { icon: BookOpen, color: 'text-violet-600', bg: 'bg-violet-100', gradient: 'from-violet-500 to-purple-500', lightBg: 'bg-violet-50' },
  Aventure: { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-100', gradient: 'from-amber-500 to-yellow-500', lightBg: 'bg-amber-50' },
  Bienfait: { icon: Star, color: 'text-pink-600', bg: 'bg-pink-100', gradient: 'from-pink-500 to-rose-500', lightBg: 'bg-pink-50' },
  Autre: { icon: Compass, color: 'text-slate-600', bg: 'bg-slate-100', gradient: 'from-slate-500 to-gray-500', lightBg: 'bg-slate-50' },
}

const CATEGORY_HUES: Record<string, StageHue> = {
  Nautique: STAGE_HUES.sky,
  Gastronomie: STAGE_HUES.amber,
  'Bien-être': STAGE_HUES.emerald,
  Culture: STAGE_HUES.violet,
  Aventure: STAGE_HUES.fuchsia,
  Bienfait: { a: '#F472B6', b: '#BE185D', glow: 'rgba(244,114,182,0.45)', line: '#F472B6' },
  Autre: SLATE_HUE,
}

const RESERVATION_STATUSES: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'default' | 'primary' }> = {
  en_attente: { label: 'En attente', variant: 'warning' },
  confirmee: { label: 'Confirmée', variant: 'success' },
  terminee: { label: 'Terminée', variant: 'primary' },
  annulee: { label: 'Annulée', variant: 'error' },
}

const CONTRACT_STATUSES: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'default' }> = {
  signe: { label: 'Signé', variant: 'success' },
  en_cours: { label: 'En cours', variant: 'warning' },
  expire: { label: 'Expiré', variant: 'error' },
}

interface Partner { id: number; name: string; contact_name: string; phone: string; email: string; address: string; commission_rate: number; contract_status: string; notes: string; is_active: boolean; activity_count: number; created_at: string }
interface Activity { id: number; name: string; category: string; partner_id: number; partner_name: string; duration_hours: number; min_capacity: number; max_capacity: number; price: number; commission_rate: number; description: string; photo_url: string; short_description: string; whatsapp: string; contact_email: string; included_items: string[]; not_included_items: string[]; availability: string; photos: string[]; is_active: boolean; pricing_tiers: any[]; created_at: string }
interface Reservation { id: number; activity_id: number; activity_name: string; activity_category: string; activity_price: number; client_name: string; client_email: string; client_phone: string; reservation_date: string; participants: number; total_price: number; commission_amount: number; status: string; notes: string; created_at: string }
interface Stats { activeActivities: number; totalActivities: number; activePartners: number; totalPartners: number; totalReservations: number; pendingReservations: number; confirmedReservations: number; completedReservations: number; totalCommissions: number }
interface Commission { partner_id: number; partner_name: string; commission_rate: number; reservation_count: number; total_revenue: number; total_commission: number }

function api(path: string, opts?: RequestInit) {
  const token = getAuthToken()
  return fetch(`${API_ORIGIN}/api/conciergerie${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers },
  })
}

function formatPrice(n: number) { return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(n) + ' MAD' }
function formatMAD(n: number) { return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' MAD' }

function ActionMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const { staged } = useStageChrome()
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100')}>
        <MoreHorizontal size={16} />
      </button>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className={cn('absolute right-0 top-full mt-1 w-40 rounded-xl border py-1 z-50 overflow-hidden', isDark ? 'bg-[#111832] border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200 shadow-xl')}
          >
            <button onClick={() => { onEdit(); setOpen(false) }}
              className={cn('flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors', isDark ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50')}>
              <Edit3 size={14} /> Modifier
            </button>
            <button onClick={() => { onDelete(); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors">
              <Trash2 size={14} /> Supprimer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const TABS = [
  { id: 'activites', label: 'Activités', icon: Compass },
  { id: 'partenaires', label: 'Partenaires', icon: Briefcase },
  { id: 'reservations', label: 'Réservations', icon: Calendar },
  { id: 'commissions', label: 'Commissions', icon: DollarSign },
]

export default function ConciergeriePage() {
  const { toast } = useToast()
  const { staged } = useStageChrome()
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const { input: stageInput, label: stageLabel } = useStageFormClasses()
  const stageBtns = useStageModalButtons()
  const ctrl = (extra?: string) => (staged ? stageInput(extra) : undefined)
  const sectionTitle = 'mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80'

  const [activeTab, setActiveTab] = useState('activites')
  const [activities, setActivities] = useState<Activity[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [partnerFilter, setPartnerFilter] = useState('all')
  const [contractStatusFilter, setContractStatusFilter] = useState('all')
  const [partnerActiveFilter, setPartnerActiveFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'activity' | 'partner' | 'reservation'>('activity')
  const [editingItem, setEditingItem] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: number } | null>(null)
  const [detailActivity, setDetailActivity] = useState<Activity | null>(null)
  const [detailPartner, setDetailPartner] = useState<Partner | null>(null)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [form, setForm] = useState<any>({})
  const [filtersOpen, setFiltersOpen] = useState(true)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [a, p, r, c] = await Promise.all([
        api('/activities').then(r => r.ok ? r.json() : []),
        api('/partners').then(r => r.ok ? r.json() : []),
        api('/reservations').then(r => r.ok ? r.json() : []),
        api('/commissions').then(r => r.ok ? r.json() : []),
      ])
      setActivities(a || [])
      setPartners(p || [])
      setReservations(r || [])
      setCommissions(c || [])
    } catch { toast('error', 'Erreur de chargement') }
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  const stats = useMemo<Stats>(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthReservations = reservations.filter(r => new Date(r.created_at || r.reservation_date) >= monthStart)
    const monthCommissions = monthReservations
      .filter(r => r.status !== 'annulee')
      .reduce((sum, r) => sum + Number(r.commission_amount || 0), 0)
    return {
      activeActivities: activities.filter(a => a.is_active).length,
      totalActivities: activities.length,
      activePartners: partners.filter(p => (p as any).is_active !== false).length,
      totalPartners: partners.length,
      totalReservations: reservations.length,
      pendingReservations: reservations.filter(r => r.status === 'en_attente').length,
      confirmedReservations: reservations.filter(r => r.status === 'confirmee').length,
      completedReservations: reservations.filter(r => r.status === 'terminee').length,
      totalCommissions: monthCommissions,
    }
  }, [activities, partners, reservations])

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.category.toLowerCase().includes(search.toLowerCase()) && !(a.partner_name || '').toLowerCase().includes(search.toLowerCase())) return false
      if (catFilter !== 'all' && a.category !== catFilter) return false
      if (partnerFilter !== 'all' && String(a.partner_id) !== partnerFilter) return false
      return true
    })
  }, [activities, search, catFilter, partnerFilter])

  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.contact_name || '').toLowerCase().includes(search.toLowerCase()) && !(p.email || '').toLowerCase().includes(search.toLowerCase())) return false
      if (contractStatusFilter !== 'all' && p.contract_status !== contractStatusFilter) return false
      if (partnerActiveFilter === 'active' && (p as any).is_active === false) return false
      if (partnerActiveFilter === 'inactive' && (p as any).is_active !== false) return false
      return true
    })
  }, [partners, search, contractStatusFilter, partnerActiveFilter])

  const filteredReservations = useMemo(() => {
    return reservations.filter(r => {
      if (search && !r.client_name.toLowerCase().includes(search.toLowerCase()) && !(r.activity_name || '').toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      return true
    })
  }, [reservations, search, statusFilter])

  const openCreate = (type: 'activity' | 'partner' | 'reservation') => {
    setEditingItem(null)
    setModalType(type)
    if (type === 'activity') setForm({ name: '', category: 'Nautique', partner_id: '', duration_hours: '', min_capacity: '1', max_capacity: '12', price: '', commission_rate: '10', description: '', is_active: true, availability: 'sur_demande', short_description: '', whatsapp: '', contact_email: '', included_items: [], not_included_items: [], pricing_tiers: [], photos: [], photo_url: '' })
    else if (type === 'partner') setForm({ name: '', contact_name: '', phone: '', email: '', address: '', commission_rate: '10', contract_status: 'en_cours', notes: '' })
    else setForm({ activity_id: '', client_name: '', client_email: '', client_phone: '', reservation_date: '', participants: '1', notes: '' })
    setShowModal(true)
  }

  const openEdit = (type: 'activity' | 'partner' | 'reservation', item: any) => {
    setEditingItem(item)
    setModalType(type)
    if (type === 'activity') {
      setForm({
        ...item,
        partner_id: item.partner_id ? String(item.partner_id) : '',
        pricing_tiers: item.pricing_tiers || [],
        included_items: item.included_items || [],
        not_included_items: item.not_included_items || [],
        short_description: item.short_description || '',
        whatsapp: item.whatsapp || '',
        contact_email: item.contact_email || '',
        availability: item.availability || 'sur_demande',
        photos: item.photos || [],
      })
    } else {
      setForm({ ...item, partner_id: item.partner_id ? String(item.partner_id) : '', activity_id: item.activity_id ? String(item.activity_id) : '' })
    }
    setShowModal(true)
  }

  const handleSubmit = async () => {
    try {
      let payload: any
      if (modalType === 'activity') {
        payload = {
          name: form.name, category: form.category, partner_id: form.partner_id || null,
          duration_hours: form.duration_hours || null, min_capacity: Number(form.min_capacity) || 1,
          max_capacity: Number(form.max_capacity) || 12, price: Number(form.price) || 0,
          commission_rate: Number(form.commission_rate) || 10, description: form.description || null,
          photo_url: form.photo_url || null, short_description: form.short_description || null,
          whatsapp: form.whatsapp || null, contact_email: form.contact_email || null,
          included_items: Array.isArray(form.included_items) ? form.included_items : [],
          not_included_items: Array.isArray(form.not_included_items) ? form.not_included_items : [],
          availability: form.availability || 'sur_demande',
          photos: Array.isArray(form.photos) ? form.photos : [],
          is_active: form.is_active !== false,
        }
      } else if (modalType === 'partner') {
        payload = {
          name: form.name, contact_name: form.contact_name || null, phone: form.phone || null,
          email: form.email || null, address: form.address || null, commission_rate: Number(form.commission_rate) || 10,
          contract_status: form.contract_status || 'en_cours', notes: form.notes || null,
          is_active: form.is_active !== false,
        }
      } else {
        payload = {
          activity_id: Number(form.activity_id) || null, client_name: form.client_name,
          client_email: form.client_email || null, client_phone: form.client_phone || null,
          reservation_date: form.reservation_date, participants: Number(form.participants) || 1,
          notes: form.notes || null,
        }
      }
      const url = editingItem ? `/${modalType === 'activity' ? 'activities' : modalType === 'partner' ? 'partners' : 'reservations'}/${editingItem.id}` : `/${modalType === 'activity' ? 'activities' : modalType === 'partner' ? 'partners' : 'reservations'}`
      const method = editingItem ? 'PUT' : 'POST'
      const res = await api(url, { method, body: JSON.stringify(payload) })
      if (!res.ok) { const e = await res.json(); toast('error', e.error || 'Erreur'); return }
      const savedItem = await res.json()

      if (modalType === 'activity' && !editingItem && savedItem?.id) {
        const localTiers = (form.pricing_tiers || []).filter((t: any) => t._local)
        for (const tier of localTiers) {
          try {
            await api(`/activities/${savedItem.id}/tiers`, {
              method: 'POST',
              body: JSON.stringify({
                min_persons: tier.min_persons,
                max_persons: tier.max_persons,
                price_per_person: tier.price_per_person,
                commission_rate: tier.commission_rate ?? null,
              }),
            })
          } catch { }
        }
      }

      toast('success', editingItem ? 'Modifié avec succès' : 'Ajouté avec succès')
      setShowModal(false)
      loadAll()
    } catch { toast('error', 'Erreur serveur') }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const url = deleteTarget.type === 'activity' ? `/activities/${deleteTarget.id}` : deleteTarget.type === 'partner' ? `/partners/${deleteTarget.id}` : `/reservations/${deleteTarget.id}`
      const res = await api(url, { method: 'DELETE' })
      if (!res.ok) { toast('error', 'Erreur de suppression'); return }
      toast('success', 'Supprimé avec succès')
      setDeleteTarget(null)
      loadAll()
    } catch { toast('error', 'Erreur serveur') }
  }

  const partnerOptions = [{ value: 'all', label: 'Tous les partenaires' }, ...partners.map(p => ({ value: String(p.id), label: p.name }))]
  const categoryOptions = [{ value: 'all', label: 'Toutes les catégories' }, ...CATEGORIES.map(c => ({ value: c.value, label: c.label }))]
  const statusOptions = [{ value: 'all', label: 'Tous les statuts' }, ...Object.entries(RESERVATION_STATUSES).map(([k, v]) => ({ value: k, label: v.label }))]
  const contractStatusOptions = [{ value: 'all', label: 'Tous les contrats' }, ...Object.entries(CONTRACT_STATUSES).map(([k, v]) => ({ value: k, label: v.label }))]
  const activeOptions = [{ value: 'all', label: 'Tous' }, { value: 'active', label: 'Actifs' }, { value: 'inactive', label: 'Inactifs' }]

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setSearch('')
    setCatFilter('all')
    setStatusFilter('all')
    setPartnerFilter('all')
    setContractStatusFilter('all')
    setPartnerActiveFilter('all')
  }

  const modalTitle = editingItem
    ? `Modifier ${modalType === 'activity' ? "l'activité" : modalType === 'partner' ? 'le partenaire' : 'la réservation'}`
    : `Nouveau${modalType === 'activity' ? 'lle activité' : modalType === 'partner' ? ' partenaire' : 'lle réservation'}`

  const heroText = staged
    ? isDark
      ? { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400/80', title: 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent', sub: 'text-sm text-slate-400' }
      : { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-teal-900/50', title: 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent', sub: 'text-sm text-teal-900/55' }
    : { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-text-secondary', title: 'text-text', sub: 'text-sm text-text-secondary' }

  // Prevent background scroll when fullscreen portal is open
  useEffect(() => {
    const locked = Boolean(detailActivity || detailPartner || showModal)
    if (locked) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [detailActivity, detailPartner, showModal])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (detailActivity) setDetailActivity(null)
        else if (detailPartner) setDetailPartner(null)
        else if (showModal) setShowModal(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [detailActivity, detailPartner, showModal])

  return (
    <Stage theme={theme}>
      <div className="space-y-6">
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              </span>
              <p className={heroText.eyebrow}>Mission control · Conciergerie</p>
            </div>
            <h1 className={`mt-1 text-3xl font-extrabold tracking-tight ${heroText.title} flex items-center gap-3`}>
              Activités Conciergerie
            </h1>
            <p className={`mt-0.5 ${heroText.sub}`}>Gérez les activités proposées aux voyageurs</p>
          </div>
          {activeTab !== 'commissions' && (
            <StageButton variant="primary" size="md" icon={<Plus size={15} />} onClick={() => openCreate(activeTab === 'activites' ? 'activity' : activeTab === 'partenaires' ? 'partner' : 'reservation')}>
              {activeTab === 'activites' ? 'Nouvelle activité' : activeTab === 'partenaires' ? 'Nouveau partenaire' : 'Nouvelle réservation'}
            </StageButton>
          )}
        </div>

        {/* ── Stats — Stage glass + OrbIcon ─────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Activités actives', value: stats.activeActivities, sub: `${stats.totalActivities} au total`, icon: Activity, hue: STAGE_HUES.violet },
            { label: 'Partenaires actifs', value: stats.activePartners, sub: `${stats.totalPartners} au total`, icon: Users, hue: STAGE_HUES.sky },
            { label: 'Réservations', value: stats.totalReservations, sub: `${stats.pendingReservations} en attente`, icon: Calendar, hue: STAGE_HUES.amber },
            { label: 'Commissions du mois', value: stats.totalCommissions, sub: `${stats.confirmedReservations} confirmées`, icon: DollarSign, hue: STAGE_HUES.emerald, isPrice: true },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="stage-glass flex items-center gap-3.5 p-4 h-full">
                <OrbIcon icon={card.icon} hue={card.hue} size={42} radius={13} />
                <div className="min-w-0">
                  <p className={`text-[10px] font-bold uppercase tracking-[1.4px] ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>{card.label}</p>
                  <p className={`text-2xl font-extrabold leading-none tracking-tight tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {card.isPrice ? formatMAD(card.value as number) : <AnimatedNumber value={card.value as number} />}
                  </p>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{card.sub}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {stats.totalReservations > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'En attente', value: stats.pendingReservations, icon: Clipboard, hue: STAGE_HUES.amber },
              { label: 'Confirmées', value: stats.confirmedReservations, icon: Check, hue: STAGE_HUES.emerald },
              { label: 'Terminées', value: stats.completedReservations, icon: BarChart, hue: STAGE_HUES.sky },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="stage-glass flex items-center gap-3.5 p-4"
              >
                <OrbIcon icon={s.icon} hue={s.hue} size={40} radius={12} />
                <div>
                  <p className={`text-xl font-extrabold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ color: i === 0 ? '#F59E0B' : i === 1 ? '#10B981' : '#38BDF8' }}>
                    <AnimatedNumber value={s.value} />
                  </p>
                  <p className={`text-[11px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Tabs — StageTabs ──────────────────────────────────────────── */}
        <StageTabs tabs={TABS} activeId={activeTab} onChange={handleTabChange} />

        {/* ── Filters — 3D glass fields like Librairie / EventFormModal ─── */}
        <div
          className={cn(
            'overflow-hidden',
            staged ? 'pop-glass rounded-3xl' : 'stage-glass rounded-2xl',
            staged && isDark && 'border border-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]',
            staged && !isDark && 'border border-white/80 shadow-[0_20px_60px_-20px_rgba(13,148,136,0.25)]',
          )}
        >
          <div
            className="h-[3px] w-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${isDark ? 'rgba(139,124,255,0.9)' : 'rgba(20,184,166,0.9)'} 18%, ${isDark ? '#8B7CFF' : '#14B8A6'} 50%, transparent)`,
            }}
          />
          <div
            className="px-5 pt-5 pb-4 space-y-5"
            style={
              staged
                ? {
                    background: `radial-gradient(90% 140% at 0% 0%, ${isDark ? 'rgba(139,124,255,0.07)' : 'rgba(20,184,166,0.06)'}, transparent 65%)`,
                  }
                : undefined
            }
          >
            {/* Recherche */}
            <section>
              <p className={`${sectionTitle} ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                <span className="h-px w-4 bg-gradient-to-r from-violet-400 to-transparent" />
                Recherche
              </p>
              <div>
                <label className={stageLabel}>Rechercher</label>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isDark ? '#8B7CFF' : '#0D9488' } as any} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={activeTab === 'activites' ? 'Rechercher par nom, catégorie, partenaire...' : activeTab === 'partenaires' ? 'Rechercher par nom, contact, email...' : activeTab === 'reservations' ? 'Rechercher par voyageur, activité...' : 'Rechercher...'}
                    className={stageInput('h-10 pl-9 pr-9')}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className={cn(
                        'absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                        isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-teal-900/40 hover:text-teal-900 hover:bg-teal-900/5',
                      )}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Filtres — collapsible */}
            <section>
              <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={() => setFiltersOpen(o => !o)} className="group flex items-center gap-2 text-left">
                  <p className={`${sectionTitle} !mb-0 ${isDark ? 'text-sky-400' : 'text-sky-600'} group-hover:opacity-100 transition-opacity`}>
                    <span className="h-px w-4 bg-gradient-to-r from-sky-400 to-transparent" />
                    Filtres
                    {(catFilter !== 'all' || partnerFilter !== 'all' || statusFilter !== 'all' || contractStatusFilter !== 'all' || partnerActiveFilter !== 'all') && (
                      <span className={cn('ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold', isDark ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30' : 'bg-sky-500/15 text-sky-700 border border-sky-500/20')}>
                        {[catFilter, partnerFilter, statusFilter, contractStatusFilter, partnerActiveFilter].filter(v => v !== 'all').length}
                      </span>
                    )}
                  </p>
                  <motion.span
                    animate={{ rotate: filtersOpen ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={cn('flex h-6 w-6 items-center justify-center rounded-lg border transition-colors', staged ? isDark ? 'border-white/10 bg-white/[0.04] text-slate-400 group-hover:bg-white/10 group-hover:text-white' : 'border-teal-900/10 bg-white/60 text-teal-900/50 group-hover:bg-white group-hover:text-teal-900' : 'border-border bg-card text-text-secondary')}
                  >
                    <ChevronDown size={13} />
                  </motion.span>
                </button>
                <span className={cn('text-[11px]', isDark ? 'text-slate-500' : 'text-slate-400')}>{filtersOpen ? 'Réduire' : 'Développer'}</span>
              </div>

              <AnimatePresence initial={false}>
                {filtersOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-3">
                      {activeTab === 'activites' && (
                        <>
                          <div>
                            <label className={stageLabel}>Catégorie</label>
                            <Select options={categoryOptions} value={catFilter} onChange={setCatFilter as any} onValueChange={v => setCatFilter(v)} className={ctrl('h-10')} />
                          </div>
                          <div>
                            <label className={stageLabel}>Partenaire</label>
                            <Select options={partnerOptions} value={partnerFilter} onChange={setPartnerFilter as any} onValueChange={v => setPartnerFilter(v)} className={ctrl('h-10')} />
                          </div>
                        </>
                      )}
                      {activeTab === 'reservations' && (
                        <div>
                          <label className={stageLabel}>Statut</label>
                          <Select options={statusOptions} value={statusFilter} onChange={setStatusFilter as any} onValueChange={v => setStatusFilter(v)} className={ctrl('h-10')} />
                        </div>
                      )}
                      {activeTab === 'partenaires' && (
                        <>
                          <div>
                            <label className={stageLabel}>Contrat</label>
                            <Select options={contractStatusOptions} value={contractStatusFilter} onChange={setContractStatusFilter as any} onValueChange={v => setContractStatusFilter(v)} className={ctrl('h-10')} />
                          </div>
                          <div>
                            <label className={stageLabel}>Statut</label>
                            <Select options={activeOptions} value={partnerActiveFilter} onChange={setPartnerActiveFilter as any} onValueChange={v => setPartnerActiveFilter(v)} className={ctrl('h-10')} />
                          </div>
                        </>
                      )}
                      {activeTab === 'commissions' && (
                        <div className={cn('text-xs py-2', isDark ? 'text-slate-500' : 'text-slate-400')}>Aucun filtre pour cet onglet.</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!filtersOpen && (catFilter !== 'all' || partnerFilter !== 'all' || statusFilter !== 'all' || contractStatusFilter !== 'all' || partnerActiveFilter !== 'all') && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {catFilter !== 'all' && <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border', isDark ? 'bg-white/[0.06] border-white/10 text-slate-300' : 'bg-teal-50 border-teal-900/10 text-teal-800')}><Compass size={11} />{catFilter}</span>}
                  {partnerFilter !== 'all' && <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border', isDark ? 'bg-white/[0.06] border-white/10 text-slate-300' : 'bg-white border-teal-900/10 text-teal-800')}><Briefcase size={11} />{partners.find(p => String(p.id) === partnerFilter)?.name || partnerFilter}</span>}
                  {statusFilter !== 'all' && <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border', isDark ? 'bg-white/[0.06] border-white/10 text-slate-300' : 'bg-white border-teal-900/10 text-teal-800')}><Calendar size={11} />{statusFilter}</span>}
                  {contractStatusFilter !== 'all' && <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border', isDark ? 'bg-white/[0.06] border-white/10 text-slate-300' : 'bg-white border-teal-900/10 text-teal-800')}><Clipboard size={11} />{contractStatusFilter}</span>}
                  {partnerActiveFilter !== 'all' && <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border', isDark ? 'bg-white/[0.06] border-white/10 text-slate-300' : 'bg-white border-teal-900/10 text-teal-800')}><UserCheck size={11} />{partnerActiveFilter}</span>}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <motion.div
              className="h-10 w-10 rounded-full border-[3px] border-indigo-400/30 border-t-indigo-400"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
              style={{ filter: 'drop-shadow(0 0 14px rgba(139,124,255,0.6))' }}
            />
            <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${isDark ? 'text-slate-500' : 'text-teal-900/50'}`}>Chargement…</p>
          </div>
        ) : (
          <>
            {/* Activities */}
            {activeTab === 'activites' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredActivities.length === 0 ? (
                  <div className="col-span-full stage-glass p-12 text-center">
                    <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}` }}>
                      <Compass size={22} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                    </div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Aucune activité trouvée</p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Essayez de modifier vos filtres</p>
                  </div>
                ) : filteredActivities.map((a, i) => {
                  const cat = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG.Autre
                  const hue = CATEGORY_HUES[a.category] || CATEGORY_HUES.Autre
                  const CatIcon = cat.icon
                  const allPhotos: string[] = []
                  if (a.photo_url) allPhotos.push(a.photo_url)
                  if (a.photos?.length) allPhotos.push(...a.photos)
                  const tierCount = a.pricing_tiers?.length || 0
                  const includedCount = a.included_items?.length || 0
                  const notIncludedCount = a.not_included_items?.length || 0
                  const hasContact = !!(a.whatsapp || a.contact_email)

                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <TiltCard className="h-full" onClick={() => { setDetailActivity(a); setPhotoIndex(0) }}>
                        <div className="relative h-full flex flex-col overflow-hidden">
                          <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${hue.a}, ${hue.b})`, boxShadow: `0 0 12px ${hue.glow}` }} />
                          <div className="relative h-44 overflow-hidden bg-gradient-to-br from-violet-500/5 via-transparent to-sky-500/5">
                            {allPhotos.length > 0 ? (
                              <img src={`${API_ORIGIN}${allPhotos[0]}`} alt={a.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <OrbIcon icon={CatIcon} hue={hue} size={44} radius={12} />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-60" />
                            <div className="absolute top-3 left-3">
                              <StageBadge variant={a.is_active ? 'ok' : 'neutral'}>{a.is_active ? 'Actif' : 'Inactif'}</StageBadge>
                            </div>
                            <div className="absolute top-3 right-3">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-white border border-white/20 backdrop-blur-md" style={{ background: `linear-gradient(135deg, ${hue.a}, ${hue.b})`, boxShadow: `0 2px 10px ${hue.glow}` }}>
                                <CatIcon size={11} /> {a.category}
                              </span>
                            </div>
                            {allPhotos.length > 1 && (
                              <div className="absolute bottom-3 right-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/55 text-white backdrop-blur-md border border-white/15">
                                  <Camera size={10} /> {allPhotos.length}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="p-4 space-y-3 flex-1">
                            <div>
                              <div className={cn('flex items-center gap-1.5 text-[11px] mb-0.5', isDark ? 'text-slate-500' : 'text-slate-400')}>
                                <Hash size={10} />
                                <span>ACT-{String(a.id).padStart(4, '0')}</span>
                              </div>
                              <h3 className={cn('font-bold text-sm leading-snug line-clamp-1', isDark ? 'text-white' : 'text-slate-900')}>{a.name}</h3>
                              {a.short_description && (
                                <p className={cn('text-[11px] line-clamp-1 mt-0.5', isDark ? 'text-slate-500' : 'text-slate-500')}>{a.short_description}</p>
                              )}
                            </div>

                            {a.partner_name && (
                              <div className={cn('flex items-center gap-1.5 text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                                <Briefcase size={11} />
                                <span className="truncate">{a.partner_name}</span>
                              </div>
                            )}

                            <div className="flex items-baseline gap-1">
                              <span className="text-base font-extrabold" style={{ color: hue.a }}>{formatPrice(a.price)}</span>
                              <span className={cn('text-[11px]', isDark ? 'text-slate-500' : 'text-slate-400')}>/pers.</span>
                            </div>

                            <div className={cn('flex items-center gap-3 pt-2 border-t text-xs', isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-slate-500')}>
                              {a.duration_hours && (
                                <div className="flex items-center gap-1">
                                  <Clock size={11} />
                                  <span>{a.duration_hours}h</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Users size={11} />
                                <span>{a.min_capacity}-{a.max_capacity}</span>
                              </div>
                              {tierCount > 0 && (
                                <div className="flex items-center gap-1 font-bold" style={{ color: hue.a }}>
                                  <DollarSign size={11} />
                                  <span>{tierCount} palier{tierCount > 1 ? 's' : ''}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              {a.availability && (
                                <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border', isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-sky-50 border-sky-200 text-sky-700')}>
                                  {a.availability === 'sur_demande' ? '7/7' : a.availability === 'hebdomadaire' ? 'Hebdo' : a.availability === 'weekends' ? 'WE' : 'Saison'}
                                </span>
                              )}
                              {includedCount > 0 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                                  <Check size={9} /> {includedCount} inclus
                                </span>
                              )}
                              {notIncludedCount > 0 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                                  <X size={9} /> {notIncludedCount} exclu
                                </span>
                              )}
                              {hasContact && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-sky-500/10 text-sky-600 border border-sky-500/20">
                                  <MessageCircle size={9} /> Contact
                                </span>
                              )}
                            </div>
                          </div>

                          <div className={cn('flex items-center justify-between px-3 py-2.5 border-t', isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50')}>
                            <span className={cn('text-[10px] font-bold', isDark ? 'text-slate-500' : 'text-slate-400')}>{a.commission_rate}% comm.</span>
                            <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                              <button onClick={() => openEdit('activity', a)}
                                className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-violet-600 hover:bg-violet-50')}>
                                <Edit3 size={13} />
                              </button>
                              <button onClick={() => setDeleteTarget({ type: 'activity', id: a.id })}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </TiltCard>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {activeTab === 'partenaires' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPartners.length === 0 ? (
                  <div className="col-span-full stage-glass p-12 text-center">
                    <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}` }}>
                      <Briefcase size={22} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                    </div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Aucun partenaire trouvé</p>
                  </div>
                ) : filteredPartners.map((p, i) => {
                  const isActive = (p as any).is_active !== false
                  const hue: StageHue = p.commission_rate >= 15 ? STAGE_HUES.emerald : p.commission_rate >= 10 ? STAGE_HUES.violet : STAGE_HUES.amber
                  const contractInfo = CONTRACT_STATUSES[p.contract_status] || { label: p.contract_status, variant: 'default' as const }
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <TiltCard className="h-full" onClick={() => setDetailPartner(p)}>
                        <div className="relative h-full flex flex-col overflow-hidden">
                          <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${hue.a}, ${hue.b})` }} />
                          <div className="relative h-20" style={{ background: isDark ? `linear-gradient(135deg, ${hue.a}18, transparent)` : `linear-gradient(135deg, ${hue.a}14, ${STAGE_HUES.sky.a}08)` }}>
                            <div className="absolute inset-0 opacity-40 rounded-t-[inherit]" style={{ background: `radial-gradient(circle at 30% 50%, ${hue.glow}, transparent 60%)` }} />
                            <div className="absolute -bottom-6 left-5 z-10">
                              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-extrabold border shadow-lg" style={{ background: isDark ? '#0F1220' : 'white', borderColor: `${hue.a}30`, color: hue.a, boxShadow: `0 8px 20px ${hue.glow}` }}>
                                {p.name.substring(0, 2).toUpperCase()}
                              </div>
                            </div>
                            <div className="absolute top-3 right-3 flex items-center gap-1.5">
                              <StageBadge variant={contractInfo.variant as any}>{contractInfo.label}</StageBadge>
                              {!isActive && <StageBadge variant="neutral">Inactif</StageBadge>}
                            </div>
                            <div className="absolute top-3 left-3">
                              <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border backdrop-blur-md', isDark ? 'bg-black/20 text-slate-300 border-white/10' : 'bg-white/70 text-slate-600 border-slate-200')}>
                                <Hash size={9} /> PAR-{String(p.id).padStart(3, '0')}
                              </span>
                            </div>
                          </div>

                          <div className="pt-8 px-5 pb-4 space-y-3 flex-1">
                            <div>
                              <h3 className={cn('font-bold text-sm leading-snug line-clamp-1', isDark ? 'text-white' : 'text-slate-900')}>{p.name}</h3>
                              {p.contact_name && (
                                <p className={cn('text-[11px] flex items-center gap-1 mt-0.5', isDark ? 'text-slate-500' : 'text-slate-500')}>
                                  <UserCheck size={10} /> {p.contact_name}
                                </p>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              {p.email && (
                                <div className={cn('flex items-center gap-1.5 text-xs truncate', isDark ? 'text-slate-400' : 'text-slate-500')}>
                                  <Mail size={11} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                                  <span className="truncate">{p.email}</span>
                                </div>
                              )}
                              {p.phone && (
                                <div className={cn('flex items-center gap-1.5 text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                                  <MessageCircle size={11} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                                  <span>{p.phone}</span>
                                </div>
                              )}
                              {p.address && (
                                <div className={cn('flex items-center gap-1.5 text-xs truncate', isDark ? 'text-slate-400' : 'text-slate-500')}>
                                  <MapPin size={11} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                                  <span className="truncate">{p.address}</span>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <div className={cn('rounded-xl p-2.5 text-center border', isDark ? 'bg-white/[0.04] border-white/5' : 'bg-slate-50 border-slate-100')}>
                                <Briefcase size={13} className="mx-auto mb-1" style={{ color: STAGE_HUES.violet.a }} />
                                <p className={cn('text-base font-extrabold', isDark ? 'text-white' : 'text-slate-900')}><AnimatedNumber value={p.activity_count} /></p>
                                <p className={cn('text-[9px] uppercase tracking-wider font-bold', isDark ? 'text-slate-500' : 'text-slate-400')}>Activités</p>
                              </div>
                              <div className={cn('rounded-xl p-2.5 text-center border', isDark ? 'bg-white/[0.04] border-white/5' : 'bg-slate-50 border-slate-100')}>
                                <TrendingUp size={13} className="mx-auto mb-1" style={{ color: hue.a }} />
                                <p className="text-base font-extrabold" style={{ color: hue.a }}>{p.commission_rate}%</p>
                                <p className={cn('text-[9px] uppercase tracking-wider font-bold', isDark ? 'text-slate-500' : 'text-slate-400')}>Commission</p>
                              </div>
                            </div>
                          </div>

                          <div className={cn('flex items-center justify-between px-4 py-2.5 border-t', isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50')}>
                            <span className={cn('text-[10px] font-medium', isDark ? 'text-slate-500' : 'text-slate-400')}>
                              Depuis {new Date(p.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                            </span>
                            <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                              <button onClick={() => openEdit('partner', p)}
                                className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-violet-600 hover:bg-violet-50')}>
                                <Edit3 size={13} />
                              </button>
                              <button onClick={() => setDeleteTarget({ type: 'partner', id: p.id })}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </TiltCard>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {activeTab === 'reservations' && (
              <StagePanel title="Réservations" icon={Calendar} hue={STAGE_HUES.amber} badge={<StageBadge variant="neutral">{filteredReservations.length}</StageBadge>}>
                <div className="overflow-x-auto -mx-5 -mb-5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={cn('border-b text-left text-[11px] font-bold uppercase tracking-wider', isDark ? 'border-white/5 text-slate-500 bg-white/[0.02]' : 'border-slate-100 text-slate-500 bg-slate-50/50')}>
                        <th className="px-5 py-3">Voyageur</th>
                        <th className="px-5 py-3">Activité</th>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3 text-center">Pers.</th>
                        <th className="px-5 py-3">Statut</th>
                        <th className="px-5 py-3 text-right">Commission</th>
                        <th className="px-5 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className={cn('divide-y', isDark ? 'divide-white/5' : 'divide-slate-100')}>
                      {filteredReservations.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-12 text-center">
                            <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)' }}>
                              <Calendar size={18} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                            </div>
                            <p className={cn('text-sm', isDark ? 'text-slate-500' : 'text-slate-400')}>Aucune réservation trouvée</p>
                          </td>
                        </tr>
                      ) : filteredReservations.map((r, i) => (
                        <motion.tr
                          key={r.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className={cn('transition-colors', isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50')}
                        >
                          <td className="px-5 py-3.5">
                            <p className={cn('font-semibold text-sm', isDark ? 'text-white' : 'text-slate-900')}>{r.client_name}</p>
                            {r.client_email && <p className={cn('text-[11px]', isDark ? 'text-slate-500' : 'text-slate-500')}>{r.client_email}</p>}
                          </td>
                          <td className="px-5 py-3.5">
                            <p className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-700')}>{r.activity_name}</p>
                            <p className={cn('text-[11px]', isDark ? 'text-slate-500' : 'text-slate-400')}>{r.activity_category}</p>
                          </td>
                          <td className={cn('px-5 py-3.5 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>{new Date(r.reservation_date).toLocaleDateString('fr-FR')}</td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={cn('inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold border', isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700')}>{r.participants}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <StageBadge variant={RESERVATION_STATUSES[r.status]?.variant === 'success' ? 'ok' : RESERVATION_STATUSES[r.status]?.variant === 'warning' ? 'warn' : RESERVATION_STATUSES[r.status]?.variant === 'error' ? 'danger' : 'neutral'}>
                              {RESERVATION_STATUSES[r.status]?.label || r.status}
                            </StageBadge>
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold text-emerald-600">{formatMAD(r.commission_amount)}</td>
                          <td className="px-5 py-3.5">
                            <ActionMenu onEdit={() => openEdit('reservation', r)} onDelete={() => setDeleteTarget({ type: 'reservation', id: r.id })} />
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </StagePanel>
            )}

            {activeTab === 'commissions' && (
              <StagePanel title="Commissions par partenaire" icon={DollarSign} hue={STAGE_HUES.emerald}>
                <div className="overflow-x-auto -mx-5 -mb-5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={cn('border-b text-left text-[11px] font-bold uppercase tracking-wider', isDark ? 'border-white/5 text-slate-500 bg-white/[0.02]' : 'border-slate-100 text-slate-500 bg-slate-50/50')}>
                        <th className="px-5 py-3">Partenaire</th>
                        <th className="px-5 py-3 text-center">Taux</th>
                        <th className="px-5 py-3 text-center">Réservations</th>
                        <th className="px-5 py-3 text-right">CA</th>
                        <th className="px-5 py-3 text-right">Commission</th>
                      </tr>
                    </thead>
                    <tbody className={cn('divide-y', isDark ? 'divide-white/5' : 'divide-slate-100')}>
                      {commissions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-12 text-center">
                            <BarChart size={22} className={cn('mx-auto mb-2', isDark ? 'text-slate-600' : 'text-slate-300')} />
                            <p className={cn('text-sm', isDark ? 'text-slate-500' : 'text-slate-400')}>Aucune donnée de commission</p>
                          </td>
                        </tr>
                      ) : commissions.map((c, i) => (
                        <motion.tr
                          key={c.partner_id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className={cn('transition-colors', isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50')}
                        >
                          <td className={cn('px-5 py-3.5 font-semibold', isDark ? 'text-white' : 'text-slate-900')}>{c.partner_name}</td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-violet-500/10 text-violet-600 border border-violet-500/20">{c.commission_rate}%</span>
                          </td>
                          <td className="px-5 py-3.5 text-center font-medium">{c.reservation_count}</td>
                          <td className="px-5 py-3.5 text-right">{formatMAD(c.total_revenue)}</td>
                          <td className="px-5 py-3.5 text-right font-extrabold text-emerald-600">{formatMAD(c.total_commission)}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                    {commissions.length > 0 && (
                      <tfoot>
                        <tr className={cn('border-t-2 font-bold', isDark ? 'border-violet-500/20 bg-violet-500/10 text-white' : 'border-violet-500/20 bg-violet-50 text-slate-900')}>
                          <td className="px-5 py-3">Total</td>
                          <td className="px-5 py-3"></td>
                          <td className="px-5 py-3 text-center">{commissions.reduce((s, c) => s + c.reservation_count, 0)}</td>
                          <td className="px-5 py-3 text-right">{formatMAD(commissions.reduce((s, c) => s + c.total_revenue, 0))}</td>
                          <td className="px-5 py-3 text-right text-emerald-600">{formatMAD(commissions.reduce((s, c) => s + c.total_commission, 0))}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </StagePanel>
            )}
          </>
        )}
      </div>

      {/* ── Create/Edit Modal — portal full viewport like Librairie ───────── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showModal && (
            <motion.div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl border flex flex-col overflow-hidden"
                style={{
                  background: isDark ? 'linear-gradient(180deg, rgba(17,24,50,0.98), rgba(9,13,30,0.99))' : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.99))',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                  boxShadow: isDark ? '0 24px 60px -18px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.06)' : '0 24px 60px -20px rgba(13,148,136,0.35), inset 0 1px 0 rgba(255,255,255,1)',
                }}
              >
                <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${modalType === 'activity' ? STAGE_HUES.violet.a : modalType === 'partner' ? STAGE_HUES.sky.a : STAGE_HUES.amber.a}, ${modalType === 'activity' ? STAGE_HUES.violet.b : modalType === 'partner' ? STAGE_HUES.sky.b : STAGE_HUES.amber.b})` }} />
                <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)', background: `radial-gradient(90% 140% at 0% 0%, ${isDark ? 'rgba(139,124,255,0.08)' : 'rgba(20,184,166,0.06)'}, transparent 65%)` }}>
                  <div className="flex items-center gap-3">
                    <OrbIcon icon={modalType === 'activity' ? Compass : modalType === 'partner' ? Briefcase : Calendar} hue={modalType === 'activity' ? STAGE_HUES.violet : modalType === 'partner' ? STAGE_HUES.sky : STAGE_HUES.amber} size={40} radius={12} />
                    <div>
                      <h2 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-slate-900')}>{modalTitle}</h2>
                      <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>{editingItem ? 'Modifiez les informations puis validez.' : 'Renseignez les informations puis validez.'}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowModal(false)} className={cn('w-8 h-8 rounded-xl flex items-center justify-center border transition-all', isDark ? 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900')}>
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
                    scrollBehavior: 'smooth' as any,
                  }}
                >
                  {modalType === 'activity' && (
                    <ActivityForm form={form} setForm={setForm} partners={partners} editing={!!editingItem} activityId={editingItem?.id || null} onSaved={() => loadAll()} />
                  )}
                  {modalType === 'partner' && (
                    <PartnerForm form={form} setForm={setForm} />
                  )}
                  {modalType === 'reservation' && (
                    <ReservationForm form={form} setForm={setForm} activities={activities} editing={!!editingItem} />
                  )}
                </div>

                <div className={cn('flex items-center justify-end gap-2 px-6 py-4 border-t shrink-0', isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50')}>
                  <button onClick={() => setShowModal(false)} className={stageBtns.ghost}>Annuler</button>
                  <button onClick={handleSubmit} className={stageBtns.primary}>{editingItem ? 'Enregistrer' : 'Ajouter'}</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      {/* ── Delete confirmation — portal ────────────────────────────────── */}
      {typeof document !== 'undefined' && deleteTarget && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            className="relative w-full max-w-md rounded-2xl border p-6"
            style={{
              background: isDark ? 'linear-gradient(180deg, rgba(17,24,50,0.98), rgba(9,13,30,0.99))' : 'white',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
              boxShadow: '0 24px 60px -18px rgba(0,0,0,0.4)',
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-rose-500" />
              </div>
              <div>
                <h3 className={cn('font-bold', isDark ? 'text-white' : 'text-slate-900')}>Confirmer la suppression</h3>
                <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-slate-500')}>Cette action est irréversible. Voulez-vous vraiment continuer ?</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button onClick={() => setDeleteTarget(null)} className={stageBtns.ghost}>Annuler</button>
              <button onClick={handleDelete} className="inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white bg-gradient-to-b from-rose-500 to-red-600 border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_16px_rgba(225,29,72,0.4)] hover:brightness-110 transition-all">Supprimer</button>
            </div>
          </motion.div>
        </div>,
        document.body,
      )}

      {/* ── Activity Detail — portal full viewport with fluid scroll ─────── */}
      {typeof document !== 'undefined' && detailActivity && createPortal(
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetailActivity(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl border flex flex-col overflow-hidden"
            style={{
              background: isDark ? 'linear-gradient(180deg, rgba(17,24,50,0.98), rgba(9,13,30,0.99))' : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.99))',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
              boxShadow: isDark ? '0 24px 60px -18px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.06)' : '0 24px 60px -20px rgba(13,148,136,0.35), inset 0 1px 0 rgba(255,255,255,1)',
            }}
          >
            {(() => {
              const cat = CATEGORY_CONFIG[detailActivity.category] || CATEGORY_CONFIG.Autre
              const hue = CATEGORY_HUES[detailActivity.category] || CATEGORY_HUES.Autre
              const CatIcon = cat.icon
              const allPhotos: string[] = []
              if (detailActivity.photo_url) allPhotos.push(detailActivity.photo_url)
              if (detailActivity.photos?.length) allPhotos.push(...detailActivity.photos)
              const hasMultiplePhotos = allPhotos.length > 1
              return (
                <>
                  <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${hue.a}, ${hue.b})` }} />
                  <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)', background: `radial-gradient(90% 140% at 0% 0%, ${hue.glow}, transparent 65%)` }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <OrbIcon icon={CatIcon} hue={hue} size={40} radius={12} />
                      <div className="min-w-0">
                        <h2 className={cn('text-base font-bold truncate', isDark ? 'text-white' : 'text-slate-900')}>{detailActivity.name}</h2>
                        {detailActivity.short_description && <p className={cn('text-xs truncate', isDark ? 'text-slate-400' : 'text-slate-500')}>{detailActivity.short_description}</p>}
                      </div>
                    </div>
                    <button onClick={() => setDetailActivity(null)} className={cn('w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 transition-all', isDark ? 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900')}>
                      <X size={16} />
                    </button>
                  </div>

                  <div
                    className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5"
                    style={{
                      overscrollBehavior: 'contain',
                      WebkitOverflowScrolling: 'touch' as any,
                      transform: 'translateZ(0)',
                      willChange: 'scroll-position',
                      scrollBehavior: 'smooth' as any,
                    }}
                  >
                    {allPhotos.length > 0 && (
                      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)' }}>
                        <div className="relative aspect-[16/9] overflow-hidden bg-gray-900 group">
                          <img src={`${API_ORIGIN}${allPhotos[photoIndex]}`} alt={detailActivity.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          {hasMultiplePhotos && (
                            <>
                              <button onClick={() => setPhotoIndex((photoIndex - 1 + allPhotos.length) % allPhotos.length)} className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm">
                                <ChevronLeft size={16} />
                              </button>
                              <button onClick={() => setPhotoIndex((photoIndex + 1) % allPhotos.length)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm">
                                <ChevronRight size={16} />
                              </button>
                              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {allPhotos.map((_, idx) => (
                                  <button key={idx} onClick={() => setPhotoIndex(idx)} className={cn('rounded-full transition-all', idx === photoIndex ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/60')} />
                                ))}
                              </div>
                              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/55 text-white text-[11px] font-bold backdrop-blur-md border border-white/15 opacity-0 group-hover:opacity-100 transition-opacity">
                                {photoIndex + 1} / {allPhotos.length}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white border border-white/20 backdrop-blur-md" style={{ background: `linear-gradient(135deg, ${hue.a}, ${hue.b})`, boxShadow: `0 4px 14px ${hue.glow}` }}>
                        <CatIcon size={12} /> {detailActivity.category}
                      </span>
                      <StageBadge variant={detailActivity.is_active ? 'ok' : 'neutral'}>{detailActivity.is_active ? 'Actif' : 'Inactif'}</StageBadge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { icon: Clock, label: 'Durée', value: detailActivity.duration_hours ? `${detailActivity.duration_hours}h` : '—', hue: STAGE_HUES.sky },
                        { icon: Users, label: 'Capacité', value: `${detailActivity.min_capacity}-${detailActivity.max_capacity}`, hue: STAGE_HUES.violet },
                        { icon: DollarSign, label: 'Prix public', value: formatPrice(detailActivity.price), hue: STAGE_HUES.amber, colored: true },
                        { icon: TrendingUp, label: 'Commission', value: `${detailActivity.commission_rate}%`, hue: STAGE_HUES.emerald, colored: true },
                      ].map(k => (
                        <div key={k.label} className={cn('rounded-xl p-3 border text-center', isDark ? 'bg-white/[0.04] border-white/5' : 'bg-white border-slate-100')}>
                          <OrbIcon icon={k.icon} hue={k.hue} size={28} radius={8} className="mx-auto mb-1.5" />
                          <p className={cn('text-sm font-extrabold', k.colored ? '' : isDark ? 'text-white' : 'text-slate-900')} style={k.colored ? { color: k.hue.a } : undefined}>{k.value}</p>
                          <p className={cn('text-[10px] font-bold uppercase tracking-wider', isDark ? 'text-slate-500' : 'text-slate-400')}>{k.label}</p>
                        </div>
                      ))}
                    </div>

                    {detailActivity.description && (
                      <div className={cn('rounded-xl p-4 border', isDark ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50 border-slate-100')}>
                        <h4 className={cn('text-[11px] font-bold uppercase tracking-wider mb-2', isDark ? 'text-slate-400' : 'text-slate-500')}>Description</h4>
                        <p className={cn('text-sm leading-relaxed whitespace-pre-line', isDark ? 'text-slate-300' : 'text-slate-700')}>{detailActivity.description}</p>
                      </div>
                    )}

                    {detailActivity.partner_name && (
                      <div className={cn('flex items-center gap-3 p-3 rounded-xl border', isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-slate-100')}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold border" style={{ background: `${hue.a}15`, borderColor: `${hue.a}25`, color: hue.a }}>
                          {detailActivity.partner_name[0]}
                        </div>
                        <div>
                          <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>{detailActivity.partner_name}</p>
                          <p className={cn('text-[11px]', isDark ? 'text-slate-500' : 'text-slate-500')}>Partenaire • Commission {detailActivity.commission_rate}%</p>
                        </div>
                      </div>
                    )}

                    {detailActivity.pricing_tiers && detailActivity.pricing_tiers.length > 0 && (
                      <div className={cn('rounded-xl overflow-hidden border', isDark ? 'border-white/5' : 'border-slate-200')}>
                        <div className={cn('px-4 py-3 flex items-center gap-2', isDark ? 'bg-white/[0.03]' : 'bg-slate-50')}>
                          <OrbIcon icon={DollarSign} hue={STAGE_HUES.violet} size={24} radius={7} />
                          <h4 className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-slate-900')}>Grille tarifaire</h4>
                          <StageBadge variant="violet">{detailActivity.pricing_tiers.length}</StageBadge>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className={cn('border-t text-left text-[11px] uppercase tracking-wider', isDark ? 'border-white/5 text-slate-500 bg-white/[0.02]' : 'border-slate-100 text-slate-500 bg-white')}>
                                <th className="px-4 py-2">Personnes</th>
                                <th className="px-4 py-2 text-right">Prix / pers.</th>
                                <th className="px-4 py-2 text-right">Total min</th>
                                <th className="px-4 py-2 text-right">Net partenaire</th>
                              </tr>
                            </thead>
                            <tbody className={cn('divide-y', isDark ? 'divide-white/5' : 'divide-slate-100')}>
                              {detailActivity.pricing_tiers.map((t: any) => {
                                const rate = t.commission_rate != null ? t.commission_rate : detailActivity.commission_rate
                                const totalMin = Number(t.price_per_person) * t.min_persons
                                const net = Number(t.price_per_person) * (1 - rate / 100)
                                return (
                                  <tr key={t.id} className={cn(isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50')}>
                                    <td className={cn('px-4 py-2.5 font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                                      {t.min_persons === t.max_persons ? `${t.min_persons} pers.` : `${t.min_persons}-${t.max_persons} pers.`}
                                    </td>
                                    <td className="px-4 py-2.5 text-right">{formatMAD(Number(t.price_per_person))}</td>
                                    <td className="px-4 py-2.5 text-right font-medium">{formatMAD(totalMin)}</td>
                                    <td className="px-4 py-2.5 text-right font-bold text-emerald-600">{formatMAD(net)}/pers.</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {(detailActivity.included_items?.length > 0 || detailActivity.not_included_items?.length > 0) && (
                      <div className="grid grid-cols-2 gap-3">
                        {detailActivity.included_items?.length > 0 && (
                          <div className={cn('rounded-xl p-4 border', isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')}>
                            <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Check size={12} /> Inclus
                            </h4>
                            <ul className="space-y-1.5">
                              {detailActivity.included_items.map((item: string, i: number) => (
                                <li key={i} className={cn('flex items-center gap-2 text-sm', isDark ? 'text-emerald-300' : 'text-emerald-800')}>
                                  <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {detailActivity.not_included_items?.length > 0 && (
                          <div className={cn('rounded-xl p-4 border', isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-200')}>
                            <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <XCircle size={12} /> Non inclus
                            </h4>
                            <ul className="space-y-1.5">
                              {detailActivity.not_included_items.map((item: string, i: number) => (
                                <li key={i} className={cn('flex items-center gap-2 text-sm', isDark ? 'text-rose-300' : 'text-rose-800')}>
                                  <span className="w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {(detailActivity.whatsapp || detailActivity.contact_email) && (
                      <div className={cn('rounded-xl p-4 border', isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-slate-100')}>
                        <h4 className={cn('text-[11px] font-bold uppercase tracking-wider mb-2', isDark ? 'text-slate-400' : 'text-slate-500')}>Contact</h4>
                        <div className="flex flex-wrap gap-3">
                          {detailActivity.whatsapp && (
                            <span className={cn('inline-flex items-center gap-1.5 text-sm', isDark ? 'text-slate-300' : 'text-slate-700')}>
                              <MessageCircle size={13} className="text-emerald-500" /> {detailActivity.whatsapp}
                            </span>
                          )}
                          {detailActivity.contact_email && (
                            <span className={cn('inline-flex items-center gap-1.5 text-sm', isDark ? 'text-slate-300' : 'text-slate-700')}>
                              <Mail size={13} className="text-sky-500" /> {detailActivity.contact_email}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={cn('flex items-center justify-end gap-2 px-6 py-4 border-t shrink-0', isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50')}>
                    <button onClick={() => { setDetailActivity(null); openEdit('activity', detailActivity) }} className={stageBtns.primary}>
                      <Edit3 size={13} /> Modifier
                    </button>
                  </div>
                </>
              )
            })()}
          </motion.div>
        </motion.div>,
        document.body,
      )}

      {/* ── Partner Detail — portal ───────────────────────────────────── */}
      {typeof document !== 'undefined' && detailPartner && createPortal(
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetailPartner(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl border flex flex-col overflow-hidden"
            style={{
              background: isDark ? 'linear-gradient(180deg, rgba(17,24,50,0.98), rgba(9,13,30,0.99))' : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.99))',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
              boxShadow: isDark ? '0 24px 60px -18px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.06)' : '0 24px 60px -20px rgba(13,148,136,0.35), inset 0 1px 0 rgba(255,255,255,1)',
            }}
          >
            {(() => {
              const isActive = (detailPartner as any).is_active !== false
              const hue: StageHue = detailPartner.commission_rate >= 15 ? STAGE_HUES.emerald : detailPartner.commission_rate >= 10 ? STAGE_HUES.violet : STAGE_HUES.amber
              const contractInfo = CONTRACT_STATUSES[detailPartner.contract_status] || { label: detailPartner.contract_status, variant: 'default' as const }
              const partnerActivities = activities.filter(a => a.partner_id === detailPartner.id)
              const partnerCommission = commissions.find(c => c.partner_id === detailPartner.id)
              return (
                <>
                  <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${hue.a}, ${hue.b})` }} />
                  <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)', background: `radial-gradient(90% 140% at 0% 0%, ${hue.glow}, transparent 65%)` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold border" style={{ background: `${hue.a}15`, borderColor: `${hue.a}25`, color: hue.a }}>
                        {detailPartner.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h2 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-slate-900')}>{detailPartner.name}</h2>
                        {detailPartner.contact_name && <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>{detailPartner.contact_name}</p>}
                      </div>
                    </div>
                    <button onClick={() => setDetailPartner(null)} className={cn('w-8 h-8 rounded-xl flex items-center justify-center border transition-all', isDark ? 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900')}>
                      <X size={16} />
                    </button>
                  </div>

                  <div
                    className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5"
                    style={{
                      overscrollBehavior: 'contain',
                      WebkitOverflowScrolling: 'touch' as any,
                      transform: 'translateZ(0)',
                      willChange: 'scroll-position',
                      scrollBehavior: 'smooth' as any,
                    }}
                  >
                    <div className="flex flex-wrap gap-2">
                      <StageBadge variant={contractInfo.variant as any}>Contrat {contractInfo.label}</StageBadge>
                      <StageBadge variant={isActive ? 'ok' : 'neutral'}>{isActive ? 'Actif' : 'Inactif'}</StageBadge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { icon: Briefcase, label: 'Activités', value: detailPartner.activity_count, hue: STAGE_HUES.violet },
                        { icon: TrendingUp, label: 'Commission', value: `${detailPartner.commission_rate}%`, hue, colored: true },
                        { icon: Calendar, label: 'Réservations', value: partnerCommission?.reservation_count || 0, hue: STAGE_HUES.sky },
                        { icon: DollarSign, label: 'Commission totale', value: formatMAD(partnerCommission?.total_commission || 0), hue: STAGE_HUES.emerald },
                      ].map(k => (
                        <div key={k.label} className={cn('rounded-xl p-3 border text-center', isDark ? 'bg-white/[0.04] border-white/5' : 'bg-white border-slate-100')}>
                          <OrbIcon icon={k.icon} hue={k.hue} size={26} radius={8} className="mx-auto mb-1.5" />
                          <p className={cn('text-sm font-extrabold', isDark ? 'text-white' : 'text-slate-900')} style={k.colored ? { color: k.hue.a } : undefined}>{k.value}</p>
                          <p className={cn('text-[10px] font-bold uppercase tracking-wider', isDark ? 'text-slate-500' : 'text-slate-400')}>{k.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className={cn('rounded-xl p-4 border', isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-slate-100')}>
                      <h4 className={cn('text-[11px] font-bold uppercase tracking-wider mb-3', isDark ? 'text-slate-400' : 'text-slate-500')}>Contact</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {detailPartner.email && (
                          <div className={cn('flex items-center gap-2.5 text-sm', isDark ? 'text-slate-300' : 'text-slate-700')}>
                            <div className="p-1.5 rounded-lg" style={{ background: `${STAGE_HUES.sky.a}15` }}><Mail size={13} style={{ color: STAGE_HUES.sky.a }} /></div>
                            {detailPartner.email}
                          </div>
                        )}
                        {detailPartner.phone && (
                          <div className={cn('flex items-center gap-2.5 text-sm', isDark ? 'text-slate-300' : 'text-slate-700')}>
                            <div className="p-1.5 rounded-lg" style={{ background: `${STAGE_HUES.emerald.a}15` }}><MessageCircle size={13} style={{ color: STAGE_HUES.emerald.a }} /></div>
                            {detailPartner.phone}
                          </div>
                        )}
                        {detailPartner.address && (
                          <div className={cn('flex items-center gap-2.5 text-sm sm:col-span-2', isDark ? 'text-slate-300' : 'text-slate-700')}>
                            <div className="p-1.5 rounded-lg" style={{ background: `${STAGE_HUES.amber.a}15` }}><MapPin size={13} style={{ color: STAGE_HUES.amber.a }} /></div>
                            {detailPartner.address}
                          </div>
                        )}
                      </div>
                    </div>

                    {partnerActivities.length > 0 && (
                      <div className={cn('rounded-xl overflow-hidden border', isDark ? 'border-white/5' : 'border-slate-200')}>
                        <div className={cn('px-4 py-3 flex items-center gap-2', isDark ? 'bg-white/[0.03]' : 'bg-slate-50')}>
                          <OrbIcon icon={Compass} hue={STAGE_HUES.violet} size={22} radius={7} />
                          <h4 className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-slate-900')}>Activités associées</h4>
                          <StageBadge variant="violet">{partnerActivities.length}</StageBadge>
                        </div>
                        <div className={cn('divide-y', isDark ? 'divide-white/5' : 'divide-slate-100')}>
                          {partnerActivities.map(a => {
                            const catHue = CATEGORY_HUES[a.category] || CATEGORY_HUES.Autre
                            const CatIcon = (CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG.Autre).icon
                            return (
                              <div key={a.id} className={cn('px-4 py-3 flex items-center justify-between gap-3', isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50')}>
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="p-2 rounded-lg border shrink-0" style={{ background: `${catHue.a}12`, borderColor: `${catHue.a}18`, color: catHue.a }}>
                                    <CatIcon size={13} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-slate-900')}>{a.name}</p>
                                    <p className={cn('text-[11px]', isDark ? 'text-slate-500' : 'text-slate-500')}>{a.category} • {a.duration_hours ? `${a.duration_hours}h` : '—'}</p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-extrabold" style={{ color: catHue.a }}>{formatPrice(a.price)}</p>
                                  <p className={cn('text-[10px]', isDark ? 'text-slate-500' : 'text-slate-400')}>{a.commission_rate}% comm.</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {detailPartner.notes && (
                      <div className={cn('rounded-xl p-4 border', isDark ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50 border-slate-100')}>
                        <h4 className={cn('text-[11px] font-bold uppercase tracking-wider mb-2', isDark ? 'text-slate-400' : 'text-slate-500')}>Notes</h4>
                        <p className={cn('text-sm leading-relaxed whitespace-pre-line', isDark ? 'text-slate-300' : 'text-slate-700')}>{detailPartner.notes}</p>
                      </div>
                    )}

                    {partnerCommission && partnerCommission.total_revenue > 0 && (
                      <div className="rounded-xl p-4 border" style={{ background: isDark ? 'rgba(16,185,129,0.08)' : 'linear-gradient(135deg, #ECFDF5, #F0FDF4)', borderColor: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.2)' }}>
                        <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <BarChart size={12} /> Résumé financier
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className={cn('text-[11px]', isDark ? 'text-emerald-400/70' : 'text-emerald-600/70')}>Chiffre d'affaires</p>
                            <p className="text-lg font-extrabold text-emerald-600">{formatMAD(partnerCommission.total_revenue)}</p>
                          </div>
                          <div>
                            <p className={cn('text-[11px]', isDark ? 'text-emerald-400/70' : 'text-emerald-600/70')}>Commission perçue</p>
                            <p className="text-lg font-extrabold text-emerald-600">{formatMAD(partnerCommission.total_commission)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={cn('flex items-center justify-end gap-2 px-6 py-4 border-t shrink-0', isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50')}>
                    <button onClick={() => { setDetailPartner(null); openEdit('partner', detailPartner) }} className={stageBtns.primary}>
                      <Edit3 size={13} /> Modifier
                    </button>
                  </div>
                </>
              )
            })()}
          </motion.div>
        </motion.div>,
        document.body,
      )}
    </Stage>
  )
}
