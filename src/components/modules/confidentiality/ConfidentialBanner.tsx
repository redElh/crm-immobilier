import { useState } from 'react'
import { Lock, Unlock, AlertTriangle, Eye, EyeOff } from 'react-feather'
import { useConfidential } from './ConfidentialContext'
import { Button } from '../../ui/Button'

interface ConfidentialBannerProps {
  isGerant?: boolean
}

export function ConfidentialBanner({ isGerant = false }: ConfidentialBannerProps) {
  const { revealed, reveal, hide } = useConfidential()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleReveal = () => {
    setShowConfirm(true)
  }

  const confirmReveal = () => {
    reveal()
    setShowConfirm(false)
  }

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
              <Button variant="outline" onClick={() => setShowConfirm(false)}>
                Annuler
              </Button>
              <Button variant="default" className={isGerant ? 'bg-[#905D5D] hover:bg-[#7D5050] border-[#905D5D] hover:border-[#7D5050] text-white' : ''} onClick={confirmReveal}>
                Confirmer le dévoilement
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
