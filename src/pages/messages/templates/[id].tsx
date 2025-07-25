import { useParams, useNavigate } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Icon } from '../../../components/ui/Icon'
import { InfoField } from '../../../components/ui/InfoField'
import { useEffect, useState } from 'react'

interface Template {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  lastUpdated: string;
}

export default function TemplateDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [template, setTemplate] = useState<Template | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API fetch
    const fetchTemplate = async () => {
      setIsLoading(true)
      setTimeout(() => {
        const mockTemplate = {
          id: id || '',
          name: 'Confirmation de visite',
          subject: 'Confirmation de visite - [Propriété]',
          content: 'Bonjour [Nom],\n\nNous confirmons votre visite du [Date] à [Heure].\n\nCordialement,',
          category: 'Visites',
          lastUpdated: '2023-05-20T14:00:00'
        }
        setTemplate(mockTemplate)
        setIsLoading(false)
      }, 500)
    }

    fetchTemplate()
  }, [id])

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="p-6 text-center">
        <Icon name="alert-circle" className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium">Modèle non trouvé</h3>
        <p className="mt-2 text-gray-500">
          Le modèle que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <Button variant="default" className="mt-4" onClick={() => navigate('/messages')}>
          Retour aux modèles
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" icon="arrow-left" onClick={() => navigate('/messages')} />
          <h1 className="text-2xl font-bold">{template.name}</h1>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            icon="edit"
            onClick={() => navigate(`/messages/templates/${id}/edit`)}
          >
            Modifier
          </Button>
          <Button 
            variant="default" 
            icon="copy"
            onClick={() => navigate(`/messages/compose?templateId=${id}`)}
          >
            Utiliser ce modèle
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoField label="Nom" value={template.name} />
            <InfoField label="Catégorie" value={template.category} />
            <InfoField 
              label="Dernière modification" 
              value={new Date(template.lastUpdated).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })} 
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="font-medium mb-2">Sujet</h3>
            <p>{template.subject}</p>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-medium mb-2">Contenu</h3>
            <div className="prose max-w-none bg-gray-50 p-4 rounded">
              {template.content.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}