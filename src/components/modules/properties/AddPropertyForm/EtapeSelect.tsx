import { Controller, Control, UseFormSetValue } from 'react-hook-form';
import { Select } from '../../../../components/ui/Select';
import { etapeOptions, etapeEnAttenteOptions, etapeTermineOptions, etapeSupprimeOptions } from './constants';

interface EtapeSelectProps {
  control: Control<any>;
  setFormValue: UseFormSetValue<any>;
}

export function EtapeSelect({ control, setFormValue }: EtapeSelectProps) {
  return (
    <Controller
      name="etape"
      control={control}
      render={({ field }) => (
        <Select
          label="Étape"
          options={etapeOptions}
          value={field.value}
          onChange={(val) => {
            field.onChange(val);
            setFormValue('etapeDetail', val === 'supprime' ? 'detruire_fiche' : '');
          }}
          required
        />
      )}
    />
  );
}

export function etapeHasDetail(etape?: string) {
  return etape === 'en_attente' || etape === 'termine' || etape === 'supprime';
}

interface EtapeDetailSelectProps {
  control: Control<any>;
  etape?: string;
}

export function EtapeDetailSelect({ control, etape }: EtapeDetailSelectProps) {
  const detailOptions =
    etape === 'en_attente' ? etapeEnAttenteOptions
    : etape === 'termine' ? etapeTermineOptions
    : etape === 'supprime' ? etapeSupprimeOptions
    : [];

  const detailLabel = etape === 'supprime' ? 'Action' : 'Détail';

  if (detailOptions.length === 0) return null;

  return (
    <Controller
      name="etapeDetail"
      control={control}
      render={({ field }) => (
        <Select
          label={detailLabel}
          options={detailOptions}
          value={field.value}
          onChange={field.onChange}
          disabled={etape === 'supprime'}
        />
      )}
    />
  );
}
