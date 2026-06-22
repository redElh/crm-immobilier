import { useState } from 'react';
import { Dialog } from '../../ui/Dialog';
import { SimulationRecord, genererAmortissement } from '../../../types/pret';
import AmortizationChart from './AmortizationChart';
import { TrendingUp, DollarSign, Percent, Calendar, FileText, BarChart2 } from 'react-feather';

interface Props {
  simulation: SimulationRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatMontant = (v: number) => v.toLocaleString('fr-FR');

const tabBtn = (active: boolean) =>
  `relative px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${
    active ? 'text-accent' : 'text-text-secondary hover:text-text'
  }`;

const tabIndicator = (show: boolean) =>
  show ? (
    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
  ) : null;

export default function SimulationDetailModal({ simulation, isOpen, onClose }: Props) {
  const [tab, setTab] = useState('details');

  if (!simulation) return null;

  const montantEmprunte = simulation.type === 'capacite'
    ? (simulation.capacite ?? 0)
    : (simulation.prixBien ?? 0) + (simulation.fraisNotaire ?? 0) - (simulation.apport ?? 0);

  const amortissement = genererAmortissement(
    montantEmprunte,
    simulation.tauxInteret ?? 3.5,
    simulation.dureeAnnees ?? 20
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Détail de la simulation" size="xl">
      <div className="flex gap-1 border-b border-border/40 mb-4">
        <button onClick={() => setTab('details')} className={tabBtn(tab === 'details')}>
          <FileText size={14} className="inline mr-1.5 -mt-0.5" />
          Résumé
          {tabIndicator(tab === 'details')}
        </button>
        {amortissement.length > 0 && (
          <button onClick={() => setTab('amortissement')} className={tabBtn(tab === 'amortissement')}>
            <BarChart2 size={14} className="inline mr-1.5 -mt-0.5" />
            Amortissement
            {tabIndicator(tab === 'amortissement')}
          </button>
        )}
        {simulation.notes && (
          <button onClick={() => setTab('notes')} className={tabBtn(tab === 'notes')}>
            <FileText size={14} className="inline mr-1.5 -mt-0.5" />
            Notes
            {tabIndicator(tab === 'notes')}
          </button>
        )}
      </div>

      <div className="transition-none">
        {tab === 'details' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-background border border-border/50">
                <p className="text-xs text-text-secondary flex items-center gap-1">
                  <Calendar size={12} />
                  Date
                </p>
                <p className="text-sm font-medium">
                  {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(simulation.date))}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border/50">
                <p className="text-xs text-text-secondary flex items-center gap-1">
                  <DollarSign size={12} />
                  Type
                </p>
                <p className="text-sm font-medium">
                  {simulation.type === 'capacite' ? 'Capacité d\'emprunt' : 'Mensualité'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {simulation.clientName && (
                <div className="p-3 rounded-lg bg-background border border-border/50">
                  <p className="text-xs text-text-secondary">Client</p>
                  <p className="text-sm font-medium truncate">{simulation.clientName}</p>
                </div>
              )}
              {simulation.tauxInteret !== undefined && (
                <div className="p-3 rounded-lg bg-background border border-border/50">
                  <p className="text-xs text-text-secondary flex items-center gap-1">
                    <Percent size={12} />
                    Taux
                  </p>
                  <p className="text-sm font-medium">{simulation.tauxInteret}%</p>
                </div>
              )}
              {simulation.dureeAnnees !== undefined && (
                <div className="p-3 rounded-lg bg-background border border-border/50">
                  <p className="text-xs text-text-secondary flex items-center gap-1">
                    <Calendar size={12} />
                    Durée
                  </p>
                  <p className="text-sm font-medium">{simulation.dureeAnnees} ans</p>
                </div>
              )}
              {simulation.apport !== undefined && (
                <div className="p-3 rounded-lg bg-background border border-border/50">
                  <p className="text-xs text-text-secondary">Apport</p>
                  <p className="text-sm font-medium">{formatMontant(simulation.apport)} MAD</p>
                </div>
              )}
              {simulation.endettementMax !== undefined && (
                <div className="p-3 rounded-lg bg-background border border-border/50">
                  <p className="text-xs text-text-secondary">Endettement</p>
                  <p className="text-sm font-medium">{simulation.endettementMax}%</p>
                </div>
              )}
              {simulation.prixBien !== undefined && (
                <div className="p-3 rounded-lg bg-background border border-border/50">
                  <p className="text-xs text-text-secondary">Prix du bien</p>
                  <p className="text-sm font-medium">{formatMontant(simulation.prixBien)} MAD</p>
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg bg-background border border-border/50">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <TrendingUp size={14} className="text-premium" />
                Résultat
              </p>
              {simulation.type === 'capacite' && simulation.capacite !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Capacité d'emprunt</span>
                  <span className="font-semibold text-premium">{formatMontant(simulation.capacite)} MAD</span>
                </div>
              )}
              {simulation.type === 'mensualite' && simulation.mensualite !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Mensualité</span>
                  <span className="font-semibold text-premium">{formatMontant(simulation.mensualite)} MAD</span>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'amortissement' && (
          <div className="p-4 rounded-lg bg-background border border-border/50">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BarChart2 size={14} />
              Graphique d'amortissement
            </p>
            <AmortizationChart rows={amortissement} montantEmprunte={montantEmprunte} />
          </div>
        )}

        {tab === 'notes' && simulation.notes && (
          <div className="p-4 rounded-lg bg-background border border-border/50">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText size={14} />
              Notes
            </p>
            <p className="text-sm">{simulation.notes}</p>
          </div>
        )}
      </div>
    </Dialog>
  );
}
