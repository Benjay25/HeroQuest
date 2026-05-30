import Box from '@mui/material/Box';
import AppNav from '@/components/layout/AppNav';
import Sidebar from '@/components/layout/Sidebar';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/supabase/queries/profile';
import { getFactions } from '@/lib/supabase/queries/factions';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch profile + factions if logged in — passed to Sidebar as props.
  // Guests (user === null) see no sidebar, just the top nav.
  const profile = user ? await getProfile(user.id) : null;
  const factions = user ? await getFactions() : [];

  return (
    /**
     * The shell fills exactly the viewport (100dvh) and hides its own overflow.
     * Inside, flexbox divides the space: the nav takes its natural height
     * (border included — no magic numbers), and the content row fills the rest.
     * The <main> area scrolls internally when a page is taller than the row,
     * so the document itself never grows past the viewport. This removes all
     * the 100vh/border pixel-math that was causing the 1px scroll.
     *
     * 100dvh (dynamic viewport height) also behaves correctly on mobile when
     * browser toolbars show/hide.
     */
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <AppNav user={user} />

      <Box sx={{ display: 'flex', flexGrow: 1, minHeight: 0 }}>

        {/* Sidebar — only rendered for logged-in users */}
        {user && (
          <Sidebar user={user} profile={profile} factions={factions} />
        )}

        {/* Main content — fills remaining width, scrolls internally if needed. */}
        <Box
          component="main"
          sx={{ flexGrow: 1, minWidth: 0, minHeight: 0, overflowY: 'auto' }}
        >
          {children}
        </Box>

      </Box>
    </Box>
  );
}
