import { useParams, useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { InfoField } from '../../components/ui/InfoField'
import { useEffect, useState } from 'react'

interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  relatedProperty: string;
  relatedClient: string;
  body: string;
  attachments: { name: string; size: string }[];
}

export default function MessageDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [message, setMessage] = useState<Message | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API fetch
    const fetchMessage = async () => {
      setIsLoading(true)
      // In a real app, you would fetch from your API here
      setTimeout(() => {
        const mockMessage = {
          id: id || '',
          from: 'Sophie Martin',
          to: 'Karim Eloui',
          subject: 'Visite de la villa à Marrakech',
          date: '2023-06-15T14:30:00',
          relatedProperty: 'Villa Marrakech #1234',
          relatedClient: 'Sophie Martin',
          body: `Bonjour Karim,

Je suis très intéressée par la villa que vous proposez à Marrakech. Serait-il possible de faire une visite le week-end prochain?

J'aimerais également savoir si le prix est négociable et quelles sont les charges annuelles.

Cordialement,
Sophie Martin`,
          attachments: [
            { name: 'critères.pdf', size: '2.4 MB' },
            { name: 'photo_piece_jointe.jpg', size: '1.8 MB' }
          ]
        }
        setMessage(mockMessage)
        setIsLoading(false)
      }, 500)
    }

    fetchMessage()
  }, [id])

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    )
  }

  if (!message) {
    return (
      <div className="p-6 text-center">
        <Icon name="alert-circle" className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium">Message non trouvé</h3>
        <p className="mt-2 text-gray-500">
          Le message que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <Button variant="default" className="mt-4" onClick={() => navigate('/messages')}>
          Retour aux messages
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" icon="arrow-left" onClick={() => navigate('/messages')} />
          <h1 className="text-2xl font-bold">{message.subject}</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon="reply">
            Répondre
          </Button>
          <Button variant="outline" icon="forward">
            Transférer
          </Button>
          <Button variant="outline" icon="trash-2">
            Supprimer
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <Icon name="user" className="text-accent" />
              </div>
              <div>
                <h3 className="font-medium">{message.from}</h3>
                <p className="text-sm text-gray-500">À {message.to}</p>
              </div>
            </div>
            <div className="text-gray-500">
              {new Date(message.date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="prose max-w-none">
              {message.body.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>

          {message.attachments.length > 0 && (
            <div className="border-t pt-6">
              <h4 className="font-medium mb-3">Pièces jointes</h4>
              <div className="flex flex-wrap gap-3">
                {message.attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 border rounded-lg p-3">
                    <Icon name="paperclip" className="text-gray-400" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">{file.size}</p>
                    </div>
                    <Button variant="ghost" size="sm" icon="download" className="ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="font-semibold text-lg mb-4">Liens associés</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField 
              label="Bien concerné" 
              value={message.relatedProperty} 
              icon="home"
              action={
                <Button 
                  variant="ghost" 
                  size="sm" 
                  icon="arrow-right" 
                  onClick={() => navigate(`/properties/${message.relatedProperty.split('#')[1]}`)}
                />
              }
            />
            <InfoField 
              label="Client" 
              value={message.relatedClient} 
              icon="user"
              action={
                <Button 
                  variant="ghost" 
                  size="sm" 
                  icon="arrow-right" 
                  onClick={() => navigate(`/clients/${message.relatedClient.split(' ').join('-').toLowerCase()}`)}
                />
              }
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" icon="reply">
          Répondre
        </Button>
        <Button variant="default" icon="forward">
          Transférer
        </Button>
      </div>
    </div>
  )
}