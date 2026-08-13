import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit3, Calendar } from 'react-feather';

interface ActionChoiceModalProps {
  onClose: () => void;
  onEditInfo: () => void;
  onEditReminder: () => void;
  prospectName: string;
  currentReminder?: string | null;
}

export const ActionChoiceModal = ({ onClose, onEditInfo, onEditReminder, prospectName, currentReminder }: ActionChoiceModalProps) => {
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
          className="relative w-full max-w-sm mx-4 bg-card rounded-xl border border-border/50 shadow-modal overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Modifier le prospect</h2>
                <p className="text-[11px] text-text-secondary/60 mt-0.5">{prospectName}</p>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-3">
            <button
              onClick={onEditInfo}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border/40 hover:border-blue-200 hover:bg-blue-50/40 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Edit3 size={18} className="text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-text-primary">Modifier les informations</p>
                <p className="text-[11px] text-text-secondary/60">Nom, email, téléphone, critères…</p>
              </div>
            </button>

            <button
              onClick={onEditReminder}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border/40 hover:border-orange-200 hover:bg-orange-50/40 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <Calendar size={18} className="text-orange-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-text-primary">Modifier le rappel</p>
                <p className="text-[11px] text-text-secondary/60">
                  {currentReminder
                    ? `Rappel prévu le ${new Date(currentReminder).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                    : 'Programmer ou modifier le rappel'}
                </p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
