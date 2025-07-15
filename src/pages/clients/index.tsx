import { useState } from 'react';
import { ClientCard } from '../../components/modules/clients/ClientCard';
import { SearchInput } from '../../components/ui/SearchInput';
import { FilterDropdown } from '../../components/ui/FilterDropdown';
import { AddClientButton } from '../../components/modules/clients/AddClientButton';

// Sample data - replace with your API calls
const sampleClients = [
  {
    id: '1',
    name: 'Pierre Martin',
    type: 'Acheteur',
    status: 'Actif',
    phone: '+33 6 12 34 56 78',
    budget: 450000,
    propertyType: 'Appartement',
    lastContact: '2023-06-15'
  },
  {
    id: '2',
    name: 'Sophie Dubois',
    type: 'Vendeur',
    status: 'En négociation',
    phone: '+33 6 98 76 54 32',
    propertyType: 'Maison',
    lastContact: '2023-06-10'
  }
];

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

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
        <AddClientButton />
      </div>

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