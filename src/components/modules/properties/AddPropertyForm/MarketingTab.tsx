import { Controller } from 'react-hook-form';
import { Input } from '../../../../components/ui/Input';
import { Camera, Video, FileText, Globe } from 'react-feather';
import { SectionCard, Field, FieldGrid } from './stage';

interface MarketingTabProps {
  register: any;
  control: any;
  isGerant?: boolean;
}

export function MarketingTab({ register, control, isGerant = false }: MarketingTabProps) {
  return (
    <div className="space-y-5">
      <SectionCard value="brochure" title="Brochure luxe" icon={FileText} subtitle="Fichier PDF et version imprimable">
        <FieldGrid>
          <Field>
            <Input label="Fichier brochure (PDF)" {...register('marketing.brochureFile')} placeholder="URL du fichier PDF" />
          </Field>
          <Field>
            <Input label="Version imprimable" {...register('marketing.brochurePrint')} placeholder="URL version print" />
          </Field>
          <Field className="md:col-span-2">
            <div className="flex items-center gap-3">
              <input type="file" id="brochureFile" accept=".pdf" className="hidden" {...register('marketing.brochureUpload')} />
              <label htmlFor="brochureFile" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-text hover:bg-background hover:border-text-secondary/30 cursor-pointer transition-all duration-200 active:scale-[0.98]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Télécharger la brochure
              </label>
              <span className="text-xs text-text-secondary">PDF (max 20MB)</span>
            </div>
          </Field>
        </FieldGrid>
      </SectionCard>

      <SectionCard value="virtual-tour" title="Visite virtuelle" icon={Globe} subtitle="Lien Matterport et code d'intégration">
        <FieldGrid>
          <Field className="md:col-span-2">
            <Input label="Lien de la visite virtuelle" {...register('marketing.virtualTourUrl')} placeholder="https://my.matterport.com/..." />
          </Field>
          <Field className="md:col-span-2">
            <Input label="Code d'intégration (iframe)" {...register('marketing.virtualTourEmbed')} placeholder="<iframe src='...' />" />
          </Field>
        </FieldGrid>
      </SectionCard>

      <SectionCard value="drone" title="Drone" icon={Camera} subtitle="Vidéo et photos aériennes">
        <FieldGrid>
          <Field className="md:col-span-2">
            <Input label="URL de la vidéo drone" {...register('marketing.droneUrl')} placeholder="https://youtube.com/..." />
          </Field>
          <Field className="md:col-span-2">
            <div className="flex items-center gap-3">
              <input type="file" id="droneFile" accept="video/*" className="hidden" {...register('marketing.droneUpload')} />
              <label htmlFor="droneFile" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-text hover:bg-background hover:border-text-secondary/30 cursor-pointer transition-all duration-200 active:scale-[0.98]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Télécharger la vidéo drone
              </label>
              <span className="text-xs text-text-secondary">MP4, MOV (max 100MB)</span>
            </div>
          </Field>
          <Field>
            <Input label="Photographies aériennes" {...register('marketing.dronePhotos')} placeholder="URL galerie" />
          </Field>
        </FieldGrid>
      </SectionCard>

      <SectionCard value="video" title="Vidéo professionnelle" icon={Video} subtitle="URL, upload et crédit vidéaste">
        <FieldGrid>
          <Field className="md:col-span-2">
            <Input label="URL de la vidéo" {...register('marketing.videoUrl')} placeholder="https://youtube.com/..." />
          </Field>
          <Field className="md:col-span-2">
            <div className="flex items-center gap-3">
              <input type="file" id="videoFile" accept="video/*" className="hidden" {...register('marketing.videoUpload')} />
              <label htmlFor="videoFile" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-text hover:bg-background hover:border-text-secondary/30 cursor-pointer transition-all duration-200 active:scale-[0.98]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Télécharger la vidéo
              </label>
              <span className="text-xs text-text-secondary">MP4, MOV (max 100MB)</span>
            </div>
          </Field>
          <Field>
            <Input label="Crédit vidéaste" {...register('marketing.videographer')} placeholder="Nom du réalisateur" />
          </Field>
        </FieldGrid>
      </SectionCard>
    </div>
  );
}
