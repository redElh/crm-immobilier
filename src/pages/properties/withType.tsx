import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { PropertyCard } from '../../components/modules/properties/PropertyCard';
import { FilterDropdown } from '../../components/ui/FilterDropdown';
import { Icon } from '../../components/ui/Icon';
import { BackLink } from '../../components/ui/BackLink';

// Mock data - replace with your actual data fetching logic
const mockProperties = [
  {
    id: '1',
    title: 'Luxury Villa in Marrakech',
    type: 'residential',
    status: 'transaction',
    price: 4500000,
    location: 'Marrakech',
    bedrooms: 5,
    bathrooms: 4,
    surface: 320,
    image: '/images/properties/prop1.jpg',
  },
  // Add more mock properties...
];

const statusOptions = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'transaction', label: 'Transaction' },
  { value: 'long_term', label: 'Location longue durée' },
  { value: 'seasonal', label: 'Location saisonnière' },
  { value: 'pending', label: 'En attente - En estimation' },
  { value: 'archived', label: 'Archives' }
];

const sortOptions = [
  { value: 'price_asc', label: 'Prix (croissant)' },
  { value: 'price_desc', label: 'Prix (décroissant)' },
  { value: 'surface_asc', label: 'Surface (croissant)' },
  { value: 'surface_desc', label: 'Surface (décroissant)' },
  { value: 'date_desc', label: 'Récent en premier' }
];

export default function PropertiesPageWithType() {
  const navigate = useNavigate();
  const { type } = useParams(); // Replaces router.query
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('date_desc');

  // Get the type label for display
  const typeLabel = {
    residential: 'Résidentiel',
    commercial: 'Commercial',
    land: 'Terrains',
    vacation: 'Vacances',
    luxury: 'Luxe'
  }[type as string] || '';

  // Filter properties based on type, search term and status
  const filteredProperties = mockProperties
    .filter(property => property.type === type)
    .filter(property => 
      statusFilter === 'all' || property.status === statusFilter
    )
    .filter(property =>
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.location.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch(sortOption) {
        case 'price_asc': return a.price - b.price
        case 'price_desc': return b.price - a.price
        case 'surface_asc': return a.surface - b.surface
        case 'surface_desc': return b.surface - a.surface
        case 'date_desc': 
        default: return 0 // In a real app, you'd sort by date
      }
    });

  return (
    <div className="p-6">
      <div className="mb-4">
        <BackLink />
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Biens {typeLabel}</h1>
          <p className="text-gray-600">
            {filteredProperties.length} {filteredProperties.length === 1 ? 'bien trouvé' : 'biens trouvés'}
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="default" 
            onClick={() => navigate(`/properties/add?type=${type}`)} // Updated
            icon="plus"
          >
            Ajouter un bien
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-2 mt-6">
          <Input
            placeholder="Rechercher par nom ou localisation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon=""
          />
        </div>
        
        <FilterDropdown
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
          label="Statut"
        />
        
        <FilterDropdown
          options={sortOptions}
          value={sortOption}
          onChange={setSortOption}
          label="Trier par"
        />
      </div>

      {/* Properties Grid */}
      {filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProperties.map(property => (
            <PropertyCard
              key={property.id}
              property={property}
              onClick={() => navigate(`/properties/${property.id}`)} // Updated
            />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="text-gray-500 mb-4">
            <Icon name="folder-open" className="w-12 h-12 mx-auto opacity-50" />
          </div>
          <h3 className="text-lg font-medium mb-2">Aucun bien trouvé</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? "Aucun bien ne correspond à votre recherche."
              : "Aucun bien disponible dans cette catégorie."}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
            }}
          >
            Réinitialiser les filtres
          </Button>
        </Card>
      )}
    </div>
  );
}