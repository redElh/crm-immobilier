import { useState, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Textarea } from '../../../components/ui/Textarea'
import { Switch } from '../../../components/ui/Switch'
import { motion } from 'framer-motion'
import { Save, Plus, Edit3, MessageSquare, ArrowLeft } from 'react-feather'
import {
  Stage,
  StageButton,
  OrbIcon,
  STAGE_HUES,
  useStageTheme,
} from '../../../components/dashboard/Stage'

const commTabs = [
  { label: 'Signature', icon: Edit3, to: '/settings/communication/signature' },
  { label: 'Réponses auto', icon: MessageSquare, to: '/settings/communication/reponses-automatiques' },
]

const VARIABLES = [
  { label: 'Prénom agent', value: '{{agent.prenom}}' },
  { label: 'Nom agent', value: '{{agent.nom}}' },
  { label: 'Email agent', value: '{{agent.email}}' },
  { label: 'Téléphone agent', value: '{{agent.telephone}}' },
  { label: 'Nom agence', value: '{{agence.nom}}' },
  { label: 'Slogan agence', value: '{{agence.slogan}}' },
]

const DEFAULT_SIGNATURE = `--\n{{agent.prenom}} {{agent.nom}}\nAgent Commercial\n{{agence.nom}}\n{{agent.email}} | {{agent.telephone}}`

function CommTabs() {
  const location = useLocation()
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  return (
    <div className="stage-glass flex gap-1 p-1 w-fit rounded-2xl">
      {commTabs.map(tab => {
        const TabIcon = tab.icon
        const isActive = location.pathname === tab.to
        return (
          <NavLink key={tab.to} to={tab.to} className={`relative flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${isActive ? 'text-white' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-teal-900'}`}>
            {isActive && <motion.span layoutId="comm-tab" className="absolute inset-0 rounded-xl border border-white/20" style={{ backgroundImage: isDark ? 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)' : 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)' }} transition={{ type: 'spring', stiffness: 380, damping: 32 } as any} />}
            <TabIcon size={14} className="relative z-10" /><span className="relative z-10">{tab.label}</span>
          </NavLink>
        )
      })}
    </div>
  )
}

export default function SignaturePage() {
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const [signature, setSignature] = useState(DEFAULT_SIGNATURE)
  const [autoAdd, setAutoAdd] = useState(true)
  const [newMessagesOnly, setNewMessagesOnly] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertVariable = (value: string) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = signature.slice(0, start)
    const after = signature.slice(end)
    const updated = before + value + after
    setSignature(updated)
    requestAnimationFrame(() => {
      textarea.focus()
      const pos = start + value.length
      textarea.setSelectionRange(pos, pos)
    })
  }

  return (
    <Stage theme={theme}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${isDark ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-teal-900/10 text-slate-600 hover:bg-white'}`}><ArrowLeft size={13} /> Retour</button>
          <CommTabs />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" /></span>
            <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>Communication · Signature</p>
          </div>
          <h1 className={`mt-1 text-3xl font-extrabold tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent' : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent'}`}>Signature email</h1>
          <p className={`mt-0.5 text-sm ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>Personnalisez la signature ajoutée à tous vos emails</p>
        </div>

        <div className="stage-glass p-6 space-y-6">
          <div>
            <label className={`text-[11px] font-bold uppercase tracking-[0.14em] mb-2 block ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>Aperçu</label>
            <div className={`rounded-2xl border p-4 min-h-[100px] text-sm whitespace-pre-wrap font-mono ${isDark ? 'bg-white/[0.03] border-white/10 text-slate-300' : 'bg-slate-50 border-teal-900/10 text-slate-700'}`}>
              {signature || 'Aucune signature'}
            </div>
          </div>
          <div>
            <label className={`text-[11px] font-bold uppercase tracking-[0.14em] mb-2 block ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>Contenu</label>
            <Textarea ref={textareaRef as any} value={signature} onChange={(e) => setSignature(e.target.value)} className="min-h-[200px] font-mono text-sm" placeholder="Votre signature..." />
          </div>
          <div>
            <label className={`text-[11px] font-bold uppercase tracking-[0.14em] mb-2 block ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>Variables dynamiques</label>
            <div className="flex flex-wrap gap-2">
              {VARIABLES.map(v => (
                <motion.button key={v.value} type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => insertVariable(v.value)} className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${isDark ? 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08] hover:text-white' : 'bg-white border-teal-900/10 text-slate-600 hover:bg-teal-50 hover:border-teal-900/20'}`}>
                  <Plus size={12} />{v.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <div className="stage-glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <OrbIcon icon={Edit3} hue={STAGE_HUES.violet} size={36} radius={11} />
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Options d'envoi</h3>
          </div>
          <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
            <div className="flex items-center justify-between py-3">
              <div><p className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Ajouter automatiquement cette signature à tous les emails</p><p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>La signature sera jointe à chaque nouvel email envoyé</p></div>
              <Switch checked={autoAdd} onCheckedChange={setAutoAdd} />
            </div>
            <div className="flex items-center justify-between py-3">
              <div><p className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Ajouter la signature uniquement aux nouveaux messages</p><p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Ignorer les réponses et transferts</p></div>
              <Switch checked={newMessagesOnly} onCheckedChange={setNewMessagesOnly} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <StageButton variant="glass" onClick={() => navigate(-1)}>Annuler</StageButton>
          <StageButton variant="primary" icon={<Save size={14} />}>Enregistrer</StageButton>
        </div>
      </div>
    </Stage>
  )
}
