import { Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../ui/Select';
import { proximiteItems } from './constants';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const motionItem = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

interface ProximitiesTabProps {
  register: any;
  control: any;
  isGerant?: boolean;
}

export function ProximitiesTab({ register, control, isGerant = false }: ProximitiesTabProps) {
  return (
    <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="p-0 overflow-hidden">
      <Accordion type="multiple" defaultValue={['proximities']} className="space-y-0">
        <AccordionItem value="proximities" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`} />
              <span className="font-medium text-text">Proximités</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div variants={container} initial="hidden" animate="show" className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-background/50 border-y border-border/40">
                    <th className="pl-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-44">Élément</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-28">Distance</th>
                    <th className="pr-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-28">Unité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {proximiteItems.map((prox, idx) => {
                    const key = prox.toLowerCase().replace(/[/\s]+/g, '_')
                    return (
                      <motion.tr key={idx} variants={motionItem} className="hover:bg-background/30 transition-colors">
                        <td className="pl-4 py-2.5 font-medium text-text text-sm">{prox}</td>
                        <td className="px-3 py-2.5">
                          <Input {...register(`proximites.${key}.distance`)} type="number" className="w-24" />
                        </td>
                        <td className="pr-4 py-2.5">
                          <Controller name={`proximites.${key}.unite`} control={control} render={({ field }) => (
                            <Select options={[
                              { value: 'm', label: 'm' },
                              { value: 'km', label: 'km' },
                              { value: 'min', label: 'min' },
                            ]} value={field.value || 'km'} onValueChange={(v) => field.onChange(v)} className="w-24" />
                          )} />
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
}
