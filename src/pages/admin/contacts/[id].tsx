import { useParams, useNavigate } from 'react-router-dom';
import { useState, createElement } from 'react';
import Card from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { BackLink } from '../../../components/ui/BackLink';
import type { Mandat } from '../../../types/contact';
import {
  User, Phone, Mail, Calendar, Globe, MapPin, Tag,
  MessageSquare, X, ChevronRight, Repeat, Trash2,
  AlertTriangle, Shield, FileText, Clock, Archive, Plus,
  Home, Grid, Maximize2, DollarSign, Eye, Briefcase,
  Star, Heart, Award, Users, Gift, Book, Monitor,
  CreditCard, Map, TrendingUp, Key, ShoppingCart, Compass
} from 'react-feather';
import { AGENTS, getContactById } from './mockData';

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

function MandatCard({ mandat }: { mandat: Mandat }) {
  const Icon = mandatIcons[mandat.clientType] || Tag;
  const colors = mandatColors[mandat.clientType] || mandatColors.Acheteur;
  return (
    <div className={'rounded-xl border p-5 transition-shadow hover:shadow-card-hover ' + (mandat.status === 'Expiré' ? 'opacity-70 border-dashed' : 'border-border')}>
      <div className="flex items-center justify-between mb-4">
        <div className={'flex items-center gap-2.5 ' + colors.bg + ' px-3 py-1.5 rounded-lg'}>
          <Icon size={18} className={colors.text} />
          <span className={'font-semibold text-sm ' + colors.text}>{mandat.clientType}</span>
        </div>
        <Badge variant={mandat.status === 'Actif' ? 'success' : 'secondary'}>{mandat.status}</Badge>
      </div>
      <div className="space-y-2 text-sm">
        {mandat.propertyType && (
          <div className="flex items-center gap-2 text-text-secondary">
            <Home size={14} />
            <span>{mandat.propertyType}</span>
          </div>
        )}
        {mandat.area && (
          <div className="flex items-center gap-2 text-text-secondary">
            <MapPin size={14} />
            <span>{mandat.area}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-text-secondary">
          <Calendar size={14} />
          <span>{mandat.startDate + (mandat.endDate ? ' - ' + mandat.endDate : '')}</span>
        </div>
        {mandat.notes && (
          <div className="flex items-start gap-2 text-text-secondary mt-2 pt-2 border-t border-border">
            <MessageSquare size={14} className="mt-0.5 shrink-0" />
            <span>{mandat.notes}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function MandatSection({ title, icon: Icon, mandats, emptyText }: { title: string; icon: React.FC<{ size?: number; className?: string }>; mandats: Mandat[]; emptyText: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} className="text-text-secondary" />
        <h3 className="font-semibold text-text-primary">{title}</h3>
        <span className="text-xs text-text-tertiary ml-1">({mandats.length})</span>
      </div>
      {mandats.length === 0 ? (
        <p className="text-sm text-text-tertiary italic py-4">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mandats.map((m) => <MandatCard key={m.id} mandat={m} />)}
        </div>
      )}
    </div>
  );
}

export default function AdminContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [reassignNote, setReassignNote] = useState('');
  const [sendNotification, setSendNotification] = useState(false);

  const contact = getContactById(id || '');

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

  if (!contact) {
    return (
      <div className="space-y-6 animate-fade-in">
        <BackLink to="/admin/contacts" />
        <div className="text-center py-12">
          <p className="text-text/60">Contact non trouve</p>
        </div>
      </div>
    );
  }

  const typeColor = typeColors[contact.type] || 'bg-background-secondary text-text-secondary';
  const activeMandats = contact.mandats.filter((m) => m.status === 'Actif');
  const expiredMandats = contact.mandats.filter((m) => m.status === 'Expiré');

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <BackLink to="/admin/contacts" />

      {/* Admin actions bar */}
      <Card className="p-3 border-accent/20 bg-accent/5">
        <div className="flex items-center gap-2 flex-wrap">
          <Shield size={14} className="text-accent" />
          <span className="text-xs font-medium text-accent mr-2">Actions Administrateur :</span>
          <Button variant="outline" size="sm" icon={<Repeat size={12} />}
            onClick={() => { setSelectedAgent(contact.agentId || ''); setShowReassignDialog(true); }}>
            Reaffecter
          </Button>
          <Button variant="ghost" size="sm" icon={<Trash2 size={12} />}
            className="text-error hover:bg-error/5"
            onClick={() => { setDeleteConfirm(''); setDeleteReason(''); setShowDeleteDialog(true); }}>
            Supprimer
          </Button>
        </div>
      </Card>

      {/* Header */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-14 h-14 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0">
              <User size={22} className="text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-lg font-semibold">{contact.civility} {contact.firstName} {contact.lastName}</h1>
                <span className={'text-xs font-semibold px-2.5 py-1 rounded-full ' + typeColor}>{contact.type}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                {contact.mandats.map((m) => {
                  const colors = mandatColors[m.clientType];
                  return (
                    <span key={m.id} className={'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ' + colors.bg + ' ' + colors.text}>
                      {createElement(mandatIcons[m.clientType] || Tag, { size: 12 })}
                      {m.clientType}
                    </span>
                  );
                })}
              </div>
              <p className="text-xs text-text-secondary mt-1">Cree le {new Date(contact.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          {/* Agent card */}
          <div className="p-3 rounded-xl border border-accent/20 bg-accent/[0.03] min-w-[200px]">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${getAgentColor(contact.agentId)} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-bold text-sm">{getAgentInitials(contact.agentId)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Agent</p>
                <p className="text-sm font-medium">{getAgentName(contact.agentId)}</p>
              </div>
              <Button variant="ghost" size="sm" icon={<Repeat size={12} />}
                onClick={() => { setSelectedAgent(contact.agentId || ''); setShowReassignDialog(true); }}>
                Changer
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Main detail sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* General */}
          <SectionCard title="GENERAL" icon={Star}>
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

          {/* Identite complete */}
          <SectionCard title="IDENTITE COMPLETE" icon={User}>
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

          {/* Adresse */}
          <SectionCard title="ADRESSE" icon={MapPin}>
            <FieldGrid>
              <FieldRow label="Adresse" value={contact.adresse} icon={Map} />
              <FieldRow label="Adresse (2)" value={contact.adresse2} icon={Map} />
              <FieldRow label="Code postal" value={contact.codePostal} icon={Map} />
              <FieldRow label="Ville" value={contact.ville} icon={MapPin} />
              <FieldRow label="Pays" value={contact.pays} icon={Globe} />
            </FieldGrid>
          </SectionCard>

          {/* Preferences */}
          <SectionCard title="PREFERENCES" icon={Heart}>
            <FieldGrid>
              <FieldRow label="Moyen de contact prefere" value={contact.moyenContactPrefere} icon={MessageSquare} />
              <FieldRow label="Langue(s) parlee(s)" value={contact.langueParlee.join(', ')} icon={Globe} />
              <FieldRow label="Devise preferee" value={contact.devisePreferee} icon={CreditCard} />
            </FieldGrid>
          </SectionCard>

          {/* Criteres complementaires */}
          <SectionCard title="CRITERES COMPLEMENTAIRES" icon={Award}>
            <FieldGrid>
              <FieldRow label="Situation familiale" value={contact.situationFamiliale} icon={Users} />
              <FieldRow label="Nombre d'enfants" value={contact.nombreEnfants} icon={Heart} />
              <FieldRow label="Prescripteur" value={contact.prescripteur} icon={Gift} />
              <FieldRow label="Regime matrimonial" value={contact.regimeMatrimonial} icon={Book} />
              <FieldRow label="Site internet personnel" value={contact.siteInternet} icon={Monitor} href={contact.siteInternet ? 'http://' + contact.siteInternet : undefined} />
            </FieldGrid>
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Interne */}
          <SectionCard title="INTERNE" icon={FileText}>
            <FieldRow label="Commentaire prive" value={contact.commentairePrive} />
            {contact.originalProspectId && (
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-[11px] text-text-tertiary uppercase tracking-wider mb-1">Origine</p>
                <a href={'/prospects/' + contact.originalProspectId} className="text-sm text-accent hover:underline flex items-center gap-1 font-medium">
                  Voir le prospect d'origine <ChevronRight size={14} />
                </a>
              </div>
            )}
            {!contact.originalProspectId && (
              <p className="text-xs text-text-tertiary italic mt-2">Cree directement (pas de prospect d'origine)</p>
            )}
            <div className="mt-4 pt-3 border-t border-border space-y-1">
              <p className="text-[11px] text-text-tertiary">Cree le {new Date(contact.createdAt).toLocaleDateString('fr-FR')}</p>
              <p className="text-[11px] text-text-tertiary">Modifie le {new Date(contact.updatedAt).toLocaleDateString('fr-FR')}</p>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Mandats */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-5">
          <FileText size={18} className="text-accent" />
          <h2 className="font-semibold">MANDATS</h2>
        </div>
        <div className="space-y-8">
          <MandatSection title="Mandats actifs" icon={Clock} mandats={activeMandats} emptyText="Aucun mandat actif" />
          <MandatSection title="Mandats expires" icon={Archive} mandats={expiredMandats} emptyText="Aucun mandat expire" />
          <Button variant="ghost" className="w-full border border-dashed border-border">
            <Plus size={16} /> Ajouter un mandat
          </Button>
        </div>
      </Card>

      {/* Reassign Dialog */}
      <Dialog isOpen={showReassignDialog} onClose={() => setShowReassignDialog(false)} title="Reaffecter un contact" size="lg">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <p className="text-sm font-medium">{contact.civility} {contact.firstName} {contact.lastName}</p>
            <p className="text-xs text-text-secondary">{contact.emailPrincipal} · {contact.mobile}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1.5">Agent actuel :</p>
            <div className="flex items-center gap-2 text-sm">
              {contact.agentId ? (
                <>
                  <div className={`w-6 h-6 rounded-full ${getAgentColor(contact.agentId)} flex items-center justify-center text-white text-[10px] font-bold`}>
                    {getAgentInitials(contact.agentId)}
                  </div>
                  <span>{getAgentName(contact.agentId)}</span>
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
          <div>
            <label className="text-sm font-medium mb-1.5 block">Note pour l'agent</label>
            <textarea
              className="w-full h-20 px-3 py-2 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
              placeholder="Je vous confie ce contact pour le suivi..."
              value={reassignNote}
              onChange={(e) => setReassignNote(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-border text-accent focus:ring-accent/20"
              checked={sendNotification}
              onChange={(e) => setSendNotification(e.target.checked)}
            />
            Envoyer une notification a l'agent
          </label>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowReassignDialog(false)}>Annuler</Button>
            <Button variant="default" onClick={() => { setShowReassignDialog(false); setSelectedAgent(''); }} disabled={!selectedAgent}>Reaffecter</Button>
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
                  <li>Cette action est IRREVERSIBLE</li>
                  <li>Tous les documents associes seront supprimes</li>
                  <li>L'historique du contact sera efface</li>
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
              <option value="converti">Deja converti en prospect/client</option>
              <option value="retire">Contact retire</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
            <Button variant="danger" onClick={() => { setShowDeleteDialog(false); setDeleteConfirm(''); }} disabled={deleteConfirm !== 'SUPPRIMER'}>
              Confirmer la suppression
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
