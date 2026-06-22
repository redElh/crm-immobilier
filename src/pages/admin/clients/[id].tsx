import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { Dialog } from '../../../components/ui/Dialog'
import { ClientHeader } from '../../../components/modules/clients/ClientHeader'
import { ClientInfos } from '../../../components/modules/clients/ClientInfos'
import { BuyerDetailTabs } from '../../../components/modules/clients/ClientInfos/BuyerDetailTabs'
import { SellerDetailTabs } from '../../../components/modules/clients/ClientInfos/SellerDetailTabs'
import { BailleurDetailTabs } from '../../../components/modules/clients/ClientInfos/BailleurDetailTabs'
import { LocataireDetailTabs } from '../../../components/modules/clients/ClientInfos/LocataireDetailTabs'
import { VoyageurDetailTabs } from '../../../components/modules/clients/ClientInfos/VoyageurDetailTabs'
import { BackLink } from '../../../components/ui/BackLink'
import {
  Repeat, Trash2, RefreshCw, AlertTriangle, Shield
} from 'react-feather'
import { AGENTS, getClientById } from './mockData';

const STATUS_BY_TYPE: Record<string, string[]> = {
  Acheteur: ['En qualification', 'En recherche', 'En negociation', 'En compromis', 'Vendu / Achete', 'Inactif', 'Perdu'],
  Vendeur: ['En attente de signature', 'En mandat', 'En negociation', 'En compromis', 'Vendu', 'Inactif', 'Perdu'],
  Bailleur: ['En attente de signature', 'En mandat', 'En location', 'Inactif', 'Perdu'],
  Locataire: ['En recherche', 'En visite', 'En dossier', 'Bail signe', 'Installe', 'Inactif', 'Perdu'],
  Voyageur: ['En recherche', 'Reservation en cours', 'Confirme', 'En sejour', 'Termine', 'Annule', 'Inactif'],
};

const STATUS_COLORS: Record<string, string> = {
  'En qualification': 'bg-blue-50 text-blue-700 border-blue-200',
  'En recherche': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'En negociation': 'bg-amber-50 text-amber-700 border-amber-200',
  'En compromis': 'bg-violet-50 text-violet-700 border-violet-200',
  'Vendu / Achete': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Vendu': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'En attente de signature': 'bg-orange-50 text-orange-700 border-orange-200',
  'En mandat': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'En location': 'bg-teal-50 text-teal-700 border-teal-200',
  'En visite': 'bg-purple-50 text-purple-700 border-purple-200',
  'En dossier': 'bg-pink-50 text-pink-700 border-pink-200',
  'Bail signe': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Installe': 'bg-green-50 text-green-700 border-green-200',
  'Reservation en cours': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Confirme': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'En sejour': 'bg-blue-50 text-blue-700 border-blue-200',
  'Termine': 'bg-gray-50 text-gray-700 border-gray-200',
  'Annule': 'bg-red-50 text-red-700 border-red-200',
  'Inactif': 'bg-gray-50 text-gray-500 border-gray-200',
  'Perdu': 'bg-red-50 text-red-600 border-red-200',
  'Actif': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const typeToRoute: Record<string, string> = {
  Acheteur: 'acheteur', Vendeur: 'vendeur', Bailleur: 'bailleur', Locataire: 'locataire', Voyageur: 'voyageur',
};

export default function AdminClientPage() {
  const { id } = useParams()

  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const client = getClientById(id || '');

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

  const formatBudget = (p?: number) =>
    p ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(p) : '-';

  if (!client) {
    return (
      <div className="space-y-6 animate-fade-in">
        <BackLink to="/admin/clients" />
        <div className="text-center py-12">
          <p className="text-text/60">Client non trouve</p>
        </div>
      </div>
    );
  }

  const eventTypeMap: Record<string, 'email' | 'call' | 'meeting' | 'property_visit'> = {
    email: 'email', appel: 'call', visite: 'property_visit', contrat: 'meeting', autre: 'meeting',
  };

  const mappedEvents = (client.events || []).map(e => ({
    id: e.id,
    type: eventTypeMap[e.type] || 'email' as const,
    date: e.date,
    summary: e.summary,
    agent: e.agent,
  }));

  const timelineEvents = mappedEvents.length
    ? mappedEvents
    : [{
        id: `event-${client.id}-1`,
        type: 'email' as const,
        date: client.lastContact ? new Date(client.lastContact).toISOString() : new Date().toISOString(),
        summary: `Premier contact avec ${client.name}`,
        agent: getAgentName(client.agentId),
      }];

  const enhancedClient = {
    ...client,
    email: client.email || `${client.name.replace(' ', '.').toLowerCase()}@example.com`,
    area: client.area || 'Maroc',
    minSurface: client.minSurface || 50,
    rooms: client.rooms || '3',
    specificCriteria: client.criteres || [],
    comments: client.notes || '',
    contribution: client.contribution || 0,
    financingType: client.financingType || '',
    loanDuration: client.loanDuration || 0,
    documents: client.documents || [],
    lastContact: client.lastContact || new Date().toISOString(),
    events: client.events || [],
  };

  const statusLabel = client.statutMetier || client.status;
  const statusColor = STATUS_COLORS[statusLabel] || 'bg-gray-50 text-gray-500 border-gray-200';
  const backRoute = client.type ? `/admin/clients/type/${typeToRoute[client.type] || ''}` : '/admin/clients';

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <BackLink to={backRoute} />
      </div>

      {/* Admin actions bar */}
      <Card className="p-3 border-accent/20 bg-accent/5">
        <div className="flex items-center gap-2 flex-wrap">
          <Shield size={14} className="text-accent" />
          <span className="text-xs font-medium text-accent mr-2">Actions Administrateur :</span>
          <Button variant="outline" size="sm" icon={<Repeat size={12} />}
            onClick={() => { setSelectedAgent(client.agentId || ''); setShowReassignDialog(true); }}>
            Reaffecter
          </Button>
          <Button variant="outline" size="sm" icon={<RefreshCw size={12} />}
            onClick={() => { setNewStatus(statusLabel); setShowStatusDialog(true); }}>
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
        <div className="lg:col-span-3 space-y-4">
          <ClientHeader client={enhancedClient} />

          {/* Quick info card */}
          <Card className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Type</p>
                <p className="text-sm font-semibold mt-0.5">{client.type}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Secteur</p>
                <p className="text-sm font-semibold mt-0.5">{client.secteur || 'Non defini'}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Budget</p>
                <p className="text-sm font-semibold mt-0.5 text-accent">{formatBudget(client.budget)}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Propriete recherchee</p>
                <p className="text-sm font-semibold mt-0.5">{client.propertyType || 'Non specifie'}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Surface</p>
                <p className="text-sm font-semibold mt-0.5">
                  {client.minSurface ? `${client.minSurface} m2` : '-'}{client.surfaceMax ? ` - ${client.surfaceMax} m2` : ''}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Statut</p>
                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md border mt-0.5 ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {/* Agent card (admin only) */}
          <Card className="p-4 border-accent/20">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${getAgentColor(client.agentId)} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-bold text-sm">
                  {getAgentInitials(client.agentId)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Agent responsable</p>
                <p className="text-sm font-medium">{getAgentName(client.agentId)}</p>
                {client.agentId && (
                  <p className="text-xs text-text-secondary">
                    Mandat: {client.mandateStatus === 'actif' ? 'Actif' : client.mandateStatus}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm" icon={<Repeat size={12} />}
                onClick={() => { setSelectedAgent(client.agentId || ''); setShowReassignDialog(true); }}>
                Changer
              </Button>
            </div>
          </Card>

          {/* Quick stats */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Date d'inscription</span>
                <span className="text-sm font-medium">{new Date(client.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Dernier contact</span>
                <span className="text-sm font-medium">{client.lastContact ? new Date(client.lastContact).toLocaleDateString('fr-FR') : '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Statut mandat</span>
                <span className={`text-sm font-medium ${client.mandateStatus === 'actif' ? 'text-emerald-600' : client.mandateStatus === 'expire' ? 'text-red-500' : 'text-amber-600'}`}>
                  {client.mandateStatus === 'actif' ? 'Actif' : client.mandateStatus === 'expire' ? 'Expire' : client.mandateStatus === 'en_attente' ? 'En attente' : 'Termine'}
                </span>
              </div>
              {client.numeroMandat && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">N° Mandat</span>
                  <span className="text-sm font-medium font-mono text-xs">{client.numeroMandat}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Client detail tabs (type-specific) */}
      <div>
        {client.type === 'Acheteur' ? (
          <BuyerDetailTabs client={enhancedClient} />
        ) : client.type === 'Vendeur' ? (
          <SellerDetailTabs client={enhancedClient} />
        ) : client.type === 'Bailleur' ? (
          <BailleurDetailTabs client={enhancedClient} />
        ) : client.type === 'Locataire' ? (
          <LocataireDetailTabs client={enhancedClient} />
        ) : client.type === 'Voyageur' ? (
          <VoyageurDetailTabs client={enhancedClient} />
        ) : (
          <ClientInfos client={enhancedClient} />
        )}
      </div>

      {/* Reassign Dialog */}
      <Dialog isOpen={showReassignDialog} onClose={() => setShowReassignDialog(false)} title="Reaffecter un client" size="lg">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <p className="text-sm font-medium">{client.name}</p>
            <p className="text-xs text-text-secondary">{client.type} · {client.phone}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1.5">Agent actuel :</p>
            <div className="flex items-center gap-2 text-sm">
              {client.agentId ? (
                <>
                  <div className={`w-6 h-6 rounded-full ${getAgentColor(client.agentId)} flex items-center justify-center text-white text-[10px] font-bold`}>
                    {getAgentInitials(client.agentId)}
                  </div>
                  <span>{getAgentName(client.agentId)}</span>
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
      <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer le client" size="lg">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <p className="text-sm font-medium">{client.name}</p>
            <p className="text-xs text-text-secondary">{client.type} · {client.phone}</p>
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
                  <li>L'historique du client sera efface</li>
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
              <option value="retire">Client retire</option>
              <option value="decede">Client decede</option>
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
            <p className="text-sm font-medium">{client.name}</p>
            <p className="text-xs text-text-secondary">{client.type} · {client.phone}</p>
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
              {(STATUS_BY_TYPE[client.type] || []).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowStatusDialog(false)}>Annuler</Button>
            <Button variant="default" onClick={() => setShowStatusDialog(false)} disabled={newStatus === statusLabel}>
              Changer le statut
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
