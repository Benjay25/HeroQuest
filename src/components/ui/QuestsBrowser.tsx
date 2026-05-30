'use client';

/**
 * QuestsBrowser — the filterable full list of a user's quests.
 *
 * Receives all quests from the server page and filters client-side by type.
 * Renders them in a responsive grid of QuestCards.
 */

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import type { QuestWithProgress, QuestType } from '@/types/database';
import { QUEST_TYPE_META } from '@/constants/questTypes';
import QuestCard from '@/components/ui/QuestCard';

type Filter = 'all' | QuestType;

// Only the types a user can currently have show as filters.
const FILTERS: Filter[] = ['all', 'daily', 'weekly', 'story', 'fog'];

export default function QuestsBrowser({ quests }: { quests: QuestWithProgress[] }) {
  const [filter, setFilter] = useState<Filter>('all');

  const visible = filter === 'all' ? quests : quests.filter(q => q.type === filter);

  const label = (f: Filter) => (f === 'all' ? 'All' : QUEST_TYPE_META[f].label);
  const count = (f: Filter) =>
    f === 'all' ? quests.length : quests.filter(q => q.type === f).length;

  return (
    <Box>
      {/* Filter bar */}
      <ToggleButtonGroup
        value={filter}
        exclusive
        size="small"
        onChange={(_, v) => v && setFilter(v)}
        sx={{ mb: 3, flexWrap: 'wrap' }}
      >
        {FILTERS.map(f => (
          <ToggleButton key={f} value={f} sx={{ textTransform: 'none' }}>
            {label(f)}
            <Box component="span" sx={{ ml: 0.75, opacity: 0.6, fontSize: '0.8em' }}>
              {count(f)}
            </Box>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/* Grid */}
      {visible.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontStyle: 'italic', textAlign: 'center', py: 8 }}
        >
          No quests here yet. Forge one from the dashboard.
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
            gap: 1.5,
            alignItems: 'start',
          }}
        >
          {visible.map(quest => (
            <QuestCard key={quest.user_quest.id} quest={quest} />
          ))}
        </Box>
      )}
    </Box>
  );
}
