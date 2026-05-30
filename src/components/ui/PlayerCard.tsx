import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import type { User } from '@supabase/supabase-js';

import type { Profile } from '@/types/database';
import { levelTitle, xpForNextLevel, xpProgress } from '@/types/database';
import { Stack } from '@mui/material';

/**
 * PlayerCard — the full-width character status card on the dashboard.
 *
 * Designed to feel like a game's character screen rather than a profile row.
 * Has deliberate space for faction standings, paths, and clan info to
 * slot in naturally as those features are built.
 *
 * This is a Server Component — it receives data as props from the
 * dashboard page, which fetches it on the server.
 */

interface PlayerCardProps {
  user: User;
  profile: Profile | null;
}

export default function PlayerCard({ user, profile }: PlayerCardProps) {
  const name     = profile?.display_name ?? user.user_metadata?.display_name ?? 'Adventurer';
  const xp       = profile?.xp ?? 0;
  const level    = profile?.level ?? 1;
  const streak   = profile?.streak_days ?? 0;
  const title    = levelTitle(level);
  const nextXp   = xpForNextLevel(level);
  const progress = xpProgress(xp, level);

  const initials = name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        borderRadius: 0,
        overflow: 'hidden',
        // border: '1px solid',
        borderColor: 'rgba(217, 182, 89, 0.2)',
        // Layered background: dark base with a subtle diagonal gradient.
        // Hardcoded rather than using a theme callback — theme functions
        // cannot be passed from Server Components to Client Components (React 19).
        background: 'linear-gradient(105deg, #1e1a14 0%, rgba(42,35,24,0.95) 50%, rgba(30,26,20,0.98) 100%)',
      }}
    >
      <Stack sx={{ width: '100%', maxWidth: 1000, marginInline: 'auto'}}>
        {/* Decorative gold accent line across the top */}
        <Box
          sx={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(217, 182, 89,0.6), transparent)',
          }}
        />

        {/* Card content */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 2, md: 3 },
            px: { xs: 2.5, md: 3 },
            py: { xs: 2, md: 2 },
          }}
        >
          {/* Avatar */}
          <Avatar
            sx={{
              width: { xs: 56, md: 60 },
              height: { xs: 56, md: 60 },
              flexShrink: 0,
              bgcolor: 'primary.dark',
              color: 'background.default',
              fontFamily: 'Cinzel, serif',
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              fontWeight: 700,
              border: '2px solid',
              borderColor: 'rgba(217, 182, 89, 0.4)',
            }}
          >
            {initials}
          </Avatar>

          {/* Identity + XP — grows to fill available space */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>

            {/* Name row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography
                variant="h3"
                sx={{
                  lineHeight: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {name}
              </Typography>
              <Chip
                label={title}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ flexShrink: 0 }}
              />
              {streak > 0 && (
                <Chip
                  label={`${streak} day streak 🔥`}
                  variant="outlined"
                  size="small"
                  sx={{
                    flexShrink: 0,
                    borderColor: 'rgba(230, 126, 34, 0.5)',
                    color: 'warning.main',
                  }}
                />
              )}
            </Box>

            {/* Level label */}
            <Typography variant="overline" color="primary.light" sx={{ display: 'block', mb: 0.5 }}>
              Level {level}
            </Typography>

            {/* XP bar */}
            <Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ mb: 0.75, height: 6 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  {xp.toLocaleString()} XP
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(nextXp - xp).toLocaleString()} XP to Level {level + 1}
                </Typography>
              </Box>
            </Box>

            {/*
              ── Future slots ──
              Faction standing chips, active path, clan name etc. will be
              added here as those features are built. The row below is a
              placeholder that reserves the space.
            */}
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              <Chip
                label="No guild affiliations yet"
                size="small"
                variant="outlined"
                sx={{
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                  fontStyle: 'italic',
                }}
              />
            </Box>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
