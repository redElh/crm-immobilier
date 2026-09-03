export type LibraryCategoryKey = 'vente' | 'location' | 'baux' | 'interne' | 'avenants'

export type LibraryDocType = 'mandat' | 'bail' | 'contrat' | 'avenant' | 'document'

export type LibraryLang = 'fr' | 'en' | 'es' | 'de' | 'it'

export interface LibraryCategory {
  key: LibraryCategoryKey
  label: string
  color: string
}

export interface LibraryLanguage {
  code: LibraryLang
  label: string
  nativeLabel: string
}

export interface LibraryTemplate {
  id: string
  name: string
  description: string
  category: LibraryCategoryKey
  type: LibraryDocType
  languages: LibraryLang[]
  fileName?: string
  languageFiles?: Partial<Record<LibraryLang, string>>
  updatedAt: string
  baseDownloads: number
  custom?: boolean
}

export const LIBRARY_CATEGORIES: Record<LibraryCategoryKey, LibraryCategory> = {
  vente: { key: 'vente', label: 'Contrats - Vente', color: '#E74C3C' },
  location: { key: 'location', label: 'Contrats - Location', color: '#3498DB' },
  baux: { key: 'baux', label: 'Baux', color: '#2ECC71' },
  interne: { key: 'interne', label: 'Contrats - Interne', color: '#9B59B6' },
  avenants: { key: 'avenants', label: 'Avenants & Autres', color: '#F39C12' },
}

export const LIBRARY_CATEGORY_ORDER: LibraryCategoryKey[] = ['location', 'baux', 'interne']

export const LIBRARY_LANGUAGES: Record<LibraryLang, LibraryLanguage> = {
  fr: { code: 'fr', label: 'Français', nativeLabel: 'Français' },
  en: { code: 'en', label: 'Anglais', nativeLabel: 'English' },
  es: { code: 'es', label: 'Espagnol', nativeLabel: 'Español' },
  de: { code: 'de', label: 'Allemand', nativeLabel: 'Deutsch' },
  it: { code: 'it', label: 'Italien', nativeLabel: 'Italiano' },
}

export const LIBRARY_ALL_LANGS: LibraryLang[] = ['fr', 'en', 'es', 'de', 'it']

export const LIBRARY_TYPE_LABELS: Record<LibraryDocType, string> = {
  mandat: 'Mandat',
  bail: 'Bail',
  contrat: 'Contrat',
  avenant: 'Avenant',
  document: 'Document',
}

const ALL_LANGS: LibraryLang[] = ['fr', 'en', 'es', 'de', 'it']
const TEMPLATES_PATH = '/templates/'

export const LIBRARY_TEMPLATES: LibraryTemplate[] = [
  {
    id: 'mandat-location-saisonniere',
    name: 'Mandat de location saisonnière',
    description: 'Mandat de gestion locative saisonnière pour les locations de courte durée.',
    category: 'location',
    type: 'mandat',
    languages: ALL_LANGS,
    fileName: 'SQUARE_METER_template_Mandat_Location_Saisonniere.pdf',
    languageFiles: {
      en: 'langues/mandat-location-saisonniere/Mandat_Location_Saisonniere_EN.pdf',
      es: 'langues/mandat-location-saisonniere/Mandat_Location_Saisonniere_ES.pdf',
      de: 'langues/mandat-location-saisonniere/Mandat_Location_Saisonniere_DE.pdf',
      it: 'langues/mandat-location-saisonniere/Mandat_Location_Saisonniere_IT.pdf',
    },
    updatedAt: '2026-08-21',
    baseDownloads: 22,
  },
  {
    id: 'bail-habitation-1-an',
    name: "Bail d'habitation - 1 an",
    description: "Contrat de bail d'habitation d'une durée d'un an (bail mobilité ou location vide).",
    category: 'baux',
    type: 'bail',
    languages: ALL_LANGS,
    fileName: 'SQUARE_METER_template_Bail_Habitation_1_An.pdf',
    languageFiles: {
      en: 'langues/bail-habitation-1-an/Bail_Habitation_1_An_EN.pdf',
      es: 'langues/bail-habitation-1-an/Bail_Habitation_1_An_ES.pdf',
      de: 'langues/bail-habitation-1-an/Bail_Habitation_1_An_DE.pdf',
      it: 'langues/bail-habitation-1-an/Bail_Habitation_1_An_IT.pdf',
    },
    updatedAt: '2026-08-21',
    baseDownloads: 18,
  },
  {
    id: 'bail-habitation-3-ans',
    name: "Bail d'habitation - 3 ans",
    description: "Contrat de bail d'habitation d'une durée de trois ans pour location non meublée.",
    category: 'baux',
    type: 'bail',
    languages: ALL_LANGS,
    fileName: 'SQUARE_METER_template_Bail_Habitation_3_Ans.pdf',
    languageFiles: {
      en: 'langues/bail-habitation-3-ans/Bail_Habitation_3_Ans_EN.pdf',
      es: 'langues/bail-habitation-3-ans/Bail_Habitation_3_Ans_ES.pdf',
      de: 'langues/bail-habitation-3-ans/Bail_Habitation_3_Ans_DE.pdf',
      it: 'langues/bail-habitation-3-ans/Bail_Habitation_3_Ans_IT.pdf',
    },
    updatedAt: '2026-08-21',
    baseDownloads: 12,
  },
  {
    id: 'contrat-agent-longue-duree',
    name: 'Contrat Agent Commercial - Longue Durée',
    description: "Contrat agent commercial - Gestion longue durée (relation contractuelle interne).",
    category: 'interne',
    type: 'contrat',
    languages: ALL_LANGS,
    fileName: 'SQUARE_METER_template_Contrat_Agent_Commercial_Gestion_Longue_Duree.pdf',
    updatedAt: '2026-08-21',
    baseDownloads: 8,
  },
  {
    id: 'contrat-agent-courte-duree',
    name: 'Contrat Agent Commercial - Courte Durée',
    description: "Contrat agent commercial - Gestion courte durée (relation contractuelle interne).",
    category: 'interne',
    type: 'contrat',
    languages: ALL_LANGS,
    fileName: 'SQUARE_METER_template_Contrat_Agent_Commercial_Gestion_Courte_Duree.pdf',
    updatedAt: '2026-08-21',
    baseDownloads: 5,
  },
]

export function templateFileUrl(template: LibraryTemplate, lang?: LibraryLang | null): string | null {
  if (lang && lang !== 'fr' && template.languageFiles?.[lang]) {
    return `${TEMPLATES_PATH}${template.languageFiles[lang]!.split('/').map(encodeURIComponent).join('/')}`
  }
  if (!template.fileName) return null
  return `${TEMPLATES_PATH}${template.fileName.split('/').map(encodeURIComponent).join('/')}`
}

export function templateHasFile(template: LibraryTemplate, lang?: LibraryLang | null): boolean {
  return Boolean((lang && lang !== 'fr' ? template.languageFiles?.[lang] : null) ?? template.fileName)
}
