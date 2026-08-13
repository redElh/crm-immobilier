import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
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
import { Select } from '../../../components/ui/Select'
import { useToast } from '../../../components/ui/Toast'
import { api } from '../../../services/api'
import { deleteClient, duplicateClient } from '../../../services/clientService'
import { BuyerFormModal } from '../../../components/modules/clients/BuyerFormModal'
import { SellerFormModal } from '../../../components/modules/clients/SellerFormModal'
import { BailleurFormModal } from '../../../components/modules/clients/BailleurFormModal'
import { LocataireFormModal } from '../../../components/modules/clients/LocataireFormModal'
import { VoyageurFormModal } from '../../../components/modules/clients/VoyageurFormModal'
import type { Client } from '../../../types/client'
import { Repeat, Trash2, RefreshCw, AlertTriangle, Shield, Copy, Heart, Edit3, ExternalLink } from 'react-feather'
import { triggerMandatExpireNotification } from '../../../services/automatorTrigger'

const GERANT_BUTTON_CLASSES = 'bg-[#905D5D] hover:bg-[#7D5050] border-[#905D5D] hover:border-[#7D5050] text-white shadow-[0_10px_24px_rgba(144,93,93,0.35)]'

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

const COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-pink-500'];

export default function AdminClientPage() {
  const { id, adminId, type } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const highlightActivityId = searchParams.get('tab') === 'notes_activite' ? Number(searchParams.get('activityId')) || undefined : undefined
  const { toast } = useToast()

  const [client, setClient] = useState<Client | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const lastKnownMandatRef = useRef<string | undefined>(undefined)
  const [triggeredStatutRef, setTriggeredStatutRef] = useState(false)

  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [liked, setLiked] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [isGerant, setIsGerant] = useState(false);

  useEffect(() => {
    api.get<any>('/auth/me')
      .then(u => u && setIsGerant(u.role === 'gerant'))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get<Client>(`/clients/${id}`),
      api.get<any[]>('/admin/users'),
    ]).then(([c, u]) => {
      setClient(c);
      setUsers(Array.isArray(u) ? u : []);
    }).catch(() => {
      setClient(null);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!client) return
    if (lastKnownMandatRef.current === undefined) {
      lastKnownMandatRef.current = client.statutMandat
      return
    }
    if (client.statutMandat === 'Expire' && lastKnownMandatRef.current !== 'Expire') {
      lastKnownMandatRef.current = 'Expire'
      const clientParts = (client.name || '').split(' ')
      const prenom = clientParts[0] || ''
      const nom = clientParts.slice(1).join(' ') || ''
      try {
        triggerMandatExpireNotification({
          bienTitre: `${(client as any).propertyType || 'Bien'} - ${client.area || ''}`.trim(),
          bienAdresse: client.area,
          clientPrenom: prenom,
          clientNom: nom,
          clientType: (client.type || 'Vendeur').toLowerCase(),
          mandatType: (client as any).typeMandat || 'Mandat standard',
          mandatNumero: (client as any).numeroMandat,
          dateExpiration: client.dateExpiration ? new Date(client.dateExpiration).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
          agentNom: (client.agentId ? findPerson(client.agentId)?.name : null) || 'Non assigne',
        })
      } catch (e) {
        console.error('triggerMandatExpireNotification failed:', e)
      }
    } else {
      lastKnownMandatRef.current = client.statutMandat
    }
  }, [client?.statutMandat, client?.name, client?.area, client?.type, client?.agentId, client?.dateExpiration])

  const findPerson = (agentId: string) => {
    if (!agentId) return undefined;
    const byId = users.find(u => String(u.id) === agentId);
    if (byId) {
      const initials = `${(byId.first_name || '')[0]}${(byId.last_name || '')[0]}`.toUpperCase() || '?';
      const color = COLORS[Math.abs(Number(byId.id) || byId.id.length) % COLORS.length];
      return { name: `${byId.first_name || ''} ${byId.last_name || ''}`.trim(), initials, color, role: byId.role };
    }
    const byName = users.find(u => {
      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
      return fullName.toLowerCase() === agentId.toLowerCase() || `${u.last_name || ''} ${u.first_name || ''}`.trim().toLowerCase() === agentId.toLowerCase();
    });
    if (byName) {
      const initials = `${(byName.first_name || '')[0]}${(byName.last_name || '')[0]}`.toUpperCase() || '?';
      const color = COLORS[Math.abs(Number(byName.id) || byName.id.length) % COLORS.length];
      return { name: `${byName.first_name || ''} ${byName.last_name || ''}`.trim(), initials, color, role: byName.role };
    }
    return undefined;
  };

  const getAgentName = (agentId?: string) => {
    if (!agentId) return 'Non assigne';
    const person = findPerson(agentId);
    return person ? person.name : client?.agentDesigne || 'Non assigne';
  };

  const getAgentInitials = (agentId?: string) => {
    if (!agentId) return 'NA';
    const person = findPerson(agentId);
    return person ? person.initials : (client?.agentDesigne || 'NA').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  };

  const getAgentColor = (agentId?: string) => {
    if (!agentId) return 'bg-violet-400';
    const person = findPerson(agentId);
    return person ? person.color : 'bg-violet-400';
  };

  const formatBudget = (p?: number) =>
    p ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(p) : '-';

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <BackLink to={adminId ? `/admin/${adminId}/clients` : '/admin/clients'} />
        <div className="text-center py-12">
          <p className="text-text-secondary">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6 animate-fade-in">
        <BackLink to={adminId ? `/admin/${adminId}/clients` : '/admin/clients'} />
        <div className="text-center py-12">
          <p className="text-text/60">Client non trouve</p>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (deleteConfirm !== 'SUPPRIMER' || !client) return;
    try {
      await deleteClient(String(client.id));
      toast('success', `${client.name || 'Client'} supprim\u00e9`);
      navigate(client.type && adminId ? `/admin/${adminId}/clients/type/${typeToRoute[client.type] || ''}` : adminId ? `/admin/${adminId}/clients` : '/admin/clients');
    } catch (err: any) {
      toast('error', err.message || 'Erreur lors de la suppression');
    }
    setShowDeleteDialog(false);
  };

  const handleStatusChange = async () => {
    if (!client || newStatus === (client.statutMetier || client.status)) return;
    try {
      await api.put(`/clients/${client.id}`, { statutMetier: newStatus });
      setClient({ ...client, statutMetier: newStatus } as Client);
      toast('success', 'Statut mis \u00e0 jour');
    } catch (err: any) {
      toast('error', err.message || 'Erreur lors du changement de statut');
    }
    setShowStatusDialog(false);
  };

  const handleReassign = async () => {
    if (!client || !selectedAgent) return;
    try {
      const agentUser = users.find((u: any) => String(u.id) === selectedAgent);
      const agentName = agentUser ? `${agentUser.first_name || ''} ${agentUser.last_name || ''}`.trim() : '';
      await api.put(`/clients/${client.id}`, { agentId: selectedAgent, agentDesigne: agentName });
      setClient({ ...client, agentId: selectedAgent, agentDesigne: agentName } as Client);
      toast('success', 'Client r\u00e9affect\u00e9 avec succ\u00e8s');
    } catch (err: any) {
      toast('error', err.message || 'Erreur lors de la r\u00e9affectation');
    }
    setShowReassignDialog(false);
    setSelectedAgent('');
  };

  const handleDuplicate = async () => {
    if (!client) return;
    try {
      const duplicated = await duplicateClient(String(client.id));
      toast('success', `${duplicated.name || 'Client'} dupliqu\u00e9 avec succ\u00e8s`);
      navigate(adminId && duplicated.type ? `/admin/${adminId}/clients/type/${typeToRoute[duplicated.type] || ''}/${duplicated.id}` : `/admin/clients/${duplicated.id}`);
    } catch (err: any) {
      toast('error', err.message || 'Erreur lors de la duplication');
    }
  };

  const eventTypeMap: Record<string, 'email' | 'call' | 'meeting' | 'property_visit'> = {
    email: 'email', appel: 'call', visite: 'property_visit', contrat: 'meeting', autre: 'meeting',
  };

  const mappedEvents = ((client as any).events || []).map((e: any) => ({
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
        date: client.createdAt ? new Date(client.createdAt).toISOString() : new Date().toISOString(),
        summary: `Premier contact avec ${client.name}`,
        agent: getAgentName(client.agentId),
      }];

  const handleUpdateClient = async (clientData: Omit<Client, 'id'>) => {
    try {
      await api.put(`/clients/${client.id}`, clientData);
      const refreshed = await api.get<Client>(`/clients/${client.id}`);
      setClient(refreshed);
      setDataRefreshKey(k => k + 1);

      const newStatutMandat = (clientData as any).statutMandat
      const newDateExpiration = (clientData as any).dateExpiration

      const isDateReached = newDateExpiration && new Date(newDateExpiration) <= new Date()
      if (newStatutMandat === 'Expire' || newStatutMandat?.toLowerCase() === 'expire' || isDateReached) {
        try {
          const clientParts = (client.name || '').split(' ')
          const prenom = clientParts[0] || ''
          const nom = clientParts.slice(1).join(' ') || ''
          lastKnownMandatRef.current = 'Expire'
          const agentUser = client.agentId ? users.find((u: any) => String(u.id) === client.agentId) : undefined
          await triggerMandatExpireNotification({
            bienTitre: `${(client as any).propertyType || 'Bien'} - ${client.area || ''}`.trim(),
            bienAdresse: client.area,
            clientPrenom: prenom,
            clientNom: nom,
            clientType: (client.type || 'Vendeur').toLowerCase(),
            mandatType: (clientData as any).typeMandat || 'Mandat standard',
            mandatNumero: (clientData as any).numeroMandat,
            dateExpiration: newDateExpiration ? new Date(newDateExpiration).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
            agentNom: getAgentName(client.agentId),
            agentEmail: agentUser?.email || undefined,
            bienConcerneId: (client as any).bienConcerneId || (clientData as any).bienConcerneId,
            agentId: client.agentId,
          })
        } catch (triggerErr) {
          console.error('triggerMandatExpireNotification failed:', triggerErr)
        }
      }

      toast('success', `${client.type || 'Client'} modifié avec succès`);
    } catch (err) {
      console.error('Failed to update client:', err);
      toast('error', `Erreur lors de la modification`);
    }
    setShowEditModal(false);
  };

  const enhancedClient = {
    ...client,
    email: client.email || `${(client.name || '').replace(' ', '.').toLowerCase()}@example.com`,
    area: client.area || 'Maroc',
    minSurface: client.minSurface || 50,
    rooms: client.rooms || '3',
    specificCriteria: (client as any).criteres || [],
    comments: client.notes || '',
    contribution: client.contribution || 0,
    financingType: (client as any).financingType || '',
    loanDuration: (client as any).loanDuration || 0,
    documents: (client as any).documents || [],
    lastContact: (client as any).lastContact || new Date().toISOString(),
    events: (client as any).events || [],
  };

  const statusLabel = client.statutMetier || client.status;
  const statusColor = STATUS_COLORS[statusLabel || ''] || 'bg-gray-50 text-gray-500 border-gray-200';
  const backRoute = adminId && client.type ? `/admin/${adminId}/clients/type/${typeToRoute[client.type] || ''}` : adminId ? `/admin/${adminId}/clients` : '/admin/clients';

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Top bar with BackLink + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <BackLink to={backRoute} />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<Heart size={14} />}
            className={liked ? 'text-red-500' : ''}
            onClick={() => setLiked(!liked)}
          />
          <Button variant="outline" size="sm" icon={<Edit3 size={14} />}
            onClick={() => setShowEditModal(true)}>
            Modifier
          </Button>
          <Button variant="default" size="sm" icon={<ExternalLink size={14} />} className={isGerant ? GERANT_BUTTON_CLASSES : ''}>
            Partager
          </Button>
          <Button variant="ghost" size="sm" icon={<Trash2 size={14} />}
            className="text-error hover:bg-error/5"
            onClick={() => { setDeleteConfirm(''); setDeleteReason(''); setShowDeleteDialog(true); }}>
            Supprimer
          </Button>
        </div>
      </div>

      {/* Admin actions bar */}
      <Card className={`p-3 ${isGerant ? 'border-[#905D5D]/20 bg-[#905D5D]/5' : 'border-accent/20 bg-accent/5'}`}>
        <div className="flex items-center gap-2 flex-wrap">
          <Shield size={14} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
          <span className={`text-xs font-medium mr-2 ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>Actions Administrateur :</span>
          <Button variant="outline" size="sm" icon={<Repeat size={12} />}
            onClick={() => {
              const rawId = String(client.agentId || '');
              const matchedUser = users.find((u: any) => String(u.id) === rawId)
                || users.find((u: any) => {
                  const full = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                  return full.toLowerCase() === rawId.toLowerCase();
                });
              setSelectedAgent(matchedUser ? String(matchedUser.id) : '');
              setShowReassignDialog(true);
            }}>
            Reaffecter
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

      {/* Hero section - ClientHeader spans full width */}
      <ClientHeader key={dataRefreshKey} client={enhancedClient} isGerant={isGerant} />

      {/* Info section - Quick info + Stats stacked vertically */}
      <div className="space-y-6">
        {/* Quick info card - TYPE SPECIFIC */}
        <Card className="p-5">
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-4 items-start">
            {/* Status row always first */}
            <div>
              <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Type</p>
              <p className="text-sm font-semibold mt-0.5">{client.type}</p>
            </div>

            {client.type === 'Acheteur' && (<>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Secteur</p>
                <p className="text-sm font-semibold mt-0.5">{(client as any).secteur || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Type Bien</p>
                <p className="text-sm font-semibold mt-0.5">{(client as any).propertyType || (client as any).categorie || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Budget</p>
                <p className={`text-sm font-semibold mt-0.5 ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>
                  {(client as any).prixMin || (client as any).prixMax
                    ? `${formatBudget((client as any).prixMin)}${(client as any).prixMax ? ` - ${formatBudget((client as any).prixMax)}` : ''}`
                    : formatBudget(client.budget)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Surface</p>
                <p className="text-sm font-semibold mt-0.5">
                  {client.minSurface || (client as any).surfaceMin
                    ? `${client.minSurface || (client as any).surfaceMin} m2`
                    : '-'}{client.surfaceMax ? ` - ${client.surfaceMax} m2` : ''}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Pieces / Chambres</p>
                <p className="text-sm font-semibold mt-0.5">
                  {(client as any).pieces || '-'} / {(client as any).chambres || '-'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Situation</p>
                <p className="text-sm font-semibold mt-0.5">{(client as any).situationActuelle || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Urgence</p>
                <p className={`text-sm font-semibold mt-0.5 ${(client as any).urgence === 'Haute' ? 'text-red-600' : (client as any).urgence === 'Moyenne' ? 'text-amber-600' : ''}`}>
                  {(client as any).urgence || '-'}
                </p>
              </div>
            </>)}

            {client.type === 'Vendeur' && (<>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Secteur</p>
                <p className="text-sm font-semibold mt-0.5">{(client as any).secteur || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Adresse</p>
                <p className="text-sm font-semibold mt-0.5">{(client as any).adresseComplete || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Type Bien</p>
                <p className="text-sm font-semibold mt-0.5">{(client as any).propertyType || (client as any).categorie || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Prix Net Vendeur</p>
                <p className={`text-sm font-semibold mt-0.5 ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>{formatBudget((client as any).prixNetVendeur)}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Prix FAI</p>
                <p className="text-sm font-semibold mt-0.5">{formatBudget((client as any).prixVenteFAI)}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Surface / Pieces</p>
                <p className="text-sm font-semibold mt-0.5">
                  {(client.minSurface || (client as any).surfaceMin) ? `${client.minSurface || (client as any).surfaceMin} m2` : '-'}
                  {(client as any).pieces ? ` / ${(client as any).pieces} p.` : ''}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Etat</p>
                <p className="text-sm font-semibold mt-0.5">{(client as any).etat || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Standing</p>
                <p className="text-sm font-semibold mt-0.5">{(client as any).standing || '-'}</p>
              </div>
            </>)}

            {client.type === 'Bailleur' && (<>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Secteur</p>
                <p className="text-sm font-semibold mt-0.5">{(client as any).secteur || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Adresse</p>
                <p className="text-sm font-semibold mt-0.5">{(client as any).adresseComplete || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Type Bien</p>
                <p className="text-sm font-semibold mt-0.5">{(client as any).propertyType || (client as any).categorie || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Loyer HC</p>
                <p className={`text-sm font-semibold mt-0.5 ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>{formatBudget((client as any).loyerHC)}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Charges</p>
                <p className="text-sm font-semibold mt-0.5">{formatBudget((client as any).charges)}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Depot Garantie</p>
                <p className="text-sm font-semibold mt-0.5">{formatBudget((client as any).depotGarantie)}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Type Loyer</p>
                <p className="text-sm font-semibold mt-0.5">{(client as any).typeLoyer || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Surface / Pieces</p>
                <p className="text-sm font-semibold mt-0.5">
                  {(client.minSurface || (client as any).surfaceMin) ? `${client.minSurface || (client as any).surfaceMin} m2` : '-'}
                  {(client as any).pieces ? ` / ${(client as any).pieces} p.` : ''}
                </p>
              </div>
            </>)}

            {client.type === 'Locataire' && (<>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Secteur</p>
                <p className="text-sm font-semibold mt-0.5">{(client as any).secteur || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Type Bien</p>
                <p className="text-sm font-semibold mt-0.5">{(client as any).propertyType || (client as any).categorie || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Loyer Max</p>
                <p className={`text-sm font-semibold mt-0.5 ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>{formatBudget((client as any).loyerMax || client.budget)}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Surface</p>
                <p className="text-sm font-semibold mt-0.5">
                  {client.minSurface || (client as any).surfaceMin
                    ? `${client.minSurface || (client as any).surfaceMin} m2`
                    : '-'}{client.surfaceMax ? ` - ${client.surfaceMax} m2` : ''}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Pieces / Chambres</p>
                <p className="text-sm font-semibold mt-0.5">
                  {(client as any).pieces || '-'} / {(client as any).chambres || '-'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Situation</p>
                <p className="text-sm font-semibold mt-0.5">{(client as any).situationPro || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Statut Occupation</p>
                <p className="text-sm font-semibold mt-0.5">{(client as any).statutOccupation || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Garant</p>
                <p className="text-sm font-semibold mt-0.5">
                  {(client as any).guarantor ? `Oui - ${(client as any).guarantorName || ''}` : 'Non'}
                </p>
              </div>
            </>)}

            {client.type === 'Voyageur' && (<>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Secteur</p>
                <p className="text-sm font-semibold mt-0.5">{(client as any).secteur || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Type Bien</p>
                <p className="text-sm font-semibold mt-0.5">{(client as any).propertyType || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Arrivee</p>
                <p className="text-sm font-semibold mt-0.5">{(client as any).dateArrivee || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Depart</p>
                <p className="text-sm font-semibold mt-0.5">{(client as any).dateDepart || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Nuits / Voyageurs</p>
                <p className="text-sm font-semibold mt-0.5">
                  {(client as any).nbNuits || '-'} / {(client as any).nbVoyageurs || (client as any).nbPersonnes || '-'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Tarif / Nuit</p>
                <p className={`text-sm font-semibold mt-0.5 ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>{formatBudget((client as any).tarifNuit || (client as any).budgetNuitMax)}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Budget Total</p>
                <p className="text-sm font-semibold mt-0.5">{formatBudget((client as any).budgetTotal || (client as any).montantTotalAvecOptions)}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Condition Annulation</p>
                <p className="text-sm font-semibold mt-0.5">{(client as any).conditionsAnnulation || '-'}</p>
              </div>
            </>)}

            {/* Status row always last with Original/Copy badge */}
            <div className="col-span-full">
              <p className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Statut</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md border ${statusColor}`}>
                  {statusLabel}
                </span>
                {client.originalClientId ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wider bg-orange-100 text-orange-700">
                    Copie
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wider bg-blue-100 text-blue-700">
                    Original
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Quick stats - TYPE SPECIFIC */}
        <Card className="p-4">
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-4 items-start">
            <div>
              <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Date d'inscription</span>
              <p className="text-sm font-semibold mt-0.5">{client.createdAt ? new Date(client.createdAt).toLocaleDateString('fr-FR') : '-'}</p>
            </div>
            <div>
              <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Dernier contact</span>
              <p className="text-sm font-semibold mt-0.5">{(client as any).lastContact ? new Date((client as any).lastContact).toLocaleDateString('fr-FR') : '-'}</p>
            </div>

            {client.type === 'Acheteur' && (<>
              <div>
                <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Statut mandat</span>
                <p className={`text-sm font-semibold mt-0.5 ${
                  (client as any).statutMandat === 'actif' || (client as any).statutMandat === 'Actif' ? 'text-emerald-600' :
                  (client as any).statutMandat === 'expire' || (client as any).statutMandat === 'Expiré' ? 'text-red-500' :
                  (client as any).statutMandat === 'resilie' || (client as any).statutMandat === 'Résilié' ? 'text-rose-500' :
                  (client as any).statutMandat === 'termine' || (client as any).statutMandat === 'Terminé' ? 'text-gray-500' :
                  'text-text-secondary/50'
                }`}>
                  {(client as any).statutMandat || 'N/A'}
                </p>
              </div>
              {(client as any).numeroMandat && (
                <div>
                  <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">N° Mandat</span>
                  <p className="text-sm font-semibold font-mono mt-0.5">{(client as any).numeroMandat}</p>
                </div>
              )}
              <div>
                <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Financement</span>
                <p className="text-sm font-semibold mt-0.5">{(client as any).financingType || (client as any).statutFinancement || '-'}</p>
              </div>
              {(client as any).moveInDate && (
                <div>
                  <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Date emmenagement</span>
                  <p className="text-sm font-semibold mt-0.5">{new Date((client as any).moveInDate).toLocaleDateString('fr-FR')}</p>
                </div>
              )}
              {(client as any).conjoint && (
                <div>
                  <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Conjoint</span>
                  <p className="text-sm font-semibold mt-0.5">{(client as any).conjoint}</p>
                </div>
              )}
              {(client as any).bienConcerneId && (
                <div>
                  <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Bien concerne</span>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/${adminId}/properties/${(client as any).bienConcerneId}`)}
                    className={`text-sm font-semibold mt-0.5 ${isGerant ? 'text-[#905D5D]' : 'text-accent'} hover:underline cursor-pointer text-left`}
                  >
                    #{(client as any).bienConcerneId}
                  </button>
                </div>
              )}
            </>)}

            {client.type === 'Vendeur' && (<>
              <div>
                <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Statut mandat</span>
                <p className={`text-sm font-semibold mt-0.5 ${
                  (client as any).statutMandat === 'Actif' ? 'text-emerald-600' :
                  (client as any).statutMandat === 'Expiré' ? 'text-red-500' :
                  (client as any).statutMandat === 'Résilié' ? 'text-rose-500' :
                  'text-text-secondary/50'
                }`}>
                  {(client as any).statutMandat || 'N/A'}
                </p>
              </div>
              {(client as any).numeroMandat && (
                <div>
                  <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">N° Mandat</span>
                  <p className="text-sm font-semibold font-mono mt-0.5">{(client as any).numeroMandat}</p>
                </div>
              )}
              {(client as any).dateSouhaiteeVente && (
                <div>
                  <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Date vente souhaitee</span>
                  <p className="text-sm font-semibold mt-0.5">{new Date((client as any).dateSouhaiteeVente).toLocaleDateString('fr-FR')}</p>
                </div>
              )}
              {(client as any).reasonForSelling && (
                <div>
                  <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Raison vente</span>
                  <p className="text-sm font-semibold mt-0.5">{(client as any).reasonForSelling}</p>
                </div>
              )}
              {(client as any).creditRestantDu != null && (client as any).creditRestantDu > 0 && (
                <div>
                  <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Credit restant</span>
                  <p className="text-sm font-semibold mt-0.5">{formatBudget((client as any).creditRestantDu)}</p>
                </div>
              )}
              <div>
                <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Honoraires</span>
                <p className="text-sm font-semibold mt-0.5">{(client as any).typeHonoraires || '-'}</p>
              </div>
              {(client as any).bienConcerneId && (
                <div>
                  <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Bien concerne</span>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/${adminId}/properties/${(client as any).bienConcerneId}`)}
                    className={`text-sm font-semibold mt-0.5 ${isGerant ? 'text-[#905D5D]' : 'text-accent'} hover:underline cursor-pointer text-left`}
                  >
                    #{(client as any).bienConcerneId}
                  </button>
                </div>
              )}
            </>)}

            {client.type === 'Bailleur' && (<>
              <div>
                <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Statut mandat</span>
                <p className={`text-sm font-semibold mt-0.5 ${
                  (client as any).statutMandat === 'Actif' ? 'text-emerald-600' :
                  (client as any).statutMandat === 'Expiré' ? 'text-red-500' :
                  'text-text-secondary/50'
                }`}>
                  {(client as any).statutMandat || 'N/A'}
                </p>
              </div>
              {(client as any).numeroMandat && (
                <div>
                  <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">N° Mandat</span>
                  <p className="text-sm font-semibold font-mono mt-0.5">{(client as any).numeroMandat}</p>
                </div>
              )}
              <div>
                <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Type mandat</span>
                <p className="text-sm font-semibold mt-0.5">{(client as any).typeMandat || '-'}</p>
              </div>
              {(client as any).raisonMiseEnLocation && (
                <div>
                  <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Raison location</span>
                  <p className="text-sm font-semibold mt-0.5">{(client as any).raisonMiseEnLocation}</p>
                </div>
              )}
              {(client as any).dateDisponibilite && (
                <div>
                  <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Disponibilite</span>
                  <p className="text-sm font-semibold mt-0.5">{new Date((client as any).dateDisponibilite).toLocaleDateString('fr-FR')}</p>
                </div>
              )}
              <div>
                <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Credit en cours</span>
                <p className={`text-sm font-semibold mt-0.5 ${(client as any).creditEnCours ? 'text-red-500' : 'text-emerald-600'}`}>
                  {(client as any).creditEnCours ? 'Oui' : 'Non'}
                </p>
              </div>
            </>)}

            {client.type === 'Locataire' && (<>
              <div>
                <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Statut mandat</span>
                <p className={`text-sm font-semibold mt-0.5 ${
                  (client as any).statutMandat === 'Actif' ? 'text-emerald-600' :
                  (client as any).statutMandat === 'Expiré' ? 'text-red-500' :
                  'text-text-secondary/50'
                }`}>
                  {(client as any).statutMandat || 'N/A'}
                </p>
              </div>
              {(client as any).numeroMandat && (
                <div>
                  <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">N° Mandat</span>
                  <p className="text-sm font-semibold font-mono mt-0.5">{(client as any).numeroMandat}</p>
                </div>
              )}
              <div>
                <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Situation pro</span>
                <p className="text-sm font-semibold mt-0.5">{(client as any).situationPro || '-'}</p>
              </div>
              {(client as any).revenusMensuelsNets != null && (
                <div>
                  <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Revenus mensuels</span>
                  <p className="text-sm font-semibold mt-0.5">{formatBudget((client as any).revenusMensuelsNets)}</p>
                </div>
              )}
              {(client as any).nomEmployeur && (
                <div>
                  <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Employeur</span>
                  <p className="text-sm font-semibold mt-0.5">{(client as any).nomEmployeur}</p>
                </div>
              )}
              {(client as any).anciennete != null && (
                <div>
                  <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Anciennete</span>
                  <p className="text-sm font-semibold mt-0.5">{(client as any).anciennete} ans</p>
                </div>
              )}
            </>)}

            {client.type === 'Voyageur' && (<>
              {(client as any).numeroReservation && (
                <div>
                  <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">N° Reservation</span>
                  <p className="text-sm font-semibold font-mono mt-0.5">{(client as any).numeroReservation}</p>
                </div>
              )}
              <div>
                <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Statut reservation</span>
                <p className={`text-sm font-semibold mt-0.5 ${
                  (client as any).statutReservation === 'Confirmee' || (client as any).statutReservation === 'Confirme' ? 'text-emerald-600' :
                  (client as any).statutReservation === 'Annulee' ? 'text-red-500' :
                  'text-text-secondary/50'
                }`}>
                  {(client as any).statutReservation || (client as any).statutMetier || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Mode paiement</span>
                <p className="text-sm font-semibold mt-0.5">{(client as any).modePaiement || '-'}</p>
              </div>
              <div>
                <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Check-in / Check-out</span>
                <p className="text-sm font-semibold mt-0.5">{(client as any).checkInHeure || '-'}/{(client as any).checkOutHeure || '-'}</p>
              </div>
              {(client as any).animaux != null && (
                <div>
                  <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Animaux</span>
                  <p className={`text-sm font-semibold mt-0.5 ${(client as any).animaux ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {(client as any).animaux ? 'Oui' : 'Non'}
                  </p>
                </div>
              )}
              {(client as any).flexibilite && (
                <div>
                  <span className="text-[11px] text-text-secondary/60 uppercase tracking-wider">Flexibilite</span>
                  <p className="text-sm font-semibold mt-0.5">{(client as any).flexibilite}</p>
                </div>
              )}
            </>)}
          </div>
        </Card>
      </div>

      {/* Client detail tabs (type-specific) */}
      <div>
        {client.type === 'Acheteur' ? (
          <BuyerDetailTabs key={dataRefreshKey} client={enhancedClient} adminId={adminId} highlightActivityId={highlightActivityId} isGerant={isGerant} />
        ) : client.type === 'Vendeur' ? (
          <SellerDetailTabs key={dataRefreshKey} client={enhancedClient} adminId={adminId} highlightActivityId={highlightActivityId} isGerant={isGerant} />
        ) : client.type === 'Bailleur' ? (
          <BailleurDetailTabs key={dataRefreshKey} client={enhancedClient} highlightActivityId={highlightActivityId} isGerant={isGerant} />
        ) : client.type === 'Locataire' ? (
          <LocataireDetailTabs key={dataRefreshKey} client={enhancedClient} adminId={adminId} highlightActivityId={highlightActivityId} isGerant={isGerant} />
        ) : client.type === 'Voyageur' ? (
          <VoyageurDetailTabs key={dataRefreshKey} client={enhancedClient} adminId={adminId} highlightActivityId={highlightActivityId} isGerant={isGerant} />
        ) : (
          <ClientInfos key={dataRefreshKey} client={enhancedClient} isGerant={isGerant} />
        )}
      </div>

      {/* Reassign Dialog */}
      <Dialog isOpen={showReassignDialog} onClose={() => setShowReassignDialog(false)} title="Reaffecter un client" size="lg">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <p className="text-sm font-medium">{client.name}</p>
            <p className="text-xs text-text-secondary">{client.type} \u00b7 {client.phone}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1.5">Responsable actuel :</p>
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
            <label className="text-sm font-medium mb-1.5 block">Nouvel responsable</label>
            <Select
              placeholder="Selectionner un responsable"
              value={selectedAgent}
              onValueChange={(v) => setSelectedAgent(v)}
              options={users.map((u: any) => ({
                value: String(u.id),
                label: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
              }))}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowReassignDialog(false)}>Annuler</Button>
            <Button variant="default" onClick={handleReassign} disabled={!selectedAgent}>Reaffecter</Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer le client" size="lg">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <p className="text-sm font-medium">{client.name}</p>
            <p className="text-xs text-text-secondary">{client.type} \u00b7 {client.phone}</p>
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
            <Button variant="danger" onClick={handleDelete} disabled={deleteConfirm !== 'SUPPRIMER'}>
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
            <p className="text-xs text-text-secondary">{client.type} \u00b7 {client.phone}</p>
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
              className={`w-full h-10 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]' : 'focus:ring-accent/20 focus:border-accent'} transition-all`}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {(STATUS_BY_TYPE[client.type || ''] || []).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowStatusDialog(false)}>Annuler</Button>
            <Button variant="default" onClick={handleStatusChange} disabled={newStatus === statusLabel}>
              Changer le statut
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Edit Modal */}
      {showEditModal && client.type === 'Acheteur' && (
        <BuyerFormModal onClose={() => setShowEditModal(false)} onSubmit={handleUpdateClient} client={client} isGerant={isGerant} />
      )}
      {showEditModal && client.type === 'Vendeur' && (
        <SellerFormModal onClose={() => setShowEditModal(false)} onSubmit={handleUpdateClient} client={client} isGerant={isGerant} />
      )}
      {showEditModal && client.type === 'Bailleur' && (
        <BailleurFormModal onClose={() => setShowEditModal(false)} onSubmit={handleUpdateClient} client={client} isGerant={isGerant} />
      )}
      {showEditModal && client.type === 'Locataire' && (
        <LocataireFormModal onClose={() => setShowEditModal(false)} onSubmit={handleUpdateClient} client={client} isGerant={isGerant} />
      )}
      {showEditModal && client.type === 'Voyageur' && (
        <VoyageurFormModal onClose={() => setShowEditModal(false)} onSubmit={handleUpdateClient} client={client} isGerant={isGerant} />
      )}
    </div>
  )
}
