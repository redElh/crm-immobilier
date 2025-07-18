import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { PropertyCard } from '../../components/modules/properties/PropertyCard';
import { FilterDropdown } from '../../components/ui/FilterDropdown';
import { Icon } from '../../components/ui/Icon';

// Mock data - replace with your actual data fetching logic
const mockProperties = [
  {
    id: '1',
    title: 'Luxury Villa in Marrakech',
    type: 'residential',
    status: 'for_sale',
    price: 4500000,
    location: 'Marrakech',
    bedrooms: 5,
    bathrooms: 4,
    surface: 320,
    image: 'data:image/jpeg;base64,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'
  },
  // Add more mock properties...
];

const statusOptions = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'for_sale', label: 'À vendre' },
  { value: 'for_rent', label: 'À louer' },
  { value: 'sold', label: 'Vendu' },
  { value: 'rented', label: 'Loué' }
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
            onClick={() => navigate('/properties/add')} // Updated
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