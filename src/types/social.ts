export type SocialPlatform = 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'threads' | 'bluesky' | 'pinterest' | 'youtube' | 'tiktok' | 'mastodon';

export type SharingMode = 'manual' | 'scheduled';
export type ShareStatus = 'published' | 'pending' | 'scheduled' | 'failed' | 'draft';
export type ConnectionStatus = 'connected' | 'disconnected' | 'error';

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  label: string;
  avatar?: string;
  connected: boolean;
  status: ConnectionStatus;
  profileName?: string;
  profileId?: string;
}

export interface PostTemplate {
  platform: SocialPlatform;
  text: string;
  images?: string[];
}

export interface SocialPost {
  id: string;
  propertyId: string;
  platform: SocialPlatform;
  text: string;
  images?: string[];
  status: ShareStatus;
  scheduledAt?: string;
  publishedAt?: string;
  mode: SharingMode;
  clicks?: number;
  impressions?: number;
  likes?: number;
  shares?: number;
  link?: string;
}

export interface SocialShareConfig {
  autoPublish: boolean;
  schedulePublish: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
  selectedPlatforms: SocialPlatform[];
  templates: PostTemplate[];
}

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  twitter: 'X (Twitter)',
  threads: 'Threads',
  bluesky: 'Bluesky',
  pinterest: 'Pinterest',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  mastodon: 'Mastodon',
};

export const SOCIAL_PLATFORM_COLORS: Record<SocialPlatform, string> = {
  facebook: 'text-blue-600',
  instagram: 'text-pink-600',
  linkedin: 'text-blue-700',
  twitter: 'text-sky-500',
  threads: 'text-black',
  bluesky: 'text-sky-500',
  pinterest: 'text-red-600',
  youtube: 'text-red-600',
  tiktok: 'text-black',
  mastodon: 'text-purple-600',
};

export const SOCIAL_PLATFORM_BG: Record<SocialPlatform, string> = {
  facebook: 'bg-blue-50',
  instagram: 'bg-pink-50',
  linkedin: 'bg-blue-50',
  twitter: 'bg-sky-50',
  threads: 'bg-gray-100',
  bluesky: 'bg-sky-50',
  pinterest: 'bg-red-50',
  youtube: 'bg-red-50',
  tiktok: 'bg-gray-100',
  mastodon: 'bg-purple-50',
};

export const DEFAULT_FACEBOOK_TEMPLATE = `🏠 {{bien.titre}} - {{bien.ville}}, {{bien.quartier}}

✨ {{bien.description}}

💰 Prix : {{bien.prix}} MAD

📐 {{bien.surface}} m² · {{bien.pieces}} pièces · {{bien.chambres}} chambres · {{bien.sdb}} sdb
🌳 Terrain : {{bien.terrain}} m²

🏷️ Prestations :
{{bien.prestations}}

📲 Contactez-nous pour une visite :
📞 {{agent.telephone}}
📧 {{agent.email}}
🌐 {{agence.site}}

#Immobilier #{{bien.ville}} #Vente #RealEstate`;

export const DEFAULT_INSTAGRAM_TEMPLATE = `✨ {{bien.titre}} - {{bien.ville}}, {{bien.quartier}}

{{bien.description_courte}}

📍 {{bien.ville}}, {{bien.quartier}}
💰 {{bien.prix}} MAD
📐 {{bien.surface}} m² · {{bien.pieces}} pièces · {{bien.chambres}} chambres
🏷️ {{bien.prestations_courtes}}

📲 Contactez-nous pour plus d'infos !
🔗 Lien en bio

#Immobilier #{{bien.ville}} #Vente #Luxe #RealEstate {{agence.hashtag}}`;

export const DEFAULT_LINKEDIN_TEMPLATE = `🏠 {{bien.titre}} - {{bien.ville}}, {{bien.quartier}}

📊 {{bien.description}}

📍 Localisation : {{bien.ville}}, {{bien.quartier}}
💰 Prix : {{bien.prix}} MAD
📐 Surface : {{bien.surface}} m² · {{bien.pieces}} pièces · {{bien.chambres}} chambres · {{bien.sdb}} sdb
🌳 Terrain : {{bien.terrain}} m²

🏷️ Prestations :
{{bien.prestations_liste}}

📈 {{bien.potentiel}}

📲 Contactez notre équipe pour une visite privée :
📞 {{agent.telephone}}
📧 {{agent.email}}
🌐 {{agence.site}}

#Immobilier #{{bien.ville}} #Investissement #Vente #Luxe #RealEstate`;

export const TEMPLATE_VARIABLES = [
  { variable: '{{bien.titre}}', description: 'Titre du bien' },
  { variable: '{{bien.ville}}', description: 'Ville' },
  { variable: '{{bien.quartier}}', description: 'Quartier' },
  { variable: '{{bien.prix}}', description: 'Prix' },
  { variable: '{{bien.surface}}', description: 'Surface en m²' },
  { variable: '{{bien.pieces}}', description: 'Nombre de pièces' },
  { variable: '{{bien.chambres}}', description: 'Nombre de chambres' },
  { variable: '{{bien.sdb}}', description: 'Nombre de salles de bain' },
  { variable: '{{bien.terrain}}', description: 'Surface du terrain' },
  { variable: '{{bien.prestations}}', description: 'Liste des prestations' },
  { variable: '{{bien.prestations_courtes}}', description: 'Prestations clés (courtes)' },
  { variable: '{{bien.prestations_liste}}', description: 'Liste des prestations (format •)' },
  { variable: '{{bien.description}}', description: 'Description complète' },
  { variable: '{{bien.description_courte}}', description: 'Description courte (1 ligne)' },
  { variable: '{{bien.potentiel}}', description: "Phrase sur le potentiel d'investissement" },
  { variable: '{{agent.nom}}', description: "Nom de l'agent" },
  { variable: '{{agent.telephone}}', description: "Téléphone de l'agent" },
  { variable: '{{agent.email}}', description: "Email de l'agent" },
  { variable: '{{agence.nom}}', description: "Nom de l'agence" },
  { variable: '{{agence.site}}', description: "Site web de l'agence" },
  { variable: '{{agence.hashtag}}', description: "Hashtag de l'agence" },
];
