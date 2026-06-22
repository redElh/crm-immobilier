import { InfoField } from '../../ui/InfoField';
import { Badge } from '../../ui/Badge';
import { Home, MapPin, Maximize2, Grid, Calendar, Layers, Hash, Sun, Briefcase, DollarSign, FileText, Clock, Navigation } from 'react-feather';
import type { Property } from '../../../types/property';
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS, STATUS_LABELS, DPE_COLORS, STATUS_COLORS } from '../../../types/property';
import { ConfidentialValue } from '../confidentiality/ConfidentialField';

export const PropertyDetails = ({ property }: { property: Property }) => {
  const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType] || property.propertyType;
  const transactionLabel = TRANSACTION_TYPE_LABELS[property.transactionType] || property.transactionType;
  const statusLabel = STATUS_LABELS[property.status] || property.status;
  const statusColor = STATUS_COLORS[property.status] || 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <div className="space-y-5">
      {/* Main grid */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
        <h3 className="font-semibold mb-4">Informations générales</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <InfoField label="Référence" value={property.reference} icon={<Hash size={14} />} />
          <InfoField label="Type de bien" value={typeLabel} icon={<Briefcase size={14} />} />
          <InfoField label="Transaction" value={transactionLabel} icon={<Home size={14} />} />
          <div>
            <p className="text-[11px] text-text-secondary/60 mb-1">Statut</p>
            <Badge className={statusColor}>{statusLabel}</Badge>
          </div>
          <InfoField label="Surface" value={`${property.surface} m²`} icon={<Maximize2 size={14} />} />
          {property.surfaceCarrez && <InfoField label="Surface Carrez" value={`${property.surfaceCarrez} m²`} icon={<Maximize2 size={14} />} />}
          {property.landSize && <InfoField label="Terrain" value={`${property.landSize} m²`} icon={<MapPin size={14} />} />}
          <InfoField label="Pièces" value={property.rooms} icon={<Grid size={14} />} />
          <InfoField label="Chambres" value={property.bedrooms} icon={<Grid size={14} />} />
          <InfoField label="Salles de bain" value={property.bathrooms} icon={<Grid size={14} />} />
          {property.sleepingCapacity && (
            <InfoField label="Couchages" value={property.sleepingCapacity} icon={<Sun size={14} />} />
          )}
          {property.beds && <InfoField label="Lits" value={property.beds} icon={<Sun size={14} />} />}
          {property.yearBuilt && <InfoField label="Année construction" value={property.yearBuilt} icon={<Calendar size={14} />} />}
          {property.propertyState && <InfoField label="État" value={property.propertyState} icon={<Layers size={14} />} />}
          {property.mandateType && <InfoField label="Type de mandat" value={property.mandateType} icon={<FileText size={14} />} />}
          {property.mandateRemuneration && <InfoField label="Rémunération" value={<ConfidentialValue>{`${property.mandateRemuneration} %`}</ConfidentialValue>} icon={<DollarSign size={14} />} />}
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
        <h3 className="font-semibold mb-4">Prix</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {property.prixSurDemande ? (
            <InfoField label="Prix" value="Sur demande" icon={<DollarSign size={14} />} />
          ) : (
            <>
              <InfoField label="Prix de vente" value={<ConfidentialValue>{`${property.price.toLocaleString()} MAD`}</ConfidentialValue>} icon={<DollarSign size={14} />} highlight />
              {property.prixNetVendeur && <InfoField label="Prix net vendeur" value={<ConfidentialValue>{`${property.prixNetVendeur.toLocaleString()} MAD`}</ConfidentialValue>} icon={<DollarSign size={14} />} />}
            </>
          )}
          {property.loyerHC && <InfoField label="Loyer HC" value={<ConfidentialValue>{`${property.loyerHC.toLocaleString()} MAD`}</ConfidentialValue>} icon={<DollarSign size={14} />} />}
          {property.charges && <InfoField label="Charges" value={<ConfidentialValue>{`${property.charges.toLocaleString()} MAD`}</ConfidentialValue>} icon={<DollarSign size={14} />} />}
          {property.depotGarantie && <InfoField label="Dépôt garantie" value={<ConfidentialValue>{`${property.depotGarantie.toLocaleString()} MAD`}</ConfidentialValue>} icon={<DollarSign size={14} />} />}
          {property.priceEstimate && (
            <InfoField
              label="Estimation"
              value={<ConfidentialValue>{`${property.priceEstimate.toLocaleString()} MAD`}</ConfidentialValue>}
              icon={<DollarSign size={14} />}
            />
          )}
          {property.negociable !== undefined && (
            <InfoField label="Négociable" value={property.negociable ? 'Oui' : 'Non'} icon={<DollarSign size={14} />} />
          )}
        </div>
        {property.honorairesType && (
          <div className="mt-3 text-xs text-text-secondary/60">
            Honoraires {property.honorairesType === 'inclus' ? 'inclus' : 'en sus'}
            {property.honorairesPct ? <ConfidentialValue>{` (${property.honorairesPct}%)`}</ConfidentialValue> : ''}
          </div>
        )}
      </div>

      {/* Localisation */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
        <h3 className="font-semibold mb-4">Localisation</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <InfoField label="Ville" value={property.city} icon={<MapPin size={14} />} highlight />
          {property.district && <InfoField label="Quartier" value={property.district} icon={<MapPin size={14} />} />}
          <InfoField label="Adresse" value={<ConfidentialValue>{property.hideExactAddress ? 'Confidentielle' : property.address}</ConfidentialValue>} icon={<MapPin size={14} />} />
          {property.latitude && property.longitude && (
            <InfoField label="Coordonnées" value={<ConfidentialValue>{`${property.latitude}, ${property.longitude}`}</ConfidentialValue>} icon={<Navigation size={14} />} />
          )}
          {property.exposition && <InfoField label="Exposition" value={property.exposition} icon={<Sun size={14} />} />}
          {property.currentUse && <InfoField label="Situation" value={property.currentUse} icon={<Clock size={14} />} />}
        </div>
      </div>

      {/* Description */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
        <h3 className="font-semibold mb-2">Description</h3>
        <p className="text-sm text-text-secondary leading-relaxed">{property.description}</p>
      </div>

      {/* Features */}
      {property.features && property.features.length > 0 && (
        <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
          <h3 className="font-semibold mb-3">Caractéristiques</h3>
          <div className="flex flex-wrap gap-2">
            {property.features.map((f, i) => (
              <Badge key={i} variant="secondary" size="md">{f}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* DPE */}
      {property.dpe && (
        <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
          <h3 className="font-semibold mb-3">Diagnostic de Performance Énergétique (DPE)</h3>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${DPE_COLORS[property.dpe.class] || 'bg-gray-400'}`}>
              {property.dpe.class}
            </div>
            <div>
              <p className="text-sm font-medium">Classe {property.dpe.class}</p>
              {property.dpe.consumption && (
                <p className="text-xs text-text-secondary">{property.dpe.consumption} kWh/m²/an</p>
              )}
              {property.dpe.since && (
                <p className="text-xs text-text-secondary/60">Réalisé le {property.dpe.since}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};