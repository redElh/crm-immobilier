import { Controller } from 'react-hook-form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { Input } from '../../../../components/ui/Input';
import { Textarea } from '../../../../components/ui/Textarea';
import { RadioGroup } from '../../../../components/ui/RadioGroup/RadioGroup';
import { RadioGroupItem } from '../../../../components/ui/RadioGroup/RadioGroupItem';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';

interface OwnerTabProps {
  control: any;
  register: any;
  watch?: any;
  ownerType?: string; // Make it optional since we might use watch instead
}

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export function OwnerTab({ control, register, watch }: OwnerTabProps) {
  const ownerType = watch('ownerType');
  const hasOtherProperties = watch('saleInfo.otherProperties'); // Watch the checkbox value
  return (
    <MotionCard
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 glass-card rounded-glass"
    >
      <Accordion type="multiple" defaultValue={['owner-info']} className="space-y-4">
        <AccordionItem value="owner-info" className="glass-card rounded-glass overflow-hidden">
          <AccordionTrigger className="px-6 py-4 hover:bg-white/10 transition-colors duration-200">
            <div className="flex items-center space-x-3">
              <span className="font-medium text-gray-900 dark:text-b">Informations propriétaire</span>
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
                name="ownerType"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex gap-6 col-span-2 p-4 bg-white/10 rounded-glass"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem 
                        value="particulier" 
                        id="particulier" 
                        checked={field.value === "particulier"}
                        className="text-purple-400 border-white/30 focus:ring-purple-400"
                      />
                      <label htmlFor="particulier" className="text-gray-900 ">Particulier</label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem 
                        value="societe" 
                        id="societe"
                        checked={field.value === "societe"}
                        className="text-purple-400 border-white/30 focus:ring-purple-400"
                      />
                      <label htmlFor="societe" className="text-gray-900 ">Société</label>
                    </div>
                  </RadioGroup>
                )}
              />

{ownerType === 'particulier' ? (
  <>
    <Input 
      label="Nom" 
      {...register('owner.lastName')} 
      required 
    />
    <Input 
      label="Prénom" 
      {...register('owner.firstName')} 
      required 
    />
    <Input 
      label="Adresse" 
      {...register('owner.address')} 
    />
    <Input 
      label="Téléphone" 
      {...register('owner.phone')} 
    />
    <Input 
      label="Profession" 
      {...register('owner.profession')} 
    />
    <Input 
      label="Email" 
      type="email" 
      {...register('owner.email')} 
    />
  </>
) : (
  <>
    <Input 
      label="Dénomination sociale" 
      {...register('company.name')} 
      required 
    />
    <Input 
      label="Forme sociale" 
      {...register('company.legalForm')} 
    />
    <Input 
      label="N° Siren" 
      {...register('company.siren')} 
    />
    <Input 
      label="Adresse" 
      {...register('company.address')} 
    />
  </>
)}
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sale-info" className="glass-card rounded-glass overflow-hidden">
          <AccordionTrigger className="px-6 py-4 hover:bg-white/10 transition-colors duration-200">
            <div className="flex items-center space-x-3">
              <span className="font-medium text-gray-900">Motivation de vente/location</span>
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
                label="Date d'achat"
                type="date"
                {...register('saleInfo.purchaseDate')}
              />
              
              <Input
                label="Durée de mise en vente/location"
                {...register('saleInfo.listingDuration')}
              />

              <div className="col-span-2">
                <Textarea
                  label="Raisons de la vente/location"
                  {...register('saleInfo.motivation')}
                  rows={3}
                />
              </div>

              <Controller
                name="saleInfo.otherProperties"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    label="Avez-vous d'autres biens à vendre/louer?"
                    checked={field.value}
                    onChange={(checked) => field.onChange(checked)}
                  />
                )}
              />

              {/* Add this conditional textarea */}
              {hasOtherProperties && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="col-span-2"
                >
                  <Textarea
                    label="Décrivez les autres biens à vendre/louer"
                    {...register('saleInfo.otherPropertiesDescription')}
                    rows={3}
                  />
                </motion.div>
              )}
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
}