import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Lock, Plus } from 'react-feather';
import type { Contact } from '../../../types/contact';
import StageModal, { useStageModalButtons } from '../calendar/StageModal';
import { cn } from '../../../lib/utils';
import { CONTACT_MANDAT_META, useContactAccent, stagePillStyle } from './ContactDetailStage';

interface MandatChoiceModalProps {
  contact: Contact;
  onClose: () => void;
  isGerant?: boolean;
}

const MANDAT_OPTIONS = [
  {
    type: 'vendeur',
    mandatLabel: 'Mandat de vente',
    clientType: 'Vendeur',
    description: 'Le contact deviendra un client vendeur. Vous pourrez gérer la mise en vente de ses biens.',
    lockedDescription: "Ce type de mandat est déjà actif pour ce contact. Les mises à jour s'affichent dans la section mandats.",
  },
  {
    type: 'acheteur',
    mandatLabel: 'Mandat de recherche achat',
    clientType: 'Acheteur',
    description: 'Le contact deviendra un client acheteur. Vous pourrez gérer ses recherches de biens.',
    lockedDescription: "Ce type de mandat est déjà actif pour ce contact. Les mises à jour s'affichent dans la section mandats.",
  },
  {
    type: 'bailleur',
    mandatLabel: 'Mandat de gestion',
    clientType: 'Bailleur',
    description: 'Le contact deviendra un bailleur. Vous pourrez gérer la mise en location de ses biens.',
    lockedDescription: "Ce type de mandat est déjà actif pour ce contact. Les mises à jour s'affichent dans la section mandats.",
  },
  {
    type: 'locataire',
    mandatLabel: 'Mandat de recherche location',
    clientType: 'Locataire',
    description: 'Le contact deviendra un locataire. Vous pourrez gérer ses recherches de location.',
    lockedDescription: "Ce type de mandat est déjà actif pour ce contact. Les mises à jour s'affichent dans la section mandats.",
  },
  {
    type: 'voyageur',
    mandatLabel: 'Contrat de location saisonnière',
    clientType: 'Voyageur',
    description: 'Le contact deviendra un voyageur. Vous pourrez gérer ses séjours et réservations.',
    lockedDescription: "Ce contrat est déjà actif pour ce contact. Les mises à jour s'affichent dans la section mandats.",
  },
];

export const MandatChoiceModal = ({ contact, onClose, isGerant = false }: MandatChoiceModalProps) => {
  const navigate = useNavigate();
  const { adminId } = useParams();
  const { isDark, accent, ink } = useContactAccent(isGerant);
  const btns = useStageModalButtons();
  const existingTypes = new Set<string>(contact.mandats.map((m) => m.clientType));

  const handleSelect = (type: string) => {
    sessionStorage.setItem('openNewClientModal', '1');
    sessionStorage.setItem('selectedContactId', contact.id);
    navigate(adminId ? `/admin/${adminId}/clients/type/${type}` : `/clients/type/${type}`);
  };

  return (
    <StageModal
      open
      onClose={onClose}
      title="Ajouter un mandat"
      eyebrow="Nouveau mandat"
      subtitle={`Choisissez le type de mandat pour ${contact.firstName} ${contact.lastName}`}
      icon={Plus}
      hue={accent}
      maxWidth="max-w-xl"
      centered
      footer={
        <button className={cn(btns.ghost, isGerant && 'btn-gerant-pill')} onClick={onClose}>
          Fermer
        </button>
      }
    >
      <div className="space-y-2.5">
        {MANDAT_OPTIONS.map((opt, index) => {
          const meta = CONTACT_MANDAT_META[opt.clientType];
          const Icon = meta?.icon || Plus;
          const hue = meta?.hue || accent;
          const isLocked = existingTypes.has(opt.clientType);
          return (
            <motion.button
              key={opt.type}
              type="button"
              disabled={isLocked}
              onClick={() => !isLocked && handleSelect(opt.type)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 + index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'group flex w-full items-center gap-3.5 rounded-2xl border p-3.5 text-left backdrop-blur-sm transition-all duration-200',
                isLocked ? 'cursor-not-allowed opacity-55' : 'hover:-translate-y-0.5 active:scale-[0.99]',
              )}
              style={
                isLocked
                  ? {
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                      background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(248,250,252,0.6)',
                    }
                  : {
                      borderColor: `${hue.line}33`,
                      background: isDark ? `${hue.a}10` : `${hue.a}0D`,
                    }
              }
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                style={
                  isLocked
                    ? {
                        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
                        color: isDark ? '#94A3B8' : '#64748B',
                      }
                    : {
                        backgroundImage: `linear-gradient(145deg, ${hue.a}, ${hue.b})`,
                        boxShadow: `0 8px 20px -8px ${hue.glow}, inset 0 1px 0 rgba(255,255,255,0.3)`,
                      }
                }
              >
                {isLocked ? <Lock size={16} /> : <Icon size={18} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                    {opt.mandatLabel}
                  </p>
                  {isLocked && (
                    <span className="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em]" style={stagePillStyle(hue, isDark)}>
                      Déjà défini
                    </span>
                  )}
                </div>
                <p className={cn('mt-0.5 text-xs leading-relaxed', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  {isLocked ? opt.lockedDescription : opt.description}
                </p>
              </div>
              {!isLocked && (
                <ArrowRight
                  size={16}
                  className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                  style={{ color: isDark ? hue.a : ink }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
      <p className={cn('mt-4 text-center text-[11px] font-semibold', isDark ? 'text-slate-500' : 'text-slate-400')}>
        En choisissant un mandat, vous serez redirigé vers le formulaire client correspondant.
      </p>
    </StageModal>
  );
};
