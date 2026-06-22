import { Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../ui/Select';
import { proximiteItems } from './constants';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

interface ProximitiesTabProps {
  register: any;
  control: any;
}

export function ProximitiesTab({ register, control }: ProximitiesTabProps) {
  const rows = [];
  for (let i = 0; i < proximiteItems.length; i += 3) {
    rows.push(proximiteItems.slice(i, i + 3));
  }

  return (
    <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="p-0 overflow-hidden">
      <Accordion type="multiple" defaultValue={['proximities']} className="space-y-0">
        <AccordionItem value="proximities" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="font-medium text-text">Proximités</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div variants={container} initial="hidden" animate="show" className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-background/50 border-y border-border/40">
                    <th className="pl-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Élément</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Distance</th>
                    <th className="pr-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Unité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {rows.map((row, rowIdx) => (
                    <motion.tr key={rowIdx} variants={item} className="hover:bg-background/30 transition-colors">
                      {row.map((item) => (
                        <td key={item} className="py-2.5 px-3">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-text w-36 text-sm">{item}</span>
                            <Input {...register(`proximites.${item.toLowerCase().replace(/[/\s]+/g, '_')}.distance`)} className="w-20" />
                            <Controller name={`proximites.${item.toLowerCase().replace(/[/\s]+/g, '_')}.unite`} control={control} render={({ field }) => (
                              <Select options={[
                                { value: 'm', label: 'm' },
                                { value: 'km', label: 'km' },
                                { value: 'min', label: 'min' },
                              ]} value={field.value} onValueChange={(v) => field.onChange(v)} className="w-20" />
                            )} />
                          </div>
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
}
