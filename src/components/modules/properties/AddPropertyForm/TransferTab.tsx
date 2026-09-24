import { Controller } from 'react-hook-form';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { DatePicker } from '../../../../components/ui/DatePicker';
import { RadioGroup } from '../../../../components/ui/RadioGroup/RadioGroup';
import { RadioGroupItem } from '../../../../components/ui/RadioGroup/RadioGroupItem';
import { portalPartners } from './constants';
import { Send } from 'react-feather';
import { SectionCard, SubPanel, Field } from './stage';

interface TransferTabProps {
  register: any;
  control: any;
}

export function TransferTab({ register, control }: TransferTabProps) {
  return (
    <div className="space-y-5">
      <SectionCard value="transfer" title="Transfert / Diffusion" icon={Send} subtitle="Partenaires, diffusion et publication">
        <div className="space-y-5">
          <Field>
            <SubPanel title="Partenaires actifs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {portalPartners.map((partner) => (
                  <Controller key={partner} name={`portals.${partner.toLowerCase().replace(/[\s()]+/g, '_')}`} control={control} render={({ field }) => (
                    <Checkbox label={partner} checked={field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                ))}
              </div>
            </SubPanel>
          </Field>

          <Field>
            <SubPanel title="Statut de diffusion">
              <Controller name="diffusionStatus" control={control} render={({ field }) => (
                <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-6">
                  <RadioGroupItem value="en_attente" id="ds-waiting">En attente</RadioGroupItem>
                  <RadioGroupItem value="publie" id="ds-published">Publié</RadioGroupItem>
                  <RadioGroupItem value="erreur" id="ds-error">Erreur</RadioGroupItem>
                </RadioGroup>
              )} />
            </SubPanel>
          </Field>

          <Field>
            <DatePicker label="Dernière publication" {...register('dernierePublication')} />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}
