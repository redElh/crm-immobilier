import { Phone, Home, User, Clock, DollarSign, MapPin, Maximize2, Heart, Edit3, ExternalLink, Trash2, Search, Key, Tag, Compass, Calendar, Users, Briefcase, Shield, Star, ChevronRight, Moon, Eye, Zap, CheckCircle, Link as LinkIcon, Lock } from 'react-feather';
import { useNavigate } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import { CompletionRing } from '../../ui/CompletionRing';
import { calcClientCompletion } from '../../../utils/clientCompletion';
import { useState } from 'react';

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
  Acheteur: {
    icon: Search,
    label: 'Acheteur',
    accent: 'text-blue-600',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-l-blue-500',
    accentRing: 'ring-blue-500/20',
    gradient: 'from-blue-500/5 to-transparent',
    pillBg: 'bg-blue-50/80 text-blue-600 border-blue-100',
  },
  Locataire: {
    icon: Key,
    label: 'Locataire',
    accent: 'text-violet-600',
    accentBg: 'bg-violet-50',
    accentBorder: 'border-l-violet-500',
    accentRing: 'ring-violet-500/20',
    gradient: 'from-violet-500/5 to-transparent',
    pillBg: 'bg-violet-50/80 text-violet-600 border-violet-100',
  },
  Vendeur: {
    icon: Tag,
    label: 'Vendeur',
    accent: 'text-emerald-600',
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-l-emerald-500',
    accentRing: 'ring-emerald-500/20',
    gradient: 'from-emerald-500/5 to-transparent',
    pillBg: 'bg-emerald-50/80 text-emerald-600 border-emerald-100',
  },
  Bailleur: {
    icon: Home,
    label: 'Bailleur',
    accent: 'text-teal-600',
    accentBg: 'bg-teal-50',
    accentBorder: 'border-l-teal-500',
    accentRing: 'ring-teal-500/20',
    gradient: 'from-teal-500/5 to-transparent',
    pillBg: 'bg-teal-50/80 text-teal-600 border-teal-100',
  },
  Voyageur: {
    icon: Compass,
    label: 'Voyageur',
    accent: 'text-sky-600',
    accentBg: 'bg-sky-50',
    accentBorder: 'border-l-sky-500',
    accentRing: 'ring-sky-500/20',
    gradient: 'from-sky-500/5 to-transparent',
    pillBg: 'bg-sky-50/80 text-sky-600 border-sky-100',
  },
};

const STATUT_METIER_BADGES: Record<string, string> = {
  'En qualification': 'bg-blue-100 text-blue-700',
  'En recherche': 'bg-emerald-100 text-emerald-700',
  'En negociation': 'bg-amber-100 text-amber-700',
  'En compromis': 'bg-purple-100 text-purple-700',
  'Vendu / Achete': 'bg-emerald-100 text-emerald-700',
  'Inactif': 'bg-orange-100 text-orange-700',
  'Perdu': 'bg-red-100 text-red-700',
  'En attente de signature': 'bg-sky-100 text-sky-700',
  'En mandat': 'bg-emerald-100 text-emerald-700',
  'En location': 'bg-indigo-100 text-indigo-700',
  'Vendu': 'bg-emerald-100 text-emerald-700',
  'En visite': 'bg-indigo-100 text-indigo-700',
  'En dossier': 'bg-purple-100 text-purple-700',
  'Bail signe': 'bg-emerald-100 text-emerald-700',
  'Installe': 'bg-teal-100 text-teal-700',
  'Reservation en cours': 'bg-amber-100 text-amber-700',
  'Confirme': 'bg-emerald-100 text-emerald-700',
  'En sejour': 'bg-blue-100 text-blue-700',
  'Termine': 'bg-gray-100 text-gray-700',
  'Annule': 'bg-red-100 text-red-700',
};

interface ClientCardProps {
  client: {
    id: string;
    name: string;
    type: string;
    status: string;
    phone: string;
    email?: string;
    statutMetier?: string;
    propertyType?: string;
    budget?: number;
    prixMin?: number;
    prixMax?: number;
    devise?: string;
    minSurface?: number;
    surfaceMax?: number;
    secteur?: string;
    classification?: string;
    lastContact?: string;
    // Buyer
    urgency?: string;
    currentSituation?: string;
    pieces?: number;
    chambres?: number;
    vue?: string;
    exposition?: string;
    etat?: string;
    standing?: string;
    mustHaveFeatures?: string;
    attributPrincipal?: string;
    criteres?: string[];
    // Renter
    employmentStatus?: string;
    guarantor?: boolean;
    guarantorName?: string;
    furnished?: boolean;
    anciennete?: number;
    nomEmployeur?: string;
    dateFinContrat?: string;
    periodeEssai?: boolean;
    minRentalDuration?: number;
    statutOccupation?: string;
    // Seller
    reasonForSelling?: string;
    dateSignature?: string;
    statutMandat?: string;
    creditRestantDu?: number;
    lotCopropriete?: number;
    syndicPresent?: boolean;
    // Landlord
    loyerHC?: number;
    charges?: number;
    depotGarantie?: number;
    typeLoyer?: string;
    periodiciteLoyer?: string;
    raisonMiseEnLocation?: string;
    dateDisponibilite?: string;
    creditEnCours?: boolean;
    preferredTenant?: string;
    includedUtilities?: string;
    // Voyageur
    budgetNuitMin?: number;
    budgetNuitMax?: number;
    dateArrivee?: string;
    dateDepart?: string;
    nbNuits?: number;
    nbPersonnes?: number;
    nbVoyageurs?: number;
    bienReserve?: string;
    statutReservation?: string;
    numeroReservation?: string;
    tarifNuit?: number;
    animaux?: boolean;
    budgetTotal?: number;
    nbEnfants?: number;
    nbAdultes?: number;
    modePaiement?: string;
    checkInHeure?: string;
    checkOutHeure?: string;
    optionsSelectionnees?: string[];
    contactId?: string;
  };
  agentId?: string;
  onEdit?: (client: ClientCardProps['client']) => void;
  onDelete?: (id: string) => void;
  locked?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
}

const InfoPill = ({ icon: Icon, label, value, accent }: { icon: any; label?: string; value: string; accent: string }) => (
  <div className="flex items-center gap-1.5 min-w-0">
    <Icon size={11} className={`${accent} shrink-0 opacity-60`} />
    {label && <span className="text-[10px] text-text-secondary/60 shrink-0">{label}:</span>}
    <span className="text-[11px] text-text-secondary truncate">{value}</span>
  </div>
);

const MiniTag = ({ label, colorClass }: { label: string; colorClass: string }) => (
  <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded border ${colorClass}`}>
    {label}
  </span>
);

const SectionLabel = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 mt-2.5 mb-1.5">
    <div className="h-px flex-1 bg-border/40" />
    <span className="text-[9px] font-semibold text-text-secondary/40 uppercase tracking-wider">{label}</span>
    <div className="h-px flex-1 bg-border/40" />
  </div>
);

export const ClientCard = ({ client, agentId, onEdit, onDelete, locked = false, canEdit = true, canDelete = true, canExport = true }: ClientCardProps) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const shakeControls = useAnimation();

  const config = TYPE_CONFIG[client.type] || TYPE_CONFIG.Acheteur;
  const TypeIcon = config.icon;
  const formatPrice = (val?: number) => val ? val.toLocaleString() : null;
  const devise = client.devise || 'MAD';
  const c = client as any;

  const detailUrl = agentId ? `/${agentId}/clients/type/${client.type?.toLowerCase() || ''}/${client.id}` : `/clients/${client.id}`;
  const completion = (client as any).completion ?? calcClientCompletion(client);

  const handleCardClick = () => {
    if (locked) {
      shakeControls.start({
        x: [0, -10, 10, -7, 7, -4, 4, 0],
        transition: { duration: 0.45 },
      });
      return;
    }
    navigate(detailUrl);
  };

  const renderTypeSpecificContent = () => {
    switch (client.type) {
      case 'Acheteur':
        return (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {(client.prixMin || client.prixMax) && (
                <InfoPill icon={DollarSign} label="Budget" value={`${formatPrice(client.prixMin) || '?'} ~ ${formatPrice(client.prixMax) || '?'} ${devise}`} accent={config.accent} />
              )}
              {client.propertyType && (
                <InfoPill icon={Home} label="Type" value={client.propertyType} accent={config.accent} />
              )}
              {(client.minSurface || client.surfaceMax) && (
                <InfoPill icon={Maximize2} label="Surface" value={`${client.minSurface || '?'} ~ ${client.surfaceMax || '?'} m²`} accent={config.accent} />
              )}
              {client.secteur && (
                <InfoPill icon={MapPin} label="Secteur" value={client.secteur} accent={config.accent} />
              )}
              {client.pieces && (
                <InfoPill icon={Home} label="Pièces" value={`${client.pieces}`} accent={config.accent} />
              )}
              {client.chambres && (
                <InfoPill icon={Moon} label="Chambres" value={`${client.chambres}`} accent={config.accent} />
              )}
              {client.currentSituation && (
                <InfoPill icon={Briefcase} label="Situation" value={client.currentSituation} accent={config.accent} />
              )}
              {client.urgency && (
                <InfoPill icon={Zap} label="Urgence" value={client.urgency} accent={config.accent} />
              )}
            </div>
            {(client.vue || client.exposition || client.etat || client.standing) && (
              <>
                <SectionLabel label="Préférences" />
                <div className="flex flex-wrap gap-1.5">
                  {client.vue && <MiniTag label={`Vue: ${client.vue}`} colorClass={config.pillBg} />}
                  {client.exposition && <MiniTag label={`Expo: ${client.exposition}`} colorClass={config.pillBg} />}
                  {client.etat && <MiniTag label={`État: ${client.etat}`} colorClass={config.pillBg} />}
                  {client.standing && <MiniTag label={`Standing: ${client.standing}`} colorClass={config.pillBg} />}
                </div>
              </>
            )}
            {client.attributPrincipal && (
              <>
                <SectionLabel label="Critères" />
                <div className="flex flex-wrap gap-1.5">
                  <MiniTag label={client.attributPrincipal} colorClass={`${config.pillBg} font-semibold`} />
                  {client.criteres?.slice(0, 4).map((crit: string) => (
                    <MiniTag key={crit} label={crit} colorClass="bg-background text-text-secondary border-border/50" />
                  ))}
                  {client.criteres && client.criteres.length > 4 && (
                    <span className="text-[9px] text-text-secondary/50 self-center">+{client.criteres.length - 4}</span>
                  )}
                </div>
              </>
            )}
          </>
        );

      case 'Locataire':
        return (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {(client.prixMin || client.prixMax) && (
                <InfoPill icon={DollarSign} label="Loyer" value={`${formatPrice(client.prixMin) || '?'} ~ ${formatPrice(client.prixMax) || '?'} ${devise}`} accent={config.accent} />
              )}
              {client.propertyType && (
                <InfoPill icon={Home} label="Type" value={client.propertyType} accent={config.accent} />
              )}
              {(client.minSurface || client.surfaceMax) && (
                <InfoPill icon={Maximize2} label="Surface" value={`${client.minSurface || '?'} ~ ${client.surfaceMax || '?'} m²`} accent={config.accent} />
              )}
              {client.secteur && (
                <InfoPill icon={MapPin} label="Secteur" value={client.secteur} accent={config.accent} />
              )}
              {client.employmentStatus && (
                <InfoPill icon={Briefcase} label="Emploi" value={client.employmentStatus} accent={config.accent} />
              )}
              {client.nomEmployeur && (
                <InfoPill icon={Briefcase} label="Employeur" value={client.nomEmployeur} accent={config.accent} />
              )}
              {client.guarantor !== undefined && (
                <InfoPill icon={Shield} label="Garant" value={client.guarantor ? 'Oui' : 'Non'} accent={config.accent} />
              )}
              {client.guarantor && client.guarantorName && (
                <InfoPill icon={User} label="Nom garant" value={client.guarantorName} accent={config.accent} />
              )}
            </div>
            {(client.anciennete || client.periodeEssai !== undefined || client.furnished !== undefined || client.minRentalDuration || client.statutOccupation) && (
              <>
                <SectionLabel label="Détails" />
                <div className="flex flex-wrap gap-1.5">
                  {client.anciennete && <MiniTag label={`Ancienneté: ${client.anciennete} ans`} colorClass={config.pillBg} />}
                  {client.periodeEssai !== undefined && <MiniTag label={client.periodeEssai ? 'En période d\'essai' : 'CDI confirmé'} colorClass={client.periodeEssai ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'} />}
                  {client.furnished !== undefined && <MiniTag label={client.furnished ? 'Meublé' : 'Non meublé'} colorClass={config.pillBg} />}
                  {client.minRentalDuration && <MiniTag label={`Durée min: ${client.minRentalDuration} mois`} colorClass={config.pillBg} />}
                  {client.statutOccupation && <MiniTag label={client.statutOccupation} colorClass={config.pillBg} />}
                </div>
              </>
            )}
            {client.dateFinContrat && (
              <div className="mt-2 text-[10px] text-text-secondary/50">
                Fin contrat: {new Date(client.dateFinContrat).toLocaleDateString('fr-FR')}
              </div>
            )}
          </>
        );

      case 'Vendeur':
        return (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {(client.prixMin || client.prixMax || client.budget) && (
                <InfoPill icon={DollarSign} label="Prix" value={`${formatPrice(client.prixMin || client.budget) || '?'} ${devise}`} accent={config.accent} />
              )}
              {client.propertyType && (
                <InfoPill icon={Home} label="Type" value={client.propertyType} accent={config.accent} />
              )}
              {(client.minSurface || client.surfaceMax) && (
                <InfoPill icon={Maximize2} label="Surface" value={`${client.minSurface || '?'} ~ ${client.surfaceMax || '?'} m²`} accent={config.accent} />
              )}
              {client.secteur && (
                <InfoPill icon={MapPin} label="Secteur" value={client.secteur} accent={config.accent} />
              )}
              {client.standing && (
                <InfoPill icon={Star} label="Standing" value={client.standing} accent={config.accent} />
              )}
              {client.dateSignature && (
                <InfoPill icon={Calendar} label="Mandat" value={new Date(client.dateSignature).toLocaleDateString('fr-FR')} accent={config.accent} />
              )}
              {client.statutMandat && (
                <InfoPill icon={CheckCircle} label="Statut" value={client.statutMandat} accent={config.accent} />
              )}
              {client.vue && (
                <InfoPill icon={Eye} label="Vue" value={client.vue} accent={config.accent} />
              )}
            </div>
            {(client.reasonForSelling || client.creditRestantDu || client.lotCopropriete || client.syndicPresent !== undefined) && (
              <>
                <SectionLabel label="Détails" />
                <div className="flex flex-wrap gap-1.5">
                  {client.reasonForSelling && <MiniTag label={client.reasonForSelling} colorClass={config.pillBg} />}
                  {client.lotCopropriete && <MiniTag label={`Lot ${client.lotCopropriete}`} colorClass={config.pillBg} />}
                  {client.syndicPresent !== undefined && <MiniTag label={client.syndicPresent ? 'Syndic présent' : 'Pas de syndic'} colorClass={config.pillBg} />}
                  {client.creditRestantDu && <MiniTag label={`Crédit: ${client.creditRestantDu.toLocaleString()} ${devise}`} colorClass="bg-amber-50 text-amber-600 border-amber-100" />}
                </div>
              </>
            )}
          </>
        );

      case 'Bailleur':
        return (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {client.loyerHC !== undefined && (
                <InfoPill icon={DollarSign} label="Loyer" value={`${client.loyerHC.toLocaleString()} ${devise}/mois`} accent={config.accent} />
              )}
              {client.propertyType && (
                <InfoPill icon={Home} label="Type" value={client.propertyType} accent={config.accent} />
              )}
              {client.charges !== undefined && client.charges > 0 && (
                <InfoPill icon={DollarSign} label="Charges" value={`${client.charges.toLocaleString()} ${devise}`} accent={config.accent} />
              )}
              {client.depotGarantie !== undefined && (
                <InfoPill icon={Shield} label="Caution" value={`${client.depotGarantie.toLocaleString()} ${devise}`} accent={config.accent} />
              )}
              {(client.minSurface || client.surfaceMax) && (
                <InfoPill icon={Maximize2} label="Surface" value={`${client.minSurface || '?'} ~ ${client.surfaceMax || '?'} m²`} accent={config.accent} />
              )}
              {client.secteur && (
                <InfoPill icon={MapPin} label="Secteur" value={client.secteur} accent={config.accent} />
              )}
              {client.dateDisponibilite && (
                <InfoPill icon={Calendar} label="Dispo." value={new Date(client.dateDisponibilite).toLocaleDateString('fr-FR')} accent={config.accent} />
              )}
              {client.preferredTenant && (
                <InfoPill icon={User} label="Locataire idéal" value={client.preferredTenant} accent={config.accent} />
              )}
            </div>
            {(client.typeLoyer || client.periodiciteLoyer || client.raisonMiseEnLocation || client.creditEnCours !== undefined || client.includedUtilities) && (
              <>
                <SectionLabel label="Détails" />
                <div className="flex flex-wrap gap-1.5">
                  {client.typeLoyer && <MiniTag label={client.typeLoyer} colorClass={config.pillBg} />}
                  {client.periodiciteLoyer && <MiniTag label={client.periodiciteLoyer} colorClass={config.pillBg} />}
                  {client.raisonMiseEnLocation && <MiniTag label={client.raisonMiseEnLocation} colorClass={config.pillBg} />}
                  {client.creditEnCours !== undefined && <MiniTag label={client.creditEnCours ? 'Crédit en cours' : 'Pas de crédit'} colorClass={client.creditEnCours ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'} />}
                  {client.includedUtilities && <MiniTag label={`Charges: ${client.includedUtilities}`} colorClass={config.pillBg} />}
                </div>
              </>
            )}
            {(client.loyerHC !== undefined && client.charges !== undefined) && (
              <div className="mt-2 text-[10px] font-medium text-text-secondary/70">
                Loyer charges comprises: {(client.loyerHC + client.charges).toLocaleString()} {devise}/mois
              </div>
            )}
          </>
        );

      case 'Voyageur':
        return (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {(client.budgetNuitMin || client.budgetNuitMax || client.tarifNuit) && (
                <InfoPill icon={DollarSign} label="Nuit" value={`${formatPrice(client.tarifNuit || client.budgetNuitMin) || '?'} ${devise}`} accent={config.accent} />
              )}
              {(client.dateArrivee || client.dateDepart) && (
                <InfoPill icon={Calendar} label="Dates" value={`${client.dateArrivee ? new Date(client.dateArrivee).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '?'} → ${client.dateDepart ? new Date(client.dateDepart).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '?'}`} accent={config.accent} />
              )}
              {(client.nbNuits !== undefined && client.nbNuits > 0) && (
                <InfoPill icon={Moon} label="Nuits" value={`${client.nbNuits}`} accent={config.accent} />
              )}
              {(client.nbPersonnes || client.nbVoyageurs) && (
                <InfoPill icon={Users} label="Pers." value={`${client.nbPersonnes || client.nbVoyageurs}`} accent={config.accent} />
              )}
              {(client.nbAdultes || client.nbEnfants) && (
                <InfoPill icon={Users} label="Ad./Enf." value={`${client.nbAdultes || 0}/${client.nbEnfants || 0}`} accent={config.accent} />
              )}
              {client.bienReserve && (
                <InfoPill icon={Home} label="Bien" value={client.bienReserve} accent={config.accent} />
              )}
              {client.checkInHeure && (
                <InfoPill icon={Clock} label="Check-in" value={client.checkInHeure} accent={config.accent} />
              )}
              {client.checkOutHeure && (
                <InfoPill icon={Clock} label="Check-out" value={client.checkOutHeure} accent={config.accent} />
              )}
            </div>
            {(client.budgetTotal || client.modePaiement || client.animaux !== undefined || client.optionsSelectionnees?.length) && (
              <>
                <SectionLabel label="Séjour" />
                <div className="flex flex-wrap gap-1.5">
                  {client.budgetTotal && <MiniTag label={`Total: ${client.budgetTotal.toLocaleString()} ${devise}`} colorClass={config.pillBg} />}
                  {client.modePaiement && <MiniTag label={client.modePaiement} colorClass={config.pillBg} />}
                  {client.animaux !== undefined && <MiniTag label={client.animaux ? 'Animaux acceptés' : 'Pas d\'animaux'} colorClass={config.pillBg} />}
                  {client.statutReservation && <MiniTag label={client.statutReservation} colorClass={config.pillBg} />}
                  {client.optionsSelectionnees && client.optionsSelectionnees.length > 0 && (
                    <>
                      {client.optionsSelectionnees.slice(0, 3).map((opt: string) => (
                        <MiniTag key={opt} label={opt} colorClass="bg-background text-text-secondary border-border/50" />
                      ))}
                      {client.optionsSelectionnees.length > 3 && (
                        <span className="text-[9px] text-text-secondary/50 self-center">+{client.optionsSelectionnees.length - 3}</span>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      animate={shakeControls}
      onClick={handleCardClick}
      className={`bg-card rounded-xl border border-border/50 shadow-card hover:shadow-card-hover cursor-pointer transition-all duration-300 group relative flex flex-col overflow-hidden border-l-[3px] ${config.accentBorder} hover:-translate-y-0.5 ${locked ? 'cursor-not-allowed' : ''}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

      <div className="relative p-4 pb-0">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`w-10 h-10 rounded-xl ${config.accentBg} flex items-center justify-center ring-2 ${config.accentRing} shrink-0 transition-transform duration-300 group-hover:scale-105`}>
              <TypeIcon size={18} className={config.accent} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate">{client.name}</h3>
              {locked && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-semibold rounded-md bg-amber-50 text-amber-600 border border-amber-100">
                  <Lock size={8} />
                  Verrouillé
                </span>
              )}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] font-medium ${config.accent}`}>{config.label}</span>
                {client.statutMetier && (
                  <>
                    <span className="text-text-secondary/30">·</span>
                    <span className={`text-[10px] font-medium ${STATUT_METIER_BADGES[client.statutMetier] || 'text-text-secondary'}`}>
                      {client.statutMetier}
                    </span>
                  </>
                )}
                {client.status && (
                  <>
                    <span className="text-text-secondary/30">·</span>
                    <span className={`text-[10px] font-medium ${client.status === 'Actif' ? 'text-emerald-600' : client.status === 'Inactif' ? 'text-orange-500' : 'text-text-secondary'}`}>
                      {client.status}
                    </span>
                  </>
                )}
              </div>
              {client.contactId && (
                <a
                  href={(() => {
                    const base = window.location.pathname.replace(/\/clients\/.*/, '');
                    return `${base}/contacts/${client.contactId}`;
                  })()}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-accent/70 hover:text-accent transition-colors mt-0.5"
                  title="Voir le contact d'origine"
                >
                  <LinkIcon size={9} /> Contact d'origine
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <CompletionRing percent={completion} size={34} strokeWidth={3} showLabel={true} />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-secondary mb-3">
          <Phone size={12} className="shrink-0 opacity-60" />
          <span className="truncate">{client.phone}</span>
          {client.lastContact && (
            <span className="text-text-secondary/40 ml-auto shrink-0 text-[10px]">
              {new Date(client.lastContact).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>
      </div>

      <div className="relative px-4 pb-3 flex-1">
        {renderTypeSpecificContent()}
      </div>

      <div className="relative px-4 py-2.5 border-t border-border/30 flex items-center justify-between bg-background/30">
        <button className="flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-accent transition-colors group/btn" onClick={(e) => { e.stopPropagation(); handleCardClick(); }}>
          {locked ? (
            <>
              <Lock size={11} />
              Verrouillé
            </>
          ) : (
            <>
              Voir fiche
              <ChevronRight size={12} className="transition-transform group-hover/btn:translate-x-0.5" />
            </>
          )}
        </button>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${liked ? 'text-red-500 bg-red-50' : 'text-text-secondary hover:text-text hover:bg-background'}`}
          >
            <Heart size={13} />
          </button>
          {canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(client); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
            >
              <Edit3 size={13} />
            </button>
          )}
          {canExport && (
            <button
              onClick={(e) => { e.stopPropagation(); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
            >
              <ExternalLink size={13} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(client.id); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-error hover:bg-error/5 transition-all"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
