import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';

/**
 * 404 — Not Found
 *
 * Next.js renders this page automatically when:
 *   - A route doesn't exist
 *   - notFound() is called from any Server Component or Server Action
 *
 * This is a Server Component — no 'use client' needed since there's
 * no interactivity beyond a plain link.
 */
export default function NotFound() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 3,
        p: 4,
      }}
    >
      <Typography
        variant="overline"
        color="text.secondary"
      >
        Error 404
      </Typography>

      <Typography
        variant="h1"
        sx={{ fontSize: { xs: '4rem', md: '6rem' }, opacity: 0.15 }}
      >
        404
      </Typography>

      <Box sx={{ mt: -2 }}>
        <Typography variant="h3" sx={{ mb: 1 }}>
          Lost in the Fog
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 420, mx: 'auto', fontStyle: 'italic' }}
        >
          The path you seek does not exist — or perhaps it never did.
          The fog has swallowed it whole.
        </Typography>
      </Box>

      <Divider sx={{ width: '100%', maxWidth: 320 }} />

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <Button variant="contained" size="large">
            Return to Dashboard
          </Button>
        </Link>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Button variant="outlined" size="large">
            Go to Home
          </Button>
        </Link>
      </Box>
    </Box>
  );
}
