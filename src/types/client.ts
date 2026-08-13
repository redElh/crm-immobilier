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
  localisation?: string;
  minSurface?: number;
  rooms?: string;
  specificCriteria?: string[];
  comments?: string;

  // Financial Info
  budget?: number;
  contribution?: number;
  financingType?: string;
  loanDuration?: number;
  prixVenteFAI?: number;

  // Buyer Specific (Acheteur)
  currentSituation?: string;
  moveInDate?: string;
  mustHaveFeatures?: string;
  urgency?: string;
  classification?: string;
  statutMetier?: string;
  croisementAutomatique?: boolean;
  contactId?: string;
  secteur?: string;
  pays?: string;
  categorie?: string;
  piecesOperator?: string;
  pieces?: number;
  chambresOperator?: string;
  chambres?: number;
  surfaceMax?: number;
  prixMin?: number;
  prixMax?: number;
  devise?: string;
  etageOperator?: string;
  etage?: number;
  vue?: string;
  exposition?: string;
  etat?: string;
  standing?: string;
  disponibilite?: string;
  attributPrincipal?: string;
  attributsPersonnalises?: string[];
  criteres?: string[];
  proximites?: {
    transports: string[];
    commerces: string[];
    education: string[];
    sante: string[];
    loisirs: string[];
  };
  prestations?: {
    exterieur: string[];
    confort: string[];
    electromenager: string[];
    multimedia: string[];
    sport: string[];
  };
  capaciteEmprunt?: number;
  montantTotal?: number;
  descriptionAutreFinancement?: string;
  numeroMandat?: string;
  dateSignature?: string;
  dateDebut?: string;
  dateExpiration?: string;
  statutMandat?: string;
  typeMandat?: string;
  conjoint?: string;
  societe?: string;
  agentId?: string;
  agentDesigne?: string;
  originalClientId?: string;
  typeRemuneration?: string;
  montantRemuneration?: number;
  remunerationIsPercentage?: boolean;
  conditionPaiement?: string;
  dureeProtection?: string;
  mandatPdfUrl?: string;
  mandatPdfName?: string;
  docIdentiteUrl?: string;
  docIdentiteName?: string;
  docDomicileUrl?: string;
  docDomicileName?: string;
  docRevenusUrl?: string;
  docRevenusName?: string;
  docFinancementUrl?: string;
  docFinancementName?: string;
  docBancaireUrl?: string;
  docBancaireName?: string;
  docGarantUrl?: string;
  docGarantName?: string;
  revenusMensuelsNets?: number;
  revenusSupplementaires?: number;
  chargesCredit?: number;
  chargesFixes?: number;
  montantPretSouhaite?: number;
  taeg?: number;
  assuranceEmprunteur?: number;
  banqueSollicitee?: string;
  tauxEnvisage?: number;
  statutFinancement?: string;
  dateObtentionPret?: string;
  attestationPretUrl?: string;

  // Renter Specific (Locataire)
  furnished?: boolean;
  guarantor?: boolean;
  guarantorName?: string;
  guarantorRevenus?: number;
  statutOccupation?: string;
  employmentStatus?: string;
  currentAddress?: string;
  minRentalDuration?: number;
  anciennete?: number;
  periodeEssai?: boolean;
  nomEmployeur?: string;
  dateFinContrat?: string;
  chiffreAffaires?: number;
  dernierBilanUrl?: string;
  dernierBilanName?: string;
  dernierAvisImpotUrl?: string;
  dernierAvisImpotName?: string;
  pensionMensuelle?: number;
  dateRetraite?: string;
  organismeRetraite?: string;
  justificatifSituationUrl?: string;
  justificatifSituationName?: string;

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
  nbPersonnes?: number;
  budgetParNuitMin?: number;
  budgetParNuitMax?: number;
  dateArrivee?: string;
  dateDepart?: string;
  flexibiliteDates?: string;
  modePaiement?: string;
  acompteVersee?: number;
  caution?: number;
  conditionsAnnulation?: string;
  budgetNuitMin?: number;
  budgetNuitMax?: number;
  nbNuits?: number;
  nbAdultes?: number;
  nbEnfants?: number;
  couchagesMax?: number;
  tarifNuit?: number;
  tarifNuitMin?: number;
  tarifNuitMax?: number;
  budgetTotal?: number;
  bienReserve?: string;
  montantTotalHorsOptions?: number;
  montantTotalAvecOptions?: number;
  optionsSelectionnees?: string[];
  reservationOptions?: { name: string; price: number; qty: number; total: number }[];
  soldeRestant?: number;
  acompteMontant?: number;
  acompteDate?: string;
  cautionMontant?: number;
  cautionMode?: string;
  dateLimiteSolde?: string;
  checkInHeure?: string;
  checkOutHeure?: string;
  animauxAcceptes?: boolean;
  fumeur?: boolean;
  nbVoyageurs?: number;
  nbEnfantsSejour?: number;
  animaux?: boolean;
  animauxEspeces?: string;
  regimeAlimentaire?: string;
  languesParlees?: string[];
  demandesSpeciales?: string;
  arriveeHeure?: string;
  arriveeTransport?: string;
  numeroReservation?: string;
  statutReservation?: string;
  dateReservation?: string;
  contratPdfUrl?: string;

  // Assurance
  assuranceAnnulation?: boolean;
  assuranceAnnulationMontant?: number;
  assuranceMultirisque?: boolean;
  assuranceMultirisqueMontant?: number;

  // Conditions & État des lieux
  dateLimiteAnnulation?: string;
  penaliteAnnulation?: number;
  edlEntree?: string;
  edlSortie?: string;
  reglementInterieur?: boolean;
  rgpdConsent?: boolean;
  contratNotes?: string;

  // Guide Check-in
  guideCheckin?: { texte: string }[];

  // Checklist Départ
  checklistDepart?: { texte: string; obligatoire: boolean }[];
  checklistDepartMessage?: string;
  checklistDepartWhatsapp?: string;

  // Carte Privilège - Partenaires
  cartePrivilegeActif?: boolean;
  cartePrivilegePartenaires?: { categorie: string; remise: string; nom: string; description: string; lien: string }[];

  // Conciergerie d'Activités
  conciergerieActif?: boolean;
  conciergerieWhatsapp?: string;
  conciergerieActivites?: { titre: string; duree: string; prix: string; description: string; disponibilite: string; image: string }[];

  // Assistance 24/7
  assistanceWhatsapp?: string;
  assistanceTelephone?: string;
  assistanceEmail?: string;
  assistanceMessage?: string;

  // Documents
  documents?: Array<{
    name: string;
    url: string;
    type: string;
    uploadedAt: string;
    category?: string;
    size?: string;
    version?: number;
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

  // Vendeur / Seller specific
  adresseComplete?: string;
  complementAdresse?: string;
  codePostalVille?: string;
  referenceCadastrale?: string;
  lotCopropriete?: number;
  syndicPresent?: boolean;
  nbLotsTotal?: number;
  prixNetVendeur?: number;
  modeCalculHonoraires?: string;
  commissionCoAgencement?: number;
  creditRestantDu?: number;
  dateSouhaiteeVente?: string;
  notesComplementaires?: string;
  bienConcerneId?: string;

  // Bailleur / Landlord specific
  loyerHC?: number;
  charges?: number;
  depotGarantie?: number;
  typeLoyer?: string;
  periodiciteLoyer?: string;
  raisonMiseEnLocation?: string;
  creditEnCours?: boolean;
  creditMontantRestant?: number;
  dateDisponibilite?: string;
  conditionsParticulieres?: string;
  fraisMiseEnLocation?: number;
  fraisEtatDesLieux?: number;
  fraisRenouvellementBail?: number;
  docDiagnosticUrl?: string;
  docDiagnosticName?: string;
  docAssuranceUrl?: string;
  docAssuranceName?: string;
  docEtatDesLieuxUrl?: string;
  docEtatDesLieuxName?: string;
  bienRechercheId?: string;

  // Metadata
  latitude?: number;
  longitude?: number;
  completion?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}