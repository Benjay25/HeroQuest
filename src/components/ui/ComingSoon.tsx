import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

/**
 * ComingSoon — a themed placeholder for routes that exist in the nav but
 * aren't built yet, so links never dead-end on a 404.
 */
export default function ComingSoon({
  eyebrow,
  title,
  blurb,
  icon,
}: {
  eyebrow: string;
  title: string;
  blurb: string;
  icon?: string;
}) {
  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 2,
        p: 4,
      }}
    >
      {icon && <Typography sx={{ fontSize: 56, opacity: 0.5, lineHeight: 1 }}>{icon}</Typography>}
      <Typography variant="overline" color="primary.light">{eyebrow}</Typography>
      <Typography variant="h2" sx={{ mt: -1 }}>{title}</Typography>
      <Typography variant="subtitle1" sx={{ maxWidth: 460 }}>{blurb}</Typography>
      <Chip label="Coming soon" variant="outlined" color="primary" sx={{ mt: 1 }} />
    </Box>
  );
}
