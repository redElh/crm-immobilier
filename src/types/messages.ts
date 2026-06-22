export interface MessageParticipant {
  id: string
  name: string
  type: 'client' | 'agent' | 'lead'
}

export interface MessageAttachment {
  id: string
  name: string
  size: string
  url: string
}

export interface Message {
  id: string
  conversationId: string
  sender: MessageParticipant
  recipients: MessageParticipant[]
  body: string
  attachments: MessageAttachment[]
  sentAt: string
  isRead: boolean
  isInternalNote: boolean
}

export interface Conversation {
  id: string
  participants: MessageParticipant[]
  subject: string
  preview: string
  relatedPropertyId?: string
  relatedPropertyTitle?: string
  relatedClientId?: string
  folder: string
  isStarred: boolean
  createdAt: string
  lastActivityAt: string
  messages: Message[]
  unreadCount: number
  createdBy: string
}

export interface MessageFolder {
  id: string
  name: string
  icon: string
  isSystem: boolean
}

export interface MessageTemplate {
  id: string
  name: string
  subject: string
  body: string
  category: string
  lastUpdated: string
}

export interface MessagingSettings {
  signature: string
  notifyOnNewMessage: boolean
  dailyDigest: boolean
  emailNotifications: boolean
  autoReplyEnabled: boolean
  autoReplyMessage: string
  outOfOfficeUntil: string
}

export const FOLDERS: MessageFolder[] = [
  { id: 'inbox', name: 'Boîte de réception', icon: 'Inbox', isSystem: true },
  { id: 'sent', name: 'Envoyés', icon: 'Send', isSystem: true },
  { id: 'drafts', name: 'Brouillons', icon: 'FileText', isSystem: true },
  { id: 'starred', name: 'Importants', icon: 'Star', isSystem: true },
  { id: 'trash', name: 'Corbeille', icon: 'Trash2', isSystem: true },
]

const myriam: MessageParticipant = { id: 'agent-2', name: 'Myriam Ababou', type: 'agent' }
const sophie: MessageParticipant = { id: 'p1', name: 'Pierre Martin', type: 'client' }
const youssef: MessageParticipant = { id: 'p2', name: 'Marie Lambert', type: 'client' }
const ahmed: MessageParticipant = { id: 'p3', name: 'Karim Benali', type: 'client' }
const nadia: MessageParticipant = { id: 'p4', name: 'Hassan El Fassi', type: 'client' }
const leila: MessageParticipant = { id: 'agent-1', name: 'Leila Benbrahim', type: 'agent' }
const marc: MessageParticipant = { id: 'p5', name: 'Fatima Zahra Bennani', type: 'client' }
const thomas: MessageParticipant = { id: 'p6', name: 'Omar Tazi', type: 'client' }
const david: MessageParticipant = { id: 'p7', name: 'David Cohen', type: 'client' }
const nadiaClient: MessageParticipant = { id: 'p8', name: 'Nadia El Fassi', type: 'client' }
const dimitri: MessageParticipant = { id: 'agent-3', name: 'Dimitri Djedje', type: 'agent' }
const hayat: MessageParticipant = { id: 'agent-4', name: 'Hayat Ouakrim', type: 'agent' }

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    participants: [sophie, myriam],
    subject: 'Villa Marrakech #1234',
    preview: 'Mercredi 14h me convient parfaitement. Je confirme ma visite !',
    relatedPropertyId: '1',
    relatedPropertyTitle: 'Villa Marrakech #1234',
    relatedClientId: '1',
    folder: 'inbox',
    isStarred: true,
    createdAt: '2026-06-13T14:30:00Z',
    lastActivityAt: '2026-06-16T09:45:00Z',
    unreadCount: 1,
    createdBy: 'myriam',
    messages: [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        sender: sophie,
        recipients: [myriam],
        body: 'Bonjour, je suis intéressé par la villa à Marrakech. Est-ce qu\'elle est toujours disponible ? Je souhaiterais la visiter.',
        attachments: [],
        sentAt: '2026-06-15T14:32:00Z',
        isRead: true,
        isInternalNote: false,
      },
      {
        id: 'msg-2',
        conversationId: 'conv-1',
        sender: myriam,
        recipients: [sophie],
        body: 'Bonjour Pierre, merci pour votre message. La villa est toujours disponible. Je peux vous proposer une visite mercredi à 14h.\n\nVoici la brochure en pièce jointe.',
        attachments: [
          { id: 'att-1', name: 'brochure_villa_marrakech.pdf', size: '2.4 Mo', url: '#' },
          { id: 'att-2', name: 'plan_acces.pdf', size: '1.2 Mo', url: '#' },
        ],
        sentAt: '2026-06-15T15:00:00Z',
        isRead: true,
        isInternalNote: false,
      },
      {
        id: 'msg-3',
        conversationId: 'conv-1',
        sender: sophie,
        recipients: [myriam],
        body: 'Mercredi 14h me convient parfaitement. Je confirme ma visite ! À mercredi !',
        attachments: [],
        sentAt: '2026-06-16T09:45:00Z',
        isRead: false,
        isInternalNote: false,
      },
    ],
  },
  {
    id: 'conv-2',
    participants: [youssef, myriam],
    subject: 'Mandat signé - Appartement Casablanca',
    preview: 'Le mandat pour l\'appartement à Casablanca a été signé.',
    relatedPropertyId: '2',
    relatedPropertyTitle: 'Appartement Casablanca #5678',
    relatedClientId: '2',
    folder: 'inbox',
    isStarred: false,
    createdAt: '2026-06-12T09:15:00Z',
    lastActivityAt: '2026-06-14T09:15:00Z',
    unreadCount: 0,
    createdBy: 'myriam',
    messages: [
      {
        id: 'msg-4',
        conversationId: 'conv-2',
        sender: youssef,
        recipients: [myriam],
        body: 'Bonjour Myriam,\n\nLe mandat pour l\'appartement à Casablanca a bien été signé. Vous trouverez une copie ci-jointe.\n\nCordialement,\nMarie Lambert',
        attachments: [
          { id: 'att-3', name: 'mandat_signe_casablanca.pdf', size: '1.8 Mo', url: '#' },
        ],
        sentAt: '2026-06-14T09:15:00Z',
        isRead: true,
        isInternalNote: false,
      },
      {
        id: 'msg-5',
        conversationId: 'conv-2',
        sender: myriam,
        recipients: [youssef],
        body: 'Bonjour Marie,\n\nMerci pour l\'envoi. Le mandat est bien reçu et enregistré.\n\nBien cordialement,\nMyriam Ababou',
        attachments: [],
        sentAt: '2026-06-14T10:30:00Z',
        isRead: true,
        isInternalNote: false,
      },
    ],
  },
  {
    id: 'conv-3',
    participants: [ahmed, myriam],
    subject: 'Demande d\'information sur appartement Rabat',
    preview: 'Je souhaiterais avoir plus d\'informations sur l\'appartement.',
    relatedPropertyId: '3',
    relatedPropertyTitle: 'Appartement Rabat #9012',
    relatedClientId: '3',
    folder: 'inbox',
    isStarred: false,
    createdAt: '2026-06-11T16:45:00Z',
    lastActivityAt: '2026-06-13T17:45:00Z',
    unreadCount: 0,
    createdBy: 'myriam',
    messages: [
      {
        id: 'msg-6',
        conversationId: 'conv-3',
        sender: ahmed,
        recipients: [myriam],
        body: 'Bonjour,\n\nJe souhaiterais avoir plus d\'informations sur l\'appartement à Rabat. Est-ce qu\'il est toujours en vente ?\n\nCordialement,\nAhmed Benali',
        attachments: [],
        sentAt: '2026-06-13T16:45:00Z',
        isRead: true,
        isInternalNote: false,
      },
      {
        id: 'msg-7',
        conversationId: 'conv-3',
        sender: myriam,
        recipients: [ahmed],
        body: 'Bonjour Karim,\n\nOui, l\'appartement est toujours disponible. Je vous propose de le visiter cette semaine. Quels sont vos créneaux disponibles ?\n\nBien cordialement,\nMyriam Ababou',
        attachments: [],
        sentAt: '2026-06-13T17:45:00Z',
        isRead: true,
        isInternalNote: false,
      },
    ],
  },
  {
    id: 'conv-4',
    participants: [nadia, myriam],
    subject: 'Mandat de gestion - Résidence Oasis',
    preview: 'Merci pour l\'envoi du mandat de gestion.',
    relatedPropertyId: '4',
    relatedPropertyTitle: 'Résidence Oasis #456',
    relatedClientId: '4',
    folder: 'sent',
    isStarred: false,
    createdAt: '2026-06-10T10:00:00Z',
    lastActivityAt: '2026-06-10T11:00:00Z',
    unreadCount: 0,
    createdBy: 'myriam',
    messages: [
      {
        id: 'msg-8',
        conversationId: 'conv-4',
        sender: myriam,
        recipients: [nadia],
        body: 'Bonjour Hassan,\n\nVeuillez trouver ci-joint le mandat de gestion pour votre résidence à Oasis. Vous pouvez le signer électroniquement.\n\nCordialement,\nMyriam Ababou',
        attachments: [
          { id: 'att-4', name: 'mandat_gestion_oasis.pdf', size: '1.2 Mo', url: '#' },
        ],
        sentAt: '2026-06-10T10:00:00Z',
        isRead: true,
        isInternalNote: false,
      },
      {
        id: 'msg-9',
        conversationId: 'conv-4',
        sender: nadia,
        recipients: [myriam],
        body: 'Bonjour Myriam,\n\nMerci pour l\'envoi. J\'ai bien reçu le mandat de gestion et je le signerai aujourd\'hui.\n\nCordialement,\nHassan El Fassi',
        attachments: [],
        sentAt: '2026-06-10T11:00:00Z',
        isRead: true,
        isInternalNote: false,
      },
    ],
  },
  {
    id: 'conv-5',
    participants: [leila, myriam],
    subject: 'Réunion équipe - Nouveaux outils CRM',
    preview: 'On se fait une réunion demain pour discuter des nouveaux modules ?',
    folder: 'inbox',
    isStarred: true,
    createdAt: '2026-06-09T08:00:00Z',
    lastActivityAt: '2026-06-09T09:30:00Z',
    unreadCount: 0,
    createdBy: 'leila',
    messages: [
      {
        id: 'msg-10',
        conversationId: 'conv-5',
        sender: leila,
        recipients: [myriam],
        body: 'Salut Myriam,\n\nOn se fait une réunion demain pour discuter des nouveaux modules du CRM ? Je pense qu\'il faut qu\'on fasse un point avant le déploiement.\n\nBonne journée !',
        attachments: [],
        sentAt: '2026-06-09T08:00:00Z',
        isRead: true,
        isInternalNote: false,
      },
      {
        id: 'msg-11',
        conversationId: 'conv-5',
        sender: myriam,
        recipients: [leila],
        body: 'Bonjour Leila,\n\nBonne idée ! Je suis disponible à 10h demain. On peut faire le point sur les contrats et les documents.\n\nÀ demain !',
        attachments: [],
        sentAt: '2026-06-09T09:30:00Z',
        isRead: true,
        isInternalNote: false,
      },
    ],
  },
  {
    id: 'conv-6',
    participants: [marc, myriam],
    subject: 'Proposition - Villa Ghazoua',
    preview: 'Suite à notre échange, voici une proposition pour la villa.',
    relatedPropertyId: '6',
    relatedPropertyTitle: 'Villa Ghazoua',
    relatedClientId: '5',
    folder: 'drafts',
    isStarred: false,
    createdAt: '2026-06-08T14:00:00Z',
    lastActivityAt: '2026-06-08T14:30:00Z',
    unreadCount: 0,
    createdBy: 'myriam',
    messages: [
      {
        id: 'msg-12',
        conversationId: 'conv-6',
        sender: marc,
        recipients: [myriam],
        body: 'Bonjour Myriam,\n\nSuite à notre échange téléphonique, pourriez-vous m\'envoyer une proposition pour la villa Ghazoua ?\n\nCordialement,\nFatima Zahra Bennani',
        attachments: [],
        sentAt: '2026-06-08T14:00:00Z',
        isRead: true,
        isInternalNote: false,
      },
    ],
  },
  {
    id: 'conv-7',
    participants: [thomas, myriam],
    subject: 'Réservation Appartement Agadir',
    preview: 'Je confirme ma réservation pour le séjour à Agadir.',
    relatedPropertyId: '4',
    relatedPropertyTitle: 'Appartement front de mer - Agadir',
    relatedClientId: '6',
    folder: 'starred',
    isStarred: true,
    createdAt: '2026-06-05T10:00:00Z',
    lastActivityAt: '2026-06-05T11:00:00Z',
    unreadCount: 0,
    createdBy: 'myriam',
    messages: [
      {
        id: 'msg-13',
        conversationId: 'conv-7',
        sender: thomas,
        recipients: [myriam],
        body: 'Bonjour Myriam,\n\nJe confirme ma réservation pour le séjour à Agadir du 15 au 22 juillet. Merci pour votre accompagnement.\n\nCordialement,\nOmar Tazi',
        attachments: [],
        sentAt: '2026-06-05T10:00:00Z',
        isRead: true,
        isInternalNote: false,
      },
    ],
  },
  {
    id: 'conv-8',
    participants: [david, dimitri],
    subject: 'Achat appartement - Résidence Alia',
    preview: 'Suite à la visite, je suis très intéressé par l\'appartement.',
    relatedPropertyId: '5',
    relatedPropertyTitle: 'Appartement Résidence Alia',
    relatedClientId: '7',
    folder: 'inbox',
    isStarred: false,
    createdAt: '2026-06-14T11:00:00Z',
    lastActivityAt: '2026-06-16T08:30:00Z',
    unreadCount: 2,
    createdBy: 'dimitri',
    messages: [
      {
        id: 'msg-14',
        conversationId: 'conv-8',
        sender: david,
        recipients: [dimitri],
        body: 'Bonjour Dimitri,\n\nSuite à la visite de l\'appartement à la Résidence Alia, je suis très intéressé. Pourriez-vous m\'envoyer les documents nécessaires pour faire une offre ?\n\nCordialement,\nDavid Cohen',
        attachments: [],
        sentAt: '2026-06-16T08:00:00Z',
        isRead: false,
        isInternalNote: false,
      },
      {
        id: 'msg-15',
        conversationId: 'conv-8',
        sender: david,
        recipients: [dimitri],
        body: 'Auriez-vous également le DPE et le règlement de copropriété ?',
        attachments: [],
        sentAt: '2026-06-16T08:30:00Z',
        isRead: false,
        isInternalNote: false,
      },
    ],
  },
  {
    id: 'conv-9',
    participants: [nadiaClient, hayat],
    subject: 'Location saisonnière - Appartement Agadir',
    preview: 'Merci pour les disponibilités, je réserve du 15 au 22 août.',
    relatedPropertyId: '4',
    relatedPropertyTitle: 'Appartement front de mer - Agadir',
    relatedClientId: '8',
    folder: 'inbox',
    isStarred: true,
    createdAt: '2026-06-15T14:00:00Z',
    lastActivityAt: '2026-06-17T10:00:00Z',
    unreadCount: 1,
    createdBy: 'hayat',
    messages: [
      {
        id: 'msg-16',
        conversationId: 'conv-9',
        sender: nadiaClient,
        recipients: [hayat],
        body: 'Bonjour Hayat,\n\nMerci pour les disponibilités. Je souhaite réserver l\'appartement du 15 au 22 août. Est-ce toujours libre ?\n\nCordialement,\nNadia El Fassi',
        attachments: [],
        sentAt: '2026-06-17T09:00:00Z',
        isRead: false,
        isInternalNote: false,
      },
      {
        id: 'msg-17',
        conversationId: 'conv-9',
        sender: hayat,
        recipients: [nadiaClient],
        body: 'Bonjour Nadia,\n\nOui, l\'appartement est libre pour ces dates. Je vous envoie le contrat de location et le devis.\n\nBien cordialement,\nHayat Ouakrim',
        attachments: [
          { id: 'att-5', name: 'contrat_location_agadir.pdf', size: '1.5 Mo', url: '#' },
          { id: 'att-6', name: 'devis_sejour_agadir.pdf', size: '0.8 Mo', url: '#' },
        ],
        sentAt: '2026-06-17T10:00:00Z',
        isRead: false,
        isInternalNote: false,
      },
    ],
  },
  {
    id: 'conv-10',
    participants: [myriam, dimitri],
    subject: 'Transmission dossier client - Pierre Martin',
    preview: 'Je te transfère le dossier complet de Pierre Martin.',
    relatedClientId: '1',
    folder: 'sent',
    isStarred: false,
    createdAt: '2026-06-12T08:00:00Z',
    lastActivityAt: '2026-06-12T09:00:00Z',
    unreadCount: 0,
    createdBy: 'myriam',
    messages: [
      {
        id: 'msg-18',
        conversationId: 'conv-10',
        sender: myriam,
        recipients: [dimitri],
        body: 'Bonjour Dimitri,\n\nJe te transfère le dossier de Pierre Martin. Il est intéressé par les appartements à Casablanca.\n\nMerci !',
        attachments: [
          { id: 'att-7', name: 'dossier_pierre_martin.pdf', size: '3.2 Mo', url: '#' },
        ],
        sentAt: '2026-06-12T08:00:00Z',
        isRead: true,
        isInternalNote: false,
      },
      {
        id: 'msg-19',
        conversationId: 'conv-10',
        sender: dimitri,
        recipients: [myriam],
        body: 'Merci Myriam, je vais m\'en occuper. Je le contacte cet après-midi.',
        attachments: [],
        sentAt: '2026-06-12T09:00:00Z',
        isRead: true,
        isInternalNote: false,
      },
    ],
  },
]

export const mockTemplates: MessageTemplate[] = [
  {
    id: 'tmpl-1',
    name: 'Confirmation de visite',
    subject: 'Confirmation de visite - {{bien.titre}}',
    body: 'Bonjour {{client.prenom}},\n\nJe confirme notre rendez-vous pour la visite de {{bien.titre}} le {{date_visite}} à {{heure_visite}}.\n\nJe vous attendrai sur place.\n\nBien cordialement,\n{{agent.prenom}} {{agent.nom}}',
    category: 'Visites',
    lastUpdated: '2026-06-01',
  },
  {
    id: 'tmpl-2',
    name: 'Proposition de biens',
    subject: 'Nouvelles opportunités - {{bien.titre}}',
    body: 'Bonjour {{client.prenom}},\n\nSuite à notre échange, voici une sélection de biens correspondant à vos critères.\n\n{{liste_biens}}\n\nN\'hésitez pas à me contacter pour planifier une visite.\n\nBien cordialement,\n{{agent.prenom}} {{agent.nom}}',
    category: 'Propositions',
    lastUpdated: '2026-05-28',
  },
  {
    id: 'tmpl-3',
    name: 'Relance client',
    subject: 'Suivi de votre projet',
    body: 'Bonjour {{client.prenom}},\n\nJe me permets de revenir vers vous suite à notre dernier échange. Avez-vous eu l\'occasion de réfléchir à notre proposition ?\n\nRestant à votre disposition pour toute question.\n\nBien cordialement,\n{{agent.prenom}} {{agent.nom}}',
    category: 'Suivi',
    lastUpdated: '2026-06-10',
  },
  {
    id: 'tmpl-4',
    name: 'Remerciement mandat',
    subject: 'Remerciement - Signature de mandat',
    body: 'Bonjour {{client.prenom}},\n\nJe vous remercie pour votre confiance. Votre mandat a bien été enregistré.\n\nJe reste à votre entière disposition pour toute question.\n\nBien cordialement,\n{{agent.prenom}} {{agent.nom}}',
    category: 'Mandats',
    lastUpdated: '2026-05-20',
  },
  {
    id: 'tmpl-5',
    name: 'Demande de documents',
    subject: 'Documents nécessaires pour votre dossier',
    body: 'Bonjour {{client.prenom}},\n\nPour compléter votre dossier, je vous remercie de bien vouloir me fournir les documents suivants :\n\n{{liste_documents}}\n\nVous pouvez les déposer directement sur votre espace client.\n\nCordialement,\n{{agent.prenom}} {{agent.nom}}',
    category: 'Suivi',
    lastUpdated: '2026-06-05',
  },
]

export function getUnreadCount(): number {
  return mockConversations
    .filter(c => c.folder === 'inbox')
    .reduce((sum, c) => sum + c.unreadCount, 0)
}

export function getClientConversations(clientId: string): Conversation[] {
  return mockConversations.filter(c =>
    c.relatedClientId === clientId
  )
}

export const defaultSettings: MessagingSettings = {
  signature: 'Bien cordialement,\n\nMyriam Ababou\nAgent immobilier - M2 Square Meter\nTél: +212 6 12 34 56 78\nEmail: myriam@squaremeter.com',
  notifyOnNewMessage: true,
  dailyDigest: false,
  emailNotifications: false,
  autoReplyEnabled: false,
  autoReplyMessage: 'Je suis actuellement absent(e) jusqu\'au [__/__/____]. Je vous répondrai à mon retour. Pour toute urgence, contactez l\'agence au +212 6 12 34 56 78.',
  outOfOfficeUntil: '',
}
