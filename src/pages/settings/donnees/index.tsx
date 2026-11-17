import { useState } from 'react'
import { Download, Upload, RefreshCw, FileText, Home, DollarSign, File, Database } from 'react-feather'
import {
  StageButton,
  OrbIcon,
  STAGE_HUES,
  useStageTheme,
} from '../../../components/dashboard/Stage'
import {
  SettingsBackButton,
  SettingsHero,
  useSettingsChrome,
} from '../../../components/settings/SettingsChrome'

export default function DonneesPage() {
  const theme = useStageTheme()
  const { isDark } = useSettingsChrome()
  const [exporting, setExporting] = useState<string | null>(null)
  const [importing, setImporting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const handleExport = async (label: string) => { setExporting(label); await new Promise(r => setTimeout(r, 900)); setExporting(null) }
  const handleImport = async (label: string) => { setImporting(label); await new Promise(r => setTimeout(r, 900)); setImporting(null) }
  const handleSave = async () => { setSaving(true); await new Promise(r => setTimeout(r, 1200)); setSaving(false) }

  return (
    
      <div className="space-y-6">
        <SettingsBackButton />

        <SettingsHero
          eyebrow="Paramètres · Données"
          title="Import / Export"
          subtitle="Gérez vos données — exportez, importez et sauvegardez"
        />

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
    
  )
}
