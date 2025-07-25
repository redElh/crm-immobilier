import  Card  from '../../ui/Card'
import { Badge } from '../../ui/Badge'
import { Icon } from '../../ui/Icon'
import { HomeModernIcon, SparklesIcon } from '@heroicons/react/24/outline'

const statusColors = {
  transaction: 'bg-blue-100 text-blue-800',
  long_term: 'bg-green-100 text-green-800',
  seasonal: 'bg-purple-100 text-purple-800',
  pending: 'bg-yellow-100 text-yellow-800',
  archived: 'bg-gray-100 text-gray-800'
}

const statusLabels = {
  transaction: 'Transaction',
  long_term: 'Longue durée',
  seasonal: 'Saisonnière',
  pending: 'En estimation',
  archived: 'Archives'
}

interface Property {
  id: string
  title: string
  status: string
  price: number
  location: string
  bedrooms?: number
  bathrooms?: number
  surface?: number
  image: string
}

interface PropertyCardProps {
  property: Property
  onClick: () => void
}

export const PropertyCard = ({ property, onClick }: PropertyCardProps) => {
  const formattedPrice = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0
  }).format(property.price)

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="relative aspect-video overflow-hidden rounded-t-md">
        <img
          src={property.image}
          alt={property.title}
          className="object-cover w-full h-full"
        />
        <Badge className={`absolute top-2 left-2 ${statusColors[property.status as keyof typeof statusColors]}`}>
          {statusLabels[property.status as keyof typeof statusLabels]}
        </Badge>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{property.title}</h3>
        <p className="text-gray-600 text-sm mb-3">{property.location}</p>
        
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-accent">{formattedPrice}</span>
          {property.surface && (
            <span className="text-sm text-gray-500">{property.surface} m²</span>
          )}
        </div>
        
        <div className="flex gap-4 text-sm text-gray-500">
        {property.bedrooms && <span>{property.bedrooms} chambres</span>}
        {property.bathrooms && <span>{property.bathrooms} sdb</span>}
        </div>
      </div>
    </Card>
  )
}