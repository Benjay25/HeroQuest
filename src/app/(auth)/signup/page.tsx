/**
 * Signup Page — Server Component.
 * Same pattern as login: native <form action={serverAction}> + SubmitButton.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import SubmitButton from '@/components/ui/SubmitButton';
import { signUp } from '@/lib/supabase/actions/auth';
import { createClient } from '@/lib/supabase/server';

interface SignupPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  const { error } = await searchParams;

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
            Your Legend Begins
          </Typography>
          <Typography variant="h3" sx={{ mt: 1 }}>
            Create Account
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Choose your name wisely. It will be remembered.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
            {decodeURIComponent(error)}
          </Alert>
        )}

        <form action={signUp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <TextField
            name="displayName"
            label="Display Name"
            type="text"
            required
            fullWidth
            autoFocus
            autoComplete="nickname"
            helperText="This is how you'll appear to others"
          />

          <TextField
            name="email"
            label="Email"
            type="email"
            required
            fullWidth
            autoComplete="email"
          />

          <TextField
            name="password"
            label="Password"
            type="password"
            required
            fullWidth
            autoComplete="new-password"
            helperText="At least 6 characters"
          />

          <SubmitButton
            variant="contained"
            size="large"
            fullWidth
            pendingText="Creating account..."
            sx={{ mt: 1 }}
          >
            Begin Your Journey
          </SubmitButton>
        </form>

        <Divider sx={{ my: 3 }} />

        <Typography variant="body2" align="center" color="text.secondary">
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'inherit', textDecoration: 'underline' }}>
            Sign in
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
