import { notFound } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import { createClient } from '@/lib/supabase/server';
import { getFactionWithReputation } from '@/lib/supabase/queries/factions';
import LeaderPanel from '@/components/ui/LeaderPanel';
import { OrnateCorners } from '@/components/ui/CornerFrame';
import OrnateDivider from '@/components/ui/OrnateDivider';
import {
  factionRankTitle,
  factionRankProgress,
  xpToNextFactionRank,
} from '@/types/database';

// Shared "card-stock" panel style — layered gradient + inset gold hairline +
// drop shadow, matching the look established on the guild cards.
const PANEL = {
  position: 'relative' as const,
  borderRadius: 2,
  background: 'linear-gradient(160deg, #221d16 0%, #18140f 70%, #161310 100%)',
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: 'inset 0 0 0 1px rgba(217,182,89,0.08), 0 4px 18px rgba(0,0,0,0.4)',
};

export default async function FactionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const faction = await getFactionWithReputation(slug);
  if (!faction) notFound();

  const { colour } = faction;
  const repXp = faction.reputation?.xp ?? 0;
  const toNext = xpToNextFactionRank(repXp);

  return (
    <Box sx={{ maxWidth: 820, mx: 'auto', p: { xs: 2.5, md: 4 } }}>
      {/* Back link */}
      <Link href="/factions" style={{ textDecoration: 'none' }}>
        <Button size="small" sx={{ mb: 2, color: 'text.secondary', textTransform: 'none' }}>
          ← All Guilds
        </Button>
      </Link>

      {/* Banner */}
      <Box
        sx={{
          ...PANEL,
          overflow: 'hidden',
          p: { xs: 3, md: 4 },
          mb: 3,
          // Colour wash layered over the card-stock gradient.
          background: `linear-gradient(135deg, ${colour}26 0%, #1d1812 55%, #161310 100%)`,
        }}
      >
        <Box sx={{ height: 4, bgcolor: colour, position: 'absolute', top: 0, left: 0, right: 0 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 } }}>
          {/* Framed art window for the icon */}
          <Box
            sx={{
              position: 'relative',
              width: { xs: 84, md: 96 },
              height: { xs: 84, md: 96 },
              flexShrink: 0,
              borderRadius: 1.5,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: `${colour}88`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `radial-gradient(circle at 50% 40%, ${colour}40, ${colour}12 60%, rgba(10,9,7,0.85) 100%)`,
            }}
          >
            <OrnateCorners color={colour} inset={3} />
            <Typography sx={{ fontSize: { xs: 44, md: 52 }, lineHeight: 1, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}>
              {faction.icon ?? '🏳️'}
            </Typography>
          </Box>
          <Box sx={{ minWidth: 0 }}>
            {faction.category && (
              <Typography variant="overline" sx={{ color: colour }}>{faction.category}</Typography>
            )}
            <Typography variant="h2" sx={{ mt: -0.5 }}>{faction.name}</Typography>
            {faction.tagline && (
              <Typography variant="subtitle1" sx={{ mt: 0.5 }}>{faction.tagline}</Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Standing (logged-in only) */}
      {user && (
        <Box sx={{ ...PANEL, borderLeft: '3px solid', borderLeftColor: colour, p: 2.5, mb: 3 }}>
          <Typography variant="overline" color="text.secondary">Your Standing</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5, mb: 1 }}>
            <Typography variant="h5" sx={{ color: colour }}>{factionRankTitle(repXp)}</Typography>
            <Chip label={`${repXp.toLocaleString()} rep`} size="small" variant="outlined" />
          </Box>
          <LinearProgress
            variant="determinate"
            value={factionRankProgress(repXp)}
            sx={{
              height: 6,
              borderRadius: 1,
              bgcolor: 'rgba(255,255,255,0.06)',
              '& .MuiLinearProgress-bar': { bgcolor: colour },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
            {toNext === null
              ? 'You have reached the highest rank this guild can offer.'
              : `${toNext.toLocaleString()} reputation until your next rank.`}
          </Typography>
        </Box>
      )}

      {/* Lore */}
      <Box sx={{ ...PANEL, p: { xs: 2.5, md: 3 }, mb: 3 }}>
        <Typography variant="h4" sx={{ color: colour }}>Lore</Typography>
        <OrnateDivider color={colour} maxWidth={120} sx={{ my: 1.5, mx: 0 }} />
        {faction.lore ? (
          <Typography variant="body1" color="text.secondary">{faction.lore}</Typography>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            This guild&apos;s history has yet to be written. Check back soon.
          </Typography>
        )}
      </Box>

      {/* Leader — RPG-style character / dialogue panel */}
      <LeaderPanel faction={faction} />
    </Box>
  );
}
