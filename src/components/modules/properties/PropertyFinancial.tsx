import Card from '../../ui/Card';
import { InfoField } from '../../ui/InfoField';
import { Progress } from '../../ui/Progress';
import { DollarSign, TrendingUp, TrendingDown, BarChart } from 'react-feather';
import { ConfidentialValue } from '../confidentiality/ConfidentialField';

export const PropertyFinancial = ({ property }: { property: any }) => {
  const hasEstimate = property.priceEstimate != null;

  return (
    <Card className="p-5 space-y-5">
      <h3 className="font-semibold flex items-center gap-2">
        <BarChart size={16} className="text-accent" />
        Financier
      </h3>
      <div className="space-y-3">
        <InfoField label="Prix" value={<ConfidentialValue>{`${property.price.toLocaleString()} MAD`}</ConfidentialValue>} icon={<DollarSign size={14} />} highlight />
        {hasEstimate && (
          <>
            <InfoField
              label="Estimation"
              value={<ConfidentialValue>{`${property.priceEstimate.toLocaleString()} MAD`}</ConfidentialValue>}
              icon={<TrendingUp size={14} />}
            />
            <InfoField
              label="Écart"
              value={<ConfidentialValue>{`${property.priceEstimate > property.price ? '-' : '+'}${Math.abs(
                ((property.priceEstimate - property.price) / property.priceEstimate * 100)
              ).toFixed(1)}%`}</ConfidentialValue>}
              icon={property.priceEstimate > property.price ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              highlight={property.priceEstimate > property.price}
            />
          </>
        )}
      </div>
      {hasEstimate && (
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-text-secondary">Rapport prix/estimation</span>
            <span className={`font-medium ${property.priceEstimate > property.price ? 'text-emerald-600' : 'text-amber-600'}`}>
              {property.priceEstimate > property.price ? 'Sous-estimé' : 'Sur-estimé'}
            </span>
          </div>
          <Progress
            value={property.priceEstimate > property.price ? 85 : 65}
            indicatorColor={property.priceEstimate > property.price ? 'bg-emerald-500' : 'bg-amber-500'}
          />
        </div>
      )}
      <p className="text-xs text-text-secondary/60 text-center">
        Prix au m² : <ConfidentialValue>{(property.price / property.surface).toLocaleString()} MAD</ConfidentialValue>
      </p>
    </Card>
  );
};
