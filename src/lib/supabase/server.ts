import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase Server Client
 *
 * Use this in Server Components, Server Actions, and Route Handlers —
 * i.e. anywhere that runs on the server and needs to talk to Supabase.
 *
 * Why a separate client for the server?
 * The browser client stores the auth session in cookies that the browser
 * manages automatically. On the server, we have to read those cookies
 * manually from the incoming request. createServerClient() handles this
 * by accepting Next.js's cookies() helper.
 *
 * The get/set/remove cookie handlers below tell Supabase how to read and
 * write cookies in the Next.js server environment.
 *
 * Usage (in a Server Component or Server Action):
 *   const supabase = await createClient();
 *   const { data } = await supabase.from('quests').select('*');
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll is called from Server Components where cookies can't
            // be set (only Route Handlers and Server Actions can set cookies).
            // This is expected — the session will still be readable.
          }
        },
      },
    },
  );
}
