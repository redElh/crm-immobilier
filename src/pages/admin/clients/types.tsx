import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import {
  Users, Search, Home, Briefcase, Sun, Star, TrendingUp,
  CheckCircle, ChevronRight, ArrowUp, ArrowDown, UserCheck, UserX, FileText
} from 'react-feather';

const clientTypes = [
  { type: 'acheteur', title: 'Acheteurs', description: 'Clients en recherche d\'achat', icon: Search, color: 'text-accent', bg: 'bg-accent-light', count: 48, actifs: 35, contrats: 8, inactifs: 5 },
  { type: 'vendeur', title: 'Vendeurs', description: 'Proprietaires vendeurs', icon: Home, color: 'text-violet-600', bg: 'bg-violet-50', count: 23, actifs: 18, contrats: 3, inactifs: 2 },
  { type: 'bailleur', title: 'Bailleurs', description: 'Proprietaires bailleurs', icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50', count: 15, actifs: 10, contrats: 3, inactifs: 2 },
  { type: 'locataire', title: 'Locataires', description: 'Clients en recherche de location', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50', count: 31, actifs: 25, contrats: 4, inactifs: 2 },
  { type: 'voyageur', title: 'Voyageurs', description: 'Locations saisonnieres', icon: Sun, color: 'text-rose-600', bg: 'bg-rose-50', count: 12, actifs: 9, contrats: 2, inactifs: 1 },
];

export default function AdminClientTypesPage() {
  const navigate = useNavigate();

  const totalClients = clientTypes.reduce((s, p) => s + p.count, 0);
  const totalActifs = clientTypes.reduce((s, p) => s + p.actifs, 0);
  const totalContrats = clientTypes.reduce((s, p) => s + p.contrats, 0);
  const totalInactifs = clientTypes.reduce((s, p) => s + p.inactifs, 0);

  const kpiCards = [
    { label: 'Total clients', value: totalClients, evolution: '+6%', up: true, icon: Users, color: 'text-accent', bg: 'bg-accent-light' },
    { label: 'Clients actifs', value: totalActifs, evolution: '+11%', up: true, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Sous contrat', value: totalContrats, evolution: '-2%', up: false, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Inactifs', value: totalInactifs, evolution: '-5%', up: true, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients - Vue d'ensemble</h1>
          <p className="text-sm text-text-secondary mt-1">Vue strategique de tous les clients de l'agence</p>
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

      {/* Client type list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Types de clients</h2>
        </div>
        <div className="space-y-2">
          {clientTypes.map((clientType, index) => {
            const Icon = clientType.icon;
            return (
              <motion.div
                key={clientType.type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="p-4 hover:shadow-card-hover cursor-pointer transition-all duration-200 group"
                  onClick={() => navigate(`/admin/clients/type/${clientType.type}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${clientType.bg} ${clientType.color} flex-shrink-0`}>
                      <Icon size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{clientType.title}</h3>
                      <p className="text-xs text-text-secondary">{clientType.description}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-secondary">
                      <div className="text-right">
                        <p className="font-semibold text-text">{clientType.count}</p>
                        <p className="text-text-secondary/60">clients</p>
                      </div>
                      <div className="hidden sm:block text-right">
                        <p className="font-semibold text-emerald-600">{clientType.actifs}</p>
                        <p className="text-text-secondary/60">actifs</p>
                      </div>
                      <div className="hidden sm:block text-right">
                        <p className="font-semibold text-amber-600">{clientType.contrats}</p>
                        <p className="text-text-secondary/60">sous contrat</p>
                      </div>
                      <div className="hidden md:block text-right">
                        <p className="font-semibold text-rose-600">{clientType.inactifs}</p>
                        <p className="text-text-secondary/60">inactifs</p>
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
