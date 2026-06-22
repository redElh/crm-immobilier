import { useState } from 'react'
import Card from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { BackLink } from '../../../components/ui/BackLink'
import { Download, Upload, RefreshCw, FileText, Home, DollarSign, File, Database } from 'react-feather'
import { motion } from 'framer-motion'

export default function DonneesPage() {
  const [exporting, setExporting] = useState<string | null>(null)
  const [importing, setImporting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleExport = async (label: string) => {
    setExporting(label)
    await new Promise((r) => setTimeout(r, 1000))
    setExporting(null)
  }

  const handleImport = async (label: string) => {
    setImporting(label)
    await new Promise((r) => setTimeout(r, 1000))
    setImporting(null)
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 1500))
    setSaving(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <BackLink />
      <h1 className="text-2xl font-semibold tracking-tight">Import / Export</h1>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-lg bg-accent-light text-accent">
            <Download size={18} />
          </div>
          <h3 className="font-semibold">Export des données</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <Button
            variant="outline"
            icon={<FileText size={14} />}
            loading={exporting === 'clients'}
            onClick={() => handleExport('clients')}
          >
            Exporter les clients
          </Button>
          <Button
            variant="outline"
            icon={<Home size={14} />}
            loading={exporting === 'biens'}
            onClick={() => handleExport('biens')}
          >
            Exporter les biens
          </Button>
          <Button
            variant="outline"
            icon={<DollarSign size={14} />}
            loading={exporting === 'transactions'}
            onClick={() => handleExport('transactions')}
          >
            Exporter les transactions
          </Button>
          <Button
            variant="outline"
            icon={<File size={14} />}
            loading={exporting === 'documents'}
            onClick={() => handleExport('documents')}
          >
            Exporter les documents
          </Button>
        </div>
        <Button
          variant="default"
          className="w-full"
          icon={<Database size={14} />}
          loading={exporting === 'all'}
          onClick={() => handleExport('all')}
        >
          Exporter toutes les données
        </Button>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-lg bg-accent-light text-accent">
            <Upload size={18} />
          </div>
          <h3 className="font-semibold">Import des données</h3>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            icon={<Upload size={14} />}
            loading={importing === 'clients-csv'}
            onClick={() => handleImport('clients-csv')}
          >
            Importer des clients (CSV)
          </Button>
          <Button
            variant="outline"
            className="w-full"
            icon={<Upload size={14} />}
            loading={importing === 'biens-csv'}
            onClick={() => handleImport('biens-csv')}
          >
            Importer des biens (CSV)
          </Button>
          <Button
            variant="outline"
            className="w-full"
            icon={<Upload size={14} />}
            loading={importing === 'apimo'}
            onClick={() => handleImport('apimo')}
          >
            Importer depuis Apimo
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-lg bg-accent-light text-accent">
            <RefreshCw size={18} />
          </div>
          <div>
            <h3 className="font-semibold">Sauvegarde</h3>
          </div>
        </div>

        <p className="text-sm text-text-secondary mb-4">
          Dernière sauvegarde : 13/06/2026 02:00
        </p>

        <Button
          variant="outline"
          icon={<RefreshCw size={14} />}
          loading={saving}
          onClick={handleSave}
        >
          Sauvegarder maintenant
        </Button>

        <p className="text-xs text-text-secondary mt-3">
          La sauvegarde inclut toutes les données clients, biens, contrats et documents.
        </p>
      </Card>
    </motion.div>
  )
}
