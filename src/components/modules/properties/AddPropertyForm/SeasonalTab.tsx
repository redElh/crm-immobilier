import { Controller } from 'react-hook-form';
import { Input } from '../../../../components/ui/Input';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { DatePicker } from '../../../../components/ui/DatePicker';
import { Map, Clipboard } from 'react-feather';
import { SectionCard, Field, FieldGrid } from './stage';

const PERIODS = [
  { key: 'basse_saison', name: 'Basse saison' },
  { key: 'saison_intermediaire', name: 'Saison intermédiaire' },
  { key: 'haute_saison', name: 'Haute saison' },
  { key: 'evenements', name: 'Événements' },
];

const OPTIONS = [
  { key: 'menage_fin_de_sejour', name: 'Ménage fin de séjour' },
  { key: 'petit_dejeuner', name: 'Petit-déjeuner' },
  { key: 'parking_prive', name: 'Parking privé' },
  { key: 'panier_de_bienvenue', name: 'Panier de bienvenue' },
  { key: 'lit_bebe', name: 'Lit bébé' },
  { key: 'location_serviettes_plage', name: 'Location serviettes plage' },
];

interface SeasonalTabProps {
  register: any;
  control: any;
  watch: any;
  isGerant?: boolean;
}

export function SeasonalTab({ register, control, watch, isGerant = false }: SeasonalTabProps) {
  return (
    <div className="space-y-5">
      <SectionCard value="priceGrid" title="Grille tarifaire" icon={Map} subtitle="Dates et prix par période" defaultOpen>
        <div className="overflow-x-auto rounded-lg border border-border/30">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-background/50">
                <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Période</th>
                <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Début</th>
                <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Fin</th>
                <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Prix/nuit</th>
                <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Min nuits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {PERIODS.map((period) => (
                <tr key={period.key} className="hover:bg-background/30 transition-colors">
                  <td className="p-3 font-medium text-text whitespace-nowrap">{period.name}</td>
                  <td className="p-3 min-w-[180px]">
                    <Controller
                      name={`priceGrid.${period.key}.start`}
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Sélectionner"
                        />
                      )}
                    />
                  </td>
                  <td className="p-3 min-w-[180px]">
                    <Controller
                      name={`priceGrid.${period.key}.end`}
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Sélectionner"
                        />
                      )}
                    />
                  </td>
                  <td className="p-3"><Input type="number" {...register(`priceGrid.${period.key}.price`)} /></td>
                  <td className="p-3"><Input type="number" {...register(`priceGrid.${period.key}.minNights`)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard value="options" title="Options et services" icon={Clipboard} subtitle="Services inclus et tarifs" defaultOpen>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {OPTIONS.map((opt) => (
            <div key={opt.key} className="p-3 rounded-lg bg-background/50 border border-border/30">
              <Controller name={`options.${opt.key}.enabled`} control={control} render={({ field }) => (
                <Checkbox label={opt.name} checked={field.value} onChange={(c) => field.onChange(c)} />
              )} />
              <Input type="number" placeholder="Prix" {...register(`options.${opt.key}.price`)} className="mt-2" />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
