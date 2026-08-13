import { useState, useMemo, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Search, User, X, CheckCircle } from 'react-feather';
import { Input } from '../../../../components/ui/Input';
import { Textarea } from '../../../../components/ui/Textarea';
import { RadioGroup } from '../../../../components/ui/RadioGroup/RadioGroup';
import { RadioGroupItem } from '../../../../components/ui/RadioGroup/RadioGroupItem';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { DatePicker } from '../../../../components/ui/DatePicker';
import { PhoneInput } from '../../../../components/ui/PhoneInput';
import { fetchClients } from '../../../../services/clientService';
import { fetchContactById } from '../../../../services/contactService';

interface OwnerTabProps {
  control: any;
  register: any;
  watch: any;
  setValue: any;
  transactionType?: string;
  isGerant?: boolean;
}

const CLIENT_TYPE_LABEL: Record<string, string> = {
  vente: 'Vendeur',
  location_ld: 'Bailleur',
  location_saisonniere: 'Bailleur',
};

export function OwnerTab({ control, register, watch, setValue, transactionType, isGerant = false }: OwnerTabProps) {
  const ownerType = watch('ownerType');
  const hasOtherProperties = watch('saleInfo.otherProperties');
  const clientId = watch('clientId');
  const clientSearch = watch('clientSearch') || '';

  const clientType = (transactionType && CLIENT_TYPE_LABEL[transactionType]) || 'Vendeur';

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  useEffect(() => {
    if (ownerType === 'societe') {
      setSearchResults([]);
      setValue('clientSearch', '');
    }
  }, [ownerType, setValue]);

  useMemo(() => {
    if (clientSearch.length < 2 || ownerType === 'societe') {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await fetchClients({ search: clientSearch, type: clientType.toLowerCase() });
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [clientSearch, clientType]);

  const handleSelectClient = async (client: any) => {
    setSelectedClient(client);
    setValue('clientId', String(client.id));
    setValue('clientSearch', '');
    setSearchResults([]);

    let contactData: any = null;
    if (client.contactId) {
      try { contactData = await fetchContactById(String(client.contactId)); } catch {}
    }

    const patch = (key: string, val: string | undefined) => { if (val !== undefined && val !== '') setValue(key, val); };

    if (ownerType === 'particulier') {
      patch('owner.lastName', contactData?.lastName || client.lastName || '');
      patch('owner.firstName', contactData?.firstName || client.firstName || '');
      patch('owner.phone', contactData?.mobile || client.phone || '');
      patch('owner.email', contactData?.emailPrincipal || client.email || '');
      patch('owner.address', contactData?.adresse || client.address || '');
      patch('owner.profession', contactData?.profession || client.profession || '');
    } else {
      patch('company.name', client.companyName || '');
      patch('company.legalForm', client.legalForm || '');
      patch('company.siren', client.siren || '');
      patch('company.address', contactData?.adresse || client.address || '');
    }
  };

  const handleClearClient = () => {
    setSelectedClient(null);
    setValue('clientId', '');
    setValue('owner.lastName', '');
    setValue('owner.firstName', '');
    setValue('owner.phone', '');
    setValue('owner.email', '');
    setValue('owner.address', '');
    setValue('owner.profession', '');
    setValue('company.name', '');
    setValue('company.legalForm', '');
    setValue('company.siren', '');
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
        <div className="p-5 border-b border-border/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <User size={15} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
              <span className="text-sm font-semibold">Propriétaire</span>
            </div>
            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
              {clientType}
            </span>
          </div>
          <p className="text-xs text-text-secondary/70 mb-3">
            Transaction : <strong>{transactionType === 'vente' ? 'Vente' : 'Location'}</strong> → Le propriétaire deviendra un <strong>{clientType}</strong>
          </p>
        </div>

        <div className="p-5 space-y-4">
          {ownerType !== 'societe' && (
            <Controller
              name="clientSearch"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    type="text"
                    placeholder={`Rechercher un ${clientType.toLowerCase()}...`}
                    className={`w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 transition-all ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]' : 'focus:ring-accent/20 focus:border-accent'}`}
                    value={field.value || ''}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      if (selectedClient) handleClearClient();
                    }}
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className={`w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin ${isGerant ? 'border-[#905D5D]' : 'border-accent'}`} />
                    </div>
                  )}
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border/50 rounded-xl shadow-dropdown z-10 max-h-48 overflow-y-auto">
                      {searchResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-background/50 transition-colors"
                          onClick={() => handleSelectClient(c)}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${isGerant ? 'bg-[#905D5D]/15 text-[#905D5D]' : 'bg-accent-light text-accent'}`}>
                            {((c.firstName?.[0] || '') + (c.lastName?.[0] || '')).toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{c.firstName} {c.lastName}</p>
                            <p className="text-[11px] text-text-secondary/60 truncate">{c.email || c.phone}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            />
          )}

          {selectedClient && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">
                    {selectedClient.firstName} {selectedClient.lastName}
                  </p>
                  <p className="text-[11px] text-emerald-600">{selectedClient.email || selectedClient.phone}</p>
                </div>
              </div>
              <button type="button" onClick={handleClearClient} className="p-1 rounded-md hover:bg-emerald-100 transition-colors">
                <X size={14} className="text-emerald-600" />
              </button>
            </div>
          )}

          {!selectedClient && ownerType !== 'societe' && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/30" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 text-xs text-text-secondary/50">Pas de {clientType.toLowerCase()} dans votre liste ? Remplissez ce formulaire</span>
              </div>
            </div>
          )}

          <Controller
            name="ownerType"
            control={control}
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-6">
                <RadioGroupItem value="particulier" id="particulier">Particulier</RadioGroupItem>
                <RadioGroupItem value="societe" id="societe">Société</RadioGroupItem>
              </RadioGroup>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ownerType === 'particulier' ? (
              <>
                <Input label="Nom *" {...register('owner.lastName')} />
                <Input label="Prénom *" {...register('owner.firstName')} />
                <Input label="Email" type="email" {...register('owner.email')} />
                <Controller
                  name="owner.phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput label="Téléphone" value={field.value || ''} onChange={field.onChange} />
                  )}
                />
                <Input label="Adresse" {...register('owner.address')} />
                <Input label="Profession" {...register('owner.profession')} />
              </>
            ) : (
              <>
                <Input label="Dénomination sociale *" {...register('company.name')} />
                <Input label="Forme sociale" {...register('company.legalForm')} />
                <Input label="N° Siren" {...register('company.siren')} />
                <Input label="Adresse" {...register('company.address')} />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/30">
          <span className="text-sm font-semibold">Motivation de vente/location</span>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker label="Date d'achat" {...register('saleInfo.purchaseDate')} />
          <Input label="Durée de mise en vente/location" {...register('saleInfo.listingDuration')} />
          <div className="md:col-span-2">
            <Textarea label="Raisons de la vente/location" {...register('saleInfo.motivation')} rows={3} />
          </div>
          <div className="md:col-span-2">
            <Controller
              name="saleInfo.otherProperties"
              control={control}
              render={({ field }) => (
                <Checkbox label="Avez-vous d'autres biens à vendre/louer?" checked={field.value} onChange={(checked) => field.onChange(checked)} />
              )}
            />
          </div>
          {hasOtherProperties && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="md:col-span-2"
            >
              <Textarea label="Décrivez les autres biens à vendre/louer" {...register('saleInfo.otherPropertiesDescription')} rows={3} />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
