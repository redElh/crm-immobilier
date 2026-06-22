import { useState } from 'react';
import { Dialog } from '../../ui/Dialog';
import { Button } from '../../ui/Button';
import { SimulationRecord } from '../../../types/pret';
import { Save, FileText } from 'react-feather';

interface Props {
  simulation: SimulationRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientName: string, simName: string, addNote: boolean, note: string) => void;
}

const formatMontant = (v: number) => v.toLocaleString('fr-FR');

export default function SaveToClientModal({ simulation, isOpen, onClose, onSave }: Props) {
  const [clientName, setClientName] = useState(simulation?.clientName || '');
  const [simName, setSimName] = useState('');
  const [addNote, setAddNote] = useState(false);
  const [note, setNote] = useState('');

  if (!simulation) return null;

  const defaultSimName = `Simulation du ${new Date(simulation.date).toLocaleDateString('fr-FR')} - ${simulation.type === 'capacite' ? "Capacité d'emprunt" : 'Mensualité'}`;
  const defaultNote = `Simulation de prêt effectuée le ${new Date(simulation.date).toLocaleDateString('fr-FR')}. ${simulation.type === 'capacite' ? `Capacité : ${formatMontant(simulation.capacite || 0)} MAD` : `Mensualité : ${formatMontant(simulation.mensualite || 0)} MAD`}`;

  const handleSave = () => {
    onSave(clientName, simName || defaultSimName, addNote, note || defaultNote);
    onClose();
  };

  const inputClass = "w-full h-9 px-3 text-sm rounded-lg border border-border bg-card text-text placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent";
  const textareaClass = "w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-text placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none";
  const labelClass = "text-xs font-medium text-text-secondary";

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Sauvegarder dans la fiche client" size="lg">
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-background border border-border/50 space-y-1">
          <p className="text-xs text-text-secondary">Simulation à sauvegarder</p>
          <p className="text-sm font-medium">
            Type : {simulation.type === 'capacite' ? "Capacité d'emprunt" : 'Mensualité'}
          </p>
          <p className="text-sm font-medium">
            Résultat : {formatMontant(simulation.capacite || simulation.mensualite || 0)} MAD
          </p>
          <p className="text-sm text-text-secondary">
            {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(simulation.date))}
          </p>
        </div>

        <div>
          <label className={labelClass}>Client</label>
          <input
            type="text"
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            className={inputClass}
            placeholder="Nom du client"
          />
        </div>

        <div>
          <label className={labelClass}>Nom de la simulation</label>
          <input
            type="text"
            value={simName || defaultSimName}
            onChange={e => setSimName(e.target.value)}
            className={inputClass}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={addNote}
            onChange={e => setAddNote(e.target.checked)}
            className="rounded border-border text-accent focus:ring-accent/20"
          />
          <span className="text-sm text-text-secondary">Ajouter une note dans la fiche client</span>
        </label>

        {addNote && (
          <textarea
            rows={3}
            value={note || defaultNote}
            onChange={e => setNote(e.target.value)}
            className={textareaClass}
          />
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button icon={<Save size={14} />} onClick={handleSave}>Sauvegarder</Button>
        </div>
      </div>
    </Dialog>
  );
}
