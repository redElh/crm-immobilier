import { useState, useRef, useEffect } from 'react';
import { UseFormRegister, Control, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { Textarea } from '../../../../components/ui/Textarea';
import { locations, transactionTypesResidential, transactionTypesCommercial, transactionTypesLand, transactionTypesLuxury } from './constants';
import { EtapeSelect, EtapeDetailSelect, etapeHasDetail } from './EtapeSelect';
import { ConstructionTypeSelect, ConstructionSubTypeSelect, hasConstructionSubType } from './ConstructionTypeSelect';
import { Controller } from 'react-hook-form';
import { MapPin, Info, Key, Wifi, Camera, Image, Grid, Shield } from 'react-feather';
import { useStageChrome } from '../../../../components/modules/calendar/useStageChrome';
import { SectionCard, SubPanel, Field, FieldGrid, MediaDrop } from './stage';
import { STAGE_HUES } from '../../../dashboard/Stage';
import { RadioGroup } from '../../../../components/ui/RadioGroup/RadioGroup';
import { RadioGroupItem } from '../../../../components/ui/RadioGroup/RadioGroupItem';
import { LocationMap } from './LocationMap';
import { uploadFiles } from '../../../../services/uploadService'
import { cn } from '../../../../lib/utils';

interface GeneralTabProps {
  register: UseFormRegister<any>;
  control: Control<any>;
  watch: UseFormWatch<any>;
  propertyType: string;
  setFormValue: UseFormSetValue<any>;
  isGerant?: boolean;
}

export function GeneralTab({ register, control, watch, propertyType, setFormValue, isGerant = false }: GeneralTabProps) {
  const { staged, dark } = useStageChrome();
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

  /* Stage-aware button tokens — mirrors StageButton "glass" variant */
  const stagedBtn = staged
    ? dark
      ? 'inline-flex items-center gap-2 h-8 px-3 rounded-xl text-xs font-semibold border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] hover:bg-white/10 hover:text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-40'
      : 'inline-flex items-center gap-2 h-8 px-3 rounded-xl text-xs font-semibold border border-teal-900/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.55))] text-teal-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-teal-900/20 hover:bg-white transition-all duration-200 active:scale-[0.98] disabled:opacity-40'
    : 'inline-flex items-center gap-2 h-8 px-3 rounded-xl text-xs font-semibold border border-border bg-card text-text hover:bg-background hover:border-text-secondary/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-40';

  const stagedPrimaryBtn = staged
    ? dark
      ? 'inline-flex items-center gap-2 h-8 px-3 rounded-xl text-xs font-semibold border border-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_20px_-6px_rgba(124,92,255,0.55)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_10px_28px_-6px_rgba(124,92,255,0.65)] transition-all active:scale-[0.97]'
      : 'inline-flex items-center gap-2 h-8 px-3 rounded-xl text-xs font-semibold border border-white/60 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_20px_-8px_rgba(13,148,136,0.55)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_10px_28px_-8px_rgba(13,148,136,0.65)] transition-all active:scale-[0.97]'
    : 'inline-flex items-center gap-2 h-8 px-3 rounded-xl text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition-all active:scale-[0.98]';

  // media counts for header badges (optional)
  const mediaBadge = (uploadedPhotos.length + uploadedVideos.length) > 0 ? (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold',
        staged
          ? dark
            ? 'border-white/15 bg-white/10 text-slate-200'
            : 'border-teal-900/15 bg-teal-900/8 text-teal-800'
          : 'border-accent/20 bg-accent/10 text-accent',
      )}
    >
      {uploadedPhotos.length + uploadedVideos.length} média{uploadedPhotos.length + uploadedVideos.length > 1 ? 's' : ''}
    </span>
  ) : null

  return (
    <div className="space-y-6">
      {/* ── 1 · Informations de base ─────────────────────────────── */}
      <SectionCard
        value="basic-info"
        title="Informations de base"
        subtitle="Titre, marché, étape, construction et médias du bien"
        icon={Info}
        hue={STAGE_HUES.violet}
        badge={mediaBadge}
      >
        <FieldGrid>
          <Field className="md:col-span-2">
            <Input label="Titre du bien" {...register('propertyTitle')} required placeholder="Ex. Villa contemporaine 4 ch. — vue mer" />
          </Field>

          {!isVacation && (
            <Field className="md:col-span-2">
              <SubPanel title="Marché">
                <Controller
                  name="transactionType"
                  control={control}
                  render={({ field }) => {
                    const opts = isLand
                      ? transactionTypesLand
                      : isLuxury
                        ? transactionTypesLuxury
                        : isCommercial
                          ? transactionTypesCommercial
                          : transactionTypesResidential;
                    return (
                      <RadioGroup value={field.value} onValueChange={field.onChange} className="flex flex-wrap gap-2">
                        {opts.map((opt) => (
                          <RadioGroupItem key={opt.value} value={opt.value} id={`tt-${opt.value}`}>
                            {opt.label}
                          </RadioGroupItem>
                        ))}
                      </RadioGroup>
                    );
                  }}
                />
              </SubPanel>
            </Field>
          )}

          <Field>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select label="Statut" options={getStatusOptions()} value={field.value} onChange={field.onChange} required />
              )}
            />
          </Field>

          <Field>
            <EtapeSelect control={control} setFormValue={setFormValue} />
          </Field>

          {etapeHasDetail(etape) && (
            <Field>
              <EtapeDetailSelect control={control} etape={etape} />
            </Field>
          )}

          <Field>
            <ConstructionTypeSelect control={control} setFormValue={setFormValue} />
          </Field>

          {hasConstructionSubType(constructionType) && (
            <Field>
              <ConstructionSubTypeSelect control={control} type={constructionType} />
            </Field>
          )}

          {showMeuble && (
            <Field>
              <Controller
                name="furnishing"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Meublé"
                    options={[
                      { value: 'meuble', label: 'Meublé' },
                      { value: 'semi_meuble', label: 'Semi-meublé' },
                      { value: 'vide', label: 'Vide' },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
          )}

          {isVacation && (
            <Field>
              <Input label="Capacité d'accueil" type="number" {...register('capacite')} placeholder="Ex. 6" />
            </Field>
          )}

          {uploadError && (
            <Field className="md:col-span-2">
              <div
                className={cn(
                  'rounded-xl border px-3 py-2 text-xs',
                  staged
                    ? 'border-rose-400/25 bg-rose-500/10 text-rose-300'
                    : 'border-error/20 bg-error/5 text-error',
                )}
              >
                {uploadError}
              </div>
            </Field>
          )}

          {/* Médias — premium dashed dropzones */}
          <Field className="md:col-span-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <MediaDrop icon={Image} label="Photos du bien" hint="JPEG, PNG — 50 MB max" count={uploadedPhotos.length} staged={staged} dark={dark}>
                <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                <button type="button" disabled={uploadingPhotos} onClick={() => photoInputRef.current?.click()} className={stagedBtn}>
                  <Image size={14} />
                  {uploadingPhotos ? 'Envoi…' : 'Ajouter des photos'}
                </button>
                {uploadedPhotos.length > 0 ? (
                  <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {uploadedPhotos.map((url: string, i: number) => (
                      <div
                        key={`${url}-${i}`}
                        className={cn(
                          'group relative aspect-square overflow-hidden rounded-xl border',
                          staged ? (dark ? 'border-white/10 bg-white/[0.03]' : 'border-teal-900/10 bg-white') : 'border-border/50 bg-card',
                        )}
                      >
                        <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-[10px] text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/80"
                          aria-label="Supprimer la photo"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={cn('mt-2 text-xs', staged ? (dark ? 'text-slate-500' : 'text-teal-900/40') : 'text-text-secondary/60')}>
                    Glissez-déposez ou cliquez pour téléverser. Les visuels s'afficheront ici.
                  </p>
                )}
              </MediaDrop>

              <MediaDrop icon={Camera} label="Vidéos du bien" hint="MP4, MOV — 50 MB max" count={uploadedVideos.length} staged={staged} dark={dark}>
                <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleVideoUpload} />
                <button type="button" disabled={uploadingVideos} onClick={() => videoInputRef.current?.click()} className={stagedBtn}>
                  <Camera size={14} />
                  {uploadingVideos ? 'Envoi…' : 'Ajouter des vidéos'}
                </button>
                {uploadedVideos.length > 0 ? (
                  <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {uploadedVideos.map((url: string, i: number) => (
                      <div
                        key={`${url}-${i}`}
                        className={cn(
                          'group relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border',
                          staged ? (dark ? 'border-white/10 bg-white/[0.03]' : 'border-teal-900/10 bg-white') : 'border-border/50 bg-black/5',
                        )}
                      >
                        <Camera size={22} className={staged ? (dark ? 'text-slate-600' : 'text-teal-900/20') : 'text-text-secondary/40'} />
                        <button
                          type="button"
                          onClick={() => removeVideo(i)}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-[10px] text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/80"
                          aria-label="Supprimer la vidéo"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={cn('mt-2 text-xs', staged ? (dark ? 'text-slate-500' : 'text-teal-900/40') : 'text-text-secondary/60')}>
                    Ajoutez une visite filmée ou un teaser. Aperçu à venir.
                  </p>
                )}
              </MediaDrop>
            </div>
          </Field>
        </FieldGrid>
      </SectionCard>

      {/* ── 2 · Situation et localisation ────────────────────────── */}
      <SectionCard
        value="location-info"
        title="Situation et localisation"
        subtitle="Localisation, exposition, coordonnées et carte"
        icon={MapPin}
        hue={STAGE_HUES.sky}
      >
        <FieldGrid>
          <Field>
            <Controller
              name="location.type"
              control={control}
              render={({ field }) => <Select label="Type de localisation" options={locations} value={field.value} onChange={field.onChange} />}
            />
          </Field>
          <Field>
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
                    { value: 'ouest', label: 'Ouest' },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </Field>
          <Field>
            <Controller
              name="location.currentUse"
              control={control}
              render={({ field }) => (
                <Select
                  label="Situation actuelle"
                  options={[
                    { value: 'residence_principale', label: 'Résidence principale' },
                    { value: 'residence_secondaire', label: 'Résidence secondaire' },
                    { value: 'vacant', label: 'Vacant' },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </Field>

          {isVacation && (
            <>
              <Field className="md:col-span-2">
                <Textarea label="Indications d'accès" {...register('location.instructionsAcces')} rows={2} placeholder="Prendre sortie Saint-Tropez Centre" />
              </Field>
              <Field className="md:col-span-2">
                <Textarea label="Parking — instructions" {...register('location.parkingInstructions')} rows={2} placeholder="Les places sont numérotées 1 et 2" />
              </Field>
            </>
          )}

          <Field className="flex items-end pb-1">
            <SubPanel className="w-full !p-3">
              <div className="flex flex-wrap gap-4">
                <Controller
                  name="location.buildable"
                  control={control}
                  render={({ field }) => (
                    <Checkbox label="Surface constructible" checked={field.value} onChange={(c) => field.onChange(c)} />
                  )}
                />
                <Controller
                  name="location.avna"
                  control={control}
                  render={({ field }) => <Checkbox label="AVNA" checked={field.value} onChange={(c) => field.onChange(c)} />}
                />
              </div>
            </SubPanel>
          </Field>

          <Field>
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
          </Field>
          <Field>
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
          </Field>

          <Field className="md:col-span-2">
            <div
              className={cn(
                'overflow-hidden rounded-2xl border',
                staged ? (dark ? 'border-white/10 bg-white/[0.02]' : 'border-teal-900/10 bg-white/60') : 'border-border/40 bg-card',
              )}
            >
              <div className="p-[1px]">
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
              </div>
            </div>
            <p className={cn('mt-2 text-xs', staged ? (dark ? 'text-slate-500' : 'text-teal-900/45') : 'text-text-secondary')}>
              Cliquez sur la carte pour positionner précisément le bien.
            </p>
          </Field>
        </FieldGrid>
      </SectionCard>

      {/* ── 3 · Règles (vacances) ───────────────────────────────── */}
      {isVacation && (
        <SectionCard value="horaires-regles" title="Règles de la maison" subtitle="Cadre d'accueil et attentes voyageurs" icon={Shield} hue={STAGE_HUES.amber}>
          <FieldGrid>
            <Field className="md:col-span-2">
              <SubPanel title="Règles générales">
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
              </SubPanel>
            </Field>
            <Field className="md:col-span-2">
              <Textarea label="Autres règles" {...register('horaires.autresRegles')} rows={2} placeholder="Ex. Merci de sortir les poubelles, fermer à clé…" />
            </Field>
          </FieldGrid>
        </SectionCard>
      )}

      {/* ── 4 · Accès & Codes (vacances) ─────────────────────────── */}
      {isVacation && (
        <SectionCard value="acces-codes" title="Accès & codes" subtitle="Boîte à clés, portail, appartement et parking" icon={Key} hue={STAGE_HUES.fuchsia}>
          <FieldGrid>
            <Field className="md:col-span-2">
              <SubPanel title="Boîte à clés">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Controller name="acces.boiteCles.presente" control={control} render={({ field }) => (
                      <Checkbox label="Boîte à clés présente" checked={field.value} onChange={(c) => field.onChange(c)} />
                    )} />
                  </div>
                  <Input label="Code" type="password" {...register('acces.boiteCles.code')} placeholder="1234#" />
                  <Input label="Emplacement" {...register('acces.boiteCles.emplacement')} placeholder="À droite du portail" />
                </div>
              </SubPanel>
            </Field>
            <Field className="md:col-span-2">
              <SubPanel title="Portail">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Code portail" {...register('acces.portail.code')} placeholder="4455" />
                  <Controller name="acces.portail.type" control={control} render={({ field }) => (
                    <Select label="Type" options={[
                      { value: 'digicode', label: 'Digicode' },
                      { value: 'telecommande', label: 'Télécommande' },
                      { value: 'badge', label: 'Badge' },
                    ]} value={field.value} onChange={field.onChange} />
                  )} />
                </div>
              </SubPanel>
            </Field>
            <Field className="md:col-span-2">
              <SubPanel title="Appartement">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller name="acces.appartement.typeAcces" control={control} render={({ field }) => (
                    <Select label="Type d'accès" options={[
                      { value: 'cle_classique', label: 'Clé classique' },
                      { value: 'digicode', label: 'Digicode' },
                      { value: 'badge', label: 'Badge' },
                    ]} value={field.value} onChange={field.onChange} />
                  )} />
                  <Input label="Code appartement" {...register('acces.appartement.code')} placeholder="5678*" />
                </div>
              </SubPanel>
            </Field>
            <Field>
              <Input label="Code parking" {...register('acces.parking.code')} placeholder="4455" />
            </Field>
          </FieldGrid>
        </SectionCard>
      )}

      {/* ── 5 · WiFi & Connectivité (vacances) ───────────────────── */}
      {isVacation && (
        <SectionCard value="wifi" title="WiFi & connectivité" subtitle="Réseau, mot de passe et QR code voyageurs" icon={Wifi} hue={STAGE_HUES.emerald}>
          <FieldGrid>
            <Field>
              <Input label="Nom du réseau" {...register('wifi.reseau')} placeholder="SquareMeter_Premium" />
            </Field>
            <Field>
              <Input label="Mot de passe" type="password" {...register('wifi.motDePasse')} placeholder="Luxe2024!" />
            </Field>
            <Field className="md:col-span-2">
              <SubPanel>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className={cn('text-xs leading-relaxed', staged ? (dark ? 'text-slate-400' : 'text-teal-900/60') : 'text-text-secondary')}>
                    Générez un QR code WiFi à afficher dans le livret d'accueil.
                  </p>
                  <button type="button" className={stagedPrimaryBtn} style={staged ? (dark ? { backgroundImage: 'linear-gradient(145deg,#8B7CFF 0%,#6C5ECF 55%,#5646C9 100%)' } as any : { backgroundImage: 'linear-gradient(145deg,#2DD4BF 0%,#14B8A6 55%,#0D9488 100%)' } as any) : undefined}>
                    <Grid size={14} />
                    Générer QR code
                  </button>
                </div>
              </SubPanel>
            </Field>
          </FieldGrid>
        </SectionCard>
      )}
    </div>
  );
}
