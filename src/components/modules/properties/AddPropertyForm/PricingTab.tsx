import { Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { Input } from '../../../../components/ui/Input';
import { RadioGroup } from '../../../../components/ui/RadioGroup/RadioGroup';
import { RadioGroupItem } from '../../../../components/ui/RadioGroup/RadioGroupItem';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { Select } from '../../../../components/ui/Select';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

interface PricingTabProps {
  register: any;
  control: any;
  watch: any;
  propertyType: string;
}

export function PricingTab({ register, control, watch, propertyType }: PricingTabProps) {
  const transactionType = watch('transactionType') || 'vente';
  const devise = watch('devise') || 'MAD';
  const honorairesType = watch('honorairesType');
  const prixNet = watch('prixNetVendeur');
  const honorairesPct = watch('honorairesPct');
  const prixAffiche = prixNet && honorairesPct
    ? Math.round(Number(prixNet) * (1 + Number(honorairesPct) / 100))
    : '';
  const loyerHC = watch('loyerHC');
  const charges = watch('charges');
  const isSeasonal = propertyType === 'vacation';
  const isLuxury = propertyType === 'luxury';

  if (isSeasonal) {
    return (
      <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="p-0 overflow-hidden">
        <Accordion type="multiple" defaultValue={['pricing']} className="space-y-0">
          <AccordionItem value="pricing" className="border-0">
            <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span className="font-medium text-text">Tarifs saisonniers</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div variants={item}>
                  <Input label="Prix par nuit (min)" type="number" {...register('seasonalPriceMin')} required />
                </motion.div>
                <motion.div variants={item}>
                  <Input label="Prix par nuit (max)" type="number" {...register('seasonalPriceMax')} required />
                </motion.div>
                <motion.div variants={item}>
                  <Input label="Prix semaine" type="number" {...register('seasonalPriceWeek')} />
                </motion.div>
                <motion.div variants={item}>
                  <Input label="Prix mois" type="number" {...register('seasonalPriceMonth')} />
                </motion.div>
                <motion.div variants={item}>
                  <Controller name="devise" control={control} render={({ field }) => (
                    <Select label="Devise" options={[
                      { value: 'MAD', label: 'MAD' },
                      { value: 'EUR', label: 'EUR' },
                      { value: 'USD', label: 'USD' },
                    ]} value={field.value} onChange={field.onChange} />
                  )} />
                </motion.div>
                <motion.div variants={item}>
                  <Input label="Capacité maximum" type="number" {...register('sleepingCapacity')} />
                </motion.div>
              </motion.div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </MotionCard>
    );
  }

  if (isLuxury) {
    return (
      <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="p-0 overflow-hidden">
        <Accordion type="multiple" defaultValue={['pricing']} className="space-y-0">
          <AccordionItem value="pricing" className="border-0">
            <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span className="font-medium text-text">Prix</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div variants={item}>
                  <Controller name="prixSurDemande" control={control} render={({ field }) => (
                    <Checkbox label="Prix sur demande (masqué)" checked={field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                </motion.div>
                <motion.div variants={item}>
                  <Controller name="prixConfidentiel" control={control} render={({ field }) => (
                    <Checkbox label="Prix confidentiel (visible agent seulement)" checked={field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                </motion.div>
                <motion.div variants={item}>
                  <Controller name="devise" control={control} render={({ field }) => (
                    <Select label="Devise" options={[
                      { value: 'MAD', label: 'MAD' },
                      { value: 'EUR', label: 'EUR' },
                      { value: 'USD', label: 'USD' },
                    ]} value={field.value} onChange={field.onChange} />
                  )} />
                </motion.div>
                <motion.div variants={item}>
                  <Input label={`Prix (${devise})`} type="number" {...register('prixNetVendeur')} />
                </motion.div>
                <motion.div variants={item}>
                  <Input label={`Estimation (${devise})`} type="number" {...register('estimation')} />
                </motion.div>
              </motion.div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </MotionCard>
    );
  }

  if (transactionType === 'location_ld') {
    return (
      <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="p-0 overflow-hidden">
        <Accordion type="multiple" defaultValue={['pricing']} className="space-y-0">
          <AccordionItem value="pricing" className="border-0">
            <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span className="font-medium text-text">Prix et Honoraires - Location</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div variants={item}>
                  <Controller name="devise" control={control} render={({ field }) => (
                    <Select label="Devise" options={[
                      { value: 'MAD', label: 'MAD' },
                      { value: 'EUR', label: 'EUR' },
                      { value: 'USD', label: 'USD' },
                    ]} value={field.value} onChange={field.onChange} />
                  )} />
                </motion.div>
                <motion.div variants={item}>
                  <Input label={`Loyer mensuel HC (${devise})`} type="number" {...register('loyerHC')} required />
                </motion.div>
                <motion.div variants={item}>
                  <Input label={`Charges mensuelles (${devise})`} type="number" {...register('charges')} />
                </motion.div>
                <motion.div variants={item}>
                  <Input label={`Loyer CC (${devise})`} type="number" value={loyerHC && charges ? Number(loyerHC) + Number(charges) : ''} readOnly />
                </motion.div>
                <motion.div variants={item}>
                  <Controller name="depotGarantie" control={control} render={({ field }) => (
                    <Select label="Dépôt de garantie" options={[
                      { value: '1_mois', label: '1 mois' },
                      { value: '2_mois', label: '2 mois' },
                      { value: '3_mois', label: '3 mois' },
                    ]} value={field.value} onChange={field.onChange} />
                  )} />
                </motion.div>
                <motion.div variants={item}>
                  <Input label={`Honoraires de location (${devise})`} type="number" {...register('honorairesLocation')} />
                </motion.div>
              </motion.div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </MotionCard>
    );
  }

  return (
    <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="p-0 overflow-hidden">
      <Accordion type="multiple" defaultValue={['pricing']} className="space-y-0">
        <AccordionItem value="pricing" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="font-medium text-text">Prix et Honoraires</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div variants={item}>
                <Controller name="devise" control={control} render={({ field }) => (
                  <Select label="Devise" options={[
                    { value: 'MAD', label: 'MAD' },
                    { value: 'EUR', label: 'EUR' },
                    { value: 'USD', label: 'USD' },
                  ]} value={field.value} onChange={field.onChange} />
                )} />
              </motion.div>
              <motion.div variants={item}>
                <Input label={`Prix net vendeur (${devise})`} type="number" {...register('prixNetVendeur')} required />
              </motion.div>

              <motion.div variants={item}>
                <Controller name="honorairesType" control={control} render={({ field }) => (
                  <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                    <h4 className="font-medium text-sm text-text mb-2">Type d'honoraires</h4>
                    <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4">
                      <RadioGroupItem value="inclus" id="ht-inclus">Inclus dans prix</RadioGroupItem>
                      <RadioGroupItem value="en_sus" id="ht-sus">En sus du prix</RadioGroupItem>
                    </RadioGroup>
                  </div>
                )} />
              </motion.div>

              <motion.div variants={item}>
                <Input label="Honoraires (%)" type="number" step="0.1" {...register('honorairesPct')} />
              </motion.div>

              <motion.div variants={item}>
                <Input label={`Prix affiché (${devise})`} type="number" value={prixAffiche || ''} readOnly />
              </motion.div>

              <motion.div variants={item} className="md:col-span-2">
                <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                  <div className="flex items-center gap-4">
                    <Controller name="negociable" control={control} render={({ field }) => (
                      <Checkbox label="Prix négociable" checked={field.value} onChange={(c) => field.onChange(c)} />
                    )} />
                    <Input label={`Prix minimum (${devise})`} type="number" {...register('prixMinimum')} className="w-48" />
                  </div>
                </div>
              </motion.div>

              <motion.div variants={item}>
                <Input label={`Prix évalué par expertise (${devise})`} type="number" {...register('prixExpertise')} />
              </motion.div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
}
