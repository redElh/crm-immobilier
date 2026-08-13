import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DollarSign, CreditCard, TrendingUp, Percent, Calendar, Clock,
  Search, Download, RefreshCw, ChevronDown, ChevronUp, Sliders,
  Mail, FileText, Save, Eye, Trash2, User, CheckCircle,
  Info, Briefcase, Home, AlertCircle, ExternalLink,
  BarChart2, PieChart
} from 'react-feather';
import { Button } from '../../components/ui/Button';
import {
  calculerCapaciteEmprunt, calculerMensualite,
  genererAmortissement, genererId,
  SimulationRecord, AmortizationRow,
  CapaciteResult, MensualiteResult
} from '../../types/pret';
import { Client } from '../../types/client';
import AmortizationChart from '../../components/modules/pret/AmortizationChart';
import SimulationDetailModal from '../../components/modules/pret/SimulationDetailModal';
import EmailModal from '../../components/modules/pret/EmailModal';
import SaveToClientModal from '../../components/modules/pret/SaveToClientModal';
import ImportClientModal from '../../components/modules/pret/ImportClientModal';
import {
  fetchSimulations, createSimulation, deleteSimulation
} from '../../services/simulationService';

const formatMontant = (v: number) => v.toLocaleString('fr-FR');

const inputClass = "w-full h-9 px-3 text-sm rounded-lg border border-border bg-card text-text placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all";
const labelClass = "text-xs font-medium text-text-secondary";
const cardClass = "bg-card rounded-xl border border-border/50 shadow-card p-5";

const resultCardClass = "mt-3 p-4 rounded-lg bg-gradient-to-br from-background to-background/80 border border-border/50";

function normalizeFinancingType(t?: string): string {
  if (!t) return 'Pret bancaire';
  const v = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (v.includes('cash') || v.includes('comptant')) return 'Comptant';
  if (v.includes('apport')) return 'Apport personnel';
  if (v.includes('mixte') || v.includes('autre') || v.includes('autre')) return 'Autre';
  return 'Pret bancaire';
}

const FINANCING_DISPLAY: Record<string, string> = {
  'Pret bancaire': 'Prêt bancaire',
  'Apport personnel': 'Apport personnel',
  'Comptant': 'Comptant',
  'Autre': 'Autre',
};

function getRevenusAnnuels(client: Client): number {
  const mensuels = (client.revenusMensuelsNets || 0) + (client.revenusSupplementaires || 0);
  const charges = (client.chargesCredit || 0) + (client.chargesFixes || 0);
  return Math.max(0, (mensuels - charges) * 12);
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="p-3 rounded-lg bg-background border border-border/50">
      <p className="text-xs text-text-secondary flex items-center gap-1 mb-0.5">{icon} {label}</p>
      <p className={`text-sm font-semibold ${color || 'text-text'}`}>{value}</p>
    </div>
  );
}

function InputWithLabel({ label, value, onChange, suffix, step }: {
  label: string; value: number; onChange: (v: number) => void; suffix: string; step?: string;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="relative">
        <input
          type="number"
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className={inputClass}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-secondary font-medium">{suffix}</span>
      </div>
    </div>
  );
}

export default function PretPage() {
  const { agentId, adminId } = useParams();
  const navigate = useNavigate();
  const userId = agentId || adminId || '';
  const isAdmin = !!adminId;

  const [simulations, setSimulations] = useState<SimulationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [capaciteRevenus, setCapaciteRevenus] = useState(600000);
  const [capaciteEndettement, setCapaciteEndettement] = useState(33);
  const [capaciteApport, setCapaciteApport] = useState(200000);
  const [capaciteTaux, setCapaciteTaux] = useState(3.5);
  const [capaciteDuree, setCapaciteDuree] = useState(20);
  const [capaciteResult, setCapaciteResult] = useState<CapaciteResult | null>(null);

  const [mensualitePrix, setMensualitePrix] = useState(1500000);
  const [mensualiteFrais, setMensualiteFrais] = useState(75000);
  const [mensualiteApport, setMensualiteApport] = useState(200000);
  const [mensualiteTaux, setMensualiteTaux] = useState(3.5);
  const [mensualiteDuree, setMensualiteDuree] = useState(20);
  const [mensualiteResult, setMensualiteResult] = useState<MensualiteResult | null>(null);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [assurance, setAssurance] = useState(0.36);
  const [fraisDossier, setFraisDossier] = useState(1500);
  const [garantie, setGarantie] = useState(2);

  const [selectedSim, setSelectedSim] = useState<SimulationRecord | null>(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [capaciteAmortissement, setCapaciteAmortissement] = useState<AmortizationRow[] | null>(null);
  const [mensualiteAmortissement, setMensualiteAmortissement] = useState<AmortizationRow[] | null>(null);

  const loadSimulations = useCallback(async () => {
    try {
      const data = await fetchSimulations();
      setSimulations(Array.isArray(data) ? data : []);
    } catch {
      setSimulations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSimulations();
  }, [loadSimulations]);

  const handleImportClient = (client: Client) => {
    setSelectedClient(client);
    const revenusAnnuels = getRevenusAnnuels(client);
    setCapaciteRevenus(revenusAnnuels || 600000);
    if (client.contribution) setCapaciteApport(client.contribution);
    if (client.tauxEnvisage) {
      setCapaciteTaux(client.tauxEnvisage);
      setMensualiteTaux(client.tauxEnvisage);
    }
    if (client.loanDuration) {
      setCapaciteDuree(client.loanDuration);
      setMensualiteDuree(client.loanDuration);
    }
    if (client.assuranceEmprunteur) setAssurance(client.assuranceEmprunteur);
    if (client.montantPretSouhaite) setMensualitePrix(client.montantPretSouhaite);

    setCapaciteResult(null);
    setMensualiteResult(null);
    setCapaciteAmortissement(null);
    setMensualiteAmortissement(null);
  };

  const handleCalculCapacite = () => {
    const r = calculerCapaciteEmprunt(capaciteRevenus, capaciteEndettement, capaciteApport, capaciteTaux, capaciteDuree);
    setCapaciteResult(r);
    const amort = genererAmortissement(r.capaciteEmprunt, capaciteTaux, capaciteDuree);
    setCapaciteAmortissement(amort);
    setMensualiteResult(null);
    setMensualiteAmortissement(null);
  };

  const handleCalculMensualite = () => {
    const r = calculerMensualite(mensualitePrix, mensualiteFrais, mensualiteApport, mensualiteTaux, mensualiteDuree, assurance);
    setMensualiteResult(r);
    const montantEmprunte = mensualitePrix + mensualiteFrais - mensualiteApport;
    if (montantEmprunte > 0) {
      setMensualiteAmortissement(genererAmortissement(montantEmprunte, mensualiteTaux, mensualiteDuree));
    }
    setCapaciteResult(null);
    setCapaciteAmortissement(null);
  };

  const handleSaveSimulation = async (type: 'capacite' | 'mensualite') => {
    const cResult = capaciteResult;
    const mResult = mensualiteResult;
    if (type === 'capacite' && !cResult) return;
    if (type === 'mensualite' && !mResult) return;

    const payload: Record<string, unknown> = {
      type,
      financingType: normalizeFinancingType(selectedClient?.financingType),
      clientId: selectedClient?.id || undefined,
      clientName: selectedClient?.name || '',
      clientEmail: selectedClient?.email || '',
      apport: type === 'capacite' ? capaciteApport : mensualiteApport,
      tauxInteret: type === 'capacite' ? capaciteTaux : mensualiteTaux,
      dureeAnnees: type === 'capacite' ? capaciteDuree : mensualiteDuree,
      createdBy: userId,
    };

    if (type === 'capacite') {
      payload.revenus = capaciteRevenus;
      payload.capacite = cResult!.capaciteEmprunt;
      payload.endettementMax = capaciteEndettement;
    } else {
      payload.prixBien = mensualitePrix;
      payload.mensualite = mResult!.mensualite;
      payload.fraisNotaire = mensualiteFrais;
      payload.tauxAssurance = assurance;
      payload.fraisDossier = fraisDossier;
      payload.garantie = garantie;
    }

    try {
      const created = await createSimulation(payload);
      setSimulations(prev => [created, ...prev]);
      if (type === 'capacite') {
        setCapaciteResult(null);
        setCapaciteAmortissement(null);
      } else {
        setMensualiteResult(null);
        setMensualiteAmortissement(null);
      }
    } catch (err) {
      console.error('Failed to save simulation:', err);
    }
  };

  const handleDeleteSimulation = async (id: string) => {
    try {
      await deleteSimulation(id);
      setSimulations(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed to delete simulation:', err);
    }
  };

  const handleReset = () => {
    setSelectedClient(null);
    setCapaciteRevenus(600000);
    setCapaciteEndettement(33);
    setCapaciteApport(200000);
    setCapaciteTaux(3.5);
    setCapaciteDuree(20);
    setCapaciteResult(null);
    setCapaciteAmortissement(null);
    setMensualitePrix(1500000);
    setMensualiteFrais(75000);
    setMensualiteApport(200000);
    setMensualiteTaux(3.5);
    setMensualiteDuree(20);
    setMensualiteResult(null);
    setMensualiteAmortissement(null);
    setAssurance(0.36);
    setFraisDossier(1500);
    setGarantie(2);
    setShowAdvanced(false);
  };

  const financingType = normalizeFinancingType(selectedClient?.financingType);
  const showFullSimulation = financingType === 'Pret bancaire';

  const getAmortissementMontant = (): number => {
    if (capaciteResult) return capaciteResult.capaciteEmprunt;
    const montantEmprunte = mensualitePrix + mensualiteFrais - mensualiteApport;
    return montantEmprunte > 0 ? montantEmprunte : 0;
  };

  const getAmortissementRows = (): AmortizationRow[] | null => {
    if (capaciteAmortissement) return capaciteAmortissement;
    return mensualiteAmortissement;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign size={20} className="text-accent" />
            Simulateur de Prêt Immobilier
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Estimez la capacité d'emprunt ou les mensualités de vos clients
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={handleReset}>
            Réinitialiser
          </Button>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex items-center gap-2 mb-3">
          <Search size={16} className="text-accent" />
          <h2 className="text-sm font-semibold">Import depuis la fiche acheteur</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              readOnly
              value={selectedClient ? selectedClient.name : 'Aucun client sélectionné'}
              className={`${inputClass} pl-9 cursor-default ${selectedClient ? 'text-text' : 'text-text-secondary/60'}`}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<Download size={14} />}
            onClick={() => setShowImportModal(true)}
          >
            Importer
          </Button>
        </div>
        {selectedClient && (
          <div className="mt-3 flex items-center gap-4 p-3 rounded-lg bg-background border border-border/50">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <User size={12} />
              <span className="font-medium text-text">{selectedClient.name}</span>
              <span className="text-text-secondary/60">({selectedClient.type})</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Briefcase size={12} />
              <span>{FINANCING_DISPLAY[financingType] || financingType}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-premium">
              <CheckCircle size={12} />
              <span>Données importées</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={<ExternalLink size={12} />}
              onClick={() => {
                const base = isAdmin ? `/admin/${adminId}` : `/${agentId}`;
                navigate(`${base}/clients/${selectedClient.id}`);
              }}
            >
              Voir la fiche client
            </Button>
          </div>
        )}
      </div>

      {showFullSimulation ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={cardClass}>
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <BarChart2 size={16} className="text-premium" />
              Capacité d'emprunt
            </h2>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Revenus annuels nets</label>
                <div className="relative">
                  <input type="number" value={capaciteRevenus} onChange={e => setCapaciteRevenus(Number(e.target.value))} className={inputClass} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-secondary font-medium">MAD</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputWithLabel label="Endettement maximum" value={capaciteEndettement} onChange={setCapaciteEndettement} suffix="%" />
                <InputWithLabel label="Apport personnel" value={capaciteApport} onChange={setCapaciteApport} suffix="MAD" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputWithLabel label="Taux d'intérêt annuel" value={capaciteTaux} onChange={setCapaciteTaux} suffix="%" step="0.1" />
                <InputWithLabel label="Durée du prêt" value={capaciteDuree} onChange={setCapaciteDuree} suffix="ans" />
              </div>
              <div className="flex gap-2">
                <Button icon={<Search size={14} />} onClick={handleCalculCapacite} className="flex-1">
                  Calculer
                </Button>
                {capaciteResult && (
                  <Button variant="outline" icon={<Save size={14} />} onClick={() => handleSaveSimulation('capacite')}>
                    Sauvegarder
                  </Button>
                )}
              </div>
              {capaciteResult && (
                <div className={resultCardClass}>
                  <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                    <TrendingUp size={12} className="text-premium" />
                    Résultat
                  </p>
                  <div className="space-y-1.5">
                    <StatCard icon={<DollarSign size={12} />} label="Capacité d'emprunt" value={`${formatMontant(capaciteResult.capaciteEmprunt)} MAD`} color="text-premium" />
                    <StatCard icon={<Percent size={12} />} label="Mensualité max" value={`${formatMontant(capaciteResult.mensualiteMax)} MAD`} />
                    <StatCard icon={<Home size={12} />} label="Budget total (apport + prêt)" value={`${formatMontant(capaciteResult.budgetTotal)} MAD`} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <CreditCard size={16} className="text-premium" />
              Mensualité
            </h2>
            <div className="space-y-3">
              <InputWithLabel label="Prix du bien" value={mensualitePrix} onChange={setMensualitePrix} suffix="MAD" />
              <div className="grid grid-cols-2 gap-3">
                <InputWithLabel label="Frais de notaire (est.)" value={mensualiteFrais} onChange={setMensualiteFrais} suffix="MAD" />
                <InputWithLabel label="Apport personnel" value={mensualiteApport} onChange={setMensualiteApport} suffix="MAD" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputWithLabel label="Taux d'intérêt annuel" value={mensualiteTaux} onChange={setMensualiteTaux} suffix="%" step="0.1" />
                <InputWithLabel label="Durée du prêt" value={mensualiteDuree} onChange={setMensualiteDuree} suffix="ans" />
              </div>
              <div className="flex gap-2">
                <Button icon={<Search size={14} />} onClick={handleCalculMensualite} className="flex-1">
                  Calculer
                </Button>
                {mensualiteResult && mensualiteResult.mensualite > 0 && (
                  <Button variant="outline" icon={<Save size={14} />} onClick={() => handleSaveSimulation('mensualite')}>
                    Sauvegarder
                  </Button>
                )}
              </div>
              {mensualiteResult && mensualiteResult.mensualite > 0 && (
                <div className={resultCardClass}>
                  <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                    <TrendingUp size={12} className="text-premium" />
                    Résultat
                  </p>
                  <div className="space-y-1.5">
                    <StatCard icon={<CreditCard size={12} />} label="Mensualité" value={`${formatMontant(mensualiteResult.mensualite)} MAD`} color="text-premium" />
                    <StatCard icon={<Percent size={12} />} label="Total des intérêts" value={`${formatMontant(mensualiteResult.totalInterets)} MAD`} />
                    <StatCard icon={<DollarSign size={12} />} label="Coût total du crédit" value={`${formatMontant(mensualiteResult.coutTotalCredit)} MAD`} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-accent" />
            <h2 className="text-sm font-semibold">Financement - {FINANCING_DISPLAY[financingType] || financingType}</h2>
          </div>
          {selectedClient && (
            <div className="mb-3 flex items-center gap-2 text-xs text-text-secondary">
              <User size={12} />
              <span>Client : <span className="font-medium text-text">{selectedClient.name}</span></span>
              <span className="text-text-secondary/60">|</span>
              <span>Type de financement : {FINANCING_DISPLAY[financingType] || financingType}</span>
            </div>
          )}
          {financingType === 'Apport personnel' && (
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Info size={16} />
                <span className="text-sm font-medium">Financement par apport personnel</span>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-300">
                Le client finance son achat par apport personnel. Aucune simulation de prêt n'est nécessaire.
              </p>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Le client peut acheter un bien jusqu'à : {formatMontant(selectedClient?.contribution || 0)} MAD
              </p>
            </div>
          )}
          {financingType === 'Comptant' && (
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">Achat comptant</span>
              </div>
              <p className="text-sm text-emerald-600 dark:text-emerald-300">
                Le client achète comptant. Aucune simulation de prêt n'est nécessaire.
              </p>
              {selectedClient?.montantPretSouhaite && (
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Montant total : {formatMontant(selectedClient.montantPretSouhaite)} MAD
                </p>
              )}
            </div>
          )}
          {financingType === 'Autre' && (
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 space-y-2">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <AlertCircle size={16} />
                <span className="text-sm font-medium">Financement alternatif</span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Le client utilise un financement alternatif. Aucune simulation de prêt n'est nécessaire.
              </p>
              {selectedClient?.descriptionAutreFinancement && (
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  Description : {selectedClient.descriptionAutreFinancement}
                </p>
              )}
              {selectedClient?.montantPretSouhaite && (
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  Montant : {formatMontant(selectedClient.montantPretSouhaite)} MAD
                </p>
              )}
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" icon={<Mail size={14} />}>
              Envoyer le résultat
            </Button>
            <Button variant="outline" size="sm" icon={<FileText size={14} />}>
              Exporter PDF
            </Button>
            <Button variant="outline" size="sm" icon={<Save size={14} />}>
              Sauvegarder
            </Button>
          </div>
        </div>
      )}

      {showFullSimulation && (
        <>
          <div className={cardClass}>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text transition-colors w-full text-left"
            >
              <Sliders size={16} />
              Paramètres avancés
              {showAdvanced ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
            </button>
            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/30">
                <InputWithLabel label="Assurance emprunteur" value={assurance} onChange={setAssurance} suffix="%" step="0.01" />
                <InputWithLabel label="Frais de dossier" value={fraisDossier} onChange={setFraisDossier} suffix="MAD" />
                <InputWithLabel label="Garantie" value={garantie} onChange={setGarantie} suffix="%" step="0.1" />
              </div>
            )}
          </div>

          {(capaciteResult || (mensualiteResult && mensualiteResult.mensualite > 0)) && (
            <div className={cardClass}>
              <div className="flex items-center gap-2 mb-3">
                <PieChart size={16} className="text-accent" />
                <h2 className="text-sm font-semibold">Graphique d'amortissement</h2>
              </div>
              {capaciteResult && capaciteAmortissement && (
                <div className="mb-3 p-3 rounded-lg bg-background border border-border/50 text-xs text-text-secondary flex items-center gap-2">
                  <Info size={12} />
                  Simulation basée sur une capacité d'emprunt de {formatMontant(capaciteResult.capaciteEmprunt)} MAD
                </div>
              )}
              {getAmortissementRows() && (
                <AmortizationChart
                  rows={getAmortissementRows()!}
                  montantEmprunte={getAmortissementMontant()}
                />
              )}
            </div>
          )}
        </>
      )}

      <div className={cardClass}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Clock size={16} className="text-accent" />
            Simulations récentes
          </h2>
          <Button variant="ghost" size="sm" onClick={loadSimulations} icon={<RefreshCw size={12} />}>
            Actualiser
          </Button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Type</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">Revenus / Prix</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">Résultat</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Client</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-text-secondary">
                    Chargement...
                  </td>
                </tr>
              ) : simulations.map(s => (
                <tr key={s.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">
                    {s.date ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s.date)) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-lg ${
                      s.type === 'capacite'
                        ? 'bg-premium/10 text-premium border border-premium/20'
                        : 'bg-accent/10 text-accent border border-accent/20'
                    }`}>
                      {s.type === 'capacite' ? 'Capacité' : 'Mensualité'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-text text-xs">
                    {s.revenus ? `${formatMontant(s.revenus)} MAD` : s.prixBien ? `${formatMontant(s.prixBien)} MAD` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-text text-xs">
                    {s.capacite ? `${formatMontant(s.capacite)} MAD` : s.mensualite ? `${formatMontant(s.mensualite)} MAD` : '-'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    <div className="flex items-center gap-1.5">
                      {s.clientName ? (
                        <>
                          <User size={11} className="shrink-0" />
                          <span className="truncate max-w-[120px]">{s.clientName}</span>
                        </>
                      ) : (
                        <span className="text-text-secondary/50">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        onClick={() => { setSelectedSim(s); setShowDetailModal(true); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
                        title="Voir le détail"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => { setSelectedSim(s); setShowEmailModal(true); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
                        title="Envoyer par email"
                      >
                        <Mail size={13} />
                      </button>
                      <button
                        onClick={() => { setSelectedSim(s); setShowSaveModal(true); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
                        title="Sauvegarder dans la fiche client"
                      >
                        <Save size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteSimulation(s.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-error transition-all"
                        title="Supprimer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && simulations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-text-secondary">
                    Aucune simulation pour le moment
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={cardClass}>
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-accent" />
          Actions rapides
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Download size={14} />}
            onClick={() => setShowImportModal(true)}
          >
            Importer depuis la fiche
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Mail size={14} />}
            onClick={() => {
              if (simulations.length > 0) {
                setSelectedSim(simulations[0]);
                setShowEmailModal(true);
              }
            }}
          >
            Envoyer le résultat
          </Button>
          <Button variant="outline" size="sm" icon={<FileText size={14} />}>
            Exporter PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Save size={14} />}
            onClick={() => {
              if (simulations.length > 0) {
                setSelectedSim(simulations[0]);
                setShowSaveModal(true);
              }
            }}
          >
            Sauvegarder dans la fiche
          </Button>
          <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={handleReset}>
            Réinitialiser
          </Button>
        </div>
      </div>

      <ImportClientModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportClient}
      />

      <SimulationDetailModal
        simulation={selectedSim}
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedSim(null); }}
      />

      <EmailModal
        simulation={selectedSim}
        isOpen={showEmailModal}
        onClose={() => { setShowEmailModal(false); setSelectedSim(null); }}
        onSend={(email, subject, message) => {
          console.log('Sending email:', email, subject, message);
        }}
      />

      <SaveToClientModal
        simulation={selectedSim}
        isOpen={showSaveModal}
        onClose={() => { setShowSaveModal(false); setSelectedSim(null); }}
        onSave={async (clientName, simName, addNote, note) => {
          if (selectedSim) {
            try {
              if (selectedSim.clientId) {
                const { createClientActivity } = await import('../../services/clientService');
                await createClientActivity(selectedSim.clientId, {
                  type: 'note',
                  subject: simName,
                  description: note,
                  activity_date: new Date().toISOString(),
                } as any);
              }
              setSimulations(prev => prev.map(s =>
                s.id === selectedSim.id ? { ...s, clientName } : s
              ));
            } catch (err) {
              console.error('Failed to save to client:', err);
            }
          }
        }}
      />
    </div>
  );
}
