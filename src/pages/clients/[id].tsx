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
import { Heart, Edit3, ExternalLink, Trash2, Lock, ArrowLeft } from "react-feather";
import { api } from "../../services/api";
import { deleteClient } from "../../services/clientService";
import { useToast } from "../../components/ui/Toast";
import { triggerMandatExpireNotification } from "../../services/automatorTrigger";
import { useMyPermissions, permissionAllowed } from "../../hooks/useMyPermissions";
import { useStageTheme } from "../../components/dashboard/Stage";

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
  const stageTheme = useStageTheme();
  const isDark = stageTheme === 'dark';

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
      {/* ── Staged action bar: Retour + quick actions (fluid entrance) ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-4 flex flex-wrap items-center justify-between gap-3"
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={`group inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold backdrop-blur-md transition-all ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white' : 'border-teal-900/10 bg-white/60 text-teal-900/60 hover:border-teal-900/20 hover:bg-white hover:text-teal-900'}`}
        >
          <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
          Retour
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            title="J'aime"
            onClick={() => setLiked(!liked)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white' : 'border-teal-900/10 bg-white/60 text-slate-500 shadow-sm hover:bg-white hover:text-slate-900'}`}
          >
            <Heart size={15} fill={liked ? 'currentColor' : 'none'} className={liked ? 'text-rose-500' : ''} />
          </motion.button>
          {canWrite && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-xs font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95"
              style={isDark
                ? { backgroundImage: 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 26px -8px rgba(124,92,255,0.65)' }
                : { backgroundImage: 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 26px -10px rgba(13,148,136,0.6)' }}
            >
              <Edit3 size={14} />
              Modifier
            </motion.button>
          )}
          {canExport && (
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-teal-900/10 bg-white/60 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900'}`}
            >
              <ExternalLink size={14} />
              Partager
            </button>
          )}
          {canDelete && (
            <button
              type="button"
                onClick={async () => {
                  const typeName = client.type || 'Client';
                  try {
                    await deleteClient(client.id);
                    toast('success', `${typeName} supprimé`);
                    navigate(-1);
                } catch (err) {
                  console.error('Failed to delete client:', err);
                  toast('error', `Erreur lors de la suppression du ${typeName.toLowerCase()}`);
                }
              }}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-rose-400/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200' : 'border-rose-200/80 bg-rose-50/70 text-rose-600 shadow-sm hover:bg-rose-50 hover:text-rose-700'}`}
            >
              <Trash2 size={14} />
              Supprimer
            </button>
          )}
        </div>
      </motion.div>
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

      <AnimatePresence>
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
      </AnimatePresence>
    </ClientLayout>
  );
}
