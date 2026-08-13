import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Eye, Edit3, FileText, Mail, Trash2, X, CheckCircle, AlertTriangle,
  Calendar, DollarSign, User, Home, Clock, RefreshCw, Download, Send,
  File as FileIcon, Plus, Phone
} from 'react-feather'
import { Button } from '../../ui/Button'
import { Badge } from '../../ui/Badge'
import { Dialog } from '../../ui/Dialog'
import { Select } from '../../ui/Select'
import { DatePicker } from '../../ui/DatePicker'
import {
  MANDAT_TYPE_LABELS,
  TRANSACTION_ETAPE_LABELS,
  TRANSACTION_ETAPE_COLORS,
} from '../../../types/transactions'
import type { Transaction, TransactionEtape } from '../../../types/transactions'
import { updateTransaction, deleteTransaction } from '../../../services/transactionService'
import { createContract } from '../../../services/contractService'

const roleColor = (role: string) => {
  switch (role) {
    case 'Vendeur': case 'Propriétaire': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    case 'Acheteur': case 'Acquéreur': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    case 'Locataire': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
    case 'Bailleur': return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    case 'Voyageur': return 'bg-pink-500/10 text-pink-500 border-pink-500/20'
    default: return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'
  }
}

const ETAPE_OPTIONS: { value: TransactionEtape; label: string }[] = [
  { value: 'reservation', label: 'Réservation' },
  { value: 'signe', label: 'Signé' },
  { value: 'actif', label: 'Actif' },
  { value: 'cloture', label: 'Clôturé' },
  { value: 'expire', label: 'Expiré' },
  { value: 'resilie', label: 'Résilié' },
  { value: 'annule', label: 'Annulé' },
]

const ETAPE_ORDER: TransactionEtape[] = ['reservation', 'signe', 'actif', 'cloture', 'expire', 'resilie', 'annule']

const canDelete = (etape: TransactionEtape) =>
  etape === 'reservation' || etape === 'actif'

const canGenerateContract = (etape: TransactionEtape) =>
  etape === 'signe'

const isFinalized = (etape: TransactionEtape) =>
  etape === 'cloture' || etape === 'signe'

interface TransactionActionsProps {
  transaction: Transaction
  onUpdate?: () => void
}

export function TransactionActions({ transaction, onUpdate }: TransactionActionsProps) {
  const [showActions, setShowActions] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showContractDialog, setShowContractDialog] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  const [editDateContracted, setEditDateContracted] = useState(transaction.dateContracted)
  const [editDateExpiration, setEditDateExpiration] = useState(transaction.dateExpiration || '')
  const [editMontant, setEditMontant] = useState(transaction.montant)
  const [editEtape, setEditEtape] = useState<TransactionEtape>(transaction.etape)
  const [editNotes, setEditNotes] = useState(transaction.notes || '')

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [contractConfirmed, setContractConfirmed] = useState(false)
  const [newContractRef, setNewContractRef] = useState('')
  const [sendEmailText, setSendEmailText] = useState('')
  const [sendSuccess, setSendSuccess] = useState(false)

  const t = transaction
  const deletable = canDelete(t.etape)
  const canGenerate = canGenerateContract(t.etape)

  const handleEditSave = async () => {
    setLoading(true)
    try {
      await updateTransaction(t.id, {
        dateContracted: editDateContracted,
        dateExpiration: editDateExpiration || undefined,
        montant: editMontant,
        etape: editEtape,
        notes: editNotes,
      })
      setShowEditDialog(false)
      onUpdate?.()
    } catch (err) {
      console.error('Failed to update transaction', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirm !== 'SUPPRIMER') return
    setLoading(true)
    try {
      await deleteTransaction(t.id)
      setShowDeleteDialog(false)
      setDeleteConfirm('')
      onUpdate?.()
    } catch (err) {
      console.error('Failed to delete transaction', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateContract = async () => {
    setLoading(true)
    try {
      const contractType = t.clientType === 'Voyageur' ? 'location_saisonniere' : 'vente'

      const result = await createContract({
        clientId: t.clientId,
        clientName: t.clientName,
        clientType: t.clientType,
        propertyId: t.propertyId,
        propertyTitle: t.propertyTitle,
        propertyRef: t.propertyRef,
        contractType,
        role: t.role,
        agentName: t.agentName,
        agentId: '',
      })

      await updateTransaction(t.id, { etape: 'cloture' })

      setNewContractRef(result?.reference || result?.id || '')
      setContractConfirmed(true)
      setShowContractDialog(false)
      onUpdate?.()
    } catch (err) {
      console.error('Failed to generate contract', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = () => {
    setSendSuccess(true)
    setTimeout(() => {
      setSendSuccess(false)
      setShowSendDialog(false)
    }, 1500)
  }

  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  const computeDropdownPosition = useCallback(() => {
    if (!buttonRef.current) return {}
    const rect = buttonRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - 8
    const dh = 280
    const openUp = spaceBelow < dh && rect.top > dh
    return {
      position: 'fixed' as const,
      right: Math.max(8, window.innerWidth - rect.right) + 'px',
      width: '208px',
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 4 + 'px' }
        : { top: rect.bottom + 4 + 'px' }),
      zIndex: 9999,
    }
  }, [])

  useEffect(() => {
    if (!showActions) return
    setDropdownStyle(computeDropdownPosition())
    const onScroll = () => setDropdownStyle(computeDropdownPosition())
    const onResize = () => setDropdownStyle(computeDropdownPosition())
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [showActions, computeDropdownPosition])

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
      setShowActions(false)
    }
  }, [])

  useEffect(() => {
    if (!showActions) return
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showActions, handleClickOutside])

  const daysUntilExpiration = t.dateExpiration
    ? Math.ceil((new Date(t.dateExpiration).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <>
      <div>
        <button
          ref={buttonRef}
          className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-all"
          onClick={() => setShowActions(!showActions)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
          </svg>
        </button>
        {showActions && (
          <div ref={dropdownRef} style={dropdownStyle} className="w-52 bg-card rounded-xl border border-border/50 shadow-dropdown py-1 z-[9999]">
              <button
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                onClick={() => { setShowActions(false); setShowViewDialog(true) }}
              >
                <Eye size={14} /> Voir les details
              </button>
              <button
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                onClick={() => {
                  setEditDateContracted(t.dateContracted)
                  setEditDateExpiration(t.dateExpiration || '')
                  setEditMontant(t.montant)
                  setEditEtape(t.etape)
                  setEditNotes(t.notes || '')
                  setShowActions(false)
                  setShowEditDialog(true)
                }}
              >
                <Edit3 size={14} /> Modifier
              </button>
              {canGenerate && (
                <button
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                  onClick={() => { setShowActions(false); setShowContractDialog(true) }}
                >
                  <FileText size={14} /> Generer contrat
                </button>
              )}
              <button
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                onClick={() => {
                  const msg = `Bonjour ${t.clientName},\n\nNous vous informons que votre mandat ${t.reference} est actuellement en phase "${TRANSACTION_ETAPE_LABELS[t.etape]}".\n\nRéférence : ${t.reference}\nStatut : ${TRANSACTION_ETAPE_LABELS[t.etape]}${t.dateExpiration ? `\nDate d'expiration : ${new Date(t.dateExpiration).toLocaleDateString('fr-FR')}` : ''}\n\nPour toute question, n'hésitez pas à nous contacter.\n\nCordialement,\nL'équipe Square Meter`
                  setSendEmailText(msg)
                  setSendSuccess(false)
                  setShowActions(false)
                  setShowSendDialog(true)
                }}
              >
                <Send size={14} /> Envoyer au client
              </button>
              <button
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                onClick={() => { setShowActions(false) }}
              >
                <Download size={14} /> Exporter en PDF
              </button>
              <div className="border-t border-border/40 my-1" />
              <button
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                onClick={() => {
                  setEditEtape(t.etape)
                  setShowActions(false)
                  setShowEditDialog(true)
                }}
              >
                <RefreshCw size={14} /> Changer le statut
              </button>
              {deletable && (
                <button
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors text-left"
                  onClick={() => { setShowActions(false); setDeleteConfirm(''); setShowDeleteDialog(true) }}
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              )}
            </div>
        )}
      </div>



      {/* View Detail Dialog */}
      <Dialog isOpen={showViewDialog} onClose={() => setShowViewDialog(false)} title="Detail de la transaction" size="xl">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">{t.reference}</p>
              <p className="text-sm text-text-secondary">{MANDAT_TYPE_LABELS[t.type]}</p>
            </div>
            <Badge className={TRANSACTION_ETAPE_COLORS[t.etape]}>
              {TRANSACTION_ETAPE_LABELS[t.etape]}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-background border border-border/50 space-y-2">
              <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <FileIcon size={12} /> Informations generales
              </h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-text-secondary">Reference</span><span className="font-medium">{t.reference}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Type</span><span className="font-medium">{MANDAT_TYPE_LABELS[t.type]}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Etape</span><Badge className={TRANSACTION_ETAPE_COLORS[t.etape]}>{TRANSACTION_ETAPE_LABELS[t.etape]}</Badge></div>
                <div className="flex justify-between"><span className="text-text-secondary">Date signature</span><span className="font-medium">{t.dateContracted ? new Date(t.dateContracted).toLocaleDateString('fr-FR') : '—'}</span></div>
                {t.dateExpiration && (
                  <div className="flex justify-between"><span className="text-text-secondary">Expiration</span>
                    <span className={`font-medium ${daysUntilExpiration !== null && daysUntilExpiration <= 30 ? 'text-error' : ''}`}>
                      {new Date(t.dateExpiration).toLocaleDateString('fr-FR')}
                      {daysUntilExpiration !== null && (
                        <span className="text-xs ml-1 text-text-secondary">(J-{daysUntilExpiration})</span>
                      )}
                    </span>
                  </div>
                )}
                {t.dateReservation && (
                  <div className="flex justify-between"><span className="text-text-secondary">Reservation</span><span className="font-medium">{new Date(t.dateReservation).toLocaleDateString('fr-FR')}</span></div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-background border border-border/50 space-y-2">
              <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <User size={12} /> Client
              </h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-text-secondary">Nom</span><span className="font-medium">{t.clientName}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Role</span><span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-lg border ${roleColor(t.role)}`}>{t.role}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Type</span><span className="font-medium">{t.clientType}</span></div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-background border border-border/50 space-y-2">
              <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Home size={12} /> Produit / Bien
              </h4>
              <div className="space-y-1.5 text-sm">
                {t.propertyTitle ? (
                  <>
                    <div className="flex justify-between"><span className="text-text-secondary">Bien</span><span className="font-medium">{t.propertyTitle}</span></div>
                    {t.propertyRef && <div className="flex justify-between"><span className="text-text-secondary">Reference</span><span className="font-mono text-xs">{t.propertyRef}</span></div>}
                  </>
                ) : (
                  <p className="text-text-secondary/60 italic text-sm">Aucun bien lie</p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-background border border-border/50 space-y-2">
              <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={12} /> Informations financieres
              </h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-text-secondary">Montant</span><span className="font-semibold text-accent">{t.montant}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Honoraires</span><span className="font-medium">A definir</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Sequestre</span><span className="font-medium">0 MAD</span></div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-background border border-border/50 space-y-2">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={12} /> Documents lies
            </h4>
            <div className="text-sm text-text-secondary/60 italic">
              Aucun document pour cette transaction.
            </div>
          </div>

          <div className="p-4 rounded-lg bg-accent/5 border border-accent/20 space-y-2">
            <h4 className="text-xs font-semibold text-accent uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={12} /> Actions
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" icon={<Edit3 size={12} />}
                onClick={() => { setShowViewDialog(false); setShowEditDialog(true) }}>
                Modifier
              </Button>
              {canGenerate && (
                <Button variant="outline" size="sm" icon={<FileText size={12} />}
                  onClick={() => { setShowViewDialog(false); setShowContractDialog(true) }}>
                  Generer contrat
                </Button>
              )}
              <Button variant="outline" size="sm" icon={<Send size={12} />}
                onClick={() => { setShowViewDialog(false); setShowSendDialog(true) }}>
                Envoyer au client
              </Button>
              {deletable && (
                <Button variant="ghost" size="sm" icon={<Trash2 size={12} />}
                  className="text-error hover:bg-error/5"
                  onClick={() => { setShowViewDialog(false); setShowDeleteDialog(true) }}>
                  Supprimer
                </Button>
              )}
              <Button variant="outline" size="sm" icon={<Download size={12} />}>
                Exporter en PDF
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog isOpen={showEditDialog} onClose={() => setShowEditDialog(false)} title="Modifier la transaction" size="lg">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <p className="text-sm font-medium">{t.reference} · {MANDAT_TYPE_LABELS[t.type]}</p>
            <p className="text-xs text-text-secondary">{t.clientName} · {t.agentName}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Date de signature</label>
              <DatePicker value={editDateContracted} onChange={(e) => setEditDateContracted(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Date d'expiration</label>
              <DatePicker value={editDateExpiration} onChange={(e) => setEditDateExpiration(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Montant</label>
              <input type="text" value={editMontant}
                onChange={(e) => setEditMontant(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Statut / Etape</label>
              <Select options={ETAPE_OPTIONS} value={editEtape} onValueChange={(v) => setEditEtape(v as TransactionEtape)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Notes internes</label>
            <textarea value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
              placeholder="Ajouter une note interne..."
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowEditDialog(false)}>Annuler</Button>
            <Button variant="default" onClick={handleEditSave} disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer la transaction" size="lg">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <p className="text-sm font-medium">{t.reference} · {MANDAT_TYPE_LABELS[t.type]}</p>
            <p className="text-xs text-text-secondary">{t.clientName} · {t.agentName}</p>
          </div>
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-700 space-y-1">
                <p className="font-medium">Attention : cette action est IRREVERSIBLE.</p>
                <p>La transaction sera definitivement supprimee du registre et des fiches client et bien.</p>
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Confirmation</label>
            <input type="text"
              className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-error/20 focus:border-error transition-all"
              placeholder='Tapez "SUPPRIMER" pour confirmer'
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleteConfirm !== 'SUPPRIMER' || loading}>
              {loading ? 'Suppression...' : 'Confirmer la suppression'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Generate Contract Dialog */}
      <Dialog isOpen={showContractDialog} onClose={() => setShowContractDialog(false)} title="Generer un contrat" size="lg">
        {!contractConfirmed ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-background border border-border/50">
              <p className="text-sm font-medium">{t.reference} · {MANDAT_TYPE_LABELS[t.type]}</p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-700 space-y-1">
                  <p className="font-medium">Transaction finalisee</p>
                  <p>Un contrat sera automatiquement genere a partir de ce mandat.</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm bg-background p-4 rounded-lg border border-border/50">
              <div><span className="text-text-secondary">Mandat :</span><span className="ml-1 font-medium">{t.reference}</span></div>
              <div><span className="text-text-secondary">Type :</span><span className="ml-1 font-medium">{MANDAT_TYPE_LABELS[t.type]}</span></div>
              <div><span className="text-text-secondary">Client :</span><span className="ml-1 font-medium">{t.clientName}</span></div>
              <div><span className="text-text-secondary">Role :</span><span className="ml-1 font-medium">{t.role}</span></div>
              {t.propertyTitle && <div><span className="text-text-secondary">Bien :</span><span className="ml-1 font-medium">{t.propertyTitle}</span></div>}
              <div><span className="text-text-secondary">Prix :</span><span className="ml-1 font-medium">{t.montant}</span></div>
            </div>
            <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
              <p className="text-sm font-medium mb-2">Contrat a creer :</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-text-secondary">Type :</span><span className="ml-1 font-medium">
                  {t.type.includes('vente') ? 'Vente' : t.type.includes('location') ? 'Location' : 'Contrat'}
                </span></div>
                <div><span className="text-text-secondary">Statut :</span><span className="ml-1 font-medium">En cours</span></div>
                <div><span className="text-text-secondary">Date :</span><span className="ml-1 font-medium">{new Date().toLocaleDateString('fr-FR')}</span></div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowContractDialog(false)}>Annuler</Button>
              <Button variant="default" onClick={handleGenerateContract} disabled={loading}>
                <FileText size={14} className="mr-1" /> {loading ? 'Creation...' : 'Confirmer et creer le contrat'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <p className="text-lg font-semibold">Contrat cree avec succes</p>
            <p className="text-sm text-text-secondary mt-1">
              Contrat <span className="font-mono font-medium text-text">{newContractRef}</span> cree.
            </p>
            <p className="text-sm text-text-secondary mt-1">
              Il apparait dans la page Contrats.
            </p>
            <div className="mt-3 flex flex-col items-center gap-1 text-xs text-text-secondary/60">
              <span className="flex items-center gap-1"><CheckCircle size={10} className="text-emerald-500" /> Registre mis a jour : <span className="font-medium text-text-secondary">Cloture</span></span>
              <span className="flex items-center gap-1"><CheckCircle size={10} className="text-emerald-500" /> Statut client mis a jour</span>
            </div>
            <div className="mt-6">
              <Button variant="default" onClick={() => { setContractConfirmed(false); setShowContractDialog(false) }}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Send to Client Dialog */}
      <Dialog isOpen={showSendDialog} onClose={() => setShowSendDialog(false)} title="Envoyer au client" size="lg">
        {!sendSuccess ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-background border border-border/50">
              <div className="flex items-center gap-2">
                <User size={14} className="text-text-secondary" />
                <span className="text-sm font-medium">{t.clientName}</span>
                <span className="text-xs text-text-secondary">({t.clientType})</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Objet</label>
              <input type="text"
                className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                value={`Mise a jour de votre mandat - ${t.reference}`}
                readOnly
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Message</label>
              <textarea value={sendEmailText}
                onChange={(e) => setSendEmailText(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowSendDialog(false)}>Annuler</Button>
              <Button variant="default" icon={<Send size={14} />} onClick={handleSendEmail}>
                Envoyer
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <p className="text-lg font-semibold">Email envoye avec succes</p>
            <p className="text-sm text-text-secondary mt-1">Le client a ete notifie.</p>
            <div className="mt-6">
              <Button variant="default" onClick={() => { setSendSuccess(false); setShowSendDialog(false) }}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  )
}
