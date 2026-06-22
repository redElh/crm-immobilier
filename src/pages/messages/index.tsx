import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Inbox, Send, FileText, Trash2, Search, Plus, MessageSquare,
  Paperclip, ChevronDown, MoreVertical,
  Eye, EyeOff, AlertCircle, User, Home, Clock, CornerUpRight,
  CornerUpRight as ForwardIcon, Star as StarIcon, CheckSquare,
  Filter, Calendar, X, Download, Mail, Share2, Users,
} from 'react-feather'
import { FOLDERS, mockConversations } from '../../types/messages'
import type { Conversation, Message } from '../../types/messages'
import { Select } from '../../components/ui/Select'

function isAdminRoute() {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/admin')
}

const AGENTS = [
  { id: 'myriam', name: 'Myriam ABABOU' },
  { id: 'dimitri', name: 'Dimitri DJEDJE' },
  { id: 'hayat', name: 'Hayat OUAKRIM' },
  { id: 'yasmine', name: 'Yasmine AATIC' },
  { id: 'leila', name: 'Leila BENBRAHIM' },
  { id: 'square', name: 'Square Meter AGENCE' },
]

const agentName = (id: string) => AGENTS.find(a => a.id === id)?.name ?? id

const FOLDER_ICONS: Record<string, React.ReactNode> = {
  inbox: <Inbox size={16} />,
  sent: <Send size={16} />,
  drafts: <FileText size={16} />,
  starred: <StarIcon size={16} />,
  trash: <Trash2 size={16} />,
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return `Aujourd'hui ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  if (days === 1) return 'Hier'
  if (days < 7) return d.toLocaleDateString('fr-FR', { weekday: 'long' })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function formatMessageDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function countUnread(conversations: Conversation[]): number {
  return conversations
    .filter(c => c.folder === 'inbox')
    .reduce((sum, c) => sum + c.unreadCount, 0)
}

const inputClass = "h-9 px-3 text-sm rounded-lg border border-border bg-background text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"

export default function MessagesPage() {
  const admin = isAdminRoute()
  const navigate = useNavigate()
  const [activeFolder, setActiveFolder] = useState('inbox')
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [replyText, setReplyText] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [filterAgent, setFilterAgent] = useState('')
  const [contextConvId, setContextConvId] = useState<string | null>(null)
  const [assignModalTarget, setAssignModalTarget] = useState<string | null>(null)

  const baseConversations = useMemo(() => {
    if (admin) return mockConversations
    return mockConversations.filter(c => c.createdBy === 'myriam')
  }, [admin])

  const stats = useMemo(() => {
    const total = baseConversations.length
    const unread = baseConversations.reduce((sum, c) => sum + c.unreadCount, 0)
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const sentThisMonth = baseConversations.reduce((sum, c) => {
      return sum + c.messages.filter(m => m.sentAt.startsWith(thisMonth) && m.sender.type === 'agent').length
    }, 0)
    const starred = baseConversations.filter(c => c.isStarred).length
    return { total, unread, sentThisMonth, starred }
  }, [baseConversations])

  function getConversationsForFolder(folderId: string, list: Conversation[]): Conversation[] {
    if (folderId === 'starred') return list.filter(c => c.isStarred)
    return list.filter(c => c.folder === folderId)
  }

  const folderConversations = useMemo(() => getConversationsForFolder(activeFolder, baseConversations), [activeFolder, baseConversations])

  const conversations = useMemo(() => {
    let list = folderConversations
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      list = list.filter(c =>
        c.subject.toLowerCase().includes(q) ||
        c.participants.some(p => p.name.toLowerCase().includes(q)) ||
        c.preview.toLowerCase().includes(q)
      )
    }
    if (statusFilter === 'unread') list = list.filter(c => c.unreadCount > 0)
    if (statusFilter === 'read') list = list.filter(c => c.unreadCount === 0)
    if (admin && filterAgent) list = list.filter(c => c.createdBy === filterAgent)
    return list.sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())
  }, [folderConversations, searchTerm, statusFilter, admin, filterAgent])

  const selectedConv = useMemo(
    () => mockConversations.find(c => c.id === selectedConvId) || null,
    [selectedConvId]
  )

  const unreadTotal = useMemo(() => countUnread(baseConversations), [baseConversations])

  const chartData = useMemo(() => {
    const dayCount: Record<string, number> = {}
    baseConversations.forEach(c => {
      c.messages.forEach(m => {
        const day = m.sentAt.slice(0, 10)
        dayCount[day] = (dayCount[day] || 0) + 1
      })
    })
    const days: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date('2026-06-17')
      d.setDate(d.getDate() - i)
      days.push(d.toISOString().slice(0, 10))
    }
    const maxCount = Math.max(1, ...days.map(day => dayCount[day] || 0))
    return days.map(day => ({
      day,
      count: dayCount[day] || 0,
      pct: ((dayCount[day] || 0) / maxCount) * 100,
      label: new Date(day + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
    }))
  }, [baseConversations])

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedConv) return
    setReplyText('')
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === conversations.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(conversations.map(c => c.id)))
    }
  }

  const clearSelection = () => setSelectedIds(new Set())

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setFilterAgent('')
  }

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || (admin && filterAgent)

  const bulkActions = [
    { icon: <Trash2 size={13} />, label: 'Supprimer', action: () => { clearSelection() } },
    { icon: <Eye size={13} />, label: 'Marquer lu', action: () => { clearSelection() } },
    { icon: <EyeOff size={13} />, label: 'Marquer non lu', action: () => { clearSelection() } },
    { icon: <Inbox size={13} />, label: 'Déplacer', action: () => {} },
  ]

  const contextActions = [
    { icon: <MessageSquare size={14} />, label: 'Ouvrir', action: (id: string) => { setSelectedConvId(id); setContextConvId(null) } },
    { icon: <FileText size={14} />, label: 'Modifier', action: (_id: string) => { setContextConvId(null) } },
    { icon: <Eye size={14} />, label: 'Marquer lu', action: (_id: string) => { setContextConvId(null) } },
    { icon: <EyeOff size={14} />, label: 'Marquer non lu', action: (_id: string) => { setContextConvId(null) } },
    { icon: <StarIcon size={14} />, label: 'Important', action: (_id: string) => { setContextConvId(null) } },
    { icon: <Users size={14} />, label: 'Affecter à un agent', action: (id: string) => { setAssignModalTarget(id); setContextConvId(null) } },
    { icon: <CornerUpRight size={14} />, label: 'Répondre', action: (id: string) => { setSelectedConvId(id); setContextConvId(null) } },
    { icon: <Download size={14} />, label: 'Exporter', action: (_id: string) => { setContextConvId(null) } },
    { icon: <Trash2 size={14} />, label: 'Supprimer', action: (_id: string) => { setContextConvId(null) } },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-sm text-text-secondary mt-1">
            {admin ? `Portail général — ${stats.total} conversations dans l'agence` : 'Mes conversations'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {admin && (
            <button
              onClick={() => navigate(`${admin ? '/admin' : ''}/messages/compose`)}
              className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              <Plus size={14} />
              Nouveau message
            </button>
          )}
        </div>
      </div>

      {admin && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border/50 shadow-card p-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Total conversations</p>
            <p className="text-2xl font-semibold mt-1">{stats.total}</p>
            <p className="text-xs text-text-secondary/60 mt-0.5">dans l'agence</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 shadow-card p-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Non lus</p>
            <p className="text-2xl font-semibold mt-1">{stats.unread}</p>
            <p className="text-xs text-text-secondary/60 mt-0.5">messages en attente</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 shadow-card p-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Envoyés ce mois</p>
            <p className="text-2xl font-semibold mt-1">{stats.sentThisMonth}</p>
            <p className="text-xs text-text-secondary/60 mt-0.5">par les agents</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 shadow-card p-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Importants</p>
            <p className="text-2xl font-semibold mt-1">{stats.starred}</p>
            <p className="text-xs text-text-secondary/60 mt-0.5">conversations suivies</p>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-20rem)] gap-0 rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="w-52 shrink-0 border-r border-border/50 bg-background/50 flex flex-col">
          <div className="p-3 border-b border-border/30">
            <button
              onClick={() => navigate(`${admin ? '/admin' : ''}/messages/compose`)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              <Plus size={14} />
              Nouveau message
            </button>
          </div>
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {FOLDERS.map(folder => {
              const isActive = activeFolder === folder.id
              const count = folder.id === 'inbox' ? unreadTotal : undefined
              return (
                <button
                  key={folder.id}
                  onClick={() => { setActiveFolder(folder.id); setSelectedConvId(null); setSelectedIds(new Set()) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-accent-light/40 text-accent font-medium'
                      : 'text-text-secondary hover:bg-background hover:text-text'
                  }`}
                >
                  <span className="shrink-0">{FOLDER_ICONS[folder.id]}</span>
                  <span className="flex-1 text-left">{folder.name}</span>
                  {count !== undefined && count > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-accent text-white min-w-[18px] text-center">
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
          <div className="p-2 border-t border-border/30 space-y-0.5">
            <button
              onClick={() => navigate(`${admin ? '/admin' : ''}/messages/templates`)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-background hover:text-text transition-colors"
            >
              <FileText size={16} />
              Modèles
            </button>
            <button
              onClick={() => navigate(`${admin ? '/admin' : ''}/messages/settings`)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-background hover:text-text transition-colors"
            >
              <AlertCircle size={16} />
              Paramètres
            </button>
          </div>
        </div>

        <div className="w-80 shrink-0 border-r border-border/50 flex flex-col">
          <div className="p-3 border-b border-border/30 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60" />
              <input
                type="text"
                placeholder="Rechercher par nom, sujet..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border/50 rounded-lg text-text placeholder:text-text-secondary/40 focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  value={statusFilter}
                  onChange={(val: string) => setStatusFilter(val as 'all' | 'unread' | 'read')}
                  options={[
                    { value: 'all', label: 'Tous les messages' },
                    { value: 'unread', label: 'Non lus' },
                    { value: 'read', label: 'Lus' },
                  ]}
                />
              </div>
              <div className="flex-1">
                <Select
                  options={[
                    { value: 'all', label: 'Toutes les dates' },
                    { value: 'today', label: "Aujourd'hui" },
                    { value: 'week', label: 'Cette semaine' },
                    { value: 'month', label: 'Ce mois' },
                  ]}
                />
              </div>
              {admin && (
                <div className="flex-1">
                  <Select
                    value={filterAgent}
                    onChange={(val: string) => setFilterAgent(val)}
                    options={[
                      { value: '', label: 'Tous les agents' },
                      ...AGENTS.map(a => ({ value: a.id, label: a.name })),
                    ]}
                  />
                </div>
              )}
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[11px] text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
              >
                <X size={11} /> Réinitialiser
              </button>
            )}
          </div>

          {admin && selectedIds.size > 0 && (
            <div className="px-3 py-2 bg-accent/5 border-b border-accent/20 flex items-center gap-2">
              <span className="text-[11px] font-medium text-accent flex-1">{selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}</span>
              {bulkActions.map((action, i) => (
                <button
                  key={i}
                  onClick={action.action}
                  className="p-1.5 rounded-md hover:bg-accent/10 text-text-secondary hover:text-accent transition-colors"
                  title={action.label}
                >
                  {action.icon}
                </button>
              ))}
              <button onClick={clearSelection} className="p-1.5 rounded-md hover:bg-accent/10 text-text-secondary hover:text-accent transition-colors" title="Annuler la sélection">
                <X size={13} />
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
                <MessageSquare size={28} className="mb-2 opacity-30" />
                <p className="text-sm">Aucune conversation</p>
              </div>
            ) : (
              conversations.map(conv => {
                const isSelected = selectedConvId === conv.id
                const hasUnread = conv.unreadCount > 0
                const isChecked = selectedIds.has(conv.id)
                const otherPart = conv.participants.find(p => p.type !== 'agent') || conv.participants[0]
                return (
                  <div
                    key={conv.id}
                    className={`relative flex border-b border-border/20 transition-colors hover:bg-background/50 cursor-pointer ${
                      isSelected ? 'bg-accent-light/20' : ''
                    } ${hasUnread ? 'bg-accent-light/[0.04]' : ''}`}
                  >
                    {admin && (
                      <div className="flex items-start pt-4 pl-3 pr-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => toggleSelect(conv.id)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isChecked ? 'bg-accent border-accent' : 'border-border hover:border-text-secondary/40'
                          }`}
                        >
                          {isChecked && <CheckSquare size={12} className="text-white" />}
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => { setSelectedConvId(conv.id); setReplyText('') }}
                      className="flex-1 text-left px-2 py-3 min-w-0"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`relative w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          hasUnread ? 'bg-accent text-white' : 'bg-background text-text-secondary border border-border/50'
                        }`}>
                          {otherPart.name.charAt(0)}
                          {hasUnread && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent border-2 border-card" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm truncate flex items-center gap-1.5 ${hasUnread ? 'font-bold text-text' : 'font-medium text-text'}`}>
                              {hasUnread && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
                              {otherPart.name}
                            </span>
                            <span className="text-[10px] text-text-secondary/60 whitespace-nowrap">
                              {formatDate(conv.lastActivityAt)}
                            </span>
                          </div>
                          <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'font-semibold text-text' : 'text-text-secondary/80'}`}>
                            {conv.subject}
                          </p>
                          <p className="text-[11px] text-text-secondary/60 truncate mt-0.5">{conv.preview}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            {conv.isStarred && <StarIcon size={10} className="text-yellow-500" />}
                            {conv.messages.some(m => m.attachments.length > 0) && (
                              <Paperclip size={10} className="text-text-secondary/40" />
                            )}
                            {admin && (
                              <span className="text-[9px] text-text-secondary/40">{agentName(conv.createdBy)}</span>
                            )}
                            {hasUnread && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-accent text-white leading-none">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                    {admin && (
                      <div className="relative flex items-start pt-3 pr-2">
                        <button
                          onClick={e => { e.stopPropagation(); setContextConvId(contextConvId === conv.id ? null : conv.id) }}
                          className="p-1 rounded-md hover:bg-background text-text-secondary/50 hover:text-text transition-colors"
                          title="Plus d'actions"
                        >
                          <MoreVertical size={14} />
                        </button>
                        {contextConvId === conv.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setContextConvId(null)} />
                            <div className="absolute right-0 top-10 z-20 w-52 bg-card border border-border/50 rounded-xl shadow-modal p-1.5">
                              {contextActions.map((act, i) => (
                                i === contextActions.length - 2 ? (
                                  <div key={act.label}>
                                    <div className="border-t border-border/30 my-1" />
                                    <button
                                      onClick={() => act.action(conv.id)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-error transition-colors"
                                    >
                                      {act.icon} {act.label}
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    key={act.label}
                                    onClick={() => act.action(conv.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-text transition-colors"
                                  >
                                    {act.icon} {act.label}
                                  </button>
                                )
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {selectedConv ? (
            <>
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 shrink-0">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-text truncate">{selectedConv.subject}</h2>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {selectedConv.participants.filter(p => p.type !== 'agent').map(p => (
                      <span key={p.id} className="text-xs text-text-secondary">{p.name}</span>
                    ))}
                    {selectedConv.relatedPropertyTitle && (
                      <>
                        <span className="text-text-secondary/40 text-[10px]">•</span>
                        <span className="text-xs text-accent">{selectedConv.relatedPropertyTitle}</span>
                      </>
                    )}
                    {selectedConv.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-accent text-white ml-1">
                        {selectedConv.unreadCount} non lu{selectedConv.unreadCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-colors" title="Marquer comme important">
                    <StarIcon size={14} />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-colors" title="Marquer comme non lu">
                    <EyeOff size={14} />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-colors" title="Transférer">
                    <ForwardIcon size={14} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {selectedConv.messages.map((msg, i) => {
                  const isMine = msg.sender.type === 'agent'
                  const prevMsg = selectedConv.messages[i - 1]
                  const showDateHeader = !prevMsg || new Date(prevMsg.sentAt).toDateString() !== new Date(msg.sentAt).toDateString()
                  const isLastUnread = !msg.isRead && i === selectedConv.messages.length - 1
                  return (
                    <div key={msg.id}>
                      {showDateHeader && (
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-1 h-px bg-border/30" />
                          <span className="text-[10px] text-text-secondary/40 font-medium">
                            {formatMessageDate(msg.sentAt)}
                          </span>
                          <div className="flex-1 h-px bg-border/30" />
                        </div>
                      )}
                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[70%]">
                          <div className={`flex items-center gap-2 mb-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                            {!isMine && (
                              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                                {msg.sender.name.charAt(0)}
                              </div>
                            )}
                            <span className="text-[11px] text-text-secondary/60">{msg.sender.name}</span>
                            <span className="text-[10px] text-text-secondary/40">
                              {new Date(msg.sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!msg.isRead && <span className="w-1.5 h-1.5 rounded-full bg-accent" title="Non lu" />}
                          </div>
                          <div className={`rounded-xl px-4 py-3 ${
                            isMine
                              ? 'bg-accent text-white rounded-tr-md'
                              : 'bg-background border border-border/50 rounded-tl-md'
                          }`}>
                            <p className={`text-sm whitespace-pre-wrap ${isMine ? 'text-white/90' : 'text-text'}`}>
                              {msg.body}
                            </p>
                            {msg.attachments.length > 0 && (
                              <div className={`mt-3 space-y-1.5 ${isMine ? 'border-t border-white/20' : 'border-t border-border/50'}`}>
                                <p className={`text-[11px] pt-2 ${isMine ? 'text-white/70' : 'text-text-secondary/60'}`}>
                                  Pièces jointes
                                </p>
                                {msg.attachments.map(att => (
                                  <a
                                    key={att.id}
                                    href={att.url}
                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                      isMine
                                        ? 'bg-white/10 text-white/80 hover:bg-white/20'
                                        : 'bg-accent-light/20 text-accent hover:bg-accent-light/40'
                                    }`}
                                  >
                                    <Paperclip size={12} />
                                    <span className="flex-1 truncate">{att.name}</span>
                                    <span className={isMine ? 'text-white/50' : 'text-text-secondary/40'}>{att.size}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {selectedConv.unreadCount > 0 && (
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-accent/30" />
                    <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
                      {selectedConv.unreadCount} message{selectedConv.unreadCount > 1 ? 's' : ''} non lu{selectedConv.unreadCount > 1 ? 's' : ''}
                    </span>
                    <div className="flex-1 h-px bg-accent/30" />
                  </div>
                )}
              </div>

              <div className="px-5 py-3 border-t border-border/30 shrink-0">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <textarea
                      placeholder="Écrivez votre réponse..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm bg-background border border-border/50 rounded-lg text-text placeholder:text-text-secondary/40 focus:outline-none focus:border-accent/50 transition-colors resize-none"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendReply()
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {}}
                    className="p-2 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-colors"
                    title="Ajouter une pièce jointe"
                  >
                    <Paperclip size={16} />
                  </button>
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Envoyer
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-text-secondary">
              <MessageSquare size={40} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">Sélectionnez une conversation</p>
              <p className="text-xs text-text-secondary/60 mt-1 text-center">Choisissez une conversation dans la liste ou créez un nouveau message</p>
              <button
                onClick={() => navigate(`${admin ? '/admin' : ''}/messages/compose`)}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                <Plus size={14} />
                Nouveau message
              </button>
            </div>
          )}
        </div>
      </div>

      {admin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 shadow-card p-5">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <BarChartIcon size={16} className="text-accent" />
              Activité des messages (7 derniers jours)
            </h3>
            <div className="flex items-end gap-2 h-28">
              {chartData.map((item, i) => (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[10px] text-text-secondary/60 font-medium">{item.count}</span>
                  <div
                    className="w-full rounded-md bg-accent/70 transition-all"
                    style={{ height: `${Math.max(item.pct, 4)}%` }}
                  />
                  <span className="text-[9px] text-text-secondary/40 whitespace-nowrap">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <ZapIcon size={16} className="text-accent" />
              Actions rapides
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate(`${admin ? '/admin' : ''}/messages/compose`)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-text transition-colors"
              >
                <Send size={14} className="text-text-secondary" />
                Nouveau message
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-text transition-colors">
                <Mail size={14} className="text-text-secondary" />
                Envoyer une newsletter
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-text transition-colors">
                <Inbox size={14} className="text-text-secondary" />
                Archiver les conversations sélectionnées {selectedIds.size > 0 && `(${selectedIds.size})`}
              </button>
              <button
                onClick={() => navigate(`${admin ? '/admin' : ''}/messages/settings`)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-background text-text transition-colors"
              >
                <AlertCircle size={14} className="text-text-secondary" />
                Paramètres des notifications
              </button>
            </div>
          </div>
        </div>
      )}

      {admin && assignModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAssignModalTarget(null)} />
          <div className="relative bg-card border border-border/50 rounded-xl shadow-modal p-5 w-72">
            <h3 className="text-sm font-semibold mb-3">Affecter à un agent</h3>
            <div className="space-y-1">
              {AGENTS.map(a => (
                <button
                  key={a.id}
                  onClick={() => setAssignModalTarget(null)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-background text-text transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                    {a.name.charAt(0)}
                  </div>
                  {a.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setAssignModalTarget(null)}
              className="w-full mt-3 px-3 py-2 text-xs text-text-secondary hover:text-text transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function BarChartIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  )
}

function ZapIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}
