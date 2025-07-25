import { UseFormRegister, Control, UseFormWatch } from 'react-hook-form';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { transactionTypes, propertyTypes, locations } from './constants';
import { Controller } from 'react-hook-form';
import { TabsContent } from '../../../../components/ui/Tabs/Tabs';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';


interface GeneralTabProps {
  register: UseFormRegister<any>;
  control: Control<any>;
  watch: UseFormWatch<any>;
}

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export function GeneralTab({ register, control, watch }: GeneralTabProps) {
  const transactionType = watch('transactionType');
  
  return (
    <TabsContent value="general">
      <MotionCard 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <Accordion type="multiple" defaultValue={['basic-info']} className="space-y-4">
          <AccordionItem value="basic-info" className="glass-card rounded-glass overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:bg-b/10 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="font-medium text-gray-900 dark:text-b">Informations de base</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pt-2 pb-6">
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >

                <Input
                  label="Titre du bien"
                  {...register('propertyTitle')}
                  required
                  className="col-span-2"
                />

                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Statut"
                      options={[
                        { value: 'for_sale', label: 'À vendre' },
                        { value: 'for_rent', label: 'À louer' },
                        { value: 'sold', label: 'Vendu' },
                        { value: 'rented', label: 'Loué' }
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                      required
                    />
                  )}
                />

                <Input
                  label="Prix actuel"
                  type="number"
                  {...register('currentPrice')}
                  required
                />

                <Input
                  label="Estimation du marché"
                  type="number"
                  {...register('marketEstimate')}
                />

                <Input
                  label="Date"
                  type="date"
                  {...register('date')}
                  required
                />
                
                <Controller
                  name="transactionType"
                  control={control}
                  render={({ field }) => (
                    <div className="mt-5">
                    <Select
                      label="Type de transaction"
                      options={transactionTypes}
                      value={field.value}
                      onChange={field.onChange}
                      required
                    />
                    </div>
                  )}
                />

                <Controller
                  name="propertyType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Type de bien"
                      options={propertyTypes}
                      value={field.value}
                      onChange={field.onChange}
                      required
                    />
                  )}
                />

                
                  <Controller
                    name="furnishing"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Meublé"
                        options={[
                          { value: 'meuble', label: 'Meublé' },
                          { value: 'semi_meuble', label: 'Semi-meublé' },
                          { value: 'vide', label: 'Vide' }
                        ]}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />

                  {/* Media Upload Section */}
                <div className="col-span-2 space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-500 ">
                      Photos du bien
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        id="propertyPhotos"
                        accept="image/*"
                        multiple
                        className="hidden"
                        {...register('photos')}
                      />
                      <label
                        htmlFor="propertyPhotos"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600 transition"
                      >
                        Ajouter des photos
                      </label>
                      <span className="text-sm text-gray-500">JPEG, PNG (max 10MB)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Vidéos du bien
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        id="propertyVideos"
                        accept="video/*"
                        multiple
                        className="hidden"
                        {...register('videos')}
                      />
                      <label
                        htmlFor="propertyVideos"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600 transition"
                      >
                        Ajouter des vidéos
                      </label>
                      <span className="text-sm text-gray-500">MP4, MOV (max 50MB)</span>
                    </div>
                  </div>
                </div>
                
              </motion.div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="location-info" className="glass-card rounded-glass overflow-hidden mt-4">
            <AccordionTrigger className="px-6 py-4 hover:bg-white/10 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="font-medium text-gray-900 dark:text-b">Situation et localisation</span>
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
                  name="location.type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Type de localisation"
                      options={locations}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />

                <Controller
                  name="location.exposition"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Exposition"
                      options={[
                        { value: 'nord', label: 'Nord' },
                        { value: 'sud', label: 'Sud' },
                        { value: 'est', label: 'Est' },
                        { value: 'ouest', label: 'Ouest' }
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />

                <Controller
                  name="location.currentUse"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Situation actuelle"
                      options={[
                        { value: 'residence_principale', label: 'Résidence principale' },
                        { value: 'residence_secondaire', label: 'Résidence secondaire' },
                        { value: 'vacant', label: 'Vacant' }
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />

                <div className="flex flex-col space-y-5 md:space-y-0 md:flex-row md:items-between md:space-x-8">
                  <Controller
                    name="location.buildable"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        label="Surface constructible"
                        checked={field.value}
                        onChange={(checked) => field.onChange(checked)}
                      />
                    )}
                  />
                  <Controller
                    name="location.avna"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        label="AVNA"
                        checked={field.value}
                        onChange={(checked) => field.onChange(checked)}
                      />
                    )}
                  />
                </div>
              </motion.div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </MotionCard>
    </TabsContent>
  );
}