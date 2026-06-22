import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { PropertyGallery } from '../../components/modules/properties/PropertyGallery'
import { PropertyDetails } from '../../components/modules/properties/PropertyDetails'
import { PropertyDocuments } from '../../components/modules/properties/PropertyDocuments'
import { PropertyFinancial } from '../../components/modules/properties/PropertyFinancial'
import { PropertyTimeline } from '../../components/modules/properties/PropertyTimeline'
import { PropertyMatching } from '../../components/modules/properties/PropertyMatching'
import { PropertySeasonal } from '../../components/modules/properties/PropertySeasonal'
import { PropertyPlanMap } from '../../components/modules/properties/PropertyPlanMap'
import { PropertyTransfer } from '../../components/modules/properties/PropertyTransfer'
import { PropertySocial } from '../../components/modules/properties/PropertySocial'
import { PropertyKeys } from '../../components/modules/properties/PropertyKeys'
import { PropertyTransactionsTab } from '../../components/modules/properties/PropertyTransactionsTab'
import { PropertyContractsTab } from '../../components/modules/properties/PropertyContractsTab'
import { BackLink } from '../../components/ui/BackLink'
import { ConfidentialProvider, useConfidential } from '../../components/modules/confidentiality/ConfidentialContext'
import { ConfidentialBanner } from '../../components/modules/confidentiality/ConfidentialBanner'
import { ConfidentialValue } from '../../components/modules/confidentiality/ConfidentialField'
import { mockProperties } from '../../data/mockProperties'
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from '../../types/property'
import {
  Info, DollarSign, FileText, Users, Clock, Map, Share2, Heart, Globe, Sun, Image as ImageIcon, Key, User,
  Edit3, ExternalLink, Phone, Mail, MessageSquare, BookOpen
} from 'react-feather'

interface TabItem {
  id: string
  label: string
  icon: React.ReactNode
}

export default function PropertyPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('informations')
  const [liked, setLiked] = useState(false)

  const property = mockProperties[id || ''] || mockProperties['1']

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(p)

  const statusLabel = STATUS_LABELS[property.status]
  const statusColor = STATUS_COLORS[property.status]
  const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType]
  const transactionLabel = TRANSACTION_TYPE_LABELS[property.transactionType]

  const tabs: TabItem[] = [
    { id: 'informations', label: 'Informations', icon: <Info size={15} /> },
    { id: 'media', label: 'Photos/Médias', icon: <ImageIcon size={15} /> },
    { id: 'plan', label: 'Plan/Carte', icon: <Map size={15} /> },
    ...(property.propertyType === 'vacation' ? [{ id: 'saisonnier', label: 'Saisonnier', icon: <Sun size={15} /> } as TabItem] : []),
    { id: 'documents', label: 'Documents', icon: <FileText size={15} /> },
    { id: 'historique', label: 'Historique', icon: <Clock size={15} /> },
    { id: 'matching', label: 'Matching', icon: <Users size={15} /> },
    { id: 'transfert', label: 'Transfert', icon: <Globe size={15} /> },
    { id: 'cles', label: 'Clés', icon: <Key size={15} /> },
    { id: 'transactions', label: 'Transactions', icon: <BookOpen size={15} /> },
    { id: 'contrats', label: 'Contrats', icon: <FileText size={15} /> },
  ]

  return (
    <ConfidentialProvider>
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
                  <span className="text-2xl font-bold text-accent">
                    <ConfidentialValue>{formatPrice(property.price)}</ConfidentialValue>
                  </span>
                  {property.transactionType === 'location_ld' && <span className="text-sm text-text-secondary">/mois</span>}
                  {property.transactionType === 'location_saisonniere' && (
                    <span className="text-sm text-text-secondary">/nuit</span>
                  )}
                </>
              )}
              {property.transactionType === 'location_saisonniere' && property.priceMin && property.priceMax && (
                <span className="text-xs text-text-secondary/60 ml-1">
                  <ConfidentialValue>{formatPrice(property.priceMin)} - {formatPrice(property.priceMax)}</ConfidentialValue>
                </span>
              )}
            </div>

            {property.priceEstimate && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 mb-4">
                <DollarSign size={14} className="text-amber-600" />
                <div>
                  <p className="text-xs text-amber-700">
                    Estimation: <strong><ConfidentialValue>{formatPrice(property.priceEstimate)}</ConfidentialValue></strong>
                  </p>
                  <p className="text-[10px] text-amber-600/70">
                    <ConfidentialValue>
                      {property.priceEstimate > property.price
                        ? 'Sous-estimé par rapport au marché'
                        : 'Sur-estimé par rapport au marché'}
                    </ConfidentialValue>
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-text-secondary flex-wrap">
              <span>{property.surface} m²</span>
              <span>{property.rooms} pièces</span>
              <span>{property.bedrooms} chambres</span>
              {property.sleepingCapacity && <span>{property.sleepingCapacity} couchages</span>}
              {property.landSize && <span>Terrain {property.landSize} m²</span>}
            </div>
          </Card>

          {/* Owner quick card */}
          <Card className="p-4">
            <p className="text-[11px] text-text-secondary/60 font-medium mb-2 flex items-center gap-1.5">
              <User size={12} /> Propriétaire
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0">
                <span className="text-accent font-bold text-sm">
                  {property.owner.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium"><ConfidentialValue>{property.owner.name}</ConfidentialValue></p>
                <p className="text-xs text-text-secondary truncate"><ConfidentialValue>{property.owner.phone}</ConfidentialValue></p>
              </div>
              <div className="flex gap-1">
                <button className="btn-ghost p-1.5"><Phone size={14} /></button>
                <button className="btn-ghost p-1.5"><Mail size={14} /></button>
                <button className="btn-ghost p-1.5"><MessageSquare size={14} /></button>
              </div>
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
        {/* Scrollable tab bar */}
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

        {/* Tab content */}
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
                <div className="space-y-5">
                  <ConfidentialBanner />
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 space-y-5">
                      <PropertyDetails property={property} />
                    </div>
                    <div className="space-y-4">
                      <PropertyFinancial property={property} />
                      <PropertySocial />
                    </div>
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
                          <p className="text-sm text-text-secondary">{property.dpe.consumption} kWh/m²/an</p>
                          <p className="text-xs text-text-secondary/60">Réalisé le {property.dpe.since}</p>
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
    </div>
    </ConfidentialProvider>
  )
}
