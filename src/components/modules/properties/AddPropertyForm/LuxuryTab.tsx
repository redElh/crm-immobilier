import { Controller } from 'react-hook-form';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { Shield } from 'react-feather';
import { SectionCard, Field, FieldGrid } from './stage';

interface LuxuryTabProps {
  register: any;
  control: any;
  isGerant?: boolean;
}

export function LuxuryTab({ register, control, isGerant = false }: LuxuryTabProps) {
  return (
    <div className="space-y-5">
      <SectionCard value="confidentiality" title="Confidentialité" icon={Shield} subtitle="Adresse masquée, visites sur demande">
        <FieldGrid>
          <Field>
            <Controller name="luxuryConfidentiality.hideAddress" control={control} render={({ field }) => (
              <Checkbox label="Adresse masquée" checked={field.value} onChange={(c) => field.onChange(c)} />
            )} />
          </Field>
          <Field>
            <Controller name="luxuryConfidentiality.visitsOnDemand" control={control} render={({ field }) => (
              <Checkbox label="Visites sur demande" checked={field.value} onChange={(c) => field.onChange(c)} />
            )} />
          </Field>
          <Field className="md:col-span-2">
            <Controller name="luxuryConfidentiality.confidentialityAgreement" control={control} render={({ field }) => (
              <Checkbox label="Accords de confidentialité requis" checked={field.value} onChange={(c) => field.onChange(c)} />
            )} />
          </Field>
        </FieldGrid>
      </SectionCard>
    </div>
  );
}
