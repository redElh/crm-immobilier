import { API_ORIGIN } from '../../../../utils/config'
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { InfoField } from '../../../ui/InfoField';
import { Button } from '../../../ui/Button';
import { Dialog } from '../../../ui/Dialog';
import { useToast } from '../../../ui/Toast';
import { ClientTransactionsTab } from '../ClientTransactionsTab';
import { NotesActiviteTab } from './NotesActiviteTab';
import { ClientContractsTab } from '../ClientContractsTab';
import { ClientTabsShell, StageField, StageSection, StageTags, HeaderPills, StageEmpty, ProximitesGrid, PrestationsGrid, StagePill, StageDocButton, StageLinkCard, ScoreRing, getScoreHue, scoreLabel, getMandatStatusHue, OK_STAGE_HUE, SLATE_STAGE_HUE, useDetailAccent, stagePillStyle } from './ClientDetailStage';
import { Client } from '../../../../types/client';
import {
  Home, MapPin, Maximize2, Grid, Clock, User, Briefcase, CheckCircle,
  AlertCircle, Calendar, Eye, Sun, Tag, Star, Layers, Compass,
  DollarSign, CreditCard, FileText, Plus, Sliders,
  TrendingUp, Shield, X, RefreshCw, Mail, ChevronDown, ChevronUp,
  BarChart2, Filter, Droplet, CheckSquare, Square, Zap, Info
} from 'react-feather';
import { api } from '../../../../services/api';
import { useMyPermissions, permissionAllowed } from '../../../../hooks/useMyPermissions';

interface CroisementMatch {
  id: string;
  propertyId: string;
  produit: string;
  prix: number;
  surface: number;
  score: number;
  pieces?: number;
  chambres?: number;
  sallesDeBain?: number;
  city?: string;
  district?: string;
  propertyType?: string;
  images?: string[];
  description?: string;
  features?: string[];
  details?: Record<string, number>;
}

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
  { id: 3, label: 'Proximités', slug: 'proximites' },
  { id: 4, label: 'Prestations', slug: 'prestations' },
  { id: 5, label: 'Solvabilité & Notes', slug: 'solvabilite' },
  { id: 6, label: 'Mandat', slug: 'mandat' },
  { id: 7, label: 'Croisements', slug: 'croisements' },
  { id: 8, label: 'Documents', slug: 'documents' },
  { id: 9, label: 'Transactions', slug: 'transactions' },
  { id: 10, label: 'Contrats', slug: 'contrats' },
  { id: 11, label: 'Notes & Activité', slug: 'notes_activite' },
];

export const LocataireDetailTabs = ({ client: initialClient, adminId, agentId, highlightActivityId, isGerant = false }: { client: Client; adminId?: string; agentId?: string; highlightActivityId?: number; isGerant?: boolean }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
  const [bienRecherche, setBienRecherche] = useState<any>(null);
  const [selectedProposals, setSelectedProposals] = useState<string[]>([]);
  const [matches, setMatches] = useState<CroisementMatch[]>([]);
  const [loadingCroisement, setLoadingCroisement] = useState(false);
  const [croisementError, setCroisementError] = useState<string | null>(null);
  const [croisementScoreFilter, setCroisementScoreFilter] = useState(0);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'score' | 'price' | 'surface'>('score');
  const [proposalModal, setProposalModal] = useState<{ open: boolean; match: CroisementMatch | null }>({ open: false, match: null });
  const [proposalEmail, setProposalEmail] = useState('');
  const [proposalMessage, setProposalMessage] = useState('');
  const [proposalSending, setProposalSending] = useState(false);

  /* Staged theme accents for the first tab (Critères). */
  const { isDark, accent, ink } = useDetailAccent(client.type, isGerant);

  useEffect(() => {
    if (client.bienRechercheId) {
      api.get<any>(`/properties/${client.bienRechercheId}`).then((p) => {
        if (p) setBienRecherche(p);
      }).catch(() => {});
    }
  }, [client.bienRechercheId]);

  const fetchCroisements = async () => {
    setLoadingCroisement(true);
    setCroisementError(null);
    try {
      const { fetchClientCroisements } = await import("../../../../services/clientService");
      const data = await fetchClientCroisements(client.id);
      const mapped: CroisementMatch[] = data.map((m: any) => ({
        id: m.propertyId,
        propertyId: m.propertyId,
        produit: m.title || m.reference || "Bien #" + m.propertyId,
        prix: Number(m.price) || 0,
        surface: Number(m.surface) || 0,
        score: m.score || 0,
        pieces: Number(m.rooms) || undefined,
        chambres: Number(m.bedrooms) || undefined,
        sallesDeBain: Number(m.bathrooms) || undefined,
        city: m.city || undefined,
        district: m.district || undefined,
        propertyType: m.propertyType || undefined,
        images: Array.isArray(m.images) ? m.images : [],
        description: m.description || undefined,
        features: Array.isArray(m.features) ? m.features : [],
        details: m.details,
      }));
      setMatches(mapped);
    } catch (err: any) {
      setCroisementError(err?.message || "Erreur lors du chargement des croisements");
      setMatches([]);
    } finally {
      setLoadingCroisement(false);
    }
  };

  useEffect(() => {
    if (activeTab === 7 && matches.length === 0 && !loadingCroisement && !croisementError) {
      fetchCroisements();
    }
  }, [activeTab]);

  const updateClient = (updates: Partial<Client>) => {
    setClientState(prev => ({ ...prev, ...updates }));
  };

  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
      <AlertCircle size={32} className="mb-3 opacity-40" />
      <p className="text-sm">Aucune information renseignée pour cette section</p>
    </div>
  );

  const renderCriteres = () => {
    const hasData = client.propertyType || client.secteur || client.area || client.localisation || client.minSurface ||
      client.prixMin || client.rooms || client.pieces || client.chambres ||
      client.etage !== undefined || client.categorie || client.currentSituation || client.moveInDate ||
      client.latitude || client.longitude || (client as any).adresseComplete || (client as any).complementAdresse || (client as any).codePostalVille || (client as any).pays;

    if (!hasData) return <StageEmpty isDark={isDark} />;

    const showGeo = ((client.latitude !== 0 && client.latitude !== undefined) || (client.longitude !== 0 && client.longitude !== undefined));

    return (
      <div className="space-y-5">
        <HeaderPills
          statutMetier={client.statutMetier}
          classification={client.classification}
          isDark={isDark}
          extra={client.statutOccupation ? (
            <span className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="font-semibold">Statut de l'occupation :</span>
              <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={stagePillStyle(accent, isDark)}>
                {client.statutOccupation}
              </span>
            </span>
          ) : undefined}
        />

        <StageSection icon={Home} title="Recherche" accent={accent} ink={ink} isDark={isDark} delay={0.05}>
          {client.localisation && <StageField icon={MapPin} label="Localisation" value={client.localisation} accent={accent} ink={ink} isDark={isDark} />}
          {client.categorie && <StageField icon={Tag} label="Catégorie" value={client.categorie} accent={accent} ink={ink} isDark={isDark} />}
          {client.propertyType && <StageField icon={Home} label="Type de bien recherché" value={client.propertyType} accent={accent} ink={ink} isDark={isDark} />}
          <StageField icon={MapPin} label="Secteur géographique" value={client.secteur || client.area || 'Non spécifié'} accent={accent} ink={ink} isDark={isDark} />
          {(client as any).adresseComplete && <StageField icon={MapPin} label="Adresse complète" value={(client as any).adresseComplete} accent={accent} ink={ink} isDark={isDark} />}
          {(client as any).complementAdresse && <StageField icon={MapPin} label="Complément d'adresse" value={(client as any).complementAdresse} accent={accent} ink={ink} isDark={isDark} />}
          {(client as any).codePostalVille && <StageField icon={MapPin} label="Code postal / Ville" value={(client as any).codePostalVille} accent={accent} ink={ink} isDark={isDark} />}
          {(client as any).pays && <StageField icon={MapPin} label="Pays" value={(client as any).pays} accent={accent} ink={ink} isDark={isDark} />}
          {(client.minSurface || client.surfaceMax) && (
            <StageField icon={Maximize2} label="Surface" value={`${client.minSurface || '?'} ~ ${client.surfaceMax || '?'} m²`} accent={accent} ink={ink} isDark={isDark} />
          )}
          {client.prixMin !== undefined && (
            <StageField icon={DollarSign} label="Loyer max" value={`${client.prixMin.toLocaleString()} ${client.devise || 'MAD'}`} accent={accent} ink={ink} isDark={isDark} />
          )}
          {(client.pieces || client.chambres) && (
            <StageField icon={Grid} label="Pièces / Chambres" value={`${client.pieces || '?'} pièces / ${client.chambres || '?'} chambres`} accent={accent} ink={ink} isDark={isDark} />
          )}
          {client.rooms && !client.pieces && (
            <StageField icon={Grid} label="Nombre de pièces" value={client.rooms} accent={accent} ink={ink} isDark={isDark} />
          )}
          {client.etage !== undefined && (
            <StageField icon={Layers} label="Étage" value={`${client.etageOperator === 'ge' ? '≥ ' : client.etageOperator === 'le' ? '≤ ' : '= '}${client.etage}`} accent={accent} ink={ink} isDark={isDark} />
          )}
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
                ((client.latitude !== 0 && client.latitude) || (client.longitude !== 0 && client.longitude)) ? (
                  <a
                    href={`https://www.google.com/maps?q=${client.latitude},${client.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-[11px] font-bold transition-opacity hover:opacity-80"
                    style={{ color: ink }}
                  >
                    Maps ↗
                  </a>
                ) : undefined
              }
            />
          </StageSection>
        )}

        {(client.currentSituation || client.moveInDate) && (
          <StageSection icon={User} title="Situation" accent={accent} ink={ink} isDark={isDark} delay={0.15}>
            {client.currentSituation && <StageField icon={User} label="Situation actuelle" value={client.currentSituation} accent={accent} ink={ink} isDark={isDark} />}
            {client.moveInDate && (
              <StageField icon={Calendar} label="Date souhaitée d'emménagement" value={new Date(client.moveInDate).toLocaleDateString('fr-FR')} accent={accent} ink={ink} isDark={isDark} />
            )}
          </StageSection>
        )}
      </div>
    );
  };

  const renderCaracteristiques = () => {
    const hasData = client.vue || client.exposition || client.etat || client.standing ||
      client.disponibilite || client.attributPrincipal || client.attributsPersonnalises?.length ||
      client.criteres?.length;

    if (!hasData) return <StageEmpty isDark={isDark} />;

    const showQual = client.vue || client.exposition || client.etat || client.standing || client.disponibilite;

    return (
      <div className="space-y-5">
        {showQual ? (
          <StageSection icon={Eye} title="Atouts du bien" accent={accent} ink={ink} isDark={isDark} delay={0.05}>
            {client.vue && <StageField icon={Eye} label="Vue" value={client.vue} accent={accent} ink={ink} isDark={isDark} />}
            {client.exposition && <StageField icon={Sun} label="Exposition" value={client.exposition} accent={accent} ink={ink} isDark={isDark} />}
            {client.etat && <StageField icon={Home} label="État" value={client.etat} accent={accent} ink={ink} isDark={isDark} />}
            {client.standing && <StageField icon={Star} label="Standing" value={client.standing} accent={accent} ink={ink} isDark={isDark} />}
            {client.disponibilite && <StageField icon={Clock} label="Disponibilité" value={client.disponibilite} accent={accent} ink={ink} isDark={isDark} />}
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

  const renderProximites = () => {
    const p = client.proximites;
    return <ProximitesGrid data={p} accent={accent} ink={ink} isDark={isDark} />;
  };

  const renderPrestations = () => {
    const p = client.prestations;
    return <PrestationsGrid data={p} accent={accent} ink={ink} isDark={isDark} />;
  };

  const renderSolvabilite = () => {
    const hasData = client.employmentStatus || client.contribution || client.guarantor || client.anciennete !== undefined || client.chiffreAffaires !== undefined || client.pensionMensuelle !== undefined || client.currentSituation || client.moveInDate || client.notes;

    if (!hasData) return <StageEmpty isDark={isDark} />;

    const devise = client.devise || 'MAD';
    const emp = client.employmentStatus || '';
    const garantHue = client.guarantor ? OK_STAGE_HUE : SLATE_STAGE_HUE;

    return (
      <div className="space-y-5">
        <StageSection icon={Briefcase} title="Emploi & Revenus" accent={accent} ink={ink} isDark={isDark} delay={0.05}>
          <StageField icon={Briefcase} label="Situation professionnelle" value={client.employmentStatus || 'Non spécifié'} accent={accent} ink={ink} isDark={isDark} />
          {client.contribution !== undefined && (
            <StageField icon={TrendingUp} label="Revenus mensuels nets" value={`${client.contribution.toLocaleString('fr-FR')} ${devise}`} accent={accent} ink={ink} isDark={isDark} />
          )}
        </StageSection>

        {emp === 'CDI' && (
          <StageSection icon={Briefcase} title="Informations employeur" accent={accent} ink={ink} isDark={isDark} delay={0.1}>
            {client.anciennete !== undefined && (
              <StageField icon={Clock} label="Ancienneté" value={`${client.anciennete} an${client.anciennete > 1 ? 's' : ''}`} accent={accent} ink={ink} isDark={isDark} />
            )}
            <StageField
              icon={CheckCircle}
              label="Période d'essai"
              value={<StagePill label={client.periodeEssai ? 'Oui' : 'Non'} hue={client.periodeEssai ? SLATE_STAGE_HUE : OK_STAGE_HUE} isDark={isDark} dot={false} />}
              accent={accent}
              ink={ink}
              isDark={isDark}
            />
            {client.nomEmployeur && (
              <StageField icon={Briefcase} label="Nom de l'employeur" value={client.nomEmployeur} accent={accent} ink={ink} isDark={isDark} />
            )}
          </StageSection>
        )}

        {emp === 'CDD' && (
          <StageSection icon={Briefcase} title="Informations employeur" accent={accent} ink={ink} isDark={isDark} delay={0.1}>
            {client.dateFinContrat && (
              <StageField icon={Calendar} label="Date de fin du contrat" value={new Date(client.dateFinContrat).toLocaleDateString('fr-FR')} accent={accent} ink={ink} isDark={isDark} />
            )}
            {client.anciennete !== undefined && (
              <StageField icon={Clock} label="Ancienneté" value={`${client.anciennete} an${client.anciennete > 1 ? 's' : ''}`} accent={accent} ink={ink} isDark={isDark} />
            )}
            {client.nomEmployeur && (
              <StageField icon={Briefcase} label="Nom de l'employeur" value={client.nomEmployeur} accent={accent} ink={ink} isDark={isDark} />
            )}
          </StageSection>
        )}

        {emp === 'Independant' && (
          <StageSection icon={TrendingUp} title="Informations indépendant" accent={accent} ink={ink} isDark={isDark} delay={0.1}>
            {client.chiffreAffaires !== undefined && (
              <StageField icon={TrendingUp} label="Chiffre d'affaires annuel" value={`${client.chiffreAffaires.toLocaleString('fr-FR')} ${devise}`} accent={accent} ink={ink} isDark={isDark} />
            )}
          </StageSection>
        )}
        {emp === 'Independant' && (client.dernierBilanUrl || client.dernierAvisImpotUrl) && (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {client.dernierBilanUrl && (
              <StageDocButton
                title="Dernier bilan / Kbis"
                name={client.dernierBilanName || 'Document partagé'}
                onOpen={() => openViewer(client.dernierBilanUrl!, client.dernierBilanName || 'Dernier bilan / Kbis')}
                accent={accent}
                ink={ink}
                isDark={isDark}
              />
            )}
            {client.dernierAvisImpotUrl && (
              <StageDocButton
                title="Dernier avis d'imposition"
                name={client.dernierAvisImpotName || 'Document partagé'}
                onOpen={() => openViewer(client.dernierAvisImpotUrl!, client.dernierAvisImpotName || "Dernier avis d'imposition")}
                accent={accent}
                ink={ink}
                isDark={isDark}
              />
            )}
          </div>
        )}

        {emp === 'Retraite' && (
          <StageSection icon={Shield} title="Informations retraite" accent={accent} ink={ink} isDark={isDark} delay={0.1}>
            {client.pensionMensuelle !== undefined && (
              <StageField icon={CreditCard} label="Pension mensuelle nette" value={`${client.pensionMensuelle.toLocaleString('fr-FR')} ${devise}`} accent={accent} ink={ink} isDark={isDark} />
            )}
            {client.dateRetraite && (
              <StageField icon={Calendar} label="Date de retraite" value={new Date(client.dateRetraite).toLocaleDateString('fr-FR')} accent={accent} ink={ink} isDark={isDark} />
            )}
            {client.organismeRetraite && (
              <StageField icon={Shield} label="Organisme de retraite" value={client.organismeRetraite} accent={accent} ink={ink} isDark={isDark} />
            )}
          </StageSection>
        )}

        {(emp === 'Etudiant' || emp === 'Sans emploi') && (
          <StageSection
            icon={User}
            title={emp === 'Sans emploi' ? 'Garant (obligatoire)' : 'Garant (optionnel)'}
            accent={accent}
            ink={ink}
            isDark={isDark}
            delay={0.1}
          >
            <StageField
              icon={CheckCircle}
              label="Garant"
              value={<StagePill label={client.guarantor ? 'Oui' : 'Non'} hue={garantHue} isDark={isDark} dot={false} />}
              accent={accent}
              ink={ink}
              isDark={isDark}
            />
            {client.guarantor && (
              <StageField icon={User} label="Nom du garant" value={client.guarantorName || 'Non renseigné'} accent={accent} ink={ink} isDark={isDark} />
            )}
            {client.guarantor && client.guarantorRevenus !== undefined && (
              <StageField icon={TrendingUp} label="Revenus du garant" value={`${client.guarantorRevenus.toLocaleString('fr-FR')} ${devise}`} accent={accent} ink={ink} isDark={isDark} />
            )}
          </StageSection>
        )}
        {(emp === 'Etudiant' || emp === 'Sans emploi') && emp === 'Sans emploi' && client.justificatifSituationUrl && (
          <StageDocButton
            title="Justificatif de situation"
            name={client.justificatifSituationName || 'Document partagé'}
            onOpen={() => openViewer(client.justificatifSituationUrl!, client.justificatifSituationName || 'Justificatif de situation')}
            accent={accent}
            ink={ink}
            isDark={isDark}
          />
        )}

        {!emp && (
          <StageSection icon={User} title="Garant" accent={accent} ink={ink} isDark={isDark} delay={0.1}>
            <StageField
              icon={CheckCircle}
              label="Garant"
              value={<StagePill label={client.guarantor ? 'Oui' : 'Non'} hue={garantHue} isDark={isDark} dot={false} />}
              accent={accent}
              ink={ink}
              isDark={isDark}
            />
            {client.guarantor && (
              <StageField icon={User} label="Nom du garant" value={client.guarantorName || 'Non renseigné'} accent={accent} ink={ink} isDark={isDark} />
            )}
            {client.guarantor && client.guarantorRevenus !== undefined && (
              <StageField icon={TrendingUp} label="Revenus du garant" value={`${client.guarantorRevenus.toLocaleString('fr-FR')} ${devise}`} accent={accent} ink={ink} isDark={isDark} />
            )}
          </StageSection>
        )}

        {(client.currentSituation || client.moveInDate || client.notes) && (
          <StageSection icon={Home} title="Situation & Notes" accent={accent} ink={ink} isDark={isDark} delay={0.15}>
            {client.currentSituation && <StageField icon={Home} label="Situation actuelle" value={client.currentSituation} accent={accent} ink={ink} isDark={isDark} />}
            {client.moveInDate && (
              <StageField icon={Calendar} label="Date souhaitée d'emménagement" value={new Date(client.moveInDate).toLocaleDateString('fr-FR')} accent={accent} ink={ink} isDark={isDark} />
            )}
            {client.notes && (
              <StageField icon={FileText} label="Notes complémentaires" value={client.notes} accent={accent} ink={ink} isDark={isDark} />
            )}
          </StageSection>
        )}
      </div>
    );
  };

  const renderMandat = () => {
    if (!client.numeroMandat) return <StageEmpty isDark={isDark} />;

    return (
      <div className="space-y-5">
        <StageSection icon={Layers} title="Mandat de recherche de location" accent={accent} ink={ink} isDark={isDark} delay={0.05}>
          <StageField icon={Tag} label="Numéro de mandat" value={client.numeroMandat} accent={accent} ink={ink} isDark={isDark} />
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
          {client.typeMandat && <StageField icon={Compass} label="Type de mandat" value={client.typeMandat} accent={accent} ink={ink} isDark={isDark} />}
          {client.dateSignature && <StageField icon={Calendar} label="Date signature" value={new Date(client.dateSignature).toLocaleDateString('fr-FR')} accent={accent} ink={ink} isDark={isDark} />}
          {client.dateDebut && <StageField icon={Calendar} label="Date début" value={new Date(client.dateDebut).toLocaleDateString('fr-FR')} accent={accent} ink={ink} isDark={isDark} />}
          {client.dateExpiration && <StageField icon={Calendar} label="Date expiration" value={new Date(client.dateExpiration).toLocaleDateString('fr-FR')} accent={accent} ink={ink} isDark={isDark} />}
          {client.agentDesigne && <StageField icon={User} label="Agent désigné" value={client.agentDesigne} accent={accent} ink={ink} isDark={isDark} />}
          {client.conjoint && <StageField icon={User} label="Conjoint" value={client.conjoint} accent={accent} ink={ink} isDark={isDark} />}
          {client.societe && <StageField icon={Briefcase} label="Société" value={client.societe} accent={accent} ink={ink} isDark={isDark} />}
          {client.typeRemuneration && <StageField icon={DollarSign} label="Type rémunération" value={client.typeRemuneration} accent={accent} ink={ink} isDark={isDark} />}
          {client.montantRemuneration && (
            <StageField icon={DollarSign} label="Montant" value={(client as any).remunerationIsPercentage ? `${client.montantRemuneration}%` : `${client.montantRemuneration.toLocaleString()} ${client.devise || 'MAD'}`} accent={accent} ink={ink} isDark={isDark} />
          )}
          {client.conditionPaiement && <StageField icon={DollarSign} label="Condition de paiement" value={client.conditionPaiement} accent={accent} ink={ink} isDark={isDark} />}
          {client.dureeProtection && <StageField icon={Clock} label="Durée de protection" value={`${client.dureeProtection} mois`} accent={accent} ink={ink} isDark={isDark} />}
        </StageSection>

        {bienRecherche && (
          <StageLinkCard
            icon={Layers}
            eyebrow="Bien recherché"
            title={`${bienRecherche.title || bienRecherche.reference || `Bien #${bienRecherche.id}`}${bienRecherche.city ? ` - ${bienRecherche.city}` : ''}`}
            onOpen={basePath ? () => navigate(`${basePath}/properties/${client.bienRechercheId}`) : undefined}
            accent={accent}
            ink={ink}
            isDark={isDark}
            delay={0.1}
          />
        )}
      </div>
    );
  };

  const [rawViewerUrl, setRawViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState('');

  const viewerUrl = rawViewerUrl ? (rawViewerUrl.startsWith('http') ? rawViewerUrl : `${API_ORIGIN}${rawViewerUrl}`) : null;

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

  const renderDocuments = () => {
    const docs = [
      { label: "Pièce d'identité (passeport ou CIN)", required: true, url: client.docIdentiteUrl, name: client.docIdentiteName },
      { label: 'Justificatif de domicile actuel', required: true, url: client.docDomicileUrl, name: client.docDomicileName },
      { label: '3 dernières fiches de paie', required: true, url: client.docRevenusUrl, name: client.docRevenusName },
      { label: 'Contrat de travail', required: true, url: client.docFinancementUrl, name: client.docFinancementName },
      { label: "Relevé d'identité bancaire (RIB)", required: true, url: client.docBancaireUrl, name: client.docBancaireName },
      { label: "Dossier garant (pièce d'identité + justificatif de revenus)", required: false, url: (client as any).docGarantUrl, name: (client as any).docGarantName },
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
                  <button type="button" onClick={() => openViewer(doc.url!, doc.label)} className={`text-xs px-2.5 py-1 rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] border border-[#905D5D]/20 hover:bg-[#905D5D]/20' : 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20'} transition-all flex items-center gap-1`}>
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
                <button type="button" onClick={() => client.mandatPdfUrl && openViewer(client.mandatPdfUrl, 'Mandat signé')} className={`text-xs px-3 py-1.5 rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] border border-[#905D5D]/20 hover:bg-[#905D5D]/20' : 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20'} transition-all flex items-center gap-1.5`}>
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

  const renderCroisements = () => {
    const toggleProposal = (id: string) => {
      setSelectedProposals(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    const toggleExpand = (id: string) => {
      setExpandedCards(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    };

    const openProposal = (match: CroisementMatch) => {
      if (match.score < 50) {
        toast('info', `Le score de ${match.score}% est en dessous de 50%. Il est recommandé d'avoir un score supérieur à 50% pour proposer ce bien à ${client.name}.`);
        return;
      }
      setProposalEmail(client.email || '');

      const d = match.details || {};
      const analysisLines: string[] = [];
      const pct = (v: number) => Math.round(v * 100);

      if (d.location !== undefined) analysisLines.push(`Localisation : ${pct(d.location)}% — ${pct(d.location) >= 80 ? 'correspondance excellente' : pct(d.location) >= 50 ? 'correspondance partielle' : 'correspondance faible'}`);
      if (d.budget !== undefined) analysisLines.push(`Budget : ${pct(d.budget)}% — ${match.prix > 0 ? match.prix.toLocaleString() + ' MAD' : 'Prix non renseigné'}${client.budget ? ' vs budget ' + Number(client.budget).toLocaleString() + ' MAD' : ''}`);
      if (d.surface !== undefined) analysisLines.push(`Surface : ${pct(d.surface)}% — ${match.surface > 0 ? match.surface + ' m²' : 'N/C'}${client.minSurface || client.surfaceMax ? ' vs critère ' + (client.minSurface || '?') + '-' + (client.surfaceMax || '?') + ' m²' : ''}`);
      if (d.chambres !== undefined) analysisLines.push(`Chambres : ${pct(d.chambres)}% — ${match.chambres || 0} chambre(s)${client.chambres ? ' vs ' + client.chambres + ' demandée(s)' : ''}`);
      if (d.criteres !== undefined) analysisLines.push(`Critères requis : ${pct(d.criteres)}% de compatibilité`);
      if (d.prestations !== undefined) analysisLines.push(`Prestations : ${pct(d.prestations)}% de vos équipements correspondent`);
      if (d.proximites !== undefined) analysisLines.push(`Proximités : ${pct(d.proximites)}% de vos critères de proximité respectés`);
      if (d.attributs !== undefined) analysisLines.push(`Attributs : ${pct(d.attributs)}% de vos souhaits spécifiques trouvés`);
      if (d.vue !== undefined) analysisLines.push(`Vue : ${pct(d.vue)}% — ${pct(d.vue) >= 80 ? 'correspondance exacte' : 'non confirmée'}`);
      if (d.exposition !== undefined) analysisLines.push(`Exposition : ${pct(d.exposition)}% — ${pct(d.exposition) >= 80 ? 'correspondance exacte' : 'non confirmée'}`);
      if (d.etat !== undefined) analysisLines.push(`État : ${pct(d.etat)}% — ${pct(d.etat) >= 80 ? 'correspond à vos attentes' : 'diffère de vos attentes'}`);

      const analysisBlock = analysisLines.length > 0
        ? `\n📊 DÉTAIL DE L'ANALYSE DE COMPATIBILITÉ :\n${'─'.repeat(40)}\n${analysisLines.map(l => '  • ' + l).join('\n')}\n${'─'.repeat(40)}\n`
        : '';

      setProposalMessage(
        `Bonjour ${client.name},\n\n` +
        `Suite à l'analyse de vos critères de recherche, nous avons identifié un bien qui correspond à vos attentes avec un score de compatibilité de ${match.score}%.\n\n` +
        `🏠 BIEN SÉLECTIONNÉ :\n` +
        `  Référence : ${match.produit}\n` +
        `  Localisation : ${match.city || 'N/C'}${match.district ? ', ' + match.district : ''}\n` +
        `  Prix : ${match.prix > 0 ? match.prix.toLocaleString() + ' MAD' : 'Sur demande'}\n` +
        `  Surface : ${match.surface > 0 ? match.surface + ' m²' : 'N/C'}\n` +
        `${match.pieces ? '  Pièces : ' + match.pieces + '\n' : ''}` +
        `${match.chambres ? '  Chambres : ' + match.chambres + '\n' : ''}` +
        `${match.sallesDeBain ? '  Salles de bain : ' + match.sallesDeBain + '\n' : ''}` +
        `${match.description ? '\n  Description : ' + match.description.substring(0, 300) + (match.description.length > 300 ? '...' : '') + '\n' : ''}` +
        analysisBlock +
        `\nN'hésitez pas à me contacter pour plus d'informations ou pour organiser une visite sur place.\n\n` +
        `Cordialement,`
      );
      setProposalModal({ open: true, match });
    };

    const submitProposal = async () => {
      if (!proposalModal.match || !proposalEmail) return;
      setProposalSending(true);
      try {
        const { proposeProperty } = await import('../../../../services/clientService');
        await proposeProperty(client.id, {
          propertyId: proposalModal.match.propertyId,
          email: proposalEmail,
          subject: `Proposition de bien — ${proposalModal.match.produit}`,
          message: proposalMessage,
          score: proposalModal.match.score,
          details: proposalModal.match.details || undefined,
        });
        toast('success', `Email de proposition envoyé à ${proposalEmail} avec succès !`);
        setProposalModal({ open: false, match: null });
      } catch (err: any) {
        toast('error', err?.message || "Erreur lors de l'envoi de l'email");
      } finally {
        setProposalSending(false);
      }
    };

    const scoreHueOf = (score: number) => getScoreHue(score, isGerant);

    const criterionMeta: Record<string, { label: string; icon: any; weight: number }> = {
      location: { label: 'Localisation', icon: MapPin, weight: 20 },
      budget: { label: 'Budget', icon: DollarSign, weight: 15 },
      surface: { label: 'Surface', icon: Maximize2, weight: 12 },
      chambres: { label: 'Chambres', icon: Home, weight: 10 },
      criteres: { label: 'Critères', icon: CheckSquare, weight: 15 },
      prestations: { label: 'Prestations', icon: Star, weight: 10 },
      proximites: { label: 'Proximités', icon: Compass, weight: 7 },
      attributs: { label: 'Attributs', icon: Tag, weight: 4 },
      vue: { label: 'Vue', icon: Eye, weight: 3 },
      exposition: { label: 'Exposition', icon: Sun, weight: 2 },
      etat: { label: 'État', icon: Shield, weight: 2 },
      rooms: { label: 'Pièces', icon: Grid, weight: 0 },
      propertyType: { label: 'Type de bien', icon: Home, weight: 0 },
      standing: { label: 'Standing', icon: Layers, weight: 0 },
      floor: { label: 'Étage', icon: Layers, weight: 0 },
    };

    const buildCriteria = (details: Record<string, number> | undefined) => {
      if (!details) return [];
      const order = ['location', 'budget', 'surface', 'chambres', 'criteres', 'prestations', 'proximites', 'attributs', 'vue', 'exposition', 'etat', 'rooms', 'propertyType', 'standing', 'floor'];
      return order.filter(k => details[k] !== undefined && details[k] !== null).map(k => ({
        key: k,
        ...criterionMeta[k] || { label: k, icon: CheckCircle, weight: 0 },
        ratio: details[k],
      }));
    };

    if (loadingCroisement) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-4 h-14 w-14">
            <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: `${accent.a}30` }} />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: accent.a }} />
            <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: `${accent.a}99`, animationDirection: 'reverse', animationDuration: '1.5s' }} />
            <BarChart2 size={16} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: ink }} />
          </div>
          <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Analyse en cours...</p>
          <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Comparaison des critères avec la base de données</p>
        </div>
      );
    }

    if (croisementError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div
            className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border backdrop-blur-sm"
            style={isDark
              ? { background: 'rgba(248,113,113,0.10)', borderColor: 'rgba(248,113,113,0.30)', color: '#F87171' }
              : { background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.30)', color: '#DC2626' }}
          >
            <AlertCircle size={22} />
          </div>
          <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{croisementError}</p>
          <button
            type="button"
            onClick={fetchCroisements}
            className={`mt-3 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white text-slate-600 shadow-sm hover:bg-white hover:text-slate-900'}`}
          >
            <RefreshCw size={14} /> Réessayer
          </button>
        </div>
      );
    }

    const filtered = matches.filter(m => m.score >= croisementScoreFilter);
    const sorted = [...filtered].sort((a, b) => sortBy === 'price' ? a.prix - b.prix : sortBy === 'surface' ? b.surface - a.surface : b.score - a.score);
    const avgScore = filtered.length > 0 ? Math.round(filtered.reduce((s, m) => s + m.score, 0) / filtered.length) : 0;
    const excellentCount = filtered.filter(m => m.score >= 80).length;
    const avgHue = scoreHueOf(avgScore);

    return (
      <div className="space-y-5">
        {/* Hero Header — staged */}
        <div
          className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur-sm sm:p-5 ${isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70 shadow-sm'}`}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(80% 120% at 100% 0%, ${accent.a}1F, transparent 60%)` }}
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border"
                style={isDark
                  ? { background: `${accent.a}14`, borderColor: `${accent.a}30`, color: accent.a }
                  : { background: `${accent.a}12`, borderColor: `${accent.a}30`, color: ink }}
              >
                <BarChart2 size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className={`text-sm font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Croisements</h3>
                <p className={`mt-0.5 truncate text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{client.name}</span>
                  <span className="mx-1.5 opacity-40">—</span>
                  {filtered.length} bien{filtered.length > 1 ? 's' : ''} correspondant{filtered.length > 1 ? 's' : ''}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-extrabold tabular-nums backdrop-blur-md ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200/80 bg-white/70'}`}
                    style={{ color: isDark ? avgHue.a : avgHue.b }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: avgHue.line, boxShadow: `0 0 6px ${avgHue.glow}` }} />
                    {avgScore}%
                    <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>score moyen</span>
                  </span>
                  {excellentCount > 0 && (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold backdrop-blur-md"
                      style={isDark
                        ? { background: 'rgba(52,211,153,0.12)', color: '#6EE7B7', border: '1px solid rgba(52,211,153,0.30)' }
                        : { background: 'rgba(5,150,105,0.08)', color: '#047857', border: '1px solid rgba(5,150,105,0.28)' }}
                    >
                      <CheckCircle size={12} />
                      {excellentCount}
                      <span className="text-[10px] font-semibold opacity-70">excellent{excellentCount > 1 ? 's' : ''}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={fetchCroisements}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white text-slate-600 shadow-sm hover:bg-white hover:text-slate-900'}`}
              >
                <RefreshCw size={14} /> Relancer
              </button>
              {selectedProposals.length > 0 && (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-3.5 py-2 text-xs font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                  style={isGerant
                    ? { backgroundImage: 'linear-gradient(145deg, #C9A0A0 0%, #905D5D 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 26px -10px rgba(144,93,93,0.6)' }
                    : isDark
                      ? { backgroundImage: 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 26px -8px rgba(124,92,255,0.65)' }
                      : { backgroundImage: 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 26px -10px rgba(13,148,136,0.6)' }}
                >
                  <Mail size={14} /> Envoyer ({selectedProposals.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Bar — staged segments */}
        <div className="flex flex-wrap items-center gap-2.5 px-0.5">
          <div className="mr-1 flex items-center gap-1.5">
            <Filter size={12} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
            <span className={`text-[10px] font-bold uppercase tracking-[0.14em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Filtres</span>
          </div>
          <div className={`flex items-center gap-1 rounded-xl border p-1 backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70 shadow-sm'}`}>
            {[0, 50, 60, 70, 80].map(val => {
              const on = croisementScoreFilter === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCroisementScoreFilter(val)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-200 ${on ? 'text-white shadow-sm' : isDark ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'text-slate-500 hover:bg-slate-900/[0.04] hover:text-slate-900'}`}
                  style={on ? (isGerant
                    ? { background: 'linear-gradient(145deg, #C9A0A0, #905D5D)' }
                    : isDark
                      ? { background: 'linear-gradient(145deg, #8B7CFF, #6C5ECF)' }
                      : { background: 'linear-gradient(145deg, #2DD4BF, #0D9488)' }) : undefined}
                >
                  {val === 0 ? 'Tous' : `${val}%+`}
                </button>
              );
            })}
          </div>
          <div className={`h-4 w-px ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
          <div className={`flex items-center gap-1 rounded-xl border p-1 backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70 shadow-sm'}`}>
            {([['score', 'Meilleur', TrendingUp], ['price', 'Prix', DollarSign], ['surface', 'Surface', Maximize2]] as const).map(([val, label, Icon]) => {
              const on = sortBy === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSortBy(val)}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-200 ${on ? 'text-white shadow-sm' : isDark ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'text-slate-500 hover:bg-slate-900/[0.04] hover:text-slate-900'}`}
                  style={on ? (isGerant
                    ? { background: 'linear-gradient(145deg, #C9A0A0, #905D5D)' }
                    : isDark
                      ? { background: 'linear-gradient(145deg, #8B7CFF, #6C5ECF)' }
                      : { background: 'linear-gradient(145deg, #2DD4BF, #0D9488)' }) : undefined}
                >
                  <Icon size={10} />{label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Property Cards */}
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border backdrop-blur-sm ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-500' : 'border-slate-200/70 bg-white/70 text-slate-400 shadow-sm'}`}
            >
              <Home size={22} />
            </div>
            <p className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Aucun bien trouvé</p>
            <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Essayez d'abaisser le score minimum</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((match) => {
              const scoreHue = scoreHueOf(match.score);
              const criteria = buildCriteria(match.details);
              const isExpanded = expandedCards.has(match.id);
              const hasImage = match.images && match.images.length > 0 && match.images[0];
              const location = [match.city, match.district].filter(Boolean).join(' · ');
              const typeLabel = match.propertyType || 'Bien';

              return (
                <div
                  key={match.id}
                  className={`group overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 ${isDark ? 'border-white/[0.07] bg-white/[0.03] hover:border-white/[0.14] hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)]' : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:shadow-[0_18px_44px_-20px_rgba(13,148,136,0.35)]'}`}
                >

                  {/* Top: Image + Info + Score Ring */}
                  <div className="flex gap-4 p-4">
                    {/* Image */}
                    <div className={`flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-slate-100/70'}`}>
                      {hasImage ? (
                        <img src={match.images![0]} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <Home size={20} className={isDark ? 'text-slate-600' : 'text-slate-300'} />
                          <span className={`text-[8px] font-bold uppercase ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{typeLabel}</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={`truncate text-[13px] font-extrabold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{match.produit}</h4>
                            <span
                              className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider"
                              style={isDark
                                ? { background: `${accent.a}1E`, color: accent.a, border: `1px solid ${accent.a}36` }
                                : { background: `${accent.a}14`, color: ink, border: `1px solid ${accent.a}36` }}
                            >
                              {typeLabel}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            {location && (
                              <span className={`inline-flex items-center gap-1 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                <MapPin size={10} className="shrink-0 opacity-60" />
                                {location}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Score ring */}
                        <div className="flex shrink-0 flex-col items-center gap-1">
                          <ScoreRing score={match.score} size={52} isGerant={isGerant} isDark={isDark} />
                          <span className="text-[8px] font-extrabold uppercase tracking-wider" style={{ color: isDark ? scoreHue.a : scoreHue.b }}>
                            {scoreLabel(match.score)}
                          </span>
                        </div>
                      </div>

                      {/* Property stats */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${isDark ? 'border-white/[0.07] bg-white/[0.04] text-slate-300' : 'border-slate-200/70 bg-white/70 text-slate-600'}`}>
                          <DollarSign size={9} className="opacity-60" />
                          {match.prix > 0 ? `${match.prix.toLocaleString()} MAD` : 'Prix NC'}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${isDark ? 'border-white/[0.07] bg-white/[0.04] text-slate-300' : 'border-slate-200/70 bg-white/70 text-slate-600'}`}>
                          <Maximize2 size={9} className="opacity-60" />
                          {match.surface > 0 ? `${match.surface} m²` : '—'}
                        </span>
                        {match.pieces ? (
                          <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${isDark ? 'border-white/[0.07] bg-white/[0.04] text-slate-300' : 'border-slate-200/70 bg-white/70 text-slate-600'}`}>
                            <Grid size={9} className="opacity-60" />
                            {match.pieces} p.
                          </span>
                        ) : null}
                        {match.chambres ? (
                          <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${isDark ? 'border-white/[0.07] bg-white/[0.04] text-slate-300' : 'border-slate-200/70 bg-white/70 text-slate-600'}`}>
                            <Home size={9} className="opacity-60" />
                            {match.chambres} ch.
                          </span>
                        ) : null}
                        {match.sallesDeBain ? (
                          <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${isDark ? 'border-white/[0.07] bg-white/[0.04] text-slate-300' : 'border-slate-200/70 bg-white/70 text-slate-600'}`}>
                            <Droplet size={9} className="opacity-60" />
                            {match.sallesDeBain} sdb
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Description snippet */}
                  {match.description && (
                    <div className="px-4 pb-3">
                      <p className={`line-clamp-2 text-[11px] leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{match.description}</p>
                    </div>
                  )}

                  {/* Features chips */}
                  {match.features && match.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 px-4 pb-3">
                      {match.features.slice(0, 6).map((f, i) => (
                        <span key={i} className={`rounded-md border px-2 py-0.5 text-[9px] font-semibold ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-400' : 'border-slate-200/70 bg-white/60 text-slate-500'}`}>{f}</span>
                      ))}
                      {match.features.length > 6 && (
                        <span
                          className="rounded-md border px-2 py-0.5 text-[9px] font-bold"
                          style={isDark
                            ? { background: `${accent.a}14`, color: accent.a, border: `1px solid ${accent.a}30` }
                            : { background: `${accent.a}12`, color: ink, border: `1px solid ${accent.a}30` }}
                        >
                          +{match.features.length - 6}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Score Breakdown */}
                  {criteria.length > 0 && (
                    <div className="px-4 pb-4">
                      {/* Score bar */}
                      <div className={`h-1.5 overflow-hidden rounded-full ${isDark ? 'bg-white/[0.07]' : 'bg-slate-900/[0.07]'}`}>
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${match.score}%`, background: `linear-gradient(90deg, ${scoreHue.b}, ${scoreHue.a})`, boxShadow: `0 0 10px ${scoreHue.glow}` }}
                        />
                      </div>

                      {/* Criteria grid */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {criteria.map(({ key, label, icon: CIcon, ratio }) => {
                          const pct = Math.round(ratio * 100);
                          const cHue = getScoreHue(pct, isGerant);
                          return (
                            <div key={key} className="flex items-center gap-1.5 py-0.5 text-[11px]">
                              <CIcon size={10} style={{ color: cHue.line }} />
                              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>{label}</span>
                              <span className="font-bold tabular-nums" style={{ color: isDark ? cHue.a : cHue.b }}>{pct}%</span>
                              {isExpanded && (
                                <div className={`h-1 w-12 overflow-hidden rounded-full ${isDark ? 'bg-white/[0.07]' : 'bg-slate-900/[0.07]'}`}>
                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cHue.line }} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Expand toggle */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(match.id)}
                        className="mt-2 flex items-center gap-1 text-[10px] font-bold transition-all hover:gap-1.5"
                        style={{ color: ink }}
                      >
                        {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                        {isExpanded ? 'Masquer les détails' : 'Voir le détail du calcul'}
                      </button>
                    </div>
                  )}

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <div className={`space-y-1.5 rounded-xl border p-3.5 backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-white/60'}`}>
                        <p className={`mb-2 text-[9px] font-extrabold uppercase tracking-[0.16em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Détails du score</p>
                        {criteria.map(({ key, label, icon: CIcon, ratio, weight }) => {
                          const pct = Math.round(ratio * 100);
                          const pts = Math.round(ratio * weight);
                          const cHue = getScoreHue(pct, isGerant);
                          return (
                            <div key={key} className={`flex items-center justify-between py-1 ${isDark ? 'border-white/[0.06]' : 'border-slate-200/60'} border-b last:border-0`}>
                              <div className="flex items-center gap-2 text-[11px]">
                                <div
                                  className="flex h-5 w-5 items-center justify-center rounded-md border"
                                  style={isDark
                                    ? { background: `${accent.a}10`, borderColor: `${accent.a}26` }
                                    : { background: `${accent.a}0D`, borderColor: `${accent.a}26` }}
                                >
                                  <CIcon size={10} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                                </div>
                                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{label}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>{pts}/{weight} pts</span>
                                <span className="min-w-[32px] text-right font-bold tabular-nums" style={{ color: isDark ? cHue.a : cHue.b }}>{pct}%</span>
                              </div>
                            </div>
                          );
                        })}
                        {match.details?.prestations !== undefined && (
                          <div className={`flex items-center justify-between py-1 ${isDark ? 'border-white/[0.06]' : 'border-slate-200/60'} border-t`}>
                            <div className="flex items-center gap-2 text-[11px]">
                              <div
                                className="flex h-5 w-5 items-center justify-center rounded-md border"
                                style={isDark
                                  ? { background: `${accent.a}14`, borderColor: `${accent.a}30`, color: accent.a }
                                  : { background: `${accent.a}12`, borderColor: `${accent.a}30`, color: ink }}
                              >
                                <Star size={10} />
                              </div>
                              <span className="font-semibold" style={{ color: ink }}>Prestations (bonus)</span>
                            </div>
                            <span className="text-[11px] font-bold" style={{ color: ink }}>+{Math.round(match.details.prestations * 5)} pts</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className={`flex items-center justify-between gap-2 border-t px-4 py-2.5 backdrop-blur-sm ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-200/60 bg-white/50'}`}>
                    <label className="flex cursor-pointer items-center gap-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleProposal(match.id); }}>
                      <div
                        className="flex h-4 w-4 items-center justify-center rounded border-2 transition-all"
                        style={selectedProposals.includes(match.id)
                          ? { background: `linear-gradient(145deg, ${accent.a}, ${accent.b})`, borderColor: accent.a, boxShadow: `0 2px 8px ${accent.glow}` }
                          : { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.2)', background: 'transparent' }}
                      >
                        {selectedProposals.includes(match.id) && <CheckSquare size={10} className="text-white" />}
                      </div>
                      <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Sélectionner</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => navigate(`${basePath}/properties/${match.propertyId}`)}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all ${isDark ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'text-slate-500 hover:bg-slate-900/[0.04] hover:text-slate-900'}`}
                      >
                        <Eye size={11} /> Voir
                      </button>
                      <button
                        type="button"
                        onClick={() => openProposal(match)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all hover:brightness-110"
                        style={isDark
                          ? { background: 'rgba(52,211,153,0.12)', color: '#6EE7B7' }
                          : { background: 'rgba(5,150,105,0.08)', color: '#047857' }}
                      >
                        <TrendingUp size={11} /> Proposer
                      </button>
                      <button
                        type="button"
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all ${isDark ? 'text-rose-300/70 hover:bg-rose-500/10 hover:text-rose-200' : 'text-rose-500 hover:bg-rose-50'}`}
                      >
                        <X size={11} /> Refuser
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Footer */}
        {matches.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { label: 'Biens analysés', value: matches.length, icon: Home, hue: null as null | typeof accent },
              { label: 'Score moyen', value: `${avgScore}%`, icon: BarChart2, hue: avgHue },
              { label: 'Excellent match', value: excellentCount, icon: CheckCircle, hue: null as null | typeof accent, forceEmerald: true },
              { label: 'Sélectionnés', value: selectedProposals.length, icon: Square, hue: accent },
            ].map(stat => {
              const emerald = { a: '#34D399', b: '#059669', glow: 'rgba(52,211,153,0.45)', line: '#34D399' };
              const c = (stat as { forceEmerald?: boolean }).forceEmerald ? emerald : stat.hue;
              const tone = c ? (isDark ? c.a : c.b) : undefined;
              return (
                <div
                  key={stat.label}
                  className={`rounded-2xl border p-3 text-center backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70 shadow-sm'}`}
                >
                  <stat.icon
                    size={14}
                    className="mx-auto mb-1.5"
                    style={c ? { color: isDark ? c.a : c.b } : { color: isDark ? '#94A3B8' : '#64748B' }}
                  />
                  <p
                    className="text-lg font-extrabold tabular-nums"
                    style={c ? { color: isDark ? c.a : c.b } : undefined}
                  >
                    <span className={c ? '' : (isDark ? 'text-white' : 'text-slate-900')}>{stat.value}</span>
                  </p>
                  <p className={`mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Proposal Email Modal */}
        <Dialog isOpen={proposalModal.open} onClose={() => setProposalModal({ open: false, match: null })} title="Proposer ce bien" size="lg">
          {proposalModal.match && (() => {
            const m = proposalModal.match;
            const mCriteria = buildCriteria(m.details);
            return (
            <div className="flex flex-col max-h-[70vh]">
              {/* Scrollable content */}
              <div className="flex-1 min-h-0 space-y-5 overflow-y-auto px-1 pr-1">
                {/* Property preview with image */}
                <div
                  className={`flex items-start gap-4 rounded-2xl border p-4 backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70 shadow-sm'}`}
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-2xl"
                    style={{ background: `radial-gradient(80% 120% at 100% 0%, ${accent.a}14, transparent 60%)` }}
                  />
                  {m.images && m.images[0] && (
                    <img src={m.images[0]} alt="" className="relative w-16 shrink-0 rounded-xl border border-white/10 object-cover" style={{ height: 64 }} />
                  )}
                  <div className="relative min-w-0 flex-1">
                    <p className={`truncate text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{m.produit}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold tabular-nums" style={{ color: m.score >= 70 ? (isDark ? '#6EE7B7' : '#047857') : (isDark ? accent.a : ink) }}>
                        {m.score}% compatibilité
                      </span>
                      <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {m.prix > 0 ? m.prix.toLocaleString() + ' MAD' : 'Prix NC'}
                      </span>
                      {m.surface > 0 && (
                        <>
                          <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{m.surface} m²</span>
                        </>
                      )}
                      {m.chambres && (
                        <>
                          <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{m.chambres} ch.</span>
                        </>
                      )}
                      {m.city && (
                        <>
                          <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{m.city}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Matching breakdown */}
                {mCriteria.length > 0 && (
                  <div className={`rounded-2xl border p-4 backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70 shadow-sm'}`}>
                    <p className={`mb-3 text-[10px] font-extrabold uppercase tracking-[0.16em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Analyse de compatibilité</p>
                    <div className="space-y-2">
                      {mCriteria.map(({ key, label, icon: CIcon, ratio, weight }) => {
                        const p = Math.round(ratio * 100);
                        const cHue = getScoreHue(p, isGerant);
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <CIcon size={11} style={{ color: cHue.line }} className="shrink-0" />
                            <span className={`min-w-[80px] text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
                            <div className={`h-1.5 flex-1 overflow-hidden rounded-full ${isDark ? 'bg-white/[0.07]' : 'bg-slate-900/[0.07]'}`}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, background: `linear-gradient(90deg, ${cHue.b}, ${cHue.a})` }} />
                            </div>
                            <span className="min-w-[36px] text-right text-[11px] font-extrabold tabular-nums" style={{ color: isDark ? cHue.a : cHue.b }}>{p}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className={`mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Email du client</label>
                  <input
                    type="email"
                    value={proposalEmail}
                    onChange={(e) => setProposalEmail(e.target.value)}
                    placeholder="email@exemple.com"
                    className={`h-10 w-full rounded-xl border px-3.5 text-sm backdrop-blur-sm transition-all focus:outline-none focus:ring-2 ${isDark ? 'border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500' : 'border-slate-200/70 bg-white/75 text-slate-900 placeholder:text-slate-400 shadow-sm'} ${isGerant ? 'focus:border-[#905D5D]/50 focus:ring-[#905D5D]/20' : isDark ? 'focus:border-violet-400/40 focus:ring-violet-400/20' : 'focus:border-teal-500/40 focus:ring-teal-500/20'}`}
                  />
                </div>

                <div>
                  <label className={`mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Message</label>
                  <textarea
                    value={proposalMessage}
                    onChange={(e) => setProposalMessage(e.target.value)}
                    rows={12}
                    className={`w-full resize-none rounded-xl border px-3.5 py-2.5 font-mono text-xs leading-relaxed backdrop-blur-sm transition-all focus:outline-none focus:ring-2 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-200' : 'border-slate-200/70 bg-white/75 text-slate-800 shadow-sm'} ${isGerant ? 'focus:border-[#905D5D]/50 focus:ring-[#905D5D]/20' : isDark ? 'focus:border-violet-400/40 focus:ring-violet-400/20' : 'focus:border-teal-500/40 focus:ring-teal-500/20'}`}
                  />
                </div>
              </div>

              {/* Pinned submit buttons */}
              <div className={`flex shrink-0 items-center justify-end gap-2 border-t px-1 pt-4 ${isDark ? 'border-white/[0.07]' : 'border-slate-200/70'}`}>
                <button
                  type="button"
                  onClick={() => setProposalModal({ open: false, match: null })}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${isDark ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'text-slate-500 hover:bg-slate-900/[0.04] hover:text-slate-900'}`}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={submitProposal}
                  disabled={proposalSending || !proposalEmail}
                  className="flex items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                  style={isGerant
                    ? { backgroundImage: 'linear-gradient(145deg, #C9A0A0 0%, #905D5D 100%)' }
                    : isDark
                      ? { backgroundImage: 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)' }
                      : { backgroundImage: 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)' }}
                >
                  {proposalSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Mail size={14} />
                      Envoyer la proposition
                    </>
                  )}
                </button>
              </div>
            </div>
            );
          })()}
        </Dialog>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 1: return renderCriteres();
      case 2: return renderCaracteristiques();
      case 3: return renderProximites();
      case 4: return renderPrestations();
      case 5: return renderSolvabilite();
      case 6: return renderMandat();
      case 7: return renderCroisements();
      case 8: return renderDocuments();
      case 9: return renderTransactions();
      case 10: return renderContrats();
      case 11: return <NotesActiviteTab client={client} highlightActivityId={highlightActivityId} isGerant={isGerant} />;
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
