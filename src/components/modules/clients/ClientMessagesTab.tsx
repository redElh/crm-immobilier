import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageSquare, ChevronRight, User, Home, Paperclip, Star } from 'react-feather'
import { Button } from '../../ui/Button'
import { getClientConversations } from '../../../types/messages'
import type { Conversation } from '../../../types/messages'

export const ClientMessagesTab = ({ clientId, clientName }: { clientId: string; clientName: string }) => {
  const navigate = useNavigate()
  const conversations = useMemo(() => getClientConversations(clientId), [clientId])

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
        <MessageSquare size={32} className="mb-3 opacity-40" />
        <p className="text-sm">Aucun échange avec ce client</p>
        <p className="text-xs text-text-secondary/60 mt-1">Les messages apparaîtront ici une fois la conversation commencée</p>
        <Button
          variant="outline"
          size="sm"
          icon={<MessageSquare size={14} />}
          className="mt-4"
          onClick={() => navigate(`/messages/compose?clientId=${clientId}`)}
        >
          Envoyer un message
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''} avec <span className="font-medium text-text">{clientName}</span>
        </p>
        <Button
          variant="outline"
          size="sm"
          icon={<MessageSquare size={14} />}
          onClick={() => navigate(`/messages/compose?clientId=${clientId}`)}
        >
          Nouveau message
        </Button>
      </div>

      {conversations.map((conv, i) => {
        const otherPart = conv.participants.find(p => p.type !== 'agent') || conv.participants[0]
        const lastMsg = conv.messages[conv.messages.length - 1]
        return (
          <motion.div
            key={conv.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.2 }}
            className="rounded-xl border border-border/50 bg-card overflow-hidden hover:border-accent/30 transition-colors cursor-pointer"
            onClick={() => navigate(`/messages/${conv.id}`)}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <User size={15} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-text">{conv.subject}</span>
                    <span className="text-[10px] text-text-secondary/50 whitespace-nowrap">
                      {new Date(conv.lastActivityAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  {conv.relatedPropertyTitle && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Home size={11} className="text-text-secondary/40" />
                      <span className="text-[11px] text-text-secondary/60">{conv.relatedPropertyTitle}</span>
                    </div>
                  )}
                  {lastMsg && (
                    <p className="text-xs text-text-secondary/70 mt-1.5 line-clamp-2">{lastMsg.body}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] text-text-secondary/50">{conv.messages.length} message{conv.messages.length !== 1 ? 's' : ''}</span>
                    {conv.isStarred && <Star size={11} className="text-yellow-500" />}
                    {conv.messages.some(m => m.attachments.length > 0) && (
                      <Paperclip size={11} className="text-text-secondary/40" />
                    )}
                    {conv.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-accent text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={14} className="text-text-secondary/30 mt-2 shrink-0" />
              </div>
            </div>
          </motion.div>
        )
      })}

      <div className="text-center pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/messages')}
        >
          Voir toutes les conversations
        </Button>
      </div>
    </div>
  )
}
