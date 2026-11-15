// Capsule — types and mock data for the pass-1 gray-box prototype.
// Shapes follow the data sketch in CLAUDE.md so pass 2/3 can swap in Firestore.

export type RatingScale = 'stars' | 'ten' | 'percent' | 'none';
export type CapsuleStatus = 'finished' | 'dropped' | 'favorite';
export type ShowcaseSize = 10 | 16 | 25;

export interface Game {
  id: string;
  title: string;
  year?: number;
  studio?: string;
  coverUrl?: string;
}

export interface Rating {
  stars?: number; // 0.5–5 in half steps
  ten?: number; // 1–10
  percent?: number; // 0–100
}

export interface Capsule {
  id: string;
  uid: string;
  gameId: string;
  gameTitle: string;
  coverUrl?: string;
  status: CapsuleStatus;
  text: string;
  rating?: Rating;
  headline?: string;
  verdict?: string;
  tags: string[];
  /** Free text for now ("42", "about 60"). Only the modal flow asks for these so far. */
  hoursPlayed?: string;
  difficulty?: string;
  createdAt: number;
  updatedAt: number;
  likeCount: number;
}

export interface CapsuleUser {
  uid: string;
  displayName: string;
  photoURL?: string;
  handle: string;
  bio: string;
  socialLinks: { label: string; url: string }[];
  ratingScale: RatingScale;
  showcaseSize: ShowcaseSize;
  top5: string[]; // gameIds; Top 3/10 onboarding writes here too
  headlineGameId?: string;
  headlinePinned: boolean;
  autoHeadline: boolean;
  hideDroppedFromDiscovery: boolean;
  whoCanFollow: 'anyone' | 'friends';
  stats: { games: number; followers: number; friends: number };
}

// ---------------------------------------------------------------------------
// Scales: every value gets a word so the number has a voice (R3a).

export const SCALE_LABEL: Record<RatingScale, string> = {
  stars: 'Stars (1–5)',
  ten: '1–10',
  percent: 'Percent (%)',
  none: 'No scores, just words',
};

const STAR_WORDS: Record<string, string> = {
  '0.5': 'Rough',
  '1': 'Not for me',
  '1.5': 'Weak',
  '2': 'Had its moments',
  '2.5': 'Mixed',
  '3': 'Solid',
  '3.5': 'Good',
  '4': 'Really good',
  '4.5': 'Great',
  '5': 'All-timer',
};

const TEN_WORDS = [
  '',
  'Awful',
  'Bad',
  'Weak',
  'Meh',
  'Fine',
  'Decent',
  'Good',
  'Really good',
  'Great',
  'All-timer',
];

export function percentWord(p: number) {
  if (p >= 95) return 'All-timer';
  if (p >= 85) return 'Great';
  if (p >= 75) return 'Really good';
  if (p >= 65) return 'Good';
  if (p >= 50) return 'Fine';
  if (p >= 35) return 'Meh';
  return 'Not for me';
}

export function scoreSentence(scale: Exclude<RatingScale, 'none'>, value: number) {
  if (scale === 'stars') return `${value} out of 5 — “${STAR_WORDS[String(value)] ?? ''}”`;
  if (scale === 'ten') return `${value} out of 10 — “${TEN_WORDS[value] ?? ''}”`;
  return `${value}% — “${percentWord(value)}”`;
}

export function starString(stars: number) {
  const full = Math.floor(stars);
  const half = stars - full >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}

/** Short score text in the owner's main scale, falling back to whatever is filled in. */
export function shortScore(c: Capsule, scale: RatingScale): string | null {
  const r = c.rating;
  if (!r) return null;
  const order: Exclude<RatingScale, 'none'>[] =
    scale === 'none' ? ['stars', 'ten', 'percent'] : [scale, 'stars', 'ten', 'percent'];
  for (const s of order) {
    const v = r[s];
    if (v == null) continue;
    if (s === 'stars') return starString(v);
    if (s === 'ten') return `${v}/10`;
    return `${v}%`;
  }
  return null;
}

export const STATUS_LABEL: Record<CapsuleStatus, string> = {
  finished: 'Finished',
  dropped: 'Dropped',
  favorite: 'All-time favorite',
};

export const VERDICT_PRESETS = ['Flawed gem', 'Comfort food', 'Masterpiece', 'Not for me'];

export const WRITING_PROMPTS = ['One moment you’ll remember', 'Who should play it?', 'What surprised you?'];

export const TEXT_LIMIT_RATED = 600;
export const TEXT_LIMIT_UNRATED = 1500;

// ---------------------------------------------------------------------------
// Mock games (used for search alongside /api/games/search, which only has a
// handful of offline titles).

export const MOCK_GAMES: Game[] = [
  { id: 'ds2', title: 'Dead Space 2', year: 2011, studio: 'Visceral Games' },
  { id: 'ds1', title: 'Dead Space', year: 2008, studio: 'EA Redwood Shores' },
  { id: 'ds-remake', title: 'Dead Space (Remake)', year: 2023, studio: 'Motive Studio' },
  { id: 're4', title: 'Resident Evil 4', year: 2005, studio: 'Capcom' },
  { id: 'celeste', title: 'Celeste', year: 2018, studio: 'Maddy Makes Games' },
  { id: 'hollow-knight', title: 'Hollow Knight', year: 2017, studio: 'Team Cherry' },
  { id: 'outer-wilds', title: 'Outer Wilds', year: 2019, studio: 'Mobius Digital' },
  { id: 'disco', title: 'Disco Elysium', year: 2019, studio: 'ZA/UM' },
  { id: 'hades', title: 'Hades', year: 2020, studio: 'Supergiant Games' },
  { id: 'bloodborne', title: 'Bloodborne', year: 2015, studio: 'FromSoftware' },
  { id: 'elden-ring', title: 'Elden Ring', year: 2022, studio: 'FromSoftware' },
  { id: 'botw', title: 'Breath of the Wild', year: 2017, studio: 'Nintendo' },
  { id: 'silent-hill-2', title: 'Silent Hill 2', year: 2001, studio: 'Konami' },
  { id: 'portal-2', title: 'Portal 2', year: 2011, studio: 'Valve' },
  { id: 'persona-5', title: 'Persona 5 Royal', year: 2019, studio: 'Atlus' },
  { id: 'inside', title: 'Inside', year: 2016, studio: 'Playdead' },
  { id: 'tlou', title: 'The Last of Us', year: 2013, studio: 'Naughty Dog' },
  { id: 'alan-wake-2', title: 'Alan Wake 2', year: 2023, studio: 'Remedy' },
  { id: 'signalis', title: 'Signalis', year: 2022, studio: 'rose-engine' },
  { id: 'baldurs-gate-3', title: "Baldur's Gate 3", year: 2023, studio: 'Larian' },
];

export const POPULAR_PICKS = ['re4', 'celeste', 'outer-wilds', 'disco', 'hades', 'bloodborne', 'botw', 'portal-2'];

/** Shown first in R1 when the search box is empty ("recently played"). */
export const RECENTLY_PLAYED = ['ds2', 'hollow-knight', 'alan-wake-2'];

export function findGame(id: string): Game | undefined {
  return MOCK_GAMES.find((g) => g.id === id);
}

// ---------------------------------------------------------------------------
// The mock signed-in user and their capsules (A1, B, F all read from here).

export const MOCK_UID = 'mock-alex';

export const MOCK_USER: CapsuleUser = {
  uid: MOCK_UID,
  displayName: 'Alex Rivera',
  handle: 'alex',
  bio: 'Horror sicko. Will die on the hill that RE4 is perfect.',
  socialLinks: [
    { label: 'Twitch', url: '#' },
    { label: 'Reddit', url: '#' },
    { label: 'Discord', url: '#' },
  ],
  ratingScale: 'stars',
  showcaseSize: 16,
  top5: ['re4', 'celeste', 'silent-hill-2', 'outer-wilds', 'disco'],
  headlinePinned: false,
  autoHeadline: true,
  hideDroppedFromDiscovery: true,
  whoCanFollow: 'anyone',
  stats: { games: 142, followers: 210, friends: 12 },
};

const day = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 15);

export const MOCK_CAPSULES: Capsule[] = [
  {
    id: 'c-ds2',
    uid: MOCK_UID,
    gameId: 'ds2',
    gameTitle: 'Dead Space 2',
    status: 'finished',
    text: 'Tighter and meaner than the first. The Ishimura return made every save room feel like a lie — I kept waiting for the trick.',
    rating: { stars: 4 },
    tags: ['tense', 'horror', 'sequel'],
    createdAt: NOW - 1 * day,
    updatedAt: NOW - 1 * day,
    likeCount: 24,
  },
  {
    id: 'c-hk',
    uid: MOCK_UID,
    gameId: 'hollow-knight',
    gameTitle: 'Hollow Knight',
    status: 'dropped',
    text: 'The art direction is unreal and the combat is tight, but the map design wore me down around Deepnest. I want to come back to it when I have the patience it asks for.',
    headline: 'Beautiful, brutal, and not for me — yet.',
    verdict: 'Flawed gem',
    tags: ['metroidvania', 'hard'],
    createdAt: NOW - 40 * day,
    updatedAt: NOW - 40 * day,
    likeCount: 9,
  },
  {
    id: 'c-re4',
    uid: MOCK_UID,
    gameId: 're4',
    gameTitle: 'Resident Evil 4',
    status: 'favorite',
    text: 'The perfect game. Fight me.',
    rating: { stars: 5, ten: 10 },
    tags: ['action', 'horror', 'classic'],
    createdAt: NOW - 90 * day,
    updatedAt: NOW - 90 * day,
    likeCount: 51,
  },
  {
    id: 'c-celeste',
    uid: MOCK_UID,
    gameId: 'celeste',
    gameTitle: 'Celeste',
    status: 'finished',
    text: 'A platformer about anxiety that actually understands it.',
    rating: { stars: 4.5, ten: 9 },
    tags: ['platformer', 'precise'],
    createdAt: NOW - 60 * day,
    updatedAt: NOW - 60 * day,
    likeCount: 17,
  },
];

/** Extra shelf filler so the showcase grid has something in it. */
export const SHELF_FILLER = MOCK_GAMES.map((g) => g.id).filter(
  (id) => !MOCK_CAPSULES.some((c) => c.gameId === id),
);

// ---------------------------------------------------------------------------
// Very rough local tag picking for pass 1. /api/tags/suggest (Gemini) needs a
// signed-in user, so it gets wired up in pass 2/3.

// Whole-word matches only, so "start" doesn't suggest "gorgeous" (art) and
// "believe" doesn't suggest "tense" (lie).
const TAG_HINTS: [RegExp, string][] = [
  [/\b(scar(y|ed|ier|iest)|horror|dread\w*|creep(y|ier)?|terrif\w*)\b/i, 'horror'],
  [/\b(tense|tension|lies?|tricks?|nervous|waiting)\b/i, 'tense'],
  [/\b(sequel|first one|than the first|original)\b/i, 'sequel'],
  [/\b(tight|precise|crisp)\b/i, 'tight'],
  [/\b(gore|gory|blood(y)?)\b/i, 'gory'],
  [/\b(story|plot|writing|characters?)\b/i, 'story'],
  [/\b(beautiful|art|gorgeous)\b/i, 'gorgeous'],
  [/\b(hard|brutal|difficult)\b/i, 'hard'],
  [/\b(cozy|comfort(ing)?|relax(ing|ed)?)\b/i, 'cozy'],
  [/\b(music|soundtrack)\b/i, 'soundtrack'],
];

export function suggestTagsLocally(text: string): string[] {
  const found = TAG_HINTS.filter(([re]) => re.test(text)).map(([, t]) => t);
  return Array.from(new Set(found)).slice(0, 5);
}

export function newId(prefix = 'c') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatDate(ts: number, withYear = false) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
