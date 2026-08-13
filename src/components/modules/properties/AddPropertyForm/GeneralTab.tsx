import { useState, useRef, useEffect } from 'react';
import { UseFormRegister, Control, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { TimePicker } from '../../../../components/ui/TimePicker';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { Textarea } from '../../../../components/ui/Textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { locations, transactionTypesResidential, transactionTypesCommercial, transactionTypesLand, transactionTypesLuxury } from './constants';
import { EtapeSelect, EtapeDetailSelect, etapeHasDetail } from './EtapeSelect';
import { ConstructionTypeSelect, ConstructionSubTypeSelect, hasConstructionSubType } from './ConstructionTypeSelect';
import { Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';
import { RadioGroup } from '../../../../components/ui/RadioGroup/RadioGroup';
import { RadioGroupItem } from '../../../../components/ui/RadioGroup/RadioGroupItem';
import { LocationMap } from './LocationMap';
import { uploadFiles } from '../../../../services/uploadService'

interface GeneralTabProps {
  register: UseFormRegister<any>;
  control: Control<any>;
  watch: UseFormWatch<any>;
  propertyType: string;
  setFormValue: UseFormSetValue<any>;
  isGerant?: boolean;
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

export function GeneralTab({ register, control, watch, propertyType, setFormValue, isGerant = false }: GeneralTabProps) {
  const isResidential = propertyType === 'residential';
  const isCommercial = propertyType === 'commercial';
  const isLand = propertyType === 'land';
  const isLuxury = propertyType === 'luxury';
  const isVacation = propertyType === 'vacation';

  const transactionType = watch('transactionType');
  const etape = watch('etape');
  const constructionType = watch('constructionType');

  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const uploadedPhotos: string[] = Array.isArray(watch('photos')) ? watch('photos') : [];
  const uploadedVideos: string[] = Array.isArray(watch('videos')) ? watch('videos') : [];

  // Initialize photos/videos from existing property images when editing
  useEffect(() => {
    const existingPhotos = watch('photos');
    const existingImages = watch('images');
    if ((!existingPhotos || (Array.isArray(existingPhotos) && existingPhotos.length === 0)) && Array.isArray(existingImages) && existingImages.length > 0) {
      setFormValue('photos', existingImages);
    }
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingPhotos(true);
    setUploadError(null);
    try {
      const urls = await uploadFiles(files);
      const current = watch('photos');
      const currentArr = Array.isArray(current) ? current : [];
      const urlsArr = Array.isArray(urls) ? urls : [];
      setFormValue('photos', [...currentArr, ...urlsArr]);
    } catch (err: any) {
      console.error('Photo upload failed:', err);
      setUploadError(err.message || 'Échec du téléchargement des photos');
    } finally {
      setUploadingPhotos(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingVideos(true);
    setUploadError(null);
    try {
      const urls = await uploadFiles(files);
      const current = watch('videos');
      const currentArr = Array.isArray(current) ? current : [];
      const urlsArr = Array.isArray(urls) ? urls : [];
      setFormValue('videos', [...currentArr, ...urlsArr]);
    } catch (err: any) {
      console.error('Video upload failed:', err);
      setUploadError(err.message || 'Échec du téléchargement des vidéos');
    } finally {
      setUploadingVideos(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const current = watch('photos');
    const arr = Array.isArray(current) ? current : [];
    const updated = arr.filter((_: any, i: number) => i !== index);
    setFormValue('photos', updated);
  };

  const removeVideo = (index: number) => {
    const current = watch('videos');
    const arr = Array.isArray(current) ? current : [];
    const updated = arr.filter((_: any, i: number) => i !== index);
    setFormValue('videos', updated);
  };

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
              <div className={`w-1.5 h-1.5 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`} />
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
                <EtapeSelect control={control} setFormValue={setFormValue} />
              </motion.div>

              {etapeHasDetail(etape) && (
                <motion.div variants={item}>
                  <EtapeDetailSelect control={control} etape={etape} />
                </motion.div>
              )}

              <motion.div variants={item}>
                <ConstructionTypeSelect control={control} setFormValue={setFormValue} />
              </motion.div>

              {hasConstructionSubType(constructionType) && (
                <motion.div variants={item}>
                  <ConstructionSubTypeSelect control={control} type={constructionType} />
                </motion.div>
              )}

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

              {uploadError && (
                <motion.div variants={item} className="md:col-span-2">
                  <p className="text-xs text-error bg-error/5 px-3 py-2 rounded-lg">{uploadError}</p>
                </motion.div>
              )}
              <motion.div variants={item} className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-background/50 border border-border/30">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text">Photos du bien</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        ref={photoInputRef}
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                      <button
                        type="button"
                        disabled={uploadingPhotos}
                        onClick={() => photoInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-text hover:bg-background hover:border-text-secondary/30 cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        {uploadingPhotos ? 'Upload...' : 'Ajouter des photos'}
                      </button>
                      <span className="text-xs text-text-secondary">JPEG, PNG (max 50MB)</span>
                    </div>
                    {uploadedPhotos.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {uploadedPhotos.map((url: string, i: number) => (
                          <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-border/50">
                            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removePhoto(i)}
                              className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text">Vidéos du bien</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        ref={videoInputRef}
                        accept="video/*"
                        multiple
                        className="hidden"
                        onChange={handleVideoUpload}
                      />
                      <button
                        type="button"
                        disabled={uploadingVideos}
                        onClick={() => videoInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-text hover:bg-background hover:border-text-secondary/30 cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        {uploadingVideos ? 'Upload...' : 'Ajouter des vidéos'}
                      </button>
                      <span className="text-xs text-text-secondary">MP4, MOV (max 50MB)</span>
                    </div>
                    {uploadedVideos.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {uploadedVideos.map((url: string, i: number) => (
                          <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-black/5 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-text-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <button
                              type="button"
                              onClick={() => removeVideo(i)}
                              className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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
                <span className="font-medium text-text">Règles</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    <button type="button" className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-text hover:bg-background transition-all ${isGerant ? 'hover:border-[#905D5D]' : 'hover:border-accent'}`}>
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
