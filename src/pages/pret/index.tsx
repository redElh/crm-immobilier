import { useState } from 'react';
import {
  DollarSign, CreditCard, TrendingUp, Percent, Calendar, Clock, Home,
  Plus, RefreshCw, ChevronDown, ChevronUp, Sliders, BarChart2, Download,
  Search, Users, Mail, FileText, Save, Eye, Trash2, Link
} from 'react-feather';
import { Button } from '../../components/ui/Button';
import {
  calculerCapaciteEmprunt, calculerMensualite,
  genererAmortissement, genererId,
  MOCK_SIMULATIONS, SimulationRecord,
  AmortizationRow
} from '../../types/pret';
import AmortizationChart from '../../components/modules/pret/AmortizationChart';
import SimulationDetailModal from '../../components/modules/pret/SimulationDetailModal';
import EmailModal from '../../components/modules/pret/EmailModal';
import SaveToClientModal from '../../components/modules/pret/SaveToClientModal';

const formatMontant = (v: number) => v.toLocaleString('fr-FR');

export default function PretPage() {
  const [capaciteRevenus, setCapaciteRevenus] = useState(600000);
  const [capaciteEndettement, setCapaciteEndettement] = useState(33);
  const [capaciteApport, setCapaciteApport] = useState(200000);
  const [capaciteTaux, setCapaciteTaux] = useState(3.5);
  const [capaciteDuree, setCapaciteDuree] = useState(20);
  const [capaciteResult, setCapaciteResult] = useState<ReturnType<typeof calculerCapaciteEmprunt> | null>(null);

  const [mensualitePrix, setMensualitePrix] = useState(1500000);
  const [mensualiteFrais, setMensualiteFrais] = useState(75000);
  const [mensualiteApport, setMensualiteApport] = useState(200000);
  const [mensualiteTaux, setMensualiteTaux] = useState(3.5);
  const [mensualiteDuree, setMensualiteDuree] = useState(20);
  const [mensualiteResult, setMensualiteResult] = useState<ReturnType<typeof calculerMensualite> | null>(null);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [assurance, setAssurance] = useState(0.36);
  const [fraisDossier, setFraisDossier] = useState(1500);
  const [garantie, setGarantie] = useState(2);

  const [simulations, setSimulations] = useState<SimulationRecord[]>(MOCK_SIMULATIONS);

  const [selectedSim, setSelectedSim] = useState<SimulationRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [capaciteAmortissement, setCapaciteAmortissement] = useState<AmortizationRow[] | null>(null);
  const [mensualiteAmortissement, setMensualiteAmortissement] = useState<AmortizationRow[] | null>(null);

  const handleCalculCapacite = () => {
    const r = calculerCapaciteEmprunt(capaciteRevenus, capaciteEndettement, capaciteApport, capaciteTaux, capaciteDuree);
    setCapaciteResult(r);
    const amort = genererAmortissement(r.capaciteEmprunt, capaciteTaux, capaciteDuree);
    setCapaciteAmortissement(amort);
  };

  const handleCalculMensualite = () => {
    const montantEmprunte = mensualitePrix + mensualiteFrais - mensualiteApport;
    const r = calculerMensualite(mensualitePrix, mensualiteFrais, mensualiteApport, mensualiteTaux, mensualiteDuree, assurance);
    setMensualiteResult(r);
    if (montantEmprunte > 0) {
      const amort = genererAmortissement(montantEmprunte, mensualiteTaux, mensualiteDuree);
      setMensualiteAmortissement(amort);
    }
  };

  const handleSauvegarderCapacite = () => {
    if (!capaciteResult) return;
    const sim: SimulationRecord = {
      id: genererId(),
      date: new Date().toISOString(),
      type: 'capacite',
      revenus: capaciteRevenus,
      capacite: capaciteResult.capaciteEmprunt,
      apport: capaciteApport,
      tauxInteret: capaciteTaux,
      dureeAnnees: capaciteDuree,
      endettementMax: capaciteEndettement,
    };
    setSimulations(prev => [sim, ...prev]);
    setCapaciteResult(null);
    setCapaciteAmortissement(null);
  };

  const handleSauvegarderMensualite = () => {
    if (!mensualiteResult) return;
    const sim: SimulationRecord = {
      id: genererId(),
      date: new Date().toISOString(),
      type: 'mensualite',
      prixBien: mensualitePrix,
      mensualite: mensualiteResult.mensualite,
      apport: mensualiteApport,
      tauxInteret: mensualiteTaux,
      dureeAnnees: mensualiteDuree,
      fraisNotaire: mensualiteFrais,
      tauxAssurance: assurance,
      fraisDossier: fraisDossier,
      garantie: garantie,
    };
    setSimulations(prev => [sim, ...prev]);
    setMensualiteResult(null);
    setMensualiteAmortissement(null);
  };

  const handlePreRemplir = () => {
    if (selectedSim) {
      if (selectedSim.type === 'capacite') {
        if (selectedSim.revenus) setCapaciteRevenus(selectedSim.revenus);
        if (selectedSim.apport) setCapaciteApport(selectedSim.apport);
        if (selectedSim.tauxInteret) setCapaciteTaux(selectedSim.tauxInteret);
        if (selectedSim.dureeAnnees) setCapaciteDuree(selectedSim.dureeAnnees);
        if (selectedSim.endettementMax) setCapaciteEndettement(selectedSim.endettementMax);
      } else {
        if (selectedSim.prixBien) setMensualitePrix(selectedSim.prixBien);
        if (selectedSim.fraisNotaire) setMensualiteFrais(selectedSim.fraisNotaire);
        if (selectedSim.apport) setMensualiteApport(selectedSim.apport);
        if (selectedSim.tauxInteret) setMensualiteTaux(selectedSim.tauxInteret);
        if (selectedSim.dureeAnnees) setMensualiteDuree(selectedSim.dureeAnnees);
        if (selectedSim.tauxAssurance) setAssurance(selectedSim.tauxAssurance);
      }
    }
  };

  const handleSupprimer = (id: string) => {
    setSimulations(prev => prev.filter(s => s.id !== id));
  };

  const inputClass = "w-full h-9 px-3 text-sm rounded-lg border border-border bg-card text-text placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent";
  const labelClass = "text-xs font-medium text-text-secondary";
  const cardClass = "bg-card rounded-xl border border-border/50 shadow-card p-5";

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
          <p className="text-sm text-text-secondary mt-1">
            Estimez la capacité d'emprunt ou les mensualités de vos clients
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<RefreshCw size={14} />}>
            Réinitialiser
          </Button>
        </div>
      </div>

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
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">MAD</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Endettement maximum</label>
                <div className="relative">
                  <input type="number" value={capaciteEndettement} onChange={e => setCapaciteEndettement(Number(e.target.value))} className={inputClass} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">%</span>
                </div>
              </div>
              <div>
                <label className={labelClass}>Apport personnel</label>
                <div className="relative">
                  <input type="number" value={capaciteApport} onChange={e => setCapaciteApport(Number(e.target.value))} className={inputClass} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">MAD</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Taux d'intérêt annuel</label>
                <div className="relative">
                  <input type="number" step="0.1" value={capaciteTaux} onChange={e => setCapaciteTaux(Number(e.target.value))} className={inputClass} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">%</span>
                </div>
              </div>
              <div>
                <label className={labelClass}>Durée du prêt</label>
                <div className="relative">
                  <input type="number" value={capaciteDuree} onChange={e => setCapaciteDuree(Number(e.target.value))} className={inputClass} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">ans</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button icon={<Search size={14} />} onClick={handleCalculCapacite} className="flex-1">
                Calculer
              </Button>
              {capaciteResult && (
                <Button variant="outline" icon={<Save size={14} />} onClick={handleSauvegarderCapacite}>
                  Sauvegarder
                </Button>
              )}
            </div>
            {capaciteResult && (
              <div className="mt-3 p-4 rounded-lg bg-background border border-border/50 space-y-2">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-premium" />
                  Résultat
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Capacité d'emprunt</span>
                  <span className="font-semibold text-premium">{formatMontant(capaciteResult.capaciteEmprunt)} MAD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Mensualité max</span>
                  <span className="font-semibold">{formatMontant(capaciteResult.mensualiteMax)} MAD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Budget total (apport + prêt)</span>
                  <span className="font-semibold">{formatMontant(capaciteResult.budgetTotal)} MAD</span>
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
            <div>
              <label className={labelClass}>Prix du bien</label>
              <div className="relative">
                <input type="number" value={mensualitePrix} onChange={e => setMensualitePrix(Number(e.target.value))} className={inputClass} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">MAD</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Frais de notaire (estimation)</label>
                <div className="relative">
                  <input type="number" value={mensualiteFrais} onChange={e => setMensualiteFrais(Number(e.target.value))} className={inputClass} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">MAD</span>
                </div>
              </div>
              <div>
                <label className={labelClass}>Apport personnel</label>
                <div className="relative">
                  <input type="number" value={mensualiteApport} onChange={e => setMensualiteApport(Number(e.target.value))} className={inputClass} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">MAD</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Taux d'intérêt annuel</label>
                <div className="relative">
                  <input type="number" step="0.1" value={mensualiteTaux} onChange={e => setMensualiteTaux(Number(e.target.value))} className={inputClass} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">%</span>
                </div>
              </div>
              <div>
                <label className={labelClass}>Durée du prêt</label>
                <div className="relative">
                  <input type="number" value={mensualiteDuree} onChange={e => setMensualiteDuree(Number(e.target.value))} className={inputClass} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">ans</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button icon={<Search size={14} />} onClick={handleCalculMensualite} className="flex-1">
                Calculer
              </Button>
              {mensualiteResult && (
                <Button variant="outline" icon={<Save size={14} />} onClick={handleSauvegarderMensualite}>
                  Sauvegarder
                </Button>
              )}
            </div>
            {mensualiteResult && (
              <div className="mt-3 p-4 rounded-lg bg-background border border-border/50 space-y-2">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-premium" />
                  Résultat
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Mensualité</span>
                  <span className="font-semibold text-premium">{formatMontant(mensualiteResult.mensualite)} MAD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Total des intérêts</span>
                  <span className="font-semibold">{formatMontant(mensualiteResult.totalInterets)} MAD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Coût total du crédit</span>
                  <span className="font-semibold">{formatMontant(mensualiteResult.coutTotalCredit)} MAD</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1">
                  <Percent size={12} />
                  Assurance emprunteur
                </span>
              </label>
              <div className="relative">
                <input type="number" step="0.01" value={assurance} onChange={e => setAssurance(Number(e.target.value))} className={inputClass} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">%</span>
              </div>
              <p className="text-[10px] text-text-secondary/60 mt-0.5">Taux d'assurance</p>
            </div>
            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1">
                  <DollarSign size={12} />
                  Frais de dossier
                </span>
              </label>
              <div className="relative">
                <input type="number" value={fraisDossier} onChange={e => setFraisDossier(Number(e.target.value))} className={inputClass} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">MAD</span>
              </div>
              <p className="text-[10px] text-text-secondary/60 mt-0.5">Frais bancaires</p>
            </div>
            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1">
                  <Percent size={12} />
                  Garantie
                </span>
              </label>
              <div className="relative">
                <input type="number" step="0.1" value={garantie} onChange={e => setGarantie(Number(e.target.value))} className={inputClass} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">%</span>
              </div>
              <p className="text-[10px] text-text-secondary/60 mt-0.5">Frais de garantie</p>
            </div>
          </div>
        )}
      </div>

      {(capaciteAmortissement || mensualiteAmortissement) && (
        <div className={cardClass}>
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-accent" />
            Graphique d'amortissement
          </h2>
          <AmortizationChart
            rows={getAmortissementRows()!}
            montantEmprunte={getAmortissementMontant()}
          />
        </div>
      )}

      <div className={cardClass}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Clock size={16} className="text-accent" />
            Simulations récentes
          </h2>
          <Button variant="ghost" size="sm">
            Voir tout
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
              {simulations.map(s => (
                <tr key={s.id} className="hover:bg-background/50 transition-colors relative">
                  <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">
                    {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s.date))}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-lg ${s.type === 'capacite' ? 'bg-premium/10 text-premium border border-premium/20' : 'bg-accent/10 text-accent border border-accent/20'}`}>
                      {s.type === 'capacite' ? 'Capacité' : 'Mensualité'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-text text-xs">
                    {s.revenus ? `${formatMontant(s.revenus)} MAD` : s.prixBien ? `${formatMontant(s.prixBien)} MAD` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-text text-xs">
                    {s.capacite ? `${formatMontant(s.capacite)} MAD` : s.mensualite ? `${formatMontant(s.mensualite)} MAD` : '-'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{s.clientName || '-'}</td>
                  <td className="px-4 py-3 text-right relative">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setSelectedSim(s); setShowDetailModal(true); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
                        title="Voir le détail"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => { setSelectedSim(s); setShowEmailModal(true); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
                        title="Envoyer par email"
                      >
                        <Mail size={14} />
                      </button>
                      <button
                        onClick={() => { setSelectedSim(s); setShowSaveModal(true); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
                        title="Sauvegarder dans la fiche client"
                      >
                        <Save size={14} />
                      </button>
                      <button
                        onClick={() => handleSupprimer(s.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-error transition-all"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {simulations.length === 0 && (
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
          <ZapIcon size={16} className="text-accent" />
          Actions rapides
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" icon={<Link size={14} />} onClick={() => {
            if (simulations.length > 0) {
              setSelectedSim(simulations[0]);
              handlePreRemplir();
            }
          }}>
            Pré-remplir depuis la fiche client
          </Button>
          <Button variant="outline" size="sm" icon={<Mail size={14} />} onClick={() => {
            if (simulations.length > 0) {
              setSelectedSim(simulations[0]);
              setShowEmailModal(true);
            }
          }}>
            Envoyer le résultat
          </Button>
          <Button variant="outline" size="sm" icon={<FileText size={14} />}>
            Exporter en PDF
          </Button>
          <Button variant="outline" size="sm" icon={<Save size={14} />} onClick={() => {
            if (simulations.length > 0) {
              setSelectedSim(simulations[0]);
              setShowSaveModal(true);
            }
          }}>
            Sauvegarder dans la fiche client
          </Button>
        </div>
      </div>

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
          console.log('Sending email to:', email, 'subject:', subject, 'message:', message);
        }}
      />

      <SaveToClientModal
        simulation={selectedSim}
        isOpen={showSaveModal}
        onClose={() => { setShowSaveModal(false); setSelectedSim(null); }}
        onSave={(clientName, simName, addNote, note) => {
          console.log('Saving to client:', clientName, simName, addNote, note);
          setSimulations(prev => prev.map(s =>
            s.id === selectedSim?.id ? { ...s, clientName } : s
          ));
        }}
      />
    </div>
  );
}

function ZapIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
