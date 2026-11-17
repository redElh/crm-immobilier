import { API_ORIGIN } from '../../../../utils/config'
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { InfoField } from '../../../ui/InfoField';
import { Button } from '../../../ui/Button';
import { ClientContractsTab } from '../ClientContractsTab';
import { NotesActiviteTab } from './NotesActiviteTab';
import { ClientTabsShell, StageField, StageSection, StageTags, HeaderPills, StageEmpty, ProximitesGrid, PrestationsGrid, useDetailAccent, StageDocumentsTab } from './ClientDetailStage';
import { Client } from '../../../../types/client';
import {
  Home, MapPin, Maximize2, Grid, Clock, User, Briefcase, CheckCircle,
  AlertCircle, Calendar, Eye, Sun, Tag, Star, Layers, Compass,
  DollarSign, CreditCard, FileText, Plus, Shield, X, Sliders,
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
          <span key={item} className={`px-2 py-1 text-xs rounded-lg ${'bg-accent/10 text-accent border border-accent/20'}`}>
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

  /* Staged theme accents for the first tab (Critères). */
  const { isDark, accent, ink } = useDetailAccent(client.type, isGerant);
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
  const viewerUrl = rawViewerUrl ? (rawViewerUrl.startsWith('http') ? rawViewerUrl : `${API_ORIGIN}${rawViewerUrl}`) : null;
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

    if (!hasData) return <StageEmpty isDark={isDark} />;

    const showGeo = ((client.latitude && client.latitude !== 0) || (client.longitude && client.longitude !== 0));

    return (
      <div className="space-y-5">
        <HeaderPills statutMetier={client.statutMetier} classification={client.classification} source={client.source} isDark={isDark} />

        <StageSection icon={Home} title="Séjour" accent={accent} ink={ink} isDark={isDark} delay={0.05}>
          <StageField icon={Tag} label="Catégorie" value={client.categorie || 'Location saisonnière'} accent={accent} ink={ink} isDark={isDark} />
          {client.propertyType && <StageField icon={Home} label="Type de bien recherché" value={client.propertyType} accent={accent} ink={ink} isDark={isDark} />}
          {(client.secteur || client.area) && <StageField icon={MapPin} label="Secteur géographique" value={client.secteur || client.area || 'Non spécifié'} accent={accent} ink={ink} isDark={isDark} />}
          {client.localisation && <StageField icon={MapPin} label="Localisation" value={client.localisation} accent={accent} ink={ink} isDark={isDark} />}
        </StageSection>

        {showGeo && (
          <StageSection icon={Compass} title="Géolocalisation" accent={accent} ink={ink} isDark={isDark} delay={0.1}>
            <StageField
              icon={Compass}
              label="Coordonnées"
              value={`${client.latitude?.toFixed(4) || '0'}, ${client.longitude?.toFixed(4) || '0'}`}
              accent={accent}
              ink={ink}
              isDark={isDark}
              action={
                <a
                  href={`https://www.google.com/maps?q=${client.latitude},${client.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-[11px] font-bold transition-opacity hover:opacity-80"
                  style={{ color: ink }}
                >
                  Maps ↗
                </a>
              }
            />
          </StageSection>
        )}

        <StageSection icon={Grid} title="Capacité" accent={accent} ink={ink} isDark={isDark} delay={0.15}>
          {client.pieces && (
            <StageField icon={Grid} label="Pièces" value={`${client.pieces}`} accent={accent} ink={ink} isDark={isDark} />
          )}
          {client.chambres && (
            <StageField icon={Grid} label="Chambres" value={`${client.chambres}`} accent={accent} ink={ink} isDark={isDark} />
          )}
          {(client.minSurface || client.surfaceMax) && (
            <StageField icon={Maximize2} label="Surface" value={`${client.minSurface || '?'} ~ ${client.surfaceMax || '?'} m²`} accent={accent} ink={ink} isDark={isDark} />
          )}
          {client.nbPersonnes && (
            <StageField icon={Users} label="Couchages max" value={`${client.nbPersonnes} personnes`} accent={accent} ink={ink} isDark={isDark} />
          )}
        </StageSection>
      </div>
    );
  };

  const renderCaracteristiques = () => {
    const hasData = client.vue || client.exposition || client.etat || client.standing ||
      client.attributPrincipal || client.attributsPersonnalises?.length || client.criteres?.length;

    if (!hasData) return <StageEmpty isDark={isDark} />;

    const showQual = client.vue || client.exposition || client.etat || client.standing;

    return (
      <div className="space-y-5">
        {showQual ? (
          <StageSection icon={Eye} title="Atouts du bien" accent={accent} ink={ink} isDark={isDark} delay={0.05}>
            {client.vue && <StageField icon={Eye} label="Vue" value={client.vue} accent={accent} ink={ink} isDark={isDark} />}
            {client.exposition && <StageField icon={Sun} label="Exposition" value={client.exposition} accent={accent} ink={ink} isDark={isDark} />}
            {client.etat && <StageField icon={Home} label="État" value={client.etat} accent={accent} ink={ink} isDark={isDark} />}
            {client.standing && <StageField icon={Star} label="Standing" value={client.standing} accent={accent} ink={ink} isDark={isDark} />}
          </StageSection>
        ) : null}

        {(client.attributPrincipal || client.attributsPersonnalises?.length || client.criteres?.length) ? (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {client.attributPrincipal && (
              <StageTags icon={Star} label="Attribut principal" items={[client.attributPrincipal]} accent={accent} ink={ink} isDark={isDark} delay={0.1} />
            )}
            {client.attributsPersonnalises && client.attributsPersonnalises.length > 0 && (
              <StageTags icon={Sliders} label="Attributs personnalisés" items={client.attributsPersonnalises} accent={accent} ink={ink} isDark={isDark} delay={0.15} />
            )}
            {client.criteres && client.criteres.length > 0 && (
              <StageTags icon={CheckCircle} label="Critères de base" items={client.criteres} accent={accent} ink={ink} isDark={isDark} delay={0.2} />
            )}
          </div>
        ) : null}
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
        <StageSection icon={DollarSign} title="Budget" accent={accent} ink={ink} isDark={isDark} delay={0.05}>
          {(budgetMin || budgetMax) && (
            <StageField icon={DollarSign} label="Budget par nuit" value={`${budgetMin.toLocaleString() || '?'} ~ ${budgetMax.toLocaleString() || '?'} ${devise}`} accent={accent} ink={ink} isDark={isDark} />
          )}
          {(c.tarifNuit || budgetMin) && (
            <StageField icon={DollarSign} label="Budget par semaine" value={c.tarifNuit ? `${(c.tarifNuit * 7).toLocaleString()} ${devise}` : `${(budgetMin * 7).toLocaleString()} ~ ${(budgetMax * 7).toLocaleString()} ${devise}`} accent={accent} ink={ink} isDark={isDark} />
          )}
          {c.budgetTotal != null && (
            <StageField icon={DollarSign} label="Budget total pour le séjour" value={`${c.budgetTotal.toLocaleString()} ${devise}`} accent={accent} ink={ink} isDark={isDark} />
          )}
        </StageSection>

        <StageSection icon={Calendar} title="Période recherchée" accent={accent} ink={ink} isDark={isDark} delay={0.1}>
          {client.dateArrivee && (
            <StageField icon={Calendar} label="Date d'arrivée souhaitée" value={new Date(client.dateArrivee).toLocaleDateString('fr-FR')} accent={accent} ink={ink} isDark={isDark} />
          )}
          {client.dateDepart && (
            <StageField icon={Calendar} label="Date de départ souhaitée" value={new Date(client.dateDepart).toLocaleDateString('fr-FR')} accent={accent} ink={ink} isDark={isDark} />
          )}
          {(c.nbNuits !== undefined && c.nbNuits > 0) && (
            <StageField icon={Clock} label="Nombre de nuits" value={`${c.nbNuits}`} accent={accent} ink={ink} isDark={isDark} />
          )}
          {(c.nbAdultes !== undefined && c.nbAdultes > 0) && (
            <StageField icon={Users} label="Nombre d'adultes" value={`${c.nbAdultes}`} accent={accent} ink={ink} isDark={isDark} />
          )}
          {(c.nbEnfants !== undefined && c.nbEnfants > 0) && (
            <StageField icon={Users} label="Nombre d'enfants" value={`${c.nbEnfants}`} accent={accent} ink={ink} isDark={isDark} />
          )}
          {client.flexibiliteDates && (
            <StageField icon={Clock} label="Flexibilité sur les dates" value={client.flexibiliteDates} accent={accent} ink={ink} isDark={isDark} />
          )}
        </StageSection>
      </div>
    );
  };

  const renderProximites = () => {
    const p = client.proximites;
    return <ProximitesGrid data={p} accent={accent} ink={ink} isDark={isDark} />;
  };

  const renderPrestations = () => {
    const p = client.prestations;
    return (
      <PrestationsGrid
        data={p}
        accent={accent}
        ink={ink}
        isDark={isDark}
        only={['exterieur', 'confort', 'electromenager', 'multimedia']}
        labels={{ exterieur: 'Extérieur & Services', confort: 'Équipements', electromenager: 'Cuisine', multimedia: 'Divertissement' }}
      />
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
        <StageSection icon={Users} title="Informations sur le séjour" accent={accent} ink={ink} isDark={isDark} delay={0.05}>
          {c.nbVoyageurs && <StageField icon={Users} label="Nombre de voyageurs" value={`${c.nbVoyageurs}`} accent={accent} ink={ink} isDark={isDark} />}
          {(c.nbEnfantsSejour !== undefined && c.nbEnfantsSejour > 0) && <StageField icon={Users} label="Nombre d'enfants" value={`${c.nbEnfantsSejour}`} accent={accent} ink={ink} isDark={isDark} />}
          {(c.animaux || c.animauxAcceptes) && <StageField icon={CheckCircle} label="Animaux de compagnie" value="Oui" accent={accent} ink={ink} isDark={isDark} />}
          {c.animauxEspeces && <StageField icon={Tag} label="Espèce(s)" value={c.animauxEspeces} accent={accent} ink={ink} isDark={isDark} />}
          {c.regimeAlimentaire && <StageField icon={Tag} label="Régime alimentaire" value={c.regimeAlimentaire} accent={accent} ink={ink} isDark={isDark} />}
          {c.languesParlees?.length > 0 && (
            <div className="md:col-span-2">
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Langues parlées</p>
              <div className="flex flex-wrap gap-1.5">
                {c.languesParlees.map((l: string) => (
                  <span key={l} className={`px-2 py-1 text-xs rounded-lg ${isDark ? 'bg-white/[0.06] text-slate-200 border border-white/10' : 'bg-accent/10 text-accent border border-accent/20'}`}>{l}</span>
                ))}
              </div>
            </div>
          )}
        </StageSection>

        <StageSection icon={CreditCard} title="Mode de paiement" accent={accent} ink={ink} isDark={isDark} delay={0.1}>
          {client.modePaiement && <StageField icon={CreditCard} label="Mode de paiement" value={client.modePaiement} accent={accent} ink={ink} isDark={isDark} />}
          {acompteVal != null && <StageField icon={DollarSign} label="Acompte versé" value={`${acompteVal.toLocaleString()} ${devise}`} accent={accent} ink={ink} isDark={isDark} />}
          {c.acompteDate && <StageField icon={Calendar} label="Date de l'acompte" value={new Date(c.acompteDate).toLocaleDateString('fr-FR')} accent={accent} ink={ink} isDark={isDark} />}
          {c.soldeRestant != null && <StageField icon={DollarSign} label="Solde restant" value={`${c.soldeRestant.toLocaleString()} ${devise}`} accent={accent} ink={ink} isDark={isDark} />}
          {c.dateLimiteSolde && <StageField icon={Calendar} label="Date limite de paiement du solde" value={new Date(c.dateLimiteSolde).toLocaleDateString('fr-FR')} accent={accent} ink={ink} isDark={isDark} />}
          {cautionVal != null && <StageField icon={DollarSign} label="Caution" value={`${cautionVal.toLocaleString()} ${devise}`} accent={accent} ink={ink} isDark={isDark} />}
          {c.cautionMode && <StageField icon={CreditCard} label="Mode de prélèvement caution" value={c.cautionMode} accent={accent} ink={ink} isDark={isDark} />}
        </StageSection>

        <StageSection icon={FileText} title="Notes complémentaires" accent={accent} ink={ink} isDark={isDark} delay={0.15}>
          {c.demandesSpeciales && <StageField icon={FileText} label="Demandes spéciales" value={c.demandesSpeciales} accent={accent} ink={ink} isDark={isDark} />}
          {c.arriveeHeure && <StageField icon={Clock} label="Heure d'arrivée prévue" value={c.arriveeHeure} accent={accent} ink={ink} isDark={isDark} />}
          {c.arriveeTransport && <StageField icon={Compass} label="Moyen de transport" value={c.arriveeTransport} accent={accent} ink={ink} isDark={isDark} />}
          {(client.notes || c.notesInternes) && <StageField icon={FileText} label="Notes internes" value={client.notes || c.notesInternes} accent={accent} ink={ink} isDark={isDark} />}
        </StageSection>
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
        <StageSection icon={Tag} title="Informations générales de la réservation" accent={accent} ink={ink} isDark={isDark} delay={0.05}>
          {client.numeroMandat && <StageField icon={Tag} label="Numéro de réservation" value={client.numeroMandat} accent={accent} ink={ink} isDark={isDark} />}
          {client.statutReservation && <StageField icon={Clock} label="Statut" value={client.statutReservation} accent={accent} ink={ink} isDark={isDark} />}
          {client.dateSignature && <StageField icon={Calendar} label="Date de réservation" value={new Date(client.dateSignature).toLocaleDateString('fr-FR')} accent={accent} ink={ink} isDark={isDark} />}
          {client.dateDebut && <StageField icon={Calendar} label="Date d'arrivée" value={new Date(client.dateDebut).toLocaleDateString('fr-FR')} accent={accent} ink={ink} isDark={isDark} />}
          {client.dateExpiration && <StageField icon={Calendar} label="Date de départ" value={new Date(client.dateExpiration).toLocaleDateString('fr-FR')} accent={accent} ink={ink} isDark={isDark} />}
          {(c.nbNuits !== undefined && c.nbNuits > 0) && <StageField icon={Clock} label="Nombre de nuits" value={`${c.nbNuits}`} accent={accent} ink={ink} isDark={isDark} />}
        </StageSection>

        <StageSection icon={Layers} title="Détail du séjour" accent={accent} ink={ink} isDark={isDark} delay={0.1}>
          {c.bienReserve && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => basePath && navigate(`${basePath}/properties/${c.bienReserve}`)}
              onKeyDown={(e) => { if (e.key === 'Enter' && basePath) navigate(`${basePath}/properties/${c.bienReserve}`); }}
              className={`rounded-2xl border p-4 backdrop-blur-sm transition-colors ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75'} ${basePath ? ('hover:bg-accent/5 cursor-pointer') : ''}`}
            >
              <div className={`flex items-center gap-2 text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <Layers size={16} className={'text-accent'} />
                <span>Bien réservé</span>
              </div>
              <p className={`text-sm font-medium ${'text-accent'} hover:underline`}>
                {bienReserveProp ? (
                  <>{bienReserveProp.title || bienReserveProp.reference || `Bien #${bienReserveProp.id}`}{bienReserveProp.city ? ` - ${bienReserveProp.city}` : ''}</>
                ) : (
                  <>Bien #{c.bienReserve}</>
                )}
              </p>
            </div>
          )}
          {c.tarifNuit != null && <StageField icon={DollarSign} label="Tarif par nuit" value={`${c.tarifNuit.toLocaleString()} ${devise}`} accent={accent} ink={ink} isDark={isDark} />}
          {c.montantTotalHorsOptions != null && <StageField icon={DollarSign} label="Montant total (hors options)" value={`${c.montantTotalHorsOptions.toLocaleString()} ${devise}`} accent={accent} ink={ink} isDark={isDark} />}
          {c.montantTotalAvecOptions != null && <StageField icon={DollarSign} label="Montant total (avec options)" value={`${c.montantTotalAvecOptions.toLocaleString()} ${devise}`} accent={accent} ink={ink} isDark={isDark} />}
          {c.acompteMontant != null && <StageField icon={DollarSign} label="Acompte versé" value={`${c.acompteMontant.toLocaleString()} ${devise}`} accent={accent} ink={ink} isDark={isDark} />}
          {c.soldeRestant != null && <StageField icon={DollarSign} label="Solde restant" value={`${c.soldeRestant.toLocaleString()} ${devise}`} accent={accent} ink={ink} isDark={isDark} />}
          {c.cautionMontant != null && <StageField icon={DollarSign} label="Caution" value={`${c.cautionMontant.toLocaleString()} ${devise}`} accent={accent} ink={ink} isDark={isDark} />}
          {c.optionsSelectionnees?.length > 0 && (
            <div className="md:col-span-2">
              {renderTagList(c.optionsSelectionnees, 'Options sélectionnées', isGerant)}
            </div>
          )}
        </StageSection>

        <StageSection icon={Shield} title="Conditions générales" accent={accent} ink={ink} isDark={isDark} delay={0.15}>
          {c.conditionAnnulation && <StageField icon={Shield} label="Conditions d'annulation" value={c.conditionAnnulation} accent={accent} ink={ink} isDark={isDark} />}
          {c.checkInHeure && <StageField icon={Clock} label="Heure d'arrivée (check-in)" value={c.checkInHeure} accent={accent} ink={ink} isDark={isDark} />}
          {c.checkOutHeure && <StageField icon={Clock} label="Heure de départ (check-out)" value={c.checkOutHeure} accent={accent} ink={ink} isDark={isDark} />}
          {c.animauxAcceptes !== undefined && <StageField icon={CheckCircle} label="Animaux acceptés" value={c.animauxAcceptes ? 'Oui' : 'Non'} accent={accent} ink={ink} isDark={isDark} />}
          {c.fumeur !== undefined && <StageField icon={CheckCircle} label="Non-fumeur" value={c.fumeur ? 'Oui' : 'Non'} accent={accent} ink={ink} isDark={isDark} />}
        </StageSection>

        {(client.assuranceAnnulation || client.assuranceMultirisque) && (
          <StageSection icon={Shield} title="Assurance" accent={accent} ink={ink} isDark={isDark} delay={0.2}>
            {client.assuranceAnnulation && <StageField icon={Shield} label="Assurance annulation proposée" value={client.assuranceAnnulationMontant != null ? `${client.assuranceAnnulationMontant.toLocaleString()} ${devise}` : 'Oui'} accent={accent} ink={ink} isDark={isDark} />}
            {client.assuranceMultirisque && <StageField icon={Shield} label="Assurance multirisque proposée" value={client.assuranceMultirisqueMontant != null ? `${client.assuranceMultirisqueMontant.toLocaleString()} ${devise}` : 'Oui'} accent={accent} ink={ink} isDark={isDark} />}
          </StageSection>
        )}

        {(client.dateLimiteAnnulation || client.penaliteAnnulation || client.edlEntree || client.edlSortie || client.reglementInterieur !== undefined || client.contratNotes) && (
          <StageSection icon={Calendar} title="Conditions & État des lieux" accent={accent} ink={ink} isDark={isDark} delay={0.25}>
            {client.dateLimiteAnnulation && <StageField icon={Calendar} label="Date limite d'annulation" value={new Date(client.dateLimiteAnnulation).toLocaleDateString('fr-FR')} accent={accent} ink={ink} isDark={isDark} />}
            {client.penaliteAnnulation != null && <StageField icon={DollarSign} label="Pénalité d'annulation" value={`${client.penaliteAnnulation} %`} accent={accent} ink={ink} isDark={isDark} />}
            {client.edlEntree && <StageField icon={Calendar} label="État des lieux d'entrée" value={client.edlEntree} accent={accent} ink={ink} isDark={isDark} />}
            {client.edlSortie && <StageField icon={Calendar} label="État des lieux de sortie" value={client.edlSortie} accent={accent} ink={ink} isDark={isDark} />}
            {client.reglementInterieur !== undefined && <StageField icon={CheckCircle} label="Règlement intérieur accepté" value={client.reglementInterieur ? 'Oui' : 'Non'} accent={accent} ink={ink} isDark={isDark} />}
            {client.contratNotes && <StageField icon={FileText} label="Notes contrat" value={client.contratNotes} accent={accent} ink={ink} isDark={isDark} />}
          </StageSection>
        )}

        {(client.guideCheckin && client.guideCheckin.length > 0) && (
          <StageSection icon={Layers} title="Guide Check-in" accent={accent} ink={ink} isDark={isDark} delay={0.3}>
            {client.guideCheckin.map((step, i) => (
              <div key={i} className={`flex items-start gap-2 p-3 rounded-2xl border backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75'}`}>
                <span className={`text-xs font-bold mt-0.5 ${'text-accent'}`}>{i + 1}.</span>
                <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{step.texte}</p>
              </div>
            ))}
          </StageSection>
        )}

        {(client.checklistDepart && client.checklistDepart.length > 0) && (
          <StageSection icon={CheckSquare} title="Checklist Départ" accent={accent} ink={ink} isDark={isDark} delay={0.35}>
            {client.checklistDepart.map((item, i) => (
              <div key={i} className={`flex items-center gap-2 p-3 rounded-2xl border backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75'}`}>
                <CheckSquare size={14} className={`${'text-accent'} shrink-0`} />
                <p className={`text-sm flex-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{item.texte}</p>
                {item.obligatoire && <span className={`text-xs px-2 py-0.5 rounded-full ${'bg-accent/10 text-accent'}`}>Obligatoire</span>}
              </div>
            ))}
            {client.checklistDepartMessage && <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{client.checklistDepartMessage}</p>}
            {client.checklistDepartWhatsapp && <StageField icon={MessageCircle} label="WhatsApp" value={client.checklistDepartWhatsapp} accent={accent} ink={ink} isDark={isDark} />}
          </StageSection>
        )}

        {(client.cartePrivilegeActif || (client.cartePrivilegePartenaires && client.cartePrivilegePartenaires.length > 0)) && (
          <StageSection icon={Tag} title="Carte Privilège - Partenaires" accent={accent} ink={ink} isDark={isDark} delay={0.4}>
            {client.cartePrivilegeActif && <p className="text-sm text-emerald-600 font-medium">Activée</p>}
            {client.cartePrivilegePartenaires && client.cartePrivilegePartenaires.length > 0 && (
              <div className="space-y-2 md:col-span-2">
                {client.cartePrivilegePartenaires.map((p, i) => (
                  <div key={i} className={`p-3 rounded-2xl border backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75'}`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.nom}</p>
                      {p.remise && <span className={`text-xs px-2 py-0.5 rounded-full ${'bg-accent/10 text-accent'}`}>{p.remise}</span>}
                    </div>
                    {p.categorie && <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{p.categorie}</p>}
                    {p.description && <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{p.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </StageSection>
        )}

        {(client.conciergerieActif || client.conciergerieWhatsapp || (client.conciergerieActivites && client.conciergerieActivites.length > 0)) && (
          <StageSection icon={Layers} title="Conciergerie d'Activités" accent={accent} ink={ink} isDark={isDark} delay={0.45}>
            {client.conciergerieActif && <p className="text-sm text-emerald-600 font-medium">Activée</p>}
            {client.conciergerieWhatsapp && <StageField icon={MessageCircle} label="WhatsApp" value={client.conciergerieWhatsapp} accent={accent} ink={ink} isDark={isDark} />}
            {client.conciergerieActivites && client.conciergerieActivites.length > 0 && (
              <div className="space-y-2 md:col-span-2">
                {client.conciergerieActivites.map((a, i) => (
                  <div key={i} className={`p-3 rounded-2xl border backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75'}`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{a.titre}</p>
                      {a.prix && <span className={`text-xs font-medium ${'text-accent'}`}>{a.prix} {devise}</span>}
                    </div>
                    {a.duree && <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Durée : {a.duree}</p>}
                    {a.description && <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{a.description}</p>}
                    {a.disponibilite && <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Dispo : {a.disponibilite}</p>}
                  </div>
                ))}
              </div>
            )}
          </StageSection>
        )}

        {(client.assistanceWhatsapp || client.assistanceTelephone || client.assistanceEmail) && (
          <StageSection icon={MessageCircle} title="Assistance 24/7" accent={accent} ink={ink} isDark={isDark} delay={0.5}>
            {client.assistanceWhatsapp && <StageField icon={MessageCircle} label="WhatsApp" value={client.assistanceWhatsapp} accent={accent} ink={ink} isDark={isDark} />}
            {client.assistanceTelephone && <StageField icon={Phone} label="Téléphone" value={client.assistanceTelephone} accent={accent} ink={ink} isDark={isDark} />}
            {client.assistanceEmail && <StageField icon={Mail} label="Email" value={client.assistanceEmail} accent={accent} ink={ink} isDark={isDark} />}
            {client.assistanceMessage && <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{client.assistanceMessage}</p>}
          </StageSection>
        )}
      </div>
    );
  };

  const renderDocuments = () => {
    const items = [
      { label: "Pièce d'identité (passeport ou CIN)", required: true, url: client.docIdentiteUrl, name: client.docIdentiteName },
      { label: 'Preuve de paiement (acompte)', required: true, url: client.docRevenusUrl, name: client.docRevenusName },
      { label: 'Justificatif de domicile', required: false, url: client.docDomicileUrl, name: client.docDomicileName },
    ];

    return (
      <StageDocumentsTab
        items={items}
        clientName={client.name}
        mandatTitle="Contrat signé"
        mandatUrl={client.mandatPdfUrl}
        mandatName={(client as any).mandatPdfName || 'Contrat signé (PDF)'}
        accent={accent}
        ink={ink}
        isDark={isDark}
        isGerant={isGerant}
        onOpen={openViewer}
      />
    );
  };

  const renderContrats = () => {
    if (!canReadContracts) return null;
    return (
      <ClientContractsTab clientId={client.id} clientName={client.name} clientType={client.type} isGerant={isGerant} />
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
    <>
      <ClientTabsShell
        tabs={visibleTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        clientType={client.type}
        isGerant={isGerant}
      >
        {renderTabContent()}
      </ClientTabsShell>

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
    </>
  );
};
