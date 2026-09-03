import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchInput } from '../../ui/SearchInput';
import { useToast } from '../../ui/Toast';
import { useStageChrome } from '../calendar/useStageChrome';
import {
  OrbIcon, TiltCard, StageBadge, StageButton,
  STAGE_HUES, SLATE_HUE, AnimatedNumber,
} from '../../dashboard/Stage';
import {
  Users, Search, Filter, RefreshCw, Mail, MapPin, DollarSign,
  Maximize2, Grid, AlertCircle, TrendingUp, CheckCircle,
  Moon, Send, BarChart2, ChevronDown, ChevronUp, Eye,
  CheckSquare, X, Star, User, FileText,
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
  MapPin, DollarSign, Maximize2, Moon, CheckCircle, Star, Grid, Eye, Users,
};

export const PropertyMatching = ({ property, agentId, adminId, isGerant = false }: PropertyMatchingProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const basePath = adminId ? `/admin/${adminId}` : agentId ? `/${agentId}` : '';
  const { staged, dark } = useStageChrome();

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
    if (score >= 80) return { hue: STAGE_HUES.emerald, label: 'Excellente', lightBg: dark ? 'bg-emerald-500/15' : 'bg-emerald-50', ring: dark ? 'ring-emerald-500/30' : 'ring-emerald-500/20', trackBg: dark ? 'bg-white/10' : 'bg-emerald-100' };
    if (score >= 60) return { hue: STAGE_HUES.amber, label: 'Moyenne', lightBg: dark ? 'bg-amber-500/15' : 'bg-amber-50', ring: dark ? 'ring-amber-500/30' : 'ring-amber-500/20', trackBg: dark ? 'bg-white/10' : 'bg-amber-100' };
    return { hue: SLATE_HUE, label: 'Faible', lightBg: dark ? 'bg-white/[0.06]' : 'bg-red-50', ring: dark ? 'ring-white/10' : 'ring-red-400/20', trackBg: dark ? 'bg-white/10' : 'bg-red-100' };
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

    // Propriétaire must go through the agency — no direct client contact details
    setProposalMessage(
      `Bonjour ${property.owner?.name || ownerTitle},\n\n` +
      `${intro}\n\n` +
      `👤 ${clientLabel} :\n` +
      `  Profil : ${match.name}\n` +
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
      `\n${closing} Votre conseiller reste votre unique interlocuteur et organisera la mise en relation.\n\n` +
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
      <div className="space-y-4">
        <div className={`rounded-2xl p-8 flex flex-col items-center justify-center gap-3 ${staged ? (dark ? 'bg-white/[0.04] border border-white/[0.08]' : 'bg-white/80 border border-teal-900/10') : 'bg-card border border-border/50 shadow-card'}`}>
          <div className="relative w-14 h-14">
            <div className={`absolute inset-0 rounded-full border-2 ${dark ? 'border-white/10' : 'border-teal-900/10'}`} />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" style={{ filter: 'drop-shadow(0 0 8px rgba(139,124,255,0.5))' }} />
            <BarChart2 size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-violet-400" />
          </div>
          <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Analyse en cours...</p>
          <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Recherche des clients correspondants</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center ${staged ? (dark ? 'bg-white/[0.04] border border-white/[0.08]' : 'bg-white/80 border border-teal-900/10') : 'bg-card border border-border/50 shadow-card'}`}>
        <OrbIcon icon={AlertCircle} hue={STAGE_HUES.fuchsia} size={48} radius={14} />
        <p className={`text-sm font-medium ${dark ? 'text-red-300' : 'text-red-500'}`}>{error}</p>
        <StageButton variant="glass" size="sm" icon={<RefreshCw size={13} />} onClick={fetchMatches}>Réessayer</StageButton>
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
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={staged ? { opacity: 0, y: 12 } : undefined}
        animate={staged ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`rounded-2xl p-5 ${staged ? (dark ? 'bg-white/[0.04] border border-white/[0.08]' : 'bg-white/80 border border-teal-900/10') : 'bg-card border border-border/50 shadow-card'}`}
      >
        {staged && (
          <div className="pointer-events-none absolute top-0 left-[10%] right-[10%] h-px" style={{
            background: dark
              ? 'linear-gradient(90deg, transparent, rgba(139,124,255,0.5), rgba(94,234,212,0.3), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(13,148,136,0.5), rgba(124,92,255,0.25), transparent)'
          }} />
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <OrbIcon icon={Users} hue={STAGE_HUES.violet} size={40} radius={12} className="shrink-0" />
            <div className="min-w-0">
              <h2 className={`text-[15px] font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>Matching clients</h2>
              <p className={`text-xs mt-0.5 truncate ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className={`font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{property.title || property.reference}</span>
                <span className="mx-1.5 opacity-40">—</span>
                {filtered.length} client{filtered.length !== 1 ? 's' : ''} correspondant{filtered.length !== 1 ? 's' : ''}
                {excellentCount > 0 && <span className="ml-1.5 inline-flex items-center gap-1 text-emerald-500"><CheckCircle size={10} /> {excellentCount} excellent{excellentCount > 1 ? 's' : ''}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StageButton variant="glass" size="sm" icon={<RefreshCw size={13} />} onClick={fetchMatches} />
            {selectedProposals.length > 0 && (
              <StageButton variant="primary" size="sm" icon={<Mail size={13} />} onClick={() => {
                const m = matches.find(x => x.clientId === selectedProposals[0]);
                if (m) openProposal(m);
                else if (selectedProposals.length > 1) toast('info', `Envoi groupé : ${selectedProposals.length} clients sélectionnés`);
              }}>
                Notifier ({selectedProposals.length})
              </StageButton>
            )}
          </div>
        </div>
        {(filtered.length > 0) && (
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${dark ? 'bg-white/[0.06] border-white/10 text-white' : 'bg-white border-teal-900/10 text-slate-900'}`}>
              <span className={`text-sm font-extrabold ${avgScore >= 80 ? 'text-emerald-400' : avgScore >= 60 ? 'text-amber-400' : dark ? 'text-slate-400' : 'text-slate-500'}`}><AnimatedNumber value={avgScore} suffix="%" /></span>
              <span className={`text-[10px] font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>score moyen</span>
            </div>
            <div className={`h-6 w-px ${dark ? 'bg-white/10' : 'bg-teal-900/10'}`} />
            <span className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              Trié par <span className={`font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{sortBy === 'score' ? 'compatibilité' : 'budget'}</span>
            </span>
          </div>
        )}
      </motion.div>

      {/* Filters & Search */}
      <div className={`rounded-2xl overflow-hidden p-4 ${staged ? (dark ? 'bg-white/[0.04] border border-white/[0.08]' : 'bg-white/80 border border-teal-900/10') : 'bg-card border border-border/50 shadow-card'}`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter size={12} className={dark ? 'text-slate-500' : 'text-teal-900/40'} />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>Filtres</span>
          </div>
          <div className={`flex items-center gap-1 rounded-xl p-1 border ${dark ? 'bg-white/[0.04] border-white/10' : 'bg-slate-50 border-teal-900/10'}`}>
            {[0, 50, 60, 70, 80].map(val => (
              <button key={val} onClick={() => setScoreFilter(val)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${scoreFilter === val ? 'bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-md border border-white/20' : dark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-teal-900 hover:bg-white'}`}>
                {val === 0 ? 'Tous' : `${val}%+`}
              </button>
            ))}
          </div>
          <div className={`h-6 w-px ${dark ? 'bg-white/10' : 'bg-teal-900/10'}`} />
          <div className={`flex items-center gap-1 rounded-xl p-1 border ${dark ? 'bg-white/[0.04] border-white/10' : 'bg-slate-50 border-teal-900/10'}`}>
            {([['score', 'Meilleur', TrendingUp], ['budget', 'Budget', DollarSign]] as const).map(([val, label, Icon]) => (
              <button key={val} onClick={() => setSortBy(val)}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${sortBy === val ? 'bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-md border border-white/20' : dark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-teal-900 hover:bg-white'}`}>
                <Icon size={11} />{label}
              </button>
            ))}
          </div>
          <div className={`h-6 w-px hidden sm:block ${dark ? 'bg-white/10' : 'bg-teal-900/10'}`} />
          <div className="flex-1 min-w-[180px] max-w-[260px]">
            <SearchInput
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher un client, secteur..."
              className={`h-9 ${staged ? (dark ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:ring-violet-500/20 focus:border-violet-500/50' : 'bg-white border-teal-900/10 text-slate-900 placeholder:text-teal-900/40 focus:ring-teal-600/20 focus:border-teal-600/40') : ''}`}
            />
          </div>
        </div>
      </div>

      {/* Cards */}
      {sorted.length === 0 ? (
        <div className={`rounded-2xl p-12 flex flex-col items-center justify-center text-center ${staged ? (dark ? 'bg-white/[0.04] border border-white/[0.08]' : 'bg-white/80 border border-teal-900/10') : 'bg-card border border-border/50 shadow-card'}`}>
          <OrbIcon icon={Users} hue={SLATE_HUE} size={52} radius={16} className="opacity-40 mb-3" />
          <p className={`text-sm font-semibold ${dark ? 'text-slate-300' : 'text-slate-700'}`}>Aucun client trouvé</p>
          <p className={`text-xs mt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Essayez d'abaisser le score minimum ou modifiez votre recherche</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((match, i) => {
            const sc = scoreMeta(match.score);
            const criteria = buildCriteria(match.details);
            const isExpanded = expandedCards.has(match.clientId);
            const isSelected = selectedProposals.includes(match.clientId);

            return (
              <motion.div
                key={match.clientId}
                initial={staged ? { opacity: 0, y: 14 } : undefined}
                animate={staged ? { opacity: 1, y: 0 } : undefined}
                transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {staged ? (
                  <TiltCard className="p-0 overflow-hidden">
                    <div className="p-4">
                      {/* Top row */}
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${dark ? 'bg-white/[0.06] border-white/10' : 'bg-violet-50 border-violet-200/50'}`}>
                          <span className={`text-sm font-extrabold ${dark ? 'text-white' : 'text-violet-600'}`}>
                            {match.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`font-bold text-[13px] truncate ${dark ? 'text-white' : 'text-slate-900'}`}>{match.name}</h4>
                                <StageBadge variant={match.type === 'Locataire' ? 'ok' : 'violet'}>{match.type}</StageBadge>
                                {isSelected && <StageBadge variant="ok">Sélectionné</StageBadge>}
                              </div>
                              {match.secteur && (
                                <span className={`inline-flex items-center gap-1 text-xs mt-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  <MapPin size={11} className={dark ? 'text-slate-500' : 'text-teal-900/40'} />{match.secteur}
                                </span>
                              )}
                            </div>
                            <div className="shrink-0 flex flex-col items-center">
                              <div className={`relative w-12 h-12 rounded-full ${sc.lightBg} flex items-center justify-center ring-2 ${sc.ring} border ${dark ? 'border-white/10' : 'border-white'}`}>
                                <span className={`text-sm font-extrabold ${sc.hue.line}`} style={{ color: sc.hue.line }}>{match.score}<span className="text-[9px]">%</span></span>
                              </div>
                              <span className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: sc.hue.line }}>{sc.label}</span>
                            </div>
                          </div>
                          {/* Stats */}
                          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                            {match.budget > 0 && (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border ${dark ? 'bg-white/[0.06] border-white/10 text-slate-300' : 'bg-white border-teal-900/10 text-slate-600'}`}>
                                <DollarSign size={11} className={dark ? 'text-slate-500' : 'text-teal-900/40'} />{match.budget.toLocaleString()} MAD
                              </span>
                            )}
                            {(match.minSurface > 0 || match.surfaceMax > 0) && (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border ${dark ? 'bg-white/[0.06] border-white/10 text-slate-300' : 'bg-white border-teal-900/10 text-slate-600'}`}>
                                <Maximize2 size={11} className={dark ? 'text-slate-500' : 'text-teal-900/40'} />{match.minSurface || '?'}–{match.surfaceMax || '?'} m²
                              </span>
                            )}
                            {match.chambres > 0 && (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border ${dark ? 'bg-white/[0.06] border-white/10 text-slate-300' : 'bg-white border-teal-900/10 text-slate-600'}`}>
                                <Moon size={11} className={dark ? 'text-slate-500' : 'text-teal-900/40'} />{match.chambres} ch.
                              </span>
                            )}
                            {match.email && (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border truncate max-w-[180px] ${dark ? 'bg-white/[0.06] border-white/10 text-slate-300' : 'bg-white border-teal-900/10 text-slate-600'}`}>
                                <Mail size={11} className="shrink-0" />{match.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {match.criteres && match.criteres.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {match.criteres.slice(0, 6).map((c, idx) => (
                            <span key={idx} className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${dark ? 'bg-white/[0.04] border-white/10 text-slate-400' : 'bg-slate-50 border-teal-900/10 text-slate-500'}`}>{c}</span>
                          ))}
                          {match.criteres.length > 6 && (
                            <span className="px-2 py-1 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/20 text-[10px] font-bold">+{match.criteres.length - 6}</span>
                          )}
                        </div>
                      )}

                      {criteria.length > 0 && (
                        <div className="mt-4">
                          <div className={`h-1.5 rounded-full overflow-hidden ${sc.trackBg}`}>
                            <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${sc.hue.a}, ${sc.hue.b})` }} initial={{ width: 0 }} animate={{ width: `${match.score}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }} />
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                            {criteria.map(({ key, label, icon, ratio }) => {
                              const CIcon = getIcon(icon);
                              const pct = Math.round(ratio * 100);
                              return (
                                <span key={key} className="inline-flex items-center gap-1.5 text-[11px]">
                                  <CIcon size={11} className={pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'} />
                                  <span className={dark ? 'text-slate-400' : 'text-teal-900/50'}>{label}</span>
                                  <span className={`font-bold ${pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{pct}%</span>
                                </span>
                              );
                            })}
                          </div>
                          <button onClick={() => toggleExpand(match.clientId)} className={`flex items-center gap-1 mt-2 text-xs font-semibold transition-colors ${dark ? 'text-violet-300 hover:text-white' : 'text-violet-600 hover:text-violet-800'}`}>
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}{isExpanded ? 'Masquer les détails' : 'Voir le détail du calcul'}
                          </button>
                        </div>
                      )}

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ height: { duration: 0.15, ease: [0.25, 1, 0.5, 1] }, opacity: { duration: 0.1 } }} style={{ overflow: 'hidden' }}>
                            <div className={`mt-3 rounded-xl p-3.5 space-y-1 border ${dark ? 'bg-white/[0.04] border-white/10' : 'bg-slate-50 border-teal-900/10'}`}>
                              <p className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${dark ? 'text-slate-500' : 'text-teal-900/40'}`}>Détails du score</p>
                              {criteria.map(({ key, label, icon, ratio, weight }) => {
                                const CIcon = getIcon(icon);
                                const pct = Math.round(ratio * 100);
                                const pts = Math.round(ratio * weight);
                                return (
                                  <div key={key} className={`flex items-center justify-between py-1.5 border-b last:border-0 ${dark ? 'border-white/5' : 'border-teal-900/5'}`}>
                                    <span className={`flex items-center gap-2 text-xs ${dark ? 'text-slate-300' : 'text-slate-600'}`}><span className={`w-6 h-6 rounded-lg flex items-center justify-center border ${dark ? 'bg-white/[0.06] border-white/10' : 'bg-white border-teal-900/10'}`}><CIcon size={11} className={dark ? 'text-slate-400' : 'text-teal-900/40'} /></span>{label}</span>
                                    <span className="flex items-center gap-2 text-xs"><span className={dark ? 'text-slate-500' : 'text-slate-400'}>{pts}/{weight} pts</span><span className={`font-bold min-w-[36px] text-right ${pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{pct}%</span></span>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className={`px-4 py-3 flex items-center justify-between border-t ${dark ? 'border-white/10 bg-white/[0.02]' : 'border-teal-900/10 bg-slate-50/50'}`}>
                      <label className="flex items-center gap-2 cursor-pointer group" onClick={e => { e.preventDefault(); toggleProposal(match.clientId); }}>
                        <span className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-violet-500 border-violet-500 text-white' : dark ? 'border-white/20 group-hover:border-violet-400/50' : 'border-teal-900/20 group-hover:border-violet-400/50'}`}>
                          {isSelected && <CheckSquare size={12} />}
                        </span>
                        <span className={`text-xs font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Sélectionner</span>
                      </label>
                      <div className="flex items-center gap-1">
                        <button onClick={() => basePath && navigate(`${basePath}/clients/${match.clientId}`)} className={`p-1.5 rounded-lg transition-colors ${dark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-violet-600 hover:bg-violet-50'}`} title="Voir le client"><Eye size={14} /></button>
                        <button onClick={() => openProposal(match)} className={`p-1.5 rounded-lg transition-colors ${dark ? 'text-emerald-300 hover:bg-emerald-500/15' : 'text-emerald-600 hover:bg-emerald-50'}`} title="Proposer"><Send size={14} /></button>
                        <button onClick={() => handleRefuse(match)} className={`p-1.5 rounded-lg transition-colors ${dark ? 'text-red-300 hover:bg-red-500/15' : 'text-red-500 hover:bg-red-50'}`} title="Refuser"><X size={14} /></button>
                      </div>
                    </div>
                  </TiltCard>
                ) : (
                  <div className="bg-card rounded-2xl border border-border/40 shadow-card overflow-hidden">
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/15 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-accent">{match.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-[13px] text-text truncate">{match.name}</h4>
                            <span className="text-[11px] text-text-secondary">{match.secteur}</span>
                          </div>
                          <div className={`w-12 h-12 rounded-full ${sc.lightBg} flex items-center justify-center ring-2 ${sc.ring} shrink-0`}>
                            <span className={`text-sm font-bold ${sc.hue.line ? '' : sc.hue.line}`} style={{ color: sc.hue.line }}>{match.score}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[10px]">
                          {match.budget > 0 && <span className="px-2 py-0.5 rounded-md bg-background border border-border/40">{match.budget.toLocaleString()} MAD</span>}
                          {(match.minSurface > 0 || match.surfaceMax > 0) && <span className="px-2 py-0.5 rounded-md bg-background border border-border/40">{match.minSurface || '?'}–{match.surfaceMax || '?'} m²</span>}
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-2.5 border-t border-border/30 flex items-center justify-between bg-background/20">
                      <label className="flex items-center gap-2 cursor-pointer" onClick={e => { e.preventDefault(); toggleProposal(match.clientId); }}>
                        <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-accent border-accent text-white' : 'border-border'}`}>{isSelected && <CheckSquare size={10} />}</span>
                        <span className="text-[10px] text-text-secondary/60">Sélectionner</span>
                      </label>
                      <div className="flex items-center gap-1">
                        <button onClick={() => basePath && navigate(`${basePath}/clients/${match.clientId}`)} className="px-2.5 py-1.5 text-[11px] font-medium text-text-secondary hover:text-accent rounded-lg">Voir</button>
                        <button onClick={() => openProposal(match)} className="px-2.5 py-1.5 text-[11px] font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg">Proposer</button>
                        <button onClick={() => handleRefuse(match)} className="px-2.5 py-1.5 text-[11px] font-medium text-red-400 hover:bg-red-50 rounded-lg">Refuser</button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      {matches.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { label: 'Clients analysés', value: matches.length, hue: STAGE_HUES.violet, icon: Users },
            { label: 'Score moyen', value: avgScore, suffix: '%', hue: avgScore >= 70 ? STAGE_HUES.emerald : STAGE_HUES.amber, icon: BarChart2 },
            { label: 'Excellent match', value: excellentCount, hue: STAGE_HUES.emerald, icon: CheckCircle },
            { label: 'Sélectionnés', value: selectedProposals.length, hue: STAGE_HUES.sky, icon: Star },
          ].map((s, i) => (
            <motion.div key={s.label} initial={staged ? { opacity: 0, y: 14 } : undefined} animate={staged ? { opacity: 1, y: 0 } : undefined} transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              {staged ? (
                <TiltCard className="p-3 text-center">
                  <div className="flex items-center justify-center mb-2"><OrbIcon icon={s.icon} hue={s.hue} size={30} radius={9} /></div>
                  <p className={`text-[9px] font-bold uppercase tracking-[0.16em] ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>{s.label}</p>
                  <p className={`text-lg font-extrabold leading-tight tabular-nums ${dark ? 'text-white' : 'text-slate-900'}`}><AnimatedNumber value={s.value} suffix={s.suffix || ''} /></p>
                </TiltCard>
              ) : (
                <div className="bg-card rounded-xl border border-border/50 shadow-card p-3 text-center">
                  <p className="text-xs text-text-secondary/60 truncate">{s.label}</p>
                  <p className="text-lg font-bold mt-0.5" style={{ color: s.hue.line }}>{s.value}{s.suffix || ''}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Proposal Modal — premium Stage glass, portaled */}
      {createPortal(
        <AnimatePresence>
          {proposalModal.open && proposalModal.match && (() => {
            const m = proposalModal.match!;
            const mCriteria = buildCriteria(m.details);
            const sc = scoreMeta(m.score);
            const ownerInitials = (property.owner?.name || 'P').split(' ').filter(Boolean).map(n=>n[0]).join('').slice(0,2).toUpperCase();
            return (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={() => setProposalModal({ open: false, match: null })}
              >
                <motion.div
                  initial={{ scale: 0.96, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 8 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className={`w-full max-w-[640px] overflow-hidden flex flex-col max-h-[88vh] rounded-2xl border shadow-[0_40px_90px_-24px_rgba(0,0,0,0.85)] ${dark ? 'bg-[linear-gradient(180deg,rgba(18,24,58,0.98),rgba(10,15,36,0.98))] border-white/10' : 'bg-white border-slate-200'}`}
                  onClick={e => e.stopPropagation()}
                >
                  {/* hairline */}
                  <div className="h-[2px] w-full shrink-0" style={{ background: dark ? 'linear-gradient(90deg, transparent, rgba(139,124,255,0.7), rgba(94,234,212,0.45), transparent)' : 'linear-gradient(90deg, transparent, rgba(13,148,136,0.5), rgba(124,92,255,0.3), transparent)' }} />

                  {/* Header */}
                  <div className={`px-6 py-4 flex items-center justify-between gap-4 shrink-0 border-b ${dark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <OrbIcon icon={Send} hue={STAGE_HUES.violet} size={38} radius={11} />
                      <div className="min-w-0">
                        <h3 className={`text-[15px] font-bold tracking-tight leading-none ${dark ? 'text-white' : 'text-slate-900'}`}>Notifier le propriétaire</h3>
                        <p className={`text-xs mt-1 truncate ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {property.reference} · {property.title}
                          {selectedProposals.length > 1 && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20 text-[10px] font-bold">+{selectedProposals.length} sélectionnés</span>}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setProposalModal({ open: false, match: null })}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all shrink-0 ${dark ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-white'}`}>
                      <X size={14} />
                    </button>
                  </div>

                  {/* Body — smooth scrollbar matching Complétion */}
                  <div
                    className="flex-1 overflow-y-auto min-h-0 p-6 space-y-5 scrollbar-thin"
                    style={{
                      overscrollBehavior: 'contain',
                      WebkitOverflowScrolling: 'touch' as any,
                      transform: 'translateZ(0)',
                      willChange: 'scroll-position',
                    }}
                  >
                    {/* Owner + Client hero */}
                    <div className={`grid grid-cols-1 sm:grid-cols-[1.1fr_1fr] gap-3 p-4 rounded-2xl border ${dark ? 'bg-white/[0.04] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 border ${dark ? 'bg-white/[0.06] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>{ownerInitials}</div>
                        <div className="min-w-0">
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Propriétaire</p>
                          <p className={`text-sm font-bold truncate ${dark ? 'text-white' : 'text-slate-900'}`}>{property.owner?.name || 'Propriétaire'}</p>
                          <p className={`text-xs truncate ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{property.city}{property.district ? `, ${property.district}` : ''}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-3 p-3 rounded-xl border ${dark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-xs border ${dark ? 'bg-white/[0.06] border-white/10 text-white' : 'bg-violet-50 border-violet-200 text-violet-700'}`}>{m.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-bold truncate ${dark ? 'text-white' : 'text-slate-900'}`}>{m.name}</p>
                          <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{m.type} · {m.secteur || m.area || '—'}</p>
                        </div>
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center ring-2 shrink-0 ${sc.lightBg} ${sc.ring} border ${dark ? 'border-white/10' : 'border-white'}`}>
                          <span className="text-xs font-extrabold" style={{ color: sc.hue.line }}>{m.score}<span className="text-[9px]">%</span></span>
                        </div>
                      </div>
                    </div>

                    {/* Property strip */}
                    <div className={`flex flex-wrap items-center gap-2 px-3 py-2.5 rounded-xl border text-xs ${dark ? 'bg-white/[0.03] border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                      <span className={`px-2 py-1 rounded-full border text-[10px] font-bold ${dark ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>{property.reference}</span>
                      <span className="flex items-center gap-1"><MapPin size={12} className={dark ? 'text-slate-500' : 'text-slate-400'} />{property.city}</span>
                      <span className="opacity-30">·</span>
                      <span className="flex items-center gap-1"><Maximize2 size={12} />{property.surface} m²</span>
                      <span className="opacity-30">·</span>
                      <span className="flex items-center gap-1"><DollarSign size={12} />{property.price ? property.price.toLocaleString() + ' MAD' : '—'}</span>
                      <StageBadge variant={sc.hue === STAGE_HUES.emerald ? 'ok' : sc.hue === STAGE_HUES.amber ? 'warn' : 'neutral'} className="ml-auto">{sc.label} · {m.score}%</StageBadge>
                    </div>

                    {/* Criteria */}
                    {mCriteria.length > 0 && (
                      <div className={`p-4 rounded-2xl border ${dark ? 'bg-white/[0.04] border-white/10' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <p className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}><BarChart2 size={12} />Compatibilité</p>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full border ${dark ? 'bg-white/10 border-white/10 text-white' : 'bg-slate-900 text-white border-slate-900'}`}>{m.score}% global</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                          {mCriteria.map(({ key, label, icon, ratio }) => {
                            const pct = Math.round(ratio * 100);
                            const CIcon = getIcon(icon);
                            return (
                              <div key={key} className="flex items-center gap-2.5">
                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${dark ? 'bg-white/[0.06] border-white/10' : 'bg-slate-50 border-slate-200'}`}><CIcon size={12} className={pct >= 80 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-slate-400'} /></span>
                                <span className={`text-xs font-medium flex-1 truncate ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{label}</span>
                                <div className={`w-20 h-1.5 rounded-full overflow-hidden shrink-0 ${dark ? 'bg-white/10' : 'bg-slate-200'}`}>
                                  <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: [0.22,1,0.36,1] }} style={{ background: pct >= 80 ? STAGE_HUES.emerald.line : pct >= 50 ? STAGE_HUES.amber.line : SLATE_HUE.line }} />
                                </div>
                                <span className="text-xs font-bold w-8 text-right" style={{ color: pct >= 80 ? STAGE_HUES.emerald.line : pct >= 50 ? STAGE_HUES.amber.line : SLATE_HUE.line }}>{pct}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    <div>
                      <label className={`flex items-center gap-1.5 text-xs font-semibold mb-1.5 ${dark ? 'text-slate-300' : 'text-slate-700'}`}><Mail size={12} className={dark ? 'text-slate-500' : 'text-slate-400'} /> Email du propriétaire</label>
                      <div className="relative">
                        <Mail size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-slate-500' : 'text-slate-400'}`} />
                        <input
                          type="email"
                          value={proposalEmail}
                          onChange={(e) => setProposalEmail(e.target.value)}
                          placeholder="proprietaire@exemple.com"
                          className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${dark ? 'bg-white/[0.06] border-white/10 text-white placeholder:text-slate-500 focus:ring-violet-500/25 focus:border-violet-500/40' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-violet-500/20 focus:border-violet-500/40'}`}
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={`flex items-center gap-1.5 text-xs font-semibold ${dark ? 'text-slate-300' : 'text-slate-700'}`}><FileText size={12} className={dark ? 'text-slate-500' : 'text-slate-400'} /> Message</label>
                        <span className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{proposalMessage.length} caractères</span>
                      </div>
                      <textarea
                        value={proposalMessage}
                        onChange={(e) => setProposalMessage(e.target.value)}
                        rows={11}
                        placeholder="Message à envoyer..."
                        className={`w-full px-3.5 py-3 rounded-xl border text-[13px] leading-relaxed focus:outline-none focus:ring-2 transition-all resize-none font-mono ${dark ? 'bg-white/[0.06] border-white/10 text-white placeholder:text-slate-500 focus:ring-violet-500/25 focus:border-violet-500/40' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-violet-500/20 focus:border-violet-500/40'}`}
                      />
                      <p className={`text-[11px] mt-1.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Le propriétaire recevra un email avec l'analyse détaillée et vos coordonnées.</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className={`px-6 py-4 flex items-center justify-between gap-3 shrink-0 border-t ${dark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-slate-200 bg-slate-50/70'}`}>
                    <span className={`text-xs hidden sm:block ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{m.name} · {m.budget ? m.budget.toLocaleString() + ' MAD' : 'Budget N/C'}</span>
                    <div className="flex items-center gap-2 ml-auto">
                      <StageButton variant="glass" size="sm" onClick={() => setProposalModal({ open: false, match: null })}>Annuler</StageButton>
                      <StageButton variant="primary" size="sm" icon={<Send size={13} />} onClick={submitProposal} className={proposalSending || !proposalEmail ? 'opacity-50 pointer-events-none' : ''}>
                        {proposalSending ? 'Envoi en cours...' : 'Envoyer la notification'}
                      </StageButton>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
