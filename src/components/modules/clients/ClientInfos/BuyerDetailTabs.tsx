import { useState } from 'react';
import { InfoField } from '../../../ui/InfoField';
import { Progress } from '../../../ui/Progress';
import { Button } from '../../../ui/Button';
import { ClientTimeline } from '../ClientTimeline';
import { ClientTransactionsTab } from '../ClientTransactionsTab';
import { ClientDocumentsView } from '../ClientDocumentsView';
import { ClientContractsTab } from '../ClientContractsTab';
import { ClientMessagesTab } from '../ClientMessagesTab';
import ClientFinancementTab from '../ClientFinancementTab';
import { Client } from '../../../../types/client';
import {
  Home, MapPin, Maximize2, Grid, Clock, User, Briefcase, CheckCircle,
  AlertCircle, Calendar, Sliders, Eye, Sun, Tag, Star, Layers, Compass,
  DollarSign, CreditCard, TrendingUp, FileText, Download, Trash2, Plus,
  RefreshCw, Mail, MessageSquare, Upload, Link
} from 'react-feather';

interface CroisementMatch {
  id: string;
  produit: string;
  prix: number;
  surface: number;
  score: number;
}

const MOCK_CROISEMENTS: CroisementMatch[] = [
  { id: 'p1', produit: 'Maison 3 pièces - Marrakech', prix: 950000, surface: 95, score: 85 },
  { id: 'p2', produit: 'Appartement 2 pièces - Essaouira', prix: 780000, surface: 72, score: 72 },
  { id: 'p3', produit: 'Villa 4 pièces - Marrakech', prix: 1850000, surface: 150, score: 45 },
];

const renderTagList = (items: string[] | undefined, label: string) => {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="text-sm font-medium text-text mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => (
          <span key={item} className="px-2 py-1 text-xs rounded-lg bg-accent/10 text-accent border border-accent/20">
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

function calculateFinancialStatus(budget: number | undefined, financing: number | undefined) {
  if (!budget || !financing) {
    return { percentage: 0, message: 'Informations financières incomplètes' };
  }
  const ratio = (financing / budget) * 100;
  let message = '';
  if (ratio > 80) message = "Excellent capacité d'emprunt";
  else if (ratio > 60) message = "Bonne capacité d'emprunt";
  else if (ratio > 40) message = "Capacité d'emprunt moyenne";
  else message = "Capacité d'emprunt limitée";
  return { percentage: Math.min(100, Math.round(ratio)), message };
}

const TABS = [
  { id: 1, label: 'Critères' },
  { id: 2, label: 'Caractéristiques' },
  { id: 3, label: 'Proximités' },
  { id: 4, label: 'Prestations' },
  { id: 5, label: 'Finances' },
  { id: 6, label: 'Financement' },
  { id: 7, label: 'Mandat' },
  { id: 8, label: 'Croisements' },
  { id: 9, label: 'Documents' },
  { id: 10, label: 'Transactions' },
  { id: 11, label: 'Contrats' },
  { id: 12, label: 'Notes & Activité' },
  { id: 13, label: 'Messages' },
];

const statutFinancementColor = (statut: string | undefined) => {
  switch (statut) {
    case 'En cours': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'Accordé': case 'Accorde': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'Refusé': case 'Refuse': return 'bg-error/10 text-error border-error/20';
    default: return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20';
  }
};

export const BuyerDetailTabs = ({ client: initialClient }: { client: Client }) => {
  const [activeTab, setActiveTab] = useState(1);
  const [client, setClientState] = useState<Client>(initialClient);
  const [selectedProposals, setSelectedProposals] = useState<string[]>([]);
  const [matches, setMatches] = useState<CroisementMatch[]>(MOCK_CROISEMENTS);
  const [events, setEvents] = useState(client.events || []);
  const [newActivityType, setNewActivityType] = useState<'email' | 'appel' | 'visite' | 'autre'>('email');
  const [newActivitySummary, setNewActivitySummary] = useState('');

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
    const hasData = client.propertyType || client.secteur || client.area || client.minSurface || client.prixMin ||
      client.rooms || client.pieces || client.chambres || client.etage !== undefined || client.categorie ||
      client.currentSituation || client.urgency || client.moveInDate || client.surfaceMax || client.prixMax;

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
              <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-accent/10 text-accent border border-accent/20">
                {client.classification}
              </span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {client.categorie && <InfoField label="Catégorie" value={client.categorie} icon={<Tag size={16} className="text-accent" />} />}
          {client.propertyType && <InfoField label="Type de bien recherché" value={client.propertyType} icon={<Home size={16} className="text-accent" />} />}
          <InfoField label="Secteur géographique" value={client.secteur || client.area || 'Non spécifié'} icon={<MapPin size={16} className="text-accent" />} />
          {(client.minSurface || client.surfaceMax) && (
            <InfoField label="Surface" value={`${client.minSurface || '?'} ~ ${client.surfaceMax || '?'} m²`} icon={<Maximize2 size={16} className="text-accent" />} />
          )}
          {(client.prixMin || client.prixMax) && (
            <InfoField label="Budget" value={`${(client.prixMin || 0).toLocaleString()} ~ ${(client.prixMax || 0).toLocaleString()} ${client.devise || 'MAD'}`} icon={<DollarSign size={16} className="text-accent" />} />
          )}
          {(client.pieces || client.chambres) && (
            <InfoField label="Pièces / Chambres" value={`${client.pieces || '?'} pièces / ${client.chambres || '?'} chambres`} icon={<Grid size={16} className="text-accent" />} />
          )}
          {client.rooms && !client.pieces && (
            <InfoField label="Nombre de pièces" value={client.rooms} icon={<Grid size={16} className="text-accent" />} />
          )}
          {client.etage !== undefined && (
            <InfoField label="Étage" value={`${client.etageOperator === 'ge' ? '≥ ' : client.etageOperator === 'le' ? '≤ ' : '= '}${client.etage}`} icon={<Layers size={16} className="text-accent" />} />
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {client.currentSituation && <InfoField label="Situation actuelle" value={client.currentSituation} icon={<User size={16} className="text-accent" />} />}
          {client.urgency && <InfoField label="Urgence" value={client.urgency} icon={<Clock size={16} className="text-accent" />} />}
          {client.moveInDate && (
            <InfoField label="Date souhaitée d'emménagement" value={new Date(client.moveInDate).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className="text-accent" />} />
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
        {client.vue && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.vue && <InfoField label="Vue" value={client.vue} icon={<Eye size={16} className="text-accent" />} />}
            {client.exposition && <InfoField label="Exposition" value={client.exposition} icon={<Sun size={16} className="text-accent" />} />}
            {client.etat && <InfoField label="État" value={client.etat} icon={<Home size={16} className="text-accent" />} />}
            {client.standing && <InfoField label="Standing" value={client.standing} icon={<Star size={16} className="text-accent" />} />}
            {client.disponibilite && <InfoField label="Disponibilité" value={client.disponibilite} icon={<Clock size={16} className="text-accent" />} />}
          </div>
        )}

        {client.attributPrincipal && (
          <div>
            <p className="text-sm font-medium text-text mb-2">Attribut principal</p>
            <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-premium/10 text-premium border border-premium/20">
              {client.attributPrincipal}
            </span>
          </div>
        )}

        {renderTagList(client.attributsPersonnalises, 'Attributs personnalisés')}

        {client.criteres && client.criteres.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <CheckCircle size={16} className="text-accent" />
              Critères de base
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {client.criteres.map(c => (
                <span key={c} className="px-2 py-1 text-xs rounded-lg bg-accent/10 text-accent border border-accent/20">{c}</span>
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
          <MapPin size={16} className="text-accent" />
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
          <Star size={16} className="text-accent" />
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

  const renderFinances = () => {
    const hasData = client.financingType || client.contribution || client.loanDuration ||
      client.capaciteEmprunt || client.banqueSollicitee || client.statutFinancement;

    if (!hasData) return renderEmpty();

    const devise = client.devise || 'MAD';
    const financialStatus = calculateFinancialStatus(client.prixMax || client.budget, client.contribution);

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField label="Type de financement" value={client.financingType || 'Non spécifié'} icon={<CreditCard size={16} className="text-premium" />} />
          {client.loanDuration && (
            <InfoField label="Durée souhaitée" value={`${client.loanDuration} ans`} icon={<Calendar size={16} className="text-premium" />} />
          )}
        </div>

        {client.contribution !== undefined && client.contribution > 0 && (
          <InfoField label="Apport personnel" value={`${client.contribution.toLocaleString('fr-FR')} ${devise}`} icon={<CreditCard size={16} className="text-premium" />} />
        )}

        {client.capaciteEmprunt !== undefined && client.capaciteEmprunt > 0 && (
          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <TrendingUp size={16} className="text-premium" />
                Capacité d'emprunt estimée
              </span>
              <span className="font-semibold">{client.capaciteEmprunt.toLocaleString('fr-FR')} {devise}</span>
            </div>
            <Progress value={financialStatus.percentage} className="h-2 bg-white/10" indicatorColor="bg-premium" />
            <p className="text-xs text-text/60">{financialStatus.message}</p>
          </div>
        )}

        <div className="border-t border-border/30 pt-4 space-y-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Détails du prêt</p>
          {client.banqueSollicitee || client.tauxEnvisage !== undefined || client.statutFinancement || client.dateObtentionPret || client.attestationPretUrl ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {client.banqueSollicitee && <InfoField label="Banque sollicitée" value={client.banqueSollicitee} icon={<Briefcase size={16} className="text-premium" />} />}
                {client.tauxEnvisage !== undefined && <InfoField label="Taux envisagé" value={`${client.tauxEnvisage} %`} icon={<TrendingUp size={16} className="text-premium" />} />}
                {client.statutFinancement && (
                  <div className="p-4 rounded-xl bg-background">
                    <div className="flex items-center gap-2 text-xs text-text-secondary mb-1">
                      <AlertCircle size={14} />
                      <span>Statut du financement</span>
                    </div>
                    <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-lg border ${statutFinancementColor(client.statutFinancement)}`}>
                      {client.statutFinancement}
                    </span>
                  </div>
                )}
                {client.dateObtentionPret && (
                  <InfoField label="Date d'obtention du prêt" value={new Date(client.dateObtentionPret).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className="text-premium" />} />
                )}
              </div>
              {client.attestationPretUrl && (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50">
                  <FileText size={16} className="text-accent" />
                  <span className="text-sm text-text flex-1">Attestation de prêt</span>
                  <a href={client.attestationPretUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-all flex items-center gap-1.5">
                    <Download size={12} /> Voir
                  </a>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-text-secondary/60 py-2">Aucun détail de prêt renseigné</p>
          )}
        </div>
      </div>
    );
  };

  const renderMandat = () => {
    if (!client.numeroMandat) return renderEmpty();

    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
          <Layers size={16} className="text-accent" />
          Mandat de recherche
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField label="Numéro de mandat" value={client.numeroMandat || 'Non spécifié'} icon={<Tag size={16} className="text-accent" />} />
          {client.statutMandat && <InfoField label="Statut" value={client.statutMandat} icon={<Clock size={16} className="text-accent" />} />}
          {client.typeMandat && <InfoField label="Type" value={client.typeMandat} icon={<Compass size={16} className="text-accent" />} />}
          {client.dateSignature && <InfoField label="Date signature" value={new Date(client.dateSignature).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className="text-accent" />} />}
          {client.dateDebut && <InfoField label="Date début" value={new Date(client.dateDebut).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className="text-accent" />} />}
          {client.dateExpiration && <InfoField label="Date expiration" value={new Date(client.dateExpiration).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className="text-accent" />} />}
          {client.agentDesigne && <InfoField label="Agent désigné" value={client.agentDesigne} icon={<User size={16} className="text-accent" />} />}
          {client.conjoint && <InfoField label="Conjoint" value={client.conjoint} icon={<User size={16} className="text-accent" />} />}
          {client.societe && <InfoField label="Société" value={client.societe} icon={<Briefcase size={16} className="text-accent" />} />}
          {client.typeRemuneration && <InfoField label="Type rémunération" value={client.typeRemuneration} icon={<DollarSign size={16} className="text-accent" />} />}
          {client.montantRemuneration && (
            <InfoField label="Montant" value={`${client.montantRemuneration.toLocaleString()} ${client.devise || 'MAD'}`} icon={<DollarSign size={16} className="text-accent" />} />
          )}
          {client.conditionPaiement && <InfoField label="Condition de paiement" value={client.conditionPaiement} icon={<DollarSign size={16} className="text-accent" />} />}
          {client.dureeProtection && <InfoField label="Durée de protection" value={`${client.dureeProtection} mois`} icon={<Clock size={16} className="text-accent" />} />}
        </div>

        {client.mandatPdfUrl && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50 mt-4">
            <Link size={16} className="text-accent" />
            <span className="text-sm text-text flex-1">Mandat signé (PDF)</span>
            <a href={client.mandatPdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-all flex items-center gap-1.5">
              <Download size={12} /> Ouvrir
            </a>
          </div>
        )}
      </div>
    );
  };

  const renderCroisements = () => {
    const toggleProposal = (id: string) => {
      setSelectedProposals(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            {matches.length} bien{matches.length > 1 ? 's' : ''} correspondant{matches.length > 1 ? 's' : ''} aux critères
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={() => setMatches([...MOCK_CROISEMENTS])}>
              Relancer le croisement
            </Button>
            {selectedProposals.length > 0 && (
              <Button variant="default" size="sm" icon={<Mail size={14} />}>
                Envoyer les propositions ({selectedProposals.length})
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary w-10">
                  <input
                    type="checkbox"
                    checked={selectedProposals.length === matches.length && matches.length > 0}
                    onChange={() => {
                      if (selectedProposals.length === matches.length) {
                        setSelectedProposals([]);
                      } else {
                        setSelectedProposals(matches.map(m => m.id));
                      }
                    }}
                    className="rounded border-border"
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Produit</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">Prix</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">Surface</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary">Score</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {matches.map(m => (
                <tr key={m.id} className={`hover:bg-background/50 transition-colors ${selectedProposals.includes(m.id) ? 'bg-accent/5' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedProposals.includes(m.id)}
                      onChange={() => toggleProposal(m.id)}
                      className="rounded border-border"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-text">{m.produit}</td>
                  <td className="px-4 py-3 text-right text-text">{m.prix.toLocaleString()} MAD</td>
                  <td className="px-4 py-3 text-right text-text">{m.surface} m²</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                      m.score >= 80 ? 'bg-emerald-500/10 text-emerald-500' :
                      m.score >= 60 ? 'bg-amber-500/10 text-amber-500' :
                      'bg-text-secondary/10 text-text-secondary'
                    }`}>
                      {m.score}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm">Voir</Button>
                      <Button variant="ghost" size="sm">Proposer</Button>
                      <Button variant="ghost" size="sm" className="text-error hover:text-error">Refuser</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDocuments = () => (
    <ClientDocumentsView client={client} />
  );

  const renderTransactions = () => (
    <ClientTransactionsTab clientId={client.id} clientName={client.name} clientType={client.type} />
  );

  const renderContrats = () => (
    <ClientContractsTab clientId={client.id} clientName={client.name} />
  );

  const renderNotesActivite = () => {
    const handleAddActivity = () => {
      if (!newActivitySummary.trim()) return;
      const newEvent = {
        id: `event-${Date.now()}`,
        type: newActivityType as 'appel' | 'email' | 'visite' | 'contrat' | 'autre',
        date: new Date().toISOString(),
        summary: newActivitySummary.trim(),
        agent: 'John Doe',
      };
      const updated = [newEvent, ...events];
      setEvents(updated);
      updateClient({ events: updated });
      setNewActivitySummary('');
    };

    const mapType = (t: string): 'email' | 'call' | 'meeting' | 'property_visit' => {
      switch (t) {
        case 'appel': return 'call';
        case 'visite': return 'property_visit';
        case 'contrat': case 'autre': return 'meeting';
        default: return 'email';
      }
    };
    const mappedEvents = events.map(e => ({ ...e, type: mapType(e.type) }));

    return (
      <div className="space-y-5">
        {/* Add activity form */}
        <div className="p-4 rounded-xl bg-background border border-border/50">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Ajouter une activité</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {(['email', 'appel', 'visite', 'autre'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setNewActivityType(type)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                  newActivityType === type
                    ? 'bg-accent text-white border-accent'
                    : 'bg-card text-text-secondary border-border hover:border-accent/50'
                }`}
              >
                {type === 'email' ? 'Email' : type === 'appel' ? 'Appel' : type === 'visite' ? 'Visite' : 'Autre'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newActivitySummary}
              onChange={(e) => setNewActivitySummary(e.target.value)}
              placeholder="Résumé de l'activité..."
              className="flex-1 h-9 px-3 text-sm rounded-lg border border-border bg-card text-text placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddActivity(); }}
            />
            <Button size="sm" icon={<Plus size={14} />} onClick={handleAddActivity} disabled={!newActivitySummary.trim()}>
              Ajouter
            </Button>
          </div>
        </div>

        {client.notes && (
          <div>
            <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
              <Tag size={16} className="text-accent" />
              Notes
            </h3>
            <p className="text-sm text-text/80 bg-white/5 p-3 rounded-glass">{client.notes}</p>
          </div>
        )}

        <div>
          <ClientTimeline events={mappedEvents} />
        </div>
      </div>
    );
  };

  const renderMessages = () => (
    <ClientMessagesTab clientId={client.id} clientName={client.name} />
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 1: return renderCriteres();
      case 2: return renderCaracteristiques();
      case 3: return renderProximites();
      case 4: return renderPrestations();
      case 5: return renderFinances();
      case 6: return <ClientFinancementTab client={client} />;
      case 7: return renderMandat();
      case 8: return renderCroisements();
      case 9: return renderDocuments();
      case 10: return renderTransactions();
      case 11: return renderContrats();
      case 12: return renderNotesActivite();
      case 13: return renderMessages();
      default: return null;
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card mt-4">
      <div className="px-6 border-b border-border/30 flex gap-1 overflow-x-auto rounded-t-xl">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.id ? 'text-accent border-accent' : 'text-text-secondary border-transparent hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-5">
        {renderTabContent()}
      </div>
    </div>
  );
};
