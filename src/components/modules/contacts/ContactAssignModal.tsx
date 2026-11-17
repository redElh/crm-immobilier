import { AssignModal, type AssignModalUser } from '../shared/AssignModal';

/* =====================================================================
   ContactAssignModal — attribution step for "Nouveau contact".

   Thin wrapper over the shared AssignModal with contact copy.
   ===================================================================== */

interface ContactAssignModalProps {
  open: boolean;
  onClose: () => void;
  users: AssignModalUser[];
  currentUser?: AssignModalUser | null;
  onAssign: (userId: string) => void;
}

export function ContactAssignModal({ open, onClose, users, currentUser, onAssign }: ContactAssignModalProps) {
  return (
    <AssignModal
      open={open}
      onClose={onClose}
      users={users}
      currentUser={currentUser}
      onAssign={onAssign}
      eyebrow="Nouveau contact"
      noun="contact"
      footerHint="La fiche contact s’ouvrira après le choix de l’intervenant."
    />
  );
}
