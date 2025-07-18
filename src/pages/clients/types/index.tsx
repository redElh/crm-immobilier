// Créez ce fichier : src/pages/clients/types/index.tsx
import { useNavigate } from 'react-router-dom';
import  Card  from '../../../components/ui/Card';

const clientTypes = [
  { id: 'propriétaire', label: 'Propriétaire', icon: '🏠' },
  { id: 'bailleur', label: 'Bailleur', icon: '🔑' },
  { id: 'acheteur', label: 'Acheteur', icon: '💰' },
  { id: 'locataire', label: 'Locataire', icon: '🏡' },
  { id: 'voyageur', label: 'Voyageur', icon: '✈️' },
];

export default function ClientTypesPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Types de Clients</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientTypes.map((type) => (
          <Card 
            key={type.id}
            className="p-6 text-center hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/clients/type/${type.id}`)}
          >
            <div className="text-4xl mb-3">{type.icon}</div>
            <h3 className="text-lg font-medium">{type.label}</h3>
          </Card>
        ))}
      </div>
    </div>
  );
}