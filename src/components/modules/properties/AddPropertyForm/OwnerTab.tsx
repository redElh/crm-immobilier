import { Controller } from 'react-hook-form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { DatePicker } from '../../../../components/ui/DatePicker';
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
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 }
};

export function OwnerTab({ control, register, watch }: OwnerTabProps) {
  const ownerType = watch('ownerType');
  const hasOtherProperties = watch('saleInfo.otherProperties');

  return (
    <MotionCard
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="p-0 overflow-hidden"
    >
      <Accordion type="multiple" defaultValue={['owner-info']} className="space-y-0">
        <AccordionItem value="owner-info" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="font-medium text-text">Informations propriétaire</span>
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
                <Controller
                  name="ownerType"
                  control={control}
                  render={({ field }) => (
                    <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex gap-6"
                      >
                        <RadioGroupItem value="particulier" id="particulier">Particulier</RadioGroupItem>
                        <RadioGroupItem value="societe" id="societe">Société</RadioGroupItem>
                      </RadioGroup>
                    </div>
                  )}
                />
              </motion.div>

              {ownerType === 'particulier' ? (
                <>
                  <motion.div variants={item}>
                    <Input label="Nom" {...register('owner.lastName')} required />
                  </motion.div>
                  <motion.div variants={item}>
                    <Input label="Prénom" {...register('owner.firstName')} required />
                  </motion.div>
                  <motion.div variants={item}>
                    <Input label="Adresse" {...register('owner.address')} />
                  </motion.div>
                  <motion.div variants={item}>
                    <Input label="Téléphone" {...register('owner.phone')} />
                  </motion.div>
                  <motion.div variants={item}>
                    <Input label="Profession" {...register('owner.profession')} />
                  </motion.div>
                  <motion.div variants={item}>
                    <Input label="Email" type="email" {...register('owner.email')} />
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div variants={item}>
                    <Input label="Dénomination sociale" {...register('company.name')} required />
                  </motion.div>
                  <motion.div variants={item}>
                    <Input label="Forme sociale" {...register('company.legalForm')} />
                  </motion.div>
                  <motion.div variants={item}>
                    <Input label="N° Siren" {...register('company.siren')} />
                  </motion.div>
                  <motion.div variants={item}>
                    <Input label="Adresse" {...register('company.address')} />
                  </motion.div>
                </>
              )}
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sale-info" className="border-0 border-t border-border/40">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-premium" />
              <span className="font-medium text-text">Motivation de vente/location</span>
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
                <DatePicker label="Date d'achat" {...register('saleInfo.purchaseDate')} />
              </motion.div>
              <motion.div variants={item}>
                <Input label="Durée de mise en vente/location" {...register('saleInfo.listingDuration')} />
              </motion.div>
              <motion.div variants={item} className="md:col-span-2">
                <Textarea label="Raisons de la vente/location" {...register('saleInfo.motivation')} rows={3} />
              </motion.div>
              <motion.div variants={item} className="md:col-span-2">
                <Controller
                  name="saleInfo.otherProperties"
                  control={control}
                  render={({ field }) => (
                    <Checkbox label="Avez-vous d'autres biens à vendre/louer?" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                  )}
                />
              </motion.div>
              {hasOtherProperties && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="md:col-span-2"
                >
                  <Textarea label="Décrivez les autres biens à vendre/louer" {...register('saleInfo.otherPropertiesDescription')} rows={3} />
                </motion.div>
              )}
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
}
