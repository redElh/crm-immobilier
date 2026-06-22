import { useParams } from 'react-router-dom';
import { ClientCard } from '../../components/modules/clients/ClientCard';
import { SearchInput } from '../../components/ui/SearchInput';
import { FilterDropdown } from '../../components/ui/FilterDropdown';
import { AddClientButton } from '../../components/modules/clients/AddClientButton';
import { ClientFormModal } from '../../components/modules/clients/ClientFormModal';
import { BuyerFormModal } from '../../components/modules/clients/BuyerFormModal';
import { SellerFormModal } from '../../components/modules/clients/SellerFormModal';
import { BailleurFormModal } from '../../components/modules/clients/BailleurFormModal';
import { LocataireFormModal } from '../../components/modules/clients/LocataireFormModal';
import { VoyageurFormModal } from '../../components/modules/clients/VoyageurFormModal';
import { sampleClients } from './index';
import { useState } from 'react';
import { Client } from '../../types/client';
import { BackLink } from '../../components/ui/BackLink';
import Card from '../../components/ui/Card';

const ACHETEUR_STATUS_OPTIONS = [
  { value: 'all', label: 'Tous statuts' },
  { value: 'En qualification', label: 'En qualification' },
  { value: 'En recherche', label: 'En recherche' },
  { value: 'En negociation', label: 'En négociation' },
  { value: 'En compromis', label: 'En compromis' },
  { value: 'Vendu / Achete', label: 'Vendu / Acheté' },
  { value: 'Inactif', label: 'Inactif' },
  { value: 'Perdu', label: 'Perdu' },
];

const VENDEUR_STATUS_OPTIONS = [
  { value: 'all', label: 'Tous statuts' },
  { value: 'En attente de signature', label: 'En attente de signature' },
  { value: 'En mandat', label: 'En mandat' },
  { value: 'En negociation', label: 'En négociation' },
  { value: 'En compromis', label: 'En compromis' },
  { value: 'Vendu', label: 'Vendu' },
  { value: 'Inactif', label: 'Inactif' },
  { value: 'Perdu', label: 'Perdu' },
];

const BAILLEUR_STATUS_OPTIONS = [
  { value: 'all', label: 'Tous statuts' },
  { value: 'En attente de signature', label: 'En attente de signature' },
  { value: 'En mandat', label: 'En mandat' },
  { value: 'En location', label: 'En location' },
  { value: 'Inactif', label: 'Inactif' },
  { value: 'Perdu', label: 'Perdu' },
];

const LOCATAIRE_STATUS_OPTIONS = [
  { value: 'all', label: 'Tous statuts' },
  { value: 'En recherche', label: 'En recherche' },
  { value: 'En visite', label: 'En visite' },
  { value: 'En dossier', label: 'En dossier' },
  { value: 'Bail signe', label: 'Bail signé' },
  { value: 'Installe', label: 'Installé' },
  { value: 'Inactif', label: 'Inactif' },
  { value: 'Perdu', label: 'Perdu' },
];

const VOYAGEUR_STATUS_OPTIONS = [
  { value: 'all', label: 'Tous statuts' },
  { value: 'En recherche', label: 'En recherche' },
  { value: 'Reservation en cours', label: 'Réservation en cours' },
  { value: 'Confirme', label: 'Confirmé' },
  { value: 'En sejour', label: 'En séjour' },
  { value: 'Termine', label: 'Terminé' },
  { value: 'Annule', label: 'Annulé' },
  { value: 'Inactif', label: 'Inactif' },
];

const typeLabels: Record<string, 'Acheteur' | 'Locataire' | 'Bailleur' | 'Vendeur' | 'Voyageur'> = {
  vendeur: 'Vendeur', bailleur: 'Bailleur', acheteur: 'Acheteur', locataire: 'Locataire', voyageur: 'Voyageur'
};

const addClientToSample = (newClient: Client) => { sampleClients.push(newClient); };

export default function ClientsPageWithType() {
  const { type } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isAcheteur = typeLabels[type || ''] === 'Acheteur';
  const isVendeur = typeLabels[type || ''] === 'Vendeur';
  const isBailleur = typeLabels[type || ''] === 'Bailleur';
  const isLocataire = typeLabels[type || ''] === 'Locataire';
  const isVoyageur = typeLabels[type || ''] === 'Voyageur';

  const handleAddClient = (newClient: Omit<Client, 'id'>) => {
    const clientWithId: Client = {
      ...newClient,
      id: `client-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: newClient.status || 'Actif',
      events: [],
      type: typeLabels[type || ''],
    };
    addClientToSample(clientWithId);
    setIsModalOpen(false);
  };

  const filteredClients = sampleClients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || client.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || (isAcheteur || isVendeur || isBailleur || isLocataire || isVoyageur ? client.statutMetier === statusFilter : client.status === statusFilter);
    const matchesType = type && client.type === typeLabels[type];
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      <BackLink className="mb-2" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients - {typeLabels[type || '']}</h1>
          <p className="text-sm text-text-secondary mt-1">{filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}</p>
        </div>
        <AddClientButton onClick={() => setIsModalOpen(true)} />
      </div>

      {isModalOpen && typeLabels[type || ''] === 'Acheteur' ? (
        <BuyerFormModal onClose={() => setIsModalOpen(false)} onSubmit={handleAddClient} />
      ) : isModalOpen && typeLabels[type || ''] === 'Vendeur' ? (
        <SellerFormModal onClose={() => setIsModalOpen(false)} onSubmit={handleAddClient} />
      ) : isModalOpen && typeLabels[type || ''] === 'Bailleur' ? (
        <BailleurFormModal onClose={() => setIsModalOpen(false)} onSubmit={handleAddClient} />
      ) : isModalOpen && typeLabels[type || ''] === 'Locataire' ? (
        <LocataireFormModal onClose={() => setIsModalOpen(false)} onSubmit={handleAddClient} />
      ) : isModalOpen && typeLabels[type || ''] === 'Voyageur' ? (
        <VoyageurFormModal onClose={() => setIsModalOpen(false)} onSubmit={handleAddClient} />
      ) : isModalOpen && (
        <ClientFormModal onClose={() => setIsModalOpen(false)} onSubmit={handleAddClient} clientType={typeLabels[type || '']} />
      )}

      <Card className="p-5">
        <div className="flex flex-col sm:flex-row gap-4 mb-5 items-end">
          <div className="flex-1 w-full">
            <SearchInput value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher clients..." />
          </div>
          <FilterDropdown
            label="Statut"
            options={isAcheteur ? ACHETEUR_STATUS_OPTIONS : isVendeur ? VENDEUR_STATUS_OPTIONS : isBailleur ? BAILLEUR_STATUS_OPTIONS : isLocataire ? LOCATAIRE_STATUS_OPTIONS : isVoyageur ? VOYAGEUR_STATUS_OPTIONS : [
              { value: 'all', label: 'Tous statuts' },
              { value: 'Actif', label: 'Actif' },
              { value: 'En négociation', label: 'En négociation' },
              { value: 'Contrat signé', label: 'Contrat signé' },
              { value: 'Inactif', label: 'Inactif' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>

        {filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">Aucun client trouvé</p>
            <p className="text-xs text-text-secondary/60 mt-1">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredClients.map(client => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
