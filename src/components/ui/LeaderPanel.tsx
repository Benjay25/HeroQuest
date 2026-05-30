import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PersonIcon from '@mui/icons-material/Person';
import type { FactionWithReputation } from '@/types/database';
import { OrnateCorners } from '@/components/ui/CornerFrame';

/**
 * LeaderPanel — presents a guild's leader as an RPG-style character panel:
 * a framed portrait placeholder beside their words (the blurb shown as speech).
 *
 * Placeholder strategy: the portrait is a colour-washed frame holding the
 * leader's initials (or a silhouette when there's no named leader yet). Drop a
 * real illustration into the portrait frame later with zero layout change.
 *
 * Renders nothing if the guild has neither a named leader nor a leader title.
 */
export default function LeaderPanel({ faction }: { faction: FactionWithReputation }) {
  const { colour, leader_name, leader_title, leader_blurb } = faction;

  if (!leader_name && !leader_title) return null;

  const initials = leader_name
    ? leader_name
        .split(' ')
        .map(w => w[0])
        .filter(Boolean)
        .slice(0, 1)
        .concat(
          leader_name.split(' ').length > 1
            ? [leader_name.split(' ').slice(-1)[0][0]]
            : [],
        )
        .join('')
        .toUpperCase()
    : null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2.5,
        p: 2.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: `${colour}55`,
        background: `linear-gradient(135deg, ${colour}14 0%, rgba(0,0,0,0.25) 70%)`,
      }}
    >
      {/* Portrait frame placeholder */}
      <Box
        sx={{
          position: 'relative',
          flexShrink: 0,
          width: { xs: '100%', sm: 116 },
          height: { xs: 150, sm: 150 },
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: `${colour}88`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: `radial-gradient(circle at 50% 40%, ${colour}40, ${colour}10 60%, rgba(10,9,7,0.9) 100%)`,
        }}
      >
        <OrnateCorners color={colour} />
        {initials ? (
          <Typography
            sx={{
              fontFamily: 'Cinzel, serif',
              fontWeight: 700,
              fontSize: 44,
              color: 'rgba(245,236,212,0.9)',
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))',
            }}
          >
            {initials}
          </Typography>
        ) : (
          <PersonIcon sx={{ fontSize: 64, color: `${colour}99` }} />
        )}
      </Box>

      {/* Identity + dialogue */}
      <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {leader_title && (
          <Typography variant="overline" sx={{ color: colour }}>
            {leader_title}
          </Typography>
        )}
        <Typography variant="h5" sx={{ mb: 1 }}>
          {leader_name ?? 'Yet to step forward'}
        </Typography>

        {/* Speech / dialogue box */}
        <Box
          sx={{
            position: 'relative',
            flexGrow: 1,
            borderRadius: 1.5,
            bgcolor: 'rgba(0,0,0,0.28)',
            border: '1px solid',
            borderColor: 'rgba(217,182,89,0.12)',
            p: 2,
            pt: 2.5,
          }}
        >
          {/* Decorative opening quote */}
          <Box
            sx={{
              position: 'absolute',
              top: -6,
              left: 10,
              fontFamily: 'Cinzel, serif',
              fontSize: 44,
              lineHeight: 1,
              color: `${colour}88`,
              userSelect: 'none',
            }}
          >
            &ldquo;
          </Box>
          <Typography
            variant="body2"
            sx={{ fontStyle: 'italic', color: 'text.secondary' }}
          >
            {leader_blurb ??
              `The ${faction.name} have not yet named who speaks for them. In time, a leader will emerge.`}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
