import { Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { Checkbox } from '../../../../components/ui/Checkbox';
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

interface DocumentsTabProps {
  register: any;
  control: any;
  propertyType: string;
}

const VACATION_DOCUMENTS = [
  { key: 'contrat_location_type', label: 'Contrat de location type' },
  { key: 'reglement_interieur', label: 'Règlement intérieur' },
  { key: 'plan_propriete', label: 'Plan de la propriété' },
  { key: 'assurance_responsabilite', label: 'Assurance responsabilité' },
  { key: 'guide_maison', label: 'Guide de la maison' },
];

export function DocumentsTab({ register, control, propertyType }: DocumentsTabProps) {
  const isVacation = propertyType === 'vacation';

  return (
    <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="p-0 overflow-hidden">
      <Accordion type="multiple" defaultValue={['documents']} className="space-y-0">
        <AccordionItem value="documents" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="font-medium text-text">{isVacation ? 'Documents du bien' : 'Documents'}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            {isVacation ? (
              <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
                {VACATION_DOCUMENTS.map((doc) => (
                  <motion.div key={doc.key} variants={item} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                    <Controller name={`documents.${doc.key}`} control={control} render={({ field }) => (
                      <>
                        <Checkbox checked={field.value?.uploaded} onChange={(c) => field.onChange({ ...field.value, uploaded: c })} />
                        <span className="text-sm font-medium text-text flex-1">{doc.label}</span>
                        <div className="flex items-center gap-2">
                          {field.value?.uploaded && (
                            <span className="text-xs text-success">{field.value?.name || '✓'}</span>
                          )}
                          <input type="file" id={`doc-${doc.key}`} className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) field.onChange({ ...field.value, uploaded: true, name: file.name, file })
                          }} />
                          <label htmlFor={`doc-${doc.key}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card text-text-secondary hover:text-accent hover:border-accent cursor-pointer transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Upload
                          </label>
                        </div>
                      </>
                    )} />
                  </motion.div>
                ))}
                <motion.div variants={item} className="mt-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-dashed border-border/40">
                    <span className="text-sm font-medium text-text-secondary flex-1">Autre document</span>
                    <div className="flex items-center gap-2">
                      <input type="file" id="doc-autre" className="hidden" />
                      <label htmlFor="doc-autre" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card text-text-secondary hover:text-accent hover:border-accent cursor-pointer transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Upload
                      </label>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
                {(['Titre de propriété', 'Diagnostics techniques', 'Mandat signé'] as const).map((doc) => (
                  <motion.div key={doc} variants={item} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                    <Controller name={`documents.${doc.toLowerCase().replace(/[\s'-]+/g, '_')}`} control={control} render={({ field }) => (
                      <>
                        <Checkbox checked={field.value?.uploaded} onChange={(c) => field.onChange({ ...field.value, uploaded: c })} />
                        <span className="text-sm font-medium text-text flex-1">{doc}</span>
                        {field.value?.uploaded && (
                          <span className="text-xs text-success">✓ Document joint</span>
                        )}
                      </>
                    )} />
                  </motion.div>
                ))}
                <motion.div variants={item} className="mt-4 p-6 rounded-lg bg-background/50 border-2 border-dashed border-border/40 text-center">
                  <p className="text-sm text-text-secondary">Glissez-déposez vos fichiers ici ou</p>
                  <label className="inline-flex items-center gap-2 mt-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-text hover:bg-background hover:border-text-secondary/30 cursor-pointer transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Ajouter des fichiers
                    <input type="file" multiple className="hidden" {...register('documents.uploadedFiles')} />
                  </label>
                </motion.div>
              </motion.div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
}
