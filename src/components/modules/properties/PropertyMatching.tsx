import Card from '../../ui/Card'
import { Progress } from '../../ui/Progress'
import { Button } from '../../ui/Button'
import { Icon } from '../../ui/Icon'

interface PropertyMatchingProps {
  clients: {
    id: string
    name: string
    matchScore: number
    criteria: string
    lastContact?: string
    status?: string
  }[]
}

export const PropertyMatching = ({ clients }: PropertyMatchingProps) => {
  const getMatchColor = (score: number) => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 75) return 'bg-blue-500'
    if (score >= 50) return 'bg-amber-500'
    return 'bg-gray-500'
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-semibold text-lg">Clients correspondants</h3>
          <p className="text-sm text-gray-500">
            {clients.length} {clients.length === 1 ? 'client correspond à' : 'clients correspondent à'} ce bien
          </p>
        </div>
        <Button variant="outline" icon="refresh">
          Actualiser
        </Button>
      </div>

      {clients.length > 0 ? (
        <div className="space-y-4">
          {clients.map((client) => (
            <div key={client.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{client.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{client.criteria}</p>
                </div>
                <div className="flex items-center">
                  <span className="font-bold mr-2">{client.matchScore}%</span>
                  <Progress 
                    value={client.matchScore} 
                    indicatorColor={getMatchColor(client.matchScore)}
                    className="w-20 h-2"
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-3 border-t">
                <div className="text-sm text-gray-500">
                  {client.lastContact ? (
                    `Contacté le ${new Date(client.lastContact).toLocaleDateString('fr-FR')}`
                  ) : (
                    'Pas encore contacté'
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" icon="user">
                    Profil
                  </Button>
                  <Button variant="default" size="sm" icon="mail">
                    Contacter
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Icon name="users" className="mx-auto h-12 w-12 text-gray-400" />
          <h4 className="mt-2 text-sm font-medium text-gray-900">Aucun client correspondant</h4>
          <p className="mt-1 text-sm text-gray-500">
            Aucun client ne correspond actuellement aux critères de ce bien
          </p>
        </div>
      )}
    </Card>
  )
}