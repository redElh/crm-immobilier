import { motion, AnimatePresence } from 'framer-motion'
import { Check, RotateCcw, Users } from 'react-feather'
import { AGENTS, EVENT_TYPE_CONFIG, EVENT_TYPE_COLORS, EventType, Agent, readableChipText } from '../../../types/calendar'
import { useStageChrome } from './useStageChrome'

interface CalendarFiltersProps {
  selectedAgents: string[]
  selectedEventTypes: EventType[]
  onAgentsChange: (ids: string[]) => void
  onEventTypesChange: (types: EventType[]) => void
  showAgents?: boolean
  agents?: Agent[]
}

export default function CalendarFilters({
  selectedAgents, selectedEventTypes, onAgentsChange, onEventTypesChange, showAgents = true, agents,
}: CalendarFiltersProps) {
  const { staged, dark } = useStageChrome()
  const agentList = agents && agents.length > 0 ? agents : AGENTS

  const allSelected = selectedEventTypes.length === Object.keys(EVENT_TYPE_CONFIG).length
  const isFiltered = !allSelected || (showAgents && selectedAgents.length > 0)

  const toggleAgent = (id: string) => {
    if (selectedAgents.includes(id)) {
      onAgentsChange(selectedAgents.filter(a => a !== id))
    } else {
      onAgentsChange([...selectedAgents, id])
    }
  }

  const toggleEventType = (type: EventType) => {
    if (selectedEventTypes.includes(type)) {
      onEventTypesChange(selectedEventTypes.filter(t => t !== type))
    } else {
      onEventTypesChange([...selectedEventTypes, type])
    }
  }

  const reset = () => {
    onAgentsChange([])
    onEventTypesChange(Object.values(EVENT_TYPE_CONFIG).map(c => c.value))
  }

  /* Admin shell — classic token styling */
  if (!staged) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">Filtrage</p>
          <AnimatePresence>
            {isFiltered && (
              <motion.button
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                onClick={reset}
                className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-accent"
              >
                <RotateCcw size={10} /> Réinitialiser
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {showAgents && (
          <div className="border-b border-border/30 pb-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Users size={11} className="text-text-secondary" />
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">Équipe · {agentList.length}</p>
            </div>
            <div className="space-y-0.5">
              {agentList.map(agent => {
                const active = selectedAgents.includes(agent.id)
                return (
                  <button
                    key={agent.id}
                    onClick={() => toggleAgent(agent.id)}
                    className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-all ${
                      active ? 'bg-accent-light/60' : 'hover:bg-background'
                    }`}
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                      style={{ backgroundColor: agent.color, opacity: selectedAgents.length === 0 || active ? 1 : 0.38 }}
                    >
                      {agent.initials}
                    </span>
                    <span className={`flex-1 truncate text-xs font-medium ${selectedAgents.length === 0 || active ? 'text-text' : 'text-text-secondary/60'}`}>
                      {agent.name}
                    </span>
                    {active && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: agent.color }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className={showAgents ? 'pt-3' : ''}>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">Types d'événements</p>
          <div className="scrollbar-thin max-h-[240px] space-y-0.5 overflow-y-auto pr-0.5">
            {Object.values(EVENT_TYPE_CONFIG).map(cfg => {
              const Icon = cfg.icon
              const active = selectedEventTypes.includes(cfg.value)
              return (
                <button
                  key={cfg.value}
                  onClick={() => toggleEventType(cfg.value)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all ${active ? 'bg-background' : ''}`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-all ${
                      active ? 'border-accent bg-accent shadow-sm' : 'border-border'
                    }`}
                  >
                    {active && <Check size={10} strokeWidth={3.5} className="text-white" />}
                  </span>
                  <Icon
                    size={11}
                    className={`shrink-0 ${active ? '' : 'text-text-secondary/40'}`}
                    style={active ? { color: readableChipText(EVENT_TYPE_COLORS[cfg.value], dark) } : undefined}
                  />
                  <span className={`truncate text-[11px] font-medium ${active ? 'text-text' : 'text-text-secondary/70'}`}>
                    {cfg.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const sectionLabel = `text-[10px] font-bold uppercase tracking-[0.18em] ${dark ? 'text-slate-400/70' : 'text-teal-900/45'}`
  const hairline = dark ? 'border-white/[0.07]' : 'border-teal-900/[0.08]'

  return (
    <div className="stage-glass rounded-2xl p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <p className={sectionLabel}>Filtrage</p>
        <AnimatePresence>
          {isFiltered && (
            <motion.button
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              onClick={reset}
              className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                dark ? 'text-violet-300 hover:text-violet-200' : 'text-teal-700 hover:text-teal-600'
              }`}
            >
              <RotateCcw size={10} />
              Réinitialiser
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Agents */}
      {showAgents && (
        <div className={`border-b pb-3 ${hairline}`}>
          <div className="mb-2 flex items-center gap-1.5">
            <Users size={11} className={dark ? 'text-slate-400/70' : 'text-teal-900/45'} />
            <p className={sectionLabel}>Équipe · {agentList.length}</p>
          </div>
          <div className="space-y-0.5">
            {agentList.map(agent => {
              const active = selectedAgents.includes(agent.id)
              return (
                <button
                  key={agent.id}
                  onClick={() => toggleAgent(agent.id)}
                  className={`group flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-all duration-200 ${
                    active
                      ? dark
                        ? 'bg-white/[0.07]'
                        : 'bg-teal-900/[0.05]'
                      : dark ? 'hover:bg-white/[0.04]' : 'hover:bg-teal-900/[0.03]'
                  }`}
                >
                  <span
                    className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{
                      backgroundColor: agent.color,
                      boxShadow: active
                        ? `0 0 12px -2px ${agent.color}, inset 0 1px 0 rgba(255,255,255,0.4)`
                        : `inset 0 1px 0 rgba(255,255,255,0.35)`,
                      opacity: selectedAgents.length === 0 || active ? 1 : 0.38,
                    }}
                  >
                    {agent.initials}
                  </span>
                  <span
                    className={`flex-1 truncate text-xs font-medium transition-colors ${
                      selectedAgents.length === 0 || active
                        ? dark ? 'text-slate-200' : 'text-teal-950/80'
                        : dark ? 'text-slate-500' : 'text-teal-900/40'
                    }`}
                  >
                    {agent.name}
                  </span>
                  {active && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: agent.color, boxShadow: `0 0 8px ${agent.color}` }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Event types */}
      <div className={showAgents ? 'pt-3' : ''}>
        <p className={`${sectionLabel} mb-2`}>Types d'événements</p>
        <div className="scrollbar-thin max-h-[240px] space-y-0.5 overflow-y-auto pr-0.5">
          {Object.values(EVENT_TYPE_CONFIG).map(cfg => {
            const Icon = cfg.icon
            const active = selectedEventTypes.includes(cfg.value)
            return (
              <button
                key={cfg.value}
                onClick={() => toggleEventType(cfg.value)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all duration-200 ${
                  active
                    ? dark ? 'bg-white/[0.06]' : 'bg-teal-900/[0.04]'
                    : ''
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-all duration-200 ${
                    active
                      ? dark
                        ? 'border-violet-400/50 bg-gradient-to-br from-violet-400 to-indigo-600 shadow-[0_0_10px_-2px_rgba(124,92,255,0.8)]'
                        : 'border-teal-500/60 bg-gradient-to-br from-teal-400 to-emerald-600 shadow-[0_0_10px_-2px_rgba(13,148,136,0.7)]'
                      : dark
                        ? 'border-white/15 group-hover:border-white/30'
                        : 'border-teal-900/20'
                  }`}
                >
                  {active && <Check size={10} strokeWidth={3.5} className="text-white" />}
                </span>
                <Icon
                  size={11}
                  className={`shrink-0 ${active ? '' : dark ? 'text-slate-600' : 'text-teal-900/25'}`}
                  style={active ? { color: readableChipText(EVENT_TYPE_COLORS[cfg.value], dark) } : undefined}
                />
                <span
                  className={`truncate text-[11px] font-medium transition-colors ${
                    active
                      ? dark ? 'text-slate-200' : 'text-teal-950/80'
                      : dark ? 'text-slate-500' : 'text-teal-900/40'
                  }`}
                >
                  {cfg.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
