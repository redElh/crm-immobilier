import { ClientLayout } from "../../components/layout/ClientLayout";
import { ClientInfos } from "../../components/modules/clients/ClientInfos";
import { BuyerDetailTabs } from "../../components/modules/clients/ClientInfos/BuyerDetailTabs";
import { SellerDetailTabs } from "../../components/modules/clients/ClientInfos/SellerDetailTabs";
import { BailleurDetailTabs } from "../../components/modules/clients/ClientInfos/BailleurDetailTabs";
import { LocataireDetailTabs } from "../../components/modules/clients/ClientInfos/LocataireDetailTabs";
import { VoyageurDetailTabs } from "../../components/modules/clients/ClientInfos/VoyageurDetailTabs";
import { ClientHeader } from "../../components/modules/clients/ClientHeader";
import { ClientTimeline } from "../../components/modules/clients/ClientTimeline";
import { BuyerFormModal } from "../../components/modules/clients/BuyerFormModal";
import { SellerFormModal } from "../../components/modules/clients/SellerFormModal";
import { BailleurFormModal } from "../../components/modules/clients/BailleurFormModal";
import { LocataireFormModal } from "../../components/modules/clients/LocataireFormModal";
import { VoyageurFormModal } from "../../components/modules/clients/VoyageurFormModal";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../components/ui/Button";
import { BackLink } from "../../components/ui/BackLink";
import { Heart, Edit3, ExternalLink, Trash2, Lock } from "react-feather";
import { api } from "../../services/api";
import { deleteClient } from "../../services/clientService";
import { useToast } from "../../components/ui/Toast";
import { triggerMandatExpireNotification } from "../../services/automatorTrigger";
import { useMyPermissions, permissionAllowed } from "../../hooks/useMyPermissions";

// Import or define the sampleClients data
import { sampleClients } from "./index"; // Adjust the import path as needed

// Add mock events data to the sample clients
// In your enhancedClients mapping, add all required fields:
const enhancedClients = sampleClients.map(client => ({
  ...client,
  email: `${client.name.replace(' ', '.').toLowerCase()}@example.com`,
  // Add all required fields for ClientInfos
  area: client.area || "Paris", // Example default value
  minSurface: client.minSurface || 50, // Example default value
  rooms: client.rooms || "3", // Example default value
  specificCriteria: client.specificCriteria || ["Parking", "Balcon"], // Example
  comments: client.comments || "Client intéressé par les biens récents",
  // Financial fields
  contribution: client.contribution || 100000, // Example
  financingType: client.financingType || "Prêt bancaire", // Example
  loanDuration: client.loanDuration || 20, // Example
  documents: client.documents || [], // Example
  lastContact: client.lastContact || new Date().toISOString(),
  // Timeline events
  events: [
    {
      id: `event-${client.id}-1`,
      type: 'email',
      date: client.lastContact ? new Date(client.lastContact).toISOString() : new Date().toISOString(),
      summary: `Premier contact avec ${client.name}`,
      agent: "John Doe"
    }
  ]
}));


export default function ClientPage() {
  const { id, agentId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightActivityId = searchParams.get('tab') === 'notes_activite' ? Number(searchParams.get('activityId')) || undefined : undefined;
  const { toast } = useToast();
  const perms = useMyPermissions();
  const canRead = permissionAllowed(perms, 'clients-lecture');
  const canWrite = permissionAllowed(perms, 'clients-ecriture');
  const canDelete = permissionAllowed(perms, 'clients-supprimer');
  const canInfo = permissionAllowed(perms, 'clients-info-privees');
  const canExport = permissionAllowed(perms, 'clients-general-export');
  const permsLoaded = perms !== null;
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [liked, setLiked] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    api.get<any>('/auth/me').then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    if (permsLoaded && (!canRead || !canInfo)) {
      setLoading(false);
      setShowContent(true);
      return;
    }
    api.get<any>(`/clients/${id}`)
      .then(data => {
        setClient(data);
        setLoading(false);
        setShowContent(true);
      })
      .catch(() => {
        setClient(null);
        setLoading(false);
        setShowContent(true);
      });
  }, [id, permsLoaded, canRead, canInfo]);

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </ClientLayout>
    );
  }

  if (permsLoaded && (!canRead || !canInfo)) {
    return (
      <ClientLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-border/40 flex items-center justify-center mb-4">
            <Lock size={28} className="text-text-secondary" />
          </div>
          <h2 className="text-lg font-semibold">Client verrouillé</h2>
          <p className="text-sm text-text-secondary mt-1 max-w-sm">
            Vous n'avez pas la permission d'accéder aux informations privées de ce client. Contactez votre administrateur.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => navigate(agentId ? `/${agentId}/clients` : '/clients')}>Retour aux clients</Button>
        </div>
      </ClientLayout>
    );
  }

  if (!client) {
    return (
      <ClientLayout>
        <div className="text-center py-12">
          <p className="text-text/60">Client non trouvé</p>
        </div>
      </ClientLayout>
    );
  }

  const detailBackPath = agentId ? `/${agentId}/clients/type/${client.type?.toLowerCase() || ''}` : '/clients';

  const handleEditClient = async (updated: Omit<any, 'id'>) => {
    if (!client) return;
    const typeName = client.type || 'Client';
    try {
      await api.put(`/clients/${client.id}`, updated);
      const refreshed = await api.get<any>(`/clients/${client.id}`);
      setClient(refreshed);
      setDataRefreshKey(k => k + 1);

      const newStatutMandat = (updated as any).statutMandat
      const newDateExpiration = (updated as any).dateExpiration
      const isDateReached = newDateExpiration && new Date(newDateExpiration) <= new Date()
      if (newStatutMandat === 'Expire' || newStatutMandat?.toLowerCase() === 'expire' || isDateReached) {
        const clientParts = (client.name || '').split(' ')
        const prenom = clientParts[0] || ''
        const nom = clientParts.slice(1).join(' ') || ''
        try {
          await triggerMandatExpireNotification({
            bienTitre: `${(client as any).propertyType || 'Bien'} - ${client.area || ''}`.trim(),
            bienAdresse: client.area,
            clientPrenom: prenom,
            clientNom: nom,
            clientType: (client.type || 'Vendeur').toLowerCase(),
            mandatType: (updated as any).typeMandat || 'Mandat standard',
            mandatNumero: (updated as any).numeroMandat,
            dateExpiration: (updated as any).dateExpiration ? new Date((updated as any).dateExpiration).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
            agentNom: currentUser?.first_name && currentUser?.last_name ? `${currentUser.first_name} ${currentUser.last_name}` : currentUser?.email || 'Agent',
            agentEmail: currentUser?.email || undefined,
            bienConcerneId: (client as any).bienConcerneId || (updated as any).bienConcerneId,
            agentId: (client as any).agentId,
          })
        } catch (e) {
          console.error('triggerMandatExpireNotification failed:', e)
        }
      }

      toast('success', `${typeName} mis à jour avec succès`);
    } catch (err) {
      console.error('Failed to update client:', err);
      toast('error', `Erreur lors de la mise à jour du ${typeName.toLowerCase()}`);
    }
    setIsEditModalOpen(false);
  };

  return (
    <ClientLayout>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <BackLink to={detailBackPath} />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<Heart size={14} />}
            className={liked ? 'text-red-500' : ''}
            onClick={() => setLiked(!liked)}
          />
          {canWrite && <Button variant="outline" size="sm" icon={<Edit3 size={14} />}
            onClick={() => setIsEditModalOpen(true)}>Modifier</Button>}
          {canExport && <Button variant="ghost" size="sm" icon={<ExternalLink size={14} />}>Partager</Button>}
          {canDelete && (
            <Button variant="ghost" size="sm" icon={<Trash2 size={14} />}
              className="text-error hover:bg-error/5"
              onClick={async () => {
                const typeName = client.type || 'Client';
                try {
                  await deleteClient(client.id);
                  toast('success', `${typeName} supprimé`);
                  navigate(detailBackPath);
                } catch (err) {
                  console.error('Failed to delete client:', err);
                  toast('error', `Erreur lors de la suppression du ${typeName.toLowerCase()}`);
                }
              }}
            >Supprimer</Button>
          )}
        </div>
      </div>
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-4"
          >
            <ClientHeader key={dataRefreshKey} client={client} />
            {client.type === 'Acheteur' ? (
              <motion.div
                key={dataRefreshKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <BuyerDetailTabs client={client} agentId={agentId} highlightActivityId={highlightActivityId} />
              </motion.div>
            ) : client.type === 'Vendeur' ? (
              <motion.div
                key={dataRefreshKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <SellerDetailTabs client={client} agentId={agentId} highlightActivityId={highlightActivityId} />
              </motion.div>
            ) : client.type === 'Bailleur' ? (
              <motion.div
                key={dataRefreshKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <BailleurDetailTabs client={client} highlightActivityId={highlightActivityId} />
              </motion.div>
            ) : client.type === 'Locataire' ? (
              <motion.div
                key={dataRefreshKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <LocataireDetailTabs client={client} agentId={agentId} highlightActivityId={highlightActivityId} />
              </motion.div>
            ) : client.type === 'Voyageur' ? (
              <motion.div
                key={dataRefreshKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <VoyageurDetailTabs client={client} agentId={agentId} highlightActivityId={highlightActivityId} />
              </motion.div>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  <ClientInfos client={client} />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <ClientTimeline events={client.events} />
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isEditModalOpen && client && client.type === 'Acheteur' && (
        <BuyerFormModal onClose={() => setIsEditModalOpen(false)} onSubmit={handleEditClient} client={client} />
      )}
      {isEditModalOpen && client && client.type === 'Vendeur' && (
        <SellerFormModal onClose={() => setIsEditModalOpen(false)} onSubmit={handleEditClient} client={client} />
      )}
      {isEditModalOpen && client && client.type === 'Bailleur' && (
        <BailleurFormModal onClose={() => setIsEditModalOpen(false)} onSubmit={handleEditClient} client={client} />
      )}
      {isEditModalOpen && client && client.type === 'Locataire' && (
        <LocataireFormModal onClose={() => setIsEditModalOpen(false)} onSubmit={handleEditClient} client={client} />
      )}
      {isEditModalOpen && client && client.type === 'Voyageur' && (
        <VoyageurFormModal onClose={() => setIsEditModalOpen(false)} onSubmit={handleEditClient} client={client} />
      )}
    </ClientLayout>
  );
}
