/**
 * Database Types
 *
 * These types mirror the shape of your Supabase tables exactly.
 * When you add a column to a table, add it here too.
 *
 * In a larger project you'd auto-generate these from Supabase's CLI
 * (supabase gen types typescript). For now we maintain them manually —
 * the tables are small and it keeps things simple.
 *
 * The naming convention:
 *   Row    — the shape of a row coming OUT of the database (select)
 *   Insert — the shape of data going IN (insert) — nullable fields optional
 *   Update — the shape of data for updates — all fields optional
 */

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  xp: number;
  level: number;
  streak_days: number;
  last_checkin_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileUpdate = Partial<Pick<Profile,
  | 'display_name'
  | 'avatar_url'
  | 'xp'
  | 'level'
  | 'streak_days'
  | 'last_checkin_at'
>>;

/**
 * XP required to reach each level.
 * Index = level number (level 1 = index 1).
 * Level 0 unused — levels start at 1.
 *
 * Stored here rather than in the DB because it's app logic,
 * not data. Tweak these values to adjust the progression curve.
 */
export const XP_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 500,
  3: 1200,
  4: 2500,
  5: 4500,
  6: 7500,
  7: 12000,
  8: 18000,
  9: 26000,
  10: 36000,
};

/**
 * Rank titles per level — shown on the profile and faction pages.
 * Extend as more levels are added.
 */
export const LEVEL_TITLES: Record<number, string> = {
  1:  'Novice',
  2:  'Apprentice',
  3:  'Journeyman',
  4:  'Adventurer',
  5:  'Veteran',
  6:  'Expert',
  7:  'Master',
  8:  'Champion',
  9:  'Legend',
  10: 'Mythic',
};

/** Returns the XP needed to reach the next level from the current one. */
export function xpForNextLevel(currentLevel: number): number {
  return XP_THRESHOLDS[currentLevel + 1] ?? XP_THRESHOLDS[10];
}

/** Returns the display title for a given level. */
export function levelTitle(level: number): string {
  return LEVEL_TITLES[level] ?? 'Mythic';
}

/** Returns XP progress as a 0–100 percentage toward the next level. */
export function xpProgress(xp: number, level: number): number {
  const currentThreshold = XP_THRESHOLDS[level] ?? 0;
  const nextThreshold = xpForNextLevel(level);
  const range = nextThreshold - currentThreshold;
  const progress = xp - currentThreshold;
  return Math.min(100, Math.round((progress / range) * 100));
}

/** Highest level number we have a threshold for. */
export const MAX_LEVEL = Math.max(...Object.keys(XP_THRESHOLDS).map(Number));

/**
 * Given a total XP amount, returns the level it corresponds to —
 * the highest level whose threshold the XP has met or exceeded.
 * Used when awarding XP so the stored level stays in sync with xp.
 */
export function computeLevel(xp: number): number {
  let level = 1;
  for (let l = 1; l <= MAX_LEVEL; l++) {
    if (xp >= (XP_THRESHOLDS[l] ?? Infinity)) level = l;
  }
  return level;
}

// ============================================================
// QUEST SYSTEM TYPES
// ============================================================

/** The five quest categories. Mirrors the `type` check constraint. */
export type QuestType = 'daily' | 'weekly' | 'story' | 'fog' | 'epic';

/** How a quest is marked complete. Mirrors the `completion_type` constraint. */
export type CompletionType = 'boolean' | 'checklist' | 'numeric';

/** Difficulty tiers — affect XP reward weighting. */
export type Difficulty = 'minor' | 'standard' | 'major' | 'legendary';

/** Per-user lifecycle state of a quest. */
export type QuestStatus = 'active' | 'completed' | 'stale' | 'archived';

/** A quest definition (the "what"). Mirrors the `quests` table. */
export type Quest = {
  id: string;
  owner_id: string | null;
  template_id: string | null;
  title: string;
  description: string | null;
  type: QuestType;
  completion_type: CompletionType;
  numeric_target: number | null;
  xp_reward: number;
  difficulty: Difficulty;
  is_template: boolean;
  has_penalty: boolean;
  penalty_xp: number;
  stale_after_days: number | null;
  faction_id: string | null;
  created_at: string;
  updated_at: string;
};

/** Per-user progress on a quest (the "how I'm doing"). Mirrors `user_quests`. */
export type UserQuest = {
  id: string;
  user_id: string;
  quest_id: string;
  status: QuestStatus;
  numeric_progress: number;
  completed_at: string | null;
  reset_at: string | null;
  stale_at: string | null;
  deadline_at: string | null;
  created_at: string;
};

/** A checklist sub-task. Mirrors `quest_checklist_items`. */
export type QuestChecklistItem = {
  id: string;
  quest_id: string;
  title: string;
  sort_order: number;
  numeric_target: number | null;
  created_at: string;
};

/** Per-user state of a checklist item. Mirrors `user_checklist_progress`. */
export type UserChecklistProgress = {
  id: string;
  user_id: string;
  checklist_item_id: string;
  numeric_progress: number;
  completed_at: string | null;
};

/** A checklist item joined with the current user's progress on it. */
export type ChecklistItemWithProgress = QuestChecklistItem & {
  progress: UserChecklistProgress | null;
};

// ============================================================
// FACTION SYSTEM TYPES
// ============================================================

/** A guild/faction definition. Mirrors the `factions` table. */
export type Faction = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  tagline: string | null;
  lore: string | null;
  colour: string;
  icon: string | null;
  leader_name: string | null;
  leader_title: string | null;
  leader_blurb: string | null;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

/** The slim faction shape embedded on quests (for cards/chips). */
export type FactionSummary = Pick<Faction, 'id' | 'slug' | 'name' | 'colour' | 'icon'>;

/** A user's reputation with one faction. Mirrors `user_faction_reputation`. */
export type UserFactionReputation = {
  id: string;
  user_id: string;
  faction_id: string;
  xp: number;
  created_at: string;
  updated_at: string;
};

/** A faction paired with the current user's reputation (null if none yet). */
export type FactionWithReputation = Faction & {
  reputation: UserFactionReputation | null;
};

/**
 * Faction reputation rank tiers. Reputation XP maps to a rank the same way
 * player XP maps to a level. Tweak thresholds to tune the curve.
 */
export const FACTION_RANKS: { title: string; xp: number }[] = [
  { title: 'Initiate',   xp: 0 },
  { title: 'Associate',  xp: 300 },
  { title: 'Journeyman', xp: 800 },
  { title: 'Adept',      xp: 1600 },
  { title: 'Expert',     xp: 3000 },
  { title: 'Master',     xp: 5000 },
];

/** The rank index (0-based) for a given reputation XP. */
export function factionRankIndex(xp: number): number {
  let idx = 0;
  for (let i = 0; i < FACTION_RANKS.length; i++) {
    if (xp >= FACTION_RANKS[i].xp) idx = i;
  }
  return idx;
}

/** The rank title for a given reputation XP. */
export function factionRankTitle(xp: number): string {
  return FACTION_RANKS[factionRankIndex(xp)].title;
}

/** Progress (0–100) toward the next rank; 100 at the final rank. */
export function factionRankProgress(xp: number): number {
  const idx = factionRankIndex(xp);
  if (idx >= FACTION_RANKS.length - 1) return 100;
  const current = FACTION_RANKS[idx].xp;
  const next = FACTION_RANKS[idx + 1].xp;
  return Math.min(100, Math.round(((xp - current) / (next - current)) * 100));
}

/** XP needed to reach the next rank (null at the final rank). */
export function xpToNextFactionRank(xp: number): number | null {
  const idx = factionRankIndex(xp);
  if (idx >= FACTION_RANKS.length - 1) return null;
  return FACTION_RANKS[idx + 1].xp - xp;
}

/**
 * A quest joined with the current user's progress on it.
 * This is the shape the UI actually wants — definition + state together.
 * `user_quest` is the row from user_quests for this user.
 * `checklist` is empty for non-checklist quests.
 * `faction` is the embedded guild summary (null if the quest has no faction).
 */
export type QuestWithProgress = Quest & {
  user_quest: UserQuest;
  checklist: ChecklistItemWithProgress[];
  faction: FactionSummary | null;
};

/**
 * Default number of days before a Fog quest is considered stale,
 * applied when the user doesn't set one (keeps creation frictionless).
 */
export const DEFAULT_FOG_STALE_DAYS = 30;
