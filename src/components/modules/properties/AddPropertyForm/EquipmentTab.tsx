import { Controller } from 'react-hook-form';
import { Input } from '../../../../components/ui/Input';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { motion } from 'framer-motion';
import { Zap, Thermometer, Droplet, Grid, Eye, Shield } from 'react-feather';
import { SectionCard, SubPanel, SubLabel, Field } from './stage';

interface EquipmentTabProps {
  control: any;
  register: any;
  watch: any;
  isGerant?: boolean;
}

export function EquipmentTab({ control, register, watch, isGerant = false }: EquipmentTabProps) {
  const watchPool = watch('pool.hasPool');
  const watchBlindDoor = watch('security.blindDoor');
  const watchCamera = watch('security.camera');

  const checkboxGrid = (items: string[], fieldPrefix: string, labelFn?: (s: string) => string) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <Controller key={item} name={`${fieldPrefix}.${item.toLowerCase()}`} control={control} render={({ field }) => (
          <Checkbox label={labelFn ? labelFn(item) : item} checked={field.value} onChange={(checked) => field.onChange(checked)} />
        )} />
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      <SectionCard value="energy" title="Énergies" icon={Zap} subtitle="Sources et modes d'énergie">
        <Field>
          {checkboxGrid(['Gaz', 'Bois', 'Solaire', 'Électrique'], 'energy')}
        </Field>
      </SectionCard>

      <SectionCard value="heating" title="Mode" icon={Thermometer} subtitle="Modes et natures de chauffage">
        <Field>
          {checkboxGrid(['Clim', 'Cheminée', 'Radiateur', 'Sol'], 'heating.mode')}
        </Field>
      </SectionCard>

      <SectionCard value="nature" title="Nature" icon={Thermometer} subtitle="Type de réseau de chauffage">
        <Field>
          {checkboxGrid(['Individuel', 'Collectif', 'Centrale', 'Aucun'], 'heating.nature')}
        </Field>
      </SectionCard>

      <SectionCard value="water" title="Eau" icon={Droplet} subtitle="Source et réseau d'eau">
        <Field>
          {checkboxGrid(['ONEP', 'Cuve', 'Puits', 'Pompe'], 'water')}
        </Field>
      </SectionCard>

      <SectionCard value="windows" title="Fenêtres" icon={Grid} subtitle="Matériaux et vitrage">
        <div className="space-y-4">
          <Field>
            <SubPanel title="Matériaux">
              {checkboxGrid(['Alu', 'Bois', 'PVC'], 'windows.material')}
            </SubPanel>
          </Field>
          <Field>
            <SubPanel title="Vitrage">
              {checkboxGrid(['Double', 'Simple', 'Survitrage'], 'windows.glass')}
            </SubPanel>
          </Field>
        </div>
      </SectionCard>

      <SectionCard value="shutters" title="Volets" icon={Grid} subtitle="Types et matériaux des volets">
        <Field>
          {checkboxGrid(['Électrique', 'Bois', 'Roulant manuel', 'Aucun'], 'shutters', (s) => s)}
        </Field>
      </SectionCard>

      <SectionCard value="gate" title="Portail" icon={Shield} subtitle="Type d'ouverture et matériau">
        <div className="space-y-4">
          <Field>
            <SubPanel title="Type d'ouverture">
              {checkboxGrid(['Automatique', 'Manuel'], 'gate.opening')}
            </SubPanel>
          </Field>
          <Field>
            <SubPanel title="Matériau">
              {checkboxGrid(['Fer', 'Alu', 'Bois', 'Aucun'], 'gate.material')}
            </SubPanel>
          </Field>
        </div>
      </SectionCard>

      <SectionCard value="pool" title="Piscine" icon={Droplet} subtitle="Caractéristiques et équipements">
        <div className="space-y-4">
          <Field>
            <Controller name="pool.hasPool" control={control} render={({ field }) => (
              <Checkbox label="Piscine" checked={field.value} onChange={(checked) => field.onChange(checked)} />
            )} />
          </Field>
          {watchPool && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Mesure (___/___)" {...register('pool.measurement')} />
                  <Input label="Revêtement" {...register('pool.coating')} />
                  <Input label="Traitement" {...register('pool.treatment')} className="md:col-span-2" />
                </div>
              </Field>
              <Field>
                <SubPanel title="Équipements complémentaires">
                  {checkboxGrid(['Couverture', 'Douche', 'Aspirateur', 'Pompe', 'Lumière'], 'pool.equipment')}
                </SubPanel>
              </Field>
            </motion.div>
          )}
        </div>
      </SectionCard>

      <SectionCard value="security" title="Sécurité" icon={Eye} subtitle="Alarme, caméras et contrôle d'accès">
        <div className="space-y-4">
          <Field>
            <SubPanel>
              {checkboxGrid(['Alarme', 'Vidéophone', 'Interphone'], 'security')}
            </SubPanel>
          </Field>
          <Field>
            <SubPanel>
              <div className="flex items-center gap-4">
                <Controller name="security.blindDoor" control={control} render={({ field }) => (
                  <Checkbox label="Porte blindée" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                )} />
                {watchBlindDoor && (
                  <Input label="Nombre" type="number" {...register('security.blindDoorCount')} className="w-24" />
                )}
              </div>
            </SubPanel>
          </Field>
          <Field>
            <SubPanel>
              <div className="flex items-center gap-4">
                <Controller name="security.camera" control={control} render={({ field }) => (
                  <Checkbox label="Caméra" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                )} />
                {watchCamera && (
                  <Input label="Nombre" type="number" {...register('security.cameraCount')} className="w-24" />
                )}
              </div>
            </SubPanel>
          </Field>
          <Field>
            <SubPanel>
              <Input label="Piscine sécurisée" {...register('security.poolSecurity')} />
            </SubPanel>
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}
