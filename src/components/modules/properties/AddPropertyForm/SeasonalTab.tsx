import { Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { Input } from '../../../../components/ui/Input';
import { Checkbox } from '../../../../components/ui/Checkbox';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

interface SeasonalTabProps {
  register: any;
  control: any;
  watch: any;
}

export function SeasonalTab({ register, control, watch }: SeasonalTabProps) {
  return (
    <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="p-0 overflow-hidden">
      <Accordion type="multiple" defaultValue={['priceGrid', 'options']} className="space-y-0">
        <AccordionItem value="priceGrid" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="font-medium text-text">Grille tarifaire</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
              <div className="overflow-x-auto rounded-lg border border-border/30">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-background/50">
                      <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Période</th>
                      <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Début</th>
                      <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Fin</th>
                      <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Prix/nuit</th>
                      <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Min nuits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {['Basse saison', 'Haute saison', 'Événements'].map((period) => (
                      <tr key={period} className="hover:bg-background/30 transition-colors">
                        <td className="p-3 font-medium text-text">{period}</td>
                        <td className="p-3"><Input {...register(`priceGrid.${period.toLowerCase().replace(/\s/g, '_')}.start`)} /></td>
                        <td className="p-3"><Input {...register(`priceGrid.${period.toLowerCase().replace(/\s/g, '_')}.end`)} /></td>
                        <td className="p-3"><Input type="number" {...register(`priceGrid.${period.toLowerCase().replace(/\s/g, '_')}.price`)} /></td>
                        <td className="p-3"><Input type="number" {...register(`priceGrid.${period.toLowerCase().replace(/\s/g, '_')}.minNights`)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="options" className="border-0 border-t border-border/40">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-interactive" />
              <span className="font-medium text-text">Options et services</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['Ménage fin de séjour', 'Petit-déjeuner', 'Parking privé', 'Location linge', 'Lit bébé', 'Panier de bienvenue', 'Service conciergerie', 'Navette aéroport'].map((opt) => (
                <motion.div key={opt} variants={item} className="p-3 rounded-lg bg-background/50 border border-border/30">
                  <Controller name={`options.${opt.toLowerCase().replace(/\s/g, '_')}.enabled`} control={control} render={({ field }) => (
                    <Checkbox label={opt} checked={field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Input type="number" placeholder="Prix" {...register(`options.${opt.toLowerCase().replace(/\s/g, '_')}.price`)} className="mt-2" />
                </motion.div>
              ))}
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
}
