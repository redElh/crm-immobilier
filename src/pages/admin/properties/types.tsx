import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import {
  Home, Briefcase, MapPin, Sun, Star, TrendingUp, Tag,
  CheckCircle, ChevronRight, ArrowUp, ArrowDown
} from 'react-feather';

const propertyTypes = [
  { type: 'residential', title: 'Residentiel', description: 'Appartements, maisons, villas', icon: Home, color: 'text-accent', bg: 'bg-accent-light', count: 48, ventes: 32, locations: 12, vendus: 4 },
  { type: 'commercial', title: 'Commercial', description: 'Bureaux, locaux, boutiques', icon: Briefcase, color: 'text-violet-600', bg: 'bg-violet-50', count: 23, ventes: 15, locations: 6, vendus: 2 },
  { type: 'land', title: 'Terrains', description: 'Terrains constructibles, agricoles', icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50', count: 15, ventes: 12, locations: 3, vendus: 1 },
  { type: 'vacation', title: 'Vacances', description: 'Residences secondaires, locations saisonnieres', icon: Sun, color: 'text-amber-600', bg: 'bg-amber-50', count: 31, ventes: 0, locations: 31, vendus: 0 },
  { type: 'luxury', title: 'Luxe', description: 'Biens haut de gamme', icon: Star, color: 'text-rose-600', bg: 'bg-rose-50', count: 12, ventes: 8, locations: 4, vendus: 2 },
];

export default function AdminPropertyTypesPage() {
  const navigate = useNavigate();

  const totalBiens = propertyTypes.reduce((s, p) => s + p.count, 0);
  const totalVentes = propertyTypes.reduce((s, p) => s + p.ventes, 0);
  const totalLocations = propertyTypes.reduce((s, p) => s + p.locations, 0);
  const totalVendus = propertyTypes.reduce((s, p) => s + p.vendus, 0);

  const kpiCards = [
    { label: 'Total biens', value: totalBiens, evolution: '+8%', up: true, icon: Home, color: 'text-accent', bg: 'bg-accent-light' },
    { label: 'En vente', value: totalVentes, evolution: '+12%', up: true, icon: Tag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'En location', value: totalLocations, evolution: '-3%', up: false, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Vendus ce mois', value: totalVendus, evolution: '+20%', up: true, icon: CheckCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Biens - Vue d'ensemble</h1>
          <p className="text-sm text-text-secondary mt-1">Vue strategique de tous les biens de l'agence</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl border border-border/50 shadow-card p-4 hover:shadow-card-hover transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">{kpi.label}</p>
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <Icon size={14} className={kpi.color} />
                </div>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <div className={`flex items-center gap-1 mt-1 text-xs ${kpi.up ? 'text-emerald-600' : 'text-red-500'}`}>
                {kpi.up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                <span>{kpi.evolution}</span>
                <span className="text-text-secondary/50 ml-1">vs mois dernier</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Property type list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Types de biens</h2>
        </div>
        <div className="space-y-2">
          {propertyTypes.map((property, index) => {
            const Icon = property.icon;
            return (
              <motion.div
                key={property.type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="p-4 hover:shadow-card-hover cursor-pointer transition-all duration-200 group"
                  onClick={() => navigate(`/admin/properties/type/${property.type}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${property.bg} ${property.color} flex-shrink-0`}>
                      <Icon size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{property.title}</h3>
                      <p className="text-xs text-text-secondary">{property.description}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-secondary">
                      <div className="text-right">
                        <p className="font-semibold text-text">{property.count}</p>
                        <p className="text-text-secondary/60">biens</p>
                      </div>
                      <div className="hidden sm:block text-right">
                        <p className="font-semibold text-emerald-600">{property.ventes}</p>
                        <p className="text-text-secondary/60">en vente</p>
                      </div>
                      <div className="hidden sm:block text-right">
                        <p className="font-semibold text-amber-600">{property.locations}</p>
                        <p className="text-text-secondary/60">en location</p>
                      </div>
                      <div className="hidden md:block text-right">
                        <p className="font-semibold text-rose-600">{property.vendus}</p>
                        <p className="text-text-secondary/60">vendus ce mois</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="primary" size="sm">Voir</Badge>
                      <ChevronRight size={14} className="text-text-secondary/30 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
