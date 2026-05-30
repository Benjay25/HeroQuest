import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import type { FactionWithReputation } from '@/types/database';
import { factionRankTitle, factionRankProgress } from '@/types/database';
import { OrnateCorners } from '@/components/ui/CornerFrame';
import OrnateDivider from '@/components/ui/OrnateDivider';
import BorderFrame from '@/components/ui/BorderFrame';
import { getFactionFrame } from '@/lib/factionFrames';

/**
 * FactionCard — a collectible-card style guild tile (think MTG / Hearthstone):
 * a framed "art window" with the guild's icon as its centrepiece, a nameplate,
 * an ornate divider, and a text panel. The guild colour runs through the whole
 * frame. Links to the guild's page.
 *
 * Server Component: the faction colour is a plain hex string, safe inline.
 */
export default function FactionCard({
  faction,
  showReputation,
}: {
  faction: FactionWithReputation;
  showReputation: boolean;
}) {
  const { colour } = faction;
  const repXp = faction.reputation?.xp ?? 0;
  const hasRep = faction.reputation !== null && repXp > 0;
  const frame = getFactionFrame(faction.slug);

  return (
    <Link href={`/factions/${faction.slug}`} style={{ textDecoration: 'none' }}>
      <Box
        sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          opacity: faction.is_featured ? 1 : 0.82,
          // Layered "card stock" background. Square corners so the ornamental
          // frame shows fully; content padded in to clear the frame.
          background: `linear-gradient(160deg, #221d16 0%, #18140f 60%, #120f0b 100%)`,
          p: '22px',
          boxShadow: 'inset 0 0 0 1px rgba(217,182,89,0.1), 0 4px 18px rgba(0,0,0,0.45)',
          transition: 'transform 0.18s ease, box-shadow 0.18s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `inset 0 0 0 1px rgba(217,182,89,0.16), 0 8px 26px rgba(0,0,0,0.55), 0 0 22px ${colour}44`,
          },
        }}
      >
        <BorderFrame svg={frame.svg} slice={frame.slice} color={colour} width={frame.width} />

        {/* ── Art window ── */}
        <Box
          sx={{
            position: 'relative',
            m: 1.5,
            mb: 0.5,
            height: 210,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: `${colour}88`,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // Coloured "illustration" backdrop (stands in for real art for now).
            background: `radial-gradient(circle at 50% 38%, ${colour}40, ${colour}14 55%, rgba(10,9,7,0.85) 100%)`,
          }}
        >
          <OrnateCorners color={colour} />
          <Typography
            sx={{
              fontSize: 88,
              lineHeight: 1,
              filter: `drop-shadow(0 2px 6px rgba(0,0,0,0.6))`,
            }}
          >
            {faction.icon ?? '🏳️'}
          </Typography>
        </Box>

        {/* ── Nameplate ── */}
        <Box sx={{ px: 2, pt: 1.5, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ lineHeight: 1.2, color: 'text.primary' }}>
            {faction.name}
          </Typography>
          {faction.category && (
            <Typography variant="caption" sx={{ color: colour, letterSpacing: '0.08em' }}>
              {faction.category.toUpperCase()}
            </Typography>
          )}
        </Box>

        <OrnateDivider color={colour} maxWidth={150} sx={{ my: 1.75 }} />

        {/* ── Text panel ── */}
        <Box
          sx={{
            mx: 1.5,
            mb: 1.5,
            p: 2.25,
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 1.5,
            bgcolor: 'rgba(0,0,0,0.25)',
            border: '1px solid',
            borderColor: 'rgba(217,182,89,0.12)',
          }}
        >
          {faction.tagline && (
            <Typography variant="body2" sx={{ fontStyle: 'italic', textAlign: 'center' }}>
              {faction.tagline}
            </Typography>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* Standing / status footer */}
          {showReputation ? (
            hasRep ? (
              <Box sx={{ mt: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: colour }}>
                    {factionRankTitle(repXp)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {repXp.toLocaleString()} rep
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={factionRankProgress(repXp)}
                  sx={{
                    height: 5,
                    borderRadius: 1,
                    bgcolor: 'rgba(255,255,255,0.06)',
                    '& .MuiLinearProgress-bar': { bgcolor: colour },
                  }}
                />
              </Box>
            ) : (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1.5, fontStyle: 'italic', textAlign: 'center' }}
              >
                No standing yet — complete a quest for this guild.
              </Typography>
            )
          ) : (
            !faction.is_featured && (
              <Chip
                label="Coming soon"
                size="small"
                variant="outlined"
                sx={{ alignSelf: 'center', mt: 1.5 }}
              />
            )
          )}
        </Box>
      </Box>
    </Link>
  );
}
