import { AmortizationRow } from '../../../types/pret';

interface Props {
  rows: AmortizationRow[];
  montantEmprunte: number;
}

const formatMontant = (v: number) => v.toLocaleString('fr-FR');

export default function AmortizationChart({ rows, montantEmprunte }: Props) {
  const totalInterets = rows.reduce((acc, r) => acc + r.interetsAnnuels, 0);
  const dernierRow = rows[rows.length - 1];
  const capitalRembourseTotal = dernierRow ? montantEmprunte - dernierRow.capitalRestant : 0;
  const pctCapital = (capitalRembourseTotal / (capitalRembourseTotal + totalInterets)) * 100;
  const pctInterets = 100 - pctCapital;

  const milestones = rows.filter(r => r.annee % 5 === 0 || r.annee === rows.length);
  if (!milestones.some(m => m.annee === rows.length)) {
    milestones.push(rows[rows.length - 1]);
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-end gap-1 mb-2">
          <div className="flex-1 h-8 rounded-lg overflow-hidden flex bg-background border border-border/30">
            <div
              className="h-full bg-premium/30 transition-all flex items-center justify-end px-2"
              style={{ width: `${pctCapital}%` }}
            >
              {pctCapital > 15 && (
                <span className="text-[10px] font-medium text-premium">{formatMontant(capitalRembourseTotal)}</span>
              )}
            </div>
            <div
              className="h-full bg-accent/30 transition-all flex items-center px-2"
              style={{ width: `${pctInterets}%` }}
            >
              {pctInterets > 15 && (
                <span className="text-[10px] font-medium text-accent">{formatMontant(totalInterets)}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-premium/40" />
            Capital : {formatMontant(capitalRembourseTotal)} MAD
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-accent/40" />
            Intérêts : {formatMontant(totalInterets)} MAD
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-background border-b border-border">
              <th className="text-left px-3 py-2 font-medium text-text-secondary">Année</th>
              <th className="text-right px-3 py-2 font-medium text-text-secondary">Capital restant</th>
              <th className="text-right px-3 py-2 font-medium text-text-secondary">Intérêts annuels</th>
              <th className="text-right px-3 py-2 font-medium text-text-secondary">Capital remboursé</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {milestones.map(row => (
              <tr key={row.annee} className="hover:bg-background/50">
                <td className="px-3 py-1.5 font-medium text-text">Année {row.annee}</td>
                <td className="px-3 py-1.5 text-right text-text">{formatMontant(row.capitalRestant)} MAD</td>
                <td className="px-3 py-1.5 text-right text-text-secondary">{formatMontant(row.interetsAnnuels)} MAD</td>
                <td className="px-3 py-1.5 text-right text-text-secondary">{formatMontant(row.capitalRembourse)} MAD</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
