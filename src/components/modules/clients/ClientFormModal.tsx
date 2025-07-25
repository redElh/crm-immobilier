import { useState, ReactElement } from 'react';
import { Client } from '../../../types/client';
import { Dialog } from '../../ui/Dialog';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Checkbox } from '../../ui/Checkbox';
import { Textarea } from '../../ui/Textarea';

interface ClientFormModalProps {
  onClose: () => void;
  onSubmit: (client: Omit<Client, 'id'>) => void;
  clientType: 'Acheteur' | 'Vendeur' | 'Bailleur' | 'Locataire' | 'Voyageur';
}

type FormData = Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'events' | 'lastContact'> & {
  currentSituation?: string;
  moveInDate?: string;
  furnished?: boolean;
  guarantor?: boolean;
  propertyCondition?: string;
  reasonForSelling?: string;
  mustHaveFeatures?: string;
  urgency?: string;
  preferredTenant?: string;
  minRentalDuration?: number;
  includedUtilities?: string;
  employmentStatus?: string;
  currentAddress?: string;
  travelDates?: string;
  accommodationType?: string;
  specialRequirements?: string;
  source?: string;
  notes?: string;
};

const PROPERTY_TYPES = [
  { value: 'Appartement', label: 'Appartement' },
  { value: 'Maison', label: 'Maison' },
  { value: 'Terrain', label: 'Terrain' },
  { value: 'Local commercial', label: 'Local commercial' },
];

const FINANCING_TYPES = [
  { value: 'Prêt bancaire', label: 'Prêt bancaire' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Mixte', label: 'Mixte' },
];

const CURRENT_SITUATION = [
  { value: 'Locataire', label: 'Locataire' },
  { value: 'Propriétaire', label: 'Propriétaire' },
  { value: 'Chez des parents', label: 'Chez des parents' },
  { value: 'Autre', label: 'Autre' },
];

const PROPERTY_CONDITIONS = [
  { value: 'Neuf', label: 'Neuf' },
  { value: 'Excellent', label: 'Excellent' },
  { value: 'Bon', label: 'Bon' },
  { value: 'À rénover', label: 'À rénover' },
];

const URGENCY_LEVELS = [
  { value: 'Immédiat', label: 'Immédiat' },
  { value: '1-3 mois', label: '1-3 mois' },
  { value: '3-6 mois', label: '3-6 mois' },
  { value: '6+ mois', label: '6+ mois' },
];

const PREFERRED_TENANTS = [
  { value: 'Famille', label: 'Famille' },
  { value: 'Professionnel', label: 'Professionnel' },
  { value: 'Étudiant', label: 'Étudiant' },
  { value: 'Retraité', label: 'Retraité' },
  { value: 'Peu importe', label: 'Peu importe' },
];

const EMPLOYMENT_STATUS = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'Indépendant', label: 'Indépendant' },
  { value: 'Étudiant', label: 'Étudiant' },
  { value: 'Retraité', label: 'Retraité' },
];

const ACCOMMODATION_TYPES = [
  { value: 'Hôtel', label: 'Hôtel' },
  { value: 'Appartement', label: 'Appartement' },
  { value: 'Maison', label: 'Maison' },
  { value: 'Villa', label: 'Villa' },
  { value: 'Résidence', label: 'Résidence' },
];

const SOURCES = [
  { value: 'Site web', label: 'Site web' },
  { value: 'Réseaux sociaux', label: 'Réseaux sociaux' },
  { value: 'Référence', label: 'Référence' },
  { value: 'Publicité', label: 'Publicité' },
  { value: 'Porte à porte', label: 'Porte à porte' },
  { value: 'Autre', label: 'Autre' },
];

export const ClientFormModal = ({ onClose, onSubmit, clientType }: ClientFormModalProps) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: clientType,
    phone: '',
    email: '',
    propertyType: undefined,
    area: '',
    minSurface: undefined,
    rooms: '',
    budget: undefined,
    contribution: undefined,
    financingType: undefined,
    loanDuration: undefined,
    status: 'Actif',
    currentSituation: undefined,
    moveInDate: undefined,
    furnished: undefined,
    guarantor: undefined,
    propertyCondition: undefined,
    reasonForSelling: undefined,
    mustHaveFeatures: undefined,
    urgency: undefined,
    preferredTenant: undefined,
    minRentalDuration: undefined,
    includedUtilities: undefined,
    employmentStatus: undefined,
    currentAddress: undefined,
    travelDates: undefined,
    accommodationType: undefined,
    specialRequirements: undefined,
    source: undefined,
    notes: undefined
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof FormData, value: string | number | boolean | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.name?.trim()) newErrors.name = 'Le nom est requis';
    else if (formData.name.length < 2) newErrors.name = 'Minimum 2 caractères';
    
    if (!formData.phone?.trim()) newErrors.phone = 'Le téléphone est requis';
    else if (formData.phone.length < 10) newErrors.phone = 'Numéro invalide';
    
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    // Type-specific validations
    switch(clientType) {
      case 'Acheteur':
        if (!formData.area?.trim()) newErrors.area = 'Le secteur est requis';
        if (formData.budget === undefined) newErrors.budget = 'Le budget est requis';
        if (!formData.currentSituation) newErrors.currentSituation = 'Ce champ est requis';
        if (!formData.urgency) newErrors.urgency = 'Ce champ est requis';
        if (formData.financingType === 'Prêt bancaire') {
          if (formData.contribution === undefined) newErrors.contribution = 'Ce champ est requis';
          if (formData.loanDuration === undefined) newErrors.loanDuration = 'Ce champ est requis';
        }
        break;
        
      case 'Locataire':
        if (!formData.area?.trim()) newErrors.area = 'Le secteur est requis';
        if (formData.budget === undefined) newErrors.budget = 'Le budget est requis';
        if (!formData.moveInDate) newErrors.moveInDate = 'La date souhaitée est requise';
        if (!formData.employmentStatus) newErrors.employmentStatus = 'Ce champ est requis';
        break;
        
      case 'Bailleur':
        if (!formData.propertyType) newErrors.propertyType = 'Le type de bien est requis';
        if (!formData.area?.trim()) newErrors.area = 'Le secteur est requis';
        if (formData.furnished === undefined) newErrors.furnished = 'Ce champ est requis';
        if (!formData.preferredTenant) newErrors.preferredTenant = 'Ce champ est requis';
        break;
        
      case 'Vendeur':
        if (!formData.propertyType) newErrors.propertyType = 'Le type de bien est requis';
        if (!formData.area?.trim()) newErrors.area = 'Le secteur est requis';
        if (!formData.propertyCondition) newErrors.propertyCondition = 'Ce champ est requis';
        if (!formData.reasonForSelling) newErrors.reasonForSelling = 'Ce champ est requis';
        break;

      case 'Voyageur':
        if (!formData.travelDates) newErrors.travelDates = 'Les dates sont requises';
        if (!formData.accommodationType) newErrors.accommodationType = 'Ce champ est requis';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    onSubmit({
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user-id' // You should get this from your auth system
    });
  };

  const renderField = (field: ReactElement, key: string) => (
    <div key={key} className="mb-3">
      {field}
    </div>
  );

  const renderTypeSpecificFields = () => {
    switch(clientType) {
      case 'Acheteur':
        return (
          <>
            <div className="mb-6">
              <h3 className="font-medium text-base text-text mb-3">Situation actuelle</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderField(
                  <Select
                    label="Situation actuelle*"
                    options={CURRENT_SITUATION}
                    value={formData.currentSituation || ''}
                    onChange={(value: string) => handleChange('currentSituation', value)}
                    error={errors.currentSituation}
                    compact
                  />,
                  'currentSituation'
                )}
                {renderField(
                  <Select
                    label="Urgence*"
                    options={URGENCY_LEVELS}
                    value={formData.urgency || ''}
                    onChange={(value: string) => handleChange('urgency', value)}
                    error={errors.urgency}
                    compact
                  />,
                  'urgency'
                )}
                {renderField(
                  <Input
                    label="Date souhaitée d'emménagement"
                    type="date"
                    value={formData.moveInDate || ''}
                    onChange={(e) => handleChange('moveInDate', e.target.value)}
                    error={errors.moveInDate}
                  />,
                  'moveInDate'
                )}
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-medium text-base text-text mb-3">Critères de recherche</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderField(
                  <Select
                    label="Type de bien"
                    options={PROPERTY_TYPES}
                    value={formData.propertyType || ''}
                    onChange={(value: string) => handleChange('propertyType', value)}
                    error={errors.propertyType}
                    compact
                  />,
                  'propertyType'
                )}
                {renderField(
                  <Input
                    label="Secteur géographique*"
                    value={formData.area}
                    onChange={(e) => handleChange('area', e.target.value)}
                    error={errors.area}
                    placeholder="Paris 15ème"
                  />,
                  'area'
                )}
                {renderField(
                  <Input
                    label="Surface min (m²)"
                    type="number"
                    min="0"
                    value={formData.minSurface?.toString() || ''}
                    onChange={(e) => handleChange('minSurface', e.target.value ? parseInt(e.target.value) : undefined)}
                    error={errors.minSurface}
                  />,
                  'minSurface'
                )}
                {renderField(
                  <Input
                    label="Pièces"
                    value={formData.rooms}
                    onChange={(e) => handleChange('rooms', e.target.value)}
                    error={errors.rooms}
                  />,
                  'rooms'
                )}
                {renderField(
                  <Input
                    label="Budget max (€)*"
                    type="number"
                    min="0"
                    value={formData.budget?.toString() || ''}
                    onChange={(e) => handleChange('budget', e.target.value ? parseInt(e.target.value) : undefined)}
                    error={errors.budget}
                  />,
                  'budget'
                )}
                {renderField(
                  <Textarea
                    label="Caractéristiques indispensables"
                    value={formData.mustHaveFeatures || ''}
                    onChange={(e) => handleChange('mustHaveFeatures', e.target.value)}
                    error={errors.mustHaveFeatures}
                    placeholder="Balcon, parking, ascenseur..."
                  />,
                  'mustHaveFeatures'
                )}
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-medium text-base text-text mb-3">Financement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderField(
                  <Select
                    label="Type de financement"
                    options={FINANCING_TYPES}
                    value={formData.financingType || ''}
                    onChange={(value: string) => handleChange('financingType', value)}
                    error={errors.financingType}
                    compact
                  />,
                  'financingType'
                )}
                {renderField(
                  <Input
                    label="Apport (€)"
                    type="number"
                    min="0"
                    value={formData.contribution?.toString() || ''}
                    onChange={(e) => handleChange('contribution', e.target.value ? parseInt(e.target.value) : undefined)}
                    error={errors.contribution}
                    disabled={formData.financingType !== 'Prêt bancaire'}
                  />,
                  'contribution'
                )}
                {renderField(
                  <Input
                    label="Durée prêt (années)"
                    type="number"
                    min="0"
                    value={formData.loanDuration?.toString() || ''}
                    onChange={(e) => handleChange('loanDuration', e.target.value ? parseInt(e.target.value) : undefined)}
                    error={errors.loanDuration}
                    disabled={formData.financingType !== 'Prêt bancaire'}
                  />,
                  'loanDuration'
                )}
              </div>
            </div>
          </>
        );
        
      case 'Locataire':
        return (
          <>
            <div className="mb-6">
              <h3 className="font-medium text-base text-text mb-3">Situation actuelle</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderField(
                  <Input
                    label="Adresse actuelle"
                    value={formData.currentAddress || ''}
                    onChange={(e) => handleChange('currentAddress', e.target.value)}
                    error={errors.currentAddress}
                    placeholder="123 Rue de Paris, 75001"
                  />,
                  'currentAddress'
                )}
                {renderField(
                  <Select
                    label="Situation professionnelle*"
                    options={EMPLOYMENT_STATUS}
                    value={formData.employmentStatus || ''}
                    onChange={(value: string) => handleChange('employmentStatus', value)}
                    error={errors.employmentStatus}
                    compact
                  />,
                  'employmentStatus'
                )}
                {renderField(
                  <Input
                    label="Date souhaitée d'emménagement*"
                    type="date"
                    value={formData.moveInDate || ''}
                    onChange={(e) => handleChange('moveInDate', e.target.value)}
                    error={errors.moveInDate}
                  />,
                  'moveInDate'
                )}
                {renderField(
                  <Checkbox
                    label="Garant disponible"
                    checked={formData.guarantor || false}
                    onChange={(checked) => handleChange('guarantor', checked)}
                    error={errors.guarantor}
                  />,
                  'guarantor'
                )}
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-medium text-base text-text mb-3">Critères de recherche</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderField(
                  <Select
                    label="Type de bien"
                    options={PROPERTY_TYPES}
                    value={formData.propertyType || ''}
                    onChange={(value: string) => handleChange('propertyType', value)}
                    error={errors.propertyType}
                    compact
                  />,
                  'propertyType'
                )}
                {renderField(
                  <Input
                    label="Secteur géographique*"
                    value={formData.area}
                    onChange={(e) => handleChange('area', e.target.value)}
                    error={errors.area}
                    placeholder="Paris 15ème"
                  />,
                  'area'
                )}
                {renderField(
                  <Input
                    label="Surface min (m²)"
                    type="number"
                    min="0"
                    value={formData.minSurface?.toString() || ''}
                    onChange={(e) => handleChange('minSurface', e.target.value ? parseInt(e.target.value) : undefined)}
                    error={errors.minSurface}
                  />,
                  'minSurface'
                )}
                {renderField(
                  <Input
                    label="Budget max (€)*"
                    type="number"
                    min="0"
                    value={formData.budget?.toString() || ''}
                    onChange={(e) => handleChange('budget', e.target.value ? parseInt(e.target.value) : undefined)}
                    error={errors.budget}
                  />,
                  'budget'
                )}
              </div>
            </div>
          </>
        );
        
      case 'Bailleur':
        return (
          <>
            <div className="mb-6">
              <h3 className="font-medium text-base text-text mb-3">Informations sur le bien</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderField(
                  <Select
                    label="Type de bien*"
                    options={PROPERTY_TYPES}
                    value={formData.propertyType || ''}
                    onChange={(value: string) => handleChange('propertyType', value)}
                    error={errors.propertyType}
                    compact
                  />,
                  'propertyType'
                )}
                {renderField(
                  <Input
                    label="Secteur géographique*"
                    value={formData.area}
                    onChange={(e) => handleChange('area', e.target.value)}
                    error={errors.area}
                    placeholder="Paris 15ème"
                  />,
                  'area'
                )}
                {renderField(
                  <Input
                    label="Surface (m²)"
                    type="number"
                    min="0"
                    value={formData.minSurface?.toString() || ''}
                    onChange={(e) => handleChange('minSurface', e.target.value ? parseInt(e.target.value) : undefined)}
                    error={errors.minSurface}
                  />,
                  'minSurface'
                )}
                {renderField(
                  <Input
                    label="Pièces"
                    value={formData.rooms}
                    onChange={(e) => handleChange('rooms', e.target.value)}
                    error={errors.rooms}
                  />,
                  'rooms'
                )}
                {renderField(
                  <Select
                    label="État du bien"
                    options={PROPERTY_CONDITIONS}
                    value={formData.propertyCondition || ''}
                    onChange={(value: string) => handleChange('propertyCondition', value)}
                    error={errors.propertyCondition}
                    compact
                  />,
                  'propertyCondition'
                )}
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-medium text-base text-text mb-3">Préférences de location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderField(
                  <Select
                    label="Type de locataire préféré*"
                    options={PREFERRED_TENANTS}
                    value={formData.preferredTenant || ''}
                    onChange={(value: string) => handleChange('preferredTenant', value)}
                    error={errors.preferredTenant}
                    compact
                  />,
                  'preferredTenant'
                )}
                {renderField(
                  <Input
                    label="Durée minimum (mois)"
                    type="number"
                    min="0"
                    value={formData.minRentalDuration?.toString() || ''}
                    onChange={(e) => handleChange('minRentalDuration', e.target.value ? parseInt(e.target.value) : undefined)}
                    error={errors.minRentalDuration}
                  />,
                  'minRentalDuration'
                )}
                {renderField(
                  <Checkbox
                    label="Meublé*"
                    checked={formData.furnished || false}
                    onChange={(checked) => handleChange('furnished', checked)}
                    error={errors.furnished}
                  />,
                  'furnished'
                )}
                {renderField(
                  <Textarea
                    label="Services inclus"
                    value={formData.includedUtilities || ''}
                    onChange={(e) => handleChange('includedUtilities', e.target.value)}
                    error={errors.includedUtilities}
                    placeholder="Eau, électricité, internet..."
                  />,
                  'includedUtilities'
                )}
              </div>
            </div>
          </>
        );
        
      case 'Vendeur':
        return (
          <>
            <div className="mb-6">
              <h3 className="font-medium text-base text-text mb-3">Informations sur le bien</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderField(
                  <Select
                    label="Type de bien*"
                    options={PROPERTY_TYPES}
                    value={formData.propertyType || ''}
                    onChange={(value: string) => handleChange('propertyType', value)}
                    error={errors.propertyType}
                    compact
                  />,
                  'propertyType'
                )}
                {renderField(
                  <Input
                    label="Secteur géographique*"
                    value={formData.area}
                    onChange={(e) => handleChange('area', e.target.value)}
                    error={errors.area}
                    placeholder="Paris 15ème"
                  />,
                  'area'
                )}
                {renderField(
                  <Input
                    label="Surface (m²)"
                    type="number"
                    min="0"
                    value={formData.minSurface?.toString() || ''}
                    onChange={(e) => handleChange('minSurface', e.target.value ? parseInt(e.target.value) : undefined)}
                    error={errors.minSurface}
                  />,
                  'minSurface'
                )}
                {renderField(
                  <Input
                    label="Pièces"
                    value={formData.rooms}
                    onChange={(e) => handleChange('rooms', e.target.value)}
                    error={errors.rooms}
                  />,
                  'rooms'
                )}
                {renderField(
                  <Select
                    label="État du bien*"
                    options={PROPERTY_CONDITIONS}
                    value={formData.propertyCondition || ''}
                    onChange={(value: string) => handleChange('propertyCondition', value)}
                    error={errors.propertyCondition}
                    compact
                  />,
                  'propertyCondition'
                )}
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-medium text-base text-text mb-3">Motivation</h3>
              <div className="grid grid-cols-1 gap-3">
                {renderField(
                  <Textarea
                    label="Raison de la vente*"
                    value={formData.reasonForSelling || ''}
                    onChange={(e) => handleChange('reasonForSelling', e.target.value)}
                    error={errors.reasonForSelling}
                    placeholder="Mutation professionnelle, héritage..."
                  />,
                  'reasonForSelling'
                )}
              </div>
            </div>
          </>
        );
        
      case 'Voyageur':
        return (
          <>
            <div className="mb-6">
              <h3 className="font-medium text-base text-text mb-3">Voyage</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderField(
                  <Input
                    label="Destination souhaitée"
                    value={formData.area}
                    onChange={(e) => handleChange('area', e.target.value)}
                    error={errors.area}
                    placeholder="New York, Tokyo..."
                  />,
                  'area'
                )}
                {renderField(
                  <Input
                    label="Dates du voyage*"
                    value={formData.travelDates || ''}
                    onChange={(e) => handleChange('travelDates', e.target.value)}
                    error={errors.travelDates}
                    placeholder="01/07/2023 - 15/07/2023"
                  />,
                  'travelDates'
                )}
                {renderField(
                  <Select
                    label="Type d'hébergement*"
                    options={ACCOMMODATION_TYPES}
                    value={formData.accommodationType || ''}
                    onChange={(value: string) => handleChange('accommodationType', value)}
                    error={errors.accommodationType}
                    compact
                  />,
                  'accommodationType'
                )}
                {renderField(
                  <Input
                    label="Budget (€)"
                    type="number"
                    min="0"
                    value={formData.budget?.toString() || ''}
                    onChange={(e) => handleChange('budget', e.target.value ? parseInt(e.target.value) : undefined)}
                    error={errors.budget}
                  />,
                  'budget'
                )}
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-medium text-base text-text mb-3">Préférences</h3>
              <div className="grid grid-cols-1 gap-3">
                {renderField(
                  <Textarea
                    label="Besoins spécifiques"
                    value={formData.specialRequirements || ''}
                    onChange={(e) => handleChange('specialRequirements', e.target.value)}
                    error={errors.specialRequirements}
                    placeholder="Accessibilité, animaux, cuisine équipée..."
                  />,
                  'specialRequirements'
                )}
              </div>
            </div>
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <Dialog isOpen onClose={onClose} title={`Ajouter un ${clientType}`} size="lg">
      <form onSubmit={handleSubmit}>
        <div className="max-h-[70vh] overflow-y-auto pr-2 -mr-2">
          {/* Basic Information Section */}
          <div className="mb-6">
            <h3 className="font-medium text-base text-text mb-3">Informations de base</h3>
            <div className="space-y-3">
              {renderField(
                <Input
                  label="Nom complet*"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={errors.name}
                  placeholder="Jean Dupont"
                />,
                'name'
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderField(
                  <Input
                    label="Téléphone*"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    error={errors.phone}
                    placeholder="0612345678"
                  />,
                  'phone'
                )}
                {renderField(
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    error={errors.email}
                    placeholder="jean.dupont@example.com"
                  />,
                  'email'
                )}
                {renderField(
                  <Select
                    label="Source"
                    options={SOURCES}
                    value={formData.source || ''}
                    onChange={(value: string) => handleChange('source', value)}
                    error={errors.source}
                    compact
                  />,
                  'source'
                )}
              </div>
            </div>
          </div>

          {/* Type-specific fields */}
          {renderTypeSpecificFields()}

          {/* Notes Section */}
          <div className="mb-6">
            <h3 className="font-medium text-base text-text mb-3">Notes</h3>
            <div className="grid grid-cols-1 gap-3">
              {renderField(
                <Textarea
                  label="Informations complémentaires"
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  error={errors.notes}
                  placeholder="Toutes informations utiles..."
                />,
                'notes'
              )}
            </div>
          </div>
        </div>

        {/* Form Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-text/80 hover:text-text"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded text-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Dialog>
  );
};