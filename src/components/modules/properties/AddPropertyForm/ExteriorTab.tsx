import { Controller } from 'react-hook-form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { exteriorTypes, propertyStates } from './constants';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';

interface ExteriorTabProps {
  control: any;
  register: any;
  watch: any;
}

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export function ExteriorTab({ control, register, watch }: ExteriorTabProps) {
  const watchPrivateExterior = watch('parking.privateExterior');
  const watchPrivateInterior = watch('parking.privateInterior');
  const watchGarage = watch('parking.garage');
  
  return (
    <MotionCard
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 glass-card rounded-glass"
    >
      <Accordion type="multiple" defaultValue={['exterior-features']} className="space-y-4">
        <AccordionItem value="exterior-features" className="glass-card rounded-glass overflow-hidden">
          <AccordionTrigger className="px-6 py-4 hover:bg-white/10 transition-colors duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span className="font-medium text-gray-900 ">Caractéristiques extérieures</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-2 pb-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <Controller
                name="exterior.type"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Type de construction"
                    options={exteriorTypes}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              <Controller
                name="exterior.layout"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Aménagement"
                    options={[
                      { value: 'tout_egout', label: 'Tout à l\'égout' },
                      { value: 'fosse_septique', label: 'Fosse septique' },
                      { value: 'forage', label: 'Forage' }
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              <Controller
                name="exterior.guarantee"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Garantie"
                    options={[
                      { value: 'decennale', label: 'Décennale' },
                      { value: 'ouvrage', label: 'Ouvrage' }
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              <div className="col-span-2">
                <h4 className="font-medium mb-2 text-gray-900 ">Position</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white/10 rounded-glass">
                  <div className="space-y-4">
                    <Controller
                      name="exteriorPosition.lastFloor"
                      control={control}
                      render={({ field }) => (
                        <Checkbox 
                          label="Dernier étage"
                          checked={field.value}
                          onChange={(checked) => field.onChange(checked)}
                          className="text-indigo-400 focus:ring-indigo-400"
                        />
                      )}
                    />
                    <Controller
                      name="exteriorPosition.groundFloor"
                      control={control}
                      render={({ field }) => (
                        <Checkbox 
                          label="Rez-de-chaussée"
                          checked={field.value}
                          onChange={(checked) => field.onChange(checked)}
                          className="text-indigo-400 focus:ring-indigo-400"
                        />
                      )}
                    />
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="exteriorPosition.floor"
                        control={control}
                        render={({ field }) => (
                          <Checkbox 
                            checked={field.value}
                            onChange={(checked) => field.onChange(checked)}
                            className="text-indigo-400 focus:ring-indigo-400"
                          />
                        )}
                      />
                      <Input
                        placeholder="Étage (ex: 2/5)"
                        {...register('exteriorPosition.floorNumber')}
                        className="w-full focus:border-indigo-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Controller
                      name="exteriorPosition.singleLevel"
                      control={control}
                      render={({ field }) => (
                        <Checkbox 
                          label="Plain-pied"
                          checked={field.value}
                          onChange={(checked) => field.onChange(checked)}
                          className="text-indigo-400 focus:ring-indigo-400"
                        />
                      )}
                    />
                    <Controller
                      name="exteriorPosition.pmrAccess"
                      control={control}
                      render={({ field }) => (
                        <Checkbox 
                          label="Accès PMR"
                          checked={field.value}
                          onChange={(checked) => field.onChange(checked)}
                          className="text-indigo-400 focus:ring-indigo-400"
                        />
                      )}
                    />
                  </div>
                  <div>
                    <Controller
                      name="exteriorPosition.elevator"
                      control={control}
                      render={({ field }) => (
                        <Checkbox 
                          label="Ascenseur"
                          checked={field.value}
                          onChange={(checked) => field.onChange(checked)}
                          className="text-indigo-400 focus:ring-indigo-400"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <h4 className="font-medium mb-2 text-gray-900 ">Extérieur</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-white/10 rounded-glass">
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Jardin</h5>
                    {['exteriorFeatures.enclosed', 'exteriorFeatures.treed', 'exteriorFeatures.new', 'exteriorFeatures.poolPossible'].map((name) => (
                      <Controller
                        key={name}
                        name={name}
                        control={control}
                        render={({ field }) => (
                          <Checkbox 
                            label={
                              name === 'exteriorFeatures.enclosed' ? 'Clos' :
                              name === 'exteriorFeatures.treed' ? 'Arboré' :
                              name === 'exteriorFeatures.new' ? 'A étrenner' : 'Piscinable'
                            }
                            checked={field.value}
                            onChange={(checked) => field.onChange(checked)}
                            className="text-indigo-400 focus:ring-indigo-400"
                          />
                        )}
                      />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Terasse/Balcon</h5>
                    {['exteriorFeatures.well', 'exteriorFeatures.poolhouse', 'exteriorFeatures.barbecue', 'exteriorFeatures.automaticWatering'].map((name) => (
                      <Controller
                        key={name}
                        name={name}
                        control={control}
                        render={({ field }) => (
                          <Checkbox 
                            label={
                              name === 'exteriorFeatures.well' ? 'Puits' :
                              name === 'exteriorFeatures.poolhouse' ? 'Pool house' :
                              name === 'exteriorFeatures.barbecue' ? 'Barbecue' : 'Arrosage auto'
                            }
                            checked={field.value}
                            onChange={(checked) => field.onChange(checked)}
                            className="text-indigo-400 focus:ring-indigo-400"
                          />
                        )}
                      />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Services</h5>
                    {['exteriorFeatures.caretaker', 'exteriorFeatures.gardener'].map((name) => (
                      <Controller
                        key={name}
                        name={name}
                        control={control}
                        render={({ field }) => (
                          <Checkbox 
                            label={name === 'exteriorFeatures.caretaker' ? 'Gardien' : 'Jardinier'}
                            checked={field.value}
                            onChange={(checked) => field.onChange(checked)}
                            className="text-indigo-400 focus:ring-indigo-400"
                          />
                        )}
                      />
                    ))}

                    <Controller
                      name="exteriorFeatures.noOverlook"
                      control={control}
                      render={({ field }) => (
                        <Checkbox 
                          label="Sans vis-à-vis"
                          checked={field.value}
                          onChange={(checked) => field.onChange(checked)}
                          className="text-indigo-400 focus:ring-indigo-400"
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-4">                  
                    
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <h4 className="font-medium mb-2 text-gray-900">Vues</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-white/10 rounded-glass">
                  {[
                    { name: 'views.ocean', label: 'Océan' },
                    { name: 'views.panoramic', label: 'Panoramique' },
                    { name: 'views.urban', label: 'Urbain' },
                    { name: 'views.quiet', label: 'Calme' }
                  ].map((item) => (
                    <Controller
                      key={item.name}
                      name={item.name}
                      control={control}
                      render={({ field }) => (
                        <Checkbox 
                          label={item.label}
                          checked={field.value}
                          onChange={(checked) => field.onChange(checked)}
                          className="text-indigo-400 focus:ring-indigo-400"
                        />
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                <h4 className="font-medium mb-2 text-gray-900">PARKING / GARAGE</h4>
                <div className="space-y-4 p-4 bg-white/10 rounded-glass">
                  <div className="space-y-2">
                    <Controller
                      name="parking.privateExterior"
                      control={control}
                      render={({ field }) => (
                        <Checkbox 
                          label="Extérieur privé"
                          checked={field.value}
                          onChange={(checked) => field.onChange(checked)}
                          className="text-indigo-400 focus:ring-indigo-400"
                        />
                      )}
                    />
                    {watchPrivateExterior && (
                      <Input
                        label="Nombre"
                        type="number"
                        {...register('parking.privateExteriorCount')}
                        className="focus:border-indigo-400 ml-6"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Controller
                      name="parking.privateInterior"
                      control={control}
                      render={({ field }) => (
                        <Checkbox 
                          label="Intérieur privé"
                          checked={field.value}
                          onChange={(checked) => field.onChange(checked)}
                          className="text-indigo-400 focus:ring-indigo-400"
                        />
                      )}
                    />
                    {watchPrivateInterior && (
                      <Input
                        label="Nombre"
                        type="number"
                        {...register('parking.privateInteriorCount')}
                        className="focus:border-indigo-400 ml-6"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Controller
                      name="parking.garage"
                      control={control}
                      render={({ field }) => (
                        <Checkbox 
                          label="Garage"
                          checked={field.value}
                          onChange={(checked) => field.onChange(checked)}
                          className="text-indigo-400 focus:ring-indigo-400"
                        />
                      )}
                    />
                    {watchGarage && (
                      <Input
                        label="Nombre"
                        type="number"
                        {...register('parking.garageCount')}
                        className="focus:border-indigo-400 ml-6"
                      />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="exterior-spaces" className="glass-card rounded-glass overflow-hidden mt-6">
  <AccordionTrigger className="px-6 py-4 hover:bg-white/10 transition-colors duration-200">
    <div className="flex items-center space-x-3">
      <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
      <span className="font-medium text-gray-900">Les extérieurs</span>
    </div>
  </AccordionTrigger>
  <AccordionContent className="px-6 pt-2 pb-6">
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="overflow-x-auto"
    >
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-white/10">
            <th className="p-3 text-left">Pièce</th>
            <th className="p-3 text-left">Surface</th>
            <th className="p-3 text-left">Revêtement sol</th>
            <th className="p-3 text-left">État</th>
            <th className="p-3 text-left">Commentaires</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/20">
          {['Terrasse', 'Cave', 'Jardin', 'Garage', 'Parking', 'Pergola', 'Piscine'].map((space) => (
            <tr key={space}>
              <td className="p-3">{space}</td>
              <td className="p-3">
                <Input
                  {...register(`exteriorSpaces.${space.toLowerCase()}.surface`)}
                  className="w-full focus:border-indigo-400"
                />
              </td>
              <td className="p-3">
                <Input
                  {...register(`exteriorSpaces.${space.toLowerCase()}.floorCovering`)}
                  className="w-full focus:border-indigo-400"
                />
              </td>
              <td className="p-3">
                <Controller
                  name={`exteriorSpaces.${space.toLowerCase()}.state`}
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={propertyStates}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </td>
              <td className="p-3">
                <Input
                  {...register(`exteriorSpaces.${space.toLowerCase()}.comments`)}
                  className="w-full focus:border-indigo-400"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  </AccordionContent>
</AccordionItem>
      </Accordion>
    </MotionCard>
  );
}