import { Controller } from 'react-hook-form';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Briefcase } from 'react-feather';
import { SectionCard, Field, FieldGrid } from './stage';

interface CommercialTabProps {
  register: any;
  control: any;
  isGerant?: boolean;
}

export function CommercialTab({ register, control, isGerant = false }: CommercialTabProps) {
  return (
    <div className="space-y-5">
      <SectionCard value="commercial" title="Informations juridiques commerciales" icon={Briefcase} subtitle="Bail, loyer, charges et ERP">
        <FieldGrid>
          <Field>
            <Controller name="commercial.bailType" control={control} render={({ field }) => (
              <Select label="Type de bail" options={[
                { value: '', label: 'Sélectionner' },
                { value: '3_6_9', label: 'Bail 3/6/9 ans' },
                { value: 'precaire', label: 'Bail précaire' },
                { value: 'professionnel', label: 'Bail professionnel' },
              ]} value={field.value} onChange={field.onChange} />
            )} />
          </Field>
          <Field>
            <Input label="Loyer annuel (MAD)" type="number" {...register('commercial.loyerAnnuel')} />
          </Field>
          <Field>
            <Input label="Charges annuelles (MAD)" type="number" {...register('commercial.chargesAnnuelles')} />
          </Field>
          <Field>
            <Input label="Dépôt de garantie (MAD)" type="number" {...register('commercial.depotGarantie')} />
          </Field>
          <Field>
            <Controller name="commercial.erp" control={control} render={({ field }) => (
              <Select label="ERP (Établissement Recevant du Public)" options={[
                { value: '', label: 'Sélectionner' },
                { value: 'oui', label: 'Oui' },
                { value: 'non', label: 'Non' },
              ]} value={field.value} onChange={field.onChange} />
            )} />
          </Field>
        </FieldGrid>
      </SectionCard>
    </div>
  );
}
