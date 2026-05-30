/**
 * Root landing page — the first thing guests see.
 *
 * This is a Server Component that checks if the user is already logged in.
 * If they are, we redirect them straight to the dashboard — no point showing
 * a landing page to someone who already has an account.
 *
 * If they're a guest, they see an introduction to the app with options
 * to sign up, log in, or continue browsing without an account.
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { createClient } from '@/lib/supabase/server';
import AppNav from '@/components/layout/AppNav';

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Logged-in users skip the landing page entirely
  if (user) redirect('/dashboard');

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppNav user={null} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          p: { xs: 4, md: 6 },
          gap: 4,
        }}
      >
        {/* Hero */}
        <Box>
          <Typography variant="overline" color="primary.light">
            Your Quest Log for the Real World
          </Typography>
          <Typography variant="h1" sx={{ mt: 1, mb: 2 }}>
            HeroQuest
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ maxWidth: 520, mx: 'auto' }}
          >
            Track your goals. Build your legend. Leave nothing in the fog.
          </Typography>
        </Box>

        {/* CTAs
            Link wraps Button rather than component={Link} — passing a function
            as a prop to a Client Component from a Server Component is not
            allowed in React 19. Wrapping achieves the same result. */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/signup" style={{ textDecoration: 'none' }}>
            <Button variant="contained" size="large">
              Begin Your Journey
            </Button>
          </Link>
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <Button variant="outlined" size="large">
              Sign In
            </Button>
          </Link>
        </Box>

        <Divider sx={{ width: '100%', maxWidth: 400 }} />

        {/* Guest browse option */}
        <Typography variant="body2" color="text.secondary">
          Not ready to commit?{' '}
          <Link
            href="/quests"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            Browse the quest board
          </Link>
          {' '}or{' '}
          <Link
            href="/factions"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            explore the guilds
          </Link>
          {' '}without signing in.
        </Typography>
      </Box>
    </Box>
  );
}
