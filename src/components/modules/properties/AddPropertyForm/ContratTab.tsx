import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { DatePicker } from '../../../../components/ui/DatePicker';
import { TimePicker } from '../../../../components/ui/TimePicker';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { Textarea } from '../../../../components/ui/Textarea';
import { Icon } from '../../../../components/ui/Icon';
import { VoyageurFormModal } from '../../clients/VoyageurFormModal';
import { Client } from '../../../../types/client';

interface ContratTabProps {
  register: any;
  control: any;
  watch: any;
  propertyType: string;
}

interface VoyageurInfo {
  name: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  nationalite: string;
  pieceIdentite: string;
}

const MOCK_VOYAGEURS: VoyageurInfo[] = [
  { name: 'Jean Dupont', prenom: 'Jean', nom: 'Dupont', email: 'jean.dupont@email.com', telephone: '+212 6 00 00 00 01', adresse: '12 Rue de Paris, 75001 Paris', nationalite: 'Française', pieceIdentite: 'CIN AB123456' },
  { name: 'Marie Martin', prenom: 'Marie', nom: 'Martin', email: 'marie.martin@email.com', telephone: '+212 6 00 00 00 02', adresse: '8 Avenue Hassan II, Casablanca', nationalite: 'Marocaine', pieceIdentite: 'CIN CD789012' },
  { name: 'Ahmed Benali', prenom: 'Ahmed', nom: 'Benali', email: 'ahmed.benali@email.com', telephone: '+212 6 00 00 00 03', adresse: '15 Rue Mohammed V, Rabat', nationalite: 'Marocaine', pieceIdentite: 'Passeport MN345678' },
  { name: 'Sophie Laurent', prenom: 'Sophie', nom: 'Laurent', email: 'sophie.laurent@email.com', telephone: '+212 6 00 00 00 04', adresse: '5 Rue de la Paix, Lyon', nationalite: 'Française', pieceIdentite: 'CIN EF901234' },
  { name: 'Pierre Petit', prenom: 'Pierre', nom: 'Petit', email: 'pierre.petit@email.com', telephone: '+212 6 00 00 00 05', adresse: '22 Boulevard Victor Hugo, Marseille', nationalite: 'Française', pieceIdentite: 'Passeport GH567890' },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export function ContratTab({ register, control, watch, propertyType }: ContratTabProps) {
  const watchArrivee = watch('contrat.arrivee');
  const watchDepart = watch('contrat.depart');

  const [voyageurSearch, setVoyageurSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedVoyageur, setSelectedVoyageur] = useState<string | null>(null);
  const [showVoyageurModal, setShowVoyageurModal] = useState(false);

  let nuits = 0;
  if (watchArrivee && watchDepart) {
    nuits = Math.ceil((new Date(watchDepart).getTime() - new Date(watchArrivee).getTime()) / (1000 * 60 * 60 * 24));
  }

  const filteredVoyageurs = voyageurSearch.length > 0
    ? MOCK_VOYAGEURS.filter(v =>
        v.name.toLowerCase().includes(voyageurSearch.toLowerCase()) ||
        v.email.toLowerCase().includes(voyageurSearch.toLowerCase())
      )
    : [];

  const selectVoyageur = (v: VoyageurInfo) => {
    setVoyageurSearch(v.name);
    setSelectedVoyageur(v.name);
    setShowSuggestions(false);
  };

  const handleVoyageurCreated = (client: Omit<Client, 'id'>) => {
    const newVoyageur: VoyageurInfo = {
      name: client.name || '',
      prenom: client.name?.split(' ').slice(1).join(' ') || '',
      nom: client.name?.split(' ')[0] || '',
      email: client.email || '',
      telephone: client.phone || '',
      adresse: '',
      nationalite: '',
      pieceIdentite: '',
    };
    setVoyageurSearch(newVoyageur.name);
    setSelectedVoyageur(newVoyageur.name);
    setShowVoyageurModal(false);
  };

  return (
    <MotionCard
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="p-0 overflow-hidden"
    >
      <Accordion type="multiple" defaultValue={['voyageur', 'sejour', 'paiement', 'signatures']} className="space-y-0">
        {/* Voyageur */}
        <AccordionItem value="voyageur" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="font-medium text-text">Voyageur</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="mb-5">
              <div className="relative">
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Rechercher un voyageur existant</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      className="w-full rounded-lg border border-border/60 bg-card px-3 py-2 text-sm text-text placeholder:text-text-secondary/40 focus:outline-none focus:border-accent transition-colors"
                      placeholder="Nom, prénom ou email..."
                      value={voyageurSearch}
                      onChange={e => { setVoyageurSearch(e.target.value); setSelectedVoyageur(null); setShowSuggestions(true); }}
                      onFocus={() => voyageurSearch.length > 0 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                    {showSuggestions && filteredVoyageurs.length > 0 && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card rounded-lg border border-border/50 shadow-dropdown py-1 max-h-48 overflow-y-auto">
                        {filteredVoyageurs.map(v => (
                          <button
                            key={v.email}
                            type="button"
                            className="w-full px-3 py-2 text-sm text-left hover:bg-background transition-colors"
                            onMouseDown={() => selectVoyageur(v)}
                          >
                            <span className="font-medium text-text">{v.name}</span>
                            <span className="text-xs text-text-secondary block">{v.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {showSuggestions && voyageurSearch.length > 0 && filteredVoyageurs.length === 0 && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card rounded-lg border border-border/50 shadow-dropdown py-3 px-3">
                        <p className="text-xs text-text-secondary mb-2">Aucun voyageur trouvé</p>
                        <button
                          type="button"
                          className="text-xs text-accent font-medium hover:underline"
                          onMouseDown={() => setShowVoyageurModal(true)}
                        >
                          Créer un nouveau voyageur
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="h-9 w-9 rounded-lg border border-border bg-card flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent transition-all shrink-0"
                    title="Créer un nouveau voyageur"
                    onClick={() => setShowVoyageurModal(true)}
                  >
                    <Icon name="plus" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div variants={item}>
                <Input label="Nom" {...register('contrat.voyageur.nom')} required />
              </motion.div>
              <motion.div variants={item}>
                <Input label="Prénom" {...register('contrat.voyageur.prenom')} required />
              </motion.div>
              <motion.div variants={item}>
                <Input label="Email" type="email" {...register('contrat.voyageur.email')} required />
              </motion.div>
              <motion.div variants={item}>
                <Input label="Téléphone" {...register('contrat.voyageur.telephone')} required />
              </motion.div>
              <motion.div variants={item} className="md:col-span-2">
                <Input label="Adresse" {...register('contrat.voyageur.adresse')} />
              </motion.div>
              <motion.div variants={item}>
                <Input label="Nationalité" {...register('contrat.voyageur.nationalite')} />
              </motion.div>
              <motion.div variants={item}>
                <Input label="Pièce d'identité" {...register('contrat.voyageur.pieceIdentite')} placeholder="CIN / Passeport" />
              </motion.div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        {/* Séjour */}
        <AccordionItem value="sejour" className="border-0 border-t border-border/40">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="font-medium text-text">Séjour</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div variants={item}>
                <DatePicker label="Date d'arrivée" {...register('contrat.arrivee')} required />
              </motion.div>
              <motion.div variants={item}>
                <TimePicker label="Heure d'arrivée" {...register('contrat.heureArrivee')} />
              </motion.div>
              <motion.div variants={item}>
                <DatePicker label="Date de départ" {...register('contrat.depart')} required />
              </motion.div>
              <motion.div variants={item}>
                <TimePicker label="Heure de départ" {...register('contrat.heureDepart')} />
              </motion.div>
              <motion.div variants={item}>
                <Input label="Nombre de nuits" type="number" value={nuits || ''} {...register('contrat.nuits')} />
              </motion.div>
              <motion.div variants={item}>
                <Input label="Nombre de voyageurs" type="number" {...register('contrat.voyageurs')} />
              </motion.div>
              <motion.div variants={item} className="md:col-span-2">
                <Controller
                  name="contrat.typeSejour"
                  control={control}
                  render={({ field }) => (
                    <Select label="Type de séjour" options={[
                      { value: 'vacances', label: 'Vacances' },
                      { value: 'affaires', label: 'Affaires' },
                      { value: 'famille', label: 'Famille' },
                      { value: 'evenement', label: 'Événement' },
                    ]} value={field.value} onChange={field.onChange} />
                  )}
                />
              </motion.div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        {/* Paiement & Caution */}
        <AccordionItem value="paiement" className="border-0 border-t border-border/40">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-interactive" />
              <span className="font-medium text-text">Paiement & Caution</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div variants={item}>
                <Input label="Montant total du séjour (MAD)" type="number" {...register('contrat.montantTotal')} required />
              </motion.div>
              <motion.div variants={item}>
                <Input label="Arrhes / Acompte versé (MAD)" type="number" {...register('contrat.arrhes')} />
              </motion.div>
              <motion.div variants={item}>
                <DatePicker label="Date de versement des arrhes" {...register('contrat.dateArrhes')} />
              </motion.div>
              <motion.div variants={item}>
                <Input label="Solde restant dû (MAD)" type="number" {...register('contrat.solde')} />
              </motion.div>
              <motion.div variants={item}>
                <Input label="Caution / Dépôt de garantie (MAD)" type="number" {...register('contrat.caution')} />
              </motion.div>
              <motion.div variants={item}>
                <Controller
                  name="contrat.cautionMode"
                  control={control}
                  render={({ field }) => (
                    <Select label="Caution - Mode" options={[
                      { value: 'blocage_carte', label: 'Blocage sur carte' },
                      { value: 'cheque', label: 'Chèque' },
                      { value: 'especes', label: 'Espèces' },
                    ]} value={field.value} onChange={field.onChange} />
                  )}
                />
              </motion.div>
              <motion.div variants={item}>
                <Input label="Caution - Délai de restitution (heures)" type="number" {...register('contrat.cautionDelai')} placeholder="72" />
              </motion.div>
              <motion.div variants={item}>
                <Controller
                  name="contrat.modePaiement"
                  control={control}
                  render={({ field }) => (
                    <Select label="Mode de paiement" options={[
                      { value: 'especes', label: 'Espèces' },
                      { value: 'virement', label: 'Virement bancaire' },
                      { value: 'cb', label: 'Carte bancaire' },
                      { value: 'cheque', label: 'Chèque' },
                      { value: 'paypal', label: 'PayPal' },
                    ]} value={field.value} onChange={field.onChange} />
                  )}
                />
              </motion.div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>

        {/* Signatures */}
        <AccordionItem value="signatures" className="border-0 border-t border-border/40">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-premium" />
              <span className="font-medium text-text">Signatures</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
              <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                  <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Propriétaire / Mandataire</h5>
                  <div className="space-y-3">
                    <Input label="Nom et prénom" {...register('contrat.signatureProprietaire.nom')} />
                    <DatePicker label="Date de signature" {...register('contrat.signatureProprietaire.date')} />
                    <Textarea label="Signature électronique" {...register('contrat.signatureProprietaire.signature')} rows={2} placeholder="Coller la signature" />
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                  <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Voyageur</h5>
                  <div className="space-y-3">
                    <Input label="Nom et prénom" {...register('contrat.signatureVoyageur.nom')} />
                    <DatePicker label="Date de signature" {...register('contrat.signatureVoyageur.date')} />
                    <Textarea label="Signature électronique" {...register('contrat.signatureVoyageur.signature')} rows={2} placeholder="Coller la signature" />
                  </div>
                </div>
              </motion.div>
              <motion.div variants={item}>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50 border border-border/30">
                  <Controller name="contrat.contratSigne" control={control} render={({ field }) => (
                    <Checkbox label="Contrat signé par les deux parties" checked={field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                </div>
              </motion.div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {showVoyageurModal && (
        <VoyageurFormModal
          onClose={() => setShowVoyageurModal(false)}
          onSubmit={handleVoyageurCreated}
        />
      )}
    </MotionCard>
  );
}
