import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import  Card from '../../components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs/Tabs'
import { Icon } from '../../components/ui/Icon'
import { Badge } from '../../components/ui/Badge'
import { PropertyGallery } from '../../components/modules/properties/PropertyGallery'
import { PropertyDetails } from '../../components/modules/properties/PropertyDetails'
import { PropertyFinancial } from '../../components/modules/properties/PropertyFinancial'
import { PropertyDocuments } from '../../components/modules/properties/PropertyDocuments'
import { PropertyTimeline } from '../../components/modules/properties/PropertyTimeline'
import { PropertyMatching } from '../../components/modules/properties/PropertyMatching'
import { BackLink } from '../../components/ui/BackLink'

// Mock data - replace with API call
const mockProperty = {
  id: '1',
  title: 'Luxury Villa in Marrakech',
  propertyType: 'residential',
  status: 'for_sale',
  price: 4500000,
  priceEstimate: 4600000,
  location: 'Marrakech, Morocco',
  address: '123 Palm Street, Marrakech',
  bedrooms: 5,
  bathrooms: 4,
  surface: 320,
  landSize: 500,
  yearBuilt: 2018,
  description: 'This stunning luxury villa offers breathtaking views, premium finishes, and exceptional amenities in the heart of Marrakech.',
  features: ['Swimming pool', 'Garden', 'Terrace', 'Parking', 'Security system'],
  images: [
    '/images/properties/prop1.jpg',
    '/images/properties/prop2.jpg'
  ],
  owner: {
    id: 'owner1',
    name: 'Ahmed Benali',
    phone: '+212 6 12 34 56 78',
    email: 'ahmed.benali@example.com'
  },
  documents: [
    { id: '1', name: 'Mandat de vente', type: 'contract', date: '2023-05-15' },
    { id: '2', name: 'Plan cadastral', type: 'technical', date: '2023-05-10' }
  ],
  timeline: [
    { id: '1', date: '2023-06-01', type: 'visit', agent: 'Karim Eloui', notes: 'Client très intéressé, demande une contre-visite' },
    { id: '2', date: '2023-05-20', type: 'price_adjustment', notes: 'Prix réduit de 4.8M à 4.5M' }
  ],
  matchedClients: [
    { id: 'client1', name: 'Sophie Martin', matchScore: 92, criteria: 'Budget: 4-5M, Recherche: Villa luxe' },
    { id: 'client2', name: 'Thomas Dubois', matchScore: 87, criteria: 'Budget: 3.5-5M, Recherche: Résidence principale' }
  ]
}

const statusColors = {
  for_sale: 'bg-blue-100 text-blue-800',
  for_rent: 'bg-green-100 text-green-800',
  sold: 'bg-gray-100 text-gray-800',
  rented: 'bg-purple-100 text-purple-800'
}

const statusLabels = {
  for_sale: 'À vendre',
  for_rent: 'À louer',
  sold: 'Vendu',
  rented: 'Loué'
}

export default function PropertyPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('details')

  // In a real app, you would fetch the property data here
  // const { data: property, isLoading } = useGetProperty(id as string)
  const property = mockProperty

  if (!property) {
    return <div className="p-6">Loading...</div>
  }

  const formattedPrice = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0
  }).format(property.price)

  const formattedEstimate = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0
  }).format(property.priceEstimate)

  return (
    <div className="space-y-6 p-6">
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between">
      <div className="mb-4">
        <BackLink />
      </div>
        
        <div className="flex gap-2">
          <Button variant="outline" icon="edit">
            Modifier
          </Button>
          <Button variant="default" icon="share">
            Partager
          </Button>
        </div>
      </div>

      {/* Property header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{property.title}</h1>
          <Badge className={statusColors[property.status as keyof typeof statusColors]}>
            {statusLabels[property.status as keyof typeof statusLabels]}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600">
          <Icon name="map-pin" className="w-4 h-4" />
          <span>{property.location}</span>
        </div>
        
        <div className="flex items-center gap-4 pt-2">
          <span className="text-xl font-bold text-accent">{formattedPrice}</span>
          {property.priceEstimate && (
            <span className="text-sm text-gray-500">
              Estimation: {formattedEstimate}
            </span>
          )}
        </div>
      </div>

      {/* Gallery */}
      <PropertyGallery images={property.images} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="details">
            <Icon name="info" className="w-4 h-4 mr-2" />
            Détails
          </TabsTrigger>
          <TabsTrigger value="financial">
            <Icon name="currency" className="w-4 h-4 mr-2" />
            Financier
          </TabsTrigger>
          <TabsTrigger value="documents">
            <Icon name="folder" className="w-4 h-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="matching">
            <Icon name="users" className="w-4 h-4 mr-2" />
            Matching
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Icon name="clock" className="w-4 h-4 mr-2" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <PropertyDetails property={property} />
        </TabsContent>

        <TabsContent value="financial">
          <PropertyFinancial property={property} />
        </TabsContent>

        <TabsContent value="documents">
          <PropertyDocuments documents={property.documents} />
        </TabsContent>

        <TabsContent value="matching">
          <PropertyMatching clients={property.matchedClients} />
        </TabsContent>

        <TabsContent value="timeline">
          <PropertyTimeline events={property.timeline} />
        </TabsContent>
      </Tabs>
    </div>
  )
}