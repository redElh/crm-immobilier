import { Plus } from 'react-feather';

interface AddClientButtonProps {
  onClick: () => void;
}

export const AddClientButton = ({ onClick }: AddClientButtonProps) => {
  return (
    <button onClick={onClick} className="btn-primary text-sm">
      <Plus size={14} />
      Nouveau client
    </button>
  );
};
