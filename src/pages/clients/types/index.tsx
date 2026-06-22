import { useNavigate } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import { TrendingUp, Key, ShoppingCart, Home, Compass } from 'react-feather';

const clientTypes = [
  { id: 'vendeur', label: 'Vendeur', icon: TrendingUp, desc: 'Propriétaires souhaitant vendre', color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'bailleur', label: 'Bailleur', icon: Key, desc: 'Propriétaires souhaitant louer', color: 'text-accent', bg: 'bg-accent-light' },
  { id: 'acheteur', label: 'Acheteur', icon: ShoppingCart, desc: 'Personnes souhaitant acheter', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'locataire', label: 'Locataire', icon: Home, desc: 'Personnes souhaitant louer', color: 'text-violet-600', bg: 'bg-violet-50' },
  { id: 'voyageur', label: 'Voyageur', icon: Compass, desc: 'Locations saisonnières', color: 'text-rose-600', bg: 'bg-rose-50' },
];

export default function ClientTypesPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Types de Clients</h1>
        <p className="text-sm text-text-secondary mt-1">Sélectionnez une catégorie pour voir vos clients</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card
              key={type.id}
              className="p-5 hover:shadow-card-hover cursor-pointer transition-all duration-200 group"
              onClick={() => navigate(`/clients/type/${type.id}`)}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${type.bg} ${type.color} flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{type.label}</h3>
                  <p className="text-xs text-text-secondary mt-0.5">{type.desc}</p>
                </div>
                <span className="text-text-secondary/40 group-hover:text-accent transition-colors">→</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
