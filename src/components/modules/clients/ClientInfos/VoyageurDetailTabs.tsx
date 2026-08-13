import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { InfoField } from '../../../ui/InfoField';
import { Button } from '../../../ui/Button';
import { ClientContractsTab } from '../ClientContractsTab';
import { NotesActiviteTab } from './NotesActiviteTab';
import { Client } from '../../../../types/client';
import {
  Home, MapPin, Maximize2, Grid, Clock, User, Briefcase, CheckCircle,
  AlertCircle, Calendar, Eye, Sun, Tag, Star, Layers, Compass,
  DollarSign, CreditCard, FileText, Plus, Shield, X,
  TrendingUp, Users, Upload, Phone, Mail, MessageCircle, Smartphone, Activity, CheckSquare
} from 'react-feather';
import { api } from '../../../../services/api';
import { useMyPermissions, permissionAllowed } from '../../../../hooks/useMyPermissions';

const renderTagList = (items: string[] | undefined, label: string, isGerant: boolean) => {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="text-sm font-medium text-text mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => (
          <span key={item} className={`px-2 py-1 text-xs rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] border border-[#905D5D]/20' : 'bg-accent/10 text-accent border border-accent/20'}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

const renderCategorieGroup = (items: string[] | undefined, label: string) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-3">
      <p className="text-xs font-medium text-text-secondary mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => (
          <span key={item} className="px-2 py-0.5 text-xs rounded bg-background border border-border text-text-secondary">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

const TABS = [
  { id: 1, label: 'Critères', slug: 'criteres' },
  { id: 2, label: 'Caractéristiques', slug: 'caracteristiques' },
  { id: 3, label: 'Budget & Période', slug: 'budget_periode' },
  { id: 4, label: 'Proximités', slug: 'proximites' },
  { id: 5, label: 'Prestations', slug: 'prestations' },
  { id: 6, label: 'Paiement & Séjour', slug: 'paiement_sejour' },
  { id: 7, label: 'Contrat', slug: 'contrat' },
  { id: 8, label: 'Documents', slug: 'documents' },
  { id: 9, label: 'Contrats', slug: 'contrats' },
  { id: 10, label: 'Notes & Activité', slug: 'notes_activite' },
];

export const VoyageurDetailTabs = ({ client: initialClient, adminId, agentId, highlightActivityId, isGerant = false }: { client: Client; adminId?: string; agentId?: string; highlightActivityId?: number; isGerant?: boolean }) => {
  const navigate = useNavigate();
  const basePath = adminId ? `/admin/${adminId}` : agentId ? `/${agentId}` : '';
  const perms = useMyPermissions();
  const canReadContracts = permissionAllowed(perms, 'contrats-lecture');
  const visibleTabs = canReadContracts ? TABS : TABS.filter(t => t.slug !== 'contrats');
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = visibleTabs.find(t => t.slug === searchParams.get('tab'))?.id || 1;
  const [activeTab, setActiveTabState] = useState(initialTab);
  const setActiveTab = useCallback((id: number) => {
    setActiveTabState(id);
    const slug = TABS.find(t => t.id === id)?.slug;
    if (slug) {
      setSearchParams(prev => { prev.set('tab', slug); return prev; }, { replace: true });
    }
  }, [setSearchParams]);
  const [client, setClientState] = useState<Client>(initialClient);
  useEffect(() => {
    setClientState(initialClient);
  }, [initialClient]);
  const [bienReserveProp, setBienReserveProp] = useState<any>(null);

  useEffect(() => {
    if (initialClient.bienReserve) {
      api.get<any>(`/properties/${initialClient.bienReserve}`).then((p) => {
        if (p) setBienReserveProp(p);
      }).catch(() => {});
    }
  }, [initialClient.bienReserve]);

  const [rawViewerUrl, setRawViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState('');
  const viewerUrl = rawViewerUrl ? (rawViewerUrl.startsWith('http') ? rawViewerUrl : `http://localhost:5000${rawViewerUrl}`) : null;
  const openViewer = useCallback((url: string, title: string) => { setRawViewerUrl(url); setViewerTitle(title); }, []);
  const closeViewer = useCallback(() => { setRawViewerUrl(null); setViewerTitle(''); }, []);
  useEffect(() => {
    if (!viewerUrl) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') closeViewer(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [viewerUrl, closeViewer]);

  const updateClient = (updates: Partial<Client>) => {
    setClientState(prev => ({ ...prev, ...updates }));
  };

  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
      <AlertCircle size={32} className="mb-3 opacity-40" />
      <p className="text-sm">Aucune information renseignée pour cette section</p>
    </div>
  );

  const c = client as any;
  const devise = client.devise || 'MAD';

  const renderCriteres = () => {
    const hasData = client.statutMetier || client.classification || client.source ||
      client.propertyType || client.secteur || client.area || client.localisation ||
      client.pieces || client.chambres || client.nbPersonnes || client.minSurface || client.surfaceMax;

    if (!hasData) return renderEmpty();

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          {client.statutMetier && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-secondary">Statut:</span>
              <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-premium/10 text-premium border border-premium/20">
                {client.statutMetier}
              </span>
            </div>
          )}
          {client.classification && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-secondary">Classification:</span>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] border border-[#905D5D]/20' : 'bg-accent/10 text-accent border border-accent/20'}`}>
                {client.classification}
              </span>
            </div>
          )}
          {client.source && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-secondary">Origine:</span>
              <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200">
                {client.source}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField label="Catégorie" value={client.categorie || 'Location saisonnière'} icon={<Tag size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
          {client.propertyType && <InfoField label="Type de bien recherché" value={client.propertyType} icon={<Home size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {(client.secteur || client.area) && <InfoField label="Secteur géographique" value={client.secteur || client.area || 'Non spécifié'} icon={<MapPin size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.localisation && <InfoField label="Localisation" value={client.localisation} icon={<MapPin size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
        </div>

        {((client.latitude && client.latitude !== 0) || (client.longitude && client.longitude !== 0)) && (
          <div className="p-3 rounded-xl bg-background border border-border/50">
            <InfoField
              label="Coordonnées"
              value={`${client.latitude?.toFixed(4) || '0'}, ${client.longitude?.toFixed(4) || '0'}`}
              icon={<Compass size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />}
            />
            <a
              href={`https://www.google.com/maps?q=${client.latitude},${client.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs ${isGerant ? 'text-[#905D5D]' : 'text-accent'} hover:underline mt-1 inline-block`}
            >
              Voir sur Google Maps
            </a>
          </div>
        )}

        <div className="border-t border-border/30 pt-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Caractéristiques quantitatives</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.pieces && (
              <InfoField label="Pièces" value={`${client.pieces}`} icon={<Grid size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
            )}
            {client.chambres && (
              <InfoField label="Chambres" value={`${client.chambres}`} icon={<Grid size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
            )}
            {(client.minSurface || client.surfaceMax) && (
              <InfoField label="Surface" value={`${client.minSurface || '?'} ~ ${client.surfaceMax || '?'} m²`} icon={<Maximize2 size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
            )}
            {client.nbPersonnes && (
              <InfoField label="Couchages max" value={`${client.nbPersonnes} personnes`} icon={<Users size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCaracteristiques = () => {
    const hasData = client.vue || client.exposition || client.etat || client.standing ||
      client.attributPrincipal || client.attributsPersonnalises?.length || client.criteres?.length;

    if (!hasData) return renderEmpty();

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {client.vue && <InfoField label="Vue" value={client.vue} icon={<Eye size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.exposition && <InfoField label="Exposition" value={client.exposition} icon={<Sun size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.etat && <InfoField label="État" value={client.etat} icon={<Home size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.standing && <InfoField label="Standing" value={client.standing} icon={<Star size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {client.attributPrincipal && (
            <div>
              <p className="text-sm font-medium text-text mb-2">Attribut principal</p>
              <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-premium/10 text-premium border border-premium/20">
                {client.attributPrincipal}
              </span>
            </div>
          )}

          <div>
            {renderTagList(client.attributsPersonnalises, 'Attributs personnalisés', isGerant)}
          </div>

          <div>
            {client.criteres && client.criteres.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-text mb-2">Critères de base</p>
                <div className="flex flex-wrap gap-1.5">
                  {client.criteres.map((crit: string) => (
                    <span key={crit} className={`px-2 py-1 text-xs rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] border border-[#905D5D]/20' : 'bg-accent/10 text-accent border border-accent/20'}`}>{crit}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderBudgetPeriode = () => {
    const hasData = client.prixMin || client.prixMax || client.dateArrivee || client.dateDepart || client.flexibiliteDates || c.nbNuits || c.nbAdultes || c.nbEnfants;
    if (!hasData) return renderEmpty();

    const budgetMin = c.budgetNuitMin || client.prixMin || 0;
    const budgetMax = c.budgetNuitMax || client.prixMax || 0;

    return (
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Budget</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(budgetMin || budgetMax) && (
              <InfoField label="Budget par nuit" value={`${budgetMin.toLocaleString() || '?'} ~ ${budgetMax.toLocaleString() || '?'} ${devise}`} icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
            )}
            {(c.tarifNuit || budgetMin) && (
              <InfoField label="Budget par semaine" value={c.tarifNuit ? `${(c.tarifNuit * 7).toLocaleString()} ${devise}` : `${(budgetMin * 7).toLocaleString()} ~ ${(budgetMax * 7).toLocaleString()} ${devise}`} icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
            )}
            {c.budgetTotal != null && (
              <InfoField label="Budget total pour le séjour" value={`${c.budgetTotal.toLocaleString()} ${devise}`} icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
            )}
          </div>
        </div>

        <div className="border-t border-border/30 pt-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Période recherchée</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.dateArrivee && (
              <InfoField label="Date d'arrivée souhaitée" value={new Date(client.dateArrivee).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
            )}
            {client.dateDepart && (
              <InfoField label="Date de départ souhaitée" value={new Date(client.dateDepart).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
            )}
            {(c.nbNuits !== undefined && c.nbNuits > 0) && (
              <InfoField label="Nombre de nuits" value={`${c.nbNuits}`} icon={<Clock size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
            )}
            {(c.nbAdultes !== undefined && c.nbAdultes > 0) && (
              <InfoField label="Nombre d'adultes" value={`${c.nbAdultes}`} icon={<Users size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
            )}
            {(c.nbEnfants !== undefined && c.nbEnfants > 0) && (
              <InfoField label="Nombre d'enfants" value={`${c.nbEnfants}`} icon={<Users size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
            )}
            {client.flexibiliteDates && (
              <InfoField label="Flexibilité sur les dates" value={client.flexibiliteDates} icon={<Clock size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderProximites = () => {
    const p = client.proximites;
    if (!p) return renderEmpty();
    const hasAny = p.transports?.length || p.commerces?.length || p.education?.length || p.sante?.length || p.loisirs?.length;
    if (!hasAny) return renderEmpty();

    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
          <MapPin size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
          Proximités
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {renderCategorieGroup(p.transports, 'Transports')}
          {renderCategorieGroup(p.commerces, 'Commerces & Services')}
          {renderCategorieGroup(p.education, 'Éducation')}
          {renderCategorieGroup(p.sante, 'Santé & Sport')}
          {renderCategorieGroup(p.loisirs, 'Loisirs & Nature')}
        </div>
      </div>
    );
  };

  const renderPrestations = () => {
    const p = client.prestations;
    if (!p) return renderEmpty();
    const hasAny = p.exterieur?.length || p.confort?.length || p.electromenager?.length || p.multimedia?.length || p.sport?.length;
    if (!hasAny) return renderEmpty();

    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
          <Star size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
          Prestations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {renderCategorieGroup(p.exterieur, 'Extérieur & Services')}
          {renderCategorieGroup(p.confort, 'Équipements')}
          {renderCategorieGroup(p.electromenager, 'Cuisine')}
          {renderCategorieGroup(p.multimedia, 'Divertissement')}
        </div>
      </div>
    );
  };

  const renderPaiementSejour = () => {
    const hasData = c.nbVoyageurs || c.nbEnfantsSejour || c.animaux || c.animauxAcceptes || c.regimeAlimentaire ||
      c.languesParlees?.length || client.modePaiement || c.acompteVersee || c.acompteMontant || c.acompteDate ||
      c.caution || c.cautionMontant || c.cautionMode || c.soldeRestant || c.dateLimiteSolde ||
      c.demandesSpeciales || c.arriveeHeure || c.arriveeTransport || client.notes || c.notesInternes;

    if (!hasData) return renderEmpty();

    const acompteVal = c.acompteMontant ?? c.acompteVersee;
    const cautionVal = c.cautionMontant ?? c.caution;

    return (
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Informations sur le séjour</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {c.nbVoyageurs && <InfoField label="Nombre de voyageurs" value={`${c.nbVoyageurs}`} icon={<Users size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {(c.nbEnfantsSejour !== undefined && c.nbEnfantsSejour > 0) && <InfoField label="Nombre d'enfants" value={`${c.nbEnfantsSejour}`} icon={<Users size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {(c.animaux || c.animauxAcceptes) && <InfoField label="Animaux de compagnie" value="Oui" icon={<CheckCircle size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {c.animauxEspeces && <InfoField label="Espèce(s)" value={c.animauxEspeces} icon={<Tag size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {c.regimeAlimentaire && <InfoField label="Régime alimentaire" value={c.regimeAlimentaire} icon={<Tag size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {c.languesParlees?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-text mb-2">Langues parlées</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.languesParlees.map((l: string) => (
                    <span key={l} className={`px-2 py-1 text-xs rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] border border-[#905D5D]/20' : 'bg-accent/10 text-accent border border-accent/20'}`}>{l}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border/30 pt-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Mode de paiement</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.modePaiement && <InfoField label="Mode de paiement" value={client.modePaiement} icon={<CreditCard size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {acompteVal != null && <InfoField label="Acompte versé" value={`${acompteVal.toLocaleString()} ${devise}`} icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {c.acompteDate && <InfoField label="Date de l'acompte" value={new Date(c.acompteDate).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {c.soldeRestant != null && <InfoField label="Solde restant" value={`${c.soldeRestant.toLocaleString()} ${devise}`} icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {c.dateLimiteSolde && <InfoField label="Date limite de paiement du solde" value={new Date(c.dateLimiteSolde).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {cautionVal != null && <InfoField label="Caution" value={`${cautionVal.toLocaleString()} ${devise}`} icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {c.cautionMode && <InfoField label="Mode de prélèvement caution" value={c.cautionMode} icon={<CreditCard size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          </div>
        </div>

        <div className="border-t border-border/30 pt-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Notes complémentaires</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {c.demandesSpeciales && <InfoField label="Demandes spéciales" value={c.demandesSpeciales} icon={<FileText size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {c.arriveeHeure && <InfoField label="Heure d'arrivée prévue" value={c.arriveeHeure} icon={<Clock size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {c.arriveeTransport && <InfoField label="Moyen de transport" value={c.arriveeTransport} icon={<Compass size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {(client.notes || c.notesInternes) && <InfoField label="Notes internes" value={client.notes || c.notesInternes} icon={<FileText size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          </div>
        </div>
      </div>
    );
  };

  const renderContrat = () => {
    const hasData = client.numeroMandat || client.statutReservation || c.bienReserve || c.tarifNuit || c.montantTotalHorsOptions || c.montantTotalAvecOptions || c.conditionAnnulation || c.checkInHeure || c.checkOutHeure || c.animauxAcceptes !== undefined || c.fumeur !== undefined
      || client.assuranceAnnulation || client.assuranceMultirisque
      || client.dateLimiteAnnulation || client.penaliteAnnulation || client.edlEntree || client.edlSortie || client.reglementInterieur !== undefined || client.contratNotes
      || (client.guideCheckin && client.guideCheckin.length > 0)
      || (client.checklistDepart && client.checklistDepart.length > 0)
      || client.cartePrivilegeActif || (client.cartePrivilegePartenaires && client.cartePrivilegePartenaires.length > 0)
      || client.conciergerieActif || client.conciergerieWhatsapp || (client.conciergerieActivites && client.conciergerieActivites.length > 0)
      || client.assistanceWhatsapp || client.assistanceTelephone || client.assistanceEmail;
    if (!hasData) return renderEmpty();

    return (
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Informations générales de la réservation</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.numeroMandat && <InfoField label="Numéro de réservation" value={client.numeroMandat} icon={<Tag size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {client.statutReservation && <InfoField label="Statut" value={client.statutReservation} icon={<Clock size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {client.dateSignature && <InfoField label="Date de réservation" value={new Date(client.dateSignature).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {client.dateDebut && <InfoField label="Date d'arrivée" value={new Date(client.dateDebut).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {client.dateExpiration && <InfoField label="Date de départ" value={new Date(client.dateExpiration).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {(c.nbNuits !== undefined && c.nbNuits > 0) && <InfoField label="Nombre de nuits" value={`${c.nbNuits}`} icon={<Clock size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          </div>
        </div>

        <div className="border-t border-border/30 pt-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Détail du séjour</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {c.bienReserve && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => basePath && navigate(`${basePath}/properties/${c.bienReserve}`)}
                onKeyDown={(e) => { if (e.key === 'Enter' && basePath) navigate(`${basePath}/properties/${c.bienReserve}`); }}
                className={`p-4 rounded-xl bg-background transition-colors ${basePath ? `cursor-pointer ${isGerant ? 'hover:bg-[#905D5D]/5' : 'hover:bg-accent/5'}` : ''}`}
              >
                <div className="flex items-center gap-2 text-xs text-text-secondary mb-1">
                  <Layers size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                  <span>Bien réservé</span>
                </div>
                <p className={`text-sm font-medium ${isGerant ? 'text-[#905D5D]' : 'text-accent'} hover:underline`}>
                  {bienReserveProp ? (
                    <>{bienReserveProp.title || bienReserveProp.reference || `Bien #${bienReserveProp.id}`}{bienReserveProp.city ? ` - ${bienReserveProp.city}` : ''}</>
                  ) : (
                    <>Bien #{c.bienReserve}</>
                  )}
                </p>
              </div>
            )}
            {c.tarifNuit != null && <InfoField label="Tarif par nuit" value={`${c.tarifNuit.toLocaleString()} ${devise}`} icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {c.montantTotalHorsOptions != null && <InfoField label="Montant total (hors options)" value={`${c.montantTotalHorsOptions.toLocaleString()} ${devise}`} icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {c.montantTotalAvecOptions != null && <InfoField label="Montant total (avec options)" value={`${c.montantTotalAvecOptions.toLocaleString()} ${devise}`} icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {c.acompteMontant != null && <InfoField label="Acompte versé" value={`${c.acompteMontant.toLocaleString()} ${devise}`} icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {c.soldeRestant != null && <InfoField label="Solde restant" value={`${c.soldeRestant.toLocaleString()} ${devise}`} icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {c.cautionMontant != null && <InfoField label="Caution" value={`${c.cautionMontant.toLocaleString()} ${devise}`} icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          </div>
          {c.optionsSelectionnees?.length > 0 && (
            <div className="mt-4">
              {renderTagList(c.optionsSelectionnees, 'Options sélectionnées', isGerant)}
            </div>
          )}
        </div>

        <div className="border-t border-border/30 pt-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Conditions générales</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {c.conditionAnnulation && <InfoField label="Conditions d'annulation" value={c.conditionAnnulation} icon={<Shield size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {c.checkInHeure && <InfoField label="Heure d'arrivée (check-in)" value={c.checkInHeure} icon={<Clock size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {c.checkOutHeure && <InfoField label="Heure de départ (check-out)" value={c.checkOutHeure} icon={<Clock size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {c.animauxAcceptes !== undefined && <InfoField label="Animaux acceptés" value={c.animauxAcceptes ? 'Oui' : 'Non'} icon={<CheckCircle size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {c.fumeur !== undefined && <InfoField label="Non-fumeur" value={c.fumeur ? 'Oui' : 'Non'} icon={<CheckCircle size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          </div>
        </div>

        {(client.assuranceAnnulation || client.assuranceMultirisque) && (
          <div className="border-t border-border/30 pt-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Assurance</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.assuranceAnnulation && <InfoField label="Assurance annulation proposée" value={client.assuranceAnnulationMontant != null ? `${client.assuranceAnnulationMontant.toLocaleString()} ${devise}` : 'Oui'} icon={<Shield size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
              {client.assuranceMultirisque && <InfoField label="Assurance multirisque proposée" value={client.assuranceMultirisqueMontant != null ? `${client.assuranceMultirisqueMontant.toLocaleString()} ${devise}` : 'Oui'} icon={<Shield size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            </div>
          </div>
        )}

        {(client.dateLimiteAnnulation || client.penaliteAnnulation || client.edlEntree || client.edlSortie || client.reglementInterieur !== undefined || client.contratNotes) && (
          <div className="border-t border-border/30 pt-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Conditions & État des lieux</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.dateLimiteAnnulation && <InfoField label="Date limite d'annulation" value={new Date(client.dateLimiteAnnulation).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
              {client.penaliteAnnulation != null && <InfoField label="Pénalité d'annulation" value={`${client.penaliteAnnulation} %`} icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
              {client.edlEntree && <InfoField label="État des lieux d'entrée" value={client.edlEntree} icon={<Calendar size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
              {client.edlSortie && <InfoField label="État des lieux de sortie" value={client.edlSortie} icon={<Calendar size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
              {client.reglementInterieur !== undefined && <InfoField label="Règlement intérieur accepté" value={client.reglementInterieur ? 'Oui' : 'Non'} icon={<CheckCircle size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
              {client.contratNotes && <InfoField label="Notes contrat" value={client.contratNotes} icon={<FileText size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            </div>
          </div>
        )}

        {(client.guideCheckin && client.guideCheckin.length > 0) && (
          <div className="border-t border-border/30 pt-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Guide Check-in</p>
            <div className="space-y-2">
              {client.guideCheckin.map((step, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-background/50">
                  <span className={`text-xs font-bold ${isGerant ? 'text-[#905D5D]' : 'text-accent'} mt-0.5`}>{i + 1}.</span>
                  <p className="text-sm text-text">{step.texte}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(client.checklistDepart && client.checklistDepart.length > 0) && (
          <div className="border-t border-border/30 pt-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Checklist Départ</p>
            <div className="space-y-2">
              {client.checklistDepart.map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                  <CheckSquare size={14} className={`${isGerant ? 'text-[#905D5D]' : 'text-accent'} shrink-0`} />
                  <p className="text-sm text-text flex-1">{item.texte}</p>
                  {item.obligatoire && <span className={`text-xs px-2 py-0.5 rounded-full ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>Obligatoire</span>}
                </div>
              ))}
            </div>
            {client.checklistDepartMessage && <p className="text-sm text-text mt-2">{client.checklistDepartMessage}</p>}
            {client.checklistDepartWhatsapp && <InfoField label="WhatsApp" value={client.checklistDepartWhatsapp} icon={<MessageCircle size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          </div>
        )}

        {(client.cartePrivilegeActif || (client.cartePrivilegePartenaires && client.cartePrivilegePartenaires.length > 0)) && (
          <div className="border-t border-border/30 pt-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Carte Privilège - Partenaires</p>
            {client.cartePrivilegeActif && <p className="text-sm text-emerald-600 font-medium mb-2">Activée</p>}
            {client.cartePrivilegePartenaires && client.cartePrivilegePartenaires.length > 0 && (
              <div className="space-y-2">
                {client.cartePrivilegePartenaires.map((p, i) => (
                  <div key={i} className="p-3 rounded-lg bg-background/50 border border-border/30">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-text">{p.nom}</p>
                      {p.remise && <span className={`text-xs px-2 py-0.5 rounded-full ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>{p.remise}</span>}
                    </div>
                    {p.categorie && <p className="text-xs text-text-secondary mt-1">{p.categorie}</p>}
                    {p.description && <p className="text-xs text-text-secondary mt-1">{p.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(client.conciergerieActif || client.conciergerieWhatsapp || (client.conciergerieActivites && client.conciergerieActivites.length > 0)) && (
          <div className="border-t border-border/30 pt-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Conciergerie d'Activités</p>
            {client.conciergerieActif && <p className="text-sm text-emerald-600 font-medium mb-2">Activée</p>}
            {client.conciergerieWhatsapp && <InfoField label="WhatsApp" value={client.conciergerieWhatsapp} icon={<MessageCircle size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {client.conciergerieActivites && client.conciergerieActivites.length > 0 && (
              <div className="space-y-2 mt-2">
                {client.conciergerieActivites.map((a, i) => (
                  <div key={i} className="p-3 rounded-lg bg-background/50 border border-border/30">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-text">{a.titre}</p>
                      {a.prix && <span className={`text-xs font-medium ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>{a.prix} {devise}</span>}
                    </div>
                    {a.duree && <p className="text-xs text-text-secondary mt-1">Durée : {a.duree}</p>}
                    {a.description && <p className="text-xs text-text-secondary mt-1">{a.description}</p>}
                    {a.disponibilite && <p className="text-xs text-text-secondary mt-1">Dispo : {a.disponibilite}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(client.assistanceWhatsapp || client.assistanceTelephone || client.assistanceEmail) && (
          <div className="border-t border-border/30 pt-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Assistance 24/7</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.assistanceWhatsapp && <InfoField label="WhatsApp" value={client.assistanceWhatsapp} icon={<MessageCircle size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
              {client.assistanceTelephone && <InfoField label="Téléphone" value={client.assistanceTelephone} icon={<Phone size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
              {client.assistanceEmail && <InfoField label="Email" value={client.assistanceEmail} icon={<Mail size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            </div>
            {client.assistanceMessage && <p className="text-sm text-text mt-2">{client.assistanceMessage}</p>}
          </div>
        )}
      </div>
    );
  };

  const renderDocuments = () => {
    const docs = [
      { label: "Pièce d'identité (passeport ou CIN)", required: true, url: client.docIdentiteUrl, name: client.docIdentiteName },
      { label: 'Contrat de location signé', required: true, url: client.mandatPdfUrl, name: client.mandatPdfName },
      { label: 'Preuve de paiement (acompte)', required: true, url: client.docRevenusUrl, name: client.docRevenusName },
      { label: 'Justificatif de domicile', required: false, url: client.docDomicileUrl, name: client.docDomicileName },
    ];

    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-border/50 bg-background/50 p-4 space-y-3">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Documents justificatifs</p>
          {docs.map((doc, i) => {
            const uploaded = !!doc.url;
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${uploaded ? 'bg-emerald-500 border-emerald-500' : 'bg-background border-border'}`}>
                  {uploaded && (
                    <svg width="12" height="10" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm flex-1 ${uploaded ? 'text-text-secondary' : 'text-text'}`}>{doc.label}</span>
                {doc.name && <span className="text-[10px] text-text-secondary truncate max-w-[140px]">{doc.name}</span>}
                {doc.required ? (
                  <span className="text-[10px] font-medium text-error uppercase">Obligatoire</span>
                ) : (
                  <span className={`text-[10px] font-medium ${isGerant ? 'text-[#905D5D]' : 'text-accent'} uppercase`}>Recommandé</span>
                )}
                {uploaded && doc.url ? (
                  <button type="button" onClick={() => openViewer(doc.url!, doc.label)} className={`text-xs px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] border border-[#905D5D]/20 hover:bg-[#905D5D]/20' : 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20'}`}>
                    <Eye size={12} /> Voir
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-border/50 bg-background/50 p-4 space-y-3">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Fichier du contrat signé</p>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50">
            <FileText size={16} className={client.mandatPdfUrl ? 'text-emerald-500' : 'text-text-secondary'} />
            <span className="text-sm text-text flex-1">Contrat signé (PDF)</span>
            {client.mandatPdfUrl ? (
              <>
                <span className="text-[10px] font-medium text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded">Uploadé</span>
                <button type="button" onClick={() => openViewer(client.mandatPdfUrl!, 'Contrat signé')} className={`text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] border border-[#905D5D]/20 hover:bg-[#905D5D]/20' : 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20'}`}>
                  <Eye size={12} /> Voir
                </button>
              </>
            ) : (
              <span className="text-[10px] font-medium text-text-secondary uppercase bg-background px-2 py-0.5 rounded">Non uploadé</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContrats = () => {
    if (!canReadContracts) return null;
    return (
      <ClientContractsTab clientId={client.id} clientName={client.name} isGerant={isGerant} />
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 1: return renderCriteres();
      case 2: return renderCaracteristiques();
      case 3: return renderBudgetPeriode();
      case 4: return renderProximites();
      case 5: return renderPrestations();
      case 6: return renderPaiementSejour();
      case 7: return renderContrat();
      case 8: return renderDocuments();
      case 9: return renderContrats();
      case 10: return <NotesActiviteTab client={client} highlightActivityId={highlightActivityId} isGerant={isGerant} />;
      default: return null;
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card mt-4">
      <div className="px-6 border-b border-border/30 flex justify-between overflow-x-auto rounded-t-xl">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`py-3 px-2 text-xs font-medium border-b-2 transition-all text-center whitespace-nowrap ${
              activeTab === t.id ? (isGerant ? 'text-[#905D5D] border-[#905D5D]' : 'text-accent border-accent') : 'text-text-secondary border-transparent hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-5">
        {renderTabContent()}
      </div>

      {viewerUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) closeViewer(); }}>
          <div className="flex items-center justify-between w-full max-w-5xl px-4 py-3">
            <span className="text-white text-sm font-medium truncate">{viewerTitle}</span>
            <button onClick={closeViewer} className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all shrink-0 ml-4">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 w-full max-w-5xl px-4 pb-4 min-h-0">
            {viewerUrl.endsWith('.pdf') ? (
              <iframe src={viewerUrl} className="w-full h-full rounded-lg bg-white" title={viewerTitle} />
            ) : (
              <img src={viewerUrl} alt={viewerTitle} className="max-w-full max-h-full mx-auto rounded-lg object-contain" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
