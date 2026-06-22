import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import { Home, Briefcase, MapPin, Sun, Star, TrendingUp, Tag, CheckCircle, Calendar } from 'react-feather';

const propertyTypes = [
  { type: 'residential', title: 'Résidentiel', description: 'Appartements, maisons, villas', icon: Home, color: 'text-accent', bg: 'bg-accent-light', count: 48 },
  { type: 'commercial', title: 'Commercial', description: 'Bureaux, locaux, boutiques', icon: Briefcase, color: 'text-violet-600', bg: 'bg-violet-50', count: 23 },
  { type: 'land', title: 'Terrains', description: 'Terrains constructibles, agricoles', icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50', count: 15 },
  { type: 'vacation', title: 'Vacances', description: 'Résidences secondaires, locations saisonnières', icon: Sun, color: 'text-amber-600', bg: 'bg-amber-50', count: 31 },
  { type: 'luxury', title: 'Luxe', description: 'Biens haut de gamme', icon: Star, color: 'text-rose-600', bg: 'bg-rose-50', count: 12 },
];

const statsCards = [
  { label: 'Total biens', value: '129', icon: Home, color: 'text-accent', bg: 'bg-accent-light' },
  { label: 'En vente', value: '72', icon: Tag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'En location', value: '38', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Vendus ce mois', value: '13', icon: CheckCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
];

export default function PropertyTypesPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Types de biens</h1>
          <p className="text-sm text-text-secondary mt-1">Sélectionnez une catégorie pour voir vos biens</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border/50 shadow-card p-4 hover:shadow-card-hover transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">{stat.label}</p>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon size={14} className={stat.color} />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Property type grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {propertyTypes.map((property, index) => {
          const Icon = property.icon;
          return (
            <motion.div
              key={property.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="p-5 hover:shadow-card-hover cursor-pointer transition-all duration-200 group h-full"
                onClick={() => navigate(`/properties/type/${property.type}`)}
              >
                <div className={`p-3 rounded-xl ${property.bg} ${property.color} inline-flex mb-3`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold text-sm">{property.title}</h3>
                <p className="text-xs text-text-secondary mt-0.5">{property.description}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                  <span className="text-xs text-text-secondary">
                    <span className="font-semibold text-text">{property.count}</span> biens
                  </span>
                  <span className="text-text-secondary/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all text-xs">
                    Voir →
                  </span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
