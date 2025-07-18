import { useNavigate } from 'react-router-dom';
import  Card  from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon' // Suppose que vous avez un composant Icon

const propertyTypes = [
  {
    type: 'residential',
    title: 'Résidentiel',
    description: 'Appartements, maisons, villas...',
    icon: 'home',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    type: 'commercial',
    title: 'Commercial',
    description: 'Bureaux, locaux, boutiques...',
    icon: 'building',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    type: 'land',
    title: 'Terrains',
    description: 'Terrains constructibles, agricoles...',
    icon: 'map',
    color: 'bg-green-100 text-green-600'
  },
  {
    type: 'vacation',
    title: 'Vacances',
    description: 'Résidences secondaires, locations saisonnières...',
    icon: 'umbrella',
    color: 'bg-orange-100 text-orange-600'
  },
  {
    type: 'luxury',
    title: 'Luxe',
    description: 'Biens haut de gamme',
    icon: 'diamond',
    color: 'bg-amber-100 text-amber-600'
  }
]

export default function PropertyTypesPage() {
  const navigate = useNavigate(); // Replaces useRouter()

  const handleTypeSelect = (type: string) => {
    navigate(`/properties/type/${type}`); // Replaces router.push()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Types de biens</h1>
        <Button 
          variant="default" 
          onClick={() => navigate('/properties/add')} 
          icon="plus"
        >
          Ajouter un bien
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {propertyTypes.map((property) => (
          <Card 
            key={property.type} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleTypeSelect(property.type)}
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-full ${property.color}`}>
                <Icon name={property.icon} className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{property.title}</h3>
                <p className="text-gray-600 text-sm">{property.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Optionnel: Statistiques rapides */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-gray-500 text-sm">Total biens</div>
          <div className="text-2xl font-bold">142</div>
        </Card>
        <Card className="p-4">
          <div className="text-gray-500 text-sm">En vente</div>
          <div className="text-2xl font-bold">87</div>
        </Card>
        <Card className="p-4">
          <div className="text-gray-500 text-sm">En location</div>
          <div className="text-2xl font-bold">42</div>
        </Card>
        <Card className="p-4">
          <div className="text-gray-500 text-sm">Vendus ce mois</div>
          <div className="text-2xl font-bold">13</div>
        </Card>
      </div>
    </div>
  )
}