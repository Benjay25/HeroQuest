import { createClient } from '@/lib/supabase/server';
import type { Faction, FactionWithReputation, UserFactionReputation } from '@/types/database';

/**
 * Faction Queries — server-side reads.
 *
 * Factions are public (guests can browse). Reputation is per-user and embedded
 * via RLS: the user_faction_reputation embed only returns the current user's
 * rows, so guests simply get null reputation.
 */

/** All factions, ordered for display. Public. */
export async function getFactions(): Promise<Faction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('factions')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching factions:', error.message);
    return [];
  }
  return data as Faction[];
}

type RepRow = Faction & { reputation: UserFactionReputation[] };

function withReputation(row: RepRow): FactionWithReputation {
  const { reputation, ...faction } = row;
  return { ...faction, reputation: reputation?.[0] ?? null };
}

/** All factions, each with the current user's reputation (null if none). */
export async function getFactionsWithReputation(): Promise<FactionWithReputation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('factions')
    .select('*, reputation:user_faction_reputation(*)')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching factions with reputation:', error.message);
    return [];
  }
  return (data as unknown as RepRow[]).map(withReputation);
}

/** A single faction by slug, with the current user's reputation. */
export async function getFactionWithReputation(
  slug: string,
): Promise<FactionWithReputation | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('factions')
    .select('*, reputation:user_faction_reputation(*)')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') console.error('Error fetching faction:', error.message);
    return null;
  }
  return withReputation(data as unknown as RepRow);
}
