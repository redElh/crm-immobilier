import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Prospect } from '../../types/prospect';
import { SearchInput } from '../../components/ui/SearchInput';
import { FilterDropdown } from '../../components/ui/FilterDropdown';
import { Button } from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Plus, Users } from 'react-feather';
import { ProspectCard } from '../../components/modules/prospects/ProspectCard';
import { ProspectFormModal } from '../../components/modules/prospects/ProspectFormModal';

const sampleProspects: Prospect[] = [
  {
    id: 'p1',
    type: 'Acheter',
    origin: 'Site web',
    date: '2025-06-01',
    message: 'Intéressé par un appartement à Marrakech',
    civility: 'M.',
    firstName: 'Ahmed',
    lastName: 'Benali',
    email: 'ahmed.benali@email.com',
    phone: '+212 6 12 34 56 78',
    spokenLanguage: 'Français',
    meansOfContact: ['email', 'phone'],
    categories: 'Vente',
    propertyTypes: ['Appartement'],
    location: 'Marrakech',
    rooms: 3,
    bedrooms: 2,
    minSurface: 80,
    maxPrice: 1200000,
    currency: 'MAD',
    status: 'Nouveau',
    createdAt: '2025-06-01T10:00:00Z',
    updatedAt: '2025-06-01T10:00:00Z',
  },
  {
    id: 'p2',
    type: 'Louer',
    origin: 'Référence',
    date: '2025-06-03',
    civility: 'Mme',
    firstName: 'Sophie',
    lastName: 'Martin',
    email: 'sophie.martin@email.com',
    phone: '+33 6 98 76 54 32',
    mobile: '+33 7 98 76 54 32',
    spokenLanguage: 'Français',
    meansOfContact: ['email'],
    categories: 'Location',
    propertyTypes: ['Maison'],
    location: 'Casablanca',
    rooms: 4,
    bedrooms: 3,
    minSurface: 120,
    maxPrice: 15000,
    currency: 'MAD',
    viewDetail: 'Jardin',
    status: 'Contacté',
    createdAt: '2025-06-03T14:30:00Z',
    updatedAt: '2025-06-04T09:00:00Z',
  },
  {
    id: 'p3',
    type: 'Acheter',
    origin: 'Appel téléphonique',
    date: '2025-06-05',
    message: 'Cherche un garage/parking à Rabat',
    civility: 'M.',
    firstName: 'Youssef',
    lastName: 'Amrani',
    email: 'y.amrani@email.com',
    phone: '+212 6 54 32 10 98',
    spokenLanguage: 'Arabe',
    meansOfContact: ['phone', 'sms'],
    categories: 'Vente',
    propertyTypes: ['Garage / Parking'],
    location: 'Rabat',
    maxPrice: 250000,
    currency: 'MAD',
    status: 'Nouveau',
    createdAt: '2025-06-05T08:15:00Z',
    updatedAt: '2025-06-05T08:15:00Z',
  },
];

export default function ProspectsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prospects, setProspects] = useState<Prospect[]>(sampleProspects);

  const filteredProspects = prospects.filter((p) => {
    const matchesSearch =
      p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddProspect = (data: Omit<Prospect, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProspect: Prospect = {
      ...data,
      id: `prospect-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProspects((prev) => [newProspect, ...prev]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prospects</h1>
          <p className="text-sm text-text-secondary mt-1">
            {filteredProspects.length} prospect{filteredProspects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="default" icon={<Plus size={14} />} onClick={() => setIsModalOpen(true)}>
          Nouveau prospect
        </Button>
      </div>

      {isModalOpen && (
        <ProspectFormModal onClose={() => setIsModalOpen(false)} onSubmit={handleAddProspect} />
      )}

      <Card className="p-5">
        <div className="flex flex-col sm:flex-row gap-4 mb-5 items-end">
          <div className="flex-1 w-full">
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher prospects..."
            />
          </div>
          <FilterDropdown
            label="Statut"
            options={[
              { value: 'all', label: 'Tous statuts' },
              { value: 'Nouveau', label: 'Nouveau' },
              { value: 'Contacté', label: 'Contacté' },
              { value: 'Qualifié', label: 'Qualifié' },
              { value: 'Perdu', label: 'Perdu' },
              { value: 'Converti', label: 'Converti' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>

        {filteredProspects.length === 0 ? (
          <div className="text-center py-12">
            <Users size={40} className="mx-auto text-text-secondary/30 mb-3" />
            <p className="text-text-secondary">Aucun prospect trouvé</p>
            <p className="text-xs text-text-secondary/60 mt-1">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredProspects.map((prospect) => (
              <ProspectCard
                key={prospect.id}
                prospect={prospect}
                onClick={() => navigate(`/prospects/${prospect.id}`)}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
