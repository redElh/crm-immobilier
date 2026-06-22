import { Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { DatePicker } from '../../../../components/ui/DatePicker';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { dpeClasses } from './constants';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

interface DiagnosticsTabProps {
  register: any;
  control: any;
  watch: any;
  propertyType: string;
}

type DiagnosticField = {
  name: string;
  label: string;
  show: boolean;
  hasSurface?: boolean;
};

export function DiagnosticsTab({ register, control, watch, propertyType }: DiagnosticsTabProps) {
  const isSale = watch('transactionType') === 'vente' || propertyType === 'land';
  const isCommercial = propertyType === 'commercial';
  const isLand = propertyType === 'land';
  const fields: DiagnosticField[] = [
    { name: 'dpe', label: 'DPE (Diagnostic Performance Énergétique)', show: !isCommercial },
    { name: 'constatRisques', label: 'Constat des risques (naturels, miniers, etc.)', show: true },
    { name: 'plomb', label: 'Diagnostic plomb (si avant 1949)', show: isSale && !isLand },
    { name: 'amiante', label: 'Diagnostic amiante (si avant 1997)', show: isSale && !isLand && !isCommercial },
    { name: 'electricite', label: 'Diagnostic électricité (si > 15 ans)', show: !isLand },
    { name: 'gaz', label: 'Diagnostic gaz (si > 15 ans)', show: !isLand },
    { name: 'loiCarrez', label: 'Loi Carrez (surface privative)', show: isSale && !isLand && !isCommercial, hasSurface: true },
    { name: 'erp', label: "ERP (État des Risques et Pollutions)", show: true },
    { name: 'dpeCommercial', label: 'DPE Commercial', show: isCommercial },
    { name: 'etudeSol', label: 'Étude de sol (pollution)', show: isLand },
  ];

  const visibleFields = fields.filter(f => f.show);

  return (
    <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="p-0 overflow-hidden">
      <Accordion type="multiple" defaultValue={['diagnostics']} className="space-y-0">
        <AccordionItem value="diagnostics" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="font-medium text-text">Diagnostics obligatoires</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
              {visibleFields.map((field) => (
                <motion.div key={field.name} variants={item} className="p-4 rounded-lg bg-background/50 border border-border/30">
                  <h4 className="font-medium text-sm text-text mb-3">{field.label}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DatePicker label="Date" {...register(`diagnostics.${field.name}.date`)} />
                    {field.name === 'dpe' && (
                      <Controller name={`diagnostics.${field.name}.classe`} control={control} render={({ field: f }) => (
                        <Select label="Classe" options={dpeClasses} value={f.value} onChange={f.onChange} />
                      )} />
                    )}
                    {field.hasSurface && (
                      <Input label="Surface (m²)" type="number" {...register(`diagnostics.${field.name}.surface`)} />
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
}
