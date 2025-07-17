// AddClientButton.tsx
import { Plus } from 'react-feather';

interface AddClientButtonProps {
  onClick: () => void;
}

export const AddClientButton = ({ onClick }: AddClientButtonProps) => {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-2 bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent px-4 py-2 rounded-full transition-colors"
    >
      <Plus size={16} />
      <span className="text-sm">Nouveau client</span>
    </button>
  );
};