export interface Mandat {
  id: string;
  clientType: 'Vendeur' | 'Bailleur' | 'Acheteur' | 'Locataire' | 'Voyageur';
  status: 'Actif' | 'Expiré' | 'En attente';
  startDate: string;
  endDate?: string;
  propertyType?: string;
  area?: string;
  notes?: string;
  clientId?: string;
  numeroMandat?: string;
  typeMandat?: string;
  statutMetier?: string;
  statutMandat?: string;
  dateSignature?: string;
  conjoint?: string;
  societe?: string;
  bienConcerneId?: string;
  dureeProtection?: string;
  typeRemuneration?: string;
  montantRemuneration?: number;
  remunerationIsPercentage?: boolean;
  conditionPaiement?: string;
  agentDesigne?: string;
  mandatPdfUrl?: string;
  mandatPdfName?: string;
  fraisMiseEnLocation?: number;
  fraisEtatDesLieux?: number;
  fraisRenouvellementBail?: number;
  numeroReservation?: string;
  statutReservation?: string;
  dateReservation?: string;
  dateArrivee?: string;
  dateDepart?: string;
  tarifNuit?: number;
  bienReserve?: string;
  nbNuits?: number;
  nbAdultes?: number;
  nbEnfants?: number;
  montantTotalHorsOptions?: number;
  montantTotalAvecOptions?: number;
  acompteMontant?: number;
  soldeRestant?: number;
  cautionMontant?: number;
  checkInHeure?: string;
  checkOutHeure?: string;
  contratPdfUrl?: string;
  conditionAnnulation?: string;
  optionsSelectionnees?: string[];
  animauxAcceptes?: boolean;
  fumeur?: boolean;
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
  originalContactId?: string | null;
  agentId?: string | number | null;
  // Mandats
  mandats: Mandat[];
  createdAt: string;
  updatedAt: string;
}
