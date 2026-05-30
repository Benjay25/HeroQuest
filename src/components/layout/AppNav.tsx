'use client';

/**
 * AppNav — the persistent top navigation bar.
 *
 * 'use client' because it uses useState for the mobile drawer.
 *
 * It receives the user object as a prop from the server layout above it.
 * This is the correct pattern: the Server Component (layout.tsx) fetches
 * the user, the Client Component (this file) receives it and handles
 * interactivity. The server does the data work, the client does the UI work.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

import { signOut } from '@/lib/supabase/actions/auth';

// Navigation links visible to all users (guests and logged-in)
const PUBLIC_NAV = [
  { label: 'Quest Board', href: '/quests' },
  { label: 'Guilds', href: '/factions' },
];

// Additional links only shown to logged-in users
const AUTH_NAV = [
  { label: 'My Log', href: '/dashboard' },
];

interface AppNavProps {
  user: User | null;
}

export default function AppNav({ user }: AppNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = user ? [ ...AUTH_NAV, ...PUBLIC_NAV] : PUBLIC_NAV;

  // A link is "active" if the current URL starts with its href.
  // This highlights the current section in the nav.
  const isActive = (href: string) => pathname.startsWith(href);

  const navLinkStyles = (href: string) => ({
    fontFamily: 'Cinzel, serif',
    fontSize: '0.85rem',
    letterSpacing: '0.06em',
    color: isActive(href) ? 'primary.main' : 'text.secondary',
    borderBottom: isActive(href) ? '1px solid' : '1px solid transparent',
    borderColor: isActive(href) ? 'primary.main' : 'transparent',
    borderRadius: 0,
    pb: 0.25,
    '&:hover': { color: 'text.primary', background: 'transparent' },
  });

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'rgba(14, 12, 9, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ gap: 2 }}>

          {/* Logo / Brand */}
          <Typography
            component={Link}
            href="/"
            variant="h6"
            sx={{
              textDecoration: 'none',
              color: 'primary.main',
              flexShrink: 0,
              mr: 2,
            }}
          >
            HeroQuest
          </Typography>

          {/*
            Desktop: no nav links here — navigation lives in the Sidebar.
            AppBar is for identity (logo) and auth controls only.
            Mobile: the drawer below handles all navigation.
          */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Auth controls — desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1.5, alignItems: 'center' }}>
            {user ? (
              <>
                <Typography variant="caption" color="text.secondary">
                  {user.user_metadata?.display_name ?? user.email}
                </Typography>
                <form action={signOut}>
                  <Button type="submit" variant="outlined" size="small">
                    Sign Out
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Button component={Link} href="/login" variant="outlined" size="small">
                  Sign In
                </Button>
                <Button component={Link} href="/signup" variant="contained" size="small">
                  Join
                </Button>
              </>
            )}
          </Box>

          {/* Mobile menu button */}
          <IconButton
            sx={{ display: { md: 'none' } }}
            onClick={() => setDrawerOpen(true)}
            color="inherit"
            aria-label="open menu"
          >
            <MenuIcon />
          </IconButton>

        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 260,
              background: 'background.default',
              borderLeft: '1px solid',
              borderColor: 'divider',
            },
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" color="primary.main">Menu</Typography>
          <IconButton onClick={() => setDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        <List>
          {navLinks.map(link => (
            <ListItem key={link.href} disablePadding>
              <ListItemButton
                component={Link}
                href={link.href}
                onClick={() => setDrawerOpen(false)}
                selected={isActive(link.href)}
              >
                <ListItemText
                  primary={link.label}
                  slotProps={{
                    primary: { style: { fontFamily: 'Cinzel, serif', fontSize: '0.9rem' } },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider />

        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {user ? (
            <>
              <Typography variant="caption" color="text.secondary">
                Signed in as {user.user_metadata?.display_name ?? user.email}
              </Typography>
              <form action={signOut}>
                <Button type="submit" variant="outlined" fullWidth size="small">
                  Sign Out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button component={Link} href="/login" variant="outlined" fullWidth>
                Sign In
              </Button>
              <Button component={Link} href="/signup" variant="contained" fullWidth>
                Join
              </Button>
            </>
          )}
        </Box>
      </Drawer>
    </>
  );
}
