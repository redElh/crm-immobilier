export interface Client {
  id: string;
  name: string;
  type: 'Acheteur' | 'Locataire' | 'Bailleur' | 'Vendeur' | 'Voyageur';
  status: 'Actif' | 'En négociation' | 'Contrat signé' | 'Inactif' | 'Archivé';
  phone: string;
  email?: string;
  source?: string;
  notes?: string;

  // Common Property Criteria
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

  // Buyer Specific (Acheteur)
  currentSituation?: string;
  moveInDate?: string;
  mustHaveFeatures?: string;
  urgency?: string;

  // Renter Specific (Locataire)
  furnished?: boolean;
  guarantor?: boolean;
  employmentStatus?: string;
  currentAddress?: string;
  minRentalDuration?: number;

  // Landlord Specific (Bailleur)
  propertyCondition?: string;
  preferredTenant?: string;
  includedUtilities?: string;

  // Owner Specific (Propriétaire)
  reasonForSelling?: string;

  // Traveler Specific (Voyageur)
  travelDates?: string;
  accommodationType?: string;
  specialRequirements?: string;

  // Documents
  documents?: Array<{
    name: string;
    url: string;
    type: string;
    uploadedAt: string;
  }>;

  // Timeline & Activity
  lastContact?: string;
  events?: Array<{
    id: string;
    type: 'appel' | 'email' | 'visite' | 'contrat' | 'autre';
    date: string;
    summary: string;
    agent: string;
    notes?: string;
  }>;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}