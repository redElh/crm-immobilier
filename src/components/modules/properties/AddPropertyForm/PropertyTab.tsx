import { Controller } from 'react-hook-form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Textarea } from '../../../../components/ui/Textarea';
import { propertyStates } from './constants';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';

interface PropertyTabProps {
  control: any;
  register: any;
  propertyType: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 }
};

export function PropertyTab({ control, register, propertyType }: PropertyTabProps) {
  const isLand = propertyType === 'land';
  const isCommercial = propertyType === 'commercial';
  const isLuxury = propertyType === 'luxury';
  const isVacation = propertyType === 'vacation';
  const isResidential = propertyType === 'residential';

  const cityOptions = [
    'Essaouira', 'Marrakech', 'Sidi Kaouki', 'Sidi Ahmed Essayeh',
    'Ounagha', 'Arbaa Ida Ougourd', 'Tidzi',
  ].map(v => ({ value: v, label: v }));

  return (
    <MotionCard
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="p-0 overflow-hidden"
    >
      <Accordion type="multiple" defaultValue={['property-details']} className="space-y-0">
        <AccordionItem value="property-details" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="font-medium text-text">Caractéristiques du bien</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              <motion.div variants={item}>
                <Input label="Adresse du bien" {...register('property.address')} required />
              </motion.div>

              <motion.div variants={item}>
                <Controller
                  name="property.city"
                  control={control}
                  render={({ field }) => (
                    <Select label="Ville" options={cityOptions} value={field.value} onChange={field.onChange} required />
                  )}
                />
              </motion.div>

              {!isLand && (
                <motion.div variants={item}>
                  <Controller
                    name="property.state"
                    control={control}
                    render={({ field }) => (
                      <Select label="État du bien" options={propertyStates} value={field.value} onChange={field.onChange} />
                    )}
                  />
                </motion.div>
              )}

              {/* Land-specific fields */}
              {isLand && (
                <>
                  <motion.div variants={item}>
                    <Input label="Surface totale (m²)" type="number" {...register('property.surface')} required />
                  </motion.div>
                  <motion.div variants={item}>
                    <Input label="Largeur de façade (m)" type="number" step="0.1" {...register('property.facadeWidth')} />
                  </motion.div>
                  <motion.div variants={item}>
                    <Input label="Profondeur (m)" type="number" step="0.1" {...register('property.depth')} />
                  </motion.div>
                </>
              )}

              {/* Commercial-specific fields */}
              {isCommercial && (
                <>
                  <motion.div variants={item}>
                    <Input label="Surface totale (m²)" type="number" {...register('property.surface')} required />
                  </motion.div>
                  <motion.div variants={item}>
                    <Input label="Surface pondérée (m²)" type="number" {...register('property.pondereSurface')} />
                  </motion.div>
                  <motion.div variants={item}>
                    <Input label="Hauteur sous plafond (m)" type="number" step="0.1" {...register('property.ceilingHeight')} />
                  </motion.div>
                  <motion.div variants={item}>
                    <Input label="Charges annuelles (MAD)" type="number" {...register('property.chargesAnnuelles')} />
                  </motion.div>
                  <motion.div variants={item}>
                    <Input label="Nombre de pièces" type="number" {...register('property.rooms')} />
                  </motion.div>
                </>
              )}

              {/* Luxury-specific fields */}
              {isLuxury && (
                <>
                  <motion.div variants={item}>
                    <Input label="Surface totale (m²)" type="number" {...register('property.surface')} required />
                  </motion.div>
                  <motion.div variants={item}>
                    <Input label="Surface terrain (m²)" type="number" {...register('property.landSize')} />
                  </motion.div>
                  <motion.div variants={item}>
                    <Textarea label="Prestations haut de gamme" {...register('property.luxuryFeatures')} rows={3} />
                  </motion.div>
                </>
              )}

              {/* Residential/Standard fields */}
              {(isResidential || isVacation) && (
                <>
                  <motion.div variants={item}>
                    <Input label="Surface (m²)" type="number" {...register('property.surface')} />
                  </motion.div>
                  <motion.div variants={item}>
                    <Input label="Surface constructible (m²)" type="number" {...register('property.buildableSurface')} />
                  </motion.div>
                </>
              )}

              <motion.div variants={item}>
                <Input label="Référence cadastrale" {...register('property.cadastralReference')} />
              </motion.div>
              <motion.div variants={item}>
                <Input label="Année de construction" type="number" {...register('property.constructionYear')} />
              </motion.div>

              {/* Seasonal specific */}
              {isVacation && (
                <>
                  <motion.div variants={item}>
                    <Input label="Nombre de chambres" type="number" {...register('property.bedrooms')} />
                  </motion.div>
                  <motion.div variants={item}>
                    <Input label="Nombre de lits" type="number" {...register('property.beds')} />
                  </motion.div>
                </>
              )}

              <motion.div variants={item} className="md:col-span-2">
                <Textarea label="Description" {...register('property.description')} rows={3} />
              </motion.div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
}
