import { Mail, MessageSquare, Phone, User } from "react-feather";
import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";

const STATUT_METIER_BADGES: Record<string, string> = {
  'En qualification': 'bg-blue-100 text-blue-700',
  'En recherche': 'bg-emerald-100 text-emerald-700',
  'En negociation': 'bg-amber-100 text-amber-700',
  'En compromis': 'bg-purple-100 text-purple-700',
  'Vendu / Achete': 'bg-emerald-100 text-emerald-700',
  'Inactif': 'bg-orange-100 text-orange-700',
  'Perdu': 'bg-red-100 text-red-700',
};

interface Client { name: string; phone: string; email: string; status: string; type?: string; statutMetier?: string; }

export const ClientHeader = ({ client }: { client: Client }) => (
  <div className="bg-card rounded-xl border border-border/50 shadow-card p-5 flex flex-col sm:flex-row gap-4">
    <div className="flex items-start gap-4 flex-1">
      <div className="relative">
        <div className="w-14 h-14 rounded-xl bg-accent-light flex items-center justify-center">
          <User size={22} className="text-accent" />
        </div>
        {client.type === 'Acheteur' && client.statutMetier ? (
          <span className={`absolute -bottom-2 -right-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${STATUT_METIER_BADGES[client.statutMetier] || 'bg-gray-100 text-gray-600'}`}>
            {client.statutMetier}
          </span>
        ) : (
          <Badge variant={client.status === 'Actif' ? 'success' : 'warning'} className="absolute -bottom-2 -right-1">
            {client.status}
          </Badge>
        )}
      </div>
      <div>
        <h1 className="text-lg font-semibold">{client.name}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-text-secondary">
          <a href={`tel:${client.phone}`} className="hover:text-accent flex items-center gap-1">
            <Phone size={12} /> {client.phone}
          </a>
          <a href={`mailto:${client.email}`} className="hover:text-accent flex items-center gap-1">
            <Mail size={12} /> {client.email}
          </a>
        </div>
      </div>
    </div>
    <div className="flex sm:flex-col gap-2">
      <Button variant="ghost" size="sm" icon={<MessageSquare size={14} />}>Message</Button>
      <Button variant="ghost" size="sm" icon={<Phone size={14} />}>Appeler</Button>
    </div>
  </div>
);
