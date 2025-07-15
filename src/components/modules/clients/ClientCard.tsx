import { Badge } from '../../ui/Badge'; // Corrected path to Badge component
import { Phone, Mail, Home, User, Clock } from 'react-feather';

interface ClientCardProps {
  client: {
    id: string;
    name: string;
    type: string;
    status: string;
    phone: string;
    budget?: number;
    propertyType?: string;
    lastContact?: string;
  };
}

export const ClientCard = ({ client }: ClientCardProps) => {
  return (
    <div className="glass-card p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium flex items-center gap-2">
            {client.name}
            <Badge variant={client.status === 'Actif' ? 'success' : 'warning'}>
              {client.status}
            </Badge>
          </h3>
          <p className="text-sm text-text/60 capitalize">{client.type}</p>
        </div>
        <div className="bg-accent/10 p-2 rounded-full">
          <User size={18} className="text-accent" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Phone size={14} className="text-text/40" />
          <span>{client.phone}</span>
        </div>
        
        {client.propertyType && (
          <div className="flex items-center gap-2 text-sm">
            <Home size={14} className="text-text/40" />
            <span>Recherche: {client.propertyType}</span>
          </div>
        )}
        
        {client.budget && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text/40">€</span>
            <span>Budget: {client.budget.toLocaleString()}€</span>
          </div>
        )}
        
        {client.lastContact && (
          <div className="flex items-center gap-2 text-sm text-text/60">
            <Clock size={14} />
            <span>
              Dernier contact: {new Date(client.lastContact).toLocaleDateString('fr-FR')}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button className="text-xs bg-white/5 hover:bg-accent/10 border border-white/10 px-3 py-1 rounded-full transition-colors">
          Voir fiche
        </button>
        <button className="text-xs bg-white/5 hover:bg-green-500/10 border border-white/10 px-3 py-1 rounded-full transition-colors">
          Contacter
        </button>
      </div>
    </div>
  );
};