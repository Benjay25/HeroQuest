import type { Metadata } from 'next';
import { Cinzel, Crimson_Text } from 'next/font/google';
import ThemeRegistry from '@/theme/ThemeRegistry';
import './globals.css';

/**
 * next/font/google automatically downloads and self-hosts Google Fonts.
 * This is better than a <link> tag because:
 *   1. No external network request at runtime — fonts are served from your domain
 *   2. Zero layout shift — Next.js inlines the font-face declaration so the
 *      browser knows the font before it renders any text
 *   3. Privacy — no Google tracking pixels on your users
 *
 * Each font is loaded once here at the root and exposed as a CSS variable,
 * which the MUI theme references by name ('Cinzel, serif' etc.)
 */
const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',    // accessible in CSS as var(--font-cinzel)
  display: 'swap',              // show fallback font while Cinzel loads
  weight: ['400', '600', '700'],
});

const crimsonText = Crimson_Text({
  subsets: ['latin'],
  variable: '--font-crimson-text',
  display: 'swap',
  weight: ['400', '600'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'HeroQuest',
  description: 'Your quest log for the real world.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /**
     * The font variables are added as classes on <html> so they're available
     * to every element in the document via CSS custom properties.
     *
     * ThemeRegistry wraps everything below <body> — it must be inside the
     * component tree (not a sibling of <html>) so it can use React context.
     * It provides:
     *   - The Emotion cache (prevents style flash on server render)
     *   - MUI ThemeProvider (our custom theme)
     *   - CssBaseline (browser style normalisation)
     */
    <html lang="en" className={`${cinzel.variable} ${crimsonText.variable}`}>
      <body>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
