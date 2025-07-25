import { useParams } from 'react-router-dom'
import Card from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { InfoField } from '../../components/ui/InfoField'
import { Table } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'


export default function DocumentDetailPage() {
  const { id } = useParams()
  
  // In a real app, you would fetch the document data here
  const document = {
    id: id,
    name: 'Mandat exclusif - Villa Marrakech',
    type: 'mandate',
    category: 'mandates',
    relatedTo: 'Bien #1234',
    client: 'Sophie Martin',
    date: '2023-06-15',
    size: '2.4 MB',
    status: 'signed',
    lastModified: '2023-06-18',
    modifiedBy: 'Karim Eloui',
    downloadCount: 3,
    sharedWith: ['Youssef Amrani', 'Leila Benbrahim']
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            icon="arrow-left" 
            onClick={() => window.history.back()} 
          />
          <h1 className="text-2xl font-bold">{document.name}</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon="download">
            Télécharger
          </Button>
          <Button variant="default" icon="share-2">
            Partager
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Preview Card */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-medium">Aperçu du document</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" icon="zoom-in" tooltip="Zoom avant" />
                <Button variant="outline" size="sm" icon="zoom-out" tooltip="Zoom arrière" />
                <Button variant="outline" size="sm" icon="maximize" tooltip="Plein écran" />
              </div>
            </div>
            
            {/* Document Preview Area */}
            <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-white/5 to-white/2">
              <div className="relative w-full max-w-2xl">
                {/* Document placeholder with shadow effect */}
                <div className="aspect-[4/3] bg-white rounded-md shadow-lg flex flex-col overflow-hidden">
                  <div className="bg-gray-100 h-8 flex items-center px-3 border-b border-gray-200">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white">
                    <Icon name="file-text" className="w-16 h-16 text-gray-300 mb-4" />
                    <h4 className="text-lg font-medium text-gray-700">{document.name}</h4>
                    <p className="text-sm text-gray-500 mt-2">
                      {document.type} • {document.size}
                    </p>
                  </div>
                </div>
                
                {/* Document controls */}
                <div className="absolute -bottom-4 left-0 right-0 flex justify-center gap-3">
                  <Button 
                    variant="default" 
                    size="sm" 
                    icon="download"
                    className="shadow-md"
                  >
                    Télécharger
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    icon="printer"
                    className="shadow-md"
                  >
                    Imprimer
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Document status bar */}
            <div className="p-3 border-t border-white/10 bg-white/5 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={document.status === 'signed' ? 'success' : 'warning'}>
                  {document.status === 'signed' ? 'Signé' : 'En attente'}
                </Badge>
                <span className="text-b/60">
                  Dernière modification: {new Date(document.lastModified).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="eye" className="w-4 h-4 text-b/60" />
                <span className="text-b/60">{document.downloadCount} téléchargements</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          {/* Document Details Card */}
          <Card>
            <h3 className="font-semibold text-lg mb-4">Détails du document</h3>
            <div className="space-y-3">
              <InfoField label="Type" value={document.type} />
              <InfoField label="Catégorie" value={document.category} />
              <InfoField label="Bien associé" value={document.relatedTo} />
              <InfoField label="Client" value={document.client} />
              <InfoField label="Date de création" value={new Date(document.date).toLocaleDateString('fr-FR')} />
              <InfoField 
                label="Dernière modification" 
                value={`${new Date(document.lastModified).toLocaleDateString('fr-FR')} par ${document.modifiedBy}`} 
              />
              <InfoField label="Téléchargements" value={document.downloadCount.toString()} />
            </div>
          </Card>

          {/* Shared With Card */}
          <Card>
            <h3 className="font-semibold text-lg mb-4">Partagé avec</h3>
            {document.sharedWith.length > 0 ? (
              <ul className="space-y-2">
                {document.sharedWith.map((person, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Icon name="user" className="w-4 h-4 text-gray-500" />
                    <span>{person}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Non partagé</p>
            )}
          </Card>
        </div>
      </div>

      {/* Version History Card */}
      <Card>
        <h3 className="font-semibold text-lg mb-4">Historique des versions</h3>
        <Table>
          <Table.Header>
            <Table.Column>Version</Table.Column>
            <Table.Column>Date</Table.Column>
            <Table.Column>Modifié par</Table.Column>
            <Table.Column>Actions</Table.Column>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>v1.2</Table.Cell>
              <Table.Cell>{new Date(document.lastModified).toLocaleDateString('fr-FR')}</Table.Cell>
              <Table.Cell>{document.modifiedBy}</Table.Cell>
              <Table.Cell>
                <Button variant="outline" size="sm" icon="download" />
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Card>
    </div>
  )
}