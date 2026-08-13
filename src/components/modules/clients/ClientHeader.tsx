import { useState, useEffect, useCallback } from 'react';
import { Mail, Phone, User, DollarSign, MapPin, Home, Calendar, FileText, TrendingUp, CheckCircle, MessageSquare, Compass, ExternalLink } from "react-feather";
import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { CompletionRing } from "../../ui/CompletionRing";
import { calcClientCompletion } from "../../../utils/clientCompletion";
import { api } from "../../../services/api";

interface ClientActivity {
  id: string | number;
  type: string;
  status?: string;
  activity_date?: string;
  notes?: string;
}

const STATUT_METIER_BADGES: Record<string, string> = {
  'En qualification': 'bg-blue-100 text-blue-700',
  'En recherche': 'bg-emerald-100 text-emerald-700',
  'En negociation': 'bg-amber-100 text-amber-700',
  'En compromis': 'bg-purple-100 text-purple-700',
  'Vendu / Achete': 'bg-emerald-100 text-emerald-700',
  'Inactif': 'bg-orange-100 text-orange-700',
  'Perdu': 'bg-red-100 text-red-700',
};

const CLASSIFICATION_BADGES: Record<string, string> = {
  'Tres actif': 'bg-emerald-100 text-emerald-700',
  'Actif': 'bg-blue-100 text-blue-700',
  'Normal': 'bg-gray-100 text-gray-600',
  'Peu actif': 'bg-amber-100 text-amber-700',
  'Tres peu actif': 'bg-red-100 text-red-700',
};

const getStatutMetierBadge = (s: string, isGerant: boolean) => {
  const base = STATUT_METIER_BADGES[s];
  if (isGerant && (s === 'En negociation')) return 'bg-[#E7D5D5] text-[#905D5D]';
  if (isGerant && s === 'Inactif') return 'bg-[#E7D5D5] text-[#905D5D]';
  return base || 'bg-gray-100 text-gray-600';
};

const getClassificationBadge = (s: string, isGerant: boolean) => {
  const base = CLASSIFICATION_BADGES[s];
  if (isGerant && s === 'Peu actif') return 'bg-[#E7D5D5] text-[#905D5D]';
  return base || 'bg-gray-100 text-gray-600';
};

interface Client {
  id?: string | number; name: string; phone: string; email: string; status: string; type?: string;
  statutMetier?: string; classification?: string; createdAt?: string;
  budget?: number; prixMin?: number; prixMax?: number; secteur?: string;
  propertyType?: string; pieces?: number; loyer?: number; source?: string;
  localisation?: string; categorie?: string; latitude?: number; longitude?: number;
  agentId?: string; agentDesigne?: string; prixVenteFAI?: number; contactId?: string;
}

const USER_CACHE: Record<string, { name: string; role: string; position?: string }> = {};
const NAME_TO_ROLE: Record<string, string> = {};
const NAME_TO_POSITION: Record<string, string> = {};

const getRoleBadge = (role?: string, position?: string, isGerant = false) => {
  if (role === 'agent') return { label: position || 'Agent', cls: 'bg-emerald-100 text-emerald-700' };
  if (role === 'gerant') return { label: 'Gérant', cls: isGerant ? 'bg-[#E7D5D5] text-[#905D5D]' : 'bg-orange-100 text-orange-700' };
  if (role === 'admin') return { label: 'Admin', cls: 'bg-indigo-100 text-indigo-700' };
  return null;
};

export const ClientHeader = ({ client, isGerant = false }: { client: Client; isGerant?: boolean }) => {
  const [nextRdv, setNextRdv] = useState<string | null>(null);
  const [visitsThisMonth, setVisitsThisMonth] = useState<number | null>(null);
  const completion = (client as any).completion ?? calcClientCompletion(client);
  const [, setUsersFetched] = useState(false);

  const fetchNextRdv = useCallback(() => {
    const clientId = (client as any).id;
    if (!clientId) return;
    api.get<any>(`/clients/${clientId}/activities?limit=100`).then((data) => {
      const list = (data as any)?.activities || data || [];
      const arr = Array.isArray(list) ? list : [];
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
      setVisitsThisMonth(
        arr.filter((a: any) => a.type === 'visite' && a.activity_date)
          .filter((a: any) => {
            const t = new Date(a.activity_date).getTime();
            return t >= monthStart && t < monthEnd;
          }).length
      );
      const upcoming = arr
        .filter((a: any) =>
          a.type === 'rendez_vous' &&
          (a.status === 'en_attente' || a.status === 'confirme') &&
          a.activity_date
        )
        .sort((a: any, b: any) => new Date(a.activity_date).getTime() - new Date(b.activity_date).getTime())
        .find((a: any) => new Date(a.activity_date) >= new Date());
      if (upcoming) {
        const d = new Date(upcoming.activity_date);
        const formatted = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        setNextRdv(formatted);
      } else {
        setNextRdv(null);
      }
    }).catch(() => { setNextRdv(null); setVisitsThisMonth(null); });
  }, [client]);

  useEffect(() => {
    fetchNextRdv();
    const interval = setInterval(fetchNextRdv, 30000);
    return () => clearInterval(interval);
  }, [fetchNextRdv]);

  const notesHref = (() => {
    const base = window.location.pathname.replace(/\/clients\/.*/, '');
    return `${base}/clients/${(client as any).id}?tab=notes_activite`;
  })();

  const typeKpis = getTypeKpis(client, nextRdv, visitsThisMonth, notesHref);

  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string; position?: string } | null>(null);

  useEffect(() => {
    api.get<any>('/auth/me').then((u: any) => {
      if (u) {
        const name = [u.first_name || '', u.last_name || ''].filter(Boolean).join(' ').trim() || u.email || 'Inconnu';
        USER_CACHE[String(u.id)] = { name, role: u.role || '', position: u.position || '' };
        NAME_TO_ROLE[name.toLowerCase()] = u.role || '';
        NAME_TO_POSITION[name.toLowerCase()] = u.position || '';
        setCurrentUser({ id: String(u.id), name, role: u.role || '', position: u.position || '' });
      }
      setUsersFetched(true);
    }).catch(() => { setUsersFetched(true); });
    api.get<any[]>('/admin/users').then((list: any[]) => {
      if (Array.isArray(list)) {
        for (const u of list) {
          const name = [u.first_name || '', u.last_name || ''].filter(Boolean).join(' ').trim() || u.email || 'Inconnu';
          USER_CACHE[String(u.id)] = { name, role: u.role || '', position: u.position || '' };
          NAME_TO_ROLE[name.toLowerCase()] = u.role || '';
          NAME_TO_POSITION[name.toLowerCase()] = u.position || '';
        }
      }
      setUsersFetched(true);
    }).catch(() => {});
  }, []);

  const agentId = client.agentId || '';
  const agentDesigne = client.agentDesigne || '';
  const agentInfo = agentId ? USER_CACHE[agentId] : undefined;
  const agentName = agentInfo?.name || agentDesigne || agentId || currentUser?.name || 'Non assigné';
  const agentRole = agentInfo?.role || (agentDesigne ? NAME_TO_ROLE[agentDesigne.toLowerCase()] : '') || currentUser?.role || '';
  const agentPosition = agentInfo?.position || (agentDesigne ? NAME_TO_POSITION[agentDesigne.toLowerCase()] : '') || currentUser?.position || '';
  const agentBadge = getRoleBadge(agentRole, agentPosition, isGerant);

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className={`w-14 h-14 rounded-xl ${isGerant ? 'bg-[#E7D5D5]' : 'bg-accent-light'} flex items-center justify-center`}>
              <User size={22} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
            </div>
            <div className="absolute -top-1 -right-1">
              <CompletionRing percent={completion} size={32} strokeWidth={3} showLabel={true} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold">{client.name}</h1>
              {client.statutMetier ? (
                <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${getStatutMetierBadge(client.statutMetier, isGerant)}`}>
                  {client.statutMetier}
                </span>
              ) : (
                <Badge variant={client.status === 'Actif' ? 'success' : 'warning'} size="sm">{client.status}</Badge>
              )}
              {(client as any).contactId && (
                <a
                  href={(() => {
                    const base = window.location.pathname.replace(/\/clients\/.*/, '');
                    return `${base}/contacts/${(client as any).contactId}`;
                  })()}
                  className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium ${isGerant ? 'bg-[#E7D5D5] text-[#905D5D] hover:bg-[#905D5D]/20' : 'bg-accent-light text-accent hover:bg-accent/20'} transition-colors`}
                  title="Voir le contact d'origine"
                >
                  <User size={10} /> Contact d'origine <ExternalLink size={9} />
                </a>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
              <span className="capitalize">{client.type || ''}</span>
              {client.createdAt && <span>· Client depuis {new Date(client.createdAt).toLocaleDateString('fr-FR')}</span>}
              {client.classification && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getClassificationBadge(client.classification, isGerant)}`}>
                  {client.classification}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {typeKpis.map((kpi, i) => {
          const Icon = kpi.icon;
          const content = (
            <>
              <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                <Icon size={12} className={kpi.iconColor || (isGerant ? 'text-[#905D5D]' : 'text-accent')} />
                <span>{kpi.label}</span>
              </div>
              <p className="text-sm font-semibold">{kpi.value}</p>
            </>
          );
          return kpi.link ? (
            <a
              key={i}
              href={kpi.link}
              title="Voir les visites dans Notes & Activité"
              className={`bg-background rounded-lg p-3 border border-border/30 block ${isGerant ? 'hover:border-[#905D5D]/50' : 'hover:border-accent/50'} hover:shadow-md transition-all duration-200 group`}
            >
              {content}
            </a>
          ) : (
            <div key={i} className="bg-background rounded-lg p-3 border border-border/30">
              {content}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-border/20">
        <a href={`tel:${client.phone}`} className={`flex items-center gap-1.5 text-xs text-text-secondary ${isGerant ? 'hover:text-[#905D5D]' : 'hover:text-accent'} transition-colors`}>
          <Phone size={12} /> {client.phone}
        </a>
        <span className="text-border/40">|</span>
        <a href={`mailto:${client.email}`} className={`flex items-center gap-1.5 text-xs text-text-secondary ${isGerant ? 'hover:text-[#905D5D]' : 'hover:text-accent'} transition-colors`}>
          <Mail size={12} /> {client.email}
        </a>
        {(client.localisation || client.categorie || (client.latitude && client.longitude)) && (
          <span className="text-border/40">|</span>
        )}
        {client.localisation && (
          <span className="flex items-center gap-1.5 text-xs text-text-secondary">
            <MapPin size={12} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} /> {client.localisation}
          </span>
        )}
        {client.categorie && (
          <span className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Home size={12} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} /> {client.categorie}
          </span>
        )}
        {client.latitude !== undefined && client.latitude !== 0 && client.longitude !== undefined && client.longitude !== 0 && (
          <a
            href={`https://www.google.com/maps?q=${client.latitude},${client.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 text-xs text-text-secondary ${isGerant ? 'hover:text-[#905D5D]' : 'hover:text-accent'} transition-colors`}
          >
            <Compass size={12} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} /> {client.latitude.toFixed(4)}, {client.longitude.toFixed(4)}
          </a>
        )}
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 bg-background/80 px-3 py-1.5 rounded-lg border border-border/30">
            <div className="w-7 h-7 rounded-lg bg-violet-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-[10px]">
                {agentName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'NA'}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-text-secondary leading-none">Assigné à</p>
              <p className="text-xs font-medium leading-tight">{agentName}</p>
            </div>
            {agentBadge && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${agentBadge.cls}`}>
                {agentBadge.label}
              </span>
            )}
          </div>
          <Button variant="default" size="sm" icon={<MessageSquare size={13} />} className={`flex-1 ${isGerant ? 'bg-[#905D5D] hover:bg-[#7D5050] border-[#905D5D] hover:border-[#7D5050] text-white' : ''}`}>Nouveau message</Button>
        </div>
      </div>
    </div>
  );
};

function getTypeKpis(client: Client, nextRdv: string | null, visitsThisMonth: number | null, notesHref: string) {
  const type = client.type || '';
  const baseKpis = (label: string, value: string, icon: any, iconColor?: string, link?: string) => ({ label, value, icon, iconColor, link });
  const rdvValue = nextRdv || '—';
  const visitsValue = visitsThisMonth === null ? '—' : String(visitsThisMonth);

  switch (type) {
    case 'Acheteur':
      return [
        baseKpis('Budget', client.prixMin && client.prixMax ? `${(client.prixMin / 1000).toLocaleString()}k-${(client.prixMax / 1000).toLocaleString()}k MAD` : '—', DollarSign),
        baseKpis('Secteur', client.secteur || '—', MapPin),
        baseKpis('Origine', client.source || '—', Home),
        baseKpis('RDV à venir', rdvValue, Calendar),
      ];
    case 'Vendeur':
      return [
        baseKpis('Prix', client.prixVenteFAI ? `${client.prixVenteFAI.toLocaleString('fr-FR')} MAD` : '—', DollarSign),
        baseKpis('Origine', client.source || '—', Home),
        baseKpis('Visites ce mois', visitsValue, Calendar, undefined, notesHref),
        baseKpis('Demandes reçues', '—', FileText),
      ];
    case 'Bailleur': {
      const loyerHC = Number((client as any).loyerHC) || 0;
      const charges = Number((client as any).charges) || 0;
      const devise = (client as any).devise || 'MAD';
      const loyerValue = loyerHC ? `${loyerHC.toLocaleString('fr-FR')} ${devise}` : '—';
      const revenusValue = loyerHC + charges ? `${(loyerHC + charges).toLocaleString('fr-FR')} ${devise}` : '—';
      return [
        baseKpis('Bien', client.propertyType || '—', Home),
        baseKpis('Loyer', loyerValue, DollarSign),
        baseKpis('Visites ce mois', visitsValue, Calendar, undefined, notesHref),
        baseKpis('Revenus mensuels', revenusValue, TrendingUp, 'text-emerald-600'),
      ];
    }
    case 'Locataire':
      return [
        baseKpis('Budget', client.budget ? `${client.budget.toLocaleString()} MAD` : '—', DollarSign),
        baseKpis('Secteur', client.secteur || '—', MapPin),
        baseKpis('Origine', client.source || '—', Home),
        baseKpis('RDV à venir', rdvValue, Calendar),
      ];
    case 'Voyageur':
      return [
        baseKpis('Montant', (client as any).montantTotalAvecOptions ? `${(client as any).montantTotalAvecOptions.toLocaleString('fr-FR')} ${(client as any).devise || 'MAD'}` : (client as any).budgetTotal ? `${(client as any).budgetTotal.toLocaleString('fr-FR')} ${(client as any).devise || 'MAD'}` : '—', DollarSign),
        baseKpis('Bien', (client as any).bienReserveNom || ((client as any).bienReserve ? `Bien #${(client as any).bienReserve}` : client.propertyType || '—'), Home),
        baseKpis('Séjour', (client as any).dateArrivee && (client as any).dateDepart ? `${new Date((client as any).dateArrivee).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} → ${new Date((client as any).dateDepart).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} · ${(client as any).nbNuits || 0}n` : '—', Calendar),
        baseKpis('Statut', (client as any).statutReservation || client.statutMetier || '—', CheckCircle, 'text-emerald-600'),
      ];
    default:
      return [
        baseKpis('Budget', '—', DollarSign),
        baseKpis('Secteur', '—', MapPin),
        baseKpis('Origine', client.source || '—', Home),
        baseKpis('RDV à venir', rdvValue, Calendar),
      ];
  }
}
