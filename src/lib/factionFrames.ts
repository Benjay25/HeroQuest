import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Faction border frames — each guild gets an ornamental SVG frame whose edges
 * AND corner motif reflect its character. All shapes fill with `url(#bf-grad)`
 * (or the Fighters file's black, swapped by BorderFrame) so BorderFrame can
 * inject a per-guild metallic gradient and 9-slice them identically.
 *
 * SERVER-ONLY (reads the Fighters SVG from disk). Returns { svg, slice, width }.
 *
 * Rendered weight ≈ sourceThickness × (width / slice). Edges stretch under
 * 9-slice; corners (within `slice`) stay fixed — so detailed motifs live in the
 * corners, and edges stay simple/straight (or gently curved) so they stretch
 * cleanly.
 */

export type FactionFrame = { svg: string; slice: number; width: number };

const FIGHTERS_SVG = readFileSync(
  join(process.cwd(), 'public', 'border-decoration.svg'),
  'utf8',
).replace(/<\?xml[^>]*\?>/, '');

const VB = 200;
const CORNER = 64;
const F = 'url(#bf-grad)';
const A = 6; // line inset from the edge

function svgWrap(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB} ${VB}">${inner}</svg>`;
}

/** Mirror a top-left corner into all four corners. */
function mirror(corner: string): string {
  return (
    `<g>${corner}</g>` +
    `<g transform="translate(${VB},0) scale(-1,1)">${corner}</g>` +
    `<g transform="translate(0,${VB}) scale(1,-1)">${corner}</g>` +
    `<g transform="translate(${VB},${VB}) scale(-1,-1)">${corner}</g>`
  );
}

// ── Shared straight pieces ──
function straightEdges(thick: number, rounded = false): string {
  const rx = rounded ? thick / 2 : 0;
  const s = CORNER, e = VB - CORNER;
  return (
    `<rect x="${s}" y="${A}" width="${e - s}" height="${thick}" rx="${rx}" fill="${F}"/>` +
    `<rect x="${s}" y="${VB - A - thick}" width="${e - s}" height="${thick}" rx="${rx}" fill="${F}"/>` +
    `<rect x="${A}" y="${s}" width="${thick}" height="${e - s}" rx="${rx}" fill="${F}"/>` +
    `<rect x="${VB - A - thick}" y="${s}" width="${thick}" height="${e - s}" rx="${rx}" fill="${F}"/>`
  );
}
function straightArms(thick: number, rounded = false): string {
  const rx = rounded ? thick / 2 : 0;
  return (
    `<rect x="26" y="${A}" width="${CORNER - 26}" height="${thick}" rx="${rx}" fill="${F}"/>` +
    `<rect x="${A}" y="26" width="${thick}" height="${CORNER - 26}" rx="${rx}" fill="${F}"/>`
  );
}

/** Default frame: straight edges + straight L-arms + a corner flair. */
function defaultFrame(thick: number, rounded: boolean, flair: string): string {
  return svgWrap(straightEdges(thick, rounded) + mirror(straightArms(thick, rounded) + flair));
}

// ════════════════════════════════════════════════════════════
// Bespoke frames
// ════════════════════════════════════════════════════════════

// ── Mages — flowing, magical lines (gentle S-curves) + orb & sparkles ──
function magesFrame(): string {
  const t = 9;
  const cy = A + t / 2;
  const stroke = `fill="none" stroke="${F}" stroke-width="${t}" stroke-linecap="round"`;
  const edges =
    `<path d="M${CORNER} ${cy} C 92 ${cy - 7} 108 ${cy + 7} ${VB - CORNER} ${cy}" ${stroke}/>` +
    `<path d="M${CORNER} ${VB - cy} C 92 ${VB - cy - 7} 108 ${VB - cy + 7} ${VB - CORNER} ${VB - cy}" ${stroke}/>` +
    `<path d="M${cy} ${CORNER} C ${cy - 7} 92 ${cy + 7} 108 ${cy} ${VB - CORNER}" ${stroke}/>` +
    `<path d="M${VB - cy} ${CORNER} C ${VB - cy - 7} 92 ${VB - cy + 7} 108 ${VB - cy} ${VB - CORNER}" ${stroke}/>`;
  const arms =
    `<path d="M26 ${cy} C 34 ${cy - 7} 42 ${cy + 7} 50 ${cy} S 60 ${cy - 5} ${CORNER} ${cy}" ${stroke}/>` +
    `<path d="M${cy} 26 C ${cy - 7} 34 ${cy + 7} 42 ${cy} 50 S ${cy - 5} 60 ${cy} ${CORNER}" ${stroke}/>`;
  const orb =
    `<circle cx="21" cy="21" r="13" fill="none" stroke="${F}" stroke-width="4.5"/>` +
    `<circle cx="21" cy="21" r="5" fill="${F}"/>` +
    `<circle cx="45" cy="13" r="3.6" fill="${F}"/>` +
    `<circle cx="13" cy="45" r="3.6" fill="${F}"/>`;
  return svgWrap(edges + mirror(arms + orb));
}

// ── The Court — Roman columns: fluted shafts + triangular pediments ──
function courtFrame(): string {
  const lines = [0, 3.6, 7.2]; // three thin flutes (~9 total)
  const h = 1.8;
  const s = CORNER, e = VB - CORNER;
  let edges = '';
  for (const o of lines) {
    edges += `<rect x="${s}" y="${A + o}" width="${e - s}" height="${h}" fill="${F}"/>`;
    edges += `<rect x="${s}" y="${VB - A - h - o}" width="${e - s}" height="${h}" fill="${F}"/>`;
    edges += `<rect x="${A + o}" y="${s}" width="${h}" height="${e - s}" fill="${F}"/>`;
    edges += `<rect x="${VB - A - h - o}" y="${s}" width="${h}" height="${e - s}" fill="${F}"/>`;
  }
  let arms = '';
  for (const o of lines) {
    arms += `<rect x="26" y="${A + o}" width="${CORNER - 26}" height="${h}" fill="${F}"/>`;
    arms += `<rect x="${A + o}" y="26" width="${h}" height="${CORNER - 26}" fill="${F}"/>`;
  }
  // Triangular pediments instead of orbs.
  const pediments =
    `<path d="M6 26 L17 7 L28 26 Z" fill="${F}"/>` +
    `<path d="M30 16 L37 6 L44 16 Z" fill="${F}"/>` +
    `<path d="M16 30 L6 37 L16 44 Z" fill="${F}"/>`;
  return svgWrap(edges + mirror(arms + pediments));
}

// ── Hearthkeepers — strong walls: double courses, blocky (no twists) ──
function hearthkeepersFrame(): string {
  const outer = 8, inner = 3, gap = 4;
  const io = A + outer + gap; // inner line offset
  const s = CORNER, e = VB - CORNER;
  const edges =
    // outer course
    `<rect x="${s}" y="${A}" width="${e - s}" height="${outer}" fill="${F}"/>` +
    `<rect x="${s}" y="${VB - A - outer}" width="${e - s}" height="${outer}" fill="${F}"/>` +
    `<rect x="${A}" y="${s}" width="${outer}" height="${e - s}" fill="${F}"/>` +
    `<rect x="${VB - A - outer}" y="${s}" width="${outer}" height="${e - s}" fill="${F}"/>` +
    // inner course
    `<rect x="${s}" y="${io}" width="${e - s}" height="${inner}" fill="${F}"/>` +
    `<rect x="${s}" y="${VB - io - inner}" width="${e - s}" height="${inner}" fill="${F}"/>` +
    `<rect x="${io}" y="${s}" width="${inner}" height="${e - s}" fill="${F}"/>` +
    `<rect x="${VB - io - inner}" y="${s}" width="${inner}" height="${e - s}" fill="${F}"/>`;
  const arms =
    `<rect x="22" y="${A}" width="${CORNER - 22}" height="${outer}" fill="${F}"/>` +
    `<rect x="${A}" y="22" width="${outer}" height="${CORNER - 22}" fill="${F}"/>` +
    `<rect x="26" y="${io}" width="${CORNER - 26}" height="${inner}" fill="${F}"/>` +
    `<rect x="${io}" y="26" width="${inner}" height="${CORNER - 26}" fill="${F}"/>`;
  // Keep the cozy rounded-tile ornament, set into the corner.
  const tile = `<rect x="${io + 4}" y="${io + 4}" width="22" height="22" rx="7" fill="none" stroke="${F}" stroke-width="5"/>`;
  return svgWrap(edges + mirror(arms + tile));
}

// ── Bards — beamed pair of eighth notes in each corner ──
function bardsFrame(): string {
  const t = 9;
  const notes =
    `<circle cx="15" cy="42" r="6" fill="${F}"/>` +
    `<rect x="20" y="16" width="3" height="27" fill="${F}"/>` +
    `<circle cx="33" cy="36" r="5" fill="${F}"/>` +
    `<rect x="37" y="13" width="3" height="24" fill="${F}"/>` +
    `<path d="M20 16 L40 12 L40 18 L20 22 Z" fill="${F}"/>`; // beam
  return svgWrap(straightEdges(t, true) + mirror(straightArms(t, true) + notes));
}

// ── Configs for the remaining (default-style) guilds ──
const DEFAULTS: Record<string, { thick: number; width: number; rounded: boolean; flair: string }> = {
  'merchants-league': {
    thick: 9, width: 16, rounded: false,
    flair:
      `<circle cx="17" cy="25" r="12" fill="none" stroke="${F}" stroke-width="4.5"/>` +
      `<circle cx="27" cy="15" r="12" fill="none" stroke="${F}" stroke-width="4.5"/>`,
  },
  'the-wanderers': {
    thick: 9, width: 16, rounded: true,
    flair:
      `<path d="M7 44 Q7 7 44 7 Q37 37 7 44 Z" fill="${F}"/>` +
      `<circle cx="47" cy="47" r="4" fill="${F}"/>`,
  },
  'the-conclave': {
    thick: 6, width: 13, rounded: false,
    flair: `<circle cx="19" cy="19" r="10" fill="none" stroke="${F}" stroke-width="3.5"/>`,
  },
};

const FALLBACK = { thick: 9, width: 16, rounded: false, flair: `<circle cx="16" cy="16" r="9" fill="${F}"/>` };

/** Get the frame for a guild by slug. */
export function getFactionFrame(slug: string): FactionFrame {
  switch (slug) {
    case 'fighters-guild':    return { svg: FIGHTERS_SVG, slice: 200, width: 14 };
    case 'mages-guild':       return { svg: magesFrame(), slice: CORNER, width: 16 };
    case 'the-court':         return { svg: courtFrame(), slice: CORNER, width: 16 };
    case 'the-hearthkeepers': return { svg: hearthkeepersFrame(), slice: CORNER, width: 19 };
    case 'the-bards':         return { svg: bardsFrame(), slice: CORNER, width: 16 };
    default: {
      const cfg = DEFAULTS[slug] ?? FALLBACK;
      return { svg: defaultFrame(cfg.thick, cfg.rounded, cfg.flair), slice: CORNER, width: cfg.width };
    }
  }
}
