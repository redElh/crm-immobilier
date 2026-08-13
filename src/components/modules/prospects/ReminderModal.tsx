import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Trash2 } from 'react-feather';
import { Button } from '../../ui/Button';
import { Textarea } from '../../ui/Textarea';
import { DatePicker } from '../../ui/DatePicker';
import { TimePicker } from '../../ui/TimePicker';

interface ReminderModalProps {
  onClose: () => void;
  onConfirm: (reminderDate: string, reminderNote: string) => void;
  onCancel?: () => void;
  prospectName: string;
  mode?: 'create' | 'edit';
  initialDate?: string;
  initialTime?: string;
  initialNote?: string;
}

export const ReminderModal = ({ onClose, onConfirm, onCancel, prospectName, mode = 'create', initialDate = '', initialTime = '09:00', initialNote = '' }: ReminderModalProps) => {
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [note, setNote] = useState(initialNote);

  const handleSubmit = () => {
    if (!date) return;
    const fullDate = `${date}T${time}:00`;
    onConfirm(fullDate, note);
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
          className="relative w-full max-w-md mx-4 bg-card rounded-xl border border-border/50 shadow-modal"
        >
          <div className="px-5 py-4 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Calendar size={16} className="text-orange-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">{mode === 'edit' ? 'Modifier le rappel' : 'Programmer un rappel'}</h2>
                  <p className="text-[11px] text-text-secondary/60">{prospectName}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <DatePicker label="Date du rappel" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <TimePicker label="Heure" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>

            <Textarea
              label="Note (optionnel)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Rappeler pour visiter le bien à..."
              rows={3}
            />

            <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50/60 border border-orange-100">
              <Clock size={14} className="text-orange-600 shrink-0" />
              <p className="text-[11px] text-orange-700">
                {mode === 'edit'
                  ? 'La nouvelle date et heure seront prises en compte pour la notification.'
                  : 'Vous recevrez une notification à la date et heure choisies.'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              {mode === 'edit' && onCancel ? (
                <Button
                  variant="ghost"
                  className="text-error hover:bg-error/5 hover:text-error"
                  onClick={onCancel}
                >
                  <Trash2 size={14} /> Supprimer le rappel
                </Button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={onClose}>Annuler</Button>
                <Button variant="default" disabled={!date} onClick={handleSubmit}>
                  {mode === 'edit' ? 'Mettre à jour' : 'Programmer le rappel'}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
