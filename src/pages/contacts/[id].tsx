import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, createElement } from 'react';
import Card from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { BackLink } from '../../components/ui/BackLink';
import type { Contact, Mandat } from '../../types/contact';
import {
  User, Phone, Mail, Calendar, Globe, Tag, Plus,
  TrendingUp, Key, ShoppingCart, Home, Compass,
  Clock, Archive, MessageSquare, MapPin, Briefcase,
  Star, Award, Heart, Users, Link, FileText,
  Map, CreditCard, Book, Monitor,
  Gift, CheckCircle, X, ChevronRight,
  DollarSign, Maximize2, Grid, Eye
} from 'react-feather';

const mockContacts: Contact[] = [
  {
    id: 'c1',
    type: 'Particulier',
    civility: 'M.',
    firstName: 'Ahmed',
    lastName: 'Benali',
    emailPrincipal: 'ahmed.benali@email.com',
    emailSecondaire: 'a.benali@protonmail.com',
    mobile: '+212 6 12 34 56 78',
    telephoneFixe: '+212 5 22 33 44 55',
    profession: 'Ingénieur en génie civil',
    lieuNaissance: 'Marrakech',
    dateNaissance: '1985-03-15',
    nationalite: 'Marocaine',
    numeroFiscal: 'FR12345678901',
    adresse: '12 Avenue Mohammed V',
    adresse2: 'Résidence Al Ward, Appt 5',
    codePostal: '40000',
    ville: 'Marrakech',
    pays: 'Maroc',
    moyenContactPrefere: 'Email',
    langueParlee: ['Français', 'Arabe', 'Anglais'],
    devisePreferee: 'MAD',
    situationFamiliale: 'Marié',
    nombreEnfants: 2,
    prescripteur: 'Mustapha El Fassi (client référent)',
    regimeMatrimonial: 'Communauté universelle',
    siteInternet: 'www.ahmedbenali.ma',
    commentairePrive: 'Client très exigeant. Préfère les échanges par email. A déjà visité 4 biens sans suite. Relancer dans 2 semaines.',
    originalProspectId: 'p1',
    mandats: [
      { id: 'm1', clientType: 'Acheteur', status: 'Actif', startDate: '2025-06-10', propertyType: 'Appartement', area: 'Marrakech', notes: 'Recherche 3 pièces avec balcon, budget 1.2M MAD max' },
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
    adresse: '45 Rue des Orangers',
    ville: 'Casablanca',
    pays: 'Maroc',
    moyenContactPrefere: 'Email',
    langueParlee: ['Français'],
    devisePreferee: 'EUR',
    situationFamiliale: 'Célibataire',
    mandats: [
      { id: 'm2', clientType: 'Vendeur', status: 'Actif', startDate: '2025-05-01', propertyType: 'Maison', area: 'Casablanca', notes: 'Villa 4 pièces, jardin 200m2' },
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
    telephoneFixe: '+212 5 37 68 90 12',
    profession: 'Promoteur immobilier',
    nationalite: 'Marocaine',
    adresse: 'Immeuble Al Majd, Bât B',
    codePostal: '10000',
    ville: 'Rabat',
    pays: 'Maroc',
    moyenContactPrefere: 'Téléphone',
    langueParlee: ['Arabe', 'Français'],
    devisePreferee: 'MAD',
    situationFamiliale: 'Marié',
    nombreEnfants: 3,
    commentairePrive: 'Client récurrent. A déjà vendu 2 biens via nous. Contact prioritaire.',
    originalProspectId: 'p3',
    mandats: [
      { id: 'm4', clientType: 'Bailleur', status: 'Actif', startDate: '2025-04-15', propertyType: 'Appartement', area: 'Rabat', notes: 'Appartement meublé, 2 chambres, mise en location' },
    ],
    createdAt: '2025-04-15T08:15:00Z',
    updatedAt: '2025-06-05T08:15:00Z',
  },
  {
    id: 'c4',
    type: 'Indivision / Succession',
    civility: 'Mlle',
    firstName: 'Fatima',
    lastName: 'Zahra',
    emailPrincipal: 'f.zahra@email.com',
    emailSecondaire: 'fatima.zahra@family.ma',
    mobile: '+212 6 45 67 89 01',
    telephoneFixe: '+212 5 22 99 88 77',
    lieuNaissance: 'Fès',
    dateNaissance: '1990-11-22',
    nationalite: 'Marocaine',
    adresse: '17 Rue de la Liberté',
    ville: 'Casablanca',
    pays: 'Maroc',
    moyenContactPrefere: 'WhatsApp',
    langueParlee: ['Français', 'Anglais', 'Espagnol'],
    devisePreferee: 'MAD',
    situationFamiliale: 'Divorcé',
    nombreEnfants: 1,
    prescripteur: 'Me Bennani (notaire)',
    regimeMatrimonial: 'Séparation de biens',
    commentairePrive: 'Dossier succession en cours. Attend les documents de la banque. Relancer notaire.',
    mandats: [
      { id: 'm5', clientType: 'Locataire', status: 'Expiré', startDate: '2024-01-01', endDate: '2024-12-31', propertyType: 'Appartement', area: 'Casablanca' },
      { id: 'm6', clientType: 'Voyageur', status: 'Actif', startDate: '2025-07-01', endDate: '2025-07-15', area: 'Marrakech', notes: 'Séjour familial, 4 personnes, riad 3 chambres' },
    ],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2025-06-01T10:00:00Z',
  },
];

const mandatIcons: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Vendeur: TrendingUp, Bailleur: Key, Acheteur: ShoppingCart, Locataire: Home, Voyageur: Compass,
};

const mandatColors: Record<string, { bg: string; text: string; badge: 'success' | 'warning' | 'secondary' | 'primary' }> = {
  Vendeur: { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'warning' },
  Bailleur: { bg: 'bg-accent-light', text: 'text-accent', badge: 'primary' },
  Acheteur: { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'success' },
  Locataire: { bg: 'bg-violet-50', text: 'text-violet-700', badge: 'secondary' },
  Voyageur: { bg: 'bg-rose-50', text: 'text-rose-700', badge: 'warning' },
};

interface ProspectProductData {
  categories: string;
  propertyTypes: string[];
  location?: string;
  rooms?: number;
  bedrooms?: number;
  minSurface?: number;
  maxPrice?: number;
  currency?: string;
  viewType?: string;
  viewDetail?: string;
}

const prospectProductData: Record<string, ProspectProductData> = {
  p1: {
    categories: 'Vente',
    propertyTypes: ['Appartement'],
    location: 'Marrakech',
    rooms: 3,
    bedrooms: 2,
    minSurface: 80,
    maxPrice: 1200000,
    currency: 'MAD',
    viewDetail: 'Jardin',
  },
  p3: {
    categories: 'Vente',
    propertyTypes: ['Garage / Parking'],
    location: 'Rabat',
    maxPrice: 250000,
    currency: 'MAD',
  },
};

const typeColors: Record<string, string> = {
  Particulier: 'bg-blue-50 text-blue-700',
  Professionnel: 'bg-purple-50 text-purple-700',
  'Indivision / Succession': 'bg-orange-50 text-orange-700',
};

function SectionCard({ title, icon: Icon, children, className }: { title: string; icon: React.FC<{ size?: number; className?: string }>; children: React.ReactNode; className?: string }) {
  return (
    <Card className={'p-5 ' + (className || '')}>
      <h3 className="font-semibold text-sm flex items-center gap-2 mb-4 pb-3 border-b border-border">
        <Icon size={16} className="text-accent" />
        {title}
      </h3>
      {children}
    </Card>
  );
}

function FieldRow({ label, value, icon: Icon, href }: { label: string; value?: string | number | null; icon?: React.FC<{ size?: number; className?: string }>; href?: string }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      {Icon && <Icon size={14} className="text-text-tertiary mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-text-tertiary uppercase tracking-wider">{label}</p>
        {href ? (
          <a href={href} className="text-sm font-medium text-accent hover:underline truncate block">{value}</a>
        ) : (
          <p className="text-sm font-medium text-text-primary truncate">{value}</p>
        )}
      </div>
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">{children}</div>;
}

function MandatCard({ mandat }: { mandat: Mandat }) {
  const Icon = mandatIcons[mandat.clientType] || Tag;
  const colors = mandatColors[mandat.clientType] || mandatColors.Acheteur;
  return (
    <div className={'rounded-xl border p-5 transition-shadow hover:shadow-card-hover ' + (mandat.status === 'Expiré' ? 'opacity-70 border-dashed' : 'border-border')}>
      <div className="flex items-center justify-between mb-4">
        <div className={'flex items-center gap-2.5 ' + colors.bg + ' px-3 py-1.5 rounded-lg'}>
          <Icon size={18} className={colors.text} />
          <span className={'font-semibold text-sm ' + colors.text}>{mandat.clientType}</span>
        </div>
        <Badge variant={mandat.status === 'Actif' ? 'success' : 'secondary'}>{mandat.status}</Badge>
      </div>
      <div className="space-y-2 text-sm">
        {mandat.propertyType && (
          <div className="flex items-center gap-2 text-text-secondary">
            <Home size={14} />
            <span>{mandat.propertyType}</span>
          </div>
        )}
        {mandat.area && (
          <div className="flex items-center gap-2 text-text-secondary">
            <MapPin size={14} />
            <span>{mandat.area}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-text-secondary">
          <Calendar size={14} />
          <span>{mandat.startDate + (mandat.endDate ? ' - ' + mandat.endDate : '')}</span>
        </div>
        {mandat.notes && (
          <div className="flex items-start gap-2 text-text-secondary mt-2 pt-2 border-t border-border">
            <MessageSquare size={14} className="mt-0.5 shrink-0" />
            <span>{mandat.notes}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function MandatSection({ title, icon: Icon, mandats, emptyText }: { title: string; icon: React.FC<{ size?: number; className?: string }>; mandats: Mandat[]; emptyText: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} className="text-text-secondary" />
        <h3 className="font-semibold text-text-primary">{title}</h3>
        <span className="text-xs text-text-tertiary ml-1">({mandats.length})</span>
      </div>
      {mandats.length === 0 ? (
        <p className="text-sm text-text-tertiary italic py-4">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mandats.map((m) => <MandatCard key={m.id} mandat={m} />)}
        </div>
      )}
    </div>
  );
}

export default function ContactPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => { setContact(mockContacts.find((c) => c.id === id) || null); setLoading(false); }, 300);
    return () => clearTimeout(timer);
  }, [id]);
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
      </div>
    );
  }
  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Contact non trouvé</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/contacts')}>Retour aux contacts</Button>
      </div>
    );
  }
  const activeMandats = contact.mandats.filter((m) => m.status === 'Actif');
  const expiredMandats = contact.mandats.filter((m) => m.status === 'Expiré');
  const typeColor = typeColors[contact.type] || 'bg-background-secondary text-text-secondary';
  const productData = contact.originalProspectId ? prospectProductData[contact.originalProspectId] : undefined;
  return (
    <div className="space-y-6">
      <BackLink to="/contacts" />

      {/* Header */}
      <Card className="p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent-light flex items-center justify-center">
              <User size={24} className="text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-text-primary">{contact.civility} {contact.firstName} {contact.lastName}</h1>
                <span className={'text-xs font-semibold px-2.5 py-1 rounded-full ' + typeColor}>{contact.type}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {contact.mandats.map((m) => {
                  const colors = mandatColors[m.clientType];
                  return (
                    <span key={m.id} className={'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ' + colors.bg + ' ' + colors.text}>
                      {createElement(mandatIcons[m.clientType] || Tag, { size: 12 })}
                      {m.clientType}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline"><MessageSquare size={16} /> Contacter</Button>
            <Button variant="outline">Modifier</Button>
          </div>
        </div>
      </Card>

      {/* Main grid: sections 1-5 left, section 6 right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Section 1: Général */}
          <SectionCard title="GÉNÉRAL" icon={Star}>
            <div className="flex gap-4">
              {(['Particulier', 'Professionnel', 'Indivision / Succession'] as const).map((t) => (
                <div key={t} className={'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ' + (contact.type === t ? 'border-accent bg-accent-light text-accent font-medium' : 'border-border text-text-secondary')}>
                  <div className={'w-4 h-4 rounded-full border-2 flex items-center justify-center ' + (contact.type === t ? 'border-accent' : 'border-text-tertiary')}>
                    {contact.type === t && <div className="w-2 h-2 rounded-full bg-accent" />}
                  </div>
                  {t}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Section 2: Identité complète */}
          <SectionCard title="IDENTITÉ COMPLÈTE" icon={User}>
            <FieldGrid>
              <FieldRow label="Civilité" value={contact.civility} icon={User} />
              <FieldRow label="Nom de famille" value={contact.lastName} icon={User} />
              <FieldRow label="Prénom" value={contact.firstName} icon={User} />
              <FieldRow label="Email principal" value={contact.emailPrincipal} icon={Mail} href={'mailto:' + contact.emailPrincipal} />
              <FieldRow label="Email secondaire" value={contact.emailSecondaire} icon={Mail} href={contact.emailSecondaire ? 'mailto:' + contact.emailSecondaire : undefined} />
              <FieldRow label="Mobile" value={contact.mobile} icon={Phone} href={'tel:' + contact.mobile} />
              <FieldRow label="Téléphone fixe" value={contact.telephoneFixe} icon={Phone} href={contact.telephoneFixe ? 'tel:' + contact.telephoneFixe : undefined} />
              <FieldRow label="Profession" value={contact.profession} icon={Briefcase} />
              <FieldRow label="Lieu de naissance" value={contact.lieuNaissance} icon={MapPin} />
              <FieldRow label="Date de naissance" value={contact.dateNaissance} icon={Calendar} />
              <FieldRow label="Nationalité" value={contact.nationalite} icon={Globe} />
              <FieldRow label="Numéro fiscal" value={contact.numeroFiscal} icon={CreditCard} />
            </FieldGrid>
          </SectionCard>

          {/* Section 3: Adresse */}
          <SectionCard title="ADRESSE" icon={MapPin}>
            <FieldGrid>
              <FieldRow label="Adresse" value={contact.adresse} icon={Map} />
              <FieldRow label="Adresse (2)" value={contact.adresse2} icon={Map} />
              <FieldRow label="Code postal" value={contact.codePostal} icon={Map} />
              <FieldRow label="Ville" value={contact.ville} icon={MapPin} />
              <FieldRow label="Pays" value={contact.pays} icon={Globe} />
            </FieldGrid>
          </SectionCard>

          {/* Section 4: Préférences */}
          <SectionCard title="PRÉFÉRENCES" icon={Heart}>
            <FieldGrid>
              <FieldRow label="Moyen de contact préféré" value={contact.moyenContactPrefere} icon={MessageSquare} />
              <FieldRow label="Langue(s) parlée(s)" value={contact.langueParlee.join(', ')} icon={Globe} />
              <FieldRow label="Devise préférée" value={contact.devisePreferee} icon={CreditCard} />
            </FieldGrid>
          </SectionCard>

          {/* Section 5: Critères complémentaires */}
          <SectionCard title="CRITÈRES COMPLÉMENTAIRES" icon={Award}>
            <FieldGrid>
              <FieldRow label="Situation familiale" value={contact.situationFamiliale} icon={Users} />
              <FieldRow label="Nombre d'enfants" value={contact.nombreEnfants} icon={Heart} />
              <FieldRow label="Prescripteur" value={contact.prescripteur} icon={Gift} />
              <FieldRow label="Régime matrimonial" value={contact.regimeMatrimonial} icon={Book} />
              <FieldRow label="Site internet personnel" value={contact.siteInternet} icon={Monitor} href={contact.siteInternet ? 'http://' + contact.siteInternet : undefined} />
            </FieldGrid>
          </SectionCard>

        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Section 6: Interne */}
          <SectionCard title="INTERNE" icon={FileText}>
            <FieldRow label="Commentaire privé" value={contact.commentairePrive} />
            {contact.originalProspectId && (
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-[11px] text-text-tertiary uppercase tracking-wider mb-1">Origine</p>
                <a href={'/prospects/' + contact.originalProspectId} className="text-sm text-accent hover:underline flex items-center gap-1 font-medium">
                  Voir le prospect d'origine <ChevronRight size={14} />
                </a>
              </div>
            )}
            {!contact.originalProspectId && (
              <p className="text-xs text-text-tertiary italic mt-2">Créé directement (pas de prospect d'origine)</p>
            )}
            <div className="mt-4 pt-3 border-t border-border space-y-1">
              <p className="text-[11px] text-text-tertiary">Créé le {new Date(contact.createdAt).toLocaleDateString('fr-FR')}</p>
              <p className="text-[11px] text-text-tertiary">Modifié le {new Date(contact.updatedAt).toLocaleDateString('fr-FR')}</p>
            </div>
          </SectionCard>

          {productData && <SectionCard title="PRODUIT" icon={Home}>
            <FieldGrid>
              <FieldRow label="Catégorie" value={productData.categories} icon={Tag} />
              <FieldRow label="Types de bien" value={productData.propertyTypes.join(', ')} icon={Home} />
            </FieldGrid>
          </SectionCard>}
          {productData && <SectionCard title="CRITÈRES" icon={MapPin}>
            <FieldGrid>
              <FieldRow label="Localisation" value={productData.location} icon={MapPin} />
              <FieldRow label="Pièces" value={productData.rooms} icon={Grid} />
              <FieldRow label="Chambres" value={productData.bedrooms} icon={Grid} />
              <FieldRow label="Surface min" value={productData.minSurface ? productData.minSurface + ' m²' : null} icon={Maximize2} />
              <FieldRow label="Budget max" value={productData.maxPrice ? productData.maxPrice.toLocaleString() + ' ' + productData.currency : null} icon={DollarSign} />
              <FieldRow label="Vue" value={[productData.viewType, productData.viewDetail].filter(Boolean).join(' / ')} icon={Eye} />
            </FieldGrid>
          </SectionCard>}

        </div>
      </div>

      {/* Section 7: Mandats */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-5">
          <FileText size={18} className="text-accent" />
          <h2 className="font-semibold text-text-primary">MANDATS</h2>
        </div>
        <div className="space-y-8">
          <MandatSection title="Mandats actifs" icon={Clock} mandats={activeMandats} emptyText="Aucun mandat actif" />
          <MandatSection title="Mandats expirés" icon={Archive} mandats={expiredMandats} emptyText="Aucun mandat expiré" />
          <Button variant="ghost" className="w-full border border-dashed border-border">
            <Plus size={16} /> Ajouter un mandat
          </Button>
        </div>
      </Card>

    </div>
  );
}
