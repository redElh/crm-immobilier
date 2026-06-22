import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '../../ui/Dialog';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import { DatePicker } from '../../ui/DatePicker';
import {
  Calendar, DollarSign, Settings, ChevronLeft, ChevronRight,
  Sun, Lock, Plus, Edit3, Trash2, CheckCircle, Copy
} from 'react-feather';
import { useConfidential } from '../confidentiality/ConfidentialContext';

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
  clientName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  language: string;
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
    email: 'marie.dupont@email.com', phone: '+212 6 12 34 56 78', language: 'Français',
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
    email: 'pierre.martin@email.com', phone: '+212 6 98 76 54 32', language: 'Français',
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

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatCurrency(n: number): string {
  return n.toLocaleString('fr-FR') + ' MAD';
}

export const PropertySeasonal = () => {
  const { revealed } = useConfidential();
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear] = useState(now.getFullYear());

  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [priceGrid, setPriceGrid] = useState<PricePeriod[]>(initialPriceGrid);
  const [options, setOptions] = useState<OptionService[]>(initialOptions);
  const [blockedDates, setBlockedDates] = useState<string[]>(['2026-06-04', '2026-06-06', '2026-06-07', '2026-06-08']);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: string; end: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; date: string } | null>(null);

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showPriceGridModal, setShowPriceGridModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [editingPricePeriod, setEditingPricePeriod] = useState<PricePeriod | null>(null);
  const [editingOption, setEditingOption] = useState<OptionService | null>(null);

  const days = generateCalendarDays(currentYear, currentMonth, reservations, blockedDates);
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const getReservation = (id: string) => reservations.find(r => r.id === id);
  const getDayPrice = (dateStr: string) => {
    const period = priceGrid.find(p => {
      const d = new Date(dateStr + 'T00:00:00');
      const parseFr = (s: string) => { const [dd, mm, yyyy] = s.split('/'); return new Date(+yyyy, +mm - 1, +dd); };
      const start = parseFr(p.startDate);
      const end = parseFr(p.endDate);
      return d >= start && d <= end;
    });
    return period?.pricePerNight;
  };

  const handleDateClick = (date: string) => {
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
    setContextMenu({ x: e.clientX, y: e.clientY, date });
  };

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleMouseDown = (date: string) => {
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

  const statusColors: Record<DayStatus, string> = {
    available: 'bg-emerald-50/30 hover:bg-emerald-50 text-text',
    reserved: 'bg-rose-50 hover:bg-rose-100 text-rose-800',
    blocked: 'bg-gray-100 hover:bg-gray-200 text-gray-400 line-through',
  };

  const statusLabels: Record<DayStatus, string> = {
    available: 'Disponible',
    reserved: 'Réservé',
    blocked: 'Indisponible',
  };

  const reservationStatusLabels: Record<string, string> = {
    option: 'Option', confirmed: 'Confirmé', cancelled: 'Annulé', occupied: 'Occupé',
  };

  const reservationStatusColors: Record<string, string> = {
    option: 'bg-amber-100 text-amber-700', confirmed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700', occupied: 'bg-blue-100 text-blue-700',
  };

  const handleSaveReservation = (res: Reservation) => {
    setReservations(prev => {
      const exists = prev.find(r => r.id === res.id);
      if (exists) return prev.map(r => r.id === res.id ? res : r);
      return [...prev, res];
    });
    setShowReservationModal(false);
  };

  return (
    <div className="space-y-6" onMouseUp={handleMouseUp}>
      {/* Calendar */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar size={16} className="text-accent" />
              Calendrier des réservations
            </h3>
            <span className="text-xs text-text-secondary/60">Clic : nouvelle réservation · Clic droit : actions · Glisser : sélection multiple</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost p-1.5" onClick={() => setCurrentMonth(m => m === 0 ? 11 : m - 1)}><ChevronLeft size={14} /></button>
            <span className="text-sm font-medium w-32 text-center">{MONTHS[currentMonth]} {currentYear}</span>
            <button className="btn-ghost p-1.5" onClick={() => setCurrentMonth(m => m === 11 ? 0 : m + 1)}><ChevronRight size={14} /></button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-3 text-xs text-text-secondary flex-wrap">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" /> Disponible</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-100 border border-rose-300" /> Réservé</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-300" /> Indisponible</span>
          <span className="flex items-center gap-1 ml-auto text-text-secondary/40">
            <Info size={12} /> Cliquer sur une date pour réserver, glisser pour bloquer
          </span>
        </div>

        <div className="grid grid-cols-7 gap-0.5 select-none">
          {DAYS_SHORT.map(d => (
            <div key={d} className="text-center text-[11px] font-medium text-text-secondary/50 py-1.5">{d}</div>
          ))}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
          {days.map(day => {
            const inRange = isInRange(day.date);
            const isStart = day.date === selectedRange?.start || day.date === dragStart;
            const isEnd = day.date === selectedRange?.end;
            const price = day.price || getDayPrice(day.date);
            const res = day.reservationId ? getReservation(day.reservationId) : null;

            return (
              <div
                key={day.date}
                onClick={() => handleDateClick(day.date)}
                onContextMenu={(e) => handleDateRightClick(e, day.date)}
                onMouseDown={() => handleMouseDown(day.date)}
                onMouseEnter={() => handleMouseEnter(day.date)}
                className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs cursor-pointer transition-all select-none
                  ${statusColors[day.status]}
                  ${inRange ? 'ring-2 ring-accent bg-accent/5 scale-105 z-10' : ''}
                  ${isStart || isEnd ? 'ring-2 ring-accent shadow-md z-20' : ''}
                  ${hoveredDate === day.date ? 'shadow-sm' : ''}`}
              >
                <span className="font-medium text-sm leading-none">{day.day}</span>
                {price && day.status === 'available' && (
                  <span className="text-[8px] text-text-secondary/50 mt-0.5 leading-none">{price}€</span>
                )}
                {day.status === 'reserved' && res && (
                  <span className="text-[7px] leading-none mt-0.5 truncate max-w-full px-0.5 text-rose-500">
                    {revealed ? res.clientName.split(' ')[0] : '•••'}
                  </span>
                )}
                {day.status === 'blocked' && (
                  <Lock size={7} className="text-gray-400 mt-0.5" />
                )}
                {inRange && (
                  <div className="absolute inset-0 rounded-lg bg-accent/5 border-2 border-accent/30 pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend -> upcoming reservations summary */}
        {reservations.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/30">
            <p className="text-xs font-medium text-text-secondary mb-2">Réservations du mois</p>
            <div className="space-y-1.5">
              {reservations.map(r => (
                <div key={r.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-background cursor-pointer hover:bg-border/30 transition-colors"
                  onClick={() => { setEditingReservation(r); setShowReservationModal(true); }}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${r.status === 'confirmed' ? 'bg-emerald-500' : r.status === 'option' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                    <span className="font-medium">{revealed ? r.clientName : '••••••••'}</span>
                  </div>
                  <span className="text-text-secondary">{formatDateShort(r.startDate)} → {formatDateShort(r.endDate)} · {r.nights} nuits</span>
                  <Badge className={reservationStatusColors[r.status]} size="sm">{reservationStatusLabels[r.status]}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50 w-56 bg-card rounded-xl border border-border/50 shadow-dropdown py-1"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <div className="px-3 py-1.5 text-xs font-medium text-text-secondary border-b border-border/30 mb-1">
              {formatDateDisplay(contextMenu.date)}
            </div>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-background transition-colors"
              onClick={() => { setContextMenu(null); setShowBlockModal(true); }}>
              <Lock size={13} /> Rendre indisponible
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-background transition-colors"
              onClick={() => { setContextMenu(null); setShowPriceModal(true); }}>
              <DollarSign size={13} /> Modifier le prix
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-background transition-colors"
              onClick={() => { setContextMenu(null); setEditingReservation(null); setShowReservationModal(true); }}>
              <Plus size={13} /> Ajouter une réservation
            </button>
            {days.find(d => d.date === contextMenu.date)?.status === 'reserved' && (
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-background transition-colors text-accent"
                onClick={() => { const res = getReservation(days.find(d => d.date === contextMenu.date)?.reservationId || ''); if (res) { setEditingReservation(res); setShowReservationModal(true); } setContextMenu(null); }}>
                <Info size={13} /> Voir les détails
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* === MODAL 1: Modifier le prix d'une date === */}
      <Dialog isOpen={showPriceModal} onClose={() => setShowPriceModal(false)} title={`Modifier le tarif - ${selectedDate ? formatDateDisplay(selectedDate) : ''}`} size="md">
        <PriceEditForm date={selectedDate || ''} currentPrice={selectedDate ? getDayPrice(selectedDate) || 1200 : 1200}
          onSave={(price) => { setShowPriceModal(false); }}
          onCancel={() => setShowPriceModal(false)} />
      </Dialog>

      {/* === MODAL 2: Bloquer des dates === */}
      <Dialog isOpen={showBlockModal} onClose={() => setShowBlockModal(false)}
        title={`Bloquer des dates - ${MONTHS[currentMonth]} ${currentYear}`} size="md">
        <BlockDatesForm
          rangeStart={selectedRange?.start || selectedDate || ''}
          rangeEnd={selectedRange?.end || selectedDate || ''}
          onSave={(reason) => {
            const start = selectedRange?.start || selectedDate || '';
            const end = selectedRange?.end || selectedDate || '';
            const newBlocked: string[] = [];
            const s = new Date(start + 'T00:00:00');
            const e = new Date(end + 'T00:00:00');
            for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
              newBlocked.push(d.toISOString().split('T')[0]);
            }
            setBlockedDates(prev => Array.from(new Set([...prev, ...newBlocked])));
            setSelectedRange(null);
            setShowBlockModal(false);
          }}
          onCancel={() => { setSelectedRange(null); setShowBlockModal(false); }} />
      </Dialog>

      {/* === MODAL 3: Réservation === */}
      <Dialog isOpen={showReservationModal} onClose={() => setShowReservationModal(false)}
        title={editingReservation ? `Réservation - ${revealed ? editingReservation.clientName : '••••••••'}` : 'Nouvelle réservation'} size="xl">
        <ReservationForm
          reservation={editingReservation}
          options={options}
          revealed={revealed}
          onSave={handleSaveReservation}
          onCancel={() => setShowReservationModal(false)}
        />
      </Dialog>

      {/* === MODAL 4: Grille tarifaire === */}
      <Dialog isOpen={showPriceGridModal} onClose={() => setShowPriceGridModal(false)} title="Grille tarifaire - 2026" size="xl">
        <PriceGridForm
          periods={priceGrid}
          onUpdate={setPriceGrid}
          onClose={() => setShowPriceGridModal(false)}
          editingPeriod={editingPricePeriod}
          setEditingPeriod={setEditingPricePeriod} />
      </Dialog>

      {/* === MODAL 5: Options et services === */}
      <Dialog isOpen={showOptionsModal} onClose={() => setShowOptionsModal(false)} title="Options et services - 2026" size="lg">
        <OptionsForm
          options={options}
          onUpdate={setOptions}
          onClose={() => setShowOptionsModal(false)}
          editingOption={editingOption}
          setEditingOption={setEditingOption} />
      </Dialog>

      {/* Price Grid + Options buttons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Grille tarifaire */}
        <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign size={16} className="text-accent" />
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
                    <td className="py-2.5 px-3 text-right text-xs font-semibold text-accent">{row.pricePerNight.toLocaleString()} €</td>
                    <td className="py-2.5 px-3 text-right text-xs text-text-secondary">{row.minNights}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Options */}
        <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Settings size={16} className="text-accent" />
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
                  <span className="text-sm font-medium text-accent">{formatCurrency(opt.price)}</span>
                </div>
              );
            })}
          </div>
        </div>
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
function PriceEditForm({ date, currentPrice, onSave, onCancel }: {
  date: string; currentPrice: number; onSave: (price: number) => void; onCancel: () => void;
}) {
  const [price, setPrice] = useState(currentPrice);
  const [applyMode, setApplyMode] = useState<'single' | 'range' | 'period'>('single');
  const [endDate, setEndDate] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
        <DollarSign size={16} className="text-accent" />
        <div>
          <p className="text-sm font-medium">Prix par nuit</p>
          <p className="text-xs text-text-secondary">{date ? formatDateShort(date) : ''}</p>
        </div>
        <input type="number" value={price} onChange={e => setPrice(+e.target.value)}
          className="ml-auto w-24 h-9 px-3 text-sm text-right rounded-lg border border-border bg-card font-semibold focus:outline-none focus:ring-2 focus:ring-accent/20" />
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
              className="text-accent focus:ring-accent/20" />
            <span className="text-sm">{opt.label}</span>
            {opt.value === 'range' && applyMode === 'range' && (
              <DatePicker value={endDate} onChange={e => setEndDate(e.target.value)}
                className="ml-2" />
            )}
          </label>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button variant="default" onClick={() => onSave(price)}>Enregistrer</Button>
      </div>
    </div>
  );
}

/* Modal 2: Block Dates */
function BlockDatesForm({ rangeStart, rangeEnd, onSave, onCancel }: {
  rangeStart: string; rangeEnd: string; onSave: (reason: string) => void; onCancel: () => void;
}) {
  const [reason, setReason] = useState('maintenance');
  const [customReason, setCustomReason] = useState('');
  const [blockCompletely, setBlockCompletely] = useState(true);

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
      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
        Période : <strong>{formatRange()}</strong>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-text-secondary mb-1">Motif :</p>
        {reasons.map(r => (
          <label key={r.value} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-background transition-colors">
            <input type="radio" name="reason" value={r.value} checked={reason === r.value}
              onChange={() => setReason(r.value)}
              className="text-accent focus:ring-accent/20" />
            <span className="text-sm">{r.label}</span>
          </label>
        ))}
        {reason === 'other' && (
          <input type="text" placeholder="Précisez le motif..." value={customReason} onChange={e => setCustomReason(e.target.value)}
            className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 mt-1" />
        )}
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
        <span className="text-sm">Bloquer complètement la réservation ?</span>
        <div className="flex gap-2 ml-auto">
          <button onClick={() => setBlockCompletely(true)}
            className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all ${blockCompletely ? 'bg-accent text-white border-accent' : 'bg-card text-text-secondary border-border'}`}>Oui</button>
          <button onClick={() => setBlockCompletely(false)}
            className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all ${!blockCompletely ? 'bg-accent text-white border-accent' : 'bg-card text-text-secondary border-border'}`}>Non</button>
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
function ReservationForm({ reservation, options, revealed, onSave, onCancel }: {
  reservation: Reservation | null;
  options: OptionService[];
  revealed: boolean;
  onSave: (res: Reservation) => void;
  onCancel: () => void;
}) {
  const isNew = !reservation;
  const [step, setStep] = useState<'option' | 'confirmed' | 'cancelled' | 'occupied'>(reservation?.status || 'option');
  const [firstName, setFirstName] = useState(reservation?.firstName || '');
  const [lastName, setLastName] = useState(reservation?.lastName || '');
  const [email, setEmail] = useState(reservation?.email || '');
  const [phone, setPhone] = useState(reservation?.phone || '');
  const [language, setLanguage] = useState(reservation?.language || 'Français');
  const [startDate, setStartDate] = useState(reservation?.startDate || '');
  const [endDate, setEndDate] = useState(reservation?.endDate || '');
  const [adults, setAdults] = useState(reservation?.adults || 1);
  const [children, setChildren] = useState(reservation?.children || 0);
  const [babies, setBabies] = useState(reservation?.babies || 0);
  const [pricePerNight, setPricePerNight] = useState(reservation?.pricePerNight || 1200);
  const [selectedOptions, setSelectedOptions] = useState<{ id: string; qty: number }[]>(
    reservation?.options.map(o => ({ id: o.id, qty: o.qty })) || []
  );
  const [depositPercent, setDepositPercent] = useState(30);

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
    option: 'bg-amber-100 text-amber-700 border-amber-200',
    confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
    occupied: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const [activeTab, setActiveTab] = useState<'step' | 'participants' | 'pricing' | 'deposit'>('step');

  return (
    <div className="space-y-4">
      {/* Mini tab bar */}
      <div className="flex border-b border-border/40 -mx-6 px-6">
        {[
          { id: 'step', label: 'Étape & Dates', icon: '📅' },
          { id: 'participants', label: 'Participants', icon: '👤' },
          { id: 'pricing', label: 'Tarifs & Options', icon: '💰' },
          { id: 'deposit', label: 'Acompte', icon: '✓' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-accent border-accent'
                : 'text-text-secondary border-transparent hover:text-text'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[200px]">
        {activeTab === 'step' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-2">ÉTAPE</label>
              <div className="flex gap-2 flex-wrap">
                {(['option', 'confirmed', 'cancelled', 'occupied'] as const).map(s => (
                  <button key={s} onClick={() => setStep(s)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      step === s
                        ? reservationStatusColors[s] + ' border-transparent'
                        : 'bg-background text-text-secondary border-border hover:border-text-secondary/30'
                    }`}
                  >{reservationStatusLabels[s]}</button>
                ))}
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
                <Select options={[{ value: '', label: 'Sélectionner un contact' }, { value: 'new', label: '+ Nouveau client' }]}
                  value="" onValueChange={() => {}} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Prénom" value={revealed ? firstName : ''} onChange={e => setFirstName(e.target.value)}
                    className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20" />
                  <input type="text" placeholder="Nom" value={revealed ? lastName : ''} onChange={e => setLastName(e.target.value)}
                    className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20" />
                </div>
                <input type="email" placeholder="Email" value={revealed ? email : ''} onChange={e => setEmail(e.target.value)}
                  className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20" />
                <input type="tel" placeholder="Téléphone" value={revealed ? phone : ''} onChange={e => setPhone(e.target.value)}
                  className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20" />
                <Select options={[{ value: 'Français', label: 'Français' }, { value: 'English', label: 'English' }, { value: 'العربية', label: 'العربية' }]}
                  value={language} onValueChange={setLanguage} />
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
                      className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20" />
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
                    className="w-28 h-8 px-2 text-sm text-right rounded border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20" />
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
                          className="rounded border-border text-accent focus:ring-accent/20" />
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
                <span className="text-lg font-bold text-accent">{formatCurrency(grandTotal)}</span>
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
                    className="w-20 h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20" />
                  <span className="text-sm text-text-secondary">% du total</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-card border border-border/50 text-center">
                    <p className="text-xs text-text-secondary">Acompte</p>
                    <p className="text-lg font-bold text-accent">{formatCurrency(deposit)}</p>
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

      {/* Actions (always visible at bottom) */}
      <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button variant="default" onClick={() => {
          const nightsCalc = startDate && endDate
            ? Math.round((new Date(endDate + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTime()) / 86400000)
            : 0;
          const newRes: Reservation = {
            id: reservation?.id || `r${Date.now()}`,
            clientName: `${firstName} ${lastName}`,
            firstName, lastName, email, phone, language,
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
          {isNew ? 'Enregistrer la réservation' : 'Modifier la réservation'}
        </Button>
      </div>
    </div>
  );
}

/* Modal 4: Price Grid Management */
function PriceGridForm({ periods, onUpdate, onClose, editingPeriod, setEditingPeriod }: {
  periods: PricePeriod[]; onUpdate: (p: PricePeriod[]) => void;
  onClose: () => void; editingPeriod: PricePeriod | null; setEditingPeriod: (p: PricePeriod | null) => void;
}) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pricePerNight, setPricePerNight] = useState(0);
  const [minNights, setMinNights] = useState(1);

  const handleAdd = () => {
    if (!name || !startDate || !endDate || !pricePerNight) return;
    const newPeriod: PricePeriod = {
      id: `p${Date.now()}`,
      name, startDate, endDate, pricePerNight, minNights,
    };
    onUpdate([...periods, newPeriod]);
    setName(''); setStartDate(''); setEndDate(''); setPricePerNight(0); setMinNights(1);
  };

  const handleDelete = (id: string) => onUpdate(periods.filter(p => p.id !== id));

  const handleDuplicate = (p: PricePeriod) => {
    onUpdate([...periods, { ...p, id: `p${Date.now()}`, name: p.name + ' (copie)' }]);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto max-h-64 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left py-2 px-3 font-medium text-text-secondary text-xs">Période</th>
              <th className="text-left py-2 px-3 font-medium text-text-secondary text-xs">Du</th>
              <th className="text-left py-2 px-3 font-medium text-text-secondary text-xs">Au</th>
              <th className="text-right py-2 px-3 font-medium text-text-secondary text-xs">Prix/nuit</th>
              <th className="text-right py-2 px-3 font-medium text-text-secondary text-xs">Min nuits</th>
              <th className="text-center py-2 px-3 font-medium text-text-secondary text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {periods.map(p => (
              <tr key={p.id} className="border-b border-border/20 hover:bg-background/50 transition-colors">
                <td className="py-2 px-3 font-medium text-xs">{p.name}</td>
                <td className="py-2 px-3 text-xs text-text-secondary">{p.startDate}</td>
                <td className="py-2 px-3 text-xs text-text-secondary">{p.endDate}</td>
                <td className="py-2 px-3 text-right text-xs font-semibold text-accent">{p.pricePerNight.toLocaleString()} €</td>
                <td className="py-2 px-3 text-right text-xs text-text-secondary">{p.minNights}</td>
                <td className="py-2 px-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button className="btn-ghost p-1" onClick={() => setEditingPeriod(p)}><Edit3 size={12} /></button>
                    <button className="btn-ghost p-1 text-red-500" onClick={() => handleDelete(p.id)}><Trash2 size={12} /></button>
                    <button className="btn-ghost p-1" onClick={() => handleDuplicate(p)}><Copy size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit inline */}
      {editingPeriod && (
        <div className="p-3 rounded-lg bg-background border border-border/50 space-y-2">
          <p className="text-xs font-medium text-text-secondary">Modifier la période</p>
          <div className="grid grid-cols-5 gap-2">
            <input type="text" value={editingPeriod.name} onChange={e => setEditingPeriod({ ...editingPeriod, name: e.target.value })}
              className="h-8 px-2 text-xs rounded border border-border bg-card" placeholder="Nom" />
            <input type="text" value={editingPeriod.startDate} onChange={e => setEditingPeriod({ ...editingPeriod, startDate: e.target.value })}
              className="h-8 px-2 text-xs rounded border border-border bg-card" placeholder="JJ/MM/AAAA" />
            <input type="text" value={editingPeriod.endDate} onChange={e => setEditingPeriod({ ...editingPeriod, endDate: e.target.value })}
              className="h-8 px-2 text-xs rounded border border-border bg-card" placeholder="JJ/MM/AAAA" />
            <input type="number" value={editingPeriod.pricePerNight} onChange={e => setEditingPeriod({ ...editingPeriod, pricePerNight: +e.target.value })}
              className="h-8 px-2 text-xs rounded border border-border bg-card" />
            <div className="flex gap-1">
              <input type="number" value={editingPeriod.minNights} onChange={e => setEditingPeriod({ ...editingPeriod, minNights: +e.target.value })}
                className="h-8 px-2 text-xs rounded border border-border bg-card w-full" />
              <button className="btn-ghost p-1 text-emerald-600" onClick={() => { onUpdate(periods.map(p => p.id === editingPeriod.id ? editingPeriod : p)); setEditingPeriod(null); }}>
                <CheckCircle size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add new */}
      <div className="pt-3 border-t border-border/40 space-y-3">
        <p className="text-xs font-medium text-text-secondary">Ajouter une période</p>
        <div className="flex flex-wrap gap-2">
          <input type="text" placeholder="Nom" value={name} onChange={e => setName(e.target.value)}
            className="flex-1 min-w-[120px] h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20" />
          <input type="text" placeholder="Du (JJ/MM/AAAA)" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="w-36 h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20" />
          <input type="text" placeholder="Au (JJ/MM/AAAA)" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="w-36 h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20" />
          <input type="number" placeholder="Prix" value={pricePerNight || ''} onChange={e => setPricePerNight(+e.target.value)}
            className="w-24 h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20" />
          <input type="number" placeholder="Min nuits" value={minNights} onChange={e => setMinNights(+e.target.value)}
            className="w-20 h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20" />
          <Button variant="default" size="sm" icon={<Plus size={12} />} onClick={handleAdd}>Ajouter</Button>
        </div>

        {/* Special date */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <span className="text-xs text-amber-700 font-medium">Période spéciale (date unique ou week-end)</span>
          <input type="text" placeholder="JJ/MM/AAAA" className="h-8 px-2 text-xs rounded border border-amber-300 bg-card" />
          <input type="number" placeholder="Prix" className="h-8 px-2 text-xs rounded border border-amber-300 bg-card w-20" />
          <input type="number" placeholder="Min nuits" className="h-8 px-2 text-xs rounded border border-amber-300 bg-card w-16" />
          <Button variant="ghost" size="sm" icon={<Plus size={12} />}>Ajouter</Button>
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-border/40">
        <Button variant="outline" onClick={onClose}>Fermer</Button>
      </div>
    </div>
  );
}

/* Modal 5: Options Form */
function OptionsForm({ options, onUpdate, onClose, editingOption, setEditingOption }: {
  options: OptionService[]; onUpdate: (o: OptionService[]) => void;
  onClose: () => void; editingOption: OptionService | null; setEditingOption: (o: OptionService | null) => void;
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

  return (
    <div className="space-y-4">
      <div className="max-h-64 overflow-y-auto space-y-1">
        {options.map(opt => (
          <div key={opt.id} className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-border/30 transition-colors group">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" size="sm">{typeLabels[opt.type]}</Badge>
              <span className="text-sm">{opt.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-accent">{formatCurrency(opt.price)}</span>
              <button className="btn-ghost p-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setEditingOption(opt)}>
                <Edit3 size={12} />
              </button>
              <button className="btn-ghost p-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-500" onClick={() => handleDelete(opt.id)}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingOption && (
        <div className="p-3 rounded-lg bg-background border border-border/50 space-y-2">
          <p className="text-xs font-medium text-text-secondary">Modifier l'option</p>
          <div className="flex gap-2">
            <input type="text" value={editingOption.name} onChange={e => setEditingOption({ ...editingOption, name: e.target.value })}
              className="flex-1 h-8 px-2 text-xs rounded border border-border bg-card" />
            <input type="number" value={editingOption.price} onChange={e => setEditingOption({ ...editingOption, price: +e.target.value })}
              className="w-20 h-8 px-2 text-xs rounded border border-border bg-card" />
            <Select options={Object.entries(typeLabels).map(([k, v]) => ({ value: k, label: v }))} value={editingOption.type} onValueChange={(v) => setEditingOption({ ...editingOption, type: v as OptionService['type'] })} className="text-xs" />
            <button className="btn-ghost p-1 text-emerald-600" onClick={() => { onUpdate(options.map(o => o.id === editingOption.id ? editingOption : o)); setEditingOption(null); }}>
              <CheckCircle size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-border/40 space-y-3">
        <p className="text-xs font-medium text-text-secondary">Ajouter une option</p>
        <div className="flex flex-wrap gap-2">
          <input type="text" placeholder="Nom du service" value={name} onChange={e => setName(e.target.value)}
            className="flex-1 min-w-[160px] h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20" />
          <input type="number" placeholder="Prix" value={price || ''} onChange={e => setPrice(+e.target.value)}
            className="w-24 h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20" />
          <Select options={Object.entries(typeLabels).map(([k, v]) => ({ value: k, label: v }))} value={type} onValueChange={(v) => setType(v as OptionService['type'])} className="w-40" />
          <Button variant="default" size="sm" icon={<Plus size={12} />} onClick={handleAdd}>Ajouter</Button>
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-border/40">
        <Button variant="outline" onClick={onClose}>Fermer</Button>
      </div>
    </div>
  );
}
