import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { X, Paperclip, Send, Save, ArrowLeft, User, Home, FileText, Users, CheckSquare } from 'react-feather'
import Card from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Checkbox } from '../../components/ui/Checkbox'
import { mockConversations, mockTemplates } from '../../types/messages'

const allParticipants = Array.from(
  new Map(mockConversations.flatMap(c => c.participants).map(p => [p.id, p])).values()
)

const mockProperties = Array.from(
  new Map(
    mockConversations
      .filter(c => c.relatedPropertyId && c.relatedPropertyTitle)
      .map(c => [c.relatedPropertyId!, { value: c.relatedPropertyId!, label: c.relatedPropertyTitle! }])
  ).values()
)

const VARIABLE_BADGES = [
  { label: '{{client.prenom}}', value: '{{client.prenom}}' },
  { label: '{{client.nom}}', value: '{{client.nom}}' },
  { label: '{{bien.titre}}', value: '{{bien.titre}}' },
  { label: '{{agent.prenom}}', value: '{{agent.prenom}}' },
  { label: '{{agent.nom}}', value: '{{agent.nom}}' },
  { label: '{{date_visite}}', value: '{{date_visite}}' },
  { label: '{{heure_visite}}', value: '{{heure_visite}}' },
  { label: '{{liste_biens}}', value: '{{liste_biens}}' },
  { label: '{{liste_documents}}', value: '{{liste_documents}}' },
]

export default function ComposeMessagePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [recipientType, setRecipientType] = useState<'client' | 'agent' | 'multiple'>('client')
  const [selectedRecipients, setSelectedRecipients] = useState<Array<{ id: string; name: string; type: string }>>([])
  const [property, setProperty] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const [sendCopy, setSendCopy] = useState(false)
  const [scheduleSend, setScheduleSend] = useState(false)
  const [markImportant, setMarkImportant] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const availableRecipients = allParticipants.filter(p => {
    if (selectedRecipients.some(r => r.id === p.id)) return false
    if (recipientType === 'client') return p.type === 'client'
    if (recipientType === 'agent') return p.type === 'agent'
    return true
  })

  const placeholderLabel = availableRecipients.length === 0
    ? 'Tous les destinataires sélectionnés'
    : recipientType === 'client'
      ? 'Ajouter un client...'
      : recipientType === 'agent'
        ? 'Ajouter un agent...'
        : 'Ajouter un destinataire...'

  const recipientOptions = [
    { value: '', label: placeholderLabel },
    ...availableRecipients.map(p => ({ value: p.id, label: p.name })),
  ]

  const propertyOptions = mockProperties.map(p => ({ value: p.value, label: p.label }))
  const templateOptions = mockTemplates.map(t => ({ value: t.id, label: t.name }))

  useEffect(() => {
    if (!templateId) return
    const template = mockTemplates.find(t => t.id === templateId)
    if (template) {
      setSubject(template.subject)
      setBody(template.body)
    }
  }, [templateId])

  const handleAddRecipient = (id: string) => {
    if (!id) return
    const person = allParticipants.find(p => p.id === id)
    if (person) {
      setSelectedRecipients(prev => [...prev, person])
    }
  }

  const handleRemoveRecipient = (id: string) => {
    setSelectedRecipients(prev => prev.filter(r => r.id !== id))
  }

  const handleAddAttachment = () => {
    const names = [
      'brochure_villa_marrakech.pdf',
      'plan_acces.pdf',
      'mandat_signe.pdf',
      'photos_biens.zip',
      'document_identite.pdf',
      'compromis_vente.pdf',
    ]
    const name = names[Math.floor(Math.random() * names.length)]
    setAttachments(prev => [...prev, name])
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleInsertVariable = (variable: string) => {
    setBody(prev => prev + variable)
  }

  const handleSend = () => {
    if (selectedRecipients.length === 0) return
    if (!subject.trim()) return
    if (!body.trim()) return

    setIsSending(true)
    setTimeout(() => {
      setIsSending(false)
      navigate('/messages')
    }, 1500)
  }

  const handleSaveDraft = () => {
    navigate('/messages')
  }

  const isFormValid = selectedRecipients.length > 0 && subject.trim().length > 0 && body.trim().length > 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/messages')} />
          <h1 className="text-2xl font-bold">Nouveau Message</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={<Save size={16} />} onClick={handleSaveDraft}>
            Enregistrer comme brouillon
          </Button>
          <Button
            variant="default"
            icon={<Send size={16} />}
            onClick={handleSend}
            disabled={!isFormValid || isSending}
            loading={isSending}
          >
            {isSending ? 'Envoi en cours...' : 'Envoyer'}
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-6 space-y-6">
          <div>
            <label className="text-sm font-medium text-text mb-3 block">Type de destinataire</label>
            <div className="flex gap-6">
              {(['client', 'agent', 'multiple'] as const).map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex-shrink-0">
                    <input
                      type="radio"
                      name="recipientType"
                      className="sr-only"
                      checked={recipientType === type}
                      onChange={() => setRecipientType(type)}
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      recipientType === type
                        ? 'border-accent'
                        : 'border-border group-hover:border-text-secondary/40'
                    }`}>
                      {recipientType === type && (
                        <div className="w-2 h-2 rounded-full bg-accent animate-scale-in" />
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-text capitalize">{type === 'multiple' ? 'Multiple' : type}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-text mb-2 block">
              Destinataires <span className="text-error">*</span>
            </label>
            {selectedRecipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedRecipients.map(recipient => (
                  <div
                    key={recipient.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-background text-text-secondary text-sm"
                  >
                    {recipient.type === 'client' ? <User size={12} /> : <Users size={12} />}
                    <span>{recipient.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipient(recipient.id)}
                      className="ml-0.5 text-text-secondary/60 hover:text-text transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Select
              options={recipientOptions}
              placeholder="Ajouter un destinataire..."
              value=""
              onValueChange={handleAddRecipient}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Bien concerné"
              options={propertyOptions}
              placeholder="Sélectionner un bien (optionnel)"
              value={property}
              onValueChange={setProperty}
            />
            <Select
              label="Modèle"
              options={templateOptions}
              placeholder="Utiliser un modèle (optionnel)"
              value={templateId}
              onValueChange={setTemplateId}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">
              Sujet <span className="text-error">*</span>
            </label>
            <input
              type="text"
              className="w-full h-9 px-3 py-2 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent hover:border-text-secondary/30 transition-all duration-200 ease-out"
              placeholder="Objet du message"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">
              Message <span className="text-error">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {VARIABLE_BADGES.map(v => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => handleInsertVariable(v.value)}
                  className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md border border-border bg-transparent text-text-secondary hover:text-text hover:bg-background transition-colors"
                >
                  {v.label}
                </button>
              ))}
            </div>
            <textarea
              className="w-full min-h-[200px] px-3 py-2 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent hover:border-text-secondary/30 transition-all duration-200 ease-out resize-y"
              placeholder="Écrivez votre message ici..."
              rows={10}
              value={body}
              onChange={e => setBody(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">Pièces jointes</label>
            <Button variant="outline" icon={<Paperclip size={16} />} onClick={handleAddAttachment}>
              Ajouter un fichier
            </Button>
            {attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card"
                  >
                    <FileText size={14} className="text-text-secondary shrink-0" />
                    <span className="text-sm text-text flex-1">{file}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      className="text-text-secondary/60 hover:text-text transition-colors shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">Options</label>
            <div className="space-y-2">
              <Checkbox
                label="Envoyer une copie à mon adresse"
                checked={sendCopy}
                onChange={setSendCopy}
              />
              <Checkbox
                label="Programmer l'envoi"
                checked={scheduleSend}
                onChange={setScheduleSend}
              />
              <Checkbox
                label="Marquer comme important"
                checked={markImportant}
                onChange={setMarkImportant}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/messages')}>
          Annuler
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" icon={<Save size={16} />} onClick={handleSaveDraft}>
            Enregistrer comme brouillon
          </Button>
          <Button
            variant="default"
            icon={<Send size={16} />}
            onClick={handleSend}
            disabled={!isFormValid || isSending}
            loading={isSending}
          >
            {isSending ? 'Envoi en cours...' : 'Envoyer'}
          </Button>
        </div>
      </div>
    </div>
  )
}
