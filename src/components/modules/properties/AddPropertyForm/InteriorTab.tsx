import { Controller } from 'react-hook-form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { Input } from '../../../../components/ui/Input';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { Select } from '../../../../components/ui/Select';
import { Textarea } from '../../../../components/ui/Textarea';
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

interface InteriorTabProps {
  control: any;
  register: any;
  watch: any;
  propertyType: string;
  isGerant?: boolean;
}

export function InteriorTab({ control, register, watch, propertyType, isGerant = false }: InteriorTabProps) {
  const isLuxury = propertyType === 'luxury';
  const isVacation = propertyType === 'vacation';
  const isResidential = propertyType === 'residential';
  const isCommercial = propertyType === 'commercial';
  const showFull = isResidential || isLuxury || isVacation || isCommercial;

  return (
    <MotionCard
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="p-0 overflow-hidden"
    >
      <Accordion type="multiple" defaultValue={['interior-details']} className="space-y-0">
        <AccordionItem value="interior-details" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`} />
              <span className="font-medium text-text">Détails intérieurs</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              <motion.div variants={item} className="md:col-span-2">
                <h4 className="font-medium text-sm text-text mb-3">Style</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { value: 'moderne', label: 'Moderne', image: '/images/styles/modern1.jpg' },
                    { value: 'traditionnel', label: 'Traditionnel', image: '/images/styles/traditional.jpg' },
                    { value: 'minimaliste', label: 'Minimaliste', image: '/images/styles/minimalist.jpg' },
                    { value: 'beldi', label: 'Beldi', image: '/images/styles/beldi.jpg' },
                    { value: 'contemporain', label: 'Contemporain', image: '/images/styles/contemporary.jpg' }
                  ].map((style) => (
                    <Controller
                      key={style.value}
                      name={`interiorStyles.${style.value}`}
                      control={control}
                      render={({ field }) => (
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="cursor-pointer"
                          onClick={() => field.onChange(!field.value)}
                        >
                          <div className={`rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                            field.value ? (isGerant ? 'border-[#905D5D] shadow-tab' : 'border-accent shadow-tab') : 'border-border/40 hover:border-border'
                          }`}>
                            <div className="aspect-square bg-background relative overflow-hidden">
                              <img src={style.image} alt={style.label} className="w-full h-full object-cover" />
                              {field.value && (
                                <div className={`absolute top-2 right-2 rounded-full p-1 shadow-sm ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="p-2.5 text-center bg-card">
                              <span className="text-sm font-medium text-text">{style.label}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    />
                  ))}
                </div>
                <Textarea label="Commentaires" {...register('interior.styleComments')} className="mt-3" rows={2} />
              </motion.div>

              {showFull && (
                <>
                  <motion.div variants={item} className="md:col-span-2">
                    <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                      <h4 className="font-medium text-sm text-text mb-3">Salle de bain</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Nombre" type="number" {...register('bathroom.count')} />
                        <Input label="dont Suite Parentale" type="number" {...register('bathroom.parentalSuiteCount')} />
                        <div>
                          <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Type</h5>
                          <div className="space-y-2">
                            <Controller name="bathroom.shower" control={control} render={({ field }) => (
                              <Checkbox label="Douche" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                            )} />
                            <Controller name="bathroom.bathtub" control={control} render={({ field }) => (
                              <Checkbox label="Baignoire" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                            )} />
                          </div>
                        </div>
                        <Controller name="bathroom.toiletType" control={control} render={({ field }) => (
                          <Select label="WC" options={[
                            { value: 'in_bathroom', label: "Dans salle d'eau" },
                            { value: 'separate', label: 'Indépendante' }
                          ]} value={field.value} onChange={field.onChange} />
                        )} />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={item} className="md:col-span-2">
                    <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                      <h4 className="font-medium text-sm text-text mb-3">Cuisine</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Nombre" type="number" {...register('kitchen.count')} />
                        <div>
                          <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Type</h5>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { value: 'american', label: 'Américaine' },
                              { value: 'separate', label: 'Séparée' },
                              { value: 'equipped', label: 'Équipée' },
                              { value: 'empty', label: 'Vide' },
                              { value: 'fitted', label: 'Aménagée' }
                            ].map((type) => (
                              <Controller key={type.value} name={`kitchen.type.${type.value}`} control={control} render={({ field }) => (
                                <Checkbox label={type.label} checked={field.value} onChange={(checked) => field.onChange(checked)} />
                              )} />
                            ))}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Garanties</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Controller name="guarantees.furniture" control={control} render={({ field }) => (
                                <Checkbox label="Garantie meubles" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                              )} />
                            </div>
                            <div>
                              <Controller name="guarantees.appliances" control={control} render={({ field }) => (
                                <Checkbox label="Garantie électroménager" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                              )} />
                            </div>
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <Textarea label="Détails" {...register('kitchen.details')} rows={2} />
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={item} className="md:col-span-2">
                    <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                      <h4 className="font-medium text-sm text-text mb-3">Salon / Pièces de vie</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Nombre" type="number" {...register('livingRoom.count')} />
                        <div>
                          <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Accès</h5>
                          <div className="space-y-2">
                            <Controller name="livingRoom.terraceAccess" control={control} render={({ field }) => (
                              <Checkbox label="Terrasse" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                            )} />
                            <Controller name="livingRoom.poolAccess" control={control} render={({ field }) => (
                              <Checkbox label="Piscine" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                            )} />
                          </div>
                        </div>
                        <div>
                          <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Caractéristiques</h5>
                          <div className="space-y-2">
                            <Controller name="livingRoom.airConditioned" control={control} render={({ field }) => (
                              <Checkbox label="Climatisé" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                            )} />
                            <Controller name="livingRoom.bright" control={control} render={({ field }) => (
                              <Checkbox label="Lumineux" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                            )} />
                            <Controller name="livingRoom.fiber" control={control} render={({ field }) => (
                              <Checkbox label="Fibre" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                            )} />
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <Textarea label="Détails" {...register('livingRoom.details')} rows={2} />
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={item} className="md:col-span-2">
                    <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                      <h4 className="font-medium text-sm text-text mb-3">Chambres</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input label="Nombre total" type="number" {...register('bedrooms.total')} />
                        <Input label="Nombre en RDC" type="number" {...register('bedrooms.groundFloor')} />
                        <Input label="dont Suite Parentale" type="number" {...register('bedrooms.parentalSuite')} />
                        <div className="md:col-span-2">
                          <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Caractéristiques</h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <Controller name="bedrooms.airConditioned" control={control} render={({ field }) => (
                              <Checkbox label="Climatisé" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                            )} />
                            <Controller name="bedrooms.bright" control={control} render={({ field }) => (
                              <Checkbox label="Lumineux" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                            )} />
                            <Controller name="bedrooms.tv" control={control} render={({ field }) => (
                              <Checkbox label="TV" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                            )} />
                          </div>
                        </div>
                        <div>
                          <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Accès</h5>
                          <div className="space-y-2">
                            <Controller name="bedrooms.exteriorAccess" control={control} render={({ field }) => (
                              <Checkbox label="Extérieur" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                            )} />
                            <Controller name="bedrooms.poolAccess" control={control} render={({ field }) => (
                              <Checkbox label="Piscine" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                            )} />
                          </div>
                        </div>
                        <div className="md:col-span-3">
                          <Textarea label="Détails" {...register('bedrooms.details')} rows={2} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}

              {/* Luxury-specific interior features */}
              {isLuxury && (
                <motion.div variants={item} className="md:col-span-2">
                  <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                    <h4 className="font-medium text-sm text-text mb-3">Équipements prestige intérieurs</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Controller name="luxuryInterior.domotique" control={control} render={({ field }) => (
                        <Checkbox label="Domotique" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="luxuryInterior.cheminee" control={control} render={({ field }) => (
                        <Checkbox label="Cheminée" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="luxuryInterior.hammam" control={control} render={({ field }) => (
                        <Checkbox label="Hammam / Spa" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="luxuryInterior.sauna" control={control} render={({ field }) => (
                        <Checkbox label="Sauna" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="luxuryInterior.cinema" control={control} render={({ field }) => (
                        <Checkbox label="Cinéma" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="luxuryInterior.caveVin" control={control} render={({ field }) => (
                        <Checkbox label="Cave à vin" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="luxuryInterior.ascenseur" control={control} render={({ field }) => (
                        <Checkbox label="Ascenseur" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Vacation amenities */}
              {isVacation && (
                <motion.div variants={item} className="md:col-span-2">
                  <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                    <h4 className="font-medium text-sm text-text mb-3">Équipements et services</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Controller name="interiorVacation.wifi" control={control} render={({ field }) => (
                        <Checkbox label="Wifi" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="interiorVacation.washingMachine" control={control} render={({ field }) => (
                        <Checkbox label="Lave-linge" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="interiorVacation.dishwasher" control={control} render={({ field }) => (
                        <Checkbox label="Lave-vaisselle" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="interiorVacation.tv" control={control} render={({ field }) => (
                        <Checkbox label="Télévision" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="interiorVacation.climatisation" control={control} render={({ field }) => (
                        <Checkbox label="Climatisation" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="interiorVacation.heating" control={control} render={({ field }) => (
                        <Checkbox label="Chauffage" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="interiorVacation.microwave" control={control} render={({ field }) => (
                        <Checkbox label="Micro-ondes" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="interiorVacation.coffeeMaker" control={control} render={({ field }) => (
                        <Checkbox label="Machine à café" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="interiorVacation.parking" control={control} render={({ field }) => (
                        <Checkbox label="Parking" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        {showFull && (
          <AccordionItem value="interior-spaces" className="border-0 border-t border-border/40">
            <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-interactive" />
                <span className="font-medium text-text">Les intérieurs</span>
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
                        <th className="p-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Accès ext.</th>
                        <th className="p-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Placard</th>
                        <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Chauffage</th>
                        <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Commentaires</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {['Entrée', 'Salon', 'Cuisine', 'Chambre', 'Salle de bain', 'Bureau', 'Buanderie', 'Dressing'].map((room) => (
                        <tr key={room} className="hover:bg-background/30 transition-colors">
                          <td className="p-3 font-medium text-text">{room}</td>
                          <td className="p-3">
                            <Input type="number" {...register(`interiorSpaces.${room.toLowerCase().replace(' ', '_')}.surface`)} />
                          </td>
                          <td className="p-3">
                            <Input {...register(`interiorSpaces.${room.toLowerCase().replace(' ', '_')}.floorCovering`)} />
                          </td>
                          <td className="p-3">
                            <Controller name={`interiorSpaces.${room.toLowerCase().replace(' ', '_')}.state`} control={control} render={({ field }) => (
                              <Select options={[
                                { value: 'very_good', label: 'Très bon état' },
                                { value: 'good', label: 'Bon état' },
                                { value: 'average', label: 'Moyen état' },
                                { value: 'bad', label: 'Mauvais état' }
                              ]} value={field.value} onChange={field.onChange} />
                            )} />
                          </td>
                          <td className="p-3 text-center">
                            <Controller name={`interiorSpaces.${room.toLowerCase().replace(' ', '_')}.exteriorAccess`} control={control} render={({ field }) => (
                              <Checkbox checked={field.value} onChange={(checked) => field.onChange(checked)} />
                            )} />
                          </td>
                          <td className="p-3 text-center">
                            <Controller name={`interiorSpaces.${room.toLowerCase().replace(' ', '_')}.closet`} control={control} render={({ field }) => (
                              <Checkbox checked={field.value} onChange={(checked) => field.onChange(checked)} />
                            )} />
                          </td>
                          <td className="p-3">
                            <Input {...register(`interiorSpaces.${room.toLowerCase().replace(' ', '_')}.heating`)} />
                          </td>
                          <td className="p-3">
                            <Input {...register(`interiorSpaces.${room.toLowerCase().replace(' ', '_')}.comments`)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </MotionCard>
  );
}
