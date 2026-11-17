import { AssignModal, type AssignModalUser } from '../shared/AssignModal';

/* =====================================================================
   ClientAssignModal — attribution step for "Nouveau client".

   Thin wrapper over the shared AssignModal with client copy.
   ===================================================================== */

interface ClientAssignModalProps {
  open: boolean;
  onClose: () => void;
  users: AssignModalUser[];
  currentUser?: AssignModalUser | null;
  onAssign: (userId: string) => void;
}

export function ClientAssignModal({ open, onClose, users, currentUser, onAssign }: ClientAssignModalProps) {
  return (
    <AssignModal
      open={open}
      onClose={onClose}
      users={users}
      currentUser={currentUser}
      onAssign={onAssign}
      eyebrow="Nouveau client"
      noun="client"
      footerHint="La fiche client s’ouvrira après le choix de l’intervenant."
    />
  );
}
