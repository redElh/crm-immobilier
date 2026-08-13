import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Prospect } from '../../types/prospect';
import { SearchInput } from '../../components/ui/SearchInput';
import { FilterDropdown } from '../../components/ui/FilterDropdown';
import { Button } from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Dialog } from '../../components/ui/Dialog';
import { Plus, Users, UserPlus, Phone, CheckCircle, Clock, AlertTriangle, TrendingUp, DollarSign, Search, ArrowUp, ArrowDown } from 'react-feather';
import { ProspectCard } from '../../components/modules/prospects/ProspectCard';
import { ProspectFormModal } from '../../components/modules/prospects/ProspectFormModal';
import { ProspectDraftSection } from '../../components/modules/prospects/ProspectDraftSection';
import { ReminderModal } from '../../components/modules/prospects/ReminderModal';
import { QualificationPocket } from '../../components/modules/prospects/QualificationPocket';
import { ContactFormModal } from '../../components/modules/contacts/ContactFormModal';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/Toast';
import { createProspect, updateProspect, deleteProspect, updateProspectStatus, scheduleReminder, updateReminder, cancelReminder, fetchProspects } from '../../services/prospectService';
import { createContact } from '../../services/contactService';
import { useMyPermissions, permissionAllowed } from '../../hooks/useMyPermissions';
import { ActionChoiceModal } from '../../components/modules/prospects/ActionChoiceModal';
import { Lock } from 'react-feather';
import type { ProspectDraft } from '../../services/prospectDraftStorage';

const ORIGINS = ['Site web', 'Référence', 'Appel téléphonique', 'Réseaux sociaux', 'Recommandation', 'Mubawab', 'Properstar', 'Green-Acres'];

export default function ProspectsPage() {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const { toast } = useToast();
  const perms = useMyPermissions();
  const canRead = permissionAllowed(perms, 'prospects-lecture');
  const canWrite = permissionAllowed(perms, 'prospects-ecriture');
  const permsLoaded = perms !== null;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProspect, setEditProspect] = useState<Prospect | undefined>();
  const [draftId, setDraftId] = useState<string | undefined>();
  const [draftChange, setDraftChange] = useState(0);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchProspects()
      .then(setProspects)
      .catch(() => toast('error', 'Erreur lors du chargement des prospects'))
      .finally(() => setLoading(false));
  }, [toast]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTargetId, setReminderTargetId] = useState<string | null>(null);
  const [reminderTargetName, setReminderTargetName] = useState('');
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertProspect, setConvertProspect] = useState<Prospect | undefined>();
  const [qualifiedRefresh, setQualifiedRefresh] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const [showActionChoice, setShowActionChoice] = useState(false);
  const [actionChoiceProspect, setActionChoiceProspect] = useState<Prospect | undefined>();
  const [showEditReminder, setShowEditReminder] = useState(false);
  const [editReminderTarget, setEditReminderTarget] = useState<Prospect | undefined>();
  const userId = agentId || '1';

  const filteredProspects = useMemo(() => {
    return prospects.filter((p) => {
      const matchesSearch =
        p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesOrigin = originFilter === 'all' || p.origin === originFilter;
      const matchesType = typeFilter === 'all' || p.type === typeFilter;
      return matchesSearch && matchesStatus && matchesOrigin && matchesType;
    });
  }, [prospects, searchTerm, statusFilter, originFilter, typeFilter]);

  const kpiData = useMemo(() => {
    const total = prospects.length;
    const nouveaux = prospects.filter(p => p.status === 'Nouveau').length;
    const contactes = prospects.filter(p => p.status === 'Contacté').length;
    const qualifies = prospects.filter(p => p.status === 'Qualifié').length;
    const enAttente = prospects.filter(p => p.status === 'En attente').length;
    const perdus = prospects.filter(p => p.status === 'Perdu').length;
    const convertis = prospects.filter(p => p.status === 'Converti').length;
    const tauxConv = total > 0 ? ((convertis / total) * 100).toFixed(1) : '0';
    return { total, nouveaux, contactes, qualifies, enAttente, perdus, convertis, tauxConv };
  }, [prospects]);

  const kpiCards = [
    { label: 'Total prospects', value: kpiData.total, evolution: '+18%', up: true, icon: Users, color: 'text-accent', bg: 'bg-accent-light' },
    { label: 'Nouveaux', value: kpiData.nouveaux, evolution: '+25%', up: true, icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Contactés', value: kpiData.contactes, evolution: '+10%', up: true, icon: Phone, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Qualifiés', value: kpiData.qualifies, evolution: '+8%', up: true, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'En attente', value: kpiData.enAttente, evolution: '-5%', up: false, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Perdus', value: kpiData.perdus, evolution: '0%', up: true, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Convertis', value: kpiData.convertis, evolution: '+15%', up: true, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Taux conv.', value: `${kpiData.tauxConv}%`, evolution: '+2%', up: true, icon: DollarSign, color: 'text-accent', bg: 'bg-accent-light' },
  ];

  const handleStatusChange = useCallback(async (prospectId: string, status: Prospect['status']) => {
    try {
      const updated = await updateProspectStatus(prospectId, status);
      setProspects(prev => prev.map(p => p.id === updated.id ? updated : p));
      if (status === 'Qualifié') setQualifiedRefresh(c => c + 1);
      toast('success', `Statut changé en "${status}"`);
    } catch {
      toast('error', 'Erreur lors du changement de statut');
    }
  }, [toast]);

  const handleReminderConfirm = useCallback(async (reminderDate: string, reminderNote: string) => {
    if (!reminderTargetId) return;
    try {
      const updated = await scheduleReminder(reminderTargetId, reminderDate, reminderNote);
      setProspects(prev => prev.map(p => p.id === updated.id ? updated : p));
      setShowReminderModal(false);
      setReminderTargetId(null);
      toast('success', 'Rappel programmé');
    } catch {
      toast('error', 'Erreur lors de la programmation du rappel');
    }
  }, [reminderTargetId, toast]);

  const handleEditReminderSubmit = useCallback(async (reminderDate: string, reminderNote: string) => {
    if (!editReminderTarget) return;
    try {
      const updated = await updateReminder(editReminderTarget.id, reminderDate, reminderNote);
      setProspects(prev => prev.map(p => p.id === updated.id ? updated : p));
      setShowEditReminder(false);
      setEditReminderTarget(undefined);
      toast('success', 'Rappel mis à jour');
    } catch {
      toast('error', 'Erreur lors de la mise à jour du rappel');
    }
  }, [editReminderTarget, toast]);

  const handleCancelReminder = useCallback(async () => {
    if (!editReminderTarget) return;
    try {
      const updated = await cancelReminder(editReminderTarget.id);
      setProspects(prev => prev.map(p => p.id === updated.id ? updated : p));
      setShowEditReminder(false);
      setEditReminderTarget(undefined);
      toast('success', 'Rappel supprimé — retour au statut "Contacté"');
    } catch {
      toast('error', 'Erreur lors de la suppression du rappel');
    }
  }, [editReminderTarget, toast]);

  const handleConvert = useCallback((prospect: Prospect) => {
    setConvertProspect(prospect);
    setShowConvertModal(true);
  }, []);

  const handleQualifyDirect = useCallback(async (prospectId: string) => {
    try {
      const current = prospects.find(p => p.id === prospectId);
      const updated = await updateProspectStatus(prospectId, 'Qualifié', {
        qualificationData: { previousStatus: current?.status || 'Nouveau' },
      });
      setProspects(prev => prev.map(p => p.id === updated.id ? updated : p));
      setQualifiedRefresh(c => c + 1);
      toast('success', 'Prospect qualifié');
    } catch {
      toast('error', 'Erreur lors de la qualification');
    }
  }, [prospects, toast]);

  const handleStatusReverted = useCallback((updated: Prospect) => {
    setProspects(prev => prev.map(p => p.id === updated.id ? updated : p));
  }, []);

  const handleConvertSubmit = useCallback(async (data: any) => {
    if (!convertProspect) return;
    try {
      const merged = {
        ...convertProspect.qualificationData,
        ...data,
        firstName: convertProspect.firstName,
        lastName: convertProspect.lastName,
        civility: convertProspect.civility,
        mobile: convertProspect.phone,
        emailPrincipal: convertProspect.email,
        langueParlee: convertProspect.spokenLanguage ? [convertProspect.spokenLanguage] : [],
        devisePreferee: convertProspect.currency || 'MAD',
        ville: convertProspect.location || '',
        commentairePrive: `[Prospect #${convertProspect.id}] ${convertProspect.message || ''}`,
        originalProspectId: convertProspect.id,
      };
      const created = await createContact(merged);
      await updateProspectStatus(convertProspect.id, 'Converti', { contactId: created.id });
      setProspects(prev => prev.map(p => p.id === convertProspect.id ? { ...p, status: 'Converti' as const } : p));
      setShowConvertModal(false);
      setConvertProspect(undefined);
      setQualifiedRefresh(c => c + 1);
      toast('success', 'Prospect converti en contact avec succès');
    } catch {
      toast('error', 'Erreur lors de la conversion');
    }
  }, [convertProspect, toast]);

  const handleAddProspect = async (data: Omit<Prospect, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editProspect) {
        const updated = await updateProspect(editProspect.id, data);
        setProspects((prev) => prev.map(p => p.id === updated.id ? updated : p));
        setIsModalOpen(false);
        setEditProspect(undefined);
        toast('success', 'Prospect modifié avec succès');
      } else {
        const created = await createProspect(data);
        setProspects((prev) => [created, ...prev]);
        setIsModalOpen(false);
        toast('success', 'Prospect créé avec succès');
      }
    } catch {
      toast('error', editProspect ? 'Erreur lors de la modification' : 'Erreur lors de la création du prospect');
    }
  };

  if (permsLoaded && !canRead) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-border/40 flex items-center justify-center mb-4">
          <Lock size={28} className="text-text-secondary" />
        </div>
        <h2 className="text-lg font-semibold">Prospects inaccessibles</h2>
        <p className="text-sm text-text-secondary mt-1 max-w-sm">
          Vous n'avez pas la permission de consulter les prospects. Contactez votre administrateur.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prospects - Vue d'ensemble</h1>
          <p className="text-sm text-text-secondary mt-1">
            {kpiData.total} prospects · {kpiData.nouveaux} nouveaux · {kpiData.qualifies} qualifiés · {kpiData.convertis} convertis
          </p>
          {kpiData.nouveaux > 0 && (
            <p className="text-[11px] text-blue-600/70 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              {kpiData.nouveaux} prospect{kpiData.nouveaux !== 1 ? 's' : ''} en attente de prise de contact
            </p>
          )}
        </div>
        {canWrite && (
          <Button variant="default" icon={<Plus size={14} />} onClick={() => { setEditProspect(undefined); setIsModalOpen(true); }}>
            Nouveau prospect
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl border border-border/50 shadow-card p-4 hover:shadow-card-hover transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">{kpi.label}</p>
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <Icon size={14} className={kpi.color} />
                </div>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <div className={`flex items-center gap-1 mt-1 text-xs ${kpi.up ? 'text-emerald-600' : 'text-red-500'}`}>
                {kpi.up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                <span>{kpi.evolution}</span>
                <span className="text-text-secondary/50 ml-1">vs mois dernier</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Search + Filters */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, email ou téléphone..."
            />
          </div>
          <FilterDropdown
            label="Statut"
            options={[
              { value: 'all', label: 'Tous les statuts' },
              { value: 'Nouveau', label: 'Nouveau' },
              { value: 'Contacté', label: 'Contacté' },
              { value: 'Qualifié', label: 'Qualifié' },
              { value: 'En attente', label: 'En attente' },
              { value: 'Perdu', label: 'Perdu' },
              { value: 'Converti', label: 'Converti' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <FilterDropdown
            label="Origine"
            options={[
              { value: 'all', label: 'Toutes les origines' },
              ...ORIGINS.map(o => ({ value: o, label: o })),
            ]}
            value={originFilter}
            onChange={setOriginFilter}
          />
          <FilterDropdown
            label="Type"
            options={[
              { value: 'all', label: 'Tous les types' },
              { value: 'Acheter', label: 'Acheter' },
              { value: 'Louer', label: 'Louer' },
              { value: 'Vendre', label: 'Vendre' },
              { value: 'Faire estimer', label: 'Faire estimer' },
            ]}
            value={typeFilter}
            onChange={setTypeFilter}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
          </div>
        ) : filteredProspects.length === 0 ? (
          <div className="text-center py-12">
            <Search size={32} className="text-text-secondary/20 mx-auto mb-3" />
            <p className="text-text-secondary font-medium">Aucun prospect trouvé</p>
            <p className="text-xs text-text-secondary/60 mt-1">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {filteredProspects.map((prospect) => (
              <ProspectCard
                key={prospect.id}
                prospect={prospect}
                canWrite={canWrite}
                onClick={() => navigate(`/prospects/${prospect.id}`)}
                onEdit={(p) => {
                  if (p.status === 'En attente') {
                    setActionChoiceProspect(p);
                    setShowActionChoice(true);
                  } else {
                    setEditProspect(p);
                    setIsModalOpen(true);
                  }
                }}
                onDelete={(id) => { setDeleteTargetId(id); setShowDeleteDialog(true); setDeleteConfirm(''); }}
                onStatusChange={handleStatusChange}
                onCalendarClick={(id, name) => { setReminderTargetId(id); setReminderTargetName(name); setShowReminderModal(true); }}
                onQualifyClick={(p) => { setEditProspect(p); setIsModalOpen(true); }}
                onQualify={handleQualifyDirect}
                onMarkLost={(id) => handleStatusChange(id, 'Perdu')}
                onViewContact={(contactId) => navigate(`/contacts/${contactId}`)}
              />
            ))}
          </div>
        )}
      </Card>

      {isModalOpen && (
        <ProspectFormModal
          onClose={() => { setIsModalOpen(false); setEditProspect(undefined); setDraftId(undefined); }}
          onSubmit={handleAddProspect}
          prospect={editProspect}
          draftId={draftId}
          userId={userId}
          onDraftChange={() => setDraftChange(c => c + 1)}
        />
      )}

      {canWrite && (
        <ProspectDraftSection
          userId={userId}
          draftChange={draftChange}
          onCountChange={setDraftCount}
          onResume={(draft: ProspectDraft) => {
            setDraftId(draft.id);
            setIsModalOpen(true);
          }}
        />
      )}

      {showReminderModal && (
        <ReminderModal
          onClose={() => { setShowReminderModal(false); setReminderTargetId(null); }}
          onConfirm={handleReminderConfirm}
          prospectName={reminderTargetName}
        />
      )}

      {showActionChoice && actionChoiceProspect && (
        <ActionChoiceModal
          onClose={() => { setShowActionChoice(false); setActionChoiceProspect(undefined); }}
          onEditInfo={() => {
            setEditProspect(actionChoiceProspect);
            setShowActionChoice(false);
            setIsModalOpen(true);
          }}
          onEditReminder={() => {
            setEditReminderTarget(actionChoiceProspect);
            setShowActionChoice(false);
            setShowEditReminder(true);
          }}
          prospectName={`${actionChoiceProspect.civility} ${actionChoiceProspect.firstName} ${actionChoiceProspect.lastName}`}
          currentReminder={actionChoiceProspect.reminderDate}
        />
      )}

      {showEditReminder && editReminderTarget && (
        <ReminderModal
          onClose={() => { setShowEditReminder(false); setEditReminderTarget(undefined); }}
          onConfirm={handleEditReminderSubmit}
          onCancel={handleCancelReminder}
          prospectName={`${editReminderTarget.civility} ${editReminderTarget.firstName} ${editReminderTarget.lastName}`}
          mode="edit"
          initialDate={editReminderTarget.reminderDate ? editReminderTarget.reminderDate.split('T')[0] : ''}
          initialTime={editReminderTarget.reminderDate ? new Date(editReminderTarget.reminderDate).toTimeString().slice(0, 5) : '09:00'}
          initialNote={editReminderTarget.reminderNote || ''}
        />
      )}

      <QualificationPocket onConvert={handleConvert} refreshTrigger={qualifiedRefresh} onStatusReverted={handleStatusReverted} offset={draftCount > 0} canWrite={canWrite} />

      {showConvertModal && convertProspect && (
        <ContactFormModal
          onClose={() => { setShowConvertModal(false); setConvertProspect(undefined); }}
          onSubmit={handleConvertSubmit}
          contact={{
            id: '',
            type: 'Particulier',
            civility: convertProspect.civility as any,
            firstName: convertProspect.firstName,
            lastName: convertProspect.lastName,
            emailPrincipal: convertProspect.email,
            emailSecondaire: '',
            mobile: convertProspect.phone,
            telephoneFixe: '',
            profession: '',
            lieuNaissance: '',
            dateNaissance: '',
            nationalite: '',
            numeroFiscal: '',
            adresse: '',
            adresse2: '',
            codePostal: '',
            ville: convertProspect.location || '',
            pays: '',
            moyenContactPrefere: '',
            langueParlee: convertProspect.spokenLanguage ? [convertProspect.spokenLanguage] : [],
            devisePreferee: convertProspect.currency || 'MAD',
            prescripteur: '',
            regimeMatrimonial: '',
            siteInternet: '',
            commentairePrive: `[Prospect #${convertProspect.id}] ${convertProspect.message || ''}`,
            originalProspectId: convertProspect.id,
            mandats: [],
            createdAt: '',
            updatedAt: '',
          }}
        />
      )}

      <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer le prospect" size="sm">
        {(() => {
          const target = prospects.find(p => p.id === deleteTargetId);
          if (!target) return null;
          return (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                Voulez-vous vraiment supprimer <span className="font-semibold text-text-primary">{target.firstName} {target.lastName}</span> ?
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
                  if (!deleteTargetId || deleteConfirm !== 'SUPPRIMER') return;
                  try {
                    await deleteProspect(deleteTargetId);
                    setProspects(prev => prev.filter(p => p.id !== deleteTargetId));
                    toast('success', `${target.firstName} ${target.lastName} supprimé`);
                  } catch { toast('error', 'Erreur lors de la suppression'); }
                  setShowDeleteDialog(false);
                  setDeleteTargetId(null);
                  setDeleteConfirm('');
                }}>
                  Confirmer la suppression
                </Button>
              </div>
            </div>
          );
        })()}
      </Dialog>
    </div>
  );
}
