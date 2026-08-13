import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, ShoppingCart, Key, Home, Compass, ArrowRight, Lock } from 'react-feather';
import { useNavigate, useParams } from 'react-router-dom';
import type { Contact } from '../../../types/contact';

interface MandatChoiceModalProps {
  contact: Contact;
  onClose: () => void;
}

const MANDAT_OPTIONS = [
  {
    type: 'vendeur',
    mandatLabel: 'Mandat de vente',
    clientType: 'Vendeur',
    description: 'Le contact deviendra un client vendeur. Vous pourrez gérer la mise en vente de ses biens.',
    lockedDescription: 'Ce type de mandat est déjà actif pour ce contact. Les mises à jour s\'affichent dans la section mandats.',
    icon: TrendingUp,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    ring: 'ring-amber-200',
    border: 'border-amber-200 hover:border-amber-400',
  },
  {
    type: 'acheteur',
    mandatLabel: 'Mandat de recherche achat',
    clientType: 'Acheteur',
    description: 'Le contact deviendra un client acheteur. Vous pourrez gérer ses recherches de biens.',
    lockedDescription: 'Ce type de mandat est déjà actif pour ce contact. Les mises à jour s\'affichent dans la section mandats.',
    icon: ShoppingCart,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    ring: 'ring-emerald-200',
    border: 'border-emerald-200 hover:border-emerald-400',
  },
  {
    type: 'bailleur',
    mandatLabel: 'Mandat de gestion',
    clientType: 'Bailleur',
    description: 'Le contact deviendra un bailleur. Vous pourrez gérer la mise en location de ses biens.',
    lockedDescription: 'Ce type de mandat est déjà actif pour ce contact. Les mises à jour s\'affichent dans la section mandats.',
    icon: Key,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    ring: 'ring-teal-200',
    border: 'border-teal-200 hover:border-teal-400',
  },
  {
    type: 'locataire',
    mandatLabel: 'Mandat de recherche location',
    clientType: 'Locataire',
    description: 'Le contact deviendra un locataire. Vous pourrez gérer ses recherches de location.',
    lockedDescription: 'Ce type de mandat est déjà actif pour ce contact. Les mises à jour s\'affichent dans la section mandats.',
    icon: Home,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    ring: 'ring-violet-200',
    border: 'border-violet-200 hover:border-violet-400',
  },
  {
    type: 'voyageur',
    mandatLabel: 'Contrat de location saisonnière',
    clientType: 'Voyageur',
    description: 'Le contact deviendra un voyageur. Vous pourrez gérer ses séjours et réservations.',
    lockedDescription: 'Ce contrat est déjà actif pour ce contact. Les mises à jour s\'affichent dans la section mandats.',
    icon: Compass,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    ring: 'ring-sky-200',
    border: 'border-sky-200 hover:border-sky-400',
  },
];

export const MandatChoiceModal = ({ contact, onClose }: MandatChoiceModalProps) => {
  const navigate = useNavigate();
  const { adminId } = useParams();
  const existingTypes = new Set<string>(contact.mandats.map((m) => m.clientType));

  const handleSelect = (type: string) => {
    sessionStorage.setItem('openNewClientModal', '1');
    sessionStorage.setItem('selectedContactId', contact.id);
    navigate(adminId ? `/admin/${adminId}/clients/type/${type}` : `/clients/type/${type}`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
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
          className="relative w-full max-w-lg mx-4 bg-card rounded-xl border border-border/50 shadow-modal overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Ajouter un mandat</h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Choisissez le type de mandat pour <span className="font-medium text-text">{contact.firstName} {contact.lastName}</span>
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all">
              <X size={16} />
            </button>
          </div>

          <div className="p-4 space-y-2">
            {MANDAT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isLocked = existingTypes.has(opt.clientType);
              return (
                <button
                  key={opt.type}
                  type="button"
                  disabled={isLocked}
                  onClick={() => !isLocked && handleSelect(opt.type)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                    isLocked
                      ? 'opacity-60 border-border/40 bg-background-secondary/30 cursor-not-allowed'
                      : `${opt.border} bg-card hover:bg-background/50 group`
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${isLocked ? 'bg-background-secondary' : opt.bg} ring-2 ${isLocked ? 'ring-border/30' : opt.ring} flex items-center justify-center flex-shrink-0`}>
                    {isLocked ? <Lock size={16} className="text-text-tertiary" /> : <Icon size={18} className={opt.color} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${isLocked ? 'text-text-secondary' : 'text-text'}`}>{opt.mandatLabel}</p>
                      {isLocked && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-background-secondary text-text-tertiary">Déjà défini</span>}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">{isLocked ? opt.lockedDescription : opt.description}</p>
                  </div>
                  {!isLocked && <ArrowRight size={16} className="text-text-secondary/30 group-hover:text-text-secondary transition-colors flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="px-6 py-3 border-t border-border/30 bg-background/30">
            <p className="text-[11px] text-text-secondary/60 text-center">
              En choisissant un mandat, vous serez redirigé vers le formulaire client correspondant.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
