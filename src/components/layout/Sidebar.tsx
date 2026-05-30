'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';

import DashboardIcon from '@mui/icons-material/AutoAwesome';
import QuestIcon from '@mui/icons-material/MenuBook';
import FactionsIcon from '@mui/icons-material/Shield';
import FogIcon from '@mui/icons-material/Cloud';
import ProfileIcon from '@mui/icons-material/Person';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import type { Profile, Faction } from '@/types/database';
import { levelTitle, xpForNextLevel, xpProgress } from '@/types/database';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '@/constants/layout';

const NAV_ITEMS = [
  { label: 'Dashboard',   href: '/dashboard',  icon: <DashboardIcon fontSize="small" /> },
  { label: 'Quest Board', href: '/quests',     icon: <QuestIcon fontSize="small" /> },
  { label: 'Guilds',      href: '/factions',   icon: <FactionsIcon fontSize="small" /> },
  { label: 'The Fog',     href: '/fog',        icon: <FogIcon fontSize="small" /> },
  { label: 'Profile',     href: '/profile',    icon: <ProfileIcon fontSize="small" /> },
];

const STORAGE_KEY = 'heroquest-sidebar-collapsed';

interface SidebarProps {
  user: User;
  profile: Profile | null;
  factions: Faction[];
}

export default function Sidebar({ user, profile, factions }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
  // Guild sub-menu — auto-open when already on a faction page.
  const [guildsOpen, setGuildsOpen] = useState(pathname.startsWith('/factions'));
  // Track whether we've read from localStorage yet.
  // Prevents a flash of the wrong state on first render.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) setCollapsed(JSON.parse(saved));
    setMounted(true);
  }, []);

  function toggle() {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  const name     = profile?.display_name ?? user.user_metadata?.display_name ?? 'Adventurer';
  const xp       = profile?.xp ?? 0;
  const level    = profile?.level ?? 1;
  const title    = levelTitle(level);
  const nextXp   = xpForNextLevel(level);
  const progress = xpProgress(xp, level);

  const initials = name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Don't render until we've read localStorage — avoids layout shift
  if (!mounted) return (
    <Box
      component="aside"
      sx={{
        width: SIDEBAR_COLLAPSED_WIDTH,
        flexShrink: 0,
        display: { xs: 'none', md: 'block' },
      }}
    />
  );

  return (
    <Box
      component="aside"
      sx={{
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        flexShrink: 0,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        // Fills the content row's full height via flex stretch (the row has a
        // definite height now), and scrolls internally if its own content
        // overflows. No more 100vh/NAV_HEIGHT math.
        height: '100%',
        minHeight: 0,
        overflowX: 'hidden',
        overflowY: 'auto',
        // Smooth width transition
        transition: 'width 0.2s ease',
      }}
    >
      {/* ── Toggle button ── */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-end',
          p: 0.75,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
          <IconButton
            onClick={toggle}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' },
            }}
          >
            {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── User panel ── */}
      <Box
        sx={{
          p: collapsed ? 1 : 2.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: collapsed ? 'center' : 'flex-start',
          gap: 1.5,
          flexShrink: 0,
          transition: 'padding 0.2s ease',
        }}
      >
        <Tooltip
          title={collapsed ? `${name} — Level ${level} ${title}` : ''}
          placement="right"
        >
          <Avatar
            src={profile?.avatar_url ?? undefined}
            sx={{
              width: collapsed ? 36 : 44,
              height: collapsed ? 36 : 44,
              bgcolor: 'primary.dark',
              color: 'background.default',
              fontFamily: 'Cinzel, serif',
              fontSize: collapsed ? '0.75rem' : '0.85rem',
              fontWeight: 700,
              border: '1px solid',
              borderColor: 'primary.dark',
              transition: 'width 0.2s ease, height 0.2s ease',
              flexShrink: 0,
            }}
          >
            {initials}
          </Avatar>
        </Tooltip>

        {/* Name + chip — hidden when collapsed */}
        {!collapsed && (
          <Box sx={{ minWidth: 0, width: '100%' }}>
            <Typography
              variant="body1"
              sx={{
                fontFamily: 'Cinzel, serif',
                fontWeight: 600,
                fontSize: '0.9rem',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {name}
            </Typography>
            <Chip
              label={title}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ mt: 0.4, height: 22, fontSize: '0.72rem', px: 0.25 }}
            />
          </Box>
        )}

        {/* XP bar — hidden when collapsed */}
        {!collapsed && (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="primary.light">
                Level {level}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {xp.toLocaleString()} / {nextXp.toLocaleString()} XP
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ borderRadius: 1 }}
            />
          </Box>
        )}
      </Box>

      <Divider />

      {/* ── Navigation ── */}
      <List dense sx={{ px: collapsed ? 0.5 : 1, py: 1.5, flexGrow: 1 }}>
        {NAV_ITEMS.map(({ label, href, icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          const standardButton = (
            <ListItemButton
              component={Link}
              href={href}
              selected={active}
              sx={{
                borderRadius: 1,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1 : 2,
                minHeight: 40,
                flexGrow: 1,
                '&.Mui-selected': {
                  bgcolor: 'rgba(217, 182, 89, 0.1)',
                  borderLeft: collapsed ? 'none' : '2px solid',
                  borderColor: 'primary.main',
                  pl: collapsed ? 1 : '14px',
                  '&:hover': { bgcolor: 'rgba(217, 182, 89, 0.15)' },
                },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 'unset' : 32,
                  color: active ? 'primary.main' : 'text.secondary',
                  justifyContent: 'center',
                }}
              >
                {icon}
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={label}
                  slotProps={{
                    primary: {
                      style: {
                        fontFamily: 'Cinzel, serif',
                        fontSize: '0.82rem',
                        fontWeight: active ? 600 : 400,
                      },
                    },
                  }}
                />
              )}
            </ListItemButton>
          );

          // Guilds gets a dropdown of individual guilds (expanded mode only).
          // The row still links to /factions; the chevron toggles the list.
          const isGuilds = href === '/factions';

          return (
            <Box key={href}>
              <ListItem disablePadding sx={{ mb: 0.25 }}>
                {collapsed ? (
                  <Tooltip title={label} placement="right">{standardButton}</Tooltip>
                ) : (
                  standardButton
                )}
                {isGuilds && !collapsed && (
                  <IconButton
                    size="small"
                    onClick={() => setGuildsOpen(o => !o)}
                    aria-label={guildsOpen ? 'Collapse guilds' : 'Expand guilds'}
                    sx={{ color: 'text.secondary', ml: 0.5, '&:hover': { color: 'primary.main' } }}
                  >
                    {guildsOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                )}
              </ListItem>

              {isGuilds && !collapsed && (
                <Collapse in={guildsOpen}>
                  <List dense disablePadding sx={{ mb: 0.5 }}>
                    {factions.map(f => {
                      const subActive = pathname === `/factions/${f.slug}`;
                      return (
                        <ListItem key={f.id} disablePadding sx={{ mb: 0.1 }}>
                          <ListItemButton
                            component={Link}
                            href={`/factions/${f.slug}`}
                            selected={subActive}
                            sx={{
                              borderRadius: 1,
                              pl: 3.25,
                              py: 0.4,
                              minHeight: 32,
                              '&.Mui-selected': {
                                bgcolor: 'rgba(217, 182, 89, 0.08)',
                                '&:hover': { bgcolor: 'rgba(217, 182, 89, 0.14)' },
                              },
                              '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                            }}
                          >
                            <Box
                              component="span"
                              sx={{ width: 22, textAlign: 'center', fontSize: 15, mr: 1, flexShrink: 0 }}
                            >
                              {f.icon}
                            </Box>
                            <ListItemText
                              primary={f.name}
                              slotProps={{
                                primary: {
                                  style: {
                                    fontFamily: 'Cinzel, serif',
                                    fontSize: '0.74rem',
                                    fontWeight: subActive ? 600 : 400,
                                  },
                                },
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              )}
            </Box>
          );
        })}
      </List>
    </Box>
  );
}
