import { useState, useEffect } from 'react'
import {
  Mail, User, FileText, Paperclip, Send, Clock, Save,
  RefreshCw, Plus, Check,
} from 'react-feather'
import { Dialog } from './Dialog'
import { Button } from './Button'
import { Input } from './Input'
import { api } from '../../services/api'
import { fetchRegistre } from '../../services/registreService'
import type { Transaction } from '../../types/transactions'
import { useStageTheme } from '../dashboard/Stage'
import {
  regTypeHue, regTypeLabel, HuePill, PartyAvatar,
  RegistreModalHero, useRegistreAccent,
} from '../modules/registre/RegistreStage'
import { StageSection } from '../modules/prospects/ProspectDetailStage'

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
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const { accent, ink } = useRegistreAccent()

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
      <div className="max-h-[70vh] space-y-4 overflow-y-auto scrollbar-thin pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl border"
              style={{ background: isDark ? `${accent.a}14` : `${accent.a}12`, borderColor: `${accent.a}30` }}
            >
              <RefreshCw size={18} className="animate-spin" style={{ color: isDark ? accent.a : ink }} />
            </span>
          </div>
        ) : (
          <>
            <RegistreModalHero
              t={t}
              isDark={isDark}
              icon={Send}
              instanceLabel="Envoyer au client"
              amountLabel="Montant"
              badges={
                <>
                  <HuePill hue={regTypeHue(t.type)} label={regTypeLabel(t.type)} isDark={isDark} />
                </>
              }
              kpiChips={[
                ...(client?.email ? [{ icon: Mail, label: 'E-mail', value: client.email }] : []),
                ...(client?.phone ? [{ icon: User as any, label: 'Tél', value: client.phone }] : []),
                { icon: FileText, label: 'Référence', value: t.reference, mono: true },
              ]}
            />

            {/* DESTINATAIRE */}
            <StageSection icon={User} title="Destinataire" accent={accent} ink={ink} isDark={isDark}>
              <div className="md:col-span-2 flex items-start gap-3 rounded-2xl border p-3 backdrop-blur-sm"
                style={{
                  borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(148,163,184,0.35)',
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.75)',
                  boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 1px 0 rgba(255,255,255,0.8)',
                }}
              >
                <PartyAvatar name={client?.name || t.clientName || ''} role={clientType} isDark={isDark} />
                <div className="min-w-0">
                  <p className={`truncate text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{client?.name || t.clientName || '—'}</p>
                  <div className={`mt-0.5 flex flex-wrap gap-x-3 text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {client?.email && <span className="inline-flex items-center gap-1"><Mail size={10} /> {client.email}</span>}
                    {client?.phone && <span className="inline-flex items-center gap-1"><User size={10} /> {client.phone}</span>}
                  </div>
                </div>
              </div>
            </StageSection>

            {/* MODÈLE D'EMAIL */}
            <StageSection icon={FileText} title={`Modèle d'email (personnalisé pour ${typeTitle})`} accent={accent} ink={ink} isDark={isDark}>
              <Input
                label="Objet"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
              <div className="col-span-full space-y-1.5">
                <label className={`text-[11px] font-bold uppercase tracking-[0.14em] ${isDark ? 'text-slate-400/85' : 'text-teal-900/55'}`}>Message</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={18}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm font-mono leading-relaxed outline-none transition-all resize-none ${
                    isDark
                      ? 'border-white/10 bg-white/[0.04] text-slate-100 placeholder:text-slate-500 focus:border-violet-400/60'
                      : 'border-teal-900/15 bg-white/80 text-teal-950 placeholder:text-teal-900/35 focus:border-teal-500/70'
                  }`}
                />
              </div>
            </StageSection>

            {/* PIÈCES JOINTES */}
            <StageSection icon={Paperclip} title="Pièces jointes" accent={accent} ink={ink} isDark={isDark}>
              <div className="md:col-span-2 space-y-2">
                {attachments.map((att, i) => (
                  <label
                    key={i}
                    className={`flex items-center gap-2.5 rounded-xl border p-2.5 cursor-pointer transition-colors ${
                      isDark ? 'border-white/[0.07] bg-white/[0.03] hover:border-white/[0.16]' : 'border-slate-200/70 bg-white/70 hover:border-teal-500/30'
                    }`}
                  >
                    <div
                      className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition-all"
                      style={att.checked
                        ? { background: isDark ? 'rgba(124,92,255,0.9)' : 'rgba(13,148,136,0.9)', borderColor: 'transparent', color: '#fff', boxShadow: isDark ? '0 0 10px rgba(124,92,255,0.5)' : '0 0 10px rgba(13,148,136,0.4)' }
                        : { borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(148,163,184,0.5)', background: isDark ? 'rgba(255,255,255,0.04)' : '#fff' }}
                      onClick={(e) => { e.preventDefault(); toggleAttachment(i) }}
                    >
                      {att.checked && <Check size={11} />}
                    </div>
                    <FileText size={13} className="shrink-0" style={{ color: isDark ? '#94A3B8' : '#94A3B8' }} />
                    <span className={`truncate text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{att.name}</span>
                  </label>
                ))}
                <button className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                  isDark ? 'border-white/[0.10] bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]' : 'border-teal-500/25 bg-white/70 text-teal-800 hover:bg-white'
                }`}>
                  <Plus size={12} style={{ color: isDark ? accent.a : ink }} />
                  Ajouter un fichier
                </button>
              </div>
            </StageSection>

            {/* ACTIONS */}
            <StageSection icon={Send} title="Actions" accent={accent} ink={ink} isDark={isDark}>
              <div className="md:col-span-2 flex flex-wrap gap-2">
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
            </StageSection>
          </>
        )}
      </div>
    </Dialog>
  )
}
