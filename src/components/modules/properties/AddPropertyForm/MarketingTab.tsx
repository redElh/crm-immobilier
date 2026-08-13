import { Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { Input } from '../../../../components/ui/Input';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

interface MarketingTabProps {
  register: any;
  control: any;
  isGerant?: boolean;
}

export function MarketingTab({ register, control, isGerant = false }: MarketingTabProps) {
  return (
    <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="p-0 overflow-hidden">
      <Accordion type="multiple" defaultValue={['brochure', 'virtual-tour', 'drone', 'video']} className="space-y-0">
        <AccordionItem value="brochure" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`} />
              <span className="font-medium text-text">Brochure luxe</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div variants={item}>
                <Input label="Fichier brochure (PDF)" {...register('marketing.brochureFile')} placeholder="URL du fichier PDF" />
              </motion.div>
              <motion.div variants={item}>
                <Input label="Version imprimable" {...register('marketing.brochurePrint')} placeholder="URL version print" />
              </motion.div>
              <motion.div variants={item} className="md:col-span-2">
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
              </motion.div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="virtual-tour" className="border-0 border-t border-border/40">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-interactive" />
              <span className="font-medium text-text">Visite virtuelle</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div variants={item} className="md:col-span-2">
                <Input label="Lien de la visite virtuelle" {...register('marketing.virtualTourUrl')} placeholder="https://my.matterport.com/..." />
              </motion.div>
              <motion.div variants={item} className="md:col-span-2">
                <Input label="Code d'intégration (iframe)" {...register('marketing.virtualTourEmbed')} placeholder="<iframe src='...' />" />
              </motion.div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="drone" className="border-0 border-t border-border/40">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-interactive" />
              <span className="font-medium text-text">Drone</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div variants={item} className="md:col-span-2">
                <Input label="URL de la vidéo drone" {...register('marketing.droneUrl')} placeholder="https://youtube.com/..." />
              </motion.div>
              <motion.div variants={item} className="md:col-span-2">
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
              </motion.div>
              <motion.div variants={item}>
                <Input label="Photographies aériennes" {...register('marketing.dronePhotos')} placeholder="URL galerie" />
              </motion.div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="video" className="border-0 border-t border-border/40">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-premium" />
              <span className="font-medium text-text">Vidéo professionnelle</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div variants={item} className="md:col-span-2">
                <Input label="URL de la vidéo" {...register('marketing.videoUrl')} placeholder="https://youtube.com/..." />
              </motion.div>
              <motion.div variants={item} className="md:col-span-2">
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
              </motion.div>
              <motion.div variants={item}>
                <Input label="Crédit vidéaste" {...register('marketing.videographer')} placeholder="Nom du réalisateur" />
              </motion.div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
}
