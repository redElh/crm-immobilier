import { Plus } from 'react-feather';

export const AddClientButton = () => {
  return (
    <button className="flex items-center gap-2 bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent px-4 py-2 rounded-full transition-colors">
      <Plus size={16} />
      <span className="text-sm">Nouveau client</span>
    </button>
  );
};