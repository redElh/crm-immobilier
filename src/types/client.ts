export interface Client {
  id: string;
  name: string;
  type: 'Acheteur' | 'Vendeur' | 'Locataire' | 'Bailleur';
  status: 'Actif' | 'En négociation' | 'Contrat signé' | 'Inactif';
  phone: string;
  email?: string;
  // Property Criteria
  propertyType?: string;
  area?: string;
  minSurface?: number;
  rooms?: string;
  specificCriteria?: string[];
  comments?: string;
  // Financial Info
  budget?: number;
  contribution?: number;
  financingType?: string;
  loanDuration?: number;
  // Documents
  documents?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  // Timeline
  lastContact?: string;
  events?: Array<{
    id: string;
    type: string;
    date: string;
    summary: string;
    agent: string;
  }>;
  // Metadata
  createdAt?: string;
  updatedAt?: string;
}