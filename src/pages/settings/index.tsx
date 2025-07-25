import Card from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Badge } from '../../components/ui/Badge'
import { NavLink } from 'react-router-dom' // Add this import

const settingsCategories = [
  {
    title: "Profil",
    description: "Modifiez vos informations personnelles et préférences",
    icon: "user",
    to: "/settings/profile",
    updated: true
  },
  {
    title: "Notifications",
    description: "Configurez vos préférences de notifications",
    icon: "bell",
    to: "/settings/notifications"
  },
  {
    title: "Équipe",
    description: "Gérez les membres de votre équipe et leurs permissions",
    icon: "users",
    to: "/settings/team",
    proFeature: true
  },
  {
    title: "Intégrations",
    description: "Connectez vos outils externes (WhatsApp, Google, etc.)",
    icon: "plug",
    to: "/settings/integrations"
  },
  {
    title: "Facturation",
    description: "Gérez votre abonnement et vos moyens de paiement",
    icon: "credit-card",
    to: "/settings/billing",
    proFeature: true
  },
  {
    title: "Sécurité",
    description: "Paramètres de sécurité et connexion",
    icon: "lock",
    to: "/settings/security"
  }
]

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Paramètres</h1>
          <p className="text-gray-600">Personnalisez votre expérience CRM Immobilier</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsCategories.map((category) => (
          <Card key={category.title} className="hover:shadow-md transition-shadow">
            <NavLink
              to={category.to}
              className={({ isActive }) => 
                `block p-6 ${isActive ? 'bg-accent/5' : ''}`
              }
            >
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg bg-accent/10 text-accent`}>
                  <Icon name={category.icon} className="w-5 h-5" />
                </div>
                {category.updated && (
                  <Badge variant="primary" size="sm">Nouveau</Badge>
                )}
                {category.proFeature && (
                  <Badge variant="secondary" size="sm">PRO</Badge>
                )}
              </div>
              <h3 className="mt-4 font-semibold text-lg">{category.title}</h3>
              <p className="mt-1 text-gray-600">{category.description}</p>
              <div className="mt-4 flex items-center text-accent">
                <span className="text-sm font-medium">Configurer</span>
                <Icon name="arrow-right" className="ml-2 w-4 h-4" />
              </div>
            </NavLink>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg">Aide et support</h3>
            <p className="text-gray-600 mt-1">Besoin d'aide avec votre CRM ?</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" icon="help-circle">
              Centre d'aide
            </Button>
            <Button variant="default" icon="mail">
              Contactez-nous
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}