import { proximiteItems, propertyTypeOptions, propertyTypeSubTypes } from './constants';

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  ...Object.fromEntries(propertyTypeOptions.map((t) => [t.value, t.label])),
  ...Object.fromEntries(Object.values(propertyTypeSubTypes).flat().map((t) => [t.value, t.label])),
  villa: 'Villa',
  villa_de_standing: 'Villa de standing',
  riad: 'Riad',
  domaine: 'Domaine',
  chateau: 'Château',
  local_commercial: 'Local commercial',
  entrepot: 'Entrepôt',
  boutique: 'Boutique',
  bureau: 'Bureau',
  constructible: 'Terrain constructible',
  agricole: 'Terrain agricole',
  urbain: 'Terrain urbain',
  a_batir: 'Terrain à bâtir',
};

const TRANSACTION_PHRASES: Record<string, string> = {
  vente: 'à vendre',
  location_ld: 'à louer',
  location_saisonniere: 'en location saisonnière',
};

const LOCATION_TYPE_LABELS: Record<string, string> = {
  campagne: 'à la campagne',
  lotissement: 'dans un lotissement',
  petite_ville: 'dans une petite ville',
  ville: 'en ville',
  medina: 'dans la médina',
  commerce: 'en zone commerciale',
  aeroport: "près de l'aéroport",
  plage: 'près de la plage',
  port: 'près du port',
  ecole: "près d'une école",
};

const CURRENT_USE_LABELS: Record<string, string> = {
  residence_principale: 'occupé en résidence principale',
  residence_secondaire: 'occupé en résidence secondaire',
  vacant: 'actuellement vacant',
};

const PROPERTY_STATE_LABELS: Record<string, string> = {
  excellent: 'très bon état',
  good: 'bon état',
  average: 'état moyen',
  poor: 'mauvais état',
};

const INTERIOR_STATE_LABELS: Record<string, string> = {
  very_good: 'très bon état',
  good: 'bon état',
  average: 'état moyen',
  bad: 'mauvais état',
};

const EXPOSITION_LABELS: Record<string, string> = {
  nord: 'Nord',
  sud: 'Sud',
  est: 'Est',
  ouest: 'Ouest',
};

const STYLE_LABELS: Record<string, string> = {
  moderne: 'moderne',
  traditionnel: 'traditionnel',
  minimaliste: 'minimaliste',
  beldi: 'beldi',
  contemporain: 'contemporain',
};

const ENERGY_LABELS: Record<string, string> = {
  gaz: 'gaz',
  bois: 'bois',
  solaire: 'solaire',
  electrique: 'électrique',
};

const HEATING_MODE_LABELS: Record<string, string> = {
  clim: 'climatisation',
  cheminee: 'cheminée',
  radiateur: 'chauffage par radiateurs',
  sol: 'plancher chauffant',
};

const HEATING_NATURE_LABELS: Record<string, string> = {
  individuel: 'chauffage individuel',
  collectif: 'chauffage collectif',
  centrale: 'chauffage central',
};

const WATER_LABELS: Record<string, string> = {
  onep: 'raccordement ONEP',
  cuve: 'cuve à eau',
  puits: 'puits',
  pompe: 'pompe à eau',
};

const WINDOW_MATERIAL_LABELS: Record<string, string> = {
  alu: 'aluminium',
  bois: 'bois',
  pvc: 'PVC',
};

const SHUTTER_LABELS: Record<string, string> = {
  electrique: 'volets électriques',
  bois: 'volets en bois',
  roulant_manuel: 'volets roulants manuels',
};

const GATE_MATERIAL_LABELS: Record<string, string> = {
  fer: 'fer',
  alu: 'aluminium',
  bois: 'bois',
};

const POOL_EQUIPMENT_LABELS: Record<string, string> = {
  couverture: 'couverture de piscine',
  douche: 'douche de piscine',
  aspirateur: 'aspirateur de piscine',
  pompe: 'pompe',
  lumiere: 'éclairage de piscine',
};

const SECURITY_LABELS: Record<string, string> = {
  alarme: 'alarme',
  videophone: 'vidéophone',
  interphone: 'interphone',
};

const KITCHEN_TYPE_LABELS: Record<string, string> = {
  american: 'cuisine américaine',
  separate: 'cuisine séparée',
  equipped: 'cuisine équipée',
  empty: 'cuisine vide',
  fitted: 'cuisine aménagée',
};

const LUXURY_INTERIOR_LABELS: Record<string, string> = {
  domotique: 'domotique',
  cheminee: 'cheminée',
  hammam: 'hammam / spa',
  sauna: 'sauna',
  cinema: 'cinéma privé',
  caveVin: 'cave à vin',
  ascenseur: 'ascenseur',
};

const LUXURY_EXTERIOR_LABELS: Record<string, string> = {
  heatedPool: 'piscine chauffée',
  tennis: 'court de tennis',
  heliport: 'héliport',
  guardHouse: 'maison de gardien',
  landscapedGarden: 'jardin paysager',
  seaView: 'vue mer',
  mountainView: 'vue montagne',
};

const EXTERIOR_CONSTRUCTION_LABELS: Record<string, string> = {
  pierre: 'en pierre',
  traditionnel: 'traditionnelle',
  beldi: 'de style beldi',
};

const LAYOUT_LABELS: Record<string, string> = {
  tout_egout: "tout à l'égout",
  fosse_septique: 'fosse septique',
  forage: 'forage',
};

const GUARANTEE_LABELS: Record<string, string> = {
  decennale: 'sous garantie décennale',
  ouvrage: "sous garantie d'ouvrage",
};

const FURNISHING_LABELS: Record<string, string> = {
  meuble: 'meublé',
  semi_meuble: 'semi-meublé',
  vide: 'vide',
};

const LAND_TOPO_LABELS: Record<string, string> = {
  plat: 'plat',
  'en pente': 'en pente',
  accidenté: 'accidenté',
};

const LAND_VIEW_LABELS: Record<string, string> = {
  dégagée: 'dégagée',
  montagne: 'montagne',
  mer: 'mer',
};

const LAND_EXT_VIEW_LABELS: Record<string, string> = {
  degagee: 'dégagée',
  montagne: 'montagne',
  mer: 'mer',
};

const ZONAGE_LABELS: Record<string, string> = {
  constructible: 'constructible',
  agricole: 'agricole',
  inondable: 'inondable',
  naturel: 'naturel',
  urbain: 'urbain',
};

const CERTIFICAT_LABELS: Record<string, string> = {
  obtenu: "certificat d'urbanisme obtenu",
  en_cours: "certificat d'urbanisme en cours de délivrance",
  non_demande: "certificat d'urbanisme non demandé",
};

const BAIL_LABELS: Record<string, string> = {
  '3_6_9': 'Bail 3/6/9 ans',
  precaire: 'Bail précaire',
  professionnel: 'Bail professionnel',
};

const SEASON_LABELS: Record<string, string> = {
  basse_saison: 'basse saison',
  saison_intermediaire: 'saison intermédiaire',
  haute_saison: 'haute saison',
  evenements: 'périodes d’événements',
};

const SERVICE_LABELS: Record<string, string> = {
  menage_fin_de_sejour: 'ménage fin de séjour',
  petit_dejeuner: 'petit-déjeuner',
  parking_prive: 'parking privé',
  panier_de_bienvenue: 'panier de bienvenue',
  lit_bebe: 'lit bébé',
  location_serviettes_plage: 'location de serviettes de plage',
};

const INTERIOR_ROOMS = ['Entrée', 'Salon', 'Cuisine', 'Chambre', 'Salle de bain', 'Bureau', 'Buanderie', 'Dressing'];
const EXTERIOR_SPACES = ['Terrasse', 'Cave', 'Jardin', 'Garage', 'Parking', 'Pergola', 'Piscine'];

const get = (obj: any, path: string) => {
  if (!obj) return undefined;
  return path.split('.').reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), obj);
};

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

const fmt = (v: number) => v.toLocaleString('fr-FR');

const joinFrench = (parts: string[]) =>
  parts.length > 1 ? `${parts.slice(0, -1).join(', ')} et ${parts[parts.length - 1]}` : parts[0] || '';

const num = (v: any) => (v !== undefined && v !== null && v !== '' ? Number(v) || 0 : 0);

const norm = (s: string) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const selectedLabels = (obj: any, labels: Record<string, string>) =>
  Object.entries(obj || {})
    .filter(([, v]) => v)
    .map(([k]) => labels[norm(k)])
    .filter(Boolean);

export function generatePropertyDescription(values: any, propertyType: string): string {
  const t = (path: string) => get(values, path);
  const numv = (path: string) => num(get(values, path));

  const subLabel = PROPERTY_TYPE_LABELS[String(t('constructionSubType') || '')];
  const baseLabel = PROPERTY_TYPE_LABELS[String(t('constructionType') || '')] || PROPERTY_TYPE_LABELS[propertyType];
  const typeLabel = subLabel || baseLabel || 'Bien immobilier';

  const transactionType = String(t('transactionType') || (propertyType === 'vacation' ? 'location_saisonniere' : 'vente'));
  const txPhrase = TRANSACTION_PHRASES[transactionType] || 'à vendre';

  const city = String(t('property.city') || '').trim();
  const address = String(t('property.address') || '').trim();
  const title = String(t('propertyTitle') || '').trim();

  const surface = numv('property.surface');
  const landSize = numv('property.landSize');
  const rooms = numv('property.rooms');
  const bedroomsTotal = numv('bedrooms.total') || numv('property.bedrooms');
  const beds = numv('property.beds');
  const bathrooms = numv('bathroom.count');
  const livingRooms = numv('livingRoom.count');
  const kitchens = numv('kitchen.count');
  const parentalSuites = numv('bedrooms.parentalSuite') || numv('bathroom.parentalSuiteCount');

  const paragraphs: string[][] = [[], [], [], [], []];

  // --- Paragraph 1 : intro + composition ---
  const typeLower = typeLabel.toLowerCase();
  let intro = typeLabel;
  if (typeLower.startsWith('villa')) intro = `Belle ${typeLower}`;
  else if (typeLower === 'maison') intro = 'Belle maison';
  else if (typeLower === 'riad') intro = `Magnifique ${typeLower}`;
  intro += ` ${txPhrase}`;
  if (city) intro += ` à ${city}`;
  if (title && title.length <= 60) intro += `, « ${title} »`;
  intro += '.';
  paragraphs[0].push(intro);

  const charParts: string[] = [];
  if (rooms > 0) charParts.push(`${rooms} pièce${rooms > 1 ? 's' : ''}`);
  if (bedroomsTotal > 0) charParts.push(`${bedroomsTotal} chambre${bedroomsTotal > 1 ? 's' : ''}`);
  if (beds > 0) charParts.push(`${beds} lit${beds > 1 ? 's' : ''}`);
  if (bathrooms > 0) charParts.push(`${bathrooms} salle${bathrooms > 1 ? 's' : ''} de bain`);
  if (livingRooms > 0) charParts.push(`${livingRooms} séjour${livingRooms > 1 ? 's' : ''}`);
  if (kitchens > 0) charParts.push(`${kitchens} cuisine${kitchens > 1 ? 's' : ''}`);

  let surfacePhrase = '';
  if (surface > 0) surfacePhrase = `d'une surface de ${fmt(surface)} m²`;
  if (landSize > 0) surfacePhrase += `${surfacePhrase ? ', sur' : 'sur'} un terrain de ${fmt(landSize)} m²`;

  const compParts: string[] = [];
  if (surfacePhrase) compParts.push(surfacePhrase);
  if (charParts.length) compParts.push(`il se compose de ${joinFrench(charParts)}`);

  if (compParts.length) {
    const joined = compParts.join(', ');
    paragraphs[0].push(
      `${cap(joined)}${parentalSuites > 0 ? ` dont ${parentalSuites} suite${parentalSuites > 1 ? 's' : ''} parentale${parentalSuites > 1 ? 's' : ''}` : ''}.`
    );
  }

  // --- Paragraph 2 : situation, exposition, position, proximités ---
  const contextParts: string[] = [];
  const locType = LOCATION_TYPE_LABELS[String(t('location.type') || '')];
  if (locType) contextParts.push(`situé ${locType}`);
  const currentUse = CURRENT_USE_LABELS[String(t('location.currentUse') || '')];
  if (currentUse) contextParts.push(currentUse);
  const exposition = EXPOSITION_LABELS[String(t('location.exposition') || '')];
  if (exposition) contextParts.push(`exposition ${exposition}`);
  if (address) contextParts.push(`à l'adresse ${address}`);
  const floorNumber = String(t('exteriorPosition.floorNumber') || '').trim();
  if (floorNumber) contextParts.push(`au ${floorNumber}`);
  if (contextParts.length) paragraphs[1].push(cap(joinFrench(contextParts)) + '.');

  const proxParts: string[] = [];
  for (const item of proximiteItems) {
    const key = item.toLowerCase().replace(/[/\s]+/g, '_');
    const distance = t(`proximites.${key}.distance`);
    if (distance) {
      const unite = t(`proximites.${key}.unite`) || 'km';
      proxParts.push(`${item.toLowerCase()} à ${distance}${unite}`);
    }
  }
  if (proxParts.length) {
    paragraphs[1].push(`Le bien est idéalement situé : ${joinFrench(proxParts.slice(0, 6))}.`);
  }

  // --- Paragraph 3 : état, construction, extérieurs, équipements, style ---
  const stateParts: string[] = [];
  const state = PROPERTY_STATE_LABELS[String(t('property.state') || '')];
  const year = numv('property.constructionYear');
  if (state) stateParts.push(`Le bien est en ${state}`);
  if (year > 0) stateParts.push(state ? `construit en ${year}` : `Le bien a été construit en ${year}`);
  if (stateParts.length) paragraphs[2].push(cap(joinFrench(stateParts)) + '.');

  const extConst = EXTERIOR_CONSTRUCTION_LABELS[String(t('exterior.type') || '')];
  if (extConst) paragraphs[2].push(`Construction ${extConst}.`);

  const layout = LAYOUT_LABELS[String(t('exterior.layout') || '')];
  if (layout) paragraphs[2].push(`Assainissement : ${layout}.`);

  const guarantee = GUARANTEE_LABELS[String(t('exterior.guarantee') || '')];
  if (guarantee) paragraphs[2].push(cap(guarantee) + '.');

  const furnishing = FURNISHING_LABELS[String(t('furnishing') || '')];
  if (furnishing) paragraphs[2].push(`Le bien est proposé ${furnishing}.`);

  const groundFloorRooms = numv('bedrooms.groundFloor');
  if (groundFloorRooms > 0) {
    paragraphs[2].push(
      `${groundFloorRooms} chambre${groundFloorRooms > 1 ? 's' : ''} située${groundFloorRooms > 1 ? 's' : ''} en rez-de-chaussée.`
    );
  }

  const extParts: string[] = [];
  const extFlags: [string, string][] = [
    ['exteriorFeatures.enclosed', 'terrain clos'],
    ['exteriorFeatures.treed', 'jardin arboré'],
    ['exteriorFeatures.new', 'construction neuve'],
    ['exteriorFeatures.poolPossible', 'terrain piscinable'],
    ['exteriorFeatures.well', 'puits'],
    ['exteriorFeatures.poolhouse', 'pool house'],
    ['exteriorFeatures.barbecue', 'barbecue'],
    ['exteriorFeatures.automaticWatering', 'arrosage automatique'],
    ['exteriorFeatures.caretaker', 'gardien'],
    ['exteriorFeatures.gardener', 'jardinier'],
    ['exteriorFeatures.noOverlook', 'sans vis-à-vis'],
    ['views.ocean', 'vue océan'],
    ['views.panoramic', 'vue panoramique'],
    ['views.urban', 'vue urbaine'],
    ['views.quiet', 'quartier calme'],
    ['parking.privateExterior', 'parking extérieur privé'],
    ['parking.privateInterior', 'parking intérieur privé'],
    ['parking.garage', 'garage'],
  ];
  extFlags.forEach(([path, label]) => {
    if (get(values, path)) extParts.push(label);
  });
  if (extParts.length) paragraphs[2].push(`À l'extérieur : ${joinFrench(extParts)}.`);

  const eqParts: string[] = [];
  const seenEq = new Set<string>();
  const pushEq = (label: string) => {
    const key = norm(label);
    if (!seenEq.has(key)) {
      seenEq.add(key);
      eqParts.push(label);
    }
  };

  if (t('pool.hasPool')) {
    const detail = [t('pool.measurement'), t('pool.coating'), t('pool.treatment')]
      .map((v) => (v !== undefined && v !== null ? String(v).trim() : ''))
      .filter(Boolean);
    pushEq(detail.length ? `piscine (${detail.join(' · ')})` : 'piscine');
  }
  if (t('luxuryExterior.heatedPool')) pushEq('piscine chauffée');
  if (t('livingRoom.airConditioned') || t('bedrooms.airConditioned') || t('interiorVacation.climatisation')) pushEq('climatisation');
  if (t('interiorVacation.wifi') || t('livingRoom.fiber')) pushEq('wifi / fibre');
  if (t('interiorVacation.washingMachine')) pushEq('lave-linge');
  if (t('interiorVacation.dishwasher')) pushEq('lave-vaisselle');
  if (t('interiorVacation.tv') || t('bedrooms.tv')) pushEq('télévision');
  if (t('interiorVacation.heating')) pushEq('chauffage');
  if (t('interiorVacation.microwave')) pushEq('micro-ondes');
  if (t('interiorVacation.coffeeMaker')) pushEq('machine à café');
  if (t('interiorVacation.parking')) pushEq('parking');
  if (t('gate.opening.automatique')) pushEq('portail automatique');
  if (t('windows.glass.double')) pushEq('double vitrage');
  if (t('exteriorPosition.elevator') || t('luxuryInterior.ascenseur')) pushEq('ascenseur');
  if (t('exteriorPosition.lastFloor')) pushEq('dernier étage');
  if (t('exteriorPosition.groundFloor')) pushEq('rez-de-chaussée');
  if (t('exteriorPosition.pmrAccess')) pushEq('accès PMR');
  if (t('exteriorPosition.singleLevel')) pushEq('plain-pied');
  if (t('security.alarme')) pushEq('alarme');
  if (t('security.camera')) pushEq('vidéosurveillance');
  if (t('security.blindDoor')) pushEq('porte blindée');
  if (String(t('security.poolSecurity') || '').trim()) pushEq(`piscine sécurisée (${String(t('security.poolSecurity')).trim()})`);
  if (t('livingRoom.bright') || t('bedrooms.bright')) pushEq('pièces lumineuses');
  if (t('livingRoom.terraceAccess')) pushEq('séjour avec accès terrasse');
  if (t('livingRoom.poolAccess')) pushEq('séjour avec accès piscine');
  if (t('bedrooms.exteriorAccess')) pushEq('chambres avec accès extérieur');
  if (t('bedrooms.poolAccess')) pushEq('chambres avec accès piscine');
  if (t('bathroom.shower')) pushEq('douche');
  if (t('bathroom.bathtub')) pushEq('baignoire');
  if (String(t('bathroom.toiletType') || '') === 'separate') pushEq('WC indépendant');
  if (t('guarantees.furniture') || t('guarantees.appliances')) pushEq('garanties meubles et électroménager');
  if (t('marketing.virtualTourUrl')) pushEq('visite virtuelle disponible');

  selectedLabels(t('kitchen.type'), KITCHEN_TYPE_LABELS).forEach(pushEq);
  selectedLabels(t('heating.mode'), HEATING_MODE_LABELS).forEach(pushEq);
  selectedLabels(t('heating.nature'), HEATING_NATURE_LABELS).forEach(pushEq);
  selectedLabels(t('water'), WATER_LABELS).forEach(pushEq);
  selectedLabels(t('shutters'), SHUTTER_LABELS).forEach(pushEq);
  selectedLabels(t('pool.equipment'), POOL_EQUIPMENT_LABELS).forEach(pushEq);
  selectedLabels(t('security'), SECURITY_LABELS).forEach(pushEq);
  selectedLabels(t('luxuryInterior'), LUXURY_INTERIOR_LABELS).forEach(pushEq);
  selectedLabels(t('luxuryExterior'), LUXURY_EXTERIOR_LABELS).forEach(pushEq);

  const windowMats = selectedLabels(t('windows.material'), WINDOW_MATERIAL_LABELS);
  if (windowMats.length) pushEq(`fenêtres en ${joinFrench(windowMats)}`);

  const gateMats = selectedLabels(t('gate.material'), GATE_MATERIAL_LABELS);
  if (gateMats.length) pushEq(`portail en ${joinFrench(gateMats)}`);

  const energies = selectedLabels(t('energy'), ENERGY_LABELS);
  if (energies.length) pushEq(`chauffage ${joinFrench(energies)}`);

  if (eqParts.length) paragraphs[2].push(`Les équipements comprennent ${joinFrench(eqParts)}.`);

  const styles = selectedLabels(t('interiorStyles'), STYLE_LABELS);
  if (styles.length) paragraphs[2].push(`Intérieur au style ${joinFrench(styles)}.`);

  // --- Paragraph 4 : répartition des pièces et notes libres ---
  const intParts: string[] = [];
  for (const room of INTERIOR_ROOMS) {
    const key = room.toLowerCase().replace(' ', '_');
    const s = t(`interiorSpaces.${key}`);
    if (!s || typeof s !== 'object') continue;
    const bits: string[] = [];
    const surf = num(s.surface);
    if (surf > 0) bits.push(`${surf} m²`);
    if (s.floorCovering) bits.push(String(s.floorCovering));
    const st = INTERIOR_STATE_LABELS[s.state];
    if (st) bits.push(st);
    if (s.closet) bits.push('avec placard');
    if (bits.length) intParts.push(`${room} (${bits.join(', ')})`);
    else intParts.push(room);
  }
  if (intParts.length) paragraphs[3].push(`La répartition intérieure comprend ${joinFrench(intParts)}.`);

  const extSpaceParts: string[] = [];
  for (const space of EXTERIOR_SPACES) {
    const key = space.toLowerCase();
    const s = t(`exteriorSpaces.${key}`);
    if (!s || typeof s !== 'object') continue;
    const bits: string[] = [];
    const surf = num(s.surface);
    if (surf > 0) bits.push(`${surf} m²`);
    if (s.floorCovering) bits.push(String(s.floorCovering));
    const st = PROPERTY_STATE_LABELS[s.state];
    if (st) bits.push(st);
    if (bits.length) extSpaceParts.push(`${space} (${bits.join(', ')})`);
    else extSpaceParts.push(space);
  }
  if (extSpaceParts.length) paragraphs[3].push(`Les extérieurs comprennent ${joinFrench(extSpaceParts)}.`);

  const notes = [
    t('interior.styleComments'),
    t('kitchen.details'),
    t('livingRoom.details'),
    t('bedrooms.details'),
  ]
    .map((v) => (v !== undefined && v !== null ? String(v).trim() : ''))
    .filter(Boolean);
  if (notes.length) paragraphs[3].push(notes.join(' '));

  // --- Paragraph 5 : spécificités du type, prix, services ---
  const specifics = paragraphs[4];
  const devise = String(t('devise') || 'MAD');

  if (propertyType === 'land') {
    if (t('land.constructible') === true) specifics.push('Ce terrain est constructible.');
    if (t('land.constructible') === false) specifics.push("Ce terrain n'est pas constructible.");
    const cos = numv('land.cos');
    const shon = numv('land.shon');
    if (cos > 0 || shon > 0) {
      const pp: string[] = [];
      if (cos > 0) pp.push(`COS de ${cos}`);
      if (shon > 0) pp.push(`SHON de ${fmt(shon)} m²`);
      specifics.push(cap(joinFrench(pp)) + '.');
    }
    const topoType =
      LAND_TOPO_LABELS[String(t('land.topography.type') || '')] ||
      (String(t('exterior.type') || '') === 'plat'
        ? 'plat'
        : String(t('exterior.type') || '') === 'pente'
          ? 'en pente'
          : String(t('exterior.type') || '') === 'accidente'
            ? 'accidenté'
            : undefined);
    if (topoType) specifics.push(`Terrain ${topoType}.`);
    const topoView =
      LAND_VIEW_LABELS[String(t('land.topography.view') || '')] ||
      LAND_EXT_VIEW_LABELS[String(t('exterior.view') || '')];
    if (topoView) specifics.push(`Vue ${topoView}.`);
    const conns = ['eau', 'électricité', 'assainissement', 'gaz'].filter((u) => t(`land.connections.${u}`) === true);
    if (conns.length) specifics.push(`Raccordements disponibles : ${conns.join(', ')}.`);
    const zonage = ZONAGE_LABELS[String(t('land.urbanism.zonage') || '')];
    if (zonage) specifics.push(`Classé en zone ${zonage}.`);
    const plu = String(t('land.urbanism.plu') || '').trim();
    if (plu) specifics.push(`PLU applicable : ${plu}.`);
    const certificat = CERTIFICAT_LABELS[String(t('land.urbanism.certificatUrbanisme') || '')];
    if (certificat) specifics.push(cap(certificat) + '.');
    if (t('location.buildable')) specifics.push("Bénéficie d'une surface constructible.");
    if (t('location.avna')) specifics.push("Bénéficie d'un AVNA.");
    const facade = numv('property.facadeWidth');
    const depth = numv('property.depth');
    if (facade > 0 || depth > 0) {
      const pp: string[] = [];
      if (facade > 0) pp.push(`façade de ${facade} m`);
      if (depth > 0) pp.push(`profondeur de ${depth} m`);
      specifics.push(`Le terrain présente ${joinFrench(pp)}.`);
    }
  }

  if (propertyType === 'commercial') {
    const pondere = numv('property.pondereSurface');
    const ceiling = numv('property.ceilingHeight');
    const pp: string[] = [];
    if (pondere > 0) pp.push(`surface pondérée de ${fmt(pondere)} m²`);
    if (ceiling > 0) pp.push(`hauteur sous plafond de ${ceiling} m`);
    if (pp.length) specifics.push(cap(joinFrench(pp)) + '.');
    const comExt: string[] = [];
    if (t('commercialExterior.deliveries')) comExt.push('accès livraisons');
    if (t('commercialExterior.truckParking')) comExt.push('parking poids lourds');
    if (t('commercialExterior.dock')) comExt.push('quai de déchargement');
    if (comExt.length) specifics.push(`Logistique : ${comExt.join(', ')}.`);
    const bailType = BAIL_LABELS[String(t('commercial.bailType') || '')];
    if (bailType) specifics.push(`${bailType}.`);
    const loyerAnnuel = numv('commercial.loyerAnnuel');
    if (loyerAnnuel > 0) specifics.push(`Loyer annuel : ${fmt(loyerAnnuel)} MAD.`);
    const chargesAnnuelles = numv('commercial.chargesAnnuelles');
    if (chargesAnnuelles > 0) specifics.push(`Charges annuelles : ${fmt(chargesAnnuelles)} MAD.`);
    const depot = numv('commercial.depotGarantie');
    if (depot > 0) specifics.push(`Dépôt de garantie : ${fmt(depot)} MAD.`);
    const erp = String(t('commercial.erp') || '');
    if (erp === 'oui') specifics.push("Établissement recevant du public (ERP).");
    if (erp === 'non') specifics.push("Établissement ne recevant pas du public.");
  }

  if (propertyType === 'vacation') {
    const sleeping = numv('sleepingCapacity') || numv('capacite');
    if (sleeping > 0) specifics.push(`Capacité d'accueil : ${sleeping} personnes.`);
    const seasons = Object.keys(SEASON_LABELS)
      .map((key) => ({ key, price: numv(`priceGrid.${key}.price`) }))
      .filter((s) => s.price > 0);
    let hasSeasonGrid = false;
    if (seasons.length) {
      hasSeasonGrid = true;
      specifics.push(`Tarifs : ${seasons.map((s) => `${SEASON_LABELS[s.key]} ${fmt(s.price)} ${devise}/nuit`).join(', ')}.`);
    }
    const services: string[] = [];
    for (const key of Object.keys(SERVICE_LABELS)) {
      if (t(`options.${key}.enabled`)) {
        const price = numv(`options.${key}.price`);
        services.push(price > 0 ? `${SERVICE_LABELS[key]} (${fmt(price)} ${devise})` : SERVICE_LABELS[key]);
      }
    }
    if (services.length) specifics.push(`Services proposés : ${services.join(', ')}.`);
    const min = numv('seasonalPriceMin');
    const max = numv('seasonalPriceMax');
    if (!hasSeasonGrid && (min > 0 || max > 0)) {
      specifics.push(
        `Tarif ${min > 0 && max > 0 ? `de ${fmt(min)} à ${fmt(max)}` : min > 0 ? `à partir de ${fmt(min)}` : `jusqu'à ${fmt(max)}`} ${devise} la nuit.`
      );
    }
  }

  const buildableSurface = numv('property.buildableSurface');
  if (buildableSurface > 0) specifics.push(`Surface constructible : ${fmt(buildableSurface)} m².`);

  if (t('prixConfidentiel')) {
    specifics.push('Prix disponible sur demande.');
  } else if (t('prixSurDemande')) {
    specifics.push('Prix sur demande.');
  } else {
    const price = numv('price') || numv('prixNetVendeur');
    const loyer = numv('loyerHC');
    if (loyer > 0) {
      const charges = numv('charges');
      specifics.push(`Loyer : ${fmt(loyer)} ${devise}/mois${charges > 0 ? `, charges ${fmt(charges)} ${devise}` : ''}.`);
    } else if (price > 0) {
      specifics.push(`Le bien est proposé au prix de ${fmt(price)} ${devise}.`);
    }
    if (price > 0 && loyer === 0) {
      if (t('negociable')) specifics.push('Prix négociable.');
      const min = numv('prixMinimum');
      if (min > 0) specifics.push(`Prix minimum : ${fmt(min)} ${devise}.`);
      const expert = numv('prixExpertise');
      if (expert > 0) specifics.push(`Prix évalué par expertise : ${fmt(expert)} ${devise}.`);
    }
  }

  const estimation = numv('estimation');
  if (estimation > 0) specifics.push(`Estimation : ${fmt(estimation)} ${devise}.`);

  const luxuryFeatures = String(t('property.luxuryFeatures') || '').trim();
  if (luxuryFeatures) specifics.push(luxuryFeatures);

  const meaningful =
    !!city || !!address || surface > 0 || rooms > 0 || bedroomsTotal > 0 || bathrooms > 0 ||
    paragraphs[1].length > 0 || paragraphs[2].length > 0 || paragraphs[3].length > 0 || paragraphs[4].length > 0;

  if (!meaningful) return '';

  return paragraphs.map((p) => p.filter((s) => s.trim()).join(' ')).filter((p) => p.trim()).join('\n\n');
}
