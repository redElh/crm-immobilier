import { UseFormRegister, Control, UseFormWatch } from 'react-hook-form';
import { DatePicker } from '../../../../components/ui/DatePicker';
import { TimePicker } from '../../../../components/ui/TimePicker';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { Textarea } from '../../../../components/ui/Textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { propertyTypes, residentialPropertyTypes, luxuryPropertyTypes, commercialSubTypes, landSubTypes, locations, transactionTypesResidential, transactionTypesCommercial, transactionTypesLand, transactionTypesLuxury } from './constants';
import { Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';
import { RadioGroup } from '../../../../components/ui/RadioGroup/RadioGroup';
import { RadioGroupItem } from '../../../../components/ui/RadioGroup/RadioGroupItem';
import { LocationMap } from './LocationMap';

interface GeneralTabProps {
  register: UseFormRegister<any>;
  control: Control<any>;
  watch: UseFormWatch<any>;
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

export function GeneralTab({ register, control, watch, propertyType }: GeneralTabProps) {
  const isResidential = propertyType === 'residential';
  const isCommercial = propertyType === 'commercial';
  const isLand = propertyType === 'land';
  const isLuxury = propertyType === 'luxury';
  const isVacation = propertyType === 'vacation';

  const transactionType = watch('transactionType');

  function getStatusOptions() {
    if (isVacation) {
      return [
        { value: 'available', label: 'Disponible' },
        { value: 'option', label: 'En option' },
        { value: 'reserved', label: 'Réservé' },
        { value: 'occupied', label: 'Occupé' },
        { value: 'unavailable', label: 'Indisponible' },
        { value: 'withdrawn', label: 'Retiré' },
      ];
    }

    if (isLand) {
      return [
        { value: 'for_sale', label: 'À vendre' },
        { value: 'under_promise', label: 'Sous promesse' },
        { value: 'urbanism', label: "En procédure d'urbanisme" },
        { value: 'sold', label: 'Vendu' },
        { value: 'withdrawn', label: 'Retiré' },
      ];
    }

    if (isCommercial) {
      return [
        { value: 'for_sale_or_rent', label: 'À vendre / À louer' },
        { value: 'negotiation', label: 'En négociation' },
        { value: 'under_promise', label: 'Sous promesse' },
        { value: 'sold_or_rented', label: 'Vendu / Loué' },
        { value: 'withdrawn', label: 'Retiré' },
      ];
    }

    if (isLuxury) {
      return [
        { value: 'for_sale_or_rent', label: 'À vendre / À louer' },
        { value: 'confidential', label: 'En confidentialité' },
        { value: 'negotiation', label: 'En négociation' },
        { value: 'sold_or_rented', label: 'Vendu / Loué' },
        { value: 'withdrawn', label: 'Retiré' },
      ];
    }

    if (transactionType === 'location_ld') {
      return [
        { value: 'for_rent', label: 'À louer' },
        { value: 'mandate_pending', label: 'En attente de mandat' },
        { value: 'signing', label: 'En cours de signature' },
        { value: 'rented', label: 'Loué' },
        { value: 'withdrawn', label: 'Retiré' },
      ];
    }

    return [
      { value: 'for_sale', label: 'À vendre' },
      { value: 'mandate_pending', label: 'En attente de mandat' },
      { value: 'negotiation', label: 'En négociation' },
      { value: 'under_compromise', label: 'Sous compromis' },
      { value: 'sold', label: 'Vendu' },
      { value: 'withdrawn', label: 'Retiré' },
    ];
  }

  const typeOptions = isResidential ? residentialPropertyTypes
    : isLuxury ? luxuryPropertyTypes
    : isCommercial ? [{ value: 'commerce', label: 'Commerce' }]
    : isLand ? [{ value: 'terrain', label: 'Terrain' }]
    : propertyTypes;

  const showMeuble = isResidential || isVacation;

  return (
    <MotionCard
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="p-0 overflow-hidden"
    >
      <Accordion type="multiple" defaultValue={['basic-info', 'location-info']} className="space-y-0">
        <AccordionItem value="basic-info" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="font-medium text-text">Informations de base</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              <motion.div variants={item} className="md:col-span-2">
                <Input
                  label="Titre du bien"
                  {...register('propertyTitle')}
                  required
                />
              </motion.div>

              {!isVacation && (
                <motion.div variants={item} className="md:col-span-2">
                  <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                    <h4 className="font-medium text-sm text-text mb-3">Type de transaction</h4>
                    <Controller name="transactionType" control={control} render={({ field }) => {
                      const opts = isLand ? transactionTypesLand
                        : isLuxury ? transactionTypesLuxury
                        : isCommercial ? transactionTypesCommercial
                        : transactionTypesResidential;
                      return (
                        <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-6">
                          {opts.map(opt => (
                            <RadioGroupItem key={opt.value} value={opt.value} id={`tt-${opt.value}`}>
                              {opt.label}
                            </RadioGroupItem>
                          ))}
                        </RadioGroup>
                      );
                    }} />
                  </div>
                </motion.div>
              )}

              <motion.div variants={item}>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Statut"
                      options={getStatusOptions()}
                      value={field.value}
                      onChange={field.onChange}
                      required
                    />
                  )}
                />
              </motion.div>

              <motion.div variants={item}>
                <DatePicker
                  label="Date"
                  {...register('date')}
                  required
                />
              </motion.div>

              {isCommercial && (
                <motion.div variants={item}>
                  <Controller
                    name="commercialSubType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Sous-type"
                        options={commercialSubTypes}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </motion.div>
              )}

              {isLand && (
                <motion.div variants={item}>
                  <Controller
                    name="landSubType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Sous-type de terrain"
                        options={landSubTypes}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </motion.div>
              )}

              <motion.div variants={item}>
                <Controller
                  name="propertyType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Type de bien"
                      options={typeOptions}
                      value={field.value}
                      onChange={field.onChange}
                      required
                    />
                  )}
                />
              </motion.div>

              {showMeuble && (
                <motion.div variants={item}>
                  <Controller
                    name="furnishing"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Meublé"
                        options={[
                          { value: 'meuble', label: 'Meublé' },
                          { value: 'semi_meuble', label: 'Semi-meublé' },
                          { value: 'vide', label: 'Vide' }
                        ]}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </motion.div>
              )}

              {isVacation && (
                <motion.div variants={item}>
                  <Controller
                    name="capacite"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Capacité d'accueil"
                        type="number"
                        {...register('capacite')}
                      />
                    )}
                  />
                </motion.div>
              )}

              <motion.div variants={item} className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-background/50 border border-border/30">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text">Photos du bien</label>
                    <div className="flex items-center gap-3">
                      <input type="file" id="propertyPhotos" accept="image/*" multiple className="hidden" {...register('photos')} />
                      <label htmlFor="propertyPhotos" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-text hover:bg-background hover:border-text-secondary/30 cursor-pointer transition-all duration-200 active:scale-[0.98]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Ajouter des photos
                      </label>
                      <span className="text-xs text-text-secondary">JPEG, PNG (max 10MB)</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text">Vidéos du bien</label>
                    <div className="flex items-center gap-3">
                      <input type="file" id="propertyVideos" accept="video/*" multiple className="hidden" {...register('videos')} />
                      <label htmlFor="propertyVideos" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-text hover:bg-background hover:border-text-secondary/30 cursor-pointer transition-all duration-200 active:scale-[0.98]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Ajouter des vidéos
                      </label>
                      <span className="text-xs text-text-secondary">MP4, MOV (max 50MB)</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="location-info" className="border-0 border-t border-border/40">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="font-medium text-text">Situation et localisation</span>
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
                <Controller
                  name="location.type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Type de localisation"
                      options={locations}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </motion.div>

              <motion.div variants={item}>
                <Controller
                  name="location.exposition"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Exposition"
                      options={[
                        { value: 'nord', label: 'Nord' },
                        { value: 'sud', label: 'Sud' },
                        { value: 'est', label: 'Est' },
                        { value: 'ouest', label: 'Ouest' }
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </motion.div>

              <motion.div variants={item}>
                <Controller
                  name="location.currentUse"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Situation actuelle"
                      options={[
                        { value: 'residence_principale', label: 'Résidence principale' },
                        { value: 'residence_secondaire', label: 'Résidence secondaire' },
                        { value: 'vacant', label: 'Vacant' }
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </motion.div>

              {isVacation && (
                <>
                  <motion.div variants={item} className="md:col-span-2">
                    <Textarea label="Indications d'accès" {...register('location.instructionsAcces')} rows={2} placeholder="Prendre sortie Saint-Tropez Centre" />
                  </motion.div>
                  <motion.div variants={item} className="md:col-span-2">
                    <Textarea label="Parking - Instructions" {...register('location.parkingInstructions')} rows={2} placeholder="Les places sont numérotées 1 et 2" />
                  </motion.div>
                </>
              )}

              <motion.div variants={item} className="flex items-end pb-2">
                <div className="flex gap-6">
                  <Controller
                    name="location.buildable"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        label="Surface constructible"
                        checked={field.value}
                        onChange={(checked) => field.onChange(checked)}
                      />
                    )}
                  />
                  <Controller
                    name="location.avna"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        label="AVNA"
                        checked={field.value}
                        onChange={(checked) => field.onChange(checked)}
                      />
                    )}
                  />
                </div>
              </motion.div>

              <motion.div variants={item}>
                <Controller
                  name="location.latitude"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="Latitude"
                      type="number"
                      step="any"
                      placeholder="Ex: 48.8566"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
              </motion.div>

              <motion.div variants={item}>
                <Controller
                  name="location.longitude"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="Longitude"
                      type="number"
                      step="any"
                      placeholder="Ex: 2.3522"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
              </motion.div>

              <motion.div variants={item} className="md:col-span-2">
                <Controller
                  name="location.latitude"
                  control={control}
                  render={({ field: latField }) => (
                    <Controller
                      name="location.longitude"
                      control={control}
                      render={({ field: lngField }) => (
                        <LocationMap
                          latitude={latField.value || 0}
                          longitude={lngField.value || 0}
                          onLatitudeChange={(v) => latField.onChange(v)}
                          onLongitudeChange={(v) => lngField.onChange(v)}
                        />
                      )}
                    />
                  )}
                />
              </motion.div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        {isVacation && (
          <AccordionItem value="horaires-regles" className="border-0 border-t border-border/40">
            <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-premium" />
                <span className="font-medium text-text">Horaires & Règles</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div variants={item}>
                  <TimePicker label="Heure limite d'arrivée (check-in)" {...register('horaires.checkInHeureLimite')} />
                </motion.div>
                <motion.div variants={item}>
                  <TimePicker label="Heure limite de départ (check-out)" {...register('horaires.checkOutHeureLimite')} />
                </motion.div>
                <motion.div variants={item} className="md:col-span-2">
                  <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                    <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Règles de la maison</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Controller name="horaires.arriveeAutonome" control={control} render={({ field }) => (
                        <Checkbox label="Arrivée autonome 24/7" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="horaires.pasDeFetes" control={control} render={({ field }) => (
                        <Checkbox label="Pas de fêtes" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="horaires.animauxInterdits" control={control} render={({ field }) => (
                        <Checkbox label="Animaux non autorisés" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="horaires.pasDeFumee" control={control} render={({ field }) => (
                        <Checkbox label="Pas de fumée à l'intérieur" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <Controller name="horaires.economieEnergie" control={control} render={({ field }) => (
                        <Checkbox label="Économie d'énergie requise" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                    </div>
                  </div>
                </motion.div>
                <motion.div variants={item} className="md:col-span-2">
                  <Textarea label="Autres règles" {...register('horaires.autresRegles')} rows={2} />
                </motion.div>
              </motion.div>
            </AccordionContent>
          </AccordionItem>
        )}

        {isVacation && (
          <AccordionItem value="acces-codes" className="border-0 border-t border-border/40">
            <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-premium" />
                <span className="font-medium text-text">Accès & Codes</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div variants={item} className="md:col-span-2">
                  <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                    <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Boîte à clés</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Controller name="acces.boiteCles.presente" control={control} render={({ field }) => (
                        <Checkbox label="Boîte à clés - Présente" checked={field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                      <div />
                      <Input label="Boîte à clés - Code" type="password" {...register('acces.boiteCles.code')} placeholder="1234#" />
                      <Input label="Boîte à clés - Emplacement" {...register('acces.boiteCles.emplacement')} placeholder="À droite du portail" />
                    </div>
                  </div>
                </motion.div>
                <motion.div variants={item} className="md:col-span-2">
                  <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                    <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Portail</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Portail - Code" {...register('acces.portail.code')} placeholder="4455" />
                      <Controller name="acces.portail.type" control={control} render={({ field }) => (
                        <Select label="Portail - Type" options={[
                          { value: 'digicode', label: 'Digicode' },
                          { value: 'telecommande', label: 'Télécommande' },
                          { value: 'badge', label: 'Badge' },
                        ]} value={field.value} onChange={field.onChange} />
                      )} />
                    </div>
                  </div>
                </motion.div>
                <motion.div variants={item} className="md:col-span-2">
                  <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                    <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Appartement</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Controller name="acces.appartement.typeAcces" control={control} render={({ field }) => (
                        <Select label="Appartement - Type d'accès" options={[
                          { value: 'cle_classique', label: 'Clé classique' },
                          { value: 'digicode', label: 'Digicode' },
                          { value: 'badge', label: 'Badge' },
                        ]} value={field.value} onChange={field.onChange} />
                      )} />
                      <Input label="Appartement - Code" {...register('acces.appartement.code')} placeholder="5678*" />
                    </div>
                  </div>
                </motion.div>
                <motion.div variants={item}>
                  <Input label="Parking - Code" {...register('acces.parking.code')} placeholder="4455" />
                </motion.div>
              </motion.div>
            </AccordionContent>
          </AccordionItem>
        )}

        {isVacation && (
          <AccordionItem value="wifi" className="border-0 border-t border-border/40">
            <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-premium" />
                <span className="font-medium text-text">WiFi & Connectivité</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div variants={item}>
                  <Input label="Réseau WiFi" {...register('wifi.reseau')} placeholder="SquareMeter_Premium" />
                </motion.div>
                <motion.div variants={item}>
                  <Input label="Mot de passe WiFi" type="password" {...register('wifi.motDePasse')} placeholder="Luxe2024!" />
                </motion.div>
                <motion.div variants={item} className="md:col-span-2">
                  <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                    <p className="text-xs text-text-secondary mb-2">Générez un QR code WiFi pour permettre à vos voyageurs de se connecter facilement.</p>
                    <button type="button" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-text hover:bg-background hover:border-accent transition-all">
                      <span>🔄</span> Générer QR code WiFi
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </MotionCard>
  );
}
