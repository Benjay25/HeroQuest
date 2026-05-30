import Box from '@mui/material/Box';

/**
 * BorderFrame — overlays an ornamental border SVG around its parent as a TRUE
 * responsive border with a metallic finish. Cross-browser (uses `border-image`,
 * which Firefox supports — unlike mask-border).
 *
 * The `svg` source (see lib/factionFrames) uses `fill="url(#bf-grad)"` (or the
 * Fighters file's black, swapped here). We inject a per-`color` linear gradient
 * (highlight = the normal colour, mid tones darker → metallic) and feed the
 * result to `border-image`, which 9-slices it: corners crisp, edges stretch.
 *
 * Purely decorative (pointer-events none). Parent must be position: relative.
 */

/** Darken (f<1) or lighten (f>1) a #rrggbb hex by a multiplier. */
function shade(hex: string, f: number): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const m = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `#${[m(r), m(g), m(b)].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

export default function BorderFrame({
  svg,
  slice,
  color = '#d9b659',
  width = 14,
  repeat = 'stretch',
}: {
  svg: string;
  slice: number;
  color?: string;
  width?: number;
  repeat?: 'stretch' | 'round' | 'space';
}) {
  // Metallic sheen: brightest = the normal colour, mids darker.
  const gradient =
    `<defs><linearGradient id="bf-grad" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="${color}"/>` +
    `<stop offset="28%" stop-color="${shade(color, 0.62)}"/>` +
    `<stop offset="50%" stop-color="${shade(color, 0.42)}"/>` +
    `<stop offset="72%" stop-color="${shade(color, 0.62)}"/>` +
    `<stop offset="100%" stop-color="${color}"/>` +
    `</linearGradient></defs>`;

  const withGradient = svg
    .replace(/fill="rgb\(0%, 0%, 0%\)"/g, 'fill="url(#bf-grad)"')
    .replace(/(<svg[^>]*>)/, `$1${gradient}`);

  const source = `data:image/svg+xml,${encodeURIComponent(withGradient)}`;

  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 2,
        borderStyle: 'solid',
        borderWidth: `${width}px`,
        borderColor: 'transparent',
        borderImage: `url("${source}") ${slice} / ${width}px ${repeat}`,
      }}
    />
  );
}
