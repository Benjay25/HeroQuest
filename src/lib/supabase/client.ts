import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase Browser Client
 *
 * Use this in Client Components ('use client') — i.e. anywhere that runs
 * in the browser and needs to interact with Supabase (reading data,
 * auth state changes, real-time subscriptions).
 *
 * createBrowserClient() from @supabase/ssr is designed for this context.
 * It automatically handles auth token storage in cookies (rather than
 * localStorage) so that the server can also read the session.
 *
 * Usage:
 *   const supabase = createClient();
 *   const { data } = await supabase.from('quests').select('*');
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
