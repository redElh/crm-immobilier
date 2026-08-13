import { Plus } from 'react-feather';

interface AddClientButtonProps {
  onClick: () => void;
  isGerant?: boolean;
}

export const AddClientButton = ({ onClick, isGerant = false }: AddClientButtonProps) => {
  return (
    <button onClick={onClick} className={isGerant ? "btn-primary bg-[#905D5D] hover:bg-[#7D5050] border-[#905D5D] hover:border-[#7D5050] text-white shadow-[0_10px_24px_rgba(144,93,93,0.35)] text-sm" : "btn-primary bg-accent text-sm"}>
      <Plus size={14} />
      Nouveau client
    </button>
  );
};
