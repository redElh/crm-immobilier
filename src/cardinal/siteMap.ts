// Cardinal site map (guide Step 4): everything Cardinal is allowed to know.
// Mirrors the agent sidebar 1:1 (Sidebar.tsx groups + labels).
// `path` is the suffix after `/:agentId` (agent shell) or `/admin/:adminId`.
// Nicknames are unique across pages: never reuse one twice.
export interface CardinalPage {
  id: string;
  path: string;
  nicknames: string[];
  roles: Array<'agent' | 'admin' | 'gerant'>;
}

const ALL_ROLES: Array<'agent' | 'admin' | 'gerant'> = ['agent', 'admin', 'gerant'];

export const CARDINAL_PAGES: CardinalPage[] = [
  // Pilotage
  {
    id: 'dashboard',
    path: '',
    nicknames: ['dashboard', 'tableau de bord', 'accueil', 'home'],
    roles: ALL_ROLES,
  },
  {
    id: 'calendar',
    path: 'calendar',
    nicknames: ['calendrier', 'agenda', 'planning', 'rendez-vous', 'rendez vous', 'emplois du temps', 'endrier', 'entreier', 'l endrier', 'l entreier', 'canon prier', 'canon de rien', 'calendendrier', 'calandrier'],
    roles: ALL_ROLES,
  },
  // Business
  {
    id: 'properties',
    path: 'properties',
    nicknames: ['biens', 'propriétés', 'proprietes', 'annonces', 'catalogue', 'biens immobiliers', 'le bien', 'les bien', 'joue'],
    roles: ALL_ROLES,
  },
  {
    id: 'clients',
    path: 'clients',
    nicknames: ['clients', 'carnet de contacts', 'mes clients', 'fichier clients', 'portefeuille client'],
    roles: ALL_ROLES,
  },
  {
    id: 'prospects',
    path: 'prospects',
    nicknames: ['prospects', 'prospection', 'futurs clients', 'potentiels'],
    roles: ALL_ROLES,
  },
  {
    id: 'contacts',
    path: 'contacts',
    nicknames: ['contacts', "carnet d'adresses", 'repertoire', 'répertoire', 'annuaire'],
    roles: ALL_ROLES,
  },
  {
    id: 'contracts',
    path: 'contracts',
    nicknames: ['contrats', 'contracts', 'actes', 'compromis', 'contrats de vente'],
    roles: ALL_ROLES,
  },
  {
    id: 'register',
    path: 'register',
    nicknames: ['registre', 'registre des transactions', 'journal des ventes', 'registre des ventes'],
    roles: ALL_ROLES,
  },
  // Hub & Flux
  {
    id: 'messages',
    path: 'messages',
    nicknames: ['messages', 'messagerie', 'boite mail', 'boîte mail', 'inbox', 'courriers'],
    roles: ALL_ROLES,
  },
  {
    id: 'automator',
    path: 'automator',
    nicknames: ['automator', 'automatisations', 'scenarios', 'scénarios', 'workflows'],
    roles: ALL_ROLES,
  },
  {
    id: 'extranet',
    path: 'extranet',
    nicknames: ['squarepeek', 'extranet', 'vitrine', 'site extranet', 'square peak', 'squirmis', 'squirmi', 'squaremis', 'squarpic', 'squarpique', 'squarpie', 'clair pique', 'claire pique', 'squire clique', 'squire', 'squire pique'],
    roles: ALL_ROLES,
  },
  {
    id: 'conciergerie',
    path: 'conciergerie',
    nicknames: ['conciergerie', 'activités conciergerie', 'activites conciergerie', 'services conciergerie'],
    roles: ALL_ROLES,
  },
  // Ressources
  {
    id: 'documents',
    path: 'documents',
    nicknames: ['documents', 'docs', 'fichiers', 'pieces jointes', 'pièces jointes'],
    roles: ALL_ROLES,
  },
  {
    id: 'library',
    path: 'library',
    nicknames: ['librairie', 'bibliotheque', 'bibliothèque', 'modeles', 'modèles', 'templates', 'libraire', 'la librairie', 'libre erie'],
    roles: ALL_ROLES,
  },
  // Premium
  {
    id: 'toolbox',
    path: 'toolbox',
    nicknames: ['toolbox', 'boite à outils', 'boîte à outils', 'outils', 'simulateurs'],
    roles: ALL_ROLES,
  },
  // Système
  {
    id: 'settings',
    path: 'settings',
    nicknames: ['paramètres', 'parametres', 'réglages', 'reglages', 'préférences', 'preferences', 'configuration'],
    roles: ALL_ROLES,
  },
];
