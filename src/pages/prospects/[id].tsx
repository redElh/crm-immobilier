import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { BackLink } from '../../components/ui/BackLink';
import { Prospect } from '../../types/prospect';
import {
  User, Phone, Mail, MapPin, Calendar, Globe, MessageSquare,
  Home, Tag, DollarSign, Maximize2, Grid, Eye, Archive, CheckCircle
} from 'react-feather';
import { QualificationFormModal } from '../../components/modules/prospects/QualificationFormModal';

const mockProspects: Prospect[] = [
  {
    id: 'p1',
    type: 'Acheter',
    origin: 'Site web',
    date: '2025-06-01',
    message: 'Intéressé par un appartement à Marrakech avec balcon et parking.',
    civility: 'M.',
    firstName: 'Ahmed',
    lastName: 'Benali',
    email: 'ahmed.benali@email.com',
    phone: '+212 6 12 34 56 78',
    mobile: '+212 6 98 76 54 32',
    spokenLanguage: 'Français',
    meansOfContact: ['email', 'phone'],
    categories: 'Vente',
    propertyTypes: ['Appartement'],
    location: 'Marrakech',
    rooms: 3,
    bedrooms: 2,
    minSurface: 80,
    maxPrice: 1200000,
    currency: 'MAD',
    viewDetail: 'Jardin',
    status: 'Nouveau',
    createdAt: '2025-06-01T10:00:00Z',
    updatedAt: '2025-06-01T10:00:00Z',
  },
  {
    id: 'p2',
    type: 'Louer',
    origin: 'Référence',
    date: '2025-06-03',
    civility: 'Mme',
    firstName: 'Sophie',
    lastName: 'Martin',
    email: 'sophie.martin@email.com',
    phone: '+33 6 98 76 54 32',
    mobile: '+33 7 98 76 54 32',
    spokenLanguage: 'Français',
    meansOfContact: ['email'],
    categories: 'Location',
    propertyTypes: ['Maison'],
    location: 'Casablanca',
    rooms: 4,
    bedrooms: 3,
    minSurface: 120,
    maxPrice: 15000,
    currency: 'MAD',
    viewDetail: 'Jardin',
    status: 'Contacté',
    createdAt: '2025-06-03T14:30:00Z',
    updatedAt: '2025-06-04T09:00:00Z',
  },
  {
    id: 'p3',
    type: 'Acheter',
    origin: 'Appel téléphonique',
    date: '2025-06-05',
    message: 'Cherche un garage/parking à Rabat',
    civility: 'M.',
    firstName: 'Youssef',
    lastName: 'Amrani',
    email: 'y.amrani@email.com',
    phone: '+212 6 54 32 10 98',
    spokenLanguage: 'Arabe',
    meansOfContact: ['phone', 'sms'],
    categories: 'Vente',
    propertyTypes: ['Garage / Parking'],
    location: 'Rabat',
    maxPrice: 250000,
    currency: 'MAD',
    status: 'Nouveau',
    createdAt: '2025-06-05T08:15:00Z',
    updatedAt: '2025-06-05T08:15:00Z',
  },
];

const statusVariant: Record<string, 'primary' | 'warning' | 'success' | 'secondary'> = {
  Nouveau: 'primary',
  Contacté: 'warning',
  Qualifié: 'success',
  Perdu: 'secondary',
  Converti: 'success',
};

export default function ProspectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQualificationModal, setShowQualificationModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProspect(mockProspects.find((p) => p.id === id) || null);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Prospect non trouvé</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/prospects')}>Retour aux prospects</Button>
      </div>
    );
  }

  const handleMarkLost = () => {
    setProspect((prev) => prev ? { ...prev, status: 'Perdu' } : null);
  };

  const handleQualify = (data: any) => {
    setProspect((prev) => prev ? { ...prev, status: 'Qualifié' } : null);
    setShowQualificationModal(false);
  };

  const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number | undefined | null }) => (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/20 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-text-secondary flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="text-sm font-medium truncate">{value ?? '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <BackLink />
        <div className="flex gap-2">
          {prospect.status !== 'Perdu' && prospect.status !== 'Converti' && (
            <>
              {prospect.status !== 'Qualifié' && (
                <Button variant="default" icon={<CheckCircle size={14} />} onClick={() => setShowQualificationModal(true)}>
                  Qualifier
                </Button>
              )}
              <Button variant="outline" icon={<Archive size={14} />} onClick={handleMarkLost}>
                Marquer comme perdu
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border/50 shadow-card p-5 flex flex-col sm:flex-row gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-14 h-14 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0">
            <User size={22} className="text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold">{prospect.civility} {prospect.firstName} {prospect.lastName}</h1>
              <Badge variant={statusVariant[prospect.status]}>{prospect.status}</Badge>
            </div>
            <p className="text-sm text-accent font-medium mt-0.5">{prospect.type}</p>
            <p className="text-xs text-text-secondary mt-1">Origine: {prospect.origin} · Créé le {new Date(prospect.createdAt).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><User size={14} className="text-accent" /> Contact</h3>
          <div className="divide-y divide-border/20">
            <InfoRow icon={<Mail size={14} />} label="Email" value={prospect.email} />
            <InfoRow icon={<Phone size={14} />} label="Téléphone" value={prospect.phone} />
            {prospect.mobile && <InfoRow icon={<Phone size={14} />} label="Mobile" value={prospect.mobile} />}
            <InfoRow icon={<Globe size={14} />} label="Langue" value={prospect.spokenLanguage} />
            <InfoRow icon={<Tag size={14} />} label="Moyens de contact" value={prospect.meansOfContact.join(', ')} />
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><Home size={14} className="text-accent" /> Produit</h3>
          <div className="divide-y divide-border/20">
            <InfoRow icon={<Tag size={14} />} label="Catégorie" value={prospect.categories} />
            <InfoRow icon={<Home size={14} />} label="Types de bien" value={prospect.propertyTypes.join(', ')} />
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><MapPin size={14} className="text-accent" /> Critères</h3>
          <div className="divide-y divide-border/20">
            <InfoRow icon={<MapPin size={14} />} label="Localisation" value={prospect.location} />
            <InfoRow icon={<Grid size={14} />} label="Pièces" value={prospect.rooms} />
            <InfoRow icon={<Grid size={14} />} label="Chambres" value={prospect.bedrooms} />
            <InfoRow icon={<Maximize2 size={14} />} label="Surface min" value={prospect.minSurface ? `${prospect.minSurface} m²` : null} />
            <InfoRow icon={<DollarSign size={14} />} label="Budget max" value={prospect.maxPrice ? `${prospect.maxPrice.toLocaleString()} ${prospect.currency}` : null} />
            {(prospect.viewType || prospect.viewDetail) && <InfoRow icon={<Eye size={14} />} label="Vue" value={[prospect.viewType, prospect.viewDetail].filter(Boolean).join(' / ')} />}
          </div>
        </Card>

        {prospect.message && (
          <Card className="p-5">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><MessageSquare size={14} className="text-accent" /> Message</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{prospect.message}</p>
          </Card>
        )}
      </div>

      {showQualificationModal && prospect && (
        <QualificationFormModal
          onClose={() => setShowQualificationModal(false)}
          onSubmit={handleQualify}
          prospect={prospect}
        />
      )}
    </div>
  );
}
