import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Dialog } from '../../../components/ui/Dialog'
import { PropertyGallery } from '../../../components/modules/properties/PropertyGallery'
import { PropertyDetails } from '../../../components/modules/properties/PropertyDetails'
import { PropertyDocuments } from '../../../components/modules/properties/PropertyDocuments'
import { PropertyFinancial } from '../../../components/modules/properties/PropertyFinancial'
import { PropertyTimeline } from '../../../components/modules/properties/PropertyTimeline'
import { PropertyMatching } from '../../../components/modules/properties/PropertyMatching'
import { PropertySeasonal } from '../../../components/modules/properties/PropertySeasonal'
import { PropertyPlanMap } from '../../../components/modules/properties/PropertyPlanMap'
import { PropertyTransfer } from '../../../components/modules/properties/PropertyTransfer'
import { PropertySocial } from '../../../components/modules/properties/PropertySocial'
import { PropertyKeys } from '../../../components/modules/properties/PropertyKeys'
import { PropertyTransactionsTab } from '../../../components/modules/properties/PropertyTransactionsTab'
import { PropertyContractsTab } from '../../../components/modules/properties/PropertyContractsTab'
import { BackLink } from '../../../components/ui/BackLink'
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from '../../../types/property'
import {
  Info, DollarSign, FileText, Users, Clock, Map, Share2, Heart, Globe, Sun, Image as ImageIcon, Key,
  Edit3, ExternalLink, Phone, Mail, MessageSquare, BookOpen, Repeat, Trash2, RefreshCw,
  AlertTriangle, ChevronDown, Shield, CheckCircle
} from 'react-feather'
import { AGENTS, getPropertyById } from './mockData';

const STATUS_BY_TYPE: Record<string, string[]> = {
  residential: ['for_sale', 'for_rent', 'mandate_pending', 'negotiation', 'under_compromise', 'signing', 'sold', 'rented', 'withdrawn'],
  commercial: ['for_sale_or_rent', 'negotiation', 'under_promise', 'sold_or_rented', 'withdrawn'],
  land: ['for_sale', 'under_promise', 'urbanism', 'sold', 'withdrawn'],
  vacation: ['available', 'option', 'reserved', 'occupied', 'unavailable', 'withdrawn'],
  luxury: ['for_sale_or_rent', 'confidential', 'negotiation', 'sold_or_rented', 'withdrawn'],
};

interface TabItem {
  id: string
  label: string
  icon: React.ReactNode
}

export default function AdminPropertyPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('informations')
  const [liked, setLiked] = useState(false)

  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const property = getPropertyById(id || '') || getPropertyById('1')!

  const getAgentName = (agentId?: string) => {
    if (!agentId) return 'Non assigne';
    const agent = AGENTS.find(a => a.id === agentId);
    return agent ? agent.name : 'Non assigne';
  };

  const getAgentInitials = (agentId?: string) => {
    if (!agentId) return 'NA';
    const agent = AGENTS.find(a => a.id === agentId);
    return agent ? agent.initials : 'NA';
  };

  const getAgentColor = (agentId?: string) => {
    if (!agentId) return 'bg-gray-400';
    const agent = AGENTS.find(a => a.id === agentId);
    return agent ? agent.color : 'bg-gray-400';
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(p)

  const statusLabel = STATUS_LABELS[property.status]
  const statusColor = STATUS_COLORS[property.status]
  const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType]
  const transactionLabel = TRANSACTION_TYPE_LABELS[property.transactionType]

  const tabs: TabItem[] = [
    { id: 'informations', label: 'Informations', icon: <Info size={15} /> },
    { id: 'media', label: 'Photos/Medias', icon: <ImageIcon size={15} /> },
    { id: 'plan', label: 'Plan/Carte', icon: <Map size={15} /> },
    ...(property.propertyType === 'vacation' ? [{ id: 'saisonnier', label: 'Saisonnier', icon: <Sun size={15} /> } as TabItem] : []),
    { id: 'documents', label: 'Documents', icon: <FileText size={15} /> },
    { id: 'historique', label: 'Historique', icon: <Clock size={15} /> },
    { id: 'matching', label: 'Matching', icon: <Users size={15} /> },
    { id: 'transfert', label: 'Transfert', icon: <Globe size={15} /> },
    { id: 'cles', label: 'Cles', icon: <Key size={15} /> },
    { id: 'transactions', label: 'Transactions', icon: <BookOpen size={15} /> },
    { id: 'contrats', label: 'Contrats', icon: <FileText size={15} /> },
  ]

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <BackLink />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<Heart size={14} />}
            className={liked ? 'text-red-500' : ''}
            onClick={() => setLiked(!liked)}
          />
          <Button variant="ghost" size="sm" icon={<Share2 size={14} />} />
          <Button variant="outline" size="sm" icon={<Edit3 size={14} />}>
            Modifier
          </Button>
          <Button variant="default" size="sm" icon={<ExternalLink size={14} />}>
            Partager
          </Button>
        </div>
      </div>

      {/* Admin actions bar */}
      <Card className="p-3 border-accent/20 bg-accent/5">
        <div className="flex items-center gap-2 flex-wrap">
          <Shield size={14} className="text-accent" />
          <span className="text-xs font-medium text-accent mr-2">Actions Administrateur :</span>
          <Button variant="outline" size="sm" icon={<Repeat size={12} />}
            onClick={() => { setSelectedAgent(property.agentId || ''); setShowReassignDialog(true); }}>
            Reaffecter
          </Button>
          <Button variant="outline" size="sm" icon={<RefreshCw size={12} />}
            onClick={() => { setNewStatus(property.status); setShowStatusDialog(true); }}>
            Changer le statut
          </Button>
          <Button variant="ghost" size="sm" icon={<Trash2 size={12} />}
            className="text-error hover:bg-error/5"
            onClick={() => { setDeleteConfirm(''); setDeleteReason(''); setShowDeleteDialog(true); }}>
            Supprimer
          </Button>
        </div>
      </Card>

      {/* Hero section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Gallery */}
        <div className="lg:col-span-3">
          <PropertyGallery images={property.images} />
        </div>

        {/* Quick info card */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[11px] text-text-secondary/60 font-mono">{property.reference}</p>
                <h1 className="text-xl font-bold mt-0.5 leading-snug">{property.title}</h1>
              </div>
              <Badge className={statusColor}>{statusLabel}</Badge>
            </div>

            <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
              <Map size={13} />
              <span>{property.city}{property.district ? `, ${property.district}` : ''}</span>
            </div>

            <div className="flex items-baseline gap-2 mb-4">
              {property.prixSurDemande ? (
                <span className="text-2xl font-bold text-accent">Prix sur demande</span>
              ) : (
                <>
                  <span className="text-2xl font-bold text-accent">{formatPrice(property.price)}</span>
                  {property.transactionType === 'location_ld' && <span className="text-sm text-text-secondary">/mois</span>}
                  {property.transactionType === 'location_saisonniere' && (
                    <span className="text-sm text-text-secondary">/nuit</span>
                  )}
                </>
              )}
              {property.transactionType === 'location_saisonniere' && property.priceMin && property.priceMax && (
                <span className="text-xs text-text-secondary/60 ml-1">
                  ({formatPrice(property.priceMin)} - {formatPrice(property.priceMax)})
                </span>
              )}
            </div>

            {property.priceEstimate && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 mb-4">
                <DollarSign size={14} className="text-amber-600" />
                <div>
                  <p className="text-xs text-amber-700">
                    Estimation: <strong>{formatPrice(property.priceEstimate)}</strong>
                  </p>
                  <p className="text-[10px] text-amber-600/70">
                    {property.priceEstimate > property.price
                      ? 'Sous-estime par rapport au marche'
                      : 'Sur-estime par rapport au marche'}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-text-secondary flex-wrap">
              <span>{property.surface} m2</span>
              <span>{property.rooms} pieces</span>
              <span>{property.bedrooms} chambres</span>
              {property.sleepingCapacity && <span>{property.sleepingCapacity} couchages</span>}
              {property.landSize && <span>Terrain {property.landSize} m2</span>}
            </div>
          </Card>

          {/* Owner quick card */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0">
                <span className="text-accent font-bold text-sm">
                  {property.owner.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{property.owner.name}</p>
                <p className="text-xs text-text-secondary truncate">{property.owner.phone}</p>
              </div>
              <div className="flex gap-1">
                <button className="btn-ghost p-1.5"><Phone size={14} /></button>
                <button className="btn-ghost p-1.5"><Mail size={14} /></button>
                <button className="btn-ghost p-1.5"><MessageSquare size={14} /></button>
              </div>
            </div>
          </Card>

          {/* Agent card (admin only) */}
          <Card className="p-4 border-accent/20">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${getAgentColor(property.agentId)} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-bold text-sm">
                  {getAgentInitials(property.agentId)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Agent responsable</p>
                <p className="text-sm font-medium">{getAgentName(property.agentId)}</p>
                {property.agentId && (
                  <p className="text-xs text-text-secondary">
                    Mandat: {property.mandateType || 'N/A'} · {property.mandateStatus === 'actif' ? 'Actif' : property.mandateStatus}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm" icon={<Repeat size={12} />}
                onClick={() => { setSelectedAgent(property.agentId || ''); setShowReassignDialog(true); }}>
                Changer
              </Button>
            </div>
          </Card>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 text-center">
              <p className="text-xs text-text-secondary">Type</p>
              <p className="text-sm font-semibold mt-0.5">{typeLabel}</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-xs text-text-secondary">Transaction</p>
              <p className="text-sm font-semibold mt-0.5">{transactionLabel}</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin border-b border-border/40">
          <div className="flex px-1 min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-accent border-accent'
                    : 'text-text-secondary border-transparent hover:text-text hover:border-border'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'informations' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-2">
                    <PropertyDetails property={property} />
                  </div>
                  <div className="space-y-4">
                    <PropertyFinancial property={property} />
                    <PropertySocial />
                  </div>
                </div>
              )}
              {activeTab === 'media' && (
                <div className="space-y-5">
                  <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
                    <h3 className="font-semibold mb-4">Galerie photos</h3>
                    <PropertyGallery images={property.images} />
                  </div>
                  {property.dpe && (
                    <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
                      <h3 className="font-semibold mb-3">Diagnostic (DPE)</h3>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-green-500 flex items-center justify-center text-white font-bold text-xl">
                          {property.dpe.class}
                        </div>
                        <div>
                          <p className="font-medium">Classe {property.dpe.class}</p>
                          <p className="text-sm text-text-secondary">{property.dpe.consumption} kWh/m2/an</p>
                          <p className="text-xs text-text-secondary/60">Realise le {property.dpe.since}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'plan' && <PropertyPlanMap property={property} />}
              {activeTab === 'saisonnier' && <PropertySeasonal />}
              {activeTab === 'documents' && <PropertyDocuments property={property} />}
              {activeTab === 'historique' && <PropertyTimeline events={property.timeline} />}
              {activeTab === 'matching' && <PropertyMatching />}
              {activeTab === 'transfert' && <PropertyTransfer />}
              {activeTab === 'cles' && <PropertyKeys property={property} />}
              {activeTab === 'transactions' && (
                <PropertyTransactionsTab
                  propertyId={property.id}
                  propertyTitle={property.title}
                  propertyRef={property.reference}
                />
              )}
              {activeTab === 'contrats' && (
                <PropertyContractsTab
                  propertyId={property.id}
                  propertyTitle={property.title}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Reassign Dialog */}
      <Dialog isOpen={showReassignDialog} onClose={() => setShowReassignDialog(false)} title="Reaffecter un bien" size="lg">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <p className="text-sm font-medium">{property.title}</p>
            <p className="text-xs text-text-secondary">#{property.reference}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1.5">Agent actuel :</p>
            <div className="flex items-center gap-2 text-sm">
              {property.agentId ? (
                <>
                  <div className={`w-6 h-6 rounded-full ${getAgentColor(property.agentId)} flex items-center justify-center text-white text-[10px] font-bold`}>
                    {getAgentInitials(property.agentId)}
                  </div>
                  <span>{getAgentName(property.agentId)}</span>
                </>
              ) : (
                <span className="text-text-secondary italic">Non assigne</span>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nouvel agent responsable</label>
            <select
              className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
            >
              <option value="">Selectionner un agent</option>
              {AGENTS.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
              <option value="">Non assigne</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowReassignDialog(false)}>Annuler</Button>
            <Button variant="default" onClick={() => { setShowReassignDialog(false); setSelectedAgent(''); }} disabled={!selectedAgent}>Reaffecter</Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer le bien" size="lg">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <p className="text-sm font-medium">{property.title}</p>
            <p className="text-xs text-text-secondary">#{property.reference}</p>
          </div>
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-700 space-y-1">
                <p className="font-medium">Attention :</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Cette action est IRREVERSIBLE</li>
                  <li>Tous les documents associes seront supprimes</li>
                  <li>Tous les mandats lies seront supprimes</li>
                  <li>L'historique du bien sera efface</li>
                </ul>
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Confirmation</label>
            <input
              type="text"
              className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-error/20 focus:border-error transition-all"
              placeholder='Tapez "SUPPRIMER" pour confirmer'
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Motif de suppression (optionnel)</label>
            <select
              className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
            >
              <option value="">Selectionner un motif</option>
              <option value="doublon">Erreur de saisie - Doublon</option>
              <option value="vendu">Bien vendu hors agence</option>
              <option value="retire">Bien retire par le proprietaire</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
            <Button variant="danger" onClick={() => setShowDeleteDialog(false)} disabled={deleteConfirm !== 'SUPPRIMER'}>
              Confirmer la suppression
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog isOpen={showStatusDialog} onClose={() => setShowStatusDialog(false)} title="Changer le statut" size="md">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <p className="text-sm font-medium">{property.title}</p>
            <p className="text-xs text-text-secondary">#{property.reference}</p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Statut actuel</label>
            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nouveau statut</label>
            <select
              className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {(STATUS_BY_TYPE[property.propertyType] || Object.keys(STATUS_LABELS)).map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowStatusDialog(false)}>Annuler</Button>
            <Button variant="default" onClick={() => setShowStatusDialog(false)} disabled={newStatus === property.status}>
              Changer le statut
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
