import { Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { Checkbox } from '../../../../components/ui/Checkbox';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

interface LuxuryTabProps {
  register: any;
  control: any;
}

export function LuxuryTab({ register, control }: LuxuryTabProps) {
  return (
    <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="p-0 overflow-hidden">
      <Accordion type="multiple" defaultValue={['confidentiality']} className="space-y-0">
        <AccordionItem value="confidentiality" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="font-medium text-text">Confidentialité</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div variants={item}>
                <Controller name="luxuryConfidentiality.hideAddress" control={control} render={({ field }) => (
                  <Checkbox label="Adresse masquée" checked={field.value} onChange={(c) => field.onChange(c)} />
                )} />
              </motion.div>
              <motion.div variants={item}>
                <Controller name="luxuryConfidentiality.visitsOnDemand" control={control} render={({ field }) => (
                  <Checkbox label="Visites sur demande" checked={field.value} onChange={(c) => field.onChange(c)} />
                )} />
              </motion.div>
              <motion.div variants={item} className="md:col-span-2">
                <Controller name="luxuryConfidentiality.confidentialityAgreement" control={control} render={({ field }) => (
                  <Checkbox label="Accords de confidentialité requis" checked={field.value} onChange={(c) => field.onChange(c)} />
                )} />
              </motion.div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
}
