import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { InfoField } from '../../../ui/InfoField';
import { Button } from '../../../ui/Button';
import { ClientTransactionsTab } from '../ClientTransactionsTab';
import { NotesActiviteTab } from './NotesActiviteTab';
import { ClientContractsTab } from '../ClientContractsTab';
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
  { id: 3, label: 'Prix & Honoraires', slug: 'prix_honoraires' },
  { id: 4, label: 'Proximités', slug: 'proximites' },
  { id: 5, label: 'Prestations', slug: 'prestations' },
  { id: 6, label: 'Situation', slug: 'situation' },
  { id: 7, label: 'Mandat', slug: 'mandat' },
  { id: 8, label: 'Documents', slug: 'documents' },
  { id: 9, label: 'Transactions', slug: 'transactions' },
  { id: 10, label: 'Contrats', slug: 'contrats' },
  { id: 11, label: 'Notes & Activité', slug: 'notes_activite' },
];

export const SellerDetailTabs = ({ client: initialClient, adminId, agentId, highlightActivityId, isGerant = false }: { client: Client; adminId?: string; agentId?: string; highlightActivityId?: number; isGerant?: boolean }) => {
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
  const [bienProp, setBienProp] = useState<any>(null);
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

  // ─── TAB 1: INFOS (Localisation & Type) ───
  const renderInfos = () => {
    const c = client as any;
    const hasData = client.localisation || c.adresseComplete || c.codePostalVille || client.secteur ||
      client.categorie || client.propertyType || c.referenceCadastrale || c.lotCopropriete ||
      c.nbLotsTotal || client.latitude || client.longitude;

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
              <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                {client.source}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {client.localisation && <InfoField label="Pays" value={client.localisation} icon={<MapPin size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.categorie && <InfoField label="Catégorie" value={client.categorie} icon={<Tag size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.propertyType && <InfoField label="Type de bien" value={client.propertyType} icon={<Home size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.secteur && <InfoField label="Secteur" value={client.secteur} icon={<MapPin size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
        </div>

        {c.adresseComplete && (
          <InfoField label="Adresse complète" value={c.adresseComplete} icon={<MapPin size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
        )}
        {(c.complementAdresse || c.codePostalVille) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {c.complementAdresse && <InfoField label="Complément d'adresse" value={c.complementAdresse} icon={<MapPin size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {c.codePostalVille && <InfoField label="Code postal & Ville" value={c.codePostalVille} icon={<MapPin size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          </div>
        )}

        <div className="border-t border-border/30 pt-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Informations foncières</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {c.referenceCadastrale && <InfoField label="Référence cadastrale" value={c.referenceCadastrale} icon={<Hash size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {c.lotCopropriete && <InfoField label="Lot copropriété" value={`${c.lotCopropriete}`} icon={<Layers size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            <InfoField label="Syndic présent" value={c.syndicPresent ? 'Oui' : 'Non'} icon={<CheckCircle size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
            {c.syndicPresent && c.nbLotsTotal && (
              <InfoField label="Nombre total de lots" value={`${c.nbLotsTotal}`} icon={<Layers size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
            )}
          </div>
        </div>

        {(client.latitude || client.longitude) && (
          <div className="border-t border-border/30 pt-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Géolocalisation</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.latitude && <InfoField label="Latitude" value={`${client.latitude}`} icon={<MapPin size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
              {client.longitude && <InfoField label="Longitude" value={`${client.longitude}`} icon={<MapPin size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── TAB 2: CARACTÉRISTIQUES ───
  const renderCaracteristiques = () => {
    const hasData = client.pieces || client.chambres || client.minSurface || client.surfaceMax ||
      client.etage !== undefined || client.vue || client.exposition || client.etat ||
      client.standing || client.disponibilite || client.attributPrincipal ||
      client.attributsPersonnalises?.length || client.criteres?.length;

    if (!hasData) return renderEmpty();

    return (
      <div className="space-y-6">
        {/* Quantitatives */}
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Caractéristiques quantitatives</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.pieces && <InfoField label="Pièces" value={`${client.pieces}`} icon={<Grid size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {client.chambres && <InfoField label="Chambres" value={`${client.chambres}`} icon={<Grid size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {client.minSurface && <InfoField label="Surface minimale" value={`${client.minSurface} m²`} icon={<Maximize2 size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {client.surfaceMax && <InfoField label="Surface maximale" value={`${client.surfaceMax} m²`} icon={<Maximize2 size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {client.etage !== undefined && (
              <InfoField label="Étage" value={`${client.etageOperator === 'ge' ? '≥ ' : client.etageOperator === 'le' ? '≤ ' : '= '}${client.etage}`} icon={<Layers size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
            )}
          </div>
        </div>

        {/* Qualitatives */}
        <div className="border-t border-border/30 pt-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Caractéristiques qualitatives</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.vue && <InfoField label="Vue" value={client.vue} icon={<Eye size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {client.exposition && <InfoField label="Exposition" value={client.exposition} icon={<Sun size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {client.etat && <InfoField label="État" value={client.etat} icon={<Home size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {client.standing && <InfoField label="Standing" value={client.standing} icon={<Star size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {client.disponibilite && <InfoField label="Disponibilité" value={client.disponibilite} icon={<Clock size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
            {client.attributPrincipal && <InfoField label="Attribut principal" value={client.attributPrincipal} icon={<Sliders size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          </div>
        </div>

        {/* Attributs & Critères */}
        {(client.attributsPersonnalises?.length || client.criteres?.length) && (
          <div className="border-t border-border/30 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderTagList(client.attributsPersonnalises, 'Attributs personnalisés', isGerant)}
              {client.criteres && client.criteres.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
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
          </div>
        )}
      </div>
    );
  };

  // ─── TAB 3: PRIX & HONORAIRES ───
  const renderPrixHonoraires = () => {
    const c = client as any;
    const hasData = client.prixVenteFAI || c.prixNetVendeur || client.typeRemuneration || client.montantRemuneration || c.commissionCoAgencement;
    if (!hasData) return renderEmpty();

    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
            <DollarSign size={16} className="text-premium" />
            Prix et honoraires
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {c.prixNetVendeur && (
              <InfoField label="Prix net vendeur" value={`${c.prixNetVendeur.toLocaleString()} ${client.devise || 'MAD'}`} icon={<DollarSign size={16} className="text-premium" />} />
            )}
            {client.prixVenteFAI && (
              <InfoField label="Prix de vente FAI" value={`${client.prixVenteFAI.toLocaleString()} ${client.devise || 'MAD'}`} icon={<DollarSign size={16} className="text-premium" />} highlight />
            )}
            {client.typeRemuneration && (
              <InfoField label="Type d'honoraires" value={client.typeRemuneration === 'inclus' ? 'Inclus dans le prix' : client.typeRemuneration === 'en_sus' ? 'En sus du prix' : client.typeRemuneration} icon={<Tag size={16} className="text-premium" />} />
            )}
            {c.modeCalculHonoraires && (
              <InfoField label="Mode de calcul des honoraires" value={c.modeCalculHonoraires === 'pourcentage' ? 'Pourcentage' : 'Montant fixe'} icon={<CreditCard size={16} className="text-premium" />} />
            )}
            {client.montantRemuneration && (
              <InfoField label="Valeur des honoraires" value={client.remunerationIsPercentage ? `${client.montantRemuneration}%` : `${client.montantRemuneration.toLocaleString()} ${client.devise || 'MAD'}`} icon={<CreditCard size={16} className="text-premium" />} />
            )}
            {c.commissionCoAgencement && (
              <InfoField label="Commission de co-agencement" value={`${c.commissionCoAgencement}%`} icon={<Award size={16} className="text-premium" />} />
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─── TAB 4: PROXIMITÉS ───
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

  // ─── TAB 5: PRESTATIONS ───
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

  // ─── TAB 6: SITUATION ───
  const renderSituation = () => {
    const c = client as any;
    const hasData = client.currentSituation || client.reasonForSelling || c.creditRestantDu || c.dateSouhaiteeVente || client.notes;
    if (!hasData) return renderEmpty();

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {client.currentSituation && (
            <InfoField label="Situation actuelle" value={client.currentSituation} icon={<User size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
          )}
          {client.reasonForSelling && (
            <InfoField label="Raison de la vente" value={client.reasonForSelling} icon={<Briefcase size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
          )}
          {c.creditRestantDu && (
            <InfoField label="Crédit existant" value={`${c.creditRestantDu.toLocaleString()} ${client.devise || 'MAD'}`} icon={<CreditCard size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
          )}
          {c.dateSouhaiteeVente && (
            <InfoField label="Date souhaitée de vente" value={new Date(c.dateSouhaiteeVente).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
          )}
        </div>
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
    if (!client.numeroMandat) return renderEmpty();
    const c = client as any;
    const clauseActive = !!client.dureeProtection;

    return (
      <div className="space-y-5">
        <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
          <Layers size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
          Mandat de vente
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField label="Numéro de mandat" value={client.numeroMandat} icon={<Tag size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
          {client.typeMandat && <InfoField label="Type de mandat" value={client.typeMandat} icon={<Compass size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.statutMandat && <InfoField label="Statut du mandat" value={client.statutMandat} icon={<Clock size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.dateSignature && <InfoField label="Date signature" value={new Date(client.dateSignature).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.dateDebut && <InfoField label="Date début" value={new Date(client.dateDebut).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.dateExpiration && <InfoField label="Date expiration" value={new Date(client.dateExpiration).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.conjoint && <InfoField label="Conjoint" value={client.conjoint} icon={<User size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {client.agentDesigne && <InfoField label="Agent désigné" value={client.agentDesigne} icon={<User size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />}
          {c.bienConcerneId && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => basePath && navigate(`${basePath}/properties/${c.bienConcerneId}`)}
              onKeyDown={(e) => { if (e.key === 'Enter' && basePath) navigate(`${basePath}/properties/${c.bienConcerneId}`); }}
              className={`p-4 rounded-xl bg-background transition-colors ${basePath ? `cursor-pointer ${isGerant ? 'hover:bg-[#905D5D]/5' : 'hover:bg-accent/5'}` : ''}`}
            >
              <div className="flex items-center gap-2 text-xs text-text-secondary mb-1">
                <Layers size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                <span>Bien concerné</span>
              </div>
              <p className={`text-sm font-medium ${isGerant ? 'text-[#905D5D]' : 'text-accent'} hover:underline`}>
                {bienProp ? (
                  <>{bienProp.title || bienProp.reference || `Bien #${bienProp.id}`}{bienProp.city ? ` - ${bienProp.city}` : ''}</>
                ) : (
                  <>Bien #{c.bienConcerneId}</>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-border/30 pt-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Clause de protection</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField
              label="Clause de protection"
              value={clauseActive ? 'Activée' : 'Désactivée'}
              icon={<Shield size={16} className={clauseActive ? 'text-emerald-500' : 'text-text-secondary'} />}
            />
            {clauseActive && client.dureeProtection && (
              <InfoField label="Durée de protection" value={`${client.dureeProtection} mois`} icon={<Clock size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />} />
            )}
          </div>
          {clauseActive && (
            <p className="text-xs text-text-secondary mt-2">Si l'acquéreur visitant pendant le mandat achète après expiration, l'agence conserve droit à commission.</p>
          )}
        </div>
      </div>
    );
  };

  // ─── TAB 8: DOCUMENTS ───
  const renderDocuments = () => {
    const docs = client.documents || [];
    const requiredDocs = [
      { label: "Pièce d'identité (passeport ou CIN)", required: true, matchTerms: ['cin', 'identité', 'passeport', 'carte'], url: client.docIdentiteUrl, name: client.docIdentiteName },
      { label: 'Titre de propriété', required: true, matchTerms: ['titre', 'propriété', 'propriete'], url: client.docRevenusUrl, name: client.docRevenusName },
      { label: 'Documents de copropriété', required: false, matchTerms: ['copropriété', 'copropriete', 'copro'], url: client.docDomicileUrl, name: client.docDomicileName },
      { label: 'Autre document', required: false, matchTerms: ['autre'], url: client.docFinancementUrl, name: client.docFinancementName },
    ];
    const mandatUploaded = !!client.mandatPdfUrl;

    return (
      <div className="space-y-5">
        {/* Documents justificatifs */}
        <div className="rounded-xl border border-border/50 bg-background/50 p-4 space-y-3">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Documents justificatifs</p>
          {requiredDocs.map((doc, i) => {
            const matchedDoc = docs.find(d => doc.matchTerms.some(t => d.name.toLowerCase().includes(t)));
            const uploaded = !!doc.url || !!matchedDoc;
            const fileUrl = doc.url || matchedDoc?.url;
            const fileName = doc.name || matchedDoc?.name;
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
                {fileName && <span className="text-[10px] text-text-secondary truncate max-w-[140px]">{fileName}</span>}
                {doc.required ? (
                  <span className="text-[10px] font-medium text-error uppercase">Obligatoire</span>
                ) : (
                  <span className={`text-[10px] font-medium ${isGerant ? 'text-[#905D5D]' : 'text-accent'} uppercase`}>Recommandé</span>
                )}
                {uploaded && fileUrl ? (
                  <button type="button" onClick={() => openViewer(fileUrl, doc.label)} className={`text-xs px-2.5 py-1 rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] border border-[#905D5D]/20 hover:bg-[#905D5D]/20' : 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20'} transition-all flex items-center gap-1`}>
                    <Eye size={12} /> Voir
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Fichier du mandat signé */}
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 1: return renderInfos();
      case 2: return renderCaracteristiques();
      case 3: return renderPrixHonoraires();
      case 4: return renderProximites();
      case 5: return renderPrestations();
      case 6: return renderSituation();
      case 7: return renderMandat();
      case 8: return renderDocuments();
      case 9: return renderTransactions();
      case 10: return renderContrats();
      case 11: return <NotesActiviteTab client={client} highlightActivityId={highlightActivityId} isGerant={isGerant} />;
      default: return null;
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card mt-4">
      <div className="px-6 border-b border-border/30 flex justify-between gap-1 overflow-x-auto rounded-t-xl">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
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
