import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, createElement } from 'react';
import Card from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { BackLink } from '../../../components/ui/BackLink';
import { Select } from '../../../components/ui/Select';
import { Carousel } from '../../../components/ui/Carousel';
import { CompletionRing } from '../../../components/ui/CompletionRing';
import { calcContactCompletion } from '../../../utils/contactCompletion';
import { useToast } from '../../../components/ui/Toast';
import { api } from '../../../services/api';
import { fetchContactById, deleteContact, updateContact, duplicateContact } from '../../../services/contactService';
import { fetchClientsByContactId } from '../../../services/clientService';
import { ContactFormModal } from '../../../components/modules/contacts/ContactFormModal';
import { MandatChoiceModal } from '../../../components/modules/contacts/MandatChoiceModal';
import type { Contact, Mandat } from '../../../types/contact';
import {
  User, Phone, Mail, Calendar, Globe, Tag, Plus,
  TrendingUp, Key, ShoppingCart, Home, Compass,
  Clock, Archive, MessageSquare, MapPin, Briefcase,
  Star, Award, Heart, Users, FileText,
  Map, CreditCard, Book, Monitor, ChevronLeft, ChevronRight as ChevronRightIcon,
  Gift, ChevronRight, DollarSign, Maximize2, Grid, Eye, Edit3,
  Shield, Hash, Percent, UserCheck, File, Trash2, Repeat, Copy,
  AlertTriangle
} from 'react-feather';

const COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-pink-500'];

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

          <div className="bg-background-secondary/40 rounded-lg px-3 py-2">
            <p className="text-xs font-medium text-text-secondary">{sectionTitle[mandat.clientType] || 'Mandat'}</p>
          </div>

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

          {!isVoyageur && mandat.dureeProtection && (
            <MandatInfoBlock title="Clause de protection">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <MandatDetailRow icon={Shield} label="Clause" value="Activée" />
                <MandatDetailRow icon={Clock} label="Durée" value={`${mandat.dureeProtection} mois`} />
              </div>
            </MandatInfoBlock>
          )}

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

export default function AdminContactDetailPage() {
  const { id, adminId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [contact, setContact] = useState<Contact | null>(null);
  const [linkedClients, setLinkedClients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMandatChoice, setShowMandatChoice] = useState(false);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [reassignNote, setReassignNote] = useState('');

  const loadContact = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [c, u] = await Promise.all([
        fetchContactById(id),
        api.get<any[]>('/admin/users'),
      ]);
      setContact(c);
      setUsers(Array.isArray(u) ? u : []);
      try {
        const clients = await fetchClientsByContactId(id);
        setLinkedClients(clients);
      } catch {
        setLinkedClients([]);
      }
    } catch {
      setContact(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadContact(); }, [loadContact]);

  const findPerson = (agentId: string | number | null | undefined) => {
    if (!agentId) return undefined;
    const aid = String(agentId);
    const user = users.find(u => String(u.id) === aid && u.status !== 'supprimé');
    if (user) {
      const initials = `${(user.first_name || '')[0]}${(user.last_name || '')[0]}`.toUpperCase() || '?';
      const color = COLORS[Math.abs(Number(user.id) || user.id.length) % COLORS.length];
      return { name: `${user.first_name || ''} ${user.last_name || ''}`.trim(), initials, color, role: user.role, position: user.position };
    }
    return undefined;
  };

  const getAgentName = (agentId: string | number | null | undefined) => {
    if (!agentId) return 'Non assigne';
    const person = findPerson(agentId);
    return person ? person.name : 'Ancien agent';
  };

  const getAgentInitials = (agentId: string | number | null | undefined) => {
    if (!agentId) return 'NA';
    const person = findPerson(agentId);
    return person ? person.initials : String(agentId).slice(0, 2).toUpperCase();
  };

  const getAgentColor = (agentId: string | number | null | undefined) => {
    if (!agentId) return 'bg-gray-400';
    const person = findPerson(agentId);
    return person ? person.color : 'bg-violet-400';
  };

  const getRoleBadge = (person?: { role?: string; position?: string }) => {
    if (!person) return null;
    if (person.role === 'agent') {
      return { label: person.position || 'Agent', cls: 'bg-emerald-100 text-emerald-700' };
    }
    if (person.role === 'gerant') {
      return { label: 'Gérant', cls: 'bg-orange-100 text-orange-700' };
    }
    if (person.role === 'admin') {
      return { label: 'Admin', cls: 'bg-indigo-100 text-indigo-700' };
    }
    return null;
  };

  const handleReassign = async () => {
    if (!contact || !selectedAgent) return;
    try {
      await updateContact(String(contact.id), { agentId: selectedAgent } as any);
      setContact({ ...contact, agentId: selectedAgent });
      toast('success', 'Contact réaffecté avec succès');
    } catch (err: any) {
      toast('error', err.message || 'Erreur lors de la réaffectation');
    }
    setShowReassignDialog(false);
    setSelectedAgent('');
    setReassignNote('');
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'SUPPRIMER' || !contact) return;
    try {
      await deleteContact(String(contact.id));
      toast('success', `${contact.firstName} ${contact.lastName} supprimé`);
      navigate(`/admin/${adminId}/contacts`);
    } catch (err: any) {
      toast('error', err.message || 'Erreur lors de la suppression');
    }
    setShowDeleteDialog(false);
  };

  const handleDuplicate = async () => {
    if (!contact) return;
    try {
      await duplicateContact(String(contact.id));
      toast('success', `${contact.firstName} ${contact.lastName} dupliqué`);
      loadContact();
    } catch (err: any) {
      toast('error', err.message || 'Erreur lors de la duplication');
    }
  };

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
        <Button variant="ghost" className="mt-4" onClick={() => navigate(`/admin/${adminId}/contacts`)}>Retour aux contacts</Button>
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
  const isCopy = !!contact.originalContactId;
  const originalId = contact.originalContactId || contact.id;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <BackLink to={`/admin/${adminId}/contacts`} />

      {/* Admin actions bar */}
      <Card className="p-3 border-accent/20 bg-accent/5">
        <div className="flex items-center gap-2 flex-wrap">
          <Shield size={14} className="text-accent" />
          <span className="text-xs font-medium text-accent mr-2">Actions Administrateur :</span>
          <Button variant="outline" size="sm" icon={<Repeat size={12} />}
            onClick={() => { setSelectedAgent(String(contact.agentId || '')); setShowReassignDialog(true); }}>
            Réaffecter
          </Button>
          <Button variant="outline" size="sm" icon={<Copy size={12} />}
            onClick={handleDuplicate}>
            Dupliquer
          </Button>
          <Button variant="ghost" size="sm" icon={<Trash2 size={12} />}
            className="text-error hover:bg-error/5"
            onClick={() => { setDeleteConfirm(''); setDeleteReason(''); setShowDeleteDialog(true); }}>
            Supprimer
          </Button>
        </div>
      </Card>

      {/* Header — same as agent */}
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
                {isCopy && (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wider bg-orange-100 text-orange-700">Copie</span>
                )}
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
            <Button variant="outline" onClick={() => setShowEditForm(true)}><Edit3 size={16} /> Modifier</Button>
            <Button variant="outline" className="text-error hover:bg-error/5 border-error/20 hover:border-error/40" onClick={() => {
              if (!id) return;
              setShowDeleteDialog(true);
              setDeleteConfirm('');
              setDeleteReason('');
            }}><Trash2 size={16} /></Button>
          </div>
        </div>
      </Card>

      {/* Responsible person bar */}
      {contact.agentId && (() => {
        const person = findPerson(contact.agentId);
        return (
          <Card className="p-3 border-accent/20 bg-accent/5">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full ${getAgentColor(contact.agentId)} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-bold text-xs">{getAgentInitials(contact.agentId)}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-accent font-medium uppercase tracking-wider">Responsable :</span>
                <span className="text-sm font-medium text-text-primary">{getAgentName(contact.agentId)}</span>
                {(() => {
                  const badge = getRoleBadge(person);
                  return badge ? (
                    <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wider ${badge.cls}`}>
                      {badge.label}
                    </span>
                  ) : null;
                })()}
              </div>
              <div className="ml-auto">
                <Button variant="ghost" size="sm" icon={<Repeat size={12} />}
                  onClick={() => { setSelectedAgent(String(contact.agentId || '')); setShowReassignDialog(true); }}>
                  Changer
                </Button>
              </div>
            </div>
          </Card>
        );
      })()}

      {/* Main grid: same layout as agent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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

          <SectionCard title="ADRESSE" icon={MapPin}>
            <FieldGrid>
              <FieldRow label="Adresse" value={contact.adresse} icon={Map} />
              <FieldRow label="Adresse (2)" value={contact.adresse2} icon={Map} />
              <FieldRow label="Code postal" value={contact.codePostal} icon={Map} />
              <FieldRow label="Ville" value={contact.ville} icon={MapPin} />
              <FieldRow label="Pays" value={contact.pays} icon={Globe} />
            </FieldGrid>
          </SectionCard>

          <SectionCard title="PRÉFÉRENCES" icon={Heart}>
            <FieldGrid>
              <FieldRow label="Moyen de contact préféré" value={contact.moyenContactPrefere} icon={MessageSquare} />
              <FieldRow label="Langue(s) parlée(s)" value={contact.langueParlee.join(', ')} icon={Globe} />
              <FieldRow label="Devise préférée" value={contact.devisePreferee} icon={CreditCard} />
            </FieldGrid>
          </SectionCard>

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
          <SectionCard title="INTERNE" icon={FileText}>
            <FieldRow label="Commentaire privé" value={contact.commentairePrive} />
            {contact.originalProspectId && (
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-[11px] text-text-tertiary uppercase tracking-wider mb-1">Origine</p>
                <a href={`/admin/${adminId}/prospects/${contact.originalProspectId}`} className="text-sm text-accent hover:underline flex items-center gap-1 font-medium">
                  Voir le prospect d'origine <ChevronRight size={14} />
                </a>
              </div>
            )}
            {isCopy && (
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-[11px] text-text-tertiary uppercase tracking-wider mb-1">Copie de</p>
                <a href={`/admin/${adminId}/contacts/${originalId}`} className="text-sm text-accent hover:underline flex items-center gap-1 font-medium">
                  Voir le contact original <ChevronRight size={14} />
                </a>
              </div>
            )}
            {!contact.originalProspectId && !isCopy && (
              <p className="text-xs text-text-tertiary italic mt-2">Créé directement (pas de prospect d'origine)</p>
            )}
            <div className="mt-4 pt-3 border-t border-border space-y-1">
              <p className="text-[11px] text-text-tertiary">Créé le {new Date(contact.createdAt).toLocaleDateString('fr-FR')}</p>
              <p className="text-[11px] text-text-tertiary">Modifié le {new Date(contact.updatedAt).toLocaleDateString('fr-FR')}</p>
            </div>
          </SectionCard>

          {/* Mandats — using same rich section as agent */}
          <MandatsSection mandats={allDisplayMandats} onAddMandat={() => setShowMandatChoice(true)} />
        </div>
      </div>

      {/* Edit Modal */}
      {showEditForm && contact && (
        <ContactFormModal
          contact={contact}
          onClose={() => setShowEditForm(false)}
          onSubmit={async (data) => {
            try {
              await updateContact(contact.id, data);
              toast('success', 'Contact modifié avec succès');
              loadContact();
            } catch {
              toast('error', 'Erreur lors de la modification');
            }
            setShowEditForm(false);
          }}
        />
      )}

      {showMandatChoice && contact && (
        <MandatChoiceModal
          contact={contact}
          onClose={() => setShowMandatChoice(false)}
        />
      )}

      {/* Reassign Dialog */}
      <Dialog isOpen={showReassignDialog} onClose={() => setShowReassignDialog(false)} title="Réaffecter un contact" size="lg">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <p className="text-sm font-medium">{contact.civility} {contact.firstName} {contact.lastName}</p>
            <p className="text-xs text-text-secondary">{contact.emailPrincipal} · {contact.mobile}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1.5">Responsable actuel :</p>
            <div className="flex items-center gap-2 text-sm">
              {contact.agentId ? (
                <>
                  <div className={`w-6 h-6 rounded-full ${getAgentColor(contact.agentId)} flex items-center justify-center text-white text-[10px] font-bold`}>
                    {getAgentInitials(contact.agentId)}
                  </div>
                  <span>{getAgentName(contact.agentId)}</span>
                  {(() => {
                    const badge = getRoleBadge(findPerson(contact.agentId));
                    return badge ? (
                      <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wider ${badge.cls}`}>
                        {badge.label}
                      </span>
                    ) : null;
                  })()}
                </>
              ) : (
                <span className="text-text-secondary italic">Non assigné</span>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nouvel responsable</label>
            <Select
              placeholder="Sélectionner un responsable"
              value={selectedAgent}
              onValueChange={(v) => setSelectedAgent(v)}
              options={[
                { value: '', label: 'Non assigné' },
                ...users.filter((u: any) => u.status !== 'supprimé').map((u: any) => ({
                  value: String(u.id),
                  label: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
                })),
              ]}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Note pour le responsable</label>
            <textarea
              className="w-full h-20 px-3 py-2 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
              placeholder="Je vous confie ce contact pour le suivi..."
              value={reassignNote}
              onChange={(e) => setReassignNote(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowReassignDialog(false)}>Annuler</Button>
            <Button variant="default" onClick={handleReassign} disabled={!selectedAgent}>Réaffecter</Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer le contact" size="lg">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <p className="text-sm font-medium">{contact.civility} {contact.firstName} {contact.lastName}</p>
            <p className="text-xs text-text-secondary">{contact.emailPrincipal} · {contact.mobile}</p>
          </div>
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-700 space-y-1">
                <p className="font-medium">Attention :</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Cette action est IRRÉVERSIBLE</li>
                  <li>Tous les documents associés seront supprimés</li>
                  {!isCopy && <li>Toutes les copies de ce contact seront supprimées</li>}
                  <li>L'historique du contact sera effacé</li>
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
              <option value="">Sélectionner un motif</option>
              <option value="doublon">Erreur de saisie - Doublon</option>
              <option value="converti">Déjà converti en prospect/client</option>
              <option value="retire">Contact retiré</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleteConfirm !== 'SUPPRIMER'}>
              Confirmer la suppression
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
