import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Textarea } from '../../../../components/ui/Textarea';
import { propertyStates } from './constants';
import { Button } from '../../../../components/ui/Button';
import { CheckCircle2, Info, Sparkles, Home } from 'lucide-react';
import { generatePropertyDescription } from './generateDescription';
import { useStageChrome } from '../../../../components/modules/calendar/useStageChrome';
import { SectionCard, SubPanel, Field, FieldGrid } from './stage';
import { cn } from '../../../../lib/utils';

interface PropertyTabProps {
  control: any;
  register: any;
  propertyType: string;
  isGerant?: boolean;
  watch?: any;
  setValue?: any;
}

export function PropertyTab({ control, register, propertyType, isGerant = false, watch, setValue }: PropertyTabProps) {
  const { staged, dark } = useStageChrome();
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

  const descPanelClass = staged
    ? dark
      ? 'mt-1.5 relative rounded-2xl border bg-gradient-to-b from-white/[0.06] to-white/[0.02] overflow-hidden transition-all duration-200 focus-within:border-violet-400/60 focus-within:shadow-[0_0_0_3px_rgba(124,92,255,0.2)]'
      : 'mt-1.5 relative rounded-2xl border bg-gradient-to-b from-white to-teal-50/60 overflow-hidden transition-all duration-200 focus-within:border-teal-500/60 focus-within:shadow-[0_0_0_3px_rgba(20,184,166,0.18)]'
    : 'mt-1.5 relative rounded-xl border bg-gradient-to-b from-background/60 via-card to-card overflow-hidden transition-all duration-200 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/15';
  const descBorder = generated
    ? staged ? 'border-emerald-400/60' : 'border-emerald-300/70'
    : staged ? (dark ? 'border-white/10' : 'border-teal-900/10') : 'border-border/60';

  return (
    <div className="space-y-5">
      <SectionCard value="property-details" title="Caractéristiques du bien" icon={Home} subtitle="Adresse, surface, référence et description">
        <FieldGrid>
          <Field>
            <Input label="Adresse du bien" {...register('property.address')} required />
          </Field>

          <Field>
            <Controller
              name="property.city"
              control={control}
              render={({ field }) => (
                <Select label="Ville" options={cityOptions} value={field.value} onChange={field.onChange} required />
              )}
            />
          </Field>

          {!isLand && (
            <Field>
              <Controller
                name="property.state"
                control={control}
                render={({ field }) => (
                  <Select label="État du bien" options={propertyStates} value={field.value} onChange={field.onChange} />
                )}
              />
            </Field>
          )}

          {isLand && (
            <>
              <Field>
                <Input label="Surface totale (m²)" type="number" {...register('property.surface')} required />
              </Field>
              <Field>
                <Input label="Largeur de façade (m)" type="number" step="0.1" {...register('property.facadeWidth')} />
              </Field>
              <Field>
                <Input label="Profondeur (m)" type="number" step="0.1" {...register('property.depth')} />
              </Field>
            </>
          )}

          {isCommercial && (
            <>
              <Field>
                <Input label="Surface totale (m²)" type="number" {...register('property.surface')} required />
              </Field>
              <Field>
                <Input label="Surface pondérée (m²)" type="number" {...register('property.pondereSurface')} />
              </Field>
              <Field>
                <Input label="Hauteur sous plafond (m)" type="number" step="0.1" {...register('property.ceilingHeight')} />
              </Field>
              <Field>
                <Input label="Charges annuelles (MAD)" type="number" {...register('property.chargesAnnuelles')} />
              </Field>
              <Field>
                <Input label="Nombre de pièces" type="number" {...register('property.rooms')} />
              </Field>
            </>
          )}

          {isLuxury && (
            <>
              <Field>
                <Input label="Surface totale (m²)" type="number" {...register('property.surface')} required />
              </Field>
              <Field>
                <Input label="Surface terrain (m²)" type="number" {...register('property.landSize')} />
              </Field>
              <Field>
                <Textarea label="Prestations haut de gamme" {...register('property.luxuryFeatures')} rows={3} />
              </Field>
            </>
          )}

          {(isResidential || isVacation) && (
            <>
              <Field>
                <Input label="Surface (m²)" type="number" {...register('property.surface')} />
              </Field>
              <Field>
                <Input label="Surface constructible (m²)" type="number" {...register('property.buildableSurface')} />
              </Field>
            </>
          )}

          <Field>
            <Input label="Référence cadastrale" {...register('property.cadastralReference')} />
          </Field>
          <Field>
            <Input label="Année de construction" type="number" {...register('property.constructionYear')} />
          </Field>

          {isVacation && (
            <>
              <Field>
                <Input label="Nombre de chambres" type="number" {...register('property.bedrooms')} />
              </Field>
              <Field>
                <Input label="Nombre de lits" type="number" {...register('property.beds')} />
              </Field>
            </>
          )}

          <Field className="md:col-span-2">
            <label className={cn('flex items-center gap-1.5 text-sm font-medium', staged ? (dark ? 'text-slate-300' : 'text-teal-900') : 'text-text')}>
              <Sparkles className={cn('w-3.5 h-3.5', staged ? (dark ? 'text-violet-300' : 'text-teal-600') : 'text-accent')} />
              Description
            </label>
            <div className={cn(descPanelClass, descBorder)}>
              <div className={cn('h-0.5 w-full', staged ? (dark ? 'bg-gradient-to-r from-violet-400 via-violet-400/50 to-transparent' : 'bg-gradient-to-r from-teal-500 via-teal-500/50 to-transparent') : 'bg-gradient-to-r from-accent via-accent/50 to-transparent')} />
              <textarea
                rows={5}
                placeholder="Décrivez ce bien : surface, pièces, prestations, environnement, atouts…"
                className={cn(
                  'w-full min-h-[150px] pl-4 pr-52 pt-2.5 pb-6 text-sm leading-6 resize-y overflow-y-auto bg-transparent focus:outline-none [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent',
                  staged ? (dark ? 'text-slate-100 placeholder:text-slate-500' : 'text-teal-950 placeholder:text-teal-900/35') : 'text-text placeholder:text-text-secondary/40',
                )}
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
                  className={cn(
                    'backdrop-blur-sm shadow-sm',
                    staged && (dark ? 'bg-white/10 border-white/15 text-slate-200 hover:bg-white/15 hover:text-white' : 'bg-white/70 border-teal-900/10 text-teal-900 hover:bg-white hover:text-teal-900'),
                  )}
                  icon={<Sparkles className={cn('w-3.5 h-3.5', staged && (dark ? 'text-violet-300' : 'text-teal-600'))} />}
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
                <span className={cn('text-xs', staged ? (dark ? 'text-slate-500' : 'text-teal-900/45') : 'text-text-secondary/50')}>
                  Un clic suffit pour rédiger une description professionnelle à partir des informations du bien.
                </span>
              )}
              <span className={cn('text-[11px] tabular-nums shrink-0', staged ? (dark ? 'text-slate-500' : 'text-teal-900/45') : 'text-text-secondary/50')}>
                {descriptionLength} caractère{descriptionLength > 1 ? 's' : ''}
              </span>
            </div>
            <p className={cn('mt-1 flex items-start gap-1 px-1 text-[11px] leading-snug', staged ? (dark ? 'text-slate-500' : 'text-teal-900/40') : 'text-text-secondary/45')}>
              <Info className="w-3 h-3 shrink-0 mt-0.5" />
              Pour une description précise et complète, renseignez l'ensemble des champs nécessaires du bien avant de la générer.
            </p>
          </Field>
        </FieldGrid>
      </SectionCard>
    </div>
  );
}
