/**
 * Login Page — Server Component.
 *
 * No longer needs 'use client' because we removed the useState for loading.
 * The loading state is now handled by SubmitButton via useFormStatus.
 *
 * The form passes the server action directly to the native <form> action prop.
 * This is the correct React 19 / Next.js 16 pattern:
 *
 *   <form action={serverAction}>   ← React handles this natively
 *     <SubmitButton>               ← useFormStatus detects pending state
 *
 * The error display still uses URL params set by the server action on failure.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import SubmitButton from '@/components/ui/SubmitButton';
import { signIn } from '@/lib/supabase/actions/auth';
import { createClient } from '@/lib/supabase/server';

interface LoginPageProps {
  searchParams: Promise<{ error?: string; next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // If already logged in, skip this page
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  // searchParams is a Promise in Next.js 15+ — must be awaited
  const { error, next = '/dashboard' } = await searchParams;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 400 }}>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="overline" color="primary.light">
            Welcome Back, Adventurer
          </Typography>
          <Typography variant="h3" sx={{ mt: 1 }}>
            Sign In
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Your quests await.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
            {decodeURIComponent(error)}
          </Alert>
        )}

        {/*
          Native <form> with server action passed directly to action prop.
          React 19 intercepts this and handles the submission — no JS
          form handler needed. The server action runs on the server,
          then redirects or returns an error via URL params.
        */}
        <form action={signIn} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input type="hidden" name="next" value={next} />

          <TextField
            name="email"
            label="Email"
            type="email"
            required
            fullWidth
            autoComplete="email"
            autoFocus
          />

          <TextField
            name="password"
            label="Password"
            type="password"
            required
            fullWidth
            autoComplete="current-password"
          />

          <SubmitButton
            variant="contained"
            size="large"
            fullWidth
            pendingText="Signing in..."
            sx={{ mt: 1 }}
          >
            Enter the Realm
          </SubmitButton>
        </form>

        <Divider sx={{ my: 3 }} />

        <Typography variant="body2" align="center" color="text.secondary">
          No account yet?{' '}
          <Link href="/signup" style={{ color: 'inherit', textDecoration: 'underline' }}>
            Begin your journey
          </Link>
        </Typography>

        <Typography variant="body2" align="center" sx={{ mt: 1.5 }}>
          <Link href="/" style={{ color: 'inherit', opacity: 0.5, textDecoration: 'underline' }}>
            Continue as guest
          </Link>
        </Typography>

      </Box>
    </Box>
  );
}
