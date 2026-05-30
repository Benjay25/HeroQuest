import { createTheme } from '@mui/material/styles';

/**
 * HeroQuest Theme
 *
 * This is the single source of truth for all visual decisions in the app.
 * Colours, typography, spacing, component defaults — all defined here.
 * 
 * MUI's createTheme() accepts a plain object and returns a full theme
 * with all the defaults filled in. We only override what we want to change.
 *
 * IMPORTANT: To change the look of the entire app, change values here —
 * never hardcode colours or fonts in individual components.
 */

// Raw colour values — defined once, referenced everywhere.
// Keeping these as constants means we can update a colour in one place.
const RAW = {
  // Backgrounds — unchanged (darks stay dark)
  charcoal:    '#0e0c09',
  stone:       '#1e1a14',
  stoneMid:    '#2a2318',
  stoneLight:  '#3a3025',

  // Accent — brightened slightly for more contrast (same hues)
  gold:        '#d9b659',
  goldLight:   '#f2d57a',
  goldDim:     '#917640',

  // Text — secondary brightened for readability; primary nudged up
  parchment:   '#f5ecd4',
  parchmentDim:'#b3a489',

  // Quest type colours
  daily:       '#4caf7d',  // green  — recurring, natural
  weekly:      '#5b8dd9',  // blue   — structured, reliable
  story:       '#c9a84c',  // gold   — epic, important (reuses accent)
  fog:         '#8a7fa8',  // purple — obscured, uneasy

  // Status
  error:       '#c0392b',
  warning:     '#e67e22',
  success:     '#4caf7d',
  info:        '#5b8dd9',
};

const theme = createTheme({
  /**
   * PALETTE
   * MUI uses these semantic colour roles throughout its components.
   * primary   → main interactive colour (buttons, links, focus rings)
   * secondary → supporting accent
   * background → page and surface colours
   * text      → foreground text colours
   */
  palette: {
    mode: 'dark',

    primary: {
      main:  RAW.gold,
      light: RAW.goldLight,
      dark:  RAW.goldDim,
      // contrastText is the text colour placed ON a primary-coloured surface.
      // Dark text on gold is more readable than white.
      contrastText: RAW.charcoal,
    },

    secondary: {
      main:  RAW.fog,
      light: '#a090c0',
      dark:  '#5a506a',
      contrastText: RAW.parchment,
    },

    background: {
      default: RAW.charcoal,   // <body> background
      paper:   RAW.stone,      // cards, modals, drawers
    },

    text: {
      primary:   RAW.parchment,
      secondary: RAW.parchmentDim,
      disabled:  '#5a4e3a',
    },

    error:   { main: RAW.error },
    warning: { main: RAW.warning },
    success: { main: RAW.success },
    info:    { main: RAW.info },

    divider: 'rgba(217, 182, 89, 0.2)',
  },

  /**
   * TYPOGRAPHY
   * fontFamily: base font for body text (readable, slightly old-world feel)
   * We'll load Cinzel (display/headings) and Crimson Text (body) from Google Fonts.
   *
   * MUI's type scale: h1–h6, subtitle1–2, body1–2, caption, overline, button
   */
  typography: {
    // fontSize is MUI's internal base size (default: 14px).
    // Raising it to 16 scales all MUI typography proportionally —
    // a clean single-point change rather than touching every variant.
    fontSize: 18,

    // Crimson Text for body — a modern serif with old-world character.
    // The array is a fallback chain: if Crimson Text fails to load,
    // fall back to Georgia, then the browser's default serif.
    fontFamily: [
      'Crimson Text',
      'Georgia',
      'serif',
    ].join(','),

    // Display headings use Cinzel — a roman-inscription style typeface.
    // We apply this selectively to h1–h3 and certain UI labels.
    h1: {
      fontFamily: 'Cinzel, serif',
      fontWeight: 700,
      fontSize: '3rem',
      letterSpacing: '0.05em',
      color: RAW.goldLight,
    },
    h2: {
      fontFamily: 'Cinzel, serif',
      fontWeight: 600,
      fontSize: '2.25rem',
      letterSpacing: '0.04em',
      color: RAW.goldLight,
    },
    h3: {
      fontFamily: 'Cinzel, serif',
      fontWeight: 600,
      fontSize: '1.75rem',
      letterSpacing: '0.03em',
    },
    h4: {
      fontFamily: 'Cinzel, serif',
      fontWeight: 600,
      fontSize: '1.4rem',
    },
    h5: {
      fontFamily: 'Cinzel, serif',
      fontWeight: 600,
      fontSize: '1.2rem',
    },
    h6: {
      fontFamily: 'Cinzel, serif',
      fontWeight: 600,
      fontSize: '1.05rem',
      letterSpacing: '0.05em',
    },
    // subtitle: used for section labels, card subheadings
    subtitle1: {
      fontSize: '1.1rem',
      color: RAW.parchmentDim,
      fontStyle: 'italic',
    },
    subtitle2: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '0.8rem',
      letterSpacing: '0.15em',
      textTransform: 'uppercase' as const,
      color: RAW.parchmentDim,
    },
    // body: used for quest descriptions, general content
    body1: {
      fontSize: '1.2rem',
      lineHeight: 1.7,
    },
    body2: {
      fontSize: '1.05rem',
      lineHeight: 1.6,
      color: RAW.parchmentDim,
    },
    // caption: timestamps, metadata, small labels
    caption: {
      fontSize: '0.85rem',
      color: RAW.parchmentDim,
    },
    // overline: used for eyebrow labels above headings (e.g. "DAILY QUEST")
    overline: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '0.78rem',
      letterSpacing: '0.25em',
      fontWeight: 600,
    },
    // button: MUI applies this to Button text automatically
    button: {
      fontFamily: 'Cinzel, serif',
      letterSpacing: '0.08em',
      fontWeight: 600,
    },
  },

  /**
   * SHAPE
   * borderRadius sets the default corner rounding for cards, buttons, etc.
   * We use a small value — sharp corners feel more architectural/medieval.
   */
  shape: {
    borderRadius: 8,
  },

  /**
   * COMPONENT OVERRIDES
   * MUI lets you set default props and style overrides for any component,
   * globally. This means we don't have to repeat the same props everywhere.
   *
   * For example: every Card in the app will automatically have the border
   * defined below — no need to add sx={{ border: ... }} to each one.
   */
  components: {
    // Card — the main surface for quest entries
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // MUI adds a subtle gradient in dark mode by default — remove it
          border: `1px solid rgba(217, 182, 89, 0.26)`,
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        },
      },
    },

    // Paper — the base surface component (Card extends this)
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },

    // Button — quest action buttons
    MuiButton: {
      defaultProps: {
        disableElevation: true, // flat buttons fit the aesthetic better than raised
      },
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: '8px 20px',
        },
        // The "contained" variant (solid fill) — used for primary actions
        contained: {
          background: `linear-gradient(135deg, ${RAW.goldDim}, ${RAW.gold})`,
          color: RAW.charcoal,
          '&:hover': {
            background: `linear-gradient(135deg, ${RAW.gold}, ${RAW.goldLight})`,
          },
        },
        // The "outlined" variant — secondary actions
        outlined: {
          borderColor: `rgba(217, 182, 89, 0.4)`,
          color: RAW.gold,
          '&:hover': {
            borderColor: RAW.gold,
            background: `rgba(217, 182, 89, 0.08)`,
          },
        },
      },
    },

    // Chip — used for quest type badges, faction tags
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: 'Cinzel, serif',
          fontSize: '0.7rem',
          letterSpacing: '0.05em',
          borderRadius: 4,
        },
      },
    },

    // Divider — decorative separator lines
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(217, 182, 89, 0.15)',
        },
      },
    },

    // TextField / Input — quest creation forms
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(217, 182, 89, 0.25)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(217, 182, 89, 0.5)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: RAW.gold,
          },
        },
      },
    },

    // Tooltip — hover hints
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontFamily: 'Crimson Text, serif',
          fontSize: '0.85rem',
          backgroundColor: RAW.stoneMid,
          border: '1px solid rgba(217, 182, 89, 0.2)',
        },
        arrow: {
          color: RAW.stoneMid,
        },
      },
    },

    // LinearProgress — XP bars, quest progress
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          backgroundColor: RAW.stoneLight,
          height: 6,
        },
        bar: {
          borderRadius: 2,
          background: `linear-gradient(90deg, ${RAW.goldDim}, ${RAW.gold})`,
        },
      },
    },
  },
});

// Export the RAW colours too so components can reference them if needed
// without going through the theme object (useful for one-off SVG colours etc.)
export { RAW };
export default theme;
