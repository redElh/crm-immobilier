import { CARDINAL_PAGES, type CardinalPage } from './siteMap';

// Guide Step 8: the fast path. Plain code, no AI model.
// normalize -> find action word -> loose-match target -> decide by score.

export function normalizeFr(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const FILLER = [
  "s il te plait",
  's il vous plait',
  'stp',
  'merci',
  'peux tu',
  'pourrais tu',
  'pourriez vous',
  'tu peux',
  'je veux',
  'je vais',
  'je voudrais',
  'j aimerais',
  'je souhaite',
  'montre moi',
  'montrez moi',
  'cardinal',
];

// Bare polite pronouns ("vous", "tu"...) carry no meaning but match
// multi-word nicknames ("rendez vous" hit 0.5 on "je vous squirmis" and
// wrongly proposed the calendar). Drop them from longer sentences — a
// two-word "rendez vous" keeps its "vous" and still matches exactly.
const PRONOUNS = ['vous', 'tu', 'toi', 'votre', 'vos', 'nous'];

export function cleanSentence(raw: string): string {
  let s = ` ${normalizeFr(raw)} `;
  [...FILLER]
    .sort((a, b) => b.length - a.length)
    .forEach((f) => {
      s = s.split(` ${f} `).join(' ');
    });
  s = s.replace(/\s+/g, ' ').trim();
  let tokens = s.split(' ');
  // Corrections ("Non, je veux le calendrier") address the rest, not the no.
  if (tokens.length > 1 && tokens[0] === 'non') tokens = tokens.slice(1);
  if (tokens.length > 2) {
    return tokens.filter((t) => !PRONOUNS.includes(t)).join(' ');
  }
  return tokens.join(' ');
}

const GO_WORDS = ['va', 'vas', 'aller', 'allez', 'allons', 'emmene', 'emmenons', 'emmenez', 'ouvre', 'ouvrez', 'ouvrir', 'navigue'];
const BACK_WORDS = ['retour', 'retourne', 'retourner', 'reviens', 'revenir', 'arriere', 'precedent'];
const CLOSE_WORDS = ['ferme', 'fermez', 'fermer', 'close'];

function hasWord(cleaned: string, words: string[]): boolean {
  const tokens = new Set(cleaned.split(' '));
  return words.some((w) => tokens.has(w));
}

function editDist(a: string, b: string, cap: number): number {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let cur = i;
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(prev[j] + 1, cur + 1, prev[j - 1] + cost);
      prev[j - 1] = cur;
      cur = v;
      if (v < rowMin) rowMin = v;
    }
    prev[b.length] = cur;
    if (rowMin > cap) return cap + 1;
  }
  return prev[b.length];
}

// STT wobble tolerance: "dashbourd" must still match "dashboard", and a
// dropped plural ("bien" for "biens") must still match.
function tokensClose(a: string, b: string): number {
  if (a === b) return 1;
  const m = Math.min(a.length, b.length);
  const cap = m >= 8 ? 2 : m >= 4 ? 1 : 0;
  if (cap === 0) return 0;
  return editDist(a, b, cap) <= cap ? 0.9 : 0;
}

function nicknameScore(cleaned: string, nickname: string): number {
  const nick = normalizeFr(nickname);
  if (!nick) return 0;
  // Whole-word containment only: "biens" must not match a bare "bien".
  if (` ${cleaned} `.includes(` ${nick} `)) return 1;
  const cleanedTokens = cleaned.split(' ');
  const nickTokens = nick.split(' ');
  let s = 0;
  nickTokens.forEach((n) => {
    let best = 0;
    cleanedTokens.forEach((c) => {
      const v = tokensClose(c, n);
      if (v > best) best = v;
    });
    s += best;
  });
  return s / nickTokens.length;
}

export interface PageScore {
  page: CardinalPage;
  score: number;
}

export function scorePages(cleaned: string, pages: CardinalPage[]): PageScore[] {
  return pages
    .map((page) => ({
      page,
      score: Math.max(0, ...page.nicknames.map((n) => nicknameScore(cleaned, n))),
    }))
    .sort((x, y) => y.score - x.score);
}

export type Decision =
  | { kind: 'go'; page: CardinalPage; score: number }
  | { kind: 'back' }
  | { kind: 'close' }
  | { kind: 'goodbye' }
  | { kind: 'refuse' }
  | { kind: 'clarify'; candidates: PageScore[] }
  | { kind: 'unknown' };

// Destructive or out-of-scope verbs: always refused, never sent to the
// model. Deleting, modifying, and sending stay off-limits until forms
// (Step 14) and spoken confirmations (Step 12) exist.
const REFUSE_WORDS = [
  'supprime',
  'supprimer',
  'supprimes',
  'efface',
  'effacer',
  'effaces',
  'detruit',
  'detruire',
  'detruis',
  'envoie',
  'envoyer',
  'envoies',
  'modifie',
  'modifier',
  'paye',
  'payer',
];

export function decide(raw: string, role?: string): Decision {
  const cleaned = cleanSentence(raw);
  if (!cleaned) return { kind: 'unknown' };
  if (cleaned.includes('au revoir') || hasWord(cleaned, ['adieu'])) return { kind: 'goodbye' };
  if (hasWord(cleaned, REFUSE_WORDS)) return { kind: 'refuse' };
  if (hasWord(cleaned, BACK_WORDS)) return { kind: 'back' };
  if (hasWord(cleaned, CLOSE_WORDS)) return { kind: 'close' };

  const allowed = role
    ? CARDINAL_PAGES.filter((p) => p.roles.includes(role as 'agent' | 'admin' | 'gerant'))
    : CARDINAL_PAGES;
  const ranked = scorePages(cleaned, allowed);
  const top = ranked[0];
  if (!top || top.score < 0.4) return { kind: 'unknown' };
  // Approvals ("c'est bien") are not orders: fuzzy-only matches abstain.
  if (top.score < 1 && /(^| )c est( |$)/.test(` ${cleaned} `)) return { kind: 'unknown' };
  if (top.score >= 0.9) return { kind: 'go', page: top.page, score: top.score };
  // Medium score: ask, don't guess.
  return { kind: 'clarify', candidates: ranked.filter((r) => r.score >= 0.4).slice(0, 2) };
}

const LABELS: Record<string, string> = {
  dashboard: 'le dashboard',
  calendar: 'le calendrier',
  properties: 'les biens',
  clients: 'les clients',
  prospects: 'les prospects',
  contacts: 'les contacts',
  contracts: 'les contrats',
  register: 'le registre',
  messages: 'les messages',
  automator: "l'automator",
  extranet: 'le squarepeek',
  conciergerie: 'la conciergerie',
  documents: 'les documents',
  library: 'la librairie',
  toolbox: 'la toolbox',
  settings: 'les paramètres',
};

export function pageLabel(id: string): string {
  return LABELS[id] || id;
}

const DONE_REPLIES = ['Voilà', 'C’est parti', 'Bien sûr, voilà', 'Tout de suite, voilà'];

export function doneReply(pageId: string): string {
  const pick = DONE_REPLIES[Math.floor(Math.random() * DONE_REPLIES.length)];
  return `${pick} ${pageLabel(pageId)}.`;
}
