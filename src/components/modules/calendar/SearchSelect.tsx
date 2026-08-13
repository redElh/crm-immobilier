import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Loader } from 'react-feather'

interface SearchSelectProps<T> {
  value: string
  placeholder?: string
  onSelect: (item: T | null) => void
  fetchOptions: (query: string) => Promise<T[]>
  getLabel: (item: T) => string
  getSubLabel?: (item: T) => string
  getKey: (item: T) => string
}

export default function SearchSelect<T>({
  value,
  placeholder = '',
  onSelect,
  fetchOptions,
  getLabel,
  getSubLabel,
  getKey,
}: SearchSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const [options, setOptions] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  const close = useCallback(() => {
    setOpen(false)
    setQuery(value)
  }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [close])

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  const loadOptions = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const res = await fetchOptions(q)
      setOptions(res)
    } catch {
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [fetchOptions])

  const handleOpen = () => {
    setOpen(true)
    setQuery('')
    loadOptions('')
  }

  const handleQueryChange = (q: string) => {
    setQuery(q)
    setOpen(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadOptions(q), 300)
  }

  const handleSelect = (item: T) => {
    onSelect(item)
    setQuery(getLabel(item))
    setOpen(false)
  }

  const handleClear = () => {
    onSelect(null)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50 pointer-events-none" />
        <input
          value={query}
          onFocus={handleOpen}
          onChange={e => handleQueryChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-9 pl-9 pr-8 py-2 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-text-secondary hover:text-text rounded-full hover:bg-background transition-colors"
            aria-label="Effacer"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 left-0 right-0 mt-1 bg-card rounded-lg border border-border/50 shadow-dropdown overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-3 text-xs text-text-secondary">
                <Loader size={14} className="animate-spin" /> Recherche...
              </div>
            ) : options.length === 0 ? (
              <div className="py-3 text-center text-xs text-text-secondary/60">Aucun résultat</div>
            ) : (
              <div className="max-h-52 overflow-y-auto py-1">
                {options.map(item => (
                  <button
                    key={getKey(item)}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full text-left px-3 py-2 hover:bg-background transition-colors"
                  >
                    <span className="block text-sm text-text truncate">{getLabel(item)}</span>
                    {getSubLabel && (
                      <span className="block text-xs text-text-secondary truncate">{getSubLabel(item)}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
