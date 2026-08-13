import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { InfoField } from '../../../ui/InfoField';
import { Button } from '../../../ui/Button';
import { Dialog } from '../../../ui/Dialog';
import { useToast } from '../../../ui/Toast';
import { ClientTransactionsTab } from '../ClientTransactionsTab';
import { NotesActiviteTab } from './NotesActiviteTab';
import { ClientContractsTab } from '../ClientContractsTab';
import { Client } from '../../../../types/client';
import {
  Home, MapPin, Maximize2, Grid, Clock, User, Briefcase, CheckCircle,
  AlertCircle, Calendar, Eye, Sun, Tag, Star, Layers, Compass,
  DollarSign, CreditCard, FileText, Plus,
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
          {client.statutOccupation && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-secondary">Statut de l'occupation:</span>
              <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                {client.statutOccupation}
              </span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {client.localisation && <InfoField label="Localisation" value={client.localisation} icon={<MapPin size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.categorie && <InfoField label="Catégorie" value={client.categorie} icon={<Tag size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.propertyType && <InfoField label="Type de bien recherché" value={client.propertyType} icon={<Home size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          <InfoField label="Secteur géographique" value={client.secteur || client.area || 'Non spécifié'} icon={<MapPin size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
          {(client as any).adresseComplete && <InfoField label="Adresse complète" value={(client as any).adresseComplete} icon={<MapPin size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {(client as any).complementAdresse && <InfoField label="Complément d'adresse" value={(client as any).complementAdresse} icon={<MapPin size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {(client as any).codePostalVille && <InfoField label="Code postal / Ville" value={(client as any).codePostalVille} icon={<MapPin size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {(client as any).pays && <InfoField label="Pays" value={(client as any).pays} icon={<MapPin size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {(client.minSurface || client.surfaceMax) && (
            <InfoField label="Surface" value={`${client.minSurface || '?'} ~ ${client.surfaceMax || '?'} m²`} icon={<Maximize2 size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
          )}
          {client.prixMin !== undefined && (
            <InfoField label="Loyer max" value={`${client.prixMin.toLocaleString()} ${client.devise || 'MAD'}`} icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
          )}
          {(client.pieces || client.chambres) && (
            <InfoField label="Pièces / Chambres" value={`${client.pieces || '?'} pièces / ${client.chambres || '?'} chambres`} icon={<Grid size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
          )}
          {client.rooms && !client.pieces && (
            <InfoField label="Nombre de pièces" value={client.rooms} icon={<Grid size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
          )}
          {client.etage !== undefined && (
            <InfoField label="Étage" value={`${client.etageOperator === 'ge' ? '≥ ' : client.etageOperator === 'le' ? '≤ ' : '= '}${client.etage}`} icon={<Layers size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
          )}
        </div>
        {(client.latitude !== 0 && client.latitude !== undefined) || (client.longitude !== 0 && client.longitude !== undefined) ? (
          <div className="p-3 rounded-xl bg-background border border-border/50">
            <InfoField
              label="Coordonnées"
              value={`${client.latitude?.toFixed(4) || '0'}, ${client.longitude?.toFixed(4) || '0'}`}
              icon={<Compass size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />}
            />
            {(client.latitude !== 0 && client.latitude) || (client.longitude !== 0 && client.longitude) ? (
              <a
                href={`https://www.google.com/maps?q=${client.latitude},${client.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-xs ${isGerant ? 'text-[#905D5D]' : 'text-accent'} hover:underline mt-1 inline-block`}
              >
                Voir sur Google Maps
              </a>
            ) : null}
          </div>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {client.currentSituation && <InfoField label="Situation actuelle" value={client.currentSituation} icon={<User size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.moveInDate && (
            <InfoField label="Date souhaitée d'emménagement" value={new Date(client.moveInDate).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
          )}
        </div>
      </div>
    );
  };

  const renderCaracteristiques = () => {
    const hasData = client.vue || client.exposition || client.etat || client.standing ||
      client.disponibilite || client.attributPrincipal || client.attributsPersonnalises?.length ||
      client.criteres?.length;

    if (!hasData) return renderEmpty();

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {client.vue && <InfoField label="Vue" value={client.vue} icon={<Eye size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.exposition && <InfoField label="Exposition" value={client.exposition} icon={<Sun size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.etat && <InfoField label="État" value={client.etat} icon={<Home size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.standing && <InfoField label="Standing" value={client.standing} icon={<Star size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.disponibilite && <InfoField label="Disponibilité" value={client.disponibilite} icon={<Clock size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
        </div>

        {client.attributPrincipal && (
          <div>
            <p className="text-sm font-medium text-text mb-2">Attribut principal</p>
            <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-premium/10 text-premium border border-premium/20">
              {client.attributPrincipal}
            </span>
          </div>
        )}

        {renderTagList(client.attributsPersonnalises, 'Attributs personnalisés', isGerant)}

        {client.criteres && client.criteres.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <CheckCircle size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
              Critères de base
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {client.criteres.map(c => (
                <span key={c} className={`px-2 py-1 text-xs rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] border border-[#905D5D]/20' : 'bg-accent/10 text-accent border border-accent/20'}`}>{c}</span>
              ))}
            </div>
          </div>
        )}
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
          {renderCategorieGroup(p.exterieur, 'Extérieur & Sécurité')}
          {renderCategorieGroup(p.confort, 'Confort & Équipement')}
          {renderCategorieGroup(p.electromenager, 'Électroménager & Mobilier')}
          {renderCategorieGroup(p.multimedia, 'Multimédia & Communication')}
          {renderCategorieGroup(p.sport, 'Sport & Loisirs')}
        </div>
      </div>
    );
  };

  const renderSolvabilite = () => {
    const hasData = client.employmentStatus || client.contribution || client.guarantor || client.anciennete !== undefined || client.chiffreAffaires !== undefined || client.pensionMensuelle !== undefined || client.currentSituation || client.moveInDate || client.notes;

    if (!hasData) return renderEmpty();

    const devise = client.devise || 'MAD';
    const emp = client.employmentStatus || '';

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField label="Situation professionnelle" value={client.employmentStatus || 'Non spécifié'} icon={<Briefcase size={16} className="text-premium" />} />
          {client.contribution !== undefined && (
            <InfoField label="Revenus mensuels nets" value={`${client.contribution.toLocaleString('fr-FR')} ${devise}`} icon={<TrendingUp size={16} className="text-premium" />} />
          )}
        </div>

        {emp === 'CDI' && (
          <div className="border-t border-border/30 pt-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Informations employeur</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {client.anciennete !== undefined && (
                <InfoField label="Ancienneté" value={`${client.anciennete} an${client.anciennete > 1 ? 's' : ''}`} icon={<Clock size={16} className="text-premium" />} />
              )}
              <InfoField label="Période d'essai" value={client.periodeEssai ? 'Oui' : 'Non'} icon={<CheckCircle size={16} className="text-premium" />} />
              {client.nomEmployeur && (
                <InfoField label="Nom de l'employeur" value={client.nomEmployeur} icon={<Briefcase size={16} className="text-premium" />} />
              )}
            </div>
          </div>
        )}

        {emp === 'CDD' && (
          <div className="border-t border-border/30 pt-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Informations employeur</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {client.dateFinContrat && (
                <InfoField label="Date de fin du contrat" value={new Date(client.dateFinContrat).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className="text-premium" />} />
              )}
              {client.anciennete !== undefined && (
                <InfoField label="Ancienneté" value={`${client.anciennete} an${client.anciennete > 1 ? 's' : ''}`} icon={<Clock size={16} className="text-premium" />} />
              )}
              {client.nomEmployeur && (
                <InfoField label="Nom de l'employeur" value={client.nomEmployeur} icon={<Briefcase size={16} className="text-premium" />} />
              )}
            </div>
          </div>
        )}

        {emp === 'Independant' && (
          <div className="border-t border-border/30 pt-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Informations indépendant</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.chiffreAffaires !== undefined && (
                <InfoField label="Chiffre d'affaires annuel" value={`${client.chiffreAffaires.toLocaleString('fr-FR')} ${devise}`} icon={<TrendingUp size={16} className="text-premium" />} />
              )}
              {client.dernierBilanUrl && (
                <button type="button" onClick={() => openViewer(client.dernierBilanUrl!, client.dernierBilanName || 'Dernier bilan / Kbis')} className={`w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50 text-left ${isGerant ? 'hover:border-[#905D5D]/40' : 'hover:border-accent/40'} transition-all cursor-pointer`}>
                  <FileText size={16} className="text-premium shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-secondary">Dernier bilan / Kbis</p>
                    <p className={`text-sm ${isGerant ? 'text-[#905D5D]' : 'text-accent'} truncate`}>{client.dernierBilanName || 'Document uploaded'}</p>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                    <Eye size={10} /> Voir
                  </span>
                </button>
              )}
              {client.dernierAvisImpotUrl && (
                <button type="button" onClick={() => openViewer(client.dernierAvisImpotUrl!, client.dernierAvisImpotName || "Dernier avis d'imposition")} className={`w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50 text-left ${isGerant ? 'hover:border-[#905D5D]/40' : 'hover:border-accent/40'} transition-all cursor-pointer`}>
                  <FileText size={16} className="text-premium shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-secondary">Dernier avis d'imposition</p>
                    <p className={`text-sm ${isGerant ? 'text-[#905D5D]' : 'text-accent'} truncate`}>{client.dernierAvisImpotName || 'Document uploaded'}</p>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                    <Eye size={10} /> Voir
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {emp === 'Retraite' && (
          <div className="border-t border-border/30 pt-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Informations retraite</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {client.pensionMensuelle !== undefined && (
                <InfoField label="Pension mensuelle nette" value={`${client.pensionMensuelle.toLocaleString('fr-FR')} ${devise}`} icon={<CreditCard size={16} className="text-premium" />} />
              )}
              {client.dateRetraite && (
                <InfoField label="Date de retraite" value={new Date(client.dateRetraite).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className="text-premium" />} />
              )}
              {client.organismeRetraite && (
                <InfoField label="Organisme de retraite" value={client.organismeRetraite} icon={<Shield size={16} className="text-premium" />} />
              )}
            </div>
          </div>
        )}

        {(emp === 'Etudiant' || emp === 'Sans emploi') && (
          <div className="border-t border-border/30 pt-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Garant {emp === 'Sans emploi' ? '(obligatoire)' : '(optionnel)'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Garant" value={client.guarantor ? 'Oui' : 'Non'} icon={<CheckCircle size={16} className="text-premium" />} />
              {client.guarantor && (
                <>
                  <InfoField label="Nom du garant" value={client.guarantorName || 'Non renseigné'} icon={<User size={16} className="text-premium" />} />
                  {client.guarantorRevenus !== undefined && (
                    <InfoField label="Revenus du garant" value={`${client.guarantorRevenus.toLocaleString('fr-FR')} ${devise}`} icon={<TrendingUp size={16} className="text-premium" />} />
                  )}
                </>
              )}
            </div>
            {emp === 'Sans emploi' && client.justificatifSituationUrl && (
              <button type="button" onClick={() => openViewer(client.justificatifSituationUrl!, client.justificatifSituationName || 'Justificatif de situation')} className={`mt-3 w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50 text-left ${isGerant ? 'hover:border-[#905D5D]/40' : 'hover:border-accent/40'} transition-all cursor-pointer`}>
                <FileText size={16} className="text-premium shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-secondary">Justificatif de situation</p>
                  <p className={`text-sm ${isGerant ? 'text-[#905D5D]' : 'text-accent'} truncate`}>{client.justificatifSituationName || 'Document uploaded'}</p>
                </div>
                <span className="text-[10px] font-medium text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                  <Eye size={10} /> Voir
                </span>
              </button>
            )}
          </div>
        )}

        {!emp && (
          <div className="border-t border-border/30 pt-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Garant</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Garant" value={client.guarantor ? 'Oui' : 'Non'} icon={<CheckCircle size={16} className="text-premium" />} />
              {client.guarantor && (
                <>
                  <InfoField label="Nom du garant" value={client.guarantorName || 'Non renseigné'} icon={<User size={16} className="text-premium" />} />
                  {client.guarantorRevenus !== undefined && (
                    <InfoField label="Revenus du garant" value={`${client.guarantorRevenus.toLocaleString('fr-FR')} ${devise}`} icon={<TrendingUp size={16} className="text-premium" />} />
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-border/30 pt-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Situation & Notes</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.currentSituation && <InfoField label="Situation actuelle" value={client.currentSituation} icon={<Home size={16} className="text-premium" />} />}
            {client.moveInDate && (
              <InfoField label="Date souhaitée d'emménagement" value={new Date(client.moveInDate).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className="text-premium" />} />
            )}
          </div>
          {client.notes && (
            <div className="mt-3">
              <InfoField label="Notes complémentaires" value={client.notes} icon={<FileText size={16} className="text-premium" />} />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMandat = () => {
    if (!client.numeroMandat) return renderEmpty();

    return (
      <div className="space-y-5">
        <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
          <Layers size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
          Mandat de recherche de location
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField label="Numéro de mandat" value={client.numeroMandat} icon={<Tag size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
          {client.statutMandat && <InfoField label="Statut du mandat" value={client.statutMandat} icon={<Clock size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.typeMandat && <InfoField label="Type de mandat" value={client.typeMandat} icon={<Compass size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.dateSignature && <InfoField label="Date signature" value={new Date(client.dateSignature).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.dateDebut && <InfoField label="Date début" value={new Date(client.dateDebut).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.dateExpiration && <InfoField label="Date expiration" value={new Date(client.dateExpiration).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.agentDesigne && <InfoField label="Agent désigné" value={client.agentDesigne} icon={<User size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.conjoint && <InfoField label="Conjoint" value={client.conjoint} icon={<User size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.societe && <InfoField label="Société" value={client.societe} icon={<Briefcase size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.typeRemuneration && <InfoField label="Type rémunération" value={client.typeRemuneration} icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.montantRemuneration && (
            <InfoField label="Montant" value={(client as any).remunerationIsPercentage ? `${client.montantRemuneration}%` : `${client.montantRemuneration.toLocaleString()} ${client.devise || 'MAD'}`} icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
          )}
          {client.conditionPaiement && <InfoField label="Condition de paiement" value={client.conditionPaiement} icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.dureeProtection && <InfoField label="Durée de protection" value={`${client.dureeProtection} mois`} icon={<Clock size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
        </div>

        {bienRecherche && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => basePath && navigate(`${basePath}/properties/${client.bienRechercheId}`)}
            onKeyDown={(e) => { if (e.key === 'Enter' && basePath) navigate(`${basePath}/properties/${client.bienRechercheId}`); }}
            className={`p-4 rounded-xl bg-background transition-colors ${basePath ? 'cursor-pointer ' + (isGerant ? 'hover:bg-[#905D5D]/5' : 'hover:bg-accent/5') : ''}`}
          >
            <div className="flex items-center gap-2 text-xs text-text-secondary mb-1">
              <Layers size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
              <span>BIEN RECHERCHÉ</span>
            </div>
            <p className={`text-sm font-medium ${isGerant ? 'text-[#905D5D]' : 'text-accent'} hover:underline`}>
              {bienRecherche.title || bienRecherche.reference || `Bien #${bienRecherche.id}`}{bienRecherche.city ? ` - ${bienRecherche.city}` : ''}
            </p>
          </div>
        )}
      </div>
    );
  };

  const [rawViewerUrl, setRawViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState('');

  const viewerUrl = rawViewerUrl ? (rawViewerUrl.startsWith('http') ? rawViewerUrl : `http://localhost:5000${rawViewerUrl}`) : null;

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

    const scoreMeta = (score: number, isGerant: boolean) => {
      if (score >= 80) return { text: 'text-emerald-600', bg: 'bg-emerald-500', lightBg: 'bg-emerald-50', ring: 'ring-emerald-500/20', label: 'Excellente', trackBg: 'bg-emerald-100' };
      if (score >= 60) return isGerant ? { text: 'text-[#905D5D]', bg: 'bg-[#905D5D]', lightBg: 'bg-[#E7D5D5]', ring: 'ring-[#905D5D]/20', label: 'Moyenne', trackBg: 'bg-[#E7D5D5]' } : { text: 'text-amber-600', bg: 'bg-amber-500', lightBg: 'bg-amber-50', ring: 'ring-amber-500/20', label: 'Moyenne', trackBg: 'bg-amber-100' };
      return { text: 'text-red-500', bg: 'bg-red-400', lightBg: 'bg-red-50', ring: 'ring-red-400/20', label: 'Faible', trackBg: 'bg-red-100' };
    };

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
          <div className="relative w-14 h-14 mb-4">
            <div className={`absolute inset-0 rounded-full border-2 ${isGerant ? 'border-[#905D5D]/20' : 'border-accent/20'}`} />
            <div className={`absolute inset-0 rounded-full border-2 border-transparent ${isGerant ? 'border-t-[#905D5D]' : 'border-t-accent'} animate-spin`} />
            <div className={`absolute inset-2 rounded-full border-2 border-transparent ${isGerant ? 'border-t-[#905D5D]/60' : 'border-t-accent/60'} animate-spin`} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            <BarChart2 size={16} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`} />
          </div>
          <p className="text-sm font-medium text-text">Analyse en cours...</p>
          <p className="text-xs text-text-secondary/60 mt-1">Comparaison des critères avec la base de données</p>
        </div>
      );
    }

    if (croisementError) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <AlertCircle size={20} className="text-red-400" />
          </div>
          <p className="text-sm text-red-500 font-medium">{croisementError}</p>
          <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={fetchCroisements} className="mt-3">Réessayer</Button>
        </div>
      );
    }

    const filtered = matches.filter(m => m.score >= croisementScoreFilter);
    const sorted = [...filtered].sort((a, b) => sortBy === 'price' ? a.prix - b.prix : sortBy === 'surface' ? b.surface - a.surface : b.score - a.score);
    const avgScore = filtered.length > 0 ? Math.round(filtered.reduce((s, m) => s + m.score, 0) / filtered.length) : 0;
    const excellentCount = filtered.filter(m => m.score >= 80).length;
    const sm = scoreMeta(avgScore, isGerant);

    return (
      <div className="space-y-6">
        {/* Hero Header */}
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${isGerant ? 'from-[#905D5D]/5 via-[#905D5D]/[0.02]' : 'from-accent/5 via-accent/[0.02]'} to-transparent border ${isGerant ? 'border-[#905D5D]/10' : 'border-accent/10'} p-5`}>
          <div className={`absolute top-3 right-3 w-24 h-24 rounded-full ${isGerant ? 'bg-[#905D5D]/5' : 'bg-accent/5'} blur-2xl`} />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-7 h-7 rounded-lg ${isGerant ? 'bg-[#905D5D]/10' : 'bg-accent/10'} flex items-center justify-center`}>
                  <BarChart2 size={14} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                </div>
                <h3 className="text-sm font-semibold text-text tracking-tight">Croisements</h3>
              </div>
              <p className="text-xs text-text-secondary">
                <span className="font-semibold text-text">{client.name}</span>
                <span className="mx-1.5 text-text-secondary/30">—</span>
                {filtered.length} bien{filtered.length > 1 ? 's' : ''} correspondant{filtered.length > 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border/50">
                  <span className={`text-lg font-bold ${sm.text}`}>{avgScore}%</span>
                  <span className="text-[10px] text-text-secondary">score moyen</span>
                </div>
                {excellentCount > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100">
                    <CheckCircle size={12} className="text-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-600">{excellentCount}</span>
                    <span className="text-[10px] text-emerald-600/70">excellent{excellentCount > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={fetchCroisements}>Relancer</Button>
              {selectedProposals.length > 0 && (
                <Button variant="default" size="sm" icon={<Mail size={14} />}>Envoyer ({selectedProposals.length})</Button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 px-1">
          <div className="flex items-center gap-1.5 mr-2">
            <Filter size={12} className="text-text-secondary/50" />
            <span className="text-[10px] font-medium text-text-secondary/60 uppercase tracking-wider">Filtres</span>
          </div>
          <div className="flex items-center gap-1 bg-background rounded-lg border border-border/50 p-0.5">
            {[0, 50, 60, 70, 80].map(val => (
              <button key={val} onClick={() => setCroisementScoreFilter(val)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${croisementScoreFilter === val ? (isGerant ? 'bg-[#905D5D] text-white shadow-sm' : 'bg-accent text-white shadow-sm') : 'text-text-secondary hover:text-text'}`}>
                {val === 0 ? 'Tous' : `${val}%+`}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-border/50" />
          <div className="flex items-center gap-1 bg-background rounded-lg border border-border/50 p-0.5">
            {([['score', 'Meilleur', TrendingUp], ['price', 'Prix', DollarSign], ['surface', 'Surface', Maximize2]] as const).map(([val, label, Icon]) => (
              <button key={val} onClick={() => setSortBy(val)}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${sortBy === val ? (isGerant ? 'bg-[#905D5D] text-white shadow-sm' : 'bg-accent text-white shadow-sm') : 'text-text-secondary hover:text-text'}`}>
                <Icon size={10} />{label}
              </button>
            ))}
          </div>
        </div>

        {/* Property Cards */}
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-background flex items-center justify-center mb-3 border border-border/50">
              <Home size={22} className="text-text-secondary/30" />
            </div>
            <p className="text-sm font-medium text-text-secondary">Aucun bien trouvé</p>
            <p className="text-xs text-text-secondary/50 mt-1">Essayez d'abaisser le score minimum</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((match) => {
              const sc = scoreMeta(match.score, isGerant);
              const criteria = buildCriteria(match.details);
              const isExpanded = expandedCards.has(match.id);
              const hasImage = match.images && match.images.length > 0 && match.images[0];
              const location = [match.city, match.district].filter(Boolean).join(' · ');
              const typeLabel = match.propertyType || 'Bien';

              return (
                <div key={match.id} className="group bg-card rounded-2xl border border-border/40 shadow-card hover:shadow-lg hover:border-border/60 transition-all duration-300 overflow-hidden">

                  {/* Top: Image + Info + Score Ring */}
                  <div className="flex gap-4 p-4">
                    {/* Image */}
                    <div className="w-24 h-24 rounded-xl bg-background border border-border/40 flex items-center justify-center shrink-0 overflow-hidden">
                      {hasImage ? (
                        <img src={match.images![0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <Home size={20} className="text-text-secondary/20" />
                          <span className="text-[8px] text-text-secondary/30 font-medium uppercase">{typeLabel}</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-[13px] text-text truncate leading-tight">{match.produit}</h4>
                            <span className={`shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] border border-[#905D5D]/20' : 'bg-accent/10 text-accent border border-accent/20'}`}>{typeLabel}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {location && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-text-secondary">
                                <MapPin size={10} className="shrink-0 text-text-secondary/50" />
                                {location}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Score circle */}
                        <div className="shrink-0 flex flex-col items-center">
                          <div className={`relative w-12 h-12 rounded-full ${sc.lightBg} flex items-center justify-center ring-2 ${sc.ring}`}>
                            <span className={`text-sm font-bold ${sc.text}`}>{match.score}</span>
                            <span className={`text-[7px] font-medium ${sc.text} -mt-0.5`}>%</span>
                          </div>
                          <span className={`text-[8px] font-semibold ${sc.text} mt-0.5 uppercase tracking-wide`}>{sc.label}</span>
                        </div>
                      </div>

                      {/* Property stats */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background text-[10px] font-medium text-text-secondary border border-border/40">
                          <DollarSign size={9} className="text-text-secondary/50" />
                          {match.prix > 0 ? `${match.prix.toLocaleString()} MAD` : 'Prix NC'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background text-[10px] font-medium text-text-secondary border border-border/40">
                          <Maximize2 size={9} className="text-text-secondary/50" />
                          {match.surface > 0 ? `${match.surface} m²` : '—'}
                        </span>
                        {match.pieces ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background text-[10px] font-medium text-text-secondary border border-border/40">
                            <Grid size={9} className="text-text-secondary/50" />
                            {match.pieces} p.
                          </span>
                        ) : null}
                        {match.chambres ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background text-[10px] font-medium text-text-secondary border border-border/40">
                            <Home size={9} className="text-text-secondary/50" />
                            {match.chambres} ch.
                          </span>
                        ) : null}
                        {match.sallesDeBain ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background text-[10px] font-medium text-text-secondary border border-border/40">
                            <Droplet size={9} className="text-text-secondary/50" />
                            {match.sallesDeBain} sdb
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Description snippet */}
                  {match.description && (
                    <div className="px-4 pb-3">
                      <p className="text-[11px] text-text-secondary/60 leading-relaxed line-clamp-2">{match.description}</p>
                    </div>
                  )}

                  {/* Features chips */}
                  {match.features && match.features.length > 0 && (
                    <div className="px-4 pb-3 flex flex-wrap gap-1">
                      {match.features.slice(0, 6).map((f, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-background text-[9px] font-medium text-text-secondary/70 border border-border/30">{f}</span>
                      ))}
                      {match.features.length > 6 && (
                        <span className={`px-2 py-0.5 rounded-md ${isGerant ? 'bg-[#905D5D]/5 text-[9px] font-medium text-[#905D5D]/60' : 'bg-accent/5 text-[9px] font-medium text-accent/60'}`}>+{match.features.length - 6}</span>
                      )}
                    </div>
                  )}

                  {/* Score Breakdown */}
                  {criteria.length > 0 && (
                    <div className="px-4 pb-4">
                      {/* Score bar */}
                      <div className={`h-1.5 rounded-full ${sc.trackBg} overflow-hidden mb-3`}>
                        <div className={`h-full rounded-full ${sc.bg} transition-all duration-700 ease-out`} style={{ width: `${match.score}%` }} />
                      </div>

                      {/* Criteria grid */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {criteria.map(({ key, label, icon: CIcon, ratio }) => {
                          const pct = Math.round(ratio * 100);
                          const cText = pct >= 80 ? 'text-emerald-600' : pct >= 50 ? (isGerant ? 'text-[#905D5D]' : 'text-amber-600') : 'text-red-400';
                          const cBg = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? (isGerant ? 'bg-[#905D5D]' : 'bg-amber-500') : 'bg-red-400';
                          return (
                            <div key={key} className="flex items-center gap-1.5 text-[11px] py-0.5">
                              <CIcon size={10} className={pct >= 80 ? 'text-emerald-400' : pct >= 50 ? (isGerant ? 'text-[#905D5D]' : 'text-amber-400') : 'text-red-300'} />
                              <span className="text-text-secondary/70">{label}</span>
                              <span className={`font-semibold ${cText}`}>{pct}%</span>
                              {isExpanded && (
                                <div className="w-12 h-1 rounded-full bg-border/30 overflow-hidden">
                                  <div className={`h-full rounded-full ${cBg}`} style={{ width: `${pct}%` }} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Expand toggle */}
                      <button onClick={() => toggleExpand(match.id)}
                        className={`flex items-center gap-1 mt-2 text-[10px] font-medium ${isGerant ? 'text-[#905D5D]/70 hover:text-[#905D5D]' : 'text-accent/70 hover:text-accent'} transition-colors`}>
                        {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                        {isExpanded ? 'Masquer les détails' : 'Voir le détail du calcul'}
                      </button>
                    </div>
                  )}

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <div className="rounded-xl bg-background/60 border border-border/30 p-3.5 space-y-1.5">
                        <p className="text-[9px] font-bold text-text-secondary/40 uppercase tracking-widest mb-2">Détails du score</p>
                        {criteria.map(({ key, label, icon: CIcon, ratio, weight }) => {
                          const pct = Math.round(ratio * 100);
                          const pts = Math.round(ratio * weight);
                          return (
                            <div key={key} className="flex items-center justify-between py-1 border-b border-border/20 last:border-0">
                              <div className="flex items-center gap-2 text-[11px]">
                                <div className="w-5 h-5 rounded flex items-center justify-center bg-card border border-border/30">
                                  <CIcon size={10} className="text-text-secondary/50" />
                                </div>
                                <span className="text-text-secondary">{label}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="text-text-secondary/40">{pts}/{weight} pts</span>
                                <span className={`font-semibold min-w-[32px] text-right ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? (isGerant ? 'text-[#905D5D]' : 'text-amber-600') : 'text-red-400'}`}>{pct}%</span>
                              </div>
                            </div>
                          );
                        })}
                        {match.details?.prestations !== undefined && (
                          <div className="flex items-center justify-between py-1 border-t border-border/20">
                            <div className="flex items-center gap-2 text-[11px]">
                              <div className={`w-5 h-5 rounded flex items-center justify-center ${isGerant ? 'bg-[#905D5D]/10 border border-[#905D5D]/20' : 'bg-accent/10 border border-accent/20'}`}>
                                <Star size={10} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                              </div>
                              <span className={isGerant ? 'text-[#905D5D] font-medium' : 'text-accent font-medium'}>Prestations (bonus)</span>
                            </div>
                            <span className={isGerant ? 'text-[#905D5D] font-semibold text-[11px]' : 'text-accent font-semibold text-[11px]'}>+{Math.round(match.details.prestations * 5)} pts</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="px-4 py-2.5 border-t border-border/30 flex items-center justify-between bg-background/20">
                    <label className="flex items-center gap-2 cursor-pointer group/check" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleProposal(match.id); }}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selectedProposals.includes(match.id) ? (isGerant ? 'bg-[#905D5D] border-[#905D5D]' : 'bg-accent border-accent') : (isGerant ? 'border-border group-hover/check:border-[#905D5D]/50' : 'border-border group-hover/check:border-accent/50')}`}>
                        {selectedProposals.includes(match.id) && <CheckSquare size={10} className="text-white" />}
                      </div>
                      <span className="text-[10px] text-text-secondary/60">Sélectionner</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`${basePath}/properties/${match.propertyId}`)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-text-secondary rounded-lg transition-all ${isGerant ? 'hover:text-[#905D5D] hover:bg-[#905D5D]/5' : 'hover:text-accent hover:bg-accent/5'}`}>
                        <Eye size={11} /> Voir
                      </button>
                      <button onClick={() => openProposal(match)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                        <TrendingUp size={11} /> Proposer
                      </button>
                      <button className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-red-400 hover:bg-red-50 rounded-lg transition-all">
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Biens analysés', value: matches.length, icon: Home, color: 'text-text-secondary' },
              { label: 'Score moyen', value: `${avgScore}%`, icon: BarChart2, color: sm.text },
              { label: 'Excellent match', value: excellentCount, icon: CheckCircle, color: 'text-emerald-600' },
              { label: 'Sélectionnés', value: selectedProposals.length, icon: Square, color: isGerant ? 'text-[#905D5D]' : 'text-accent' },
            ].map(stat => (
              <div key={stat.label} className="p-3 rounded-xl bg-background border border-border/40 text-center">
                <stat.icon size={14} className={`${stat.color} mx-auto mb-1.5`} />
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[9px] text-text-secondary/50 font-medium uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
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
              <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-5 -mx-1 px-1">
                {/* Property preview with image */}
                <div className={`flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br ${isGerant ? 'from-[#905D5D]/5' : 'from-accent/5'} to-transparent border ${isGerant ? 'border-[#905D5D]/10' : 'border-accent/10'}`}>
                  {m.images && m.images[0] && (
                    <img src={m.images[0]} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 border border-border/30" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text truncate">{m.produit}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs font-bold ${m.score >= 70 ? 'text-emerald-600' : (isGerant ? 'text-[#905D5D]' : 'text-amber-600')}`}>
                        {m.score}% compatibilité
                      </span>
                      <span className="text-text-secondary/30">·</span>
                      <span className="text-xs text-text-secondary">
                        {m.prix > 0 ? m.prix.toLocaleString() + ' MAD' : 'Prix NC'}
                      </span>
                      {m.surface > 0 && (
                        <>
                          <span className="text-text-secondary/30">·</span>
                          <span className="text-xs text-text-secondary">{m.surface} m²</span>
                        </>
                      )}
                      {m.chambres && (
                        <>
                          <span className="text-text-secondary/30">·</span>
                          <span className="text-xs text-text-secondary">{m.chambres} ch.</span>
                        </>
                      )}
                      {m.city && (
                        <>
                          <span className="text-text-secondary/30">·</span>
                          <span className="text-xs text-text-secondary">{m.city}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Matching breakdown */}
                {mCriteria.length > 0 && (
                  <div className="p-4 rounded-xl bg-background/60 border border-border/30">
                    <p className="text-[10px] font-bold text-text-secondary/40 uppercase tracking-widest mb-3">Analyse de compatibilité</p>
                    <div className="space-y-2">
                      {mCriteria.map(({ key, label, icon: CIcon, ratio, weight }) => {
                        const p = Math.round(ratio * 100);
                        const cText = p >= 80 ? 'text-emerald-600' : p >= 50 ? (isGerant ? 'text-[#905D5D]' : 'text-amber-600') : 'text-red-400';
                        const cBg = p >= 80 ? 'bg-emerald-500' : p >= 50 ? (isGerant ? 'bg-[#905D5D]' : 'bg-amber-500') : 'bg-red-400';
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <CIcon size={11} className={p >= 80 ? 'text-emerald-400' : p >= 50 ? (isGerant ? 'text-[#905D5D]' : 'text-amber-400') : 'text-red-300'} />
                            <span className="text-[11px] text-text-secondary min-w-[80px]">{label}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-border/30 overflow-hidden">
                              <div className={`h-full rounded-full ${cBg} transition-all`} style={{ width: `${p}%` }} />
                            </div>
                            <span className={`text-[11px] font-semibold min-w-[36px] text-right ${cText}`}>{p}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Email du client</label>
                  <input
                    type="email"
                    value={proposalEmail}
                    onChange={(e) => setProposalEmail(e.target.value)}
                    placeholder="email@exemple.com"
                    className={`w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/60 text-sm text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/30 focus:border-[#905D5D]/50' : 'focus:ring-accent/30 focus:border-accent/50'} transition-all`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Message</label>
                  <textarea
                    value={proposalMessage}
                    onChange={(e) => setProposalMessage(e.target.value)}
                    rows={12}
                    className={`w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/60 text-sm text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/30 focus:border-[#905D5D]/50' : 'focus:ring-accent/30 focus:border-accent/50'} transition-all resize-none leading-relaxed font-mono`}
                  />
                </div>
              </div>

              {/* Pinned submit buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border/30 shrink-0">
                <button
                  onClick={() => setProposalModal({ open: false, match: null })}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text rounded-lg hover:bg-background transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={submitProposal}
                  disabled={proposalSending || !proposalEmail}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r ${isGerant ? 'from-[#905D5D] to-[#7D5050]/80 hover:from-[#905D5D]/90 hover:to-[#7D5050]/70' : 'from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70'} rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
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
    <div className="bg-card rounded-xl border border-border/50 shadow-card mt-4">
      <div className="px-6 border-b border-border/30 flex gap-1 overflow-x-auto rounded-t-xl">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-3 text-xs font-medium border-b-2 transition-all text-center ${
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
    </div>
  );
};
