import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Calendar, MapPin, Home, X, ChevronLeft, ArrowUpRight, Hash, Zap, Grid, List, Filter } from 'react-feather'
import { Stage, StageButton, OrbIcon, TiltCard, STAGE_HUES, useStageTheme } from '../../components/dashboard/Stage'
import type { StageTheme } from '../../components/dashboard/Stage'
import { useStageChrome } from '../../components/modules/calendar/useStageChrome'
import { useStageFormClasses } from '../../components/modules/calendar/StageModal'
import { cn } from '../../lib/utils'
import { getVacancesProperties, ApimoVacanceProperty } from '../../services/toolboxService'
import { ReservationCalendarModal } from '../../components/modules/toolbox/ReservationCalendar'
import { useToast } from '../../components/ui/Toast'

function formatPrice(v?: number) {
  if (!v) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(v)
}

function getApimoTitle(p: ApimoVacanceProperty) {
  const c = p.comments?.find(c => c.language === 'fr') || p.comments?.[0]
  return c?.title || `Bien #${p.id}`
}
function getApimoImage(p: ApimoVacanceProperty) {
  const sorted = [...(p.pictures || [])].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
  return sorted[0]?.url || ''
}
function getApimoCity(p: ApimoVacanceProperty) {
  return p.city?.name || '—'
}

export default function VacancesManagementPage() {
  const { agentId, adminId } = useParams<{ agentId: string; adminId: string }>()
  const baseId = agentId || adminId
  const isAdminRoute = !!adminId
  const toolboxPath = isAdminRoute ? `/admin/${adminId}/toolbox` : `/${baseId}/toolbox`
  const navigate = useNavigate()
  const rawTheme = useStageTheme()
  const theme: StageTheme = isAdminRoute ? 'light' : rawTheme
  const rawChrome = useStageChrome()
  const staged = isAdminRoute ? true : rawChrome.staged
  const isDark = theme === 'dark'
  const { toast } = useToast()
  const { input: stageInput, label: stageLabel } = useStageFormClasses()
  const ctrl = (extra?: string) => (staged ? stageInput(extra) : undefined)
  const sectionTitle = 'mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80'

  const [propsList, setPropsList] = useState<ApimoVacanceProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [calendarTarget, setCalendarTarget] = useState<ApimoVacanceProperty | null>(null)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; prop: ApimoVacanceProperty } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setErrorMsg(null)
    getVacancesProperties({ limit: 100, status: 1 })
      .then(res => {
        console.log('[Vacances] got', res.properties?.length, 'properties')
        setPropsList(res.properties || [])
        if ((res.properties || []).length === 0) console.warn('[Vacances] empty result, raw', res)
      })
      .catch((e: any) => {
        console.error('[Vacances] fetch failed', e)
        setErrorMsg(e?.message || 'Erreur de chargement APIMO (category 3)')
        toast('error', e?.message || 'Erreur de chargement APIMO (category 3)')
      })
      .finally(() => setLoading(false))
    const h = () => setCtxMenu(null)
    window.addEventListener('click', h)
    window.addEventListener('scroll', h, true)
    return () => {
      window.removeEventListener('click', h)
      window.removeEventListener('scroll', h, true)
    }
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return propsList
    const q = search.trim().toLowerCase()
    return propsList.filter(p => {
      const ref = String(p.reference ?? p.id ?? '').toLowerCase()
      const id = String(p.id ?? '').toLowerCase()
      return id.includes(q) || ref.includes(q) || getApimoTitle(p).toLowerCase().includes(q) || getApimoCity(p).toLowerCase().includes(q)
    })
  }, [propsList, search])

  const heroText = (() => {
    if (!staged) return { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-text-secondary', title: 'text-text', sub: 'text-sm text-text-secondary' }
    if (isAdminRoute) return { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-[#893101]/60', title: 'bg-gradient-to-r from-[#893101] via-[#B45309] to-[#D97706] bg-clip-text text-transparent', sub: 'text-sm text-[#893101]/60' }
    return isDark
      ? { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400/80', title: 'bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent', sub: 'text-sm text-slate-400' }
      : { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-teal-900/50', title: 'bg-gradient-to-r from-teal-900 via-amber-700 to-amber-600 bg-clip-text text-transparent', sub: 'text-sm text-teal-900/55' }
  })()

  const handleContextMenu = (e: React.MouseEvent, p: ApimoVacanceProperty) => {
    e.preventDefault()
    setCtxMenu({ x: e.clientX, y: e.clientY, prop: p })
  }

  if (loading) {
    return (
      <Stage theme={theme}>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-3 border-transparent animate-spin" style={{ borderTopColor: STAGE_HUES.amber.a, borderRightColor: `${STAGE_HUES.amber.a}40` }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full" style={{ background: STAGE_HUES.amber.a, boxShadow: `0 0 16px ${STAGE_HUES.amber.glow}` }} />
            </div>
          </div>
        </div>
      </Stage>
    )
  }

  return (
    <Stage theme={theme}>
      <div className="space-y-5">
        <button onClick={() => navigate(toolboxPath)} className={`inline-flex items-center gap-1.5 text-[13px] font-semibold rounded-lg px-2.5 py-1.5 ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}>
          <ChevronLeft size={15} /> Retour Toolbox
        </button>

        {/* Hero */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
              </span>
              <p className={heroText.eyebrow}>Toolbox · Vacances management · APIMO category 3</p>
            </div>
            <h1 className={`mt-1 text-3xl font-extrabold tracking-tight ${heroText.title}`}>Vacances <span className={`${isDark ? 'text-amber-300' : 'text-amber-600'}`}>management</span></h1>
            <p className={`mt-1 ${heroText.sub}`}>{filtered.length} bien(s) catégorie 3 (APIMO) — clic droit pour gérer le calendrier</p>
          </div>
          <div className={`hidden sm:flex items-center gap-1 p-1 rounded-xl border ${isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white border-slate-200'}`}>
            <button onClick={() => setView('grid')} className={`h-8 w-8 rounded-lg flex items-center justify-center ${view === 'grid' ? 'text-white shadow' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`} style={view === 'grid' ? { background: `linear-gradient(135deg, ${STAGE_HUES.amber.a}, ${STAGE_HUES.amber.b})` } : undefined}><Grid size={14} /></button>
            <button onClick={() => setView('list')} className={`h-8 w-8 rounded-lg flex items-center justify-center ${view === 'list' ? 'text-white shadow' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`} style={view === 'list' ? { background: `linear-gradient(135deg, ${STAGE_HUES.amber.a}, ${STAGE_HUES.amber.b})` } : undefined}><List size={14} /></button>
          </div>
        </div>

        {/* Search — Stage glass like Librairie / Conciergerie */}
        <div
          className={cn(
            'overflow-hidden',
            staged ? 'pop-glass rounded-3xl' : 'stage-glass rounded-2xl',
            staged && isDark && 'border border-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]',
            staged && !isDark && 'border border-white/80 shadow-[0_20px_60px_-20px_rgba(13,148,136,0.25)]',
          )}
        >
          <div
            className="h-[3px] w-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${isDark ? 'rgba(251,191,36,0.9)' : 'rgba(245,158,11,0.9)'} 18%, ${isDark ? '#FBBF24' : '#F59E0B'} 50%, transparent)`,
            }}
          />
          <div
            className="px-5 pt-5 pb-4 space-y-5"
            style={
              staged
                ? {
                    background: `radial-gradient(90% 140% at 0% 0%, ${isDark ? 'rgba(251,191,36,0.07)' : 'rgba(245,158,11,0.06)'}, transparent 65%)`,
                  }
                : undefined
            }
          >
            <section>
              <p className={`${sectionTitle} ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                <span className="h-px w-4 bg-gradient-to-r from-amber-400 to-transparent" />
                Recherche
                {search && (
                  <span className={cn('ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold', isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' : 'bg-amber-500/15 text-amber-700 border border-amber-500/20')}>1</span>
                )}
              </p>
              <div>
                <label className={stageLabel}>Rechercher par référence, titre ou ville</label>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isDark ? '#FBBF24' : '#D97706' } as any} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Tapez une référence, un titre ou une ville..."
                    className={stageInput('h-10 pl-9 pr-9')}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className={cn(
                        'absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                        isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-amber-900/40 hover:text-amber-900 hover:bg-amber-900/5',
                      )}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            </section>

            <section>
              <p className={`${sectionTitle} ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                <span className="h-px w-4 bg-gradient-to-r from-sky-400 to-transparent" />
                Filtre APIMO
              </p>
              <div className="flex flex-wrap gap-2">
                <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border', isDark ? 'bg-amber-500/10 border-amber-400/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700')}>
                  <Filter size={12} /> category = 3
                </span>
                <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border', isDark ? 'bg-white/[0.04] border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500')}>
                  {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} · {propsList.length} au total
                </span>
              </div>
            </section>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-xl border px-4 py-3 text-sm flex items-center justify-between" style={{ background: isDark ? 'rgba(239,68,68,0.12)' : '#FEF2F2', borderColor: isDark ? 'rgba(239,68,68,0.25)' : '#FECACA', color: isDark ? '#FCA5A5' : '#B91C1C' }}>
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => window.location.reload()} className="ml-3 h-7 px-3 rounded-lg border text-xs font-bold" style={{ borderColor: isDark ? 'rgba(252,165,165,0.4)' : '#FCA5A5' }}>Réessayer</button>
          </div>
        )}
        {/* Empty */}
        {filtered.length === 0 ? (
          <div className="stage-glass p-12 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}` }}>
              <Home size={22} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
            </div>
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Aucun bien vacances trouvé</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Aucune propriété APIMO avec category 3 n'a été retournée. Vérifiez que le backend est redémarré après la migration 084 et que les logs backend montrent "[Toolbox] fetching APIMO".</p>
            <button onClick={() => window.location.reload()} className={`mt-4 h-9 px-4 rounded-xl text-xs font-bold border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>Réessayer</button>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p, i) => {
              const img = getApimoImage(p)
              return (
                <motion.div key={String(p.id)} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02, duration: 0.35 }}>
                  <TiltCard className="h-full" onClick={() => {}}>
                    <div onContextMenu={e => handleContextMenu(e, p)} className="relative h-full flex flex-col overflow-hidden group/card">
                      <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${STAGE_HUES.amber.a}, ${STAGE_HUES.amber.b})` }} />
                      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-amber-500/10 via-transparent to-emerald-500/10">
                        {img ? <img src={img} alt={getApimoTitle(p)} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full"><OrbIcon icon={Home} hue={STAGE_HUES.amber} size={44} radius={12} /></div>}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                        <div className="absolute top-3 left-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-white border border-white/20 backdrop-blur-md" style={{ background: `linear-gradient(135deg, ${STAGE_HUES.amber.a}, ${STAGE_HUES.amber.b})` }}>
                            <Zap size={10} /> Vacances
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-black/45 text-white backdrop-blur-md border border-white/15">
                            <Hash size={10} /> {p.reference || p.id}
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                          <span className="text-sm font-extrabold text-white drop-shadow">{formatPrice(p.price?.value)}</span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-white/90 text-slate-900">
                            <Calendar size={10} /> Réservations
                          </span>
                        </div>
                      </div>
                      <div className="p-4 space-y-2 flex-1">
                        <h3 className={`text-sm font-bold leading-snug line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{getApimoTitle(p)}</h3>
                        <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <MapPin size={11} /> <span className="truncate">{getApimoCity(p)}</span>
                          {p.area?.value ? <span className="ml-auto inline-flex items-center gap-1"><Home size={11} />{p.area.value} m²</span> : null}
                        </div>
                        <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>cat. {p.category} · type {p.type}/{p.subtype} · status {p.status}</p>
                      </div>
                      <div className={`px-3 py-2.5 border-t flex items-center gap-2 ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'}`}>
                        <StageButton variant="primary" size="sm" onClick={() => setCalendarTarget(p)} icon={<Calendar size={12} />}>Gérer calendrier</StageButton>
                        <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>ou clic droit</span>
                        <ArrowUpRight size={12} className={`ml-auto ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                      </div>
                    </div>
                  </TiltCard>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="stage-glass overflow-hidden p-0">
            <div className={`grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500 bg-white/[0.03] border-b border-white/5' : 'text-slate-400 bg-slate-50 border-b border-slate-100'}`}>
              <span className="col-span-5">Bien</span><span className="col-span-2">Réf.</span><span className="col-span-2">Ville</span><span className="col-span-2">Prix</span><span className="col-span-1 text-right">Action</span>
            </div>
            {filtered.map((p, i) => (
              <motion.div key={String(p.id)} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.015 }}
                onContextMenu={e => handleContextMenu(e, p)}
                className={`grid grid-cols-12 gap-2 px-4 py-3 items-center border-b last:border-b-0 cursor-context-menu ${isDark ? 'border-white/5 hover:bg-white/[0.03]' : 'border-slate-100 hover:bg-slate-50'}`}>
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl overflow-hidden border shrink-0" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)' }}>
                    {getApimoImage(p) ? <img src={getApimoImage(p)} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center"><Home size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} /></span>}
                  </div>
                  <span className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{getApimoTitle(p)}</span>
                </div>
                <span className={`col-span-2 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{p.reference || p.id}</span>
                <span className={`col-span-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{getApimoCity(p)}</span>
                <span className={`col-span-2 text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatPrice(p.price?.value)}</span>
                <span className="col-span-1 flex justify-end">
                  <button onClick={() => setCalendarTarget(p)} className={`h-8 px-3 rounded-xl text-xs font-bold border inline-flex items-center gap-1 ${isDark ? 'bg-amber-500/15 border-amber-400/20 text-amber-300 hover:bg-amber-500/25' : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'}`}>
                    <Calendar size={12} /> Gérer
                  </button>
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Context menu */}
        <AnimatePresence>
          {ctxMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.14 }}
              className={`fixed z-[80] w-64 rounded-xl border py-1 overflow-hidden ${isDark ? 'bg-[#111832] border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200 shadow-xl'}`}
              style={{ left: Math.min(ctxMenu.x, window.innerWidth - 270), top: Math.min(ctxMenu.y, window.innerHeight - 120) }}
              onClick={e => e.stopPropagation()}
            >
              <div className={`px-3 py-2 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{getApimoTitle(ctxMenu.prop)}</p>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{ctxMenu.prop.reference || ctxMenu.prop.id} · {getApimoCity(ctxMenu.prop)}</p>
              </div>
              <button onClick={() => { setCalendarTarget(ctxMenu.prop); setCtxMenu(null) }}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-sm font-semibold ${isDark ? 'text-amber-300 hover:bg-amber-500/10' : 'text-amber-700 hover:bg-amber-50'}`}>
                <Calendar size={14} /> Manage reservation calendar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {calendarTarget && (
          <ReservationCalendarModal
            open={!!calendarTarget}
            onClose={() => setCalendarTarget(null)}
            propertyId={String(calendarTarget.id)}
            propertyTitle={getApimoTitle(calendarTarget)}
            imageUrl={getApimoImage(calendarTarget)}
          />
        )}
      </div>
    </Stage>
  )
}
