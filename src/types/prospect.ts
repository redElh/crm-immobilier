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

  status: 'Nouveau' | 'Contacté' | 'Qualifié' | 'Perdu' | 'Converti';
  createdAt: string;
  updatedAt: string;
}
