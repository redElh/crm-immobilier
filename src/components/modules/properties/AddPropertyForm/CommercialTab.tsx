import { Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { DatePicker } from '../../../../components/ui/DatePicker';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

interface CommercialTabProps {
  register: any;
  control: any;
}

export function CommercialTab({ register, control }: CommercialTabProps) {
  return (
    <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="p-0 overflow-hidden">
      <Accordion type="multiple" defaultValue={['commercial']} className="space-y-0">
        <AccordionItem value="commercial" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="font-medium text-text">Informations juridiques commerciales</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div variants={item}>
                <Controller name="commercial.bailType" control={control} render={({ field }) => (
                  <Select label="Type de bail" options={[
                    { value: '', label: 'Sélectionner' },
                    { value: '3_6_9', label: 'Bail 3/6/9 ans' },
                    { value: 'precaire', label: 'Bail précaire' },
                    { value: 'professionnel', label: 'Bail professionnel' },
                  ]} value={field.value} onChange={field.onChange} />
                )} />
              </motion.div>
              <motion.div variants={item}>
                <Input label="Loyer annuel (MAD)" type="number" {...register('commercial.loyerAnnuel')} />
              </motion.div>
              <motion.div variants={item}>
                <Input label="Charges annuelles (MAD)" type="number" {...register('commercial.chargesAnnuelles')} />
              </motion.div>
              <motion.div variants={item}>
                <Input label="Dépôt de garantie (MAD)" type="number" {...register('commercial.depotGarantie')} />
              </motion.div>
              <motion.div variants={item}>
                <Controller name="commercial.dpeDate" control={control} render={({ field }) => (
                  <DatePicker label="Date DPE commercial" {...register('commercial.dpeDate')} />
                )} />
              </motion.div>
              <motion.div variants={item}>
                <Controller name="commercial.erp" control={control} render={({ field }) => (
                  <Select label="ERP (Établissement Recevant du Public)" options={[
                    { value: '', label: 'Sélectionner' },
                    { value: 'oui', label: 'Oui' },
                    { value: 'non', label: 'Non' },
                  ]} value={field.value} onChange={field.onChange} />
                )} />
              </motion.div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
}
