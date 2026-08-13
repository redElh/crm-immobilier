import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import { Home, Briefcase, MapPin, Sun, Star, TrendingUp, Tag, CheckCircle, Calendar, FileText, ArrowUp, ArrowDown } from 'react-feather';
import { getDraftCount } from '../../services/draftStorage';
import { DraftSection } from '../../components/modules/properties/DraftSection';
import { fetchProperties } from '../../services/propertyService';
import { api } from '../../services/api';

const TYPE_META = [
  { type: 'residential', title: 'Résidentiel', description: 'Appartements, maisons, villas', icon: Home, color: 'text-accent', bg: 'bg-accent-light' },
  { type: 'commercial', title: 'Commercial', description: 'Bureaux, locaux, boutiques', icon: Briefcase, color: 'text-violet-600', bg: 'bg-violet-50' },
  { type: 'land', title: 'Terrains', description: 'Terrains constructibles, agricoles', icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { type: 'vacation', title: 'Vacances', description: 'Résidences secondaires, locations saisonnières', icon: Sun, color: 'text-amber-600', bg: 'bg-amber-50' },
  { type: 'luxury', title: 'Luxe', description: 'Biens haut de gamme', icon: Star, color: 'text-rose-600', bg: 'bg-rose-50' },
];

export default function PropertyTypesPage() {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const userId = agentId || 'unknown';
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    api.get<any>('/auth/me')
      .then(u => u && setCurrentUserId(String(u.id)))
      .catch(() => {})
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    setLoading(true);
    fetchProperties({ agent_id: currentUserId })
      .then(setAllProperties)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUserId]);

  const propertyTypes = useMemo(() => TYPE_META.map(meta => {
    const props = allProperties.filter(p => p.propertyType === meta.type);
    return { ...meta, count: props.length };
  }), [allProperties]);

  const totalBiens = propertyTypes.reduce((s, p) => s + p.count, 0);
  const enVente = allProperties.filter(p => p.transactionType === 'vente').length;
  const enLocation = allProperties.filter(p => p.transactionType === 'location_ld' || p.transactionType === 'location_saisonniere').length;
  const vendus = allProperties.filter(p => p.status === 'sold' || p.status === 'rented' || p.status === 'sold_or_rented').length;

  const statsCards = useMemo(() => {
    const now = new Date();
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const inRange = (d: string, start: Date, end: Date) => {
      const date = new Date(d);
      return date >= start && date <= end;
    };

    const calc = (filter?: (p: any) => boolean, dateField = 'createdAt') => {
      const props = filter ? allProperties.filter(filter) : allProperties;
      const current = props.filter(p => inRange(p[dateField], currentStart, now)).length;
      const previous = props.filter(p => inRange(p[dateField], prevStart, prevEnd)).length;
      const pct = previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100);
      return { evolution: `${pct >= 0 ? '+' : ''}${pct}%`, up: pct >= 0 };
    };

    const calcSold = () => {
      const soldStatuses = ['sold', 'rented', 'sold_or_rented'];
      const current = allProperties.filter(p => soldStatuses.includes(p.status) && inRange(p.updatedAt, currentStart, now)).length;
      const previous = allProperties.filter(p => soldStatuses.includes(p.status) && inRange(p.updatedAt, prevStart, prevEnd)).length;
      const pct = previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100);
      return { evolution: `${pct >= 0 ? '+' : ''}${pct}%`, up: pct >= 0 };
    };

    return [
      { label: 'Total biens', value: String(totalBiens), icon: Home, color: 'text-accent', bg: 'bg-accent-light', ...calc() },
      { label: 'En vente', value: String(enVente), icon: Tag, color: 'text-emerald-600', bg: 'bg-emerald-50', ...calc((p: any) => p.transactionType === 'vente') },
      { label: 'En location', value: String(enLocation), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', ...calc((p: any) => p.transactionType === 'location_ld' || p.transactionType === 'location_saisonniere') },
      { label: 'Vendus ce mois', value: String(vendus), icon: CheckCircle, color: 'text-rose-600', bg: 'bg-rose-50', ...calcSold() },
    ];
  }, [allProperties, totalBiens, enVente, enLocation, vendus]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Drafts */}
      <DraftSection agentSlug={agentId} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Types de biens</h1>
          <p className="text-sm text-text-secondary mt-1">Sélectionnez une catégorie pour voir vos biens</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
      <>
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
              {(stat as any).evolution && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${(stat as any).up ? 'text-emerald-600' : 'text-red-500'}`}>
                {(stat as any).up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                <span>{(stat as any).evolution}</span>
                <span className="text-text-secondary/50 ml-1">vs mois dernier</span>
              </div>
              )}
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
                className="p-5 hover:shadow-card-hover cursor-pointer transition-all duration-200 group h-full flex flex-col"
                onClick={() => navigate(`/properties/type/${property.type}`)}
              >
                <div className={`p-3 rounded-xl ${property.bg} ${property.color} inline-flex mb-3`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold text-sm">{property.title}</h3>
                <p className="text-xs text-text-secondary mt-0.5 flex-1">{property.description}</p>
                <div className="flex items-center justify-between pt-3 mt-4 border-t border-border/30">
                  <span className="text-xs text-text-secondary">
                    <span className="font-semibold text-text">{property.count}</span> biens
                  </span>
                  <div className="flex items-center gap-2">
                    {getDraftCount(userId, property.type) > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                        <FileText size={10} />
                        {getDraftCount(userId, property.type)} brouillon{getDraftCount(userId, property.type) !== 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="text-text-secondary/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all text-xs">
                      Voir →
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
      </>
      )}
    </div>
  );
}
