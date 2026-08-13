import { MANDAT_TYPE_LABELS } from '../types/transactions'
import type { MandatType } from '../types/transactions'

interface PdfData {
  transaction: any
  client: any
  property: any
  contract: any
  counterpartClient: any
}

function formatDate(dateStr?: string) {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR')
  } catch {
    return dateStr
  }
}

function formatBudget(min?: number, max?: number) {
  const parts: string[] = []
  if (min) parts.push(`${Number(min).toLocaleString('fr-FR')} MAD`)
  if (max) parts.push(`${Number(max).toLocaleString('fr-FR')} MAD`)
  if (parts.length === 2) return `${parts[0]} ~ ${parts[1]}`
  if (parts.length === 1) return parts[0]
  return ''
}

function brandLogo() {
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}/CRM_Official_Image.jfif`
  }
  return '/CRM_Official_Image.jfif'
}

function buildHeader(title: string, ref: string, date: string) {
  return `
    <div style="border-bottom:2px solid #2c8264;padding:24px 32px;background:linear-gradient(135deg,#f8f9fa,transparent)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
        <img src="${brandLogo()}" alt="CRM Immobilier" style="width:38px;height:38px;border-radius:8px;object-fit:cover;border:1px solid #e5e7eb" />
        <div>
          <h1 style="font-size:17px;font-weight:700;margin:0;color:#1a1a2e">CRM IMMOBILIER</h1>
          <p style="font-size:11px;margin:0;color:#6b7280;letter-spacing:0.1em;text-transform:uppercase">Immobilier — Casablanca</p>
        </div>
      </div>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:flex-end">
        <h2 style="font-size:20px;font-weight:700;margin:0;color:#1a1a2e">${title}</h2>
        <div style="text-align:right;font-size:12px;color:#6b7280">
          <div>Reference : <span style="font-family:monospace;font-weight:500;color:#1a1a2e">${ref}</span></div>
          <div>Date : ${date}</div>
          <div>Version : 1.0</div>
        </div>
      </div>
    </div>`
}

function buildHeaderVoyageur(title: string, ref: string, date: string) {
  return `
    <div style="border-bottom:2px solid #2c8264;padding:24px 32px;background:linear-gradient(135deg,#f8f9fa,transparent)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
        <img src="${brandLogo()}" alt="CRM Immobilier" style="width:38px;height:38px;border-radius:8px;object-fit:cover;border:1px solid #e5e7eb" />
        <div>
          <h1 style="font-size:17px;font-weight:700;margin:0;color:#1a1a2e">CRM IMMOBILIER</h1>
        </div>
      </div>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:flex-end">
        <h2 style="font-size:20px;font-weight:700;margin:0;color:#1a1a2e">${title}</h2>
        <div style="text-align:right;font-size:12px;color:#6b7280">
          <div>Reference : <span style="font-family:monospace;font-weight:500;color:#1a1a2e">${ref}</span></div>
          <div>Date : ${date}</div>
          <div>Version : 1.0 · Page : 1/2</div>
        </div>
      </div>
    </div>`
}

function buildSection(title: string, content: string) {
  return `
    <div style="margin-bottom:20px">
      <div style="background:#f8f9fa;padding:10px 16px;border-radius:8px 8px 0 0;border:1px solid #e5e7eb;border-bottom:none">
        <h3 style="font-size:13px;font-weight:700;margin:0;color:#1a1a2e;text-transform:uppercase;letter-spacing:0.05em">${title}</h3>
      </div>
      <div style="padding:16px;border:1px solid #e5e7eb;border-radius:0 0 8px 8px;background:white">
        ${content}
      </div>
    </div>`
}

function buildFieldRow(label: string, value: string | number | null | undefined) {
  if (!value && value !== 0) return ''
  return `<div style="display:flex;padding:6px 0;border-bottom:1px solid #f3f4f6">
    <span style="width:180px;font-size:12px;color:#6b7280;flex-shrink:0">${label}</span>
    <span style="font-size:13px;font-weight:500;color:#1a1a2e">${value}</span>
  </div>`
}

function buildSignatureBlock(name: string, role: string) {
  return `
    <div style="padding:16px;border:1px solid #e5e7eb;border-radius:8px;background:#fafafa">
      <h4 style="font-weight:600;font-size:13px;margin:0 0 6px 0;color:#1a1a2e">${role}</h4>
      <p style="font-weight:500;font-size:13px;margin:0;color:#1a1a2e">${name || 'Non renseigne'}</p>
      <div style="margin-top:16px;padding-top:8px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <p style="font-size:11px;margin:0 0 4px 0;color:#6b7280">Signature</p>
            <div style="height:40px;border-bottom:1px solid #9ca3af"></div>
          </div>
          <div>
            <p style="font-size:11px;margin:0 0 4px 0;color:#6b7280">Date</p>
            <div style="height:40px;border-bottom:1px solid #9ca3af"></div>
          </div>
        </div>
      </div>
    </div>`
}

function buildLegalMentions() {
  return `
    <div style="margin-top:24px;padding:16px;border-top:2px solid #2c8264;background:#f8f9fa;border-radius:0 0 8px 8px">
      <p style="font-size:11px;color:#6b7280;margin:0;line-height:1.6;text-align:center">
        Document genere automatiquement par CRM Immobilier<br/>
        Conformement a la legislation en vigueur au Maroc<br/>
        Tous droits reserves &copy; ${new Date().getFullYear()} CRM Immobilier
      </p>
    </div>`
}

function buildPageWrapper(content: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>CRM Immobilier - Contrat</title>
  <style>
    body { margin:0; padding:0; font-family:'Segoe UI',system-ui,-apple-system,sans-serif; color:#1a1a2e; background:#fff; }
    @page { margin:15mm; size:A4; }
    @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  </style>
</head>
<body>
  <div style="max-width:800px;margin:0 auto;padding:24px">
    ${content}
  </div>
</body>
</html>`
}

function generateAcheteurPdf(data: PdfData) {
  const { transaction: t, client: c, property: p, contract: ctr } = data
  const now = new Date().toLocaleDateString('fr-FR')
  const ref = ctr?.reference || t.reference

  let html = buildHeader('MANDAT DE RECHERCHE D\'ACHAT', ref, now)

  // Informations generales
  let infoContent = ''
  infoContent += buildFieldRow('Client', t.clientName)
  infoContent += buildFieldRow('Email', c?.email)
  infoContent += buildFieldRow('Telephone', c?.phone)
  infoContent += buildFieldRow('Type de mandat', MANDAT_TYPE_LABELS[t.type as MandatType] || t.type)
  infoContent += buildFieldRow('Date de signature', formatDate(ctr?.startDate || t.dateContrat))
  infoContent += buildFieldRow('Date d\'expiration', formatDate(ctr?.endDate || t.dateExpiration || c?.dateExpiration))
  html += buildSection('Informations generales', infoContent)

  // Criteres de recherche
  const surfaceMin = c?.surfaceMin || c?.minSurface || ''
  const surfaceMax = c?.surfaceMax || ''
  let critContent = ''
  critContent += buildFieldRow('Type de bien', c?.typeBien || p?.propertyType || '')
  critContent += buildFieldRow('Budget', formatBudget(c?.prixMin || c?.budget, c?.prixMax))
  if (surfaceMin || surfaceMax) {
    critContent += buildFieldRow('Surface', `${surfaceMin && surfaceMax ? `${surfaceMin} ~ ${surfaceMax} m2` : surfaceMin ? `${surfaceMin} m2 min` : `${surfaceMax} m2 max`}`)
  }
  critContent += buildFieldRow('Pieces', c?.pieces ? `${c.pieces}+` : '')
  critContent += buildFieldRow('Chambres', c?.chambres ? `${c.chambres}+` : '')
  critContent += buildFieldRow('Localisation', [c?.localisation, c?.secteur].filter(Boolean).join(', '))
  critContent += buildFieldRow('Criteres specifiques', c?.criteres?.join(', ') || c?.attributsPersonnalises?.join(', ') || '')
  html += buildSection('Criteres de recherche', critContent)

  // Signatures
  let sigContent = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">'
  sigContent += buildSignatureBlock(t.clientName, 'Acheteur')
  sigContent += buildSignatureBlock(t.agentName, 'Agent')
  sigContent += '</div>'
  html += buildSection('Signatures', sigContent)

  html += buildLegalMentions()

  return buildPageWrapper(html)
}

function generateVendeurPdf(data: PdfData) {
  const { transaction: t, client: c, property: p, contract: ctr } = data
  const now = new Date().toLocaleDateString('fr-FR')
  const ref = ctr?.reference || t.reference

  let html = buildHeader('MANDAT DE VENTE', ref, now)

  // Informations generales
  let infoContent = ''
  infoContent += buildFieldRow('Client', t.clientName)
  infoContent += buildFieldRow('Email', c?.email)
  infoContent += buildFieldRow('Telephone', c?.phone)
  infoContent += buildFieldRow('Type de mandat', MANDAT_TYPE_LABELS[t.type as MandatType] || t.type)
  infoContent += buildFieldRow('Date de signature', formatDate(ctr?.startDate || t.dateContrat))
  infoContent += buildFieldRow('Date d\'expiration', formatDate(ctr?.endDate || t.dateExpiration || c?.dateExpiration))
  html += buildSection('Informations generales', infoContent)

  // Informations du bien
  let bienContent = ''
  bienContent += buildFieldRow('Bien', p?.title || t.propertyTitle)
  bienContent += buildFieldRow('Reference', p?.reference || t.propertyRef)
  bienContent += buildFieldRow('Adresse', p?.address ? `${p.address}${p.city ? ', ' + p.city : ''}` : '')
  bienContent += buildFieldRow('Surface', p?.surface ? `${p.surface} m2` : '')
  if (p?.landSize) bienContent += buildFieldRow('Terrain', `${p.landSize} m2`)
  bienContent += buildFieldRow('Pieces', p?.rooms || '')
  bienContent += buildFieldRow('Chambres', p?.bedrooms || '')
  bienContent += buildFieldRow('SDB', p?.bathrooms || '')
  html += buildSection('Informations du bien', bienContent)

  // Informations financieres
  let finContent = ''
  finContent += buildFieldRow('Prix de vente FAI', c?.prixVenteFAI ? `${Number(c.prixVenteFAI).toLocaleString('fr-FR')} MAD` : '')
  finContent += buildFieldRow('Prix net vendeur', c?.prixNetVendeur ? `${Number(c.prixNetVendeur).toLocaleString('fr-FR')} MAD` : '')
  if (c?.montantRemuneration) {
    finContent += buildFieldRow('Honoraires', c.remunerationIsPercentage ? `${c.montantRemuneration}%` : `${Number(c.montantRemuneration).toLocaleString('fr-FR')} MAD`)
  }
  finContent += buildFieldRow('Type d\'honoraires', c?.typeRemuneration || '')
  finContent += buildFieldRow('Sequestre', c?.sequestre !== undefined ? `${Number(c.sequestre || 0).toLocaleString('fr-FR')} MAD` : '')
  if (Object.keys(finContent).length > 0) html += buildSection('Informations financieres', finContent)

  // Signatures
  let sigContent = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">'
  sigContent += buildSignatureBlock(t.clientName, 'Vendeur')
  sigContent += buildSignatureBlock(t.agentName, 'Agent')
  sigContent += '</div>'
  html += buildSection('Signatures', sigContent)

  html += buildLegalMentions()

  return buildPageWrapper(html)
}

function generateBailleurPdf(data: PdfData) {
  const { transaction: t, client: c, property: p, contract: ctr } = data
  const now = new Date().toLocaleDateString('fr-FR')
  const ref = ctr?.reference || t.reference

  let html = buildHeader('MANDAT DE GESTION LOCATIVE', ref, now)

  // Informations generales
  let infoContent = ''
  infoContent += buildFieldRow('Client', t.clientName)
  infoContent += buildFieldRow('Email', c?.email)
  infoContent += buildFieldRow('Telephone', c?.phone)
  infoContent += buildFieldRow('Type de mandat', MANDAT_TYPE_LABELS[t.type as MandatType] || t.type)
  infoContent += buildFieldRow('Date de signature', formatDate(ctr?.startDate || t.dateContrat))
  infoContent += buildFieldRow('Date d\'expiration', formatDate(ctr?.endDate || t.dateExpiration || c?.dateExpiration))
  html += buildSection('Informations generales', infoContent)

  // Informations du bien
  let bienContent = ''
  bienContent += buildFieldRow('Bien', p?.title || t.propertyTitle)
  bienContent += buildFieldRow('Reference', p?.reference || t.propertyRef)
  bienContent += buildFieldRow('Adresse', p?.address ? `${p.address}${p.city ? ', ' + p.city : ''}` : '')
  bienContent += buildFieldRow('Surface', p?.surface ? `${p.surface} m2` : '')
  bienContent += buildFieldRow('Pieces', p?.rooms || '')
  bienContent += buildFieldRow('Chambres', p?.bedrooms || '')
  bienContent += buildFieldRow('SDB', p?.bathrooms || '')
  html += buildSection('Informations du bien', bienContent)

  // Informations financieres
  let finContent = ''
  finContent += buildFieldRow('Loyer mensuel HC', c?.loyerHC ? `${Number(c.loyerHC).toLocaleString('fr-FR')} MAD` : '')
  finContent += buildFieldRow('Charges', c?.charges ? `${Number(c.charges).toLocaleString('fr-FR')} MAD` : '')
  if (c?.loyerHC && c?.charges) {
    finContent += buildFieldRow('Loyer CC', `${Number(c.loyerHC + c.charges).toLocaleString('fr-FR')} MAD / mois`)
  }
  finContent += buildFieldRow('Depot de garantie', c?.depotGarantie ? `${Number(c.depotGarantie).toLocaleString('fr-FR')} MAD` : '')
  if (c?.montantRemuneration) {
    finContent += buildFieldRow('Honoraires de gestion', c.remunerationIsPercentage ? `${c.montantRemuneration}%` : `${Number(c.montantRemuneration).toLocaleString('fr-FR')} MAD`)
  }
  finContent += buildFieldRow('Frais mise en location', c?.fraisMiseEnLocation ? `${Number(c.fraisMiseEnLocation).toLocaleString('fr-FR')} MAD` : '')
  html += buildSection('Informations financieres', finContent)

  // Signatures
  let sigContent = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">'
  sigContent += buildSignatureBlock(t.clientName, 'Bailleur')
  sigContent += buildSignatureBlock(t.agentName, 'Agent')
  sigContent += '</div>'
  html += buildSection('Signatures', sigContent)

  html += buildLegalMentions()

  return buildPageWrapper(html)
}

function generateLocatairePdf(data: PdfData) {
  const { transaction: t, client: c, property: p, contract: ctr } = data
  const now = new Date().toLocaleDateString('fr-FR')
  const ref = ctr?.reference || t.reference

  let html = buildHeader('MANDAT DE RECHERCHE LOCATION', ref, now)

  // Informations generales
  let infoContent = ''
  infoContent += buildFieldRow('Client', t.clientName)
  infoContent += buildFieldRow('Email', c?.email)
  infoContent += buildFieldRow('Telephone', c?.phone)
  infoContent += buildFieldRow('Type de mandat', MANDAT_TYPE_LABELS[t.type as MandatType] || t.type)
  infoContent += buildFieldRow('Date de signature', formatDate(ctr?.startDate || t.dateContrat))
  infoContent += buildFieldRow('Date d\'expiration', formatDate(ctr?.endDate || t.dateExpiration || c?.dateExpiration))
  html += buildSection('Informations generales', infoContent)

  // Criteres de recherche
  const surfaceMin = c?.surfaceMin || c?.minSurface || ''
  const surfaceMax = c?.surfaceMax || ''
  let critContent = ''
  critContent += buildFieldRow('Type de bien', c?.typeBien || p?.propertyType || '')
  critContent += buildFieldRow('Budget', c?.budget ? `${Number(c.budget).toLocaleString('fr-FR')} MAD / mois` : '')
  if (surfaceMin || surfaceMax) {
    critContent += buildFieldRow('Surface', `${surfaceMin && surfaceMax ? `${surfaceMin} ~ ${surfaceMax} m2` : surfaceMin ? `${surfaceMin} m2 min` : `${surfaceMax} m2 max`}`)
  }
  critContent += buildFieldRow('Pieces', c?.pieces ? `${c.pieces}+` : '')
  critContent += buildFieldRow('Chambres', c?.chambres ? `${c.chambres}+` : '')
  critContent += buildFieldRow('Localisation', [c?.localisation, c?.secteur].filter(Boolean).join(', '))
  critContent += buildFieldRow('Criteres specifiques', c?.criteres?.join(', ') || c?.attributsPersonnalises?.join(', ') || '')
  html += buildSection('Criteres de recherche', critContent)

  // Signatures
  let sigContent = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">'
  sigContent += buildSignatureBlock(t.clientName, 'Locataire')
  sigContent += buildSignatureBlock(t.agentName, 'Agent')
  sigContent += '</div>'
  html += buildSection('Signatures', sigContent)

  html += buildLegalMentions()

  return buildPageWrapper(html)
}

function generateVoyageurPdf(data: PdfData) {
  const { transaction: t, client: c, property: p, contract: ctr, counterpartClient: cc } = data
  const now = new Date().toLocaleDateString('fr-FR')
  const ref = ctr?.reference || t.reference

  let html = buildHeaderVoyageur('CONTRAT DE LOCATION SAISONNIERE', ref, now)

  // Informations generales
  let infoContent = '<div style="margin-bottom:12px;font-size:12px;color:#6b7280;font-style:italic">Contrat de location saisonnière</div>'
  infoContent += buildFieldRow('Voyageur', t.clientName)
  infoContent += buildFieldRow('Numero de reservation', c?.numeroReservation || '')
  infoContent += buildFieldRow('Date de reservation', formatDate(c?.dateReservation))
  infoContent += buildFieldRow('Date d\'arrivee', formatDate(c?.dateArrivee) + (c?.heureArrivee ? ' à partir de ' + c.heureArrivee : ''))
  infoContent += buildFieldRow('Date de depart', formatDate(c?.dateDepart) + (c?.heureDepart ? ' avant ' + c.heureDepart : ''))
  infoContent += buildFieldRow('Nombre de nuits', c?.nbNuits || '')
  const nbVoyageurs = [c?.nbAdultes, c?.nbEnfants ? (c.nbEnfants + ' enfants') : ''].filter(Boolean).join(' + ')
  infoContent += buildFieldRow('Nombre de voyageurs', nbVoyageurs)
  html += buildSection('Informations generales', infoContent)

  // Informations du bien
  let bienContent = ''
  bienContent += buildFieldRow('Bien', p?.title || t.propertyTitle)
  bienContent += buildFieldRow('Reference', p?.reference || t.propertyRef)
  bienContent += buildFieldRow('Adresse', p?.address ? `${p.address}${p.city ? ', ' + p.city : ''}` : '')
  bienContent += buildFieldRow('Surface', p?.surface ? `${p.surface} m2` : '')
  const piecesInfo = [
    p?.rooms ? `Pieces: ${p.rooms}` : '',
    p?.bedrooms ? `Chambres: ${p.bedrooms}` : '',
    p?.sleepingCapacity ? `Couchages: ${p.sleepingCapacity}` : ''
  ].filter(Boolean).join(' · ')
  if (piecesInfo) bienContent += buildFieldRow('', piecesInfo)
  html += buildSection('Informations du bien', bienContent)

  // Informations financieres
  let finContent = ''
  finContent += buildFieldRow('Tarif par nuit', c?.tarifNuit ? `${Number(c.tarifNuit).toLocaleString('fr-FR')} MAD` : '')
  finContent += buildFieldRow('Nombre de nuits', c?.nbNuits || '')
  finContent += buildFieldRow('Montant total (hors options)', c?.montantTotalHorsOptions ? `${Number(c.montantTotalHorsOptions).toLocaleString('fr-FR')} MAD` : '')

  // Options as bullet list
  if (c?.options && Array.isArray(c.options) && c.options.length > 0) {
    finContent += '<div style="padding:6px 0;border-bottom:1px solid #f3f4f6"><span style="width:180px;font-size:12px;color:#6b7280;display:inline-block">Options</span></div>'
    c.options.forEach((opt: any) => {
      finContent += `<div style="padding:4px 0 4px 180px;font-size:13px;color:#1a1a2e">• ${opt.label || opt.nom}${opt.montant ? ` : ${Number(opt.montant).toLocaleString('fr-FR')} MAD` : ''}</div>`
    })
  }

  finContent += buildFieldRow('Montant total (avec options)', c?.montantTotalAvecOptions ? `${Number(c.montantTotalAvecOptions).toLocaleString('fr-FR')} MAD` : '')
  const acomptePourcentage = c?.acompteMontant && c?.montantTotalAvecOptions ? ` (${Math.round((c.acompteMontant / c.montantTotalAvecOptions) * 100)}%)` : ''
  finContent += buildFieldRow('Acompte verse', c?.acompteMontant ? `${Number(c.acompteMontant).toLocaleString('fr-FR')}${acomptePourcentage} MAD` : '')
  finContent += buildFieldRow('Solde restant', c?.soldeRestant ? `${Number(c.soldeRestant).toLocaleString('fr-FR')} MAD` : '')
  finContent += buildFieldRow('Caution', c?.cautionMontant ? `${Number(c.cautionMontant).toLocaleString('fr-FR')} MAD` : '')
  html += buildSection('Informations financieres', finContent)

  // Acces et codes
  let accesContent = ''
  accesContent += buildFieldRow('Boite a cles', c?.boiteACles || '')
  accesContent += buildFieldRow('Portail', c?.codePortail || '')
  accesContent += buildFieldRow('Appartement', c?.codeAppartement || '')
  accesContent += buildFieldRow('Parking', c?.codeParking || '')
  accesContent += buildFieldRow('WiFi', c?.wifiReseau && c?.wifiMotDePasse ? `${c.wifiReseau} / ${c.wifiMotDePasse}` : c?.wifiReseau || '')
  html += buildSection('Acces et codes', accesContent)

  // Signatures
  let sigContent = '<div style="display:flex;flex-direction:column;gap:20px">'
  sigContent += buildSignatureBlock(t.clientName, 'Voyageur')
  sigContent += buildSignatureBlock(cc?.name || 'Bailleur', 'Bailleur')
  sigContent += buildSignatureBlock(t.agentName, 'Agent')
  sigContent += '</div>'
  html += buildSection('Signatures', sigContent)

  html += buildLegalMentions()

  return buildPageWrapper(html)
}

export function generateContratHtml(data: PdfData): string {
  const { transaction: t } = data
  const clientType = t.clientType || ''

  switch (clientType) {
    case 'Acheteur':
      return generateAcheteurPdf(data)
    case 'Vendeur':
      return generateVendeurPdf(data)
    case 'Bailleur':
      return generateBailleurPdf(data)
    case 'Locataire':
      return generateLocatairePdf(data)
    case 'Voyageur':
      return generateVoyageurPdf(data)
    default:
      return generateVendeurPdf(data)
  }
}

export function generateContratPdf(data: PdfData) {
  const html = generateContratHtml(data)
  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 600)
  }
}

function csvRow(fields: (string | number | null | undefined)[]) {
  return fields.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(',')
}

function csvValue(v: any): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'number') return v.toLocaleString('fr-FR')
  return String(v)
}

function csvField(label: string, value: any): [string, string] {
  return [label, csvValue(value)]
}

export function generateContratCsv(data: PdfData): string {
  const { transaction: t, client: c, property: p, contract: ctr, counterpartClient: cc } = data
  const clientType = t.clientType || ''
  const ref = ctr?.reference || t.reference
  const mandatLabel = MANDAT_TYPE_LABELS[t.type as MandatType] || t.type

  const rows: [string, string][] = []

  // Shared header
  rows.push(['CRM IMMOBILIER - CONTRAT / MANDAT', ''])
  rows.push(['Reference', ref || ''])
  rows.push(['Type de document', mandatLabel || ''])
  rows.push(['Type de client', clientType])
  rows.push(['Agent', t.agentName || ''])
  rows.push(['', ''])

  if (clientType === 'Acheteur') {
    rows.push(['INFORMATIONS GENERALES', ''])
    rows.push(...csvSectionFields([
      csvField('Client', t.clientName),
      csvField('Email', c?.email),
      csvField('Telephone', c?.phone),
      csvField('Date de signature', formatDate(ctr?.startDate || t.dateContrat)),
      csvField('Date d\'expiration', formatDate(ctr?.endDate || t.dateExpiration || c?.dateExpiration)),
    ]))
    rows.push(['', ''])
    rows.push(['CRITERES DE RECHERCHE', ''])
    rows.push(...csvSectionFields([
      csvField('Type de bien', c?.typeBien || p?.propertyType || ''),
      csvField('Budget min', c?.prixMin || c?.budget),
      csvField('Budget max', c?.prixMax),
      csvField('Surface min', c?.surfaceMin || c?.minSurface),
      csvField('Surface max', c?.surfaceMax),
      csvField('Pieces', c?.pieces),
      csvField('Chambres', c?.chambres),
      csvField('Localisation', [c?.localisation, c?.secteur].filter(Boolean).join(', ')),
      csvField('Criteres specifiques', c?.criteres?.join(', ') || c?.attributsPersonnalises?.join(', ')),
    ]))
  }

  else if (clientType === 'Vendeur') {
    rows.push(['INFORMATIONS GENERALES', ''])
    rows.push(...csvSectionFields([
      csvField('Client', t.clientName),
      csvField('Email', c?.email),
      csvField('Telephone', c?.phone),
      csvField('Date de signature', formatDate(ctr?.startDate || t.dateContrat)),
      csvField('Date d\'expiration', formatDate(ctr?.endDate || t.dateExpiration || c?.dateExpiration)),
    ]))
    rows.push(['', ''])
    rows.push(['INFORMATIONS DU BIEN', ''])
    rows.push(...csvSectionFields([
      csvField('Bien', p?.title || t.propertyTitle),
      csvField('Reference', p?.reference || t.propertyRef),
      csvField('Adresse', p?.address ? `${p.address}${p.city ? ', ' + p.city : ''}` : ''),
      csvField('Surface', p?.surface ? p.surface + ' m2' : ''),
      csvField('Pieces', p?.rooms),
      csvField('Chambres', p?.bedrooms),
      csvField('SDB', p?.bathrooms),
    ]))
    rows.push(['', ''])
    rows.push(['INFORMATIONS FINANCIERES', ''])
    rows.push(...csvSectionFields([
      csvField('Prix de vente FAI', c?.prixVenteFAI),
      csvField('Prix net vendeur', c?.prixNetVendeur),
      csvField('Honoraires', c?.montantRemuneration ? (c.remunerationIsPercentage ? c.montantRemuneration + '%' : c.montantRemuneration) : ''),
      csvField('Type d\'honoraires', c?.typeRemuneration),
      csvField('Sequestre', c?.sequestre),
    ]))
  }

  else if (clientType === 'Bailleur') {
    rows.push(['INFORMATIONS GENERALES', ''])
    rows.push(...csvSectionFields([
      csvField('Client', t.clientName),
      csvField('Email', c?.email),
      csvField('Telephone', c?.phone),
      csvField('Date de signature', formatDate(ctr?.startDate || t.dateContrat)),
      csvField('Date d\'expiration', formatDate(ctr?.endDate || t.dateExpiration || c?.dateExpiration)),
    ]))
    rows.push(['', ''])
    rows.push(['INFORMATIONS DU BIEN', ''])
    rows.push(...csvSectionFields([
      csvField('Bien', p?.title || t.propertyTitle),
      csvField('Reference', p?.reference || t.propertyRef),
      csvField('Adresse', p?.address ? `${p.address}${p.city ? ', ' + p.city : ''}` : ''),
      csvField('Surface', p?.surface ? p.surface + ' m2' : ''),
      csvField('Pieces', p?.rooms),
      csvField('Chambres', p?.bedrooms),
      csvField('SDB', p?.bathrooms),
    ]))
    rows.push(['', ''])
    rows.push(['INFORMATIONS FINANCIERES', ''])
    rows.push(...csvSectionFields([
      csvField('Loyer mensuel HC', c?.loyerHC),
      csvField('Charges', c?.charges),
      csvField('Loyer CC', c?.loyerHC && c?.charges ? Number(c.loyerHC) + Number(c.charges) : ''),
      csvField('Depot de garantie', c?.depotGarantie),
      csvField('Honoraires de gestion', c?.montantRemuneration ? (c.remunerationIsPercentage ? c.montantRemuneration + '%' : c.montantRemuneration) : ''),
      csvField('Frais mise en location', c?.fraisMiseEnLocation),
    ]))
  }

  else if (clientType === 'Locataire') {
    rows.push(['INFORMATIONS GENERALES', ''])
    rows.push(...csvSectionFields([
      csvField('Client', t.clientName),
      csvField('Email', c?.email),
      csvField('Telephone', c?.phone),
      csvField('Date de signature', formatDate(ctr?.startDate || t.dateContrat)),
      csvField('Date d\'expiration', formatDate(ctr?.endDate || t.dateExpiration || c?.dateExpiration)),
    ]))
    rows.push(['', ''])
    rows.push(['CRITERES DE RECHERCHE', ''])
    rows.push(...csvSectionFields([
      csvField('Type de bien', c?.typeBien || p?.propertyType || ''),
      csvField('Budget', c?.budget),
      csvField('Surface min', c?.surfaceMin || c?.minSurface),
      csvField('Surface max', c?.surfaceMax),
      csvField('Pieces', c?.pieces),
      csvField('Chambres', c?.chambres),
      csvField('Localisation', [c?.localisation, c?.secteur].filter(Boolean).join(', ')),
      csvField('Criteres specifiques', c?.criteres?.join(', ') || c?.attributsPersonnalises?.join(', ')),
    ]))
  }

  else if (clientType === 'Voyageur') {
    const nbVoyageurs = [c?.nbAdultes, c?.nbEnfants ? c.nbEnfants + ' enfants' : ''].filter(Boolean).join(' + ')
    rows.push(['INFORMATIONS GENERALES', ''])
    rows.push(...csvSectionFields([
      csvField('Voyageur', t.clientName),
      csvField('Numero de reservation', c?.numeroReservation),
      csvField('Date de reservation', formatDate(c?.dateReservation)),
      csvField('Date d\'arrivee', formatDate(c?.dateArrivee) + (c?.heureArrivee ? ' a partir de ' + c.heureArrivee : '')),
      csvField('Date de depart', formatDate(c?.dateDepart) + (c?.heureDepart ? ' avant ' + c.heureDepart : '')),
      csvField('Nombre de nuits', c?.nbNuits),
      csvField('Nombre de voyageurs', nbVoyageurs),
    ]))
    rows.push(['', ''])
    rows.push(['INFORMATIONS DU BIEN', ''])
    rows.push(...csvSectionFields([
      csvField('Bien', p?.title || t.propertyTitle),
      csvField('Reference', p?.reference || t.propertyRef),
      csvField('Adresse', p?.address ? `${p.address}${p.city ? ', ' + p.city : ''}` : ''),
      csvField('Surface', p?.surface ? p.surface + ' m2' : ''),
      csvField('Pieces', p?.rooms),
      csvField('Chambres', p?.bedrooms),
      csvField('Couchages', p?.sleepingCapacity),
    ]))
    rows.push(['', ''])
    rows.push(['INFORMATIONS FINANCIERES', ''])
    rows.push(...csvSectionFields([
      csvField('Tarif par nuit', c?.tarifNuit),
      csvField('Nombre de nuits', c?.nbNuits),
      csvField('Montant total (hors options)', c?.montantTotalHorsOptions),
    ]))
    if (c?.options && Array.isArray(c.options) && c.options.length > 0) {
      c.options.forEach((opt: any, i: number) => {
        rows.push([`Option ${i + 1}`, `${opt.label || opt.nom}${opt.montant ? ' : ' + csvValue(opt.montant) + ' MAD' : ''}`])
      })
    }
    rows.push(...csvSectionFields([
      csvField('Montant total (avec options)', c?.montantTotalAvecOptions),
      csvField('Acompte verse', c?.acompteMontant ? csvValue(c.acompteMontant) + (c?.acompteMontant && c?.montantTotalAvecOptions ? ' (' + Math.round((c.acompteMontant / c.montantTotalAvecOptions) * 100) + '%)' : '') : ''),
      csvField('Solde restant', c?.soldeRestant),
      csvField('Caution', c?.cautionMontant),
    ]))
    rows.push(['', ''])
    rows.push(['ACCES ET CODES', ''])
    rows.push(...csvSectionFields([
      csvField('Boite a cles', c?.boiteACles),
      csvField('Portail', c?.codePortail),
      csvField('Appartement', c?.codeAppartement),
      csvField('Parking', c?.codeParking),
      csvField('WiFi', c?.wifiReseau && c?.wifiMotDePasse ? c.wifiReseau + ' / ' + c.wifiMotDePasse : c?.wifiReseau),
    ]))
  }

  return rows.map(r => csvRow(r)).join('\n')
}

function csvSectionFields(fields: [string, any][]): [string, string][] {
  return fields.filter(([, v]) => v !== null && v !== undefined && v !== '').map(([label, value]) => [label, csvValue(value)])
}

// Build a PdfData payload from the normalized Contract object used on the
// contract detail page so the same voyageur PDF generator can be reused.
export function buildContractPdfData(contract: any, agentName?: string): PdfData {
  const nights = (() => {
    if (contract?.dateArrivee && contract?.dateDepart) {
      const d = Math.round(
        (new Date(contract.dateDepart).getTime() - new Date(contract.dateArrivee).getTime()) / (1000 * 60 * 60 * 24)
      )
      return d > 0 ? d : undefined
    }
    return undefined
  })()
  const total = contract?.prixTotalSejour ?? contract?.amount
  return {
    transaction: {
      clientName: contract?.partieA?.name || contract?.clientName || '',
      clientType: 'Voyageur',
      agentName: agentName || contract?.agentPrincipal || contract?.agentName || '',
      reference: contract?.reference || '',
      propertyTitle: contract?.propertyTitle || '',
      propertyRef: contract?.propertyRef || '',
    },
    client: {
      email: contract?.partieA?.email || '',
      phone: contract?.partieA?.phone || '',
      dateArrivee: contract?.dateArrivee || contract?.startDate,
      dateDepart: contract?.dateDepart || contract?.endDate,
      nbNuits: nights,
      tarifNuit: nights && total ? Math.round(total / nights) : undefined,
      montantTotalHorsOptions: total,
      montantTotalAvecOptions: total,
      acompteMontant: contract?.acompteVerse,
      soldeRestant: contract?.soldeRestant,
      cautionMontant: contract?.caution,
    },
    property: {
      title: contract?.propertyTitle || '',
      reference: contract?.propertyRef || '',
      address: contract?.propertyAddress || '',
    },
    contract: {
      reference: contract?.reference || '',
      startDate: contract?.dateArrivee || contract?.startDate,
      endDate: contract?.dateDepart || contract?.endDate,
    },
    counterpartClient: {
      name: contract?.partieB?.name || '',
      email: contract?.partieB?.email || '',
      phone: contract?.partieB?.phone || '',
    },
  }
}
