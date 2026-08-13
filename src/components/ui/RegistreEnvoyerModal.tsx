import { useState, useEffect } from 'react'
import {
  Mail, User, FileText, Paperclip, Send, Clock, Save,
  Download, ExternalLink, RefreshCw, Plus, X, Check
} from 'react-feather'
import { Dialog } from './Dialog'
import { Badge } from './Badge'
import { Button } from './Button'
import { Input } from './Input'
import { api } from '../../services/api'
import { fetchRegistre } from '../../services/registreService'
import {
  MANDAT_TYPE_LABELS,
  CLIENT_TYPE_LABELS,
  CLIENT_TYPE_COLORS,
} from '../../types/transactions'
import type { Transaction, MandatType } from '../../types/transactions'

interface RegistreEnvoyerModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
}

interface ClientData {
  id: string
  name: string
  clientType: string
  email: string
  phone: string
  [key: string]: any
}

interface PropertyData {
  id: string
  reference: string
  title: string
  price: number
  surface: number
  rooms: number
  bedrooms: number
  address: string
  city: string
  [key: string]: any
}

interface ContractData {
  id: string
  reference: string
  contractType: string
  status: string
  startDate: string
  endDate: string
  [key: string]: any
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-background/50 border-b border-border/40">
        <Icon size={14} className="text-accent" />
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{title}</span>
      </div>
      <div className="px-4 py-3 space-y-3">
        {children}
      </div>
    </div>
  )
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

function getSalutation(name: string) {
  if (!name) return 'Bonjour,'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return 'Bonjour,'
  if (parts.length >= 2) {
    const last = parts[parts.length - 1]
    if (last.toLowerCase().startsWith('el') || last.toLowerCase().startsWith('al')) {
      return `Bonjour Monsieur ${last},`
    }
  }
  return `Bonjour ${name},`
}

function generateEmailSubject(t: Transaction, property?: PropertyData | null, clientType?: string) {
  const propName = property?.title || t.propertyTitle || ''
  const propSuffix = propName ? ` - ${propName}` : ''

  switch (clientType) {
    case 'Acheteur':
      return `Mise a jour de votre recherche${propSuffix}`
    case 'Vendeur':
      return `Suivi de votre mandat de vente${propSuffix}`
    case 'Bailleur':
      return `Suivi de votre mandat de location${propSuffix}`
    case 'Locataire':
      return `Suivi de votre recherche de location${propSuffix}`
    case 'Voyageur':
      return `Votre sejour${propSuffix ? ` a ${property?.city || ''}` : ''}`.trim()
    default:
      return `Suivi de votre dossier${propSuffix}`
  }
}

function generateEmailBody(
  t: Transaction,
  client?: ClientData | null,
  property?: PropertyData | null,
  contract?: ContractData | null,
) {
  const c = client as any
  const p = property as any
  const clientType = t.clientType || ''
  const clientName = t.clientName || ''
  const propName = p?.title || t.propertyTitle || ''
  const propRef = p?.reference || t.propertyRef || ''
  const salutation = getSalutation(clientName)
  const today = new Date().toLocaleDateString('fr-FR')

  const closing = `\n\nPour toute question, n'hesitez pas a nous contacter.\n\nCordialement,\nL'equipe Square Meter`

  switch (clientType) {
    case 'Acheteur': {
      const budgetMin = c?.prixMin || c?.budget || ''
      const budgetMax = c?.prixMax || ''
      const surfMin = c?.surfaceMin || c?.minSurface || ''
      const surfMax = c?.surfaceMax || ''
      const loc = c?.localisation || ''
      const sect = c?.secteur || ''

      let body = `${salutation}\n\n`
      body += `Nous vous informons que votre mandat de recherche est actif.\n\n`
      body += `--- Recapitulatif de votre recherche ---\n`
      if (budgetMin || budgetMax) body += `Budget : ${formatBudget(budgetMin, budgetMax)}\n`
      if (surfMin || surfMax) body += `Surface : ${surfMin && surfMax ? `${surfMin} ~ ${surfMax} m2` : surfMin ? `${surfMin} m2 min` : `${surfMax} m2 max`}\n`
      if (loc) body += `Localisation : ${[loc, sect].filter(Boolean).join(', ')}\n`
      if (c?.typeBien || p?.propertyType) body += `Type de bien : ${c?.typeBien || p?.propertyType}\n`
      if (propName) body += `\nBien concerne : ${propName}${propRef ? ` (${propRef})` : ''}\n`
      body += closing
      return body
    }

    case 'Vendeur': {
      const price = p?.price || c?.prixVenteFAI || c?.prixNetVendeur || ''
      const priceStr = price ? `${Number(price).toLocaleString('fr-FR')} MAD` : ''

      let body = `${salutation}\n\n`
      body += `Nous vous informons que votre mandat de vente est actif.\n\n`
      body += `--- Recapitulatif de votre vente ---\n`
      if (propName) body += `Bien : ${propName}\n`
      if (priceStr) body += `Prix : ${priceStr}\n`
      if (propRef) body += `Reference : ${propRef}\n`
      if (contract?.endDate) body += `Mandat expirant le : ${formatDate(contract.endDate)}\n`
      if (c?.prixNetVendeur) body += `Prix net vendeur : ${Number(c.prixNetVendeur).toLocaleString('fr-FR')} MAD\n`
      body += closing
      return body
    }

    case 'Bailleur': {
      const loyer = c?.loyerHC || ''
      const charges = c?.charges || ''

      let body = `${salutation}\n\n`
      body += `Nous vous informons que votre mandat de gestion est actif.\n\n`
      body += `--- Recapitulatif de votre location ---\n`
      if (propName) body += `Bien : ${propName}\n`
      if (loyer) body += `Loyer : ${Number(loyer).toLocaleString('fr-FR')} MAD / mois\n`
      if (charges) body += `Charges : ${Number(charges).toLocaleString('fr-FR')} MAD / mois\n`
      if (propRef) body += `Reference : ${propRef}\n`
      if (contract?.endDate) body += `Mandat expirant le : ${formatDate(contract.endDate)}\n`
      body += closing
      return body
    }

    case 'Locataire': {
      const budget = c?.budget || c?.prixMin || ''
      const surfMin = c?.surfaceMin || c?.minSurface || ''
      const surfMax = c?.surfaceMax || ''
      const loc = c?.localisation || ''
      const sect = c?.secteur || ''
      const typeBien = c?.typeBien || ''

      let body = `${salutation}\n\n`
      body += `Nous vous informons que votre mandat de recherche location est actif.\n\n`
      body += `--- Recapitulatif de votre recherche ---\n`
      if (budget) body += `Budget : ${Number(budget).toLocaleString('fr-FR')} MAD / mois\n`
      if (surfMin || surfMax) body += `Surface : ${surfMin && surfMax ? `${surfMin} ~ ${surfMax} m2` : surfMin ? `${surfMin} m2 min` : `${surfMax} m2 max`}\n`
      if (loc) body += `Localisation : ${[loc, sect].filter(Boolean).join(', ')}\n`
      if (typeBien) body += `Type de bien : ${typeBien}\n`
      if (propName) body += `\nBien concerne : ${propName}${propRef ? ` (${propRef})` : ''}\n`
      body += closing
      return body
    }

    case 'Voyageur': {
      const arr = c?.dateArrivee || ''
      const dep = c?.dateDepart || ''
      const nuits = c?.nbNuits || ''
      const adults = c?.nbAdultes || ''
      const children = c?.nbEnfants || ''
      const total = c?.montantTotalAvecOptions || c?.montantTotalHorsOptions || ''
      const acompte = c?.acompteMontant || ''
      const solde = c?.soldeRestant || ''
      const caution = c?.cautionMontant || ''

      let body = `${salutation}\n\n`
      body += `Nous avons le plaisir de vous confirmer votre sejour.\n\n`
      body += `--- Details de votre sejour ---\n`
      if (propName) body += `Bien : ${propName}\n`
      if (arr) body += `Arrivee : ${formatDate(arr)}\n`
      if (dep) body += `Depart : ${formatDate(dep)}\n`
      if (nuits) body += `Nuitees : ${nuits}\n`
      if (adults || children) body += `Voyageurs : ${[adults, children].filter(Boolean).join(' + ')}\n`
      if (total) body += `\nMontant total : ${Number(total).toLocaleString('fr-FR')} MAD\n`
      if (acompte) body += `Acompte verse : ${Number(acompte).toLocaleString('fr-FR')} MAD\n`
      if (solde) body += `Solde restant : ${Number(solde).toLocaleString('fr-FR')} MAD\n`
      if (caution) body += `Caution : ${Number(caution).toLocaleString('fr-FR')} MAD\n`
      body += `\nPour toute urgence, contactez-nous au +212 6 12 34 56 78 (24/7).`
      body += `\n\nBon sejour !`
      body += `\n\nCordialement,\nL'equipe Square Meter`
      return body
    }

    default: {
      let body = `${salutation}\n\n`
      body += `Nous vous informons que votre dossier est en cours de suivi.\n\n`
      if (propName) body += `Bien concerne : ${propName}${propRef ? ` (${propRef})` : ''}\n`
      body += closing
      return body
    }
  }
}

function generateAttachments(
  t: Transaction,
  client?: ClientData | null,
  property?: PropertyData | null,
  clientType?: string,
) {
  const c = client as any
  const p = property as any
  const propName = p?.title || t.propertyTitle || 'Bien'
  const attachments: { name: string; checked: boolean }[] = []

  switch (clientType) {
    case 'Acheteur':
      if (propName) attachments.push({ name: `Brochure - ${propName}.pdf`, checked: true })
      if (c?.mandatPdfName) attachments.push({ name: c.mandatPdfName, checked: false })
      break
    case 'Vendeur':
      if (propName) attachments.push({ name: `Rapport de visite - ${propName}.pdf`, checked: true })
      if (c?.mandatPdfName) attachments.push({ name: c.mandatPdfName, checked: false })
      break
    case 'Bailleur':
      if (propName) attachments.push({ name: `Rapport de visite - ${propName}.pdf`, checked: true })
      if (c?.mandatPdfName) attachments.push({ name: c.mandatPdfName, checked: false })
      break
    case 'Locataire':
      if (propName) attachments.push({ name: `Brochure - ${propName}.pdf`, checked: true })
      if (c?.mandatPdfName) attachments.push({ name: c.mandatPdfName, checked: false })
      break
    case 'Voyageur':
      if (c?.mandatPdfName) attachments.push({ name: c.mandatPdfName, checked: true })
      break
  }

  if (c?.docIdentiteUrl && c?.docIdentiteName) {
    attachments.push({ name: c.docIdentiteName, checked: false })
  }

  return attachments
}

const CLIENT_TYPE_TITLES: Record<string, string> = {
  Acheteur: 'Acheteur',
  Vendeur: 'Vendeur',
  Bailleur: 'Bailleur',
  Locataire: 'Locataire',
  Voyageur: 'Voyageur',
}

export function RegistreEnvoyerModal({ isOpen, onClose, transaction }: RegistreEnvoyerModalProps) {
  const [client, setClient] = useState<ClientData | null>(null)
  const [property, setProperty] = useState<PropertyData | null>(null)
  const [contract, setContract] = useState<ContractData | null>(null)
  const [loading, setLoading] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState<{ name: string; checked: boolean }[]>([])
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!isOpen || !transaction) return
    setLoading(true)
    setClient(null)
    setProperty(null)
    setContract(null)

    const fetches: Promise<any>[] = []

    if (transaction.clientId) {
      fetches.push(
        api.get<ClientData>(`/clients/${transaction.clientId}`)
          .then(c => setClient(c))
          .catch(() => {})
      )
    }

    if (transaction.propertyId) {
      fetches.push(
        api.get<PropertyData>(`/properties/${transaction.propertyId}`)
          .then(p => setProperty(p))
          .catch(() => {})
      )
    }

    if (transaction.clientId) {
      fetches.push(
        api.get<any[]>('/contracts', { client_id: transaction.clientId })
          .then((contracts: any[]) => {
            if (!Array.isArray(contracts)) return
            const match = contracts.find((c: any) =>
              c.propertyId === transaction.propertyId ||
              (!transaction.propertyId && c.clientType === transaction.clientType)
            )
            if (match) setContract(match)
          })
          .catch(() => {})
      )
    }

    Promise.all(fetches).finally(() => setLoading(false))
  }, [isOpen, transaction])

  useEffect(() => {
    if (loading || !transaction) return
    setSubject(generateEmailSubject(transaction, property, transaction.clientType))
    setBody(generateEmailBody(transaction, client, property, contract))
    setAttachments(generateAttachments(transaction, client, property, transaction.clientType))
  }, [client, property, contract, loading, transaction])

  if (!transaction) return null

  const t = transaction
  const clientType = t.clientType || ''
  const typeTitle = CLIENT_TYPE_TITLES[clientType] || clientType

  const toggleAttachment = (index: number) => {
    setAttachments(prev => prev.map((a, i) => i === index ? { ...a, checked: !a.checked } : a))
  }

  const handleSend = () => {
    setSending(true)
    setTimeout(() => {
      setSending(false)
      onClose()
    }, 1500)
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Envoyer au client (${typeTitle})`}
      size="2xl"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Subtitle */}
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Mail size={14} />
          <span className="font-medium text-text">{t.clientName}</span>
          <span className="text-border">·</span>
          <span className="font-mono text-xs">{t.reference}</span>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw size={20} className="text-text-secondary/30 animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {/* DESTINATAIRE */}
            <Section icon={User} title="Destinataire">
              <div className="p-3 rounded-lg bg-background/50 border border-border/30 space-y-1.5">
                <p className="text-sm font-medium text-text">{client?.name || t.clientName}</p>
                {client?.email && (
                  <p className="text-xs text-text-secondary flex items-center gap-1.5">
                    <Mail size={11} className="text-text-secondary/40" /> {client.email}
                  </p>
                )}
                {client?.phone && (
                  <p className="text-xs text-text-secondary flex items-center gap-1.5">
                    <span className="text-text-secondary/40">Tel :</span> {client.phone}
                  </p>
                )}
              </div>
            </Section>

            {/* MODÈLE D'EMAIL */}
            <Section icon={FileText} title={`Modele d'email (personnalise pour ${typeTitle})`}>
              <div className="space-y-3">
                <Input
                  label="Objet"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text">Message</label>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={18}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent transition-all resize-none font-mono leading-relaxed"
                  />
                </div>
              </div>
            </Section>

            {/* PIÈCES JOINTES */}
            <Section icon={Paperclip} title="Pieces jointes">
              <div className="space-y-2">
                {attachments.map((att, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-background/50 cursor-pointer transition-colors"
                  >
                    <div
                      className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-colors ${
                        att.checked
                          ? 'bg-accent border-accent text-white'
                          : 'border-border bg-card hover:border-text-secondary/40'
                      }`}
                      onClick={(e) => { e.preventDefault(); toggleAttachment(i) }}
                    >
                      {att.checked && <Check size={10} />}
                    </div>
                    <FileText size={13} className="text-text-secondary/60 shrink-0" />
                    <span className="text-sm text-text truncate">{att.name}</span>
                  </label>
                ))}
                <button className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors mt-1">
                  <Plus size={12} />
                  Ajouter un fichier
                </button>
              </div>
            </Section>

            {/* ACTIONS */}
            <Section icon={Send} title="Actions">
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSend} disabled={sending} loading={sending}>
                  <Send size={12} className="mr-1.5" />
                  Envoyer maintenant
                </Button>
                <Button variant="default" onClick={() => {}}>
                  <Clock size={12} className="mr-1.5" />
                  Programmer l'envoi
                </Button>
                <Button variant="default" onClick={() => {}}>
                  <Save size={12} className="mr-1.5" />
                  Enregistrer comme brouillon
                </Button>
              </div>
            </Section>
          </>
        )}
      </div>
    </Dialog>
  )
}
