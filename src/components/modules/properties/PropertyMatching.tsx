import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import { useToast } from '../../ui/Toast';
import {
  Users, Search, Filter, RefreshCw, Mail, MapPin, DollarSign,
  Maximize2, Home, Grid, AlertCircle, TrendingUp, CheckCircle,
  Moon, Phone, Send, BarChart2, ChevronDown, ChevronUp, Eye,
  CheckSquare, Square, X, Star, User,
} from 'react-feather';
import type { Property } from '../../../types/property';

interface PropertyMatch {
  clientId: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  details?: Record<string, number>;
  budget: number;
  minSurface: number;
  surfaceMax: number;
  pieces: number;
  chambres: number;
  secteur: string;
  area: string;
  criteres: string[];
  prestations: Record<string, string[]> | null;
  proximites: string[] | null;
  attributsPersonnalises: string[];
  type: string;
}

interface PropertyMatchingProps {
  property: Property;
  agentId?: string;
  adminId?: string;
  isGerant?: boolean;
}

const criterionMeta: Record<string, { label: string; icon: string; weight: number }> = {
  location: { label: 'Localisation', icon: 'MapPin', weight: 20 },
  budget: { label: 'Budget', icon: 'DollarSign', weight: 15 },
  surface: { label: 'Surface', icon: 'Maximize2', weight: 12 },
  chambres: { label: 'Chambres', icon: 'Moon', weight: 10 },
  criteres: { label: 'Critères', icon: 'CheckCircle', weight: 15 },
  prestations: { label: 'Prestations', icon: 'Star', weight: 10 },
  proximites: { label: 'Proximités', icon: 'MapPin', weight: 7 },
  attributs: { label: 'Attributs', icon: 'Grid', weight: 4 },
  vue: { label: 'Vue', icon: 'Eye', weight: 3 },
  exposition: { label: 'Exposition', icon: 'Sun', weight: 2 },
  etat: { label: 'État', icon: 'Home', weight: 2 },
};

const iconMap: Record<string, any> = {
  MapPin, DollarSign, Maximize2, Moon, CheckCircle, Star, Grid, Eye, Home,
};

export const PropertyMatching = ({ property, agentId, adminId, isGerant = false }: PropertyMatchingProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const basePath = adminId ? `/admin/${adminId}` : agentId ? `/${agentId}` : '';

  const [matches, setMatches] = useState<PropertyMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scoreFilter, setScoreFilter] = useState(0);
  const [sortBy, setSortBy] = useState<'score' | 'budget'>('score');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedProposals, setSelectedProposals] = useState<string[]>([]);

  const [proposalModal, setProposalModal] = useState<{ open: boolean; match: PropertyMatch | null }>({ open: false, match: null });
  const [proposalEmail, setProposalEmail] = useState('');
  const [proposalMessage, setProposalMessage] = useState('');
  const [proposalSending, setProposalSending] = useState(false);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { fetchPropertyMatching } = await import('../../../services/propertyService');
      const data = await fetchPropertyMatching(property.id);
      setMatches(data);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du chargement des correspondances');
    } finally {
      setLoading(false);
    }
  }, [property.id]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleProposal = (id: string) => {
    setSelectedProposals(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const scoreMeta = (score: number) => {
    if (score >= 80) return { text: 'text-emerald-600', bg: 'bg-emerald-500', lightBg: 'bg-emerald-50', ring: 'ring-emerald-500/20', label: 'Excellente', trackBg: 'bg-emerald-100' };
    if (score >= 60) return { text: 'text-amber-600', bg: 'bg-amber-500', lightBg: 'bg-amber-50', ring: 'ring-amber-500/20', label: 'Moyenne', trackBg: 'bg-amber-100' };
    return { text: 'text-red-500', bg: 'bg-red-400', lightBg: 'bg-red-50', ring: 'ring-red-400/20', label: 'Faible', trackBg: 'bg-red-100' };
  };

  const buildCriteria = (details?: Record<string, number>) => {
    if (!details) return [];
    const order = ['location', 'budget', 'surface', 'chambres', 'criteres', 'prestations', 'proximites', 'attributs', 'vue', 'exposition', 'etat'];
    return order.filter(k => details[k] !== undefined && details[k] !== null).map(k => ({
      key: k,
      ...criterionMeta[k] || { label: k, icon: 'CheckCircle', weight: 0 },
      ratio: details[k]!,
    }));
  };

  const getIcon = (iconName: string) => iconMap[iconName] || CheckCircle;

  const openProposal = (match: PropertyMatch) => {
    const ownerEmail = property.owner?.email || '';
    setProposalEmail(ownerEmail);
    const isLocataire = match.type === 'Locataire';

    const d = match.details || {};
    const pct = (v: number) => Math.round(v * 100);
    const analysisLines: string[] = [];
    if (d.location !== undefined) analysisLines.push(`Localisation : ${pct(d.location)}% — ${pct(d.location) >= 80 ? 'correspondance excellente' : pct(d.location) >= 50 ? 'correspondance partielle' : 'correspondance faible'}`);
    if (d.budget !== undefined) analysisLines.push(`Budget : ${pct(d.budget)}% — ${match.budget > 0 ? match.budget.toLocaleString() + ' MAD' : 'N/C'} vs bien à ${property.price > 0 ? property.price.toLocaleString() + ' MAD' : 'N/C'}`);
    if (d.surface !== undefined) analysisLines.push(`Surface : ${pct(d.surface)}% — Bien ${property.surface > 0 ? property.surface + ' m²' : 'N/C'} vs critère ${match.minSurface || '?'}-${match.surfaceMax || '?'} m²`);
    if (d.chambres !== undefined) analysisLines.push(`Chambres : ${pct(d.chambres)}% — ${property.bedrooms || 0} dans le bien${match.chambres ? ' vs ' + match.chambres + ' demandées' : ''}`);
    if (d.criteres !== undefined) analysisLines.push(`Critères : ${pct(d.criteres)}% de compatibilité`);
    if (d.prestations !== undefined) analysisLines.push(`Prestations : ${pct(d.prestations)}%`);
    if (d.proximites !== undefined) analysisLines.push(`Proximités : ${pct(d.proximites)}%`);
    if (d.attributs !== undefined) analysisLines.push(`Attributs : ${pct(d.attributs)}%`);
    if (d.vue !== undefined) analysisLines.push(`Vue : ${pct(d.vue)}%`);
    if (d.exposition !== undefined) analysisLines.push(`Exposition : ${pct(d.exposition)}%`);
    if (d.etat !== undefined) analysisLines.push(`État : ${pct(d.etat)}%`);

    const analysisBlock = analysisLines.length > 0
      ? `\n📊 DÉTAIL DE L'ANALYSE :\n${'─'.repeat(40)}\n${analysisLines.map(l => '  • ' + l).join('\n')}\n${'─'.repeat(40)}\n`
      : '';

    const ownerTitle = isLocataire ? 'Bailleur' : 'Propriétaire';
    const clientLabel = isLocataire ? 'LOCATAIRE POTENTIEL' : 'CLIENT POTENTIEL';
    const intro = isLocataire
      ? `Nous avons le plaisir de vous informer que votre bien immobilier a suscité l'intérêt d'un locataire potentiel.`
      : `Nous avons le plaisir de vous informer que votre bien immobilier a suscité l'intérêt d'un client potentiel.`;
    const budgetLine = isLocataire
      ? `  Loyer maximum : ${match.budget > 0 ? match.budget.toLocaleString() + ' MAD/mois' : 'N/C'}\n`
      : `${match.budget > 0 ? '  Budget : ' + match.budget.toLocaleString() + ' MAD\n' : ''}`;
    const closing = isLocataire
      ? `Nous vous recommandons de prendre contact avec ce locataire dans les meilleurs délais.`
      : `Nous vous recommandons de prendre contact avec ce client dans les meilleurs délais.`;

    setProposalMessage(
      `Bonjour ${property.owner?.name || ownerTitle},\n\n` +
      `${intro}\n\n` +
      `👤 ${clientLabel} :\n` +
      `  Nom : ${match.name}\n` +
      `${match.email ? '  Email : ' + match.email + '\n' : ''}` +
      `${match.phone ? '  Téléphone : ' + match.phone + '\n' : ''}` +
      `  Score de compatibilité : ${match.score}%\n` +
      budgetLine +
      `${match.secteur ? '  Secteur recherché : ' + match.secteur + '\n' : ''}` +
      `\n🏠 VOTRE BIEN :\n` +
      `  Référence : ${property.reference || 'N/C'}\n` +
      `  Titre : ${property.title || 'N/C'}\n` +
      `  Localisation : ${property.city || 'N/C'}${property.district ? ', ' + property.district : ''}\n` +
      `  ${isLocataire ? 'Loyer' : 'Prix'} : ${property.price > 0 ? property.price.toLocaleString() + ' MAD' : 'Sur demande'}${isLocataire ? '/mois' : ''}\n` +
      `  Surface : ${property.surface > 0 ? property.surface + ' m²' : 'N/C'}\n` +
      analysisBlock +
      `\n${closing}\n\n` +
      `Cordialement,`
    );
    setProposalModal({ open: true, match });
  };

  const submitProposal = async () => {
    if (!proposalModal.match || !proposalEmail) return;
    setProposalSending(true);
    try {
      const { proposePropertyToOwner } = await import('../../../services/propertyService');
      await proposePropertyToOwner(property.id, {
        clientId: proposalModal.match.clientId,
        email: proposalEmail,
        subject: `${proposalModal.match.type === 'Locataire' ? 'Locataire potentiel' : 'Client potentiel'} pour votre bien — ${property.title || property.reference || ''}`,
        message: proposalMessage,
        score: proposalModal.match.score,
        details: proposalModal.match.details || undefined,
        buyerName: proposalModal.match.name,
      });
      toast('success', `Notification envoyée à ${proposalEmail} avec succès !`);
      setProposalModal({ open: false, match: null });
    } catch (err: any) {
      toast('error', err?.message || "Erreur lors de l'envoi");
    } finally {
      setProposalSending(false);
    }
  };

  const handleRefuse = async (match: PropertyMatch) => {
    try {
      const { refusePropertyMatch } = await import('../../../services/propertyService');
      await refusePropertyMatch(property.id, match.clientId);
      setMatches(prev => prev.filter(m => m.clientId !== match.clientId));
      toast('info', `${match.name} refusé et ne réapparaîtra plus`);
    } catch (err: any) {
      toast('error', err?.message || 'Erreur lors du refus');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative w-14 h-14 mb-4">
          <div className={`absolute inset-0 rounded-full border-2 ${isGerant ? 'border-[#905D5D]/20' : 'border-accent/20'}`} />
          <div className={`absolute inset-0 rounded-full border-2 border-transparent ${isGerant ? 'border-t-[#905D5D]' : 'border-t-accent'} animate-spin`} />
          <div className={`absolute inset-2 rounded-full border-2 border-transparent ${isGerant ? 'border-t-[#905D5D]/60' : 'border-t-accent/60'} animate-spin`} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          <BarChart2 size={16} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`} />
        </div>
        <p className="text-sm font-medium text-text">Analyse en cours...</p>
        <p className="text-xs text-text-secondary/60 mt-1">Recherche des clients correspondants</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
          <AlertCircle size={20} className="text-red-400" />
        </div>
        <p className="text-sm text-red-500 font-medium">{error}</p>
        <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={fetchMatches} className="mt-3">Réessayer</Button>
      </div>
    );
  }

  const filtered = matches.filter(m => m.score >= scoreFilter);
  const searched = searchTerm
    ? filtered.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.secteur?.toLowerCase().includes(searchTerm.toLowerCase()))
    : filtered;
  const sorted = [...searched].sort((a, b) => sortBy === 'budget' ? b.budget - a.budget : b.score - a.score);
  const avgScore = filtered.length > 0 ? Math.round(filtered.reduce((s, m) => s + m.score, 0) / filtered.length) : 0;
  const excellentCount = filtered.filter(m => m.score >= 80).length;
  const sm = scoreMeta(avgScore);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${isGerant ? 'from-[#905D5D]/5 via-[#905D5D]/[0.02]' : 'from-accent/5 via-accent/[0.02]'} to-transparent border ${isGerant ? 'border-[#905D5D]/10' : 'border-accent/10'} p-5`}>
        <div className={`absolute top-3 right-3 w-24 h-24 rounded-full ${isGerant ? 'bg-[#905D5D]/5' : 'bg-accent/5'} blur-2xl`} />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-7 h-7 rounded-lg ${isGerant ? 'bg-[#905D5D]/10' : 'bg-accent/10'} flex items-center justify-center`}>
                <Users size={14} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
              </div>
              <h3 className="text-sm font-semibold text-text tracking-tight">Matching clients</h3>
            </div>
            <p className="text-xs text-text-secondary">
              <span className="font-semibold text-text">{property.title || property.reference}</span>
              <span className="mx-1.5 text-text-secondary/30">—</span>
              {filtered.length} client{filtered.length > 1 ? 's' : ''} correspondant{filtered.length > 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border/50">
                <span className={`text-lg font-bold ${sm.text}`}>{avgScore}%</span>
                <span className="text-[10px] text-text-secondary">score moyen</span>
              </div>
              {excellentCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100">
                  <CheckCircle size={12} className="text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-600">{excellentCount}</span>
                  <span className="text-[10px] text-emerald-600/70">excellent{excellentCount > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={fetchMatches}>Relancer</Button>
            {selectedProposals.length > 0 && (
              <Button variant="default" size="sm" icon={<Mail size={14} />}>Notifier ({selectedProposals.length})</Button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        <div className="flex items-center gap-1.5 mr-2">
          <Filter size={12} className="text-text-secondary/50" />
          <span className="text-[10px] font-medium text-text-secondary/60 uppercase tracking-wider">Filtres</span>
        </div>
        <div className="flex items-center gap-1 bg-background rounded-lg border border-border/50 p-0.5">
          {[0, 50, 60, 70, 80].map(val => (
            <button key={val} onClick={() => setScoreFilter(val)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${scoreFilter === val ? (isGerant ? 'bg-[#905D5D] text-white shadow-sm' : 'bg-accent text-white shadow-sm') : 'text-text-secondary hover:text-text'}`}>
              {val === 0 ? 'Tous' : `${val}%+`}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-border/50" />
        <div className="flex items-center gap-1 bg-background rounded-lg border border-border/50 p-0.5">
          {([['score', 'Meilleur', TrendingUp], ['budget', 'Budget', DollarSign]] as const).map(([val, label, Icon]) => (
            <button key={val} onClick={() => setSortBy(val)}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${sortBy === val ? (isGerant ? 'bg-[#905D5D] text-white shadow-sm' : 'bg-accent text-white shadow-sm') : 'text-text-secondary hover:text-text'}`}>
              <Icon size={10} />{label}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-border/50" />
        <div className="relative max-w-[200px]">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un client..."
            className={`w-full h-8 pl-8 pr-3 text-[11px] rounded-lg border border-border/50 bg-background text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]/40' : 'focus:ring-accent/20 focus:border-accent/40'} transition-all`}
          />
        </div>
      </div>

      {/* Buyer Cards */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-background flex items-center justify-center mb-3 border border-border/50">
            <Users size={22} className="text-text-secondary/30" />
          </div>
          <p className="text-sm font-medium text-text-secondary">Aucun client trouvé</p>
          <p className="text-xs text-text-secondary/50 mt-1">Essayez d'abaisser le score minimum</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((match) => {
            const sc = scoreMeta(match.score);
            const criteria = buildCriteria(match.details);
            const isExpanded = expandedCards.has(match.clientId);

            return (
              <div key={match.clientId} className="group bg-card rounded-2xl border border-border/40 shadow-card hover:shadow-lg hover:border-border/60 transition-all duration-300 overflow-hidden">

                {/* Top: Avatar + Info + Score Ring */}
                <div className="flex items-center gap-4 p-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${isGerant ? 'from-[#905D5D]/10 to-[#905D5D]/5' : 'from-accent/10 to-accent/5'} border ${isGerant ? 'border-[#905D5D]/15' : 'border-accent/15'} flex items-center justify-center shrink-0`}>
                    <span className={`text-sm font-bold ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>
                      {match.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-[13px] text-text truncate leading-tight">{match.name}</h4>
                          <span className={`shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] border border-[#905D5D]/20' : 'bg-accent/10 text-accent border border-accent/20'}`}>{match.type}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {match.secteur && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-text-secondary">
                              <MapPin size={10} className="shrink-0 text-text-secondary/50" />
                              {match.secteur}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Score circle */}
                      <div className="shrink-0 flex flex-col items-center">
                        <div className={`relative w-12 h-12 rounded-full ${sc.lightBg} flex items-center justify-center ring-2 ${sc.ring}`}>
                          <span className={`text-sm font-bold ${sc.text}`}>{match.score}</span>
                          <span className={`text-[7px] font-medium ${sc.text} -mt-0.5`}>%</span>
                        </div>
                        <span className={`text-[8px] font-semibold ${sc.text} mt-0.5 uppercase tracking-wide`}>{sc.label}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {match.budget > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background text-[10px] font-medium text-text-secondary border border-border/40">
                          <DollarSign size={9} className="text-text-secondary/50" />
                          Budget: {match.budget.toLocaleString()} MAD
                        </span>
                      )}
                      {(match.minSurface > 0 || match.surfaceMax > 0) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background text-[10px] font-medium text-text-secondary border border-border/40">
                          <Maximize2 size={9} className="text-text-secondary/50" />
                          {match.minSurface || '?'}-{match.surfaceMax || '?'} m²
                        </span>
                      )}
                      {match.pieces > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background text-[10px] font-medium text-text-secondary border border-border/40">
                          <Grid size={9} className="text-text-secondary/50" />
                          {match.pieces} p.
                        </span>
                      )}
                      {match.chambres > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background text-[10px] font-medium text-text-secondary border border-border/40">
                          <Moon size={9} className="text-text-secondary/50" />
                          {match.chambres} ch.
                        </span>
                      )}
                      {match.email && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background text-[10px] font-medium text-text-secondary border border-border/40">
                          <Mail size={9} className="text-text-secondary/50" />
                          {match.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Criteria chips */}
                {match.criteres && match.criteres.length > 0 && (
                  <div className="px-4 pb-3 flex flex-wrap gap-1">
                    {match.criteres.slice(0, 6).map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-background text-[9px] font-medium text-text-secondary/70 border border-border/30">{c}</span>
                    ))}
                    {match.criteres.length > 6 && (
                      <span className={`px-2 py-0.5 rounded-md ${isGerant ? 'bg-[#905D5D]/5' : 'bg-accent/5'} text-[9px] font-medium ${isGerant ? 'text-[#905D5D]/60' : 'text-accent/60'}`}>+{match.criteres.length - 6}</span>
                    )}
                  </div>
                )}

                {/* Score Breakdown */}
                {criteria.length > 0 && (
                  <div className="px-4 pb-4">
                    {/* Score bar */}
                    <div className={`h-1.5 rounded-full ${sc.trackBg} overflow-hidden mb-3`}>
                      <div className={`h-full rounded-full ${sc.bg} transition-all duration-700 ease-out`} style={{ width: `${match.score}%` }} />
                    </div>

                    {/* Criteria grid */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {criteria.map(({ key, label, icon, ratio }) => {
                        const CIcon = getIcon(icon);
                        const pct = Math.round(ratio * 100);
                        const cText = pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-400';
                        const cBg = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400';
                        return (
                          <div key={key} className="flex items-center gap-1.5 text-[11px] py-0.5">
                            <CIcon size={10} className={pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-300'} />
                            <span className="text-text-secondary/70">{label}</span>
                            <span className={`font-semibold ${cText}`}>{pct}%</span>
                            {isExpanded && (
                              <div className="w-12 h-1 rounded-full bg-border/30 overflow-hidden">
                                <div className={`h-full rounded-full ${cBg}`} style={{ width: `${pct}%` }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Expand toggle */}
                    <button onClick={() => toggleExpand(match.clientId)}
                      className={`flex items-center gap-1 mt-2 text-[10px] font-medium ${isGerant ? 'text-[#905D5D]/70 hover:text-[#905D5D]' : 'text-accent/70 hover:text-accent'} transition-colors`}>
                      {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      {isExpanded ? 'Masquer les détails' : 'Voir le détail du calcul'}
                    </button>
                  </div>
                )}

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="rounded-xl bg-background/60 border border-border/30 p-3.5 space-y-1.5">
                      <p className="text-[9px] font-bold text-text-secondary/40 uppercase tracking-widest mb-2">Détails du score</p>
                      {criteria.map(({ key, label, icon, ratio, weight }) => {
                        const CIcon = getIcon(icon);
                        const pct = Math.round(ratio * 100);
                        const pts = Math.round(ratio * weight);
                        return (
                          <div key={key} className="flex items-center justify-between py-1 border-b border-border/20 last:border-0">
                            <div className="flex items-center gap-2 text-[11px]">
                              <div className="w-5 h-5 rounded flex items-center justify-center bg-card border border-border/30">
                                <CIcon size={10} className="text-text-secondary/50" />
                              </div>
                              <span className="text-text-secondary">{label}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="text-text-secondary/40">{pts}/{weight} pts</span>
                              <span className={`font-semibold min-w-[32px] text-right ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-400'}`}>{pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                      {match.details?.prestations !== undefined && (
                        <div className="flex items-center justify-between py-1 border-t border-border/20">
                          <div className="flex items-center gap-2 text-[11px]">
                            <div className={`w-5 h-5 rounded flex items-center justify-center ${isGerant ? 'bg-[#905D5D]/10 border border-[#905D5D]/20' : 'bg-accent/10 border border-accent/20'}`}>
                              <Star size={10} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                            </div>
                            <span className={`${isGerant ? 'text-[#905D5D]' : 'text-accent'} font-medium`}>Prestations (bonus)</span>
                          </div>
                          <span className={`${isGerant ? 'text-[#905D5D]' : 'text-accent'} font-semibold text-[11px]`}>+{Math.round(match.details.prestations * 5)} pts</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="px-4 py-2.5 border-t border-border/30 flex items-center justify-between bg-background/20">
                  <label className="flex items-center gap-2 cursor-pointer group/check" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleProposal(match.clientId); }}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selectedProposals.includes(match.clientId) ? (isGerant ? 'bg-[#905D5D] border-[#905D5D]' : 'bg-accent border-accent') : (isGerant ? 'border-border group-hover/check:border-[#905D5D]/50' : 'border-border group-hover/check:border-accent/50')}`}>
                      {selectedProposals.includes(match.clientId) && <CheckSquare size={10} className="text-white" />}
                    </div>
                    <span className="text-[10px] text-text-secondary/60">Sélectionner</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button onClick={() => basePath && navigate(`${basePath}/clients/${match.clientId}`)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-text-secondary ${isGerant ? 'hover:text-[#905D5D] hover:bg-[#905D5D]/5' : 'hover:text-accent hover:bg-accent/5'} rounded-lg transition-all`}>
                      <Eye size={11} /> Voir
                    </button>
                    <button onClick={() => openProposal(match)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                      <TrendingUp size={11} /> Proposer
                    </button>
                    <button onClick={() => handleRefuse(match)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-red-400 hover:bg-red-50 rounded-lg transition-all">
                      <X size={11} /> Refuser
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Footer */}
      {matches.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Clients analysés', value: matches.length, icon: Users, color: 'text-text-secondary' },
            { label: 'Score moyen', value: `${avgScore}%`, icon: BarChart2, color: sm.text },
            { label: 'Excellent match', value: excellentCount, icon: CheckCircle, color: 'text-emerald-600' },
            { label: 'Sélectionnés', value: selectedProposals.length, icon: Square, color: isGerant ? 'text-[#905D5D]' : 'text-accent' },
          ].map(stat => (
            <div key={stat.label} className="p-3 rounded-xl bg-background border border-border/40 text-center">
              <stat.icon size={14} className={`${stat.color} mx-auto mb-1.5`} />
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[9px] text-text-secondary/50 font-medium uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Proposal Modal — notifies property owner */}
      <Dialog isOpen={proposalModal.open} onClose={() => setProposalModal({ open: false, match: null })} title="Notifier le propriétaire" size="lg">
        {proposalModal.match && (() => {
          const m = proposalModal.match;
          const mCriteria = buildCriteria(m.details);
          return (
          <div className="flex flex-col max-h-[70vh]">
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-5 -mx-1 px-1">
              {/* Owner info header */}
              <div className={`flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br ${isGerant ? 'from-[#905D5D]/5' : 'from-accent/5'} to-transparent border ${isGerant ? 'border-[#905D5D]/10' : 'border-accent/10'}`}>
                <div className={`w-12 h-12 rounded-xl ${isGerant ? 'bg-[#905D5D]/10' : 'bg-accent/10'} flex items-center justify-center shrink-0`}>
                  <User size={18} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-text-secondary/60 uppercase tracking-wider font-medium">Notification propriétaire</p>
                  <p className="text-sm font-semibold text-text truncate mt-0.5">{property.owner?.name || 'Propriétaire'}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs font-bold ${m.score >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {m.type || 'Client'}: {m.name} ({m.score}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Matching breakdown */}
              {mCriteria.length > 0 && (
                <div className="p-4 rounded-xl bg-background/60 border border-border/30">
                  <p className="text-[10px] font-bold text-text-secondary/40 uppercase tracking-widest mb-3">Score de compatibilité client/bien</p>
                  <div className="space-y-2">
                    {mCriteria.map(({ key, label, ratio }) => {
                      const p = Math.round(ratio * 100);
                      const cText = p >= 80 ? 'text-emerald-600' : p >= 50 ? 'text-amber-600' : 'text-red-400';
                      const cBg = p >= 80 ? 'bg-emerald-500' : p >= 50 ? 'bg-amber-500' : 'bg-red-400';
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-[11px] text-text-secondary min-w-[80px]">{label}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-border/30 overflow-hidden">
                            <div className={`h-full rounded-full ${cBg} transition-all`} style={{ width: `${p}%` }} />
                          </div>
                          <span className={`text-[11px] font-semibold min-w-[36px] text-right ${cText}`}>{p}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Email du propriétaire</label>
                <input
                  type="email"
                  value={proposalEmail}
                  onChange={(e) => setProposalEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  className={`w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/60 text-sm text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/30 focus:border-[#905D5D]/50' : 'focus:ring-accent/30 focus:border-accent/50'} transition-all`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Message</label>
                <textarea
                  value={proposalMessage}
                  onChange={(e) => setProposalMessage(e.target.value)}
                  rows={12}
                  className={`w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/60 text-sm text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/30 focus:border-[#905D5D]/50' : 'focus:ring-accent/30 focus:border-accent/50'} transition-all resize-none leading-relaxed font-mono`}
                />
              </div>
            </div>

            {/* Pinned submit buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border/30 shrink-0">
              <button
                onClick={() => setProposalModal({ open: false, match: null })}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text rounded-lg hover:bg-background transition-all"
              >
                Annuler
              </button>
              <button
                onClick={submitProposal}
                disabled={proposalSending || !proposalEmail}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r ${isGerant ? 'from-[#905D5D] to-[#905D5D]/80 hover:from-[#905D5D]/90 hover:to-[#905D5D]/70' : 'from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70'} rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
              >
                {proposalSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail size={14} />
                    Envoyer la notification
                  </>
                )}
              </button>
            </div>
          </div>
          );
        })()}
      </Dialog>
    </div>
  );
};
