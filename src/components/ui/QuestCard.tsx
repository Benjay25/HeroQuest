'use client';

/**
 * QuestCard — the core repeating unit. Renders one quest with the right
 * completion control for its completion_type:
 *   - boolean  → a circular check toggle
 *   - numeric  → a progress bar with an editable value
 *   - checklist→ (deferred) shows a chip; full checklist UI comes later
 *
 * Interactivity uses useTransition: while a server action runs, `isPending`
 * dims the card and disables controls. The action calls revalidatePath on
 * the server, which refreshes the dashboard and flows new props back in.
 * (Optimistic UI is a Phase 6 polish item — this is the simple, correct base.)
 */

import { useEffect, useState, useTransition } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';

import CheckIcon from '@mui/icons-material/Check';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';

import type { QuestWithProgress } from '@/types/database';
import { QUEST_TYPE_META } from '@/constants/questTypes';
import ChecklistItems from '@/components/ui/ChecklistItems';
import {
  toggleQuestComplete,
  setNumericProgress,
  deleteQuest,
} from '@/lib/supabase/actions/quests';

interface QuestCardProps {
  quest: QuestWithProgress;
  /** Show the delete control (defaults to true for owned quests). */
  deletable?: boolean;
}

export default function QuestCard({ quest, deletable = true }: QuestCardProps) {
  // `isBusy` is true whenever ANY async action on this card is in flight —
  // the main toggle, numeric save, delete, or a checklist item call. It drives
  // a small corner spinner so the optimistic UI still signals "working…".
  const [isBusy, startBusy] = useTransition();
  const { color } = QUEST_TYPE_META[quest.type];

  const serverCompleted = quest.user_quest.status === 'completed';

  // Optimistic completion for boolean quests — flips instantly, reverts on error.
  const [completed, setCompleted] = useState(serverCompleted);
  useEffect(() => setCompleted(serverCompleted), [serverCompleted]);

  // Fog quests pass their staleness date; once passed and still open, the
  // card takes on a more urgent, "spooky" treatment.
  const staleAt = quest.user_quest.stale_at;
  const isStale =
    quest.type === 'fog' &&
    !serverCompleted &&
    staleAt !== null &&
    new Date(staleAt) < new Date();

  // Faction colour bleeds into the card accent when the quest is tagged to a
  // guild; otherwise the quest-type colour. Stale fog overrides everything.
  const accent = isStale ? '#a83a2b' : quest.faction?.colour ?? color;

  /** Run an async action while flagging the card busy (passed to children). */
  const runBusy = (action: () => Promise<void>) => startBusy(action);

  // ── Boolean toggle (optimistic) ──
  function handleToggle() {
    const next = !completed;
    setCompleted(next); // immediate
    startBusy(async () => {
      const res = await toggleQuestComplete(quest.user_quest.id);
      if (res?.error) setCompleted(!next); // undo on failure
    });
  }

  // ── Delete ──
  function handleDelete() {
    startBusy(async () => {
      await deleteQuest(quest.id);
    });
  }

  // ── Numeric progress ──
  const target = quest.numeric_target ?? 0;
  const [value, setValue] = useState(quest.user_quest.numeric_progress);
  // Resync local input when server data changes (after revalidation)
  useEffect(() => {
    setValue(quest.user_quest.numeric_progress);
  }, [quest.user_quest.numeric_progress]);

  const numericDirty = value !== quest.user_quest.numeric_progress;
  // The bar reflects SAVED progress only — it advances when the user clicks
  // Save (which revalidates and updates the prop), not as they type.
  const savedPct =
    target > 0
      ? Math.min(100, Math.round((quest.user_quest.numeric_progress / target) * 100))
      : 0;

  function handleSaveNumeric() {
    startBusy(async () => {
      await setNumericProgress(quest.user_quest.id, value);
    });
  }

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        p: 1.5,
        borderRadius: 1.5,
        bgcolor: 'background.default',
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: '3px solid',
        borderLeftColor: accent,
        // Faded look reinforces completion. No busy-dimming — the corner
        // spinner provides the "working…" feedback instead.
        opacity: completed ? 0.6 : 1,
        transition: 'opacity 0.15s ease, border-color 0.2s ease',
        ...(isStale && {
          boxShadow: '0 0 0 1px rgba(168,58,43,0.25), 0 2px 16px rgba(168,58,43,0.12)',
        }),
        '&:hover .quest-delete': { opacity: 1 },
      }}
    >
      {/* Busy spinner — top-right corner, only while an action is in flight */}
      {isBusy && (
        <CircularProgress
          size={14}
          thickness={5}
          sx={{ position: 'absolute', top: 6, right: 6, color: 'text.secondary' }}
        />
      )}
      {/* ── Completion control ── */}
      {quest.completion_type === 'boolean' && (
        <Tooltip title={completed ? 'Mark incomplete' : 'Complete quest'}>
          <IconButton
            onClick={handleToggle}
            size="small"
            sx={{
              mt: '-2px',
              width: 26,
              height: 26,
              border: '2px solid',
              borderColor: completed ? accent : 'rgba(255,255,255,0.25)',
              bgcolor: completed ? accent : 'transparent',
              color: completed ? 'background.default' : 'transparent',
              '&:hover': {
                borderColor: accent,
                bgcolor: completed ? accent : 'rgba(255,255,255,0.05)',
              },
            }}
          >
            <CheckIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      )}

      {/* ── Body ── */}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography
          variant="body1"
          sx={{
            fontSize: '0.95rem',
            fontWeight: 600,
            lineHeight: 1.3,
            color: completed ? 'text.secondary' : 'text.primary',
            textDecoration: completed ? 'line-through' : 'none',
          }}
        >
          {quest.title}
        </Typography>

        {quest.description && (
          <Typography
            variant="body2"
            sx={{
              mt: 0.25,
              fontSize: '0.82rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {quest.description}
          </Typography>
        )}

        {/* Checklist sub-tasks */}
        {quest.completion_type === 'checklist' && quest.checklist.length > 0 && (
          <ChecklistItems items={quest.checklist} accent={accent} runBusy={runBusy} questId={quest.id} />
        )}

        {/* Numeric progress editor */}
        {quest.completion_type === 'numeric' && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={savedPct}
              sx={{ mb: 0.75 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                type="number"
                size="small"
                value={value}
                onChange={e => setValue(Math.max(0, Number(e.target.value)))}
                slotProps={{ htmlInput: { min: 0, max: target || undefined } }}
                sx={{ width: 90, '& input': { py: 0.5, fontSize: '0.85rem' } }}
              />
              <Typography variant="caption" color="text.secondary">
                / {target}
              </Typography>
              {numericDirty && (
                <Chip
                  label="Save"
                  size="small"
                  color="primary"
                  onClick={handleSaveNumeric}
                  sx={{ cursor: 'pointer', height: 24 }}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Meta row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
          <Chip
            label={`${completed ? '' : '+'}${quest.xp_reward} XP`}
            size="small"
            variant="outlined"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              borderColor: 'rgba(217, 182, 89,0.4)',
              color: 'primary.light',
            }}
          />
          {isStale && (
            <Chip
              label="Stale"
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                bgcolor: 'rgba(168,58,43,0.18)',
                color: '#d77',
              }}
            />
          )}
          {quest.faction && (
            <Chip
              label={`${quest.faction.icon ?? ''} ${quest.faction.name}`.trim()}
              size="small"
              variant="outlined"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                borderColor: `${quest.faction.colour}66`,
                color: quest.faction.colour,
              }}
            />
          )}
        </Box>
      </Box>

      {/* ── Delete (hover-revealed) ── */}
      {deletable && (
        <IconButton
          className="quest-delete"
          onClick={handleDelete}
          size="small"
          sx={{
            opacity: { xs: 1, md: 0 }, // always visible on touch, hover-reveal on desktop
            transition: 'opacity 0.15s ease',
            color: 'text.secondary',
            '&:hover': { color: 'error.main' },
          }}
        >
          <DeleteOutlineIcon sx={{ fontSize: 18 }} />
        </IconButton>
      )}
    </Box>
  );
}
