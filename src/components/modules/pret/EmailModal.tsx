import { useState } from 'react';
import { Dialog } from '../../ui/Dialog';
import { Button } from '../../ui/Button';
import { SimulationRecord } from '../../../types/pret';
import { Mail, Send, Paperclip } from 'react-feather';

interface Props {
  simulation: SimulationRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSend: (email: string, subject: string, message: string) => void;
}

const formatMontant = (v: number) => v.toLocaleString('fr-FR');

export default function EmailModal({ simulation, isOpen, onClose, onSend }: Props) {
  const [email, setEmail] = useState(simulation?.clientEmail || '');
  const [subject, setSubject] = useState(
    simulation
      ? `Simulation de prêt immobilier - ${simulation.type === 'capacite' ? "Capacité d'emprunt" : 'Mensualité'}`
      : ''
  );
  const [message, setMessage] = useState('');

  if (!simulation) return null;

  const defaultMessage = `Bonjour ${simulation.clientName || 'cher client'},

Suite à votre demande, voici une simulation de votre ${simulation.type === 'capacite' ? "capacité d'emprunt" : 'mensualité'} :

${simulation.type === 'capacite'
  ? `Capacité d'emprunt : ${formatMontant(simulation.capacite || 0)} MAD`
  : `Mensualité : ${formatMontant(simulation.mensualite || 0)} MAD`
}

Vous trouverez en pièce jointe le détail complet de la simulation.

Cordialement,
L'équipe Square Meter`;

  const handleSend = () => {
    onSend(email, subject, message || defaultMessage);
    onClose();
  };

  const inputClass = "w-full h-9 px-3 text-sm rounded-lg border border-border bg-card text-text placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent";
  const textareaClass = "w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-text placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none";
  const labelClass = "text-xs font-medium text-text-secondary";

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Envoyer le résultat par email" size="lg">
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Destinataire</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={inputClass}
            placeholder="client@email.com"
          />
        </div>
        <div>
          <label className={labelClass}>Objet</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Message</label>
          <textarea
            rows={8}
            value={message || defaultMessage}
            onChange={e => setMessage(e.target.value)}
            className={textareaClass}
          />
        </div>
        <div className="p-3 rounded-lg bg-background border border-border/50 flex items-center gap-3">
          <Paperclip size={14} className="text-text-secondary" />
          <span className="text-sm text-text-secondary flex-1">
            simulation_{simulation.clientName?.toLowerCase().replace(/\s+/g, '_') || 'pret'}_{new Date(simulation.date).toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf
          </span>
          <span className="text-[10px] text-text-secondary/60">PDF joint</span>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button icon={<Send size={14} />} onClick={handleSend}>Envoyer</Button>
        </div>
      </div>
    </Dialog>
  );
}
