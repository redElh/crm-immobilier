// src/pages/clients/withType.tsx
import { useParams } from 'react-router-dom';
import { ClientCard } from '../../components/modules/clients/ClientCard';
import { SearchInput } from '../../components/ui/SearchInput';
import { FilterDropdown } from '../../components/ui/FilterDropdown';
import { AddClientButton } from '../../components/modules/clients/AddClientButton';
import { ClientFormModal } from '../../components/modules/clients/ClientFormModal';
import { sampleClients } from './index';
import { useState } from 'react';
import { Client } from '../../types/client';
import { BackLink } from '../../components/ui/BackLink';

const typeLabels: Record<string, 'Acheteur' | 'Locataire' | 'Bailleur' | 'Propriétaire' | 'Voyageur'> = {
  propriétaire: 'Propriétaire',
  bailleur: 'Bailleur',
  acheteur: 'Acheteur',
  locataire: 'Locataire',
  voyageur: 'Voyageur'
};

// Helper function to add a new client to the sampleClients array
const addClientToSample = (newClient: Client) => {
  // In a real app, you would make an API call here
  sampleClients.push(newClient);
};

export default function ClientsPageWithType() {
  const { type } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddClient = (newClient: Omit<Client, 'id'>) => {
    const clientWithId: Client = {
      ...newClient,
      id: `client-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: newClient.status || 'Actif',
      events: [],
      type: typeLabels[type || 'buyer'] // Set the type based on the route
    };
    addClientToSample(clientWithId);
    setIsModalOpen(false);
  };

  // Filter clients by type and other criteria
  const filteredClients = sampleClients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         client.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    const matchesType = type && client.type === typeLabels[type];
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="p-6 space-y-6">
      <BackLink href="/clients" className="mb-4" />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">Clients - {typeLabels[type || '']}</h1>
        <AddClientButton onClick={() => setIsModalOpen(true)} />
      </div>

      {isModalOpen && (
        <ClientFormModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddClient}
          clientType={typeLabels[type || '']}  // Pass the type to the modal
        />
      )}

      <div className="glass-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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