'use client';

/**
 * ThemeRegistry — App Router + MUI compatibility layer.
 *
 * The problem: MUI uses Emotion (a CSS-in-JS library) to generate styles.
 * In a standard React app this works fine — Emotion generates styles in the
 * browser. But Next.js App Router renders components on the SERVER first,
 * then sends HTML to the browser. If Emotion generates styles only in the
 * browser, the user sees an unstyled flash before the styles arrive.
 *
 * The solution: this component creates an Emotion "cache" on the server,
 * collects all the CSS that MUI would generate, and injects it into the
 * <head> of the HTML before it's sent to the browser. The user gets
 * styled HTML from the very first byte.
 *
 * You don't need to modify this file — just keep it wrapping your app
 * in the root layout.
 */

import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';
import theme from './theme';

function createEmotionCache() {
  // 'css' is the key prefix for generated class names, e.g. css-abc123.
  // prepend: true puts MUI styles before any other styles in the <head>,
  // so your own overrides always win.
  return createCache({ key: 'css', prepend: true });
}

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [{ cache, flush }] = React.useState(() => {
    const cache = createEmotionCache();
    cache.compat = true;

    // Override Emotion's insert method to track which styles have been
    // generated so we can inject them server-side.
    const prevInsert = cache.insert;
    let inserted: string[] = [];

    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };

    // flush() returns the collected styles and resets the tracker.
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };

    return { cache, flush };
  });

  // useServerInsertedHTML runs during server rendering and lets us inject
  // arbitrary HTML into the <head>. We use it to inject the MUI styles
  // that were generated while rendering the component tree.
  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;

    let styles = '';
    for (const name of names) {
      styles += cache.inserted[name];
    }

    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      {/*
        ThemeProvider: makes our custom theme available to every MUI
        component in the tree. Any component calling useTheme() or
        accessing theme via sx prop will use this theme.

        CssBaseline: MUI's version of a CSS reset. Normalises browser
        default styles (margins, box-sizing, font rendering) so the app
        looks consistent across browsers. Should always be inside ThemeProvider.
      */}
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
