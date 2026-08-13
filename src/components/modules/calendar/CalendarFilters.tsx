import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Filter } from 'react-feather'
import { AGENTS, EVENT_TYPE_CONFIG, EventType, Agent } from '../../../types/calendar'

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
  const [open, setOpen] = useState(true)
  const agentList = agents && agents.length > 0 ? agents : AGENTS

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

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-border/30"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter size={14} className="text-text-secondary" />
          Filtres
        </div>
        <ChevronDown
          size={14}
          className={`text-text-secondary transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {showAgents && (
                <div>
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                    Afficher les responsables
                  </p>
                  <div className="space-y-1.5">
                    {agentList.map(agent => (
                      <div
                        key={agent.id}
                        onClick={() => toggleAgent(agent.id)}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <div
                          className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200"
                          style={{
                            borderColor: selectedAgents.includes(agent.id) ? agent.color : undefined,
                            backgroundColor: selectedAgents.includes(agent.id) ? agent.color : undefined,
                          }}
                        >
                          {selectedAgents.includes(agent.id) && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <span className="flex items-center gap-2 text-sm text-text">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-white/40"
                            style={{ backgroundColor: agent.color }}
                          />
                          {agent.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                  Types d'événements
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.values(EVENT_TYPE_CONFIG).map(cfg => {
                    const Icon = cfg.icon
                    return (
                      <div
                        key={cfg.value}
                        onClick={() => toggleEventType(cfg.value)}
                        className="flex items-center gap-1.5 cursor-pointer group"
                      >
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                            selectedEventTypes.includes(cfg.value)
                              ? 'bg-accent border-accent'
                              : 'border-border group-hover:border-text-secondary/40'
                          }`}
                        >
                          {selectedEventTypes.includes(cfg.value) && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs flex items-center gap-1">
                          <Icon size={11} />
                          {cfg.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
