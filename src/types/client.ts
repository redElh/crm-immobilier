// src/types/client.ts
export interface Client {
  // Identité
  id: string;
  name: string;
  status: 'Actif' | 'Inactif';
  
  // Critères
  propertyType?: string;
  area?: string;
  minSurface?: number;
  rooms?: string;
  specificCriteria?: string[];
  comments?: string;
  
  // Financier
  budget?: number;
  contribution?: number;
  financing?: number;
  financingType?: string;
  loanDuration?: number;
  documents?: { name: string; url: string }[];
}