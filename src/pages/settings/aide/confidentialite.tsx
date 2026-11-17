import { Shield, Database, Eye, Lock, Share2, Mail, FileText, Sliders } from 'react-feather'
import {
  OrbIcon,
  STAGE_HUES,
  useStageTheme,
} from '../../../components/dashboard/Stage'
import {
  SettingsBackButton,
  SettingsHero,
  useSettingsChrome,
} from '../../../components/settings/SettingsChrome'

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
  const { isDark } = useSettingsChrome()
  return (
    
      <div className="space-y-6">
        <SettingsBackButton />
        <SettingsHero
          eyebrow="Paramètres · Confidentialité"
          title="Politique de confidentialité"
          subtitle="Dernière mise à jour : 15 juin 2026"
        />

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
    
  )
}
