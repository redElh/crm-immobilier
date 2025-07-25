import Card from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Textarea } from '../../../components/ui/Textarea'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Select } from '../../../components/ui/Select'
import { Badge } from '../../../components/ui/Badge'

const templateCategories = [
  { value: 'visites', label: 'Visites' },
  { value: 'mandats', label: 'Mandats' },
  { value: 'suivi', label: 'Suivi clients' },
  { value: 'generique', label: 'Générique' }
]

export default function NewTemplatePage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subject: '',
    content: ''
  })
  const [isSaving, setIsSaving] = useState(false)

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
      console.log('Template created:', formData)
      setIsSaving(false)
      navigate('/messages/templates')
    }, 1500)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" icon="arrow-left" onClick={() => navigate('/messages/templates')}>
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Nouveau modèle</h1>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="default" 
            icon={isSaving ? "loader" : "save"}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Enregistrement...' : 'Créer le modèle'}
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nom du modèle*"
              placeholder="Ex: Confirmation de visite"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
            <Select 
              options={templateCategories}
              placeholder="Sélectionner une catégorie"
              label="Catégorie"
              value={formData.category}
              onValueChange={(value) => handleInputChange('category', value)}
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
            <label className="block text-sm font-medium mb-2">Contenu du modèle*</label>
            <p className="text-sm text-gray-500 mb-2">
              Vous pouvez utiliser des variables comme [Nom], [Propriété], [Date], etc.
            </p>
            <Textarea
              placeholder={`Exemple:\nBonjour [Nom],\n\nNous confirmons votre visite du [Date] à [Heure].\n\nCordialement,`}
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