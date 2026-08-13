const SEUIL = 70

type FieldType = 'text' | 'number' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'date' | 'time' | 'email' | 'file'

interface FieldDef {
  path: string
  type: FieldType
  condition?: (vals: Record<string, any>) => boolean
  group?: string
}

type TabFieldMap = Record<string, FieldDef[]>

const COMMON_TABS: TabFieldMap = {
  general: [
    { path: 'propertyTitle', type: 'text' },
    { path: 'transactionType', type: 'radio', condition: v => v.propertyType !== 'vacation' },
    { path: 'status', type: 'select' },
    { path: 'etape', type: 'select' },
    { path: 'constructionType', type: 'select' },
    { path: 'constructionSubType', type: 'select', condition: v => !!v.constructionType },
    { path: 'furnishing', type: 'select', condition: v => v.propertyType === 'residential' || v.propertyType === 'vacation' },
    { path: 'capacite', type: 'number', condition: v => v.propertyType === 'vacation' },
    { path: 'photos', type: 'file' },
    { path: 'videos', type: 'file' },
    { path: 'commercialSubType', type: 'select', condition: v => v.propertyType === 'commercial' },
    { path: 'landSubType', type: 'select', condition: v => v.propertyType === 'land' },
    { path: 'location.type', type: 'select' },
    { path: 'location.exposition', type: 'select' },
    { path: 'location.currentUse', type: 'select' },
    { path: 'location.instructionsAcces', type: 'textarea', condition: v => v.propertyType === 'vacation' },
    { path: 'location.parkingInstructions', type: 'textarea', condition: v => v.propertyType === 'vacation' },
    { path: 'location.buildable', type: 'checkbox' },
    { path: 'location.avna', type: 'checkbox' },
    { path: 'location.latitude', type: 'number' },
    { path: 'location.longitude', type: 'number' },
    { path: 'horaires.checkInHeureLimite', type: 'time', condition: v => v.propertyType === 'vacation' },
    { path: 'horaires.checkOutHeureLimite', type: 'time', condition: v => v.propertyType === 'vacation' },
    { path: 'horaires.arriveeAutonome', type: 'checkbox', condition: v => v.propertyType === 'vacation' },
    { path: 'horaires.pasDeFetes', type: 'checkbox', condition: v => v.propertyType === 'vacation' },
    { path: 'horaires.animauxInterdits', type: 'checkbox', condition: v => v.propertyType === 'vacation' },
    { path: 'horaires.pasDeFumee', type: 'checkbox', condition: v => v.propertyType === 'vacation' },
    { path: 'horaires.economieEnergie', type: 'checkbox', condition: v => v.propertyType === 'vacation' },
    { path: 'horaires.autresRegles', type: 'textarea', condition: v => v.propertyType === 'vacation' },
    { path: 'acces.boiteCles.presente', type: 'checkbox', condition: v => v.propertyType === 'vacation' },
    { path: 'acces.boiteCles.code', type: 'text', condition: v => v.propertyType === 'vacation' },
    { path: 'acces.boiteCles.emplacement', type: 'text', condition: v => v.propertyType === 'vacation' },
    { path: 'acces.portail.code', type: 'text', condition: v => v.propertyType === 'vacation' },
    { path: 'acces.portail.type', type: 'select', condition: v => v.propertyType === 'vacation' },
    { path: 'acces.appartement.typeAcces', type: 'select', condition: v => v.propertyType === 'vacation' },
    { path: 'acces.appartement.code', type: 'text', condition: v => v.propertyType === 'vacation' },
    { path: 'acces.parking.code', type: 'text', condition: v => v.propertyType === 'vacation' },
    { path: 'wifi.reseau', type: 'text', condition: v => v.propertyType === 'vacation' },
    { path: 'wifi.motDePasse', type: 'text', condition: v => v.propertyType === 'vacation' },
  ],
  owner: [
    { path: 'ownerType', type: 'radio' },
    { path: 'owner.lastName', type: 'text', condition: v => v.ownerType === 'particulier' },
    { path: 'owner.firstName', type: 'text', condition: v => v.ownerType === 'particulier' },
    { path: 'owner.address', type: 'text', condition: v => v.ownerType === 'particulier' },
    { path: 'owner.phone', type: 'text', condition: v => v.ownerType === 'particulier' },
    { path: 'owner.profession', type: 'text', condition: v => v.ownerType === 'particulier' },
    { path: 'owner.email', type: 'email', condition: v => v.ownerType === 'particulier' },
    { path: 'company.name', type: 'text', condition: v => v.ownerType === 'societe' },
    { path: 'company.legalForm', type: 'text', condition: v => v.ownerType === 'societe' },
    { path: 'company.siren', type: 'text', condition: v => v.ownerType === 'societe' },
    { path: 'company.address', type: 'text', condition: v => v.ownerType === 'societe' },
    { path: 'saleInfo.purchaseDate', type: 'date' },
    { path: 'saleInfo.listingDuration', type: 'text' },
    { path: 'saleInfo.motivation', type: 'textarea' },
    { path: 'saleInfo.otherProperties', type: 'checkbox' },
    { path: 'saleInfo.otherPropertiesDescription', type: 'textarea', condition: v => v.saleInfo?.otherProperties },
  ],
  property: [
    { path: 'property.address', type: 'text' },
    { path: 'property.city', type: 'select' },
    { path: 'property.state', type: 'select', condition: v => v.propertyType !== 'land' },
    { path: 'property.surface', type: 'number' },
    { path: 'property.facadeWidth', type: 'number', condition: v => v.propertyType === 'land' },
    { path: 'property.depth', type: 'number', condition: v => v.propertyType === 'land' },
    { path: 'property.pondereSurface', type: 'number', condition: v => v.propertyType === 'commercial' },
    { path: 'property.ceilingHeight', type: 'number', condition: v => v.propertyType === 'commercial' },
    { path: 'property.chargesAnnuelles', type: 'number', condition: v => v.propertyType === 'commercial' },
    { path: 'property.rooms', type: 'number', condition: v => v.propertyType === 'commercial' },
    { path: 'property.landSize', type: 'number', condition: v => v.propertyType === 'luxury' },
    { path: 'property.luxuryFeatures', type: 'textarea', condition: v => v.propertyType === 'luxury' },
    { path: 'property.buildableSurface', type: 'number', condition: v => v.propertyType === 'residential' || v.propertyType === 'vacation' },
    { path: 'property.cadastralReference', type: 'text' },
    { path: 'property.constructionYear', type: 'number' },
    { path: 'property.bedrooms', type: 'number', condition: v => v.propertyType === 'vacation' },
    { path: 'property.beds', type: 'number', condition: v => v.propertyType === 'vacation' },
    { path: 'property.description', type: 'textarea' },
  ],
  pricing: [
    { path: 'devise', type: 'select' },
    { path: 'prixNetVendeur', type: 'number', condition: v => v.propertyType !== 'vacation' && v.transactionType !== 'location_ld' },
    { path: 'honorairesType', type: 'radio', condition: v => v.propertyType !== 'vacation' && v.propertyType !== 'luxury' && v.transactionType !== 'location_ld' },
    { path: 'honorairesPct', type: 'number', condition: v => v.propertyType !== 'vacation' && v.propertyType !== 'luxury' && v.transactionType !== 'location_ld' },
    { path: 'negociable', type: 'checkbox', condition: v => v.propertyType !== 'vacation' && v.transactionType !== 'location_ld' },
    { path: 'prixMinimum', type: 'number', condition: v => v.propertyType !== 'vacation' && v.transactionType !== 'location_ld' },
    { path: 'prixExpertise', type: 'number', condition: v => v.propertyType !== 'vacation' && v.transactionType !== 'location_ld' },
    { path: 'prixSurDemande', type: 'checkbox', condition: v => v.propertyType === 'luxury' },
    { path: 'prixConfidentiel', type: 'checkbox', condition: v => v.propertyType === 'luxury' },
    { path: 'estimation', type: 'number', condition: v => v.propertyType === 'luxury' },
    { path: 'loyerHC', type: 'number', condition: v => v.transactionType === 'location_ld' || v.propertyType === 'vacation' },
    { path: 'charges', type: 'number', condition: v => v.transactionType === 'location_ld' },
    { path: 'depotGarantie', type: 'select', condition: v => v.transactionType === 'location_ld' },
    { path: 'honorairesLocation', type: 'number', condition: v => v.transactionType === 'location_ld' },
    { path: 'seasonalPriceMin', type: 'number', condition: v => v.propertyType === 'vacation' },
    { path: 'seasonalPriceMax', type: 'number', condition: v => v.propertyType === 'vacation' },
    { path: 'seasonalPriceWeek', type: 'number', condition: v => v.propertyType === 'vacation' },
    { path: 'seasonalPriceMonth', type: 'number', condition: v => v.propertyType === 'vacation' },
    { path: 'sleepingCapacity', type: 'number', condition: v => v.propertyType === 'vacation' },
  ],
  proximities: [
    { path: 'proximites.aéroport.distance', type: 'text', group: 'prox-aéroport' },
    { path: 'proximites.aéroport.unite', type: 'select', group: 'prox-aéroport' },
    { path: 'proximites.centre_ville.distance', type: 'text', group: 'prox-centre_ville' },
    { path: 'proximites.centre_ville.unite', type: 'select', group: 'prox-centre_ville' },
    { path: 'proximites.crèche.distance', type: 'text', group: 'prox-crèche' },
    { path: 'proximites.crèche.unite', type: 'select', group: 'prox-crèche' },
    { path: 'proximites.garderie.distance', type: 'text', group: 'prox-garderie' },
    { path: 'proximites.garderie.unite', type: 'select', group: 'prox-garderie' },
    { path: 'proximites.golf.distance', type: 'text', group: 'prox-golf' },
    { path: 'proximites.golf.unite', type: 'select', group: 'prox-golf' },
    { path: 'proximites.médecin.distance', type: 'text', group: 'prox-médecin' },
    { path: 'proximites.médecin.unite', type: 'select', group: 'prox-médecin' },
    { path: 'proximites.palais_des_congrès.distance', type: 'text', group: 'prox-palais_des_congrès' },
    { path: 'proximites.palais_des_congrès.unite', type: 'select', group: 'prox-palais_des_congrès' },
    { path: 'proximites.piscine_publique.distance', type: 'text', group: 'prox-piscine_publique' },
    { path: 'proximites.piscine_publique.unite', type: 'select', group: 'prox-piscine_publique' },
    { path: 'proximites.port.distance', type: 'text', group: 'prox-port' },
    { path: 'proximites.port.unite', type: 'select', group: 'prox-port' },
    { path: 'proximites.supermarché.distance', type: 'text', group: 'prox-supermarché' },
    { path: 'proximites.supermarché.unite', type: 'select', group: 'prox-supermarché' },
    { path: 'proximites.tram.distance', type: 'text', group: 'prox-tram' },
    { path: 'proximites.tram.unite', type: 'select', group: 'prox-tram' },
    { path: 'proximites.autoroute.distance', type: 'text', group: 'prox-autoroute' },
    { path: 'proximites.autoroute.unite', type: 'select', group: 'prox-autoroute' },
    { path: 'proximites.cinéma.distance', type: 'text', group: 'prox-cinéma' },
    { path: 'proximites.cinéma.unite', type: 'select', group: 'prox-cinéma' },
    { path: 'proximites.école_primaire.distance', type: 'text', group: 'prox-école_primaire' },
    { path: 'proximites.école_primaire.unite', type: 'select', group: 'prox-école_primaire' },
    { path: 'proximites.gare.distance', type: 'text', group: 'prox-gare' },
    { path: 'proximites.gare.unite', type: 'select', group: 'prox-gare' },
    { path: 'proximites.hôpital_clinique.distance', type: 'text', group: 'prox-hôpital_clinique' },
    { path: 'proximites.hôpital_clinique.unite', type: 'select', group: 'prox-hôpital_clinique' },
    { path: 'proximites.mer.distance', type: 'text', group: 'prox-mer' },
    { path: 'proximites.mer.unite', type: 'select', group: 'prox-mer' },
    { path: 'proximites.parc.distance', type: 'text', group: 'prox-parc' },
    { path: 'proximites.parc.unite', type: 'select', group: 'prox-parc' },
    { path: 'proximites.pistes_de_ski.distance', type: 'text', group: 'prox-pistes_de_ski' },
    { path: 'proximites.pistes_de_ski.unite', type: 'select', group: 'prox-pistes_de_ski' },
    { path: 'proximites.route_principale.distance', type: 'text', group: 'prox-route_principale' },
    { path: 'proximites.route_principale.unite', type: 'select', group: 'prox-route_principale' },
    { path: 'proximites.taxi.distance', type: 'text', group: 'prox-taxi' },
    { path: 'proximites.taxi.unite', type: 'select', group: 'prox-taxi' },
    { path: 'proximites.université.distance', type: 'text', group: 'prox-université' },
    { path: 'proximites.université.unite', type: 'select', group: 'prox-université' },
    { path: 'proximites.bus.distance', type: 'text', group: 'prox-bus' },
    { path: 'proximites.bus.unite', type: 'select', group: 'prox-bus' },
    { path: 'proximites.commerces.distance', type: 'text', group: 'prox-commerces' },
    { path: 'proximites.commerces.unite', type: 'select', group: 'prox-commerces' },
    { path: 'proximites.école_secondaire.distance', type: 'text', group: 'prox-école_secondaire' },
    { path: 'proximites.école_secondaire.unite', type: 'select', group: 'prox-école_secondaire' },
    { path: 'proximites.gare_routière.distance', type: 'text', group: 'prox-gare_routière' },
    { path: 'proximites.gare_routière.unite', type: 'select', group: 'prox-gare_routière' },
    { path: 'proximites.lac.distance', type: 'text', group: 'prox-lac' },
    { path: 'proximites.lac.unite', type: 'select', group: 'prox-lac' },
    { path: 'proximites.métro.distance', type: 'text', group: 'prox-métro' },
    { path: 'proximites.métro.unite', type: 'select', group: 'prox-métro' },
    { path: 'proximites.parking_public.distance', type: 'text', group: 'prox-parking_public' },
    { path: 'proximites.parking_public.unite', type: 'select', group: 'prox-parking_public' },
    { path: 'proximites.plage.distance', type: 'text', group: 'prox-plage' },
    { path: 'proximites.plage.unite', type: 'select', group: 'prox-plage' },
    { path: 'proximites.salle_de_sport.distance', type: 'text', group: 'prox-salle_de_sport' },
    { path: 'proximites.salle_de_sport.unite', type: 'select', group: 'prox-salle_de_sport' },
    { path: 'proximites.tennis.distance', type: 'text', group: 'prox-tennis' },
    { path: 'proximites.tennis.unite', type: 'select', group: 'prox-tennis' },
  ],
  mandate: [
    { path: 'mandate.numeroMandat', type: 'text' },
    { path: 'mandate.statutMandat', type: 'select' },
    { path: 'mandate.dateDebut', type: 'date' },
    { path: 'mandate.dateExpiration', type: 'date' },
    { path: 'mandate.typeMandat', type: 'select' },
    { path: 'mandate.clauseProtection', type: 'checkbox' },
    { path: 'mandate.clauseProtectionMois', type: 'number', condition: v => v.mandate?.clauseProtection },
    { path: 'mandate.conjoint', type: 'text' },
    { path: 'mandate.agentDesigne', type: 'select' },
    { path: 'mandate.prixNetVendeurMandat', type: 'number', condition: v => v.transactionType === 'vente' || !v.transactionType },
    { path: 'mandate.typeHonorairesMandat', type: 'select', condition: v => v.transactionType === 'vente' || !v.transactionType },
    { path: 'mandate.montantHonoraires', type: 'number', condition: v => v.transactionType === 'vente' || !v.transactionType },
    { path: 'mandate.commissionCoAgencementMandat', type: 'number', condition: v => v.transactionType === 'vente' || !v.transactionType },
    { path: 'mandate.societe', type: 'text', condition: v => v.transactionType === 'location_ld' || v.transactionType === 'location_saisonniere' },
    { path: 'mandate.typeRemuneration', type: 'select', condition: v => v.transactionType === 'location_ld' || v.transactionType === 'location_saisonniere' },
    { path: 'mandate.montantRemuneration', type: 'number', condition: v => v.transactionType === 'location_ld' || v.transactionType === 'location_saisonniere' },
    { path: 'mandate.conditionPaiement', type: 'select', condition: v => v.transactionType === 'location_ld' || v.transactionType === 'location_saisonniere' },
    { path: 'mandate.fraisMiseEnLocation', type: 'number', condition: v => v.transactionType === 'location_ld' || v.transactionType === 'location_saisonniere' },
    { path: 'mandate.fraisEtatDesLieux', type: 'number', condition: v => v.transactionType === 'location_ld' || v.transactionType === 'location_saisonniere' },
    { path: 'mandate.fraisRenouvellementBail', type: 'number', condition: v => v.transactionType === 'location_ld' || v.transactionType === 'location_saisonniere' },
    { path: 'mandate.dateSignatureMandat', type: 'date' },
  ],
  transfert: [
    { path: 'transfert.portals.arletpaper', type: 'checkbox' },
    { path: 'transfert.portals.babacasa', type: 'checkbox' },
    { path: 'transfert.portals.bien_avec_vue', type: 'checkbox' },
    { path: 'transfert.portals.flatway', type: 'checkbox' },
    { path: 'transfert.portals.goflint', type: 'checkbox' },
    { path: 'transfert.portals.green-acres', type: 'checkbox' },
    { path: 'transfert.portals.havelia', type: 'checkbox' },
    { path: 'transfert.portals.immo_gratuit', type: 'checkbox' },
    { path: 'transfert.portals.jamesedition', type: 'checkbox' },
    { path: 'transfert.portals.kazaki', type: 'checkbox' },
    { path: 'transfert.portals.kyero', type: 'checkbox' },
    { path: 'transfert.portals.ieroiloc', type: 'checkbox' },
    { path: 'transfert.portals.localcommercial', type: 'checkbox' },
    { path: 'transfert.portals.luxuryestate', type: 'checkbox' },
    { path: 'transfert.portals.m2_square_meter', type: 'checkbox' },
    { path: 'transfert.portals.mls_worldwide', type: 'checkbox' },
    { path: 'transfert.portals.monbien', type: 'checkbox' },
    { path: 'transfert.portals.mubawab', type: 'checkbox' },
    { path: 'transfert.portals.only-luxury', type: 'checkbox' },
    { path: 'transfert.portals.properstar', type: 'checkbox' },
    { path: 'transfert.portals.staysco', type: 'checkbox' },
    { path: 'transfert.portals.superimmo', type: 'checkbox' },
    { path: 'transfert.portals.substainable_real_estate', type: 'checkbox' },
    { path: 'transfert.portals.trovi.co', type: 'checkbox' },
    { path: 'transfert.portals.vizzit', type: 'checkbox' },
    { path: 'transfert.portals.zefir', type: 'checkbox' },
    { path: 'transfert.portals.zilek', type: 'checkbox' },
    { path: 'transfert.status', type: 'radio' },
    { path: 'transfert.lastPublication', type: 'date' },
  ],
  documents: [],
}

const EXTERIOR_CHECKBOXES: FieldDef[] = [
  { path: 'commercialExterior.deliveries', type: 'checkbox', condition: v => v.propertyType === 'commercial' },
  { path: 'commercialExterior.truckParking', type: 'checkbox', condition: v => v.propertyType === 'commercial' },
  { path: 'commercialExterior.dock', type: 'checkbox', condition: v => v.propertyType === 'commercial' },
  { path: 'exteriorPosition.lastFloor', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'exteriorPosition.groundFloor', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'exteriorPosition.floor', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'exteriorPosition.floorNumber', type: 'text', condition: v => v.propertyType !== 'land' },
  { path: 'exteriorPosition.singleLevel', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'exteriorPosition.pmrAccess', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'exteriorPosition.elevator', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'exteriorFeatures.enclosed', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'exteriorFeatures.treed', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'exteriorFeatures.new', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'exteriorFeatures.poolPossible', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'exteriorFeatures.well', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'exteriorFeatures.poolhouse', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'exteriorFeatures.barbecue', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'exteriorFeatures.automaticWatering', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'exteriorFeatures.caretaker', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'exteriorFeatures.gardener', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'exteriorFeatures.noOverlook', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'views.ocean', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'views.panoramic', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'views.urban', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'views.quiet', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'parking.privateExterior', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'parking.privateInterior', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'parking.garage', type: 'checkbox', condition: v => v.propertyType !== 'land' },
  { path: 'luxuryExterior.heatedPool', type: 'checkbox', condition: v => v.propertyType === 'luxury' },
  { path: 'luxuryExterior.tennis', type: 'checkbox', condition: v => v.propertyType === 'luxury' },
  { path: 'luxuryExterior.heliport', type: 'checkbox', condition: v => v.propertyType === 'luxury' },
  { path: 'luxuryExterior.guardHouse', type: 'checkbox', condition: v => v.propertyType === 'luxury' },
  { path: 'luxuryExterior.landscapedGarden', type: 'checkbox', condition: v => v.propertyType === 'luxury' },
  { path: 'luxuryExterior.seaView', type: 'checkbox', condition: v => v.propertyType === 'luxury' },
  { path: 'luxuryExterior.mountainView', type: 'checkbox', condition: v => v.propertyType === 'luxury' },
]

const EXTERIOR_SPACES = [
  'terrasse', 'cave', 'jardin', 'garage', 'parking', 'pergola', 'piscine',
]

const EXTERIOR_SPACE_FIELDS: FieldDef[] = EXTERIOR_SPACES.flatMap(space => [
  { path: `exteriorSpaces.${space}.surface`, type: 'text', group: `ext-${space}` },
  { path: `exteriorSpaces.${space}.floorCovering`, type: 'text', group: `ext-${space}` },
  { path: `exteriorSpaces.${space}.state`, type: 'select', group: `ext-${space}` },
  { path: `exteriorSpaces.${space}.comments`, type: 'text', group: `ext-${space}` },
])

const exteriorSelects: FieldDef[] = [
  { path: 'exterior.type', type: 'select' },
  { path: 'exterior.view', type: 'select', condition: v => v.propertyType === 'land' },
  { path: 'exterior.layout', type: 'select', condition: v => v.propertyType !== 'land' },
  { path: 'exterior.guarantee', type: 'select', condition: v => v.propertyType !== 'land' },
]

const EQUIPMENT_FIELDS: FieldDef[] = [
  { path: 'energy.gaz', type: 'checkbox' },
  { path: 'energy.bois', type: 'checkbox' },
  { path: 'energy.solaire', type: 'checkbox' },
  { path: 'energy.électrique', type: 'checkbox' },
  { path: 'heating.mode.clim', type: 'checkbox' },
  { path: 'heating.mode.cheminée', type: 'checkbox' },
  { path: 'heating.mode.radiateur', type: 'checkbox' },
  { path: 'heating.mode.sol', type: 'checkbox' },
  { path: 'heating.nature.individuel', type: 'checkbox' },
  { path: 'heating.nature.collectif', type: 'checkbox' },
  { path: 'heating.nature.centrale', type: 'checkbox' },
  { path: 'heating.nature.aucun', type: 'checkbox' },
  { path: 'water.onep', type: 'checkbox' },
  { path: 'water.cuve', type: 'checkbox' },
  { path: 'water.puits', type: 'checkbox' },
  { path: 'water.pompe', type: 'checkbox' },
  { path: 'windows.material.alu', type: 'checkbox' },
  { path: 'windows.material.bois', type: 'checkbox' },
  { path: 'windows.material.pvc', type: 'checkbox' },
  { path: 'windows.glass.double', type: 'checkbox' },
  { path: 'windows.glass.simple', type: 'checkbox' },
  { path: 'windows.glass.survitrage', type: 'checkbox' },
  { path: 'shutters.électrique', type: 'checkbox' },
  { path: 'shutters.bois', type: 'checkbox' },
  { path: 'shutters.roulant manuel', type: 'checkbox' },
  { path: 'shutters.aucun', type: 'checkbox' },
  { path: 'gate.opening.automatique', type: 'checkbox' },
  { path: 'gate.opening.manuel', type: 'checkbox' },
  { path: 'gate.material.fer', type: 'checkbox' },
  { path: 'gate.material.alu', type: 'checkbox' },
  { path: 'gate.material.bois', type: 'checkbox' },
  { path: 'gate.material.aucun', type: 'checkbox' },
  { path: 'pool.hasPool', type: 'checkbox' },
  { path: 'pool.measurement', type: 'text', condition: v => v.pool?.hasPool },
  { path: 'pool.coating', type: 'text', condition: v => v.pool?.hasPool },
  { path: 'pool.treatment', type: 'text', condition: v => v.pool?.hasPool },
  { path: 'pool.equipment.couverture', type: 'checkbox', condition: v => v.pool?.hasPool },
  { path: 'pool.equipment.douche', type: 'checkbox', condition: v => v.pool?.hasPool },
  { path: 'pool.equipment.aspirateur', type: 'checkbox', condition: v => v.pool?.hasPool },
  { path: 'pool.equipment.pompe', type: 'checkbox', condition: v => v.pool?.hasPool },
  { path: 'pool.equipment.lumière', type: 'checkbox', condition: v => v.pool?.hasPool },
  { path: 'security.alarme', type: 'checkbox' },
  { path: 'security.vidéophone', type: 'checkbox' },
  { path: 'security.interphone', type: 'checkbox' },
  { path: 'security.blindDoor', type: 'checkbox' },
  { path: 'security.blindDoorCount', type: 'number', condition: v => v.security?.blindDoor },
  { path: 'security.camera', type: 'checkbox' },
  { path: 'security.cameraCount', type: 'number', condition: v => v.security?.camera },
  { path: 'security.poolSecurity', type: 'text' },
]

const INTERIOR_CHECKBOXES: FieldDef[] = [
  { path: 'interiorStyles.moderne', type: 'checkbox' },
  { path: 'interiorStyles.traditionnel', type: 'checkbox' },
  { path: 'interiorStyles.minimaliste', type: 'checkbox' },
  { path: 'interiorStyles.beldi', type: 'checkbox' },
  { path: 'interiorStyles.contemporain', type: 'checkbox' },
  { path: 'interior.styleComments', type: 'textarea' },
]

const BATHROOM_FIELDS: FieldDef[] = [
  { path: 'bathroom.count', type: 'number', group: 'bath' },
  { path: 'bathroom.parentalSuiteCount', type: 'number', group: 'bath' },
  { path: 'bathroom.shower', type: 'checkbox', group: 'bath' },
  { path: 'bathroom.bathtub', type: 'checkbox', group: 'bath' },
  { path: 'bathroom.toiletType', type: 'select', group: 'bath' },
  { path: 'kitchen.count', type: 'number', group: 'kitchen' },
  { path: 'kitchen.type.american', type: 'checkbox', group: 'kitchen' },
  { path: 'kitchen.type.separate', type: 'checkbox', group: 'kitchen' },
  { path: 'kitchen.type.equipped', type: 'checkbox', group: 'kitchen' },
  { path: 'kitchen.type.empty', type: 'checkbox', group: 'kitchen' },
  { path: 'kitchen.type.fitted', type: 'checkbox', group: 'kitchen' },
  { path: 'guarantees.furniture', type: 'checkbox', group: 'kitchen' },
  { path: 'guarantees.appliances', type: 'checkbox', group: 'kitchen' },
  { path: 'kitchen.details', type: 'textarea', group: 'kitchen' },
  { path: 'livingRoom.count', type: 'number', group: 'living' },
  { path: 'livingRoom.terraceAccess', type: 'checkbox', group: 'living' },
  { path: 'livingRoom.poolAccess', type: 'checkbox', group: 'living' },
  { path: 'livingRoom.airConditioned', type: 'checkbox', group: 'living' },
  { path: 'livingRoom.bright', type: 'checkbox', group: 'living' },
  { path: 'livingRoom.fiber', type: 'checkbox', group: 'living' },
  { path: 'livingRoom.details', type: 'textarea', group: 'living' },
  { path: 'bedrooms.total', type: 'number', group: 'bedroom' },
  { path: 'bedrooms.groundFloor', type: 'number', group: 'bedroom' },
  { path: 'bedrooms.parentalSuite', type: 'number', group: 'bedroom' },
  { path: 'bedrooms.airConditioned', type: 'checkbox', group: 'bedroom' },
  { path: 'bedrooms.bright', type: 'checkbox', group: 'bedroom' },
  { path: 'bedrooms.tv', type: 'checkbox', group: 'bedroom' },
  { path: 'bedrooms.exteriorAccess', type: 'checkbox', group: 'bedroom' },
  { path: 'bedrooms.poolAccess', type: 'checkbox', group: 'bedroom' },
  { path: 'bedrooms.details', type: 'textarea', group: 'bedroom' },
  { path: 'luxuryInterior.domotique', type: 'checkbox', condition: v => v.propertyType === 'luxury' },
  { path: 'luxuryInterior.cheminee', type: 'checkbox', condition: v => v.propertyType === 'luxury' },
  { path: 'luxuryInterior.hammam', type: 'checkbox', condition: v => v.propertyType === 'luxury' },
  { path: 'luxuryInterior.sauna', type: 'checkbox', condition: v => v.propertyType === 'luxury' },
  { path: 'luxuryInterior.cinema', type: 'checkbox', condition: v => v.propertyType === 'luxury' },
  { path: 'luxuryInterior.caveVin', type: 'checkbox', condition: v => v.propertyType === 'luxury' },
  { path: 'luxuryInterior.ascenseur', type: 'checkbox', condition: v => v.propertyType === 'luxury' },
  { path: 'interiorVacation.wifi', type: 'checkbox', condition: v => v.propertyType === 'vacation' },
  { path: 'interiorVacation.washingMachine', type: 'checkbox', condition: v => v.propertyType === 'vacation' },
  { path: 'interiorVacation.dishwasher', type: 'checkbox', condition: v => v.propertyType === 'vacation' },
  { path: 'interiorVacation.tv', type: 'checkbox', condition: v => v.propertyType === 'vacation' },
  { path: 'interiorVacation.climatisation', type: 'checkbox', condition: v => v.propertyType === 'vacation' },
  { path: 'interiorVacation.heating', type: 'checkbox', condition: v => v.propertyType === 'vacation' },
  { path: 'interiorVacation.microwave', type: 'checkbox', condition: v => v.propertyType === 'vacation' },
  { path: 'interiorVacation.coffeeMaker', type: 'checkbox', condition: v => v.propertyType === 'vacation' },
  { path: 'interiorVacation.parking', type: 'checkbox', condition: v => v.propertyType === 'vacation' },
]

const INTERIOR_ROOMS = ['entrée', 'salon', 'cuisine', 'chambre', 'salle_de_bain', 'bureau', 'buanderie', 'dressing']

const INTERIOR_SPACE_FIELDS: FieldDef[] = INTERIOR_ROOMS.flatMap(room => [
  { path: `interiorSpaces.${room}.surface`, type: 'text', group: `int-${room}` },
  { path: `interiorSpaces.${room}.floorCovering`, type: 'text', group: `int-${room}` },
  { path: `interiorSpaces.${room}.state`, type: 'select', group: `int-${room}` },
  { path: `interiorSpaces.${room}.exteriorAccess`, type: 'checkbox', group: `int-${room}` },
  { path: `interiorSpaces.${room}.closet`, type: 'checkbox', group: `int-${room}` },
  { path: `interiorSpaces.${room}.heating`, type: 'text', group: `int-${room}` },
  { path: `interiorSpaces.${room}.comments`, type: 'text', group: `int-${room}` },
])

// Must match InventoryTab.tsx item names after normalize('NFD') + replace(/[ &]/g, '_')
const SALON_ITEMS = ['canape', 'fauteuils', 'table_basse', 'table_a_manger', 'vaisselier', 'meuble_tele', 'buffet', 'television', 'decoration', 'lampes'];
const SDB_ITEMS = ['meuble_rangement', 'porte_serviettes', 'panier_a_linge', 'miroir', 'seche_cheveux', 'drops_de_bain', 'serviettes_de_toilette'];
const CHAMBRE_ITEMS = ['lit_double', 'table_chevet', 'commode', 'portant_a_vetements', 'fauteuil', 'miroir', 'lampes', 'decoration', 'couette_oreillers', 'linge_de_lit'];
const CUISINE_ITEMS = ['plaque_cuisson_induction', 'four', 'micro_onde', 'refrigerateur', 'congelateur', 'hotte', 'cafetiere', 'machine_a_cafe', 'table', 'chaises', 'poubelle', 'vaisselle', 'couverts', 'ustensiles_plats', 'poeles_casseroles', 'carafe', 'linge_de_maison'];

function buildInventoryFields(vals?: Record<string, any>): FieldDef[] {
  const fields: FieldDef[] = []
  const livingCount = Math.max(0, parseInt(vals?.livingRoom?.count) || 0)
  const bathroomCount = Math.max(0, parseInt(vals?.bathroom?.count) || 0)
  const bedroomCount = Math.max(0, parseInt(vals?.bedrooms?.total) || 0)
  const kitchenCount = Math.max(0, parseInt(vals?.kitchen?.count) || 0)

  const roomDefs: Array<{ prefix: string; count: number; items: string[] }> = [
    { prefix: 'salon', count: livingCount, items: SALON_ITEMS },
    { prefix: 'sdb', count: bathroomCount, items: SDB_ITEMS },
    { prefix: 'chambre', count: bedroomCount, items: CHAMBRE_ITEMS },
    { prefix: 'cuisine', count: kitchenCount, items: CUISINE_ITEMS },
  ]

  for (const { prefix, count, items } of roomDefs) {
    for (let i = 1; i <= count; i++) {
      const roomKey = `${prefix}_${i}`
      for (const item of items) {
        fields.push({ path: `inventory.${roomKey}.${item}.quantity`, type: 'number', group: `inv-${roomKey}-${item}` })
        fields.push({ path: `inventory.${roomKey}.${item}.condition`, type: 'radio', group: `inv-${roomKey}-${item}` })
        fields.push({ path: `inventory.${roomKey}.${item}.comments`, type: 'text', group: `inv-${roomKey}-${item}` })
      }
    }
  }
  fields.push(
    { path: 'inventorySignature.documentGenerated', type: 'checkbox' },
    { path: 'inventorySignature.selectedLocataire', type: 'text' },
    { path: 'inventorySignature.owner.status', type: 'select' },
    { path: 'inventorySignature.tenant.status', type: 'select' },
  )
  return fields
}

const SEASONAL_PRICE_GRID_FIELDS: FieldDef[] = ['basse_saison', 'saison_intermediaire', 'haute_saison', 'evenements'].flatMap(period => [
  { path: `priceGrid.${period}.start`, type: 'text', group: `pg-${period}` },
  { path: `priceGrid.${period}.end`, type: 'text', group: `pg-${period}` },
  { path: `priceGrid.${period}.price`, type: 'number', group: `pg-${period}` },
  { path: `priceGrid.${period}.minNights`, type: 'number', group: `pg-${period}` },
])

const SEASONAL_OPTIONS = [
  'menage_fin_de_sejour', 'petit_dejeuner', 'parking_prive', 'location_serviettes_plage',
  'lit_bebe', 'panier_de_bienvenue',
]

const SEASONAL_OPTION_FIELDS: FieldDef[] = SEASONAL_OPTIONS.flatMap(opt => [
  { path: `options.${opt}.enabled`, type: 'checkbox', group: `opt-${opt}` },
  { path: `options.${opt}.price`, type: 'number', group: `opt-${opt}` },
])

const VACATION_TABS: TabFieldMap = {
  ...COMMON_TABS,
  seasonal: [
    ...SEASONAL_PRICE_GRID_FIELDS,
    ...SEASONAL_OPTION_FIELDS,
  ],
  contrat: [
    { path: 'contrat.voyageur.nom', type: 'text' },
    { path: 'contrat.voyageur.prenom', type: 'text' },
    { path: 'contrat.voyageur.email', type: 'email' },
    { path: 'contrat.voyageur.telephone', type: 'text' },
    { path: 'contrat.voyageur.adresse', type: 'text' },
    { path: 'contrat.voyageur.nationalite', type: 'text' },
    { path: 'contrat.voyageur.pieceIdentite', type: 'text' },
    { path: 'contrat.arrivee', type: 'date' },
    { path: 'contrat.heureArrivee', type: 'time' },
    { path: 'contrat.depart', type: 'date' },
    { path: 'contrat.heureDepart', type: 'time' },
    { path: 'contrat.voyageurs', type: 'number' },
    { path: 'contrat.typeSejour', type: 'select' },
    { path: 'contrat.nuits', type: 'number' },
    { path: 'contrat.montantTotal', type: 'number' },
    { path: 'contrat.arrhes', type: 'number' },
    { path: 'contrat.dateArrhes', type: 'date' },
    { path: 'contrat.solde', type: 'number' },
    { path: 'contrat.caution', type: 'number' },
    { path: 'contrat.cautionMode', type: 'select' },
    { path: 'contrat.cautionDelai', type: 'number' },
    { path: 'contrat.modePaiement', type: 'select' },
    { path: 'contrat.assuranceAnnulation', type: 'checkbox' },
    { path: 'contrat.assuranceAnnulationMontant', type: 'number', condition: v => v.contrat?.assuranceAnnulation },
    { path: 'contrat.assuranceMultirisque', type: 'checkbox' },
    { path: 'contrat.assuranceMultirisqueMontant', type: 'number', condition: v => v.contrat?.assuranceMultirisque },
    { path: 'contrat.dateLimiteAnnulation', type: 'date' },
    { path: 'contrat.penaliteAnnulation', type: 'number' },
    { path: 'contrat.conditionsAnnulation', type: 'select' },
    { path: 'contrat.edlEntree', type: 'date' },
    { path: 'contrat.edlSortie', type: 'date' },
    { path: 'contrat.reglementInterieur', type: 'checkbox' },
    { path: 'contrat.rgpdConsent', type: 'checkbox' },
    { path: 'contrat.notes', type: 'textarea' },
    { path: 'contrat.checklistDepart.message', type: 'textarea' },
    { path: 'contrat.checklistDepart.whatsappNumero', type: 'text' },
    { path: 'contrat.cartePrivilege.actif', type: 'checkbox' },
    { path: 'contrat.conciergerie.actif', type: 'checkbox' },
    { path: 'contrat.conciergerie.whatsapp', type: 'text' },
    { path: 'contrat.assistance.whatsapp', type: 'text' },
    { path: 'contrat.assistance.telephone', type: 'text' },
    { path: 'contrat.assistance.email', type: 'email' },
    { path: 'contrat.assistance.message', type: 'textarea' },
    { path: 'contrat.signatureProprietaire.nom', type: 'text' },
    { path: 'contrat.signatureProprietaire.date', type: 'date' },
    { path: 'contrat.signatureProprietaire.signature', type: 'textarea' },
    { path: 'contrat.signatureVoyageur.nom', type: 'text' },
    { path: 'contrat.signatureVoyageur.date', type: 'date' },
    { path: 'contrat.signatureVoyageur.signature', type: 'textarea' },
    { path: 'contrat.contratSigne', type: 'checkbox' },
  ],
}

const PROPERTY_TYPE_TABS: Record<string, TabFieldMap> = {
  residential: {
    ...COMMON_TABS,
    exterior: [
      ...exteriorSelects,
      ...EXTERIOR_CHECKBOXES,
      ...EXTERIOR_SPACE_FIELDS,
    ],
    interior: [
      ...INTERIOR_CHECKBOXES,
      ...BATHROOM_FIELDS,
      ...INTERIOR_SPACE_FIELDS,
      { path: 'interiorVacation.wifi', type: 'checkbox', condition: () => false },
      { path: 'interiorVacation.washingMachine', type: 'checkbox', condition: () => false },
      { path: 'interiorVacation.dishwasher', type: 'checkbox', condition: () => false },
      { path: 'interiorVacation.tv', type: 'checkbox', condition: () => false },
      { path: 'interiorVacation.climatisation', type: 'checkbox', condition: () => false },
      { path: 'interiorVacation.heating', type: 'checkbox', condition: () => false },
      { path: 'interiorVacation.microwave', type: 'checkbox', condition: () => false },
      { path: 'interiorVacation.coffeeMaker', type: 'checkbox', condition: () => false },
      { path: 'interiorVacation.parking', type: 'checkbox', condition: () => false },
    ],
    equipment: EQUIPMENT_FIELDS,
    inventory: [],
  },
  vacation: {
    ...VACATION_TABS,
    exterior: [
      ...exteriorSelects,
      ...EXTERIOR_CHECKBOXES,
      ...EXTERIOR_SPACE_FIELDS,
    ],
    interior: [
      ...INTERIOR_CHECKBOXES,
      ...BATHROOM_FIELDS,
      ...INTERIOR_SPACE_FIELDS,
      ...INTERIOR_CHECKBOXES.filter(f => f.path.startsWith('interiorVacation.') || f.path.startsWith('luxuryInterior.')).map(f => ({ ...f, condition: (v: any) => true })),
    ],
    equipment: EQUIPMENT_FIELDS,
    inventory: [],
  },
  commercial: {
    ...COMMON_TABS,
    exterior: [
      ...exteriorSelects,
      ...EXTERIOR_CHECKBOXES,
      ...EXTERIOR_SPACE_FIELDS,
    ],
    interior: [
      ...INTERIOR_CHECKBOXES,
      ...BATHROOM_FIELDS,
      ...INTERIOR_SPACE_FIELDS,
    ],
    equipment: EQUIPMENT_FIELDS,
    commercial: [
      { path: 'commercial.bailType', type: 'select' },
      { path: 'commercial.loyerAnnuel', type: 'number' },
      { path: 'commercial.chargesAnnuelles', type: 'number' },
      { path: 'commercial.depotGarantie', type: 'number' },
      { path: 'commercial.erp', type: 'select' },
    ],
  },
  land: {
    ...COMMON_TABS,
    exterior: [
      ...exteriorSelects,
      ...EXTERIOR_CHECKBOXES.filter(f => !f.condition || f.condition({ propertyType: 'land' })),
    ],
    land: [
      { path: 'land.constructible', type: 'radio' },
      { path: 'land.cos', type: 'number' },
      { path: 'land.shon', type: 'number' },
      { path: 'land.connections.eau', type: 'radio' },
      { path: 'land.connections.electricite', type: 'radio' },
      { path: 'land.connections.assainissement', type: 'radio' },
      { path: 'land.connections.gaz', type: 'radio' },
      { path: 'land.urbanism.plu', type: 'text' },
      { path: 'land.urbanism.certificatUrbanisme', type: 'select' },
      { path: 'land.urbanism.certificatDate', type: 'date' },
      { path: 'land.urbanism.zonage', type: 'select' },
      { path: 'land.topography.type', type: 'radio' },
      { path: 'land.topography.view', type: 'radio' },
    ],
  },
  luxury: {
    ...COMMON_TABS,
    exterior: [
      ...exteriorSelects,
      ...EXTERIOR_CHECKBOXES,
      ...EXTERIOR_SPACE_FIELDS,
    ],
    interior: [
      ...INTERIOR_CHECKBOXES,
      ...BATHROOM_FIELDS,
      ...INTERIOR_SPACE_FIELDS,
      ...INTERIOR_CHECKBOXES.filter(f => f.path.startsWith('luxuryInterior.')).map(f => ({ ...f, condition: (v: any) => true })),
    ],
    equipment: EQUIPMENT_FIELDS,
    luxury: [
      { path: 'luxuryConfidentiality.hideAddress', type: 'checkbox' },
      { path: 'luxuryConfidentiality.visitsOnDemand', type: 'checkbox' },
      { path: 'luxuryConfidentiality.confidentialityAgreement', type: 'checkbox' },
    ],
    marketing: [
      { path: 'marketing.brochureFile', type: 'text' },
      { path: 'marketing.brochurePrint', type: 'text' },
      { path: 'marketing.virtualTourUrl', type: 'text' },
      { path: 'marketing.virtualTourEmbed', type: 'text' },
      { path: 'marketing.droneUrl', type: 'text' },
      { path: 'marketing.dronePhotos', type: 'text' },
      { path: 'marketing.videoUrl', type: 'text' },
      { path: 'marketing.videographer', type: 'text' },
    ],
  },
}

function isFieldFilled(path: string, type: FieldType, vals: Record<string, any>): boolean {
  const keys = path.split('.')
  let val: any = vals
  for (const k of keys) {
    if (val === undefined || val === null) return false
    val = val[k]
  }
  if (val === undefined || val === null) return false
  if (type === 'checkbox') return true
  if (type === 'number') {
    if (typeof val === 'number') return !isNaN(val) && val !== 0
    if (typeof val === 'string') return val.trim() !== '' && val !== '0'
    return false
  }
  if (type === 'file') {
    if (val instanceof FileList) return val.length > 0
    if (Array.isArray(val)) return val.length > 0
    return !!val
  }
  if (typeof val === 'string') return val.trim() !== ''
  if (typeof val === 'boolean') return true
  if (typeof val === 'number') return !isNaN(val)
  return false
}

function evaluateTabFields(fields: FieldDef[], vals: Record<string, any>): { filled: number; total: number } {
  const grouped: Record<string, { filled: number; total: number }> = {}
  let ungroupedFilled = 0
  let ungroupedTotal = 0

  for (const f of fields) {
    if (f.condition && !f.condition(vals)) continue
    if (f.group) {
      if (!grouped[f.group]) grouped[f.group] = { filled: 0, total: 0 }
      grouped[f.group].total++
      if (isFieldFilled(f.path, f.type, vals)) grouped[f.group].filled++
    } else {
      ungroupedTotal++
      if (isFieldFilled(f.path, f.type, vals)) ungroupedFilled++
    }
  }

  let filled = ungroupedFilled
  let total = ungroupedTotal
  for (const g of Object.values(grouped)) {
    total++
    if (g.filled > 0) filled++
  }

  return { filled, total }
}

export function useCompletionScore(
  vals: Record<string, any>,
  propertyType: string,
  transactionType?: string,
  furnishing?: string,
  constructionType?: string,
) {
  const type = propertyType || 'residential'
  const tabDefs = PROPERTY_TYPE_TABS[type] || PROPERTY_TYPE_TABS.residential

  const visibleTabIds = Object.keys(tabDefs).filter(tabId => {
    if (tabId === 'contrat') return type === 'vacation'
    if (tabId === 'commercial') return type === 'commercial'
    if (tabId === 'land') return type === 'land'
    if (tabId === 'luxury') return type === 'luxury'
    if (tabId === 'marketing') return type === 'luxury'
    if (tabId === 'seasonal') return type === 'vacation'
    if (tabId === 'documents') return false
    if (tabId === 'inventory') return furnishing === 'meuble' && constructionType === 'appartement'
    return true
  })

  const mergedVals: Record<string, any> = { ...vals, propertyType: type, transactionType, furnishing }

  let totalFilled = 0
  let totalCount = 0

  const perTab: Record<string, { filled: number; total: number; percent: number }> = {}

  for (const tabId of visibleTabIds) {
    let fields = tabDefs[tabId] || []
    if (tabId === 'inventory') {
      fields = buildInventoryFields(mergedVals)
    }
    const { filled, total } = evaluateTabFields(fields, mergedVals)
    perTab[tabId] = { filled, total, percent: total > 0 ? Math.round((filled / total) * 100) : 0 }
    totalFilled += filled
    totalCount += total
  }

  const overall = totalCount > 0 ? Math.round((totalFilled / totalCount) * 100) : 0

  return {
    overall,
    totalFields: totalCount,
    filledFields: totalFilled,
    perTab,
    isSufficient: overall >= SEUIL,
    seuil: SEUIL,
  }
}

export { SEUIL }
