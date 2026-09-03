import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Unlock, AlertTriangle, Eye, EyeOff } from 'react-feather'
import { useConfidential } from './ConfidentialContext'
import { useStageChrome } from '../calendar/useStageChrome'
import { OrbIcon } from '../../dashboard/Stage'
import { STAGE_HUES } from '../../dashboard/Stage'

interface ConfidentialBannerProps {
  isGerant?: boolean
}

export function ConfidentialBanner({ isGerant = false }: ConfidentialBannerProps) {
  const { revealed, reveal, hide } = useConfidential()
  const [showConfirm, setShowConfirm] = useState(false)
  const { staged, dark } = useStageChrome()

  const handleReveal = () => {
    setShowConfirm(true)
  }

  const confirmReveal = () => {
    reveal()
    setShowConfirm(false)
  }

  /* -------------------------------------------------------------------
     STAGE variant — classified-vault glass strip
  ------------------------------------------------------------------- */
  if (staged) {
    const amber = STAGE_HUES.amber
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="stage-glass relative overflow-hidden rounded-2xl p-4"
          style={revealed ? {
            borderColor: `${amber.a}45`,
            boxShadow: `0 0 28px ${amber.glow}, inset 0 1px 0 rgba(255,255,255,0.10)`,
          } : undefined}
        >
          {/* scanning beam while locked */}
          {!revealed && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background: `linear-gradient(105deg, transparent 40%, ${STAGE_HUES.violet.a}0F 50%, transparent 60%)`,
              }}
            />
          )}
          {/* revealed ambient glow */}
          {revealed && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full"
              style={{ background: `radial-gradient(circle, ${amber.glow.replace(/[\d.]+\)$/, '0.16)')}, transparent 70%)` }}
            />
          )}

          <div className="relative flex items-center justify-between flex-wrap gap-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <OrbIcon icon={revealed ? Unlock : Lock} hue={revealed ? amber : STAGE_HUES.violet} size={38} radius={12} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
                    Informations confidentielles
                  </span>
                  {revealed ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                      style={{
                        color: amber.a,
                        borderColor: `${amber.a}44`,
                        backgroundColor: `${amber.a}14`,
                      }}
                    >
                      <AlertTriangle size={10} />
                      Dévoilées
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                      style={{
                        color: dark ? '#8B7CFF' : '#5B4BD4',
                        borderColor: dark ? 'rgba(139,124,255,0.30)' : 'rgba(91,75,212,0.20)',
                        backgroundColor: dark ? 'rgba(124,92,255,0.10)' : 'rgba(91,75,212,0.06)',
                      }}
                    >
                      <Lock size={9} />
                      Chiffré
                    </span>
                  )}
                </div>
                <p className={`mt-0.5 truncate text-xs ${dark ? 'text-slate-400' : 'text-teal-900/55'}`}>
                  {revealed
                    ? 'Ces informations sont dévoilées. Ne les partagez pas sans autorisation.'
                    : "Adresse exacte, contact propriétaire, codes d'accès, honoraires, etc."}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {revealed ? (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={hide}
                  className="inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all duration-200"
                  style={{
                    color: dark ? '#FCD34D' : '#B45309',
                    borderColor: `${amber.a}40`,
                    backgroundImage: `linear-gradient(145deg, ${amber.a}12, transparent)`,
                  }}
                >
                  <EyeOff size={13} /> Masquer
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleReveal}
                  className="relative inline-flex h-8 items-center overflow-hidden rounded-xl border border-white/20 px-3 text-xs font-bold text-white transition-all duration-200"
                  style={{
                    backgroundImage: dark
                      ? 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 55%, #5646C9 100%)'
                      : 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 55%, #0D9488 100%)',
                    boxShadow: dark
                      ? 'inset 0 1px 0 rgba(255,255,255,0.4), 0 8px 22px -8px rgba(124,92,255,0.65)'
                      : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 22px -8px rgba(13,148,136,0.6)',
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100"
                    style={{ backgroundImage: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)' }}
                  />
                  <Eye size={13} className="mr-1.5" /> Afficher les infos confidentielles
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Confirmation — cosmic vault dialog (portal: escapes the Stage shell) */}
        {createPortal(
          <AnimatePresence>
            {showConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
                style={{ backdropFilter: 'blur(10px)' }}
                onClick={() => setShowConfirm(false)}
              >
              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.94, y: 12, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                className="w-full max-w-sm rounded-2xl border p-6 text-center"
                style={{
                  borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)',
                  background: dark
                    ? 'linear-gradient(180deg, rgba(17,24,50,0.97), rgba(9,13,30,0.98))'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(240,253,250,0.96))',
                  backdropFilter: 'blur(24px)',
                  boxShadow: dark
                    ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 40px 100px -24px rgba(0,0,0,0.9)'
                    : 'inset 0 1px 0 rgba(255,255,255,1), 0 30px 70px -24px rgba(13,148,136,0.5)',
                }}
                onClick={e => e.stopPropagation()}
              >
                <div className="mx-auto mb-4 w-fit">
                  <OrbIcon icon={Lock} hue={STAGE_HUES.violet} size={52} radius={16} />
                </div>
                <h3 className={`font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
                  Dévoiler les informations confidentielles
                </h3>
                <p className={`mt-2 text-sm ${dark ? 'text-slate-400' : 'text-teal-900/55'}`}>
                  Ces données sont réservées aux agents autorisés : adresse exacte, coordonnées du propriétaire, codes d'accès, montant des honoraires.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    className={`h-9 rounded-xl border px-4 text-xs font-semibold transition-all ${dark ? 'border-white/12 text-slate-300 hover:text-white' : 'border-teal-900/15 text-slate-600 hover:text-teal-900'}`}
                    style={{
                      backgroundImage: dark ? 'linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))' : 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))',
                    }}
                  >
                    Annuler
                  </button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={confirmReveal}
                    className="h-9 rounded-xl border border-white/20 px-4 text-xs font-bold text-white"
                    style={{
                      backgroundImage: dark
                        ? 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 55%, #5646C9 100%)'
                        : 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 55%, #0D9488 100%)',
                      boxShadow: dark
                        ? 'inset 0 1px 0 rgba(255,255,255,0.4), 0 8px 22px -8px rgba(124,92,255,0.65)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 22px -8px rgba(13,148,136,0.6)',
                    }}
                  >
                    Confirmer le dévoilement
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
          </AnimatePresence>,
          document.body,
        )}
      </>
    )
  }

  /* -------------------------------------------------------------------
     Legacy variant (admin shell) — unchanged
  ------------------------------------------------------------------- */
  return (
    <>
      <div className={`rounded-xl border p-4 transition-all ${revealed ? (isGerant ? 'bg-[#F0E2E2] border-[#E0C6C6]' : 'bg-amber-50 border-amber-200') : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${revealed ? (isGerant ? 'bg-[#E7D5D5] text-[#905D5D]' : 'bg-amber-100 text-amber-600') : 'bg-slate-200 text-slate-500'}`}>
              {revealed ? <Unlock size={16} /> : <Lock size={16} />}
            </div>
            <div>
              <span className={`text-sm font-semibold ${revealed ? (isGerant ? 'text-[#7D5050]' : 'text-amber-800') : 'text-slate-700'}`}>
                Informations confidentielles
              </span>
              <p className={`text-xs mt-0.5 ${revealed ? (isGerant ? 'text-[#905D5D]/70' : 'text-amber-600/70') : 'text-slate-500/70'}`}>
                {revealed
                  ? 'Ces informations sont dévoilées. Ne les partagez pas sans autorisation.'
                  : 'Adresse exacte, contact propriétaire, codes d\'accès, honoraires, etc.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {revealed ? (
              <>
                <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md ${isGerant ? 'text-[#905D5D] bg-[#E7D5D5]' : 'text-amber-600 bg-amber-100'}`}>
                  <AlertTriangle size={12} />
                  Dévoilées
                </span>
                <button
                  onClick={hide}
                  className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border transition-all active:scale-[0.97] ${isGerant ? 'border-[#D8B8B8] text-[#7D5050] hover:bg-[#F0E2E2]' : 'border-amber-300 text-amber-700 hover:bg-amber-100'}`}
                >
                  <EyeOff size={13} /> Masquer
                </button>
              </>
            ) : (
              <button
                onClick={handleReveal}
                className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg text-white transition-all active:scale-[0.97] ${isGerant ? 'bg-[#905D5D] hover:bg-[#905D5D]/90' : 'bg-accent hover:bg-accent/90'}`}
              >
                <Eye size={13} /> Afficher les infos confidentielles
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-card rounded-xl border border-border/50 shadow-dropdown p-6 w-full max-w-sm mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${isGerant ? 'bg-[#E7D5D5]' : 'bg-amber-100'}`}>
              <Lock size={22} className={isGerant ? 'text-[#905D5D]' : 'text-amber-600'} />
            </div>
            <h3 className="font-semibold text-center mb-2">Dévoiler les informations confidentielles</h3>
            <p className="text-sm text-text-secondary text-center mb-6">
              Ces données sont réservées aux agents autorisés : adresse exacte, coordonnées du propriétaire, codes d'accès, montant des honoraires.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="inline-flex items-center justify-center h-9 px-4 text-sm rounded-lg border border-border bg-card text-text hover:bg-background transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmReveal}
                className={`inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-lg text-white transition-colors ${isGerant ? 'bg-[#905D5D] hover:bg-[#7D5050]' : 'bg-accent hover:bg-accent/90'}`}
              >
                Confirmer le dévoilement
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
