import { useState } from 'react';
import { Button } from '../../ui/Button';
import { Client } from '../../../types/client';
import { calculerCapaciteEmprunt } from '../../../types/pret';
import {
  DollarSign, TrendingUp, CreditCard, Briefcase, Calendar, Mail,
  RefreshCw, CheckCircle, Upload, FileText, Percent, AlertCircle, Download
} from 'react-feather';
import { Select } from '../../ui/Select';
import { DatePicker } from '../../ui/DatePicker';

interface Props {
  client: Client;
}

const formatMontant = (v: number) => v.toLocaleString('fr-FR');

const statutFinancementColor = (statut: string | undefined) => {
  switch (statut) {
    case 'Accordé': case 'Accorde': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'En cours': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'Refusé': case 'Refuse': return 'bg-error/10 text-error border-error/20';
    default: return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20';
  }
};

export default function ClientFinancementTab({ client }: Props) {
  const revenus = client.budget || 600000;
  const apport = client.contribution || 200000;
  const prixMin = client.prixMin || 800000;
  const prixMax = client.prixMax || 1200000;

  const [revenusState, setRevenusState] = useState(revenus);
  const [apportState, setApportState] = useState(apport);
  const [tauxState, setTauxState] = useState(3.5);
  const [dureeState, setDureeState] = useState(20);
  const [endettementState, setEndettementState] = useState(33);

  const [banque, setBanque] = useState(client.banqueSollicitee || '');
  const [tauxObtenu, setTauxObtenu] = useState(client.tauxEnvisage ?? 3.4);
  const [statutFinancement, setStatutFinancement] = useState(client.statutFinancement || '');
  const [dateObtention, setDateObtention] = useState(client.dateObtentionPret || '');

  const result = calculerCapaciteEmprunt(revenusState, endettementState, apportState, tauxState, dureeState);
  const peutAcheter = result.capaciteEmprunt >= prixMin;

  const inputClass = "w-full h-9 px-3 text-sm rounded-lg border border-border bg-card text-text placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent";
  const labelClass = "text-xs font-medium text-text-secondary";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <DollarSign size={16} className="text-accent" />
          Financement - {client.name}
        </h3>
      </div>

      <div className="p-4 rounded-xl bg-background border border-border/50">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <TrendingUp size={14} />
          Simulation rapide (pré-remplie depuis le profil)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className={labelClass}>Revenus annuels</label>
            <div className="relative">
              <input type="number" value={revenusState} onChange={e => setRevenusState(Number(e.target.value))} className={inputClass} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">MAD</span>
            </div>
            <p className="text-[10px] text-text-secondary/60 mt-0.5">pré-rempli</p>
          </div>
          <div>
            <label className={labelClass}>Apport</label>
            <div className="relative">
              <input type="number" value={apportState} onChange={e => setApportState(Number(e.target.value))} className={inputClass} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">MAD</span>
            </div>
            <p className="text-[10px] text-text-secondary/60 mt-0.5">pré-rempli</p>
          </div>
          <div>
            <label className={labelClass}>Budget recherché</label>
            <div className="relative">
              <input type="text" value={`${formatMontant(prixMin)} - ${formatMontant(prixMax)}`} readOnly className={`${inputClass} opacity-60 cursor-not-allowed`} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">MAD</span>
            </div>
            <p className="text-[10px] text-text-secondary/60 mt-0.5">depuis ses critères</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-card border border-border/50 space-y-2">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <BarChart2 size={14} className="text-premium" />
            Résultat
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Capacité d'emprunt estimée</span>
            <span className="font-semibold text-premium">{formatMontant(result.capaciteEmprunt)} MAD</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Mensualité estimée</span>
            <span className="font-semibold">{formatMontant(result.mensualiteMax)} MAD</span>
          </div>
          <div className={`flex items-center gap-2 text-xs font-medium mt-2 px-3 py-2 rounded-lg ${peutAcheter ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
            {peutAcheter ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {peutAcheter
              ? 'Ce client peut acheter dans sa fourchette de budget'
              : 'Ce client est en dessous de son budget cible'}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" icon={<RefreshCw size={14} />}>
            Mettre à jour la simulation
          </Button>
          <Button variant="default" size="sm" icon={<Mail size={14} />}>
            Envoyer les résultats au client
          </Button>
        </div>
      </div>

      <div className="border-t border-border/30 pt-4">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Briefcase size={14} />
          Informations bancaires (renseignées par l'agent)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className={labelClass}>Banque sollicitée</label>
            <Select
              value={banque}
              onChange={(val: string) => setBanque(val)}
              options={[
                { value: '', label: 'Sélectionner...' },
                { value: 'BMCI', label: 'BMCI' },
                { value: 'Attijariwafa', label: 'Attijariwafa' },
                { value: 'Banque Populaire', label: 'Banque Populaire' },
                { value: 'Société Générale', label: 'Société Générale' },
                { value: 'CIH', label: 'CIH' },
                { value: 'CFG Bank', label: 'CFG Bank' },
              ]}
            />
          </div>
          <div>
            <label className={labelClass}>Taux obtenu</label>
            <div className="relative">
              <input type="number" step="0.1" value={tauxObtenu} onChange={e => setTauxObtenu(Number(e.target.value))} className={inputClass} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">%</span>
            </div>
          </div>
          <div>
            <label className={labelClass}>Statut du financement</label>
            <div className="flex items-center gap-2 mt-1">
              {['Accordé', 'En cours', 'Refusé'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatutFinancement(s)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                    statutFinancement === s
                      ? statutFinancementColor(s) + ' border-current'
                      : 'bg-card text-text-secondary border-border hover:border-text-secondary/30'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>Date d'obtention</label>
            <DatePicker
              value={dateObtention}
              onChange={e => setDateObtention(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className={labelClass}>Attestation de prêt</label>
          {client.attestationPretUrl ? (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50 mt-1">
              <FileText size={16} className="text-accent" />
              <span className="text-sm text-text flex-1">attestation.pdf</span>
              <Button variant="outline" size="sm" icon={<Download size={14} />}>Télécharger</Button>
            </div>
          ) : (
            <div className="mt-1">
              <Button variant="outline" size="sm" icon={<Upload size={14} />}>
                Upload
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BarChart2(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
