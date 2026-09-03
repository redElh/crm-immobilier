import { FileText, UserCheck, Shield, AlertCircle, XCircle, Award, LogOut, ArrowLeft } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import {
  Stage,
  OrbIcon,
  STAGE_HUES,
  useStageTheme,
} from '../../../components/dashboard/Stage'

const sections = [
  { icon: FileText, title: 'Acceptation des conditions', hue: STAGE_HUES.violet, content: "En accédant à la plateforme CRM Immobilier et en créant un compte, vous acceptez sans réserve les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la plateforme. Square Meter se réserve le droit de modifier ces conditions à tout moment, les modifications prenant effet dès leur publication sur la plateforme." },
  { icon: UserCheck, title: 'Compte utilisateur', hue: STAGE_HUES.sky, content: "Vous êtes responsable de la confidentialité de vos identifiants de connexion et de toutes les activités effectuées sous votre compte. Vous vous engagez à fournir des informations exactes et à les maintenir à jour. Chaque compte est personnel et ne peut être partagé avec d'autres utilisateurs sans autorisation explicite de Square Meter." },
  { icon: Shield, title: "Obligations de l'utilisateur", hue: STAGE_HUES.amber, content: "Vous vous engagez à utiliser la plateforme conformément aux lois et réglementations applicables, à ne pas détourner les fonctionnalités du CRM à des fins frauduleuses, à ne pas tenter d'accéder aux données d'autres utilisateurs, et à ne pas introduire de logiciels malveillants ou de scripts automatisés. Les données saisies dans le CRM doivent être conformes à la législation en vigueur sur la protection des données." },
  { icon: Award, title: 'Propriété intellectuelle', hue: STAGE_HUES.emerald, content: "La plateforme CRM Immobilier, son code source, son design, ses marques et son contenu sont la propriété exclusive de Square Meter. Aucune licence ou droit d'utilisation n'est accordé implicitement. Vous n'êtes pas autorisé à reproduire, modifier, distribuer ou créer des œuvres dérivées de la plateforme sans autorisation écrite préalable." },
  { icon: AlertCircle, title: 'Limitation de responsabilité', hue: { a: '#F472B6', b: '#BE185D', glow: 'rgba(244,114,182,0.45)', line: '#F472B6' } as any, content: "Square Meter s'efforce de maintenir la plateforme accessible et opérationnelle, mais ne peut garantir une disponibilité ininterrompue. La plateforme est fournie « en l'état » et Square Meter décline toute responsabilité en cas de perte de données, de préjudice commercial ou de dommages indirects résultant de l'utilisation de la plateforme, dans la limite permise par la loi." },
  { icon: XCircle, title: 'Utilisations interdites', hue: STAGE_HUES.violet, content: "Il est strictement interdit d'utiliser la plateforme pour : stocker ou traiter des données illicites, violer les droits de propriété intellectuelle de tiers, harceler ou nuire à d'autres utilisateurs, contourner les mesures de sécurité, ou toute autre activité qui pourrait compromettre l'intégrité de la plateforme ou la sécurité des données." },
  { icon: LogOut, title: 'Résiliation', hue: STAGE_HUES.sky, content: "Vous pouvez résilier votre compte à tout moment depuis les paramètres de la plateforme. Square Meter se réserve le droit de suspendre ou résilier votre compte en cas de violation des présentes conditions, sans préavis ni indemnité. En cas de résiliation, vos données seront conservées pendant une période de 12 mois avant d'être définitivement supprimées." },
]

export default function ConditionsPage() {
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  return (
    <Stage theme={theme}>
      <div className="space-y-6">
        <button onClick={() => navigate(-1)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors w-fit ${isDark ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-teal-900/10 text-slate-600 hover:bg-white'}`}><ArrowLeft size={13} /> Retour</button>
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" /></span>
            <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>Paramètres · Conditions</p>
          </div>
          <h1 className={`mt-1 text-3xl font-extrabold tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent' : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent'}`}>Conditions d'utilisation</h1>
          <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Dernière mise à jour : 15 juin 2026</p>
        </div>

        <div className="stage-glass p-6">
          <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Les présentes conditions d'utilisation régissent l'accès et l'utilisation de la plateforme CRM Immobilier éditée par Square Meter. En utilisant cette plateforme, vous reconnaissez avoir lu, compris et accepté l'intégralité des conditions ci-dessous.</p>
        </div>

        {sections.map(section => {
          const SectionIcon = section.icon
          return (
            <div key={section.title} className="stage-glass p-6">
              <div className="flex items-start gap-4">
                <OrbIcon icon={SectionIcon} hue={section.hue} size={40} radius={12} />
                <div>
                  <h3 className={`text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{section.title}</h3>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{section.content}</p>
                </div>
              </div>
            </div>
          )
        })}

        <div className="stage-glass p-6">
          <h3 className={`text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Droit applicable</h3>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Les présentes conditions sont régies par le droit marocain. Tout litige relatif à l'interprétation ou à l'exécution des présentes conditions sera soumis à la compétence exclusive des tribunaux de Casablanca.</p>
        </div>
      </div>
    </Stage>
  )
}
