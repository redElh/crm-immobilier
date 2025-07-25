import { useParams, useNavigate } from 'react-router-dom'
import Card from '../../../../components/ui/Card'
import { Button } from '../../../../components/ui/Button'
import { Input } from '../../../../components/ui/Input'
import { Textarea } from '../../../../components/ui/Textarea'
import { Select } from '../../../../components/ui/Select'
import { Badge } from '../../../../components/ui/Badge'
import { useEffect, useState } from 'react'

const templateCategories = [
  { value: 'visites', label: 'Visites' },
  { value: 'mandats', label: 'Mandats' },
  { value: 'suivi', label: 'Suivi clients' },
  { value: 'generique', label: 'Générique' }
]

interface Template {
  id: string;
  name: string;
  category: string;
  subject: string;
  content: string;
}

export default function EditTemplatePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState<Template>({
    id: id || '',
    name: '',
    category: '',
    subject: '',
    content: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading template data
    const fetchTemplate = async () => {
      setIsLoading(true)
      setTimeout(() => {
        const mockTemplate = {
          id: id || '',
          name: 'Confirmation de visite',
          category: 'visites',
          subject: 'Confirmation de visite - [Propriété]',
          content: 'Bonjour [Nom],\n\nNous confirmons votre visite du [Date] à [Heure].\n\nCordialement,'
        }
        setFormData(mockTemplate)
        setIsLoading(false)
      }, 500)
    }

    fetchTemplate()
  }, [id])

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    if (!formData.name || !formData.subject || !formData.content) {
      alert('Veuillez remplir les champs obligatoires (nom, sujet, contenu)')
      return
    }

    setIsSaving(true)
    // Simulate API call
    setTimeout(() => {
      console.log('Template updated:', formData)
      setIsSaving(false)
      navigate('/messages/templates')
    }, 1500)
  }

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" icon="arrow-left" onClick={() => navigate('/messages/templates')}>
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Modifier le modèle</h1>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="default" 
            icon={isSaving ? "loader" : "save"}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nom du modèle*"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
            <Select 
              options={templateCategories}
              label="Catégorie"
              value={formData.category}
              onValueChange={(value) => handleInputChange('category', value)}
            />
          </div>

          <Input
            label="Sujet*"
            value={formData.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium mb-2">Contenu du modèle*</label>
            <Textarea
              rows={12}
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              required
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Variables disponibles</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="cursor-pointer" onClick={() => handleInputChange('content', formData.content + '[Nom]')}>
                [Nom]
              </Badge>
              <Badge variant="outline" className="cursor-pointer" onClick={() => handleInputChange('content', formData.content + '[Prénom]')}>
                [Prénom]
              </Badge>
              <Badge variant="outline" className="cursor-pointer" onClick={() => handleInputChange('content', formData.content + '[Propriété]')}>
                [Propriété]
              </Badge>
              <Badge variant="outline" className="cursor-pointer" onClick={() => handleInputChange('content', formData.content + '[Date]')}>
                [Date]
              </Badge>
              <Badge variant="outline" className="cursor-pointer" onClick={() => handleInputChange('content', formData.content + '[Heure]')}>
                [Heure]
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}