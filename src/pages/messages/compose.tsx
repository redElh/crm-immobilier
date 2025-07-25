import Card from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Icon } from '../../components/ui/Icon'
import { Badge } from '../../components/ui/Badge'

const mockRecipients = [
  { value: 'client1', label: 'Sophie Martin', type: 'client' },
  { value: 'client2', label: 'Thomas Dubois', type: 'client' },
  { value: 'colleague1', label: 'Youssef Amrani', type: 'colleague' },
  { value: 'colleague2', label: 'Leila Benbrahim', type: 'colleague' }
]

const mockProperties = [
  { value: 'property1', label: 'Villa Marrakech #1234' },
  { value: 'property2', label: 'Appartement Casablanca #5678' }
]

const mockTemplates = [
  { id: 'template1', name: 'Confirmation de visite', content: 'Bonjour [Nom],\n\nNous confirmons votre visite du [Date] à [Heure].\n\nCordialement,' },
  { id: 'template2', name: 'Relance après visite', content: 'Bonjour [Nom],\n\nSuite à votre visite du [Date], quelles sont vos impressions?\n\nCordialement,' },
  { id: 'template3', name: 'Demande de mandat', content: 'Bonjour [Nom],\n\nNous vous remercions pour votre confiance. Veuillez trouver ci-joint le mandat à signer.\n\nCordialement,' }
]

const mockDrafts = [
  {
    id: 'draft1',
    recipient: 'client1',
    property: 'property1',
    subject: 'Proposition de visite - Villa Marrakech',
    message: 'Bonjour [Nom],\n\nJe vous propose une visite de la villa à Marrakech...',
    attachments: []
  }
]

export default function ComposeMessagePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    recipient: '',
    property: '',
    template: '',
    subject: '',
    message: '',
    attachments: [] as string[]
  })
  const [isSending, setIsSending] = useState(false)
  const [availableTemplates, setAvailableTemplates] = useState(mockTemplates)

  // Load draft or template when component mounts
  useEffect(() => {
    const draftId = searchParams.get('draftId')
    const templateId = searchParams.get('templateId')

    if (draftId) {
      const draft = mockDrafts.find(d => d.id === draftId)
      if (draft) {
        setFormData({
          recipient: draft.recipient,
          property: draft.property,
          template: '',
          subject: draft.subject,
          message: draft.message,
          attachments: draft.attachments
        })
      }
    } else if (templateId) {
      const template = mockTemplates.find(t => t.id === templateId)
      if (template) {
        setFormData(prev => ({
          ...prev,
          template: templateId,
          subject: template.name,
          message: template.content
        }))
      }
    }
  }, [searchParams])

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleTemplateChange = (value: string) => {
    const selectedTemplate = mockTemplates.find(t => t.id === value)
    if (selectedTemplate) {
      setFormData(prev => ({
        ...prev,
        template: value,
        message: selectedTemplate.content,
        subject: selectedTemplate.name
      }))
    }
  }

  const handleSend = () => {
    if (!formData.recipient || !formData.subject || !formData.message) {
      alert('Veuillez remplir les champs obligatoires (destinataire, sujet, message)')
      return
    }

    setIsSending(true)
    setTimeout(() => {
      console.log('Message sent:', formData)
      setIsSending(false)
      navigate('/messages')
    }, 1500)
  }

  const handleSaveDraft = () => {
    console.log('Draft saved:', formData)
    alert('Brouillon enregistré')
    navigate('/messages')
  }

  const handleAddAttachment = () => {
    const fileName = `fichier-${Math.floor(Math.random() * 1000)}.pdf`
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, fileName]
    }))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" icon="arrow-left" onClick={() => navigate('/messages')}>
            Retour
          </Button>
          <h1 className="text-2xl font-bold">
            {searchParams.get('draftId') ? 'Modifier le brouillon' : 'Nouveau message'}
          </h1>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            icon="save"
            onClick={handleSaveDraft}
          >
            Enregistrer comme brouillon
          </Button>
          <Button 
            variant="default" 
            icon={isSending ? "loader" : "send"}
            onClick={handleSend}
            disabled={isSending}
          >
            {isSending ? 'Envoi en cours...' : 'Envoyer'}
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select 
              options={mockRecipients}
              placeholder="Sélectionner un destinataire"
              label="Destinataire*"
              value={formData.recipient}
              onValueChange={(value) => handleInputChange('recipient', value)}
              required
            />
            <Select 
              options={mockProperties}
              placeholder="Lier à un bien"
              label="Bien concerné"
              value={formData.property}
              onValueChange={(value) => handleInputChange('property', value)}
            />
            <Select 
              options={availableTemplates.map(t => ({ value: t.id, label: t.name }))}
              placeholder="Utiliser un modèle"
              label="Modèle"
              value={formData.template}
              onValueChange={handleTemplateChange}
            />
          </div>

          <Input
            label="Sujet*"
            placeholder="Objet du message"
            value={formData.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium mb-2">Message*</label>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="cursor-pointer" onClick={() => handleInputChange('message', formData.message + '[Nom]')}>
                [Nom]
              </Badge>
              <Badge variant="outline" className="cursor-pointer" onClick={() => handleInputChange('message', formData.message + '[Prénom]')}>
                [Prénom]
              </Badge>
              <Badge variant="outline" className="cursor-pointer" onClick={() => handleInputChange('message', formData.message + '[Propriété]')}>
                [Propriété]
              </Badge>
              <Badge variant="outline" className="cursor-pointer" onClick={() => handleInputChange('message', formData.message + '[Date]')}>
                [Date]
              </Badge>
            </div>
            <Textarea
              placeholder="Écrivez votre message ici..."
              rows={10}
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Pièces jointes</label>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Button variant="outline" icon="paperclip" onClick={handleAddAttachment}>
                  Ajouter un fichier
                </Button>
                <Button variant="outline" icon="file-text">
                  Ajouter un document CRM
                </Button>
              </div>
              
              {formData.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <Icon name="paperclip" className="text-gray-400" />
                      <span className="text-sm">{file}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        icon="x" 
                        className="ml-auto"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          attachments: prev.attachments.filter((_, i) => i !== index)
                        }))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}