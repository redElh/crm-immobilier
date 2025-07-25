import Card from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Table } from '../../components/ui/Table'
import { Icon } from '../../components/ui/Icon'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs/Tabs'
import React, { useState } from 'react'
import { Select } from '../../components/ui/Select'
import { useNavigate } from 'react-router-dom'

const messageTypes = [
  { value: 'all', label: 'Tous les messages' },
  { value: 'unread', label: 'Non lus' },
  { value: 'clients', label: 'Clients' },
  { value: 'colleagues', label: 'Collègues' },
  { value: 'leads', label: 'Prospects' }
]

const mockMessages = [
  {
    id: '1',
    from: 'Sophie Martin',
    subject: 'Visite de la villa à Marrakech',
    preview: 'Bonjour, je suis intéressée par la villa que vous proposez...',
    date: '2023-06-15T14:30:00',
    read: false,
    type: 'client',
    relatedProperty: 'Villa Marrakech #1234'
  },
  {
    id: '2',
    from: 'Youssef Amrani',
    subject: 'Mandat signé - Appartement Casablanca',
    preview: 'Le mandat pour l\'appartement à Casablanca a été signé...',
    date: '2023-06-14T09:15:00',
    read: true,
    type: 'colleague',
    relatedProperty: 'Appartement Casablanca #5678'
  },
  {
    id: '3',
    from: 'Ahmed Benali',
    subject: 'Demande d\'information sur appartement',
    preview: 'Bonjour, je souhaiterais avoir plus d\'informations sur...',
    date: '2023-06-13T16:45:00',
    read: false,
    type: 'lead',
    relatedProperty: 'Appartement Rabat #9012'
  }
]

// Add these mock data arrays to your existing mock data
const mockSentMessages = [
  {
    id: 's1',
    to: 'Sophie Martin',
    subject: 'Réponse: Visite de la villa à Marrakech',
    preview: 'Bonjour Sophie, Merci pour votre intérêt concernant la villa...',
    date: '2023-06-16T10:15:00',
    read: true,
    type: 'client',
    relatedProperty: 'Villa Marrakech #1234'
  },
  {
    id: 's2',
    to: 'Équipe Commerciale',
    subject: 'Rapport mensuel des ventes',
    preview: 'Veuillez trouver ci-joint le rapport des ventes pour le mois...',
    date: '2023-06-10T16:45:00',
    read: true,
    type: 'colleague',
    relatedProperty: ''
  }
]

const mockDrafts = [
  {
    id: 'd1',
    subject: 'Proposition de visite - Appartement Rabat',
    preview: 'Bonjour [Nom], Je vous propose une visite de l\'appartement...',
    date: '2023-06-18T11:20:00',
    lastEdited: '2023-06-18T11:20:00'
  },
  {
    id: 'd2',
    subject: 'Relance client potentiel - Villa Agadir',
    preview: 'Suite à notre dernier échange, je souhaitais savoir si...',
    date: '2023-06-15T09:10:00',
    lastEdited: '2023-06-17T14:35:00'
  }
]

const mockTemplates = [
  {
    id: 't1',
    name: 'Confirmation de visite',
    subject: 'Confirmation de visite - [Propriété]',
    content: 'Bonjour [Nom],\n\nNous confirmons votre visite du [Date] à [Heure].\n\nCordialement,',
    category: 'Visites',
    lastUpdated: '2023-05-20T14:00:00'
  },
  {
    id: 't2',
    name: 'Relance après visite',
    subject: 'Suite à votre visite - [Propriété]',
    content: 'Bonjour [Nom],\n\nSuite à votre visite du [Date], quelles sont vos impressions?\n\nCordialement,',
    category: 'Suivi',
    lastUpdated: '2023-05-15T10:30:00'
  },
  {
    id: 't3',
    name: 'Demande de mandat',
    subject: 'Mandat de vente - [Propriété]',
    content: 'Bonjour [Nom],\n\nNous vous remercions pour votre confiance. Veuillez trouver ci-joint le mandat à signer.\n\nCordialement,',
    category: 'Mandats',
    lastUpdated: '2023-06-01T16:45:00'
  }
]

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState("inbox");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const navigate = useNavigate();

  const filteredMessages = mockMessages.filter(message => {
    // Apply search filter
    const matchesSearch = 
      message.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.preview.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.relatedProperty.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply type filter
    let matchesType = true;
    if (filterType === 'unread') {
      matchesType = !message.read;
    } else if (filterType !== 'all') {
      matchesType = message.type === filterType.slice(0, -1); // remove 's' from clients/colleagues/leads
    }
    
    return matchesSearch && matchesType;
  });

  const handleMessageClick = (messageId: string) => {
    navigate(`/messages/${messageId}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Messages</h1>
        <Button variant="default" icon="plus" onClick={() => navigate('/messages/compose')}>
          Nouveau message
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inbox">
            <Icon name="inbox" className="w-4 h-4 mr-2" />
            Boîte de réception
          </TabsTrigger>
          <TabsTrigger value="sent">
            <Icon name="send" className="w-4 h-4 mr-2" />
            Envoyés
          </TabsTrigger>
          <TabsTrigger value="drafts">
            <Icon name="file-text" className="w-4 h-4 mr-2" />
            Brouillons
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Icon name="copy" className="w-4 h-4 mr-2" />
            Modèles
          </TabsTrigger>
        </TabsList>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 my-4">
          <Input
            placeholder="Rechercher un message..."
            icon="search"
            className="md:w-1/2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            options={messageTypes}
            defaultValue="all"
            onValueChange={(value) => setFilterType(value)}
          />
        </div>

        <TabsContent value="inbox">
          <Card>
            <Table>
              <Table.Header>
                <Table.Column>De</Table.Column>
                <Table.Column>Sujet</Table.Column>
                <Table.Column>Bien concerné</Table.Column>
                <Table.Column>Date</Table.Column>
                <Table.Column>Actions</Table.Column>
              </Table.Header>
              <Table.Body>
                {filteredMessages.length > 0 ? (
                  filteredMessages.map((message) => (
                    <Table.Row 
                      key={message.id} 
                      className={!message.read ? 'bg-blue-50' : ''}
                      onClick={() => handleMessageClick(message.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          {!message.read && <Badge variant="primary" size="sm" />}
                          <span className="font-medium">{message.from}</span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div>
                          <p className="font-medium">{message.subject}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{message.preview}</p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        {message.relatedProperty}
                      </Table.Cell>
                      <Table.Cell>
                        {new Date(message.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            icon="reply" 
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle reply
                            }}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            icon="trash-2" 
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle delete
                            }}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            icon="archive" 
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle archive
                            }}
                          />
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Row>
                    <Table.Cell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <Icon name="inbox" className="h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium">Aucun message trouvé</h3>
                        <p className="mt-2 text-gray-500">
                          {searchTerm ? 
                            "Aucun message ne correspond à votre recherche" : 
                            "Aucun message dans cette catégorie"}
                        </p>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <Table>
              <Table.Header>
                <Table.Column>À</Table.Column>
                <Table.Column>Sujet</Table.Column>
                <Table.Column>Bien concerné</Table.Column>
                <Table.Column>Date</Table.Column>
                <Table.Column>Actions</Table.Column>
              </Table.Header>
              <Table.Body>
                {mockSentMessages.length > 0 ? (
                  mockSentMessages.map((message) => (
                    <Table.Row 
                      key={message.id}
                      onClick={() => handleMessageClick(message.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Table.Cell>
                        <span className="font-medium">{message.to}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <div>
                          <p className="font-medium">{message.subject}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{message.preview}</p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        {message.relatedProperty || '-'}
                      </Table.Cell>
                      <Table.Cell>
                        {new Date(message.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            icon="trash-2" 
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle delete
                            }}
                          />
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Row>
                    <Table.Cell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <Icon name="send" className="h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium">Aucun message envoyé</h3>
                        <p className="mt-2 text-gray-500">
                          Vous n'avez pas encore envoyé de messages
                        </p>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="drafts">
          <Card>
            <Table>
              <Table.Header>
                <Table.Column>Sujet</Table.Column>
                <Table.Column>Extrait</Table.Column>
                <Table.Column>Dernière modification</Table.Column>
                <Table.Column>Actions</Table.Column>
              </Table.Header>
              <Table.Body>
                {mockDrafts.length > 0 ? (
                  mockDrafts.map((draft) => (
                    <Table.Row 
                      key={draft.id}
                      onClick={() => navigate(`/messages/compose?draftId=${draft.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Table.Cell>
                        <span className="font-medium">{draft.subject}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <p className="text-sm text-gray-500 truncate max-w-xs">{draft.preview}</p>
                      </Table.Cell>
                      <Table.Cell>
                        {new Date(draft.lastEdited).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            icon="edit" 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/messages/compose?draftId=${draft.id}`);
                            }}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            icon="trash-2" 
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle delete
                            }}
                          />
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Row>
                    <Table.Cell colSpan={4} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <Icon name="file-text" className="h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium">Aucun brouillon</h3>
                        <p className="mt-2 text-gray-500">
                          Vous n'avez pas encore enregistré de brouillon
                        </p>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <div className="p-4 flex justify-between items-center">
              <Button variant="default" icon="plus" onClick={() => navigate('/messages/templates/new')}>
                Créer un modèle
              </Button>
              <div className="w-64">
                <Input
                  placeholder="Rechercher un modèle..."
                  icon="search"
                />
              </div>
            </div>
            <Table>
              <Table.Header>
                <Table.Column>Nom</Table.Column>
                <Table.Column>Sujet</Table.Column>
                <Table.Column>Catégorie</Table.Column>
                <Table.Column>Dernière modification</Table.Column>
                <Table.Column>Actions</Table.Column>
              </Table.Header>
              <Table.Body>
                {mockTemplates.length > 0 ? (
                  mockTemplates.map((template) => (
                    <Table.Row 
                      key={template.id}
                      onClick={() => navigate(`/messages/templates/${template.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Table.Cell>
                        <span className="font-medium">{template.name}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <p className="text-sm text-gray-600">{template.subject}</p>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge variant="outline">{template.category}</Badge>
                      </Table.Cell>
                      <Table.Cell>
                        {new Date(template.lastUpdated).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            icon="copy" 
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle use template
                              navigate(`/messages/compose?templateId=${template.id}`);
                            }}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            icon="edit" 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/messages/templates/${template.id}/edit`);
                            }}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            icon="trash-2" 
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle delete
                            }}
                          />
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Row>
                    <Table.Cell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <Icon name="copy" className="h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium">Aucun modèle</h3>
                        <p className="mt-2 text-gray-500">
                          Créez votre premier modèle pour gagner du temps
                        </p>
                        <Button 
                          variant="default" 
                          className="mt-4" 
                          icon="plus"
                          onClick={() => navigate('/messages/templates/new')}
                        >
                          Créer un modèle
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}