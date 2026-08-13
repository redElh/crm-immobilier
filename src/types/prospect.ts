export interface Prospect {
  id: string;
  type: 'Acheter' | 'Louer' | 'Vendre' | 'Faire estimer';
  origin: string;
  date: string;
  message?: string;

  civility: 'M.' | 'Mme' | 'Mlle';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile?: string;
  spokenLanguage: string;
  meansOfContact: string[];

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

  status: 'Nouveau' | 'Contacté' | 'Qualifié' | 'En attente' | 'Perdu' | 'Converti';
  reminderDate?: string | null;
  reminderNote?: string;
  qualifiedAt?: string | null;
  contactedAt?: string | null;
  qualificationData?: Record<string, unknown> | null;
  agentId?: number | null;
  contactId?: string | null;
  originalProspectId?: string | null;
  createdAt: string;
  updatedAt: string;
}
