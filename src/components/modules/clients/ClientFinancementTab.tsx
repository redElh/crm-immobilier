import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import { Client } from '../../../types/client';
import {
  DollarSign, TrendingUp, CreditCard, Briefcase, Calendar, Mail,
  RefreshCw, CheckCircle, Upload, FileText, Percent, AlertCircle, Download,
  Send, Printer, Clock, User
} from 'react-feather';
import { useToast } from '../../ui/Toast';
import { Select } from '../../ui/Select';
import { DatePicker } from '../../ui/DatePicker';
import {
  StageField, StageSection, StagePill, StageHeroAmount, useDetailAccent,
} from './ClientInfos/ClientDetailStage';

interface Props {
  client: Client;
  isGerant?: boolean;
}

const formatMontant = (v: number) => v.toLocaleString('fr-FR');

const statutFinancementColor = (statut: string | undefined, isGerant: boolean) => {
  switch (statut) {
    case 'Accordé': case 'Accorde': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'En cours': return 'bg-accent/10 text-accent border-accent/20';
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

  /* Staged theme accents (Acheteur). */
  const { isDark, accent, ink } = useDetailAccent(client.type, isGerant);

  const inputClass = `h-10 w-full rounded-xl border px-3 text-sm backdrop-blur-sm transition-all focus:outline-none focus:ring-2 ${isDark ? 'border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500' : 'border-slate-200/70 bg-white/75 text-slate-900 placeholder:text-slate-400 shadow-sm'} ${isDark ? 'focus:border-violet-400/40 focus:ring-violet-400/20' : 'focus:border-teal-500/40 focus:ring-teal-500/20'}`;
  const labelClass = `mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`;

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
    <div className="space-y-5">
      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap items-center gap-2"
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-xl border"
          style={isDark
            ? { background: `${accent.a}14`, borderColor: `${accent.a}30`, color: accent.a }
            : { background: `${accent.a}12`, borderColor: `${accent.a}30`, color: ink }}
        >
          <DollarSign size={15} />
        </span>
        <h3 className={`text-sm font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Financement — {client.name}
        </h3>
        <StagePill label={c.typeFinancement || 'Non défini'} hue={accent} isDark={isDark} />
      </motion.div>

      {isPretBancaire && (
        <StageSection icon={TrendingUp} title="Revenus & Charges" accent={accent} ink={ink} isDark={isDark} delay={0.05}>
          <StageField icon={DollarSign} label="Revenus mensuels nets" value={`${formatMontant(revenusNets)} ${devise}`} accent={accent} ink={ink} isDark={isDark} />
          <StageField icon={DollarSign} label="Revenus supplémentaires" value={`${formatMontant(client.revenusSupplementaires || 0)} ${devise}`} accent={accent} ink={ink} isDark={isDark} />
          <StageField icon={AlertCircle} label="Charges de crédit en cours" value={`${formatMontant(chargesCredit)} ${devise}`} accent={accent} ink={ink} isDark={isDark} />
          <StageField icon={AlertCircle} label="Charges fixes" value={`${formatMontant(client.chargesFixes || 0)} ${devise}`} accent={accent} ink={ink} isDark={isDark} />
        </StageSection>
      )}

      {/* Résultat du calcul */}
      <StageSection icon={TrendingUp} title="Résultat du calcul" accent={accent} ink={ink} isDark={isDark} delay={0.1}>
        {isPretBancaire && (
          <StageField icon={Calendar} label="Mensualité max (35% − charges)" value={`${formatMontant(mensualiteMax)} ${devise}`} accent={accent} ink={ink} isDark={isDark} />
        )}
        {isPretBancaire && (
          <StageField icon={DollarSign} label="Montant empruntable" value={`${formatMontant(montantEmpruntable)} ${devise}`} accent={accent} ink={ink} isDark={isDark} />
        )}
        <StageField icon={CreditCard} label="Apport personnel" value={`${formatMontant(apport)} ${devise}`} accent={accent} ink={ink} isDark={isDark} />
      </StageSection>

      <StageHeroAmount
        icon={TrendingUp}
        label="Capacité d'emprunt estimée"
        value={`${formatMontant(capaciteCalculee)} ${devise}`}
        accent={accent}
        ink={ink}
        isDark={isDark}
        delay={0.12}
      />

      {client.prixMin && client.prixMax && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-xs font-bold backdrop-blur-sm ${
            isAboveBudget
              ? isDark ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : 'border-emerald-300/60 bg-emerald-50 text-emerald-700'
              : isDark ? 'border-accent/30 bg-accent/[0.08] text-accent' : 'border-accent/30 bg-accent/[0.08] text-accent'
          }`}
        >
          {isAboveBudget ? <CheckCircle size={14} className="shrink-0" /> : <AlertCircle size={14} className="shrink-0" />}
          {isAboveBudget
            ? 'Ce client peut acheter dans sa fourchette de budget'
            : 'Ce client est en dessous de son budget cible'}
        </motion.div>
      )}

      {isPretBancaire && (
        <StageSection icon={Percent} title="Détails du prêt" accent={accent} ink={ink} isDark={isDark} delay={0.15}>
          <StageField icon={DollarSign} label="Montant du prêt souhaité" value={`${formatMontant(client.montantPretSouhaite || 0)} ${devise}`} accent={accent} ink={ink} isDark={isDark} />
          <StageField icon={TrendingUp} label="Taux envisagé" value={`${client.tauxEnvisage || 3.5} %`} accent={accent} ink={ink} isDark={isDark} />
          <StageField icon={Calendar} label="Durée" value={`${c.dureePret || 20} ans`} accent={accent} ink={ink} isDark={isDark} />
          <StageField icon={TrendingUp} label="TAEG" value={`${client.taeg || 0} %`} accent={accent} ink={ink} isDark={isDark} />
          <StageField icon={CreditCard} label="Assurance emprunteur" value={`${client.assuranceEmprunteur || 0} %`} accent={accent} ink={ink} isDark={isDark} />
        </StageSection>
      )}

      {isComptant && client.montantTotal !== undefined && client.montantTotal > 0 && (
        <StageSection icon={DollarSign} title="Paiement comptant" accent={accent} ink={ink} isDark={isDark} delay={0.15}>
          <StageField icon={DollarSign} label="Montant total" value={`${formatMontant(client.montantTotal)} ${devise}`} accent={accent} ink={ink} isDark={isDark} />
        </StageSection>
      )}

      {isAutre && (
        <StageSection icon={FileText} title="Détails du financement" accent={accent} ink={ink} isDark={isDark} delay={0.15}>
          {c.descriptionAutreFinancement && (
            <StageField icon={FileText} label="Description" value={c.descriptionAutreFinancement} accent={accent} ink={ink} isDark={isDark} />
          )}
          {client.montantTotal !== undefined && client.montantTotal > 0 && (
            <StageField icon={DollarSign} label="Montant" value={`${formatMontant(client.montantTotal)} ${devise}`} accent={accent} ink={ink} isDark={isDark} />
          )}
        </StageSection>
      )}

      {(isPretBancaire || isAutre) && (
        <StageSection icon={Briefcase} title="Informations bancaires" accent={accent} ink={ink} isDark={isDark} delay={0.2}>
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
                <div className={`flex items-center gap-3 rounded-2xl border p-3 backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75 shadow-sm'}`}>
                  <FileText size={15} style={{ color: ink }} className="shrink-0" />
                  <span className={`flex-1 truncate text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>attestation.pdf</span>
                  <Button variant="outline" size="sm" icon={<Download size={14} />}>Télécharger</Button>
                </div>
              ) : (
                <div>
                  <Button variant="outline" size="sm" icon={<Upload size={14} />}>Upload</Button>
                </div>
              )}
            </div>
          )}
          {isPretBancaire && (
            <div>
              <label className={labelClass}>Taux obtenu</label>
              <div className="relative">
                <input type="number" step="0.1" value={tauxObtenu} onChange={e => setTauxObtenu(Number(e.target.value))} className={`${inputClass} pr-8`} />
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>%</span>
              </div>
            </div>
          )}
          {isPretBancaire && (
            <div>
              <label className={labelClass}>Statut du financement</label>
              <Select
                value={statutFinancement}
                onChange={(val: string) => setStatutFinancement(val)}
                options={[{ value: '', label: 'Non défini' }, ...STATUT_FINANCEMENT_OPTIONS]}
              />
            </div>
          )}
          {isPretBancaire && (
            <div>
              <label className={labelClass}>Date d'obtention</label>
              <DatePicker
                value={dateObtention}
                onChange={e => setDateObtention(e.target.value)}
              />
            </div>
          )}
          {isPretBancaire && (
            <div>
              <label className={labelClass}>Attestation de prêt</label>
              {client.attestationPretUrl ? (
                <div className={`flex items-center gap-3 rounded-2xl border p-3 backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75 shadow-sm'}`}>
                  <FileText size={15} style={{ color: ink }} className="shrink-0" />
                  <span className={`flex-1 truncate text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>attestation.pdf</span>
                  <Button variant="outline" size="sm" icon={<Download size={14} />}>Télécharger</Button>
                </div>
              ) : (
                <div>
                  <Button variant="outline" size="sm" icon={<Upload size={14} />}>Upload</Button>
                </div>
              )}
            </div>
          )}
        </StageSection>
      )}

      {(c.situationActuelle || c.urgence || c.dateEmmenagement || client.notes) && (
        <StageSection icon={FileText} title="Notes & Informations complémentaires" accent={accent} ink={ink} isDark={isDark} delay={0.25}>
          {c.situationActuelle && (
            <StageField icon={User} label="Situation actuelle" value={c.situationActuelle} accent={accent} ink={ink} isDark={isDark} />
          )}
          {c.urgence && (
            <StageField icon={Clock} label="Urgence" value={c.urgence} accent={accent} ink={ink} isDark={isDark} />
          )}
          {c.dateEmmenagement && (
            <StageField icon={Calendar} label="Date souhaitée d'emménagement" value={new Date(c.dateEmmenagement).toLocaleDateString('fr-FR')} accent={accent} ink={ink} isDark={isDark} />
          )}
          {client.notes && (
            <StageField icon={FileText} label="Notes complémentaires" value={client.notes} accent={accent} ink={ink} isDark={isDark} />
          )}
        </StageSection>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={`flex flex-wrap items-center gap-2 rounded-2xl border p-3 backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75 shadow-sm'}`}
      >
        <span className={`mr-auto text-[10px] font-bold uppercase tracking-[0.14em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Actions
        </span>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={openEmailModal}
          className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-xs font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95"
style={isGerant
  ? { backgroundImage: `linear-gradient(145deg, ${accent.a} 0%, ${accent.b} 100%)`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 26px -10px ${accent.glow}` }
  : isDark
              ? { backgroundImage: 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 26px -8px rgba(124,92,255,0.65)' }
              : { backgroundImage: 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 26px -10px rgba(13,148,136,0.6)' }}
        >
          <Mail size={14} />
          Envoyer à l'acheteur
        </motion.button>
        <button
          type="button"
          onClick={handleExportPdf}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white text-slate-600 shadow-sm hover:bg-white hover:text-slate-900'}`}
        >
          <FileText size={14} />
          Exporter PDF
        </button>
      </motion.div>

      <Dialog isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} title="Envoyer le financement à l'acheteur" size="lg">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Destinataire</label>
            <input
              type="email"
              value={emailTo}
              onChange={e => setEmailTo(e.target.value)}
              className={inputClass}
              placeholder="email@exemple.com"
            />
          </div>
          <div>
            <label className={labelClass}>Objet</label>
            <input
              type="text"
              value={emailSubject}
              onChange={e => setEmailSubject(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Message</label>
            <textarea
              rows={18}
              value={emailMessage}
              onChange={e => setEmailMessage(e.target.value)}
              className={`${inputClass} resize-y font-mono text-xs leading-relaxed`}
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
