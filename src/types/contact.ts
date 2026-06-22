export interface Mandat {
  id: string;
  clientType: 'Vendeur' | 'Bailleur' | 'Acheteur' | 'Locataire' | 'Voyageur';
  status: 'Actif' | 'Expiré';
  startDate: string;
  endDate?: string;
  propertyType?: string;
  area?: string;
  notes?: string;
}

export interface Contact {
  id: string;
  // Général
  type: 'Particulier' | 'Professionnel' | 'Indivision / Succession';
  // Identité
  civility: 'M.' | 'Mme' | 'Mlle' | 'Autre';
  lastName: string;
  firstName: string;
  emailPrincipal: string;
  emailSecondaire?: string;
  mobile: string;
  telephoneFixe?: string;
  profession?: string;
  lieuNaissance?: string;
  dateNaissance?: string;
  nationalite?: string;
  numeroFiscal?: string;
  // Adresse
  adresse?: string;
  adresse2?: string;
  codePostal?: string;
  ville?: string;
  pays?: string;
  // Préférences
  moyenContactPrefere?: string;
  langueParlee: string[];
  devisePreferee?: string;
  // Critères complémentaires
  situationFamiliale?: 'Célibataire' | 'Marié' | 'Divorcé' | 'Veuf';
  nombreEnfants?: number;
  prescripteur?: string;
  regimeMatrimonial?: string;
  siteInternet?: string;
  // Interne
  commentairePrive?: string;
  originalProspectId?: string;
  // Mandats
  mandats: Mandat[];
  createdAt: string;
  updatedAt: string;
}
