import { Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { DatePicker } from '../../../../components/ui/DatePicker';
import { Input } from '../../../../components/ui/Input';
import { RadioGroup } from '../../../../components/ui/RadioGroup/RadioGroup';
import { RadioGroupItem } from '../../../../components/ui/RadioGroup/RadioGroupItem';
import { portalPartners } from './constants';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

interface TransferTabProps {
  register: any;
  control: any;
}

export function TransferTab({ register, control }: TransferTabProps) {
  return (
    <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="p-0 overflow-hidden">
      <Accordion type="multiple" defaultValue={['transfer']} className="space-y-0">
        <AccordionItem value="transfer" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="font-medium text-text">Transfert / Diffusion</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
              <motion.div variants={item}>
                <h4 className="font-medium text-sm text-text mb-3">Partenaires actifs</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-lg bg-background/50 border border-border/30">
                  {portalPartners.map((partner) => (
                    <Controller key={partner} name={`portals.${partner.toLowerCase().replace(/[\s()]+/g, '_')}`} control={control} render={({ field }) => (
                      <Checkbox label={partner} checked={field.value} onChange={(c) => field.onChange(c)} />
                    )} />
                  ))}
                </div>
              </motion.div>

              <motion.div variants={item}>
                <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                  <h4 className="font-medium text-sm text-text mb-3">Statut de diffusion</h4>
                  <Controller name="diffusionStatus" control={control} render={({ field }) => (
                    <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-6">
                      <RadioGroupItem value="en_attente" id="ds-waiting">En attente</RadioGroupItem>
                      <RadioGroupItem value="publie" id="ds-published">Publié</RadioGroupItem>
                      <RadioGroupItem value="erreur" id="ds-error">Erreur</RadioGroupItem>
                    </RadioGroup>
                  )} />
                </div>
              </motion.div>

              <motion.div variants={item}>
                <DatePicker label="Dernière publication" {...register('dernierePublication')} />
              </motion.div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
}
