import Card from '../../ui/Card'
import { Button } from '../../ui/Button'
import { Icon } from '../../ui/Icon'
import { Table } from '../../ui/Table'

interface PropertyDocumentsProps {
  documents: {
    id: string
    name: string
    type: string
    date: string
    size?: string
    uploadedBy?: string
  }[]
}

const documentTypes = {
  contract: 'Contrat',
  technical: 'Technique',
  legal: 'Juridique',
  financial: 'Financier',
  other: 'Autre'
}

export const PropertyDocuments = ({ documents }: PropertyDocumentsProps) => {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-lg">Documents</h3>
        <Button variant="default" icon="plus">
          Ajouter un document
        </Button>
      </div>

      {documents.length > 0 ? (
        <Table>
          <Table.Header>
            <Table.Column>Nom</Table.Column>
            <Table.Column>Type</Table.Column>
            <Table.Column>Date</Table.Column>
            <Table.Column>Taille</Table.Column>
            <Table.Column>Actions</Table.Column>
          </Table.Header>
          <Table.Body>
            {documents.map((doc) => (
              <Table.Row key={doc.id}>
                <Table.Cell className="font-medium">{doc.name}</Table.Cell>
                <Table.Cell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {documentTypes[doc.type as keyof typeof documentTypes] || doc.type}
                  </span>
                </Table.Cell>
                <Table.Cell>{new Date(doc.date).toLocaleDateString('fr-FR')}</Table.Cell>
                <Table.Cell>{doc.size || '-'}</Table.Cell>
                <Table.Cell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" icon="download" />
                    <Button variant="ghost" size="sm" icon="eye" />
                    <Button variant="ghost" size="sm" icon="trash" className="text-red-600" />
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      ) : (
        <div className="text-center py-12">
          <Icon name="folder-open" className="mx-auto h-12 w-12 text-gray-400" />
          <h4 className="mt-2 text-sm font-medium text-gray-900">Aucun document</h4>
          <p className="mt-1 text-sm text-gray-500">Ajoutez des documents pour les retrouver ici</p>
        </div>
      )}
    </Card>
  )
}