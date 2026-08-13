import { useState } from 'react';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import { Client } from '../../../types/client';
import {
  DollarSign, TrendingUp, CreditCard, Briefcase, Calendar, Mail,
  RefreshCw, CheckCircle, Upload, FileText, Percent, AlertCircle, Download,
  Send, Printer
} from 'react-feather';
import { useToast } from '../../ui/Toast';
import { Select } from '../../ui/Select';
import { DatePicker } from '../../ui/DatePicker';

interface Props {
  client: Client;
  isGerant?: boolean;
}

const formatMontant = (v: number) => v.toLocaleString('fr-FR');

const statutFinancementColor = (statut: string | undefined, isGerant: boolean) => {
  switch (statut) {
    case 'Accordé': case 'Accorde': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'En cours': return isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] border-[#905D5D]/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'Refusé': case 'Refuse': return 'bg-error/10 text-error border-error/20';
    default: return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20';
  }
};

const BANQUE_OPTIONS = [
  { value: 'Attijariwafa', label: 'Attijariwafa' },
  { value: 'BMCE', label: 'BMCE' },
  { value: 'Societe Generale', label: 'Société Générale' },
  { value: 'Credit Agricole', label: 'Crédit Agricole' },
  { value: 'CIH', label: 'CIH' },
  { value: 'CFG Bank', label: 'CFG Bank' },
  { value: 'Autre', label: 'Autre' },
];

const STATUT_FINANCEMENT_OPTIONS = [
  { value: 'En cours', label: 'En cours' },
  { value: 'Accorde', label: 'Accordé' },
  { value: 'Refuse', label: 'Refusé' },
];

export default function ClientFinancementTab({ client, isGerant = false }: Props) {
  const { toast } = useToast();
  const c = client as any;
  const devise = client.devise || 'MAD';
  const isPretBancaire = c.typeFinancement === 'Pret bancaire';
  const isApportPersonnel = c.typeFinancement === 'Apport personnel';
  const isComptant = c.typeFinancement === 'Comptant';
  const isAutre = c.typeFinancement === 'Autre';

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState(client.email || '');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const revenusNets = client.revenusMensuelsNets || 0;
  const chargesCredit = client.chargesCredit || 0;
  const mensualiteMax = Math.max(0, (revenusNets * 0.35) - chargesCredit);
  const tauxInteret = client.tauxEnvisage || 3.5;
  const dureeAnnees = c.dureePret || 20;
  const apport = c.apport || 0;
  let montantEmpruntable = 0;
  if (mensualiteMax > 0 && dureeAnnees > 0 && isPretBancaire) {
    const tauxMensuel = tauxInteret / 100 / 12;
    const nbMois = dureeAnnees * 12;
    montantEmpruntable = Math.round(mensualiteMax * (1 - Math.pow(1 + tauxMensuel, -nbMois)) / tauxMensuel);
  }
  const capaciteCalculee = isPretBancaire ? montantEmpruntable + apport : client.capaciteEmprunt || 0;

  const isAboveBudget = client.prixMin && client.prixMax ? capaciteCalculee >= client.prixMin : null;

  const [banque, setBanque] = useState(client.banqueSollicitee || '');
  const [tauxObtenu, setTauxObtenu] = useState(client.tauxEnvisage ?? 3.4);
  const [statutFinancement, setStatutFinancement] = useState(client.statutFinancement || '');
  const [dateObtention, setDateObtention] = useState(client.dateObtentionPret || '');

  const inputClass = (isGerant: boolean) => `w-full h-9 px-3 text-sm rounded-lg border border-border bg-card text-text placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]' : 'focus:ring-accent/20 focus:border-accent'}`;
  const labelClass = "text-xs font-medium text-text-secondary";

  const openEmailModal = () => {
    setEmailTo(client.email || '');
    const budgetStatus = isAboveBudget === null ? ''
      : isAboveBudget ? 'au-dessus de son budget cible'
      : 'en dessous de son budget cible';
    setEmailSubject(
      budgetStatus
        ? `Simulation de financement - ${client.name} - ${budgetStatus}`
        : `Simulation de financement - ${client.name}`
    );

    let msg = `Bonjour ${client.name},\n\nSuite à l'étude de votre dossier de financement, voici un récapitulatif de votre situation :\n\n`;
    msg += `--- RÉSUMÉ DE VOTRE FINANCEMENT ---\n\n`;

    if (isPretBancaire) {
      msg += `Revenus mensuels nets : ${formatMontant(revenusNets)} ${devise}\n`;
      msg += `Charges de crédit : ${formatMontant(chargesCredit)} ${devise}\n`;
      msg += `Mensualité maximale estimée : ${formatMontant(mensualiteMax)} ${devise}\n`;
      msg += `Montant empruntable : ${formatMontant(montantEmpruntable)} ${devise}\n`;
      msg += `Apport personnel : ${formatMontant(apport)} ${devise}\n`;
      msg += `\nCapacité d'emprunt estimée : ${formatMontant(capaciteCalculee)} ${devise}\n`;
      msg += `\nDétails du prêt :\n`;
      msg += `  • Taux d'intérêt : ${tauxInteret}%\n`;
      msg += `  • Durée : ${dureeAnnees} ans\n`;
      msg += `  • Assurance : ${client.assuranceEmprunteur || 0}%\n`;
    } else if (isComptant) {
      msg += `Type de financement : Comptant\n`;
      if (client.montantTotal) msg += `Montant total : ${formatMontant(client.montantTotal)} ${devise}\n`;
    } else if (isApportPersonnel) {
      msg += `Type de financement : Apport personnel\n`;
      msg += `Apport : ${formatMontant(apport)} ${devise}\n`;
    } else if (isAutre) {
      msg += `Type de financement : Autre\n`;
      if (c.descriptionAutreFinancement) msg += `Description : ${c.descriptionAutreFinancement}\n`;
      if (client.montantTotal) msg += `Montant : ${formatMontant(client.montantTotal)} ${devise}\n`;
    }

    if (client.prixMin && client.prixMax) {
      msg += `\nBudget recherché : ${formatMontant(client.prixMin)} - ${formatMontant(client.prixMax)} ${devise}\n`;
      msg += `Capacité estimée : ${formatMontant(capaciteCalculee)} ${devise}\n`;
      if (isAboveBudget !== null) {
        msg += isAboveBudget
          ? `\n✅ Bonne nouvelle ! Vous pouvez acheter dans votre fourchette de budget.`
          : `\n⚠️ Votre capacité estimée est en dessous de votre budget cible.`;
      }
    }

    if (client.banqueSollicitee) {
      msg += `\n\nBanque sollicitée : ${client.banqueSollicitee}\n`;
    }

    msg += `\n---\nCe message est généré automatiquement depuis votre espace conseiller Square Meter.`;

    setEmailMessage(msg);
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    try {
      const { sendFinancement } = await import('../../../services/clientService');
      await sendFinancement(client.id, { email: emailTo, subject: emailSubject, message: emailMessage });
      setShowEmailModal(false);
      toast('success', 'Email envoyé avec succès');
    } catch (err: any) {
      toast('error', err?.message || "Erreur lors de l'envoi de l'email");
    }
  };

  const handleExportPdf = () => {
    const budgetInfo = client.prixMin && client.prixMax
      ? `${formatMontant(client.prixMin)} - ${formatMontant(client.prixMax)} ${devise}`
      : 'Non défini';
    const budgetStatus = isAboveBudget === null ? ''
      : isAboveBudget
        ? 'Le client peut acheter dans sa fourchette de budget'
        : 'Le client est en dessous de son budget cible';

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Financement - ${client.name}</title>
  <style>
    @page { margin: 20mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; font-size: 12px; line-height: 1.6; }
    h1 { font-size: 20px; color: #1a1a2e; border-bottom: 2px solid #7c3aed; padding-bottom: 8px; margin-bottom: 20px; }
    h2 { font-size: 14px; color: #7c3aed; margin-top: 20px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
    th { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
    td { font-size: 12px; }
    .label { color: #64748b; }
    .value { font-weight: 600; text-align: right; }
    .highlight { font-size: 16px; color: #7c3aed; font-weight: 700; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; }
    .badge-bank { background: #eef2ff; color: #6366f1; }
    .status-ok { color: #059669; font-weight: 600; }
    .status-warn { color: #d97706; font-weight: 600; }
    .section { margin-bottom: 16px; }
    .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <h1>Fiche de financement</h1>
  <p style="font-size:14px;color:#64748b;">${client.name} · ${new Date().toLocaleDateString('fr-FR')}</p>

  <div class="section">
    <h2>Type de financement</h2>
    <p><span class="badge badge-bank">${c.typeFinancement || 'Non défini'}</span></p>
  </div>

  ${isPretBancaire ? `
  <div class="section">
    <h2>Revenus & Charges</h2>
    <table>
      <tr><th>Rubrique</th><th style="text-align:right;">Montant</th></tr>
      <tr><td>Revenus mensuels nets</td><td class="value">${formatMontant(revenusNets)} ${devise}</td></tr>
      <tr><td>Revenus supplémentaires</td><td class="value">${formatMontant(client.revenusSupplementaires || 0)} ${devise}</td></tr>
      <tr><td>Charges de crédit en cours</td><td class="value">${formatMontant(chargesCredit)} ${devise}</td></tr>
      <tr><td>Charges fixes</td><td class="value">${formatMontant(client.chargesFixes || 0)} ${devise}</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>Résultat du calcul</h2>
    <table>
      <tr><td>Mensualité max (35% - charges)</td><td class="value">${formatMontant(mensualiteMax)} ${devise}</td></tr>
      <tr><td>Montant empruntable</td><td class="value">${formatMontant(montantEmpruntable)} ${devise}</td></tr>
      <tr><td>Apport personnel</td><td class="value">${formatMontant(apport)} ${devise}</td></tr>
      <tr><td style="font-weight:600;padding-top:8px;border-top:2px solid #7c3aed;">Capacité d'emprunt estimée</td>
          <td class="value highlight" style="padding-top:8px;border-top:2px solid #7c3aed;">${formatMontant(capaciteCalculee)} ${devise}</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>Détails du prêt</h2>
    <table>
      <tr><td>Montant du prêt souhaité</td><td class="value">${formatMontant(client.montantPretSouhaite || 0)} ${devise}</td></tr>
      <tr><td>Taux d'intérêt</td><td class="value">${tauxInteret} %</td></tr>
      <tr><td>Durée</td><td class="value">${dureeAnnees} ans</td></tr>
      <tr><td>TAEG</td><td class="value">${client.taeg || 0} %</td></tr>
      <tr><td>Assurance emprunteur</td><td class="value">${client.assuranceEmprunteur || 0} %</td></tr>
    </table>
  </div>
  ` : ''}

  ${isComptant && client.montantTotal ? `
  <div class="section">
    <h2>Paiement comptant</h2>
    <table><tr><td>Montant total</td><td class="value">${formatMontant(client.montantTotal)} ${devise}</td></tr></table>
  </div>
  ` : ''}

  ${isAutre ? `
  <div class="section">
    <h2>Détails du financement</h2>
    <table>
      ${c.descriptionAutreFinancement ? `<tr><td>Description</td><td class="value">${c.descriptionAutreFinancement}</td></tr>` : ''}
      ${client.montantTotal ? `<tr><td>Montant</td><td class="value">${formatMontant(client.montantTotal)} ${devise}</td></tr>` : ''}
    </table>
  </div>
  ` : ''}

  ${client.prixMin && client.prixMax ? `
  <div class="section">
    <h2>Budget vs Capacité</h2>
    <table>
      <tr><td>Budget recherché</td><td class="value">${budgetInfo}</td></tr>
      <tr><td>Capacité estimée</td><td class="value">${formatMontant(capaciteCalculee)} ${devise}</td></tr>
    </table>
    <p class="${isAboveBudget ? 'status-ok' : 'status-warn'}">${budgetStatus}</p>
  </div>
  ` : ''}

  ${client.banqueSollicitee ? `
  <div class="section">
    <h2>Informations bancaires</h2>
    <table>
      <tr><td>Banque sollicitée</td><td class="value">${client.banqueSollicitee}</td></tr>
      ${statutFinancement ? `<tr><td>Statut du financement</td><td class="value">${statutFinancement}</td></tr>` : ''}
      ${dateObtention ? `<tr><td>Date d'obtention</td><td class="value">${dateObtention}</td></tr>` : ''}
    </table>
  </div>
  ` : ''}

  ${client.notes ? `
  <div class="section">
    <h2>Notes</h2>
    <p style="color:#64748b;">${client.notes}</p>
  </div>
  ` : ''}

  <div class="footer">
    Square Meter · Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
  </div>

  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 300); }
  <\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `financement_${client.name.replace(/\s+/g, '_')}.html`;
      a.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
          Financement - {client.name}
        </h3>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-text-secondary">Type:</span>
        <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-premium/10 text-premium border border-premium/20">
          {c.typeFinancement || 'Non défini'}
        </span>
      </div>

      {isPretBancaire && (
        <div className="p-4 rounded-xl bg-background border border-border/50">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <TrendingUp size={14} />
            Revenus & Charges
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Revenus mensuels nets</label>
              <div className="relative">
                <input type="text" value={`${formatMontant(revenusNets)} ${devise}`} readOnly className={`${inputClass(isGerant)} opacity-60 cursor-not-allowed`} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Revenus supplémentaires</label>
              <div className="relative">
                <input type="text" value={`${formatMontant(client.revenusSupplementaires || 0)} ${devise}`} readOnly className={`${inputClass(isGerant)} opacity-60 cursor-not-allowed`} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Charges de crédit en cours</label>
              <div className="relative">
                <input type="text" value={`${formatMontant(chargesCredit)} ${devise}`} readOnly className={`${inputClass(isGerant)} opacity-60 cursor-not-allowed`} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Charges fixes</label>
              <div className="relative">
                <input type="text" value={`${formatMontant(client.chargesFixes || 0)} ${devise}`} readOnly className={`${inputClass(isGerant)} opacity-60 cursor-not-allowed`} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 rounded-xl bg-background border border-border/50">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <TrendingUp size={14} className="text-premium" />
          {isPretBancaire ? 'Résultat du calcul' : 'Capacité'}
        </p>
        <div className="space-y-2">
          {isPretBancaire && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Mensualité max (35% - charges)</span>
                <span className="font-semibold">{formatMontant(mensualiteMax)} {devise}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Montant empruntable</span>
                <span className="font-semibold">{formatMontant(montantEmpruntable)} {devise}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Apport personnel</span>
            <span className="font-semibold">{formatMontant(apport)} {devise}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-border/30 pt-2 mt-2">
            <span className="flex items-center gap-1.5 font-medium">
              <TrendingUp size={16} className="text-premium" />
              Capacité d'emprunt estimée
            </span>
            <span className="font-semibold text-premium text-lg">{formatMontant(capaciteCalculee)} {devise}</span>
          </div>
        </div>

        {client.prixMin && client.prixMax && (
          <div className={`flex items-center gap-2 text-xs font-medium mt-3 px-3 py-2 rounded-lg ${isAboveBudget ? 'bg-emerald-500/10 text-emerald-500' : isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-amber-500/10 text-amber-500'}`}>
            {isAboveBudget ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {isAboveBudget
              ? 'Ce client peut acheter dans sa fourchette de budget'
              : 'Ce client est en dessous de son budget cible'}
          </div>
        )}
      </div>

      {isPretBancaire && (
        <div className="p-4 rounded-xl bg-background border border-border/50">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Percent size={14} />
            Détails du prêt
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Montant du prêt souhaité</label>
              <input type="text" value={`${formatMontant(client.montantPretSouhaite || 0)} ${devise}`} readOnly className={`${inputClass(isGerant)} opacity-60 cursor-not-allowed`} />
            </div>
            <div>
              <label className={labelClass}>Taux envisagé</label>
              <div className="relative">
                <input type="text" value={`${client.tauxEnvisage || 3.5} %`} readOnly className={`${inputClass(isGerant)} opacity-60 cursor-not-allowed`} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Durée</label>
              <input type="text" value={`${c.dureePret || 20} ans`} readOnly className={`${inputClass(isGerant)} opacity-60 cursor-not-allowed`} />
            </div>
            <div>
              <label className={labelClass}>TAEG</label>
              <div className="relative">
                <input type="text" value={`${client.taeg || 0} %`} readOnly className={`${inputClass(isGerant)} opacity-60 cursor-not-allowed`} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Assurance emprunteur (%)</label>
              <div className="relative">
                <input type="text" value={`${client.assuranceEmprunteur || 0} %`} readOnly className={`${inputClass(isGerant)} opacity-60 cursor-not-allowed`} />
              </div>
            </div>
          </div>
        </div>
      )}

      {isComptant && client.montantTotal !== undefined && client.montantTotal > 0 && (
        <div className="p-4 rounded-xl bg-background border border-border/50">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Paiement comptant</p>
          <div>
            <label className={labelClass}>Montant total</label>
            <input type="text" value={`${formatMontant(client.montantTotal)} ${devise}`} readOnly className={`${inputClass(isGerant)} opacity-60 cursor-not-allowed`} />
          </div>
        </div>
      )}

      {isAutre && (
        <div className="p-4 rounded-xl bg-background border border-border/50">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Détails du financement</p>
          {c.descriptionAutreFinancement && (
            <div className="mb-3">
              <label className={labelClass}>Description</label>
              <input type="text" value={c.descriptionAutreFinancement} readOnly className={`${inputClass(isGerant)} opacity-60 cursor-not-allowed`} />
            </div>
          )}
          {client.montantTotal !== undefined && client.montantTotal > 0 && (
            <div>
              <label className={labelClass}>Montant</label>
              <input type="text" value={`${formatMontant(client.montantTotal)} ${devise}`} readOnly className={`${inputClass(isGerant)} opacity-60 cursor-not-allowed`} />
            </div>
          )}
        </div>
      )}

      {(isPretBancaire || isAutre) && (
        <div className="border-t border-border/30 pt-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Briefcase size={14} />
            Informations bancaires
          </p>
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${isPretBancaire ? 'lg:grid-cols-4' : ''}`}>
            <div>
              <label className={labelClass}>Banque sollicitée</label>
              <Select
                value={banque}
                onChange={(val: string) => setBanque(val)}
                options={[{ value: '', label: 'Sélectionner...' }, ...BANQUE_OPTIONS]}
              />
            </div>
            {isAutre && (
              <div>
                <label className={labelClass}>Attestation de prêt</label>
                {client.attestationPretUrl ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50 mt-1">
                    <FileText size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                    <span className="text-sm text-text flex-1">attestation.pdf</span>
                    <Button variant="outline" size="sm" icon={<Download size={14} />}>Télécharger</Button>
                  </div>
                ) : (
                  <div className="mt-1">
                    <Button variant="outline" size="sm" icon={<Upload size={14} />}>Upload</Button>
                  </div>
                )}
              </div>
            )}
            {isPretBancaire && (
              <>
                <div>
                  <label className={labelClass}>Taux obtenu</label>
                  <div className="relative">
                    <input type="number" step="0.1" value={tauxObtenu} onChange={e => setTauxObtenu(Number(e.target.value))} className={inputClass(isGerant)} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">%</span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Statut du financement</label>
                  <Select
                    value={statutFinancement}
                    onChange={(val: string) => setStatutFinancement(val)}
                    options={[{ value: '', label: 'Non défini' }, ...STATUT_FINANCEMENT_OPTIONS]}
                  />
                </div>
                <div>
                  <label className={labelClass}>Date d'obtention</label>
                  <DatePicker
                    value={dateObtention}
                    onChange={e => setDateObtention(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {isPretBancaire && (
            <div className="mt-4">
              <label className={labelClass}>Attestation de prêt</label>
              {client.attestationPretUrl ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50 mt-1">
                  <FileText size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                  <span className="text-sm text-text flex-1">attestation.pdf</span>
                  <Button variant="outline" size="sm" icon={<Download size={14} />}>Télécharger</Button>
                </div>
              ) : (
                <div className="mt-1">
                  <Button variant="outline" size="sm" icon={<Upload size={14} />}>Upload</Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {(c.situationActuelle || c.urgence || c.dateEmmenagement || client.notes) && (
        <div className="border border-border/50 rounded-2xl p-6 bg-card/30">
          <h3 className="font-medium flex items-center gap-2 mb-4 text-sm">
            <FileText size={18} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
            Notes & Informations complémentaires
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {c.situationActuelle && (
              <div>
                <label className={labelClass}>Situation actuelle</label>
                <input type="text" value={c.situationActuelle} readOnly className={`${inputClass(isGerant)} opacity-60 cursor-not-allowed`} />
              </div>
            )}
            {c.urgence && (
              <div>
                <label className={labelClass}>Urgence</label>
                <input type="text" value={c.urgence} readOnly className={`${inputClass(isGerant)} opacity-60 cursor-not-allowed`} />
              </div>
            )}
            {c.dateEmmenagement && (
              <div>
                <label className={labelClass}>Date souhaitée d'emménagement</label>
                <input type="text" value={new Date(c.dateEmmenagement).toLocaleDateString('fr-FR')} readOnly className={`${inputClass(isGerant)} opacity-60 cursor-not-allowed`} />
              </div>
            )}
          </div>
          {client.notes && (
            <div className="mt-3">
              <label className={labelClass}>Notes complémentaires</label>
              <textarea value={client.notes} readOnly rows={3} className={`${inputClass(isGerant)} opacity-60 cursor-not-allowed resize-none`} />
            </div>
          )}
        </div>
      )}

      <div className="p-5 rounded-xl border border-border/50 bg-card/30">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
          <TrendingUp size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
          Actions
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Mail size={14} />}
            onClick={openEmailModal}
          >
            Envoyer à l'acheteur
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<FileText size={14} />}
            onClick={handleExportPdf}
          >
            Exporter PDF
          </Button>
        </div>
      </div>

      <Dialog isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} title="Envoyer le financement à l'acheteur" size="lg">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Destinataire</label>
            <input
              type="email"
              value={emailTo}
              onChange={e => setEmailTo(e.target.value)}
              className={inputClass(isGerant)}
              placeholder="email@exemple.com"
            />
          </div>
          <div>
            <label className={labelClass}>Objet</label>
            <input
              type="text"
              value={emailSubject}
              onChange={e => setEmailSubject(e.target.value)}
              className={inputClass(isGerant)}
            />
          </div>
          <div>
            <label className={labelClass}>Message</label>
            <textarea
              rows={18}
              value={emailMessage}
              onChange={e => setEmailMessage(e.target.value)}
              className={`${inputClass(isGerant)} resize-y font-mono text-xs leading-relaxed`}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowEmailModal(false)}>Annuler</Button>
            <Button icon={<Send size={14} />} onClick={handleSendEmail}>Envoyer</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
