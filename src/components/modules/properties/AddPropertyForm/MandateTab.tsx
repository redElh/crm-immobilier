import { Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { DatePicker } from '../../../../components/ui/DatePicker';
import { Input } from '../../../../components/ui/Input';
import { RadioGroup } from '../../../../components/ui/RadioGroup/RadioGroup';
import { RadioGroupItem } from '../../../../components/ui/RadioGroup/RadioGroupItem';
import { mandateGestionTypes } from './constants';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

interface MandateTabProps {
  register: any;
  control: any;
  watch: any;
  propertyType: string;
}

export function MandateTab({ register, control, watch, propertyType }: MandateTabProps) {
  const transactionType = watch('transactionType');
  const isLocation = transactionType === 'location_ld';

  function getMandateOptions() {
    if (propertyType === 'luxury') {
      return [
        { value: 'exclusif', label: 'Exclusif' },
        { value: 'simple', label: 'Simple' },
        { value: 'co_exclusif', label: 'Co-exclusif' },
        { value: 'exclusif_agence', label: 'Exclusif agence' },
        { value: 'delegation', label: 'Délégation' },
        { value: 'confrere', label: 'Confrère' },
      ];
    }
    if (propertyType === 'commercial' || propertyType === 'land') {
      return [
        { value: 'exclusif', label: 'Exclusif' },
        { value: 'simple', label: 'Simple' },
        { value: 'co_exclusif', label: 'Co-exclusif' },
        { value: 'delegation', label: 'Délégation' },
        { value: 'confrere', label: 'Confrère' },
      ];
    }
    return [
      { value: 'exclusif', label: 'Exclusif' },
      { value: 'simple', label: 'Simple' },
      { value: 'co_exclusif', label: 'Co-exclusif' },
      { value: 'exclusif_agence', label: 'Exclusif agence' },
      { value: 'delegation', label: 'Délégation' },
      { value: 'confrere', label: 'Confrère' },
    ];
  }

  function getDefaultMandate() {
    if (propertyType === 'land') return 'simple';
    return 'exclusif';
  }

  const options = isLocation ? mandateGestionTypes : getMandateOptions();
  const defaultMandate = isLocation ? mandateGestionTypes[0]?.value : getDefaultMandate();

  return (
    <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="p-0 overflow-hidden">
      <Accordion type="multiple" defaultValue={['mandate']} className="space-y-0">
        <AccordionItem value="mandate" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="font-medium text-text">Mandat</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div variants={item} className="md:col-span-2">
                <Controller name="mandate.type" control={control} defaultValue={defaultMandate} render={({ field }) => (
                  <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                    <h4 className="font-medium text-sm text-text mb-3">Type de mandat</h4>
                    <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-6">
                      {options.map((mt) => (
                        <RadioGroupItem key={mt.value} value={mt.value} id={`mt-${mt.value}`}>{mt.label}</RadioGroupItem>
                      ))}
                    </RadioGroup>
                  </div>
                )} />
              </motion.div>

              <motion.div variants={item}>
                <DatePicker label="Date de début" {...register('mandate.startDate')} />
              </motion.div>
              <motion.div variants={item}>
                <DatePicker label="Date de fin" {...register('mandate.endDate')} />
              </motion.div>
              <motion.div variants={item}>
                <Input label="Rémunération / Honoraires" type="number" {...register('mandate.remuneration')} />
              </motion.div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
}
