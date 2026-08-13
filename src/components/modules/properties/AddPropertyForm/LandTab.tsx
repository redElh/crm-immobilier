import { Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { DatePicker } from '../../../../components/ui/DatePicker';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

interface LandTabProps {
  register: any;
  control: any;
  isGerant?: boolean;
}

export function LandTab({ register, control, isGerant = false }: LandTabProps) {
  return (
    <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="p-0 overflow-hidden">
      <Accordion type="multiple" defaultValue={['constructibility', 'connections', 'urbanism', 'topography']} className="space-y-0">
        <AccordionItem value="constructibility" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`} />
              <span className="font-medium text-text">Constructibilité</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div variants={item}>
                <Controller name="land.constructible" control={control} render={({ field }) => (
                  <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                    <h4 className="font-medium text-sm text-text mb-2">Constructible</h4>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="land_constructible" checked={field.value === true} onChange={() => field.onChange(true)} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                        <span className="text-sm">Oui</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="land_constructible" checked={field.value === false} onChange={() => field.onChange(false)} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                        <span className="text-sm">Non</span>
                      </label>
                    </div>
                  </div>
                )} />
              </motion.div>
              <motion.div variants={item}>
                <Input label="COS (Coefficient d'Occupation des Sols)" type="number" step="0.01" {...register('land.cos')} />
              </motion.div>
              <motion.div variants={item}>
                <Input label="SHON max (m²)" type="number" {...register('land.shon')} />
              </motion.div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="connections" className="border-0 border-t border-border/40">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="font-medium text-text">Raccordements</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Eau', 'Électricité', 'Assainissement', 'Gaz'].map((util) => (
                <motion.div key={util} variants={item} className="p-3 rounded-lg bg-background/50 border border-border/30">
                  <h4 className="font-medium text-sm text-text mb-2">{util}</h4>
                  <Controller name={`land.connections.${util.toLowerCase()}`} control={control} render={({ field }) => (
                    <div className="flex gap-3">
                      <label className="flex items-center gap-1 cursor-pointer text-sm">
                        <input type="radio" name={`conn_${util}`} checked={field.value === true} onChange={() => field.onChange(true)} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} /> Oui
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer text-sm">
                        <input type="radio" name={`conn_${util}`} checked={field.value === false} onChange={() => field.onChange(false)} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} /> Non
                      </label>
                    </div>
                  )} />
                </motion.div>
              ))}
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="urbanism" className="border-0 border-t border-border/40">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-premium" />
              <span className="font-medium text-text">Urbanisme</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div variants={item}>
                <Input label="PLU applicable" {...register('land.urbanism.plu')} />
              </motion.div>
              <motion.div variants={item}>
                <Controller name="land.urbanism.certificatUrbanisme" control={control} render={({ field }) => (
                  <Select label="Certificat d'urbanisme" options={[
                    { value: '', label: 'Sélectionner' },
                    { value: 'obtenu', label: 'Obtenu' },
                    { value: 'en_cours', label: 'En cours' },
                    { value: 'non_demande', label: 'Non demandé' },
                  ]} value={field.value} onChange={field.onChange} />
                )} />
              </motion.div>
              <motion.div variants={item}>
                <DatePicker label="Date du certificat" {...register('land.urbanism.certificatDate')} />
              </motion.div>
              <motion.div variants={item}>
                <Controller name="land.urbanism.zonage" control={control} render={({ field }) => (
                  <Select label="Zonage" options={[
                    { value: '', label: 'Sélectionner' },
                    { value: 'constructible', label: 'Constructible' },
                    { value: 'agricole', label: 'Agricole' },
                    { value: 'inondable', label: 'Inondable' },
                    { value: 'naturel', label: 'Naturel' },
                    { value: 'urbain', label: 'Urbain' },
                  ]} value={field.value} onChange={field.onChange} />
                )} />
              </motion.div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="topography" className="border-0 border-t border-border/40">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-interactive" />
              <span className="font-medium text-text">Topographie</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
              <motion.div variants={item} className="p-4 rounded-lg bg-background/50 border border-border/30">
                <h4 className="font-medium text-sm text-text mb-3">Terrain</h4>
                <Controller name="land.topography.type" control={control} render={({ field }) => (
                  <div className="flex gap-6">
                    {['Plat', 'En pente', 'Accidenté'].map((t) => (
                      <label key={t} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="topography_type" checked={field.value === t.toLowerCase()} onChange={() => field.onChange(t.toLowerCase())} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                        <span className="text-sm">{t}</span>
                      </label>
                    ))}
                  </div>
                )} />
              </motion.div>
              <motion.div variants={item} className="p-4 rounded-lg bg-background/50 border border-border/30">
                <h4 className="font-medium text-sm text-text mb-3">Vue</h4>
                <Controller name="land.topography.view" control={control} render={({ field }) => (
                  <div className="flex gap-6">
                    {['Dégagée', 'Montagne', 'Mer'].map((v) => (
                      <label key={v} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="topography_view" checked={field.value === v.toLowerCase()} onChange={() => field.onChange(v.toLowerCase())} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                        <span className="text-sm">{v}</span>
                      </label>
                    ))}
                  </div>
                )} />
              </motion.div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
}
