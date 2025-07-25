import Card from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Switch } from '../../components/ui/Switch'

const notificationTypes = [
  {
    id: 'new-leads',
    title: 'Nouveaux leads',
    description: 'Recevoir une notification pour chaque nouveau lead',
    channels: {
      email: true,
      inApp: true,
      sms: false
    }
  },
  {
    id: 'property-matches',
    title: 'Correspondances de biens',
    description: 'Alertes quand un bien correspond à un client',
    channels: {
      email: true,
      inApp: true,
      sms: false
    }
  },
  {
    id: 'viewing-requests',
    title: 'Demandes de visite',
    description: 'Notifications pour les demandes de visite',
    channels: {
      email: true,
      inApp: true,
      sms: true
    }
  },
  {
    id: 'document-signatures',
    title: 'Signatures de documents',
    description: 'Alertes quand un document est signé',
    channels: {
      email: true,
      inApp: true,
      sms: false
    }
  },
  {
    id: 'team-activity',
    title: 'Activité de l\'équipe',
    description: 'Notifications sur les actions de votre équipe',
    channels: {
      email: false,
      inApp: true,
      sms: false
    }
  }
]

export default function NotificationSettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon="arrow-left" onClick={() => window.history.back()} />
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>

      <Card>
        <div className="p-6 space-y-8">
          <div>
            <h3 className="font-semibold text-lg mb-4">Canaux de notification</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Icon name="mail" className="text-blue-500" />
                  <Switch defaultChecked className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400" />
                </div>
                <h4 className="font-medium">Email</h4>
                <p className="text-sm text-gray-600">karim@m2squaremeter.com</p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Icon name="bell" className="text-purple-500" />
                  <Switch defaultChecked className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400"/>
                </div>
                <h4 className="font-medium">Application</h4>
                <p className="text-sm text-gray-600">Notifications dans le CRM</p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Icon name="smartphone" className="text-green-500" />
                  <Switch className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400"/>
                </div>
                <h4 className="font-medium">SMS</h4>
                <p className="text-sm text-gray-600">+212 6 12 34 56 78</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-6">Préférences par type</h3>
            <div className="space-y-6">
              {notificationTypes.map((type) => (
                <div key={type.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-medium">{type.title}</h4>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Icon name="mail" className="w-4 h-4 text-gray-400" />
                      <Switch checked={type.channels.email} className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400"/>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="bell" className="w-4 h-4 text-gray-400" />
                      <Switch checked={type.channels.inApp} className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400"/>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="smartphone" className="w-4 h-4 text-gray-400" />
                      <Switch checked={type.channels.sms} className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400"/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button variant="outline">Réinitialiser</Button>
            <Button variant="default">Enregistrer</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}