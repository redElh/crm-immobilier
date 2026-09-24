import { Controller } from 'react-hook-form';
import { Input } from '../../../../components/ui/Input';
import { RadioGroup } from '../../../../components/ui/RadioGroup/RadioGroup';
import { RadioGroupItem } from '../../../../components/ui/RadioGroup/RadioGroupItem';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { Select } from '../../../../components/ui/Select';
import { TrendingUp } from 'react-feather';
import { SectionCard, Field, FieldGrid } from './stage';

interface PricingTabProps {
  register: any;
  control: any;
  watch: any;
  propertyType: string;
  isGerant?: boolean;
}

export function PricingTab({ register, control, watch, propertyType, isGerant = false }: PricingTabProps) {
  const transactionType = watch('transactionType') || 'vente';
  const devise = watch('devise') || 'MAD';
  const honorairesType = watch('honorairesType');
  const prixNet = watch('prixNetVendeur');
  const honorairesPct = watch('honorairesPct');
  const prixAffiche = prixNet && honorairesPct
    ? honorairesType === 'inclus'
      ? Math.round(Number(prixNet) / (1 - Number(honorairesPct) / 100))
      : Math.round(Number(prixNet) * (1 + Number(honorairesPct) / 100))
    : prixNet || '';
  const honorairesMontant = prixNet && honorairesPct
    ? Math.round(Number(prixAffiche) - Number(prixNet))
    : 0;
  const loyerHC = watch('loyerHC');
  const charges = watch('charges');
  const isSeasonal = propertyType === 'vacation';
  const isLuxury = propertyType === 'luxury';
  const seasonalMin = Number(watch('seasonalPriceMin')) || 0;
  const seasonalMax = Number(watch('seasonalPriceMax')) || 0;

  const fmt = (v: number) => `${v.toLocaleString('fr-FR')} ${devise}`;

  if (isSeasonal) {
    const weekMin = seasonalMin * 7;
    const weekMax = seasonalMax * 7;
    const monthMin = seasonalMin * 30;
    const monthMax = seasonalMax * 30;

    return (
      <div className="space-y-5">
        <SectionCard value="pricing" title="Tarifs saisonniers" icon={TrendingUp} subtitle="Prix par nuit, semaine et mois" defaultOpen>
          <FieldGrid>
            <Field>
              <Input label="Prix par nuit (min)" type="number" {...register('seasonalPriceMin')} required />
            </Field>
            <Field>
              <Input label="Prix par nuit (max)" type="number" {...register('seasonalPriceMax')} required />
            </Field>
            <Field>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Prix semaine</label>
              <div className="h-10 px-3 flex items-center rounded-lg border border-border bg-background/50 text-sm text-text">
                {seasonalMin > 0 || seasonalMax > 0
                  ? `${fmt(weekMin)} ~ ${fmt(weekMax)}`
                  : '—'}
              </div>
              <input type="hidden" {...register('seasonalPriceWeek')} value={seasonalMin > 0 || seasonalMax > 0 ? Math.round((weekMin + weekMax) / 2) : ''} />
            </Field>
            <Field>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Prix mois</label>
              <div className="h-10 px-3 flex items-center rounded-lg border border-border bg-background/50 text-sm text-text">
                {seasonalMin > 0 || seasonalMax > 0
                  ? `${fmt(monthMin)} ~ ${fmt(monthMax)}`
                  : '—'}
              </div>
              <input type="hidden" {...register('seasonalPriceMonth')} value={seasonalMin > 0 || seasonalMax > 0 ? Math.round((monthMin + monthMax) / 2) : ''} />
            </Field>
            <Field>
              <Controller name="devise" control={control} render={({ field }) => (
                <Select label="Devise" options={[
                  { value: 'MAD', label: 'MAD' },
                  { value: 'EUR', label: 'EUR' },
                  { value: 'USD', label: 'USD' },
                ]} value={field.value} onChange={field.onChange} />
              )} />
            </Field>
            <Field>
              <Input label="Capacité maximum" type="number" {...register('sleepingCapacity')} />
            </Field>
          </FieldGrid>
        </SectionCard>
      </div>
    );
  }

  if (isLuxury) {
    return (
      <div className="space-y-5">
        <SectionCard value="pricing" title="Prix" icon={TrendingUp} subtitle="Prix, estimation et confidentialité" defaultOpen>
          <FieldGrid>
            <Field>
              <Controller name="prixSurDemande" control={control} render={({ field }) => (
                <Checkbox label="Prix sur demande (masqué)" checked={field.value} onChange={(c) => field.onChange(c)} />
              )} />
            </Field>
            <Field>
              <Controller name="prixConfidentiel" control={control} render={({ field }) => (
                <Checkbox label="Prix confidentiel (visible agent seulement)" checked={field.value} onChange={(c) => field.onChange(c)} />
              )} />
            </Field>
            <Field>
              <Controller name="devise" control={control} render={({ field }) => (
                <Select label="Devise" options={[
                  { value: 'MAD', label: 'MAD' },
                  { value: 'EUR', label: 'EUR' },
                  { value: 'USD', label: 'USD' },
                ]} value={field.value} onChange={field.onChange} />
              )} />
            </Field>
            <Field>
              <Input label={`Prix (${devise})`} type="number" {...register('prixNetVendeur')} />
              <input type="hidden" {...register('price')} value={prixNet || ''} />
            </Field>
            <Field>
              <Input label={`Estimation (${devise})`} type="number" {...register('estimation')} />
            </Field>
          </FieldGrid>
        </SectionCard>
      </div>
    );
  }

  if (transactionType === 'location_ld') {
    return (
      <div className="space-y-5">
        <SectionCard value="pricing" title="Prix et Honoraires - Location" icon={TrendingUp} subtitle="Loyer, charges et dépôt de garantie" defaultOpen>
          <FieldGrid>
            <Field>
              <Controller name="devise" control={control} render={({ field }) => (
                <Select label="Devise" options={[
                  { value: 'MAD', label: 'MAD' },
                  { value: 'EUR', label: 'EUR' },
                  { value: 'USD', label: 'USD' },
                ]} value={field.value} onChange={field.onChange} />
              )} />
            </Field>
            <Field>
              <Input label={`Loyer mensuel HC (${devise})`} type="number" {...register('loyerHC')} required />
              <input type="hidden" {...register('price')} value={loyerHC || ''} />
            </Field>
            <Field>
              <Input label={`Charges mensuelles (${devise})`} type="number" {...register('charges')} />
            </Field>
            <Field>
              <Input label={`Loyer CC (${devise})`} type="number" value={loyerHC && charges ? Number(loyerHC) + Number(charges) : ''} readOnly />
            </Field>
            <Field>
              <Controller name="depotGarantie" control={control} render={({ field }) => (
                <Select label="Dépôt de garantie" options={[
                  { value: '1_mois', label: '1 mois' },
                  { value: '2_mois', label: '2 mois' },
                  { value: '3_mois', label: '3 mois' },
                ]} value={field.value} onChange={field.onChange} />
              )} />
            </Field>
            <Field>
              <Input label={`Honoraires de location (${devise})`} type="number" {...register('honorairesLocation')} />
            </Field>
          </FieldGrid>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard value="pricing" title="Prix et Honoraires" icon={TrendingUp} subtitle="Prix net, honoraires et négociation" defaultOpen>
        <FieldGrid>
          <Field>
            <Controller name="devise" control={control} render={({ field }) => (
              <Select label="Devise" options={[
                { value: 'MAD', label: 'MAD' },
                { value: 'EUR', label: 'EUR' },
                { value: 'USD', label: 'USD' },
              ]} value={field.value} onChange={field.onChange} />
            )} />
          </Field>
          <Field>
            <Input label={`Prix net vendeur (${devise})`} type="number" {...register('prixNetVendeur')} required />
          </Field>

          <Field>
            <Controller name="honorairesType" control={control} render={({ field }) => (
              <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                <h4 className="font-medium text-sm text-text mb-2">Type d'honoraires</h4>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4">
                  <RadioGroupItem value="inclus" id="ht-inclus">Inclus dans prix</RadioGroupItem>
                  <RadioGroupItem value="en_sus" id="ht-sus">En sus du prix</RadioGroupItem>
                </RadioGroup>
              </div>
            )} />
          </Field>

          <Field>
            <Input label="Honoraires (%)" type="number" step="0.1" {...register('honorairesPct')} />
          </Field>

          <Field>
            <Input label={`Prix affiché (${devise})`} type="number" value={prixAffiche || ''} readOnly />
            <input type="hidden" {...register('price')} value={prixAffiche || ''} />
            {honorairesMontant > 0 && (
              <p className="text-xs text-text-secondary mt-1">
                Dont honoraires&nbsp;: {honorairesMontant.toLocaleString('fr-FR')} {devise}
                &nbsp;({honorairesType === 'inclus' ? 'inclus' : 'en sus'})
              </p>
            )}
          </Field>

          <Field className="md:col-span-2">
            <div className="p-4 rounded-lg bg-background/50 border border-border/30">
              <div className="flex items-center gap-4">
                <Controller name="negociable" control={control} render={({ field }) => (
                  <Checkbox label="Prix négociable" checked={field.value} onChange={(c) => field.onChange(c)} />
                )} />
                <Input label={`Prix minimum (${devise})`} type="number" {...register('prixMinimum')} className="w-48" />
              </div>
            </div>
          </Field>

          <Field>
            <Input label={`Prix évalué par expertise (${devise})`} type="number" {...register('prixExpertise')} />
          </Field>
        </FieldGrid>
      </SectionCard>
    </div>
  );
}
