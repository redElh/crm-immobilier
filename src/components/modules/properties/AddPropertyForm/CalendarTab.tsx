import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';
import { Icon } from '../../../../components/ui/Icon';
import { Button } from '../../../../components/ui/Button';

interface CalendarTabProps {
  register: any;
  control: any;
  watch: any;
  isGerant?: boolean;
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

type DayStatus = 'disponible' | 'reserve' | 'option' | 'indisponible';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1);
  const day = d.getDay();
  return day === 0 ? 6 : day - 1;
}

export function CalendarTab({ register, control, watch, isGerant = false }: CalendarTabProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [statuses, setStatuses] = useState<Record<string, DayStatus>>({});
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const statusColors: Record<DayStatus, string> = {
    disponible: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
    reserve: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200',
    option: isGerant ? 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6] hover:bg-[#E7D5D5]/70' : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200',
    indisponible: 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200',
  };

  const statusLabels: Record<DayStatus, string> = {
    disponible: 'Disponible',
    reserve: 'Réservé',
    option: 'Option',
    indisponible: 'Indisponible',
  };

  const dateKey = (day: number) => `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getDaysBetween = useCallback((start: string, end: string): string[] => {
    const dates: string[] = [];
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end + 'T00:00:00');
    const min = s < e ? s : e;
    const max = s < e ? e : s;
    for (let d = new Date(min); d <= max; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  const extendSelection = useCallback((start: string, end: string) => {
    const range = getDaysBetween(start, end);
    setSelectedDays(new Set(range));
  }, [getDaysBetween]);

  const handleDayClick = (day: number, e: React.MouseEvent) => {
    const key = dateKey(day);
    if (e.ctrlKey || e.metaKey) {
      setSelectedDays(prev => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      return;
    }
    setSelectedDays(new Set([key]));
  };

  const handleDayMouseDown = (day: number, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const key = dateKey(day);
    setDragStart(key);
    setIsDragging(true);
    setSelectedDays(new Set([key]));
  };

  const handleDayMouseEnter = (day: number) => {
    if (isDragging && dragStart) {
      const key = dateKey(day);
      extendSelection(dragStart, key);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleDayRightClick = (day: number, e: React.MouseEvent) => {
    e.preventDefault();
    const key = dateKey(day);
    if (!selectedDays.has(key)) {
      setSelectedDays(new Set([key]));
    }
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const applyStatusToSelected = (status: DayStatus) => {
    setStatuses(prev => {
      const next = { ...prev };
      selectedDays.forEach(key => { next[key] = status; });
      return next;
    });
    setContextMenu(null);
    setSelectedDays(new Set());
  };

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
    setSelectedDays(new Set());
    setContextMenu(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
    setSelectedDays(new Set());
    setContextMenu(null);
  };

  const legend: { status: DayStatus; label: string }[] = [
    { status: 'disponible', label: 'Disponible' },
    { status: 'reserve', label: 'Réservé' },
    { status: 'option', label: 'Option' },
    { status: 'indisponible', label: 'Indisponible' },
  ];

  return (
    <MotionCard
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="p-0 overflow-hidden"
    >
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-text">Disponibilités</h3>
            <p className="text-sm text-text-secondary">
              {selectedDays.size > 0
                ? `${selectedDays.size} jour${selectedDays.size > 1 ? 's' : ''} sélectionné${selectedDays.size > 1 ? 's' : ''} · Clic droit pour choisir le statut`
                : 'Cliquez pour sélectionner · Ctrl+clic pour ajouter · Glisser pour une plage'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <Button type="button" variant="ghost" onClick={prevMonth}>
            <Icon name="arrow-left" className="w-4 h-4" />
          </Button>
          <h4 className="text-base font-semibold text-text">
            {MONTHS[currentMonth]} {currentYear}
          </h4>
          <Button type="button" variant="ghost" onClick={nextMonth}>
            <Icon name="arrow-right" className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wider py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 select-none" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = dateKey(day);
            const status = statuses[key] || 'disponible';
            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const isSelected = selectedDays.has(key);

            return (
              <motion.button
                key={day}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={(e) => handleDayClick(day, e)}
                onMouseDown={(e) => handleDayMouseDown(day, e)}
                onMouseEnter={() => handleDayMouseEnter(day)}
                onContextMenu={(e) => handleDayRightClick(day, e)}
                className={`relative rounded-lg border p-2 text-sm font-medium transition-all duration-200 ${statusColors[status]} ${isToday ? `ring-2 ring-offset-1 ${isGerant ? 'ring-[#905D5D]' : 'ring-accent'}` : ''} ${isSelected ? `ring-2 ring-offset-1 shadow-md scale-105 z-10 ${isGerant ? 'ring-[#905D5D]' : 'ring-accent'}` : ''}`}
              >
                <span>{day}</span>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {contextMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed z-50 w-44 bg-card rounded-xl border border-border/50 shadow-dropdown py-1 overflow-hidden"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <div className="px-3 py-1.5 text-xs font-medium text-text-secondary border-b border-border/30 mb-1">
                {selectedDays.size} jour{selectedDays.size > 1 ? 's' : ''} sélectionné{selectedDays.size > 1 ? 's' : ''}
              </div>
              {legend.map(({ status, label }) => (
                <button
                  key={status}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-background transition-colors"
                  onClick={() => applyStatusToSelected(status)}
                >
                  <div className={`w-3 h-3 rounded ${statusColors[status].split(' ')[0]}`} />
                  {label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-border/30">
          {legend.map(({ status, label }) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${statusColors[status].split(' ')[0]}`} />
              <span className="text-xs text-text-secondary">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </MotionCard>
  );
}
