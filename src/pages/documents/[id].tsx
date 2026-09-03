import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText, Download, Share2, Eye, Clock, User, AlertTriangle,
  ArrowLeft, ZoomIn, ZoomOut, Maximize2, Printer
} from 'react-feather'
import { Stage, OrbIcon, StageBadge, StageButton, STAGE_HUES, SLATE_HUE, useStageTheme } from '../../components/dashboard/Stage'

export default function DocumentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useStageTheme()
  const isDark = theme === 'dark'

  const document = {
    id: id,
    name: 'Mandat exclusif - Villa Marrakech',
    type: 'mandate',
    category: 'mandates',
    relatedTo: 'Bien #1234',
    client: 'Sophie Martin',
    date: '2023-06-15',
    size: '2.4 MB',
    status: 'signed',
    lastModified: '2023-06-18',
    modifiedBy: 'Karim Eloui',
    downloadCount: 3,
    sharedWith: ['Youssef Amrani', 'Leila Benbrahim']
  }

  return (
    <Stage theme={theme}>
      <div className="space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button onClick={() => navigate(-1)} className={`group inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold backdrop-blur-md transition-all ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:border-white/20' : 'border-teal-900/10 bg-white/60 text-teal-900/60 hover:text-teal-900'}`}>
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" /> Retour
          </button>
          <div className="flex gap-2">
            <StageButton variant="glass" icon={<Download size={13} />}>Télécharger</StageButton>
            <StageButton variant="primary" icon={<Share2 size={13} />}>Partager</StageButton>
          </div>
        </div>

        {/* Hero */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <OrbIcon icon={FileText} hue={STAGE_HUES.violet} size={48} radius={14} />
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></span>
                <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>Documents · Détail</p>
              </div>
              <h1 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{document.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <StageBadge variant={document.status === 'signed' ? 'ok' : 'warn'}>{document.status === 'signed' ? 'Signé' : 'En attente'}</StageBadge>
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{document.type} · {document.size}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview */}
          <div className="lg:col-span-2">
            <div className="stage-glass overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)' }}>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Aperçu du document</h3>
                <div className="flex gap-1.5">
                  <button className={`w-8 h-8 rounded-xl flex items-center justify-center border ${isDark ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}><ZoomIn size={14} /></button>
                  <button className={`w-8 h-8 rounded-xl flex items-center justify-center border ${isDark ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}><ZoomOut size={14} /></button>
                  <button className={`w-8 h-8 rounded-xl flex items-center justify-center border ${isDark ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}><Maximize2 size={14} /></button>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center p-6" style={{ background: isDark ? 'radial-gradient(60% 80% at 50% 30%, rgba(139,124,255,0.08), transparent 70%)' : 'radial-gradient(60% 80% at 50% 30%, rgba(20,184,166,0.06), transparent 70%)' }}>
                <div className="relative w-full max-w-2xl">
                  <div className={`aspect-[4/3] rounded-2xl flex flex-col overflow-hidden border shadow-xl ${isDark ? 'bg-white border-white/10' : 'bg-white border-slate-200'}`}>
                    <div className={`h-8 flex items-center px-3 border-b ${isDark ? 'bg-slate-100 border-slate-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400" /><span className="w-3 h-3 rounded-full bg-yellow-400" /><span className="w-3 h-3 rounded-full bg-green-400" /></div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
                      <FileText size={48} className="text-slate-300 mb-3" />
                      <h4 className="text-lg font-bold text-slate-700">{document.name}</h4>
                      <p className="text-sm text-slate-500 mt-1">{document.type} · {document.size}</p>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 left-0 right-0 flex justify-center gap-2">
                    <StageButton variant="primary" size="sm" icon={<Download size={13} />}>Télécharger</StageButton>
                    <StageButton variant="glass" size="sm" icon={<Printer size={13} />}>Imprimer</StageButton>
                  </div>
                </div>
              </div>

              <div className={`mt-6 px-4 py-3 border-t flex items-center justify-between text-xs ${isDark ? 'border-white/5 bg-white/[0.02] text-slate-400' : 'border-slate-100 bg-slate-50/50 text-slate-500'}`}>
                <div className="flex items-center gap-2">
                  <StageBadge variant={document.status === 'signed' ? 'ok' : 'warn'}>{document.status === 'signed' ? 'Signé' : 'En attente'}</StageBadge>
                  <span>Modifié le {new Date(document.lastModified).toLocaleDateString('fr-FR')}</span>
                </div>
                <span className="flex items-center gap-1.5"><Eye size={13} /> {document.downloadCount} téléchargements</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="stage-glass p-5">
              <div className="flex items-center gap-3 mb-4">
                <OrbIcon icon={FileText} hue={STAGE_HUES.sky} size={36} radius={11} />
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Détails du document</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Type', value: document.type },
                  { label: 'Catégorie', value: document.category },
                  { label: 'Bien associé', value: document.relatedTo },
                  { label: 'Client', value: document.client },
                  { label: 'Date', value: new Date(document.date).toLocaleDateString('fr-FR') },
                  { label: 'Modifié par', value: `${new Date(document.lastModified).toLocaleDateString('fr-FR')} · ${document.modifiedBy}` },
                  { label: 'Téléchargements', value: String(document.downloadCount) },
                ].map(item => (
                  <div key={item.label} className={`flex justify-between gap-4 py-2 border-b last:border-0 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</span>
                    <span className={`text-sm font-medium text-right ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="stage-glass p-5">
              <div className="flex items-center gap-3 mb-4">
                <OrbIcon icon={User} hue={STAGE_HUES.emerald} size={36} radius={11} />
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Partagé avec</h3>
              </div>
              {document.sharedWith.length > 0 ? (
                <ul className="space-y-2">
                  {document.sharedWith.map(person => (
                    <li key={person} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/5 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-500/10 text-violet-700'}`}>{person.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                      {person}
                    </li>
                  ))}
                </ul>
              ) : <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Non partagé</p>}
            </div>
          </div>
        </div>

        <div className="stage-glass p-5">
          <div className="flex items-center gap-3 mb-4">
            <OrbIcon icon={Clock} hue={STAGE_HUES.amber} size={36} radius={11} />
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Historique des versions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className={`border-b text-left text-xs ${isDark ? 'border-white/5 text-slate-500' : 'border-slate-100 text-slate-400'}`}><th className="pb-3 font-bold uppercase tracking-wider">Version</th><th className="pb-3 font-bold uppercase tracking-wider">Date</th><th className="pb-3 font-bold uppercase tracking-wider">Modifié par</th><th className="pb-3 font-bold uppercase tracking-wider">Actions</th></tr></thead>
              <tbody className={isDark ? 'divide-y divide-white/5' : 'divide-y divide-slate-50'}>
                <tr className={isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'}>
                  <td className={`py-3 font-mono text-xs ${isDark ? 'text-violet-300' : 'text-violet-600'}`}>v1.2</td>
                  <td className={`py-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{new Date(document.lastModified).toLocaleDateString('fr-FR')}</td>
                  <td className={`py-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{document.modifiedBy}</td>
                  <td className="py-3"><StageButton variant="glass" size="sm" icon={<Download size={12} />}>Télécharger</StageButton></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Stage>
  )
}
