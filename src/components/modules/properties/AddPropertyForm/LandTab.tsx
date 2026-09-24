import { Controller } from 'react-hook-form';
import { DatePicker } from '../../../../components/ui/DatePicker';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Maximize, Zap, Map, Triangle } from 'react-feather';
import { SectionCard, SubPanel, Field, FieldGrid } from './stage';

interface LandTabProps {
  register: any;
  control: any;
  isGerant?: boolean;
}

export function LandTab({ register, control, isGerant = false }: LandTabProps) {
  return (
    <div className="space-y-5">
      <SectionCard value="constructibility" title="Constructibilité" icon={Maximize} subtitle="Coefficients, COS et surface">
        <FieldGrid>
          <Field>
            <Controller name="land.constructible" control={control} render={({ field }) => (
              <SubPanel title="Constructible">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="land_constructible" checked={field.value === true} onChange={() => field.onChange(true)} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                    <span className="text-sm">Oui</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="land_constructible" checked={field.value === false} onChange={() => field.onChange(false)} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                    <span className="text-sm">Non</span>
                  </label>
                </div>
              </SubPanel>
            )} />
          </Field>
          <Field>
            <Input label="COS (Coefficient d'Occupation des Sols)" type="number" step="0.01" {...register('land.cos')} />
          </Field>
          <Field className="md:col-span-2">
            <Input label="SHON max (m²)" type="number" {...register('land.shon')} />
          </Field>
        </FieldGrid>
      </SectionCard>

      <SectionCard value="connections" title="Raccordements" icon={Zap} subtitle="Eau, électricité, assainissement et gaz">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Eau', 'Électricité', 'Assainissement', 'Gaz'].map((util) => (
            <Field key={util}>
              <SubPanel title={util}>
                <Controller name={`land.connections.${util.toLowerCase()}`} control={control} render={({ field }) => (
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1 cursor-pointer text-sm">
                      <input type="radio" name={`conn_${util}`} checked={field.value === true} onChange={() => field.onChange(true)} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} /> Oui
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer text-sm">
                      <input type="radio" name={`conn_${util}`} checked={field.value === false} onChange={() => field.onChange(false)} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} /> Non
                    </label>
                  </div>
                )} />
              </SubPanel>
            </Field>
          ))}
        </div>
      </SectionCard>

      <SectionCard value="urbanism" title="Urbanisme" icon={Map} subtitle="PLU, certificat, zonage">
        <FieldGrid>
          <Field>
            <Input label="PLU applicable" {...register('land.urbanism.plu')} />
          </Field>
          <Field>
            <Controller name="land.urbanism.certificatUrbanisme" control={control} render={({ field }) => (
              <Select label="Certificat d'urbanisme" options={[
                { value: '', label: 'Sélectionner' },
                { value: 'obtenu', label: 'Obtenu' },
                { value: 'en_cours', label: 'En cours' },
                { value: 'non_demande', label: 'Non demandé' },
              ]} value={field.value} onChange={field.onChange} />
            )} />
          </Field>
          <Field>
            <DatePicker label="Date du certificat" {...register('land.urbanism.certificatDate')} />
          </Field>
          <Field>
            <Controller name="land.urbanism.zonage" control={control} render={({ field }) => (
              <Select label="Zonage" options={[
                { value: '', label: 'Sélectionner' },
                { value: 'constructible', label: 'Constructible' },
                { value: 'agricole', label: 'Agricole' },
                { value: 'inondable', label: 'Inondable' },
                { value: 'naturel', label: 'Naturel' },
                { value: 'urbain', label: 'Urbain' },
              ]} value={field.value} onChange={field.onChange} />
            )} />
          </Field>
        </FieldGrid>
      </SectionCard>

      <SectionCard value="topography" title="Topographie" icon={Triangle} subtitle="Terrain et vue">
        <div className="space-y-4">
          <Field>
            <SubPanel title="Terrain">
              <Controller name="land.topography.type" control={control} render={({ field }) => (
                <div className="flex gap-6">
                  {['Plat', 'En pente', 'Accidenté'].map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="topography_type" checked={field.value === t.toLowerCase()} onChange={() => field.onChange(t.toLowerCase())} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                      <span className="text-sm">{t}</span>
                    </label>
                  ))}
                </div>
              )} />
            </SubPanel>
          </Field>
          <Field>
            <SubPanel title="Vue">
              <Controller name="land.topography.view" control={control} render={({ field }) => (
                <div className="flex gap-6">
                  {['Dégagée', 'Montagne', 'Mer'].map((v) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="topography_view" checked={field.value === v.toLowerCase()} onChange={() => field.onChange(v.toLowerCase())} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                      <span className="text-sm">{v}</span>
                    </label>
                  ))}
                </div>
              )} />
            </SubPanel>
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}
