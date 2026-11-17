import { AssignModal, type AssignModalUser } from '../shared/AssignModal';

/* =====================================================================
   PropertyAssignModal — attribution step for "Ajouter un bien".

   Same structure as the client attribution modal (shared AssignModal),
   with property copy.
   ===================================================================== */

interface PropertyAssignModalProps {
  open: boolean;
  onClose: () => void;
  users: AssignModalUser[];
  currentUser?: AssignModalUser | null;
  onAssign: (userId: string) => void;
}

export function PropertyAssignModal({ open, onClose, users, currentUser, onAssign }: PropertyAssignModalProps) {
  return (
    <AssignModal
      open={open}
      onClose={onClose}
      users={users}
      currentUser={currentUser}
      onAssign={onAssign}
      eyebrow="Nouveau bien"
      noun="bien"
      footerHint="Le formulaire du bien s’ouvrira après le choix de l’intervenant."
    />
  );
}
