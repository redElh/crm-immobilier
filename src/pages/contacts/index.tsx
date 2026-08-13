import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Contact } from '../../types/contact';
import { SearchInput } from '../../components/ui/SearchInput';
import { FilterDropdown } from '../../components/ui/FilterDropdown';
import { Button } from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Dialog } from '../../components/ui/Dialog';
import { ContactCard } from '../../components/modules/contacts/ContactCard';
import { ContactFormModal } from '../../components/modules/contacts/ContactFormModal';
import { ContactDraftSection } from '../../components/modules/contacts/ContactDraftSection';
import { Plus, CheckCircle, Users, Award, UserX, User, Briefcase, Tag, ArrowUp, ArrowDown } from 'react-feather';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/Toast';
import { fetchContacts, createContact, updateContact, deleteContact } from '../../services/contactService';
import { useMyPermissions, permissionAllowed } from '../../hooks/useMyPermissions';
import { Lock } from 'react-feather';
import type { ContactDraft } from '../../services/contactDraftStorage';

const mandatTypeOptions = [
  { value: 'all', label: 'Tous types' },
  { value: 'Vendeur', label: 'Vendeur' },
  { value: 'Bailleur', label: 'Bailleur' },
  { value: 'Acheteur', label: 'Acheteur' },
  { value: 'Locataire', label: 'Locataire' },
  { value: 'Voyageur', label: 'Voyageur' },
];

const contactTypeOptions = [
  { value: 'all', label: 'Tous' },
  { value: 'Particulier', label: 'Particulier' },
  { value: 'Professionnel', label: 'Professionnel' },
  { value: 'Indivision / Succession', label: 'Indivision / Succession' },
];

export default function ContactsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const perms = useMyPermissions();
  const canRead = permissionAllowed(perms, 'contacts-lecture');
  const canWrite = permissionAllowed(perms, 'contacts-ecriture');
  const canDelete = permissionAllowed(perms, 'contacts-supprimer');
  const canInfo = permissionAllowed(perms, 'contacts-info-privees');
  const canDemandes = permissionAllowed(perms, 'contacts-demandes');
  const canExport = permissionAllowed(perms, 'contacts-general-export');
  const permsLoaded = perms !== null;
  const [searchTerm, setSearchTerm] = useState('');
  const [mandatFilter, setMandatFilter] = useState('all');
  const [contactTypeFilter, setContactTypeFilter] = useState('all');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editContact, setEditContact] = useState<Contact | undefined>();
  const [draftId, setDraftId] = useState<string | undefined>();
  const [draftChange, setDraftChange] = useState(0);
  const userId = '1';
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchContacts();
      setContacts(data);
    } catch (err) {
      toast('error', 'Erreur lors du chargement des contacts');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.emailPrincipal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mobile.includes(searchTerm);
    const matchesMandat =
      mandatFilter === 'all' ||
      c.mandats.some((m) => m.clientType === mandatFilter && m.status === 'Actif');
    const matchesType =
      contactTypeFilter === 'all' ||
      c.type === contactTypeFilter;
    const matchesDemandes =
      canDemandes ||
      !c.mandats.some((m) => m.clientType === 'Acheteur');
    return matchesSearch && matchesMandat && matchesType && matchesDemandes;
  });

  const availableMandatOptions = canDemandes
    ? mandatTypeOptions
    : mandatTypeOptions.filter((o) => o.value !== 'Acheteur');

  const handleCreateContact = async (data: Omit<Contact, 'id' | 'mandats' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editContact) {
        const updated = await updateContact(editContact.id, data);
        setContacts((prev) => prev.map(c => c.id === updated.id ? updated : c));
        toast('success', 'Contact modifié avec succès');
      } else {
        const newContact = await createContact(data);
        setContacts((prev) => [newContact, ...prev]);
        toast('success', 'Contact créé avec succès');
      }
      setShowContactForm(false);
      setEditContact(undefined);
    } catch (err) {
      toast('error', editContact ? 'Erreur lors de la modification' : 'Erreur lors de la création du contact');
    }
  };

  const kpiData = useMemo(() => {
    const total = contacts.length;
    const avecMandatActif = contacts.filter(c => c.mandats.some(m => m.status === 'Actif')).length;
    const sansMandat = total - avecMandatActif;
    const particulier = contacts.filter(c => c.type === 'Particulier').length;
    const professionnel = contacts.filter(c => c.type === 'Professionnel').length;
    const succession = contacts.filter(c => c.type === 'Indivision / Succession').length;
    return { total, avecMandatActif, sansMandat, particulier, professionnel, succession };
  }, [contacts]);

  const kpiCards = [
    { label: 'Total contacts', value: kpiData.total, evolution: '+12%', up: true, icon: Users, color: 'text-accent', bg: 'bg-accent-light' },
    { label: 'Avec mandat actif', value: kpiData.avecMandatActif, evolution: '+8%', up: true, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Sans mandat', value: kpiData.sansMandat, evolution: '0%', up: false, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Particuliers', value: kpiData.particulier, evolution: '+15%', up: true, icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Professionnels', value: kpiData.professionnel, evolution: '+5%', up: true, icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Successions', value: kpiData.succession, evolution: '0%', up: true, icon: Tag, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  if (permsLoaded && !canRead) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-border/40 flex items-center justify-center mb-4">
          <Lock size={28} className="text-text-secondary" />
        </div>
        <h2 className="text-lg font-semibold">Contacts inaccessibles</h2>
        <p className="text-sm text-text-secondary mt-1 max-w-sm">
          Vous n'avez pas la permission de consulter les contacts. Contactez votre administrateur.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts - Vue d'ensemble</h1>
          <p className="text-sm text-text-secondary mt-1">
            {kpiData.total} contacts · {kpiData.avecMandatActif} avec mandats actifs · {kpiData.sansMandat} sans mandat
          </p>
        </div>
        {canWrite && (
          <Button variant="default" icon={<Plus size={14} />} onClick={() => setShowContactForm(true)}>
            Nouveau contact
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
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
                <div className={`p-2 rounded-lg ${kpi.bg}`}><Icon size={14} className={kpi.color} /></div>
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

      <Card className="p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-5 items-end">
          <div className="flex-1">
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher contacts..."
            />
          </div>
          <div className="flex items-end gap-3">
            <FilterDropdown
              label="Type de contact"
              options={contactTypeOptions}
              value={contactTypeFilter}
              onChange={setContactTypeFilter}
            />
            <FilterDropdown
              label="Type de mandat"
              options={availableMandatOptions}
              value={mandatFilter}
              onChange={setMandatFilter}
            />
          </div>
        </div>

        {filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle size={40} className="mx-auto text-text-secondary/30 mb-3" />
            <p className="text-text-secondary">Aucun contact trouvé</p>
            <p className="text-xs text-text-secondary/60 mt-1">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                locked={!canInfo}
                canEdit={canWrite}
                canDelete={canDelete}
                canExport={canExport}
                onClick={() => navigate(`/contacts/${contact.id}`)}
                onEdit={(c) => { setEditContact(c); setShowContactForm(true); }}
                onDelete={(id) => { setDeleteTargetId(id); setShowDeleteDialog(true); setDeleteConfirm(''); }}
              />
            ))}
          </div>
        )}
      </Card>

      {showContactForm && (
        <ContactFormModal
          onClose={() => { setShowContactForm(false); setEditContact(undefined); setDraftId(undefined); }}
          onSubmit={handleCreateContact}
          contact={editContact}
          draftId={draftId}
          userId={userId}
          onDraftChange={() => setDraftChange(c => c + 1)}
        />
      )}

      <ContactDraftSection
        userId={userId}
        draftChange={draftChange}
        onResume={(draft: ContactDraft) => {
          setDraftId(draft.id);
          setShowContactForm(true);
        }}
      />

      <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer le contact" size="sm">
        {(() => {
          const target = contacts.find(c => c.id === deleteTargetId);
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
                    await deleteContact(deleteTargetId);
                    setContacts(prev => prev.filter(c => c.id !== deleteTargetId));
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
