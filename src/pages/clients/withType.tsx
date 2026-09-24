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
  BarChart2, UserCheck, UserX, Target, Calendar, Home, ArrowUp, ArrowDown, CheckCircle, Sun, Users, Search, Sliders, X, TrendingUp, Layers, Info, ArrowLeft, Plus, Zap
} from 'react-feather';
import { api } from '../../services/api';
import { triggerMandatExpireNotification } from '../../services/automatorTrigger';
import { useMyPermissions, permissionAllowed } from '../../hooks/useMyPermissions';
import { Lock } from 'react-feather';
import { useStageChrome } from '../../components/modules/calendar/useStageChrome';
import { Stage, StageStatCard, StagePanel, StageBadge, STAGE_HUES, useStageTheme } from '../../components/dashboard/Stage';

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
  { value: 'En negociation', label: 'En négociation' },
  { value: 'En location', label: 'En location' },
  { value: 'Loue', label: 'Loué' },
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
  const { staged, dark } = useStageChrome();
  const theme = useStageTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  useEffect(() => { api.get<any>('/auth/me').then(setCurrentUser).catch(() => {}); }, []);
  useEffect(() => {
    if (sessionStorage.getItem('openNewClientModal') === '1') {
      sessionStorage.removeItem('openNewClientModal');
      const contactId = sessionStorage.getItem('selectedContactId') || undefined;
      if (contactId) sessionStorage.removeItem('selectedContactId');
      setSelectedContactId(contactId);
      setIsModalOpen(true);
    }
  }, []);
  useEffect(() => { if (!currentUser) return; fetchClients({ agent_id: String(currentUser.id) }).then(setClients).catch(() => {}); }, [currentUser]);

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

  useEffect(() => { if (resumeDraftId) setIsModalOpen(true); }, [resumeDraftId]);
  const clientTypeName = typeLabels[type || ''] || 'Client';

  const handleAddClient = async (newClient: Omit<Client, 'id'>) => {
    try {
      await createClient(newClient);
      const agentParams = currentUser ? { agent_id: String(currentUser.id) } : undefined;
      const updated = await fetchClients(agentParams);
      setClients(updated);
      toast('success', `${clientTypeName} ajouté avec succès`);
    } catch (err) { console.error('Failed to create client:', err); toast('error', `Erreur lors de la création du ${clientTypeName.toLowerCase()}`); }
    setIsModalOpen(false);
  };
  const handleEditClient = (client: any) => { setEditingClient(client); setIsModalOpen(true); };
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
            clientPrenom: prenom, clientNom: nom, clientType: (editingClient.type || 'Vendeur').toLowerCase(),
            mandatType: (updatedData as any).typeMandat || 'Mandat standard', mandatNumero: (updatedData as any).numeroMandat,
            dateExpiration: newDateExpiration ? new Date(newDateExpiration).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
            agentNom, agentEmail: currentUser?.email || undefined, bienConcerneId: (editingClient as any).bienConcerneId || (updatedData as any).bienConcerneId,
          })
        } catch (e) { console.error('triggerMandatExpireNotification failed:', e) }
      }
      toast('success', `${clientTypeName} mis à jour avec succès`);
    } catch (err) { console.error('Failed to update client:', err); toast('error', `Erreur lors de la mise à jour du ${clientTypeName.toLowerCase()}`); }
    setIsModalOpen(false); setEditingClient(null);
  };
  const handleDeleteClient = async (id: string) => {
    try {
      await deleteClient(id);
      const agentParams = currentUser ? { agent_id: String(currentUser.id) } : undefined;
      const updated = await fetchClients(agentParams);
      setClients(updated);
      toast('success', `${clientTypeName} supprimé`);
    } catch (err) { console.error('Failed to delete client:', err); toast('error', `Erreur lors de la suppression du ${clientTypeName.toLowerCase()}`); }
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

  const heroHue = (() => {
    const map: Record<string, any> = { acheteur: STAGE_HUES.violet, vendeur: STAGE_HUES.sky, bailleur: STAGE_HUES.emerald, locataire: STAGE_HUES.amber, voyageur: STAGE_HUES.fuchsia };
    return map[type || ''] || STAGE_HUES.violet;
  })();

  if (permsLoaded && !canRead) {
    return (
      <Stage theme={theme}>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-border/40 flex items-center justify-center mb-4"><Lock size={28} className="text-text-secondary" /></div>
          <h2 className="text-lg font-semibold">Clients verrouillés</h2>
          <p className="text-sm text-text-secondary mt-1 max-w-sm">Vous n'avez pas la permission d'accéder aux clients. Contactez votre administrateur.</p>
        </div>
      </Stage>
    );
  }

  return (
    <Stage theme={theme}>
      <div className="space-y-6 animate-fade-in">
        {/* Retour — Stage ghost */}
        <button
          onClick={() => navigate(-1)}
          className={`group inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold backdrop-blur-md transition-all ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/10' : 'border-teal-900/10 bg-white/60 text-teal-900/60 hover:text-teal-900 hover:border-teal-900/20 hover:bg-white'}`}
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          Retour
        </button>

        {/* Hero — holographic */}
        <div className="stage-glass relative overflow-hidden p-5 sm:p-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${heroHue.glow.replace(/[\d.]+\)$/, '0.18)')}, transparent 70%)` }} />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full pointer-events-none opacity-40" style={{ background: `radial-gradient(circle, ${heroHue.a}18, transparent 70%)` }} />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" /></span>
                <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>Clients — {typeLabels[type || ''] || type} · Vos clients</p>
              </div>
              <h1 className={`mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent' : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent'}`}>{typeLabels[type || '']}s — Vos clients</h1>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>Gérez vos {typeLabels[type || '']?.toLowerCase()}s · Suivi personnalisé et complet</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: heroHue.a + '22', background: heroHue.a + '14', color: heroHue.a }}>
                  <Users size={12} />
                  {typeStats.total} total
                </span>
                {typeStats.actifs > 0 && <span className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: 'rgba(52,211,153,0.18)', background: 'rgba(52,211,153,0.10)', color: '#059669' }}><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.4)]" />{typeStats.actifs} actifs</span>}
                {typeStats.enNegociation > 0 && <span className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: 'rgba(245,158,11,0.18)', background: 'rgba(245,158,11,0.10)', color: '#B45309' }}><span className="w-2 h-2 rounded-full bg-amber-500" />{typeStats.enNegociation} en cours</span>}
                {typeStats.nouveauCeMois > 0 && <span className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: 'rgba(139,92,246,0.18)', background: 'rgba(139,92,246,0.10)', color: '#7C3AED' }}><span className="w-2 h-2 rounded-full bg-violet-500" />{typeStats.nouveauCeMois} ce mois</span>}
              </div>
            </div>
            {canWrite && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                style={{
                  backgroundImage: isDark ? 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)' : 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)',
                  boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 26px -8px rgba(124,92,255,0.65)' : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 26px -10px rgba(13,148,136,0.6)',
                }}
              >
                <Plus size={16} />
                Nouveau client
                <Zap size={14} className="opacity-80" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StageStatCard icon={Target} label={`Total ${typeLabels[type || '']?.toLowerCase()}s`} value={typeStats.total} hue={heroHue} spark={[2, 4, 3, 6, 5, 8]} />
          <StageStatCard icon={UserCheck} label="Actifs" value={typeStats.actifs} hue={STAGE_HUES.emerald} spark={[2, 4, 3, 5, 4, 6]} />
          <StageStatCard icon={UserX} label="Inactifs" value={typeStats.inactifs} hue={STAGE_HUES.fuchsia} spark={[1, 1, 2, 1, 2, 1]} />
          <StageStatCard icon={type === 'voyageur' ? CheckCircle : BarChart2} label={type === 'locataire' ? 'Bails signés' : type === 'voyageur' ? 'Réservations' : 'En négociation'} value={typeStats.enNegociation} hue={STAGE_HUES.amber} spark={[1, 2, 3, 2, 4, 3]} />
          <StageStatCard icon={Calendar} label={`${typeLabels[type || '']?.toLowerCase()}s ce mois`} value={typeStats.nouveauCeMois} hue={STAGE_HUES.sky} spark={[1, 2, 1, 3, 2, 4]} />
          <StageStatCard icon={type === 'voyageur' ? Sun : Home} label={type === 'vendeur' ? 'Biens en stock' : type === 'bailleur' ? 'Biens en location' : 'Biens proposés'} value={typeStats.biensProposes} hue={STAGE_HUES.violet} spark={[1, 3, 2, 4, 3, 5]} />
        </div>

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
          <ClientDraftSection key={draftVersion} userId={String(currentUser.id)} clientType={typeLabels[type || '']} onResume={(draft) => setResumeDraftId(draft.id)} />
        )}

        {/* Recherche & Filtres — holographic Stage */}
        <div
          className="overflow-hidden rounded-2xl border"
          style={{
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)',
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.62)',
            boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.05)' : 'inset 0 1px 0 rgba(255,255,255,0.85), 0 10px 28px -16px rgba(13,148,136,0.18)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}` }}>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border" style={{ borderColor: isDark ? 'rgba(167,139,250,0.22)' : 'rgba(20,184,166,0.18)', background: isDark ? 'rgba(167,139,250,0.12)' : 'rgba(20,184,166,0.10)', color: isDark ? '#A78BFA' : '#0D9488' }}>
              <Search size={14} />
            </span>
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Recherche & filtres</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>{filteredClients.length} résultat{filteredClients.length !== 1 ? 's' : ''} · Affinez votre recherche</p>
            </div>
            {statusFilter !== 'all' && (
              <button onClick={() => setStatusFilter('all')} className={`ml-auto inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${isDark ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10' : 'border-teal-900/10 bg-white text-teal-700 hover:bg-teal-50'}`}>
                <X size={11} />
                Effacer filtre
              </button>
            )}
          </div>
          <div className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative group">
                <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-500 group-focus-within:text-violet-300' : 'text-slate-400 group-focus-within:text-teal-600'}`} />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par nom, téléphone, email..."
                  className={`w-full h-10 pl-9 pr-3 text-sm rounded-xl border backdrop-blur-md transition-all focus:outline-none ${isDark ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-slate-500 focus:border-violet-400/40 focus:bg-white/[0.06]' : 'bg-white border-teal-900/10 text-slate-900 placeholder:text-slate-400 focus:border-teal-500/30 focus:bg-white'}`}
                />
              </div>
              <div className="w-full sm:w-64">
                <FilterDropdown
                  label=""
                  options={isAcheteur ? ACHETEUR_STATUS_OPTIONS : isVendeur ? VENDEUR_STATUS_OPTIONS : isBailleur ? BAILLEUR_STATUS_OPTIONS : isLocataire ? LOCATAIRE_STATUS_OPTIONS : isVoyageur ? VOYAGEUR_STATUS_OPTIONS : [
                    { value: 'all', label: 'Tous statuts' }, { value: 'Actif', label: 'Actif' }, { value: 'En négociation', label: 'En négociation' }, { value: 'Contrat signé', label: 'Contrat signé' }, { value: 'Inactif', label: 'Inactif' },
                  ]}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-[11px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Filtres rapides:</span>
              {[
                { v: 'all', l: 'Tous' },
                { v: 'Actif', l: 'Actifs' },
                { v: 'En recherche', l: 'En recherche' },
                { v: 'En negociation', l: 'Négociation' },
              ].map((f) => (
                <button
                  key={f.v}
                  onClick={() => setStatusFilter(f.v)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${statusFilter === f.v ? (isDark ? 'bg-violet-500 text-white border-violet-400 shadow-[0_4px_12px_rgba(124,92,255,0.35)]' : 'bg-teal-600 text-white border-teal-500 shadow-[0_4px_12px_rgba(13,148,136,0.3)]') : (isDark ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700')}`}
                >
                  {f.l}
                </button>
              ))}
              <span className={`ml-auto hidden sm:inline-flex items-center gap-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <Layers size={11} />
                {filteredClients.length} sur {typeStats.total}
              </span>
            </div>
          </div>
        </div>

        {/* Liste des clients — holographic cards */}
        <div
          className="overflow-hidden rounded-2xl border"
          style={{
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)',
            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.45)',
            boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.04)' : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 12px 28px -18px rgba(13,148,136,0.16)',
          }}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}` }}>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border" style={{ borderColor: isDark ? 'rgba(167,139,250,0.22)' : 'rgba(20,184,166,0.18)', background: isDark ? 'rgba(167,139,250,0.12)' : 'rgba(20,184,166,0.10)', color: isDark ? '#A78BFA' : '#0D9488' }}>
                <Users size={14} />
              </span>
              <div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Liste des clients</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>{filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} · {typeLabels[type || ''] || 'Client'} · Cartes holographiques</p>
              </div>
            </div>
            <span className={`hidden sm:inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
              <TrendingUp size={11} />
              {filteredClients.length} affichés
            </span>
          </div>
          {filteredClients.length === 0 ? (
            <div className="py-14 text-center">
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border ${isDark ? 'bg-white/5 border-white/10 text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}>
                <Search size={22} />
              </div>
              <p className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Aucun client trouvé</p>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Essayez de modifier vos filtres ou créez un nouveau client</p>
              {canWrite && (
                <button onClick={() => setIsModalOpen(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: `linear-gradient(145deg, ${heroHue.a}, ${heroHue.b})`, boxShadow: `0 8px 20px -8px ${heroHue.glow}` }}>
                  <Plus size={14} />
                  Nouveau client
                </button>
              )}
            </div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-fr">
                {filteredClients.map((client) => (
                  <div key={client.id} className="group relative overflow-hidden rounded-2xl border p-0.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.7)' }}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(400px circle at 50% -10%, ${heroHue.a}14, transparent 60%)` }} />
                    <div className="relative h-full">
                      <ClientCard client={client} agentId={agentId} onEdit={handleEditClient} onDelete={handleDeleteClient} locked={!canInfo} canEdit={canWrite} canDelete={canDelete} canExport={canExport} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className={`flex items-center justify-between border-t px-4 py-2.5 text-xs ${isDark ? 'border-white/5 bg-white/[0.02] text-slate-500' : 'border-slate-100 bg-slate-50/50 text-slate-500'}`}>
            <span className="flex items-center gap-1.5">
              <Info size={11} />
              Cliquez sur une carte pour voir la fiche complète
            </span>
            <span className="hidden sm:inline">{filteredClients.length} · {typeLabels[type || ''] || 'Client'}</span>
          </div>
        </div>
      </div>
    </Stage>
  );
}

function KpiCard({ icon: Icon, label, value, color, bg, evolution, up }: { icon: any; label: string; value: number; color: string; bg: string; evolution?: string; up?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border/50 shadow-card p-4 hover:shadow-card-hover transition-all">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">{label}</p>
        <div className={`p-2 rounded-lg ${bg}`}><Icon size={14} className={color} /></div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {evolution && <div className={`flex items-center gap-1 mt-1 text-xs ${up ? 'text-emerald-600' : 'text-red-500'}`}>{up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}<span>{evolution}</span><span className="text-text-secondary/50 ml-1">vs mois dernier</span></div>}
    </motion.div>
  );
}
