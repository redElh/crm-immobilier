export type AutomatorCategorie = 'calendrier' | 'prospects' | 'contrats' | 'extranet' | 'contacts'
export type AutomatorNiveau = 'entreprise' | 'agence' | 'utilisateur'
export type NotificationCanal = 'email' | 'sms' | 'push' | 'application_mobile'
export type LogStatut = 'succes' | 'echec' | 'en_attente'

export interface AutomatorModele {
  id: number
  nom: string
  description: string
  categorie: AutomatorCategorie
  evenementType: string
  variablesDisponibles: string[]
  icone: string
}

export interface AutomatorNotification {
  id: number
  automatorId: number
  canal: NotificationCanal
  actif: boolean
  langue: string
  objetTemplate?: string
  messageTemplate: string
  destinataires: string[]
}

export interface AutomatorLog {
  id: number
  automatorId: number
  evenement: string
  destinataire: string
  statut: LogStatut
  messageErreur?: string
  executeLe: string
  contenu?: string
}

export interface Automator {
  id: number
  modeleId: number
  niveau: AutomatorNiveau
  niveauLabel: string
  nomPersonnalise?: string
  createdBy: string
  actif: boolean
  frequence: string
  derniereExecution?: string
  notifications: AutomatorNotification[]
  createdAt: string
}

export const CATEGORIE_LABELS: Record<AutomatorCategorie, string> = {
  calendrier: 'Calendrier',
  prospects: 'Prospects',
  contrats: 'Contrats',
  extranet: 'Extranet',
  contacts: 'Contacts',
}

export const CATEGORIE_ICONES: Record<AutomatorCategorie, string> = {
  calendrier: 'calendar',
  prospects: 'crosshair',
  contrats: 'file-text',
  extranet: 'globe',
  contacts: 'users',
}

export const mockModeles: AutomatorModele[] = [
  { id: 1, nom: 'Rappel de rendez-vous utilisateur 1 heure avant', description: 'Envoi automatique d\'un message de rappel de rendez-vous à l\'agent 1 heure avant', categorie: 'calendrier', evenementType: 'rendez_vous_agent', variablesDisponibles: ['_target.contact.firstname', '_target.start_at', '_target.subject', '_target.property.address'], icone: 'calendar' },
  { id: 2, nom: 'Rappel de rendez-vous contact 1 heure avant', description: 'Envoi automatique d\'un message de rappel de rendez-vous au client 1 heure avant', categorie: 'calendrier', evenementType: 'rendez_vous_contact', variablesDisponibles: ['_target.contact.firstname', '_target.start_at', '_target.subject', '_target.property.address'], icone: 'calendar' },
  { id: 3, nom: 'Nouveau lead entrant', description: 'Notification automatique lors de l\'arrivée d\'un nouveau lead', categorie: 'prospects', evenementType: 'lead_entrant', variablesDisponibles: ['_target.prospect.nom', '_target.prospect.email', '_target.prospect.origine'], icone: 'crosshair' },
  { id: 4, nom: 'Assignation de lead', description: 'Notification à l\'agent assigné à un lead', categorie: 'prospects', evenementType: 'lead_assigne', variablesDisponibles: ['_target.prospect.nom', '_target.agent.nom', '_target.prospect.type_interet'], icone: 'crosshair' },
  { id: 5, nom: 'Remerciement vente d\'un bien', description: 'Message au vendeur suite à la vente d\'un bien', categorie: 'contrats', evenementType: 'vente_finalisee', variablesDisponibles: ['_target.vendeur.nom', '_target.produit.titre', '_target.prix_vente'], icone: 'file-text' },
  { id: 6, nom: 'Remerciement pour l\'achat/location', description: 'Message à l\'acheteur/locataire suite à la transaction', categorie: 'contrats', evenementType: 'achat_finalise', variablesDisponibles: ['_target.acheteur.nom', '_target.produit.titre', '_target.prix'], icone: 'file-text' },
  { id: 7, nom: 'Remerciement prise de mandat', description: 'Message au propriétaire suite à la signature d\'un mandat', categorie: 'contrats', evenementType: 'mandat_signe', variablesDisponibles: ['_target.proprietaire.nom', '_target.produit.titre', '_target.type_mandat'], icone: 'file-text' },
  { id: 8, nom: 'Alerte fin période de réflexion', description: 'Avertissement 24h avant la fin du délai légal', categorie: 'contrats', evenementType: 'fin_periode_reflexion', variablesDisponibles: ['_target.contact.nom', '_target.produit.titre', '_target.date_limite'], icone: 'file-text' },
  { id: 9, nom: 'Identifiants extranet', description: 'Envoi automatique des identifiants aux nouveaux contacts', categorie: 'extranet', evenementType: 'extranet_nouveau_compte', variablesDisponibles: ['_target.contact.nom', '_target.email', '_target.mot_de_passe_temporaire', '_target.lien_connexion'], icone: 'globe' },
  { id: 10, nom: 'Nouvelle action extranet', description: 'Notification lors d\'un nouveau document sur l\'espace client', categorie: 'extranet', evenementType: 'extranet_nouvelle_action', variablesDisponibles: ['_target.contact.nom', '_target.action_type'], icone: 'globe' },
  { id: 11, nom: 'Souhaiter l\'anniversaire', description: 'Message automatique le jour de l\'anniversaire du contact', categorie: 'contacts', evenementType: 'anniversaire', variablesDisponibles: ['_target.contact.prenom', '_target.contact.age'], icone: 'users' },
]

const modelesForMock = mockModeles

export const mockAutomators: Automator[] = [
  {
    id: 8373, modeleId: 1, niveau: 'agence', niveauLabel: 'Square Meter', createdBy: 'Myriam ABABOU', actif: true, frequence: '1 heure',
    derniereExecution: '2026-06-12T09:30:15', createdAt: '2026-01-15',
    notifications: [
      { id: 1, automatorId: 8373, canal: 'email', actif: true, langue: 'fr', objetTemplate: 'Rappel de rendez-vous avec {{_target.contact.firstname}} le {{_target.start_at|date("d/m/Y")}}', messageTemplate: 'Bonjour,\n\nVotre rendez-vous avec {{_target.contact.firstname}} a lieu le {{_target.start_at|date("d/m/Y")}} à {{_target.start_at|date("H:i")}}.\n\nAdresse : {{_target.property.address}}\n\nCordialement,\nL\'équipe Square Meter', destinataires: ['agent'] },
      { id: 2, automatorId: 8373, canal: 'sms', actif: true, langue: 'fr', messageTemplate: 'Rappel: RDV le {{_target.start_at|date("d/m/Y")}} à {{_target.start_at|date("H:i")}} - {{_target.property.address}}', destinataires: ['agent'] },
    ],
  },
  {
    id: 8035, modeleId: 9, niveau: 'agence', niveauLabel: 'Square Meter', createdBy: 'Karim Eloui', actif: true, frequence: '1 jour',
    derniereExecution: '2026-06-12T08:00:00', createdAt: '2026-02-01',
    notifications: [
      { id: 3, automatorId: 8035, canal: 'email', actif: true, langue: 'fr', objetTemplate: 'Vos identifiants extranet', messageTemplate: 'Bonjour {{_target.contact.nom}},\n\nVotre espace extranet a été créé.\n\nEmail : {{_target.email}}\nMot de passe temporaire : {{_target.mot_de_passe_temporaire}}\nLien : {{_target.lien_connexion}}\n\nCordialement,\nL\'équipe Square Meter', destinataires: ['contact'] },
    ],
  },
  {
    id: 8034, modeleId: 11, niveau: 'agence', niveauLabel: 'Square Meter', createdBy: 'Y. AATIC', actif: true, frequence: '1 jour',
    derniereExecution: '2026-06-12T08:00:00', createdAt: '2026-03-10',
    notifications: [
      { id: 4, automatorId: 8034, canal: 'email', actif: true, langue: 'fr', objetTemplate: 'Joyeux anniversaire {{_target.contact.prenom}} !', messageTemplate: 'Bonjour {{_target.contact.prenom}},\n\nToute l\'équipe Square Meter vous souhaite un joyeux {{_target.contact.age}}ème anniversaire !\n\nCordialement,\nL\'équipe Square Meter', destinataires: ['contact'] },
      { id: 5, automatorId: 8034, canal: 'sms', actif: true, langue: 'fr', messageTemplate: 'Joyeux anniversaire {{_target.contact.prenom}} ! - Square Meter', destinataires: ['contact'] },
    ],
  },
  {
    id: 8040, modeleId: 3, niveau: 'agence', niveauLabel: 'Square Meter', createdBy: 'Myriam ABABOU', actif: false, frequence: 'Immédiat',
    derniereExecution: '2026-05-28T14:22:10', createdAt: '2026-04-05',
    notifications: [
      { id: 6, automatorId: 8040, canal: 'email', actif: true, langue: 'fr', objetTemplate: 'Nouveau lead : {{_target.prospect.nom}}', messageTemplate: 'Bonjour,\n\nUn nouveau lead est arrivé :\n\nNom : {{_target.prospect.nom}}\nEmail : {{_target.prospect.email}}\nOrigine : {{_target.prospect.origine}}\n\nCordialement,\nL\'équipe Square Meter', destinataires: ['agent'] },
    ],
  },
]

export const mockLogs: AutomatorLog[] = [
  { id: 1, automatorId: 8373, evenement: 'RDV client Martin', destinataire: 'Jean Martin', statut: 'succes', executeLe: '2026-06-12T09:30:15', contenu: 'Email: jean.martin@email.com - Succès\nSMS: +212 6 12 34 56 78 - Succès' },
  { id: 2, automatorId: 8373, evenement: 'RDV visite villa', destinataire: 'Myriam ABABOU', statut: 'succes', executeLe: '2026-06-12T14:00:22', contenu: 'Email: myriam@squaremeter.ma - Succès' },
  { id: 3, automatorId: 8373, evenement: 'RDV notaire', destinataire: 'Myriam ABABOU', statut: 'echec', executeLe: '2026-06-11T10:15:03', messageErreur: 'SMTP: Timeout - serveur indisponible', contenu: 'Email: myriam@squaremeter.ma - Échec (Timeout SMTP)' },
  { id: 4, automatorId: 8373, evenement: 'RDV client Dubois', destinataire: 'Karim Eloui', statut: 'succes', executeLe: '2026-06-11T15:45:00', contenu: 'Email: karim@squaremeter.ma - Succès\nSMS: +212 6 98 76 54 32 - Succès' },
  { id: 5, automatorId: 8035, evenement: 'Compte extranet - Hassan El Fassi', destinataire: 'hassan@el-fassi.com', statut: 'succes', executeLe: '2026-06-12T08:00:00', contenu: 'Email: hassan@el-fassi.com - Succès' },
  { id: 6, automatorId: 8035, evenement: 'Compte extranet - Fatima Bennani', destinataire: 'fatima@bennani.com', statut: 'succes', executeLe: '2026-06-12T08:00:00', contenu: 'Email: fatima@bennani.com - Succès' },
  { id: 7, automatorId: 8034, evenement: 'Anniversaire - Pierre Martin', destinataire: 'pierre@martin.com', statut: 'succes', executeLe: '2026-06-12T08:00:00', contenu: 'Email: pierre@martin.com - Succès\nSMS: +33 6 12 34 56 78 - Succès' },
  { id: 8, automatorId: 8040, evenement: 'Lead site web - Sophie Laurent', destinataire: 'dimitri@squaremeter.ma', statut: 'en_attente', executeLe: '2026-05-28T14:22:10', contenu: 'Notification en attente (automator désactivé)' },
]

export const LOG_STATUT_LABELS: Record<LogStatut, string> = {
  succes: 'Succès',
  echec: 'Échec',
  en_attente: 'En attente',
}

export const getModeleById = (id: number) => mockModeles.find(m => m.id === id)
export const getAutomatorLogs = (automatorId: number) => mockLogs.filter(l => l.automatorId === automatorId)
export const getModelesByCategorie = (cat: AutomatorCategorie) => mockModeles.filter(m => m.categorie === cat)
