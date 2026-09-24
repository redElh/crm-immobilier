import { useState, useMemo, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Search, User, X, CheckCircle, TrendingUp } from 'react-feather';
import { Input } from '../../../../components/ui/Input';
import { Textarea } from '../../../../components/ui/Textarea';
import { RadioGroup } from '../../../../components/ui/RadioGroup/RadioGroup';
import { RadioGroupItem } from '../../../../components/ui/RadioGroup/RadioGroupItem';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { DatePicker } from '../../../../components/ui/DatePicker';
import { PhoneInput } from '../../../../components/ui/PhoneInput';
import { fetchClients } from '../../../../services/clientService';
import { fetchContactById } from '../../../../services/contactService';
import { useStageChrome } from '../../../../components/modules/calendar/useStageChrome';
import { SectionCard, Field, FieldGrid } from './stage';
import { StageBadge } from '../../../dashboard/Stage';
import { cn } from '../../../../lib/utils';

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
  const { staged, dark } = useStageChrome();
  // Stage glass (violet / teal) only when inside the stage shell; otherwise fall back to
  // the neutral card palette which adapts via CSS variables ( --card / --text / --border )
  // for admin/gerant dark modes ( html.dark + .admin-theme ). Using a global dark flag
  // here would incorrectly apply the stage glass gradient on the peach admin background,
  // leaving the search bar looking white while the Input fields correctly use bg-card.
  const isDark = staged && dark;
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
    <div className="space-y-5">
      <SectionCard
        value="owner"
        title="Propriétaire"
        icon={User}
        subtitle={`Transaction : ${transactionType === 'vente' ? 'Vente' : 'Location'} → Le propriétaire deviendra un ${clientType}`}
        badge={
          staged ? (
            <StageBadge variant={clientType === 'Bailleur' ? 'ok' : 'violet'}>{clientType}</StageBadge>
          ) : (
            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
              {clientType}
            </span>
          )
        }
        defaultOpen
      >
        {ownerType !== 'societe' && (
          <Controller
            name="clientSearch"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <Search
                  size={15}
                  className={cn(
                    'absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none',
                    isDark ? 'text-violet-300/80' : staged ? 'text-teal-700/70' : 'text-text-secondary'
                  )}
                />
                <input
                  type="text"
                  placeholder={`Rechercher un ${clientType.toLowerCase()}...`}
                  className={cn(
                    'w-full h-9 pl-9 pr-10 text-sm rounded-xl border outline-none transition-all placeholder:text-sm shadow-sm',
                    isDark
                      ? 'border-white/15 bg-gradient-to-b from-white/[0.12] to-white/[0.05] [background-color:transparent] text-white placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_8px_22px_-8px_rgba(0,0,0,0.6)] focus:border-violet-400/60 focus:shadow-[0_0_0_3px_rgba(124,92,255,0.30),0_10px_28px_-8px_rgba(124,92,255,0.45)]'
                      : staged
                        ? 'border-teal-900/15 bg-gradient-to-b from-white to-teal-50/70 text-teal-950 placeholder:text-teal-900/40 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_6px_18px_-10px_rgba(13,148,136,0.22)] focus:border-teal-500/50 focus:shadow-[0_0_0_3px_rgba(20,184,166,0.22),0_10px_28px_-10px_rgba(13,148,136,0.35)]'
                        : 'border-border bg-card text-text placeholder:text-text-secondary/50 focus:border-accent focus:ring-2 focus:ring-accent/15 dark:border-border dark:bg-card dark:text-text dark:placeholder:text-text-secondary/50 dark:focus:border-accent dark:focus:ring-accent/20',
                    isGerant && !staged ? 'focus:border-[#905D5D] focus:ring-[#905D5D]/20' : ''
                  )}
                  value={field.value || ''}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    if (selectedClient) handleClearClient();
                  }}
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className={cn('w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin', isDark ? 'border-violet-400' : staged ? 'border-teal-600' : isGerant ? 'border-[#905D5D]' : 'border-accent')} />
                  </div>
                )}
                {searchResults.length > 0 && (
                  <div
                    className={cn(
                      'absolute left-0 right-0 top-full mt-1 z-20 max-h-52 overflow-y-auto scrollbar-thin rounded-2xl border py-1',
                      isDark
                        ? 'border-violet-500/20 bg-[#0F0A1E] shadow-[0_24px_60px_-20px_rgba(124,92,255,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]'
                        : staged
                          ? 'border-white/70 bg-white/92 backdrop-blur-xl shadow-[0_24px_60px_-28px_rgba(13,148,136,0.35),inset_0_1px_0_rgba(255,255,255,0.9)]'
                          : 'bg-card border-border/50 shadow-dropdown rounded-xl dark:bg-card dark:border-border/50'
                    )}
                  >
                    {searchResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors mx-1 rounded-xl',
                          isDark
                            ? 'hover:bg-white/[0.06] text-slate-200'
                            : staged
                              ? 'hover:bg-teal-900/[0.04] text-teal-900'
                              : 'hover:bg-background/50 text-text dark:hover:bg-background/50 dark:text-text'
                        )}
                        onClick={() => handleSelectClient(c)}
                      >
                        <div
                          className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                            isDark
                              ? 'bg-gradient-to-br from-[#8B7CFF] to-[#5646C9] text-white shadow-[0_0_10px_rgba(124,92,255,0.5)]'
                              : staged
                                ? 'bg-teal-500/12 text-teal-700 border border-teal-500/15'
                                : isGerant
                                  ? 'bg-[#905D5D]/15 text-[#905D5D]'
                                  : 'bg-accent-light text-accent'
                          )}
                        >
                          {((c.firstName?.[0] || '') + (c.lastName?.[0] || '')).toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn('text-sm font-medium truncate', isDark ? 'text-white' : staged ? 'text-slate-900' : 'text-text')}>{c.firstName} {c.lastName}</p>
                          <p className={cn('text-[11px] truncate', isDark ? 'text-slate-400' : staged ? 'text-teal-900/45' : 'text-text-secondary/60')}>{c.email || c.phone}</p>
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
          <div
            className={cn(
              'p-3 rounded-xl border flex items-center justify-between',
              staged
                ? dark
                  ? 'border-emerald-400/20 bg-gradient-to-r from-emerald-500/14 to-teal-500/10 text-emerald-200'
                  : 'border-emerald-500/20 bg-emerald-50/80 text-emerald-800'
                : 'bg-emerald-50 border-emerald-200'
            )}
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className={cn(staged ? (dark ? 'text-emerald-300' : 'text-emerald-600') : 'text-emerald-600')} />
              <div>
                <p className={cn('text-sm font-medium', staged ? (dark ? 'text-white' : 'text-emerald-900') : 'text-emerald-800')}>
                  {selectedClient.firstName} {selectedClient.lastName}
                </p>
                <p className={cn('text-[11px]', staged ? (dark ? 'text-emerald-300/80' : 'text-emerald-700') : 'text-emerald-600')}>{selectedClient.email || selectedClient.phone}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearClient}
              className={cn(
                'p-1.5 rounded-lg border transition-colors',
                staged ? (dark ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white' : 'border-emerald-500/15 bg-white text-emerald-700 hover:bg-emerald-50') : 'hover:bg-emerald-100 text-emerald-600'
              )}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {!selectedClient && ownerType !== 'societe' && (
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className={cn('w-full border-t', staged ? (dark ? 'border-white/10' : 'border-teal-900/10') : 'border-border/30')} />
            </div>
            <div className="relative flex justify-center">
              <span
                className={cn(
                  'px-3 text-xs rounded-full border',
                  staged
                    ? dark
                      ? 'bg-[#0F0A1E] border-white/10 text-slate-400'
                      : 'bg-white border-teal-900/10 text-teal-900/45'
                    : 'bg-card text-text-secondary/50 border-transparent'
                )}
              >
                Pas de {clientType.toLowerCase()} dans votre liste ? Remplissez ce formulaire
              </span>
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
      </SectionCard>

      <SectionCard value="motivation" title="Motivation de vente/location" icon={TrendingUp} subtitle="Date d'achat et raisons de la mise en vente" defaultOpen>
        <FieldGrid>
          <Field>
            <DatePicker label="Date d'achat" {...register('saleInfo.purchaseDate')} />
          </Field>
          <Field>
            <Input label="Durée de mise en vente/location" {...register('saleInfo.listingDuration')} />
          </Field>
          <Field className="md:col-span-2">
            <Textarea label="Raisons de la vente/location" {...register('saleInfo.motivation')} rows={3} />
          </Field>
          <Field className="md:col-span-2">
            <Controller
              name="saleInfo.otherProperties"
              control={control}
              render={({ field }) => (
                <Checkbox label="Avez-vous d'autres biens à vendre/louer?" checked={field.value} onChange={(checked) => field.onChange(checked)} />
              )}
            />
          </Field>
          {hasOtherProperties && (
            <Field className="md:col-span-2">
              <Textarea label="Décrivez les autres biens à vendre/louer" {...register('saleInfo.otherPropertiesDescription')} rows={3} />
            </Field>
          )}
        </FieldGrid>
      </SectionCard>
    </div>
  );
}
