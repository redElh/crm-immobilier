import { useState } from 'react'
import { Lock, Unlock, AlertTriangle, Eye, EyeOff } from 'react-feather'
import { useConfidential } from './ConfidentialContext'
import { Button } from '../../ui/Button'

export function ConfidentialBanner() {
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
      <div className={`rounded-xl border p-4 transition-all ${revealed ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${revealed ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'}`}>
              {revealed ? <Unlock size={16} /> : <Lock size={16} />}
            </div>
            <div>
              <span className={`text-sm font-semibold ${revealed ? 'text-amber-800' : 'text-slate-700'}`}>
                Informations confidentielles
              </span>
              <p className={`text-xs mt-0.5 ${revealed ? 'text-amber-600/70' : 'text-slate-500/70'}`}>
                {revealed
                  ? 'Ces informations sont dévoilées. Ne les partagez pas sans autorisation.'
                  : 'Adresse exacte, contact propriétaire, codes d\'accès, honoraires, etc.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {revealed ? (
              <>
                <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-md">
                  <AlertTriangle size={12} />
                  Dévoilées
                </span>
                <button
                  onClick={hide}
                  className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-100 transition-all active:scale-[0.97]"
                >
                  <EyeOff size={13} /> Masquer
                </button>
              </>
            ) : (
              <button
                onClick={handleReveal}
                className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-all active:scale-[0.97]"
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
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Lock size={22} className="text-amber-600" />
            </div>
            <h3 className="font-semibold text-center mb-2">Dévoiler les informations confidentielles</h3>
            <p className="text-sm text-text-secondary text-center mb-6">
              Ces données sont réservées aux agents autorisés : adresse exacte, coordonnées du propriétaire, codes d'accès, montant des honoraires.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>
                Annuler
              </Button>
              <Button variant="default" onClick={confirmReveal}>
                Confirmer le dévoilement
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
