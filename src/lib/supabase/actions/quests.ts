'use server';

/**
 * Quest Server Actions — all quest mutations run here, server-side.
 *
 * Creating a personal quest writes to TWO tables: `quests` (the definition,
 * owned by the user) and `user_quests` (their progress on it). The split is
 * explained in the schema — definition vs per-user state.
 *
 * Completion actions also adjust the user's XP and recompute their level,
 * keeping profile.xp and profile.level in sync.
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  computeLevel,
  DEFAULT_FOG_STALE_DAYS,
  type QuestType,
  type CompletionType,
  type Difficulty,
} from '@/types/database';

/** Shape accepted by createQuest — a plain serializable object. */
export type CreateQuestInput = {
  title: string;
  description?: string | null;
  type: QuestType;
  completion_type?: CompletionType;
  numeric_target?: number | null;
  xp_reward?: number;
  difficulty?: Difficulty;
  has_penalty?: boolean;
  penalty_xp?: number;
  stale_after_days?: number | null;
  deadline_at?: string | null;
  faction_id?: string | null;
  checklist_items?: { title: string; numeric_target?: number | null }[];
};

// ────────────────────────────────────────────────────────────
// Internal helpers (not exported → not server actions, just functions)
// ────────────────────────────────────────────────────────────

/**
 * Adjust a user's XP by `delta` (can be negative) and recompute their level.
 * Floors XP at 0 so removing XP can never go negative.
 */
async function adjustXp(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  delta: number,
): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp')
    .eq('id', userId)
    .single();

  if (!profile) return;

  const newXp = Math.max(0, profile.xp + delta);
  const newLevel = computeLevel(newXp);

  await supabase
    .from('profiles')
    .update({ xp: newXp, level: newLevel, updated_at: new Date().toISOString() })
    .eq('id', userId);
}

/**
 * Adjust a user's reputation with a faction by `delta` (no-op if factionId is
 * null). Floors at 0. Used alongside adjustXp so a faction-tagged quest grows
 * both global XP and guild standing (Option A).
 */
async function adjustFactionRep(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  factionId: string | null,
  delta: number,
): Promise<void> {
  if (!factionId) return;

  const { data: existing } = await supabase
    .from('user_faction_reputation')
    .select('xp')
    .eq('user_id', userId)
    .eq('faction_id', factionId)
    .maybeSingle();

  const newXp = Math.max(0, (existing?.xp ?? 0) + delta);

  await supabase
    .from('user_faction_reputation')
    .upsert(
      { user_id: userId, faction_id: factionId, xp: newXp },
      { onConflict: 'user_id,faction_id' },
    );
}

/** Revalidate the pages where quest/faction changes are visible. */
function revalidateQuestSurfaces() {
  revalidatePath('/dashboard');
  revalidatePath('/quests');
  revalidatePath('/fog');
  revalidatePath('/factions', 'layout');
}

/**
 * Recompute whether a checklist quest is complete for a user, based on its
 * items. A checklist quest is complete when every item has been marked done
 * (completed_at set). Transitions the parent user_quest's status and adjusts
 * XP on the completion-state change (only on the transition, never twice).
 */
async function recomputeChecklistQuest(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  questId: string,
): Promise<void> {
  // The item list and the parent user_quest are independent — fetch in parallel.
  const [itemsRes, uqRes] = await Promise.all([
    supabase.from('quest_checklist_items').select('id').eq('quest_id', questId),
    supabase
      .from('user_quests')
      .select('id, status, quest:quests!inner(xp_reward, faction_id)')
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .single(),
  ]);

  const items = itemsRes.data;
  const uq = uqRes.data;
  if (!items || items.length === 0 || !uq) return;

  const { data: doneRows } = await supabase
    .from('user_checklist_progress')
    .select('id')
    .eq('user_id', userId)
    .in('checklist_item_id', items.map(i => i.id))
    .not('completed_at', 'is', null);

  const allComplete = (doneRows?.length ?? 0) === items.length;
  const quest = uq.quest as unknown as { xp_reward: number; faction_id: string | null };
  const wasCompleted = uq.status === 'completed';

  // Only act on a completion-state transition. Status, global XP, and faction
  // reputation are independent — run them together.
  if (allComplete && !wasCompleted) {
    await Promise.all([
      supabase
        .from('user_quests')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', uq.id),
      adjustXp(supabase, userId, quest.xp_reward),
      adjustFactionRep(supabase, userId, quest.faction_id, quest.xp_reward),
    ]);
  } else if (!allComplete && wasCompleted) {
    await Promise.all([
      supabase
        .from('user_quests')
        .update({ status: 'active', completed_at: null })
        .eq('id', uq.id),
      adjustXp(supabase, userId, -quest.xp_reward),
      adjustFactionRep(supabase, userId, quest.faction_id, -quest.xp_reward),
    ]);
  }
}

// ────────────────────────────────────────────────────────────
// Create
// ────────────────────────────────────────────────────────────

/**
 * Create a personal quest and the user_quest row that tracks progress.
 * Called from client components with a typed object.
 */
export async function createQuest(input: CreateQuestInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // 1. Insert the quest definition
  const { data: quest, error: questError } = await supabase
    .from('quests')
    .insert({
      owner_id: user.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      type: input.type,
      completion_type: input.completion_type ?? 'boolean',
      numeric_target: input.numeric_target ?? null,
      xp_reward: input.xp_reward ?? 50,
      difficulty: input.difficulty ?? 'standard',
      has_penalty: input.has_penalty ?? false,
      penalty_xp: input.penalty_xp ?? 0,
      stale_after_days:
        input.type === 'fog'
          ? input.stale_after_days ?? DEFAULT_FOG_STALE_DAYS
          : null,
      faction_id: input.faction_id ?? null,
    })
    .select()
    .single();

  if (questError || !quest) {
    console.error('Error creating quest:', questError?.message);
    return { error: questError?.message ?? 'Failed to create quest' };
  }

  // 2. Compute fog staleness date if applicable
  let staleAt: string | null = null;
  if (quest.type === 'fog' && quest.stale_after_days) {
    const d = new Date();
    d.setDate(d.getDate() + quest.stale_after_days);
    staleAt = d.toISOString();
  }

  // 3. Insert the user_quest progress row
  const { error: uqError } = await supabase
    .from('user_quests')
    .insert({
      user_id: user.id,
      quest_id: quest.id,
      status: 'active',
      stale_at: staleAt,
      deadline_at: input.deadline_at ?? null,
    });

  if (uqError) {
    console.error('Error creating user_quest:', uqError.message);
    return { error: uqError.message };
  }

  // 4. Insert checklist items if provided
  if (input.checklist_items?.length) {
    const items = input.checklist_items.map((item, i) => ({
      quest_id: quest.id,
      title: item.title.trim(),
      sort_order: i,
      numeric_target: item.numeric_target ?? null,
    }));
    const { error: ciError } = await supabase
      .from('quest_checklist_items')
      .insert(items);
    if (ciError) console.error('Error creating checklist items:', ciError.message);
  }

  revalidateQuestSurfaces();
  return { success: true, questId: quest.id };
}

/**
 * Quick-add a Fog quest — title only, maximum frictionlessness.
 * Designed to be called directly as a <form action={quickAddFog}>.
 */
export async function quickAddFog(formData: FormData) {
  const title = (formData.get('title') as string | null)?.trim();
  if (!title) return { error: 'A title is required' };

  return createQuest({ title, type: 'fog', completion_type: 'boolean' });
}

// ────────────────────────────────────────────────────────────
// Completion
// ────────────────────────────────────────────────────────────

/**
 * Toggle a boolean quest between active and completed.
 * Awards xp_reward on completion, removes it on un-completion.
 */
export async function toggleQuestComplete(userQuestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Fetch the user_quest plus the quest's xp_reward and faction
  const { data: row, error } = await supabase
    .from('user_quests')
    .select('id, status, user_id, quest:quests!inner(xp_reward, faction_id)')
    .eq('id', userQuestId)
    .single();

  if (error || !row) return { error: 'Quest not found' };
  if (row.user_id !== user.id) return { error: 'Not your quest' };

  const quest = row.quest as unknown as { xp_reward: number; faction_id: string | null };
  const nowCompleted = row.status !== 'completed';
  const delta = nowCompleted ? quest.xp_reward : -quest.xp_reward;

  const { error: updErr } = await supabase
    .from('user_quests')
    .update({
      status: nowCompleted ? 'completed' : 'active',
      completed_at: nowCompleted ? new Date().toISOString() : null,
    })
    .eq('id', userQuestId);

  if (updErr) return { error: updErr.message };

  await Promise.all([
    adjustXp(supabase, user.id, delta),
    adjustFactionRep(supabase, user.id, quest.faction_id, delta),
  ]);

  revalidateQuestSurfaces();
  return { success: true, completed: nowCompleted };
}

/**
 * Set numeric progress on a numeric quest. Auto-completes when the target
 * is reached (awarding XP), and reverts if dropped back below target.
 */
export async function setNumericProgress(userQuestId: string, value: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: row, error } = await supabase
    .from('user_quests')
    .select('id, status, user_id, quest:quests!inner(xp_reward, numeric_target, faction_id)')
    .eq('id', userQuestId)
    .single();

  if (error || !row) return { error: 'Quest not found' };
  if (row.user_id !== user.id) return { error: 'Not your quest' };

  const quest = row.quest as unknown as {
    xp_reward: number;
    numeric_target: number | null;
    faction_id: string | null;
  };
  const target = quest.numeric_target ?? 0;
  const clamped = Math.max(0, Math.min(value, target || value));

  const wasCompleted = row.status === 'completed';
  const nowCompleted = target > 0 && clamped >= target;

  const { error: updErr } = await supabase
    .from('user_quests')
    .update({
      numeric_progress: clamped,
      status: nowCompleted ? 'completed' : 'active',
      completed_at: nowCompleted ? new Date().toISOString() : null,
    })
    .eq('id', userQuestId);

  if (updErr) return { error: updErr.message };

  // Only adjust XP/reputation on a completion-state transition
  if (nowCompleted && !wasCompleted) {
    await Promise.all([
      adjustXp(supabase, user.id, quest.xp_reward),
      adjustFactionRep(supabase, user.id, quest.faction_id, quest.xp_reward),
    ]);
  } else if (!nowCompleted && wasCompleted) {
    await Promise.all([
      adjustXp(supabase, user.id, -quest.xp_reward),
      adjustFactionRep(supabase, user.id, quest.faction_id, -quest.xp_reward),
    ]);
  }

  revalidateQuestSurfaces();
  return { success: true, completed: nowCompleted };
}

/**
 * Set the done/undone state of one or more boolean checklist items in a single
 * call, then recompute the parent quest once. Batching here is what keeps
 * rapid ticking fast: N ticks become one upsert + one recompute + one
 * revalidation instead of N sequential server actions.
 *
 * All items belong to the same quest (a card), so we recompute that quest once.
 */
export async function setChecklistItemsComplete(
  questId: string,
  items: { id: string; complete: boolean }[],
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  if (items.length === 0) return { success: true };

  const now = new Date().toISOString();
  const rows = items.map(it => ({
    user_id: user.id,
    checklist_item_id: it.id,
    completed_at: it.complete ? now : null,
  }));

  const { error } = await supabase
    .from('user_checklist_progress')
    .upsert(rows, { onConflict: 'user_id,checklist_item_id' });
  if (error) return { error: error.message };

  await recomputeChecklistQuest(supabase, user.id, questId);
  revalidateQuestSurfaces();
  return { success: true };
}

/**
 * Set numeric progress on a numeric checklist item (e.g. a weekly sub-quest
 * like "jog 20km"). Marks the item complete at/above its target, then
 * recomputes the parent quest.
 */
export async function setChecklistItemProgress(checklistItemId: string, value: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: item, error: itemErr } = await supabase
    .from('quest_checklist_items')
    .select('quest_id, numeric_target')
    .eq('id', checklistItemId)
    .single();
  if (itemErr || !item) return { error: 'Item not found' };

  const target = item.numeric_target ?? 0;
  const clamped = Math.max(0, Math.min(value, target || value));
  const complete = target > 0 && clamped >= target;

  const { error: upErr } = await supabase
    .from('user_checklist_progress')
    .upsert(
      {
        user_id: user.id,
        checklist_item_id: checklistItemId,
        numeric_progress: clamped,
        completed_at: complete ? new Date().toISOString() : null,
      },
      { onConflict: 'user_id,checklist_item_id' },
    );
  if (upErr) return { error: upErr.message };

  await recomputeChecklistQuest(supabase, user.id, item.quest_id);
  revalidateQuestSurfaces();
  return { success: true };
}

/**
 * Delete a quest entirely (and its user_quest via cascade).
 * Used for removing fog quests you no longer need to track.
 */
export async function deleteQuest(questId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // RLS ensures a user can only delete their own quests, but we filter
  // explicitly too for clarity and an early, friendly error.
  const { error } = await supabase
    .from('quests')
    .delete()
    .eq('id', questId)
    .eq('owner_id', user.id);

  if (error) return { error: error.message };

  revalidateQuestSurfaces();
  return { success: true };
}
