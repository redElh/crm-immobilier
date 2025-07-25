import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Icon } from '../../components/ui/Icon';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs/Tabs';
import React from 'react';
import { Badge } from '../../components/ui/Badge';

const documentCategories = [
  { value: 'all', label: 'Tous les documents' },
  { value: 'contracts', label: 'Contrats' },
  { value: 'mandates', label: 'Mandats' },
  { value: 'leases', label: 'Baux' },
  { value: 'reports', label: 'Rapports' },
  { value: 'other', label: 'Autres' }
];

const mockDocuments = [
  {
    id: '1',
    name: 'Mandat exclusif - Villa Marrakech',
    type: 'mandate',
    category: 'mandates',
    relatedTo: 'Bien #1234',
    client: 'Sophie Martin',
    date: '2023-06-15',
    size: '2.4 MB',
    status: 'signed'
  },
  {
    id: '2',
    name: 'Contrat de location - Appartement Paris',
    type: 'lease',
    category: 'leases',
    relatedTo: 'Bien #5678',
    client: 'Pierre Dubois',
    date: '2023-07-10',
    size: '1.8 MB',
    status: 'pending',
  },
  {
    id: '3',
    name: 'Rapport d\'expertise - Maison Lyon',
    type: 'report',
    category: 'reports',
    relatedTo: 'Bien #9012',
    client: 'Élodie Lambert',
    date: '2023-08-22',
    size: '3.2 MB',
    status: 'signed',
  }
];

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState("my-documents");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");

  const filteredDocuments = mockDocuments.filter((doc) => {
    // Filter by search term (name, client, or relatedTo)
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.relatedTo.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by category
    const matchesCategory = 
      selectedCategory === "all" || doc.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleRowClick = (id: string) => {
    navigate(`/documents/${id}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Documents</h1>
        <div className="flex gap-3">
          <Button variant="default" icon="upload">
            Importer
          </Button>
          <Button variant="default" icon="plus">
            Créer
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-documents">
            <Icon name="user" className="w-4 h-4 mr-2" />
            Mes documents
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Icon name="copy" className="w-4 h-4 mr-2" />
            Modèles
          </TabsTrigger>
          <TabsTrigger value="shared">
            <Icon name="users" className="w-4 h-4 mr-2" />
            Partagés
          </TabsTrigger>
        </TabsList>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 my-4">
          <Input
            placeholder="Rechercher un document..."
            icon=""
            className="md:w-1/2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            options={documentCategories}
            value={selectedCategory}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
            className=""
          />
        </div>

        <TabsContent value="my-documents">
          <Card>
            <Table>
              <Table.Header>
                <Table.Column>Nom</Table.Column>
                <Table.Column>Type</Table.Column>
                <Table.Column>Client/Bien</Table.Column>
                <Table.Column>Date</Table.Column>
                <Table.Column>Statut</Table.Column>
                <Table.Column>Actions</Table.Column>
              </Table.Header>
              <Table.Body>
                {filteredDocuments.map((doc) => (
                  <Table.Row 
                    key={doc.id} 
                    onClick={() => handleRowClick(doc.id)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <Table.Cell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Icon name="file-text" className="text-gray-400" />
                        {doc.name}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="capitalize">{doc.type}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="text-sm">
                        <p>{doc.relatedTo}</p>
                        <p className="text-gray-500">{doc.client}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      {new Date(doc.date).toLocaleDateString('fr-FR')}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge 
                        variant={doc.status === 'signed' ? 'success' : 'warning'}
                        className="capitalize"
                      >
                        {doc.status === 'signed' ? 'Signé' : 'En attente'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon="download"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle download
                          }}
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon="share-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle share
                          }}
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon="more-horizontal"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle more options
                          }}
                        />
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card className="p-6 text-center">
            <Icon name="folder" className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">Modèles de documents</h3>
            <p className="mt-2 text-gray-500">
              Gérer vos modèles de contrats, mandats et autres documents réutilisables
            </p>
            <Button variant="default" className="mt-4" icon="plus">
              Créer un modèle
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="shared">
          <Card className="p-6 text-center">
            <Icon name="users" className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">Documents partagés</h3>
            <p className="mt-2 text-gray-500">
              Documents partagés avec vous par vos collègues
            </p>
            <Button variant="default" className="mt-4" icon="plus">
              Demander un document
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}