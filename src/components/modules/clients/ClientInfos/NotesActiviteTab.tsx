import { useState, useEffect, useRef, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '../../../ui/Button';
import { Dialog } from '../../../ui/Dialog';
import { useToast } from '../../../ui/Toast';
import { DatePicker } from '../../../ui/DatePicker';
import { TimePicker } from '../../../ui/TimePicker';
import { api } from '../../../../services/api';
import {
  Phone, Mail, MapPin, Calendar, FileText, AlertTriangle, MoreHorizontal,
  Plus, Search, Filter, RefreshCw, Clock, Edit3, Trash2, X, ChevronLeft,
  ChevronRight, Bell, Star, ArrowUpRight, ArrowDownLeft, Eye,
  Activity, Zap, Hash, Shield, User, AlertCircle, Lock, Home, Printer, Download,
  CheckCircle, XCircle, Check,
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
      ? { ...t, color: 'text-[#905D5D]', bg: 'bg-[#E7D5D5]', border: 'border-[#E0C6C6]', ring: 'ring-[#905D5D]/20', gradient: 'from-[#905D5D] to-[#7D5050]', glow: 'shadow-[#905D5D]/25' }
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
      el.classList.add('ring-2', isGerant ? 'ring-[#905D5D]/40' : 'ring-accent/40', 'ring-offset-2', isGerant ? 'bg-[#905D5D]/[0.06]' : 'bg-accent/[0.06]');
      setTimeout(() => {
        el.classList.remove('ring-2', isGerant ? 'ring-[#905D5D]/40' : 'ring-accent/40', 'ring-offset-2', isGerant ? 'bg-[#905D5D]/[0.06]' : 'bg-accent/[0.06]');
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
    en_attente: { label: 'En attente', color: isGerant ? 'text-[#905D5D]' : 'text-amber-600', bg: isGerant ? 'bg-[#E7D5D5]' : 'bg-amber-50', border: isGerant ? 'border-[#E0C6C6]' : 'border-amber-200' },
    confirme:   { label: 'Confirmé',   color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    termine:    { label: 'Terminé',    color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    annule:     { label: 'Annulé',     color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  };
  const DEFAULT_STATUS = { label: 'En attente', color: isGerant ? 'text-[#905D5D]' : 'text-amber-600', bg: isGerant ? 'bg-[#E7D5D5]' : 'bg-amber-50', border: isGerant ? 'border-[#E0C6C6]' : 'border-amber-200' };

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
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${isGerant ? 'from-[#905D5D] to-[#7D5050]' : 'from-accent to-indigo-600'} flex items-center justify-center shadow-lg ${isGerant ? 'shadow-[#905D5D]/20' : 'shadow-accent/20'}`}>
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text tracking-tight">Notes & Activites</h3>
              <p className="text-[11px] text-text-secondary/70 mt-0.5">Journal de bord des interactions</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setEditActivity(null); setShowForm(true); }}
            className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r ${isGerant ? 'from-[#905D5D] to-[#7D5050]' : 'from-accent to-indigo-600'} text-white text-xs font-semibold shadow-lg ${isGerant ? 'shadow-[#905D5D]/25' : 'shadow-accent/25'} hover:shadow-xl ${isGerant ? 'hover:shadow-[#905D5D]/30' : 'hover:shadow-accent/30'} hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
          >
            <Plus size={15} className="group-hover:rotate-90 transition-transform duration-300" />
            Nouvelle activite
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {getActivityTypes(isGerant).map((t, i) => {
            const Icon = t.icon;
            const count = typeCounts[t.key] || 0;
            return (
              <div
                key={t.key}
                className={`animate-stagger group relative rounded-2xl border ${t.border} ${t.bg} p-3.5 cursor-default transition-all duration-300 hover:shadow-lg hover:${t.glow} hover:-translate-y-0.5`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300" />
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${t.gradient} flex items-center justify-center shadow-sm`}>
                    <Icon size={13} className="text-white" />
                  </div>
                  {count > 0 && (
                    <span className="animate-pop-in text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/80 backdrop-blur text-text/70 border border-white/50 shadow-sm">
                      {count}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-text-secondary/80 uppercase tracking-wide">{t.label}</p>
                <p className={`text-xl font-black ${t.color} mt-0.5 tabular-nums`}>{count}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="animate-fade-in p-3.5 rounded-2xl bg-card border border-border/40 shadow-sm">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 mr-1">
              <div className={`w-6 h-6 rounded-lg ${isGerant ? 'bg-[#905D5D]/10' : 'bg-accent/10'} flex items-center justify-center`}>
                <Filter size={11} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
              </div>
              <span className="text-[10px] font-bold text-text-secondary/50 uppercase tracking-widest">Filtres</span>
            </div>
            <div className="flex items-center gap-0.5 bg-background/80 rounded-xl border border-border/40 p-0.5">
              <button
                onClick={() => { setFilterType('all'); setPage(1); }}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-200 ${
                  filterType === 'all'
                    ? `bg-gradient-to-r ${isGerant ? 'from-[#905D5D] to-[#7D5050]' : 'from-accent to-indigo-600'} text-white shadow-md ${isGerant ? 'shadow-[#905D5D]/20' : 'shadow-accent/20'}`
                    : 'text-text-secondary hover:text-text hover:bg-white/50'
                }`}
              >
                Tous
              </button>
              {getActivityTypes(isGerant).slice(0, 5).map(t => (
                <button
                  key={t.key}
                  onClick={() => { setFilterType(t.key); setPage(1); }}
                  className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-200 ${
                    filterType === t.key
                      ? `bg-gradient-to-r ${isGerant ? 'from-[#905D5D] to-[#7D5050]' : 'from-accent to-indigo-600'} text-white shadow-md ${isGerant ? 'shadow-[#905D5D]/20' : 'shadow-accent/20'}`
                      : 'text-text-secondary hover:text-text hover:bg-white/50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/30" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={filterSearch}
                onChange={e => { setFilterSearch(e.target.value); setPage(1); }}
                className={`h-9 pl-8 pr-3 text-xs rounded-xl border border-border/50 bg-background/80 text-text placeholder:text-text-secondary/30 focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]/50' : 'focus:ring-accent/20 focus:border-accent/50'} focus:bg-white w-44 transition-all duration-200`}
              />
            </div>
            {(filterType !== 'all' || filterSearch || filterFrom || filterTo || filterAuthor) && (
              <button
                onClick={() => { setFilterType('all'); setFilterSearch(''); setFilterFrom(''); setFilterTo(''); setFilterAuthor(''); setDateError(''); setPage(1); }}
                className="h-9 px-3 text-[11px] text-red-500 hover:text-white hover:bg-red-500 font-semibold rounded-xl border border-red-200 hover:border-red-500 transition-all duration-200 flex items-center gap-1"
              >
                <X size={12} />
                Reinitialiser
              </button>
            )}
          </div>
          {/* Date range row */}
          <div className="flex items-end gap-3 mt-3 pt-3 border-t border-border/20">
            <div className="flex items-center gap-2 text-[10px] text-text-secondary/50 font-medium uppercase tracking-wider pb-2">
              <Calendar size={13} className={isGerant ? 'text-[#905D5D]/60' : 'text-accent/60'} />
              Periode
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-medium text-text-secondary/50 mb-1">Date debut</label>
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
                  className={`!h-9 !rounded-xl !border-border/50 !bg-background/80 !text-xs ${dateError ? '!ring-1 !ring-red-300' : ''}`}
                />
              </div>
              <div className="pb-2">
                <div className="w-6 h-0.5 rounded-full bg-border/40" />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-medium text-text-secondary/50 mb-1">Date fin</label>
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
                  className={`!h-9 !rounded-xl !border-border/50 !bg-background/80 !text-xs ${dateError ? '!ring-1 !ring-red-300' : ''}`}
                />
              </div>
            </div>
          </div>
          {dateError && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-red-500 font-medium animate-slide-down-soft">
              <AlertCircle size={12} />
              {dateError}
            </div>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className={`animate-slide-down-soft rounded-2xl border ${isGerant ? 'border-[#905D5D]/20' : 'border-accent/20'} bg-card shadow-lg ${isGerant ? 'shadow-[#905D5D]/5' : 'shadow-accent/5'} overflow-hidden`}>
            <div className={`h-1 w-full bg-gradient-to-r ${isGerant ? 'from-[#905D5D] to-[#7D5050]' : 'from-accent via-indigo-500 to-purple-500'}`} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl ${isGerant ? 'bg-[#905D5D]/10' : 'bg-accent/10'} flex items-center justify-center`}>
                    <Zap size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                  </div>
                  <p className="text-sm font-bold text-text">{editActivity ? 'Modifier l\'activite' : 'Nouvelle activite'}</p>
                </div>
                <button
                  onClick={() => { setShowForm(false); setEditActivity(null); }}
                  className="p-2 rounded-xl hover:bg-red-50 text-text-secondary/40 hover:text-red-500 transition-all duration-200 hover:rotate-90"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Type selector */}
              <div className="mb-5">
                <label className="block text-[10px] font-bold text-text-secondary/60 uppercase tracking-widest mb-2.5">Type d'activite</label>
                <div className="flex flex-wrap gap-2">
                  {getActivityTypes(isGerant).map(t => {
                    const Icon = t.icon;
                    const active = formData.type === t.key;
                    const locked = t.key === 'visite' && !canVisite;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        disabled={locked}
                        onClick={() => setFormData(p => ({ ...p, type: t.key }))}
                        title={locked ? "Permission 'Visite' refusée" : t.label}
                        className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl border transition-all duration-200 ${
                          locked
                            ? 'bg-background/40 text-text-secondary/40 border-border/30 cursor-not-allowed opacity-70'
                            : active
                              ? `${t.bg} ${t.border} ${t.color} shadow-md ${t.glow} scale-[1.02]`
                              : 'bg-background/60 text-text-secondary border-border/50 hover:border-border hover:bg-white/60 hover:scale-[1.01]'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 ${
                          active && !locked ? `bg-gradient-to-br ${t.gradient} shadow-sm` : 'bg-white/80'
                        }`}>
                          {locked ? <Lock size={12} className="text-text-secondary/40" /> : <Icon size={12} className={active ? 'text-white' : t.color} />}
                        </div>
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Direction */}
              {formData.type !== 'note' && formData.type !== 'alerte' && (
                <div className="mb-5">
                  <label className="block text-[10px] font-bold text-text-secondary/60 uppercase tracking-widest mb-2.5">Direction</label>
                  <div className="flex gap-3">
                    {[
                      { val: 'sortant', label: 'Sortant', icon: ArrowUpRight, desc: 'Agent vers client', color: 'from-blue-500 to-cyan-500' },
                      { val: 'entrant', label: 'Entrant', icon: ArrowDownLeft, desc: 'Client vers agent', color: 'from-emerald-500 to-teal-500' },
                    ].map(d => (
                      <button
                        key={d.val}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, direction: d.val }))}
                        className={`flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl border transition-all duration-200 ${
                          formData.direction === d.val
                            ? `${isGerant ? 'bg-[#905D5D]/5 border-[#905D5D]/30 text-[#905D5D] shadow-md shadow-[#905D5D]/10' : 'bg-accent/5 border-accent/30 text-accent shadow-md shadow-accent/10'} scale-[1.01]`
                            : 'bg-background/60 text-text-secondary border-border/50 hover:border-border hover:bg-white/60'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                          formData.direction === d.val ? `bg-gradient-to-br ${d.color} shadow-sm` : 'bg-white/80'
                        }`}>
                          <d.icon size={14} className={formData.direction === d.val ? 'text-white' : ''} />
                        </div>
                        <div className="text-left">
                          <div>{d.label}</div>
                          <div className="text-[10px] text-text-secondary/40 font-normal">{d.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary/60 uppercase tracking-widest mb-1.5">
                    <Calendar size={11} className={isGerant ? 'text-[#905D5D]/60' : 'text-accent/60'} />
                    Date
                  </label>
                  <DatePicker
                    value={formData.activity_date}
                    onChange={e => setFormData(p => ({ ...p, activity_date: e.target.value }))}
                    className={`!h-11 !rounded-xl !border-border/50 !bg-gradient-to-br !from-background/80 !to-background/40 !shadow-sm hover:!shadow-md ${isGerant ? 'hover:!border-[#905D5D]/30 focus:!ring-[#905D5D]/20 focus:!border-[#905D5D]/50' : 'hover:!border-accent/30 focus:!ring-accent/20 focus:!border-accent/50'}`}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary/60 uppercase tracking-widest mb-1.5">
                    <Clock size={11} className={isGerant ? 'text-[#905D5D]/60' : 'text-accent/60'} />
                    Heure
                  </label>
                  <TimePicker
                    value={formData.activity_time}
                    onChange={e => setFormData(p => ({ ...p, activity_time: e.target.value }))}
                    className={`!h-11 !rounded-xl !border-border/50 !bg-gradient-to-br !from-background/80 !to-background/40 !shadow-sm hover:!shadow-md ${isGerant ? 'hover:!border-[#905D5D]/30 focus:!ring-[#905D5D]/20 focus:!border-[#905D5D]/50' : 'hover:!border-accent/30 focus:!ring-accent/20 focus:!border-accent/50'}`}
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="mb-5">
                <label className="block text-[10px] font-bold text-text-secondary/60 uppercase tracking-widest mb-1.5">Sujet</label>
                <input
                  type="text" value={formData.subject}
                  onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
                  placeholder="Sujet de l'activite..."
                  className={`w-full h-10 px-3.5 text-sm rounded-xl border border-border/50 bg-background/60 text-text placeholder:text-text-secondary/30 focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]/50' : 'focus:ring-accent/20 focus:border-accent/50'} transition-all duration-200`}
                />
              </div>

              {/* Description */}
              <div className="mb-5">
                <label className="block text-[10px] font-bold text-text-secondary/60 uppercase tracking-widest mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  rows={3} placeholder="Details de l'activite..."
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border border-border/50 bg-background/60 text-text placeholder:text-text-secondary/30 focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]/50' : 'focus:ring-accent/20 focus:border-accent/50'} resize-none transition-all duration-200`}
                />
              </div>

              {/* Visite — property + buyer/seller for Bon de visite */}
              {formData.type === 'visite' && (isVendeur || isAcheteur || isRentalSide) && (
                <div className="animate-slide-down-soft mb-5 p-4 rounded-xl bg-violet-50/60 border border-violet-200/60">
                  <p className="text-[10px] font-bold text-violet-700 uppercase tracking-widest mb-3">Bon de visite</p>

                  {/* Bien concerné */}
                  <div className="mb-4">
                    <label className="block text-[10px] font-bold text-text-secondary/60 uppercase tracking-widest mb-1.5">Bien concerné par la visite</label>
                    {formData.visit_property_id && selectedVisitProperty ? (
                      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-violet-200/70 shadow-sm">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                          <Home size={14} className="text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text truncate">{selectedVisitProperty.title}</p>
                          <p className="text-[11px] text-text-secondary/60 truncate">
                            {[selectedVisitProperty.address, selectedVisitProperty.city, selectedVisitProperty.district].filter(Boolean).join(', ') || selectedVisitProperty.reference}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, visit_property_id: '', visit_seller_id: '' }))}
                          className="p-1.5 rounded-lg hover:bg-violet-50 text-text-secondary/40 hover:text-red-500 transition-all duration-200"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/30" />
                          <input
                            type="text"
                            value={visitPropertySearch}
                            onChange={e => setVisitPropertySearch(e.target.value)}
                            placeholder={isRentalSide ? 'Rechercher un bien à louer...' : 'Rechercher un bien en vente...'}
                            className="w-full h-9 pl-8 pr-3 text-xs rounded-xl border border-border/50 bg-white/70 text-text placeholder:text-text-secondary/30 focus:outline-none focus:ring-2 focus:ring-violet-300/30 focus:border-violet-300/60 transition-all duration-200"
                          />
                        </div>
                        {visitPropertySearch && (
                          <div className="mt-1.5 max-h-40 overflow-auto rounded-xl border border-border/50 bg-card shadow-sm divide-y divide-border/30">
                            {filteredVisitProperties.length === 0 ? (
                              <p className="px-3 py-2 text-xs text-text-secondary">{isRentalSide ? 'Aucun bien à louer trouvé' : 'Aucun bien en vente trouvé'}</p>
                            ) : (
                              filteredVisitProperties.map((p: any) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => { setFormData(prev => ({ ...prev, visit_property_id: String(p.id), visit_seller_id: p.clientId ? String(p.clientId) : (isBailleur ? String(clientId) : prev.visit_seller_id) })); setVisitPropertySearch(''); }}
                                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-background transition-colors text-left"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                    <Home size={12} className="text-emerald-600" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-text truncate">{p.title}</p>
                                    <p className="text-xs text-text-secondary truncate">
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
                    <label className="block text-[10px] font-bold text-text-secondary/60 uppercase tracking-widest mb-1.5">
                      {isBailleur ? 'Locataire / Voyageur concerné par la visite' : 'Acheteur concerné par la visite'}
                    </label>
                    {formData.visit_buyer_id && selectedVisitCounterpart ? (
                      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-violet-200/70 shadow-sm">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <User size={14} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text truncate">{selectedVisitCounterpart.name}</p>
                          <p className="text-[11px] text-text-secondary/60 truncate">
                            {[selectedVisitCounterpart.phone, selectedVisitCounterpart.email].filter(Boolean).join(' · ') || 'En recherche'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, visit_buyer_id: '' }))}
                          className="p-1.5 rounded-lg hover:bg-violet-50 text-text-secondary/40 hover:text-red-500 transition-all duration-200"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/30" />
                          <input
                            type="text"
                            value={visitBuyerSearch}
                            onChange={e => setVisitBuyerSearch(e.target.value)}
                            placeholder={isBailleur ? 'Rechercher un locataire ou voyageur...' : 'Rechercher un acheteur...'}
                            className="w-full h-9 pl-8 pr-3 text-xs rounded-xl border border-border/50 bg-white/70 text-text placeholder:text-text-secondary/30 focus:outline-none focus:ring-2 focus:ring-violet-300/30 focus:border-violet-300/60 transition-all duration-200"
                          />
                        </div>
                        {visitBuyerSearch && (
                          <div className="mt-1.5 max-h-40 overflow-auto rounded-xl border border-border/50 bg-card shadow-sm divide-y divide-border/30">
                            {filteredVisitCounterparts.length === 0 ? (
                              <p className="px-3 py-2 text-xs text-text-secondary">
                                {isBailleur ? 'Aucun locataire / voyageur en recherche trouvé' : 'Aucun acheteur en recherche trouvé'}
                              </p>
                            ) : (
                              filteredVisitCounterparts.map((c: any) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => { setFormData(prev => ({ ...prev, visit_buyer_id: String(c.id) })); setVisitBuyerSearch(''); }}
                                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-background transition-colors text-left"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                    <User size={12} className="text-blue-600" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-text truncate">{c.name}</p>
                                    <p className="text-xs text-text-secondary truncate">
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
                    <label className="block text-[10px] font-bold text-text-secondary/60 uppercase tracking-widest mb-1.5">{isAcheteur ? 'Vendeur concerné par la visite' : 'Bailleur concerné par la visite'}</label>
                    {selectedVisitSeller || selectedVisitProperty?.owner?.name ? (
                      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-violet-200/70 shadow-sm">
                        <div className={`w-8 h-8 rounded-lg ${isGerant ? 'bg-[#E7D5D5]' : 'bg-amber-50'} flex items-center justify-center flex-shrink-0`}>
                          <User size={14} className={isGerant ? 'text-[#905D5D]' : 'text-amber-600'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text truncate">
                            {selectedVisitSeller?.name || selectedVisitProperty?.owner?.name || (isAcheteur ? 'Vendeur non renseigné' : 'Bailleur non renseigné')}
                          </p>
                          <p className="text-[11px] text-text-secondary/60 truncate">
                            {[selectedVisitSeller?.phone, selectedVisitSeller?.email].filter(Boolean).join(' · ') || (isAcheteur ? 'Vendeur du bien sélectionné' : 'Bailleur du bien sélectionné')}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-border/60 bg-background/40">
                        <User size={13} className="text-text-secondary/40" />
                        <p className="text-xs text-text-secondary/60">{isAcheteur ? 'Sélectionnez un bien pour afficher le vendeur concerné' : 'Sélectionnez un bien pour afficher le bailleur concerné'}</p>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              )}

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, has_reminder: !p.has_reminder }))}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                    formData.has_reminder
                      ? isGerant ? 'bg-[#E7D5D5] border-[#E0C6C6] text-[#905D5D] shadow-md shadow-[#905D5D]/10' : 'bg-amber-50 border-amber-300 text-amber-700 shadow-md shadow-amber-100'
                      : isGerant ? 'bg-background/60 border-border/50 text-text-secondary hover:border-[#905D5D]/50 hover:text-[#905D5D]' : 'bg-background/60 border-border/50 text-text-secondary hover:border-amber-300 hover:text-amber-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    formData.has_reminder ? `${isGerant ? 'bg-[#905D5D]' : 'bg-amber-500'} shadow-sm` : 'bg-white border-2 border-border'
                  }`}>
                    {formData.has_reminder && <Bell size={11} className="text-white" />}
                  </div>
                  Ajouter un rappel
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, is_important: !p.is_important }))}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                    formData.is_important
                      ? isGerant ? 'bg-[#E7D5D5] border-[#E0C6C6] text-[#905D5D] shadow-md shadow-[#905D5D]/10' : 'bg-amber-50 border-amber-300 text-amber-700 shadow-md shadow-amber-100'
                      : isGerant ? 'bg-background/60 border-border/50 text-text-secondary hover:border-[#905D5D]/50 hover:text-[#905D5D]' : 'bg-background/60 border-border/50 text-text-secondary hover:border-amber-300 hover:text-amber-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    formData.is_important ? `${isGerant ? 'bg-[#905D5D]' : 'bg-amber-500'} shadow-sm` : 'bg-white border-2 border-border'
                  }`}>
                    {formData.is_important && <Star size={11} className="text-white fill-white" />}
                  </div>
                  Marquer comme important
                </button>
              </div>

              {/* Reminder fields */}
              {formData.has_reminder && (
                <div className={`animate-slide-down-soft grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 rounded-xl bg-gradient-to-r ${isGerant ? 'from-[#F0E2E2] to-[#F0E2E2]/30' : 'from-amber-50 to-orange-50'} border ${isGerant ? 'border-[#E0C6C6]/60' : 'border-amber-200/60'}`}>
                  <div>
                    <label className={`flex items-center gap-1.5 text-[10px] font-bold ${isGerant ? 'text-[#905D5D]' : 'text-amber-700'} uppercase tracking-widest mb-1.5`}>
                      <Calendar size={11} className={isGerant ? 'text-[#905D5D]/60' : 'text-amber-500/60'} />
                      Date du rappel
                    </label>
                    <DatePicker
                      value={formData.reminder_date}
                      max={formData.activity_date || undefined}
                      onChange={e => setFormData(p => ({ ...p, reminder_date: e.target.value }))}
                      className={`!h-11 !rounded-xl ${isGerant ? '!border-[#E0C6C6] hover:!border-[#905D5D]/50 focus:!ring-[#905D5D]/20 focus:!border-[#905D5D]/50' : '!border-amber-200 hover:!border-amber-300 focus:!ring-amber-300/30 focus:!border-amber-300'} !bg-white !shadow-sm hover:!shadow-md`}
                    />
                  </div>
                  <div>
                    <label className={`flex items-center gap-1.5 text-[10px] font-bold ${isGerant ? 'text-[#905D5D]' : 'text-amber-700'} uppercase tracking-widest mb-1.5`}>
                      <Clock size={11} className={isGerant ? 'text-[#905D5D]/60' : 'text-amber-500/60'} />
                      Heure du rappel
                    </label>
                    <TimePicker
                      value={formData.reminder_time}
                      onChange={e => setFormData(p => ({ ...p, reminder_time: e.target.value }))}
                      className={`!h-11 !rounded-xl ${isGerant ? '!border-[#E0C6C6] hover:!border-[#905D5D]/50 focus:!ring-[#905D5D]/20 focus:!border-[#905D5D]/50' : '!border-amber-200 hover:!border-amber-300 focus:!ring-amber-300/30 focus:!border-amber-300'} !bg-white !shadow-sm hover:!shadow-md`}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setShowForm(false); setEditActivity(null); }}
                  className="px-5 py-2.5 text-xs font-semibold text-text-secondary rounded-xl border border-border/50 hover:bg-background hover:border-border transition-all duration-200"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.subject.trim()}
                  className={`px-5 py-2.5 text-xs font-semibold text-white rounded-xl bg-gradient-to-r ${isGerant ? 'from-[#905D5D] to-[#7D5050]' : 'from-accent to-indigo-600'} shadow-lg ${isGerant ? 'shadow-[#905D5D]/25' : 'shadow-accent/25'} hover:shadow-xl ${isGerant ? 'hover:shadow-[#905D5D]/30' : 'hover:shadow-accent/30'} hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg transition-all duration-200`}
                >
                  {editActivity ? 'Enregistrer les modifications' : 'Ajouter l\'activite'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        <div className="rounded-2xl border border-border/40 bg-card overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between bg-gradient-to-r from-background/50 to-transparent">
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-lg ${isGerant ? 'bg-[#905D5D]/10' : 'bg-accent/10'} flex items-center justify-center`}>
                <Clock size={13} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-text tracking-tight">
                  Historique
                </h4>
                <p className="text-[10px] text-text-secondary/50 font-medium">{total} activite{total > 1 ? 's' : ''} enregistree{total > 1 ? 's' : ''}</p>
              </div>
            </div>
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              className={`p-2 rounded-xl ${isGerant ? 'hover:bg-[#905D5D]/10 hover:text-[#905D5D]' : 'hover:bg-accent/10 hover:text-accent'} text-text-secondary/40 transition-all duration-200 hover:rotate-180`}
              title="Rafraichir"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-start gap-3 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded-lg skeleton-shimmer" />
                    <div className="h-3 w-32 rounded-lg skeleton-shimmer" />
                    <div className="h-3 w-64 rounded-lg skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative mb-4">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${isGerant ? 'from-[#905D5D]/10 to-[#E7D5D5]' : 'from-accent/10 to-indigo-100'} flex items-center justify-center animate-pulse-glow`}>
                  <FileText size={32} className={isGerant ? 'text-[#905D5D]/40' : 'text-accent/40'} />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-gradient-to-br ${isGerant ? 'from-[#905D5D] to-[#7D5050]' : 'from-accent to-indigo-600'} flex items-center justify-center shadow-lg ${isGerant ? 'shadow-[#905D5D]/20' : 'shadow-accent/20'}`}>
                  <Hash size={13} className="text-white" />
                </div>
              </div>
              <p className="text-sm font-semibold text-text-secondary/60 mb-1">Aucune activite</p>
              <p className="text-xs text-text-secondary/40">Commencez par ajouter une activite</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className={`absolute left-[39px] top-0 bottom-0 w-px bg-gradient-to-b ${isGerant ? 'from-[#905D5D]/20' : 'from-accent/20'} via-border to-transparent`} />

              <div className="divide-y divide-border/20">
                {activities.map((a, i) => {
                  const tm = getTypeMeta(a.type);
                  const Icon = tm.icon;
                  return (
                    <div
                      key={a.id}
                      id={`activity-${a.id}`}
                      className={`animate-stagger group relative px-5 py-4 ${isGerant ? 'hover:bg-[#905D5D]/[0.02]' : 'hover:bg-accent/[0.02]'} transition-all duration-300 scroll-mt-20`}
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Timeline dot */}
                        <div className="relative flex-shrink-0 z-10">
                          <div className={`w-[30px] h-[30px] rounded-xl bg-gradient-to-br ${tm.gradient} flex items-center justify-center shadow-md ${tm.glow} timeline-dot-anim transition-transform duration-200 group-hover:scale-110`}>
                            <Icon size={14} className="text-white" />
                          </div>
                          {a.is_important && (
                            <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-amber-400'} border-2 border-white flex items-center justify-center animate-pulse-soft`}>
                              <Star size={7} className="text-white fill-white" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className={`text-sm font-bold text-text ${isGerant ? 'group-hover:text-[#905D5D]' : 'group-hover:text-accent'} transition-colors duration-200`}>{a.subject}</h4>
                            {a.type === 'rendez_vous' && a.status && (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_META[a.status]?.bg || DEFAULT_STATUS.bg} ${STATUS_META[a.status]?.color || DEFAULT_STATUS.color} border ${STATUS_META[a.status]?.border || DEFAULT_STATUS.border}`}>
                                {STATUS_META[a.status]?.label || 'En attente'}
                              </span>
                            )}
                            {a.alarm_sent && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200/60">
                                <Lock size={9} /> Verrouillee
                              </span>
                            )}
                            {a.has_reminder && (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${isGerant ? 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]/60' : 'bg-amber-50 text-amber-600 border-amber-200/60'}`}>
                                <Bell size={9} /> Rappel
                              </span>
                            )}
                            {a.type === 'visite' && a.visit_property_id && (
                              <button
                                onClick={() => openBonDeVisite(a)}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200/60 hover:bg-violet-100 transition-colors"
                                title="Ouvrir le bon de visite"
                              >
                                <FileText size={9} /> Bon de visite
                              </button>
                            )}
                            <span className={`ml-auto text-[10px] font-bold px-2.5 py-1 rounded-lg ${tm.bg} ${tm.color} border ${tm.border}`}>
                              {tm.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-text-secondary/50 mb-1.5">
                            <span className="font-medium text-text-secondary/70">{formatRelativeTime(a.activity_date)}</span>
                            {a.direction && (
                              <>
                                <span className="text-border/50">|</span>
                                <span className={`inline-flex items-center gap-1 font-medium px-1.5 py-0.5 rounded-md ${
                                  a.direction === 'sortant' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                                }`}>
                                  {a.direction === 'sortant' ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                                  {a.direction === 'sortant' ? 'Sortant' : 'Entrant'}
                                </span>
                              </>
                            )}
                            {a.author_name && (
                              <>
                                <span className="text-border/50">|</span>
                                <span className="font-medium">{a.author_name}</span>
                              </>
                            )}
                          </div>

                          {a.description && (
                            <p className="text-xs text-text-secondary/60 line-clamp-2 leading-relaxed mb-1.5">{a.description}</p>
                          )}

                          {a.has_reminder && a.reminder_date && (
                            <div className={`inline-flex items-center gap-1.5 mt-1 text-[11px] font-medium ${isGerant ? 'text-[#905D5D] bg-[#E7D5D5]/80' : 'text-amber-600 bg-amber-50/80'} px-2.5 py-1 rounded-lg border ${isGerant ? 'border-[#E0C6C6]/40' : 'border-amber-200/40'}`}>
                              <Bell size={11} className="animate-pulse-soft" />
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
                                  ? 'hover:bg-violet-50 text-text-secondary/30 hover:text-violet-600 hover:scale-110'
                                  : 'text-text-secondary/20 cursor-not-allowed'
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
                                className="p-2 rounded-xl hover:bg-emerald-50 text-text-secondary/30 hover:text-emerald-600 transition-all duration-200 hover:scale-110"
                                title="Confirmer le rendez-vous"
                              >
                                <Check size={14} />
                              </button>
                              {!!a.activity_date && new Date(a.activity_date) <= new Date() && (
                                <button
                                  onClick={() => handleStatusChange(a, 'termine')}
                                  className="p-2 rounded-xl hover:bg-blue-50 text-text-secondary/30 hover:text-blue-600 transition-all duration-200 hover:scale-110"
                                  title="Marquer le rendez-vous terminé"
                                >
                                  <CheckCircle size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => handleStatusChange(a, 'annule')}
                                className="p-2 rounded-xl hover:bg-red-50 text-text-secondary/30 hover:text-red-500 transition-all duration-200 hover:scale-110"
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
                                  className="p-2 rounded-xl hover:bg-blue-50 text-text-secondary/30 hover:text-blue-600 transition-all duration-200 hover:scale-110"
                                  title="Marquer le rendez-vous terminé"
                                >
                                  <CheckCircle size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => handleStatusChange(a, 'annule')}
                                className="p-2 rounded-xl hover:bg-red-50 text-text-secondary/30 hover:text-red-500 transition-all duration-200 hover:scale-110"
                                title="Annuler le rendez-vous"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setDetailActivity(a)}
                            className={`p-2 rounded-xl ${isGerant ? 'hover:bg-[#905D5D]/10 hover:text-[#905D5D]' : 'hover:bg-accent/10 hover:text-accent'} text-text-secondary/30 transition-all duration-200 hover:scale-110`}
                            title="Voir"
                          >
                            <Eye size={14} />
                          </button>
                          {!a.alarm_sent && a.status !== 'annule' && a.status !== 'termine' && (a.type !== 'visite' || canVisite) && (
                            <>
                              <button
                                onClick={() => openEdit(a)}
                                className={`p-2 rounded-xl ${isGerant ? 'hover:bg-[#E7D5D5] hover:text-[#905D5D]' : 'hover:bg-amber-50 hover:text-amber-600'} text-text-secondary/30 transition-all duration-200 hover:scale-110`}
                                title="Modifier"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(a.id)}
                                className="p-2 rounded-xl hover:bg-red-50 text-text-secondary/30 hover:text-red-500 transition-all duration-200 hover:scale-110"
                                title="Supprimer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3.5 border-t border-border/30 flex items-center justify-between bg-gradient-to-r from-background/30 to-transparent">
              <span className="text-[11px] font-medium text-text-secondary/50">
                {((page - 1) * LIMIT) + 1}-{Math.min(page * LIMIT, total)} sur {total}
              </span>
              <div className="flex items-center gap-1.5 bg-background/80 rounded-xl border border-border/40 p-0.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-20 disabled:hover:bg-transparent transition-all duration-200"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-3 text-xs font-bold text-text tabular-nums">{page}/{totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-20 disabled:hover:bg-transparent transition-all duration-200"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Dialog */}
        <Dialog isOpen={!!detailActivity} onClose={() => setDetailActivity(null)} title="" size="md">
          {detailActivity && (() => {
            const tm = getTypeMeta(detailActivity.type);
            const Icon = tm.icon;
            return (
              <div className="space-y-5">
                {/* Header */}
                <div className={`relative -m-6 mb-0 p-6 pb-5 rounded-t-2xl bg-gradient-to-br ${isGerant ? 'from-[#905D5D] to-[#7D5050]' : 'from-accent via-indigo-600 to-purple-600'}`}>
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-40" />
                  <div className="relative flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <Icon size={22} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white leading-tight">{detailActivity.subject}</h3>
                      <p className="text-sm text-white/70 mt-1">{formatDateTime(detailActivity.activity_date)}</p>
                    </div>
                    <button
                      onClick={() => setDetailActivity(null)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200 hover:rotate-90"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="relative flex gap-2 mt-4">
                    {detailActivity.type === 'rendez_vous' && detailActivity.status && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg ${
                        detailActivity.status === 'annule' ? 'bg-red-400/20 text-red-100 border border-red-300/20' :
                        detailActivity.status === 'termine' ? 'bg-blue-400/20 text-blue-100 border border-blue-300/20' :
                        detailActivity.status === 'confirme' ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-300/20' :
                        isGerant ? 'bg-[#905D5D]/20 text-white border border-[#905D5D]/30' : 'bg-amber-400/20 text-amber-100 border border-amber-300/20'
                      }`}>
                        {STATUS_META[detailActivity.status]?.label || 'En attente'}
                      </span>
                    )}
                    {detailActivity.is_important && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg ${isGerant ? 'bg-[#905D5D]/20 text-white border border-[#905D5D]/30' : 'bg-amber-400/20 text-amber-100 border border-amber-300/20'}`}>
                        <Star size={10} className="fill-current" /> Important
                      </span>
                    )}
                    <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white/15 text-white/90 border border-white/10">
                      {tm.label}
                    </span>
                    {detailActivity.direction && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white/15 text-white/90 border border-white/10">
                        {detailActivity.direction === 'sortant' ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                        {detailActivity.direction === 'sortant' ? 'Sortant' : 'Entrant'}
                      </span>
                    )}
                    {detailActivity.alarm_sent && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-red-400/20 text-red-100 border border-red-300/20">
                        <Lock size={10} /> Verrouillee
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-background to-background/50 border border-border/30">
                      <span className="text-[10px] font-bold text-text-secondary/40 uppercase tracking-widest">Direction</span>
                      <p className="mt-1.5 text-sm font-semibold text-text">{detailActivity.direction === 'sortant' ? 'Sortant (Agent > Client)' : detailActivity.direction === 'entrant' ? 'Entrant (Client > Agent)' : 'Non applicable'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-background to-background/50 border border-border/30">
                      <span className="text-[10px] font-bold text-text-secondary/40 uppercase tracking-widest">Auteur</span>
                      <div className="mt-1.5 flex items-center gap-2">
                        <p className="text-sm font-semibold text-text">{detailActivity.author_name || 'Non renseigne'}</p>
                        {detailActivity.author_role && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md ${
                            detailActivity.author_role === 'admin'
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}>
                            {detailActivity.author_role === 'admin' ? <Shield size={9} /> : <User size={9} />}
                            {detailActivity.author_role === 'admin' ? 'Admin' : 'Agent'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {detailActivity.has_reminder && detailActivity.reminder_date && (
                    <div className={`p-4 rounded-xl bg-gradient-to-r ${isGerant ? 'from-[#F0E2E2] to-[#F0E2E2]/30' : 'from-amber-50 to-orange-50'} border ${isGerant ? 'border-[#E0C6C6]/60' : 'border-amber-200/60'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${isGerant ? 'bg-[#905D5D]' : 'bg-amber-500'} flex items-center justify-center shadow-sm ${isGerant ? 'shadow-[#905D5D]/20' : 'shadow-amber-200'}`}>
                          <Bell size={14} className="text-white" />
                        </div>
                        <div>
                          <span className={`text-[10px] font-bold ${isGerant ? 'text-[#905D5D]' : 'text-amber-600'} uppercase tracking-widest`}>Rappel programme</span>
                          <p className={`text-sm font-bold ${isGerant ? 'text-[#905D5D]' : 'text-amber-800'}`}>{formatDateTime(detailActivity.reminder_date)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {detailActivity.description && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-background to-background/50 border border-border/30">
                      <span className="text-[10px] font-bold text-text-secondary/40 uppercase tracking-widest">Description</span>
                      <p className="mt-2 text-sm text-text/75 whitespace-pre-wrap leading-relaxed">{detailActivity.description}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-3 border-t border-border/30">
                  {/* Rendez-vous status actions */}
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
                  {/* Edit/Delete for non-locked, non-terminal activities */}
                  {!detailActivity.alarm_sent && detailActivity.status !== 'annule' && detailActivity.status !== 'termine' && (detailActivity.type !== 'visite' || canVisite) && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setDetailActivity(null); openEdit(detailActivity); }}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold ${isGerant ? 'text-[#905D5D] border-[#905D5D]/20 bg-[#905D5D]/5 hover:bg-[#905D5D]/10' : 'text-accent border-accent/20 bg-accent/5 hover:bg-accent/10'} rounded-xl border transition-all duration-200`}
                      >
                        <Edit3 size={13} /> Modifier
                      </button>
                      <button
                        onClick={() => { setDetailActivity(null); setDeleteConfirm(detailActivity.id); }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-500 rounded-xl border border-red-200/60 bg-red-50 hover:bg-red-100 transition-all duration-200"
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
            );
          })()}
        </Dialog>

        {/* Delete Dialog */}
        <Dialog isOpen={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="" size="sm">
          <div className="text-center py-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200 animate-pop-in">
              <Trash2 size={28} className="text-white" />
            </div>
            <h3 className="text-base font-bold text-text mb-1.5">Supprimer l'activite ?</h3>
            <p className="text-sm text-text-secondary/60 mb-6">Cette action est irreversible.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 text-xs font-semibold text-text-secondary rounded-xl border border-border/50 hover:bg-background transition-all duration-200"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 text-xs font-semibold text-white rounded-xl bg-gradient-to-r from-red-500 to-rose-600 shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Supprimer
              </button>
            </div>
          </div>
        </Dialog>

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
                    <div className={`w-8 h-8 border-2 ${isGerant ? 'border-[#905D5D]' : 'border-accent'} border-t-transparent rounded-full animate-spin mb-3`} />
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
