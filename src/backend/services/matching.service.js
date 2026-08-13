/**
 * Matching / Croisement Service v2
 * Intelligent matching of Acheteur buyer criteria against properties.
 *
 * Matching dimensions:
 *   - Location (20pts): city/area text + haversine proximity
 *   - Budget (15pts): price range with tolerance
 *   - Surface (12pts): surface range with tolerance
 *   - Chambres (10pts): bedroom count with operator (ge/le/eq)
 *   - Critères (15pts): buyer feature requirements → property form_data fields
 *   - Prestations (10pts): buyer comfort/equipment → property interior/exterior/equipment
 *   - Proximités (7pts): buyer proximity requirements → property proximités
   - Attributs (4pts): buyer custom attributes → property features
 *   - Vue (3pts): view preference
 *   - Exposition (2pts): sun exposure
 *   - État (2pts): condition
 */
import pool from '../config/db.js';

/* ──────────── helpers ──────────── */

function norm(s) {
  if (!s) return '';
  return s.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function has(v) {
  return v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);
}

function eq(a, b) {
  return norm(a) === norm(b);
}

function toNum(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function matchesOperator(value, target, operator) {
  if (!value || !target) return null;
  const v = Number(value); const t = Number(target);
  if (isNaN(v) || isNaN(t)) return null;
  switch (operator) { case 'ge': return v >= t; case 'le': return v <= t; default: return v === t; }
}

function boolObjToArray(val) {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object') return Object.entries(val).filter(([, v]) => v === true).map(([k]) => k);
  return [];
}

function hasSpace(property, spaceName) {
  const spaces = property.interiorSpaces || {};
  const extSpaces = property.exteriorSpaces || {};
  return spaces[spaceName] != null || extSpaces[spaceName] != null;
}

/* ──────────── constants ──────────── */

const WEIGHTS = {
  location: 20, budget: 15, surface: 12, chambres: 10,
  criteres: 15, prestations: 10, proximites: 7, attributs: 4,
  vue: 3, exposition: 2, etat: 2,
};
const MAX_SCORE = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

const TRANSACTION_MAP = {
  vente: ['vente'], location: ['location_ld'], location_ld: ['location_ld'],
  location_saisonniere: ['location_saisonniere'], 'location saisonniere': ['location_saisonniere'],
};
const PROPERTY_TYPE_MAP = {
  appartement: ['residential'], maison: ['residential'], villa: ['residential', 'luxury'],
  terrain: ['land'], bureau: ['commercial'], 'local commercial': ['commercial'],
  immeuble: ['commercial', 'residential'], studio: ['residential'],
  penthouse: ['residential', 'luxury'], riad: ['residential', 'luxury'],
};

const VUE_MAP = {
  apercu: ['Apercu', 'Degragee'], degagee: ['Degragee', 'Apercu'],
  mer: ['Ocean', 'Panoramique'], montagne: ['Panoramique'],
  jardin: ['Jardin', 'Panoramique'], piscine: ['Piscine'],
  panoramique: ['Panoramique'], 'vis-a-vis': [],
  externe: ['Degragee', 'Panoramique'], interne: [],
};
const ETAT_MAP = {
  neuf: ['Neuf', 'Tres bon'], 'tres bon': ['Tres bon', 'Bon', 'Neuf'],
  bon: ['Bon', 'Moyen'], 'a renover': ['A renover', 'Ancien'],
  ancien: ['Ancien', 'A renover'],
};
const EXPOSITION_MAP = {
  nord: ['nord', 'Nord'], sud: ['sud', 'Sud'], est: ['est', 'Est'], ouest: ['ouest', 'Ouest'],
  'nord-est': ['nord-est', 'Nord-Est'], 'nord-ouest': ['nord-ouest', 'Nord-Ouest'],
  'sud-est': ['sud-est', 'Sud-Est'], 'sud-ouest': ['sud-ouest', 'Sud-Ouest'],
};

/* ═══════════════════════════════════════════════════════
   CRITÈRES → Property form_data mapping
   Each buyer critere maps to a function that checks
   whether the property satisfies it.
   ═══════════════════════════════════════════════════════ */

const CRITERE_CHECKS = {
  'garage': (p) => p.parking?.garage === true || hasSpace(p, 'garage'),
  'parking': (p) => boolObjToArray(p.parking).length > 0 || hasSpace(p, 'parking'),
  'cave': (p) => hasSpace(p, 'cave'),
  'terrasse': (p) => hasSpace(p, 'terrasse') || boolObjToArray(p.exteriorFeatures).some(f => /terrasse/.test(norm(f))),
  'balcon': (p) => boolObjToArray(p.exteriorFeatures).some(f => /balcon/.test(norm(f))),
  'jardin': (p) => hasSpace(p, 'jardin') || p.exteriorFeatures?.treed === true || p.exteriorFeatures?.enclosed === true,
  'terrain': (p) => toNum(p.landSize) > 0,
  'acces pmr': (p) => p.exteriorPosition?.pmrAccess === true,
  'air conditionne': (p) => p.livingRoom?.airConditioned === true || p.bedrooms?.airConditioned === true || p.interiorVacation?.climatisation === true,
  'ascenseur': (p) => p.exteriorPosition?.elevator === true,
  'piscine': (p) => p.pool?.hasPool === true,
};

function checkCriteres(buyerCriteres, property) {
  if (!buyerCriteres || !buyerCriteres.length) return null;
  let matched = 0;
  for (const critere of buyerCriteres) {
    const n = norm(critere);
    const checkFn = CRITERE_CHECKS[n];
    if (checkFn) {
      if (checkFn(property)) matched++;
    } else {
      const haystack = [
        property.description || '', property.title || '',
        ...boolObjToArray(property.features),
        ...boolObjToArray(property.exteriorFeatures),
        ...boolObjToArray(property.parking),
        ...(property.heating?.mode ? Object.keys(property.heating.mode) : []),
      ].map(norm).join(' ');
      if (haystack.includes(n)) matched++;
    }
  }
  return matched / buyerCriteres.length;
}

/* ═══════════════════════════════════════════════════════
   PRESTATIONS → Property form_data mapping
   Each prestation name (within its category) maps to
   a function that checks the property.
   ═══════════════════════════════════════════════════════ */

const PRESTATION_CHECKS = {
  exterieur: {
    'abri voiture': (p) => p.parking?.garage || hasSpace(p, 'garage') || hasSpace(p, 'parking'),
    'acces pmr': (p) => p.exteriorPosition?.pmrAccess,
    'alarme': (p) => p.security?.alarme,
    'alarme incendie': (p) => p.security?.alarme,
    'arrosage': (p) => p.exteriorFeatures?.automaticWatering,
    'barbecue': (p) => p.exteriorFeatures?.barbecue,
    'cloture': (p) => p.exteriorFeatures?.enclosed,
    'concierge': (p) => p.exteriorFeatures?.caretaker,
    'controle acces': (p) => p.security?.interphone || p.security?.camera,
    'digicode': (p) => p.security?.interphone || p.security?.vidéophone,
    'eclairage exterieur': (p) => p.exteriorFeatures?.treed,
    'gardien': (p) => p.exteriorFeatures?.caretaker,
    'interphone': (p) => p.security?.interphone,
    'maison gardien': (p) => p.exteriorFeatures?.caretaker,
    'panneaux photovoltaiques': (p) => p.energy?.solaire,
    'panneaux solaires': (p) => p.energy?.solaire,
    'portail electrique': (p) => p.gate?.opening?.automatique,
    'porte blindee': (p) => p.security?.blindDoor,
    'puits': (p) => p.water?.puits || p.exteriorFeatures?.well,
    'video surveillance': (p) => p.security?.camera,
    'videophone': (p) => p.security?.vidéophone,
    'volets roulants electriques': (p) => p.shutters?.['électrique'],
  },
  confort: {
    'adoucisseur eau': (p) => p.water?.pompe || p.water?.cuve,
    'air conditionne': (p) => p.livingRoom?.airConditioned || p.bedrooms?.airConditioned || p.interiorVacation?.climatisation,
    'ascenseur': (p) => p.exteriorPosition?.elevator,
    'aspiration centralisee': (p) => p.luxuryInterior?.domotique,
    'baignoire balneo': (p) => p.bathroom?.bathtub,
    'cave': (p) => hasSpace(p, 'cave'),
    'cheminee': (p) => p.luxuryInterior?.cheminee || p.heating?.mode?.['cheminée'],
    'coffre-fort': (p) => p.security?.blindDoor,
    'domotique': (p) => p.luxuryInterior?.domotique,
    'double vitrage': (p) => p.windows?.glass?.double || p.windows?.glass?.survitrage,
    'fibre optique': (p) => p.livingRoom?.fiber,
    'jacuzzi': (p) => p.pool?.hasPool,
    'meuble': (p) => ['meuble', 'semi_meuble'].includes(p.furnishing),
    'moustiquaire': (p) => p.livingRoom?.bright != null,
    'piscine': (p) => p.pool?.hasPool,
    'sauna': (p) => p.luxuryInterior?.sauna,
    'spa': (p) => p.luxuryInterior?.sauna || p.luxuryInterior?.hammam,
    'stores electriques': (p) => p.shutters?.['électrique'],
    'television': (p) => p.interiorVacation?.tv || p.bedrooms?.tv,
    'thermostat connecte': (p) => p.luxuryInterior?.domotique,
    'triple vitrage': (p) => p.windows?.glass?.triple,
    'ventilation double flux': (p) => p.heating?.mode?.clim,
  },
  electromenager: {
    'cafetiere': (p) => p.interiorVacation?.coffeeMaker,
    'congelateur': (p) => p.kitchen?.type?.equipped,
    'cuisiniere': (p) => p.kitchen?.type?.equipped,
    'fer a repasser': (p) => p.kitchen?.type?.equipped,
    'four': (p) => p.kitchen?.type?.equipped,
    'four micro-ondes': (p) => p.interiorVacation?.microwave,
    'lave-linge': (p) => p.interiorVacation?.washingMachine,
    'lave-vaisselle': (p) => p.interiorVacation?.dishwasher,
    'refrigerateur': (p) => p.kitchen?.type?.equipped,
    'seche-cheveux': (p) => p.kitchen?.type?.equipped,
    'seche-linge': (p) => p.interiorVacation?.washingMachine,
    'vaisselle': (p) => p.kitchen?.type?.equipped,
    'linge de maison': (p) => p.guarantees?.furniture,
  },
  multimedia: {
    'internet': (p) => p.livingRoom?.fiber,
    'lecteur cd': () => false,
    'lecteur dvd': () => false,
    'reseau informatique': (p) => p.livingRoom?.fiber,
    'teledistribution': (p) => p.interiorVacation?.tv,
    'telephone': () => false,
  },
  sport: {
    'golf': (p) => checkProximityKey(p, 'golf'),
    'tennis': (p) => p.luxuryExterior?.tennis || checkProximityKey(p, 'tennis'),
    'piscine publique': (p) => checkProximityKey(p, 'piscine_publique'),
    'salle de sport': (p) => checkProximityKey(p, 'salle_de_sport'),
    'canoe': () => false, 'jet ski': () => false, 'jeu de boules': () => false,
    'kite surf': () => false, 'paddle': () => false, 'peche': (p) => checkProximityKey(p, 'lac') || checkProximityKey(p, 'mer'),
    'plongee': (p) => checkProximityKey(p, 'mer') || checkProximityKey(p, 'plage'),
    'scooter': () => false, 'seabob': () => false, 'segway': () => false,
    'toboggan': () => false, 'velos': () => false, 'wakeboard': () => false,
  },
};

function checkPrestations(buyerPrestations, property) {
  if (!buyerPrestations) return null;
  let total = 0, matched = 0;
  for (const [category, items] of Object.entries(buyerPrestations)) {
    if (!Array.isArray(items) || !items.length) continue;
    const catChecks = PRESTATION_CHECKS[category] || {};
    for (const item of items) {
      if (!item) continue;
      total++;
      const n = norm(item);
      const checkFn = catChecks[n];
      if (checkFn) {
        if (checkFn(property)) matched++;
      } else {
        const haystack = [
          property.description || '',
          ...boolObjToArray(property.features),
          ...boolObjToArray(property.exteriorFeatures),
        ].map(norm).join(' ');
        if (haystack.includes(n)) matched++;
      }
    }
  }
  return total > 0 ? matched / total : null;
}

/* ═══════════════════════════════════════════════════════
   ATTRIBUTS → Property form_data mapping
   ═══════════════════════════════════════════════════════ */

const ATTRIBUT_CHECKS = {
  'avec vna': () => false,
  'cheminee': (p) => p.luxuryInterior?.cheminee || p.heating?.mode?.['cheminée'],
  'piscine chauffee': (p) => p.luxuryExterior?.heatedPool,
  'pool house': (p) => p.exteriorFeatures?.poolhouse,
  'puits': (p) => p.water?.puits || p.exteriorFeatures?.well,
  'studio independant': (p) => norm(p.propertyType || '').includes('studio'),
  'suite parental': (p) => toNum(p.bedroomsDetails?.parentalSuite || p.bedrooms?.parentalSuite) > 0 || toNum(p.bathroom?.parentalSuiteCount) > 0,
  'vue ocean': (p) => p.views?.ocean || p.luxuryExterior?.seaView,
  'vue mer': (p) => p.views?.ocean || p.luxuryExterior?.seaView,
  'zone urbaine': (p) => p.views?.urban,
};

function checkAttributs(buyerAttributs, property) {
  if (!buyerAttributs || !buyerAttributs.length) return null;
  let matched = 0;
  for (const attr of buyerAttributs) {
    if (!attr) continue;
    const n = norm(attr);
    const checkFn = ATTRIBUT_CHECKS[n];
    if (checkFn) {
      if (checkFn(property)) matched++;
    } else {
      const haystack = [
        property.description || '', property.title || '',
        ...boolObjToArray(property.features),
        ...boolObjToArray(property.exteriorFeatures),
      ].map(norm).join(' ');
      if (haystack.includes(n)) matched++;
    }
  }
  return matched / buyerAttributs.length;
}

/* ═══════════════════════════════════════════════════════
   PROXIMITÉS → Property proximites matching
   Buyer proximites: { transports: [...], commerces: [...], ... }
   Property proximites: { aeroport: { distance, unite }, ... }
   ═══════════════════════════════════════════════════════ */

const PROXIMITE_KEY_MAP = {
  'aeroport': 'aeroport', 'autoroute': 'autoroute', 'bus': 'bus',
  'gare': 'gare', 'gare routiere': 'gare_routiere', 'metro': 'metro',
  'parking public': 'parking_public', 'port': 'port',
  'route principale': 'route_principale', 'taxi': 'taxi', 'tram': 'tram',
  'centre ville': 'centre_ville', 'commerces': 'commerces', 'supermarche': 'supermarche',
  'creche': 'creche', 'ecole primaire': 'ecole_primaire',
  'ecole secondaire': 'ecole_secondaire', 'garderie': 'garderie', 'universite': 'universite',
  'golf': 'golf', 'hopital / clinique': 'hopital_clinique', 'hopital': 'hopital_clinique',
  'medecin': 'medecin', 'piscine publique': 'piscine_publique',
  'salle de sport': 'salle_de_sport', 'tennis': 'tennis',
  'cinema': 'cinema', 'lac': 'lac', 'mer': 'mer',
  'palais des congres': 'palais_des_congres', 'parc': 'parc',
  'pistes de ski': 'pistes_de_ski', 'plage': 'plage',
};

function checkProximityKey(property, key) {
  const pp = property.proximities || property.proximites;
  if (!pp || typeof pp !== 'object') return false;
  return pp[key] != null;
}

function checkProximites(buyerProximites, property) {
  if (!buyerProximites) return null;
  const flat = Object.values(buyerProximites).flat().filter(Boolean);
  if (!flat.length) return null;
  const pp = property.proximities || property.proximites;
  if (!pp || typeof pp !== 'object') return 0;
  let matched = 0;
  for (const item of flat) {
    if (!item) continue;
    const n = norm(item);
    const mappedKey = PROXIMITE_KEY_MAP[n];
    if (mappedKey && pp[mappedKey]) { matched++; continue; }
    for (const pk of Object.keys(pp)) {
      if (norm(pk).includes(n) || n.includes(norm(pk))) { matched++; break; }
    }
  }
  return matched / flat.length;
}

/* ═══════════════════════════════════════════════════════
   SCORE PROPERTY — main scoring function
   ═══════════════════════════════════════════════════════ */

function scoreProperty(buyer, property) {
  let score = 0;
  const details = {};

  /* ── LOCATION (20pts) ── */
  if (has(buyer.secteur) || has(buyer.area) || has(buyer.localisation)) {
    const bL = norm(buyer.secteur || buyer.area || '');
    const pC = norm(property.city || '');
    const pD = norm(property.district || '');
    const pL = norm(property.location || '');
    const pA = norm(property.address || '');
    if (bL && (eq(bL, pC) || eq(bL, pD) || pC.includes(bL) || pD.includes(bL) || pL.includes(bL) || pA.includes(bL))) {
      score += WEIGHTS.location;
      details.location = 1;
    } else if (has(buyer.localisation)) {
      const bc = norm(buyer.localisation);
      if (pC.includes(bc) || pL.includes(bc) || pD.includes(bc)) {
        score += WEIGHTS.location * 0.6;
        details.location = 0.6;
      }
    }
  }
  if (buyer.latitude && buyer.longitude && property.latitude && property.longitude) {
    const d = haversine(buyer.latitude, buyer.longitude, property.latitude, property.longitude);
    if (d < 5) { score += WEIGHTS.location * 0.3; details.location = Math.min(1, (details.location || 0) + 0.3); }
    else if (d < 15) { score += WEIGHTS.location * 0.15; details.location = Math.min(1, (details.location || 0) + 0.15); }
  }

  /* ── BUDGET (15pts) ── */
  const price = toNum(property.price);
  const maxP = toNum(buyer.prixMax) || toNum(buyer.budget);
  const minP = toNum(buyer.prixMin);
  const isLocataire = norm(buyer.clientType) === 'locataire';
  if (price > 0 && maxP > 0) {
    if (isLocataire) {
      if (price <= maxP) {
        score += WEIGHTS.budget;
        details.budget = 1;
      }
    } else {
      if (price >= minP && price <= maxP) {
        score += WEIGHTS.budget;
        details.budget = 1;
      } else {
        const overBy = price > maxP ? (price - maxP) / maxP : 0;
        const underBy = price < minP && minP > 0 ? (minP - price) / minP : 0;
        const deviation = Math.max(overBy, underBy);
        if (deviation < 0.10) { score += WEIGHTS.budget * 0.8; details.budget = 0.8; }
        else if (deviation < 0.20) { score += WEIGHTS.budget * 0.5; details.budget = 0.5; }
        else if (deviation < 0.35) { score += WEIGHTS.budget * 0.2; details.budget = 0.2; }
      }
    }
  } else if (price > 0 && minP > 0 && price >= minP) {
    score += WEIGHTS.budget * 0.5;
    details.budget = 0.5;
  }

  /* ── SURFACE (12pts) ── */
  const surf = toNum(property.surface);
  const minS = toNum(buyer.minSurface) || toNum(buyer.surfaceMin);
  const maxS = toNum(buyer.surfaceMax);
  if (surf > 0) {
    if (minS > 0 && maxS > 0) {
      if (surf >= minS && surf <= maxS) {
        score += WEIGHTS.surface; details.surface = 1;
      } else {
        const devMin = minS > 0 ? Math.abs(surf - minS) / minS : 0;
        const devMax = maxS > 0 ? Math.abs(surf - maxS) / maxS : 0;
        const dev = Math.min(devMin, devMax);
        if (dev < 0.10) { score += WEIGHTS.surface * 0.7; details.surface = 0.7; }
        else if (dev < 0.25) { score += WEIGHTS.surface * 0.4; details.surface = 0.4; }
        else if (dev < 0.40) { score += WEIGHTS.surface * 0.15; details.surface = 0.15; }
      }
    } else if (minS > 0) {
      if (surf >= minS) { score += WEIGHTS.surface; details.surface = 1; }
      else if (surf >= minS * 0.8) { score += WEIGHTS.surface * 0.6; details.surface = 0.6; }
      else if (surf >= minS * 0.6) { score += WEIGHTS.surface * 0.2; details.surface = 0.2; }
    } else if (maxS > 0) {
      if (surf <= maxS) { score += WEIGHTS.surface; details.surface = 1; }
      else if (surf <= maxS * 1.2) { score += WEIGHTS.surface * 0.6; details.surface = 0.6; }
      else if (surf <= maxS * 1.4) { score += WEIGHTS.surface * 0.2; details.surface = 0.2; }
    }
  }

  /* ── CHAMBRES (10pts) ── */
  const bC = toNum(buyer.chambres);
  const pB = toNum(property.bedrooms);
  if (bC > 0) {
    if (pB >= bC) {
      score += WEIGHTS.chambres; details.chambres = 1;
    } else {
      details.chambres = 0;
    }
  }

  /* ── CRITÈRES (15pts) ── */
  if (buyer.criteres && buyer.criteres.length) {
    const ratio = checkCriteres(buyer.criteres, property);
    if (ratio !== null) {
      score += WEIGHTS.criteres * ratio;
      details.criteres = ratio;
    }
  }

  /* ── PRESTATIONS (10pts) ── */
  if (buyer.prestations) {
    const ratio = checkPrestations(buyer.prestations, property);
    if (ratio !== null) {
      score += WEIGHTS.prestations * ratio;
      details.prestations = ratio;
    }
  }

  /* ── PROXIMITÉS (7pts) ── */
  if (buyer.proximites) {
    const ratio = checkProximites(buyer.proximites, property);
    if (ratio !== null) {
      score += WEIGHTS.proximites * ratio;
      details.proximites = ratio;
    }
  }

  /* ── ATTRIBUTS (4pts) ── */
  if (buyer.attributsPersonnalises && buyer.attributsPersonnalises.length) {
    const ratio = checkAttributs(buyer.attributsPersonnalises, property);
    if (ratio !== null) {
      score += WEIGHTS.attributs * ratio;
      details.attributs = ratio;
    }
  }

  /* ── VUE (3pts) ── */
  if (has(buyer.vue)) {
    const n = norm(buyer.vue);
    const pv = (property.views || []).map(norm);
    if (pv.some(v => v.includes(n) || n.includes(v))) {
      score += WEIGHTS.vue; details.vue = 1;
    } else {
      const aliases = VUE_MAP[n] || [];
      if (aliases.some(e => pv.some(p => norm(p).includes(norm(e))))) {
        score += WEIGHTS.vue * 0.5; details.vue = 0.5;
      }
    }
  }

  /* ── EXPOSITION (2pts) ── */
  if (has(buyer.exposition)) {
    const n = norm(buyer.exposition);
    const pe = norm(property.exposition || '');
    if (eq(n, pe)) {
      score += WEIGHTS.exposition; details.exposition = 1;
    } else {
      const aliases = EXPOSITION_MAP[n] || [];
      if (aliases.some(a => norm(a) === pe)) {
        score += WEIGHTS.exposition * 0.5; details.exposition = 0.5;
      }
    }
  }

  /* ── ÉTAT (2pts) ── */
  if (has(buyer.etat)) {
    const n = norm(buyer.etat);
    const ps = norm(property.propertyState || '');
    if (eq(n, ps)) {
      score += WEIGHTS.etat; details.etat = 1;
    } else {
      const aliases = ETAT_MAP[n] || [];
      if (aliases.some(e => norm(e) === ps)) {
        score += WEIGHTS.etat * 0.6; details.etat = 0.6;
      }
    }
  }

  const percentage = Math.min(100, Math.round((score / MAX_SCORE) * 100));
  return { percentage, details, rawScore: score };
}

/* ═══════════════════════════════════════════════════════
   DATA PARSING
   ═══════════════════════════════════════════════════════ */

function parsePropertyRow(r) {
  const base = {
    id: String(r.id), reference: r.reference || '', title: r.title || '',
    propertyType: r.property_type || '', transactionType: r.transaction_type || '',
    status: r.status || '', price: Number(r.price) || 0, surface: Number(r.surface) || 0,
    rooms: Number(r.rooms) || 0, bedrooms: Number(r.bedrooms) || 0, bathrooms: Number(r.bathrooms) || 0,
    location: r.location || '', address: r.address || '', city: r.city || '', district: r.district || '',
    latitude: r.latitude ? Number(r.latitude) : null, longitude: r.longitude ? Number(r.longitude) : null,
    description: r.description || '', features: boolObjToArray(r.features), images: boolObjToArray(r.images),
    yearBuilt: r.year_built || null, propertyState: r.property_state || '', landSize: r.land_size ? Number(r.land_size) : 0,
    views: [], parking: [], exteriorFeatures: [], pool: null,
    exposition: '', standing: '', proximites: null, floor: null,
  };
  if (r.form_data) {
    let fd = r.form_data;
    if (typeof fd === 'string') try { fd = JSON.parse(fd); } catch (e) { fd = {}; }
    if (typeof fd === 'object') {
      const dbBedrooms = Number(r.bedrooms) || 0;
      const dbRooms = Number(r.rooms) || 0;
      const dbBathrooms = Number(r.bathrooms) || 0;
      const dbSurface = Number(r.surface) || 0;
      Object.assign(base, fd);
      base.views = boolObjToArray(fd.views);
      base.parking = boolObjToArray(fd.parking);
      base.exteriorFeatures = boolObjToArray(fd.exteriorFeatures);
      base.features = boolObjToArray(fd.features != null ? fd.features : base.features);
      if (!base.pool && fd.pool) base.pool = fd.pool;
      if (!base.proximities && fd.proximities) base.proximites = fd.proximities;
      if (fd.exposition) base.exposition = fd.exposition;
      if (fd.standing) base.standing = fd.standing;
      if (fd.floorNumber) base.floor = fd.floorNumber;
      if (fd.city) base.city = fd.city;
      if (fd.surface) base.surface = Number(fd.surface) || dbSurface;
      if (fd.rooms) base.rooms = Number(fd.rooms) || dbRooms;
      if (fd.bedrooms) {
        if (typeof fd.bedrooms === 'object') {
          base.bedroomsDetails = fd.bedrooms;
          base.bedrooms = Number(fd.bedrooms.total) || dbBedrooms;
        } else {
          base.bedrooms = Number(fd.bedrooms) || dbBedrooms;
        }
      } else if (fd.bedrooms_total != null) {
        base.bedrooms = Number(fd.bedrooms_total);
      }
      if (fd.bathrooms) base.bathrooms = Number(fd.bathrooms) || dbBathrooms;
    }
  }
  base.price = Number(base.prixNetVendeur) || Number(base.loyerHC) || Number(base.price) || Number(r.price) || 0;
  if (!base.surface) base.surface = Number(r.surface) || 0;
  if (!base.rooms) base.rooms = Number(r.rooms) || 0;
  if (!base.bedrooms) base.bedrooms = Number(r.bedrooms) || 0;
  if (!base.bathrooms) base.bathrooms = Number(r.bathrooms) || 0;
  if (!base.city) base.city = r.city || '';
  if (!base.title) base.title = r.title || '';
  return base;
}

function ensureObject(val) {
  if (!val) return null;
  if (typeof val === 'string') try { val = JSON.parse(val); } catch (e) { return null; }
  if (typeof val === 'object' && !Array.isArray(val)) return val;
  return null;
}
function ensureArray(val) {
  if (!val) return [];
  if (typeof val === 'string') try { val = JSON.parse(val); } catch (e) { return []; }
  if (Array.isArray(val)) return val;
  return [];
}

function buildBuyerFromRow(row) {
  const data = row.data || {};
  return {
    clientType: row.client_type || data.clientType || '',
    secteur: data.secteur || '', area: data.area || '', localisation: data.localisation || '',
    categorie: data.categorie || '', propertyType: data.propertyType || '',
    prixMin: data.prixMin || 0, prixMax: data.prixMax || 0, budget: data.budget || 0,
    minSurface: data.minSurface || data.surfaceMin || 0, surfaceMax: data.surfaceMax || 0,
    pieces: data.pieces || 0, piecesOperator: data.piecesOperator || '',
    chambres: data.chambres || 0, chambresOperator: data.chambresOperator || '',
    etage: data.etage, etageOperator: data.etageOperator || '',
    vue: data.vue || '', exposition: data.exposition || '', etat: data.etat || '', standing: data.standing || '',
    criteres: ensureArray(data.criteres), attributsPersonnalises: ensureArray(data.attributsPersonnalises),
    proximites: ensureObject(data.proximites), prestations: ensureObject(data.prestations),
    latitude: data.latitude || null, longitude: data.longitude || null,
  };
}

/* ═══════════════════════════════════════════════════════
   EXPORTS
   ═══════════════════════════════════════════════════════ */

export async function findMatchingProperties(clientId) {
  const clientResult = await pool.query('SELECT * FROM owner_clients WHERE id = $1', [clientId]);
  if (clientResult.rows.length === 0) throw new Error('Client not found');
  const buyer = buildBuyerFromRow(clientResult.rows[0]);
  const propResult = await pool.query("SELECT * FROM properties WHERE status IN ('for_sale','for_rent','for_sale_or_rent','negotiation','available')");
  const properties = propResult.rows.map(parsePropertyRow);
  let filtered = properties;
  if (has(buyer.categorie)) {
    const cat = norm(buyer.categorie);
    const tx = TRANSACTION_MAP[cat];
    if (tx) filtered = properties.filter(p => tx.includes(norm(p.transactionType)));
  }
  return filtered.map(property => {
    try {
      const { percentage, details, rawScore } = scoreProperty(buyer, property);
      return {
        propertyId: property.id, reference: property.reference, title: property.title,
        price: property.price, surface: property.surface, rooms: property.rooms,
        bedrooms: property.bedrooms, bathrooms: property.bathrooms,
        city: property.city, district: property.district, propertyType: property.propertyType,
        images: property.images, description: property.description, features: property.features,
        score: percentage, details, rawScore,
      };
    } catch (err) {
      console.error(`Skipping property ${property.id} — scoring error:`, err.message);
      return null;
    }
  }).filter(Boolean).filter(r => r.score > 0).sort((a, b) => b.score - a.score);
}

export async function findMatchingClients(propertyId) {
  const propResult = await pool.query('SELECT * FROM properties WHERE id = $1', [propertyId]);
  if (propResult.rows.length === 0) throw new Error('Property not found');
  const property = parsePropertyRow(propResult.rows[0]);
  const refusedResult = await pool.query('SELECT client_id FROM refused_matches WHERE property_id = $1', [propertyId]);
  const refusedIds = new Set(refusedResult.rows.map(r => String(r.client_id)));
  const isRental = ['location_ld', 'location_saisonniere'].includes(property.transactionType);
  const clientType = isRental ? 'Locataire' : 'Acheteur';
  const clientResult = await pool.query(`SELECT * FROM owner_clients WHERE client_type = $1 AND (status IS NULL OR status = '' OR status = 'Actif')`, [clientType]);
  return clientResult.rows.filter(row => !refusedIds.has(String(row.id))).map(row => {
    try {
      const buyer = buildBuyerFromRow(row);
      const { percentage, details } = scoreProperty(buyer, property);
      const data = row.data || {};
      const name = data.name || ((row.first_name || '') + ' ' + (row.last_name || '')).trim() || 'Client';
      return {
        clientId: String(row.id),
        name,
        email: row.email || '',
        phone: row.phone || '',
        score: percentage,
        details,
        budget: data.budget || data.prixMax || 0,
        minSurface: data.minSurface || data.surfaceMin || 0,
        surfaceMax: data.surfaceMax || 0,
        pieces: data.pieces || 0,
        chambres: data.chambres || 0,
        secteur: data.secteur || '',
        area: data.area || '',
        criteres: data.criteres || [],
        prestations: data.prestations || null,
        proximites: data.proximites || null,
        attributsPersonnalises: data.attributsPersonnalises || [],
        type: clientType,
      };
    } catch (err) {
      console.error(`Skipping client ${row.id} (${row.first_name} ${row.last_name}) — scoring error:`, err.message);
      return null;
    }
  }).filter(Boolean).sort((a, b) => b.score - a.score);
}
