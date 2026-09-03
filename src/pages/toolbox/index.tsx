import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Tool, Calendar, ArrowRight, Zap, Star, Lock, Compass } from 'react-feather'
import { Stage, StageButton, OrbIcon, TiltCard, STAGE_HUES, useStageTheme } from '../../components/dashboard/Stage'
import type { StageTheme } from '../../components/dashboard/Stage'
import { useStageChrome } from '../../components/modules/calendar/useStageChrome'

export default function ToolboxPage() {
  const navigate = useNavigate()
  const { agentId, adminId } = useParams<{ agentId: string; adminId: string }>()
  const baseId = agentId || adminId
  const isAdminRoute = !!adminId
  const vacancesTo = isAdminRoute ? `/admin/${adminId}/toolbox/vacances` : `/${baseId}/toolbox/vacances`
  const rawTheme = useStageTheme()
  const theme: StageTheme = isAdminRoute ? 'light' : rawTheme
  const rawChrome = useStageChrome()
  const staged = isAdminRoute ? true : rawChrome.staged
  const isDark = theme === 'dark'

  const heroText = (() => {
    if (!staged) return { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-text-secondary', title: 'text-text', sub: 'text-sm text-text-secondary' }
    if (isAdminRoute) return { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-[#893101]/60', title: 'bg-gradient-to-r from-[#893101] via-[#B45309] to-[#D97706] bg-clip-text text-transparent', sub: 'text-sm text-[#893101]/60' }
    return isDark
      ? { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400/80', title: 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent', sub: 'text-sm text-slate-400' }
      : { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-teal-900/50', title: 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent', sub: 'text-sm text-teal-900/55' }
  })()

  const tools = [
    {
      id: 'vacances',
      label: 'Vacances management',
      desc: "Gérez les biens saisonniers APIMO (category 3) et leur calendrier de réservation.",
      icon: Calendar,
      hue: STAGE_HUES.amber,
      badge: 'Premium',
      available: true,
      to: vacancesTo,
    },
    {
      id: 'coming-2',
      label: 'Yield Optimizer',
      desc: 'Optimisation des tarifs saisonniers — bientôt disponible.',
      icon: Zap,
      hue: STAGE_HUES.violet,
      badge: 'Bientôt',
      available: false,
    },
    {
      id: 'coming-3',
      label: 'Conciergerie Boost',
      desc: 'Services premium additionnels — bientôt disponible.',
      icon: Compass,
      hue: STAGE_HUES.sky,
      badge: 'Bientôt',
      available: false,
    },
  ]

  return (
    <Stage theme={theme}>
      <div className="space-y-6">
        {/* Hero */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
              </span>
              <p className={heroText.eyebrow}>Toolbox · Services premium temporaires</p>
            </div>
            <h1 className={`mt-1 text-3xl font-extrabold tracking-tight ${heroText.title} flex items-center gap-3`}>
              <span className="hidden sm:inline-flex h-9 w-9 rounded-xl items-center justify-center" style={{ background: isDark ? 'linear-gradient(135deg,#FBBF24,#B45309)' : 'linear-gradient(135deg,#F59E0B,#D97706)', boxShadow: '0 8px 20px rgba(245,158,11,0.35)' }}>
                <Tool size={16} className="text-white" />
              </span>
              Toolbox
            </h1>
            <p className={`mt-1 max-w-2xl ${heroText.sub}`}>
              La Toolbox dépasse les capacités standards du CRM et propose des services premium temporaires pour résoudre des problèmes instantanés. Activez un outil à la demande.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${isDark ? 'bg-amber-500/10 text-amber-300 border-amber-400/20' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              <Star size={12} /> Premium
            </span>
          </div>
        </div>

        {/* Intro glass */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="stage-glass p-5 flex gap-4 items-start">
          <OrbIcon icon={Tool} hue={STAGE_HUES.amber} size={42} radius={12} />
          <div className="min-w-0 flex-1">
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Comment ça marche ?</h3>
            <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Choisissez un outil ci-dessous. Les outils Premium s'appuient sur des intégrations externes (APIMO, calendrier) et ne sont pas inclus dans le flux principal des biens. Ils sont facturés ou limités dans le temps — activez-les uniquement quand vous en avez besoin.
            </p>
          </div>
        </motion.div>

        {/* Tools grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((t, i) => {
            const Icon = t.icon
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
                <TiltCard className={`h-full ${!t.available ? 'opacity-75' : ''}`} onClick={t.available ? () => navigate(t.to!) : undefined}>
                  <div className="relative p-5 flex flex-col h-full min-h-[220px]">
                    <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${t.hue.a}, ${t.hue.b})`, boxShadow: `0 0 12px ${t.hue.glow}` }} />
                    <div className="flex items-start justify-between gap-3">
                      <OrbIcon icon={Icon} hue={t.hue} size={44} radius={13} />
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${t.available ? (isDark ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200') : (isDark ? 'bg-white/5 text-slate-400 border-white/10' : 'bg-slate-100 text-slate-500 border-slate-200')}`}>
                        {t.available ? <Zap size={10} /> : <Lock size={10} />} {t.badge}
                      </span>
                    </div>
                    <h3 className={`mt-4 text-[15px] font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.label}</h3>
                    <p className={`mt-1.5 text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.desc}</p>
                    <div className="mt-auto pt-4">
                      {t.available ? (
                        <StageButton variant="primary" size="sm" onClick={() => navigate(t.to!)} icon={<ArrowRight size={12} />}>Ouvrir l'outil</StageButton>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}><Lock size={12} /> Bientôt disponible</span>
                      )}
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            )
          })}
        </div>

        <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Besoin d'un autre outil ? Contactez votre administrateur.</p>
      </div>
    </Stage>
  )
}
