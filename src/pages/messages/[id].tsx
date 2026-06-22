import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
import { ArrowLeft, Paperclip, Send, User, Home, Star, MessageSquare, EyeOff } from 'react-feather'
import { Button } from '../../components/ui/Button'
import { mockConversations } from '../../types/messages'
import type { Conversation, Message } from '../../types/messages'

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatMessageDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }
  if (diffDays === 1) {
    return `Hier \u00e0 ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  }
  if (diffDays < 7) {
    return date.toLocaleDateString('fr-FR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getDateLabel(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return date.toLocaleDateString('fr-FR', { weekday: 'long' })
  return formatDate(dateString)
}

export default function ConversationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)

  const conversation = useMemo(() => {
    if (!id) return null
    return mockConversations.find(c => c.id === id) ?? null
  }, [id])

  const dayGroups = useMemo(() => {
    if (!conversation) return []
    const map = new Map<string, Message[]>()
    for (const msg of conversation.messages) {
      const day = new Date(msg.sentAt).toLocaleDateString('fr-FR')
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(msg)
    }
    return Array.from(map.entries())
  }, [conversation])

  const participantNames = conversation ? conversation.participants.map(p => p.name).join(', ') : ''

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent" />
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center">
          <MessageSquare size={28} className="text-text-secondary" />
        </div>
        <h2 className="text-xl font-semibold">Conversation introuvable</h2>
        <p className="text-text-secondary max-w-md text-center">
          Cette conversation n'existe pas ou a \u00e9t\u00e9 supprim\u00e9e.
        </p>
        <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => navigate('/messages')}>
          Retour aux messages
        </Button>
      </div>
    )
  }

  const handleSendReply = () => {
    if (!replyText.trim()) return
    setReplyText('')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border px-6 py-4 flex items-center gap-4 shrink-0">
        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/messages')} />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold truncate">{conversation.subject}</h1>
          <p className="text-sm text-text-secondary truncate">{participantNames}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {conversation.isStarred && <Star size={16} className="text-accent fill-accent" />}
          {conversation.relatedPropertyTitle && (
            <Button
              variant="outline"
              size="sm"
              icon={<Home size={14} />}
              onClick={() => navigate(`/properties/${conversation.relatedPropertyId}`)}
            >
              {conversation.relatedPropertyTitle}
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {dayGroups.map(([dayLabel, messages]) => (
          <div key={dayLabel} className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs font-medium text-text-secondary uppercase px-2">
                {getDateLabel(messages[0].sentAt)}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-4">
              {messages.map((msg) => {
                const isAgent = msg.sender.type === 'agent'
                return (
                  <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[75%] min-w-[240px]">
                      <div className={`flex items-center gap-2 mb-1.5 ${isAgent ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs font-medium text-text-secondary">{msg.sender.name}</span>
                        {isAgent && (
                          <span className="text-[10px] uppercase tracking-widest text-accent font-semibold">
                            Agent
                          </span>
                        )}
                      </div>

                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          isAgent
                            ? 'bg-accent text-white rounded-tr-md'
                            : 'bg-card border border-border rounded-tl-md'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.body}</p>

                        {msg.attachments.length > 0 && (
                          <div className={`mt-3 pt-3 space-y-2 ${isAgent ? 'border-t border-white/20' : 'border-t border-border'}`}>
                            {msg.attachments.map((att) => (
                              <div
                                key={att.id}
                                className={`flex items-center gap-2.5 p-2.5 rounded-lg ${
                                  isAgent ? 'bg-white/10' : 'bg-background'
                                }`}
                              >
                                <Paperclip size={14} className={isAgent ? 'text-white/70' : 'text-text-secondary'} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-medium truncate ${isAgent ? 'text-white' : 'text-text'}`}>
                                    {att.name}
                                  </p>
                                  <p className={`text-[11px] ${isAgent ? 'text-white/60' : 'text-text-secondary'}`}>
                                    {att.size}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className={`flex items-center gap-1.5 mt-1 ${isAgent ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[11px] text-text-secondary">{formatMessageDate(msg.sentAt)}</span>
                        {!msg.isRead && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border px-6 py-4 shrink-0">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="\u00c9crivez votre r\u00e9ponse..."
              rows={3}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-text placeholder-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
            />
          </div>
          <Button
            variant="default"
            icon={<Send size={16} />}
            onClick={handleSendReply}
            disabled={!replyText.trim()}
          >
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  )
}
