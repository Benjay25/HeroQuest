import { createClient } from '@/lib/supabase/server';
import type { Profile, ProfileUpdate } from '@/types/database';

/**
 * Profile Queries
 *
 * All database operations relating to the profiles table live here.
 * Server-side only — these use the server Supabase client and run
 * inside Server Components or Server Actions.
 *
 * Keeping queries in dedicated files rather than inline in components
 * means: one place to update if the schema changes, easy to reuse
 * across multiple pages, and clear separation between data and UI.
 */

/**
 * Fetch the profile for a given user ID.
 * Returns null if the profile doesn't exist yet.
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    // PGRST116 = no rows returned — not a real error for our purposes
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching profile:', error.message);
    return null;
  }

  return data as Profile;
}

/**
 * Update fields on the current user's profile.
 * Only call this from a Server Action — never from a Client Component.
 */
export async function updateProfile(
  userId: string,
  updates: ProfileUpdate,
): Promise<Profile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error.message);
    return null;
  }

  return data as Profile;
}
