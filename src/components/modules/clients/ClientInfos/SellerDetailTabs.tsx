import { useState } from 'react';
import { InfoField } from '../../../ui/InfoField';
import { Button } from '../../../ui/Button';
import { ClientTimeline } from '../ClientTimeline';
import { ClientTransactionsTab } from '../ClientTransactionsTab';
import { ClientDocumentsView } from '../ClientDocumentsView';
import { ClientContractsTab } from '../ClientContractsTab';
import { ClientMessagesTab } from '../ClientMessagesTab';
import { Client } from '../../../../types/client';
import {
  Home, MapPin, Maximize2, Grid, Clock, User, Briefcase, CheckCircle,
  AlertCircle, Calendar, Sliders, Eye, Sun, Tag, Star, Layers, Compass,
  DollarSign, CreditCard, FileText, Download, Trash2, Plus,
  Mail, RefreshCw, Link, Award, Hexagon
} from 'react-feather';

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

const TABS = [
  { id: 1, label: 'Infos' },
  { id: 2, label: 'Caractéristiques' },
  { id: 3, label: 'Prix & Diagnostics' },
  { id: 4, label: 'Proximités' },
  { id: 5, label: 'Prestations' },
  { id: 6, label: 'Situation' },
  { id: 7, label: 'Mandat' },
  { id: 8, label: 'Documents' },
  { id: 9, label: 'Transactions' },
  { id: 10, label: 'Contrats' },
  { id: 11, label: 'Notes & Activité' },
  { id: 12, label: 'Messages' },
];

const statutHonorairesColor = (val: string | undefined) => {
  switch (val) {
    case 'Inclus dans le prix': case 'inclus': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'En sus du prix': case 'en_sus': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    default: return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20';
  }
};

export const SellerDetailTabs = ({ client: initialClient }: { client: Client }) => {
  const [activeTab, setActiveTab] = useState(1);
  const [client, setClientState] = useState<Client>(initialClient);
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

  const renderInfos = () => {
    const hasData = client.propertyType || client.secteur || client.area || client.categorie ||
      client.statutMetier || client.classification || client.categorie;

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
          {client.propertyType && <InfoField label="Type de bien" value={client.propertyType} icon={<Home size={16} className="text-accent" />} />}
          <InfoField label="Secteur" value={client.secteur || client.area || 'Non spécifié'} icon={<MapPin size={16} className="text-accent" />} />
          {(client.prixMin || client.prixMax) && (
            <InfoField label="Prix indicatif" value={`${(client.prixMin || 0).toLocaleString()} ~ ${(client.prixMax || 0).toLocaleString()} ${client.devise || 'MAD'}`} icon={<DollarSign size={16} className="text-accent" />} />
          )}
          {(client.minSurface || client.surfaceMax) && (
            <InfoField label="Surface" value={`${client.minSurface || '?'} ~ ${client.surfaceMax || '?'} m²`} icon={<Maximize2 size={16} className="text-accent" />} />
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
          {client.vue && <InfoField label="Vue" value={client.vue} icon={<Eye size={16} className="text-accent" />} />}
          {client.exposition && <InfoField label="Exposition" value={client.exposition} icon={<Sun size={16} className="text-accent" />} />}
          {client.etat && <InfoField label="État" value={client.etat} icon={<Home size={16} className="text-accent" />} />}
          {client.standing && <InfoField label="Standing" value={client.standing} icon={<Star size={16} className="text-accent" />} />}
          {client.disponibilite && <InfoField label="Disponibilité" value={client.disponibilite} icon={<Clock size={16} className="text-accent" />} />}
        </div>

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

  const renderPrixDiagnostics = () => {
    const hasPrix = client.prixMin || client.prixMax;
    if (!hasPrix) return renderEmpty();

    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
            <DollarSign size={16} className="text-premium" />
            Prix et honoraires
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(client.prixMin || client.prixMax) && (
              <InfoField label="Prix net vendeur" value={`${(client.prixMin || 0).toLocaleString()} ~ ${(client.prixMax || 0).toLocaleString()} ${client.devise || 'MAD'}`} icon={<DollarSign size={16} className="text-premium" />} highlight />
            )}
            {client.typeRemuneration && (
              <InfoField label="Type d'honoraires" value={client.typeRemuneration} icon={<Tag size={16} className="text-premium" />} />
            )}
            {client.montantRemuneration && (
              <InfoField label="Montant des honoraires" value={`${client.montantRemuneration}${client.typeRemuneration === 'Pourcentage' ? '%' : ` ${client.devise || 'MAD'}`}`} icon={<CreditCard size={16} className="text-premium" />} />
            )}
            {client.conditionPaiement && (
              <InfoField label="Commission de co-agencement" value={client.conditionPaiement} icon={<Award size={16} className="text-premium" />} />
            )}
          </div>
        </div>

        <div className="border-t border-border/30 pt-4">
          <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
            <Hexagon size={16} className="text-premium" />
            Diagnostics obligatoires
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-background">
              <div className="flex items-center gap-2 text-xs text-text-secondary mb-1">
                <FileText size={14} />
                <span>DPE - Classe énergétique</span>
              </div>
              <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-lg border bg-accent/10 text-accent border-accent/20">
                {client.standing ? 'Non renseigné' : 'Non renseigné'}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-background">
              <div className="flex items-center gap-2 text-xs text-text-secondary mb-1">
                <Calendar size={14} />
                <span>DPE - Date de réalisation</span>
              </div>
              <span className="text-sm text-text">Non renseigné</span>
            </div>
            <div className="p-4 rounded-xl bg-background">
              <div className="flex items-center gap-2 text-xs text-text-secondary mb-1">
                <Calendar size={14} />
                <span>Constats risques - Date</span>
              </div>
              <span className="text-sm text-text">Non renseigné</span>
            </div>
            <div className="p-4 rounded-xl bg-background">
              <div className="flex items-center gap-2 text-xs text-text-secondary mb-1">
                <Calendar size={14} />
                <span>Diagnostic plomb - Date</span>
              </div>
              <span className="text-sm text-text">Non renseigné</span>
            </div>
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

  const renderSituation = () => {
    const hasData = client.currentSituation || client.reasonForSelling;
    if (!hasData) return renderEmpty();

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {client.currentSituation && (
            <InfoField label="Situation actuelle" value={client.currentSituation} icon={<User size={16} className="text-accent" />} />
          )}
          {client.reasonForSelling && (
            <InfoField label="Raison de la vente" value={client.reasonForSelling} icon={<Briefcase size={16} className="text-accent" />} />
          )}
        </div>
        {client.notes && (
          <div className="p-4 rounded-xl bg-background border border-border/30">
            <p className="text-xs font-medium text-text-secondary mb-1">Notes sur la situation</p>
            <p className="text-sm text-text">{client.notes}</p>
          </div>
        )}
      </div>
    );
  };

  const renderMandat = () => {
    if (!client.numeroMandat) return renderEmpty();

    return (
      <div className="space-y-5">
        <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
          <Layers size={16} className="text-accent" />
          Mandat de vente
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField label="Numéro de mandat" value={client.numeroMandat} icon={<Tag size={16} className="text-accent" />} />
          {client.statutMandat && <InfoField label="Statut du mandat" value={client.statutMandat} icon={<Clock size={16} className="text-accent" />} />}
          {client.typeMandat && <InfoField label="Type de mandat" value={client.typeMandat} icon={<Compass size={16} className="text-accent" />} />}
          {client.dateSignature && <InfoField label="Date signature" value={new Date(client.dateSignature).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className="text-accent" />} />}
          {client.dateDebut && <InfoField label="Date début" value={new Date(client.dateDebut).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className="text-accent" />} />}
          {client.dateExpiration && <InfoField label="Date expiration" value={new Date(client.dateExpiration).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className="text-accent" />} />}
          {client.agentDesigne && <InfoField label="Agent désigné" value={client.agentDesigne} icon={<User size={16} className="text-accent" />} />}
          {client.conjoint && <InfoField label="Conjoint" value={client.conjoint} icon={<User size={16} className="text-accent" />} />}
          {client.dureeProtection && <InfoField label="Clause de protection" value={`${client.dureeProtection} mois`} icon={<Clock size={16} className="text-accent" />} />}
        </div>

        <div className="border-t border-border/30 pt-4">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Informations financières du mandat</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(client.prixMin || client.prixMax) && (
              <InfoField label="Prix net vendeur" value={`${(client.prixMin || 0).toLocaleString()} ~ ${(client.prixMax || 0).toLocaleString()} ${client.devise || 'MAD'}`} icon={<DollarSign size={16} className="text-premium" />} />
            )}
            {client.typeRemuneration && <InfoField label="Type d'honoraires" value={client.typeRemuneration} icon={<Tag size={16} className="text-premium" />} />}
            {client.montantRemuneration && (
              <InfoField label="Montant des honoraires" value={`${client.montantRemuneration}${typeof client.montantRemuneration === 'number' && client.montantRemuneration < 100 ? '%' : ` ${client.devise || 'MAD'}`}`} icon={<CreditCard size={16} className="text-premium" />} />
            )}
            {client.conditionPaiement && <InfoField label="Commission co-agencement" value={client.conditionPaiement} icon={<Award size={16} className="text-premium" />} />}
          </div>
        </div>

        {client.mandatPdfUrl && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50">
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
      case 1: return renderInfos();
      case 2: return renderCaracteristiques();
      case 3: return renderPrixDiagnostics();
      case 4: return renderProximites();
      case 5: return renderPrestations();
      case 6: return renderSituation();
      case 7: return renderMandat();
      case 8: return renderDocuments();
      case 9: return renderTransactions();
      case 10: return renderContrats();
      case 11: return renderNotesActivite();
      case 12: return renderMessages();
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
