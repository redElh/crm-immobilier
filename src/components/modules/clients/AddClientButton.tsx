import { Plus } from 'react-feather';

interface AddClientButtonProps {
  onClick: () => void;
  isGerant?: boolean;
}

export const AddClientButton = ({ onClick, isGerant = false }: AddClientButtonProps) => {
  return (
    <button onClick={onClick} className="btn-primary bg-accent text-sm">
      <Plus size={14} />
      Nouveau client
    </button>
  );
};
