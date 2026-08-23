import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export interface MandatTarifRow {
  prixNuit?: string
  prixSemaine?: string
  minNuits?: string
}

export interface MandatSaisonnierData {
  // Article 1 — Le Mandant
  nomPrenom?: string
  cinPasseportRc?: string
  adresseMandant?: string
  telephone?: string
  email?: string
  nationalite?: string
  // Article 2 — Désignation du bien
  natureBien?: string
  adresseBien?: string
  superficie?: string
  nbPieces?: string
  nbChambres?: string
  capaciteAccueil?: string
  etageNiveau?: string
  referenceInterne?: string
  titreFoncier?: string
  // Article 4 — Durée
  dureeType?: 'un_an' | 'deux_ans' | 'determinee' | ''
  dureeDeterminee?: string
  dateEffet?: string
  dateEcheance?: string
  // Article 5 — Tarification
  remiseLimitePct?: string
  // Article 6 — Honoraires
  commissionPct?: string
  miseEnLocationMad?: string
  menageMad?: string
  etatLieuxMad?: string
  // Article 7 — Dépôt de garantie
  depotMontantMad?: string
  depotPourcent?: string
  depotDelaiJours?: string
  // Annexe 1 — État descriptif du bien
  equipCuisine?: string
  electromenager?: string
  mobilierSalon?: string
  chambresLiterie?: string
  sallesBain?: string
  climatisation?: string
  piscineJacuzzi?: string
  terrasseJardin?: string
  wifiTv?: string
  lingeFourni?: 'oui' | 'non' | ''
  lingeQuantite?: string
  parking?: string
  observations?: string
  // Annexe 2 — Calendrier tarifaire
  tarifBasse?: MandatTarifRow
  tarifMoyenne?: MandatTarifRow
  tarifHaute?: MandatTarifRow
  tarifTresHaute?: MandatTarifRow
  tarifEvenements?: MandatTarifRow
}

export function mandatSaisonnierHasContent(d?: MandatSaisonnierData | null): boolean {
  if (!d) return false
  const scalars = [
    d.nomPrenom, d.cinPasseportRc, d.adresseMandant, d.telephone, d.email, d.nationalite,
    d.natureBien, d.adresseBien, d.superficie, d.nbPieces, d.nbChambres, d.capaciteAccueil,
    d.etageNiveau, d.titreFoncier, d.dureeDeterminee, d.dateEffet, d.dateEcheance,
    d.remiseLimitePct, d.commissionPct, d.miseEnLocationMad, d.menageMad, d.etatLieuxMad,
    d.depotMontantMad, d.depotPourcent, d.depotDelaiJours,
    d.equipCuisine, d.electromenager, d.mobilierSalon, d.chambresLiterie, d.sallesBain,
    d.climatisation, d.piscineJacuzzi, d.terrasseJardin, d.wifiTv, d.lingeQuantite,
    d.parking, d.observations,
  ]
  if (scalars.some(v => typeof v === 'string' && v.trim() !== '')) return true
  if (d.dureeType) return true
  if (d.lingeFourni) return true
  const rows = [d.tarifBasse, d.tarifMoyenne, d.tarifHaute, d.tarifTresHaute, d.tarifEvenements]
  return rows.some(r => r && [r.prixNuit, r.prixSemaine, r.minNuits].some(v => typeof v === 'string' && v.trim() !== ''))
}

// WinAnsi-safe text (standard Helvetica font cannot encode arbitrary unicode)
function sanitize(input: unknown): string {
  let s = String(input ?? '')
  s = s
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[\u00A0\u202F\u2009]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  // Drop anything outside WinAnsi coverage
  return s.replace(/[^\x20-\x7E\u00A1-\u00FF\u20AC]/g, '')
}

const BODY_SIZE = 9
const TABLE_SIZE = 8

interface AnchorDraw {
  page: import('pdf-lib').PDFPage
  x: number
  y: number
  maxW?: number
  size?: number
  alignRight?: boolean
}

export async function generateMandatSaisonnierPdf(data: MandatSaisonnierData): Promise<Blob> {
  const res = await fetch('/templates/SQUARE_METER_template_Mandat_Location_Saisonniere.pdf', {
    headers: { Accept: 'application/pdf' },
  })
  if (!res.ok) throw new Error(`Template introuvable (${res.status})`)
  const bytes = new Uint8Array(await res.arrayBuffer())

  const pdfDoc = await PDFDocument.load(bytes)
  const pages = pdfDoc.getPages()
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const inkColor = rgb(0.13, 0.15, 0.35)

  const put = ({ page, x, y, maxW, size = BODY_SIZE, alignRight = false }: AnchorDraw, rawText: unknown) => {
    const text = sanitize(rawText)
    if (!text || !page) return
    let fs = size
    while (fs > 5.5 && helv.widthOfTextAtSize(text, fs) > (maxW ?? Infinity)) fs -= 0.25
    const w = helv.widthOfTextAtSize(text, fs)
    page.drawText(text, {
      x: alignRight ? x + (maxW ?? 0) - w : x,
      y,
      size: fs,
      font: helv,
      color: inkColor,
    })
  }

  // Draw an "X" centered inside a checkbox glyph box (bx, by = bottom-left of the ☐ glyph)
  const checkX = (pageIdx: number, bx: number, by: number, bw = 8.7, bh = 10.1) => {
    const page = pages[pageIdx]
    if (!page) return
    const size = Math.min(bh * 0.82, bw * 1.5)
    const tw = helvBold.widthOfTextAtSize('X', size)
    const capH = size * 0.72
    page.drawText('X', {
      x: bx + (bw - tw) / 2,
      y: by + (bh - capH) / 2 - bh * 0.06,
      size,
      font: helvBold,
      color: rgb(0.05, 0.3, 0.15),
    })
  }

  const p = (i: number) => pages[i]

  /* ================= PAGE 1 — ARTICLE 1 & 2 ================= */
  put({ page: p(0), x: 235.5, y: 574.1, maxW: 218 }, data.nomPrenom)
  put({ page: p(0), x: 154.5, y: 559.0, maxW: 218 }, data.cinPasseportRc)
  put({ page: p(0), x: 144.5, y: 543.6, maxW: 218 }, data.adresseMandant)
  put({ page: p(0), x: 114.5, y: 528.5, maxW: 218 }, data.telephone)
  put({ page: p(0), x: 131.5, y: 513.4, maxW: 218 }, data.email)
  put({ page: p(0), x: 116.5, y: 498.0, maxW: 218 }, data.nationalite)

  put({ page: p(0), x: 277, y: 293.5, maxW: 216 }, data.natureBien)
  put({ page: p(0), x: 178, y: 278.4, maxW: 216 }, data.adresseBien)
  put({ page: p(0), x: 194.5, y: 263.0, maxW: 216 }, data.superficie ? `${sanitize(data.superficie)} m²` : '')
  put({ page: p(0), x: 145.5, y: 247.9, maxW: 102 }, data.nbPieces)
  put({ page: p(0), x: 361, y: 247.9, maxW: 102 }, data.nbChambres)
  put({ page: p(0), x: 196, y: 232.6, maxW: 102 }, data.capaciteAccueil)
  put({ page: p(0), x: 383, y: 232.6, maxW: 102 }, data.etageNiveau)
  put({ page: p(0), x: 177.5, y: 217.4, maxW: 216 }, data.referenceInterne)
  put({ page: p(0), x: 299.5, y: 202.3, maxW: 216 }, data.titreFoncier)

  /* ================= PAGE 2 — ARTICLE 4 & 5 ================= */
  const boxesY2 = 381.8
  if (data.dureeType === 'un_an') checkX(1, 64.5, boxesY2)
  if (data.dureeType === 'deux_ans') checkX(1, 133.1, boxesY2)
  if (data.dureeType === 'determinee') checkX(1, 214.7, boxesY2)
  if (data.dureeType === 'determinee' && sanitize(data.dureeDeterminee)) {
    // "Durée déterminée : ________________________" item starts at x=227.8
    const prefixW = helv.widthOfTextAtSize('Durée déterminée : ', BODY_SIZE)
    put({ page: p(1), x: 227.8 + prefixW + 2, y: boxesY2, maxW: 95 }, data.dureeDeterminee)
  }
  put({ page: p(1), x: 155.5, y: 351.1, maxW: 100 }, formatDateFr(data.dateEffet))
  put({ page: p(1), x: 350, y: 351.1, maxW: 100 }, formatDateFr(data.dateEcheance))

  if (sanitize(data.remiseLimitePct)) {
    // Line at x=60,y=174: "... dans la limite de _______ % ..."
    const prefixW = helv.widthOfTextAtSize(
      "L'Agence est autorisée à consentir des remises tarifaires dans la limite de ",
      BODY_SIZE
    )
    put({ page: p(1), x: 60 + prefixW + 2, y: 174.0, maxW: 32 }, data.remiseLimitePct)
  }

  /* ================= PAGE 3 — ARTICLE 6 & 7 ================= */
  put({ page: p(2), x: 302, y: 685.7, maxW: 34 }, data.commissionPct)
  put({ page: p(2), x: 296, y: 653.3, maxW: 34 }, data.miseEnLocationMad)
  put({ page: p(2), x: 296, y: 620.9, maxW: 34 }, data.menageMad)
  put({ page: p(2), x: 296, y: 577.2, maxW: 34 }, data.etatLieuxMad)

  if (sanitize(data.depotMontantMad)) put({ page: p(2), x: 62, y: 410.2, maxW: 33 }, data.depotMontantMad)
  if (sanitize(data.depotPourcent)) {
    const prefixW = helv.widthOfTextAtSize('_______ MAD (ou ', BODY_SIZE)
    put({ page: p(2), x: 60 + prefixW + 2, y: 410.2, maxW: 32 }, data.depotPourcent)
  }
  if (sanitize(data.depotDelaiJours)) put({ page: p(2), x: 62, y: 381.8, maxW: 33 }, data.depotDelaiJours)

  /* ================= PAGE 6 — ANNEXE 1 ================= */
  const refBien = sanitize(data.referenceInterne)
  if (refBien) {
    const prefixW = helv.widthOfTextAtSize('Référence du bien : ', BODY_SIZE)
    put({ page: p(5), x: 60 + prefixW + 2, y: 623.3, maxW: 180 }, refBien)
    put({ page: p(6), x: 60 + prefixW + 2, y: 623.3, maxW: 180 }, refBien)
  }
  put({ page: p(5), x: 269, y: 584.2, maxW: 186, size: TABLE_SIZE }, data.equipCuisine)
  put({ page: p(5), x: 269, y: 564.5, maxW: 186, size: TABLE_SIZE }, data.electromenager)
  put({ page: p(5), x: 269, y: 545.0, maxW: 186, size: TABLE_SIZE }, data.mobilierSalon)
  put({ page: p(5), x: 269, y: 525.6, maxW: 186, size: TABLE_SIZE }, data.chambresLiterie)
  put({ page: p(5), x: 269, y: 506.2, maxW: 186, size: TABLE_SIZE }, data.sallesBain)
  put({ page: p(5), x: 269, y: 486.7, maxW: 186, size: TABLE_SIZE }, data.climatisation)
  put({ page: p(5), x: 269, y: 467.0, maxW: 186, size: TABLE_SIZE }, data.piscineJacuzzi)
  put({ page: p(5), x: 269, y: 447.6, maxW: 186, size: TABLE_SIZE }, data.terrasseJardin)
  put({ page: p(5), x: 269, y: 428.2, maxW: 186, size: TABLE_SIZE }, data.wifiTv)
  if (data.lingeFourni === 'oui') checkX(5, 266.2, 407.5, 7.9, 9.1)
  if (data.lingeFourni === 'non') checkX(5, 292.8, 407.5, 7.9, 9.1)
  if (sanitize(data.lingeQuantite)) {
    const qPrefixW = helv.widthOfTextAtSize('Quantité : ', TABLE_SIZE)
    put({ page: p(5), x: 332.1 + qPrefixW + 2, y: 407.5, maxW: 50, size: TABLE_SIZE }, data.lingeQuantite)
  }
  put({ page: p(5), x: 269, y: 388.1, maxW: 186 }, data.parking)
  put({ page: p(5), x: 269, y: 368.6, maxW: 186 }, data.observations)

  /* ================= PAGE 7 — ANNEXE 2 ================= */
  const saisonRows: Array<[MandatTarifRow | undefined, number]> = [
    [data.tarifBasse, 559.7],
    [data.tarifMoyenne, 538.1],
    [data.tarifHaute, 516.7],
    [data.tarifTresHaute, 495.1],
    [data.tarifEvenements, 473.5],
  ]
  for (const [row, y] of saisonRows) {
    if (!row) continue
    put({ page: p(6), x: 228, y, maxW: 54, size: TABLE_SIZE }, row.prixNuit)
    put({ page: p(6), x: 338, y, maxW: 54, size: TABLE_SIZE }, row.prixSemaine)
    put({ page: p(6), x: 450, y, maxW: 17, size: TABLE_SIZE }, row.minNuits)
  }

  const outBytes = await pdfDoc.save()
  return new Blob([outBytes as unknown as BlobPart], { type: 'application/pdf' })
}

function formatDateFr(iso?: string): string {
  const s = sanitize(iso)
  if (!s) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (!m) return s
  return `${m[3]}/${m[2]}/${m[1]}`
}
