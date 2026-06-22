import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Share2, Globe, RefreshCw, CheckCircle, XCircle, Clock } from 'react-feather';

const mockPortals = [
  { portalName: 'Mubawab', status: 'published' as const, lastSync: '2026-06-08 14:30' },
  { portalName: 'Properstar', status: 'published' as const, lastSync: '2026-06-08 14:30' },
  { portalName: 'Avito', status: 'pending' as const, lastSync: '2026-06-07 09:15' },
  { portalName: 'Saramatik', status: 'not_sent' as const },
  { portalName: "Bien'ici", status: 'error' as const, lastSync: '2026-06-06 11:00' },
];

const portalIcons: Record<string, React.ReactNode> = {
  published: <CheckCircle size={14} className="text-emerald-500" />,
  pending: <Clock size={14} className="text-amber-500" />,
  error: <XCircle size={14} className="text-red-500" />,
  not_sent: <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 block" />,
};

const portalLabels: Record<string, string> = {
  published: 'Publié',
  pending: 'En attente',
  error: 'Erreur',
  not_sent: 'Non envoyé',
};

const portalColors: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  not_sent: 'bg-gray-50 text-gray-500 border-gray-200',
};

export const PropertyTransfer = () => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Share2 size={16} className="text-accent" />
            Diffusion vers les portails
          </h3>
          <Button variant="default" size="sm" icon={<RefreshCw size={14} />}>
            Synchroniser tout
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left py-2.5 px-3 font-medium text-text-secondary text-xs">Portail</th>
                <th className="text-left py-2.5 px-3 font-medium text-text-secondary text-xs">Statut</th>
                <th className="text-left py-2.5 px-3 font-medium text-text-secondary text-xs">Dernière synchronisation</th>
                <th className="text-right py-2.5 px-3 font-medium text-text-secondary text-xs">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockPortals.map((portal, i) => (
                <tr key={i} className="border-b border-border/20 hover:bg-background/50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-text-secondary" />
                      <span className="font-medium text-sm">{portal.portalName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <Badge className={portalColors[portal.status]} size="sm">
                      <span className="flex items-center gap-1">
                        {portalIcons[portal.status]}
                        {portalLabels[portal.status]}
                      </span>
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-xs text-text-secondary">
                    {portal.lastSync || '-'}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {portal.status === 'not_sent' ? (
                      <Button variant="outline" size="sm" icon={<Share2 size={12} />}>
                        Publier
                      </Button>
                    ) : portal.status === 'error' ? (
                      <Button variant="outline" size="sm" icon={<RefreshCw size={12} />}>
                        Réessayer
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm">
                        Détails
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-background text-center">
          <p className="text-lg font-semibold text-emerald-600">2</p>
          <p className="text-xs text-text-secondary">Publiés</p>
        </div>
        <div className="p-3 rounded-xl bg-background text-center">
          <p className="text-lg font-semibold text-amber-600">1</p>
          <p className="text-xs text-text-secondary">En attente</p>
        </div>
        <div className="p-3 rounded-xl bg-background text-center">
          <p className="text-lg font-semibold text-red-600">1</p>
          <p className="text-xs text-text-secondary">Erreurs</p>
        </div>
        <div className="p-3 rounded-xl bg-background text-center">
          <p className="text-lg font-semibold text-gray-500">1</p>
          <p className="text-xs text-text-secondary">Non envoyé</p>
        </div>
      </div>
    </div>
  );
};
