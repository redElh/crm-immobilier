import { useState, useEffect } from 'react';
import { Dialog } from '../../ui/Dialog';
import { Button } from '../../ui/Button';
import { Search, X, User, Check, Download, AlertCircle } from 'react-feather';
import { Client } from '../../../types/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (client: Client) => void;
}

const formatMontant = (v: number) => v.toLocaleString('fr-FR');

const FALLBACK_ACHETEURS: Client[] = [
  {
    id: '1', name: 'Pierre Martin', type: 'Acheteur', status: 'Actif',
    phone: '+33 6 12 34 56 78', email: 'pierre.martin@example.com',
    contribution: 300000, financingType: 'Pret bancaire', loanDuration: 20,
    capaciteEmprunt: 520000, createdAt: '2025-06-01', updatedAt: '2025-06-15', createdBy: 'system',
  },
  {
    id: '2', name: 'Marie Lambert', type: 'Acheteur', status: 'Actif',
    phone: '+33 6 98 76 54 32', email: 'marie.lambert@example.com',
    contribution: 500000, financingType: 'Pret bancaire', loanDuration: 25,
    createdAt: '2025-05-15', updatedAt: '2025-06-10', createdBy: 'system',
  },
  {
    id: '3', name: 'Karim Benali', type: 'Acheteur', status: 'En négociation',
    phone: '+212 6 54 32 10 98', email: 'karim.benali@example.com',
    contribution: 150000, financingType: 'Cash', loanDuration: 0,
    revenusMensuelsNets: 25000, chargesCredit: 1500,
    createdAt: '2025-04-20', updatedAt: '2025-06-12', createdBy: 'system',
  },
  {
    id: '4', name: 'Sophie Laurent', type: 'Acheteur', status: 'Actif',
    phone: '+33 6 23 45 67 89', email: 'sophie.laurent@example.com',
    contribution: 400000, financingType: 'Mixte', loanDuration: 15,
    revenusMensuelsNets: 18000, revenusSupplementaires: 3000,
    chargesCredit: 2500, chargesFixes: 600, banqueSollicitee: 'Attijariwafa',
    createdAt: '2025-03-10', updatedAt: '2025-06-08', createdBy: 'system',
  },
  {
    id: '5', name: 'Ahmed Benali', type: 'Acheteur', status: 'Actif',
    phone: '+212 6 12 34 56 70', email: 'ahmed@benali.com',
    contribution: 200000, financingType: 'Pret bancaire', loanDuration: 20,
    revenusMensuelsNets: 15000, revenusSupplementaires: 3000,
    chargesCredit: 2500, chargesFixes: 600, montantPretSouhaite: 1200000,
    tauxEnvisage: 3.5, assuranceEmprunteur: 0.36, banqueSollicitee: 'Attijariwafa',
    statutFinancement: 'En cours',
    createdAt: '2025-02-15', updatedAt: '2025-06-01', createdBy: 'system',
  },
];

function getFinancingLabel(type?: string) {
  if (!type) return '-';
  const v = type.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (v.includes('cash') || v.includes('comptant')) return 'Comptant';
  if (v.includes('apport')) return 'Apport personnel';
  if (v.includes('mixte') || v.includes('autre')) return 'Autre';
  if (v.includes('pret') || v.includes('bancaire')) return 'Prêt bancaire';
  return type;
}

function getFinancingBadgeClass(type?: string) {
  const label = getFinancingLabel(type);
  switch (label) {
    case 'Prêt bancaire': return 'bg-accent/10 text-accent border-accent/20';
    case 'Comptant': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'Apport personnel': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'Autre': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    default: return 'bg-background text-text-secondary border-border/50';
  }
}

export default function ImportClientModal({ isOpen, onClose, onImport }: Props) {
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedClient(null);
      fetchBuyers();
    }
  }, [isOpen]);

  const fetchBuyers = async () => {
    setLoading(true);
    setUsingFallback(false);
    try {
      const { fetchClients } = await import('../../../services/clientService');
      const data = await fetchClients({ type: 'Acheteur' });
      const list = Array.isArray(data) ? data : [];
      if (list.length > 0) {
        setAllClients(list);
        setClients(list);
      } else {
        setAllClients(FALLBACK_ACHETEURS);
        setClients(FALLBACK_ACHETEURS);
        setUsingFallback(true);
      }
    } catch {
      setAllClients(FALLBACK_ACHETEURS);
      setClients(FALLBACK_ACHETEURS);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  const filtered = search
    ? allClients.filter(c => {
        const q = search.toLowerCase();
        return (c.name || '').toLowerCase().includes(q)
          || (c.email || '').toLowerCase().includes(q)
          || (c.phone || '').toLowerCase().includes(q);
      })
    : allClients;

  const handleImport = () => {
    if (selectedClient) {
      onImport(selectedClient);
      onClose();
    }
  };

  const inputClass = "w-full h-9 px-3 text-sm rounded-lg border border-border bg-card text-text placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent";

  const showFinancial = (c: Client) => c.revenusMensuelsNets || c.revenusSupplementaires || c.chargesCredit || c.chargesFixes || c.montantPretSouhaite || c.tauxEnvisage || c.loanDuration || c.contribution || c.banqueSollicitee || c.statutFinancement || c.assuranceEmprunteur;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Importer depuis la fiche acheteur" size="2xl">
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-background border border-border/50">
          <p className="text-xs text-text-secondary mb-1">Rechercher un acheteur</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`${inputClass} pl-9`}
                placeholder="Par nom, email ou téléphone..."
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => { setSearch(''); fetchBuyers(); }}>
              Réinitialiser
            </Button>
          </div>
        </div>

        {usingFallback && allClients.length > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 text-xs text-amber-700 dark:text-amber-400">
            <AlertCircle size={14} />
            <span>Affichage des données de démonstration. Aucun acheteur trouvé dans la base de données.</span>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-text-secondary mb-2">
            Liste des acheteurs {filtered.length > 0 && `(${filtered.length})`}
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-text-secondary">
              Chargement...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-text-secondary">
              Aucun acheteur trouvé
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-background sticky top-0">
                  <tr className="border-b border-border">
                    <th className="w-10 px-3 py-2" />
                    <th className="text-left px-3 py-2 text-xs font-medium text-text-secondary">Client</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-text-secondary">Email</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-text-secondary">Téléphone</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-text-secondary">Financement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(c => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedClient(c)}
                      className={`cursor-pointer transition-colors ${
                        selectedClient?.id === c.id
                          ? 'bg-accent/5 border-l-2 border-l-accent'
                          : 'hover:bg-background/50'
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedClient?.id === c.id
                            ? 'border-accent bg-accent'
                            : 'border-border'
                        }`}>
                          {selectedClient?.id === c.id && (
                            <Check size={10} className="text-white" />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-medium">
                            {(c.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-text text-sm">{c.name}</span>
                            {c.status && (
                              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-background text-text-secondary border border-border/50">
                                {c.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-text-secondary text-xs">{c.email || '-'}</td>
                      <td className="px-3 py-2.5 text-text-secondary text-xs">{c.phone || '-'}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-lg border ${getFinancingBadgeClass(c.financingType)}`}>
                          {getFinancingLabel(c.financingType)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedClient && (
          <div className="p-4 rounded-lg border border-border/50 bg-background space-y-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Download size={14} />
              Données à importer
            </p>
            {showFinancial(selectedClient) ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-premium shrink-0" />
                  <span className="text-xs text-text-secondary">Revenus mensuels nets</span>
                  <span className="text-xs font-medium ml-auto">{selectedClient.revenusMensuelsNets ? formatMontant(selectedClient.revenusMensuelsNets) + ' MAD' : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-premium shrink-0" />
                  <span className="text-xs text-text-secondary">Revenus supplémentaires</span>
                  <span className="text-xs font-medium ml-auto">{selectedClient.revenusSupplementaires ? formatMontant(selectedClient.revenusSupplementaires) + ' MAD' : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-premium shrink-0" />
                  <span className="text-xs text-text-secondary">Charges de crédit</span>
                  <span className="text-xs font-medium ml-auto">{selectedClient.chargesCredit ? formatMontant(selectedClient.chargesCredit) + ' MAD' : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-premium shrink-0" />
                  <span className="text-xs text-text-secondary">Charges fixes</span>
                  <span className="text-xs font-medium ml-auto">{selectedClient.chargesFixes ? formatMontant(selectedClient.chargesFixes) + ' MAD' : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-premium shrink-0" />
                  <span className="text-xs text-text-secondary">Montant prêt souhaité</span>
                  <span className="text-xs font-medium ml-auto">{selectedClient.montantPretSouhaite ? formatMontant(selectedClient.montantPretSouhaite) + ' MAD' : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-premium shrink-0" />
                  <span className="text-xs text-text-secondary">Taux envisagé</span>
                  <span className="text-xs font-medium ml-auto">{selectedClient.tauxEnvisage ? selectedClient.tauxEnvisage + '%' : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-premium shrink-0" />
                  <span className="text-xs text-text-secondary">Durée du prêt</span>
                  <span className="text-xs font-medium ml-auto">{selectedClient.loanDuration ? selectedClient.loanDuration + ' ans' : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-premium shrink-0" />
                  <span className="text-xs text-text-secondary">Assurance emprunteur</span>
                  <span className="text-xs font-medium ml-auto">{selectedClient.assuranceEmprunteur ? selectedClient.assuranceEmprunteur + '%' : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-premium shrink-0" />
                  <span className="text-xs text-text-secondary">Apport personnel</span>
                  <span className="text-xs font-medium ml-auto">{selectedClient.contribution ? formatMontant(selectedClient.contribution) + ' MAD' : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-premium shrink-0" />
                  <span className="text-xs text-text-secondary">Banque sollicitée</span>
                  <span className="text-xs font-medium ml-auto">{selectedClient.banqueSollicitee || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-premium shrink-0" />
                  <span className="text-xs text-text-secondary">Statut financement</span>
                  <span className="text-xs font-medium ml-auto">{selectedClient.statutFinancement || '-'}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-800/20">
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertCircle size={12} />
                  Ce client n'a pas de données financières détaillées. Seules les informations de base seront importées.
                </p>
              </div>
            )}
            <div className="pt-2 flex items-center gap-2 text-xs text-text-secondary border-t border-border/30">
              <User size={12} />
              <span>Client sélectionné : </span>
              <span className="font-medium text-text">{selectedClient.name}</span>
              <span className="text-text-secondary/60">|</span>
              <span>Financement : </span>
              <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-lg border ${getFinancingBadgeClass(selectedClient.financingType)}`}>
                {getFinancingLabel(selectedClient.financingType)}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            icon={<Download size={14} />}
            onClick={handleImport}
            disabled={!selectedClient}
          >
            Importer les données
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
