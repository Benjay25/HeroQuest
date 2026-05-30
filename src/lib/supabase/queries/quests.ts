import { createClient } from '@/lib/supabase/server';
import type {
  QuestType,
  QuestWithProgress,
  UserQuest,
  QuestChecklistItem,
  UserChecklistProgress,
} from '@/types/database';

/**
 * Select string for the quest join. From user_quests (already user-scoped by
 * RLS) we embed the quest definition, its checklist items, and — nested under
 * each item — the current user's progress row. RLS on user_checklist_progress
 * ensures only this user's progress comes back, so no explicit filter needed.
 */
const QUEST_SELECT =
  '*, quest:quests!inner(*, checklist:quest_checklist_items(*, progress:user_checklist_progress(*)), faction:factions(id,slug,name,colour,icon))';

/**
 * Quest Queries — server-side reads.
 *
 * The core query joins `user_quests` (per-user state) with `quests`
 * (definitions) and reshapes the result into QuestWithProgress — the
 * flat shape the UI wants: all quest fields plus a `user_quest` object.
 *
 * We fetch from user_quests because that table is already scoped to one
 * user (and RLS enforces it), then embed the quest definition.
 */

/**
 * Internal: the raw row shape Supabase returns from the join — a user_quests
 * row with the quest nested under `quest`, whose checklist items each carry a
 * `progress` ARRAY (0 or 1 rows for this user, due to RLS).
 */
type RawChecklistItem = QuestChecklistItem & { progress: UserChecklistProgress[] };
type JoinedRow = UserQuest & {
  quest: Omit<QuestWithProgress, 'user_quest' | 'checklist'> & {
    checklist: RawChecklistItem[] | null;
  };
};

/** Reshape a joined row into the flat QuestWithProgress the UI expects. */
function toQuestWithProgress(row: JoinedRow): QuestWithProgress {
  const { quest, ...userQuest } = row;
  const { checklist: rawChecklist, ...questFields } = quest;

  // Flatten each item's progress array to a single row (or null) and sort.
  const checklist = (rawChecklist ?? [])
    .map(item => {
      const { progress, ...itemFields } = item;
      return { ...itemFields, progress: progress?.[0] ?? null };
    })
    .sort((a, b) => a.sort_order - b.sort_order);

  return { ...questFields, checklist, user_quest: userQuest };
}

/**
 * Fetch all of a user's quests (any type), newest first.
 * Use groupQuestsByType() to split them for the dashboard.
 */
export async function getUserQuests(userId: string): Promise<QuestWithProgress[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_quests')
    .select(QUEST_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user quests:', error.message);
    return [];
  }

  return (data as unknown as JoinedRow[]).map(toQuestWithProgress);
}

/** Fetch a user's quests of a single type. */
export async function getUserQuestsByType(
  userId: string,
  type: QuestType,
): Promise<QuestWithProgress[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_quests')
    .select(QUEST_SELECT)
    .eq('user_id', userId)
    .eq('quest.type', type)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching ${type} quests:`, error.message);
    return [];
  }

  return (data as unknown as JoinedRow[]).map(toQuestWithProgress);
}

/**
 * Group a flat quest list by type — convenient for the dashboard which
 * renders one container per type from a single fetch.
 */
export function groupQuestsByType(
  quests: QuestWithProgress[],
): Record<QuestType, QuestWithProgress[]> {
  const groups: Record<QuestType, QuestWithProgress[]> = {
    daily: [], weekly: [], story: [], fog: [], epic: [],
  };
  for (const q of quests) groups[q.type].push(q);
  return groups;
}

/**
 * Count completed vs total for a quest list — drives the "3 / 5" badge.
 * A quest counts as completed when its user_quest.status is 'completed'.
 */
export function completionCounts(quests: QuestWithProgress[]): {
  completed: number;
  total: number;
} {
  const total = quests.length;
  const completed = quests.filter(q => q.user_quest.status === 'completed').length;
  return { completed, total };
}
