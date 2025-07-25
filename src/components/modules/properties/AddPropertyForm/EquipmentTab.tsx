import { Controller } from 'react-hook-form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { Input } from '../../../../components/ui/Input';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

interface EquipmentTabProps {
  control: any;
  register: any;
  watch: any;
}

export function EquipmentTab({ control, register, watch }: EquipmentTabProps) {
  const watchPool = watch('pool.hasPool');
  const watchBlindDoor = watch('security.blindDoor');
  const watchCamera = watch('security.camera');

  return (
    <MotionCard
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 glass-card rounded-glass"
    >
      <Accordion type="multiple" defaultValue={['energy', 'windows', 'pool', 'security']} className="space-y-4">
        {/* 1. ENERGIES */}
        <AccordionItem value="energy" className="glass-card rounded-glass overflow-hidden">
          <AccordionTrigger className="px-6 py-4 hover:bg-white/10 transition-colors duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span className="font-medium text-gray-900">ENERGIES</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-2 pb-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/10 rounded-glass"
            >
              {['Gaz', 'Bois', 'Solaire', 'Électrique'].map((energy) => (
                <Controller
                  key={energy}
                  name={`energy.${energy.toLowerCase()}`}
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      label={energy}
                      checked={field.value}
                      onChange={(checked) => field.onChange(checked)}
                      className="text-indigo-400 focus:ring-indigo-400"
                    />
                  )}
                />
              ))}
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        {/* 2. MODE */}
        <AccordionItem value="heating" className="glass-card rounded-glass overflow-hidden">
          <AccordionTrigger className="px-6 py-4 hover:bg-white/10 transition-colors duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span className="font-medium text-gray-900">MODE</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-2 pb-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/10 rounded-glass"
            >
              {['Clim', 'Cheminée', 'Radiateur', 'Sol'].map((mode) => (
                <Controller
                  key={mode}
                  name={`heating.mode.${mode.toLowerCase()}`}
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      label={mode}
                      checked={field.value}
                      onChange={(checked) => field.onChange(checked)}
                      className="text-indigo-400 focus:ring-indigo-400"
                    />
                  )}
                />
              ))}
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        {/* 3. NATURE */}
        <AccordionItem value="nature" className="glass-card rounded-glass overflow-hidden">
          <AccordionTrigger className="px-6 py-4 hover:bg-white/10 transition-colors duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span className="font-medium text-gray-900">NATURE</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-2 pb-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/10 rounded-glass"
            >
              {['Individuel', 'Collectif', 'Centrale', 'Aucun'].map((nature) => (
                <Controller
                  key={nature}
                  name={`heating.nature.${nature.toLowerCase()}`}
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      label={nature}
                      checked={field.value}
                      onChange={(checked) => field.onChange(checked)}
                      className="text-indigo-400 focus:ring-indigo-400"
                    />
                  )}
                />
              ))}
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        {/* 4. EAU */}
        <AccordionItem value="water" className="glass-card rounded-glass overflow-hidden">
          <AccordionTrigger className="px-6 py-4 hover:bg-white/10 transition-colors duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span className="font-medium text-gray-900">EAU</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-2 pb-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/10 rounded-glass"
            >
              {['ONEP', 'Cuve', 'Puits', 'Pompe'].map((source) => (
                <Controller
                  key={source}
                  name={`water.${source.toLowerCase()}`}
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      label={source}
                      checked={field.value}
                      onChange={(checked) => field.onChange(checked)}
                      className="text-indigo-400 focus:ring-indigo-400"
                    />
                  )}
                />
              ))}
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        {/* 5. FENÊTRE */}
        <AccordionItem value="windows" className="glass-card rounded-glass overflow-hidden">
          <AccordionTrigger className="px-6 py-4 hover:bg-white/10 transition-colors duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span className="font-medium text-gray-900">FENÊTRE</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-2 pb-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="space-y-6"
            >
              <div className="p-4 bg-white/10 rounded-glass">
                <h4 className="font-medium mb-3 text-sm">Matériaux</h4>
                <div className="grid grid-cols-3 gap-4">
                  {['Alu', 'Bois', 'PVC'].map((material) => (
                    <Controller
                      key={material}
                      name={`windows.material.${material.toLowerCase()}`}
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          label={material}
                          checked={field.value}
                          onChange={(checked) => field.onChange(checked)}
                          className="text-indigo-400 focus:ring-indigo-400"
                        />
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="p-4 bg-white/10 rounded-glass">
                <h4 className="font-medium mb-3 text-sm">Vitrage</h4>
                <div className="grid grid-cols-3 gap-4">
                  {['Double', 'Simple', 'Survitrage'].map((glass) => (
                    <Controller
                      key={glass}
                      name={`windows.glass.${glass.toLowerCase()}`}
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          label={glass}
                          checked={field.value}
                          onChange={(checked) => field.onChange(checked)}
                          className="text-indigo-400 focus:ring-indigo-400"
                        />
                      )}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        {/* 6. VOLETS */}
        <AccordionItem value="shutters" className="glass-card rounded-glass overflow-hidden">
          <AccordionTrigger className="px-6 py-4 hover:bg-white/10 transition-colors duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span className="font-medium text-gray-900">VOLETS</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-2 pb-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/10 rounded-glass"
            >
              {['Électrique', 'Bois', 'Roulant manuel', 'Aucun'].map((shutter) => (
                <Controller
                  key={shutter}
                  name={`shutters.${shutter.toLowerCase().replace(' ', '_')}`}
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      label={shutter}
                      checked={field.value}
                      onChange={(checked) => field.onChange(checked)}
                      className="text-indigo-400 focus:ring-indigo-400"
                    />
                  )}
                />
              ))}
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        {/* 7. PORTAIL */}
        <AccordionItem value="gate" className="glass-card rounded-glass overflow-hidden">
          <AccordionTrigger className="px-6 py-4 hover:bg-white/10 transition-colors duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span className="font-medium text-gray-900">PORTAIL</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-2 pb-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="space-y-6"
            >
              <div className="p-4 bg-white/10 rounded-glass">
                <h4 className="font-medium mb-3 text-sm">Type d'ouverture</h4>
                <div className="grid grid-cols-2 gap-4">
                  {['Automatique', 'Manuel'].map((type) => (
                    <Controller
                      key={type}
                      name={`gate.opening.${type.toLowerCase()}`}
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          label={type}
                          checked={field.value}
                          onChange={(checked) => field.onChange(checked)}
                          className="text-indigo-400 focus:ring-indigo-400"
                        />
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="p-4 bg-white/10 rounded-glass">
                <h4 className="font-medium mb-3 text-sm">Matériau</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Fer', 'Alu', 'Bois', 'Aucun'].map((material) => (
                    <Controller
                      key={material}
                      name={`gate.material.${material.toLowerCase()}`}
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          label={material}
                          checked={field.value}
                          onChange={(checked) => field.onChange(checked)}
                          className="text-indigo-400 focus:ring-indigo-400"
                        />
                      )}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        {/* 8. PISCINE */}
        <AccordionItem value="pool" className="glass-card rounded-glass overflow-hidden">
          <AccordionTrigger className="px-6 py-4 hover:bg-white/10 transition-colors duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span className="font-medium text-gray-900">PISCINE</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-2 pb-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="space-y-6"
            >
              <Controller
                name="pool.hasPool"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    label="Piscine"
                    checked={field.value}
                    onChange={(checked) => field.onChange(checked)}
                    className="text-indigo-400 focus:ring-indigo-400 mb-4"
                  />
                )}
              />

              {watchPool && (
                <>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-white/10 rounded-glass">
                    <Input
                      label="Mesure (___/___)"
                      {...register('pool.measurement')}
                      className="focus:border-indigo-400"
                    />
                    <Input
                      label="Revêtement"
                      {...register('pool.coating')}
                      className="focus:border-indigo-400"
                    />
                    <Input
                      label="Traitement"
                      {...register('pool.treatment')}
                      className="focus:border-indigo-400 col-span-2"
                    />
                  </div>

                  <div className="p-4 bg-white/10 rounded-glass">
                    <h4 className="font-medium mb-3 text-sm">Équipements complémentaires</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {['Couverture', 'Douche', 'Aspirateur', 'Pompe', 'Lumière'].map((equipment) => (
                        <Controller
                          key={equipment}
                          name={`pool.equipment.${equipment.toLowerCase()}`}
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              label={equipment}
                              checked={field.value}
                              onChange={(checked) => field.onChange(checked)}
                              className="text-indigo-400 focus:ring-indigo-400"
                            />
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        {/* 9. SÉCURITÉ */}
        <AccordionItem value="security" className="glass-card rounded-glass overflow-hidden">
          <AccordionTrigger className="px-6 py-4 hover:bg-white/10 transition-colors duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span className="font-medium text-gray-900">SÉCURITÉ</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-2 pb-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-white/10 rounded-glass">
                {['Alarme', 'Vidéophone', 'Interphone'].map((item) => (
                  <Controller
                    key={item}
                    name={`security.${item.toLowerCase()}`}
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        label={item}
                        checked={field.value}
                        onChange={(checked) => field.onChange(checked)}
                        className="text-indigo-400 focus:ring-indigo-400"
                      />
                    )}
                  />
                ))}
              </div>

              <div className="p-4 bg-white/10 rounded-glass">
                <div className="flex items-center space-x-4">
                  <Controller
                    name="security.blindDoor"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        label="Porte blindée"
                        checked={field.value}
                        onChange={(checked) => field.onChange(checked)}
                        className="text-indigo-400 focus:ring-indigo-400"
                      />
                    )}
                  />
                  {watchBlindDoor && (
                    <Input
                      label="Nombre"
                      type="number"
                      {...register('security.blindDoorCount')}
                      className="focus:border-indigo-400 w-24"
                    />
                  )}
                </div>
              </div>

              <div className="p-4 bg-white/10 rounded-glass">
                <div className="flex items-center space-x-4">
                  <Controller
                    name="security.camera"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        label="Caméra"
                        checked={field.value}
                        onChange={(checked) => field.onChange(checked)}
                        className="text-indigo-400 focus:ring-indigo-400"
                      />
                    )}
                  />
                  {watchCamera && (
                    <Input
                      label="Nombre"
                      type="number"
                      {...register('security.cameraCount')}
                      className="focus:border-indigo-400 w-24"
                    />
                  )}
                </div>
              </div>

              <div className="p-4 bg-white/10 rounded-glass">
                <Input
                  label="Piscine sécurisée"
                  {...register('security.poolSecurity')}
                  className="focus:border-indigo-400"
                />
              </div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
}