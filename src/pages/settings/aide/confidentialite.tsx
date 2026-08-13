import Card from '../../../components/ui/Card'
import { BackLink } from '../../../components/ui/BackLink'
import { motion } from 'framer-motion'
import { Shield, Database, Eye, Lock, Share2, Mail, FileText, Sliders } from 'react-feather'

const sections = [
  {
    icon: Shield,
    title: 'Responsable du traitement',
    content: 'Square Meter, société immatriculée au Registre du Commerce de Casablanca sous le numéro XX-XXX-XXXX, dont le siège social est situé à Casablanca, Maroc, est le responsable du traitement des données personnelles collectées via la plateforme CRM Immobilier.'
  },
  {
    icon: Database,
    title: 'Données collectées',
    content: 'Nous collectons les données suivantes : nom, prénom, adresse email, numéro de téléphone, poste, agence de rattachement, informations de connexion, préférences utilisateur, et données d\'utilisation de la plateforme. Certaines données relatives aux biens immobiliers, aux clients et aux transactions peuvent également être traitées dans le cadre de l\'utilisation du CRM.'
  },
  {
    icon: Eye,
    title: 'Finalités du traitement',
    content: 'Vos données sont traitées pour les finalités suivantes : gestion de votre compte utilisateur, fourniture des services CRM, gestion des prospects et clients, suivi des transactions immobilières, communication liée à l\'utilisation de la plateforme, amélioration de nos services, et respect de nos obligations légales et réglementaires.'
  },
  {
    icon: Lock,
    title: 'Sécurité des données',
    content: 'Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour garantir la sécurité et la confidentialité de vos données personnelles, notamment le chiffrement des données en transit et au repos, des contrôles d\'accès stricts, et une surveillance continue de nos systèmes.'
  },
  {
    icon: Share2,
    title: 'Partage des données',
    content: 'Vos données personnelles ne sont pas vendues à des tiers. Elles peuvent être partagées avec nos sous-traitants techniques (hébergement, maintenance) dans le cadre strict de la fourniture de nos services, et avec les autorités compétentes lorsque la loi l\'exige.'
  },
  {
    icon: Mail,
    title: 'Vos droits',
    content: 'Conformément à la loi 09-08 relative à la protection des personnes physiques à l\'égard du traitement des données à caractère personnel, vous disposez d\'un droit d\'accès, de rectification, d\'effacement et d\'opposition au traitement de vos données. Vous pouvez exercer ces droits en contactant notre délégué à la protection des données à l\'adresse : dpo@squaremeter.com.'
  },
  {
    icon: FileText,
    title: 'Conservation des données',
    content: 'Vos données sont conservées pendant toute la durée de votre utilisation active de la plateforme, et jusqu\'à 12 mois après la cessation de votre compte à des fins de reprise éventuelle. Les données relatives aux transactions sont conservées conformément aux obligations légales et comptables en vigueur au Maroc.'
  },
  {
    icon: Sliders,
    title: 'Cookies',
    content: 'Notre plateforme utilise des cookies nécessaires à son fonctionnement technique, des cookies de session pour maintenir votre authentification, et des cookies d\'analyse pour améliorer votre expérience. Vous pouvez configurer vos préférences de cookies à tout moment depuis les paramètres de votre navigateur.'
  }
]

export default function ConfidentialitePage() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <BackLink />
      <h1 className="text-2xl font-semibold tracking-tight">Politique de confidentialité</h1>
      <p className="text-sm text-text-secondary">Dernière mise à jour : 15 juin 2026</p>

      <Card className="p-6">
        <p className="text-sm text-text-secondary leading-relaxed">
          La présente politique de confidentialité décrit comment Square Meter (« nous », « notre », « nos »)
          collecte, utilise, partage et protège les informations personnelles des utilisateurs de la plateforme
          CRM Immobilier. Nous nous engageons à protéger votre vie privée conformément à la loi 09-08 relative
          à la protection des données à caractère personnel et au Règlement Général sur la Protection des
          Données (RGPD) pour nos utilisateurs européens.
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
        <h3 className="font-semibold mb-2">Contact</h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits,
          vous pouvez nous contacter à l'adresse email : dpo@squaremeter.com ou par courrier à l'adresse
          suivante : Square Meter, Casablanca, Maroc.
        </p>
      </Card>
    </motion.div>
  )
}
