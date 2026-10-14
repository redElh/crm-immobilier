import { API_ORIGIN } from '../../../../utils/config'
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { InfoField } from '../../../ui/InfoField';
import { Button } from '../../../ui/Button';
import { ClientTransactionsTab } from '../ClientTransactionsTab';
import { NotesActiviteTab } from './NotesActiviteTab';
import { ClientContractsTab } from '../ClientContractsTab';
import { ClientTabsShell, StageField, StageSection, StageTags, HeaderPills, StageEmpty, ProximitesGrid, PrestationsGrid, StageHeroAmount, StagePill, StageLinkCard, StageDocButton, getMandatStatusHue, OK_STAGE_HUE, SLATE_STAGE_HUE, useDetailAccent } from './ClientDetailStage';
import { Client } from '../../../../types/client';
import { api } from '../../../../services/api';
import { useMyPermissions, permissionAllowed } from '../../../../hooks/useMyPermissions';
import {
  Home, MapPin, Maximize2, Grid, Clock, User, Briefcase, CheckCircle,
  AlertCircle, Calendar, Sliders, Eye, Sun, Tag, Star, Layers, Compass,
  DollarSign, CreditCard, FileText, Download, Trash2, Plus,
  Mail, RefreshCw, Link, Award, Hexagon, X, Hash, Shield
} from 'react-feather';

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
  { id: 1, label: 'Infos', slug: 'infos' },
  { id: 2, label: 'Caractéristiques', slug: 'caracteristiques' },
  { id: 3, label: 'Loyer & Charges', slug: 'loyer_charges' },
  { id: 4, label: 'Proximités', slug: 'proximites' },
  { id: 5, label: 'Prestations', slug: 'prestations' },
  { id: 6, label: 'Situation', slug: 'situation' },
  { id: 7, label: 'Mandat', slug: 'mandat' },
  { id: 8, label: 'Documents', slug: 'documents' },
  { id: 9, label: 'Transactions', slug: 'transactions' },
  { id: 10, label: 'Contrats', slug: 'contrats' },
  { id: 11, label: 'Notes & Activité', slug: 'notes_activite' },
];

export const BailleurDetailTabs = ({ client: initialClient, highlightActivityId, isGerant = false }: { client: Client; highlightActivityId?: number; isGerant?: boolean }) => {
  const navigate = useNavigate();
  const [client, setClientState] = useState<Client>(initialClient);
  useEffect(() => {
    setClientState(initialClient);
  }, [initialClient]);

  /* Staged theme accents for the first tab (Infos). */
  const { isDark, accent, ink } = useDetailAccent(client.type, isGerant);
  const [bienProp, setBienProp] = useState<any>(null);
  const [rawViewerUrl, setRawViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState('');
  const viewerUrl = rawViewerUrl ? (rawViewerUrl.startsWith('http') ? rawViewerUrl : `${API_ORIGIN}${rawViewerUrl}`) : null;

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

  const openViewer = useCallback((url: string, title: string) => {
    setRawViewerUrl(url);
    setViewerTitle(title);
  }, []);

  const closeViewer = useCallback(() => {
    setRawViewerUrl(null);
    setViewerTitle('');
  }, []);

  useEffect(() => {
    if (!viewerUrl) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') closeViewer(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [viewerUrl, closeViewer]);

  useEffect(() => {
    const c = client as any;
    if (c.bienConcerneId) {
      api.get<any>(`/properties/${c.bienConcerneId}`).then(setBienProp).catch(() => {});
    }
  }, [(client as any).bienConcerneId]);

  const updateClient = (updates: Partial<Client>) => {
    setClientState(prev => ({ ...prev, ...updates }));
  };

  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
      <AlertCircle size={32} className="mb-3 opacity-40" />
      <p className="text-sm">Aucune information renseignée pour cette section</p>
    </div>
  );

  // ─── TAB 1: INFOS (Localisation & Type) — staged ───
  const renderInfos = () => {
    const c = client as any;
    const hasData = client.localisation || c.adresseComplete || c.codePostalVille || client.secteur ||
      client.categorie || client.propertyType || c.referenceCadastrale || c.lotCopropriete ||
      c.nbLotsTotal || client.latitude || client.longitude;

    if (!hasData) return <StageEmpty isDark={isDark} />;

    return (
      <div className="space-y-5">
        <HeaderPills statutMetier={client.statutMetier} classification={client.classification} source={client.source} isDark={isDark} />

        <StageSection icon={Home} title="Bien & Localisation" accent={accent} ink={ink} isDark={isDark} delay={0.05}>
          {client.localisation && <StageField icon={MapPin} label="Pays" value={client.localisation} accent={accent} ink={ink} isDark={isDark} />}
          {client.categorie && <StageField icon={Tag} label="Catégorie" value={client.categorie} accent={accent} ink={ink} isDark={isDark} />}
          {client.propertyType && <StageField icon={Home} label="Type de bien" value={client.propertyType} accent={accent} ink={ink} isDark={isDark} />}
          {client.secteur && <StageField icon={MapPin} label="Secteur" value={client.secteur} accent={accent} ink={ink} isDark={isDark} />}
          {c.adresseComplete && <StageField icon={MapPin} label="Adresse complète" value={c.adresseComplete} accent={accent} ink={ink} isDark={isDark} />}
          {c.complementAdresse && <StageField icon={MapPin} label="Complément d'adresse" value={c.complementAdresse} accent={accent} ink={ink} isDark={isDark} />}
          {c.codePostalVille && <StageField icon={MapPin} label="Code postal & Ville" value={c.codePostalVille} accent={accent} ink={ink} isDark={isDark} />}
        </StageSection>

        <StageSection icon={Layers} title="Informations foncières" accent={accent} ink={ink} isDark={isDark} delay={0.1}>
          {c.referenceCadastrale && <StageField icon={Hash} label="Référence cadastrale" value={c.referenceCadastrale} accent={accent} ink={ink} isDark={isDark} />}
          {c.lotCopropriete && <StageField icon={Layers} label="Lot copropriété" value={`${c.lotCopropriete}`} accent={accent} ink={ink} isDark={isDark} />}
          <StageField icon={CheckCircle} label="Syndic présent" value={c.syndicPresent ? 'Oui' : 'Non'} accent={accent} ink={ink} isDark={isDark} />
          {c.syndicPresent && c.nbLotsTotal && (
            <StageField icon={Layers} label="Nombre total de lots" value={`${c.nbLotsTotal}`} accent={accent} ink={ink} isDark={isDark} />
          )}
        </StageSection>

        {(client.latitude || client.longitude) && (
          <StageSection icon={Compass} title="Géolocalisation" accent={accent} ink={ink} isDark={isDark} delay={0.15}>
            {client.latitude && <StageField icon={MapPin} label="Latitude" value={`${client.latitude}`} accent={accent} ink={ink} isDark={isDark} />}
            {client.longitude && <StageField icon={MapPin} label="Longitude" value={`${client.longitude}`} accent={accent} ink={ink} isDark={isDark} />}
          </StageSection>
        )}
      </div>
    );
  };

  // ─── TAB 2: CARACTÉRISTIQUES — staged ───
  const renderCaracteristiques = () => {
    const hasData = client.pieces || client.chambres || client.minSurface || client.surfaceMax ||
      client.etage !== undefined || client.vue || client.exposition || client.etat ||
      client.standing || client.disponibilite || client.attributPrincipal ||
      client.attributsPersonnalises?.length || client.criteres?.length;

    if (!hasData) return <StageEmpty isDark={isDark} />;

    const showQuant = client.pieces || client.chambres || client.minSurface || client.surfaceMax || client.etage !== undefined;
    const showQual = client.vue || client.exposition || client.etat || client.standing || client.disponibilite || client.attributPrincipal;

    return (
      <div className="space-y-5">
        {showQuant ? (
          <StageSection icon={Grid} title="Caractéristiques quantitatives" accent={accent} ink={ink} isDark={isDark} delay={0.05}>
            {client.pieces && <StageField icon={Grid} label="Pièces" value={`${client.pieces}`} accent={accent} ink={ink} isDark={isDark} />}
            {client.chambres && <StageField icon={Grid} label="Chambres" value={`${client.chambres}`} accent={accent} ink={ink} isDark={isDark} />}
            {client.minSurface && <StageField icon={Maximize2} label="Surface minimale" value={`${client.minSurface} m²`} accent={accent} ink={ink} isDark={isDark} />}
            {client.surfaceMax && <StageField icon={Maximize2} label="Surface maximale" value={`${client.surfaceMax} m²`} accent={accent} ink={ink} isDark={isDark} />}
            {client.etage !== undefined && (
              <StageField icon={Layers} label="Étage" value={`${client.etageOperator === 'ge' ? '≥ ' : client.etageOperator === 'le' ? '≤ ' : '= '}${client.etage}`} accent={accent} ink={ink} isDark={isDark} />
            )}
          </StageSection>
        ) : null}

        {showQual ? (
          <StageSection icon={Star} title="Caractéristiques qualitatives" accent={accent} ink={ink} isDark={isDark} delay={0.1}>
            {client.vue && <StageField icon={Eye} label="Vue" value={client.vue} accent={accent} ink={ink} isDark={isDark} />}
            {client.exposition && <StageField icon={Sun} label="Exposition" value={client.exposition} accent={accent} ink={ink} isDark={isDark} />}
            {client.etat && <StageField icon={Home} label="État" value={client.etat} accent={accent} ink={ink} isDark={isDark} />}
            {client.standing && <StageField icon={Star} label="Standing" value={client.standing} accent={accent} ink={ink} isDark={isDark} />}
            {client.disponibilite && <StageField icon={Clock} label="Disponibilité" value={client.disponibilite} accent={accent} ink={ink} isDark={isDark} />}
            {client.attributPrincipal && <StageField icon={Sliders} label="Attribut principal" value={client.attributPrincipal} accent={accent} ink={ink} isDark={isDark} />}
          </StageSection>
        ) : null}

        {(client.attributsPersonnalises?.length || client.criteres?.length) ? (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
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

  // ─── TAB 3: LOYER & CHARGES — staged ───
  const renderLoyerCharges = () => {
    const c = client as any;
    const hasData = c.loyerHC || c.charges || c.depotGarantie || c.typeLoyer || c.periodiciteLoyer;
    if (!hasData) return <StageEmpty isDark={isDark} />;

    const loyerCC = (c.loyerHC || 0) + (c.charges || 0);

    return (
      <div className="space-y-5">
        {loyerCC > 0 && (
          <StageHeroAmount
            icon={DollarSign}
            label="Loyer mensuel (charges comprises)"
            value={`${loyerCC.toLocaleString('fr-FR')} ${client.devise || 'MAD'}`}
            hint="Calculé : Loyer HC + Charges"
            accent={accent}
            ink={ink}
            isDark={isDark}
            delay={0.05}
          />
        )}
        <StageSection icon={DollarSign} title="Loyer et charges" accent={accent} ink={ink} isDark={isDark} delay={0.1}>
          {c.loyerHC && (
            <StageField icon={DollarSign} label="Loyer mensuel (hors charges)" value={`${c.loyerHC.toLocaleString()} ${client.devise || 'MAD'}`} accent={accent} ink={ink} isDark={isDark} />
          )}
          {c.charges && (
            <StageField icon={CreditCard} label="Charges mensuelles" value={`${c.charges.toLocaleString()} ${client.devise || 'MAD'}`} accent={accent} ink={ink} isDark={isDark} />
          )}
          {c.depotGarantie && (
            <StageField icon={CreditCard} label="Dépôt de garantie" value={`${c.depotGarantie.toLocaleString()} ${client.devise || 'MAD'}`} accent={accent} ink={ink} isDark={isDark} />
          )}
          {c.typeLoyer && (
            <StageField icon={Tag} label="Type de loyer" value={c.typeLoyer} accent={accent} ink={ink} isDark={isDark} />
          )}
          {c.periodiciteLoyer && (
            <StageField icon={Calendar} label="Périodicité du loyer" value={c.periodiciteLoyer} accent={accent} ink={ink} isDark={isDark} />
          )}
        </StageSection>
      </div>
    );
  };

  // ─── TAB 4: PROXIMITÉS ───
  const renderProximites = () => {
    const p = client.proximites;
    return <ProximitesGrid data={p} accent={accent} ink={ink} isDark={isDark} />;
  };

  // ─── TAB 5: PRESTATIONS — staged ───
  const renderPrestations = () => {
    const p = client.prestations;
    return <PrestationsGrid data={p} accent={accent} ink={ink} isDark={isDark} />;
  };

  // ─── TAB 6: SITUATION ───
  const renderSituation = () => {
    const c = client as any;
    const hasData = client.currentSituation || client.reasonForSelling || c.creditEnCours || c.dateDisponibilite || c.conditionsParticulieres || client.notes;
    if (!hasData) return renderEmpty();

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {client.currentSituation && (
            <InfoField label="Situation actuelle" value={client.currentSituation} icon={<User size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
          )}
          {client.reasonForSelling && (
            <InfoField label="Raison de la mise en location" value={client.reasonForSelling} icon={<Briefcase size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
          )}
          {c.creditEnCours !== undefined && (
            <InfoField label="Crédit en cours sur le bien" value={c.creditEnCours ? 'Oui' : 'Non'} icon={<CreditCard size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
          )}
          {c.creditEnCours && c.creditMontantRestant && (
            <InfoField label="Montant restant dû" value={`${c.creditMontantRestant.toLocaleString()} ${client.devise || 'MAD'}`} icon={<CreditCard size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
          )}
          {c.dateDisponibilite && (
            <InfoField label="Date souhaitée de disponibilité" value={new Date(c.dateDisponibilite).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
          )}
        </div>
        {c.conditionsParticulieres && (
          <div className="p-4 rounded-xl bg-background border border-border/30">
            <p className="text-xs font-medium text-text-secondary mb-1">Conditions particulières</p>
            <p className="text-sm text-text">{c.conditionsParticulieres}</p>
          </div>
        )}
        {client.notes && (
          <div className="p-4 rounded-xl bg-background border border-border/30">
            <p className="text-xs font-medium text-text-secondary mb-1">Notes complémentaires</p>
            <p className="text-sm text-text">{client.notes}</p>
          </div>
        )}
      </div>
    );
  };

  // ─── TAB 7: MANDAT ───
  const renderMandat = () => {
    if (!client.numeroMandat) return <StageEmpty isDark={isDark} />;
    const c = client as any;
    const clauseActive = !!client.dureeProtection;

    return (
      <div className="space-y-5">
        <StageSection icon={Layers} title="Mandat de gestion locative" accent={accent} ink={ink} isDark={isDark} delay={0.05}>
          <StageField icon={Tag} label="Numéro de mandat" value={client.numeroMandat} accent={accent} ink={ink} isDark={isDark} />
          {client.typeMandat && <StageField icon={Compass} label="Type de mandat" value={client.typeMandat} accent={accent} ink={ink} isDark={isDark} />}
          {client.statutMandat && (
            <StageField
              icon={Clock}
              label="Statut du mandat"
              value={<StagePill label={client.statutMandat} hue={getMandatStatusHue(client.statutMandat) || accent} isDark={isDark} />}
              accent={accent}
              ink={ink}
              isDark={isDark}
            />
          )}
          {client.dateDebut && <StageField icon={Calendar} label="Date début" value={new Date(client.dateDebut).toLocaleDateString('fr-FR')} accent={accent} ink={ink} isDark={isDark} />}
          {client.dateExpiration && <StageField icon={Calendar} label="Date expiration" value={new Date(client.dateExpiration).toLocaleDateString('fr-FR')} accent={accent} ink={ink} isDark={isDark} />}
          {client.conjoint && <StageField icon={User} label="Conjoint" value={client.conjoint} accent={accent} ink={ink} isDark={isDark} />}
          {client.societe && <StageField icon={Briefcase} label="Société (SCI)" value={client.societe} accent={accent} ink={ink} isDark={isDark} />}
          {client.agentDesigne && <StageField icon={User} label="Agent désigné" value={client.agentDesigne} accent={accent} ink={ink} isDark={isDark} />}
        </StageSection>

        {c.bienConcerneId && (
          <StageLinkCard
            icon={Layers}
            eyebrow="Bien concerné"
            title={bienProp ? `${bienProp.title || bienProp.reference || `Bien #${bienProp.id}`}${bienProp.city ? ` - ${bienProp.city}` : ''}` : `Bien #${c.bienConcerneId}`}
            onOpen={() => navigate(`/properties/${c.bienConcerneId}`)}
            accent={accent}
            ink={ink}
            isDark={isDark}
            delay={0.1}
          />
        )}

        <StageSection icon={Shield} title="Clause de protection" accent={accent} ink={ink} isDark={isDark} delay={0.15}>
          <StageField
            icon={Shield}
            label="Clause de protection"
            value={<StagePill label={clauseActive ? 'Activée' : 'Désactivée'} hue={clauseActive ? OK_STAGE_HUE : SLATE_STAGE_HUE} isDark={isDark} dot={false} />}
            accent={accent}
            ink={ink}
            isDark={isDark}
          />
          {clauseActive && client.dureeProtection && (
            <StageField icon={Clock} label="Durée de protection" value={`${client.dureeProtection} mois`} accent={accent} ink={ink} isDark={isDark} />
          )}
        </StageSection>
        {clauseActive && (
          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Si le bailleur trouve un locataire par lui-même après expiration, l'agence n'a pas droit à commission.</p>
        )}

        <StageSection icon={DollarSign} title="Rémunération de l'agence" accent={accent} ink={ink} isDark={isDark} delay={0.2}>
          {client.typeRemuneration && <StageField icon={Tag} label="Type de rémunération" value={client.typeRemuneration} accent={accent} ink={ink} isDark={isDark} />}
          {client.montantRemuneration && (
            <StageField icon={CreditCard} label="Montant / Pourcentage" value={client.remunerationIsPercentage ? `${client.montantRemuneration}%` : `${client.montantRemuneration.toLocaleString()} ${client.devise || 'MAD'}`} accent={accent} ink={ink} isDark={isDark} />
          )}
          {client.conditionPaiement && <StageField icon={Award} label="Condition de paiement" value={client.conditionPaiement} accent={accent} ink={ink} isDark={isDark} />}
          {c.fraisMiseEnLocation && (
            <StageField icon={CreditCard} label="Frais de mise en location" value={`${c.fraisMiseEnLocation.toLocaleString()} ${client.devise || 'MAD'}`} accent={accent} ink={ink} isDark={isDark} />
          )}
          {c.fraisEtatDesLieux && (
            <StageField icon={CreditCard} label="Frais d'état des lieux" value={`${c.fraisEtatDesLieux.toLocaleString()} ${client.devise || 'MAD'}`} accent={accent} ink={ink} isDark={isDark} />
          )}
          {c.fraisRenouvellementBail && (
            <StageField icon={CreditCard} label="Frais de renouvellement de bail" value={`${c.fraisRenouvellementBail.toLocaleString()} ${client.devise || 'MAD'}`} accent={accent} ink={ink} isDark={isDark} />
          )}
        </StageSection>

        {client.mandatPdfUrl && (
          <StageDocButton
            title="Mandat signé"
            name={client.mandatPdfName || 'Mandat signé (PDF)'}
            onOpen={() => openViewer(client.mandatPdfUrl!, 'Mandat signé')}
            accent={accent}
            ink={ink}
            isDark={isDark}
          />
        )}
      </div>
    );
  };

  // ─── TAB 8: DOCUMENTS ───
  const renderDocuments = () => {
    const docs = [
      { label: "Pièce d'identité du bailleur", required: true, url: client.docIdentiteUrl, name: client.docIdentiteName },
      { label: 'Titre de propriété', required: true, url: client.docDomicileUrl, name: client.docDomicileName },
      { label: 'Diagnostic technique (DPE)', required: true, url: client.docDiagnosticUrl, name: client.docDiagnosticName },
      { label: 'Règlement de copropriété', required: false, url: client.docRevenusUrl, name: client.docRevenusName },
      { label: "Attestation d'assurance propriétaire non-occupant", required: false, url: client.docAssuranceUrl, name: client.docAssuranceName },
      { label: 'État des lieux (entrant)', required: false, url: client.docEtatDesLieuxUrl, name: client.docEtatDesLieuxName },
      { label: 'Autre document', required: false, url: client.docFinancementUrl, name: client.docFinancementName },
    ];
    const mandatUploaded = !!client.mandatPdfUrl;

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
                  <button type="button" onClick={() => openViewer(doc.url!, doc.label)} className={`text-xs px-2.5 py-1 rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] border border-[#905D5D]/20' : 'bg-accent/10 text-accent border border-accent/20'} ${isGerant ? 'hover:bg-[#905D5D]/20' : 'hover:bg-accent/20'} transition-all flex items-center gap-1`}>
                    <Eye size={12} /> Voir
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-border/50 bg-background/50 p-4 space-y-3">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Fichier du mandat signé</p>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50">
            <FileText size={16} className={mandatUploaded ? 'text-emerald-500' : 'text-text-secondary'} />
            <span className="text-sm text-text flex-1">Mandat signé (PDF)</span>
            {mandatUploaded ? (
              <>
                <span className="text-[10px] font-medium text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded">Uploadé</span>
                <button type="button" onClick={() => client.mandatPdfUrl && openViewer(client.mandatPdfUrl, 'Mandat signé')} className={`text-xs px-3 py-1.5 rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] border border-[#905D5D]/20' : 'bg-accent/10 text-accent border border-accent/20'} ${isGerant ? 'hover:bg-[#905D5D]/20' : 'hover:bg-accent/20'} transition-all flex items-center gap-1.5`}>
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

  const renderTransactions = () => (
    <ClientTransactionsTab clientId={client.id} clientName={client.name} clientType={client.type} isGerant={isGerant} />
  );

  const renderContrats = () => {
    if (!canReadContracts) return null;
    return (
      <ClientContractsTab clientId={client.id} clientName={client.name} isGerant={isGerant} />
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 1: return renderInfos();
      case 2: return renderCaracteristiques();
      case 3: return renderLoyerCharges();
      case 4: return renderProximites();
      case 5: return renderPrestations();
      case 6: return renderSituation();
      case 7: return renderMandat();
      case 8: return renderDocuments();
      case 9: return renderTransactions();
      case 10: return renderContrats();
      case 11: return <NotesActiviteTab client={client} highlightActivityId={highlightActivityId} />;
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

      {/* Document Viewer Modal */}
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
