import { Controller } from 'react-hook-form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { Input } from '../../../../components/ui/Input';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 }
  }
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 }
};

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

  const sections = [
    { value: 'energy', label: 'Énergies', color: isGerant ? 'bg-[#905D5D]' : 'bg-accent', content: checkboxGrid(['Gaz', 'Bois', 'Solaire', 'Électrique'], 'energy') },
    { value: 'heating', label: 'Mode', color: isGerant ? 'bg-[#905D5D]' : 'bg-accent', content: checkboxGrid(['Clim', 'Cheminée', 'Radiateur', 'Sol'], 'heating.mode') },
    { value: 'nature', label: 'Nature', color: isGerant ? 'bg-[#905D5D]' : 'bg-accent', content: checkboxGrid(['Individuel', 'Collectif', 'Centrale', 'Aucun'], 'heating.nature') },
    { value: 'water', label: 'Eau', color: isGerant ? 'bg-[#905D5D]' : 'bg-accent', content: checkboxGrid(['ONEP', 'Cuve', 'Puits', 'Pompe'], 'water') },
    {
      value: 'windows', label: 'Fenêtre', color: 'bg-interactive',
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-background/50 border border-border/30">
            <h4 className="font-medium text-xs text-text-secondary uppercase tracking-wider mb-3">Matériaux</h4>
            {checkboxGrid(['Alu', 'Bois', 'PVC'], 'windows.material')}
          </div>
          <div className="p-4 rounded-lg bg-background/50 border border-border/30">
            <h4 className="font-medium text-xs text-text-secondary uppercase tracking-wider mb-3">Vitrage</h4>
            {checkboxGrid(['Double', 'Simple', 'Survitrage'], 'windows.glass')}
          </div>
        </div>
      )
    },
    { value: 'shutters', label: 'Volets', color: 'bg-interactive' as const, content: checkboxGrid(['Électrique', 'Bois', 'Roulant manuel', 'Aucun'], 'shutters', (s) => s) },
    {
      value: 'gate', label: 'Portail', color: 'bg-premium' as const,
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-background/50 border border-border/30">
            <h4 className="font-medium text-xs text-text-secondary uppercase tracking-wider mb-3">Type d'ouverture</h4>
            {checkboxGrid(['Automatique', 'Manuel'], 'gate.opening')}
          </div>
          <div className="p-4 rounded-lg bg-background/50 border border-border/30">
            <h4 className="font-medium text-xs text-text-secondary uppercase tracking-wider mb-3">Matériau</h4>
            {checkboxGrid(['Fer', 'Alu', 'Bois', 'Aucun'], 'gate.material')}
          </div>
        </div>
      )
    },
    {
      value: 'pool', label: 'Piscine', color: 'bg-premium' as const,
      content: (
        <div className="space-y-4">
          <Controller name="pool.hasPool" control={control} render={({ field }) => (
            <Checkbox label="Piscine" checked={field.value} onChange={(checked) => field.onChange(checked)} />
          )} />
          {watchPool && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Mesure (___/___)" {...register('pool.measurement')} />
                <Input label="Revêtement" {...register('pool.coating')} />
                <Input label="Traitement" {...register('pool.treatment')} className="md:col-span-2" />
              </div>
              <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                <h4 className="font-medium text-xs text-text-secondary uppercase tracking-wider mb-3">Équipements complémentaires</h4>
                {checkboxGrid(['Couverture', 'Douche', 'Aspirateur', 'Pompe', 'Lumière'], 'pool.equipment')}
              </div>
            </motion.div>
          )}
        </div>
      )
    },
    {
      value: 'security', label: 'Sécurité', color: 'bg-premium' as const,
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-background/50 border border-border/30">
            {checkboxGrid(['Alarme', 'Vidéophone', 'Interphone'], 'security')}
          </div>
          <div className="p-4 rounded-lg bg-background/50 border border-border/30">
            <div className="flex items-center gap-4">
              <Controller name="security.blindDoor" control={control} render={({ field }) => (
                <Checkbox label="Porte blindée" checked={field.value} onChange={(checked) => field.onChange(checked)} />
              )} />
              {watchBlindDoor && (
                <Input label="Nombre" type="number" {...register('security.blindDoorCount')} className="w-24" />
              )}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-background/50 border border-border/30">
            <div className="flex items-center gap-4">
              <Controller name="security.camera" control={control} render={({ field }) => (
                <Checkbox label="Caméra" checked={field.value} onChange={(checked) => field.onChange(checked)} />
              )} />
              {watchCamera && (
                <Input label="Nombre" type="number" {...register('security.cameraCount')} className="w-24" />
              )}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-background/50 border border-border/30">
            <Input label="Piscine sécurisée" {...register('security.poolSecurity')} />
          </div>
        </div>
      )
    },
  ];

  return (
    <MotionCard
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="p-0 overflow-hidden"
    >
      <Accordion type="multiple" defaultValue={['energy', 'windows', 'pool', 'security']} className="space-y-0">
        {sections.map((section, idx) => (
          <AccordionItem key={section.value} value={section.value} className={`border-0 ${idx > 0 ? 'border-t border-border/40' : ''}`}>
            <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${section.color}`} />
                <span className="font-medium text-text">{section.label}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
              >
                {section.content}
              </motion.div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </MotionCard>
  );
}
