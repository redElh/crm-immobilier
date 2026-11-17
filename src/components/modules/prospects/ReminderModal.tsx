import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Trash2 } from 'react-feather';
import { cn } from '../../../lib/utils';
import { Textarea } from '../../ui/Textarea';
import { DatePicker } from '../../ui/DatePicker';
import { TimePicker } from '../../ui/TimePicker';
import StageModal, { useStageModalButtons } from '../calendar/StageModal';
import { useStageChrome } from '../calendar/useStageChrome';
import { STAGE_HUES, type StageHue } from '../../dashboard/Stage';

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

/* Light-mode identity shared app-wide (sidebar, cards, modals): teal-emerald */
const SIDEBAR_EMERALD: StageHue = {
  a: '#2DD4BF',
  b: '#0D9488',
  glow: 'rgba(13,148,136,0.35)',
  line: '#14B8A6',
};

export const ReminderModal = ({ onClose, onConfirm, onCancel, prospectName, mode = 'create', initialDate = '', initialTime = '09:00', initialNote = '' }: ReminderModalProps) => {
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [note, setNote] = useState(initialNote);
  const { staged, dark } = useStageChrome();
  const btns = useStageModalButtons();
  const [ready, setReady] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentH, setContentH] = useState(0);

  /* Mount the fields only after the modal's entry spring has settled:
     anchoring floating pickers mid-animation left first-mount overlays
     broken until a re-render repositioned them. */
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 320);
    return () => window.clearTimeout(t);
  }, []);

  /* Measured content height → the body glides from the placeholder size. */
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (el && ready) setContentH(el.offsetHeight);
  }, [ready]);

  const handleSubmit = () => {
    if (!date) return;
    const fullDate = `${date}T${time}:00`;
    onConfirm(fullDate, note);
  };

  const sectionTitle = 'mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80';

  return (
    <StageModal
      open
      onClose={onClose}
      eyebrow={mode === 'edit' ? 'Modification' : 'Programmation'}
      title={mode === 'edit' ? 'Modifier le rappel' : 'Programmer un rappel'}
      subtitle={prospectName}
      icon={Calendar}
      hue={dark ? STAGE_HUES.violet : SIDEBAR_EMERALD}
      accent={dark ? '#8B7CFF' : '#14B8A6'}
      maxWidth="max-w-md"
      centered
      bodyClassName="min-h-[180px] pt-1"
      footer={
        <>
          {mode === 'edit' && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className={cn(btns.ghost, 'mr-auto',
                staged && dark
                  ? 'border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200'
                  : 'border-rose-200/70 bg-white/70 text-rose-600 hover:bg-rose-50 hover:text-rose-700',
              )}
            >
              <Trash2 size={14} /> Supprimer le rappel
            </button>
          ) : null}
          <button type="button" onClick={onClose} className={btns.ghost}>
            Annuler
          </button>
          <button
            type="button"
            disabled={!date}
            onClick={handleSubmit}
            className={cn(btns.primary, !date && 'pointer-events-none opacity-40')}
          >
            <Calendar size={14} /> {mode === 'edit' ? 'Mettre à jour' : 'Programmer le rappel'}
          </button>
        </>
      }
    >
      <motion.div
        initial={{ height: 190 }}
        animate={{ height: contentH || 190 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <div ref={contentRef} className="pt-1">
          {ready && (
            <motion.div
              initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              <p className={cn(sectionTitle, 'text-sky-400')}>
                <span className="h-px w-4 bg-gradient-to-r from-current to-transparent" />
                Détails du rappel
              </p>

              <div className="grid grid-cols-2 gap-3">
                <DatePicker label="Date du rappel" value={date} onChange={(e) => setDate(e.target.value)} />
                <TimePicker label="Heure" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>

              <Textarea
                label="Note (optionnel)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: Rappeler pour visiter le bien à..."
                rows={3}
              />

              <div
                className={cn(
                  'flex items-start gap-2 rounded-xl border px-3 py-2.5',
                  dark
                    ? 'border-amber-400/25 bg-amber-400/10 text-amber-200'
                    : 'border-amber-200/80 bg-amber-50/80 text-amber-800',
                )}
              >
                <Clock size={14} className="mt-0.5 shrink-0 text-amber-500" />
                <p className="text-[11px] font-medium">
                  {mode === 'edit'
                    ? 'La nouvelle date et heure seront prises en compte pour la notification.'
                    : 'Vous recevrez une notification à la date et heure choisies.'}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </StageModal>
  );
};
