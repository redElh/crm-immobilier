import { useNavigate, useParams } from 'react-router-dom';
import { ClientCard } from '../../components/modules/clients/ClientCard';
import { SearchInput } from '../../components/ui/SearchInput';
import { FilterDropdown } from '../../components/ui/FilterDropdown';
import { AddClientButton } from '../../components/modules/clients/AddClientButton';
import { ClientFormModal } from '../../components/modules/clients/ClientFormModal';
import { BuyerFormModal } from '../../components/modules/clients/BuyerFormModal';
import { SellerFormModal } from '../../components/modules/clients/SellerFormModal';
import { BailleurFormModal } from '../../components/modules/clients/BailleurFormModal';
import { LocataireFormModal } from '../../components/modules/clients/LocataireFormModal';
import { VoyageurFormModal } from '../../components/modules/clients/VoyageurFormModal';
import { ClientDraftSection } from '../../components/modules/clients/ClientDraftSection';
import { useState, useEffect, useMemo } from 'react';
import { Client } from '../../types/client';
import { fetchClients, createClient, deleteClient } from '../../services/clientService';
import { useToast } from '../../components/ui/Toast';
import { BackLink } from '../../components/ui/BackLink';
import Card from '../../components/ui/Card';
import { motion } from 'framer-motion';
import {
  BarChart2, UserCheck, UserX, Target, Calendar, Home, ArrowUp, ArrowDown, CheckCircle, Sun
} from 'react-feather';
import { api } from '../../services/api';
import { triggerMandatExpireNotification } from '../../services/automatorTrigger';
import { useMyPermissions, permissionAllowed } from '../../hooks/useMyPermissions';
import { Lock } from 'react-feather';

const ACHETEUR_STATUS_OPTIONS = [
  { value: 'all', label: 'Tous statuts' },
  { value: 'En qualification', label: 'En qualification' },
  { value: 'En recherche', label: 'En recherche' },
  { value: 'En negociation', label: 'En négociation' },
  { value: 'En compromis', label: 'En compromis' },
  { value: 'Vendu / Achete', label: 'Vendu / Acheté' },
  { value: 'Inactif', label: 'Inactif' },
  { value: 'Perdu', label: 'Perdu' },
];

const VENDEUR_STATUS_OPTIONS = [
  { value: 'all', label: 'Tous statuts' },
  { value: 'En attente de signature', label: 'En attente de signature' },
  { value: 'En mandat', label: 'En mandat' },
  { value: 'En negociation', label: 'En négociation' },
  { value: 'En compromis', label: 'En compromis' },
  { value: 'Vendu', label: 'Vendu' },
  { value: 'Inactif', label: 'Inactif' },
  { value: 'Perdu', label: 'Perdu' },
];

const BAILLEUR_STATUS_OPTIONS = [
  { value: 'all', label: 'Tous statuts' },
  { value: 'En attente de signature', label: 'En attente de signature' },
  { value: 'En mandat', label: 'En mandat' },
  { value: 'En negociation', label: 'En n\u00e9gociation' },
  { value: 'En location', label: 'En location' },
  { value: 'Loue', label: 'Lou\u00e9' },
  { value: 'Inactif', label: 'Inactif' },
  { value: 'Perdu', label: 'Perdu' },
];

const LOCATAIRE_STATUS_OPTIONS = [
  { value: 'all', label: 'Tous statuts' },
  { value: 'En recherche', label: 'En recherche' },
  { value: 'En visite', label: 'En visite' },
  { value: 'En dossier', label: 'En dossier' },
  { value: 'Bail signe', label: 'Bail signé' },
  { value: 'Installe', label: 'Installé' },
  { value: 'Inactif', label: 'Inactif' },
  { value: 'Perdu', label: 'Perdu' },
];

const VOYAGEUR_STATUS_OPTIONS = [
  { value: 'all', label: 'Tous statuts' },
  { value: 'En recherche', label: 'En recherche' },
  { value: 'Reservation en cours', label: 'Réservation en cours' },
  { value: 'Confirme', label: 'Confirmé' },
  { value: 'Paye', label: 'Payé' },
  { value: 'En sejour', label: 'En séjour' },
  { value: 'Termine', label: 'Terminé' },
  { value: 'Annule', label: 'Annulé' },
  { value: 'Inactif', label: 'Inactif' },
];

const typeLabels: Record<string, 'Acheteur' | 'Locataire' | 'Bailleur' | 'Vendeur' | 'Voyageur'> = {
  vendeur: 'Vendeur', bailleur: 'Bailleur', acheteur: 'Acheteur', locataire: 'Locataire', voyageur: 'Voyageur'
};

export default function ClientsPageWithType() {
  const { type, agentId } = useParams();
  const { toast } = useToast();
  const perms = useMyPermissions();
  const canRead = permissionAllowed(perms, 'clients-lecture');
  const canWrite = permissionAllowed(perms, 'clients-ecriture');
  const canDelete = permissionAllowed(perms, 'clients-supprimer');
  const canInfo = permissionAllowed(perms, 'clients-info-privees');
  const canExport = permissionAllowed(perms, 'clients-general-export');
  const permsLoaded = perms !== null;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resumeDraftId, setResumeDraftId] = useState<string | undefined>(undefined);
  const [draftVersion, setDraftVersion] = useState(0);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | undefined>(undefined);

  useEffect(() => {
    api.get<any>('/auth/me').then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem('openNewClientModal') === '1') {
      sessionStorage.removeItem('openNewClientModal');
      const contactId = sessionStorage.getItem('selectedContactId') || undefined;
      if (contactId) sessionStorage.removeItem('selectedContactId');
      setSelectedContactId(contactId);
      setIsModalOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetchClients({ agent_id: String(currentUser.id) }).then(setClients).catch(() => {});
  }, [currentUser]);

  const assignmentInfo = useMemo(() => {
    if (!currentUser) return undefined;
    return {
      assignedType: 'agent' as const,
      assignedName: [currentUser.first_name || '', currentUser.last_name || ''].filter(Boolean).join(' ').trim() || currentUser.email || '',
    };
  }, [currentUser]);

  const isAcheteur = typeLabels[type || ''] === 'Acheteur';
  const isVendeur = typeLabels[type || ''] === 'Vendeur';
  const isBailleur = typeLabels[type || ''] === 'Bailleur';
  const isLocataire = typeLabels[type || ''] === 'Locataire';
  const isVoyageur = typeLabels[type || ''] === 'Voyageur';

  useEffect(() => {
    if (resumeDraftId) setIsModalOpen(true);
  }, [resumeDraftId]);

  const clientTypeName = typeLabels[type || ''] || 'Client';

  const handleAddClient = async (newClient: Omit<Client, 'id'>) => {
    try {
      await createClient(newClient);
      const agentParams = currentUser ? { agent_id: String(currentUser.id) } : undefined;
      const updated = await fetchClients(agentParams);
      setClients(updated);
      toast('success', `${clientTypeName} ajouté avec succès`);
    } catch (err) {
      console.error('Failed to create client:', err);
      toast('error', `Erreur lors de la création du ${clientTypeName.toLowerCase()}`);
    }
    setIsModalOpen(false);
  };

  const handleEditClient = (client: any) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleUpdateClient = async (updatedData: Omit<Client, 'id'>) => {
    if (!editingClient) return;
    try {
      await api.put(`/clients/${editingClient.id}`, updatedData);
      const agentParams = currentUser ? { agent_id: String(currentUser.id) } : undefined;
      const updated = await fetchClients(agentParams);
      setClients(updated);

      const newStatutMandat = (updatedData as any).statutMandat;
      const newDateExpiration = (updatedData as any).dateExpiration;
      const isDateReached = newDateExpiration && new Date(newDateExpiration) <= new Date()
      if (newStatutMandat === 'Expire' || newStatutMandat?.toLowerCase() === 'expire' || isDateReached) {
        const clientParts = (editingClient.name || '').split(' ');
        const prenom = clientParts[0] || '';
        const nom = clientParts.slice(1).join(' ') || '';
        const agentNom = [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(' ') || currentUser?.email || 'Agent';
        try {
          await triggerMandatExpireNotification({
            bienTitre: `${(editingClient as any).propertyType || 'Bien'} - ${editingClient.area || ''}`.trim(),
            bienAdresse: editingClient.area,
            clientPrenom: prenom,
            clientNom: nom,
            clientType: (editingClient.type || 'Vendeur').toLowerCase(),
            mandatType: (updatedData as any).typeMandat || 'Mandat standard',
            mandatNumero: (updatedData as any).numeroMandat,
            dateExpiration: newDateExpiration ? new Date(newDateExpiration).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
            agentNom,
            agentEmail: currentUser?.email || undefined,
            bienConcerneId: (editingClient as any).bienConcerneId || (updatedData as any).bienConcerneId,
          })
        } catch (e) {
          console.error('triggerMandatExpireNotification failed:', e)
        }
      }

      toast('success', `${clientTypeName} mis à jour avec succès`);
    } catch (err) {
      console.error('Failed to update client:', err);
      toast('error', `Erreur lors de la mise à jour du ${clientTypeName.toLowerCase()}`);
    }
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await deleteClient(id);
      const agentParams = currentUser ? { agent_id: String(currentUser.id) } : undefined;
      const updated = await fetchClients(agentParams);
      setClients(updated);
      toast('success', `${clientTypeName} supprimé`);
    } catch (err) {
      console.error('Failed to delete client:', err);
      toast('error', `Erreur lors de la suppression du ${clientTypeName.toLowerCase()}`);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name && (client.name.toLowerCase().includes(searchTerm.toLowerCase()) || (client.phone && client.phone.includes(searchTerm)));
    const matchesStatus = statusFilter === 'all' || (isAcheteur || isVendeur || isBailleur || isLocataire || isVoyageur ? client.statutMetier === statusFilter : client.status === statusFilter);
    const matchesType = type && client.type === typeLabels[type];
    return matchesSearch && matchesStatus && matchesType;
  });

  const typeStats = useMemo(() => {
    const clientsOfType = clients.filter(c => c.type === typeLabels[type || '']);
    const total = clientsOfType.length;
    const actifs = clientsOfType.filter(c => c.status === 'Actif').length;
    const inactifs = clientsOfType.filter(c => c.status === 'Inactif').length;
    const enNegociation = clientsOfType.filter(c => c.statutMetier === 'En negociation' || c.status === 'En négociation').length;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const nouveauCeMois = clientsOfType.filter(c => c.createdAt.startsWith(currentMonth)).length;
    const biensProposes = clientsOfType.reduce((sum, c) => sum + (c.pieces || 0), 0);
    return { total, actifs, inactifs, enNegociation, nouveauCeMois, biensProposes };
  }, [type, clients]);

  if (permsLoaded && !canRead) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-border/40 flex items-center justify-center mb-4">
          <Lock size={28} className="text-text-secondary" />
        </div>
        <h2 className="text-lg font-semibold">Clients verrouillés</h2>
        <p className="text-sm text-text-secondary mt-1 max-w-sm">
          Vous n'avez pas la permission d'accéder aux clients. Contactez votre administrateur.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink className="mb-2" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{typeLabels[type || '']}s - VOS CLIENTS</h1>
          <div className="flex items-center mt-2.5">
            <div className="inline-flex items-center gap-0 rounded-xl bg-gradient-to-r from-background via-card to-background border border-border/50 shadow-sm overflow-hidden">
              <div className="flex items-center gap-1.5 px-3 py-1.5">
                <span className="text-lg font-bold text-text">{typeStats.total}</span>
                <span className="text-[10px] text-text-secondary/60 font-medium uppercase tracking-wide">total</span>
              </div>
              {typeStats.actifs > 0 && (
                <>
                  <div className="w-px h-5 bg-border/40" />
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
                    <span className="text-xs font-semibold text-emerald-600">{typeStats.actifs}</span>
                    <span className="text-[10px] text-emerald-600/60 hidden md:inline">actifs</span>
                  </div>
                </>
              )}
              {typeStats.inactifs > 0 && (
                <>
                  <div className="w-px h-5 bg-border/40" />
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="text-xs font-semibold text-rose-500">{typeStats.inactifs}</span>
                    <span className="text-[10px] text-rose-500/60 hidden md:inline">inactifs</span>
                  </div>
                </>
              )}
              {typeStats.enNegociation > 0 && (
                <>
                  <div className="w-px h-5 bg-border/40" />
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
                    <span className="text-xs font-semibold text-amber-600">{typeStats.enNegociation}</span>
                    <span className="text-[10px] text-amber-600/60 hidden md:inline">en cours</span>
                  </div>
                </>
              )}
              {typeStats.nouveauCeMois > 0 && (
                <>
                  <div className="w-px h-5 bg-border/40" />
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_6px_rgba(139,92,246,0.4)]" />
                    <span className="text-xs font-semibold text-violet-600">{typeStats.nouveauCeMois}</span>
                    <span className="text-[10px] text-violet-600/60 hidden md:inline">ce mois</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {canWrite && <AddClientButton onClick={() => setIsModalOpen(true)} />}
      </div>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 rounded-full bg-accent" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Statut de vos {typeLabels[type || '']?.toLowerCase()}s</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard icon={Target} label={`Total ${typeLabels[type || '']?.toLowerCase()}s`} value={typeStats.total} color="text-accent" bg="bg-accent-light" evolution="+0%" up />
          <KpiCard icon={UserCheck} label="Actifs" value={typeStats.actifs} color="text-emerald-600" bg="bg-emerald-50" evolution="+0%" up />
          <KpiCard icon={UserX} label="Inactifs" value={typeStats.inactifs} color="text-rose-600" bg="bg-rose-50" evolution="-0%" up={false} />
          <KpiCard icon={type === 'voyageur' ? CheckCircle : BarChart2} label={type === 'locataire' ? 'Bails signés' : type === 'voyageur' ? 'Réservations Confirmées' : 'En négociation'} value={typeStats.enNegociation} color="text-amber-600" bg="bg-amber-50" evolution="+0%" up />
          <KpiCard icon={Calendar} label={`${typeLabels[type || '']?.toLowerCase()}s ce mois`} value={typeStats.nouveauCeMois} color="text-violet-600" bg="bg-violet-50" evolution="+0%" up />
          <KpiCard icon={type === 'voyageur' ? Sun : Home} label={type === 'vendeur' ? 'Biens en stock' : type === 'bailleur' ? 'Biens en location' : type === 'voyageur' ? 'Séjours ce mois' : 'Biens proposés'} value={typeStats.biensProposes} color="text-blue-600" bg="bg-blue-50" evolution="+0%" up />
        </div>
      </section>

      {canWrite && isModalOpen && (() => {
        const handleClose = () => { setIsModalOpen(false); setResumeDraftId(undefined); setEditingClient(null); setSelectedContactId(undefined); };
        const handleSubmit = editingClient ? handleUpdateClient : handleAddClient;
        const commonProps = { onClose: handleClose, onSubmit: handleSubmit, key: editingClient?.id || 'new', selectedContactId: selectedContactId };
        if (typeLabels[type || ''] === 'Acheteur') return <BuyerFormModal {...commonProps} assignmentInfo={assignmentInfo} draftId={resumeDraftId} userId={currentUser ? String(currentUser.id) : undefined} onDraftChange={() => setDraftVersion(v => v + 1)} client={editingClient} />;
        if (typeLabels[type || ''] === 'Vendeur') return <SellerFormModal {...commonProps} assignmentInfo={assignmentInfo} draftId={resumeDraftId} userId={currentUser ? String(currentUser.id) : undefined} onDraftChange={() => setDraftVersion(v => v + 1)} client={editingClient} />;
        if (typeLabels[type || ''] === 'Bailleur') return <BailleurFormModal {...commonProps} assignmentInfo={assignmentInfo} draftId={resumeDraftId} userId={currentUser ? String(currentUser.id) : undefined} onDraftChange={() => setDraftVersion(v => v + 1)} client={editingClient} />;
        if (typeLabels[type || ''] === 'Locataire') return <LocataireFormModal {...commonProps} assignmentInfo={assignmentInfo} draftId={resumeDraftId} userId={currentUser ? String(currentUser.id) : undefined} onDraftChange={() => setDraftVersion(v => v + 1)} client={editingClient} />;
        if (typeLabels[type || ''] === 'Voyageur') return <VoyageurFormModal {...commonProps} assignmentInfo={assignmentInfo} draftId={resumeDraftId} userId={currentUser ? String(currentUser.id) : undefined} onDraftChange={() => setDraftVersion(v => v + 1)} client={editingClient} />;
        return <ClientFormModal {...commonProps} clientType={typeLabels[type || '']} />;
      })()}

      {canWrite && currentUser && (
        <ClientDraftSection
          key={draftVersion}
          userId={String(currentUser.id)}
          clientType={typeLabels[type || '']}
          onResume={(draft) => setResumeDraftId(draft.id)}
        />
      )}

      <Card className="p-5">
        <div className="flex flex-col sm:flex-row gap-4 mb-5 items-end">
          <div className="flex-1 w-full">
            <SearchInput value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher clients..." />
          </div>
          <FilterDropdown
            className="w-60"
            label="Statut"
            options={isAcheteur ? ACHETEUR_STATUS_OPTIONS : isVendeur ? VENDEUR_STATUS_OPTIONS : isBailleur ? BAILLEUR_STATUS_OPTIONS : isLocataire ? LOCATAIRE_STATUS_OPTIONS : isVoyageur ? VOYAGEUR_STATUS_OPTIONS : [
              { value: 'all', label: 'Tous statuts' },
              { value: 'Actif', label: 'Actif' },
              { value: 'En négociation', label: 'En négociation' },
              { value: 'Contrat signé', label: 'Contrat signé' },
              { value: 'Inactif', label: 'Inactif' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>

        {filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">Aucun client trouvé</p>
            <p className="text-xs text-text-secondary/60 mt-1">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-fr">
            {filteredClients.map(client => (
              <ClientCard key={client.id} client={client} agentId={agentId} onEdit={handleEditClient} onDelete={handleDeleteClient} locked={!canInfo} canEdit={canWrite} canDelete={canDelete} canExport={canExport} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color, bg, evolution, up }: { icon: any; label: string; value: number; color: string; bg: string; evolution?: string; up?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border/50 shadow-card p-4 hover:shadow-card-hover transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">{label}</p>
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon size={14} className={color} />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {evolution && (
        <div className={`flex items-center gap-1 mt-1 text-xs ${up ? 'text-emerald-600' : 'text-red-500'}`}>
          {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          <span>{evolution}</span>
          <span className="text-text-secondary/50 ml-1">vs mois dernier</span>
        </div>
      )}
    </motion.div>
  );
}
