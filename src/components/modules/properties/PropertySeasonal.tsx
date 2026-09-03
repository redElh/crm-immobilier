import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '../../ui/Dialog';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import { DatePicker } from '../../ui/DatePicker';
import {
  Calendar, DollarSign, Settings, ChevronLeft, ChevronRight,
  Sun, Lock, Plus, Edit3, Trash2, CheckCircle, Copy, User, CreditCard
} from 'react-feather';
import { useConfidential } from '../confidentiality/ConfidentialContext';
import { fetchClients, fetchClientById, updateClient } from '../../../services/clientService';
import { calcClientCompletion } from '../../../utils/clientCompletion';
import { Input } from '../../ui/Input';
import { fetchReservations, createReservation, updateReservation, deleteReservation } from '../../../services/reservationService';
import { updateProperty } from '../../../services/propertyService';
import { useStageChrome } from '../calendar/useStageChrome';
import { StagePanel, STAGE_HUES } from '../../dashboard/Stage';
import StageModal from '../calendar/StageModal';

const SLATE_STAGE_HUE = { a: '#94A3B8', b: '#475569', glow: 'rgba(148,163,184,0.40)', line: '#94A3B8' } as const;

type DayStatus = 'available' | 'reserved' | 'blocked';

interface CalendarDay {
  date: string;
  day: number;
  status: DayStatus;
  price?: number;
  reservationId?: string;
}

interface Reservation {
  id: string;
  clientId?: string;
  clientName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  languages: string[];
  startDate: string;
  endDate: string;
  nights: number;
  adults: number;
  children: number;
  babies: number;
  pricePerNight: number;
  totalPrice: number;
  optionsPrice: number;
  grandTotal: number;
  depositPaid: number;
  balanceDue: number;
  status: 'option' | 'confirmed' | 'cancelled' | 'occupied';
  options: { id: string; name: string; price: number; qty: number }[];
}

interface PricePeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  pricePerNight: number;
  minNights: number;
}

interface OptionService {
  id: string;
  name: string;
  price: number;
  type: 'unique' | 'per_person_per_night' | 'per_night' | 'per_stay';
}

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS_SHORT = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];

const initialReservations: Reservation[] = [
  {
    id: 'r1', clientName: 'Marie Dupont', firstName: 'Marie', lastName: 'Dupont',
    email: 'marie.dupont@email.com', phone: '+212 6 12 34 56 78', languages: ['Français'],
    startDate: '2026-06-01', endDate: '2026-06-05', nights: 4,
    adults: 2, children: 1, babies: 0,
    pricePerNight: 1200, totalPrice: 4800, optionsPrice: 950, grandTotal: 5750,
    depositPaid: 1725, balanceDue: 4025,
    status: 'confirmed',
    options: [
      { id: 'opt1', name: 'Ménage fin de séjour', price: 150, qty: 1 },
      { id: 'opt2', name: 'Petit-déjeuner', price: 50, qty: 8 },
    ],
  },
  {
    id: 'r2', clientName: 'Pierre Martin', firstName: 'Pierre', lastName: 'Martin',
    email: 'pierre.martin@email.com', phone: '+212 6 98 76 54 32', languages: ['Français'],
    startDate: '2026-06-20', endDate: '2026-06-25', nights: 5,
    adults: 2, children: 0, babies: 0,
    pricePerNight: 1500, totalPrice: 7500, optionsPrice: 0, grandTotal: 7500,
    depositPaid: 2250, balanceDue: 5250,
    status: 'option',
    options: [],
  },
];

const initialPriceGrid: PricePeriod[] = [
  { id: 'p1', name: 'Basse saison', startDate: '01/01/2026', endDate: '31/03/2026', pricePerNight: 600, minNights: 2 },
  { id: 'p2', name: 'Saison intermédiaire', startDate: '01/04/2026', endDate: '31/05/2026', pricePerNight: 900, minNights: 3 },
  { id: 'p3', name: 'Haute saison', startDate: '01/06/2026', endDate: '31/08/2026', pricePerNight: 1500, minNights: 5 },
  { id: 'p4', name: 'Événements', startDate: '15/12/2026', endDate: '05/01/2027', pricePerNight: 2500, minNights: 7 },
];

const LANGUES_OPTIONS = [
  { value: 'Francais', label: 'Français' },
  { value: 'Anglais', label: 'Anglais' },
  { value: 'Arabe', label: 'Arabe' },
  { value: 'Espagnol', label: 'Espagnol' },
  { value: 'Allemand', label: 'Allemand' },
  { value: 'Italien', label: 'Italien' },
  { value: 'Neerlandais', label: 'Néerlandais' },
  { value: 'Russe', label: 'Russe' },
  { value: 'Chinois', label: 'Chinois' },
];

const initialOptions: OptionService[] = [
  { id: 'o1', name: 'Ménage fin de séjour', price: 150, type: 'unique' },
  { id: 'o2', name: 'Petit-déjeuner', price: 50, type: 'per_person_per_night' },
  { id: 'o3', name: 'Parking privé', price: 100, type: 'per_night' },
  { id: 'o4', name: 'Panier de bienvenue', price: 75, type: 'unique' },
  { id: 'o5', name: 'Lit bébé', price: 50, type: 'per_stay' },
  { id: 'o6', name: 'Location serviettes plage', price: 30, type: 'per_person_per_night' },
];

function generateCalendarDays(year: number, month: number, reservations: Reservation[], blockedDates: string[]): CalendarDay[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: CalendarDay[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    let status: DayStatus = 'available';
    let reservationId: string | undefined;

    const res = reservations.find(r => dateStr >= r.startDate && dateStr <= r.endDate);
    if (res) { status = 'reserved'; reservationId = res.id; }
    if (blockedDates.includes(dateStr)) { status = 'blocked'; reservationId = undefined; }

    days.push({ date: dateStr, day: d, status, reservationId });
  }
  return days;
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function parseGridDate(s: string): Date {
  if (s.includes('-')) {
    const [yyyy, mm, dd] = s.split('-');
    return new Date(+yyyy, +mm - 1, +dd);
  }
  const [dd, mm, yyyy] = s.split('/');
  return new Date(+yyyy, +mm - 1, +dd);
}

function daysBetween(startStr: string, endStr: string): number {
  if (!startStr || !endStr) return 1;
  const parse = (s: string) => {
    if (s.includes('-')) { const [y, m, d] = s.split('-'); return new Date(+y, +m - 1, +d); }
    const [d, m, y] = s.split('/');
    return new Date(+y, +m - 1, +d);
  };
  const diff = Math.ceil((parse(endStr).getTime() - parse(startStr).getTime()) / 86400000);
  return Math.max(1, diff);
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatCurrency(n: number): string {
  return n.toLocaleString('fr-FR') + ' MAD';
}

function isPastDate(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return d < today;
}

interface PropertySeasonalProps {
  property?: any;
  isGerant?: boolean;
}

export const PropertySeasonal = ({ property, isGerant = false }: PropertySeasonalProps = {}) => {
  const { revealed } = useConfidential();
  const { staged, dark } = useStageChrome();
  const navigate = useNavigate();
  const { agentId, adminId } = useParams<{ agentId?: string; adminId?: string }>();
  const basePath = adminId ? `/admin/${adminId}` : agentId ? `/${agentId}` : '';
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear] = useState(now.getFullYear());

  const [reservations, setReservations] = useState<Reservation[]>(() => {
    if (property?.reservations?.length) return property.reservations;
    return [];
  });
  const [priceGrid, setPriceGrid] = useState<PricePeriod[]>(() => {
    if (property?.priceGrid?.length) return property.priceGrid;
    return initialPriceGrid;
  });
  const updatePriceGrid = (updater: PricePeriod[] | ((prev: PricePeriod[]) => PricePeriod[])) => {
    setPriceGrid(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (property?.id) {
        updateProperty(property.id, { priceGrid: next }).catch(() => {});
      }
      return next;
    });
  };
  const [options, setOptions] = useState<OptionService[]>(() => {
    if (property?.options?.length) return property.options;
    return initialOptions;
  });
  const updateOptions = (updater: OptionService[] | ((prev: OptionService[]) => OptionService[])) => {
    setOptions(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (property?.id) {
        updateProperty(property.id, { options: next }).catch(() => {});
      }
      return next;
    });
  };
  const blockedDatesKey = `blockedDates_${property?.id || 'default'}`;
  const [blockedDates, setBlockedDates] = useState<string[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(blockedDatesKey) || 'null');
      if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch {}
    if (property?.blockedDates?.length) return property.blockedDates;
    return ['2026-06-04', '2026-06-06', '2026-06-07', '2026-06-08'];
  });
  const setBlockedDatesPersistent = (updater: string[] | ((prev: string[]) => string[])) => {
    setBlockedDates(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem(blockedDatesKey, JSON.stringify(next));
      return next;
    });
  };
  const dayPricesKey = `dayPrices_${property?.id || 'default'}`;
  const [dayPrices, setDayPrices] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(dayPricesKey) || '{}'); } catch { return {}; }
  });
  const setDayPricesPersistent = (updater: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => {
    setDayPrices(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem(dayPricesKey, JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (property?.id) {
      fetchReservations({ property_id: String(property.id) })
        .then(data => {
          setReservations(Array.isArray(data) ? data : []);
        })
        .catch(() => {});
    }
  }, [property?.id]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: string; end: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; date: string } | null>(null);

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showResPriceModal, setShowResPriceModal] = useState(false);
  const [resPriceReservation, setResPriceReservation] = useState<Reservation | null>(null);
  const [showPriceGridModal, setShowPriceGridModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [editingPricePeriod, setEditingPricePeriod] = useState<PricePeriod | null>(null);
  const [editingOption, setEditingOption] = useState<OptionService | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const days = generateCalendarDays(currentYear, currentMonth, reservations, blockedDates);
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const getReservation = (id: string) => reservations.find(r => r.id === id);
  const getDayPrice = (dateStr: string) => {
    if (dayPrices[dateStr] !== undefined) return dayPrices[dateStr];
    const d = new Date(dateStr + 'T00:00:00');
    const period = priceGrid.find(p => {
      const start = parseGridDate(p.startDate);
      const end = parseGridDate(p.endDate);
      return d >= start && d <= end;
    });
    return period?.pricePerNight;
  };

  const handleDateClick = (date: string) => {
    if (isPastDate(date)) return;
    setContextMenu(null);
    setSelectedDate(date);
    const status = days.find(d => d.date === date)?.status;
    if (status === 'available') {
      setShowReservationModal(true);
      setEditingReservation(null);
    } else if (status === 'reserved') {
      const res = getReservation(days.find(d => d.date === date)?.reservationId || '');
      if (res) { setEditingReservation(res); setShowReservationModal(true); }
    }
  };

  const handleDateRightClick = (e: React.MouseEvent, date: string) => {
    e.preventDefault();
    if (isPastDate(date)) return;
    setContextMenu({ x: e.clientX, y: e.clientY, date });
  };

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleMouseDown = (date: string) => {
    if (isPastDate(date)) return;
    setIsDragging(true);
    setDragStart(date);
    setSelectedRange(null);
  };

  const handleMouseEnter = (date: string) => {
    setHoveredDate(date);
    if (isDragging && dragStart) {
      setSelectedRange({ start: dragStart, end: date });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && selectedRange) {
      setContextMenu(null);
      setShowBlockModal(true);
    }
    setIsDragging(false);
  };

  const isInRange = (date: string) => {
    if (!selectedRange || !dragStart) return false;
    const d = new Date(date + 'T00:00:00');
    const start = new Date(selectedRange.start + 'T00:00:00');
    const end = new Date(selectedRange.end + 'T00:00:00');
    const ds = new Date(dragStart + 'T00:00:00');
    const actualStart = ds < end ? ds : end;
    const actualEnd = ds < end ? end : ds;
    return d >= actualStart && d <= actualEnd;
  };

  const navBtn = `flex h-8 w-8 items-center justify-center rounded-xl border transition-all hover:scale-110 ${
    dark ? 'border-white/10 text-slate-400 hover:bg-white/10 hover:text-white' : 'border-teal-900/10 text-teal-900/50 hover:bg-teal-900/5 hover:text-teal-900'
  }`;
  const formSkin = `seasonal-stage-form${dark ? '' : ' seasonal-light'}`;
  const monthPill = `min-w-[132px] rounded-xl border px-3 py-1.5 text-center font-mono text-xs font-bold tabular-nums ${
    dark ? 'border-white/[0.08] bg-white/[0.03] text-slate-200' : 'border-teal-900/10 bg-white/60 text-slate-700'
  }`;

  const statusColors: Record<DayStatus, string> = staged ? {
    available: dark
      ? 'border border-white/[0.07] bg-white/[0.025] hover:border-emerald-400/50 hover:bg-emerald-400/[0.12] hover:shadow-[0_0_16px_-4px_rgba(52,211,153,0.45)]'
      : 'border border-teal-900/[0.08] bg-white/60 hover:border-emerald-500/50 hover:bg-emerald-50 hover:shadow-[0_4px_14px_-6px_rgba(16,185,129,0.45)]',
    reserved: dark
      ? 'border border-rose-400/30 bg-rose-400/[0.10] hover:border-rose-300/60 hover:bg-rose-400/[0.20] hover:shadow-[0_0_16px_-4px_rgba(251,113,133,0.55)]'
      : 'border border-rose-400/40 bg-rose-100 hover:border-rose-400/70 hover:bg-rose-200/80 hover:shadow-[0_4px_14px_-6px_rgba(244,63,94,0.5)]',
    blocked: dark
      ? 'border border-transparent bg-white/[0.02] opacity-45 hover:bg-white/[0.05]'
      : 'border border-transparent bg-slate-900/[0.04] opacity-45 hover:bg-slate-900/[0.07]',
  } : {
    available: 'bg-emerald-50/30 hover:bg-emerald-50 text-text',
    reserved: 'bg-rose-50 hover:bg-rose-100 text-rose-800',
    blocked: 'bg-gray-100 hover:bg-gray-200 text-gray-400 line-through',
  };

  const selRing = staged
    ? dark
      ? 'ring-2 ring-violet-400 shadow-[0_0_18px_rgba(167,139,250,0.45)] scale-105 z-10'
      : 'ring-2 ring-teal-600 shadow-[0_0_14px_rgba(13,148,136,0.35)] scale-105 z-10'
    : '';
  const endRing = staged
    ? dark
      ? 'ring-2 ring-violet-400 shadow-[0_0_22px_rgba(167,139,250,0.6)] z-20'
      : 'ring-2 ring-teal-600 shadow-[0_0_18px_rgba(13,148,136,0.5)] z-20'
    : '';

  const statusLabels: Record<DayStatus, string> = {
    available: 'Disponible',
    reserved: 'Réservé',
    blocked: 'Indisponible',
  };

  const reservationStatusLabels: Record<string, string> = {
    option: 'Option', confirmed: 'Confirmé', cancelled: 'Annulé', occupied: 'Occupé',
  };

  const reservationStatusColors: Record<string, string> = {
    option: isGerant ? 'bg-[#E7D5D5] text-[#905D5D]' : 'bg-amber-100 text-amber-700', confirmed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700', occupied: 'bg-blue-100 text-blue-700',
  };

  const syncVoyageurFromReservation = async (res: Reservation) => {
    if (!res.clientId) return;
    try {
      const statusMap: Record<string, string> = {
        option: 'En attente',
        confirmed: 'Actif',
        cancelled: 'Annulé',
        occupied: 'Actif',
      };
      const payload: Record<string, unknown> = {
        name: res.clientName || undefined,
        firstName: res.firstName || undefined,
        lastName: res.lastName || undefined,
        dateArrivee: res.startDate || undefined,
        dateDepart: res.endDate || undefined,
        dateDebut: res.startDate || undefined,
        dateExpiration: res.endDate || undefined,
        nbNuits: res.nights,
        nbAdultes: res.adults,
        nbEnfants: res.children,
        tarifNuit: res.pricePerNight,
        budgetNuitMin: res.pricePerNight,
        budgetNuitMax: res.pricePerNight,
        prixMin: res.pricePerNight,
        prixMax: res.pricePerNight,
        budgetTotal: res.grandTotal,
        montantTotalHorsOptions: res.totalPrice,
        montantTotalAvecOptions: res.grandTotal,
        acompteMontant: res.depositPaid,
        acompteVersee: res.depositPaid,
        soldeRestant: res.balanceDue,
        bienReserve: String(property?.id || ''),
        bienReserveNom: property?.title || property?.reference || `Bien #${property?.id || ''}`,
        optionsSelectionnees: res.options.length > 0 ? res.options.map(o => {
          if (o.name.includes('énage') || o.name.toLowerCase().includes('menage')) return 'Menage';
          if (o.name.includes('éjeuner') || o.name.toLowerCase().includes('dejeuner')) return 'Petit-dejeuner';
          if (o.name.includes('Bienvenue') || o.name.toLowerCase().includes('bienvenue')) return 'Panier de bienvenue';
          if (o.name.includes('bébé') || o.name.toLowerCase().includes('bebe')) return 'Lit bébé';
          return o.name;
        }) : undefined,
        reservationOptions: res.options.length > 0 ? res.options.map(o => ({
          name: o.name,
          price: o.price,
          qty: o.qty,
          total: o.price * o.qty,
        })) : undefined,
        statutMandat: statusMap[res.status] || undefined,
        statutReservation: res.status === 'confirmed' ? 'Confirmée' : res.status === 'cancelled' ? 'Annulée' : res.status === 'occupied' ? 'Occupé' : 'En attente',
        statutMetier: res.status === 'confirmed' ? 'Confirmé' : res.status === 'cancelled' ? 'Annulé' : res.status === 'occupied' ? 'En séjour' : 'Réservation en cours',
        numeroReservation: res.id ? `RES-${property?.id || ''}-${res.id}` : undefined,
        dateReservation: new Date().toISOString().slice(0, 10),
        nbVoyageurs: res.adults,
        nbEnfantsSejour: res.children,
        languesParlees: res.languages.length > 0 ? res.languages : undefined,
      };
      const client = await fetchClientById(res.clientId).catch(() => null);
      const postSync = { ...client, ...payload };
      await updateClient(res.clientId, { ...payload, completion: calcClientCompletion(postSync) });
    } catch (err) {
      console.error('Error syncing voyageur from reservation:', err);
    }
  };

  const clearVoyageurReservationData = async (clientId: string, clientName?: string) => {
    try {
      const cleared = {
        name: clientName || undefined,
        _clear: ['mandat_status'],
        dateArrivee: null, dateDepart: null, dateDebut: null, dateExpiration: null,
        dateSignature: null,
        nbNuits: null, nbAdultes: null, nbEnfants: null,
        tarifNuit: null, budgetNuitMin: null, budgetNuitMax: null, prixMin: null, prixMax: null,
        budgetTotal: null, montantTotalHorsOptions: null, montantTotalAvecOptions: null,
        acompteMontant: null, acompteVersee: null, soldeRestant: null,
        bienReserve: null, bienReserveNom: null,
        optionsSelectionnees: null, reservationOptions: null,
        statutReservation: 'Brouillon', statutMandat: null, statutMetier: 'En recherche',
        numeroMandat: null, numeroReservation: null, dateReservation: null,
        nbVoyageurs: null, nbEnfantsSejour: null,
        cautionsMontant: null,
      };
      const client = await fetchClientById(clientId).catch(() => null);
      const postClear = { ...client, ...cleared };
      await updateClient(clientId, { ...cleared, completion: calcClientCompletion(postClear) });
    } catch (err) {
      console.error('Error clearing voyageur reservation data:', err);
    }
  };

  const handleSaveReservation = async (res: Reservation) => {
    const resId = res.id;
    const isEdit = resId && !resId.startsWith('r');
    try {
      const payload: Record<string, unknown> = {
        propertyId: property?.id,
        clientId: res.clientId || undefined,
        clientName: res.clientName,
        firstName: res.firstName,
        lastName: res.lastName,
        email: res.email,
        phone: res.phone,
        languages: res.languages,
        startDate: res.startDate,
        endDate: res.endDate,
        nights: res.nights,
        adults: res.adults,
        children: res.children,
        babies: res.babies,
        pricePerNight: res.pricePerNight,
        totalPrice: res.totalPrice,
        optionsPrice: res.optionsPrice,
        grandTotal: res.grandTotal,
        depositPaid: res.depositPaid,
        balanceDue: res.balanceDue,
        status: res.status,
        options: res.options,
      };
      if (isEdit) {
        await updateReservation(resId, payload);
      } else {
        await createReservation(payload);
      }
      if (property?.id) {
        const data = await fetchReservations({ property_id: String(property.id) });
        setReservations(Array.isArray(data) ? data : []);
      }
      if (res.clientId) {
        syncVoyageurFromReservation(res);
      }
    } catch (err) {
      console.error('Error saving reservation:', err);
    }
    setEditingReservation(null);
    setShowReservationModal(false);
  };

  const handleMakeAvailable = (date: string) => {
    const day = days.find(d => d.date === date);
    if (!day || day.status !== 'reserved' || !day.reservationId) return;
    const res = getReservation(day.reservationId);
    if (!res) return;
    const reservationId = res.id;
    const propertyId = property?.id;
    const clientId = res.clientId;
    setContextMenu(null);
    setConfirmDialog({
      title: 'Rendre disponible',
      message: `La réservation de ${res.clientName} (${formatDateShort(res.startDate)} → ${formatDateShort(res.endDate)}) sera entièrement annulée. Toutes les dates de cette réservation deviendront disponibles.`,
      onConfirm: async () => {
        setReservations(prev => prev.filter(r => r.id !== reservationId));
        setConfirmDialog(null);
        if (clientId) {
          try {
            await clearVoyageurReservationData(clientId, res.clientName);
          } catch {}
        }
        try {
          await deleteReservation(reservationId);
          if (propertyId) {
            const data = await fetchReservations({ property_id: String(propertyId) });
            setReservations(Array.isArray(data) ? data : []);
          }
        } catch {}
        if (clientId) {
          navigate(`${basePath}/clients/${clientId}`);
        }
      },
    });
  };

  const calendarBody = (
    <>
      {/* Legend */}
      {staged ? (
        <div className={`mb-4 flex flex-wrap items-center gap-3 text-xs ${dark ? 'text-slate-400' : 'text-teal-900/55'}`}>
          {([
            ['Disponible', '#34D399'],
            ['Réservé', '#FB7185'],
            ['Indisponible', dark ? '#64748B' : '#94A3B8'],
          ] as [string, string][]).map(([label, color]) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}88` }} />
              {label}
            </span>
          ))}
          <span className={`ml-auto flex items-center gap-1 ${dark ? 'text-slate-600' : 'text-teal-900/30'}`}>
            <Info size={12} /> Cliquer sur une date pour réserver, glisser pour bloquer
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-4 mb-3 text-xs text-text-secondary flex-wrap">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" /> Disponible</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-100 border border-rose-300" /> Réservé</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-300" /> Indisponible</span>
          <span className="flex items-center gap-1 ml-auto text-text-secondary/40">
            <Info size={12} /> Cliquer sur une date pour réserver, glisser pour bloquer
          </span>
        </div>
      )}

      {/* Day grid */}
      <div className={`grid select-none ${staged ? 'grid-cols-7 gap-1' : 'grid-cols-7 gap-0.5'}`}>
          {DAYS_SHORT.map(d => (
            <div key={d} className="text-center text-[11px] font-medium text-text-secondary/50 py-1.5">{d}</div>
          ))}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
          {days.map(day => {
            const inRange = isInRange(day.date);
            const isStart = day.date === selectedRange?.start || day.date === dragStart;
            const isEnd = day.date === selectedRange?.end;
            const res = day.reservationId ? getReservation(day.reservationId) : null;
            const price = res && day.status === 'reserved' ? res.pricePerNight : getDayPrice(day.date);
            const past = isPastDate(day.date);

            const miniStatusBadge: Record<string, string> = staged ? {
              option: dark ? 'bg-amber-400/15 text-amber-300' : 'bg-amber-200 text-amber-800',
              confirmed: dark ? 'bg-emerald-400/15 text-emerald-300' : 'bg-emerald-200 text-emerald-800',
              cancelled: dark ? 'bg-red-400/15 text-red-300' : 'bg-red-200 text-red-700',
              occupied: dark ? 'bg-sky-400/15 text-sky-300' : 'bg-sky-200 text-sky-800',
            } : {
              option: isGerant ? 'bg-[#E7D5D5] text-[#7D5050]' : 'bg-amber-200 text-amber-800',
              confirmed: 'bg-emerald-200 text-emerald-800',
              cancelled: 'bg-red-200 text-red-700',
              occupied: 'bg-blue-200 text-blue-800',
            };
            const miniStatusLabel: Record<string, string> = {
              option: 'Opt', confirmed: 'Conf', cancelled: 'Ann', occupied: 'Occ',
            };

            return (
              <div
                key={day.date}
                onClick={() => handleDateClick(day.date)}
                onContextMenu={(e) => handleDateRightClick(e, day.date)}
                onMouseDown={() => handleMouseDown(day.date)}
                onMouseEnter={() => handleMouseEnter(day.date)}
                className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all select-none
                  ${past ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}
                  ${statusColors[day.status]}
                  ${inRange ? (staged ? `${selRing}` : isGerant ? 'ring-2 ring-[#905D5D] bg-[#905D5D]/5 scale-105 z-10' : 'ring-2 ring-accent bg-accent/5 scale-105 z-10') : ''}
                  ${isStart || isEnd ? (staged ? `${endRing}` : isGerant ? 'ring-2 ring-[#905D5D] shadow-md z-20' : 'ring-2 ring-accent shadow-md z-20') : ''}
                  ${hoveredDate === day.date && !past ? (staged ? 'scale-[1.05] z-10' : 'shadow-sm') : ''}`}
              >
                <span className={`font-medium text-sm leading-none ${
                  staged
                    ? day.status === 'reserved'
                      ? dark ? 'text-rose-100' : 'text-rose-900'
                      : day.status === 'blocked'
                        ? dark ? 'text-slate-500 line-through' : 'text-slate-400 line-through'
                        : dark ? 'text-slate-200' : 'text-slate-700'
                    : 'text-text'
                }`}>{day.day}</span>
                {day.status === 'reserved' && res && (
                  <span className={`text-[6px] leading-none mt-0.5 px-1 py-px rounded font-semibold ${miniStatusBadge[res.status] || ''}`}>
                    {revealed ? (miniStatusLabel[res.status] || res.status) : '••'}
                  </span>
                )}
                {price && (
                  <span className={`text-[7px] leading-none mt-0.5 ${
                    day.status === 'reserved'
                      ? dark ? 'text-rose-300 font-medium' : 'text-rose-600 font-medium'
                      : staged
                        ? dark ? 'text-slate-500' : 'text-teal-900/40'
                        : 'text-text-secondary/50'
                  }`}>
                    {price} MAD
                  </span>
                )}
                {day.status === 'blocked' && (
                  <Lock size={7} className={staged ? (dark ? 'text-slate-600 mt-0.5' : 'text-slate-400 mt-0.5') : 'text-gray-400 mt-0.5'} />
                )}
                {inRange && !staged && (
                  <div className={`absolute inset-0 rounded-lg ${isGerant ? 'bg-[#905D5D]/5' : 'bg-accent/5'} border-2 ${isGerant ? 'border-[#905D5D]/30' : 'border-accent/30'} pointer-events-none`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend -> upcoming reservations summary */}
        {reservations.filter(r => {
          const rs = new Date(r.startDate + 'T00:00:00');
          const re = new Date(r.endDate + 'T00:00:00');
          const monthStart = new Date(currentYear, currentMonth, 1);
          const monthEnd = new Date(currentYear, currentMonth + 1, 0);
          return rs <= monthEnd && re >= monthStart;
        }).length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/30">
            <p className="text-xs font-medium text-text-secondary mb-2">Réservations du mois</p>
            <div className="space-y-1.5">
              {reservations.filter(r => {
                const rs = new Date(r.startDate + 'T00:00:00');
                const re = new Date(r.endDate + 'T00:00:00');
                const monthStart = new Date(currentYear, currentMonth, 1);
                const monthEnd = new Date(currentYear, currentMonth + 1, 0);
                return rs <= monthEnd && re >= monthStart;
              }              ).map(r => (
                <div key={r.id}
                  className={`flex items-center justify-between text-sm p-2.5 rounded-lg cursor-pointer transition-colors ${
                    staged
                      ? dark ? 'border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]' : 'border border-teal-900/[0.07] bg-white/60 hover:bg-emerald-50'
                      : 'bg-background hover:bg-border/30'
                  }`}
                  onClick={() => { setEditingReservation(r); setShowReservationModal(true); }}>
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${r.status === 'confirmed' ? 'bg-emerald-500' : r.status === 'option' ? (isGerant ? 'bg-[#905D5D]' : 'bg-amber-500') : r.status === 'cancelled' ? 'bg-red-400' : 'bg-blue-500'}`}
                      style={staged ? { boxShadow: `0 0 8px ${r.status === 'confirmed' ? 'rgba(52,211,153,0.7)' : r.status === 'option' ? 'rgba(251,191,36,0.6)' : 'rgba(148,163,184,0.5)'}` } : undefined} />
                    <div>
                      <span className={`font-medium ${staged ? (dark ? 'text-slate-100' : 'text-slate-800') : 'text-text'}`}>{revealed ? r.clientName : '••••••••'}</span>
                      {revealed && r.email && <span className={`text-xs ml-2 ${staged ? (dark ? 'text-slate-500' : 'text-teal-900/40') : 'text-text-secondary'}`}>{r.email}</span>}
                      {revealed && r.phone && <span className={`text-xs ml-2 ${staged ? (dark ? 'text-slate-500' : 'text-teal-900/40') : 'text-text-secondary'}`}>{r.phone}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs ${staged ? (dark ? 'text-slate-400 font-mono tabular-nums' : 'text-teal-900/55 font-mono tabular-nums') : 'text-text-secondary'}`}>{formatDateShort(r.startDate)} → {formatDateShort(r.endDate)} · {r.nights} nuits</span>
                    <span className={`text-xs font-semibold ${staged ? (dark ? 'text-emerald-300' : 'text-emerald-700') : 'text-text'}`}>{formatCurrency(r.grandTotal)}</span>
                    {staged ? (
                      <span
                        className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          color: r.status === 'confirmed' ? STAGE_HUES.emerald.a : r.status === 'option' ? STAGE_HUES.amber.a : r.status === 'cancelled' ? '#FB7185' : STAGE_HUES.sky.a,
                          borderColor: r.status === 'confirmed' ? `${STAGE_HUES.emerald.a}40` : r.status === 'option' ? `${STAGE_HUES.amber.a}40` : r.status === 'cancelled' ? 'rgba(251,113,133,0.35)' : `${STAGE_HUES.sky.a}40`,
                          backgroundColor: r.status === 'confirmed' ? `${STAGE_HUES.emerald.a}10` : r.status === 'option' ? `${STAGE_HUES.amber.a}10` : r.status === 'cancelled' ? 'rgba(251,113,133,0.08)' : `${STAGE_HUES.sky.a}10`,
                        }}
                      >
                        {reservationStatusLabels[r.status]}
                      </span>
                    ) : (
                      <Badge className={reservationStatusColors[r.status]} size="sm">{reservationStatusLabels[r.status]}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </>
  );

  return (
    <div className="space-y-6" onMouseUp={handleMouseUp}>
      {/* Calendar */}
      {staged ? (
        <StagePanel
          title="Calendrier des réservations"
          icon={Calendar}
          hue={STAGE_HUES.amber}
          action={
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentMonth(m => m === 0 ? 11 : m - 1)} aria-label="Mois précédent" className={navBtn}><ChevronLeft size={14} /></button>
              <span className={monthPill}>{MONTHS[currentMonth]} {currentYear}</span>
              <button onClick={() => setCurrentMonth(m => m === 11 ? 0 : m + 1)} aria-label="Mois suivant" className={navBtn}><ChevronRight size={14} /></button>
            </div>
          }
        >
          {calendarBody}
        </StagePanel>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                Calendrier des réservations
              </h3>
              <span className="text-xs text-text-secondary/60">Clic : réserver · Clic droit : actions · Glisser : bloquer · Dates passées : non modifiables</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-ghost p-1.5" onClick={() => setCurrentMonth(m => m === 0 ? 11 : m - 1)}><ChevronLeft size={14} /></button>
              <span className="text-sm font-medium w-32 text-center">{MONTHS[currentMonth]} {currentYear}</span>
              <button className="btn-ghost p-1.5" onClick={() => setCurrentMonth(m => m === 11 ? 0 : m + 1)}><ChevronRight size={14} /></button>
            </div>
          </div>
          {calendarBody}
        </div>
      )}

      {/* Context Menu */}
      {createPortal(
        <AnimatePresence>
          {contextMenu && (() => {
            const menuW = 232;
            const menuH = 280;
            const left = Math.min(contextMenu.x, (typeof window !== 'undefined' ? window.innerWidth : 1280) - menuW - 12);
            const top = Math.min(contextMenu.y, (typeof window !== 'undefined' ? window.innerHeight : 800) - menuH - 12);
            const itemCls = `w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium transition-colors text-left ${
              dark ? 'text-slate-300 hover:bg-white/[0.07] hover:text-white' : 'text-slate-600 hover:bg-teal-900/[0.06] hover:text-teal-900'
            }`;
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="fixed z-[150] w-56 overflow-hidden rounded-2xl border py-1.5 backdrop-blur-2xl"
                style={{
                  left,
                  top,
                  borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.10)',
                  background: dark
                    ? 'linear-gradient(180deg, rgba(17,24,50,0.96), rgba(9,13,30,0.97))'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.97), rgba(240,253,250,0.96))',
                  boxShadow: dark
                    ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 30px 70px -20px rgba(0,0,0,0.85)'
                    : 'inset 0 1px 0 rgba(255,255,255,1), 0 24px 60px -22px rgba(13,148,136,0.5)',
                }}
                onClick={e => e.stopPropagation()}
              >
                <div className={`mb-1 border-b px-3.5 pb-2 pt-1 font-mono text-[11px] font-semibold tabular-nums ${dark ? 'border-white/[0.07] text-slate-500' : 'border-teal-900/[0.07] text-teal-900/45'}`}>
                  {formatDateDisplay(contextMenu.date)}
                </div>
                {days.find(d => d.date === contextMenu.date)?.status === 'blocked' ? (
                  <button className={itemCls} style={{ color: STAGE_HUES.emerald.a }}
                    onClick={() => { setBlockedDatesPersistent(prev => prev.filter(d => d !== contextMenu.date)); setContextMenu(null); }}>
                    <CheckCircle size={13} /> Rendre disponible
                  </button>
                ) : (
                  <button className={itemCls}
                    onClick={() => { setSelectedDate(contextMenu.date); setContextMenu(null); setShowBlockModal(true); }}>
                    <Lock size={13} /> Rendre indisponible
                  </button>
                )}
                {days.find(d => d.date === contextMenu.date)?.status === 'reserved' && (
                  <button className={itemCls} style={{ color: STAGE_HUES.emerald.a }}
                    onClick={() => handleMakeAvailable(contextMenu.date)}>
                    <CheckCircle size={13} /> Rendre disponible
                  </button>
                )}
                {days.find(d => d.date === contextMenu.date)?.status === 'reserved' ? (
                  <button className={itemCls} style={{ color: dark ? '#FCD34D' : '#B45309' }}
                    onClick={() => {
                      const day = days.find(d => d.date === contextMenu.date);
                      const res = day?.reservationId ? getReservation(day.reservationId) : null;
                      if (res) { setResPriceReservation(res); setShowResPriceModal(true); }
                      setContextMenu(null);
                    }}>
                    <DollarSign size={13} /> Modifier le prix de réservation
                  </button>
                ) : (
                  <button className={itemCls} style={{ color: dark ? '#FCD34D' : '#B45309' }}
                    onClick={() => { setSelectedDate(contextMenu.date); setContextMenu(null); setShowPriceModal(true); }}>
                    <DollarSign size={13} /> Modifier le prix
                  </button>
                )}
                {days.find(d => d.date === contextMenu.date)?.status !== 'reserved' && (
                  <button className={itemCls} style={{ color: dark ? STAGE_HUES.violet.a : '#6C5ECF' }}
                    onClick={() => { setContextMenu(null); setEditingReservation(null); setShowReservationModal(true); }}>
                    <Plus size={13} /> Ajouter une réservation
                  </button>
                )}
                {days.find(d => d.date === contextMenu.date)?.status === 'reserved' && (
                  <button className={itemCls} style={{ color: dark ? STAGE_HUES.fuchsia.a : '#A21CAF' }}
                    onClick={() => { const res = getReservation(days.find(d => d.date === contextMenu.date)?.reservationId || ''); if (res) { setEditingReservation(res); setShowReservationModal(true); } setContextMenu(null); }}>
                    <Info size={13} /> Voir les détails
                  </button>
                )}
              </motion.div>
            );
          })()}
        </AnimatePresence>,
        document.body,
      )}

      {/* Custom confirm dialog */}
      {staged ? (
        <StageModal open={!!confirmDialog} onClose={() => setConfirmDialog(null)} title={confirmDialog?.title || ''} icon={CheckCircle} hue={STAGE_HUES.amber} maxWidth="max-w-sm">
          <div className={formSkin}>
          {confirmDialog && (
            <div className="space-y-4">
              <p className={`text-sm ${dark ? 'text-slate-300' : 'text-teal-900/70'}`}>{confirmDialog.message}</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirmDialog(null)}>Annuler</Button>
                <Button variant="default" onClick={confirmDialog.onConfirm}>Confirmer</Button>
              </div>
            </div>
          )}
          </div>
        </StageModal>
      ) : (
        <Dialog isOpen={!!confirmDialog} onClose={() => setConfirmDialog(null)} title={confirmDialog?.title || ''} size="sm">
          {confirmDialog && (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">{confirmDialog.message}</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirmDialog(null)}>Annuler</Button>
                <Button variant="default" onClick={confirmDialog.onConfirm}>Confirmer</Button>
              </div>
            </div>
          )}
        </Dialog>
      )}

      {/* === MODAL 1: Modifier le prix d'une date === */}
      {staged ? (
        <StageModal
          open={showPriceModal}
          onClose={() => setShowPriceModal(false)}
          title={`Modifier le tarif${selectedDate ? ` — ${formatDateDisplay(selectedDate)}` : ''}`}
          icon={DollarSign}
          hue={STAGE_HUES.emerald}
          eyebrow="Tarif par nuit"
          maxWidth="max-w-md"
        >
          <div className={formSkin}>
          <PriceEditForm
            date={selectedDate || ''}
            defaultPrice={property?.seasonalPriceMin || 600}
            isGerant={isGerant}
            currentPrice={selectedDate ? getDayPrice(selectedDate) : undefined}
            currentMonth={currentMonth}
            currentYear={currentYear}
            onSave={(dates, price) => {
              setDayPricesPersistent(prev => {
                const next = { ...prev };
                dates.forEach(d => { next[d] = price; });
                return next;
              });
              setShowPriceModal(false);
            }}
            onCancel={() => setShowPriceModal(false)}
          />
          </div>
        </StageModal>
      ) : (
        <Dialog isOpen={showPriceModal} onClose={() => setShowPriceModal(false)} title={`Modifier le tarif - ${selectedDate ? formatDateDisplay(selectedDate) : ''}`} size="md">
          <PriceEditForm
            date={selectedDate || ''}
            defaultPrice={property?.seasonalPriceMin || 600}
            isGerant={isGerant}
            currentPrice={selectedDate ? getDayPrice(selectedDate) : undefined}
            currentMonth={currentMonth}
            currentYear={currentYear}
            onSave={(dates, price) => {
              setDayPricesPersistent(prev => {
                const next = { ...prev };
                dates.forEach(d => { next[d] = price; });
                return next;
              });
              setShowPriceModal(false);
            }}
            onCancel={() => setShowPriceModal(false)}
          />
        </Dialog>
      )}

      {/* === MODAL: Modifier le prix de réservation === */}
      {staged ? (
        <StageModal
          open={showResPriceModal}
          onClose={() => { setShowResPriceModal(false); setResPriceReservation(null); }}
          title="Modifier le prix de réservation"
          icon={DollarSign}
          hue={STAGE_HUES.amber}
          maxWidth="max-w-md"
        >
          <div className={formSkin}>
          {resPriceReservation && (
            <ReservationPriceEditForm
              reservation={resPriceReservation}
              defaultPrice={property?.seasonalPriceMin || 600}
              isGerant={isGerant}
              onSave={async (newPricePerNight) => {
                const res = resPriceReservation;
                const newTotalPrice = newPricePerNight * res.nights;
                const newGrandTotal = newTotalPrice + res.optionsPrice;
                const updated = { ...res, pricePerNight: newPricePerNight, totalPrice: newTotalPrice, grandTotal: newGrandTotal, balanceDue: newGrandTotal - res.depositPaid };
                setReservations(prev => prev.map(r => r.id === res.id ? updated : r));
                setShowResPriceModal(false);
                setResPriceReservation(null);
                try {
                  await updateReservation(res.id, { pricePerNight: newPricePerNight, totalPrice: newTotalPrice, grandTotal: newGrandTotal, balanceDue: newGrandTotal - res.depositPaid });
                  if (property?.id) {
                    const data = await fetchReservations({ property_id: String(property.id) });
                    setReservations(Array.isArray(data) ? data : []);
                  }
                } catch {}
              }}
              onCancel={() => { setShowResPriceModal(false); setResPriceReservation(null); }}
            />
          )}
          </div>
        </StageModal>
      ) : (
        <Dialog isOpen={showResPriceModal} onClose={() => { setShowResPriceModal(false); setResPriceReservation(null); }}
          title={`Modifier le prix de réservation`} size="md">
          {resPriceReservation && (
            <ReservationPriceEditForm
              reservation={resPriceReservation}
              defaultPrice={property?.seasonalPriceMin || 600}
              isGerant={isGerant}
              onSave={async (newPricePerNight) => {
                const res = resPriceReservation;
                const newTotalPrice = newPricePerNight * res.nights;
                const newGrandTotal = newTotalPrice + res.optionsPrice;
                const updated = { ...res, pricePerNight: newPricePerNight, totalPrice: newTotalPrice, grandTotal: newGrandTotal, balanceDue: newGrandTotal - res.depositPaid };
                setReservations(prev => prev.map(r => r.id === res.id ? updated : r));
                setShowResPriceModal(false);
                setResPriceReservation(null);
                try {
                  await updateReservation(res.id, { pricePerNight: newPricePerNight, totalPrice: newTotalPrice, grandTotal: newGrandTotal, balanceDue: newGrandTotal - res.depositPaid });
                  if (property?.id) {
                    const data = await fetchReservations({ property_id: String(property.id) });
                    setReservations(Array.isArray(data) ? data : []);
                  }
                } catch {}
              }}
              onCancel={() => { setShowResPriceModal(false); setResPriceReservation(null); }}
            />
          )}
        </Dialog>
      )}

      {/* === MODAL 2: Bloquer des dates === */}
      {staged ? (
        <StageModal
          open={showBlockModal}
          onClose={() => setShowBlockModal(false)}
          title={`Bloquer des dates — ${MONTHS[currentMonth]} ${currentYear}`}
          icon={Lock}
          hue={SLATE_STAGE_HUE}
          maxWidth="max-w-md"
        >
          <div className={formSkin}>
          <BlockDatesForm
            rangeStart={selectedRange?.start || selectedDate || ''}
            rangeEnd={selectedRange?.end || selectedDate || ''}
            isGerant={isGerant}
            onSave={(reason) => {
              const start = selectedRange?.start || selectedDate || '';
              const end = selectedRange?.end || selectedDate || '';
              const newBlocked: string[] = [];
              const s = new Date(start + 'T00:00:00');
              const e = new Date(end + 'T00:00:00');
              for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                newBlocked.push(`${y}-${m}-${day}`);
              }
              setBlockedDatesPersistent(prev => Array.from(new Set([...prev, ...newBlocked])));
              setSelectedRange(null);
              setShowBlockModal(false);
            }}
            onCancel={() => { setSelectedRange(null); setShowBlockModal(false); }} />
          </div>
        </StageModal>
      ) : (
        <Dialog isOpen={showBlockModal} onClose={() => setShowBlockModal(false)}
          title={`Bloquer des dates - ${MONTHS[currentMonth]} ${currentYear}`} size="md">
          <BlockDatesForm
            rangeStart={selectedRange?.start || selectedDate || ''}
            rangeEnd={selectedRange?.end || selectedDate || ''}
            isGerant={isGerant}
            onSave={(reason) => {
              const start = selectedRange?.start || selectedDate || '';
              const end = selectedRange?.end || selectedDate || '';
              const newBlocked: string[] = [];
              const s = new Date(start + 'T00:00:00');
              const e = new Date(end + 'T00:00:00');
              for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                newBlocked.push(`${y}-${m}-${day}`);
              }
              setBlockedDatesPersistent(prev => Array.from(new Set([...prev, ...newBlocked])));
              setSelectedRange(null);
              setShowBlockModal(false);
            }}
            onCancel={() => { setSelectedRange(null); setShowBlockModal(false); }} />
        </Dialog>
      )}

      {/* === MODAL 3: Réservation === */}
      {staged ? (
        <StageModal
          open={showReservationModal}
          onClose={() => { setEditingReservation(null); setShowReservationModal(false); }}
          title={editingReservation ? `Réservation — du ${formatDateShort(editingReservation.startDate)} au ${formatDateShort(editingReservation.endDate)}` : 'Nouvelle réservation'}
          eyebrow={editingReservation ? 'Dossier voyageur' : 'Créer une réservation'}
          icon={Calendar}
          hue={STAGE_HUES.violet}
          maxWidth="max-w-xl"
          centered
          bodyClassName="max-h-[calc(100vh-14rem)] overflow-y-auto scrollbar-thin smooth-scroll"
        >
          <div className={formSkin}>
          <ReservationForm
            reservation={editingReservation}
            clickedDate={selectedDate}
            isGerant={isGerant}
            options={options}
            revealed={revealed}
            defaultPricePerNight={property?.seasonalPriceMin || 600}
            priceGrid={priceGrid}
            onSave={handleSaveReservation}
            onCancel={() => { setEditingReservation(null); setShowReservationModal(false); }}
          />
          </div>
        </StageModal>
      ) : (
        <Dialog isOpen={showReservationModal} onClose={() => { setEditingReservation(null); setShowReservationModal(false); }}
          title={editingReservation ? `Réservation - du ${formatDateShort(editingReservation.startDate)} au ${formatDateShort(editingReservation.endDate)}` : 'Nouvelle réservation'} size="xl">
          <ReservationForm
            reservation={editingReservation}
            clickedDate={selectedDate}
            isGerant={isGerant}
            options={options}
            revealed={revealed}
            defaultPricePerNight={property?.seasonalPriceMin || 600}
            priceGrid={priceGrid}
            onSave={handleSaveReservation}
            onCancel={() => { setEditingReservation(null); setShowReservationModal(false); }}
          />
        </Dialog>
      )}

      {/* === MODAL 4: Grille tarifaire === */}
      {staged ? (
        <StageModal
          open={showPriceGridModal}
          onClose={() => setShowPriceGridModal(false)}
          title="Grille tarifaire — 2026"
          icon={DollarSign}
          hue={STAGE_HUES.emerald}
          maxWidth="max-w-[676px]"
          centered
          bodyClassName="max-h-[calc(100vh-14rem)] overflow-y-auto scrollbar-thin smooth-scroll"
        >
          <div className={formSkin}>
          <PriceGridForm
            periods={priceGrid}
            onUpdate={updatePriceGrid}
            isGerant={isGerant}
            onClose={() => setShowPriceGridModal(false)}
            editingPeriod={editingPricePeriod}
            setEditingPeriod={setEditingPricePeriod} />
          </div>
        </StageModal>
      ) : (
        <Dialog isOpen={showPriceGridModal} onClose={() => setShowPriceGridModal(false)} title="Grille tarifaire - 2026" size="xl" className="max-w-[676px]">
          <PriceGridForm
            periods={priceGrid}
            onUpdate={updatePriceGrid}
            isGerant={isGerant}
            onClose={() => setShowPriceGridModal(false)}
            editingPeriod={editingPricePeriod}
            setEditingPeriod={setEditingPricePeriod} />
        </Dialog>
      )}

      {/* === MODAL 5: Options et services === */}
      {staged ? (
        <StageModal
          open={showOptionsModal}
          onClose={() => setShowOptionsModal(false)}
          title="Options et services — 2026"
          icon={Settings}
          hue={STAGE_HUES.fuchsia}
          maxWidth="max-w-lg"
          centered
          bodyClassName="max-h-[calc(100vh-14rem)] overflow-y-auto scrollbar-thin smooth-scroll"
        >
          <div className={formSkin}>
          <OptionsForm
            options={options}
            onUpdate={updateOptions}
            isGerant={isGerant}
            onClose={() => setShowOptionsModal(false)}
            editingOption={editingOption}
            setEditingOption={setEditingOption} />
          </div>
        </StageModal>
      ) : (
        <Dialog isOpen={showOptionsModal} onClose={() => setShowOptionsModal(false)} title="Options et services - 2026" size="lg">
          <OptionsForm
            options={options}
            onUpdate={updateOptions}
            isGerant={isGerant}
            onClose={() => setShowOptionsModal(false)}
            editingOption={editingOption}
            setEditingOption={setEditingOption} />
        </Dialog>
      )}

      {/* Price Grid + Options buttons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Grille tarifaire */}
        {staged ? (
          <StagePanel
            title="Grille tarifaire"
            icon={DollarSign}
            hue={STAGE_HUES.emerald}
            action={
              <button
                type="button"
                onClick={() => setShowPriceGridModal(true)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all duration-200 active:scale-95 ${
                  dark ? 'border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-300 hover:bg-emerald-400/15' : 'border-emerald-600/25 bg-emerald-500/[0.06] text-emerald-700 hover:bg-emerald-500/10'
                }`}
              >
                <Edit3 size={12} /> Gérer
              </button>
            }
          >
            <div className="space-y-2">
              {priceGrid.map(row => (
                <div
                  key={row.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-all duration-200 hover:-translate-y-px ${
                    dark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-teal-900/[0.07] bg-white/60'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{row.name}</p>
                    <p className={`mt-0.5 font-mono text-[11px] tabular-nums ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>{row.startDate} → {row.endDate}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-extrabold tabular-nums" style={{ color: STAGE_HUES.emerald.a }}>
                      {row.pricePerNight.toLocaleString('fr-FR')} MAD
                    </p>
                    <p className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-teal-900/40'}`}>min {row.minNights}</p>
                  </div>
                </div>
              ))}
            </div>
          </StagePanel>
        ) : (
          <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                Grille tarifaire
              </h3>
              <Button variant="outline" size="sm" icon={<Edit3 size={12} />} onClick={() => setShowPriceGridModal(true)}>
                Gérer
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left py-2 px-3 font-medium text-text-secondary text-xs">Période</th>
                    <th className="text-left py-2 px-3 font-medium text-text-secondary text-xs">Du</th>
                    <th className="text-left py-2 px-3 font-medium text-text-secondary text-xs">Au</th>
                    <th className="text-right py-2 px-3 font-medium text-text-secondary text-xs">Prix/nuit</th>
                    <th className="text-right py-2 px-3 font-medium text-text-secondary text-xs">Min</th>
                  </tr>
                </thead>
                <tbody>
                  {priceGrid.map(row => (
                    <tr key={row.id} className="border-b border-border/20 hover:bg-background/50 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-xs">{row.name}</td>
                      <td className="py-2.5 px-3 text-xs text-text-secondary">{row.startDate}</td>
                      <td className="py-2.5 px-3 text-xs text-text-secondary">{row.endDate}</td>
                      <td className={`py-2.5 px-3 text-right text-xs font-semibold ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>{row.pricePerNight.toLocaleString()} MAD</td>
                      <td className="py-2.5 px-3 text-right text-xs text-text-secondary">{row.minNights}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Options */}
        {staged ? (
          <StagePanel
            title="Options et services"
            icon={Settings}
            hue={STAGE_HUES.fuchsia}
            action={
              <button
                type="button"
                onClick={() => setShowOptionsModal(true)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all duration-200 active:scale-95 ${
                  dark ? 'border-fuchsia-400/25 bg-fuchsia-400/[0.07] text-fuchsia-300 hover:bg-fuchsia-400/15' : 'border-fuchsia-600/25 bg-fuchsia-500/[0.06] text-fuchsia-700 hover:bg-fuchsia-500/10'
                }`}
              >
                <Edit3 size={12} /> Gérer
              </button>
            }
          >
            <div className="space-y-2">
              {options.map(opt => {
                const labelMap: Record<string, string> = {
                  unique: 'Unique', per_night: 'Par jour',
                  per_person_per_night: 'Par pers./jour', per_stay: 'Par séjour',
                };
                return (
                  <div
                    key={opt.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-all duration-200 hover:-translate-y-px ${
                      dark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-teal-900/[0.07] bg-white/60'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          color: dark ? '#E879F9' : '#A21CAF',
                          borderColor: dark ? 'rgba(232,121,249,0.30)' : 'rgba(162,28,175,0.22)',
                          backgroundColor: dark ? 'rgba(232,121,249,0.08)' : 'rgba(162,28,175,0.05)',
                        }}
                      >
                        {labelMap[opt.type] || opt.type}
                      </span>
                      <span className={`truncate text-sm font-medium ${dark ? 'text-slate-200' : 'text-slate-700'}`}>{opt.name}</span>
                    </div>
                    <span className="shrink-0 text-sm font-extrabold tabular-nums" style={{ color: STAGE_HUES.fuchsia.a }}>
                      {formatCurrency(opt.price)}
                    </span>
                  </div>
                );
              })}
            </div>
          </StagePanel>
        ) : (
          <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                Options et services
              </h3>
              <Button variant="outline" size="sm" icon={<Edit3 size={12} />} onClick={() => setShowOptionsModal(true)}>
                Gérer
              </Button>
            </div>
            <div className="space-y-2">
              {options.map(opt => {
                const labelMap: Record<string, string> = {
                  unique: 'Unique', per_night: 'Par jour',
                  per_person_per_night: 'Par pers./jour', per_stay: 'Par séjour',
                };
                return (
                  <div key={opt.id} className="flex items-center justify-between p-2.5 rounded-lg bg-background">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" size="sm">{labelMap[opt.type] || opt.type}</Badge>
                      <span className="text-sm">{opt.name}</span>
                    </div>
                    <span className={`text-sm font-medium ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>{formatCurrency(opt.price)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ===== Sub-components ===== */

function Info({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

/* Modal 1: Price Edit */
function PriceEditForm({ date, defaultPrice, currentPrice, currentMonth, currentYear, onSave, onCancel, isGerant }: {
  date: string; defaultPrice: number; currentPrice?: number;
  currentMonth: number; currentYear: number;
  onSave: (dates: string[], price: number) => void; onCancel: () => void;
  isGerant: boolean;
}) {
  const [price, setPrice] = useState(currentPrice ?? defaultPrice);
  const [applyMode, setApplyMode] = useState<'single' | 'range' | 'period'>('single');
  const [rangeStart, setRangeStart] = useState(date);
  const [rangeEnd, setRangeEnd] = useState('');

  const handleSave = () => {
    let dates: string[] = [];
    if (applyMode === 'single') {
      dates = [date];
    } else if (applyMode === 'range') {
      if (!rangeStart || !rangeEnd) return;
      const s = new Date(rangeStart + 'T00:00:00');
      const e = new Date(rangeEnd + 'T00:00:00');
      if (e < s) return;
      const cur = new Date(s);
      while (cur <= e) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        cur.setDate(cur.getDate() + 1);
      }
    } else if (applyMode === 'period') {
      const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
      const startDay = new Date(date + 'T00:00:00').getDate();
      for (let d = startDay; d <= lastDay; d++) {
        const m = String(currentMonth + 1).padStart(2, '0');
        dates.push(`${currentYear}-${m}-${String(d).padStart(2, '0')}`);
      }
    }
    onSave(dates, price);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
        <DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
        <div>
          <p className="text-sm font-medium">Prix par nuit</p>
          <p className="text-xs text-text-secondary">{date ? formatDateShort(date) : ''}</p>
        </div>
        <input type="number" value={price} onChange={e => setPrice(+e.target.value)}
          className={`ml-auto w-24 h-9 px-3 text-sm text-right rounded-lg border border-border bg-card font-semibold focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20' : 'focus:ring-accent/20'}`} />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-text-secondary">Appliquer à :</p>
        {[
          { value: 'single', label: 'Cette date uniquement' },
          { value: 'range', label: 'Cette date et les suivantes jusqu\'au' },
          { value: 'period', label: 'Toutes les dates de cette période' },
        ].map(opt => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-background transition-colors">
            <input type="radio" name="applyMode" value={opt.value} checked={applyMode === opt.value}
              onChange={() => setApplyMode(opt.value as typeof applyMode)}
              className={`${isGerant ? 'text-[#905D5D]' : 'text-accent'} ${isGerant ? 'focus:ring-[#905D5D]/20' : 'focus:ring-accent/20'}`} />
            <span className="text-sm">{opt.label}</span>
          </label>
        ))}
        {applyMode === 'range' && (
          <div className="flex items-center gap-2 ml-6 mt-1">
            <DatePicker value={rangeStart} onChange={e => setRangeStart(e.target.value)} className="flex-1" />
            <span className="text-xs text-text-secondary">→</span>
            <DatePicker value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} className="flex-1" />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button variant="default" onClick={handleSave}>Enregistrer</Button>
      </div>
    </div>
  );
}

/* Modal: Reservation Price Edit */
function ReservationPriceEditForm({ reservation, defaultPrice, onSave, onCancel, isGerant }: {
  reservation: Reservation; defaultPrice: number;
  onSave: (newPricePerNight: number) => void; onCancel: () => void;
  isGerant: boolean;
}) {
  const [pricePerNight, setPricePerNight] = useState(reservation.pricePerNight || defaultPrice);
  const nights = reservation.nights || 1;
  const totalPrice = pricePerNight * nights;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
        <DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
        <div>
          <p className="text-sm font-medium">Prix par nuit</p>
          <p className="text-xs text-text-secondary">{formatDateShort(reservation.startDate)} → {formatDateShort(reservation.endDate)} · {nights} nuit{nights > 1 ? 's' : ''}</p>
        </div>
        <input type="number" value={pricePerNight} onChange={e => setPricePerNight(+e.target.value)}
          className={`ml-auto w-24 h-9 px-3 text-sm text-right rounded-lg border border-border bg-card font-semibold focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20' : 'focus:ring-accent/20'}`} />
      </div>

      <div className={`flex items-center justify-between p-3 rounded-lg ${isGerant ? 'bg-[#905D5D]/5' : 'bg-accent/5'} border ${isGerant ? 'border-[#905D5D]/20' : 'border-accent/20'}`}>
        <span className="text-sm font-medium">Total ({nights} nuit{nights > 1 ? 's' : ''})</span>
        <span className={`text-sm font-bold ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>{totalPrice.toLocaleString('fr-FR')} MAD</span>
      </div>

      <div className={`p-3 rounded-lg ${isGerant ? 'bg-[#F0E2E2]' : 'bg-amber-50'} border ${isGerant ? 'border-[#E0C6C6]' : 'border-amber-200'}`}>
        <p className={`text-xs ${isGerant ? 'text-[#905D5D]' : 'text-amber-700'}`}>La modification du prix s'appliquera à l'ensemble des {nights} nuits de cette réservation.</p>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button variant="default" onClick={() => onSave(pricePerNight)}>Enregistrer</Button>
      </div>
    </div>
  );
}

/* Modal 2: Block Dates */
function BlockDatesForm({ rangeStart, rangeEnd, onSave, onCancel, isGerant }: {
  rangeStart: string; rangeEnd: string; onSave: (reason: string) => void; onCancel: () => void;
  isGerant: boolean;
}) {
  const [reason, setReason] = useState('maintenance');
  const [customReason, setCustomReason] = useState('');

  const reasons = [
    { value: 'maintenance', label: 'Maintenance / Travaux' },
    { value: 'internal', label: 'Réservation interne' },
    { value: 'owner', label: 'Propriétaire occupe' },
    { value: 'other', label: 'Autre' },
  ];

  const formatRange = () => {
    if (!rangeStart) return '';
    if (rangeStart === rangeEnd) return formatDateDisplay(rangeStart);
    return `${formatDateShort(rangeStart)} au ${formatDateShort(rangeEnd)}`;
  };

  return (
    <div className="space-y-4">
      <div className={`p-3 rounded-lg ${isGerant ? 'bg-[#F0E2E2]' : 'bg-amber-50'} border ${isGerant ? 'border-[#E0C6C6]' : 'border-amber-200'} text-sm ${isGerant ? 'text-[#7D5050]' : 'text-amber-800'}`}>
        Période : <strong>{formatRange()}</strong>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-text-secondary mb-1">Motif :</p>
        {reasons.map(r => (
          <label key={r.value} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-background transition-colors">
            <input type="radio" name="reason" value={r.value} checked={reason === r.value}
              onChange={() => setReason(r.value)}
              className={`${isGerant ? 'text-[#905D5D]' : 'text-accent'} ${isGerant ? 'focus:ring-[#905D5D]/20' : 'focus:ring-accent/20'}`} />
            <span className="text-sm">{r.label}</span>
          </label>
        ))}
        {reason === 'other' && (
          <input type="text" placeholder="Précisez le motif..." value={customReason} onChange={e => setCustomReason(e.target.value)}
            className={`w-full h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20' : 'focus:ring-accent/20'} mt-1`} />
        )}
      </div>

      <div className={`p-3 rounded-lg ${isGerant ? 'bg-[#F0E2E2]' : 'bg-amber-50'} border ${isGerant ? 'border-[#E0C6C6]' : 'border-amber-200'}`}>
        <div className="flex items-start gap-2">
          <Lock size={14} className={`${isGerant ? 'text-[#905D5D]' : 'text-amber-600'} mt-0.5 shrink-0`} />
          <p className={`text-sm ${isGerant ? 'text-[#7D5050]' : 'text-amber-800'}`}>
            Cette période sera entièrement bloquée et indisponible pour toute réservation. Aucun client ne pourra réserver ces dates.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button variant="default" onClick={() => onSave(customReason || reason)}>Bloquer</Button>
      </div>
    </div>
  );
}

/* Modal 3: Reservation Form */
function ReservationForm({ reservation, clickedDate, options, revealed, defaultPricePerNight, priceGrid, onSave, onCancel, isGerant }: {
  reservation: Reservation | null;
  clickedDate: string | null;
  options: OptionService[];
  revealed: boolean;
  defaultPricePerNight: number;
  priceGrid: PricePeriod[];
  onSave: (res: Reservation) => void;
  onCancel: () => void;
  isGerant: boolean;
}) {
  const isNew = !reservation;
  const [step, setStep] = useState<'option' | 'confirmed' | 'cancelled' | 'occupied'>(reservation?.status || 'option');
  const [firstName, setFirstName] = useState(reservation?.firstName || '');
  const [lastName, setLastName] = useState(reservation?.lastName || '');
  const [email, setEmail] = useState(reservation?.email || '');
  const [phone, setPhone] = useState(reservation?.phone || '');
  const [languages, setLanguages] = useState<string[]>(reservation?.languages || []);
  const [startDate, setStartDate] = useState(reservation?.startDate || clickedDate || '');
  const [endDate, setEndDate] = useState(reservation?.endDate || '');
  const [adults, setAdults] = useState(reservation?.adults || 1);
  const [children, setChildren] = useState(reservation?.children || 0);
  const [babies, setBabies] = useState(reservation?.babies || 0);
  const [pricePerNight, setPricePerNight] = useState(reservation?.pricePerNight || defaultPricePerNight);
  const [selectedOptions, setSelectedOptions] = useState<{ id: string; qty: number }[]>(
    reservation?.options.map(o => ({ id: o.id, qty: o.qty })) || []
  );
  const [depositPercent, setDepositPercent] = useState(30);

  const [voyageurContacts, setVoyageurContacts] = useState<{ id: string; label: string; firstName: string; lastName: string; email: string; phone: string; languages: string[] }[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>(reservation?.clientName ? '' : '');

  useEffect(() => {
    fetchClients({ type: 'voyageur' }).then(clients => {
      const bestByKey = new Map<string, any>();
      for (const c of clients) {
        if (!c.contactId && !c.originalClientId && !c.email) continue;
        const contactKey = String(c.contactId || c.originalClientId || '').trim();
        const key = contactKey
          || (c.email || '').toLowerCase().trim()
          || `${c.firstName || ''} ${c.lastName || ''} ${c.phone || ''}`.toLowerCase().trim();
        if (!key) continue;
        const existing = bestByKey.get(key);
        const better = (a: any, b: any) => {
          const aAgent = a.agentId || a.agent_id ? 1 : 0;
          const bAgent = b.agentId || b.agent_id ? 1 : 0;
          if (aAgent !== bAgent) return aAgent > bAgent;
          const ac = Number(a.completion) || 0;
          const bc = Number(b.completion) || 0;
          if (ac !== bc) return ac > bc;
          return new Date(a.updatedAt || 0) > new Date(b.updatedAt || 0);
        };
        if (!existing || better(c, existing)) bestByKey.set(key, c);
      }
      const mapped = Array.from(bestByKey.values()).map(c => {
        const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim() || (c as any).name || '';
        const parts = fullName.split(/\s+/).filter(Boolean);
        const firstName = (c.firstName as string) || (parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] || '');
        const lastName = (c.lastName as string) || (parts.length > 1 ? parts[parts.length - 1] : '');
        return {
          id: String(c.id),
          label: `${firstName} ${lastName}`.trim() || c.email || `#${c.id}`,
          firstName,
          lastName,
          email: c.email || '',
          phone: c.phone || '',
          languages: Array.isArray((c as any).languesParlees) ? (c as any).languesParlees : [],
        };
      });
      setVoyageurContacts(mapped);
    }).catch(() => {});
  }, []);

  const contactLocked = !!selectedContactId;

  useEffect(() => {
    if (reservation) return;
    if (startDate && priceGrid.length > 0) {
      const d = new Date(startDate + 'T00:00:00');
      const period = priceGrid.find(p => {
        const start = parseGridDate(p.startDate);
        const end = parseGridDate(p.endDate);
        return d >= start && d <= end;
      });
      if (period) setPricePerNight(period.pricePerNight);
    }
  }, [startDate, endDate]);

  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
    const contact = voyageurContacts.find(c => c.id === contactId);
    if (contact) {
      setFirstName(contact.firstName);
      setLastName(contact.lastName);
      setEmail(contact.email);
      setPhone(contact.phone);
      setLanguages(contact.languages.length > 0 ? contact.languages : []);
    }
  };

  const nights = startDate && endDate
    ? Math.max(0, Math.round((new Date(endDate + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTime()) / 86400000))
    : 0;

  const totalAccommodation = nights * pricePerNight;
  const totalOptions = selectedOptions.reduce((sum, so) => {
    const opt = options.find(o => o.id === so.id);
    if (!opt) return sum;
    if (opt.type === 'unique') return sum + opt.price;
    if (opt.type === 'per_night') return sum + opt.price * nights;
    if (opt.type === 'per_person_per_night') return sum + opt.price * (adults + children) * nights;
    if (opt.type === 'per_stay') return sum + opt.price;
    return sum + opt.price;
  }, 0);
  const grandTotal = totalAccommodation + totalOptions;
  const deposit = Math.round(grandTotal * depositPercent / 100);
  const balance = grandTotal - deposit;

  const reservationStatusLabels: Record<string, string> = {
    option: 'Option', confirmed: 'Confirmé', cancelled: 'Annulé', occupied: 'Occupé',
  };
  const reservationStatusColors: Record<string, string> = {
    option: isGerant ? 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]' : 'bg-amber-100 text-amber-700 border-amber-200',
    confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
    occupied: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const [activeTab, setActiveTab] = useState<'step' | 'participants' | 'pricing' | 'deposit'>('step');
  const { staged, dark } = useStageChrome();
  const TAB_ORDER: ('step' | 'participants' | 'pricing' | 'deposit')[] = ['step', 'participants', 'pricing', 'deposit'];

  const ghostBtn = `inline-flex h-9 items-center gap-1.5 rounded-xl border px-4 text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${
    dark
      ? 'border-white/12 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
      : 'border-teal-900/12 bg-white/70 text-teal-900/70 hover:bg-white hover:text-teal-900'
  }`;
  const primaryBtn = `inline-flex h-9 items-center gap-1.5 rounded-xl border px-4 text-sm font-bold text-white transition-all duration-200 active:scale-[0.97] ${
    dark
      ? 'border-white/25 bg-gradient-to-b from-[#8B7CFF] to-[#5646C9] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_10px_26px_-8px_rgba(124,92,255,0.8)] hover:brightness-110'
      : 'border-white/50 bg-gradient-to-b from-teal-400 to-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_10px_26px_-10px_rgba(13,148,136,0.7)] hover:brightness-105'
  }`;

  return (
    <div className="space-y-4">
      {/* Mini tab bar */}
      {staged ? (
        <div
          className="flex flex-wrap gap-1 rounded-2xl border p-1.5"
          style={{
            borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)',
            background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)',
          }}
        >
          {[
            { id: 'step', label: 'Étape & Dates', icon: <Calendar size={13} /> },
            { id: 'participants', label: 'Participants', icon: <User size={13} /> },
            { id: 'pricing', label: 'Tarifs & Options', icon: <DollarSign size={13} /> },
            { id: 'deposit', label: 'Acompte', icon: <CheckCircle size={13} /> },
          ].map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-colors duration-200 ${
                  active ? 'text-white' : dark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-teal-900'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="resv-tab-pill"
                    className="absolute inset-0 rounded-xl border border-white/20"
                    style={{
                      backgroundImage: dark
                        ? 'linear-gradient(145deg, #8B7CFF, #5646C9)'
                        : 'linear-gradient(145deg, #2DD4BF, #0D9488)',
                      boxShadow: dark
                        ? 'inset 0 1px 0 rgba(255,255,255,0.4), 0 8px 20px -8px rgba(124,92,255,0.75)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 20px -8px rgba(13,148,136,0.65)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">{tab.icon}{tab.label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex border-b border-border/40 -mx-6 px-6">
          {[
            { id: 'step', label: 'Étape & Dates', icon: <Calendar size={13} /> },
            { id: 'participants', label: 'Participants', icon: <User size={13} /> },
            { id: 'pricing', label: 'Tarifs & Options', icon: <DollarSign size={13} /> },
            { id: 'deposit', label: 'Acompte', icon: <CheckCircle size={13} /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? (isGerant ? 'text-[#905D5D] border-[#905D5D]' : 'text-accent border-accent')
                  : 'text-text-secondary border-transparent hover:text-text'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      <div className="min-h-[200px]">
        {activeTab === 'step' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-2">ÉTAPE</label>
              <div className="flex gap-2 flex-wrap">
                {(['option', 'confirmed', 'cancelled', 'occupied'] as const).map(s => {
                  const active = step === s;
                  const pillHue = s === 'confirmed' ? STAGE_HUES.emerald : s === 'option' ? STAGE_HUES.amber : s === 'cancelled' ? { a: '#FB7185', glow: 'rgba(251,113,133,0.45)' } : STAGE_HUES.sky;
                  return (
                    <button key={s} onClick={() => setStep(s)}
                      className={`relative px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all duration-200 ${
                        !staged ? (active
                          ? reservationStatusColors[s] + ' border-transparent'
                          : 'bg-background text-text-secondary border-border hover:border-text-secondary/30')
                          : active ? 'text-white' : ''
                      }`}
                      style={staged ? (active ? {
                        backgroundImage: `linear-gradient(145deg, ${pillHue.a}, ${pillHue.a}CC)`,
                        borderColor: 'rgba(255,255,255,0.28)',
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 6px 18px -6px ${pillHue.glow}`,
                      } : {
                        color: dark ? 'rgba(226,232,240,0.60)' : 'rgba(15,23,42,0.55)',
                        borderColor: dark ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.10)',
                        background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)',
                      }) : undefined}
                    >{reservationStatusLabels[s]}</button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Démarre le</label>
                <DatePicker value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Termine le</label>
                <DatePicker value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Nuits</label>
                <div className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background flex items-center font-medium">{nights}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-2">CONTACT</label>
              <div className="space-y-2">
                <Select
                  options={[{ value: '', label: 'Sélectionner un voyageur' }, ...voyageurContacts.map(c => ({ value: c.id, label: c.label }))]}
                  value={selectedContactId}
                  onValueChange={handleContactSelect}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Prénom" value={revealed ? firstName : ''} onChange={e => !contactLocked && setFirstName(e.target.value)}
                    readOnly={contactLocked}
                    className={`w-full h-9 px-3 text-sm rounded-lg border bg-card focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20' : 'focus:ring-accent/20'} ${contactLocked ? 'border-border/50 bg-background/50 text-text-secondary cursor-not-allowed' : 'border-border'}`} />
                  <input type="text" placeholder="Nom" value={revealed ? lastName : ''} onChange={e => !contactLocked && setLastName(e.target.value)}
                    readOnly={contactLocked}
                    className={`w-full h-9 px-3 text-sm rounded-lg border bg-card focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20' : 'focus:ring-accent/20'} ${contactLocked ? 'border-border/50 bg-background/50 text-text-secondary cursor-not-allowed' : 'border-border'}`} />
                </div>
                <input type="email" placeholder="Email" value={revealed ? email : ''} onChange={e => !contactLocked && setEmail(e.target.value)}
                  readOnly={contactLocked}
                  className={`w-full h-9 px-3 text-sm rounded-lg border bg-card focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20' : 'focus:ring-accent/20'} ${contactLocked ? 'border-border/50 bg-background/50 text-text-secondary cursor-not-allowed' : 'border-border'}`} />
                <input type="tel" placeholder="Téléphone" value={revealed ? phone : ''} onChange={e => !contactLocked && setPhone(e.target.value)}
                  readOnly={contactLocked}
                  className={`w-full h-9 px-3 text-sm rounded-lg border bg-card focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20' : 'focus:ring-accent/20'} ${contactLocked ? 'border-border/50 bg-background/50 text-text-secondary cursor-not-allowed' : 'border-border'}`} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-2">VOYAGEURS</label>
              <div className="flex gap-4">
                {[
                  { label: 'Adultes', val: adults, set: setAdults },
                  { label: 'Enfants', val: children, set: setChildren },
                  { label: 'Bébés', val: babies, set: setBabies },
                ].map(f => (
                  <div key={f.label} className="flex-1">
                    <label className="text-xs text-text-secondary block mb-1">{f.label}</label>
                    <input type="number" min={0} value={f.val} onChange={e => f.set(Math.max(0, +e.target.value))}
                      className={`w-full h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20' : 'focus:ring-accent/20'}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-2">TARIFS</label>
              <div className="space-y-2 p-3 rounded-lg bg-background">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Prix par nuit</span>
                  <input type="number" value={pricePerNight} onChange={e => setPricePerNight(+e.target.value)}
                    className={`w-28 h-8 px-2 text-sm text-right rounded border border-border bg-card focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20' : 'focus:ring-accent/20'}`} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Prix total hébergement</span>
                  <span className="font-medium">{formatCurrency(totalAccommodation)}</span>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-2">OPTIONS</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {options.map(opt => {
                  const sel = selectedOptions.find(s => s.id === opt.id);
                  let lineTotal = 0;
                  if (opt.type === 'unique') lineTotal = opt.price;
                  else if (opt.type === 'per_night') lineTotal = opt.price * nights;
                  else if (opt.type === 'per_person_per_night') lineTotal = opt.price * (adults + children) * nights;
                  else if (opt.type === 'per_stay') lineTotal = opt.price;
                  const labelMap: Record<string, string> = {
                    unique: 'Unique', per_night: '/jour',
                    per_person_per_night: '/pers./jour', per_stay: '/séjour',
                  };
                  return (
                    <div key={opt.id} className="flex items-center justify-between p-2 rounded-lg bg-background">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={!!sel}
                          onChange={() => setSelectedOptions(prev =>
                            sel ? prev.filter(s => s.id !== opt.id) : [...prev, { id: opt.id, qty: 1 }]
                          )}
                          className={`rounded border-border ${isGerant ? 'text-[#905D5D]' : 'text-accent'} ${isGerant ? 'focus:ring-[#905D5D]/20' : 'focus:ring-accent/20'}`} />
                        <span className="text-sm">{opt.name}</span>
                        <span className="text-xs text-text-secondary">({formatCurrency(opt.price)} {labelMap[opt.type]})</span>
                      </label>
                      <span className="text-sm font-medium">{sel ? formatCurrency(lineTotal) : '-'}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/40">
                <span className="text-sm font-semibold">TOTAL</span>
                <span className={`text-lg font-bold ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deposit' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-2">ACOMPTE</label>
              <div className="space-y-3 p-3 rounded-lg bg-background">
                <div className="flex gap-3 items-center">
                  <input type="number" value={depositPercent} onChange={e => setDepositPercent(+e.target.value)}
                    className={`w-20 h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20' : 'focus:ring-accent/20'}`} />
                  <span className="text-sm text-text-secondary">% du total</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-card border border-border/50 text-center">
                    <p className="text-xs text-text-secondary">Acompte</p>
                    <p className={`text-lg font-bold ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>{formatCurrency(deposit)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-card border border-border/50 text-center">
                    <p className="text-xs text-text-secondary">Solde restant</p>
                    <p className="text-lg font-bold text-text">{formatCurrency(balance)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-emerald-800">Total réservation</span>
              <span className="text-lg font-bold text-emerald-700">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={`flex justify-between gap-2 pt-3 ${staged ? '' : 'border-t border-border/40'}`}
        style={staged ? { borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)'}` } : undefined}>
        <div>
          {activeTab !== 'step' && (staged ? (
            <button type="button" className={ghostBtn} onClick={() => {
              const idx = TAB_ORDER.indexOf(activeTab);
              if (idx > 0) setActiveTab(TAB_ORDER[idx - 1]);
            }}>
              <ChevronLeft size={14} /> Précédent
            </button>
          ) : (
            <Button variant="outline" onClick={() => {
              const tabs: ('step' | 'participants' | 'pricing' | 'deposit')[] = ['step', 'participants', 'pricing', 'deposit'];
              const idx = tabs.indexOf(activeTab);
              if (idx > 0) setActiveTab(tabs[idx - 1]);
            }}>
              <ChevronLeft size={14} className="mr-1" />
              Précédent
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          {staged ? (
            <>
              <button type="button" className={ghostBtn} onClick={onCancel}>Annuler</button>
              {activeTab === 'deposit' ? (
                <button type="button" className={primaryBtn} onClick={() => {
                  const nightsCalc = startDate && endDate
                    ? Math.round((new Date(endDate + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTime()) / 86400000)
                    : 0;
                  const newRes: Reservation = {
                    id: reservation?.id || `r${Date.now()}`,
                    clientId: selectedContactId || reservation?.clientId || undefined,
                    clientName: `${firstName} ${lastName}`,
                    firstName, lastName, email, phone, languages,
                    startDate, endDate, nights: nightsCalc,
                    adults, children, babies,
                    pricePerNight, totalPrice: totalAccommodation,
                    optionsPrice: totalOptions, grandTotal,
                    depositPaid: deposit, balanceDue: balance,
                    status: step,
                    options: selectedOptions.map(so => {
                      const opt = options.find(o => o.id === so.id);
                      return { id: so.id, name: opt?.name || '', price: opt?.price || 0, qty: so.qty };
                    }),
                  };
                  onSave(newRes);
                }}>
                  <CheckCircle size={14} />
                  {isNew ? 'Enregistrer la réservation' : 'Modifier la réservation'}
                </button>
              ) : (
                <button type="button" className={primaryBtn} onClick={() => {
                  const idx = TAB_ORDER.indexOf(activeTab);
                  if (idx < TAB_ORDER.length - 1) setActiveTab(TAB_ORDER[idx + 1]);
                }}>
                  Suivant
                  <ChevronRight size={14} />
                </button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onCancel}>Annuler</Button>
              {activeTab === 'deposit' ? (
                <Button variant="default" onClick={() => {
                  const nightsCalc = startDate && endDate
                    ? Math.round((new Date(endDate + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTime()) / 86400000)
                    : 0;
                  const newRes: Reservation = {
                    id: reservation?.id || `r${Date.now()}`,
                    clientId: selectedContactId || reservation?.clientId || undefined,
                    clientName: `${firstName} ${lastName}`,
                    firstName, lastName, email, phone, languages,
                    startDate, endDate, nights: nightsCalc,
                    adults, children, babies,
                    pricePerNight, totalPrice: totalAccommodation,
                    optionsPrice: totalOptions, grandTotal,
                    depositPaid: deposit, balanceDue: balance,
                    status: step,
                    options: selectedOptions.map(so => {
                      const opt = options.find(o => o.id === so.id);
                      return { id: so.id, name: opt?.name || '', price: opt?.price || 0, qty: so.qty };
                    }),
                  };
                  onSave(newRes);
                }}>
                  <CheckCircle size={14} className="mr-1" />
                  {isNew ? 'Enregistrer la réservation' : 'Modifier la réservation'}
                </Button>
              ) : (
                <Button variant="default" onClick={() => {
                  const tabs: ('step' | 'participants' | 'pricing' | 'deposit')[] = ['step', 'participants', 'pricing', 'deposit'];
                  const idx = tabs.indexOf(activeTab);
                  if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
                }}>
                  Suivant
                  <ChevronRight size={14} className="ml-1" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* Modal 4: Price Grid Management */
function PriceGridForm({ periods, onUpdate, onClose, editingPeriod, setEditingPeriod, isGerant }: {
  periods: PricePeriod[]; onUpdate: (p: PricePeriod[]) => void;
  onClose: () => void; editingPeriod: PricePeriod | null; setEditingPeriod: (p: PricePeriod | null) => void;
  isGerant: boolean;
}) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pricePerNight, setPricePerNight] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { staged, dark } = useStageChrome();

  const ghostBtnSm = `inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all duration-200 active:scale-[0.97] ${
    dark
      ? 'border-white/12 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
      : 'border-teal-900/12 bg-white/70 text-teal-900/70 hover:bg-white hover:text-teal-900'
  }`;
  const primaryBtnSm = `inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold text-white transition-all duration-200 active:scale-[0.97] ${
    dark
      ? 'border-white/25 bg-gradient-to-b from-[#34D399] to-[#059669] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_20px_-8px_rgba(52,211,153,0.7)] hover:brightness-110'
      : 'border-white/50 bg-gradient-to-b from-teal-400 to-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_20px_-10px_rgba(13,148,136,0.7)] hover:brightness-105'
  }`;
  const iconBtn = `p-1.5 rounded-lg transition-all duration-150 hover:scale-110 ${
    dark ? 'text-slate-500 hover:bg-white/10 hover:text-white' : 'text-slate-400 hover:bg-teal-900/[0.07] hover:text-teal-800'
  }`;
  const SEASON_HUE: Record<string, { a: string; glow: string }> = {
    'Basse saison': { a: '#38BDF8', glow: 'rgba(56,189,248,0.5)' },
    'Saison intermédiaire': { a: '#FBBF24', glow: 'rgba(251,191,36,0.5)' },
    'Haute saison': { a: '#FB7185', glow: 'rgba(251,113,133,0.5)' },
    'Événements': { a: '#8B7CFF', glow: 'rgba(139,124,255,0.55)' },
  };

  const seasonColors: Record<string, string> = {
    'Basse saison': 'bg-sky-100 text-sky-700 border-sky-200',
    'Saison intermédiaire': isGerant ? 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]' : 'bg-amber-100 text-amber-700 border-amber-200',
    'Haute saison': 'bg-rose-100 text-rose-700 border-rose-200',
    'Événements': 'bg-violet-100 text-violet-700 border-violet-200',
  };
  const seasonDots: Record<string, string> = {
    'Basse saison': 'bg-sky-400',
    'Saison intermédiaire': isGerant ? 'bg-[#905D5D]' : 'bg-amber-400',
    'Haute saison': 'bg-rose-400',
    'Événements': 'bg-violet-400',
  };

  const handleAdd = () => {
    if (!name || !startDate || !endDate || !pricePerNight) return;
    const newPeriod: PricePeriod = {
      id: `p${Date.now()}`,
      name, startDate, endDate, pricePerNight, minNights: daysBetween(startDate, endDate),
    };
    onUpdate([...periods, newPeriod]);
    setName(''); setStartDate(''); setEndDate(''); setPricePerNight(0);
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    onUpdate(periods.filter(p => p.id !== id));
    setDeleteConfirmId(null);
  };

  const handleDuplicate = (p: PricePeriod) => {
    onUpdate([...periods, { ...p, id: `p${Date.now()}`, name: p.name + ' (copie)' }]);
  };

  return (
    <div className="space-y-4">
      {/* Period cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {periods.map((p, i) => {
            const isEditing = editingPeriod?.id === p.id;
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {isEditing ? (
                  <div className={`p-4 rounded-xl space-y-3 ${staged
                    ? dark
                      ? 'bg-violet-400/[0.06] border-2 border-violet-400/30 shadow-[0_0_24px_-8px_rgba(139,124,255,0.45)]'
                      : 'bg-teal-500/[0.05] border-2 border-teal-600/30 shadow-[0_0_24px_-10px_rgba(13,148,136,0.4)]'
                    : `${isGerant ? 'bg-[#905D5D]/5' : 'bg-accent/5'} border-2 ${isGerant ? 'border-[#905D5D]/30' : 'border-accent/30'}`}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>Modifier la période</span>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1 block">Période</label>
                          {staged ? (
                            <Select
                              options={[
                                { value: 'Basse saison', label: 'Basse saison' },
                                { value: 'Saison intermédiaire', label: 'Saison intermédiaire' },
                                { value: 'Haute saison', label: 'Haute saison' },
                                { value: 'Événements', label: 'Événements' },
                              ]}
                              value={editingPeriod.name}
                              onValueChange={v => setEditingPeriod({ ...editingPeriod, name: v })}
                            />
                          ) : (
                            <select value={editingPeriod.name} onChange={e => setEditingPeriod({ ...editingPeriod, name: e.target.value })}
                              className={`w-full h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20' : 'focus:ring-accent/20'} ${isGerant ? 'focus:border-[#905D5D]' : 'focus:border-accent'} transition-all`}>
                              <option value="Basse saison">Basse saison</option>
                              <option value="Saison intermédiaire">Saison intermédiaire</option>
                              <option value="Haute saison">Haute saison</option>
                              <option value="Événements">Événements</option>
                            </select>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1 block">Du</label>
                          <DatePicker value={editingPeriod.startDate} onChange={e => setEditingPeriod({ ...editingPeriod, startDate: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1 block">Au</label>
                          <DatePicker value={editingPeriod.endDate} onChange={e => setEditingPeriod({ ...editingPeriod, endDate: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1 block">Prix/nuit (MAD)</label>
                          <input type="number" value={editingPeriod.pricePerNight} onChange={e => setEditingPeriod({ ...editingPeriod, pricePerNight: +e.target.value })}
                            className={`w-full h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20' : 'focus:ring-accent/20'} ${isGerant ? 'focus:border-[#905D5D]' : 'focus:border-accent'} transition-all`} />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1 block">Min nuits</label>
                          <input type="number" readOnly value={daysBetween(editingPeriod.startDate, editingPeriod.endDate)}
                            className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background/50 text-text-secondary cursor-not-allowed" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      {staged ? (
                        <>
                          <button type="button" className={primaryBtnSm}
                            onClick={() => { onUpdate(periods.map(p => p.id === editingPeriod.id ? { ...editingPeriod, minNights: daysBetween(editingPeriod.startDate, editingPeriod.endDate) } : p)); setEditingPeriod(null); }}>
                            <CheckCircle size={12} /> Enregistrer
                          </button>
                          <button type="button" className={ghostBtnSm} onClick={() => setEditingPeriod(null)}>Annuler</button>
                        </>
                      ) : (
                        <>
                          <Button variant="default" size="sm" icon={<CheckCircle size={12} />}
                            onClick={() => { onUpdate(periods.map(p => p.id === editingPeriod.id ? { ...editingPeriod, minNights: daysBetween(editingPeriod.startDate, editingPeriod.endDate) } : p)); setEditingPeriod(null); }}>
                            Enregistrer
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingPeriod(null)}>Annuler</Button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 group ${staged
                    ? dark
                      ? 'border-white/[0.06] bg-white/[0.02] hover:border-emerald-400/25 hover:bg-white/[0.04]'
                      : 'border-teal-900/[0.07] bg-white/60 hover:border-emerald-500/35 hover:shadow-[0_6px_18px_-8px_rgba(16,185,129,0.4)]'
                    : 'bg-background border-border/40 hover:border-border/60 hover:shadow-sm'}`}>
                    <div className="flex items-center gap-4">
                      <span className={`w-3 h-3 rounded-full shrink-0 ${seasonDots[p.name] || 'bg-gray-400'}`}
                        style={staged ? { backgroundColor: (SEASON_HUE[p.name]?.a) || '#94A3B8', boxShadow: `0 0 10px ${(SEASON_HUE[p.name]?.glow) || 'rgba(148,163,184,0.5)'}` } : undefined} />
                      <div>
                        {staged ? (
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold"
                            style={{
                              color: (SEASON_HUE[p.name]?.a) || '#94A3B8',
                              borderColor: `${(SEASON_HUE[p.name]?.a) || '#94A3B8'}40`,
                              borderWidth: 1,
                              borderStyle: 'solid',
                              backgroundColor: `${(SEASON_HUE[p.name]?.a) || '#94A3B8'}12`,
                            }}
                          >
                            {p.name}
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${seasonColors[p.name] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                            {p.name}
                          </span>
                        )}
                        <div className={`flex items-center gap-2 mt-1.5 text-xs ${staged
                          ? dark ? 'text-slate-500 font-mono tabular-nums' : 'text-teal-900/45 font-mono tabular-nums'
                          : 'text-text-secondary'}`}>
                          <span>{p.startDate} → {p.endDate}</span>
                          <span className="text-border">·</span>
                          <span>{p.minNights} nuit{p.minNights > 1 ? 's' : ''} min</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-extrabold tabular-nums ${staged ? '' : isGerant ? 'text-[#905D5D]' : 'text-accent'}`}
                        style={staged ? {
                          backgroundImage: dark
                            ? 'linear-gradient(100deg, #34D399, #6EE7B7)'
                            : 'linear-gradient(100deg, #059669, #10B981)',
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          color: 'transparent',
                        } : undefined}>
                        {p.pricePerNight.toLocaleString('fr-FR')} MAD
                      </span>
                      <div className={`flex items-center gap-0.5 transition-opacity ${staged ? 'sm:opacity-60 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button className={iconBtn} onClick={() => setEditingPeriod(p)} title="Modifier">
                          <Edit3 size={14} />
                        </button>
                        <button className={iconBtn} onClick={() => handleDuplicate(p)} title="Dupliquer">
                          <Copy size={14} />
                        </button>
                        {deleteConfirmId === p.id ? (
                          <div className="flex items-center gap-1 ml-1">
                            <button className="text-[10px] font-bold text-red-400 hover:text-red-300 px-1.5 py-0.5 rounded hover:bg-red-500/10 transition-colors" onClick={() => handleDelete(p.id)}>Suppr.</button>
                            <button className={`text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors ${dark ? 'text-slate-500 hover:text-slate-300 hover:bg-white/10' : 'text-slate-500 hover:text-slate-700 hover:bg-teal-900/[0.06]'}`} onClick={() => setDeleteConfirmId(null)}>Non</button>
                          </div>
                        ) : (
                          <button className={`${iconBtn} hover:!text-red-400`} onClick={() => setDeleteConfirmId(p.id)} title="Supprimer">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {periods.length === 0 && (
          <div className="text-center py-8 text-text-secondary">
            <DollarSign size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune période tarifaire définie</p>
          </div>
        )}
      </div>

      {/* Add new period */}
      <div className="border-t border-border/30 pt-4">
        <AnimatePresence>
          {showAdd ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1 block">Période</label>
                    {staged ? (
                      <Select
                        options={[
                          { value: '', label: 'Sélectionner' },
                          { value: 'Basse saison', label: 'Basse saison' },
                          { value: 'Saison intermédiaire', label: 'Saison intermédiaire' },
                          { value: 'Haute saison', label: 'Haute saison' },
                          { value: 'Événements', label: 'Événements' },
                        ]}
                        value={name}
                        onValueChange={v => setName(v)}
                      />
                    ) : (
                      <select value={name} onChange={e => setName(e.target.value)}
                        className={`w-full h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20' : 'focus:ring-accent/20'} ${isGerant ? 'focus:border-[#905D5D]' : 'focus:border-accent'} transition-all`}>
                        <option value="">Sélectionner</option>
                        <option value="Basse saison">Basse saison</option>
                        <option value="Saison intermédiaire">Saison intermédiaire</option>
                        <option value="Haute saison">Haute saison</option>
                        <option value="Événements">Événements</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1 block">Du</label>
                    <DatePicker value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1 block">Au</label>
                    <DatePicker value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1 block">Prix/nuit (MAD)</label>
                    <input type="number" placeholder="0" value={pricePerNight || ''} onChange={e => setPricePerNight(+e.target.value)}
                      className={`w-full h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20' : 'focus:ring-accent/20'} ${isGerant ? 'focus:border-[#905D5D]' : 'focus:border-accent'} transition-all`} />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1 block">Min nuits</label>
                    <input type="number" readOnly value={daysBetween(startDate, endDate)}
                      className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background/50 text-text-secondary cursor-not-allowed" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {staged ? (
                  <>
                    <button type="button" className={primaryBtnSm} onClick={handleAdd}><Plus size={12} /> Ajouter</button>
                    <button type="button" className={ghostBtnSm} onClick={() => setShowAdd(false)}>Annuler</button>
                  </>
                ) : (
                  <>
                    <Button variant="default" size="sm" icon={<Plus size={12} />} onClick={handleAdd}>Ajouter</Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Annuler</Button>
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed text-sm font-semibold transition-all duration-200 ${
                staged
                  ? dark
                    ? 'border-white/12 text-slate-500 hover:text-violet-300 hover:border-violet-400/45 hover:bg-violet-400/[0.05] hover:shadow-[0_0_24px_-10px_rgba(139,124,255,0.55)]'
                    : 'border-teal-900/15 text-teal-900/50 hover:text-teal-700 hover:border-emerald-500/45 hover:bg-emerald-500/[0.05]'
                  : `border-border/50 text-text-secondary ${isGerant ? 'hover:text-[#905D5D]' : 'hover:text-accent'} ${isGerant ? 'hover:border-[#905D5D]/40' : 'hover:border-accent/40'} ${isGerant ? 'hover:bg-[#905D5D]/5' : 'hover:bg-accent/5'}`
              }`}
            >
              <Plus size={16} />
              Ajouter une période
            </button>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-end pt-3"
        style={staged ? { borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)'}` } : undefined}>
        {staged ? (
          <button type="button" className={ghostBtnSm} onClick={onClose}>Fermer</button>
        ) : (
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        )}
      </div>
    </div>
  );
}

/* Modal 5: Options Form */
function OptionsForm({ options, onUpdate, onClose, editingOption, setEditingOption, isGerant }: {
  options: OptionService[]; onUpdate: (o: OptionService[]) => void;
  onClose: () => void; editingOption: OptionService | null; setEditingOption: (o: OptionService | null) => void;
  isGerant: boolean;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [type, setType] = useState<OptionService['type']>('unique');

  const typeLabels: Record<string, string> = {
    unique: 'Unique', per_night: 'Par jour',
    per_person_per_night: 'Par personne/jour', per_stay: 'Par séjour',
  };

  const handleAdd = () => {
    if (!name || !price) return;
    onUpdate([...options, { id: `o${Date.now()}`, name, price, type }]);
    setName(''); setPrice(0); setType('unique');
  };

  const handleDelete = (id: string) => onUpdate(options.filter(o => o.id !== id));

  const { staged, dark } = useStageChrome();
  const ghostBtnSm = `inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all duration-200 active:scale-[0.97] ${
    dark
      ? 'border-white/12 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
      : 'border-teal-900/12 bg-white/70 text-teal-900/70 hover:bg-white hover:text-teal-900'
  }`;
  const primaryBtnSm = `inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold text-white transition-all duration-200 active:scale-[0.97] ${
    dark
      ? 'border-white/25 bg-gradient-to-b from-[#E879F9] to-[#A21CAF] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_20px_-8px_rgba(232,121,249,0.6)] hover:brightness-110'
      : 'border-white/50 bg-gradient-to-b from-fuchsia-400 to-fuchsia-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_20px_-10px_rgba(192,38,211,0.7)] hover:brightness-105'
  }`;
  const TYPE_HUE: Record<string, string> = {
    unique: '#38BDF8',
    per_night: '#34D399',
    per_person_per_night: '#FBBF24',
    per_stay: '#8B7CFF',
  };
  const iconBtnCls = dark
    ? 'text-slate-500 hover:bg-white/10 hover:text-white'
    : 'text-slate-400 hover:bg-teal-900/[0.07] hover:text-teal-800';

  return (
    <div className="space-y-4">
      <div className="max-h-64 space-y-2 overflow-y-auto scrollbar-thin pr-0.5" style={{
        transform: 'translateZ(0)',
        overscrollBehavior: 'contain',
      }}>
        {options.map(opt => (
          staged ? (
            <div
              key={opt.id}
              className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 hover:-translate-y-px ${
                dark
                  ? 'border-white/[0.06] bg-white/[0.02] hover:border-fuchsia-400/25 hover:bg-white/[0.04]'
                  : 'border-teal-900/[0.07] bg-white/60 hover:border-fuchsia-500/35 hover:shadow-[0_6px_18px_-8px_rgba(192,38,211,0.35)]'
              }`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                  style={{
                    color: TYPE_HUE[opt.type],
                    borderColor: `${TYPE_HUE[opt.type]}40`,
                    backgroundColor: `${TYPE_HUE[opt.type]}12`,
                  }}
                >
                  {typeLabels[opt.type]}
                </span>
                <span className={`truncate text-sm font-medium ${dark ? 'text-slate-200' : 'text-slate-700'}`}>{opt.name}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-sm font-extrabold tabular-nums" style={{ color: STAGE_HUES.fuchsia.a }}>
                  {formatCurrency(opt.price)}
                </span>
                <button
                  className={`flex h-7 w-7 items-center justify-center rounded-lg opacity-60 transition-all duration-150 hover:scale-110 group-hover:opacity-100 ${iconBtnCls}`}
                  onClick={() => setEditingOption(opt)}
                  title="Modifier"
                >
                  <Edit3 size={12} />
                </button>
                <button
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-red-400 opacity-60 transition-all duration-150 hover:scale-110 hover:!text-red-300 group-hover:opacity-100`}
                  onClick={() => handleDelete(opt.id)}
                  title="Supprimer"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div key={opt.id} className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-border/30 transition-colors group">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" size="sm">{typeLabels[opt.type]}</Badge>
                <span className="text-sm">{opt.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>{formatCurrency(opt.price)}</span>
                <button className="btn-ghost p-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setEditingOption(opt)}>
                  <Edit3 size={12} />
                </button>
                <button className="btn-ghost p-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-500" onClick={() => handleDelete(opt.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          )
        ))}
      </div>

      {editingOption && (
        <div
          className={`space-y-2 rounded-xl border p-3 ${staged ? '' : 'bg-background border-border/50'}`}
          style={staged ? {
            borderColor: dark ? 'rgba(139,124,255,0.35)' : 'rgba(13,148,136,0.30)',
            background: dark ? 'rgba(139,124,255,0.06)' : 'rgba(13,148,136,0.05)',
            boxShadow: dark ? '0 0 24px -10px rgba(139,124,255,0.45)' : '0 0 24px -12px rgba(13,148,136,0.4)',
          } : undefined}
        >
          <p className={`text-xs font-bold uppercase tracking-[0.14em] ${dark ? 'text-indigo-300' : 'text-teal-700'}`}>Modifier l'option</p>
          <div className="flex gap-2 items-end">
            <Input label="Nom" value={editingOption.name} onChange={e => setEditingOption({ ...editingOption, name: e.target.value })} className="flex-1" />
            <Input label="Prix" type="number" min="0" value={editingOption.price || ''} onChange={e => setEditingOption({ ...editingOption, price: +e.target.value })} className="w-24" />
            <div className="w-40">
              <label className={`text-sm font-medium ${dark ? 'text-slate-200' : 'text-text'}`}>Type</label>
              <Select options={Object.entries(typeLabels).map(([k, v]) => ({ value: k, label: v }))} value={editingOption.type} onValueChange={(v) => setEditingOption({ ...editingOption, type: v as OptionService['type'] })} className="text-xs" />
            </div>
            {staged ? (
              <button
                type="button"
                onClick={() => { onUpdate(options.map(o => o.id === editingOption.id ? editingOption : o)); setEditingOption(null); }}
                className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-emerald-300 transition-all duration-200 hover:scale-110 active:scale-90"
                style={{
                  borderColor: 'rgba(52,211,153,0.40)',
                  backgroundImage: `linear-gradient(145deg, ${STAGE_HUES.emerald.a}20, transparent)`,
                }}
                title="Enregistrer"
              >
                <CheckCircle size={14} />
              </button>
            ) : (
              <button className="btn-ghost p-1 text-emerald-600 mb-0.5" onClick={() => { onUpdate(options.map(o => o.id === editingOption.id ? editingOption : o)); setEditingOption(null); }}>
                <CheckCircle size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3 pt-3" style={staged ? { borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)'}` } : { borderTopWidth: 1, borderTopStyle: 'solid', borderColor: undefined }}>
        <p className={`text-xs font-medium ${dark ? 'text-slate-400' : 'text-teal-900/55'}`}>Ajouter une option</p>
        <Input label="Nom du service" placeholder="Nom du service" value={name} onChange={e => setName(e.target.value)} />
        <div className="flex gap-2 items-end">
          <Input label="Prix" type="number" min="0" placeholder="Prix" value={price || ''} onChange={e => setPrice(+e.target.value)} className="w-28" />
          <div className="w-40">
            <label className={`text-sm font-medium ${dark ? 'text-slate-200' : 'text-text'}`}>Type</label>
            <Select options={Object.entries(typeLabels).map(([k, v]) => ({ value: k, label: v }))} value={type} onValueChange={(v) => setType(v as OptionService['type'])} className="w-full" />
          </div>
          {staged ? (
            <button type="button" className={`${primaryBtnSm} mb-0.5`} onClick={handleAdd}><Plus size={12} /> Ajouter</button>
          ) : (
            <Button variant="default" size="sm" icon={<Plus size={12} />} onClick={handleAdd}>Ajouter</Button>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-3" style={staged ? { borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)'}` } : undefined}>
        {staged ? (
          <button type="button" className={ghostBtnSm} onClick={onClose}>Fermer</button>
        ) : (
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        )}
      </div>
    </div>
  );
}
