import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Upload, RefreshCw, FileText, Home, DollarSign, File, Database, ArrowLeft } from 'react-feather'
import {
  Stage,
  StageButton,
  OrbIcon,
  STAGE_HUES,
  useStageTheme,
} from '../../../components/dashboard/Stage'

export default function DonneesPage() {
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const [exporting, setExporting] = useState<string | null>(null)
  const [importing, setImporting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const handleExport = async (label: string) => { setExporting(label); await new Promise(r => setTimeout(r, 900)); setExporting(null) }
  const handleImport = async (label: string) => { setImporting(label); await new Promise(r => setTimeout(r, 900)); setImporting(null) }
  const handleSave = async () => { setSaving(true); await new Promise(r => setTimeout(r, 1200)); setSaving(false) }

  return (
    <Stage theme={theme}>
      <div className="space-y-6">
        <button onClick={() => navigate(-1)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors w-fit ${isDark ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-teal-900/10 text-slate-600 hover:bg-white'}`}><ArrowLeft size={13} /> Retour</button>

        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" /></span>
            <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>Paramètres · Données</p>
          </div>
          <h1 className={`mt-1 text-3xl font-extrabold tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent' : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent'}`}>Import / Export</h1>
          <p className={`mt-0.5 text-sm ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>Gérez vos données — exportez, importez et sauvegardez</p>
        </div>

        <div className="stage-glass p-6">
          <div className="flex items-center gap-3 mb-5">
            <OrbIcon icon={Download} hue={STAGE_HUES.sky} size={40} radius={12} />
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Export des données</h3>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Téléchargez vos données au format CSV</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <StageButton variant="glass" icon={<FileText size={14} />} onClick={() => handleExport('clients')} className="justify-center">{exporting === 'clients' ? 'Export...' : 'Exporter les clients'}</StageButton>
            <StageButton variant="glass" icon={<Home size={14} />} onClick={() => handleExport('biens')} className="justify-center">{exporting === 'biens' ? 'Export...' : 'Exporter les biens'}</StageButton>
            <StageButton variant="glass" icon={<DollarSign size={14} />} onClick={() => handleExport('transactions')} className="justify-center">{exporting === 'transactions' ? 'Export...' : 'Exporter les transactions'}</StageButton>
            <StageButton variant="glass" icon={<File size={14} />} onClick={() => handleExport('documents')} className="justify-center">{exporting === 'documents' ? 'Export...' : 'Exporter les documents'}</StageButton>
          </div>
          <StageButton variant="primary" icon={<Database size={14} />} onClick={() => handleExport('all')} className="w-full justify-center">{exporting === 'all' ? 'Export en cours...' : 'Exporter toutes les données'}</StageButton>
        </div>

        <div className="stage-glass p-6">
          <div className="flex items-center gap-3 mb-5">
            <OrbIcon icon={Upload} hue={STAGE_HUES.emerald} size={40} radius={12} />
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Import des données</h3>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Importez depuis un fichier ou un service externe</p>
            </div>
          </div>
          <div className="space-y-3">
            <StageButton variant="glass" icon={<Upload size={14} />} onClick={() => handleImport('clients-csv')} className="w-full justify-center">{importing === 'clients-csv' ? 'Import...' : 'Importer des clients (CSV)'}</StageButton>
            <StageButton variant="glass" icon={<Upload size={14} />} onClick={() => handleImport('biens-csv')} className="w-full justify-center">{importing === 'biens-csv' ? 'Import...' : 'Importer des biens (CSV)'}</StageButton>
            <StageButton variant="glass" icon={<Upload size={14} />} onClick={() => handleImport('apimo')} className="w-full justify-center">{importing === 'apimo' ? 'Import...' : 'Importer depuis Apimo'}</StageButton>
          </div>
        </div>

        <div className="stage-glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <OrbIcon icon={RefreshCw} hue={STAGE_HUES.amber} size={40} radius={12} />
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Sauvegarde</h3>
          </div>
          <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Dernière sauvegarde : <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>13/06/2026 02:00</span></p>
          <StageButton variant="primary" icon={<RefreshCw size={14} />} onClick={handleSave}>{saving ? 'Sauvegarde...' : 'Sauvegarder maintenant'}</StageButton>
          <p className={`text-xs mt-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>La sauvegarde inclut toutes les données clients, biens, contrats et documents.</p>
        </div>
      </div>
    </Stage>
  )
}
