import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

/**
 * OrnateDivider — a decorative section separator: a fading rule with a
 * three-diamond motif (◇ ◆ ◇) in the centre.
 *
 * `color` accepts any 6-digit hex (so the fading line can be built from it).
 * Defaults to the theme gold. Pass a quest-type colour to match a container.
 */

const GOLD = '#d9b659';

function Diamond({ size, filled, color }: { size: number; filled: boolean; color: string }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        transform: 'rotate(45deg)',
        bgcolor: filled ? color : 'transparent',
        border: '1px solid',
        borderColor: color,
      }}
    />
  );
}

export default function OrnateDivider({
  color = GOLD,
  maxWidth = 360,
  sx,
}: {
  color?: string;
  maxWidth?: number | string;
  sx?: SxProps<Theme>;
}) {
  // `${color}99` adds ~60% alpha to the 6-digit hex so the line fades softly.
  const lineLeft = { flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${color}99)` };
  const lineRight = { flex: 1, height: '1px', background: `linear-gradient(90deg, ${color}99, transparent)` };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.25,
        width: '100%',
        maxWidth,
        mx: 'auto',
        ...sx,
      }}
    >
      <Box sx={lineLeft} />
      <Diamond size={6} filled={false} color={color} />
      <Diamond size={9} filled color={color} />
      <Diamond size={6} filled={false} color={color} />
      <Box sx={lineRight} />
    </Box>
  );
}
