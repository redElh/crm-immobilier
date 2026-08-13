import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import {
  Users, Search, Home, Briefcase, Sun, TrendingUp,
  ChevronRight, ArrowUp, ArrowDown, UserCheck, UserX
} from 'react-feather';
import { useState, useEffect, useMemo } from 'react';
import { fetchClients } from '../../../services/clientService';
import { api } from '../../../services/api';

const clientTypesMeta = [
  { type: 'acheteur', title: 'Acheteurs', icon: Search, color: 'text-accent', bg: 'bg-accent-light' },
  { type: 'vendeur', title: 'Vendeurs', icon: Home, color: 'text-violet-600', bg: 'bg-violet-50' },
  { type: 'bailleur', title: 'Bailleurs', icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { type: 'locataire', title: 'Locataires', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
  { type: 'voyageur', title: 'Voyageurs', icon: Sun, color: 'text-rose-600', bg: 'bg-rose-50' },
];

export default function AdminClientTypesPage() {
  const navigate = useNavigate();
  const { adminId } = useParams<{ adminId: string }>();
  const [clients, setClients] = useState<any[]>([]);
  const [isGerant, setIsGerant] = useState(false);

  useEffect(() => {
    api.get<any>('/auth/me')
      .then(u => u && setIsGerant(u.role === 'gerant'))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchClients().then(setClients).catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);

    const globalKpis = [
      { label: 'Total clients', value: clients.length, evolution: '+0%', up: true, icon: Users, color: isGerant ? 'text-[#905D5D]' : 'text-accent', bg: isGerant ? 'bg-[#E7D5D5]' : 'bg-accent-light' },
      { label: 'Actifs', value: clients.filter(c => c.status === 'Actif').length, evolution: '+0%', up: true, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Inactifs', value: clients.filter(c => c.status === 'Inactif').length, evolution: '-0%', up: false, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-50' },
      { label: 'Prospects', value: clients.filter(c => c.statutMetier === 'En qualification' || c.status === 'En négociation').length, evolution: '+0%', up: true, icon: TrendingUp, color: isGerant ? 'text-[#905D5D]' : 'text-amber-600', bg: isGerant ? 'bg-[#E7D5D5]' : 'bg-amber-50' },
    ];

    const buildSummary = (typeClients: any[]) => {
      const total = typeClients.length;
      const actifs = typeClients.filter(c => c.status === 'Actif').length;
      const enNegociation = typeClients.filter(c => c.statutMetier === 'En negociation' || c.status === 'En négociation').length;
      const nouveauCeMois = typeClients.filter(c => c.createdAt?.startsWith(currentMonth)).length;
      const biensProposes = typeClients.reduce((sum, c) => sum + (c.pieces || 0), 0);
      return { total, actifs, enNegociation, nouveauCeMois, biensProposes };
    };

    const typeStats = clientTypesMeta.map(({ type, title }) => {
      const typeClients = clients.filter(c => c.type === title.slice(0, -1));
      const s = buildSummary(typeClients);
      const summaries: Record<string, string> = {
        acheteur: `${s.total} client${s.total !== 1 ? 's' : ''} · ${s.actifs} actif${s.actifs !== 1 ? 's' : ''} · ${s.enNegociation} en négociation · ${s.nouveauCeMois} ce mois · ${s.biensProposes} biens proposés`,
        vendeur: `${s.total} client${s.total !== 1 ? 's' : ''} · ${s.actifs} actif${s.actifs !== 1 ? 's' : ''} · ${s.enNegociation} en négociation · ${s.nouveauCeMois} vendu${s.nouveauCeMois !== 1 ? 's' : ''} ce mois · ${s.biensProposes} biens en stock`,
        bailleur: `${s.total} client${s.total !== 1 ? 's' : ''} · ${s.actifs} actif${s.actifs !== 1 ? 's' : ''} · ${s.enNegociation} en négociation · ${s.nouveauCeMois} location${s.nouveauCeMois !== 1 ? 's' : ''} ce mois · ${s.biensProposes} biens en location`,
        locataire: `${s.total} client${s.total !== 1 ? 's' : ''} · ${s.actifs} actif${s.actifs !== 1 ? 's' : ''} · ${s.enNegociation} en dossier · ${s.nouveauCeMois} bail${s.nouveauCeMois !== 1 ? 's' : ''} signé${s.nouveauCeMois !== 1 ? 's' : ''} · ${s.biensProposes} biens proposés`,
        voyageur: `${s.total} client${s.total !== 1 ? 's' : ''} · ${s.actifs} actif${s.actifs !== 1 ? 's' : ''} · ${s.enNegociation} réservation${s.enNegociation !== 1 ? 's' : ''} confirmée${s.enNegociation !== 1 ? 's' : ''} · ${s.nouveauCeMois} séjour${s.nouveauCeMois !== 1 ? 's' : ''} ce mois`,
      };
      return { type, title, ...s, summary: summaries[type] || '' };
    });

    return { globalKpis, typeStats };
  }, [clients, isGerant]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CLIENTS - VUE D'ENSEMBLE (Admin)</h1>
          <p className="text-sm text-text-secondary mt-1">Vue stratégique de tous les clients de l'agence</p>
        </div>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className={`w-1 h-5 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`} />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Statistiques globales</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.globalKpis.map((kpi, i) => {
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
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`w-1 h-5 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`} />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Types de clients</h2>
          </div>
          <Badge variant="primary" size="sm">Voir tout &#8594;</Badge>
        </div>
        <div className="space-y-2">
          {stats.typeStats.map((ct, index) => {
            const baseConfig = clientTypesMeta.find(c => c.type === ct.type)!;
            const config = isGerant && ct.type === 'acheteur'
              ? { ...baseConfig, color: 'text-[#905D5D]', bg: 'bg-[#E7D5D5]' }
              : baseConfig;
            const Icon = config.icon;
            return (
              <motion.div
                key={ct.type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="p-4 hover:shadow-card-hover cursor-pointer transition-all duration-200 group"
                  onClick={() => navigate(`/admin/${adminId}/clients/type/${ct.type}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${config.bg} ${config.color} flex-shrink-0`}>
                      <Icon size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{ct.title}</h3>
                      <p className="text-xs text-text-secondary mt-0.5">{ct.summary}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="primary" size="sm">Voir &#8594;</Badge>
                      <ChevronRight size={14} className={`text-text-secondary/30 group-hover:translate-x-0.5 transition-all ${isGerant ? 'group-hover:text-[#905D5D]' : 'group-hover:text-accent'}`} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
