import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Card from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import {
  Home, Briefcase, MapPin, Sun, Star, TrendingUp, Tag,
  CheckCircle, ChevronRight, ArrowUp, ArrowDown, FileText
} from 'react-feather';
import { TRANSACTION_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from '../../../types/property';
import { getDraftCount } from '../../../services/draftStorage';
import { DraftSection } from '../../../components/modules/properties/DraftSection';
import { fetchProperties } from '../../../services/propertyService';
import { api } from '../../../services/api';

interface TypeConfig {
  type: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bg: string;
  iconBg: string;
  count: number;
  ventes: number;
  locations: number;
  vendus: number;
  sousPromesse: number;
  enConfidentialite: number;
  transactionKeys: readonly string[];
  statusKeys: readonly string[];
}

const TYPE_META = [
  { type: 'residential', title: 'Résidentiel', description: 'Appartements, maisons, villas',
    icon: Home, color: 'text-accent', bg: 'bg-accent-light', iconBg: 'bg-accent/10',
    transactionKeys: ['vente', 'location_ld'] as const,
    statusKeys: ['for_sale', 'for_rent', 'mandate_pending', 'negotiation', 'under_compromise', 'signing', 'sold', 'rented', 'withdrawn'] as const },
  { type: 'commercial', title: 'Commercial', description: 'Bureaux, locaux, boutiques',
    icon: Briefcase, color: 'text-violet-600', bg: 'bg-violet-50', iconBg: 'bg-violet-100',
    transactionKeys: ['vente', 'location_ld'] as const,
    statusKeys: ['for_sale', 'for_rent', 'negotiation', 'under_promise', 'sold', 'rented', 'withdrawn'] as const },
  { type: 'land', title: 'Terrains', description: 'Terrains constructibles, agricoles',
    icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100',
    transactionKeys: ['vente'] as const,
    statusKeys: ['for_sale', 'under_promise', 'urbanism', 'sold', 'withdrawn'] as const },
  { type: 'vacation', title: 'Vacances', description: 'Résidences secondaires, locations saisonnières',
    icon: Sun, color: 'text-amber-600', bg: 'bg-amber-50', iconBg: 'bg-amber-100',
    transactionKeys: ['location_saisonniere'] as const,
    statusKeys: ['available', 'option', 'reserved', 'occupied', 'unavailable', 'withdrawn'] as const },
  { type: 'luxury', title: 'Luxe', description: 'Biens haut de gamme',
    icon: Star, color: 'text-rose-600', bg: 'bg-rose-50', iconBg: 'bg-rose-100',
    transactionKeys: ['vente', 'location_ld'] as const,
    statusKeys: ['for_sale', 'for_rent', 'confidential', 'negotiation', 'sold', 'rented', 'withdrawn'] as const },
];

const GERANT_STATUS_OVERRIDES: Record<string, string> = {
  mandate_pending: 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]',
  negotiation: 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]',
  under_compromise: 'bg-[#F0E2E2] text-[#7D5050] border-[#E0C6C6]',
  under_promise: 'bg-[#F0E2E2] text-[#7D5050] border-[#E0C6C6]',
  signing: 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]',
  option: 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]',
  urbanism: 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]',
};
const statusColor = (status: string, isGerant: boolean) =>
  isGerant && GERANT_STATUS_OVERRIDES[status] ? GERANT_STATUS_OVERRIDES[status] : STATUS_COLORS[status];

export default function AdminPropertyTypesPage() {
  const navigate = useNavigate();
  const { adminId } = useParams<{ adminId: string }>();
  const userId = adminId || 'unknown';
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGerant, setIsGerant] = useState(false);

  useEffect(() => {
    api.get<any>('/auth/me')
      .then(u => u && setIsGerant(u.role === 'gerant'))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchProperties()
      .then(setAllProperties)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const propertyTypes: TypeConfig[] = useMemo(() => TYPE_META.map(meta => {
    const resolved = meta.type === 'residential' && isGerant
      ? { ...meta, color: 'text-[#905D5D]', bg: 'bg-[#E7D5D5]', iconBg: 'bg-[#905D5D]/10' }
      : meta;
    const props = allProperties.filter(p => p.propertyType === meta.type);
    return {
      ...resolved,
      count: props.length,
      ventes: props.filter(p => p.transactionType === 'vente').length,
      locations: props.filter(p => p.transactionType === 'location_ld' || p.transactionType === 'location_saisonniere').length,
      vendus: props.filter(p => p.status === 'sold' || p.status === 'rented' || p.status === 'sold_or_rented').length,
      sousPromesse: props.filter(p => p.status === 'under_compromise' || p.status === 'under_promise').length,
      enConfidentialite: props.filter(p => p.status === 'confidential').length,
    };
  }), [allProperties, isGerant]);

  const totalBiens = propertyTypes.reduce((s, p) => s + p.count, 0);
  const totalVentes = propertyTypes.reduce((s, p) => s + p.ventes, 0);
  const totalLocations = propertyTypes.reduce((s, p) => s + p.locations, 0);
  const totalVendus = propertyTypes.reduce((s, p) => s + p.vendus, 0);

  const kpiCards = useMemo(() => {
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
      { label: 'Total biens', value: totalBiens, icon: Home, color: isGerant ? 'text-[#905D5D]' : 'text-accent', bg: isGerant ? 'bg-[#E7D5D5]' : 'bg-accent-light', ...calc() },
      { label: 'En vente', value: totalVentes, icon: Tag, color: 'text-emerald-600', bg: 'bg-emerald-50', ...calc((p: any) => p.transactionType === 'vente') },
      { label: 'En location', value: totalLocations, icon: TrendingUp, color: isGerant ? 'text-[#905D5D]' : 'text-amber-600', bg: isGerant ? 'bg-[#E7D5D5]' : 'bg-amber-50', ...calc((p: any) => p.transactionType === 'location_ld' || p.transactionType === 'location_saisonniere') },
      { label: 'Vendus ce mois', value: totalVendus, icon: CheckCircle, color: 'text-rose-600', bg: 'bg-rose-50', ...calcSold() },
    ];
  }, [allProperties, totalBiens, totalVentes, totalLocations, totalVendus, isGerant]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Biens - Vue d'ensemble</h1>
          <p className="text-sm text-text-secondary mt-1">Vue stratégique de tous les biens de l'agence</p>
        </div>
      </div>

      {/* Drafts */}
      <DraftSection adminSlug={adminId} />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${isGerant ? 'border-[#905D5D]' : 'border-accent'}`} />
        </div>
      ) : (
      <>
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
              {kpi.evolution && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${kpi.up ? 'text-emerald-600' : 'text-red-500'}`}>
                {kpi.up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                <span>{kpi.evolution}</span>
                <span className="text-text-secondary/50 ml-1">vs mois dernier</span>
              </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Recap table: statuses and transactions per type */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-background/30">
          <FileText size={14} className="text-text-secondary" />
          <span className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Récapitulatif des statuts et transactions par type de bien</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Type de bien</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Transactions</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Statuts disponibles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {propertyTypes.map((pt, i) => (
                <motion.tr
                  key={pt.type}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-background/50 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <pt.icon size={14} className={pt.color} />
                      <span className="font-medium">{pt.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {pt.transactionKeys.map(tk => (
                        <Badge key={tk} variant="secondary" size="sm">
                          {TRANSACTION_TYPE_LABELS[tk as keyof typeof TRANSACTION_TYPE_LABELS] || tk}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {pt.statusKeys.map(sk => {
                        const statusClass = statusColor(sk, isGerant) || 'bg-gray-50 text-gray-700 border-gray-200';
                        return (
                          <span key={sk} className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md border ${statusClass}`}>
                            {STATUS_LABELS[sk] || sk}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Property type list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Types de biens</h2>
        </div>
        <div className="space-y-3">
          {propertyTypes.map((property, index) => {
            const Icon = property.icon;
            const isOnlyVente = property.transactionKeys.length === 1 && property.transactionKeys[0] === 'vente';
            const isOnlyLocation = property.transactionKeys.length === 1 && property.transactionKeys[0] === 'location_saisonniere';
            const transactionLabel = isOnlyVente ? 'Vente uniquement'
              : isOnlyLocation ? 'Location saisonnière uniquement'
              : property.transactionKeys.map(tk => TRANSACTION_TYPE_LABELS[tk as keyof typeof TRANSACTION_TYPE_LABELS]).join(', ');

            return (
              <motion.div
                key={property.type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="p-4 hover:shadow-card-hover cursor-pointer transition-all duration-200 group"
                  onClick={() => navigate(`/admin/${adminId}/properties/type/${property.type}`)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`p-3 rounded-xl ${property.bg} ${property.color} flex-shrink-0`}>
                        <Icon size={22} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm">{property.title}</h3>
                        <p className="text-xs text-text-secondary">{property.description}</p>
                        <p className="text-xs text-text-secondary/70 mt-1">
                          <span className="font-medium text-text">{property.count}</span> biens
                          {property.ventes > 0 && <span> · Vente: <span className="font-medium text-emerald-600">{property.ventes}</span></span>}
                          {property.locations > 0 && <span> · Location: <span className={`font-medium ${isGerant ? 'text-[#905D5D]' : 'text-amber-600'}`}>{property.locations}</span></span>}
                          {property.sousPromesse > 0 && <span> · Sous promesse: <span className={`font-medium ${isGerant ? 'text-[#905D5D]' : 'text-orange-600'}`}>{property.sousPromesse}</span></span>}
                          {property.enConfidentialite > 0 && <span> · En confidentialité: <span className="font-medium text-slate-600">{property.enConfidentialite}</span></span>}
                          {property.vendus > 0 && <span> · Vendu ce mois: <span className="font-medium text-rose-600">{property.vendus}</span></span>}
                          {getDraftCount(userId, property.type) > 0 && <span> · Brouillons: <span className={`font-medium ${isGerant ? 'text-[#905D5D]' : 'text-amber-600'}`}>{getDraftCount(userId, property.type)}</span></span>}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-3 lg:gap-6 text-xs items-start">
                      <div className="flex flex-col gap-1">
                        <span className="text-text-secondary/60 uppercase tracking-wider text-[10px] font-semibold">Transaction</span>
                        <span className="text-text font-medium whitespace-nowrap">{transactionLabel}</span>
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-text-secondary/60 uppercase tracking-wider text-[10px] font-semibold">Statuts</span>
                        <div className="flex flex-wrap gap-1">
                          {property.statusKeys.slice(0, 4).map(sk => {
                            const statusClass = statusColor(sk, isGerant) || 'bg-gray-50 text-gray-700 border-gray-200';
                            return (
                              <span key={sk} className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-md border ${statusClass}`}>
                                {STATUS_LABELS[sk] || sk}
                              </span>
                            );
                          })}
                          {property.statusKeys.length > 4 && (
                            <span className="text-text-secondary/50 text-[10px] flex items-center">
                              +{property.statusKeys.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 self-center justify-self-end">
                        <Badge variant="primary" size="sm">Voir</Badge>
                        <ChevronRight size={14} className={`text-text-secondary/30 group-hover:translate-x-0.5 transition-all ${isGerant ? 'group-hover:text-[#905D5D]' : 'group-hover:text-accent'}`} />
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
