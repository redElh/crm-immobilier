import { useState } from 'react';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Users, Search, Filter, RefreshCw, UserPlus } from 'react-feather';
import type { MatchedClient } from '../../../types/property';

const mockClients: MatchedClient[] = [
  { id: 'client1', name: 'Sophie Martin', matchScore: 92, criteria: 'Budget: 4-5M, Recherche: Villa luxe', type: 'Acheteur' },
  { id: 'client2', name: 'Thomas Dubois', matchScore: 87, criteria: 'Budget: 3.5-5M, Recherche: Résidence principale', type: 'Acheteur' },
  { id: 'client3', name: 'Fatima Zahra', matchScore: 75, criteria: 'Budget: 3-4M, Recherche: Investissement', type: 'Investisseur' },
  { id: 'client4', name: 'Jean-Pierre Morel', matchScore: 63, criteria: 'Budget: 2.5-3.5M, Recherche: Résidence secondaire', type: 'Acheteur' },
];

export const PropertyMatching = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = mockClients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.criteria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Users size={16} className="text-accent" />
            Matching clients
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<RefreshCw size={12} />}>
              Recalculer
            </Button>
            <Button variant="default" size="sm" icon={<UserPlus size={12} />}>
              Ajouter manuellement
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-xs mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Client list */}
        {filtered.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-6">Aucun client correspondant</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(client => (
              <div key={client.id} className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-border/30 transition-colors cursor-pointer group">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{client.name}</p>
                    {client.type && (
                      <Badge variant="secondary" size="sm">{client.type}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">{client.criteria}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            client.matchScore >= 90 ? 'bg-emerald-500' :
                            client.matchScore >= 70 ? 'bg-amber-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${client.matchScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={client.matchScore >= 90 ? 'success' : client.matchScore >= 70 ? 'warning' : 'secondary'}
                    className="min-w-[3rem] text-center"
                  >
                    {client.matchScore}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
