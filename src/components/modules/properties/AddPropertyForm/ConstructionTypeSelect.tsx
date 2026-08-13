import { Controller, Control, UseFormSetValue } from 'react-hook-form';
import { Select } from '../../../../components/ui/Select';
import { propertyTypeOptions, propertyTypeSubTypes } from './constants';

interface ConstructionTypeSelectProps {
  control: Control<any>;
  setFormValue: UseFormSetValue<any>;
}

export function ConstructionTypeSelect({ control, setFormValue }: ConstructionTypeSelectProps) {
  return (
    <Controller
      name="constructionType"
      control={control}
      render={({ field }) => (
        <Select
          label="Type de bien"
          options={propertyTypeOptions}
          value={field.value}
          onChange={(val) => {
            field.onChange(val);
            setFormValue('constructionSubType', '');
          }}
          required
        />
      )}
    />
  );
}

export function hasConstructionSubType(type?: string) {
  return !!type && !!propertyTypeSubTypes[type] && propertyTypeSubTypes[type].length > 0;
}

interface ConstructionSubTypeSelectProps {
  control: Control<any>;
  type?: string;
}

export function ConstructionSubTypeSelect({ control, type }: ConstructionSubTypeSelectProps) {
  const options = type ? propertyTypeSubTypes[type] || [] : [];
  if (options.length === 0) return null;

  return (
    <Controller
      name="constructionSubType"
      control={control}
      render={({ field }) => (
        <Select
          label="Sous-type"
          options={options}
          value={field.value}
          onChange={field.onChange}
          required
        />
      )}
    />
  );
}
