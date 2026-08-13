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
  propertyType: string;
  isGerant?: boolean;
}

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

export function ExteriorTab({ control, register, propertyType, isGerant = false }: ExteriorTabProps) {
  const isCommercial = propertyType === 'commercial';
  const isLuxury = propertyType === 'luxury';
  const isLand = propertyType === 'land';

  if (isLand) {
    return (
      <MotionCard
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="p-0 overflow-hidden"
      >
        <Accordion type="multiple" defaultValue={['exterior-features']} className="space-y-0">
          <AccordionItem value="exterior-features" className="border-0">
            <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`} />
                <span className="font-medium text-text">Terrain</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                <motion.div variants={item}>
                  <Controller
                    name="exterior.type"
                    control={control}
                    render={({ field }) => (
                      <Select label="Type de terrain" options={[
                        { value: 'plat', label: 'Plat' },
                        { value: 'pente', label: 'En pente' },
                        { value: 'accidente', label: 'Accidenté' },
                      ]} value={field.value} onChange={field.onChange} />
                    )}
                  />
                </motion.div>
                <motion.div variants={item}>
                  <Controller
                    name="exterior.view"
                    control={control}
                    render={({ field }) => (
                      <Select label="Vue" options={[
                        { value: 'degagee', label: 'Dégagée' },
                        { value: 'montagne', label: 'Montagne' },
                        { value: 'mer', label: 'Mer' },
                      ]} value={field.value} onChange={field.onChange} />
                    )}
                  />
                </motion.div>
              </motion.div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </MotionCard>
    );
  }

  if (isCommercial) {
    return (
      <MotionCard
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="p-0 overflow-hidden"
      >
        <Accordion type="multiple" defaultValue={['exterior-features']} className="space-y-0">
          <AccordionItem value="exterior-features" className="border-0">
            <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`} />
                <span className="font-medium text-text">Caractéristiques extérieures</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                <motion.div variants={item}>
                  <Controller
                    name="exterior.type"
                    control={control}
                    render={({ field }) => (
                      <Select label="Type de construction" options={exteriorTypes} value={field.value} onChange={field.onChange} />
                    )}
                  />
                </motion.div>
                <motion.div variants={item}>
                  <Controller
                    name="exterior.layout"
                    control={control}
                    render={({ field }) => (
                      <Select label="Aménagement" options={[
                        { value: 'tout_egout', label: "Tout à l'égout" },
                        { value: 'fosse_septique', label: 'Fosse septique' },
                        { value: 'forage', label: 'Forage' }
                      ]} value={field.value} onChange={field.onChange} />
                    )}
                  />
                </motion.div>
                <motion.div variants={item}>
                  <Controller
                    name="exterior.guarantee"
                    control={control}
                    render={({ field }) => (
                      <Select label="Garantie" options={[
                        { value: 'decennale', label: 'Décennale' },
                        { value: 'ouvrage', label: 'Ouvrage' }
                      ]} value={field.value} onChange={field.onChange} />
                    )}
                  />
                </motion.div>

                {/* Commercial-specific exterior features */}
                <motion.div variants={item} className="md:col-span-2">
                  <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                    <h4 className="font-medium text-sm text-text mb-3">Commercial</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Controller name="commercialExterior.deliveries" control={control} render={({ field }) => (
                        <Checkbox label="Livraisons" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="commercialExterior.truckParking" control={control} render={({ field }) => (
                        <Checkbox label="Parking poids lourds" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="commercialExterior.dock" control={control} render={({ field }) => (
                        <Checkbox label="Quai de déchargement" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={item} className="md:col-span-2">
                  <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                    <h4 className="font-medium text-sm text-text mb-3">Position</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-3">
                        <Controller name="exteriorPosition.lastFloor" control={control} render={({ field }) => (
                          <Checkbox label="Dernier étage" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                        <Controller name="exteriorPosition.groundFloor" control={control} render={({ field }) => (
                          <Checkbox label="Rez-de-chaussée" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                        <div className="flex items-center gap-2">
                          <Controller name="exteriorPosition.floor" control={control} render={({ field }) => (
                            <Checkbox checked={field.value} onChange={(checked) => field.onChange(checked)} />
                          )} />
                          <Input placeholder="Étage (ex: 2/5)" {...register('exteriorPosition.floorNumber')} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Controller name="exteriorPosition.singleLevel" control={control} render={({ field }) => (
                          <Checkbox label="Plain-pied" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                        <Controller name="exteriorPosition.pmrAccess" control={control} render={({ field }) => (
                          <Checkbox label="Accès PMR" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                      </div>
                      <div className="space-y-3">
                        <Controller name="exteriorPosition.elevator" control={control} render={({ field }) => (
                          <Checkbox label="Ascenseur" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={item} className="md:col-span-2">
                  <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                    <h4 className="font-medium text-sm text-text mb-3">Extérieur</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Jardin</h5>
                        {['exteriorFeatures.enclosed', 'exteriorFeatures.treed', 'exteriorFeatures.new', 'exteriorFeatures.poolPossible'].map((name) => (
                          <Controller key={name} name={name} control={control} render={({ field }) => (
                            <Checkbox label={
                              name === 'exteriorFeatures.enclosed' ? 'Clos' :
                              name === 'exteriorFeatures.treed' ? 'Arboré' :
                              name === 'exteriorFeatures.new' ? 'A étrenner' : 'Piscinable'
                            } checked={field.value} onChange={(checked) => field.onChange(checked)} />
                          )} />
                        ))}
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Terrasse/Balcon</h5>
                        {['exteriorFeatures.well', 'exteriorFeatures.poolhouse', 'exteriorFeatures.barbecue', 'exteriorFeatures.automaticWatering'].map((name) => (
                          <Controller key={name} name={name} control={control} render={({ field }) => (
                            <Checkbox label={
                              name === 'exteriorFeatures.well' ? 'Puits' :
                              name === 'exteriorFeatures.poolhouse' ? 'Pool house' :
                              name === 'exteriorFeatures.barbecue' ? 'Barbecue' : 'Arrosage auto'
                            } checked={field.value} onChange={(checked) => field.onChange(checked)} />
                          )} />
                        ))}
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Services</h5>
                        <Controller name="exteriorFeatures.caretaker" control={control} render={({ field }) => (
                          <Checkbox label="Gardien" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                        <Controller name="exteriorFeatures.gardener" control={control} render={({ field }) => (
                          <Checkbox label="Jardinier" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                        <Controller name="exteriorFeatures.noOverlook" control={control} render={({ field }) => (
                          <Checkbox label="Sans vis-à-vis" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Vues</h5>
                        {[
                          { name: 'views.ocean', label: 'Océan' },
                          { name: 'views.panoramic', label: 'Panoramique' },
                          { name: 'views.urban', label: 'Urbain' },
                          { name: 'views.quiet', label: 'Calme' }
                        ].map(({ name, label }) => (
                          <Controller key={name} name={name} control={control} render={({ field }) => (
                            <Checkbox label={label} checked={field.value} onChange={(checked) => field.onChange(checked)} />
                          )} />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={item} className="md:col-span-2">
                  <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                    <h4 className="font-medium text-sm text-text mb-3">Parking / Garage</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Controller name="parking.privateExterior" control={control} render={({ field }) => (
                          <Checkbox label="Extérieur privé" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                      </div>
                      <div className="flex items-center gap-3">
                        <Controller name="parking.privateInterior" control={control} render={({ field }) => (
                          <Checkbox label="Intérieur privé" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                      </div>
                      <div className="flex items-center gap-3">
                        <Controller name="parking.garage" control={control} render={({ field }) => (
                          <Checkbox label="Garage" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="exterior-spaces" className="border-0 border-t border-border/40">
            <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-interactive" />
                <span className="font-medium text-text">Les extérieurs</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
              >
                <div className="overflow-x-auto rounded-lg border border-border/30">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-background/50">
                        <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Pièce</th>
                        <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Surface (m²)</th>
                        <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Revêtement sol</th>
                        <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">État</th>
                        <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Commentaires</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {['Terrasse', 'Cave', 'Jardin', 'Garage', 'Parking', 'Pergola', 'Piscine'].map((space) => (
                        <tr key={space} className="hover:bg-background/30 transition-colors">
                          <td className="p-3 font-medium text-text">{space}</td>
                          <td className="p-3">
                            <Input type="number" {...register(`exteriorSpaces.${space.toLowerCase()}.surface`)} />
                          </td>
                          <td className="p-3">
                            <Input {...register(`exteriorSpaces.${space.toLowerCase()}.floorCovering`)} />
                          </td>
                          <td className="p-3">
                            <Controller name={`exteriorSpaces.${space.toLowerCase()}.state`} control={control} render={({ field }) => (
                              <Select options={propertyStates} value={field.value} onChange={field.onChange} />
                            )} />
                          </td>
                          <td className="p-3">
                            <Input {...register(`exteriorSpaces.${space.toLowerCase()}.comments`)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </MotionCard>
    );
  }

  return (
    <MotionCard
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="p-0 overflow-hidden"
    >
      <Accordion type="multiple" defaultValue={['exterior-features']} className="space-y-0">
        <AccordionItem value="exterior-features" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`} />
              <span className="font-medium text-text">Caractéristiques extérieures</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              <motion.div variants={item}>
                <Controller
                  name="exterior.type"
                  control={control}
                  render={({ field }) => (
                    <Select label="Type de construction" options={exteriorTypes} value={field.value} onChange={field.onChange} />
                  )}
                />
              </motion.div>
              <motion.div variants={item}>
                <Controller
                  name="exterior.layout"
                  control={control}
                  render={({ field }) => (
                    <Select label="Aménagement" options={[
                      { value: 'tout_egout', label: "Tout à l'égout" },
                      { value: 'fosse_septique', label: 'Fosse septique' },
                      { value: 'forage', label: 'Forage' }
                    ]} value={field.value} onChange={field.onChange} />
                  )}
                />
              </motion.div>
              <motion.div variants={item}>
                <Controller
                  name="exterior.guarantee"
                  control={control}
                  render={({ field }) => (
                    <Select label="Garantie" options={[
                      { value: 'decennale', label: 'Décennale' },
                      { value: 'ouvrage', label: 'Ouvrage' }
                    ]} value={field.value} onChange={field.onChange} />
                  )}
                />
              </motion.div>

              <motion.div variants={item} className="md:col-span-2">
                <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                  <h4 className="font-medium text-sm text-text mb-3">Position</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-3">
                      <Controller name="exteriorPosition.lastFloor" control={control} render={({ field }) => (
                        <Checkbox label="Dernier étage" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                      )} />
                      <Controller name="exteriorPosition.groundFloor" control={control} render={({ field }) => (
                        <Checkbox label="Rez-de-chaussée" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                      )} />
                      <div className="flex items-center gap-2">
                        <Controller name="exteriorPosition.floor" control={control} render={({ field }) => (
                          <Checkbox checked={field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                        <Input placeholder="Étage (ex: 2/5)" {...register('exteriorPosition.floorNumber')} />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Controller name="exteriorPosition.singleLevel" control={control} render={({ field }) => (
                        <Checkbox label="Plain-pied" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                      )} />
                      <Controller name="exteriorPosition.pmrAccess" control={control} render={({ field }) => (
                        <Checkbox label="Accès PMR" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                      )} />
                    </div>
                    <div className="space-y-3">
                      <Controller name="exteriorPosition.elevator" control={control} render={({ field }) => (
                        <Checkbox label="Ascenseur" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                      )} />
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={item} className="md:col-span-2">
                <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                  <h4 className="font-medium text-sm text-text mb-3">Extérieur</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Jardin</h5>
                      {['exteriorFeatures.enclosed', 'exteriorFeatures.treed', 'exteriorFeatures.new', 'exteriorFeatures.poolPossible'].map((name) => (
                        <Controller key={name} name={name} control={control} render={({ field }) => (
                          <Checkbox label={
                            name === 'exteriorFeatures.enclosed' ? 'Clos' :
                            name === 'exteriorFeatures.treed' ? 'Arboré' :
                            name === 'exteriorFeatures.new' ? 'A étrenner' : 'Piscinable'
                          } checked={field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                      ))}
                    </div>
                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Terrasse/Balcon</h5>
                      {['exteriorFeatures.well', 'exteriorFeatures.poolhouse', 'exteriorFeatures.barbecue', 'exteriorFeatures.automaticWatering'].map((name) => (
                        <Controller key={name} name={name} control={control} render={({ field }) => (
                          <Checkbox label={
                            name === 'exteriorFeatures.well' ? 'Puits' :
                            name === 'exteriorFeatures.poolhouse' ? 'Pool house' :
                            name === 'exteriorFeatures.barbecue' ? 'Barbecue' : 'Arrosage auto'
                          } checked={field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                      ))}
                    </div>
                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Services</h5>
                      <Controller name="exteriorFeatures.caretaker" control={control} render={({ field }) => (
                        <Checkbox label="Gardien" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                      )} />
                      <Controller name="exteriorFeatures.gardener" control={control} render={({ field }) => (
                        <Checkbox label="Jardinier" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                      )} />
                      <Controller name="exteriorFeatures.noOverlook" control={control} render={({ field }) => (
                        <Checkbox label="Sans vis-à-vis" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                      )} />
                    </div>
                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Vues</h5>
                      {[
                        { name: 'views.ocean', label: 'Océan' },
                        { name: 'views.panoramic', label: 'Panoramique' },
                        { name: 'views.urban', label: 'Urbain' },
                        { name: 'views.quiet', label: 'Calme' }
                      ].map(({ name, label }) => (
                        <Controller key={name} name={name} control={control} render={({ field }) => (
                          <Checkbox label={label} checked={field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Luxury-specific exterior features */}
              {isLuxury && (
                <motion.div variants={item} className="md:col-span-2">
                  <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                    <h4 className="font-medium text-sm text-text mb-3">Équipements prestige</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Controller name="luxuryExterior.heatedPool" control={control} render={({ field }) => (
                        <Checkbox label="Piscine chauffée" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="luxuryExterior.tennis" control={control} render={({ field }) => (
                        <Checkbox label="Tennis" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="luxuryExterior.heliport" control={control} render={({ field }) => (
                        <Checkbox label="Héliport" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="luxuryExterior.guardHouse" control={control} render={({ field }) => (
                        <Checkbox label="Maison de gardien" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="luxuryExterior.landscapedGarden" control={control} render={({ field }) => (
                        <Checkbox label="Jardin paysager" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="luxuryExterior.seaView" control={control} render={({ field }) => (
                        <Checkbox label="Vue mer" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="luxuryExterior.mountainView" control={control} render={({ field }) => (
                        <Checkbox label="Vue montagne" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div variants={item} className="md:col-span-2">
                <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                  <h4 className="font-medium text-sm text-text mb-3">Parking / Garage</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Controller name="parking.privateExterior" control={control} render={({ field }) => (
                        <Checkbox label="Extérieur privé" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                      )} />
                    </div>
                    <div className="flex items-center gap-3">
                      <Controller name="parking.privateInterior" control={control} render={({ field }) => (
                        <Checkbox label="Intérieur privé" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                      )} />
                    </div>
                    <div className="flex items-center gap-3">
                      <Controller name="parking.garage" control={control} render={({ field }) => (
                        <Checkbox label="Garage" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                      )} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="exterior-spaces" className="border-0 border-t border-border/40">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-interactive" />
              <span className="font-medium text-text">Les extérieurs</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
            >
              <div className="overflow-x-auto rounded-lg border border-border/30">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-background/50">
                      <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Pièce</th>
                      <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Surface (m²)</th>
                      <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Revêtement sol</th>
                      <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">État</th>
                      <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Commentaires</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {['Terrasse', 'Cave', 'Jardin', 'Garage', 'Parking', 'Pergola', 'Piscine'].map((space) => (
                      <tr key={space} className="hover:bg-background/30 transition-colors">
                        <td className="p-3 font-medium text-text">{space}</td>
                        <td className="p-3">
                            <Input type="number" {...register(`exteriorSpaces.${space.toLowerCase()}.surface`)} />
                        </td>
                        <td className="p-3">
                          <Input {...register(`exteriorSpaces.${space.toLowerCase()}.floorCovering`)} />
                        </td>
                        <td className="p-3">
                          <Controller name={`exteriorSpaces.${space.toLowerCase()}.state`} control={control} render={({ field }) => (
                            <Select options={propertyStates} value={field.value} onChange={field.onChange} />
                          )} />
                        </td>
                        <td className="p-3">
                          <Input {...register(`exteriorSpaces.${space.toLowerCase()}.comments`)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
}
