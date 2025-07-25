import  Card from '../../ui/Card'
import { Icon } from '../../ui/Icon'
import { InfoField } from '../../ui/InfoField'
import { Badge } from '../../ui/Badge'

interface PropertyDetailsProps {
  property: {
    description: string
    features: string[]
    bedrooms: number
    bathrooms: number
    surface: number
    landSize: number
    yearBuilt: number
    address: string
    owner: {
      name: string
      phone: string
      email: string
    }
    propertyType: string
  }
}

export const PropertyDetails = ({ property }: PropertyDetailsProps) => {
  const propertyTypes = {
    residential: 'Résidentiel',
    commercial: 'Commercial',
    land: 'Terrain',
    vacation: 'Vacances',
    luxury: 'Luxe'
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Description</h3>
        <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
      </Card>
      
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Caractéristiques principales</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoField label="Type" value={propertyTypes[property.propertyType as keyof typeof propertyTypes]} icon="tag" />
          <InfoField label="Surface habitable" value={`${property.surface} m²`} icon="ruler" />
          <InfoField label="Surface du terrain" value={`${property.landSize} m²`} icon="map" />
          <InfoField label="Chambres" value={property.bedrooms} icon="bed" />
          <InfoField label="Salles de bain" value={property.bathrooms} icon="bath" />
          <InfoField label="Année de construction" value={property.yearBuilt} icon="calendar" />
          <InfoField label="Adresse" value={property.address} icon="map-pin" />
        </div>
      </Card>
      
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Équipements et caractéristiques</h3>
        <div className="flex flex-wrap gap-2">
          {property.features.map((feature, index) => (
            <Badge key={index} variant="outline" className="flex items-center gap-2">
              <Icon name="check" className="w-4 h-4 text-green-600" />
              {feature}
            </Badge>
          ))}
        </div>
      </Card>
      
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Propriétaire</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoField label="Nom complet" value={property.owner.name} icon="user" />
          <InfoField label="Téléphone" value={property.owner.phone} icon="phone" />
          <InfoField label="Email" value={property.owner.email} icon="mail" />
        </div>
      </Card>
    </div>
  )
}