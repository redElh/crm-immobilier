import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, CheckCircle } from 'react-feather';
import { Prospect } from '../../../types/prospect';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';
import { DatePicker } from '../../ui/DatePicker';
import { TimePicker } from '../../ui/TimePicker';
import { saveDraft, getDraft, deleteDraft } from '../../../services/prospectDraftStorage';
import { calcProspectCompletion } from '../../../utils/prospectCompletion';

interface ProspectFormModalProps {
  onClose: () => void;
  onSubmit: (data: Omit<Prospect, 'id' | 'createdAt' | 'updatedAt'>) => void;
  prospect?: Prospect;
  draftId?: string;
  userId?: string;
  onDraftChange?: () => void;
}

type FormData = Omit<Prospect, 'id' | 'createdAt' | 'updatedAt'>;

const TYPES = [
  { value: 'Acheter', label: 'Acheter' },
  { value: 'Louer', label: 'Louer' },
  { value: 'Vendre', label: 'Vendre' },
  { value: 'Faire estimer', label: 'Faire estimer' },
];

const ORIGINS = [
  { value: 'Site web', label: 'Site web' },
  { value: 'Portail', label: 'Portail' },
  { value: 'Référence', label: 'Référence' },
  { value: 'Appel téléphonique', label: 'Appel téléphonique' },
  { value: 'Réseaux sociaux', label: 'Réseaux sociaux' },
  { value: 'Visite agence', label: 'Visite agence' },
  { value: 'Autre', label: 'Autre' },
];

const LANGUAGES = [
  { value: 'Français', label: 'Français' },
  { value: 'Anglais', label: 'Anglais' },
  { value: 'Arabe', label: 'Arabe' },
  { value: 'Berbère', label: 'Berbère' },
  { value: 'Espagnol', label: 'Espagnol' },
  { value: 'Allemand', label: 'Allemand' },
  { value: 'Italien', label: 'Italien' },
  { value: 'Portugais', label: 'Portugais' },
  { value: 'Néerlandais', label: 'Néerlandais' },
  { value: 'Russe', label: 'Russe' },
  { value: 'Chinois', label: 'Chinois' },
  { value: 'Japonais', label: 'Japonais' },
  { value: 'Turc', label: 'Turc' },
  { value: 'Hébreu', label: 'Hébreu' },
];

const CIVILITIES = [
  { value: 'M.', label: 'M.' },
  { value: 'Mme', label: 'Mme' },
  { value: 'Mlle', label: 'Mlle' },
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

const MEANS_OF_CONTACT = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Téléphone' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'facebook_messenger', label: 'Facebook Messenger' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'wechat', label: 'WeChat' },
  { value: 'line', label: 'Line' },
  { value: 'telegram', label: 'Telegram' },
];

const CATEGORIES = [
  { value: 'Vente', label: 'Vente' },
  { value: 'Location', label: 'Location' },
  { value: 'Location saisonnière', label: 'Location saisonnière' },
  { value: 'Programme', label: 'Programme' },
  { value: 'Viager', label: 'Viager' },
  { value: 'Enchère', label: 'Enchère' },
];

const PROPERTY_TYPES = [
  { value: 'Appartement', label: 'Appartement' },
  { value: 'Maison', label: 'Maison' },
  { value: 'Terrain', label: 'Terrain' },
  { value: 'Commerce', label: 'Commerce' },
  { value: 'Garage / Parking', label: 'Garage / Parking' },
  { value: 'Immeuble', label: 'Immeuble' },
  { value: 'Bureau', label: 'Bureau' },
  { value: 'Bateau', label: 'Bateau' },
  { value: 'Locaux activité / Entrepos', label: 'Locaux activité / Entrepos' },
  { value: 'Cave / Box', label: 'Cave / Box' },
];

const CURRENCIES = [
  { value: 'MAD', label: 'MAD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
];

const VIEW_TYPES = [
  { value: 'Aperçu', label: 'Aperçu' },
  { value: 'Dégagée', label: 'Dégagée' },
  { value: 'Externe', label: 'Externe' },
  { value: 'Interne', label: 'Interne' },
  { value: 'Panoramique', label: 'Panoramique' },
  { value: 'Vis-à-vis', label: 'Vis-à-vis' },
];

const VIEW_DETAILS = [
  { value: 'Campagne', label: 'Campagne' },
  { value: 'Ciel', label: 'Ciel' },
  { value: 'Collines', label: 'Collines' },
  { value: 'Cour', label: 'Cour' },
  { value: 'Fleuve', label: 'Fleuve' },
  { value: 'Forêt', label: 'Forêt' },
  { value: 'Golf', label: 'Golf' },
  { value: 'Jardin', label: 'Jardin' },
  { value: 'Lac', label: 'Lac' },
  { value: 'Mer', label: 'Mer' },
  { value: 'Montagnes', label: 'Montagnes' },
  { value: 'Monument', label: 'Monument' },
  { value: 'Parc', label: 'Parc' },
  { value: 'Piscine', label: 'Piscine' },
  { value: 'Pistes de ski', label: 'Pistes de ski' },
  { value: 'Place', label: 'Place' },
  { value: 'Port', label: 'Port' },
  { value: 'Rivière', label: 'Rivière' },
  { value: 'Rue', label: 'Rue' },
  { value: 'Verdure', label: 'Verdure' },
  { value: 'Vignes', label: 'Vignes' },
  { value: 'Village', label: 'Village' },
  { value: 'Ville', label: 'Ville' },
];

const parsePhone = (value: string) => {
  if (!value) return { code: '+212', number: '' };
  const sorted = COUNTRY_CODES.map((c) => c.value).sort((a, b) => b.length - a.length);
  for (const code of sorted) {
    if (value.startsWith(code)) return { code, number: value.slice(code.length).trim() };
  }
  return { code: '+212', number: value };
};

const today = new Date().toISOString().slice(0, 10);
const nowTime = new Date().toTimeString().slice(0, 5);

export const ProspectFormModal = ({ onClose, onSubmit, prospect, draftId: initialDraftId, userId, onDraftChange }: ProspectFormModalProps) => {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const initialDate = prospect?.date ? String(prospect.date).split('T')[0] : today;
  const initialTime = prospect?.date ? String(prospect.date).split('T')[1]?.slice(0, 5) || nowTime : nowTime;
  const [formDate, setFormDate] = useState(initialDate);
  const [formTime, setFormTime] = useState(initialTime);

  const [formData, setFormData] = useState<FormData>(() => {
    if (prospect) {
      const { id, createdAt, updatedAt, ...rest } = prospect;
      return rest;
    }
    return {
      type: 'Acheter',
      origin: 'Site web',
      date: `${today}T${nowTime}`,
      message: '',
      civility: 'M.',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      mobile: '',
      spokenLanguage: 'Français',
      meansOfContact: ['email'],
      categories: '',
      propertyTypes: [],
      location: '',
      rooms: undefined,
      bedrooms: undefined,
      minSurface: undefined,
      maxPrice: undefined,
      currency: 'MAD',
      viewType: '',
      viewDetail: '',
      status: 'Nouveau',
    };
  });

  const [savedDraftId, setSavedDraftId] = useState<string | undefined>(initialDraftId || undefined);
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // Restore draft on mount
  useEffect(() => {
    if (!initialDraftId || !userId) return;
    const draft = getDraft(userId, initialDraftId);
    if (draft) {
      setFormData(prev => ({ ...prev, ...draft.data }));
      if (draft.data.date) {
        const parts = String(draft.data.date).split('T');
        if (parts[0]) setFormDate(parts[0]);
        if (parts[1]) setFormTime(parts[1].slice(0, 5));
      }
    }
  }, []);

  // Auto-save debounced 2s
  useEffect(() => {
    if (!savedDraftId || !userId) return;
    const timer = setTimeout(() => {
      const data = formDataRef.current;
      const completion = calcProspectCompletion(data as Prospect);
      saveDraft(userId, { ...data, _draftId: savedDraftId }, completion);
      onDraftChange?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [formData, savedDraftId]);

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handlePhoneChange = (field: 'phone' | 'mobile', code: string, number: string) => {
    const value = `${code} ${number}`.trim();
    handleChange(field, value);
  };

  const handleCheckboxGroup = (field: 'propertyTypes' | 'meansOfContact', value: string) => {
    setFormData((prev) => {
      const current = prev[field] as string[];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleSaveDraft = () => {
    if (!userId) return;
    const data = { ...formDataRef.current, _draftId: savedDraftId };
    const draft = saveDraft(userId, data, calcProspectCompletion(formData as Prospect));
    if (!savedDraftId) setSavedDraftId(draft.id);
    onDraftChange?.();
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'Prénom requis';
    if (!formData.lastName.trim()) newErrors.lastName = 'Nom requis';
    if (!formData.email.trim()) newErrors.email = 'Email requis';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Email invalide';
    if (!formData.phone.trim()) newErrors.phone = 'Téléphone requis';
    if (!formData.categories) newErrors.categories = 'Sélectionnez une catégorie';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (savedDraftId && userId) deleteDraft(userId, savedDraftId);
    onSubmit(formData);
  };

  const renderCheckboxGroup = (
    label: string,
    field: 'propertyTypes' | 'meansOfContact',
    options: { value: string; label: string }[],
    error?: string,
  ) => (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = (formData[field] as string[]).includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleCheckboxGroup(field, opt.value)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                isSelected
                  ? 'bg-accent text-white border-accent'
                  : 'bg-card text-text-secondary border-border hover:border-accent/50'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );

  const renderRadioGroup = (
    label: string,
    field: keyof FormData,
    options: { value: string; label: string }[],
    error?: string,
  ) => (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = formData[field] === opt.value;
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
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );

  const parsedPhone = parsePhone(formData.phone);
  const parsedMobile = parsePhone(formData.mobile || '');
  const completion = calcProspectCompletion(formData as Prospect);

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
          <div className="px-6 py-4 border-b border-border/40 sticky top-0 bg-card z-10">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">{prospect ? 'Modifier le prospect' : 'Nouveau prospect'}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-text-secondary">{completion}%</span>
                <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all">
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${completion}%`,
                  backgroundColor: completion === 100 ? '#10b981' : completion >= 60 ? '#6366f1' : '#f59e0b',
                }}
              />
            </div>
          </div>

          <div className="px-6 py-1 border-b border-border/30 flex gap-1">
            {[1, 2, 3, 4].map((s) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-all ${
                  step === s ? 'text-accent border-accent' : 'text-text-secondary border-transparent hover:text-text'
                }`}
              >
                {s === 1 ? 'Général' : s === 2 ? 'Contact' : s === 3 ? 'Produit' : 'Critères'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {step === 1 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select label="Type" options={TYPES} value={formData.type} onValueChange={(v) => handleChange('type', v)} />
                  <Select label="Origine" options={ORIGINS} value={formData.origin} onValueChange={(v) => handleChange('origin', v)} />
                  <DatePicker
                    label="Date"
                    value={formDate}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormDate(v);
                      handleChange('date', `${v}T${formTime}`);
                    }}
                  />
                  <TimePicker
                    label="Heure"
                    value={formTime}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormTime(v);
                      handleChange('date', `${formDate}T${v}`);
                    }}
                  />
                </div>
                <Textarea label="Message / Notes" value={formData.message} onChange={(e) => handleChange('message', e.target.value)} placeholder="Message initial du prospect..." rows={3} />
              </>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select label="Langue parlée" options={LANGUAGES} value={formData.spokenLanguage} onValueChange={(v) => handleChange('spokenLanguage', v)} />
                  <Select label="Civilité" options={CIVILITIES} value={formData.civility} onValueChange={(v) => handleChange('civility', v)} />
                  <Input label="Prénom" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} error={errors.firstName} placeholder="Jean" />
                  <Input label="Nom" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} error={errors.lastName} placeholder="Dupont" />
                  <Input label="Email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} error={errors.email} placeholder="jean@email.com" />
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-text">Téléphone</p>
                    <div className="flex gap-2">
                      <div className="w-36 shrink-0">
                        <Select options={COUNTRY_CODES} value={parsedPhone.code} onValueChange={(code) => handlePhoneChange('phone', code, parsedPhone.number)} />
                      </div>
                      <div className="flex-1">
                        <Input value={parsedPhone.number} onChange={(e) => handlePhoneChange('phone', parsedPhone.code, e.target.value)} placeholder="6 12 34 56 78" />
                      </div>
                    </div>
                    {errors.phone && <p className="text-xs text-error">{errors.phone}</p>}
                  </div>
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
                </div>
                {renderCheckboxGroup('Moyens de contact', 'meansOfContact', MEANS_OF_CONTACT)}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                {renderRadioGroup('Catégories', 'categories', CATEGORIES, errors.categories)}
                {renderCheckboxGroup('Types de bien', 'propertyTypes', PROPERTY_TYPES)}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Input label="Localisation" value={formData.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="Ville, quartier..." />
                  </div>
                  <Input label="Pièces" type="number" min="0" value={formData.rooms?.toString() || ''} onChange={(e) => handleChange('rooms', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="3" />
                  <Input label="Chambres" type="number" min="0" value={formData.bedrooms?.toString() || ''} onChange={(e) => handleChange('bedrooms', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="2" />
                  <Input label="Surface min (m²)" type="number" min="0" value={formData.minSurface?.toString() || ''} onChange={(e) => handleChange('minSurface', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="80" />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input label="Budget max" type="number" min="0" value={formData.maxPrice?.toString() || ''} onChange={(e) => handleChange('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="500000" />
                    </div>
                    <div className="w-24">
                      <Select label="Devise" options={CURRENCIES} value={formData.currency} onValueChange={(v) => handleChange('currency', v)} />
                    </div>
                  </div>
                  <Select label="Vue" options={VIEW_TYPES} value={formData.viewType || ''} onValueChange={(v) => handleChange('viewType', v)} />
                  <Select label="Détail vue" options={VIEW_DETAILS} value={formData.viewDetail || ''} onValueChange={(v) => handleChange('viewDetail', v)} />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border/30">
              <div>
                {!savedDraftId ? (
                  <Button type="button" variant="ghost" size="sm" icon={<Save size={14} />} onClick={handleSaveDraft}>
                    Brouillon
                  </Button>
                ) : (
                  <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                    <CheckCircle size={12} />
                    Auto-sauvegarde
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                    Précédent
                  </Button>
                )}
                <Button type="button" variant="ghost" onClick={onClose}>
                  Annuler
                </Button>
                {step < 4 ? (
                  <Button type="button" variant="default" onClick={() => setStep(step + 1)}>
                    Suivant
                  </Button>
                ) : (
                  <Button type="submit" variant="default">
                    {prospect ? 'Enregistrer' : 'Créer le prospect'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
