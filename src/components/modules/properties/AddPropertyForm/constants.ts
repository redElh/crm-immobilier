export const propertyTypeOptions = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison', label: 'Maison' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'garage_parking', label: 'Garage / Parking' },
  { value: 'immeuble', label: 'Immeuble' },
  { value: 'bureau', label: 'Bureau' },
  { value: 'bateau', label: 'Bateau' },
  { value: 'activite_entrepot', label: "Locaux d'activité / Entrepôts" },
  { value: 'cave_box', label: 'Cave / Box' },
];

export const propertyTypeSubTypes: Record<string, { value: string; label: string }[]> = {
  appartement: [
    { value: 'appart_hotel', label: "Appart'hotel" },
    { value: 'appartement', label: 'Appartement' },
    { value: 'appartement_villa', label: 'Appartement villa' },
    { value: 'chambre', label: 'Chambre' },
    { value: 'duplex', label: 'Duplex' },
    { value: 'loft', label: 'Loft' },
    { value: 'maison_village', label: 'Maison de village' },
    { value: 'penthouse', label: 'Penthouse' },
    { value: 'studio', label: 'Studio' },
    { value: 'triplex', label: 'Triplex' },
  ],
  maison: [
    { value: 'maison_village', label: 'Maison de village' },
    { value: 'penthouse', label: 'Penthouse' },
    { value: 'bungalow', label: 'Bungalow' },
    { value: 'chalet', label: 'Chalet' },
    { value: 'chateau', label: 'Château' },
    { value: 'chaumiere', label: 'Chaumière' },
    { value: 'domaine_equestre', label: 'Domaine équestre' },
    { value: 'ferme', label: 'Ferme' },
    { value: 'fermette', label: 'Fermette' },
    { value: 'grange', label: 'Grange' },
    { value: 'haras', label: 'Haras' },
    { value: 'hotel_particulier', label: 'Hôtel particulier' },
    { value: 'maison', label: 'Maison' },
    { value: 'maison_hotes', label: "Maison d'hôtes" },
    { value: 'maison_ville', label: 'Maison de ville' },
    { value: 'maison_jumelee', label: 'Maison jumelée' },
    { value: 'maisonette', label: 'Maisonette' },
    { value: 'manoir', label: 'Manoir' },
    { value: 'mobile_home', label: 'Mobile home' },
    { value: 'moulin', label: 'Moulin' },
    { value: 'palais', label: 'Palais' },
    { value: 'propriete', label: 'Propriété' },
    { value: 'refuge', label: 'Refuge' },
    { value: 'remise', label: 'Remise' },
    { value: 'riad', label: 'Riad' },
    { value: 'ruine', label: 'Ruine' },
    { value: 'villa', label: 'Villa' },
    { value: 'villa_jumelee', label: 'Villa jumelée' },
  ],
  terrain: [
    { value: 'lac', label: 'Lac' },
    { value: 'terrain', label: 'Terrain' },
    { value: 'terrain_agricole', label: 'Terrain agricole' },
    { value: 'terrain_commercial', label: 'Terrain commercial' },
    { value: 'terrain_constructible', label: 'Terrain constructible' },
    { value: 'terrain_inconstructible', label: 'Terrain inconstructible' },
    { value: 'terrain_residentiel', label: 'Terrain résidentiel' },
  ],
  commerce: [
    { value: 'atelier', label: 'Atelier' },
    { value: 'boutique', label: 'Boutique' },
    { value: 'commerce', label: 'Commerce' },
    { value: 'droit_bail', label: 'Droit du bail' },
    { value: 'entreprise', label: 'Entreprise' },
    { value: 'exploitation_agricole', label: 'Exploitation agricole' },
    { value: 'fonds_commerce', label: 'Fonds de commerce' },
    { value: 'gerance', label: 'Gérance' },
    { value: 'hotel', label: 'Hôtel' },
    { value: 'local_commercial', label: 'Local commercial' },
    { value: 'local_fonds_commerce', label: 'Local et fonds de commerce' },
  ],
  garage_parking: [
    { value: 'box', label: 'Box' },
    { value: 'garage', label: 'Garage' },
    { value: 'parking', label: 'Parking' },
  ],
  immeuble: [
    { value: 'hotel_particulier', label: 'Hôtel particulier' },
    { value: 'ensemble_immobilier', label: 'Ensemble immobilier' },
    { value: 'immeuble', label: 'Immeuble' },
  ],
  bureau: [
    { value: 'bureau', label: 'Bureau' },
    { value: 'cabinet', label: 'Cabinet' },
    { value: 'local', label: 'Local' },
  ],
  bateau: [
    { value: 'bateau_moteur', label: 'Bateau à moteur' },
    { value: 'catamaran', label: 'Catamaran' },
    { value: 'peniche', label: 'Péniche' },
    { value: 'place_port', label: 'Place de port' },
    { value: 'voilier', label: 'Voilier' },
    { value: 'yacht', label: 'Yacht' },
  ],
  activite_entrepot: [
    { value: 'remise', label: 'Remise' },
    { value: 'atelier', label: 'Atelier' },
    { value: 'exploitation_agricole', label: 'Exploitation agricole' },
    { value: 'cabinet', label: 'Cabinet' },
    { value: 'local', label: 'Local' },
    { value: 'entrepot', label: 'Entrepôt' },
    { value: 'hangar', label: 'Hangar' },
    { value: 'usine', label: 'Usine' },
  ],
  cave_box: [
    { value: 'cave', label: 'Cave' },
    { value: 'box', label: 'Box' },
  ],
};

export const allPropertyTypes = [
  ...propertyTypeOptions,
  ...Object.values(propertyTypeSubTypes).flat(),
];

export const propertyStates = [
  { value: 'excellent', label: 'Très bon état' },
  { value: 'good', label: 'Bon état' },
  { value: 'average', label: 'État moyen' },
  { value: 'poor', label: 'Mauvais état' }
];

export const transactionTypesResidential = [
  { value: 'vente', label: 'Vente' },
  { value: 'location_ld', label: 'Location longue durée' },
];

export const transactionTypesCommercial = [
  { value: 'vente', label: 'Vente' },
  { value: 'location_ld', label: 'Location' },
];

export const transactionTypesLand = [
  { value: 'vente', label: 'Vente' },
];

export const transactionTypesLuxury = [
  { value: 'vente', label: 'Vente' },
];

export const ownerTypes = [
  { value: 'particulier', label: 'Particulier' },
  { value: 'societe', label: 'Société' }
];

export const exteriorTypes = [
  { value: 'pierre', label: 'Pierre' },
  { value: 'traditionnel', label: 'Traditionnel' },
  { value: 'beldi', label: 'Beldi' },
  { value: 'autre', label: 'Autre' }
];

export const energyTypes = [
  { value: 'gaz', label: 'Gaz' },
  { value: 'bois', label: 'Bois' },
  { value: 'solaire', label: 'Solaire' },
  { value: 'electrique', label: 'Électrique' }
];

export const windowTypes = [
  { value: 'alu', label: 'Alu' },
  { value: 'double', label: 'Double vitrage' },
  { value: 'bois', label: 'Bois' },
  { value: 'simple', label: 'Simple vitrage' },
  { value: 'pvc', label: 'PVC' },
  { value: 'survitrage', label: 'Survitrage' }
];

export const shutterTypes = [
  { value: 'electrique', label: 'Électrique' },
  { value: 'bois', label: 'Bois' },
  { value: 'roulant_manuel', label: 'Roulant manuel' },
  { value: 'aucun', label: 'Aucun' }
];

export const gateTypes = [
  { value: 'automatique', label: 'Automatique' },
  { value: 'manuel', label: 'Manuel' },
  { value: 'fer', label: 'Fer' },
  { value: 'alu', label: 'Alu' },
  { value: 'bois', label: 'Bois' },
  { value: 'aucun', label: 'Aucun' }
];

export const waterSources = [
  { value: 'onep', label: 'ONEP' },
  { value: 'cuve', label: 'Cuve' },
  { value: 'puits', label: 'Puits' },
  { value: 'pompe', label: 'Pompe' }
];

export const heatingModes = [
  { value: 'clim', label: 'Climatisation' },
  { value: 'cheminee', label: 'Cheminée' },
  { value: 'radiateur', label: 'Radiateur' },
  { value: 'sol', label: 'Sol' }
];

export const heatingNatures = [
  { value: 'individuel', label: 'Individuel' },
  { value: 'collectif', label: 'Collectif' },
  { value: 'centrale', label: 'Centrale' },
  { value: 'aucun', label: 'Aucun' }
];

export const locations = [
  { value: 'campagne', label: 'Campagne' },
  { value: 'lotissement', label: 'Lotissement' },
  { value: 'petite_ville', label: 'Petite ville' },
  { value: 'ville', label: 'Ville' },
  { value: 'medina', label: 'Medina' },
  { value: 'commerce', label: 'Zone commerciale' },
  { value: 'aeroport', label: 'Près aéroport' },
  { value: 'plage', label: 'Plage' },
  { value: 'port', label: 'Port' },
  { value: 'ecole', label: 'Près école' }
];

export const interiorStyles = [
  { value: 'moderne', label: 'Moderne' },
  { value: 'traditionnel', label: 'Traditionnel' },
  { value: 'minimalist', label: 'Minimaliste' },
  { value: 'beldi', label: 'Beldi' },
  { value: 'contemporain', label: 'Contemporain' }
];

export const kitchenTypes = [
  { value: 'americaine', label: 'Américaine' },
  { value: 'separee', label: 'Séparée' }
];

export const kitchenStates = [
  { value: 'equipee', label: 'Équipée' },
  { value: 'vide', label: 'Vide' },
  { value: 'amenagee', label: 'Aménagée' }
];

export const dpeClasses = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'G', label: 'G' },
];

export const honorairesTypes = [
  { value: 'inclus', label: 'Inclus dans le prix' },
  { value: 'en_sus', label: 'En sus du prix' },
];

export const proximiteItems = [
  'Aéroport', 'Centre ville', 'Crèche', 'Garderie', 'Golf',
  'Médecin', 'Palais des congrès', 'Piscine publique', 'Port',
  'Supermarché', 'Tram', 'Autoroute', 'Cinéma', 'École primaire',
  'Gare', 'Hôpital/clinique', 'Mer', 'Parc', 'Pistes de ski',
  'Route principale', 'Taxi', 'Université', 'Bus', 'Commerces',
  'École secondaire', 'Gare routière', 'Lac', 'Métro', 'Parking public',
  'Plage', 'Salle de sport', 'Tennis',
];

export const portalPartners = [
  'Arlet(Paper)', 'BabaCasa', 'Bien avec vue', 'Flatway',
  'GoFlint', 'Green-Acres', 'Havelia', 'Immo Gratuit',
  'JamesEdition', 'Kazaki', 'Kyero', 'Ieroiloc',
  'localcommercial', 'LuxuryEstate', 'M2 Square Meter', 'MLS Worldwide',
  'Monbien', 'Mubawab', 'Only-luxury', 'Properstar',
  'StaysCo', 'Superimmo', 'Substainable Real Estate', 'Trovi.co',
  'Vizzit', 'Zefir', 'Zilek',
];

export const etapeOptions = [
  { value: 'en_cours', label: 'En cours' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'termine', label: 'Terminé' },
  { value: 'supprime', label: 'Supprimé' },
];

export const etapeEnAttenteOptions = [
  { value: 'attente_mandat', label: 'Attente mandat' },
  { value: 'mandat_expire', label: 'Mandat expiré' },
  { value: 'sous_offre_reservation', label: 'Sous offre / réservation' },
  { value: 'sous_contrat', label: 'Sous contrat vente/location' },
  { value: 'attente_acte_bail', label: 'Attente acte/bail' },
  { value: 'attente_correction', label: 'Attente correction' },
  { value: 'attente_validation', label: 'Attente validation' },
  { value: 'autre', label: 'Autre' },
];

export const etapeTermineOptions = [
  { value: 'vendu_loue_agence', label: "Vendu/loué par l'agence" },
  { value: 'vendu_loue_proprietaire', label: 'Vendu/loué par le propriétaire' },
  { value: 'vendu_loue_confrere', label: 'Vendu/loué par un confrère' },
  { value: 'retire_agence', label: "Retiré par l'agence" },
  { value: 'retire_proprietaire', label: 'Retiré par le propriétaire' },
  { value: 'vente_location_annulee', label: 'Vente/location annulée' },
  { value: 'autre', label: 'Autre' },
];

export const etapeSupprimeOptions = [
  { value: 'detruire_fiche', label: 'Détruire cette fiche' },
];

export const mandateTypes = [
  { value: 'exclusif', label: 'Exclusif' },
  { value: 'simple', label: 'Simple' },
];

export const mandateGestionTypes = [
  { value: 'gestion', label: 'Mandat de gestion' },
  { value: 'location', label: 'Mandat de location' },
];

export const POSTAL_CODE_CITIES: Record<string, string> = {
  '10000': 'Rabat', '10020': 'Rabat - Agdal', '10030': 'Rabat - Hay Riad', '10040': 'Rabat - Souissi',
  '10050': 'Rabat - Yacoub El Mansour', '10060': 'Rabat - Takaddoum', '10080': 'Rabat - Hassan',
  '11000': 'Salé', '11010': 'Salé - Tabriquet', '11020': 'Salé - La Gare', '11030': 'Salé - Bab Sebta',
  '12000': 'Témara', '12010': 'Témara - Harhoura', '12020': 'Témara - Sidi Yahya',
  '14000': 'Kénitra', '14010': 'Kénitra - Maâmora', '14020': 'Kénitra - Oulad Oujih',
  '17000': 'Tétouan', '17010': 'Tétouan - Saniat Rmel', '17020': 'Tétouan - Oued Lao',
  '18000': 'Chefchaouen',
  '20000': 'Casablanca', '20010': 'Casablanca - Maarif', '20020': 'Casablanca - Derb Ghalef',
  '20030': 'Casablanca - Bourgogne', '20040': 'Casablanca - Gauthier', '20050': 'Casablanca - Racine',
  '20100': 'Casablanca - Anfa', '20110': 'Casablanca - Californie', '20120': 'Casablanca - Belvédère',
  '20130': 'Casablanca - Aïn Sebaâ', '20140': 'Casablanca - Hay Mohammadi', '20150': 'Casablanca - Roches Noires',
  '20160': 'Casablanca - Sidi Othmane', '20180': 'Casablanca - Ben Msik', '20190': 'Casablanca - Sbata',
  '20200': 'Casablanca - Aïn Chock', '20210': 'Casablanca - Hay Hassani', '20220': 'Casablanca - Oulfa',
  '20230': 'Casablanca - Moulay Rachid', '20240': 'Casablanca - Sidi Bernoussi', '20300': 'Casablanca - Bouskoura',
  '20310': 'Casablanca - Nouaceur', '20320': 'Casablanca - Médiouna', '20400': 'Casablanca - Tit Mellil',
  '22000': 'Mohammedia', '22010': 'Mohammedia - Al Qods',
  '23000': 'Béni Mellal', '23010': 'Béni Mellal - Fkih Ben Salah',
  '24000': 'El Jadida', '24010': 'El Jadida - Azemmour', '24020': 'El Jadida - Sidi Bouzid',
  '24200': 'Oualidia',
  '25000': 'Khouribga', '25010': 'Khouribga - Boujniba',
  '26000': 'Settat', '26010': 'Settat - Berrechid',
  '28000': 'Sidi Kacem', '28010': 'Sidi Kacem - Sidi Slimane',
  '30000': 'Fès', '30010': 'Fès - Ville Nouvelle', '30020': 'Fès - Atlas', '30030': 'Fès - Saïss',
  '30100': 'Fès - Fès Médina', '30110': 'Fès - Talaa', '30120': 'Fès - Zouagha',
  '30200': 'Fès - Aïn Kadous', '30210': 'Fès - Bensouda',
  '31000': 'Taounate', '31010': 'Taounate - Kariat Ba Mohamed',
  '33000': 'Sefrou', '33010': 'Sefrou - Imouzzer Kandar',
  '34000': 'Boulemane', '34010': 'Boulemane - Missour',
  '35000': 'Taza', '35010': 'Taza - Oued Amlil', '35020': 'Taza - Aknoul',
  '40000': 'Marrakech', '40010': 'Marrakech - Guéliz', '40020': 'Marrakech - Hivernage',
  '40030': 'Marrakech - Semlalia', '40040': 'Marrakech - Daoudiate', '40050': 'Marrakech - Sidi Youssef Ben Ali',
  '40060': 'Marrakech - Ménara', '40070': 'Marrakech - Targa', '40080': 'Marrakech - Amakhil',
  '40090': 'Marrakech - Massira', '40100': 'Marrakech - Palmeraie', '40110': 'Marrakech - Bab Doukkala',
  '40200': 'Marrakech - Sidi Ghanem', '40210': 'Marrakech - Aït Ourir',
  '42300': 'Ben Guerir',
  '43000': 'Ifrane', '43010': 'Ifrane - Azrou',
  '44000': 'Essaouira',
  '44005': 'Arbaa Ida Ougourd',
  '44075': 'Tidzi',
  '44082': 'Sidi Ahmed Essayeh',
  '44125': 'Sidi Kaouki',
  '44133': 'Ounagha',
  '45000': 'Ouarzazate', '45010': 'Ouarzazate - Skoura', '45020': 'Ouarzazate - Zagora',
  '45200': 'Boumalne Dades',
  '46000': 'Safi', '46010': 'Safi - Jorf', '46020': 'Safi - Chemalia',
  '50000': 'Meknès', '50010': 'Meknès - Hamria', '50020': 'Meknès - Toulal',
  '50030': 'Meknès - Sidi Bouzekri', '50100': 'Meknès - Al Amal',
  '51000': 'Errachidia', '51010': 'Errachidia - Aoufous', '51020': 'Errachidia - Rissani',
  '52000': 'Al Hoceima', '52010': 'Al Hoceima - Imzouren', '52020': 'Al Hoceima - Ajdir',
  '53000': 'Figuig', '53010': 'Figuig - Bouarfa',
  '54000': 'Missour',
  '60000': 'Oujda', '60010': 'Oujda - Hay Al Qods', '60020': 'Oujda - Sidi Yahya',
  '60100': 'Oujda - Angad',
  '62000': 'Nador', '62010': 'Nador - Zaïo', '62020': 'Nador - Taourirt',
  '62200': 'Selouane',
  '63000': 'Guercif', '63010': 'Guercif - Taddart',
  '64000': 'Berkane', '64010': 'Berkane - Ahfir', '64020': 'Berkane - Saïdia',
  '65000': 'Taourirt', '65010': 'Taourirt - El Aioun',
  '66000': 'Jerada', '66010': 'Jerada - Aïn Bni Mathar',
  '67000': 'Oujda (Bouarfa)',
  '68000': 'Bouarfa',
  '70000': 'Béni Mellal (Sud)', '70100': 'Kasba Tadla',
  '72000': 'Khouribga (Nord)',
  '73000': 'Fquih Ben Salah', '73010': 'Fquih Ben Salah - Ouled Ayad',
  '74000': 'Azilal', '74010': 'Azilal - Demnate',
  '80000': 'Agadir', '80010': 'Agadir - Talborjt', '80020': 'Agadir - Anza',
  '80030': 'Agadir - Founty', '80040': 'Agadir - Ben Sergao', '80050': 'Agadir - Aït Melloul',
  '80100': 'Agadir - Dcheira', '80110': 'Agadir - Taghazout', '80120': 'Agadir - Tamraght',
  '80200': 'Agadir - Tikiouine',
  '81000': 'Taroudant', '81010': 'Taroudant - Oulad Berhil', '81020': 'Taroudant - Aït Iaâza',
  '82000': 'Tiznit', '82010': 'Tiznit - Mirleft', '82020': 'Tiznit - Tafraout',
  '83000': 'Tata', '83010': 'Tata - Akka',
  '84000': 'Laâyoune', '84010': 'Laâyoune - Dakhla', '84020': 'Laâyoune - El Marsa',
  '85000': 'Dakhla', '85010': 'Dakhla - Oum Dreyga',
  '86000': 'Smara',
  '90000': 'Tanger', '90010': 'Tanger - Ville Nouvelle', '90020': 'Tanger - Marshan',
  '90030': 'Tanger - Boukhalef', '90040': 'Tanger - Gzenaya', '90050': 'Tanger - Aïn Dalia',
  '90100': 'Tanger - Mghogha', '90110': 'Tanger - Tétouan Road', '90200': 'Tanger - Port',
  '91000': 'Larache', '91010': 'Larache - Ksar El Kébir',
  '92000': 'Asilah',
  '93000': 'Ouezzane',
};

export const CITIES_FROM_POSTAL_CODES = Array.from(new Set(Object.values(POSTAL_CODE_CITIES).map(v => v.split(' - ')[0]))).sort();