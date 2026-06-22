import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'react-feather';
import { Prospect } from '../../../types/prospect';
import { DatePicker } from '../../ui/DatePicker';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Button } from '../../ui/Button';

interface QualificationFormModalProps {
  onClose: () => void;
  onSubmit: (data: {
    type: string;
    civility: string;
    firstName: string;
    lastName: string;
    emailPrincipal: string;
    emailSecondaire: string;
    mobile: string;
    telephoneFixe: string;
    profession: string;
    lieuNaissance: string;
    dateNaissance: string;
    nationalite: string;
    numeroFiscal: string;
    adresse: string;
    adresse2: string;
    codePostal: string;
    pays: string;
    devisePreferee: string;
    situationFamiliale: string;
    nombreEnfants: string;
    prescripteur: string;
    regimeMatrimonial: string;
    siteInternet: string;
    langueParlee: string;
  }) => void;
  prospect: Prospect;
}

const TYPES = [
  { value: 'Particulier', label: 'Particulier' },
  { value: 'Professionnel', label: 'Professionnel' },
  { value: 'Indivision / Succession', label: 'Indivision / Succession' },
];

const COUNTRY_CODES = [
  { value: '+212', label: '+212 (Maroc)' },
  { value: '+33', label: '+33 (France)' },
  { value: '+32', label: '+32 (Belgique)' },
  { value: '+41', label: '+41 (Suisse)' },
  { value: '+1', label: '+1 (Canada/États-Unis)' },
  { value: '+44', label: '+44 (Royaume-Uni)' },
  { value: '+49', label: '+49 (Allemagne)' },
  { value: '+34', label: '+34 (Espagne)' },
  { value: '+39', label: '+39 (Italie)' },
  { value: '+31', label: '+31 (Pays-Bas)' },
  { value: '+351', label: '+351 (Portugal)' },
  { value: '+352', label: '+352 (Luxembourg)' },
  { value: '+216', label: '+216 (Tunisie)' },
  { value: '+213', label: '+213 (Algérie)' },
  { value: '+221', label: '+221 (Sénégal)' },
  { value: '+225', label: "+225 (Côte d'Ivoire)" },
  { value: '+20', label: '+20 (Égypte)' },
  { value: '+971', label: '+971 (Émirats Arabes Unis)' },
  { value: '+974', label: '+974 (Qatar)' },
  { value: '+966', label: '+966 (Arabie Saoudite)' },
  { value: '+90', label: '+90 (Turquie)' },
  { value: '+86', label: '+86 (Chine)' },
  { value: '+81', label: '+81 (Japon)' },
  { value: '+82', label: '+82 (Corée du Sud)' },
  { value: '+65', label: '+65 (Singapour)' },
  { value: '+91', label: '+91 (Inde)' },
  { value: '+61', label: '+61 (Australie)' },
];

const REGIMES_MATRIMONIAUX = [
  { value: 'Communauté de biens', label: 'Communauté de biens' },
  { value: 'Communauté universelle', label: 'Communauté universelle' },
  { value: 'Séparation des biens', label: 'Séparation des biens' },
];

const CIVILITIES = [
  { value: 'M.', label: 'M.' },
  { value: 'Mme', label: 'Mme' },
  { value: 'Mlle', label: 'Mlle' },
  { value: 'Autre', label: 'Autre' },
];

const COUNTRIES = [
  { value: 'Afghanistan', label: 'Afghanistan' },
  { value: 'Afrique du Sud', label: 'Afrique du Sud' },
  { value: 'Algérie', label: 'Algérie' },
  { value: 'Allemagne', label: 'Allemagne' },
  { value: 'Arabie Saoudite', label: 'Arabie Saoudite' },
  { value: 'Belgique', label: 'Belgique' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Côte d\'Ivoire', label: 'Côte d\'Ivoire' },
  { value: 'Égypte', label: 'Égypte' },
  { value: 'Émirats Arabes Unis', label: 'Émirats Arabes Unis' },
  { value: 'Espagne', label: 'Espagne' },
  { value: 'France', label: 'France' },
  { value: 'Italie', label: 'Italie' },
  { value: 'Luxembourg', label: 'Luxembourg' },
  { value: 'Maroc', label: 'Maroc' },
  { value: 'Pays-Bas', label: 'Pays-Bas' },
  { value: 'Portugal', label: 'Portugal' },
  { value: 'Royaume-Uni', label: 'Royaume-Uni' },
  { value: 'Sénégal', label: 'Sénégal' },
  { value: 'Suisse', label: 'Suisse' },
  { value: 'Tunisie', label: 'Tunisie' },
  { value: 'Turquie', label: 'Turquie' },
  { value: 'États-Unis', label: 'États-Unis' },
  { value: 'Autre', label: 'Autre' },
];

const CURRENCIES = [
  { value: 'MAD', label: 'MAD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
  { value: 'GBP', label: 'GBP' },
  { value: 'CHF', label: 'CHF' },
  { value: 'CAD', label: 'CAD' },
  { value: 'Autre', label: 'Autre' },
];

const SITUATIONS_FAMILIALES = [
  { value: 'Célibataire', label: 'Célibataire' },
  { value: 'Marié', label: 'Marié' },
  { value: 'Divorcé', label: 'Divorcé' },
  { value: 'Veuf', label: 'Veuf' },
];

const parsePhone = (value: string) => {
  if (!value) return { code: '+212', number: '' };
  const sorted = COUNTRY_CODES.map((c) => c.value).sort((a, b) => b.length - a.length);
  for (const code of sorted) {
    if (value.startsWith(code)) return { code, number: value.slice(code.length).trim() };
  }
  return { code: '+212', number: value };
};

export const QualificationFormModal = ({ onClose, onSubmit, prospect }: QualificationFormModalProps) => {
  const [formData, setFormData] = useState({
    type: 'Particulier',
    civility: prospect.civility,
    firstName: prospect.firstName,
    lastName: prospect.lastName,
    emailPrincipal: prospect.email,
    emailSecondaire: '',
    mobile: prospect.mobile || '',
    telephoneFixe: '',
    profession: '',
    lieuNaissance: '',
    dateNaissance: '',
    nationalite: '',
    numeroFiscal: '',
    adresse: '',
    adresse2: '',
    codePostal: '',
    pays: '',
    devisePreferee: '',
    situationFamiliale: '',
    nombreEnfants: '',
    prescripteur: '',
    regimeMatrimonial: '',
    siteInternet: '',
    langueParlee: prospect.spokenLanguage,
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (field: 'mobile' | 'telephoneFixe', code: string, number: string) => {
    const value = `${code} ${number}`.trim();
    handleChange(field, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderRadioGroup = (
    label: string,
    field: string,
    options: { value: string; label: string }[],
  ) => (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = formData[field as keyof typeof formData] === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleChange(field, opt.value)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                isSelected
                  ? 'bg-accent text-white border-accent ring-2 ring-accent/30'
                  : 'bg-card text-text-secondary border-border hover:border-accent/50'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const parsedMobile = parsePhone(formData.mobile);
  const parsedFixe = parsePhone(formData.telephoneFixe);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl mx-4 bg-card rounded-xl border border-border/50 shadow-modal overflow-y-auto max-h-[calc(100vh-80px)]"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 sticky top-0 bg-card z-10">
            <h2 className="text-lg font-semibold">Qualifier le prospect</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-text flex items-center gap-2 mb-4">
                <span className="w-1 h-4 rounded-full bg-accent" />
                Type de contact
              </h3>
              {renderRadioGroup('', 'type', TYPES)}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text flex items-center gap-2 mb-4">
                <span className="w-1 h-4 rounded-full bg-accent" />
                Identité
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Civilité" options={CIVILITIES} value={formData.civility} onValueChange={(v) => handleChange('civility', v)} />
                <Input label="Prénom" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} />
                <Input label="Nom" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} />
                <Input label="Email principal" type="email" value={formData.emailPrincipal} onChange={(e) => handleChange('emailPrincipal', e.target.value)} />
                <Input label="Email secondaire" type="email" value={formData.emailSecondaire} onChange={(e) => handleChange('emailSecondaire', e.target.value)} placeholder="exemple@email.com" />
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-text">Mobile</p>
                  <div className="flex gap-2">
                    <div className="w-36 shrink-0">
                      <Select options={COUNTRY_CODES} value={parsedMobile.code} onValueChange={(code) => handlePhoneChange('mobile', code, parsedMobile.number)} />
                    </div>
                    <div className="flex-1">
                      <Input value={parsedMobile.number} onChange={(e) => handlePhoneChange('mobile', parsedMobile.code, e.target.value)} placeholder="6 98 76 54 32" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-text">Télécopie</p>
                  <div className="flex gap-2">
                    <div className="w-36 shrink-0">
                      <Select options={COUNTRY_CODES} value={parsedFixe.code} onValueChange={(code) => handlePhoneChange('telephoneFixe', code, parsedFixe.number)} />
                    </div>
                    <div className="flex-1">
                      <Input value={parsedFixe.number} onChange={(e) => handlePhoneChange('telephoneFixe', parsedFixe.code, e.target.value)} placeholder="5 XX XX XX XX" />
                    </div>
                  </div>
                </div>
                <Input label="Profession" value={formData.profession} onChange={(e) => handleChange('profession', e.target.value)} placeholder="Métier..." />
                <Input label="Lieu de naissance" value={formData.lieuNaissance} onChange={(e) => handleChange('lieuNaissance', e.target.value)} placeholder="Ville de naissance" />
                <DatePicker label="Date de naissance" value={formData.dateNaissance} onChange={(e) => handleChange('dateNaissance', e.target.value)} />
                <Input label="Nationalité" value={formData.nationalite} onChange={(e) => handleChange('nationalite', e.target.value)} placeholder="Nationalité" />
                <Input label="N° fiscale" value={formData.numeroFiscal} onChange={(e) => handleChange('numeroFiscal', e.target.value)} placeholder="Numéro fiscal" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text flex items-center gap-2 mb-4">
                <span className="w-1 h-4 rounded-full bg-accent" />
                Adresse
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Input label="Adresse" value={formData.adresse} onChange={(e) => handleChange('adresse', e.target.value)} placeholder="Numéro et rue" />
                </div>
                <Input label="Adresse (2)" value={formData.adresse2} onChange={(e) => handleChange('adresse2', e.target.value)} placeholder="Complément d'adresse" />
                <Input label="Code postal" value={formData.codePostal} onChange={(e) => handleChange('codePostal', e.target.value)} placeholder="Code postal" />
                <Select label="Pays" options={COUNTRIES} value={formData.pays} onValueChange={(v) => handleChange('pays', v)} style={{ paddingTop: '0.625rem', paddingBottom: '0.625rem' }} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text flex items-center gap-2 mb-4">
                <span className="w-1 h-4 rounded-full bg-accent" />
                Informations complémentaires
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Devise préférée" options={CURRENCIES} value={formData.devisePreferee} onValueChange={(v) => handleChange('devisePreferee', v)} />
                <Select label="Situation familiale" options={SITUATIONS_FAMILIALES} value={formData.situationFamiliale} onValueChange={(v) => handleChange('situationFamiliale', v)} />
                <Input label="Nombre d'enfants" type="number" min="0" value={formData.nombreEnfants} onChange={(e) => handleChange('nombreEnfants', e.target.value)} placeholder="0" />
                <Input label="Prescripteur" value={formData.prescripteur} onChange={(e) => handleChange('prescripteur', e.target.value)} placeholder="Nom du prescripteur" />
                <Select label="Régime matrimonial" options={REGIMES_MATRIMONIAUX} value={formData.regimeMatrimonial} onValueChange={(v) => handleChange('regimeMatrimonial', v)} />
                <Input label="Site Internet Personnel" type="url" value={formData.siteInternet} onChange={(e) => handleChange('siteInternet', e.target.value)} placeholder="https://" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/30">
              <div />
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Annuler
                </Button>
                <Button type="submit" variant="default">
                  Qualifier le prospect
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
