import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';
import { Button } from '../../../ui/Button';
import { Dialog } from '../../../ui/Dialog';
import { useToast } from '../../../ui/Toast';
import { DatePicker } from '../../../ui/DatePicker';
import { TimePicker } from '../../../ui/TimePicker';
import { api } from '../../../../services/api';
import {
  Phone, Mail, MapPin, Calendar, FileText, AlertTriangle, MoreHorizontal,
  Plus, Search, RefreshCw, Clock, Edit3, Trash2, X, ChevronLeft,
  ChevronRight, Bell, Star, ArrowUpRight, ArrowDownLeft, Eye,
  MessageSquare, Zap, Shield, User, AlertCircle, Lock, Home, Printer, Download,
  CheckCircle, XCircle, Check, Grid,
} from 'react-feather';
import type { Client } from '../../../../types/client';
import type { ClientActivity } from '../../../../services/clientService';
import {
  fetchClientActivities,
  createClientActivity,
  updateClientActivity,
  deleteClientActivity,
} from '../../../../services/clientService';
import { useMyPermissions, permissionAllowed } from '../../../../hooks/useMyPermissions';
import StageModal, { useStageModalButtons } from '../../calendar/StageModal';
import { useStageFormClasses } from '../../calendar/StageModal';
import {
  useDetailAccent,
  StagePill,
  RED_STAGE_HUE,
  SLATE_STAGE_HUE,
} from './ClientDetailStage';
import { STAGE_HUES, type StageHue } from '../../../dashboard/Stage';

const activityTypeHue = (key: string): StageHue => {
  switch (key) {
    case 'appel':
      return STAGE_HUES.emerald;
    case 'email':
      return STAGE_HUES.sky;
    case 'visite':
      return STAGE_HUES.violet;
    case 'rendez_vous':
      return STAGE_HUES.amber;
    case 'alerte':
      return RED_STAGE_HUE;
    case 'note':
    case 'autre':
    default:
      return SLATE_STAGE_HUE;
  }
};

const rdvStatusHue = (status?: string): StageHue => {
  switch (status) {
    case 'confirme':
      return STAGE_HUES.emerald;
    case 'termine':
      return STAGE_HUES.sky;
    case 'annule':
      return RED_STAGE_HUE;
    case 'en_attente':
    default:
      return STAGE_HUES.amber;
  }
};

const ACTIVITY_TYPES_BASE = [
  { key: 'appel', label: 'Appel', icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-500/20', gradient: 'from-emerald-500 to-emerald-600', glow: 'shadow-emerald-200' },
  { key: 'email', label: 'Email', icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', ring: 'ring-blue-500/20', gradient: 'from-blue-500 to-blue-600', glow: 'shadow-blue-200' },
  { key: 'visite', label: 'Visite', icon: MapPin, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', ring: 'ring-violet-500/20', gradient: 'from-violet-500 to-violet-600', glow: 'shadow-violet-200' },
  { key: 'rendez_vous', label: 'Rendez-vous', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-500/20', gradient: 'from-amber-500 to-amber-600', glow: 'shadow-amber-200' },
  { key: 'note', label: 'Note', icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', ring: 'ring-slate-500/20', gradient: 'from-slate-500 to-slate-600', glow: 'shadow-slate-200' },
  { key: 'alerte', label: 'Alerte', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', ring: 'ring-red-500/20', gradient: 'from-red-500 to-red-600', glow: 'shadow-red-200' },
  { key: 'autre', label: 'Autre', icon: MoreHorizontal, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', ring: 'ring-gray-500/20', gradient: 'from-gray-500 to-gray-600', glow: 'shadow-gray-200' },
] as const;

const getActivityTypes = (isGerant: boolean) =>
  ACTIVITY_TYPES_BASE.map((t) =>
    t.key === 'rendez_vous' && isGerant
      ? { ...t, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20', ring: 'ring-accent/20', gradient: 'from-accent to-accent', glow: 'shadow-accent/25' }
      : t,
  );

type ActivityTypeKey = typeof ACTIVITY_TYPES_BASE[number]['key'];

interface NotesActiviteTabProps {
  client: Client;
  highlightActivityId?: number;
  isGerant?: boolean;
}

export const NotesActiviteTab = ({ client, highlightActivityId, isGerant = false }: NotesActiviteTabProps) => {
  const { toast } = useToast();
  const perms = useMyPermissions();
  const canVisite = permissionAllowed(perms, 'clients-visite');
  const clientId = String(client.id);

  /* Staged theme accents (same kit as Critères / Transactions / Contrats). */
  const { isDark, accent, ink } = useDetailAccent(client.type, isGerant);
  const { input: stageInput } = useStageFormClasses();
  const stageBtns = useStageModalButtons();

  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; role: string; email?: string; phone?: string; position?: string } | null>(null);

  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [total, setTotal] = useState(0);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [filterType, setFilterType] = useState('all');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('');
  const [dateError, setDateError] = useState('');

  const [editActivity, setEditActivity] = useState<ClientActivity | null>(null);
  const [detailActivity, setDetailActivity] = useState<ClientActivity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const highlightedRef = useRef<HTMLElement | null>(null);

  const [formData, setFormData] = useState({
    type: 'appel' as ActivityTypeKey,
    direction: 'sortant',
    subject: '',
    description: '',
    activity_date: new Date().toISOString().slice(0, 10),
    activity_time: new Date().toTimeString().slice(0, 5),
    has_reminder: false,
    reminder_date: '',
    reminder_time: '09:00',
    is_important: false,
    visit_property_id: '',
    visit_buyer_id: '',
    visit_seller_id: '',
  });

  useEffect(() => {
    api.get<any>('/auth/me').then((u: any) => {
        if (u) {
          const name = [u.first_name || '', u.last_name || ''].filter(Boolean).join(' ').trim() || u.email || '';
          setCurrentUser({ id: u.id, name, role: u.role || '', email: u.email || '', phone: u.phone || '', position: u.position || '' });
        }
    }).catch(() => {});
  }, []);

  const [visitProperties, setVisitProperties] = useState<any[]>([]);
  const [visitCounterparts, setVisitCounterparts] = useState<any[]>([]);
  const [visitPropertySearch, setVisitPropertySearch] = useState('');
  const [visitBuyerSearch, setVisitBuyerSearch] = useState('');
  const [selectedVisitSeller, setSelectedVisitSeller] = useState<any>(null);

  const [bonDeVisiteActivity, setBonDeVisiteActivity] = useState<ClientActivity | null>(null);
  const [bonDeVisiteProperty, setBonDeVisiteProperty] = useState<any>(null);
  const [bonDeVisiteBuyer, setBonDeVisiteBuyer] = useState<any>(null);
  const [bonDeVisiteBuyerContact, setBonDeVisiteBuyerContact] = useState<any>(null);
  const [bonDeVisiteLoading, setBonDeVisiteLoading] = useState(false);
  const bonDeVisiteRef = useRef<HTMLDivElement>(null);

  const isVendeur = String(client.type || '').toLowerCase() === 'vendeur';
  const isAcheteur = String(client.type || '').toLowerCase() === 'acheteur';
  const isBailleur = String(client.type || '').toLowerCase() === 'bailleur';
  const isLocataire = String(client.type || '').toLowerCase() === 'locataire';
  const isVoyageur = String(client.type || '').toLowerCase() === 'voyageur';
  const isRentalSide = isBailleur || isLocataire || isVoyageur;

  useEffect(() => {
    if (!showForm || formData.type !== 'visite') return;
    let cancelled = false;
    if (isVendeur) {
      api.get<any[]>('/properties', { client_id: clientId, status: 'for_sale' })
        .then((props) => {
          if (cancelled) return;
          setVisitProperties((props || []).filter((p: any) => p.transactionType === 'vente' && p.status === 'for_sale'));
        })
        .catch(() => {});
      api.get<any[]>('/clients', { type: 'Acheteur' })
        .then((clients) => {
          if (cancelled) return;
          setVisitCounterparts((clients || []).filter((c: any) => (c.statutMetier || '') === 'En recherche'));
        })
        .catch(() => {});
    } else if (isAcheteur) {
      api.get<any[]>('/properties', { status: 'for_sale' })
        .then((props) => {
          if (cancelled) return;
          setVisitProperties((props || []).filter((p: any) => p.transactionType === 'vente' && p.status === 'for_sale'));
        })
        .catch(() => {});
    } else if (isBailleur) {
      const fetchBailleurProps = async () => {
        const props: any[] = [];
        try {
          const owned = await api.get<any[]>('/properties', { client_id: clientId });
          props.push(...(owned || []));
        } catch { /* ignore */ }
        const bienConcerne = (client as any).bienConcerneId;
        if (bienConcerne) {
          try {
            const p = await api.get<any>(`/properties/${bienConcerne}`);
            if (p && !props.some((x: any) => String(x.id) === String(p.id))) props.push(p);
          } catch { /* ignore */ }
        }
        if (cancelled) return;
        setVisitProperties(props.filter((p: any) => {
          const tx = String(p.transactionType || '').toLowerCase();
          const st = String(p.status || '').toLowerCase();
          return (tx === 'location' || tx === 'location_ld' || tx === 'location_saisonniere')
            && (st === 'for_rent' || st === 'available');
        }));
      };
      fetchBailleurProps();
      Promise.all([
        api.get<any[]>('/clients', { type: 'Locataire' }).catch(() => []),
        api.get<any[]>('/clients', { type: 'Voyageur' }).catch(() => []),
      ])
        .then(([locataires, voyageurs]) => {
          if (cancelled) return;
          setVisitCounterparts([...(locataires || []), ...(voyageurs || [])]
            .filter((c: any) => (c.statutMetier || '') === 'En recherche'));
        })
        .catch(() => {});
    } else if (isLocataire || isVoyageur) {
      api.get<any[]>('/properties')
        .then((props) => {
          if (cancelled) return;
          const txs = isVoyageur
            ? ['location', 'location_ld', 'location_saisonniere']
            : ['location', 'location_ld'];
          setVisitProperties((props || []).filter((p: any) => {
            const tx = String(p.transactionType || '').toLowerCase();
            const st = String(p.status || '').toLowerCase();
            return txs.includes(tx) && (st === 'for_rent' || st === 'available');
          }));
        })
        .catch(() => {});
    }
    return () => { cancelled = true; };
  }, [showForm, formData.type, isVendeur, isAcheteur, isBailleur, isLocataire, isVoyageur, clientId]);

  useEffect(() => {
    if (!formData.visit_property_id) {
      setSelectedVisitSeller(null);
      return;
    }
    const prop = visitProperties.find((p: any) => String(p.id) === formData.visit_property_id);
    const sellerId = prop?.clientId || formData.visit_seller_id;
    if (!sellerId) {
      setSelectedVisitSeller(null);
      return;
    }
    let cancelled = false;
    api.get<any>(`/clients/${sellerId}`)
      .then((c) => { if (!cancelled) setSelectedVisitSeller(c); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [formData.visit_property_id, formData.visit_seller_id, visitProperties]);

  const filteredVisitProperties = visitProperties.filter((p: any) => {
    if (!visitPropertySearch) return true;
    const q = visitPropertySearch.toLowerCase();
    return [p.title, p.reference, p.address, p.city, p.district, p.location]
      .some((f) => String(f || '').toLowerCase().includes(q));
  });

  const filteredVisitCounterparts = visitCounterparts.filter((c: any) => {
    if (!visitBuyerSearch) return true;
    const q = visitBuyerSearch.toLowerCase();
    return [c.name, c.firstName, c.lastName, c.email, c.phone, c.address]
      .some((f) => String(f || '').toLowerCase().includes(q));
  });

  const selectedVisitProperty = visitProperties.find((p: any) => String(p.id) === formData.visit_property_id) || null;
  const selectedVisitCounterpart = visitCounterparts.find((c: any) => String(c.id) === formData.visit_buyer_id) || null;

  const openBonDeVisite = async (a: ClientActivity) => {
    setBonDeVisiteActivity(a);
    setBonDeVisiteProperty(null);
    setBonDeVisiteBuyer(null);
    setBonDeVisiteBuyerContact(null);
    setBonDeVisiteLoading(true);
    try {
      if (a.visit_property_id) {
        const p = await api.get<any>(`/properties/${a.visit_property_id}`);
        setBonDeVisiteProperty(p);
      }
      if (a.visit_buyer_id) {
        const b = await api.get<any>(`/clients/${a.visit_buyer_id}`);
        setBonDeVisiteBuyer(b);
        if (b?.contactId) {
          try {
            const c = await api.get<any>(`/contacts/${b.contactId}`);
            setBonDeVisiteBuyerContact(c);
          } catch {
            // contact unavailable — fall back to client fields
          }
        }
      }
    } catch {
      // ignore — Bon de visite still renders with available data
    } finally {
      setBonDeVisiteLoading(false);
    }
  };

  const handlePrintBonDeVisite = useReactToPrint({
    contentRef: bonDeVisiteRef,
    documentTitle: 'Bon de visite',
  });

  const handleDownloadBonDeVisite = async () => {
    if (!bonDeVisiteActivity) return;
    try {
      const esc = (v: any) =>
        String(v ?? '').replace(/[&<>"']/g, (c: string) =>
          ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
        );

      let logoSrc = '/CRM_Official_Image.jfif';
      try {
        const res = await fetch(logoSrc);
        const blob = await res.blob();
        logoSrc = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch {
        // relative path kept as fallback
      }

      const mandateNumber =
        bonDeVisiteProperty?.mandate_numeroMandat ||
        bonDeVisiteProperty?.mandate?.numeroMandat ||
        client.numeroMandat ||
        '';
      const buyerAddress = resolveBuyerAddress();
      const buyerName = bonDeVisiteBuyer?.name || 'Non renseigné';
      const buyerPhone = bonDeVisiteBuyer?.phone || '';
      const buyerEmail = bonDeVisiteBuyer?.email || '';
      const agentName = currentUser?.name || bonDeVisiteActivity.author_name || 'Non renseigné';
      const agentPhone = currentUser?.phone || '';
      const agentEmail = currentUser?.email || '';
      const propertyTitle = bonDeVisiteProperty?.title || 'Bien non renseigné';
      const propertyRef = bonDeVisiteProperty?.reference || '';
      const isVenteVisit = String(bonDeVisiteProperty?.transactionType || '').toLowerCase() === 'vente';
      const visitorSectionTitle = isVenteVisit ? "Coordonnées de l'acheteur" : "Coordonnées du visiteur";
      const visitorSignatureTitle = isVenteVisit ? "Signature de l'acheteur" : "Signature du visiteur";
      const propertyLocation =
        [bonDeVisiteProperty?.address, bonDeVisiteProperty?.district, bonDeVisiteProperty?.city]
          .filter(Boolean).join(', ') || bonDeVisiteProperty?.location || 'Adresse non renseignée';
      const visitDate = formatDateLong(bonDeVisiteActivity.activity_date);
      const headerDate = formatDateTime(bonDeVisiteActivity.activity_date);

      const buyerDetails =
        [
          buyerPhone && `<div class="row">Tél : ${esc(buyerPhone)}</div>`,
          buyerEmail && `<div class="row">Email : ${esc(buyerEmail)}</div>`,
          buyerAddress && `<div class="row">Adresse : ${esc(buyerAddress)}</div>`,
        ].filter(Boolean).join('') || '<div class="row">Aucune coordonnée disponible</div>';

      const agentDetails =
        [
          agentPhone && `<div class="row">Tél : ${esc(agentPhone)}</div>`,
          agentEmail && `<div class="row">Email : ${esc(agentEmail)}</div>`,
          currentUser?.position && `<div class="row">Fonction : ${esc(currentUser.position)}</div>`,
        ].filter(Boolean).join('') || '<div class="row">Aucune coordonnée disponible</div>';

      const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Bon de visite</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; color: #1e293b; padding: 32px 16px; }
  .page { max-width: 820px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,.08); }
  .header { background: linear-gradient(135deg, #2c8264, #1d694f); color: #fff; padding: 20px 24px; display: flex; align-items: center; gap: 12px; }
  .header img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,.3); }
  .header .agency { flex: 1; }
  .header h1 { font-size: 20px; line-height: 1.2; }
  .header p { font-size: 12px; color: rgba(255,255,255,.75); }
  .header .right { text-align: right; }
  .header .right .label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,.65); font-weight: 600; }
  .header .right .date { font-size: 14px; font-weight: 600; margin-top: 2px; }
  .body { padding: 24px; }
  .section { margin-bottom: 20px; }
  .section h4 { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #0f766e; margin-bottom: 6px; font-weight: 700; }
  .card { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 8px; padding: 12px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .row { font-size: 12px; color: #475569; margin-top: 4px; }
  .name { font-size: 14px; font-weight: 600; color: #1e293b; }
  .sig { border: 1px dashed #94a3b8; border-radius: 8px; height: 96px; margin-top: 20px; display: flex; align-items: flex-end; justify-content: flex-end; padding: 8px 12px; font-size: 11px; color: #94a3b8; }
  .foot { text-align: right; font-size: 10px; color: #94a3b8; margin-top: 12px; }
  @media print { body { background: #fff; padding: 0; } .page { border: none; box-shadow: none; border-radius: 0; max-width: none; } }
</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <img src="${logoSrc}" alt="CRM Immobilier" />
      <div class="agency">
        <h1>CRM Immobilier</h1>
        <p>Agence immobilière</p>
      </div>
      <div class="right">
        <div class="label">Bon de visite</div>
        <div class="date">${esc(headerDate)}</div>
      </div>
    </div>
    <div class="body">
      <div class="section">
        <h4>Objet</h4>
        <p style="font-size:14px;line-height:1.6;">Atteste qu'une visite a bien eu lieu par l'intermédiaire de l'agence <strong>CRM Immobilier</strong>.</p>
      </div>
      <div class="grid">
        <div class="section">
          <h4>${esc(visitorSectionTitle)}</h4>
          <div class="card">
            <div class="name">${esc(buyerName)}</div>
            ${buyerDetails}
          </div>
        </div>
        <div class="section">
          <h4>Coordonnées de l'agent responsable</h4>
          <div class="card">
            <div class="name">${esc(agentName)}</div>
            ${agentDetails}
          </div>
        </div>
      </div>
      <div class="section">
        <h4>Description du bien</h4>
        <div class="card">
          <div class="name">${esc(propertyTitle)}${propertyRef ? ` <span style="color:#94a3b8;font-weight:400;">— ${esc(propertyRef)}</span>` : ''}</div>
          <div class="row">Adresse : ${esc(propertyLocation)}</div>
        </div>
      </div>
      <div class="grid">
        <div class="section">
          <h4>Date de la visite</h4>
          <div class="name">${esc(visitDate)}</div>
        </div>
        <div class="section">
          <h4>Numéro de mandat</h4>
          <div class="name">${esc(mandateNumber || '—')}</div>
        </div>
      </div>
      <div class="sig">${esc(visitorSignatureTitle)}</div>
      <div class="foot">Bon de visite — ${esc(bonDeVisiteActivity.subject || headerDate)}</div>
    </div>
  </div>
</body>
</html>`;

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bon-de-visite-${bonDeVisiteActivity.activity_date ? String(bonDeVisiteActivity.activity_date).slice(0, 10) : 'visite'}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // ignore download errors
    }
  };

  const formatDateLong = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const resolveBuyerAddress = () => {
    const c: any = bonDeVisiteBuyerContact;
    const contactParts = [
      c?.adresse,
      c?.adresse2,
      c?.ville ? [c?.codePostal, c?.ville].filter(Boolean).join(' ') : '',
    ].filter(Boolean).join(', ');
    if (contactParts) return contactParts;
    return (
      bonDeVisiteBuyer?.address ||
      bonDeVisiteBuyer?.adresseComplete ||
      bonDeVisiteBuyer?.data?.address ||
      ''
    );
  };

  useEffect(() => {
    if (filterFrom && filterTo && filterFrom === filterTo) {
      setDateError('Les dates ne peuvent pas etre identiques');
    } else if (filterFrom && filterTo && filterFrom > filterTo) {
      setDateError('La date debut doit etre avant la date fin');
    } else if ((filterFrom && filterTo && filterFrom > filterTo) === false) {
      setDateError('');
    }
  }, [filterFrom, filterTo]);

  const scrollToActivity = useCallback((activityId: number) => {
    const el = document.getElementById(`activity-${activityId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightedRef.current = el;
      el.classList.add('ring-2', 'ring-accent/40', 'ring-offset-2', 'bg-accent/[0.06]');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-accent/40', 'ring-offset-2', 'bg-accent/[0.06]');
      }, 3000);
    }
  }, []);

  useEffect(() => {
    if (highlightActivityId && !loading && activities.length > 0) {
      const timer = setTimeout(() => scrollToActivity(highlightActivityId), 200);
      return () => clearTimeout(timer);
    }
  }, [highlightActivityId, loading, activities, scrollToActivity]);

  const LIMIT = 20;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = { page: String(page), limit: String(LIMIT) };
        if (filterType !== 'all') params.type = filterType;
        if (filterSearch) params.search = filterSearch;
        if (filterFrom) params.from = filterFrom;
        if (filterTo) params.to = filterTo;
        if (filterAuthor) params.author = filterAuthor;
        const data = await fetchClientActivities(clientId, params);
        if (cancelled) return;
        setActivities(data?.activities || []);
        setTotal(data?.total || 0);
        if (data?.typeCounts) setTypeCounts(data.typeCounts);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load activities:', err);
          setActivities([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; controller.abort(); };
  }, [clientId, page, filterType, filterSearch, filterFrom, filterTo, filterAuthor, refreshKey]);

  const resetForm = () => {
    setFormData({
      type: 'appel', direction: 'sortant', subject: '', description: '',
      activity_date: new Date().toISOString().slice(0, 10),
      activity_time: new Date().toTimeString().slice(0, 5),
      has_reminder: false, reminder_date: '', reminder_time: '09:00', is_important: false,
      visit_property_id: '', visit_buyer_id: '', visit_seller_id: '',
    });
  };

  const handleSubmit = async () => {
    if (!formData.subject.trim()) return toast('info', 'Le sujet est requis');

    if (formData.type === 'visite' && !canVisite) {
      return toast('error', "Vous n'avez pas le droit de gérer les visites");
    }

    if (formData.has_reminder) {
      if (!formData.reminder_date) return toast('info', 'La date du rappel est requise');
      if (!formData.reminder_time) return toast('info', "L'heure du rappel est requise");
      const activityDt = new Date(`${formData.activity_date}T${formData.activity_time}`);
      const reminderDt = new Date(`${formData.reminder_date}T${formData.reminder_time}`);
      if (reminderDt >= activityDt) {
        return toast('info', 'La date et heure du rappel doivent etre avant la date et heure de l\'activite');
      }
    }

    try {
      const dt = new Date(`${formData.activity_date}T${formData.activity_time}`);
      const payload: Partial<ClientActivity> = {
        type: formData.type,
        direction: formData.type === 'note' || formData.type === 'alerte' ? '' : formData.direction,
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        activity_date: dt.toISOString(),
        has_reminder: formData.has_reminder,
        reminder_date: formData.has_reminder && formData.reminder_date ? new Date(`${formData.reminder_date}T${formData.reminder_time}`).toISOString() : null,
        is_important: formData.is_important,
        visit_property_id: formData.type === 'visite' && formData.visit_property_id ? Number(formData.visit_property_id) : null,
        visit_buyer_id: formData.type === 'visite' ? (formData.visit_buyer_id ? Number(formData.visit_buyer_id) : (isAcheteur || isLocataire || isVoyageur ? Number(clientId) : null)) : null,
        visit_seller_id: formData.type === 'visite' ? (formData.visit_seller_id ? Number(formData.visit_seller_id) : (isVendeur ? Number(clientId) : (isBailleur ? Number(clientId) : null))) : null,
      };
      if (editActivity) {
        await updateClientActivity(clientId, editActivity.id, payload);
        toast('success', 'Activité modifiée');
      } else {
        await createClientActivity(clientId, payload);
        toast('success', 'Activité ajoutée');
      }
      setShowForm(false);
      setEditActivity(null);
      resetForm();
      setRefreshKey(k => k + 1);
    } catch {
      toast('error', "Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteClientActivity(clientId, id);
      toast('success', 'Activité supprimée');
      setDeleteConfirm(null);
      setRefreshKey(k => k + 1);
    } catch {
      toast('error', 'Erreur lors de la suppression');
    }
  };

  const openEdit = (a: ClientActivity) => {
    const dt = new Date(a.activity_date);
    const rdt = a.reminder_date ? new Date(a.reminder_date) : null;
    setFormData({
      type: a.type as ActivityTypeKey,
      direction: a.direction || 'sortant',
      subject: a.subject,
      description: a.description,
      activity_date: dt.toISOString().slice(0, 10),
      activity_time: dt.toTimeString().slice(0, 5),
      has_reminder: a.has_reminder,
      reminder_date: rdt ? rdt.toISOString().slice(0, 10) : '',
      reminder_time: rdt ? rdt.toTimeString().slice(0, 5) : '09:00',
      is_important: a.is_important,
      visit_property_id: a.visit_property_id ? String(a.visit_property_id) : '',
      visit_buyer_id: a.visit_buyer_id ? String(a.visit_buyer_id) : '',
      visit_seller_id: a.visit_seller_id ? String(a.visit_seller_id) : '',
    });
    setEditActivity(a);
    setShowForm(true);
  };

  const getTypeMeta = (key: string) => getActivityTypes(isGerant).find(t => t.key === key) || getActivityTypes(isGerant)[6];

  const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
    en_attente: { label: 'En attente', color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
    confirme:   { label: 'Confirmé',   color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    termine:    { label: 'Terminé',    color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    annule:     { label: 'Annulé',     color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  };
  const DEFAULT_STATUS = { label: 'En attente', color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' };

  const handleStatusChange = async (activity: ClientActivity, newStatus: string) => {
    try {
      await updateClientActivity(clientId, activity.id, { status: newStatus } as Partial<ClientActivity>);
      toast('success', `Rendez-vous ${STATUS_META[newStatus]?.label || newStatus}`);
      setRefreshKey(k => k + 1);
    } catch {
      toast('error', "Erreur lors du changement de statut");
    }
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
      d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };
  const formatRelativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "a l'instant";
    if (mins < 60) return `il y a ${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `il y a ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `il y a ${days}j`;
    return formatDateTime(iso);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      <style>{`
        @keyframes slideDownSoft { 0% { opacity:0; max-height:0; transform:translateY(-8px); } 100% { opacity:1; max-height:2000px; transform:translateY(0); } }
        @keyframes slideUpSoft { 0% { opacity:1; max-height:2000px; } 100% { opacity:0; max-height:0; transform:translateY(-8px); } }
        @keyframes staggerFadeIn { 0% { opacity:0; transform:translateY(12px); } 100% { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
        @keyframes popIn { 0% { transform:scale(0.8); opacity:0; } 60% { transform:scale(1.05); } 100% { transform:scale(1); opacity:1; } }
        @keyframes pulseGlow { 0%,100% { box-shadow:0 0 0 0 rgba(79,70,229,0); } 50% { box-shadow:0 0 0 6px rgba(79,70,229,0.1); } }
        @keyframes timelineDot { 0% { transform:scale(0); } 60% { transform:scale(1.3); } 100% { transform:scale(1); } }
        @keyframes lineGrow { 0% { height:0; } 100% { height:100%; } }
        @keyframes highlightFade { 0% { box-shadow:0 0 0 4px rgba(79,70,229,0.3); background:rgba(79,70,229,0.08); } 100% { box-shadow:none; background:transparent; } }
        .animate-slide-down-soft { animation: slideDownSoft 0.35s cubic-bezier(0.4,0,0.2,1) forwards; }
        .animate-stagger { animation: staggerFadeIn 0.4s cubic-bezier(0.4,0,0.2,1) forwards; opacity:0; }
        .skeleton-shimmer { background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size:800px 100%; animation:shimmer 1.5s infinite linear; }
        .animate-pop-in { animation: popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .animate-pulse-glow { animation: pulseGlow 2s ease-in-out infinite; }
        .timeline-dot-anim { animation: timelineDot 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .timeline-line-anim { animation: lineGrow 0.6s ease-out forwards; }
      `}</style>

      <div className="space-y-5">
        {/* Hero Header — staged */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur-sm sm:p-5 ${isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70 shadow-sm'}`}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(80% 120% at 100% 0%, ${accent.a}1F, transparent 60%)` }}
          />
          <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:gap-6">
            {/* Left — title + counts */}
            <div className="flex min-w-0 items-start gap-3 xl:w-[290px] xl:shrink-0">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border"
                style={isDark
                  ? { background: `${accent.a}14`, borderColor: `${accent.a}30`, color: accent.a }
                  : { background: `${accent.a}12`, borderColor: `${accent.a}30`, color: ink }}
              >
                <MessageSquare size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className={`text-sm font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Notes & Activité</h3>
                <p className={`mt-0.5 truncate text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{client.name}</span>
                  <span className="mx-1.5 opacity-40">—</span>
                  Journal de bord des interactions
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-extrabold tabular-nums backdrop-blur-md ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200/80 bg-white/70'}`}
                    style={{ color: isDark ? accent.a : accent.b }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent.line, boxShadow: `0 0 6px ${accent.glow}` }} />
                    {total}
                    <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>activité{total > 1 ? 's' : ''}</span>
                  </span>
                  {activities.filter(a => a.is_important).length > 0 && (
                    <StagePill label={`${activities.filter(a => a.is_important).length} important${activities.filter(a => a.is_important).length > 1 ? 's' : ''}`} hue={STAGE_HUES.amber} isDark={isDark} />
                  )}
                  {activities.filter(a => a.has_reminder).length > 0 && (
                    <StagePill label={`${activities.filter(a => a.has_reminder).length} rappel${activities.filter(a => a.has_reminder).length > 1 ? 's' : ''}`} hue={STAGE_HUES.sky} isDark={isDark} />
                  )}
                </div>
              </div>
            </div>
            {/* Divider */}
            <div aria-hidden="true" className={`hidden w-px self-stretch xl:block ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
            {/* Center — search */}
            <div className="min-w-0 flex-1">
              <div className="relative min-w-0">
                <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: isDark ? '#8B7CFF' : '#0D9488' }} />
                <input
                  type="text"
                  placeholder="Rechercher une activité..."
                  value={filterSearch}
                  onChange={e => { setFilterSearch(e.target.value); setPage(1); }}
                  className={stageInput('h-9 pl-9 pr-9')}
                />
                {filterSearch && (
                  <button
                    type="button"
                    onClick={() => { setFilterSearch(''); setPage(1); }}
                    aria-label="Effacer la recherche"
                    className={`absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-teal-900/40 hover:bg-teal-900/5 hover:text-teal-900'}`}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
            {/* Divider */}
            <div aria-hidden="true" className={`hidden w-px self-stretch xl:block ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
            {/* Right — actions */}
            <div className="flex shrink-0 items-center gap-2 xl:ml-0">
              <button
                type="button"
                onClick={() => setRefreshKey(k => k + 1)}
                title="Rafraîchir"
                className={`inline-flex items-center justify-center gap-2 rounded-xl border p-2.5 backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white text-slate-600 shadow-sm hover:text-slate-900'}`}
              >
                <RefreshCw size={14} />
              </button>
              <button
                type="button"
                onClick={() => { resetForm(); setEditActivity(null); setShowForm(true); }}
                className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 px-3.5 py-2 text-xs font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95 sm:flex-none"
                style={isGerant
                  ? { backgroundImage: `linear-gradient(145deg, ${accent.a} 0%, ${accent.b} 100%)`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 26px -10px ${accent.glow}` }
                  : isDark
                    ? { backgroundImage: 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 26px -8px rgba(124,92,255,0.65)' }
                    : { backgroundImage: 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 26px -10px rgba(13,148,136,0.6)' }}
              >
                <Plus size={14} className="transition-transform duration-300 group-hover:rotate-90" />
                Nouvelle activité
              </button>
            </div>
          </div>
          {/* Filter row — type segments + period on one line, integrated in hero */}
          <div
            className="relative mt-4 flex flex-col gap-2.5 border-t pt-4 xl:flex-row xl:items-center"
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(13,148,136,0.12)' }}
          >
            <div className={`flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-xl border p-1 backdrop-blur-sm scrollbar-thin ${isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70 shadow-sm'}`}>
              {[{ key: 'all' }, ...getActivityTypes(isGerant).slice(0, 5)].map(entry => {
                const key = entry.key;
                const on = filterType === key;
                const label = key === 'all' ? 'Tous' : (entry as any)?.label;
                const SegIcon = key === 'all' ? Grid : (entry as any)?.icon;
                const segCount = key === 'all' ? total : (typeCounts[key] || 0);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setFilterType(key); setPage(1); }}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all duration-200 ${on ? 'text-white shadow-sm' : isDark ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'text-slate-500 hover:bg-slate-900/[0.04] hover:text-slate-900'}`}
style={on ? (isGerant
  ? { background: `linear-gradient(145deg, ${accent.a}, ${accent.b})` }
  : isDark
                        ? { background: 'linear-gradient(145deg, #8B7CFF, #6C5ECF)' }
                        : { background: 'linear-gradient(145deg, #2DD4BF, #0D9488)' }) : undefined}
                  >
                    {SegIcon && <SegIcon size={12} className="shrink-0" />}
                    {label}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold tabular-nums ${
                        on
                          ? 'bg-white/25 text-white'
                          : isDark
                            ? 'bg-white/[0.06] text-slate-400'
                            : 'bg-slate-900/[0.05] text-slate-500'
                      }`}
                    >
                      {segCount}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 xl:flex-nowrap">
              <span className={`mr-1 inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.14em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <Calendar size={12} />
                Période
              </span>
              <span className={`shrink-0 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Du</span>
              <div className="w-[190px] shrink-0">
                <DatePicker
                  value={filterFrom}
                  max={filterTo || undefined}
                  onChange={e => {
                    const val = e.target.value;
                    if (filterTo && val && val >= filterTo) {
                      setDateError('La date debut doit etre avant la date fin');
                      return;
                    }
                    setDateError('');
                    setFilterFrom(val);
                    setPage(1);
                  }}
                  className={dateError ? '!border-rose-400/60' : ''}
                />
              </div>
              <span aria-hidden="true" className={`h-0.5 w-4 shrink-0 rounded-full ${isDark ? 'bg-white/15' : 'bg-slate-300'}`} />
              <span className={`shrink-0 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Au</span>
              <div className="w-[190px] shrink-0">
                <DatePicker
                  value={filterTo}
                  min={filterFrom || undefined}
                  onChange={e => {
                    const val = e.target.value;
                    if (filterFrom && val && val <= filterFrom) {
                      setDateError('La date fin doit etre apres la date debut');
                      return;
                    }
                    setDateError('');
                    setFilterTo(val);
                    setPage(1);
                  }}
                  className={dateError ? '!border-rose-400/60' : ''}
                />
              </div>
              {(filterType !== 'all' || filterSearch || filterFrom || filterTo || filterAuthor) && (
                <button
                  type="button"
                  onClick={() => { setFilterType('all'); setFilterSearch(''); setFilterFrom(''); setFilterTo(''); setFilterAuthor(''); setDateError(''); setPage(1); }}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white text-slate-500 shadow-sm hover:text-slate-900'}`}
                >
                  <X size={12} /> Réinitialiser
                </button>
              )}
            </div>
          </div>
          {dateError && (
            <p className={`relative mt-2.5 flex items-center gap-1.5 text-[11px] font-medium ${isDark ? 'text-rose-300' : 'text-red-500'}`}>
              <AlertCircle size={12} />
              {dateError}
            </p>
          )}
        </motion.div>

        {/* Stats — staged glass with type-hue accents */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {getActivityTypes(isGerant).map((t, i) => {
            const Icon = t.icon;
            const count = typeCounts[t.key] || 0;
            const hue = activityTypeHue(t.key);
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <motion.button
                key={t.key}
                type="button"
                onClick={() => { setFilterType(filterType === t.key ? 'all' : t.key); setPage(1); }}
                title={`Filtrer : ${t.label}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={`group relative overflow-hidden rounded-2xl border p-3.5 text-left backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] ${
                  isDark
                    ? 'border-white/[0.07] bg-white/[0.03] hover:border-white/[0.14]'
                    : 'border-slate-200/70 bg-white/70 shadow-sm hover:shadow-md'
                } ${filterType === t.key ? (isDark ? '!border-white/25' : '!border-teal-500/40') : ''}`}
                style={filterType === t.key ? { boxShadow: `0 0 0 1px ${hue.line}, 0 8px 24px -12px ${hue.glow}` } : undefined}
              >
                {/* Type-hue top accent */}
                <div
                  aria-hidden="true"
                  className={`absolute inset-x-3 top-0 h-[3px] rounded-full bg-gradient-to-r ${t.gradient} ${count > 0 ? 'opacity-80' : 'opacity-25'}`}
                />
                {/* Hue wash */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `radial-gradient(90% 100% at 50% 0%, ${hue.a}1A, transparent 70%)` }}
                />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-xl border shadow-sm transition-transform duration-200 group-hover:scale-110"
                      style={
                        isDark
                          ? { background: `${hue.a}14`, borderColor: `${hue.a}30`, color: hue.a, boxShadow: `0 0 12px ${hue.glow}` }
                          : { background: `${hue.a}12`, borderColor: `${hue.a}30`, color: hue.b }
                      }
                    >
                      <Icon size={14} />
                    </div>
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-extrabold tabular-nums"
                      style={
                        isDark
                          ? { background: `${hue.a}14`, color: hue.a, border: `1px solid ${hue.a}30` }
                          : { background: `${hue.a}12`, color: hue.b, border: `1px solid ${hue.a}30` }
                      }
                    >
                      {pct}%
                    </span>
                  </div>
                  <p className={`text-[10px] font-bold uppercase tracking-[0.12em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.label}</p>
                  <p className={`text-xl font-extrabold mt-0.5 tabular-nums leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {count}
                    <span className={`ml-1 text-[10px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {count > 1 ? 'activités' : 'activité'}
                    </span>
                  </p>
                  {/* Share bar */}
                  <div className={`mt-2.5 h-1 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-900/10'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.2 + i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className={`h-full rounded-full bg-gradient-to-r ${t.gradient}`}
                      style={{ boxShadow: count > 0 ? `0 0 8px ${hue.glow}` : undefined }}
                    />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Form — staged */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70 shadow-sm'}`}
          >
            <div
              className="absolute inset-x-0 top-0 z-10 h-[3px]"
              style={{ background: `linear-gradient(90deg, ${accent.a}, ${accent.b})`, boxShadow: `0 0 14px ${accent.glow}` }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ background: isDark ? `radial-gradient(100% 70% at 50% 0%, ${accent.a}14, transparent 62%)` : `radial-gradient(100% 70% at 50% 0%, ${accent.a}0D, transparent 62%)` }}
            />
            <div className="relative p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border"
                    style={isDark
                      ? { background: `${accent.a}14`, borderColor: `${accent.a}30`, color: accent.a }
                      : { background: `${accent.a}12`, borderColor: `${accent.a}30`, color: ink }}
                  >
                    <Zap size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{editActivity ? 'Modifier l\'activité' : 'Nouvelle activité'}</p>
                    <p className={`mt-0.5 truncate text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {editActivity ? 'Modifiez les détails de cette activité' : 'Consignez un échange avec ce client'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowForm(false); setEditActivity(null); }}
                  aria-label="Fermer"
                  className={`shrink-0 rounded-xl border p-2 backdrop-blur-md transition-all duration-200 hover:rotate-90 hover:scale-[1.05] active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:bg-red-400/15 hover:text-red-300' : 'border-slate-200/80 bg-white text-slate-400 shadow-sm hover:bg-red-50 hover:text-red-500'}`}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Type selector — staged */}
              <div className="mb-5">
                <div className="mb-2.5 flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border"
                    style={isDark
                      ? { background: `${accent.a}14`, borderColor: `${accent.a}30`, color: accent.a }
                      : { background: `${accent.a}12`, borderColor: `${accent.a}30`, color: ink }}
                  >
                    <Zap size={12} />
                  </span>
                  <h4 className={`shrink-0 text-[10px] font-extrabold uppercase tracking-[0.16em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Type d'activité
                  </h4>
                  <span
                    aria-hidden="true"
                    className="h-px flex-1"
                    style={{ background: isDark ? `linear-gradient(90deg, ${accent.a}30, transparent)` : `linear-gradient(90deg, ${accent.a}35, transparent)` }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {getActivityTypes(isGerant).map(t => {
                    const Icon = t.icon;
                    const active = formData.type === t.key;
                    const locked = t.key === 'visite' && !canVisite;
                    const thue = activityTypeHue(t.key);
                    return (
                      <button
                        key={t.key}
                        type="button"
                        disabled={locked}
                        onClick={() => setFormData(p => ({ ...p, type: t.key }))}
                        title={locked ? "Permission 'Visite' refusée" : t.label}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${
                          locked
                            ? `cursor-not-allowed border-dashed opacity-50 ${isDark ? 'border-white/15 text-slate-600' : 'border-slate-300 text-slate-400'}`
                            : active
                              ? ''
                              : isDark
                                ? 'border-white/[0.07] bg-white/[0.03] text-slate-400 hover:border-white/[0.14] hover:text-white'
                                : 'border-slate-200/70 bg-white/70 text-slate-600 shadow-sm hover:shadow'
                        }`}
                        style={active && !locked
                          ? isDark
                            ? { background: `${thue.a}14`, borderColor: `${thue.a}40`, color: thue.a, boxShadow: `0 0 16px ${thue.glow}` }
                            : { background: `${thue.a}14`, borderColor: `${thue.a}45`, color: thue.b, boxShadow: `0 4px 16px -8px ${thue.glow}` }
                          : undefined}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                            active && !locked ? 'bg-gradient-to-br text-white shadow-sm ' + t.gradient : isDark ? 'bg-white/[0.06] text-slate-500' : 'bg-slate-900/[0.05] text-slate-400'
                          }`}
                        >
                          {locked ? <Lock size={12} /> : <Icon size={12} className={active ? '' : undefined} style={active ? undefined : { color: isDark ? thue.a : thue.b }} />}
                        </span>
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Direction — staged */}
              {formData.type !== 'note' && formData.type !== 'alerte' && (
                <div className="mb-5">
                  <div className="mb-2.5 flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border"
                      style={isDark
                        ? { background: `${accent.a}14`, borderColor: `${accent.a}30`, color: accent.a }
                        : { background: `${accent.a}12`, borderColor: `${accent.a}30`, color: ink }}
                    >
                      <ArrowUpRight size={12} />
                    </span>
                    <h4 className={`shrink-0 text-[10px] font-extrabold uppercase tracking-[0.16em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Direction
                    </h4>
                    <span
                      aria-hidden="true"
                      className="h-px flex-1"
                      style={{ background: isDark ? `linear-gradient(90deg, ${accent.a}30, transparent)` : `linear-gradient(90deg, ${accent.a}35, transparent)` }}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {[
                      { val: 'sortant', label: 'Sortant', icon: ArrowUpRight, desc: 'Agent vers client', color: 'from-blue-500 to-cyan-500' },
                      { val: 'entrant', label: 'Entrant', icon: ArrowDownLeft, desc: 'Client vers agent', color: 'from-emerald-500 to-teal-500' },
                    ].map(d => {
                      const don = formData.direction === d.val;
                      return (
                        <button
                          key={d.val}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, direction: d.val }))}
                          className={`flex items-center gap-3 rounded-2xl border p-3 text-left backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] ${
                            don
                              ? ''
                              : isDark
                                ? 'border-white/[0.07] bg-white/[0.03] hover:border-white/[0.14]'
                                : 'border-slate-200/70 bg-white/70 shadow-sm hover:shadow'
                          }`}
                          style={don
                            ? isDark
                              ? { background: `${accent.a}12`, borderColor: `${accent.a}40`, boxShadow: `0 0 18px ${accent.glow}` }
                              : { background: `${accent.a}0F`, borderColor: `${accent.a}45`, boxShadow: `0 6px 18px -10px ${accent.glow}` }
                            : undefined}
                        >
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${d.color} text-white shadow-md transition-transform duration-200 ${don ? 'scale-105' : ''}`}>
                            <d.icon size={15} />
                          </span>
                          <span className="min-w-0">
                            <span className={`block text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{d.label}</span>
                            <span className={`block text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{d.desc}</span>
                          </span>
                          <span
                            className={`ml-auto h-2 w-2 shrink-0 rounded-full transition-all ${don ? '' : isDark ? 'bg-white/15' : 'bg-slate-300'}`}
                            style={don ? { background: accent.line, boxShadow: `0 0 8px ${accent.glow}` } : undefined}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Date & Time — staged */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
                <div>
                  <label className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <Calendar size={11} style={{ color: ink }} />
                    Date
                  </label>
                  <DatePicker
                    value={formData.activity_date}
                    onChange={e => setFormData(p => ({ ...p, activity_date: e.target.value }))}
                    className="!h-11"
                  />
                </div>
                <div>
                  <label className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <Clock size={11} style={{ color: ink }} />
                    Heure
                  </label>
                  <TimePicker
                    value={formData.activity_time}
                    onChange={e => setFormData(p => ({ ...p, activity_time: e.target.value }))}
                    className="!h-11"
                  />
                </div>
              </div>

              {/* Subject — staged */}
              <div className="mb-5">
                <label className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <FileText size={11} style={{ color: ink }} />
                  Sujet
                </label>
                <input
                  type="text" value={formData.subject}
                  onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
                  placeholder="Sujet de l'activité..."
                  className={stageInput('h-11')}
                />
              </div>

              {/* Description — staged */}
              <div className="mb-5">
                <label className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <MessageSquare size={11} style={{ color: ink }} />
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  rows={3} placeholder="Détails de l'activité..."
                  className={stageInput('min-h-[96px] py-2.5 resize-none')}
                />
              </div>

              {/* Visite — property + buyer/seller for Bon de visite, staged violet glass */}
              {formData.type === 'visite' && (isVendeur || isAcheteur || isRentalSide) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className={`mb-5 rounded-2xl border p-4 backdrop-blur-sm ${
                    isDark
                      ? 'border-violet-400/20 bg-violet-400/[0.06]'
                      : 'border-violet-200/70 bg-violet-50/60 shadow-sm'
                  }`}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border"
                      style={isDark
                        ? { background: 'rgba(167,139,250,0.12)', borderColor: 'rgba(167,139,250,0.30)', color: '#A78BFA' }
                        : { background: 'rgba(124,58,237,0.08)', borderColor: 'rgba(124,58,237,0.28)', color: '#6D28D9' }}
                    >
                      <MapPin size={12} />
                    </span>
                    <h4 className={`shrink-0 text-[10px] font-extrabold uppercase tracking-[0.16em] ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
                      Bon de visite
                    </h4>
                    <span
                      aria-hidden="true"
                      className="h-px flex-1"
                      style={{ background: isDark ? 'linear-gradient(90deg, rgba(167,139,250,0.35), transparent)' : 'linear-gradient(90deg, rgba(124,58,237,0.30), transparent)' }}
                    />
                  </div>

                  {/* Bien concerné */}
                  <div className="mb-4">
                    <label className={`block text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Bien concerné par la visite</label>
                    {formData.visit_property_id && selectedVisitProperty ? (
                      <div className={`flex items-center gap-2.5 rounded-xl border p-2.5 backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-white/75 shadow-sm'}`}>
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                          style={isDark
                            ? { background: 'rgba(52,211,153,0.12)', borderColor: 'rgba(52,211,153,0.30)', color: '#6EE7B7' }
                            : { background: 'rgba(5,150,105,0.08)', borderColor: 'rgba(5,150,105,0.28)', color: '#047857' }}
                        >
                          <Home size={14} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedVisitProperty.title}</p>
                          <p className={`text-[11px] truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {[selectedVisitProperty.address, selectedVisitProperty.city, selectedVisitProperty.district].filter(Boolean).join(', ') || selectedVisitProperty.reference}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, visit_property_id: '', visit_seller_id: '' }))}
                          aria-label="Retirer le bien"
                          className={`shrink-0 rounded-lg p-1.5 transition-all duration-200 ${isDark ? 'text-slate-500 hover:bg-red-400/15 hover:text-red-300' : 'text-slate-400 hover:bg-red-50 hover:text-red-500'}`}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <Search size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: isDark ? '#A78BFA' : '#6D28D9' }} />
                          <input
                            type="text"
                            value={visitPropertySearch}
                            onChange={e => setVisitPropertySearch(e.target.value)}
                            placeholder={isRentalSide ? 'Rechercher un bien à louer...' : 'Rechercher un bien en vente...'}
                            className={stageInput('h-9 pl-8 !text-xs')}
                          />
                        </div>
                        {visitPropertySearch && (
                          <div className={`mt-1.5 max-h-40 overflow-auto rounded-xl border backdrop-blur-xl scrollbar-thin ${isDark ? 'border-white/10 bg-[#141126]/95 shadow-xl' : 'border-slate-200/80 bg-white/95 shadow-lg'} divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-slate-100'}`}>
                            {filteredVisitProperties.length === 0 ? (
                              <p className={`px-3 py-2.5 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{isRentalSide ? 'Aucun bien à louer trouvé' : 'Aucun bien en vente trouvé'}</p>
                            ) : (
                              filteredVisitProperties.map((p: any) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => { setFormData(prev => ({ ...prev, visit_property_id: String(p.id), visit_seller_id: p.clientId ? String(p.clientId) : (isBailleur ? String(clientId) : prev.visit_seller_id) })); setVisitPropertySearch(''); }}
                                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-violet-50'}`}
                                >
                                  <span
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                                    style={isDark
                                      ? { background: 'rgba(52,211,153,0.12)', borderColor: 'rgba(52,211,153,0.30)', color: '#6EE7B7' }
                                      : { background: 'rgba(5,150,105,0.08)', borderColor: 'rgba(5,150,105,0.28)', color: '#047857' }}
                                  >
                                    <Home size={12} />
                                  </span>
                                  <div className="min-w-0">
                                    <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.title}</p>
                                    <p className={`text-xs truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                      {[p.address, p.city, p.district].filter(Boolean).join(', ') || p.reference}
                                    </p>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Acheteur concerné (vendeur side) / Locataire-Voyageur concerné (bailleur side) / Vendeur concerné (acheteur side) */}
                  {(isVendeur || isBailleur) ? (
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {isBailleur ? 'Locataire / Voyageur concerné par la visite' : 'Acheteur concerné par la visite'}
                    </label>
                    {formData.visit_buyer_id && selectedVisitCounterpart ? (
                      <div className={`flex items-center gap-2.5 rounded-xl border p-2.5 backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-white/75 shadow-sm'}`}>
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                          style={isDark
                            ? { background: 'rgba(56,189,248,0.12)', borderColor: 'rgba(56,189,248,0.30)', color: '#7DD3FC' }
                            : { background: 'rgba(2,132,199,0.08)', borderColor: 'rgba(2,132,199,0.28)', color: '#0369A1' }}
                        >
                          <User size={14} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedVisitCounterpart.name}</p>
                          <p className={`text-[11px] truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {[selectedVisitCounterpart.phone, selectedVisitCounterpart.email].filter(Boolean).join(' · ') || 'En recherche'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, visit_buyer_id: '' }))}
                          aria-label="Retirer la personne"
                          className={`shrink-0 rounded-lg p-1.5 transition-all duration-200 ${isDark ? 'text-slate-500 hover:bg-red-400/15 hover:text-red-300' : 'text-slate-400 hover:bg-red-50 hover:text-red-500'}`}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <Search size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: isDark ? '#A78BFA' : '#6D28D9' }} />
                          <input
                            type="text"
                            value={visitBuyerSearch}
                            onChange={e => setVisitBuyerSearch(e.target.value)}
                            placeholder={isBailleur ? 'Rechercher un locataire ou voyageur...' : 'Rechercher un acheteur...'}
                            className={stageInput('h-9 pl-8 !text-xs')}
                          />
                        </div>
                        {visitBuyerSearch && (
                          <div className={`mt-1.5 max-h-40 overflow-auto rounded-xl border backdrop-blur-xl scrollbar-thin ${isDark ? 'border-white/10 bg-[#141126]/95 shadow-xl' : 'border-slate-200/80 bg-white/95 shadow-lg'} divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-slate-100'}`}>
                            {filteredVisitCounterparts.length === 0 ? (
                              <p className={`px-3 py-2.5 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                {isBailleur ? 'Aucun locataire / voyageur en recherche trouvé' : 'Aucun acheteur en recherche trouvé'}
                              </p>
                            ) : (
                              filteredVisitCounterparts.map((c: any) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => { setFormData(prev => ({ ...prev, visit_buyer_id: String(c.id) })); setVisitBuyerSearch(''); }}
                                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-violet-50'}`}
                                >
                                  <span
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                                    style={isDark
                                      ? { background: 'rgba(56,189,248,0.12)', borderColor: 'rgba(56,189,248,0.30)', color: '#7DD3FC' }
                                      : { background: 'rgba(2,132,199,0.08)', borderColor: 'rgba(2,132,199,0.28)', color: '#0369A1' }}
                                  >
                                    <User size={12} />
                                  </span>
                                  <div className="min-w-0">
                                    <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.name}</p>
                                    <p className={`text-xs truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                      {[c.phone, c.email].filter(Boolean).join(' · ') || 'En recherche'}
                                    </p>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  ) : (
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{isAcheteur ? 'Vendeur concerné par la visite' : 'Bailleur concerné par la visite'}</label>
                    {selectedVisitSeller || selectedVisitProperty?.owner?.name ? (
                      <div className={`flex items-center gap-2.5 rounded-xl border p-2.5 backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-white/75 shadow-sm'}`}>
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                          style={isDark
                            ? { background: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.30)', color: '#FCD34D' }
                            : { background: 'rgba(217,119,6,0.08)', borderColor: 'rgba(217,119,6,0.28)', color: '#B45309' }}
                        >
                          <User size={14} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {selectedVisitSeller?.name || selectedVisitProperty?.owner?.name || (isAcheteur ? 'Vendeur non renseigné' : 'Bailleur non renseigné')}
                          </p>
                          <p className={`text-[11px] truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {[selectedVisitSeller?.phone, selectedVisitSeller?.email].filter(Boolean).join(' · ') || (isAcheteur ? 'Vendeur du bien sélectionné' : 'Bailleur du bien sélectionné')}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className={`flex items-center gap-2 rounded-xl border border-dashed px-3 py-2.5 backdrop-blur-sm ${isDark ? 'border-white/15 bg-white/[0.02] text-slate-500' : 'border-slate-300/80 bg-white/50 text-slate-500'}`}>
                        <User size={13} className="shrink-0 opacity-60" />
                        <p className="text-xs">{isAcheteur ? 'Sélectionnez un bien pour afficher le vendeur concerné' : 'Sélectionnez un bien pour afficher le bailleur concerné'}</p>
                      </div>
                    )}
                  </div>
                  )}
                </motion.div>
              )}

              {/* Toggles — staged switch cards */}
              <div className="mb-5">
                <div className="mb-2.5 flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border"
                    style={isDark
                      ? { background: `${accent.a}14`, borderColor: `${accent.a}30`, color: accent.a }
                      : { background: `${accent.a}12`, borderColor: `${accent.a}30`, color: ink }}
                  >
                    <Star size={12} />
                  </span>
                  <h4 className={`shrink-0 text-[10px] font-extrabold uppercase tracking-[0.16em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Options
                  </h4>
                  <span
                    aria-hidden="true"
                    className="h-px flex-1"
                    style={{ background: isDark ? `linear-gradient(90deg, ${accent.a}30, transparent)` : `linear-gradient(90deg, ${accent.a}35, transparent)` }}
                  />
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {[
                    { key: 'has_reminder' as const, label: 'Ajouter un rappel', desc: 'Date & heure de relance', icon: Bell },
                    { key: 'is_important' as const, label: 'Marquer comme important', desc: 'Mise en avant', icon: Star },
                  ].map(opt => {
                    const on = !!formData[opt.key];
                    const OptIcon = opt.icon;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, [opt.key]: !p[opt.key] }))}
                        className={`flex items-center gap-3 rounded-2xl border p-3 text-left backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] ${
                          on
                            ? ''
                            : isDark
                              ? 'border-white/[0.07] bg-white/[0.03] hover:border-white/[0.14]'
                              : 'border-slate-200/70 bg-white/70 shadow-sm hover:shadow'
                        }`}
                        style={on
                          ? isDark
                            ? { background: 'rgba(251,191,36,0.10)', borderColor: 'rgba(251,191,36,0.35)', boxShadow: '0 0 18px rgba(251,191,36,0.25)' }
                            : { background: 'rgba(217,119,6,0.07)', borderColor: 'rgba(217,119,6,0.35)', boxShadow: '0 6px 18px -10px rgba(217,119,6,0.4)' }
                          : undefined}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 ${
                            on ? 'border-transparent bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md' : isDark ? 'border-white/20 text-transparent' : 'border-slate-300 text-transparent'
                          }`}
                        >
                          <OptIcon size={12} className={opt.key === 'is_important' && on ? 'fill-white' : ''} />
                        </span>
                        <span className="min-w-0">
                          <span className={`block text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{opt.label}</span>
                          <span className={`block text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{opt.desc}</span>
                        </span>
                        <span
                          className={`relative ml-auto h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${isDark ? 'bg-white/10' : 'bg-slate-900/10'}`}
                          style={on ? { background: 'linear-gradient(145deg, #FBBF24, #D97706)' } : undefined}
                        >
                          <span
                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200 ${on ? 'left-[18px]' : 'left-0.5'}`}
                          />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reminder fields — staged amber */}
              {formData.has_reminder && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5 p-4 rounded-2xl border backdrop-blur-sm ${
                    isDark
                      ? 'border-amber-400/20 bg-amber-400/[0.06]'
                      : 'border-amber-200/70 bg-amber-50/70 shadow-sm'
                  }`}
                >
                  <div>
                    <label className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                      <Calendar size={11} />
                      Date du rappel
                    </label>
                    <DatePicker
                      value={formData.reminder_date}
                      max={formData.activity_date || undefined}
                      onChange={e => setFormData(p => ({ ...p, reminder_date: e.target.value }))}
                      className="!h-11"
                    />
                  </div>
                  <div>
                    <label className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                      <Clock size={11} />
                      Heure du rappel
                    </label>
                    <TimePicker
                      value={formData.reminder_time}
                      onChange={e => setFormData(p => ({ ...p, reminder_time: e.target.value }))}
                      className="!h-11"
                    />
                  </div>
                </motion.div>
              )}

              {/* Actions — staged */}
              <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditActivity(null); }}
                  className={`rounded-xl border px-5 py-2.5 text-xs font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white text-slate-600 shadow-sm hover:text-slate-900'}`}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!formData.subject.trim()}
                  className="rounded-xl border border-white/20 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
style={isGerant
  ? { backgroundImage: `linear-gradient(145deg, ${accent.a} 0%, ${accent.b} 100%)`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 26px -10px ${accent.glow}` }
  : isDark
                      ? { backgroundImage: 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 26px -8px rgba(124,92,255,0.65)' }
                      : { backgroundImage: 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 26px -10px rgba(13,148,136,0.6)' }}
                >
                  {editActivity ? 'Enregistrer les modifications' : 'Ajouter l\'activité'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* History — staged */}
        <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70 shadow-sm'}`}>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(80% 120% at 100% 0%, ${accent.a}14, transparent 60%)` }}
          />
          <div className={`relative px-5 py-4 border-b flex items-center justify-between ${isDark ? 'border-white/[0.07]' : 'border-slate-200/70'}`}>
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                style={isDark
                  ? { background: `${accent.a}14`, borderColor: `${accent.a}30`, color: accent.a }
                  : { background: `${accent.a}12`, borderColor: `${accent.a}30`, color: ink }}
              >
                <Clock size={13} />
              </span>
              <div>
                <h4 className={`text-xs font-extrabold uppercase tracking-[0.14em] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Historique
                </h4>
                <p className={`text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{total} activité{total > 1 ? 's' : ''} enregistrée{total > 1 ? 's' : ''}</p>
              </div>
            </div>
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              className={`p-2 rounded-xl border backdrop-blur-md transition-all duration-200 hover:scale-[1.05] active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white text-slate-500 shadow-sm hover:text-slate-900'}`}
              title="Rafraîchir"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {loading ? (
            <div className="relative flex flex-col items-center justify-center py-20">
              <div className="relative mb-4 h-14 w-14">
                <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: `${accent.a}30` }} />
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: accent.a }} />
                <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: `${accent.a}99`, animationDirection: 'reverse', animationDuration: '1.5s' }} />
                <MessageSquare size={16} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: ink }} />
              </div>
              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Chargement...</p>
              <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Récupération des activités</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="relative flex flex-col items-center justify-center py-16 text-center">
              <div
                className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border backdrop-blur-sm ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-500' : 'border-slate-200/70 bg-white/70 text-slate-400 shadow-sm'}`}
              >
                <MessageSquare size={22} />
              </div>
              <p className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Aucune activité</p>
              <p className={`mt-1 max-w-xs text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Commencez par ajouter une activité pour suivre vos échanges avec ce client</p>
              <button
                type="button"
                onClick={() => { resetForm(); setEditActivity(null); setShowForm(true); }}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-xs font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                style={isGerant
                  ? { backgroundImage: `linear-gradient(145deg, ${accent.a} 0%, ${accent.b} 100%)`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 26px -10px ${accent.glow}` }
                  : isDark
                    ? { backgroundImage: 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 26px -8px rgba(124,92,255,0.65)' }
                    : { backgroundImage: 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 26px -10px rgba(13,148,136,0.6)' }}
              >
                <Plus size={14} /> Nouvelle activité
              </button>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div
                aria-hidden="true"
                className="absolute bottom-0 left-[39px] top-0 w-px"
                style={{ background: `linear-gradient(to bottom, ${accent.a}40, transparent)` }}
              />

              <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-slate-200/70'}`}>
                {activities.map((a, i) => {
                  const tm = getTypeMeta(a.type);
                  const Icon = tm.icon;
                  return (
                    <motion.div
                      key={a.id}
                      id={`activity-${a.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className={`group relative scroll-mt-20 px-5 py-4 transition-colors duration-300 ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-900/[0.02]'}`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Timeline dot */}
                        <div className="relative flex-shrink-0 z-10">
                          <div className={`w-[30px] h-[30px] rounded-xl bg-gradient-to-br ${tm.gradient} flex items-center justify-center shadow-md ${tm.glow} timeline-dot-anim transition-transform duration-200 group-hover:scale-110`}>
                            <Icon size={14} className="text-white" />
                          </div>
                          {a.is_important && (
                            <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full ${'bg-accent'} border-2 border-white flex items-center justify-center animate-pulse-soft`}>
                              <Star size={7} className="text-white fill-white" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{a.subject}</h4>
                            {a.type === 'rendez_vous' && a.status && (
                              <StagePill label={STATUS_META[a.status]?.label || 'En attente'} hue={rdvStatusHue(a.status)} isDark={isDark} dot={false} />
                            )}
                            {a.alarm_sent && (
                              <StagePill label="Verrouillée" hue={RED_STAGE_HUE} isDark={isDark} />
                            )}
                            {a.has_reminder && (
                              <StagePill label="Rappel" hue={STAGE_HUES.amber} isDark={isDark} dot={false} />
                            )}
                            {a.type === 'visite' && a.visit_property_id && (
                              <button
                                onClick={() => openBonDeVisite(a)}
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all duration-200 hover:scale-[1.04] active:scale-95 ${
                                  isDark
                                    ? 'bg-violet-400/15 text-violet-300 border border-violet-400/30 hover:bg-violet-400/25'
                                    : 'bg-violet-50 text-violet-600 border border-violet-200/60 hover:bg-violet-100'
                                }`}
                                title="Ouvrir le bon de visite"
                              >
                                <FileText size={9} /> Bon de visite
                              </button>
                            )}
                            <span className="ml-auto">
                              <StagePill label={tm.label} hue={activityTypeHue(a.type)} isDark={isDark} dot={false} />
                            </span>
                          </div>

                          <div className={`flex items-center gap-2 text-[11px] mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatRelativeTime(a.activity_date)}</span>
                            {a.direction && (
                              <>
                                <span className="opacity-40">|</span>
                                <StagePill
                                  label={a.direction === 'sortant' ? 'Sortant' : 'Entrant'}
                                  hue={a.direction === 'sortant' ? STAGE_HUES.sky : STAGE_HUES.emerald}
                                  isDark={isDark}
                                  dot={false}
                                />
                              </>
                            )}
                            {a.author_name && (
                              <>
                                <span className="opacity-40">|</span>
                                <span className="font-medium">{a.author_name}</span>
                              </>
                            )}
                          </div>

                          {a.description && (
                            <p className={`text-xs line-clamp-2 leading-relaxed mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{a.description}</p>
                          )}

                          {a.has_reminder && a.reminder_date && (
                            <div
                              className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-medium px-2.5 py-1 rounded-xl border backdrop-blur-sm"
                              style={isDark
                                ? { background: 'rgba(251,191,36,0.10)', borderColor: 'rgba(251,191,36,0.30)', color: '#FCD34D' }
                                : { background: 'rgba(217,119,6,0.08)', borderColor: 'rgba(217,119,6,0.28)', color: '#B45309' }}
                            >
                              <Bell size={11} />
                              Rappel : {formatDateTime(a.reminder_date)}
                            </div>
                          )}
                        </div>

                        {/* Actions — always visible */}
                        <div className="flex items-center gap-1">
                          {/* Bon de visite */}
                          {a.type === 'visite' && a.visit_property_id && (
                            <button
                              onClick={() => openBonDeVisite(a)}
                              disabled={!canVisite}
                              className={`p-2 rounded-xl transition-all duration-200 ${
                                canVisite
                                  ? isDark
                                    ? 'text-slate-500 hover:bg-violet-400/15 hover:text-violet-300 hover:scale-110'
                                    : 'text-slate-400 hover:bg-violet-50 hover:text-violet-600 hover:scale-110'
                                  : isDark ? 'text-slate-700 cursor-not-allowed' : 'text-slate-300 cursor-not-allowed'
                              }`}
                              title={canVisite ? 'Bon de visite' : "Permission 'Visite' refusée"}
                            >
                              {canVisite ? <FileText size={14} /> : <Lock size={14} />}
                            </button>
                          )}
                          {/* Rendez-vous status actions */}
                          {a.type === 'rendez_vous' && a.status === 'en_attente' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(a, 'confirme')}
                                className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${isDark ? 'text-slate-500 hover:bg-emerald-400/15 hover:text-emerald-300' : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                                title="Confirmer le rendez-vous"
                              >
                                <Check size={14} />
                              </button>
                              {!!a.activity_date && new Date(a.activity_date) <= new Date() && (
                                <button
                                  onClick={() => handleStatusChange(a, 'termine')}
                                  className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${isDark ? 'text-slate-500 hover:bg-sky-400/15 hover:text-sky-300' : 'text-slate-400 hover:bg-blue-50 hover:text-blue-600'}`}
                                  title="Marquer le rendez-vous terminé"
                                >
                                  <CheckCircle size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => handleStatusChange(a, 'annule')}
                                className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${isDark ? 'text-slate-500 hover:bg-red-400/15 hover:text-red-300' : 'text-slate-400 hover:bg-red-50 hover:text-red-500'}`}
                                title="Annuler le rendez-vous"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                          {a.type === 'rendez_vous' && a.status === 'confirme' && (
                            <>
                              {!!a.activity_date && new Date(a.activity_date) <= new Date() && (
                                <button
                                  onClick={() => handleStatusChange(a, 'termine')}
                                  className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${isDark ? 'text-slate-500 hover:bg-sky-400/15 hover:text-sky-300' : 'text-slate-400 hover:bg-blue-50 hover:text-blue-600'}`}
                                  title="Marquer le rendez-vous terminé"
                                >
                                  <CheckCircle size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => handleStatusChange(a, 'annule')}
                                className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${isDark ? 'text-slate-500 hover:bg-red-400/15 hover:text-red-300' : 'text-slate-400 hover:bg-red-50 hover:text-red-500'}`}
                                title="Annuler le rendez-vous"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setDetailActivity(a)}
                            className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${isDark ? 'text-slate-500 hover:bg-white/10 hover:text-white' : 'text-slate-400 hover:bg-slate-900/5 hover:text-slate-900'}`}
                            title="Voir"
                          >
                            <Eye size={14} />
                          </button>
                          {!a.alarm_sent && a.status !== 'annule' && a.status !== 'termine' && (a.type !== 'visite' || canVisite) && (
                            <>
                              <button
                                onClick={() => openEdit(a)}
                                className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${isDark ? 'text-slate-500 hover:bg-amber-400/15 hover:text-amber-300' : 'text-slate-400 hover:bg-amber-50 hover:text-amber-600'}`}
                                title="Modifier"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(a.id)}
                                className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${isDark ? 'text-slate-500 hover:bg-red-400/15 hover:text-red-300' : 'text-slate-400 hover:bg-red-50 hover:text-red-500'}`}
                                title="Supprimer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pagination — staged */}
          {totalPages > 1 && (
            <div className={`relative px-5 py-3.5 border-t flex items-center justify-between ${isDark ? 'border-white/[0.07]' : 'border-slate-200/70'}`}>
              <span className={`text-[11px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {((page - 1) * LIMIT) + 1}-{Math.min(page * LIMIT, total)} sur {total}
              </span>
              <div className={`flex items-center gap-1 rounded-xl border p-1 backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70 shadow-sm'}`}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className={`p-1.5 rounded-lg transition-all duration-200 disabled:opacity-20 ${isDark ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'text-slate-500 hover:bg-slate-900/[0.04] hover:text-slate-900'}`}
                >
                  <ChevronLeft size={14} />
                </button>
                <span className={`px-3 text-xs font-extrabold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{page}/{totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className={`p-1.5 rounded-lg transition-all duration-200 disabled:opacity-20 ${isDark ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'text-slate-500 hover:bg-slate-900/[0.04] hover:text-slate-900'}`}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Dialog — StageModal (ported, centered) */}
        {detailActivity && (() => {
          const tm = getTypeMeta(detailActivity.type);
          const Icon = tm.icon;
          const hue = activityTypeHue(detailActivity.type);
          return (
            <StageModal
              open={!!detailActivity}
              onClose={() => setDetailActivity(null)}
              title={detailActivity.subject}
              subtitle={formatDateTime(detailActivity.activity_date)}
              icon={Icon}
              hue={hue}
              maxWidth="max-w-2xl"
              centered
              bodyClassName="max-h-[70vh] overflow-y-auto"
            >
              <div className="space-y-4">
                {/* Pills */}
                <div className="flex flex-wrap gap-2">
                  {detailActivity.type === 'rendez_vous' && detailActivity.status && (
                    <StagePill label={STATUS_META[detailActivity.status]?.label || 'En attente'} hue={rdvStatusHue(detailActivity.status)} isDark={isDark} />
                  )}
                  {detailActivity.is_important && (
                    <StagePill label="Important" hue={STAGE_HUES.amber} isDark={isDark} />
                  )}
                  <StagePill label={tm.label} hue={hue} isDark={isDark} />
                  {detailActivity.direction && (
                    <StagePill label={detailActivity.direction === 'sortant' ? 'Sortant' : 'Entrant'} hue={SLATE_STAGE_HUE} isDark={isDark} />
                  )}
                  {detailActivity.alarm_sent && (
                    <StagePill label="Verrouillee" hue={RED_STAGE_HUE} isDark={isDark} />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-2xl border p-4 backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75'}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Direction</span>
                    <p className={`mt-1.5 text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{detailActivity.direction === 'sortant' ? 'Sortant (Agent > Client)' : detailActivity.direction === 'entrant' ? 'Entrant (Client > Agent)' : 'Non applicable'}</p>
                  </div>
                  <div className={`rounded-2xl border p-4 backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75'}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Auteur</span>
                    <div className="mt-1.5 flex items-center gap-2">
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{detailActivity.author_name || 'Non renseigne'}</p>
                      {detailActivity.author_role && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md ${isDark ? 'border border-white/10 bg-white/[0.04] text-slate-200' : detailActivity.author_role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                          {detailActivity.author_role === 'admin' ? <Shield size={9} /> : <User size={9} />}
                          {detailActivity.author_role === 'admin' ? 'Admin' : 'Agent'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {detailActivity.has_reminder && detailActivity.reminder_date && (
                  <div className={`rounded-2xl border p-4 backdrop-blur-sm ${isGerant ? (isDark ? 'border-accent/30 bg-accent/[0.08]' : 'border-accent/60 bg-accent/10') : (isDark ? 'border-amber-500/20 bg-amber-500/[0.08]' : 'border-amber-200/60 bg-amber-50/70')}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${isGerant ? 'bg-accent shadow-[hsl(var(--accent))]/20' : 'bg-amber-500 shadow-amber-200'}`}>
                        <Bell size={14} className="text-white" />
                      </div>
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isGerant ? 'text-accent' : (isDark ? 'text-amber-300' : 'text-amber-600')}`}>Rappel programme</span>
                        <p className={`text-sm font-bold ${isGerant ? 'text-accent' : (isDark ? 'text-amber-200' : 'text-amber-800')}`}>{formatDateTime(detailActivity.reminder_date)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {detailActivity.description && (
                  <div className={`rounded-2xl border p-4 backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75'}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Description</span>
                    <p className={`mt-2 text-sm whitespace-pre-wrap leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{detailActivity.description}</p>
                  </div>
                )}

                {/* Actions */}
                <div className={`flex flex-col gap-3 pt-3 border-t ${isDark ? 'border-white/[0.07]' : 'border-slate-200/70'}`}>
                  {detailActivity.type === 'rendez_vous' && detailActivity.status === 'en_attente' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { const a = detailActivity; setDetailActivity(null); handleStatusChange(a, 'confirme'); }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-emerald-600 rounded-xl border border-emerald-200/60 bg-emerald-50 hover:bg-emerald-100 transition-all duration-200"
                      >
                        <Check size={13} /> Marquer confirme
                      </button>
                      {!!detailActivity.activity_date && new Date(detailActivity.activity_date) <= new Date() && (
                        <button
                          onClick={() => { const a = detailActivity; setDetailActivity(null); handleStatusChange(a, 'termine'); }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-blue-600 rounded-xl border border-blue-200/60 bg-blue-50 hover:bg-blue-100 transition-all duration-200"
                        >
                          <CheckCircle size={13} /> Marquer termine
                        </button>
                      )}
                      <button
                        onClick={() => { const a = detailActivity; setDetailActivity(null); handleStatusChange(a, 'annule'); }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-500 rounded-xl border border-red-200/60 bg-red-50 hover:bg-red-100 transition-all duration-200"
                      >
                        <XCircle size={13} /> Annuler
                      </button>
                    </div>
                  )}
                  {detailActivity.type === 'rendez_vous' && detailActivity.status === 'confirme' && (
                    <div className="flex gap-2">
                      {!!detailActivity.activity_date && new Date(detailActivity.activity_date) <= new Date() && (
                        <button
                          onClick={() => { const a = detailActivity; setDetailActivity(null); handleStatusChange(a, 'termine'); }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-blue-600 rounded-xl border border-blue-200/60 bg-blue-50 hover:bg-blue-100 transition-all duration-200"
                        >
                          <CheckCircle size={13} /> Marquer termine
                        </button>
                      )}
                      <button
                        onClick={() => { const a = detailActivity; setDetailActivity(null); handleStatusChange(a, 'annule'); }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-500 rounded-xl border border-red-200/60 bg-red-50 hover:bg-red-100 transition-all duration-200"
                      >
                        <XCircle size={13} /> Annuler
                      </button>
                    </div>
                  )}
                  {detailActivity.type === 'rendez_vous' && detailActivity.status === 'annule' && (
                    <div className="flex items-center gap-2 text-red-500 bg-red-50/50 rounded-xl px-4 py-3 border border-red-200/40">
                      <XCircle size={16} />
                      <span className="text-xs font-semibold">Ce rendez-vous est <strong>annulé</strong>. Les notifications et rappels ne seront pas envoyés.</span>
                    </div>
                  )}
                  {detailActivity.type === 'rendez_vous' && detailActivity.status === 'termine' && (
                    <div className="flex items-center gap-2 text-blue-600 bg-blue-50/50 rounded-xl px-4 py-3 border border-blue-200/40">
                      <CheckCircle size={16} />
                      <span className="text-xs font-semibold">Ce rendez-vous est <strong>terminé</strong>.</span>
                    </div>
                  )}
                  {detailActivity.type === 'visite' && !canVisite && (
                    <div className="flex items-center gap-2 text-red-500 bg-red-50/50 rounded-xl px-4 py-3 border border-red-200/40">
                      <Lock size={16} />
                      <span className="text-xs font-semibold">Visite verrouillée — permission refusée</span>
                    </div>
                  )}
                  {!detailActivity.alarm_sent && detailActivity.status !== 'annule' && detailActivity.status !== 'termine' && (detailActivity.type !== 'visite' || canVisite) && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setDetailActivity(null); openEdit(detailActivity); }}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border transition-all duration-200 active:scale-[0.97] ${isGerant ? 'text-accent border-accent/25 bg-gradient-to-b from-accent/15 to-accent/5 hover:from-accent/25 hover:to-accent/10 shadow-sm' : isDark ? 'text-violet-200 border-white/15 bg-gradient-to-b from-white/[0.08] to-white/[0.02] hover:from-white/[0.14] hover:to-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_6px_16px_-8px_rgba(124,92,255,0.45)]' : 'text-teal-900 border-teal-900/15 bg-gradient-to-b from-white to-teal-50/70 hover:from-white hover:to-teal-50 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_6px_16px_-8px_rgba(13,148,136,0.4)]'}`}
                      >
                        <Edit3 size={13} /> Modifier
                      </button>
                      <button
                        onClick={() => { setDetailActivity(null); setDeleteConfirm(detailActivity.id); }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white rounded-xl border border-white/20 bg-gradient-to-b from-rose-500 to-red-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_16px_rgba(225,29,72,0.4)] hover:brightness-110 transition-all duration-200 active:scale-[0.97]"
                      >
                        <Trash2 size={13} /> Supprimer
                      </button>
                    </div>
                  )}
                  {detailActivity.alarm_sent && detailActivity.status !== 'annule' && detailActivity.status !== 'termine' && (
                    <div className="flex items-center gap-2 text-red-500">
                      <Lock size={14} />
                      <span className="text-xs font-semibold">Activite verrouillee - alarme deja envoyee</span>
                    </div>
                  )}
                </div>
              </div>
            </StageModal>
          );
        })()}

        {/* Delete Dialog — StageModal (ported, centered) */}
        <StageModal
          open={deleteConfirm !== null}
          onClose={() => setDeleteConfirm(null)}
          title="Supprimer l'activite ?"
          icon={Trash2}
          hue={RED_STAGE_HUE}
          maxWidth="max-w-md"
          centered
          footer={
            <>
              <button
                onClick={() => setDeleteConfirm(null)}
                className={stageBtns.ghost}
              >
                Annuler
              </button>
              <button
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white border border-white/20 bg-gradient-to-b from-rose-500 to-red-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_16px_rgba(225,29,72,0.4)] hover:brightness-110 transition-all duration-200 active:scale-[0.97]"
              >
                Supprimer
              </button>
            </>
          }
        >
          <div className="text-center py-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200 animate-pop-in">
              <Trash2 size={28} className="text-white" />
            </div>
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Cette action est irreversible.</p>
          </div>
        </StageModal>

        {/* Bon de visite Dialog */}
        <Dialog isOpen={!!bonDeVisiteActivity} onClose={() => setBonDeVisiteActivity(null)} title="Bon de visite" size="2xl" className="max-h-[90vh] overflow-hidden flex flex-col">
          {bonDeVisiteActivity && (() => {
            const mandateNumber =
              bonDeVisiteProperty?.mandate_numeroMandat ||
              bonDeVisiteProperty?.mandate?.numeroMandat ||
              client.numeroMandat ||
              '';
            const buyerAddress = resolveBuyerAddress();
            const agentPhone = currentUser?.phone || '';
            const agentEmail = currentUser?.email || '';
            const isVenteVisit = String(bonDeVisiteProperty?.transactionType || '').toLowerCase() === 'vente';
            const visitorSectionTitle = isVenteVisit ? "Coordonnées de l'acheteur" : "Coordonnées du visiteur";
            const visitorSignatureTitle = isVenteVisit ? "Signature de l'acheteur" : "Signature du visiteur";
            return (
              <div className="flex flex-col gap-4 max-h-[calc(90vh-6rem)]">
                {!bonDeVisiteLoading && (
                  <div className="flex justify-end gap-2 shrink-0">
                    <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => handleDownloadBonDeVisite()}>
                      Télécharger
                    </Button>
                    <Button variant="primary" size="sm" icon={<Printer size={14} />} onClick={() => handlePrintBonDeVisite()}>
                      Imprimer
                    </Button>
                  </div>
                )}
                <div className="overflow-y-auto pr-1 -mr-1">
                {bonDeVisiteLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className={`w-8 h-8 border-2 ${'border-accent'} border-t-transparent rounded-full animate-spin mb-3`} />
                    <p className="text-xs text-text-secondary">Génération du bon de visite...</p>
                  </div>
                ) : (
                  <div ref={bonDeVisiteRef} className="bg-white text-slate-800 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    {/* Header — agency */}
                    <div className="flex items-center gap-3 px-6 py-5" style={{ background: 'linear-gradient(135deg, #2c8264, #1d694f)' }}>
                      <img src="/CRM_Official_Image.jfif" alt="CRM Immobilier" className="w-12 h-12 rounded-full object-cover ring-2 ring-white/30" />
                      <div>
                        <h3 className="text-lg font-bold text-white leading-tight">CRM Immobilier</h3>
                        <p className="text-xs text-white/70">Agence immobilière</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-[10px] uppercase tracking-widest text-white/60 font-semibold">Bon de visite</p>
                        <p className="text-sm font-semibold text-white mt-0.5">{formatDateTime(bonDeVisiteActivity.activity_date)}</p>
                      </div>
                    </div>

                    <div className="px-6 py-5 space-y-5">
                      {/* Objet */}
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 mb-1">Objet</h4>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          Atteste qu'une visite a bien eu lieu par l'intermédiaire de l'agence <strong>CRM Immobilier</strong>.
                        </p>
                      </div>

                      {/* Acheteur + Agent */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 mb-1.5">{visitorSectionTitle}</h4>
                          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-1 text-sm">
                            <p className="font-semibold text-slate-800">{bonDeVisiteBuyer?.name || 'Non renseigné'}</p>
                            {bonDeVisiteBuyer?.phone && (
                              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                                <Phone size={11} className="text-emerald-600" /> {bonDeVisiteBuyer.phone}
                              </p>
                            )}
                            {bonDeVisiteBuyer?.email && (
                              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                                <Mail size={11} className="text-emerald-600" /> {bonDeVisiteBuyer.email}
                              </p>
                            )}
                            {buyerAddress && (
                              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                                <MapPin size={11} className="text-emerald-600" /> {buyerAddress}
                              </p>
                            )}
                            {!bonDeVisiteBuyer?.phone && !bonDeVisiteBuyer?.email && !buyerAddress && (
                              <p className="text-xs text-slate-400">Aucune coordonnée disponible</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 mb-1.5">Coordonnées de l'agent responsable</h4>
                          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-1 text-sm">
                            <p className="font-semibold text-slate-800">{currentUser?.name || bonDeVisiteActivity.author_name || 'Non renseigné'}</p>
                            {agentPhone && (
                              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                                <Phone size={11} className="text-emerald-600" /> {agentPhone}
                              </p>
                            )}
                            {agentEmail && (
                              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                                <Mail size={11} className="text-emerald-600" /> {agentEmail}
                              </p>
                            )}
                            {currentUser?.position && (
                              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                                <Shield size={11} className="text-emerald-600" /> {currentUser.position}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bien */}
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 mb-1.5">Description du bien</h4>
                        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-1 text-sm">
                          <p className="font-semibold text-slate-800">
                            {bonDeVisiteProperty?.title || 'Bien non renseigné'}
                            {bonDeVisiteProperty?.reference && <span className="text-slate-400 font-normal"> — {bonDeVisiteProperty.reference}</span>}
                          </p>
                          <p className="text-xs text-slate-600 flex items-center gap-1.5">
                            <MapPin size={11} className="text-emerald-600" />
                            {[bonDeVisiteProperty?.address, bonDeVisiteProperty?.district, bonDeVisiteProperty?.city]
                              .filter(Boolean).join(', ') || bonDeVisiteProperty?.location || 'Adresse non renseignée'}
                          </p>
                        </div>
                      </div>

                      {/* Date + Mandat */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 mb-1.5">Date de la visite</h4>
                          <p className="text-sm font-semibold text-slate-800">{formatDateLong(bonDeVisiteActivity.activity_date)}</p>
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 mb-1.5">Numéro de mandat</h4>
                          {mandateNumber ? (
                            <p className="text-sm font-semibold text-slate-800 font-mono">{mandateNumber}</p>
                          ) : (
                            <p className="text-sm text-slate-400 italic">Aucun mandat enregistré</p>
                          )}
                        </div>
                      </div>

                      {/* Signature */}
                      <div className="pt-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 mb-3">{visitorSignatureTitle}</h4>
                        <div className="h-24 rounded-lg border border-dashed border-slate-300 bg-slate-50" />
                        <p className="text-[10px] text-slate-400 mt-1.5 text-right">Bon de visite — {bonDeVisiteActivity.subject || formatDateTime(bonDeVisiteActivity.activity_date)}</p>
                      </div>
                    </div>
                  </div>
                )}
                </div>
              </div>
            );
          })()}
        </Dialog>
      </div>
    </>
  );
};
