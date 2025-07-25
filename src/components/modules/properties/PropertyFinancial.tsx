import  Card from '../../ui/Card'
import { Progress } from '../../ui/Progress'
import { InfoField } from '../../ui/InfoField'

interface PropertyFinancialProps {
  property: {
    price: number
    priceEstimate: number
    monthlyRent?: number
    annualCharges?: number
    propertyTax?: number
    rentalYield?: number
    priceHistory?: {
      date: string
      price: number
      event: string
    }[]
  }
}

export const PropertyFinancial = ({ property }: PropertyFinancialProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      maximumFractionDigits: 0
    }).format(value)
  }

  const priceDifference = property.priceEstimate ? property.price - property.priceEstimate : 0
  const priceDifferencePercentage = property.priceEstimate 
    ? Math.round((priceDifference / property.priceEstimate) * 100) 
    : 0

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Valeur et estimation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <InfoField label="Prix actuel" value={formatCurrency(property.price)} />
            <InfoField 
              label="Estimation du marché" 
              value={formatCurrency(property.priceEstimate)} 
              className={priceDifference > 0 ? 'text-red-600' : 'text-green-600'}
              helperText={priceDifference !== 0 ? 
                `${Math.abs(priceDifferencePercentage)}% ${priceDifference > 0 ? 'au-dessus' : 'en dessous'} du marché` : 
                'Aligné avec le marché'}
            />
          </div>
          <div className="flex items-center justify-center">
            <Progress 
              value={Math.min(100, Math.max(0, 50 + (priceDifferencePercentage / 2)))}
              indicatorColor={priceDifference > 0 ? 'bg-red-500' : 'bg-green-500'}
              className="h-3"
            />
          </div>
        </div>
      </Card>

      {property.monthlyRent && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Rentabilité locative</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoField label="Loyer mensuel" value={formatCurrency(property.monthlyRent)} />
            <InfoField label="Charges annuelles" value={formatCurrency(property.annualCharges || 0)} />
            <InfoField label="Taxe foncière" value={formatCurrency(property.propertyTax || 0)} />
            <InfoField 
              label="Rendement brut" 
              value={`${property.rentalYield?.toFixed(2) || '0'}%`} 
              className={property.rentalYield && property.rentalYield > 5 ? 'text-green-600' : 'text-amber-600'}
            />
          </div>
        </Card>
      )}

      {property.priceHistory && property.priceHistory.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Historique des prix</h3>
          <div className="space-y-4">
            {property.priceHistory.map((entry, index) => (
              <div key={index} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{formatCurrency(entry.price)}</p>
                  <p className="text-sm text-gray-500">{new Date(entry.date).toLocaleDateString('fr-FR')}</p>
                </div>
                <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                  {entry.event}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}