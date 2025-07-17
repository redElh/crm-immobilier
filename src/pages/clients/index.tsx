import { useState } from 'react';
import { ClientCard } from '../../components/modules/clients/ClientCard';
import { SearchInput } from '../../components/ui/SearchInput';
import { FilterDropdown } from '../../components/ui/FilterDropdown';
import { AddClientButton } from '../../components/modules/clients/AddClientButton';
import { ClientFormModal } from '../../components/modules/clients/ClientFormModal';
import { Client } from '../../types/client';

// Sample data - replace with your API calls
const sampleClients: Client[] = [
  {
    id: '1',
    name: 'Pierre Martin',
    type: 'Acheteur',
    status: 'Actif',
    phone: '+33 6 12 34 56 78',
    email: 'pierre.martin@example.com',
    budget: 450000,
    propertyType: 'Appartement',
    area: 'Paris',
    minSurface: 60,
    rooms: '2',
    specificCriteria: ['Balcon', 'Ascenseur'],
    comments: 'Intéressé par les biens avec balcon et ascenseur',
    contribution: 100000,
    financingType: 'Prêt bancaire',
    loanDuration: 20,
    documents: [
      { name: 'Justificatif de domicile', url: '/documents/domicile.pdf', type: 'proof' },
      { name: 'Bulletin de salaire', url: '/documents/salary.pdf', type: 'salary' }
    ],
    lastContact: '2023-06-15',
    events: [
      {
        id: 'event-1',
        type: 'email',
        date: '2023-06-15T10:00:00Z',
        summary: 'Premier contact par email',
        agent: 'John Doe'
      }
    ],
    createdAt: '2023-06-01',
    updatedAt: '2023-06-15'
  },
  // Add more sample clients as needed
];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(sampleClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddClient = (newClient: Omit<Client, 'id'>) => {
    const clientWithId: Client = {
      ...newClient,
      id: `client-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: newClient.status || 'Actif',
      events: []
    };
    setClients([...clients, clientWithId]);
    setIsModalOpen(false);
  };

  const filteredClients = sampleClients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         client.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    const matchesType = typeFilter === 'all' || client.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">Gestion des Clients</h1>
        <AddClientButton onClick={() => setIsModalOpen(true)} />
      </div>

      {isModalOpen && (
        <ClientFormModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddClient}
        />
      )}

      <div className="glass-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SearchInput 
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Rechercher clients..."
          />
          <FilterDropdown
            label="Statut"
            options={[
              { value: 'all', label: 'Tous statuts' },
              { value: 'Actif', label: 'Actif' },
              { value: 'En négociation', label: 'En négociation' },
              { value: 'Contrat signé', label: 'Contrat signé' },
              { value: 'Inactif', label: 'Inactif' }
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <FilterDropdown
            label="Type"
            options={[
              { value: 'all', label: 'Tous types' },
              { value: 'Acheteur', label: 'Acheteur' },
              { value: 'Vendeur', label: 'Vendeur' },
              { value: 'Locataire', label: 'Locataire' },
              { value: 'Bailleur', label: 'Bailleur' }
            ]}
            value={typeFilter}
            onChange={setTypeFilter}
          />
        </div>

        {filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text/60">Aucun client trouvé</p>
            <p className="text-sm text-text/40 mt-2">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredClients.map(client => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { sampleClients };