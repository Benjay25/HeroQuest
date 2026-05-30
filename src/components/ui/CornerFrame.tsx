import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

/**
 * CornerFrame — wraps content with decorative corner ornaments.
 *
 * variant 'bracket' → simple CSS L-shaped corner ticks (subtle, cheap, crisp).
 * variant 'ornate'  → inline SVG double-bracket flourishes (fancier, gold).
 *
 * Prototype component for evaluating card corner decoration.
 */

const GOLD = '#d9b659';

function BracketCorners() {
  const base = {
    position: 'absolute' as const,
    width: 14,
    height: 14,
    borderColor: GOLD,
    pointerEvents: 'none' as const,
  };
  return (
    <>
      <Box sx={{ ...base, top: 5, left: 5, borderTop: '2px solid', borderLeft: '2px solid' }} />
      <Box sx={{ ...base, top: 5, right: 5, borderTop: '2px solid', borderRight: '2px solid' }} />
      <Box sx={{ ...base, bottom: 5, left: 5, borderBottom: '2px solid', borderLeft: '2px solid' }} />
      <Box sx={{ ...base, bottom: 5, right: 5, borderBottom: '2px solid', borderRight: '2px solid' }} />
    </>
  );
}

/**
 * One ornate corner SVG (top-left orientation); rotated per corner.
 * Designed to sit ON the border: a gold corner gem/stud at the corner point
 * with short frame lines running along the two edges.
 */
function OrnateCornerSvg({ color, sx }: { color: string; sx?: SxProps<Theme> }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 36 36"
      sx={{ position: 'absolute', width: 26, height: 26, pointerEvents: 'none', ...sx }}
    >
      {/* frame lines running along each edge */}
      <g fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round">
        <path d="M15 3 L33 3" />
        <path d="M3 15 L3 33" />
      </g>
      {/* corner gem (diamond), seated on the corner */}
      <path d="M9 2 L16 9 L9 16 L2 9 Z" fill={color} stroke={color} strokeWidth="0.5" strokeLinejoin="round" />
      {/* dark facet centre, giving the gem a studded look */}
      <circle cx="9" cy="9" r="2" fill="rgba(14,12,9,0.85)" />
    </Box>
  );
}

/**
 * OrnateCorners — the four gold corner flourishes, absolutely positioned.
 * Render inside any `position: relative` container to frame it. Decorative
 * only (pointer-events: none).
 */
export function OrnateCorners({ color = GOLD, inset = 0 }: { color?: string; inset?: number }) {
  return (
    <>
      <OrnateCornerSvg color={color} sx={{ top: inset, left: inset }} />
      <OrnateCornerSvg color={color} sx={{ top: inset, right: inset, transform: 'rotate(90deg)' }} />
      <OrnateCornerSvg color={color} sx={{ bottom: inset, right: inset, transform: 'rotate(180deg)' }} />
      <OrnateCornerSvg color={color} sx={{ bottom: inset, left: inset, transform: 'rotate(270deg)' }} />
    </>
  );
}

export default function CornerFrame({
  variant = 'bracket',
  children,
  sx,
}: {
  variant?: 'bracket' | 'ornate';
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      sx={{
        position: 'relative',
        border: '1px solid',
        borderColor: 'rgba(217,182,89,0.25)',
        borderRadius: 2,
        bgcolor: 'background.paper',
        ...sx,
      }}
    >
      {variant === 'bracket' ? <BracketCorners /> : <OrnateCorners />}
      {children}
    </Box>
  );
}
