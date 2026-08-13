import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, createElement, useCallback } from 'react';
import Card from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { BackLink } from '../../components/ui/BackLink';
import { Carousel } from '../../components/ui/Carousel';
import type { Contact, Mandat } from '../../types/contact';
import { useToast } from '../../components/ui/Toast';
import { CompletionRing } from '../../components/ui/CompletionRing';
import { calcContactCompletion } from '../../utils/contactCompletion';
import { fetchContactById, deleteContact, updateContact } from '../../services/contactService';
import { fetchClientsByContactId } from '../../services/clientService';
import { useMyPermissions, permissionAllowed } from '../../hooks/useMyPermissions';
import { ContactFormModal } from '../../components/modules/contacts/ContactFormModal';
import { MandatChoiceModal } from '../../components/modules/contacts/MandatChoiceModal';
import {
  User, Phone, Mail, Calendar, Globe, Tag, Plus,
  TrendingUp, Key, ShoppingCart, Home, Compass,
  Clock, Archive, MessageSquare, MapPin, Briefcase,
  Star, Award, Heart, Users, Link, FileText,
  Map, CreditCard, Book, Monitor, ChevronLeft, ChevronRight as ChevronRightIcon,
  Gift, CheckCircle, X, ChevronRight,
  DollarSign, Maximize2, Grid, Eye, Edit3, ExternalLink, Trash2, Share2,
  Shield, Hash, Percent, UserCheck, File, AlertCircle, Lock
} from 'react-feather';

const mandatIcons: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Vendeur: TrendingUp, Bailleur: Key, Acheteur: ShoppingCart, Locataire: Home, Voyageur: Compass,
};

const mandatColors: Record<string, { bg: string; text: string; badge: 'success' | 'warning' | 'secondary' | 'primary' }> = {
  Vendeur: { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'warning' },
  Bailleur: { bg: 'bg-accent-light', text: 'text-accent', badge: 'primary' },
  Acheteur: { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'success' },
  Locataire: { bg: 'bg-violet-50', text: 'text-violet-700', badge: 'secondary' },
  Voyageur: { bg: 'bg-rose-50', text: 'text-rose-700', badge: 'warning' },
};

interface ProspectProductData {
  categories: string;
  propertyTypes: string[];
  location?: string;
  rooms?: number;
  bedrooms?: number;
  minSurface?: number;
  maxPrice?: number;
  currency?: string;
  viewType?: string;
  viewDetail?: string;
}

const prospectProductData: Record<string, ProspectProductData> = {
  p1: {
    categories: 'Vente',
    propertyTypes: ['Appartement'],
    location: 'Marrakech',
    rooms: 3,
    bedrooms: 2,
    minSurface: 80,
    maxPrice: 1200000,
    currency: 'MAD',
    viewDetail: 'Jardin',
  },
  p3: {
    categories: 'Vente',
    propertyTypes: ['Garage / Parking'],
    location: 'Rabat',
    maxPrice: 250000,
    currency: 'MAD',
  },
};

const typeColors: Record<string, string> = {
  Particulier: 'bg-blue-50 text-blue-700',
  Professionnel: 'bg-purple-50 text-purple-700',
  'Indivision / Succession': 'bg-orange-50 text-orange-700',
};

const TYPE_CONFIG: Record<string, { accent: string; border: string; avatarBg: string; avatarRing: string }> = {
  Particulier: { accent: 'text-blue-600', border: 'border-l-blue-500', avatarBg: 'bg-blue-50', avatarRing: 'ring-blue-200' },
  Professionnel: { accent: 'text-purple-600', border: 'border-l-purple-500', avatarBg: 'bg-purple-50', avatarRing: 'ring-purple-200' },
  'Indivision / Succession': { accent: 'text-orange-600', border: 'border-l-orange-500', avatarBg: 'bg-orange-50', avatarRing: 'ring-orange-200' },
};

function SectionCard({ title, icon: Icon, children, className }: { title: string; icon: React.FC<{ size?: number; className?: string }>; children: React.ReactNode; className?: string }) {
  return (
    <Card className={'p-5 ' + (className || '')}>
      <h3 className="font-semibold text-sm flex items-center gap-2 mb-4 pb-3 border-b border-border">
        <Icon size={16} className="text-accent" />
        {title}
      </h3>
      {children}
    </Card>
  );
}

function FieldRow({ label, value, icon: Icon, href }: { label: string; value?: string | number | null; icon?: React.FC<{ size?: number; className?: string }>; href?: string }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      {Icon && <Icon size={14} className="text-text-tertiary mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-text-tertiary uppercase tracking-wider">{label}</p>
        {href ? (
          <a href={href} className="text-sm font-medium text-accent hover:underline truncate block">{value}</a>
        ) : (
          <p className="text-sm font-medium text-text-primary truncate">{value}</p>
        )}
      </div>
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">{children}</div>;
}

function MandatDetailRow({ icon: Icon, label, value }: { icon: React.FC<{ size?: number; className?: string }>; label: string; value?: string | number | null | boolean }) {
  if (value === null || value === undefined || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : typeof value === 'number' ? value.toLocaleString('fr-FR') : value;
  return (
    <div className="flex items-start gap-2 py-1">
      <Icon size={13} className="text-text-tertiary shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[10px] text-text-tertiary uppercase tracking-wider leading-none mb-0.5">{label}</p>
        <p className="text-xs font-medium text-text-primary leading-snug">{display}</p>
      </div>
    </div>
  );
}

function MandatInfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-3 border-t border-border/30">
      <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-2">{title}</p>
      {children}
    </div>
  );
}

function StatutBadge({ mandat }: { mandat: Mandat }) {
  const s = mandat.statutMandat || mandat.statutReservation || '';
  const variant = s === 'Actif' ? 'success' : ['Expire', 'Resilie', 'Termine', 'Annulee', 'Inactif'].includes(s) ? 'secondary' : 'warning';
  if (!s) return null;
  return <Badge variant={variant} size="sm">{s}</Badge>;
}

function MetierBadge({ mandat }: { mandat: Mandat }) {
  const s = mandat.statutMetier;
  if (!s) return null;
  const variant = ['En mandat', 'Confirmé', 'Payé', 'Vendu', 'Loué', 'Installé', 'En séjour'].includes(s) ? 'success' : 'warning';
  return <Badge variant={variant} size="sm">{s}</Badge>;
}

function RichMandatCard({ mandat, index, total }: { mandat: Mandat; index: number; total: number }) {
  const Icon = mandatIcons[mandat.clientType] || Tag;
  const colors = mandatColors[mandat.clientType] || mandatColors.Acheteur;
  const isVoyageur = mandat.clientType === 'Voyageur';
  const isActive = mandat.status === 'Actif';
  const isExpired = mandat.status === 'Expiré';

  const sectionTitle: Record<string, string> = {
    Vendeur: 'Mandat de vente',
    Acheteur: 'Mandat de recherche',
    Bailleur: 'Mandat de gestion',
    Locataire: 'Mandat de recherche location',
    Voyageur: 'Informations de réservation',
  };

  return (
    <div>
      <div className={`rounded-2xl border transition-all ${isExpired ? 'opacity-60 border-dashed border-border' : 'border-border/60 hover:shadow-lg hover:border-border'}`}>
        <div className={`h-1.5 rounded-t-2xl ${isActive ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : isExpired ? 'bg-gray-300' : 'bg-gradient-to-r from-amber-400 to-amber-500'}`} />
        <div className="p-5 space-y-4">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${colors.bg} ring-1 ${colors.text.replace('text-', 'ring-')}/20 flex items-center justify-center`}>
                <Icon size={18} className={colors.text} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${colors.text}`}>{mandat.clientType}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background-secondary text-text-secondary">
                    {isVoyageur ? (mandat.numeroReservation || mandat.numeroMandat) : mandat.numeroMandat}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <StatutBadge mandat={mandat} />
                  <MetierBadge mandat={mandat} />
                </div>
              </div>
            </div>
            <span className="text-[10px] text-text-tertiary font-mono">{index + 1}/{total}</span>
          </div>

          {/* Section title */}
          <div className="bg-background-secondary/40 rounded-lg px-3 py-2">
            <p className="text-xs font-medium text-text-secondary">{sectionTitle[mandat.clientType] || 'Mandat'}</p>
          </div>

          {/* Mandat Identity */}
          <MandatInfoBlock title="Informations du mandat">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {mandat.numeroMandat && <MandatDetailRow icon={Hash} label="Numéro" value={mandat.numeroMandat} />}
              {mandat.typeMandat && <MandatDetailRow icon={FileText} label="Type" value={mandat.typeMandat} />}
              {mandat.dateSignature && <MandatDetailRow icon={Calendar} label="Date signature" value={mandat.dateSignature} />}
              {mandat.startDate && <MandatDetailRow icon={Calendar} label={isVoyageur ? 'Arrivée' : 'Date début'} value={mandat.startDate} />}
              {mandat.endDate && <MandatDetailRow icon={Calendar} label={isVoyageur ? 'Départ' : 'Date expiration'} value={mandat.endDate} />}
              {mandat.conjoint && <MandatDetailRow icon={Users} label="Conjoint" value={mandat.conjoint} />}
              {mandat.societe && <MandatDetailRow icon={Briefcase} label={mandat.clientType === 'Bailleur' ? 'Société (SCI)' : 'Société'} value={mandat.societe} />}
              {mandat.agentDesigne && <MandatDetailRow icon={UserCheck} label="Agent désigné" value={mandat.agentDesigne} />}
            </div>
          </MandatInfoBlock>

          {/* Voyageur: Séjour details */}
          {isVoyageur && (
            <MandatInfoBlock title="Détails du séjour">
              {mandat.bienReserve && (
                <div className="flex items-center gap-2 bg-background-secondary/50 rounded-lg px-3 py-2 mb-2">
                  <Home size={14} className="text-text-secondary" />
                  <span className="text-text-primary font-medium text-xs">{mandat.bienReserve}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {mandat.nbNuits != null && mandat.nbNuits > 0 && <MandatDetailRow icon={Hash} label="Nuits" value={mandat.nbNuits} />}
                {mandat.nbAdultes != null && <MandatDetailRow icon={Users} label="Adultes" value={mandat.nbAdultes} />}
                {mandat.nbEnfants != null && mandat.nbEnfants > 0 && <MandatDetailRow icon={Users} label="Enfants" value={mandat.nbEnfants} />}
                {mandat.checkInHeure && <MandatDetailRow icon={Clock} label="Check-in" value={mandat.checkInHeure} />}
                {mandat.checkOutHeure && <MandatDetailRow icon={Clock} label="Check-out" value={mandat.checkOutHeure} />}
                {mandat.conditionAnnulation && <MandatDetailRow icon={Shield} label="Annulation" value={mandat.conditionAnnulation} />}
                {mandat.animauxAcceptes != null && <MandatDetailRow icon={Tag} label="Animaux" value={mandat.animauxAcceptes} />}
                {mandat.fumeur != null && <MandatDetailRow icon={Tag} label="Fumeur" value={!mandat.fumeur ? 'Non-fumeur' : 'Fumeur'} />}
              </div>
              {mandat.optionsSelectionnees && mandat.optionsSelectionnees.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {mandat.optionsSelectionnees.map((opt, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-accent-light text-accent font-medium">{opt}</span>
                  ))}
                </div>
              )}
            </MandatInfoBlock>
          )}

          {/* Voyageur: Paiement */}
          {isVoyageur && (
            <MandatInfoBlock title="Paiement">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {mandat.tarifNuit != null && <MandatDetailRow icon={DollarSign} label="€/nuit" value={mandat.tarifNuit} />}
                {mandat.montantTotalHorsOptions != null && <MandatDetailRow icon={DollarSign} label="Total hors opts" value={mandat.montantTotalHorsOptions} />}
                {mandat.montantTotalAvecOptions != null && <MandatDetailRow icon={DollarSign} label="Total avec opts" value={mandat.montantTotalAvecOptions} />}
                {mandat.acompteMontant != null && <MandatDetailRow icon={DollarSign} label="Acompte" value={mandat.acompteMontant} />}
                {mandat.soldeRestant != null && <MandatDetailRow icon={CreditCard} label="Solde restant" value={mandat.soldeRestant} />}
                {mandat.cautionMontant != null && <MandatDetailRow icon={Shield} label="Caution" value={mandat.cautionMontant} />}
              </div>
            </MandatInfoBlock>
          )}

          {/* Non-voyageur: Clause de protection */}
          {!isVoyageur && mandat.dureeProtection && (
            <MandatInfoBlock title="Clause de protection">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <MandatDetailRow icon={Shield} label="Clause" value="Activée" />
                <MandatDetailRow icon={Clock} label="Durée" value={`${mandat.dureeProtection} mois`} />
              </div>
            </MandatInfoBlock>
          )}

          {/* Non-voyageur: Rémunération */}
          {!isVoyageur && (
            <MandatInfoBlock title="Rémunération">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {mandat.typeRemuneration && <MandatDetailRow icon={DollarSign} label="Type" value={mandat.typeRemuneration} />}
                {mandat.montantRemuneration != null && (
                  <MandatDetailRow
                    icon={mandat.remunerationIsPercentage ? Percent : DollarSign}
                    label={mandat.remunerationIsPercentage ? 'Taux' : 'Montant'}
                    value={mandat.remunerationIsPercentage ? `${mandat.montantRemuneration}%` : `${mandat.montantRemuneration} MAD`}
                  />
                )}
                {mandat.conditionPaiement && <MandatDetailRow icon={CreditCard} label="Condition paiement" value={mandat.conditionPaiement} />}
                {mandat.clientType === 'Bailleur' && mandat.fraisMiseEnLocation != null && <MandatDetailRow icon={DollarSign} label="Frais mise en location" value={`${mandat.fraisMiseEnLocation} MAD`} />}
                {mandat.clientType === 'Bailleur' && mandat.fraisEtatDesLieux != null && <MandatDetailRow icon={DollarSign} label="Frais état des lieux" value={`${mandat.fraisEtatDesLieux} MAD`} />}
                {mandat.clientType === 'Bailleur' && mandat.fraisRenouvellementBail != null && <MandatDetailRow icon={DollarSign} label="Frais renouvellement" value={`${mandat.fraisRenouvellementBail} MAD`} />}
              </div>
            </MandatInfoBlock>
          )}

          {/* Mandat PDF */}
          {(mandat.mandatPdfUrl || mandat.contratPdfUrl) && (
            <div className="pt-3 border-t border-border/30">
              <a
                href={mandat.mandatPdfUrl || mandat.contratPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-accent hover:underline"
              >
                <File size={14} />
                {mandat.mandatPdfName || (isVoyageur ? 'Contrat signé (PDF)' : 'Mandat signé (PDF)')}
              </a>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function MandatsSection({ mandats, onAddMandat }: { mandats: Mandat[]; onAddMandat: () => void }) {
  const activeMandats = mandats.filter((m) => m.status === 'Actif');
  const pendingMandats = mandats.filter((m) => m.status === 'En attente');
  const expiredMandats = mandats.filter((m) => m.status === 'Expiré');
  const allMandats = [...activeMandats, ...pendingMandats, ...expiredMandats];
  const hasMultiple = allMandats.length > 1;

  const renderMandatCard = (m: Mandat, i: number) => (
    <RichMandatCard key={m.id} mandat={m} index={i} total={allMandats.length} />
  );

  return (
    <SectionCard title="MANDATS" icon={FileText}>
      <div className="space-y-5">
        {hasMultiple && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-secondary">{allMandats.length} mandat{allMandats.length > 1 ? 's' : ''}</span>
              {activeMandats.length > 0 && <span className="text-[10px] text-emerald-600 font-medium">{activeMandats.length} actif{activeMandats.length > 1 ? 's' : ''}</span>}
              {pendingMandats.length > 0 && <span className="text-[10px] text-amber-600 font-medium">{pendingMandats.length} en attente</span>}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-text-tertiary">
              <ChevronLeft size={12} />
              <span>Glisser</span>
              <ChevronRightIcon size={12} />
            </div>
          </div>
        )}

        {allMandats.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-2xl bg-background-secondary mx-auto flex items-center justify-center mb-3">
              <FileText size={20} className="text-text-tertiary" />
            </div>
            <p className="text-sm text-text-tertiary">Aucun mandat</p>
            <p className="text-xs text-text-tertiary/60 mt-1">Ajoutez un mandat pour suivre l'activité</p>
          </div>
        ) : hasMultiple ? (
          <div>
            <Carousel autoPlay={false} showControls showIndicators>
              {allMandats.map((m, i) => (
                <div key={m.id} className="px-1">{renderMandatCard(m, i)}</div>
              ))}
            </Carousel>
          </div>
        ) : (
          <div className="max-w-md">{renderMandatCard(allMandats[0], 0)}</div>
        )}

        <Button variant="ghost" className="w-full border border-dashed border-border" onClick={onAddMandat}>
          <Plus size={16} /> Ajouter un mandat
        </Button>
      </div>
    </SectionCard>
  );
}

export default function ContactPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const perms = useMyPermissions();
  const canRead = permissionAllowed(perms, 'contacts-lecture');
  const canWrite = permissionAllowed(perms, 'contacts-ecriture');
  const canDelete = permissionAllowed(perms, 'contacts-supprimer');
  const canInfo = permissionAllowed(perms, 'contacts-info-privees');
  const canExport = permissionAllowed(perms, 'contacts-general-export');
  const permsLoaded = perms !== null;
  const [contact, setContact] = useState<Contact | null>(null);
  const [linkedClients, setLinkedClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMandatChoice, setShowMandatChoice] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const loadContact = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchContactById(id);
      setContact(data);
      try {
        const clients = await fetchClientsByContactId(id);
        setLinkedClients(clients);
      } catch {
        setLinkedClients([]);
      }
    } catch {
      toast('error', 'Contact introuvable');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    if (permsLoaded && canRead && canInfo) loadContact();
  }, [loadContact, permsLoaded, canRead, canInfo]);

  if (permsLoaded && (!canRead || !canInfo)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-border/40 flex items-center justify-center mb-4">
          <Lock size={28} className="text-text-secondary" />
        </div>
        <h2 className="text-lg font-semibold">Contact verrouillé</h2>
        <p className="text-sm text-text-secondary mt-1 max-w-sm">
          Vous n'avez pas la permission d'accéder aux informations privées de ce contact. Contactez votre administrateur.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => navigate('/contacts')}>Retour aux contacts</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
      </div>
    );
  }
  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Contact non trouvé</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/contacts')}>Retour aux contacts</Button>
      </div>
    );
  }
  const activeMandats = contact.mandats.filter((m) => m.status === 'Actif');
  const pendingMandats = contact.mandats.filter((m) => m.status === 'En attente');
  const expiredMandats = contact.mandats.filter((m) => m.status === 'Expiré');
  const allDisplayMandats = [...activeMandats, ...pendingMandats, ...expiredMandats];
  const mandatClientTypes = Array.from(new Set([
    ...allDisplayMandats.map((m) => m.clientType),
    ...linkedClients.map((c) => c.clientType || c.type),
  ]));
  const typeColor = typeColors[contact.type] || 'bg-background-secondary text-text-secondary';
  const typeConfig = TYPE_CONFIG[contact.type] || TYPE_CONFIG['Particulier'];
  const completion = calcContactCompletion(contact);
  const productData = contact.originalProspectId ? prospectProductData[contact.originalProspectId] : undefined;
  return (
    <div className="space-y-6">
      <BackLink to="/contacts" />

      {/* Header */}
      <Card className={`p-5 border-l-[3px] ${typeConfig.border}`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl ${typeConfig.avatarBg} ring-2 ${typeConfig.avatarRing} flex items-center justify-center`}>
              <User size={24} className={typeConfig.accent} />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-text-primary">{contact.civility} {contact.firstName} {contact.lastName}</h1>
                <span className={'text-xs font-semibold px-2.5 py-1 rounded-full ' + typeColor}>{contact.type}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {mandatClientTypes.map((ct) => {
                  const colors = mandatColors[ct];
                  return (
                    <span key={ct} className={'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border ' + colors.bg + ' ' + colors.text + ' border-current/10'}>
                      {createElement(mandatIcons[ct] || Tag, { size: 12 })}
                      {ct}
                    </span>
                  );
                })}
                {allDisplayMandats.length > 0 && (
                  <span className="text-[10px] text-text-tertiary">
                    {allDisplayMandats.length} mandat{allDisplayMandats.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CompletionRing percent={completion} size={52} strokeWidth={4} />
            <Button
              variant={liked ? 'default' : 'outline'}
              onClick={() => setLiked(!liked)}
              className={liked ? 'bg-red-50 text-red-500 hover:bg-red-100 border-red-200' : ''}
            >
              <Heart size={16} className={liked ? 'fill-current' : ''} />
            </Button>
            {canWrite && <Button variant="outline" onClick={() => setShowEditForm(true)}><Edit3 size={16} /> Modifier</Button>}
            {canExport && <Button variant="outline"><Share2 size={16} /> Partager</Button>}
            {canDelete && (
              <Button variant="outline" className="text-error hover:bg-error/5 border-error/20 hover:border-error/40" onClick={() => {
                if (!id) return;
                setShowDeleteDialog(true);
                setDeleteConfirm('');
              }}><Trash2 size={16} /></Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main grid: sections 1-5 left, section 6 right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Section 1: Général */}
          <SectionCard title="GÉNÉRAL" icon={Star}>
            <div className="flex gap-4">
              {(['Particulier', 'Professionnel', 'Indivision / Succession'] as const).map((t) => (
                <div key={t} className={'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ' + (contact.type === t ? 'border-accent bg-accent-light text-accent font-medium' : 'border-border text-text-secondary')}>
                  <div className={'w-4 h-4 rounded-full border-2 flex items-center justify-center ' + (contact.type === t ? 'border-accent' : 'border-text-tertiary')}>
                    {contact.type === t && <div className="w-2 h-2 rounded-full bg-accent" />}
                  </div>
                  {t}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Section 2: Identité complète */}
          <SectionCard title="IDENTITÉ COMPLÈTE" icon={User}>
            <FieldGrid>
              <FieldRow label="Civilité" value={contact.civility} icon={User} />
              <FieldRow label="Nom de famille" value={contact.lastName} icon={User} />
              <FieldRow label="Prénom" value={contact.firstName} icon={User} />
              <FieldRow label="Email principal" value={contact.emailPrincipal} icon={Mail} href={'mailto:' + contact.emailPrincipal} />
              <FieldRow label="Email secondaire" value={contact.emailSecondaire} icon={Mail} href={contact.emailSecondaire ? 'mailto:' + contact.emailSecondaire : undefined} />
              <FieldRow label="Mobile" value={contact.mobile} icon={Phone} href={'tel:' + contact.mobile} />
              <FieldRow label="Téléphone fixe" value={contact.telephoneFixe} icon={Phone} href={contact.telephoneFixe ? 'tel:' + contact.telephoneFixe : undefined} />
              <FieldRow label="Profession" value={contact.profession} icon={Briefcase} />
              <FieldRow label="Lieu de naissance" value={contact.lieuNaissance} icon={MapPin} />
              <FieldRow label="Date de naissance" value={contact.dateNaissance} icon={Calendar} />
              <FieldRow label="Nationalité" value={contact.nationalite} icon={Globe} />
              <FieldRow label="Numéro fiscal" value={contact.numeroFiscal} icon={CreditCard} />
            </FieldGrid>
          </SectionCard>

          {/* Section 3: Adresse */}
          <SectionCard title="ADRESSE" icon={MapPin}>
            <FieldGrid>
              <FieldRow label="Adresse" value={contact.adresse} icon={Map} />
              <FieldRow label="Adresse (2)" value={contact.adresse2} icon={Map} />
              <FieldRow label="Code postal" value={contact.codePostal} icon={Map} />
              <FieldRow label="Ville" value={contact.ville} icon={MapPin} />
              <FieldRow label="Pays" value={contact.pays} icon={Globe} />
            </FieldGrid>
          </SectionCard>

          {/* Section 4: Préférences */}
          <SectionCard title="PRÉFÉRENCES" icon={Heart}>
            <FieldGrid>
              <FieldRow label="Moyen de contact préféré" value={contact.moyenContactPrefere} icon={MessageSquare} />
              <FieldRow label="Langue(s) parlée(s)" value={contact.langueParlee.join(', ')} icon={Globe} />
              <FieldRow label="Devise préférée" value={contact.devisePreferee} icon={CreditCard} />
            </FieldGrid>
          </SectionCard>

          {/* Section 5: Critères complémentaires */}
          <SectionCard title="CRITÈRES COMPLÉMENTAIRES" icon={Award}>
            <FieldGrid>
              <FieldRow label="Situation familiale" value={contact.situationFamiliale} icon={Users} />
              <FieldRow label="Nombre d'enfants" value={contact.nombreEnfants} icon={Heart} />
              <FieldRow label="Prescripteur" value={contact.prescripteur} icon={Gift} />
              <FieldRow label="Régime matrimonial" value={contact.regimeMatrimonial} icon={Book} />
              <FieldRow label="Site internet personnel" value={contact.siteInternet} icon={Monitor} href={contact.siteInternet ? 'http://' + contact.siteInternet : undefined} />
            </FieldGrid>
          </SectionCard>

        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Section 6: Interne */}
          <SectionCard title="INTERNE" icon={FileText}>
            <FieldRow label="Commentaire privé" value={contact.commentairePrive} />
            {contact.originalProspectId && (
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-[11px] text-text-tertiary uppercase tracking-wider mb-1">Origine</p>
                <a href={'/prospects/' + contact.originalProspectId} className="text-sm text-accent hover:underline flex items-center gap-1 font-medium">
                  Voir le prospect d'origine <ChevronRight size={14} />
                </a>
              </div>
            )}
            {!contact.originalProspectId && (
              <p className="text-xs text-text-tertiary italic mt-2">Créé directement (pas de prospect d'origine)</p>
            )}
            <div className="mt-4 pt-3 border-t border-border space-y-1">
              <p className="text-[11px] text-text-tertiary">Créé le {new Date(contact.createdAt).toLocaleDateString('fr-FR')}</p>
              <p className="text-[11px] text-text-tertiary">Modifié le {new Date(contact.updatedAt).toLocaleDateString('fr-FR')}</p>
            </div>
          </SectionCard>

          {/* Mandats */}
          <MandatsSection mandats={allDisplayMandats} onAddMandat={() => setShowMandatChoice(true)} />

          {productData && <SectionCard title="PRODUIT" icon={Home}>
            <FieldGrid>
              <FieldRow label="Catégorie" value={productData.categories} icon={Tag} />
              <FieldRow label="Types de bien" value={productData.propertyTypes.join(', ')} icon={Home} />
            </FieldGrid>
          </SectionCard>}
          {productData && <SectionCard title="CRITÈRES" icon={MapPin}>
            <FieldGrid>
              <FieldRow label="Localisation" value={productData.location} icon={MapPin} />
              <FieldRow label="Pièces" value={productData.rooms} icon={Grid} />
              <FieldRow label="Chambres" value={productData.bedrooms} icon={Grid} />
              <FieldRow label="Surface min" value={productData.minSurface ? productData.minSurface + ' m²' : null} icon={Maximize2} />
              <FieldRow label="Budget max" value={productData.maxPrice ? productData.maxPrice.toLocaleString() + ' ' + productData.currency : null} icon={DollarSign} />
              <FieldRow label="Vue" value={[productData.viewType, productData.viewDetail].filter(Boolean).join(' / ')} icon={Eye} />
            </FieldGrid>
          </SectionCard>}

        </div>
      </div>

      {showEditForm && contact && (
        <ContactFormModal
          onClose={() => setShowEditForm(false)}
          onSubmit={async (data) => {
            try {
              const updated = await updateContact(contact.id, data);
              setContact(updated);
              setShowEditForm(false);
              toast('success', 'Contact modifié avec succès');
            } catch {
              toast('error', 'Erreur lors de la modification');
            }
          }}
          contact={contact}
        />
      )}

      {showMandatChoice && contact && (
        <MandatChoiceModal
          contact={contact}
          onClose={() => setShowMandatChoice(false)}
        />
      )}

      <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer le contact" size="sm">
        {contact && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Voulez-vous vraiment supprimer <span className="font-semibold text-text-primary">{contact.firstName} {contact.lastName}</span> ?
            </p>
            <p className="text-xs text-text-secondary/70">Cette action est irréversible.</p>
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
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
              <Button variant="danger" disabled={deleteConfirm !== 'SUPPRIMER'} onClick={async () => {
                if (!id || deleteConfirm !== 'SUPPRIMER') return;
                try {
                  await deleteContact(id);
                  toast('success', 'Contact supprimé');
                  navigate('/contacts');
                } catch { toast('error', 'Erreur lors de la suppression'); }
                setShowDeleteDialog(false);
                setDeleteConfirm('');
              }}>
                Confirmer la suppression
              </Button>
            </div>
          </div>
        )}
      </Dialog>

    </div>
  );
}
