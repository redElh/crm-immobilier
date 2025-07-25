import { Controller } from 'react-hook-form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Textarea } from '../../../../components/ui/Textarea';
import { propertyStates } from './constants';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';

interface PropertyTabProps {
  control: any;
  register: any;
}

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export function PropertyTab({ control, register }: PropertyTabProps) {
  return (
    <MotionCard
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 glass-card rounded-glass"
    >
      <Accordion type="multiple" defaultValue={['property-details']} className="space-y-4">
        <AccordionItem value="property-details" className="glass-card rounded-glass overflow-hidden">
          <AccordionTrigger className="px-6 py-4 hover:bg-white/10 transition-colors duration-200">
            <div className="flex items-center space-x-3">
              <span className="font-medium text-gray-900 ">Détails du bien</span>
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
                label="Adresse du bien" 
                {...register('property.address')} 
                required 
              />
              
              <Controller
                name="property.state"
                control={control}
                render={({ field }) => (
                  <Select
                    label="État du bien"
                    options={propertyStates}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              <Input 
                label="Référence cadastrale" 
                {...register('property.cadastralReference')} 
                className=" focus:border-teal-400"
              />

              <Input
                label="Surface (m²)"
                type="number"
                {...register('property.surface')}
                className=" focus:border-teal-400"
              />

              <Input
                label="Surface constructible (m²)"
                type="number"
                {...register('property.buildableSurface')}
                className=" focus:border-teal-400"
              />

              <Input
                label="Année de construction"
                type="number"
                {...register('property.constructionYear')}
                className=" focus:border-teal-400"
              />

              <div className="col-span-2">
                <Textarea
                  label="Commentaires"
                  {...register('property.comments')}
                  rows={3}
                  className=" focus:border-teal-400"
                />
              </div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
}