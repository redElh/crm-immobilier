import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, UserMinus, Search, Loader } from 'react-feather'
import type { MessageParticipant } from '../../../types/messages'
import { cn } from '../../../lib/utils'
import { Avatar } from './Avatar'
import { fetchMessageUsers, addGroupMembers, removeGroupMembers } from '../../../services/messageService'
import { useToast } from '../../ui/Toast'

interface GroupMembersModalProps {
  conversationId: string
  participants: MessageParticipant[]
  currentUserId: string
  onClose: () => void
  onChanged: () => void
}

export function GroupMembersModal({
  conversationId,
  participants,
  currentUserId,
  onClose,
  onChanged,
}: GroupMembersModalProps) {
  const { toast } = useToast()
  const [available, setAvailable] = useState<MessageParticipant[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchMessageUsers()
      .then(setAvailable)
      .catch(() => toast('error', 'Impossible de charger les membres disponibles.'))
  }, [toast])

  const memberIds = useMemo(() => new Set(participants.map(p => p.id)), [participants])

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase()
    return available.filter(
      u => !memberIds.has(u.id) && (!q || u.name.toLowerCase().includes(q))
    )
  }, [available, memberIds, search])

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const handleAdd = async () => {
    if (selected.size === 0) return
    setBusy(true)
    try {
      await addGroupMembers(conversationId, Array.from(selected).map(Number))
      setSelected(new Set())
      onChanged()
      toast('success', 'Membres ajoutés au groupe.')
    } catch (err) {
      toast('error', (err as Error)?.message || "Impossible d'ajouter les membres.")
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async (userId: string) => {
    setBusy(true)
    try {
      await removeGroupMembers(conversationId, [Number(userId)])
      onChanged()
      toast('success', 'Membre retiré du groupe.')
    } catch (err) {
      toast('error', (err as Error)?.message || 'Impossible de retirer le membre.')
    } finally {
      setBusy(false)
    }
  }

  const sorted = useMemo(
    () =>
      [...participants].sort((a, b) =>
        a.id === currentUserId ? -1 : b.id === currentUserId ? 1 : a.name.localeCompare(b.name)
      ),
    [participants, currentUserId]
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={busy ? undefined : onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.16 }}
        className="relative bg-card border border-border/60 rounded-2xl shadow-modal p-5 w-full max-w-md max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h3 className="text-base font-semibold text-text">Gérer les membres</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-background transition-colors"
            title="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-thin flex-1 -mx-1 px-1">
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
            Membres ({participants.length})
          </p>
          <div className="space-y-1 mb-4">
            {sorted.map(p => (
              <div key={p.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-background/60">
                <Avatar participant={p} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">
                    {p.name}{' '}
                    {p.id === currentUserId && (
                      <span className="text-[10px] text-text-secondary font-normal">(vous)</span>
                    )}
                  </p>
                  <p className="text-[11px] text-text-secondary truncate">{p.role || 'Membre'}</p>
                </div>
                {p.id !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleRemove(p.id)}
                    disabled={busy}
                    title={`Retirer ${p.name}`}
                    className="p-1.5 rounded-lg text-text-secondary hover:text-error hover:bg-error/5 transition-colors"
                  >
                    <UserMinus size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
            Ajouter des membres
          </p>
          <div className="relative mb-2">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un membre..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-background border border-border/60 rounded-lg outline-none focus:border-accent text-text"
            />
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
            {candidates.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => toggle(u.id)}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-background/60 text-left transition-colors"
              >
                <Avatar participant={u} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{u.name}</p>
                  <p className="text-[11px] text-text-secondary truncate">{u.role || ''}</p>
                </div>
                <span
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center border transition-colors shrink-0',
                    selected.has(u.id) ? 'bg-accent border-accent text-white' : 'border-border text-transparent'
                  )}
                >
                  <Plus size={12} />
                </span>
              </button>
            ))}
            {candidates.length === 0 && (
              <p className="text-xs text-text-secondary/70 text-center py-3">
                Aucun membre disponible à ajouter.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border/40 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-xl text-text hover:bg-background transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={handleAdd}
            disabled={selected.size === 0 || busy}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-colors',
              selected.size === 0 || busy
                ? 'text-text-secondary/40 cursor-not-allowed'
                : 'bg-accent text-white hover:bg-accent/90'
            )}
          >
            {busy && <Loader size={13} className="animate-spin" />}
            Ajouter ({selected.size})
          </button>
        </div>
      </motion.div>
    </div>
  )
}
