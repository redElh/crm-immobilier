import { useState, useEffect, useMemo, useRef } from 'react'
import { API_ORIGIN } from '../../utils/config'
import { getAuthToken } from '../../utils/auth'
import Card from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Select'
import { Dialog } from '../../components/ui/Dialog'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs/Tabs'
import { useToast } from '../../components/ui/Toast'
import {
  Search, Plus, Compass, Calendar, DollarSign, MoreHorizontal,
  Edit3, Trash2, X, Star, MapPin, Clock, Briefcase, Users,
  TrendingUp, BarChart, Activity, UserCheck, Clipboard,
  Anchor, Coffee, Heart, BookOpen, Zap, Camera, ChevronLeft, ChevronRight,
  MessageCircle, Mail, Check, XCircle, Image, Hash
} from 'react-feather'
import { motion, AnimatePresence } from 'framer-motion'
import ActivityForm from './components/ActivityForm'
import PartnerForm from './components/PartnerForm'
import ReservationForm from './components/ReservationForm'

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
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-background transition-colors text-text-secondary hover:text-text">
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
            className="absolute right-0 top-full mt-1 w-40 bg-card rounded-xl border border-border/50 shadow-dropdown py-1 z-50"
          >
            <button onClick={() => { onEdit(); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text hover:bg-background transition-colors">
              <Edit3 size={14} /> Modifier
            </button>
            <button onClick={() => { onDelete(); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-error hover:bg-error/5 transition-colors">
              <Trash2 size={14} /> Supprimer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color, bg, delay }: { icon: any; label: string; value: string | number; sub: string; color: string; bg: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay || 0 }}
      className="bg-card rounded-xl border border-border/50 shadow-card p-4 hover:shadow-card-hover transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">{label}</p>
        <div className={`p-2.5 rounded-xl ${bg}`}>
          <Icon size={16} className={color} />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-text-secondary/60 mt-0.5">{sub}</p>
    </motion.div>
  )
}

export default function ConciergeriePage() {
  const { toast } = useToast()
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/10">
              <Compass size={22} className="text-accent" />
            </div>
            Activités Conciergerie
          </h1>
          <p className="text-sm text-text-secondary mt-1 ml-[52px]">Gérez les activités proposées aux voyageurs</p>
        </div>
        {activeTab !== 'commissions' && (
          <Button
            onClick={() => openCreate(activeTab === 'activites' ? 'activity' : activeTab === 'partenaires' ? 'partner' : 'reservation')}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            {activeTab === 'activites' ? 'Nouvelle activité' : activeTab === 'partenaires' ? 'Nouveau partenaire' : 'Nouvelle réservation'}
          </Button>
        )}
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Activity} label="Activités actives" value={stats.activeActivities} sub={`${stats.totalActivities} au total`} color="text-accent" bg="bg-accent-light" delay={0} />
          <StatCard icon={UserCheck} label="Partenaires actifs" value={stats.activePartners} sub={`${stats.totalPartners} au total`} color="text-blue-600" bg="bg-blue-50" delay={0.05} />
          <StatCard icon={Calendar} label="Réservations" value={stats.totalReservations} sub={`${stats.pendingReservations} en attente`} color="text-violet-600" bg="bg-violet-50" delay={0.1} />
          <StatCard icon={DollarSign} label="Commissions totales" value={formatMAD(stats.totalCommissions)} sub={`${stats.confirmedReservations} confirmées`} color="text-emerald-600" bg="bg-emerald-50" delay={0.15} />
        </div>
      )}

      {/* Reservation sub-stats row */}
      {stats && stats.totalReservations > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border border-border/50 shadow-card p-4 hover:shadow-card-hover transition-all flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <Clipboard size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.pendingReservations}</p>
              <p className="text-xs text-text-secondary">En attente</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-card rounded-xl border border-border/50 shadow-card p-4 hover:shadow-card-hover transition-all flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50">
              <Check size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats.confirmedReservations}</p>
              <p className="text-xs text-text-secondary">Confirmées</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border/50 shadow-card p-4 hover:shadow-card-hover transition-all flex items-center gap-4">
            <div className="p-3 rounded-xl bg-rose-50">
              <BarChart size={20} className="text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-600">{stats.completedReservations}</p>
              <p className="text-xs text-text-secondary">Terminées</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="activites" className="gap-2">
            <Compass size={15} /> Activités
          </TabsTrigger>
          <TabsTrigger value="partenaires" className="gap-2">
            <Briefcase size={15} /> Partenaires
          </TabsTrigger>
          <TabsTrigger value="reservations" className="gap-2">
            <Calendar size={15} /> Réservations
          </TabsTrigger>
          <TabsTrigger value="commissions" className="gap-2">
            <DollarSign size={15} /> Commissions
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap mb-5">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom, catégorie, partenaire..."
              className="w-full h-9 pl-9 pr-8 text-sm rounded-lg border border-border bg-card text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
          </div>
          {activeTab === 'activites' && (
            <>
              <Select options={categoryOptions} value={catFilter} onChange={setCatFilter} className="w-44" />
              <Select options={partnerOptions} value={partnerFilter} onChange={setPartnerFilter} className="w-48" />
            </>
          )}
          {activeTab === 'reservations' && (
            <Select options={statusOptions} value={statusFilter} onChange={setStatusFilter} className="w-44" />
          )}
          {activeTab === 'partenaires' && (
            <>
              <Select options={contractStatusOptions} value={contractStatusFilter} onChange={setContractStatusFilter} className="w-44" />
              <Select options={activeOptions} value={partnerActiveFilter} onChange={setPartnerActiveFilter} className="w-36" />
            </>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Activities Tab */}
            <TabsContent value="activites">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredActivities.length === 0 ? (
                  <Card className="p-12 text-center col-span-full">
                    <Compass size={32} className="text-text-secondary/30 mx-auto mb-3" />
                    <p className="text-text-secondary/50 text-sm">Aucune activité trouvée</p>
                  </Card>
                ) : filteredActivities.map((a, i) => {
                  const cat = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG.Autre
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
                      transition={{ delay: i * 0.05, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <div
                        onClick={() => { setDetailActivity(a); setPhotoIndex(0) }}
                        className="bg-card rounded-xl border border-border/50 shadow-card hover:shadow-card-hover transition-all duration-200 group overflow-hidden relative h-full flex flex-col cursor-pointer"
                      >
                        {/* Image */}
                        <div className="relative h-44 bg-gradient-to-br from-accent-light via-background to-violet-50">
                          {allPhotos.length > 0 ? (
                            <img src={`${API_ORIGIN}${allPhotos[0]}`} alt={a.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <CatIcon size={36} className="text-text-secondary/20" />
                            </div>
                          )}
                          {/* Status badge top-left */}
                          <div className="absolute top-3 left-3">
                            <Badge variant={a.is_active ? 'success' : 'default'} size="sm">
                              <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1 ${a.is_active ? 'bg-white' : 'bg-gray-400'}`} />
                              {a.is_active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                          {/* Category badge top-right */}
                          <div className="absolute top-3 right-3">
                            <Badge variant="primary" size="sm">{a.category}</Badge>
                          </div>
                          {/* Photo count */}
                          {allPhotos.length > 1 && (
                            <div className="absolute bottom-3 right-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/50 text-white backdrop-blur-sm">
                                <Camera size={10} /> {allPhotos.length}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-3 flex-1">
                          {/* Reference + Title */}
                          <div>
                            <div className="flex items-center gap-1.5 text-[11px] text-text-secondary/60 mb-0.5">
                              <Hash size={10} />
                              <span>ACT-{String(a.id).padStart(4, '0')}</span>
                            </div>
                            <h3 className="font-semibold text-sm leading-snug group-hover:text-accent transition-colors line-clamp-1">{a.name}</h3>
                            {a.short_description && (
                              <p className="text-[11px] text-text-secondary/70 line-clamp-1 mt-0.5">{a.short_description}</p>
                            )}
                          </div>

                          {/* Partner */}
                          {a.partner_name && (
                            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                              <Briefcase size={11} />
                              <span className="truncate">{a.partner_name}</span>
                            </div>
                          )}

                          {/* Price */}
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-bold text-accent">{formatPrice(a.price)}</span>
                            <span className="text-[11px] text-text-secondary">/pers.</span>
                          </div>

                          {/* Details row */}
                          <div className="flex items-center gap-3 pt-2 border-t border-border/30 text-xs text-text-secondary">
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
                              <div className="flex items-center gap-1 text-accent font-medium">
                                <DollarSign size={11} />
                                <span>{tierCount} palier{tierCount > 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>

                          {/* Status indicators */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {a.availability && (
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${
                                a.availability === 'hebdomadaire' ? 'bg-blue-50 text-blue-600' :
                                a.availability === 'weekends' ? 'bg-violet-50 text-violet-600' :
                                a.availability === 'saisonnier' ? 'bg-amber-50 text-amber-600' :
                                'bg-emerald-50 text-emerald-600'
                              }`}>
                                {a.availability === 'sur_demande' ? '7/7' :
                                 a.availability === 'hebdomadaire' ? 'Hebdo' :
                                 a.availability === 'weekends' ? 'WE' : 'Saison'}
                              </span>
                            )}
                            {includedCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-50 text-emerald-600">
                                <Check size={9} /> {includedCount} inclus
                              </span>
                            )}
                            {notIncludedCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-red-50 text-red-500">
                                <X size={9} /> {notIncludedCount} exclu
                              </span>
                            )}
                            {hasContact && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-500">
                                <MessageCircle size={9} /> Contact
                              </span>
                            )}
                            {allPhotos.length > 1 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-pink-50 text-pink-500">
                                <Image size={9} /> {allPhotos.length} photos
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bottom bar */}
                        <div className="flex items-center justify-between px-3 py-2 border-t border-border/30 bg-background/30">
                          <span className="text-[10px] text-text-secondary font-medium">{a.commission_rate}% comm.</span>
                          <div className="flex items-center gap-0.5">
                            <button onClick={(e) => { e.stopPropagation(); openEdit('activity', a) }}
                              className="p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors">
                              <Edit3 size={13} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'activity', id: a.id }) }}
                              className="p-1.5 rounded-lg text-text-secondary hover:text-error hover:bg-error/5 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </TabsContent>

            {/* Partners Tab */}
            <TabsContent value="partenaires">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPartners.length === 0 ? (
                  <Card className="p-12 text-center col-span-full">
                    <Briefcase size={32} className="text-text-secondary/30 mx-auto mb-3" />
                    <p className="text-text-secondary/50 text-sm">Aucun partenaire trouvé</p>
                  </Card>
                ) : filteredPartners.map((p, i) => {
                  const isActive = (p as any).is_active !== false
                  const contractInfo = CONTRACT_STATUSES[p.contract_status] || { label: p.contract_status, variant: 'default' as const }
                  const commissionColor = p.commission_rate >= 20 ? 'text-emerald-600' : p.commission_rate >= 10 ? 'text-accent' : 'text-amber-600'

                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <div onClick={() => setDetailPartner(p)}
                        className="bg-card rounded-xl border border-border/50 shadow-card hover:shadow-card-hover transition-all duration-200 group overflow-hidden relative h-full flex flex-col cursor-pointer">
                        {/* Top gradient header */}
                        <div className="relative h-20 bg-gradient-to-br from-accent/20 via-blue-50 to-violet-50">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.12),transparent_60%)]" />
                          {/* Avatar */}
                          <div className="absolute -bottom-6 left-5">
                            <div className="w-14 h-14 rounded-2xl bg-card border-2 border-border/50 shadow-card flex items-center justify-center text-lg font-bold text-accent group-hover:scale-105 transition-transform">
                              {p.name.substring(0, 2).toUpperCase()}
                            </div>
                          </div>
                          {/* Status + Contract top-right */}
                          <div className="absolute top-3 right-3 flex items-center gap-2">
                            <Badge variant={contractInfo.variant} size="sm">
                              {contractInfo.label}
                            </Badge>
                            {!isActive && (
                              <Badge variant="default" size="sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block mr-1" />
                                Inactif
                              </Badge>
                            )}
                          </div>
                          {/* Reference top-left */}
                          <div className="absolute top-3 left-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/10 text-text-secondary backdrop-blur-sm">
                              <Hash size={9} /> PAR-{String(p.id).padStart(3, '0')}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="pt-8 px-5 pb-4 space-y-3 flex-1">
                          {/* Name + Contact */}
                          <div>
                            <h3 className="font-semibold text-sm leading-snug group-hover:text-accent transition-colors line-clamp-1">{p.name}</h3>
                            {p.contact_name && (
                              <p className="text-[11px] text-text-secondary/70 flex items-center gap-1 mt-0.5">
                                <UserCheck size={10} /> {p.contact_name}
                              </p>
                            )}
                          </div>

                          {/* Contact details */}
                          <div className="space-y-1.5">
                            {p.email && (
                              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                                <Mail size={11} />
                                <span className="truncate">{p.email}</span>
                              </div>
                            )}
                            {p.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                                <MessageCircle size={11} />
                                <span>{p.phone}</span>
                              </div>
                            )}
                            {p.address && (
                              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                                <MapPin size={11} />
                                <span className="truncate">{p.address}</span>
                              </div>
                            )}
                          </div>

                          {/* Stats row */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/30">
                            <div className="bg-background/80 rounded-lg p-2.5 text-center border border-border/20">
                              <Briefcase size={13} className="text-accent mx-auto mb-1" />
                              <p className="text-base font-bold text-text">{p.activity_count}</p>
                              <p className="text-[9px] text-text-secondary uppercase tracking-wider">Activités</p>
                            </div>
                            <div className="bg-background/80 rounded-lg p-2.5 text-center border border-border/20">
                              <TrendingUp size={13} className={`${commissionColor} mx-auto mb-1`} />
                              <p className={`text-base font-bold ${commissionColor}`}>{p.commission_rate}%</p>
                              <p className="text-[9px] text-text-secondary uppercase tracking-wider">Commission</p>
                            </div>
                          </div>
                        </div>

                        {/* Bottom action bar */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/30 bg-background/30">
                          <span className="text-[10px] text-text-secondary/60 font-medium">
                            Depuis {new Date(p.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <button onClick={(e) => { e.stopPropagation(); openEdit('partner', p) }}
                              className="p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors">
                              <Edit3 size={13} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'partner', id: p.id }) }}
                              className="p-1.5 rounded-lg text-text-secondary hover:text-error hover:bg-error/5 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </TabsContent>

            {/* Reservations Tab */}
            <TabsContent value="reservations">
              <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/30 text-left text-xs text-text-secondary">
                          <th className="px-5 py-3 font-medium">Voyageur</th>
                          <th className="px-5 py-3 font-medium">Activité</th>
                          <th className="px-5 py-3 font-medium">Date</th>
                          <th className="px-5 py-3 font-medium text-center">Participants</th>
                          <th className="px-5 py-3 font-medium">Statut</th>
                          <th className="px-5 py-3 font-medium text-right">Commission</th>
                          <th className="px-5 py-3 font-medium w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReservations.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-5 py-12 text-center">
                              <Calendar size={32} className="text-text-secondary/30 mx-auto mb-3" />
                              <p className="text-text-secondary/50 text-sm">Aucune réservation trouvée</p>
                            </td>
                          </tr>
                        ) : filteredReservations.map((r, i) => (
                          <motion.tr
                            key={r.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className="border-b border-border/20 hover:bg-background/50 transition-colors"
                          >
                            <td className="px-5 py-3.5">
                              <p className="font-medium text-text">{r.client_name}</p>
                              {r.client_email && <p className="text-[11px] text-text-secondary">{r.client_email}</p>}
                            </td>
                            <td className="px-5 py-3.5">
                              <p className="text-text">{r.activity_name}</p>
                              <p className="text-[11px] text-text-secondary">{r.activity_category}</p>
                            </td>
                            <td className="px-5 py-3.5 text-text-secondary">{new Date(r.reservation_date).toLocaleDateString('fr-FR')}</td>
                            <td className="px-5 py-3.5 text-center">{r.participants}</td>
                            <td className="px-5 py-3.5">
                              <Badge variant={RESERVATION_STATUSES[r.status]?.variant || 'default'} size="sm">
                                {RESERVATION_STATUSES[r.status]?.label || r.status}
                              </Badge>
                            </td>
                            <td className="px-5 py-3.5 text-right font-medium text-emerald-600">{formatMAD(r.commission_amount)}</td>
                            <td className="px-5 py-3.5">
                              <ActionMenu onEdit={() => openEdit('reservation', r)} onDelete={() => setDeleteTarget({ type: 'reservation', id: r.id })} />
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
            </TabsContent>

            {/* Commissions Tab */}
            <TabsContent value="commissions">
              <Card className="overflow-hidden">
                <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-accent/10">
                    <DollarSign size={14} className="text-accent" />
                  </div>
                  <h3 className="font-semibold text-sm">Commissions par partenaire</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/30 text-left text-xs text-text-secondary">
                        <th className="px-5 py-3 font-medium">Partenaire</th>
                        <th className="px-5 py-3 font-medium text-center">Taux</th>
                        <th className="px-5 py-3 font-medium text-center">Réservations</th>
                        <th className="px-5 py-3 font-medium text-right">Chiffre d'affaires</th>
                        <th className="px-5 py-3 font-medium text-right">Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-12 text-center">
                            <BarChart size={32} className="text-text-secondary/30 mx-auto mb-3" />
                            <p className="text-text-secondary/50 text-sm">Aucune donnée de commission</p>
                          </td>
                        </tr>
                      ) : commissions.map((c, i) => (
                        <motion.tr
                          key={c.partner_id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-border/20 hover:bg-background/50 transition-colors"
                        >
                          <td className="px-5 py-3.5 font-medium text-text">{c.partner_name}</td>
                          <td className="px-5 py-3.5 text-center">{c.commission_rate}%</td>
                          <td className="px-5 py-3.5 text-center">{c.reservation_count}</td>
                          <td className="px-5 py-3.5 text-right">{formatMAD(c.total_revenue)}</td>
                          <td className="px-5 py-3.5 text-right font-bold text-emerald-600">{formatMAD(c.total_commission)}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                    {commissions.length > 0 && (
                      <tfoot>
                        <tr className="border-t-2 border-accent/20 bg-accent/5">
                          <td className="px-5 py-3 font-bold text-text">Total</td>
                          <td className="px-5 py-3"></td>
                          <td className="px-5 py-3 text-center font-bold">{commissions.reduce((s, c) => s + c.reservation_count, 0)}</td>
                          <td className="px-5 py-3 text-right font-bold">{formatMAD(commissions.reduce((s, c) => s + c.total_revenue, 0))}</td>
                          <td className="px-5 py-3 text-right font-bold text-accent">{formatMAD(commissions.reduce((s, c) => s + c.total_commission, 0))}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Modal */}
      <Dialog isOpen={showModal} onClose={() => setShowModal(false)} size="2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 -mx-6 -mt-4 mb-0">
          <h2 className="text-lg font-bold text-text">{modalTitle}</h2>
          <button onClick={() => setShowModal(false)}
            className="p-1.5 rounded-lg hover:bg-background transition-colors text-text-secondary hover:text-text">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto -mx-6 px-6 py-5">
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
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/30 -mx-6 -mb-4 mt-0">
          <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
          <Button onClick={handleSubmit}>{editingItem ? 'Enregistrer' : 'Ajouter'}</Button>
        </div>
      </Dialog>

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          title="Confirmer la suppression"
          message="Cette action est irréversible. Voulez-vous vraiment continuer ?"
          confirmLabel="Supprimer"
          onConfirm={handleDelete}
          variant="danger"
        />
      )}

      {/* Activity Detail Modal */}
      <Dialog isOpen={!!detailActivity} onClose={() => setDetailActivity(null)} size="2xl">
        {detailActivity && (() => {
          const cat = CATEGORY_CONFIG[detailActivity.category] || CATEGORY_CONFIG.Autre
          const CatIcon = cat.icon
          const allPhotos: string[] = []
          if (detailActivity.photo_url) allPhotos.push(detailActivity.photo_url)
          if (detailActivity.photos?.length) allPhotos.push(...detailActivity.photos)
          const hasMultiplePhotos = allPhotos.length > 1
          return (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 -mx-6 -mt-4 mb-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${cat.bg}`}>
                    <CatIcon size={18} className={cat.color} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text">{detailActivity.name}</h2>
                    {detailActivity.short_description && <p className="text-xs text-text-secondary">{detailActivity.short_description}</p>}
                  </div>
                </div>
                <button onClick={() => setDetailActivity(null)} className="p-1.5 rounded-lg hover:bg-background transition-colors text-text-secondary hover:text-text">
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto -mx-6 px-6 py-5 space-y-5">
                {/* Photo Gallery */}
                {allPhotos.length > 0 && (
                  <div className="rounded-xl overflow-hidden border border-border/30">
                    <div className="relative aspect-[16/9] overflow-hidden bg-gray-900 group">
                      <img src={`${API_ORIGIN}${allPhotos[photoIndex]}`} alt={detailActivity.name}
                        className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      {hasMultiplePhotos && (
                        <>
                          <button onClick={() => setPhotoIndex((photoIndex - 1 + allPhotos.length) % allPhotos.length)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm">
                            <ChevronLeft size={20} />
                          </button>
                          <button onClick={() => setPhotoIndex((photoIndex + 1) % allPhotos.length)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm">
                            <ChevronRight size={20} />
                          </button>
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {allPhotos.map((_, idx) => (
                              <button key={idx} onClick={() => setPhotoIndex(idx)}
                                className={`rounded-full transition-all ${idx === photoIndex ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/70'}`} />
                            ))}
                          </div>
                          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-black/50 text-white text-xs font-medium backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            {photoIndex + 1} / {allPhotos.length}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Badges row */}
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${cat.bg} ${cat.color}`}>
                    <CatIcon size={13} /> {detailActivity.category}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${detailActivity.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${detailActivity.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    {detailActivity.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                {/* Key info grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-background/80 rounded-xl p-3 border border-border/30 text-center">
                    <Clock size={16} className="text-text-secondary/60 mx-auto mb-1" />
                    <p className="text-lg font-bold text-text">{detailActivity.duration_hours || '—'}h</p>
                    <p className="text-[10px] text-text-secondary">Durée</p>
                  </div>
                  <div className="bg-background/80 rounded-xl p-3 border border-border/30 text-center">
                    <Users size={16} className="text-text-secondary/60 mx-auto mb-1" />
                    <p className="text-lg font-bold text-text">{detailActivity.min_capacity}-{detailActivity.max_capacity}</p>
                    <p className="text-[10px] text-text-secondary">Capacité</p>
                  </div>
                  <div className="bg-background/80 rounded-xl p-3 border border-border/30 text-center">
                    <DollarSign size={16} className="text-accent mx-auto mb-1" />
                    <p className="text-lg font-bold text-accent">{formatPrice(detailActivity.price)}</p>
                    <p className="text-[10px] text-text-secondary">Prix public</p>
                  </div>
                  <div className="bg-background/80 rounded-xl p-3 border border-border/30 text-center">
                    <TrendingUp size={16} className="text-emerald-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-emerald-600">{detailActivity.commission_rate}%</p>
                    <p className="text-[10px] text-text-secondary">Commission</p>
                  </div>
                </div>

                {/* Description */}
                {detailActivity.description && (
                  <div className="bg-background/50 rounded-xl p-4 border border-border/30">
                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Description</h4>
                    <p className="text-sm text-text leading-relaxed whitespace-pre-line">{detailActivity.description}</p>
                  </div>
                )}

                {/* Partner */}
                {detailActivity.partner_name && (
                  <div className="flex items-center gap-3 p-3 bg-background/50 rounded-xl border border-border/30">
                    <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-bold">
                      {detailActivity.partner_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">{detailActivity.partner_name}</p>
                      <p className="text-[11px] text-text-secondary">Partenaire • Commission {detailActivity.commission_rate}%</p>
                    </div>
                  </div>
                )}

                {/* Pricing Tiers */}
                {detailActivity.pricing_tiers && detailActivity.pricing_tiers.length > 0 && (
                  <div className="border border-border/40 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-background/50 flex items-center gap-2">
                      <DollarSign size={14} className="text-accent" />
                      <h4 className="text-sm font-semibold text-text">Grille tarifaire</h4>
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-accent/10 text-accent rounded">{detailActivity.pricing_tiers.length}</span>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-t border-border/30 text-left text-[11px] text-text-secondary uppercase tracking-wider">
                          <th className="px-4 py-2 font-medium">Personnes</th>
                          <th className="px-4 py-2 font-medium text-right">Prix / pers.</th>
                          <th className="px-4 py-2 font-medium text-right">Total min</th>
                          <th className="px-4 py-2 font-medium text-right">Net partenaire</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailActivity.pricing_tiers.map((t: any) => {
                          const rate = t.commission_rate != null ? t.commission_rate : detailActivity.commission_rate
                          const totalMin = Number(t.price_per_person) * t.min_persons
                          const net = Number(t.price_per_person) * (1 - rate / 100)
                          return (
                            <tr key={t.id} className="border-t border-border/20">
                              <td className="px-4 py-2.5 font-medium text-text">
                                {t.min_persons === t.max_persons ? `${t.min_persons} pers.` : `${t.min_persons}-${t.max_persons} pers.`}
                              </td>
                              <td className="px-4 py-2.5 text-right">{formatMAD(Number(t.price_per_person))}</td>
                              <td className="px-4 py-2.5 text-right font-medium">{formatMAD(totalMin)}</td>
                              <td className="px-4 py-2.5 text-right text-emerald-600 font-medium">{formatMAD(net)}/pers.</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Included / Not Included */}
                {(detailActivity.included_items?.length > 0 || detailActivity.not_included_items?.length > 0) && (
                  <div className="grid grid-cols-2 gap-3">
                    {detailActivity.included_items?.length > 0 && (
                      <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-200/50">
                        <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Check size={12} /> Inclus
                        </h4>
                        <ul className="space-y-1.5">
                          {detailActivity.included_items.map((item: string, i: number) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-emerald-800">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {detailActivity.not_included_items?.length > 0 && (
                      <div className="bg-red-50/50 rounded-xl p-4 border border-red-200/50">
                        <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <XCircle size={12} /> Non inclus
                        </h4>
                        <ul className="space-y-1.5">
                          {detailActivity.not_included_items.map((item: string, i: number) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-red-800">
                              <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Contact */}
                {(detailActivity.whatsapp || detailActivity.contact_email) && (
                  <div className="bg-background/50 rounded-xl p-4 border border-border/30">
                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Contact</h4>
                    <div className="flex flex-wrap gap-3">
                      {detailActivity.whatsapp && (
                        <span className="inline-flex items-center gap-1.5 text-sm text-text">
                          <MessageCircle size={14} className="text-emerald-600" /> {detailActivity.whatsapp}
                        </span>
                      )}
                      {detailActivity.contact_email && (
                        <span className="inline-flex items-center gap-1.5 text-sm text-text">
                          <Mail size={14} className="text-blue-600" /> {detailActivity.contact_email}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/30 -mx-6 -mb-4 mt-0">
                <Button variant="outline" onClick={() => { setDetailActivity(null); openEdit('activity', detailActivity) }} className="gap-2">
                  <Edit3 size={14} /> Modifier
                </Button>
              </div>
            </>
          )
        })()}
      </Dialog>

      {/* Partner Detail Modal */}
      <Dialog isOpen={!!detailPartner} onClose={() => setDetailPartner(null)} size="2xl">
        {detailPartner && (() => {
          const isActive = (detailPartner as any).is_active !== false
          const contractInfo = CONTRACT_STATUSES[detailPartner.contract_status] || { label: detailPartner.contract_status, variant: 'default' as const }
          const commissionColor = detailPartner.commission_rate >= 20 ? 'text-emerald-600' : detailPartner.commission_rate >= 10 ? 'text-accent' : 'text-amber-600'
          const partnerActivities = activities.filter(a => a.partner_id === detailPartner.id)
          const partnerCommission = commissions.find(c => c.partner_id === detailPartner.id)
          const partnerReservations = reservations.filter(r => partnerActivities.some(a => a.id === r.activity_id))

          return (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 -mx-6 -mt-4 mb-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-lg font-bold text-accent">
                    {detailPartner.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text">{detailPartner.name}</h2>
                    {detailPartner.contact_name && <p className="text-xs text-text-secondary">{detailPartner.contact_name}</p>}
                  </div>
                </div>
                <button onClick={() => setDetailPartner(null)} className="p-1.5 rounded-lg hover:bg-background transition-colors text-text-secondary hover:text-text">
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto -mx-6 px-6 py-5 space-y-5">
                {/* Badges row */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant={contractInfo.variant} size="sm">
                    Contrat {contractInfo.label}
                  </Badge>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    {isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                {/* Key info grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-background/80 rounded-xl p-3 border border-border/30 text-center">
                    <Briefcase size={16} className="text-accent mx-auto mb-1" />
                    <p className="text-lg font-bold text-text">{detailPartner.activity_count}</p>
                    <p className="text-[10px] text-text-secondary">Activités</p>
                  </div>
                  <div className="bg-background/80 rounded-xl p-3 border border-border/30 text-center">
                    <TrendingUp size={16} className={`${commissionColor} mx-auto mb-1`} />
                    <p className={`text-lg font-bold ${commissionColor}`}>{detailPartner.commission_rate}%</p>
                    <p className="text-[10px] text-text-secondary">Commission</p>
                  </div>
                  <div className="bg-background/80 rounded-xl p-3 border border-border/30 text-center">
                    <Calendar size={16} className="text-violet-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-violet-600">{partnerCommission?.reservation_count || 0}</p>
                    <p className="text-[10px] text-text-secondary">Réservations</p>
                  </div>
                  <div className="bg-background/80 rounded-xl p-3 border border-border/30 text-center">
                    <DollarSign size={16} className="text-emerald-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-emerald-600">{formatMAD(partnerCommission?.total_commission || 0)}</p>
                    <p className="text-[10px] text-text-secondary">Commission totale</p>
                  </div>
                </div>

                {/* Contact */}
                <div className="bg-background/50 rounded-xl p-4 border border-border/30">
                  <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Contact</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {detailPartner.email && (
                      <div className="flex items-center gap-2.5 text-sm text-text">
                        <div className="p-1.5 rounded-lg bg-blue-50">
                          <Mail size={14} className="text-blue-600" />
                        </div>
                        {detailPartner.email}
                      </div>
                    )}
                    {detailPartner.phone && (
                      <div className="flex items-center gap-2.5 text-sm text-text">
                        <div className="p-1.5 rounded-lg bg-emerald-50">
                          <MessageCircle size={14} className="text-emerald-600" />
                        </div>
                        {detailPartner.phone}
                      </div>
                    )}
                    {detailPartner.address && (
                      <div className="flex items-center gap-2.5 text-sm text-text sm:col-span-2">
                        <div className="p-1.5 rounded-lg bg-amber-50">
                          <MapPin size={14} className="text-amber-600" />
                        </div>
                        {detailPartner.address}
                      </div>
                    )}
                  </div>
                </div>

                {/* Activities list */}
                {partnerActivities.length > 0 && (
                  <div className="border border-border/40 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-background/50 flex items-center gap-2">
                      <Compass size={14} className="text-accent" />
                      <h4 className="text-sm font-semibold text-text">Activités associées</h4>
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-accent/10 text-accent rounded">{partnerActivities.length}</span>
                    </div>
                    <div className="divide-y divide-border/20">
                      {partnerActivities.map(a => {
                        const cat = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG.Autre
                        const CatIcon = cat.icon
                        return (
                          <div key={a.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-background/30 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`p-2 rounded-lg ${cat.bg} flex-shrink-0`}>
                                <CatIcon size={14} className={cat.color} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-text truncate">{a.name}</p>
                                <p className="text-[11px] text-text-secondary">{a.category} • {a.duration_hours ? `${a.duration_hours}h` : '—'}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold text-accent">{formatPrice(a.price)}</p>
                              <p className="text-[10px] text-text-secondary">{a.commission_rate}% comm.</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {detailPartner.notes && (
                  <div className="bg-background/50 rounded-xl p-4 border border-border/30">
                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Notes</h4>
                    <p className="text-sm text-text leading-relaxed whitespace-pre-line">{detailPartner.notes}</p>
                  </div>
                )}

                {/* Revenue summary */}
                {partnerCommission && partnerCommission.total_revenue > 0 && (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200/50">
                    <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <BarChart size={12} /> Résumé financier
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] text-emerald-600/70">Chiffre d'affaires</p>
                        <p className="text-lg font-bold text-emerald-700">{formatMAD(partnerCommission.total_revenue)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-emerald-600/70">Commission perçue</p>
                        <p className="text-lg font-bold text-emerald-700">{formatMAD(partnerCommission.total_commission)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/30 -mx-6 -mb-4 mt-0">
                <Button variant="outline" onClick={() => { setDetailPartner(null); openEdit('partner', detailPartner) }} className="gap-2">
                  <Edit3 size={14} /> Modifier
                </Button>
              </div>
            </>
          )
        })()}
      </Dialog>
    </div>
  )
}
