import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Card from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { BackLink } from '../../../components/ui/BackLink';
import {
  User, Phone, Mail, MapPin, Calendar, Globe, MessageSquare,
  Home, Tag, DollarSign, Maximize2, Grid, Eye, Repeat, Trash2,
  RefreshCw, AlertTriangle, Shield
} from 'react-feather';
import { AGENTS, getProspectById } from './mockData';

const STATUS_COLORS: Record<string, string> = {
  Nouveau: 'bg-blue-50 text-blue-700 border-blue-200',
  'Contacté': 'bg-amber-50 text-amber-700 border-amber-200',
  'Qualifié': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'En attente': 'bg-orange-50 text-orange-700 border-orange-200',
  Perdu: 'bg-red-50 text-red-700 border-red-200',
  Converti: 'bg-violet-50 text-violet-700 border-violet-200',
};

const STATUS_OPTIONS = [
  { value: 'Nouveau', label: 'Nouveau' },
  { value: 'Contacté', label: 'Contacte' },
  { value: 'Qualifié', label: 'Qualifie' },
  { value: 'En attente', label: 'En attente' },
  { value: 'Perdu', label: 'Perdu' },
  { value: 'Converti', label: 'Converti' },
];

export default function AdminProspectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const prospect = getProspectById(id || '');

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

  if (!prospect) {
    return (
      <div className="space-y-6 animate-fade-in">
        <BackLink to="/admin/prospects" />
        <div className="text-center py-12">
          <p className="text-text/60">Prospect non trouve</p>
        </div>
      </div>
    );
  }

  const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number | undefined | null }) => (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/20 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-text-secondary flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="text-sm font-medium truncate">{value ?? '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <BackLink to="/admin/prospects" />

      {/* Admin actions bar */}
      <Card className="p-3 border-accent/20 bg-accent/5">
        <div className="flex items-center gap-2 flex-wrap">
          <Shield size={14} className="text-accent" />
          <span className="text-xs font-medium text-accent mr-2">Actions Administrateur :</span>
          <Button variant="outline" size="sm" icon={<Repeat size={12} />}
            onClick={() => { setSelectedAgent(prospect.agentId || ''); setShowReassignDialog(true); }}>
            Reaffecter
          </Button>
          <Button variant="outline" size="sm" icon={<RefreshCw size={12} />}
            onClick={() => { setNewStatus(prospect.status); setShowStatusDialog(true); }}>
            Changer le statut
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
                <h1 className="text-lg font-semibold">{prospect.civility} {prospect.firstName} {prospect.lastName}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-md border ${STATUS_COLORS[prospect.status]}`}>
                  {prospect.status}
                </span>
              </div>
              <p className="text-sm text-accent font-medium mt-0.5">{prospect.type}</p>
              <p className="text-xs text-text-secondary mt-1">Origine: {prospect.origin} · Cree le {new Date(prospect.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          {/* Agent card */}
          <div className="p-3 rounded-xl border border-accent/20 bg-accent/[0.03] min-w-[200px]">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${getAgentColor(prospect.agentId)} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-bold text-sm">{getAgentInitials(prospect.agentId)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Agent</p>
                <p className="text-sm font-medium">{getAgentName(prospect.agentId)}</p>
              </div>
              <Button variant="ghost" size="sm" icon={<Repeat size={12} />}
                onClick={() => { setSelectedAgent(prospect.agentId || ''); setShowReassignDialog(true); }}>
                Changer
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><User size={14} className="text-accent" /> Contact</h3>
          <div className="divide-y divide-border/20">
            <InfoRow icon={<Mail size={14} />} label="Email" value={prospect.email} />
            <InfoRow icon={<Phone size={14} />} label="Telephone" value={prospect.phone} />
            {prospect.mobile && <InfoRow icon={<Phone size={14} />} label="Mobile" value={prospect.mobile} />}
            <InfoRow icon={<Globe size={14} />} label="Langue" value={prospect.spokenLanguage} />
            <InfoRow icon={<Tag size={14} />} label="Moyens de contact" value={prospect.meansOfContact.join(', ')} />
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><Home size={14} className="text-accent" /> Produit</h3>
          <div className="divide-y divide-border/20">
            <InfoRow icon={<Tag size={14} />} label="Categorie" value={prospect.categories} />
            <InfoRow icon={<Home size={14} />} label="Types de bien" value={prospect.propertyTypes.join(', ')} />
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><MapPin size={14} className="text-accent" /> Criteres</h3>
          <div className="divide-y divide-border/20">
            <InfoRow icon={<MapPin size={14} />} label="Localisation" value={prospect.location} />
            <InfoRow icon={<Grid size={14} />} label="Pieces" value={prospect.rooms} />
            <InfoRow icon={<Grid size={14} />} label="Chambres" value={prospect.bedrooms} />
            <InfoRow icon={<Maximize2 size={14} />} label="Surface min" value={prospect.minSurface ? `${prospect.minSurface} m2` : null} />
            <InfoRow icon={<DollarSign size={14} />} label="Budget max" value={prospect.maxPrice ? `${prospect.maxPrice.toLocaleString()} ${prospect.currency}` : null} />
            {(prospect.viewType || prospect.viewDetail) && <InfoRow icon={<Eye size={14} />} label="Vue" value={[prospect.viewType, prospect.viewDetail].filter(Boolean).join(' / ')} />}
          </div>
        </Card>

        {prospect.message && (
          <Card className="p-5">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><MessageSquare size={14} className="text-accent" /> Message</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{prospect.message}</p>
          </Card>
        )}
      </div>

      {/* Reassign Dialog */}
      <Dialog isOpen={showReassignDialog} onClose={() => setShowReassignDialog(false)} title="Reaffecter un prospect" size="lg">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <p className="text-sm font-medium">{prospect.civility} {prospect.firstName} {prospect.lastName}</p>
            <p className="text-xs text-text-secondary">{prospect.email} · {prospect.phone}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1.5">Agent actuel :</p>
            <div className="flex items-center gap-2 text-sm">
              {prospect.agentId ? (
                <>
                  <div className={`w-6 h-6 rounded-full ${getAgentColor(prospect.agentId)} flex items-center justify-center text-white text-[10px] font-bold`}>
                    {getAgentInitials(prospect.agentId)}
                  </div>
                  <span>{getAgentName(prospect.agentId)}</span>
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
      <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer le prospect" size="lg">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <p className="text-sm font-medium">{prospect.civility} {prospect.firstName} {prospect.lastName}</p>
            <p className="text-xs text-text-secondary">{prospect.email} · {prospect.phone}</p>
          </div>
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-700 space-y-1">
                <p className="font-medium">Attention :</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Cette action est IRREVERSIBLE</li>
                  <li>Tous les documents associes seront supprimes</li>
                  <li>L'historique du prospect sera efface</li>
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
              <option value="converti">Deja converti en client</option>
              <option value="retire">Prospect retire</option>
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
            <p className="text-sm font-medium">{prospect.civility} {prospect.firstName} {prospect.lastName}</p>
            <p className="text-xs text-text-secondary">{prospect.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Statut actuel</label>
            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${STATUS_COLORS[prospect.status]}`}>
              {prospect.status}
            </span>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nouveau statut</label>
            <select
              className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowStatusDialog(false)}>Annuler</Button>
            <Button variant="default" onClick={() => setShowStatusDialog(false)} disabled={newStatus === prospect.status}>
              Changer le statut
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
