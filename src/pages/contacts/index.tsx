import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Contact } from '../../types/contact';
import { SearchInput } from '../../components/ui/SearchInput';
import { FilterDropdown } from '../../components/ui/FilterDropdown';
import { Button } from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { ContactCard } from '../../components/modules/contacts/ContactCard';
import { ContactFormModal } from '../../components/modules/contacts/ContactFormModal';
import { Plus, CheckCircle } from 'react-feather';

const sampleContacts: Contact[] = [
  {
    id: 'c1',
    type: 'Particulier',
    civility: 'M.',
    firstName: 'Ahmed',
    lastName: 'Benali',
    emailPrincipal: 'ahmed.benali@email.com',
    mobile: '+212 6 12 34 56 78',
    telephoneFixe: '+212 5 22 33 44 55',
    profession: 'Ingénieur',
    nationalite: 'Marocaine',
    ville: 'Marrakech',
    pays: 'Maroc',
    langueParlee: ['Français', 'Arabe'],
    moyenContactPrefere: 'email',
    originalProspectId: 'p1',
    mandats: [
      { id: 'm1', clientType: 'Acheteur', status: 'Actif', startDate: '2025-06-10', propertyType: 'Appartement', area: 'Marrakech', notes: 'Recherche 3 pieces avec balcon' },
    ],
    createdAt: '2025-06-10T10:00:00Z',
    updatedAt: '2025-06-10T10:00:00Z',
  },
  {
    id: 'c2',
    type: 'Particulier',
    civility: 'Mme',
    firstName: 'Sophie',
    lastName: 'Martin',
    emailPrincipal: 'sophie.martin@email.com',
    mobile: '+33 6 98 76 54 32',
    profession: 'Avocate',
    nationalite: 'Française',
    ville: 'Casablanca',
    pays: 'Maroc',
    langueParlee: ['Français'],
    moyenContactPrefere: 'email',
    mandats: [
      { id: 'm2', clientType: 'Vendeur', status: 'Actif', startDate: '2025-05-01', propertyType: 'Maison', area: 'Casablanca', notes: 'Villa 4 pieces, jardin 200m2' },
      { id: 'm3', clientType: 'Acheteur', status: 'Actif', startDate: '2025-06-01', propertyType: 'Appartement', area: 'Rabat' },
    ],
    createdAt: '2025-05-01T14:30:00Z',
    updatedAt: '2025-06-04T09:00:00Z',
  },
  {
    id: 'c3',
    type: 'Professionnel',
    civility: 'M.',
    firstName: 'Youssef',
    lastName: 'Amrani',
    emailPrincipal: 'y.amrani@email.com',
    mobile: '+212 6 54 32 10 98',
    profession: 'Agent immobilier',
    nationalite: 'Marocaine',
    ville: 'Rabat',
    pays: 'Maroc',
    langueParlee: ['Arabe', 'Français'],
    moyenContactPrefere: 'phone',
    originalProspectId: 'p3',
    mandats: [
      { id: 'm4', clientType: 'Bailleur', status: 'Actif', startDate: '2025-04-15', propertyType: 'Appartement', area: 'Rabat', notes: 'Appartement meuble, 2 chambres' },
    ],
    createdAt: '2025-04-15T08:15:00Z',
    updatedAt: '2025-06-05T08:15:00Z',
  },
  {
    id: 'c4',
    type: 'Particulier',
    civility: 'Mlle',
    firstName: 'Fatima',
    lastName: 'Zahra',
    emailPrincipal: 'f.zahra@email.com',
    mobile: '+212 6 45 67 89 01',
    lieuNaissance: 'Fès',
    nationalite: 'Marocaine',
    ville: 'Casablanca',
    pays: 'Maroc',
    langueParlee: ['Français', 'Anglais'],
    moyenContactPrefere: 'whatsapp',
    situationFamiliale: 'Marié',
    nombreEnfants: 2,
    mandats: [
      { id: 'm5', clientType: 'Locataire', status: 'Expiré', startDate: '2024-01-01', endDate: '2024-12-31', propertyType: 'Appartement', area: 'Casablanca' },
      { id: 'm6', clientType: 'Voyageur', status: 'Actif', startDate: '2025-07-01', endDate: '2025-07-15', area: 'Marrakech', notes: 'Sejour familial, 4 personnes' },
    ],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2025-06-01T10:00:00Z',
  },
];

const mandatTypeOptions = [
  { value: 'all', label: 'Tous types' },
  { value: 'Vendeur', label: 'Vendeur' },
  { value: 'Bailleur', label: 'Bailleur' },
  { value: 'Acheteur', label: 'Acheteur' },
  { value: 'Locataire', label: 'Locataire' },
  { value: 'Voyageur', label: 'Voyageur' },
];

export default function ContactsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [mandatFilter, setMandatFilter] = useState('all');
  const [contacts, setContacts] = useState<Contact[]>(sampleContacts);
  const [showContactForm, setShowContactForm] = useState(false);

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.emailPrincipal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mobile.includes(searchTerm);
    const matchesMandat =
      mandatFilter === 'all' ||
      c.mandats.some((m) => m.clientType === mandatFilter && m.status === 'Actif');
    return matchesSearch && matchesMandat;
  });

  const handleCreateContact = (data: Omit<Contact, 'id' | 'mandats' | 'createdAt' | 'updatedAt'>) => {
    const newContact: Contact = {
      ...data,
      id: 'c' + Date.now(),
      mandats: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setContacts((prev) => [newContact, ...prev]);
    setShowContactForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-sm text-text-secondary mt-1">
            {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="default" icon={<Plus size={14} />} onClick={() => setShowContactForm(true)}>
          Nouveau contact
        </Button>
      </div>

      <Card className="p-5">
        <div className="flex flex-col sm:flex-row gap-4 mb-5 items-end">
          <div className="flex-1 w-full">
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher contacts..."
            />
          </div>
          <FilterDropdown
            label="Type de mandat"
            options={mandatTypeOptions}
            value={mandatFilter}
            onChange={setMandatFilter}
          />
        </div>

        {filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle size={40} className="mx-auto text-text-secondary/30 mb-3" />
            <p className="text-text-secondary">Aucun contact trouvé</p>
            <p className="text-xs text-text-secondary/60 mt-1">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onClick={() => navigate(`/contacts/${contact.id}`)}
              />
            ))}
          </div>
        )}
      </Card>

      {showContactForm && (
        <ContactFormModal
          onClose={() => setShowContactForm(false)}
          onSubmit={handleCreateContact}
        />
      )}
    </div>
  );
}
