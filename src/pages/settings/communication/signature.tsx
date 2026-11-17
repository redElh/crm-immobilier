import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Textarea } from '../../../components/ui/Textarea'
import { Switch } from '../../../components/ui/Switch'
import { motion } from 'framer-motion'
import { Save, Plus, Edit3 } from 'react-feather'
import {
  StageButton,
  OrbIcon,
  useStageTheme,
} from '../../../components/dashboard/Stage'
import {
  CommunicationSettingsTabs,
  SettingsBackButton,
  SettingsHero,
  useSettingsChrome,
} from '../../../components/settings/SettingsChrome'

const VARIABLES = [
  { label: 'Prénom agent', value: '{{agent.prenom}}' },
  { label: 'Nom agent', value: '{{agent.nom}}' },
  { label: 'Email agent', value: '{{agent.email}}' },
  { label: 'Téléphone agent', value: '{{agent.telephone}}' },
  { label: 'Nom agence', value: '{{agence.nom}}' },
  { label: 'Slogan agence', value: '{{agence.slogan}}' },
]

const DEFAULT_SIGNATURE = `--\n{{agent.prenom}} {{agent.nom}}\nAgent Commercial\n{{agence.nom}}\n{{agent.email}} | {{agent.telephone}}`

export default function SignaturePage() {
  const theme = useStageTheme()
  const { isDark, isAdmin, accent } = useSettingsChrome()
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
    
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <SettingsBackButton />
          <CommunicationSettingsTabs />
        </div>

        <SettingsHero
          eyebrow="Communication · Signature"
          title="Signature email"
          subtitle="Personnalisez la signature ajoutée à tous vos emails"
        />

        <div className="stage-glass p-6 space-y-6">
          <div>
            <label className={`text-[11px] font-bold uppercase tracking-[0.14em] mb-2 block ${isDark ? 'text-slate-400' : isAdmin ? 'text-orange-900/60' : 'text-teal-900/60'}`}>Aperçu</label>
            <div className={`rounded-2xl border p-4 min-h-[100px] text-sm whitespace-pre-wrap font-mono ${isDark ? 'bg-white/[0.03] border-white/10 text-slate-300' : isAdmin ? 'bg-slate-50 border-orange-900/10 text-slate-700' : 'bg-slate-50 border-teal-900/10 text-slate-700'}`}>
              {signature || 'Aucune signature'}
            </div>
          </div>
          <div>
            <label className={`text-[11px] font-bold uppercase tracking-[0.14em] mb-2 block ${isDark ? 'text-slate-400' : isAdmin ? 'text-orange-900/60' : 'text-teal-900/60'}`}>Contenu</label>
            <Textarea ref={textareaRef as any} value={signature} onChange={(e) => setSignature(e.target.value)} className="min-h-[200px] font-mono text-sm" placeholder="Votre signature..." />
          </div>
          <div>
            <label className={`text-[11px] font-bold uppercase tracking-[0.14em] mb-2 block ${isDark ? 'text-slate-400' : isAdmin ? 'text-orange-900/60' : 'text-teal-900/60'}`}>Variables dynamiques</label>
            <div className="flex flex-wrap gap-2">
              {VARIABLES.map(v => (
                <motion.button key={v.value} type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => insertVariable(v.value)} className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${isDark ? 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08] hover:text-white' : isAdmin ? 'bg-white border-orange-900/10 text-slate-600 hover:bg-orange-50 hover:border-orange-900/20' : 'bg-white border-teal-900/10 text-slate-600 hover:bg-teal-50 hover:border-teal-900/20'}`}>
                  <Plus size={12} />{v.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <div className="stage-glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <OrbIcon icon={Edit3} hue={accent} size={36} radius={11} />
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
    
  )
}
