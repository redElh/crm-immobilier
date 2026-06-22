export type SimulationType = 'capacite' | 'mensualite';

export interface LoanParams {
  revenusAnnuels?: number;
  endettementMax?: number;
  apport?: number;
  tauxInteret?: number;
  dureeAnnees?: number;
  prixBien?: number;
  fraisNotaire?: number;
  tauxAssurance?: number;
  fraisDossier?: number;
  garantie?: number;
}

export interface CapaciteResult {
  capaciteEmprunt: number;
  mensualiteMax: number;
  budgetTotal: number;
}

export interface MensualiteResult {
  mensualite: number;
  coutTotalCredit: number;
  totalInterets: number;
}

export interface SimulationRecord {
  id: string;
  date: string;
  type: SimulationType;
  revenus?: number;
  prixBien?: number;
  capacite?: number;
  mensualite?: number;
  clientName?: string;
  clientEmail?: string;
  notes?: string;
  apport?: number;
  tauxInteret?: number;
  dureeAnnees?: number;
  fraisNotaire?: number;
  endettementMax?: number;
  tauxAssurance?: number;
  fraisDossier?: number;
  garantie?: number;
}

export interface AmortizationRow {
  annee: number;
  capitalRestant: number;
  interetsAnnuels: number;
  capitalRembourse: number;
  mensualite: number;
}

export function calculerCapaciteEmprunt(
  revenusAnnuels: number,
  tauxEndettement: number,
  apport: number,
  tauxInteret: number,
  dureeAnnees: number
): CapaciteResult {
  const revenusMensuels = revenusAnnuels / 12;
  const mensualiteMax = revenusMensuels * (tauxEndettement / 100);
  const tauxMensuel = tauxInteret / 100 / 12;
  const nbMois = dureeAnnees * 12;
  const capitalEmpruntable = mensualiteMax * (1 - Math.pow(1 + tauxMensuel, -nbMois)) / tauxMensuel;
  return {
    capaciteEmprunt: Math.round(capitalEmpruntable),
    mensualiteMax: Math.round(mensualiteMax),
    budgetTotal: Math.round(capitalEmpruntable + apport),
  };
}

export function calculerMensualite(
  prixBien: number,
  fraisNotaire: number,
  apport: number,
  tauxInteret: number,
  dureeAnnees: number,
  tauxAssurance = 0.36
): MensualiteResult {
  const montantEmprunte = prixBien + fraisNotaire - apport;
  if (montantEmprunte <= 0) {
    return { mensualite: 0, coutTotalCredit: 0, totalInterets: 0 };
  }
  const tauxMensuel = tauxInteret / 100 / 12;
  const tauxAssuranceMensuel = tauxAssurance / 100 / 12;
  const nbMois = dureeAnnees * 12;
  const mensualiteInteret = montantEmprunte * tauxMensuel * Math.pow(1 + tauxMensuel, nbMois) / (Math.pow(1 + tauxMensuel, nbMois) - 1);
  const mensualiteAssurance = montantEmprunte * tauxAssuranceMensuel;
  const mensualiteTotale = mensualiteInteret + mensualiteAssurance;
  return {
    mensualite: Math.round(mensualiteTotale),
    coutTotalCredit: Math.round(mensualiteTotale * nbMois),
    totalInterets: Math.round((mensualiteTotale * nbMois) - montantEmprunte),
  };
}

export function genererAmortissement(
  montantEmprunte: number,
  tauxInteret: number,
  dureeAnnees: number
): AmortizationRow[] {
  const tauxMensuel = tauxInteret / 100 / 12;
  const nbMois = dureeAnnees * 12;
  const mensualite = montantEmprunte * tauxMensuel * Math.pow(1 + tauxMensuel, nbMois) / (Math.pow(1 + tauxMensuel, nbMois) - 1);
  const rows: AmortizationRow[] = [];
  let capitalRestant = montantEmprunte;

  for (let annee = 1; annee <= dureeAnnees; annee++) {
    let interetsAnnuels = 0;
    let capitalRembourseAnnee = 0;
    for (let mois = 1; mois <= 12; mois++) {
      const interetMois = capitalRestant * tauxMensuel;
      const capitalMois = mensualite - interetMois;
      interetsAnnuels += interetMois;
      capitalRembourseAnnee += capitalMois;
      capitalRestant -= capitalMois;
    }
    rows.push({
      annee,
      capitalRestant: Math.round(Math.max(0, capitalRestant)),
      interetsAnnuels: Math.round(interetsAnnuels),
      capitalRembourse: Math.round(capitalRembourseAnnee),
      mensualite: Math.round(mensualite * 12),
    });
  }
  return rows;
}

export function genererId(): string {
  return `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export const MOCK_SIMULATIONS: SimulationRecord[] = [
  { id: 's1', date: '2026-06-13T14:30:00', type: 'capacite', revenus: 600000, capacite: 1200000, clientName: 'Ahmed Benali', clientEmail: 'ahmed@email.com', apport: 200000, tauxInteret: 3.5, dureeAnnees: 20, endettementMax: 33 },
  { id: 's2', date: '2026-06-12T09:15:00', type: 'mensualite', prixBien: 1500000, mensualite: 8500, clientName: 'Sophie Martin', clientEmail: 'sophie@email.com', apport: 200000, tauxInteret: 3.5, dureeAnnees: 20, fraisNotaire: 75000 },
  { id: 's3', date: '2026-06-11T16:45:00', type: 'capacite', revenus: 450000, capacite: 850000, clientName: 'Jean Dupont', clientEmail: 'jean@email.com', apport: 100000, tauxInteret: 3.5, dureeAnnees: 20, endettementMax: 33 },
];
