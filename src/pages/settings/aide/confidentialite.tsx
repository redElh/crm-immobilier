import { Shield, Database, Eye, Lock, Share2, Mail, FileText, Sliders, ArrowLeft } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import {
  Stage,
  OrbIcon,
  STAGE_HUES,
  useStageTheme,
} from '../../../components/dashboard/Stage'

const sections = [
  { icon: Shield, title: 'Responsable du traitement', hue: STAGE_HUES.violet, content: 'Square Meter, société immatriculée au Registre du Commerce de Casablanca sous le numéro XX-XXX-XXXX, dont le siège social est situé à Casablanca, Maroc, est le responsable du traitement des données personnelles collectées via la plateforme CRM Immobilier.' },
  { icon: Database, title: 'Données collectées', hue: STAGE_HUES.sky, content: "Nous collectons les données suivantes : nom, prénom, adresse email, numéro de téléphone, poste, agence de rattachement, informations de connexion, préférences utilisateur, et données d'utilisation de la plateforme. Certaines données relatives aux biens immobiliers, aux clients et aux transactions peuvent également être traitées dans le cadre de l'utilisation du CRM." },
  { icon: Eye, title: 'Finalités du traitement', hue: STAGE_HUES.amber, content: "Vos données sont traitées pour les finalités suivantes : gestion de votre compte utilisateur, fourniture des services CRM, gestion des prospects et clients, suivi des transactions immobilières, communication liée à l'utilisation de la plateforme, amélioration de nos services, et respect de nos obligations légales et réglementaires." },
  { icon: Lock, title: 'Sécurité des données', hue: STAGE_HUES.emerald, content: "Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour garantir la sécurité et la confidentialité de vos données personnelles, notamment le chiffrement des données en transit et au repos, des contrôles d'accès stricts, et une surveillance continue de nos systèmes." },
  { icon: Share2, title: 'Partage des données', hue: { a: '#F472B6', b: '#BE185D', glow: 'rgba(244,114,182,0.45)', line: '#F472B6' } as any, content: "Vos données personnelles ne sont pas vendues à des tiers. Elles peuvent être partagées avec nos sous-traitants techniques (hébergement, maintenance) dans le cadre strict de la fourniture de nos services, et avec les autorités compétentes lorsque la loi l'exige." },
  { icon: Mail, title: 'Vos droits', hue: STAGE_HUES.violet, content: "Conformément à la loi 09-08 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel, vous disposez d'un droit d'accès, de rectification, d'effacement et d'opposition au traitement de vos données. Vous pouvez exercer ces droits en contactant notre délégué à la protection des données à l'adresse : dpo@squaremeter.com." },
  { icon: FileText, title: 'Conservation des données', hue: STAGE_HUES.sky, content: "Vos données sont conservées pendant toute la durée de votre utilisation active de la plateforme, et jusqu'à 12 mois après la cessation de votre compte à des fins de reprise éventuelle. Les données relatives aux transactions sont conservées conformément aux obligations légales et comptables en vigueur au Maroc." },
  { icon: Sliders, title: 'Cookies', hue: STAGE_HUES.amber, content: "Notre plateforme utilise des cookies nécessaires à son fonctionnement technique, des cookies de session pour maintenir votre authentification, et des cookies d'analyse pour améliorer votre expérience. Vous pouvez configurer vos préférences de cookies à tout moment depuis les paramètres de votre navigateur." },
]

export default function ConfidentialitePage() {
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
            <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>Paramètres · Confidentialité</p>
          </div>
          <h1 className={`mt-1 text-3xl font-extrabold tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent' : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent'}`}>Politique de confidentialité</h1>
          <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Dernière mise à jour : 15 juin 2026</p>
        </div>

        <div className="stage-glass p-6">
          <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>La présente politique de confidentialité décrit comment Square Meter (« nous », « notre », « nos ») collecte, utilise, partage et protège les informations personnelles des utilisateurs de la plateforme CRM Immobilier. Nous nous engageons à protéger votre vie privée conformément à la loi 09-08 et au RGPD.</p>
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
          <h3 className={`text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Contact</h3>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Pour toute question concernant cette politique ou pour exercer vos droits, contactez-nous à dpo@squaremeter.com ou par courrier : Square Meter, Casablanca, Maroc.</p>
        </div>
      </div>
    </Stage>
  )
}
