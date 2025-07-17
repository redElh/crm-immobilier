import { Mail, MessageSquare, Phone, User } from "react-feather";
import { Badge } from "../../ui/Badge"; // Corrected path to Badge component
import { Button } from "../../ui/Button";

interface Client {
  name: string;
  phone: string;
  email: string;
  status: 'Actif' | 'Inactif';
}

export const ClientHeader = ({ client }: { client: Client }) => (
  <div className="glass-card p-6 flex flex-col sm:flex-row gap-4">
    <div className="flex items-start gap-4 flex-1">
      {/* Avatar client */}
      <div className="relative">
        <div className="w-16 h-16 rounded-glass bg-accent/10 flex items-center justify-center">
          <User className="text-accent" size={24}/>
        </div>
        <Badge 
          variant={client.status === 'Actif' ? 'success' : 'warning'} 
          className="absolute -bottom-5 -right-1"
        >
          {client.status}
        </Badge>
      </div>

      {/* Infos principales */}
      <div>
        <h1 className="text-xl font-semibold">{client.name}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm">
          <a href={`tel:${client.phone}`} className="hover:text-accent flex items-center">
            <Phone className="mr-1" size={14}/> {client.phone}
          </a>
          <a href={`mailto:${client.email}`} className="hover:text-accent flex items-center">
            <Mail className="mr-1" size={14}/> {client.email}
          </a>
        </div>
      </div>
    </div>

    {/* Actions rapides */}
    <div className="flex sm:flex-col gap-2 sm:gap-1">
      <Button variant="ghost" size="sm">
        <MessageSquare className="mr-2" size={14}/> Message
      </Button>
      <Button variant="ghost" size="sm">
        <Phone className="mr-2" size={14}/> Appeler
      </Button>
    </div>
  </div>
);