import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Textarea } from '../../../../components/ui/Textarea';
import { propertyStates } from './constants';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { CheckCircle2, Info, Sparkles } from 'lucide-react';
import { generatePropertyDescription } from './generateDescription';

interface PropertyTabProps {
  control: any;
  register: any;
  propertyType: string;
  isGerant?: boolean;
  watch?: any;
  setValue?: any;
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

export function PropertyTab({ control, register, propertyType, isGerant = false, watch, setValue }: PropertyTabProps) {
  const isLand = propertyType === 'land';
  const isCommercial = propertyType === 'commercial';
  const isLuxury = propertyType === 'luxury';
  const isVacation = propertyType === 'vacation';
  const isResidential = propertyType === 'residential';

  const [generated, setGenerated] = useState(false);
  const descriptionLength = watch ? String(watch('property.description') || '').length : 0;
  const {
    ref: descriptionRef,
    onChange: descriptionOnChange,
    ...descriptionRegister
  } = register('property.description');

  const handleGenerateDescription = () => {
    if (!watch || !setValue) return;
    const description = generatePropertyDescription(watch(), propertyType);
    if (description) {
      setValue('property.description', description);
      setGenerated(true);
    }
  };

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
              <div className={`w-1.5 h-1.5 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`} />
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
                <label className="flex items-center gap-1.5 text-sm font-medium text-text">
                  <Sparkles className={`w-3.5 h-3.5 ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`} />
                  Description
                </label>
                <div className={`mt-1.5 relative rounded-xl border bg-gradient-to-b from-background/60 via-card to-card overflow-hidden transition-all duration-200 ${
                  isGerant
                    ? 'focus-within:border-[#905D5D]/60 focus-within:ring-2 focus-within:ring-[#905D5D]/15'
                    : 'focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/15'
                } ${generated ? 'border-emerald-300/70' : 'border-border/60'}`}>
                  <div className={`h-0.5 w-full ${isGerant ? 'bg-gradient-to-r from-[#905D5D] via-[#905D5D]/50 to-transparent' : 'bg-gradient-to-r from-accent via-accent/50 to-transparent'}`} />
                  <textarea
                    rows={5}
                    placeholder="Décrivez ce bien : surface, pièces, prestations, environnement, atouts…"
                    className="w-full min-h-[150px] pl-4 pr-52 pt-2.5 pb-6 text-sm leading-6 text-text placeholder:text-text-secondary/40 bg-transparent focus:outline-none resize-y overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent"
                    ref={descriptionRef}
                    onChange={(e) => {
                      descriptionOnChange(e);
                      if (generated) setGenerated(false);
                    }}
                    {...descriptionRegister}
                  />
                  <div className="absolute top-2.5 right-2.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="bg-card/90 backdrop-blur-sm shadow-sm"
                      icon={<Sparkles className="w-3.5 h-3.5" />}
                      onClick={handleGenerateDescription}
                    >
                      Générer la description
                    </Button>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-3 px-1">
                  {generated ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle2 className="w-3 h-3" />
                      Description générée avec succès
                    </span>
                  ) : (
                    <span className="text-xs text-text-secondary/50">
                      Un clic suffit pour rédiger une description professionnelle à partir des informations du bien.
                    </span>
                  )}
                  <span className="text-[11px] tabular-nums text-text-secondary/50 shrink-0">
                    {descriptionLength} caractère{descriptionLength > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="mt-1 flex items-start gap-1 px-1 text-[11px] leading-snug text-text-secondary/45">
                  <Info className="w-3 h-3 shrink-0 mt-0.5" />
                  Pour une description précise et complète, renseignez l'ensemble des champs nécessaires du bien avant de la générer.
                </p>
              </motion.div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
}
