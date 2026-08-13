import Card from '../../../components/ui/Card'
import { BackLink } from '../../../components/ui/BackLink'
import { motion } from 'framer-motion'
import { FileText, UserCheck, Shield, AlertCircle, XCircle, Award, LogOut } from 'react-feather'

const sections = [
  {
    icon: FileText,
    title: 'Acceptation des conditions',
    content: 'En accédant à la plateforme CRM Immobilier et en créant un compte, vous acceptez sans réserve les présentes conditions d\'utilisation. Si vous n\'acceptez pas ces conditions, veuillez ne pas utiliser la plateforme. Square Meter se réserve le droit de modifier ces conditions à tout moment, les modifications prenant effet dès leur publication sur la plateforme.'
  },
  {
    icon: UserCheck,
    title: 'Compte utilisateur',
    content: 'Vous êtes responsable de la confidentialité de vos identifiants de connexion et de toutes les activités effectuées sous votre compte. Vous vous engagez à fournir des informations exactes et à les maintenir à jour. Chaque compte est personnel et ne peut être partagé avec d\'autres utilisateurs sans autorisation explicite de Square Meter.'
  },
  {
    icon: Shield,
    title: 'Obligations de l\'utilisateur',
    content: 'Vous vous engagez à utiliser la plateforme conformément aux lois et réglementations applicables, à ne pas détourner les fonctionnalités du CRM à des fins frauduleuses, à ne pas tenter d\'accéder aux données d\'autres utilisateurs, et à ne pas introduire de logiciels malveillants ou de scripts automatisés. Les données saisies dans le CRM doivent être conformes à la législation en vigueur sur la protection des données.'
  },
  {
    icon: Award,
    title: 'Propriété intellectuelle',
    content: 'La plateforme CRM Immobilier, son code source, son design, ses marques et son contenu sont la propriété exclusive de Square Meter. Aucune licence ou droit d\'utilisation n\'est accordé implicitement. Vous n\'êtes pas autorisé à reproduire, modifier, distribuer ou créer des œuvres dérivées de la plateforme sans autorisation écrite préalable.'
  },
  {
    icon: AlertCircle,
    title: 'Limitation de responsabilité',
    content: 'Square Meter s\'efforce de maintenir la plateforme accessible et opérationnelle, mais ne peut garantir une disponibilité ininterrompue. La plateforme est fournie « en l\'état » et Square Meter décline toute responsabilité en cas de perte de données, de préjudice commercial ou de dommages indirects résultant de l\'utilisation de la plateforme, dans la limite permise par la loi.'
  },
  {
    icon: XCircle,
    title: 'Utilisations interdites',
    content: 'Il est strictement interdit d\'utiliser la plateforme pour : stocker ou traiter des données illicites, violer les droits de propriété intellectuelle de tiers, harceler ou nuire à d\'autres utilisateurs, contourner les mesures de sécurité, ou toute autre activité qui pourrait compromettre l\'intégrité de la plateforme ou la sécurité des données.'
  },
  {
    icon: LogOut,
    title: 'Résiliation',
    content: 'Vous pouvez résilier votre compte à tout moment depuis les paramètres de la plateforme. Square Meter se réserve le droit de suspendre ou résilier votre compte en cas de violation des présentes conditions, sans préavis ni indemnité. En cas de résiliation, vos données seront conservées pendant une période de 12 mois avant d\'être définitivement supprimées.'
  }
]

export default function ConditionsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <BackLink />
      <h1 className="text-2xl font-semibold tracking-tight">Conditions d'utilisation</h1>
      <p className="text-sm text-text-secondary">Dernière mise à jour : 15 juin 2026</p>

      <Card className="p-6">
        <p className="text-sm text-text-secondary leading-relaxed">
          Les présentes conditions d'utilisation régissent l'accès et l'utilisation de la plateforme
          CRM Immobilier éditée par Square Meter. En utilisant cette plateforme, vous reconnaissez avoir
          lu, compris et accepté l'intégralité des conditions ci-dessous. Si vous utilisez la plateforme
          au nom d'une entreprise, vous déclarez avoir l'autorité nécessaire pour lier cette entreprise
          aux présentes conditions.
        </p>
      </Card>

      {sections.map((section) => {
        const SectionIcon = section.icon
        return (
          <Card key={section.title} className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-accent-light text-accent shrink-0">
                <SectionIcon size={18} />
              </div>
              <div>
                <h3 className="font-semibold mb-2">{section.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{section.content}</p>
              </div>
            </div>
          </Card>
        )
      })}

      <Card className="p-6">
        <h3 className="font-semibold mb-2">Droit applicable</h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          Les présentes conditions sont régies par le droit marocain. Tout litige relatif à l'interprétation
          ou à l'exécution des présentes conditions sera soumis à la compétence exclusive des tribunaux de
          Casablanca, sous réserve des recours amiables préalables.
        </p>
      </Card>
    </motion.div>
  )
}
