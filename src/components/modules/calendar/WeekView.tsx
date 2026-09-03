import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Plus } from 'react-feather'
import {
  CalendarEvent, getEventTypeConfig, AGENTS, Agent, formatEventRange, formatTime, getEventDayOverlap, getEventDayHours,
  getWeekDays, getEventsForWeek, isToday, isSameDay, formatFrenchShortDate, withAlpha, getEventUserColor,
  eventMatchesSelectedAgents, readableChipText,
} from '../../../types/calendar'
import { cn } from '../../../lib/utils'
import { useStageChrome } from './useStageChrome'

interface WeekViewProps {
  currentDate: Date
  events: CalendarEvent[]
  selectedAgents: string[]
  selectedEventTypes: string[]
  overrideAgent?: { id: string; name: string; color: string; initials: string }
  agents?: Agent[]
  canCreate?: boolean
  canEditEvent?: (event: CalendarEvent) => boolean
  onEventClick: (event: CalendarEvent) => void
  onEventUpdate?: (event: CalendarEvent) => void
  onSlotClick: (date: Date) => void
  onDayNameClick: (date: Date) => void
}

const START_HOUR = 7
const END_HOUR = 20
const TOTAL_HOURS = END_HOUR - START_HOUR
const HOUR_HEIGHT = 44
const CELL_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT
const TIME_COL_WIDTH = 64
const DRAG_THRESHOLD = 4
const SNAP_MINUTES = 1
const MIN_DURATION = 10

type DragMode = 'move' | 'resize-top' | 'resize-bottom'

interface DragState {
  event: CalendarEvent
  mode: DragMode
  startX: number
  startY: number
  originStart: Date
  originEnd: Date
  originDayIndex: number
  didMove: boolean
  previewStart: Date
  previewEnd: Date
  previewDayIndex: number
}

interface PlacedEvent {
  event: CalendarEvent
  level: number
  cluster: number
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max))

const dayWithMinutes = (base: Date, minutes: number): Date => {
  const d = new Date(base)
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return d
}

interface ClusterPopup {
  x: number
  y: number
  events: CalendarEvent[]
}

interface CellContextMenu {
  x: number
  y: number
  date: Date
}

export default function WeekView({
  currentDate, events, selectedAgents, selectedEventTypes, overrideAgent, agents, canCreate = true, canEditEvent, onEventClick, onEventUpdate, onSlotClick, onDayNameClick,
}: WeekViewProps) {
  const { staged, dark } = useStageChrome()
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])
  const weekEvents = useMemo(() => getEventsForWeek(events, currentDate), [events, currentDate])
  const filteredEvents = useMemo(() =>
    weekEvents.filter(e =>
      selectedEventTypes.length === 0 || selectedEventTypes.includes(e.type)
    ),
    [weekEvents, selectedEventTypes]
  )
  const visibleAgents = useMemo(() => {
    const catalog = agents && agents.length > 0 ? agents : AGENTS
    return overrideAgent
      ? [overrideAgent]
      : catalog.filter(a => selectedAgents.length === 0 || selectedAgents.includes(a.id))
  }, [overrideAgent, selectedAgents, agents])

  const dayEvents = useMemo(() => {
    return filteredEvents.filter(e => eventMatchesSelectedAgents(e, selectedAgents, agents))
  }, [filteredEvents, selectedAgents, agents])

  const getEventColor = (event: CalendarEvent): string =>
    getEventUserColor(event, visibleAgents)

  const getEventLayout = (event: CalendarEvent, day: Date) => {
    const { startH, endH } = getEventDayHours(event, day)
    const clampedStart = Math.max(startH, START_HOUR)
    const clampedEnd = Math.min(endH, END_HOUR)
    const top = ((clampedStart - START_HOUR) / TOTAL_HOURS) * CELL_HEIGHT
    const height = Math.max(((clampedEnd - clampedStart) / TOTAL_HOURS) * CELL_HEIGHT, 22)
    return { top, height }
  }

  const layoutDay = (events: CalendarEvent[], day: Date): { placed: PlacedEvent[]; clusters: CalendarEvent[][] } => {
    const sorted = [...events].sort((a, b) => {
      const aStart = getEventDayHours(a, day).startH
      const bStart = getEventDayHours(b, day).startH
      if (aStart !== bStart) return aStart - bStart
      return getEventDayHours(b, day).endH - getEventDayHours(a, day).endH
    })

    const clusters: CalendarEvent[][] = []
    let current: CalendarEvent[] = []
    let clusterEnd = -Infinity
    for (const e of sorted) {
      const { startH, endH } = getEventDayHours(e, day)
      if (startH >= clusterEnd) {
        if (current.length > 0) clusters.push(current)
        current = []
        clusterEnd = -Infinity
      }
      current.push(e)
      clusterEnd = Math.max(clusterEnd, endH)
    }
    if (current.length > 0) clusters.push(current)

    const placed: PlacedEvent[] = []
    clusters.forEach((cluster, ci) => {
      cluster.forEach((event, level) => placed.push({ event, level, cluster: ci }))
    })
    return { placed, clusters }
  }

  const [popup, setPopup] = useState<ClusterPopup | null>(null)
  const closeTimer = useRef<number | undefined>(undefined)
  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setPopup(null), 140)
  }
  const cancelClose = () => {
    window.clearTimeout(closeTimer.current)
  }

  const getDayOverlapping = (day: Date) =>
    dayEvents.filter(e => {
      const { start, end } = getEventDayOverlap(e, day)
      return start.getTime() < end.getTime()
    })

  /* Live "now" indicator — ticks every 30s */
  const [nowTs, setNowTs] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNowTs(new Date()), 30000)
    return () => window.clearInterval(t)
  }, [])
  const nowMinutes = nowTs.getHours() * 60 + nowTs.getMinutes()
  const showNowLine = nowMinutes >= START_HOUR * 60 && nowMinutes <= END_HOUR * 60

  const [dayColWidth, setDayColWidth] = useState(148)
  const dayColWidthRef = useRef(148)
  const gridRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = gridRef.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth / 7
      dayColWidthRef.current = w
      setDayColWidth(w)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const suppressClick = useRef(false)
  const weekDaysRef = useRef(weekDays)
  weekDaysRef.current = weekDays

  const canDrag = (event: CalendarEvent): boolean =>
    Boolean(onEventUpdate) && canCreate !== false && (canEditEvent ? canEditEvent(event) : true)

  const startDrag = (event: CalendarEvent, mode: DragMode, e: ReactPointerEvent) => {
    if (mode !== 'move' && event.allDay) return
    const originDayIndex = weekDaysRef.current.findIndex(d => isSameDay(d, event.start))
    const idx = originDayIndex === -1 ? 0 : originDayIndex
    dragRef.current = {
      event,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      originStart: new Date(event.start),
      originEnd: new Date(event.end),
      originDayIndex: idx,
      didMove: false,
      previewStart: new Date(event.start),
      previewEnd: new Date(event.end),
      previewDayIndex: idx,
    }
    suppressClick.current = false
    setPopup(null)
  }

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      const dx = e.clientX - d.startX
      const dy = e.clientY - d.startY
      if (!d.didMove && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      const dayDelta = Math.round(dx / dayColWidthRef.current)
      const snapMin = Math.round((dy / HOUR_HEIGHT) * 60 / SNAP_MINUTES) * SNAP_MINUTES
      const previewDayIndex = clamp(d.originDayIndex + dayDelta, 0, 6)
      const targetDay = weekDaysRef.current[previewDayIndex]

      let previewStart: Date
      let previewEnd: Date
      if (d.mode === 'move') {
        const originStartMin = d.originStart.getHours() * 60 + d.originStart.getMinutes()
        const duration = (d.originEnd.getTime() - d.originStart.getTime()) / 60000
        const newStartMin = clamp(originStartMin + snapMin, 0, Math.max(0, 1440 - duration))
        previewStart = dayWithMinutes(targetDay, newStartMin)
        previewEnd = new Date(previewStart.getTime() + duration * 60000)
      } else if (d.mode === 'resize-top') {
        const originStartMin = d.originStart.getHours() * 60 + d.originStart.getMinutes()
        const originEndMin = d.originEnd.getHours() * 60 + d.originEnd.getMinutes()
        const newStartMin = clamp(originStartMin + snapMin, 0, originEndMin - MIN_DURATION)
        previewStart = dayWithMinutes(d.originStart, newStartMin)
        previewEnd = new Date(d.originEnd)
      } else {
        const originStartMin = d.originStart.getHours() * 60 + d.originStart.getMinutes()
        const originEndMin = d.originEnd.getHours() * 60 + d.originEnd.getMinutes()
        const newEndMin = clamp(originEndMin + snapMin, originStartMin + MIN_DURATION, 1440)
        previewStart = new Date(d.originStart)
        previewEnd = dayWithMinutes(d.originEnd, newEndMin)
      }

      d.didMove = true
      d.previewStart = previewStart
      d.previewEnd = previewEnd
      d.previewDayIndex = previewDayIndex
      suppressClick.current = true
      document.body.style.userSelect = 'none'
      document.body.style.cursor = d.mode === 'move' ? 'grabbing' : 'ns-resize'
      setDrag({ ...d })
    }

    const onPointerUp = () => {
      const d = dragRef.current
      dragRef.current = null
      setDrag(null)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      if (!d || !d.didMove || !onEventUpdate) return
      onEventUpdate({ ...d.event, start: new Date(d.previewStart), end: new Date(d.previewEnd) })
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [onEventUpdate])

  const dragPreview = drag
    ? (() => {
        const startMin = drag.previewStart.getHours() * 60 + drag.previewStart.getMinutes()
        const endMin = drag.previewEnd.getHours() * 60 + drag.previewEnd.getMinutes()
        const clampedStart = Math.max(startMin, START_HOUR * 60)
        const clampedEnd = Math.min(endMin, END_HOUR * 60)
        const top = ((clampedStart - START_HOUR * 60) / (TOTAL_HOURS * 60)) * CELL_HEIGHT
        const height = Math.max(((clampedEnd - clampedStart) / (TOTAL_HOURS * 60)) * CELL_HEIGHT, 22)
        return { top, height, color: getEventColor(drag.event) }
      })()
    : null

  const [ctxMenu, setCtxMenu] = useState<CellContextMenu | null>(null)
  const dateFromCellY = (clientY: number, rect: DOMRect, day: Date): Date => {
    const ratio = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    const hour = Math.min(Math.floor(START_HOUR + ratio * TOTAL_HOURS), END_HOUR - 1)
    const d = new Date(day)
    d.setHours(hour, 0, 0, 0)
    return d
  }
  useEffect(() => {
    if (!ctxMenu) return
    const close = () => setCtxMenu(null)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('mousedown', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [ctxMenu])

  if (visibleAgents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-secondary text-sm">
        Sélectionnez au moins un agent pour afficher le calendrier
      </div>
    )
  }

  const gridCols = `${TIME_COL_WIDTH}px 1fr`

  const skin = staged
    ? {
        container: dark
          ? 'stage-glass overflow-hidden'
          : 'stage-glass overflow-hidden',
        headBg: dark ? 'bg-white/[0.03]' : 'bg-white/40',
        headBorder: dark ? 'border-white/[0.08]' : 'border-teal-900/[0.10]',
        divide: dark ? 'divide-white/[0.06]' : 'divide-teal-900/[0.08]',
        cellLine: dark ? 'border-white/[0.05]' : 'border-teal-900/[0.07]',
        timeText: dark ? 'text-slate-500' : 'text-teal-900/35',
        label: dark ? 'text-[9px] font-bold uppercase tracking-[0.22em] text-slate-500' : 'text-[9px] font-bold uppercase tracking-[0.22em] text-teal-900/35',
      }
    : {
        container: 'bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden',
        headBg: 'bg-background/50',
        headBorder: 'border-border/40',
        divide: 'divide-border/20',
        cellLine: 'border-border/20',
        timeText: 'text-text-secondary/50',
        label: 'text-xs font-semibold text-text-secondary uppercase tracking-wider',
      }

  return (
    <div className={skin.container}>
      <div className="overflow-x-auto scrollbar-thin">
        <div className="min-w-[1100px]">
          {/* Day headers */}
          <div className={`grid border-b ${skin.headBorder} ${skin.headBg} sticky top-0 z-20 backdrop-blur-xl`} style={{ gridTemplateColumns: gridCols }}>
            <div className={`p-3 text-center ${skin.label} border-r ${skin.headBorder}`}>
              Horaire
            </div>
            <div className={`grid grid-cols-7 divide-x ${skin.divide}`}>
              {weekDays.map((day, i) => {
                const today = isToday(day)
                const weekend = [0, 6].includes(day.getDay())
                return (
                  <div
                    key={i}
                    className={`relative py-3 px-2 text-center cursor-pointer transition-colors ${today ? 'bg-accent/5' : ''} hover:bg-accent/10`}
                    onClick={() => onDayNameClick(day)}
                  >
                    <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${today ? 'text-accent' : weekend ? (dark ? 'text-slate-600' : staged ? 'text-teal-900/30' : 'text-text-secondary/60') : dark ? 'text-slate-500' : staged ? 'text-teal-900/45' : 'text-text-secondary'}`}>
                      {day.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
                    </p>
                    {today ? (
                      <span
                        className="cal-day-orb mx-auto mt-0.5 text-lg"
                        style={
                          !dark
                            ? {
                                backgroundImage: 'linear-gradient(145deg,#2DD4BF,#0D9488)',
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 6px 18px -4px rgba(13,148,136,0.55)',
                              }
                            : undefined
                        }
                      >
                        {day.getDate()}
                      </span>
                    ) : (
                      <p className={`text-xl font-extrabold mt-0.5 tabular-nums tracking-tight ${
                        weekend
                          ? dark ? 'text-slate-600' : staged ? 'text-teal-900/30' : 'text-text-secondary/50'
                          : dark ? 'text-slate-200' : staged ? 'text-teal-950' : 'text-text'
                      }`}>
                        {day.getDate()}
                      </p>
                    )}
                    <p className={`text-[9px] mt-0.5 font-mono uppercase tracking-wider ${dark ? 'text-slate-600' : staged ? 'text-teal-900/30' : 'text-text-secondary/60'}`}>
                      {formatFrenchShortDate(day)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Shared body row: time column + 7 day columns */}
          <div className="relative">
            <div className="grid" style={{ gridTemplateColumns: gridCols }}>
            <div className={`relative border-r ${skin.headBorder}`} style={{ height: CELL_HEIGHT }}>
              {Array.from({ length: TOTAL_HOURS }, (_, h) => (
                <div
                  key={h}
                  className={`absolute right-2 text-[10px] font-mono font-medium leading-none pointer-events-none ${skin.timeText}`}
                  style={{ top: `calc(${(h / TOTAL_HOURS) * CELL_HEIGHT}px - 5px)` }}
                >
                  {String(START_HOUR + h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            <div ref={gridRef} className={`grid grid-cols-7 divide-x ${skin.divide}`}>
              {weekDays.map((day, i) => {
                const { placed, clusters } = layoutDay(getDayOverlapping(day), day)
                return (
                  <div
                    key={i}
                    className="relative cursor-pointer transition-colors hover:bg-accent/[0.03]"
                    style={{ height: CELL_HEIGHT }}
                    onClick={(e) => {
                      if (suppressClick.current) { suppressClick.current = false; return }
                      const rect = e.currentTarget.getBoundingClientRect()
                      onSlotClick(dateFromCellY(e.clientY, rect, day))
                    }}
                    onContextMenu={(e) => {
                      if (!canCreate) return
                      if (getDayOverlapping(day).length === 0) return
                      e.preventDefault()
                      setPopup(null)
                      const rect = e.currentTarget.getBoundingClientRect()
                      setCtxMenu({ x: e.clientX, y: e.clientY, date: dateFromCellY(e.clientY, rect, day) })
                    }}
                  >
                    {/* Hour grid lines */}
                    {Array.from({ length: TOTAL_HOURS - 1 }, (_, h) => (
                      <div
                        key={h}
                        className={`absolute left-0 right-0 border-t ${skin.cellLine} pointer-events-none`}
                        style={{ top: `${((h + 1) / TOTAL_HOURS) * CELL_HEIGHT}px` }}
                      />
                    ))}

                    {/* Today: gradient beam wash + glowing edge */}
                    {isToday(day) && (
                      <>
                        <div className="cal-today-beam" />
                        <div
                          className="absolute left-0 top-0 bottom-0 w-[3px] z-20 rounded-r-full"
                          style={{
                            background: dark
                              ? 'linear-gradient(180deg, #8B7CFF, #5646C9)'
                              : 'linear-gradient(180deg, #2DD4BF, #0D9488)',
                            boxShadow: dark
                              ? '0 0 12px rgba(124,92,255,0.7)'
                              : '0 0 12px rgba(13,148,136,0.55)',
                          }}
                        />
                      </>
                    )}

                    {/* Live now-line sweeping today's column */}
                    {isToday(day) && showNowLine && (
                      <div
                        className="cal-now-line"
                        style={{ top: `${((nowMinutes - START_HOUR * 60) / (TOTAL_HOURS * 60)) * CELL_HEIGHT}px` }}
                      >
                        <span className="cal-now-dot" style={{ left: -4, top: -3.5 }} />
                        <span className="cal-now-chip">
                          {String(nowTs.getHours()).padStart(2, '0')}:{String(nowTs.getMinutes()).padStart(2, '0')}
                        </span>
                      </div>
                    )}

                    {/* Events positioned by time, colored by creator */}
                    {placed.map(({ event, level, cluster }) => {
                      const cfg = getEventTypeConfig(event.type)
                      const layout = getEventLayout(event, day)
                      const color = getEventColor(event)
                      const offset = level * 8
                      const isDragging = drag?.event.id === event.id
                      const canDragThis = canDrag(event)
                      return (
                        <motion.button
                          key={event.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          title={event.title}
                          className="cal-event-glow absolute rounded-md border overflow-hidden z-10 text-left select-none backdrop-blur-sm transition-[filter] hover:brightness-110"
                          style={{
                            top: layout.top,
                            height: layout.height,
                            left: `calc(1px + ${offset}px)`,
                            width: `calc(100% - ${2 + offset}px)`,
                            zIndex: 10 + level,
                            background: `linear-gradient(135deg, ${withAlpha(color, level === 0 ? '40' : '2E')} 0%, ${withAlpha(color, '14')} 100%)`,
                            borderColor: withAlpha(color, '4D'),
                            borderLeft: `3px solid ${color}`,
                            ['--evc' as never]: withAlpha(color, '55'),
                            cursor: canDragThis ? 'grab' : 'pointer',
                            touchAction: 'none',
                            visibility: isDragging ? 'hidden' : undefined,
                          }}
                          onPointerDown={(e) => {
                            if (!canDragThis) return
                            e.preventDefault()
                            e.stopPropagation()
                            const resizeEl = (e.target as HTMLElement).closest('[data-resize]')
                            const mode: DragMode = resizeEl
                              ? (resizeEl.getAttribute('data-resize') as DragMode)
                              : 'move'
                            startDrag(event, mode, e)
                          }}
                          onMouseEnter={(e) => {
                            if (dragRef.current) return
                            cancelClose()
                            if (clusters[cluster].length > 1) {
                              setPopup({ x: e.clientX, y: e.clientY, events: clusters[cluster] })
                            }
                          }}
                          onMouseLeave={() => scheduleClose()}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (suppressClick.current) { suppressClick.current = false; return }
                            setPopup(null)
                            onEventClick(event)
                          }}
                          onContextMenu={(e) => {
                            if (!canCreate) return
                            e.stopPropagation()
                            e.preventDefault()
                            setPopup(null)
                            const cellEl = e.currentTarget.parentElement
                            if (!cellEl) return
                            const rect = cellEl.getBoundingClientRect()
                            setCtxMenu({ x: e.clientX, y: e.clientY, date: dateFromCellY(e.clientY, rect, day) })
                          }}
                        >
                          {canDragThis && !event.allDay && (
                            <>
                              <div data-resize="resize-top" className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize rounded-t-md z-10" style={{ touchAction: 'none' }} />
                              <div data-resize="resize-bottom" className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize rounded-b-md z-10" style={{ touchAction: 'none' }} />
                            </>
                          )}
                          <div
                            className="px-2 py-1 h-full flex flex-col justify-center"
                            style={{ color: readableChipText(color, dark) }}
                          >
                            <div className="flex items-center gap-1">
                              <span className="text-xs inline-flex"><cfg.icon size={12} /></span>
                              <span className="text-xs font-bold leading-tight">
                                {formatEventRange(event)}
                              </span>
                            </div>
                            <p className="text-xs font-medium leading-tight truncate">
                              {event.title}
                            </p>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
            </div>

            {/* Drag & resize preview overlay */}
            {drag && dragPreview && (
              <div className="absolute inset-0 z-40 pointer-events-none">
                <div
                  className="absolute rounded-md border-2 border-dashed flex flex-col justify-center px-1.5 overflow-hidden"
                  style={{
                    top: dragPreview.top,
                    height: dragPreview.height,
                    left: TIME_COL_WIDTH + drag.previewDayIndex * dayColWidth + 1,
                    width: dayColWidth - 3,
                    borderColor: dragPreview.color,
                    backgroundColor: withAlpha(dragPreview.color, '29'),
                  }}
                >
                  <span className="text-[11px] font-bold text-text leading-tight truncate">
                    {formatTime(drag.previewStart)} - {formatTime(drag.previewEnd)}
                  </span>
                  <span className="text-[10px] font-medium text-text-secondary leading-tight truncate">
                    {drag.event.title}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hover popup for simultaneous events — portaled to body so the
          stage-glass backdrop-filter / overflow ancestors can't clip or
          re-anchor its fixed positioning */}
      {popup && createPortal(
        <div className={cn(staged && 'agent-theme', dark && 'dark', staged && !dark && 'stage-light', staged && 'cosmic-scope')}>
          <div
            className="pop-glass fixed z-[60] w-80 max-h-[320px] overflow-y-auto scrollbar-thin p-2 space-y-1.5"
            style={{
              left: Math.max(8, Math.min(popup.x + 12, (typeof window !== 'undefined' ? window.innerWidth : 1024) - 340)),
              top: Math.max(8, Math.min(popup.y + 12, (typeof window !== 'undefined' ? window.innerHeight : 768) - 340)),
            }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            <div className={`px-2 pt-1 pb-1.5 flex items-center justify-between border-b mb-1 ${
              staged ? (dark ? 'border-white/10' : 'border-teal-900/10') : 'border-border'
            }`}>
              <span className="text-text-secondary text-[9px] font-bold uppercase tracking-[0.18em]">
                Événements simultanés
              </span>
              <span className="text-xs font-extrabold text-accent">{popup.events.length}</span>
            </div>
            {popup.events.map(event => {
              const cfg = getEventTypeConfig(event.type)
              const color = getEventColor(event)
              const txt = readableChipText(color, dark)
              return (
                <button
                  key={event.id}
                  onClick={() => { setPopup(null); onEventClick(event) }}
                  className={`w-full text-left p-2 rounded-xl border border-transparent transition-all ${
                    staged
                      ? dark
                        ? 'bg-white/[0.03] hover:bg-white/[0.07]'
                        : 'bg-white/50 hover:bg-teal-500/10'
                      : 'bg-background/40 hover:bg-background'
                  }`}
                  style={{ borderLeft: `3px solid ${color}` }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color, boxShadow: `0 0 8px ${withAlpha(color, '99')}` }}
                    />
                    <span className="inline-flex flex-shrink-0" style={{ color: txt }}><cfg.icon size={13} /></span>
                    <span className="text-sm font-semibold text-text truncate">{event.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 pl-5">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                      style={{
                        backgroundColor: withAlpha(color, dark ? '26' : '1A'),
                        color: txt,
                        boxShadow: `inset 0 0 0 1px ${withAlpha(color, dark ? '40' : '33')}`,
                      }}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-xs text-text-secondary">{formatEventRange(event)}</span>
                  </div>
                  {event.clientName && (
                    <p className="text-xs text-text-secondary truncate mt-1 pl-5">Client : {event.clientName}</p>
                  )}
                </button>
              )
            })}
          </div>
        </div>,
        document.body,
      )}
      {/* Right-click context menu: add another event in an occupied cell */}
      {ctxMenu && createPortal(
        <div className={cn(staged && 'agent-theme', dark && 'dark', staged && !dark && 'stage-light', staged && 'cosmic-scope')}>
          <div
            className="pop-glass fixed z-[60] w-56 p-1.5"
            style={{
              left: Math.max(8, Math.min(ctxMenu.x, (typeof window !== 'undefined' ? window.innerWidth : 1024) - 236)),
              top: Math.max(8, Math.min(ctxMenu.y, (typeof window !== 'undefined' ? window.innerHeight : 768) - 88)),
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setCtxMenu(null)
                onSlotClick(ctxMenu.date)
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-text transition-colors ${
                staged ? (dark ? 'hover:bg-white/[0.07]' : 'hover:bg-teal-900/[0.06]') : 'hover:bg-background'
              }`}
            >
              <Plus size={15} className="text-accent" />
              Ajouter un autre événement
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
