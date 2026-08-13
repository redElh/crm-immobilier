import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { BackLink } from '../../components/ui/BackLink';
import { Prospect } from '../../types/prospect';
import {
  User, Phone, Mail, MapPin, Calendar, Globe, MessageSquare,
  Home, Tag, DollarSign, Maximize2, Grid, Eye, Clock,
  Compass, ShoppingCart, Key, Heart, Edit3, Share2, Trash2, Award, XOctagon, ExternalLink, Lock
} from 'react-feather';
import { QualificationFormModal } from '../../components/modules/prospects/QualificationFormModal';
import { ProspectFormModal } from '../../components/modules/prospects/ProspectFormModal';
import { StatusChangeDropdown } from '../../components/modules/prospects/StatusChangeDropdown';
import { ReminderModal } from '../../components/modules/prospects/ReminderModal';
import { ActionChoiceModal } from '../../components/modules/prospects/ActionChoiceModal';
import { getQualifiedCountdown } from '../../utils/qualifiedCountdown';
import { calcProspectCompletion } from '../../utils/prospectCompletion';
import { QualificationPocket } from '../../components/modules/prospects/QualificationPocket';
import { CompletionRing } from '../../components/ui/CompletionRing';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/Toast';
import { ContactFormModal } from '../../components/modules/contacts/ContactFormModal';
import { createContact } from '../../services/contactService';
import { fetchProspectById, updateProspect, deleteProspect, updateProspectStatus, scheduleReminder, updateReminder, cancelReminder } from '../../services/prospectService';
import { useMyPermissions, permissionAllowed } from '../../hooks/useMyPermissions';

const TYPE_CONFIG: Record<string, {
  icon: any;
  label: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  accentRing: string;
  gradient: string;
  pillBg: string;
}> = {
  Acheter: {
    icon: ShoppingCart,
    label: 'Acheter',
    accent: 'text-blue-600',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-l-blue-500',
    accentRing: 'ring-blue-500/20',
    gradient: 'from-blue-500/5 to-transparent',
    pillBg: 'bg-blue-50/80 text-blue-600 border-blue-100',
  },
  Louer: {
    icon: Key,
    label: 'Louer',
    accent: 'text-violet-600',
    accentBg: 'bg-violet-50',
    accentBorder: 'border-l-violet-500',
    accentRing: 'ring-violet-500/20',
    gradient: 'from-violet-500/5 to-transparent',
    pillBg: 'bg-violet-50/80 text-violet-600 border-violet-100',
  },
  Vendre: {
    icon: Tag,
    label: 'Vendre',
    accent: 'text-emerald-600',
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-l-emerald-500',
    accentRing: 'ring-emerald-500/20',
    gradient: 'from-emerald-500/5 to-transparent',
    pillBg: 'bg-emerald-50/80 text-emerald-600 border-emerald-100',
  },
  'Faire estimer': {
    icon: Compass,
    label: 'Faire estimer',
    accent: 'text-amber-600',
    accentBg: 'bg-amber-50',
    accentBorder: 'border-l-amber-500',
    accentRing: 'ring-amber-500/20',
    gradient: 'from-amber-500/5 to-transparent',
    pillBg: 'bg-amber-50/80 text-amber-600 border-amber-100',
  },
};

const SECTION_COLORS = {
  contact: { accent: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-100' },
  produit: { accent: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-100' },
  criteres: { accent: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', iconBg: 'bg-violet-100' },
  message: { accent: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', iconBg: 'bg-amber-100' },
};

export default function ProspectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const perms = useMyPermissions();
  const canRead = permissionAllowed(perms, 'prospects-lecture');
  const canWrite = permissionAllowed(perms, 'prospects-ecriture');
  const permsLoaded = perms !== null;
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQualificationModal, setShowQualificationModal] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [qualifiedRefresh, setQualifiedRefresh] = useState(0);
  const [showActionChoice, setShowActionChoice] = useState(false);
  const [showEditReminder, setShowEditReminder] = useState(false);

  useEffect(() => {
    if (!id) return;
    if (!permsLoaded || !canRead) return;
    setLoading(true);
    fetchProspectById(id)
      .then(setProspect)
      .catch(() => toast('error', 'Erreur lors du chargement du prospect'))
      .finally(() => setLoading(false));
  }, [id, toast, permsLoaded, canRead]);

  if (permsLoaded && !canRead) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-border/40 flex items-center justify-center mb-4">
          <Lock size={28} className="text-text-secondary" />
        </div>
        <h2 className="text-lg font-semibold">Prospect inaccessible</h2>
        <p className="text-sm text-text-secondary mt-1 max-w-sm">
          Vous n'avez pas la permission de consulter ce prospect. Contactez votre administrateur.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => navigate('/prospects')}>Retour aux prospects</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Prospect non trouvé</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/prospects')}>Retour aux prospects</Button>
      </div>
    );
  }

  const handleQualify = async (data: any) => {
    if (!id || !prospect) return;
    try {
      const updated = await updateProspectStatus(id, 'Qualifié', {
        qualificationData: { previousStatus: prospect.status, ...data },
      });
      setProspect(updated);
      setShowQualificationModal(false);
      setQualifiedRefresh(c => c + 1);
      toast('success', 'Prospect qualifié avec succès');
    } catch {
      toast('error', 'Erreur lors de la qualification');
    }
  };

  const handleUpdateProspect = async (data: Omit<Prospect, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!id) return;
    try {
      const updated = await updateProspect(id, data);
      setProspect(updated);
      setShowEditModal(false);
      toast('success', 'Prospect modifié avec succès');
    } catch {
      toast('error', 'Erreur lors de la modification du prospect');
    }
  };

  const handleStatusChange = async (status: Prospect['status']) => {
    if (!id || !prospect) return;
    try {
      const opts = status === 'Qualifié'
        ? { qualificationData: { previousStatus: prospect.status } }
        : undefined;
      const updated = await updateProspectStatus(id, status, opts);
      setProspect(updated);
      if (status === 'Qualifié') setQualifiedRefresh(c => c + 1);
      toast('success', `Statut changé en "${status}"`);
    } catch {
      toast('error', 'Erreur lors du changement de statut');
    }
  };

  const handleStatusReverted = (updated: Prospect) => {
    setProspect(updated);
  };

  const handleReminderConfirm = async (reminderDate: string, reminderNote: string) => {
    if (!id) return;
    try {
      const updated = await scheduleReminder(id, reminderDate, reminderNote);
      setProspect(updated);
      setShowReminderModal(false);
      toast('success', 'Rappel programmé');
    } catch {
      toast('error', 'Erreur lors de la programmation du rappel');
    }
  };

  const handleEditReminderSubmit = async (reminderDate: string, reminderNote: string) => {
    if (!id) return;
    try {
      const updated = await updateReminder(id, reminderDate, reminderNote);
      setProspect(updated);
      setShowEditReminder(false);
      toast('success', 'Rappel mis à jour');
    } catch {
      toast('error', 'Erreur lors de la mise à jour du rappel');
    }
  };

  const handleCancelReminder = async () => {
    if (!id) return;
    try {
      const updated = await cancelReminder(id);
      setProspect(updated);
      setShowEditReminder(false);
      toast('success', 'Rappel supprimé — retour au statut "Contacté"');
    } catch {
      toast('error', 'Erreur lors de la suppression du rappel');
    }
  };

  const handleConvertSubmit = async (data: any) => {
    if (!prospect) return;
    try {
      const merged = {
        ...prospect.qualificationData,
        ...data,
        firstName: prospect.firstName,
        lastName: prospect.lastName,
        civility: prospect.civility,
        mobile: prospect.phone,
        emailPrincipal: prospect.email,
        langueParlee: prospect.spokenLanguage ? [prospect.spokenLanguage] : [],
        devisePreferee: prospect.currency || 'MAD',
        ville: prospect.location || '',
        commentairePrive: `[Prospect #${prospect.id}] ${prospect.message || ''}`,
        originalProspectId: prospect.id,
      };
      const created = await createContact(merged);
      const updated = await updateProspectStatus(prospect.id, 'Converti', { contactId: created.id });
      setProspect(updated);
      setShowConvertModal(false);
      setQualifiedRefresh(c => c + 1);
      toast('success', 'Prospect converti en contact avec succès');
    } catch {
      toast('error', 'Erreur lors de la conversion');
    }
  };

  const config = TYPE_CONFIG[prospect.type] || TYPE_CONFIG.Acheter;
  const TypeIcon = config.icon;
  const devise = prospect.currency || 'MAD';
  const formatPrice = (val?: number) => val ? val.toLocaleString() : null;
  const completion = calcProspectCompletion(prospect);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <BackLink />
      </div>

      {/* Hero Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-card rounded-xl border border-border/50 shadow-card overflow-hidden border-l-[3px] ${config.accentBorder}`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-50 pointer-events-none`} />
        <div className="relative p-6 flex flex-col sm:flex-row gap-5">
          <div className={`w-16 h-16 rounded-2xl ${config.accentBg} flex items-center justify-center ring-2 ${config.accentRing} shrink-0`}>
            <TypeIcon size={28} className={config.accent} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold">{prospect.civility} {prospect.firstName} {prospect.lastName}</h1>
              {canWrite ? (
                <StatusChangeDropdown
                  currentStatus={prospect.status}
                  onStatusChange={handleStatusChange}
                  onCalendarClick={() => setShowReminderModal(true)}
                  onQualifyClick={() => setShowQualificationModal(true)}
                />
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border bg-border/30 text-text-secondary border-border/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-text-secondary/50" />
                  {prospect.status}
                </span>
              )}
              {prospect.status === 'Qualifié' && (() => {
                const cd = getQualifiedCountdown(prospect.qualifiedAt);
                if (!cd) return null;
                const colors = {
                  safe: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  warning: 'bg-amber-50 text-amber-700 border-amber-200',
                  critical: 'bg-red-50 text-red-700 border-red-200',
                  expired: 'bg-red-100 text-red-800 border-red-300',
                };
                return (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg border ${colors[cd.urgency]}`}>
                    <Clock size={12} />
                    {cd.label}
                  </span>
                );
              })()}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs font-medium ${config.accent}`}>{config.label}</span>
              <span className="text-text-secondary/30">·</span>
              <span className="text-xs text-text-secondary flex items-center gap-1">
                <Compass size={11} /> Origine: {prospect.origin}
              </span>
              <span className="text-text-secondary/30">·</span>
              <span className="text-xs text-text-secondary flex items-center gap-1">
                <Calendar size={11} /> Créé le {new Date(prospect.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
          <div className={`shrink-0 ${['Converti', 'En attente'].includes(prospect.status) ? 'flex items-center gap-3' : 'flex flex-col items-end gap-3'}`}>
            {['Converti', 'En attente'].includes(prospect.status) ? (
              <>
                <CompletionRing percent={completion} size={52} strokeWidth={4} />
                <Button
                  variant={liked ? 'default' : 'outline'}
                  onClick={() => setLiked(!liked)}
                  className={liked ? 'bg-red-50 text-red-500 hover:bg-red-100 border-red-200' : ''}
                >
                  <Heart size={16} className={liked ? 'fill-current' : ''} />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <CompletionRing percent={completion} size={52} strokeWidth={4} />
                <Button
                  variant={liked ? 'default' : 'outline'}
                  onClick={() => setLiked(!liked)}
                  className={liked ? 'bg-red-50 text-red-500 hover:bg-red-100 border-red-200' : ''}
                >
                  <Heart size={16} className={liked ? 'fill-current' : ''} />
                </Button>
              </div>
            )}
            <div className={`flex items-center gap-2 justify-end ${['Converti', 'En attente'].includes(prospect.status) ? 'flex-nowrap' : 'flex-wrap'}`}>
              {canWrite && (
                <Button variant="outline" onClick={() => {
                  if (prospect.status === 'En attente') {
                    setShowActionChoice(true);
                  } else {
                    setShowEditModal(true);
                  }
                }}><Edit3 size={16} /> Modifier</Button>
              )}
            {canWrite && prospect.status === 'Nouveau' && (
              <Button variant="default" onClick={() => handleStatusChange('Contacté')}>
                <Phone size={16} /> Marquer comme contacté
              </Button>
            )}
            {canWrite && prospect.status === 'Contacté' && (
              <Button variant="default" onClick={() => setShowReminderModal(true)}>
                <Calendar size={16} /> Programmer un rappel
              </Button>
            )}
            {canWrite && !['Qualifié', 'Perdu', 'Converti'].includes(prospect.status) && (
              <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleStatusChange('Qualifié')}>
                <Award size={16} /> Qualifier
              </Button>
            )}
            {canWrite && prospect.status === 'Qualifié' && (
              <Button variant="default" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setShowConvertModal(true)}>
                <User size={16} /> Convertir en contact
              </Button>
            )}
            {canWrite && !['Perdu', 'Converti'].includes(prospect.status) && (
              <Button variant="outline" className="text-red-500 hover:bg-red-50 border-red-200 hover:border-red-300" onClick={() => handleStatusChange('Perdu')}>
                <XOctagon size={16} /> Marquer comme perdu
              </Button>
            )}
            {canWrite && prospect.status === 'Perdu' && (
              <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleStatusChange('Contacté')}>
                <Phone size={16} /> Contacté à nouveau ? Marquer comme contacté
              </Button>
            )}
            {prospect.status === 'Converti' && prospect.contactId && (
              <Button variant="default" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => navigate(`/contacts/${prospect.contactId}`)}>
                <ExternalLink size={16} /> Voir le contact
              </Button>
            )}
            <Button variant="outline"><Share2 size={16} /> Partager</Button>
            {canWrite && (
              <Button variant="outline" className="text-error hover:bg-error/5 border-error/20 hover:border-error/40" onClick={() => { setDeleteConfirm(''); setShowDeleteDialog(true); }}>
                <Trash2 size={16} />
              </Button>
            )}
          </div>
          </div>
        </div>
        <div className="relative border-t border-border/30 bg-background/30 px-6 py-3">
          <div className="flex items-center gap-6 flex-wrap">
            {prospect.phone && (
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <Phone size={12} className="text-text-secondary/50" />
                <span>{prospect.phone}</span>
              </div>
            )}
            {prospect.email && (
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <Mail size={12} className="text-text-secondary/50" />
                <span className="truncate max-w-[200px]">{prospect.email}</span>
              </div>
            )}
            {prospect.location && (
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <MapPin size={12} className="text-text-secondary/50" />
                <span>{prospect.location}</span>
              </div>
            )}
            {prospect.maxPrice && (
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <DollarSign size={12} className="text-text-secondary/50" />
                <span>Budget: {formatPrice(prospect.maxPrice)} {devise}</span>
              </div>
            )}
          </div>
        </div>

        {/* Reminder Bar */}
        {prospect.status === 'En attente' && prospect.reminderDate && (
          <div className="relative border-t border-border/30 bg-orange-50/40 px-6 py-2.5">
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-orange-600" />
              <span className="text-xs text-orange-700 font-medium">
                Rappel: {new Date(prospect.reminderDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              {prospect.reminderNote && (
                <span className="text-[11px] text-orange-600/70">— {prospect.reminderNote}</span>
              )}
            </div>
          </div>
        )}

        {/* Contacted / Qualified timestamps */}
        {(prospect.contactedAt || prospect.qualifiedAt) && (
          <div className="relative border-t border-border/30 bg-background/30 px-6 py-2.5">
            <div className="flex items-center gap-4 flex-wrap">
              {prospect.contactedAt && (
                <span className="text-[10px] text-text-secondary/60">
                  Contacté le {new Date(prospect.contactedAt).toLocaleDateString('fr-FR')}
                </span>
              )}
              {prospect.qualifiedAt && (
                <span className="text-[10px] text-text-secondary/60">
                  Qualifié le {new Date(prospect.qualifiedAt).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Nouveau hint */}
      {prospect.status === 'Nouveau' && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
          <Phone size={14} className="text-blue-600 shrink-0" />
          <p className="text-xs text-blue-700">
            Ce prospect est nouveau. N'oubliez pas de le marquer comme <strong>Contacté</strong> après avoir pris contact.
          </p>
        </div>
      )}

      {/* Detail Cards */}
      <div className="space-y-5">
        {/* Top Row: Contact + Produit/Message */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Contact Card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className={`p-5 border-l-[3px] ${SECTION_COLORS.contact.border} overflow-hidden relative`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${SECTION_COLORS.contact.accent.replace('text-', 'from-')}/5 to-transparent pointer-events-none`} />
              <div className="relative">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
                  <span className={`w-7 h-7 rounded-lg ${SECTION_COLORS.contact.iconBg} flex items-center justify-center`}>
                    <User size={14} className={SECTION_COLORS.contact.accent} />
                  </span>
                  Contact
                </h3>
                <div className="space-y-3">
                  <InfoRow icon={<Mail size={14} />} label="Email" value={prospect.email} accent={SECTION_COLORS.contact.accent} />
                  <InfoRow icon={<Phone size={14} />} label="Téléphone" value={prospect.phone} accent={SECTION_COLORS.contact.accent} />
                  {prospect.mobile && <InfoRow icon={<Phone size={14} />} label="Mobile" value={prospect.mobile} accent={SECTION_COLORS.contact.accent} />}
                  <InfoRow icon={<Globe size={14} />} label="Langue" value={prospect.spokenLanguage} accent={SECTION_COLORS.contact.accent} />
                  <InfoRow icon={<Tag size={14} />} label="Moyens de contact" value={prospect.meansOfContact.join(', ')} accent={SECTION_COLORS.contact.accent} />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Right Column: Produit + Message */}
          <div className="space-y-5">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className={`p-5 border-l-[3px] ${SECTION_COLORS.produit.border} overflow-hidden relative`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${SECTION_COLORS.produit.accent.replace('text-', 'from-')}/5 to-transparent pointer-events-none`} />
                <div className="relative">
                  <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
                    <span className={`w-7 h-7 rounded-lg ${SECTION_COLORS.produit.iconBg} flex items-center justify-center`}>
                      <Home size={14} className={SECTION_COLORS.produit.accent} />
                    </span>
                    Produit
                  </h3>
                  <div className="space-y-3">
                    <InfoRow icon={<Tag size={14} />} label="Catégorie" value={prospect.categories} accent={SECTION_COLORS.produit.accent} />
                    <InfoRow icon={<Home size={14} />} label="Types de bien" value={prospect.propertyTypes.join(', ')} accent={SECTION_COLORS.produit.accent} />
                  </div>
                </div>
              </Card>
            </motion.div>

            {prospect.message && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Card className={`p-5 border-l-[3px] ${SECTION_COLORS.message.border} overflow-hidden relative`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${SECTION_COLORS.message.accent.replace('text-', 'from-')}/5 to-transparent pointer-events-none`} />
                  <div className="relative">
                    <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
                      <span className={`w-7 h-7 rounded-lg ${SECTION_COLORS.message.iconBg} flex items-center justify-center`}>
                        <MessageSquare size={14} className={SECTION_COLORS.message.accent} />
                      </span>
                      Message
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{prospect.message}</p>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        {/* Critères Card - Full Width */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className={`p-5 border-l-[3px] ${SECTION_COLORS.criteres.border} overflow-hidden relative`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${SECTION_COLORS.criteres.accent.replace('text-', 'from-')}/5 to-transparent pointer-events-none`} />
            <div className="relative">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
                <span className={`w-7 h-7 rounded-lg ${SECTION_COLORS.criteres.iconBg} flex items-center justify-center`}>
                  <MapPin size={14} className={SECTION_COLORS.criteres.accent} />
                </span>
                Critères
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <CritereItem icon={<MapPin size={14} />} label="Localisation" value={prospect.location} accent={SECTION_COLORS.criteres.accent} />
                <CritereItem icon={<Grid size={14} />} label="Pièces" value={prospect.rooms} accent={SECTION_COLORS.criteres.accent} />
                <CritereItem icon={<Grid size={14} />} label="Chambres" value={prospect.bedrooms} accent={SECTION_COLORS.criteres.accent} />
                <CritereItem icon={<Maximize2 size={14} />} label="Surface min" value={prospect.minSurface ? `${prospect.minSurface} m²` : null} accent={SECTION_COLORS.criteres.accent} />
                <CritereItem icon={<DollarSign size={14} />} label="Budget max" value={prospect.maxPrice ? `${formatPrice(prospect.maxPrice)} ${devise}` : null} accent={SECTION_COLORS.criteres.accent} />
                {(prospect.viewType || prospect.viewDetail) && <CritereItem icon={<Eye size={14} />} label="Vue" value={[prospect.viewType, prospect.viewDetail].filter(Boolean).join(' / ')} accent={SECTION_COLORS.criteres.accent} />}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <QualificationPocket
        onConvert={() => {}}
        refreshTrigger={qualifiedRefresh}
        onStatusReverted={handleStatusReverted}
        canWrite={canWrite}
      />

      {showQualificationModal && prospect && (
        <QualificationFormModal
          onClose={() => setShowQualificationModal(false)}
          onSubmit={handleQualify}
          prospect={prospect}
        />
      )}

      {showEditModal && prospect && (
        <ProspectFormModal
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdateProspect}
          prospect={prospect}
        />
      )}

      {showReminderModal && prospect && (
        <ReminderModal
          onClose={() => setShowReminderModal(false)}
          onConfirm={handleReminderConfirm}
          prospectName={`${prospect.civility} ${prospect.firstName} ${prospect.lastName}`}
        />
      )}

      {showActionChoice && prospect && (
        <ActionChoiceModal
          onClose={() => setShowActionChoice(false)}
          onEditInfo={() => { setShowActionChoice(false); setShowEditModal(true); }}
          onEditReminder={() => { setShowActionChoice(false); setShowEditReminder(true); }}
          prospectName={`${prospect.civility} ${prospect.firstName} ${prospect.lastName}`}
          currentReminder={prospect.reminderDate}
        />
      )}

      {showEditReminder && prospect && (
        <ReminderModal
          onClose={() => setShowEditReminder(false)}
          onConfirm={handleEditReminderSubmit}
          onCancel={handleCancelReminder}
          prospectName={`${prospect.civility} ${prospect.firstName} ${prospect.lastName}`}
          mode="edit"
          initialDate={prospect.reminderDate ? prospect.reminderDate.split('T')[0] : ''}
          initialTime={prospect.reminderDate ? new Date(prospect.reminderDate).toTimeString().slice(0, 5) : '09:00'}
          initialNote={prospect.reminderNote || ''}
        />
      )}

      {showConvertModal && prospect && (
        <ContactFormModal
          onClose={() => setShowConvertModal(false)}
          onSubmit={handleConvertSubmit}
          contact={{
            id: '',
            type: 'Particulier',
            civility: prospect.civility as any,
            firstName: prospect.firstName,
            lastName: prospect.lastName,
            emailPrincipal: prospect.email,
            emailSecondaire: '',
            mobile: prospect.phone,
            telephoneFixe: '',
            profession: '',
            lieuNaissance: '',
            dateNaissance: '',
            nationalite: '',
            numeroFiscal: '',
            adresse: '',
            adresse2: '',
            codePostal: '',
            ville: prospect.location || '',
            pays: '',
            moyenContactPrefere: '',
            langueParlee: prospect.spokenLanguage ? [prospect.spokenLanguage] : [],
            devisePreferee: prospect.currency || 'MAD',
            prescripteur: '',
            regimeMatrimonial: '',
            siteInternet: '',
            commentairePrive: `[Prospect #${prospect.id}] ${prospect.message || ''}`,
            originalProspectId: prospect.id,
            mandats: [],
            createdAt: '',
            updatedAt: '',
          }}
        />
      )}

      <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer le prospect" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Voulez-vous vraiment supprimer <span className="font-semibold text-text-primary">{prospect?.firstName} {prospect?.lastName}</span> ?
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
              if (!id || deleteConfirm !== 'SUPPRIMER') return;
              try {
                await deleteProspect(id);
                toast('success', `${prospect?.firstName} ${prospect?.lastName} supprimé`);
                navigate('/prospects');
              } catch { toast('error', 'Erreur lors de la suppression'); }
              setShowDeleteDialog(false);
              setDeleteConfirm('');
            }}>
              Confirmer la suppression
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

const InfoRow = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number | undefined | null; accent: string }) => (
  <div className="flex items-center gap-3 py-2 border-b border-border/15 last:border-0">
    <div className={`w-8 h-8 rounded-lg bg-background flex items-center justify-center flex-shrink-0 ${accent} opacity-70`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] text-text-secondary/60">{label}</p>
      <p className="text-sm font-medium truncate">{value ?? '—'}</p>
    </div>
  </div>
);

const CritereItem = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number | undefined | null; accent: string }) => (
  <div className={`p-3 rounded-lg bg-background/50`}>
    <div className="flex items-center gap-2 mb-1.5">
      <div className={`flex-shrink-0 ${accent} opacity-70`}>{icon}</div>
      <p className="text-[11px] text-text-secondary/60 truncate">{label}</p>
    </div>
    <p className="text-sm font-semibold truncate">{value ?? '—'}</p>
  </div>
);
