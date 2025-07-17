import { useState, ReactElement } from 'react';
import { Client } from '../../../types/client';
import { Dialog } from '../../ui/Dialog';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';

interface ClientFormModalProps {
  onClose: () => void;
  onSubmit: (client: Omit<Client, 'id'>) => void;
}

type FormData = Omit<Client, 'id'>;

const CLIENT_TYPES = [
  { value: 'Acheteur', label: 'Acheteur' },
  { value: 'Vendeur', label: 'Vendeur' },
  { value: 'Locataire', label: 'Locataire' },
  { value: 'Bailleur', label: 'Bailleur' },
];

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

export const ClientFormModal = ({ onClose, onSubmit }: ClientFormModalProps) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'Acheteur',
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
    status: 'Actif'
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof FormData, value: string | number | undefined) => {
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

    if (formData.type === 'Acheteur' || formData.type === 'Locataire') {
      if (!formData.area?.trim()) newErrors.area = 'Le secteur est requis';
      
      const validatePositiveNumber = (value: number | undefined, field: keyof FormData, required: boolean = false) => {
        if (required && value === undefined) {
          newErrors[field] = 'Ce champ est requis';
        } else if (value !== undefined && value < 0) {
          newErrors[field] = 'Doit être positif';
        }
      };

      validatePositiveNumber(formData.minSurface, 'minSurface');
      validatePositiveNumber(formData.budget, 'budget', true);
    }

    if (formData.type === 'Acheteur' && formData.financingType === 'Prêt bancaire') {
      if (formData.contribution === undefined) newErrors.contribution = 'Ce champ est requis';
      if (formData.loanDuration === undefined) newErrors.loanDuration = 'Ce champ est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    onSubmit(formData);
  };

  const renderField = (field: ReactElement, key: string) => (
    <div key={key} className="mb-3">
      {field}
    </div>
  );

  const isBuyerOrRenter = formData.type === 'Acheteur' || formData.type === 'Locataire';
  const isBuyer = formData.type === 'Acheteur';

  return (
    <Dialog isOpen onClose={onClose} title="Ajouter un nouveau client" size="lg">
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
              {renderField(
                <Select
                  label="Type de client*"
                  options={CLIENT_TYPES}
                  value={formData.type}
                  onChange={(value: string) => handleChange('type', value)}
                  error={errors.type}
                  compact
                />,
                'type'
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
              </div>
            </div>
          </div>

          {/* Search Criteria Section */}
          {isBuyerOrRenter && (
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
              </div>
            </div>
          )}

          {/* Financial Information Section */}
          {isBuyer && (
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
          )}
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