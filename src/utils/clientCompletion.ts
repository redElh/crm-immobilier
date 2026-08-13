function isFilled(v: any): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') {
    if (v instanceof Date) return true;
    return Object.values(v).some((a: any) => Array.isArray(a) && a.length > 0);
  }
  return true;
}

function computeFromFields(fields: any[]): number {
  const filled = fields.filter(isFilled).length;
  return Math.min(100, Math.round((filled / fields.length) * 100));
}

function voyageurFields(c: any): any[] {
  return [
    c.classification || 'Actif', c.statutMetier || 'En recherche', c.origine || c.source,
    c.localisation, c.secteur, c.adresseComplete, c.complementAdresse, c.codePostalVille, c.pays || 'Maroc', c.typeBien || c.propertyType,
    c.pieces, c.chambres, c.surfaceMin || c.minSurface, c.surfaceMax,
    c.couchagesMax || c.nbPersonnes, c.vue, c.exposition, c.etat, c.standing,
    c.attributPrincipal, c.attributsPersonnalises, c.criteres,
    c.proximites, c.prestations,
    c.dateArrivee || c.dateDebut, c.dateDepart || c.dateExpiration, c.nbAdultes,
    c.budgetNuitMin || c.budgetParNuitMin || c.prixMin, c.budgetNuitMax || c.budgetParNuitMax || c.prixMax,
    c.nbVoyageurs, c.modePaiement, c.acompteMontant || c.acompteVersee, c.cautionMontant || c.caution,
    c.demandesSpeciales, c.arriveeHeure,
    c.numeroReservation || c.numeroMandat, c.statutReservation || c.statutMandat || 'Brouillon', c.dateReservation || c.dateSignature,
    c.bienReserve || c.bienReserveNom, c.tarifNuit, c.optionsSelectionnees,
    c.conditionAnnulation || c.conditionsAnnulation || 'Moderee', c.checkInHeure, c.checkOutHeure,
    c.contratPdfUrl || c.mandatPdfUrl, c.docIdentiteUrl, c.docDomicileUrl,
    c.notesInternes || c.notes,
  ];
}

function genericFields(c: any): any[] {
  const name = c.name || [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
  const type = c.type || c.clientType;
  return [
    name, c.phone, c.email, type, c.status, c.source,
    c.classification, c.statutMetier,
    c.secteur, c.propertyType, c.localisation,
    c.adresseComplete, c.codePostalVille, c.pays,
    c.referenceCadastrale,
    c.pieces, c.chambres, c.surfaceMin, c.surfaceMax,
    c.etage, c.vue, c.exposition, c.etat,
    c.standing, c.disponibilite,
    c.prixNetVendeur, c.typeHonoraires, c.modeCalculHonoraires,
    c.valeurHonoraires, c.commissionCoAgencement,
    c.attributPrincipal, c.attributsPersonnalises, c.criteres,
    c.proximites?.transports, c.proximites?.commerces,
    c.proximites?.education, c.proximites?.sante, c.proximites?.loisirs,
    c.prestations?.exterieur, c.prestations?.confort,
    c.prestations?.electromenager, c.prestations?.multimedia, c.prestations?.sport,
    c.financingType || c.typeFinancement,
    c.revenusMensuelsNets, c.revenusSupplementaires,
    c.chargesCredit, c.chargesFixes, c.montantPretSouhaite,
    c.tauxEnvisage, c.loanDuration || c.dureePret,
    c.taeg, c.assuranceEmprunteur,
    c.contribution || c.apport, c.banqueSollicitee, c.statutFinancement,
    c.dateObtentionPret, c.attestationPretUrl, c.montantTotal,
    c.descriptionAutreFinancement,
    c.currentSituation || c.situationActuelle,
    c.urgency || c.urgence,
    c.moveInDate || c.dateEmmenagement,
    c.dateSouhaiteeVente, c.raisonVente, c.creditRestantDu,
    c.notes,
    c.numeroMandat, c.statutMandat, c.mandatStatus, c.typeMandat,
    c.dateSignature, c.dateDebut, c.dateExpiration,
    c.dureeMandat, c.clauseProtection,
    c.conjoint, c.societe,
    c.agentId || c.agentDesigne,
    c.typeRemuneration, c.typeHonoraires, c.montantRemuneration,
    c.conditionPaiement,
    c.fraisMiseEnLocation, c.fraisEtatDesLieux, c.fraisRenouvellementBail,
    c.dureeProtection, c.dateSignatureMandat,
    c.loyerHC, c.charges, c.depotGarantie,
    c.typeLoyer, c.periodiciteLoyer,
    c.raisonMiseEnLocation, c.creditEnCours, c.creditMontantRestant,
    c.dateDisponibilite, c.conditionsParticulieres,
    c.notesComplementaires,
    c.statutOccupation, c.furnished, c.guarantor,
    c.guarantorName, c.guarantorRevenus, c.employmentStatus,
    c.mandatPdfUrl || c.mandatSignePdfUrl,
    c.docIdentiteUrl, c.docDomicileUrl, c.docRevenusUrl,
    c.docFinancementUrl, c.docBancaireUrl,
    c.docGarantUrl,
    c.docTitreProprieteUrl, c.docCoproprieteUrl, c.docAutreUrl,
    c.docDiagnosticUrl, c.docAssuranceUrl, c.docEtatDesLieuxUrl,
  ];
}

export function calcClientCompletion(client: any): number {
  const type = client.type || client.clientType;
  if (type === 'Voyageur') {
    return computeFromFields(voyageurFields(client));
  }
  return computeFromFields(genericFields(client));
}
