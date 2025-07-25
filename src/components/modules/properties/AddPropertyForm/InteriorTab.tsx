import { Controller } from 'react-hook-form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { Input } from '../../../../components/ui/Input';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { Select } from '../../../../components/ui/Select';
import { Textarea } from '../../../../components/ui/Textarea';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

interface InteriorTabProps {
  control: any;
  register: any;
  watch: any;
}

export function InteriorTab({ control, register, watch }: InteriorTabProps) {
  const watchFurnitureGuarantee = watch('guarantees.furniture');
  const watchApplianceGuarantee = watch('guarantees.appliances');

  return (
    <MotionCard
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 glass-card rounded-glass"
    >
      <Accordion type="multiple" defaultValue={['interior-details']} className="space-y-4">
        <AccordionItem value="interior-details" className="glass-card rounded-glass overflow-hidden">
          <AccordionTrigger className="px-6 py-4 hover:bg-white/10 transition-colors duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span className="font-medium text-gray-900">Détails intérieurs</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-2 pb-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Style Section */}
<div className="col-span-2">
  <h4 className="font-medium mb-2 text-gray-900">Style</h4>
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
    {[
      { 
        value: 'moderne', 
        label: 'Moderne',
        image: '/images/styles/modern1.jpg' // Replace with your actual image paths
      },
      { 
        value: 'traditionnel', 
        label: 'Traditionnel',
        image: '/images/styles/traditional.jpg'
      },
      { 
        value: 'minimaliste', 
        label: 'Minimalisté',
        image: '/images/styles/minimalist.jpg'
      },
      { 
        value: 'beldi', 
        label: 'Beldi',
        image: '/images/styles/beldi.jpg'
      },
      { 
        value: 'contemporain', 
        label: 'Contemporain',
        image: '/images/styles/contemporary.jpg'
      }
    ].map((style) => (
      <Controller
        key={style.value}
        name={`interiorStyles.${style.value}`}
        control={control}
        render={({ field }) => (
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
            onClick={() => field.onChange(!field.value)}
          >
            <div className={`glass-card rounded-glass overflow-hidden border-2 transition-colors ${field.value ? 'border-indigo-400' : 'border-transparent'}`}>
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                <img 
                  src={style.image} 
                  alt={style.label}
                  className="w-full h-full object-cover"
                />
                {field.value && (
                  <div className="absolute top-2 right-2 bg-indigo-400 rounded-full p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-3 text-center">
                <span className="font-medium text-gray-900">{style.label}</span>
              </div>
            </div>
          </motion.div>
        )}
      />
    ))}
  </div>
  <Textarea
    label="Commentaires"
    {...register('interior.styleComments')}
    className="mt-4 focus:border-indigo-400"
    rows={3}
  />
</div>

              {/* Salle de Bain Section */}
              <div className="col-span-2">
                <h4 className="font-medium mb-2 text-gray-900">SALLE DE BAIN</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white/10 rounded-glass">
                  <Input
                    label="Nombre"
                    type="number"
                    {...register('bathroom.count')}
                    className="focus:border-indigo-400"
                  />
                  <Input
                    label="dont Suite Parentale"
                    type="number"
                    {...register('bathroom.parentalSuiteCount')}
                    className="focus:border-indigo-400"
                  />
                  
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Type</h5>
                    <div className="space-y-2">
                      <Controller
                        name="bathroom.shower"
                        control={control}
                        render={({ field }) => (
                          <Checkbox 
                            label="Douche"
                            checked={field.value}
                            onChange={(checked) => field.onChange(checked)}
                            className="text-indigo-400 focus:ring-indigo-400"
                          />
                        )}
                      />
                      <Controller
                        name="bathroom.bathtub"
                        control={control}
                        render={({ field }) => (
                          <Checkbox 
                            label="Baignoire"
                            checked={field.value}
                            onChange={(checked) => field.onChange(checked)}
                            className="text-indigo-400 focus:ring-indigo-400"
                          />
                        )}
                      />
                    </div>
                  </div>
                  
                  
                  <div className="col-span-2">
                    <Controller
                      name="bathroom.toiletType"
                      control={control}
                      render={({ field }) => (
                        <Select
                          label="WC"
                          options={[
                            { value: 'in_bathroom', label: 'Dans salle d\'eau' },
                            { value: 'separate', label: 'Indépendante' }
                          ]}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Cuisine Section */}
              <div className="col-span-2">
                <h4 className="font-medium mb-2 text-gray-900">CUISINE</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white/10 rounded-glass">
                  <Input
                    label="Nombre"
                    type="number"
                    {...register('kitchen.count')}
                    className="focus:border-indigo-400"
                  />
                  
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Type</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'american', label: 'Américaine' },
                        { value: 'separate', label: 'Séparée' },
                        { value: 'equipped', label: 'Équipée' },
                        { value: 'empty', label: 'Vide' },
                        { value: 'fitted', label: 'Aménagée' }
                      ].map((type) => (
                        <Controller
                          key={type.value}
                          name={`kitchen.type.${type.value}`}
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              label={type.label}
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
                    <h5 className="font-medium text-sm mb-2">Garanties</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Controller
                          name="guarantees.furniture"
                          control={control}
                          render={({ field }) => (
                            <Checkbox 
                              label="Garantie meubles"
                              checked={field.value}
                              onChange={(checked) => field.onChange(checked)}
                              className="text-indigo-400 focus:ring-indigo-400"
                            />
                          )}
                        />
                        {watchFurnitureGuarantee && (
                          <Input
                            label="Date / Entreprise"
                            {...register('guarantees.furnitureDetails')}
                            className="mt-2 focus:border-indigo-400"
                          />
                        )}
                      </div>
                      <div>
                        <Controller
                          name="guarantees.appliances"
                          control={control}
                          render={({ field }) => (
                            <Checkbox 
                              label="Garantie électroménager"
                              checked={field.value}
                              onChange={(checked) => field.onChange(checked)}
                              className="text-indigo-400 focus:ring-indigo-400"
                            />
                          )}
                        />
                        {watchApplianceGuarantee && (
                          <Input
                            label="Date / Entreprise"
                            {...register('guarantees.applianceDetails')}
                            className="mt-2 focus:border-indigo-400"
                          />
                        )}
                      </div>
                    </div>
                    <Textarea
                      label="Détails"
                      {...register('kitchen.details')}
                      className="mt-4 focus:border-indigo-400"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Salon Section */}
              <div className="col-span-2">
                <h4 className="font-medium mb-2 text-gray-900">SALON / PIÈCES DE VIE</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white/10 rounded-glass">
                  <Input
                    label="Nombre"
                    type="number"
                    {...register('livingRoom.count')}
                    className="focus:border-indigo-400"
                  />
                  
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Accès</h5>
                    <div className="space-y-2">
                      <Controller
                        name="livingRoom.terraceAccess"
                        control={control}
                        render={({ field }) => (
                          <Checkbox 
                            label="Terrasse"
                            checked={field.value}
                            onChange={(checked) => field.onChange(checked)}
                            className="text-indigo-400 focus:ring-indigo-400"
                          />
                        )}
                      />
                      <Controller
                        name="livingRoom.poolAccess"
                        control={control}
                        render={({ field }) => (
                          <Checkbox 
                            label="Piscine"
                            checked={field.value}
                            onChange={(checked) => field.onChange(checked)}
                            className="text-indigo-400 focus:ring-indigo-400"
                          />
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Caractéristiques</h5>
                    <div className="space-y-2">
                      <Controller
                        name="livingRoom.airConditioned"
                        control={control}
                        render={({ field }) => (
                          <Checkbox 
                            label="Climatisé"
                            checked={field.value}
                            onChange={(checked) => field.onChange(checked)}
                            className="text-indigo-400 focus:ring-indigo-400"
                          />
                        )}
                      />
                      <Controller
                        name="livingRoom.bright"
                        control={control}
                        render={({ field }) => (
                          <Checkbox 
                            label="Lumineux"
                            checked={field.value}
                            onChange={(checked) => field.onChange(checked)}
                            className="text-indigo-400 focus:ring-indigo-400"
                          />
                        )}
                      />
                      <Controller
                        name="livingRoom.fiber"
                        control={control}
                        render={({ field }) => (
                          <Checkbox 
                            label="Fibre"
                            checked={field.value}
                            onChange={(checked) => field.onChange(checked)}
                            className="text-indigo-400 focus:ring-indigo-400"
                          />
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <Textarea
                      label="Détails"
                      {...register('livingRoom.details')}
                      className="focus:border-indigo-400"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Chambres Section */}
              <div className="col-span-2">
                <h4 className="font-medium mb-2 text-gray-900">CHAMBRES</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-white/10 rounded-glass">
                  <Input
                    label="Nombre total"
                    type="number"
                    {...register('bedrooms.total')}
                    className="focus:border-indigo-400"
                  />
                  <Input
                    label="Nombre en RDC"
                    type="number"
                    {...register('bedrooms.groundFloor')}
                    className="focus:border-indigo-400"
                  />
                  <Input
                    label="dont Suite Parentale"
                    type="number"
                    {...register('bedrooms.parentalSuite')}
                    className="focus:border-indigo-400"
                  />
                  
                  <div className="space-y-2 md:col-span-2">
                    <h5 className="font-medium text-sm">Caractéristiques</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <Controller
                        name="bedrooms.airConditioned"
                        control={control}
                        render={({ field }) => (
                          <Checkbox 
                            label="Climatisé"
                            checked={field.value}
                            onChange={(checked) => field.onChange(checked)}
                            className="text-indigo-400 focus:ring-indigo-400"
                          />
                        )}
                      />
                      <Controller
                        name="bedrooms.bright"
                        control={control}
                        render={({ field }) => (
                          <Checkbox 
                            label="Lumineux"
                            checked={field.value}
                            onChange={(checked) => field.onChange(checked)}
                            className="text-indigo-400 focus:ring-indigo-400"
                          />
                        )}
                      />
                      <Controller
                        name="bedrooms.tv"
                        control={control}
                        render={({ field }) => (
                          <Checkbox 
                            label="TV"
                            checked={field.value}
                            onChange={(checked) => field.onChange(checked)}
                            className="text-indigo-400 focus:ring-indigo-400"
                          />
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Accès</h5>
                    <div className="space-y-2">
                      <Controller
                        name="bedrooms.exteriorAccess"
                        control={control}
                        render={({ field }) => (
                          <Checkbox 
                            label="Extérieur"
                            checked={field.value}
                            onChange={(checked) => field.onChange(checked)}
                            className="text-indigo-400 focus:ring-indigo-400"
                          />
                        )}
                      />
                      <Controller
                        name="bedrooms.poolAccess"
                        control={control}
                        render={({ field }) => (
                          <Checkbox 
                            label="Piscine"
                            checked={field.value}
                            onChange={(checked) => field.onChange(checked)}
                            className="text-indigo-400 focus:ring-indigo-400"
                          />
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <Textarea
                      label="Détails"
                      {...register('bedrooms.details')}
                      className="focus:border-indigo-400"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="interior-spaces" className="glass-card rounded-glass overflow-hidden mt-6">
  <AccordionTrigger className="px-6 py-4 hover:bg-white/10 transition-colors duration-200">
    <div className="flex items-center space-x-3">
      <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
      <span className="font-medium text-gray-900">Les intérieurs</span>
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
            <th className="p-3 text-left">Accès extérieur</th>
            <th className="p-3 text-left">Placard</th>
            <th className="p-3 text-left">Chauffage</th>
            <th className="p-3 text-left">Commentaires</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/20">
          {['Entrée', 'Salon', 'Cuisine', 'Chambre', 'Salle de bain', 'Bureau', 'Buanderie', 'Dressing'].map((room) => (
            <tr key={room}>
              <td className="p-3">{room}</td>
              <td className="p-3">
                <Input
                  {...register(`interiorSpaces.${room.toLowerCase().replace(' ', '_')}.surface`)}
                  className="w-full focus:border-indigo-400"
                />
              </td>
              <td className="p-3">
                <Input
                  {...register(`interiorSpaces.${room.toLowerCase().replace(' ', '_')}.floorCovering`)}
                  className="w-full focus:border-indigo-400"
                />
              </td>
              <td className="p-3">
                <Controller
                  name={`interiorSpaces.${room.toLowerCase().replace(' ', '_')}.state`}
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={[
                        { value: 'very_good', label: 'Très bon état' },
                        { value: 'good', label: 'Bon état' },
                        { value: 'average', label: 'Moyen état' },
                        { value: 'bad', label: 'Mauvais état' }
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </td>
              <td className="p-3">
                <Controller
                  name={`interiorSpaces.${room.toLowerCase().replace(' ', '_')}.exteriorAccess`}
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onChange={(checked) => field.onChange(checked)}
                      className="mx-auto text-indigo-400 focus:ring-indigo-400"
                    />
                  )}
                />
              </td>
              <td className="p-3">
                <Controller
                  name={`interiorSpaces.${room.toLowerCase().replace(' ', '_')}.closet`}
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onChange={(checked) => field.onChange(checked)}
                      className="mx-auto text-indigo-400 focus:ring-indigo-400"
                    />
                  )}
                />
              </td>
              <td className="p-3">
                <Input
                  {...register(`interiorSpaces.${room.toLowerCase().replace(' ', '_')}.heating`)}
                  className="w-full focus:border-indigo-400"
                />
              </td>
              <td className="p-3">
                <Input
                  {...register(`interiorSpaces.${room.toLowerCase().replace(' ', '_')}.comments`)}
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