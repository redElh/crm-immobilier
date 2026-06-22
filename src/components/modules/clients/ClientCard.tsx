import { Badge } from '../../ui/Badge';
import { Phone, Home, User, Clock, DollarSign, MapPin, Maximize2, Target } from 'react-feather';
import { useNavigate } from 'react-router-dom';

const STATUT_METIER_BADGES: Record<string, string> = {
  'En qualification': 'bg-blue-100 text-blue-700',
  'En recherche': 'bg-emerald-100 text-emerald-700',
  'En negociation': 'bg-amber-100 text-amber-700',
  'En compromis': 'bg-purple-100 text-purple-700',
  'Vendu / Achete': 'bg-emerald-100 text-emerald-700',
  'Inactif': 'bg-orange-100 text-orange-700',
  'Perdu': 'bg-red-100 text-red-700',
  'En attente de signature': 'bg-sky-100 text-sky-700',
  'En mandat': 'bg-emerald-100 text-emerald-700',
  'En location': 'bg-indigo-100 text-indigo-700',
  'Vendu': 'bg-emerald-100 text-emerald-700',
  'En visite': 'bg-indigo-100 text-indigo-700',
  'En dossier': 'bg-purple-100 text-purple-700',
  'Bail signe': 'bg-emerald-100 text-emerald-700',
  'Installe': 'bg-teal-100 text-teal-700',
  'Reservation en cours': 'bg-amber-100 text-amber-700',
  'Confirme': 'bg-emerald-100 text-emerald-700',
  'En sejour': 'bg-blue-100 text-blue-700',
  'Termine': 'bg-gray-100 text-gray-700',
  'Annule': 'bg-red-100 text-red-700',
};

interface ClientCardProps {
  client: {
    id: string;
    name: string;
    type: string;
    status: string;
    phone: string;
    statutMetier?: string;
    propertyType?: string;
    budget?: number;
    prixMin?: number;
    prixMax?: number;
    devise?: string;
    minSurface?: number;
    surfaceMax?: number;
    secteur?: string;
    classification?: string;
    lastContact?: string;
  };
}

const CLASSIFICATION_BADGES: Record<string, string> = {
  'Tres actif': 'bg-emerald-100 text-emerald-700',
  'Actif': 'bg-blue-100 text-blue-700',
  'Normal': 'bg-gray-100 text-gray-600',
  'Peu actif': 'bg-amber-100 text-amber-700',
  'Tres peu actif': 'bg-red-100 text-red-700',
};

export const ClientCard = ({ client }: ClientCardProps) => {
  const navigate = useNavigate();

  const formatPrice = (val?: number) => val ? val.toLocaleString() : null;
  const devise = client.devise || 'MAD';

  return (
    <div
      className="bg-card rounded-xl border border-border/50 shadow-card hover:shadow-card-hover p-4 cursor-pointer transition-all duration-200 group"
      onClick={() => navigate(`/clients/${client.id}`)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-light flex items-center justify-center">
            <User size={16} className="text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{client.name}</h3>
            <p className="text-xs text-text-secondary capitalize">{client.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {client.classification && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${CLASSIFICATION_BADGES[client.classification] || 'bg-gray-100 text-gray-600'}`}>
              {client.classification}
            </span>
          )}
          {(client.type === 'Acheteur' || client.type === 'Vendeur' || client.type === 'Bailleur' || client.type === 'Locataire' || client.type === 'Voyageur') && client.statutMetier ? (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${STATUT_METIER_BADGES[client.statutMetier] || 'bg-gray-100 text-gray-600'}`}>
              {client.statutMetier}
            </span>
          ) : (
            <Badge variant={client.status === 'Actif' ? 'success' : 'warning'} size="sm">
              {client.status}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Phone size={12} />
          <span>{client.phone}</span>
        </div>
        {client.propertyType && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Home size={12} />
            <span>{client.propertyType}{client.secteur ? ` - ${client.secteur}` : ''}</span>
          </div>
        )}
        {(client.prixMin || client.prixMax) && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <DollarSign size={12} className="text-accent" />
            <span className="font-medium text-text">Budget:</span>
            <span>
              {client.prixMin ? formatPrice(client.prixMin) : '?'} ~ {client.prixMax ? formatPrice(client.prixMax) : '?'} {devise}
            </span>
          </div>
        )}
        {(client.minSurface || client.surfaceMax) && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Maximize2 size={12} />
            <span>Surface: {client.minSurface || '?'} ~ {client.surfaceMax || '?'} m²</span>
          </div>
        )}
        {client.lastContact && (
          <div className="flex items-center gap-2 text-xs text-text-secondary/60">
            <Clock size={12} />
            <span>Dernier contact: {new Date(client.lastContact).toLocaleDateString('fr-FR')}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2 pt-3 border-t border-border/30">
        <button className="btn-ghost text-xs py-1 px-2.5" onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client.id}`); }}>
          Voir fiche
        </button>
        <button className="btn-ghost text-xs py-1 px-2.5 text-emerald-600 hover:text-emerald-700" onClick={(e) => e.stopPropagation()}>
          Contacter
        </button>
      </div>
    </div>
  );
};
