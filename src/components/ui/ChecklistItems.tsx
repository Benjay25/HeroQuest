'use client';

/**
 * ChecklistItems — the interactive sub-tasks of a checklist quest.
 *
 * Boolean items: the whole row is click-to-toggle, optimistic and instant.
 * To keep rapid ticking fast, toggles are DEBOUNCED and BATCHED: ticking
 * several items in quick succession sends ONE server call (one upsert + one
 * parent recompute + one revalidation) instead of one per tick. Single ticks
 * feel instant because the visual is optimistic; only persistence waits ~300ms.
 *
 * Numeric items (weekly sub-quests): a deliberate Save action, left un-batched.
 */

import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import CheckIcon from '@mui/icons-material/Check';

import type { ChecklistItemWithProgress } from '@/types/database';
import {
  setChecklistItemsComplete,
  setChecklistItemProgress,
} from '@/lib/supabase/actions/quests';

type RunBusy = (action: () => Promise<void>) => void;

const DEBOUNCE_MS = 300;

/** Controlled boolean row — completion + handler come from the parent. */
function BooleanItem({
  item,
  accent,
  complete,
  onToggle,
}: {
  item: ChecklistItemWithProgress;
  accent: string;
  complete: boolean;
  onToggle: () => void;
}) {
  return (
    <Box
      onClick={onToggle}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        cursor: 'pointer',
        borderRadius: 1,
        px: 0.5,
        py: 0.25,
        mx: -0.5,
        transition: 'background-color 0.12s ease',
        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
        '&:hover .item-title': { color: 'text.primary' },
      }}
    >
      <Box
        sx={{
          width: 20,
          height: 20,
          flexShrink: 0,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid',
          borderColor: complete ? accent : 'rgba(255,255,255,0.25)',
          bgcolor: complete ? accent : 'transparent',
          color: complete ? 'background.default' : 'transparent',
        }}
      >
        <CheckIcon sx={{ fontSize: 13 }} />
      </Box>

      <Typography
        className="item-title"
        variant="body2"
        sx={{
          fontSize: '0.82rem',
          color: complete ? 'text.secondary' : 'text.primary',
          textDecoration: complete ? 'line-through' : 'none',
          transition: 'color 0.12s ease',
        }}
      >
        {item.title}
      </Typography>
    </Box>
  );
}

function NumericItem({ item, runBusy }: { item: ChecklistItemWithProgress; runBusy: RunBusy }) {
  const target = item.numeric_target ?? 0;
  const saved = item.progress?.numeric_progress ?? 0;
  const isComplete = Boolean(item.progress?.completed_at);

  const [value, setValue] = useState(saved);
  useEffect(() => setValue(saved), [saved]);
  const dirty = value !== saved;
  const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;

  function save() {
    runBusy(async () => { await setChecklistItemProgress(item.id, value); });
  }

  return (
    <Box sx={{ px: 0.5 }}>
      <Typography
        variant="body2"
        sx={{
          fontSize: '0.82rem',
          color: isComplete ? 'text.secondary' : 'text.primary',
          textDecoration: isComplete ? 'line-through' : 'none',
        }}
      >
        {item.title}
      </Typography>
      <Box sx={{ mt: 0.5 }}>
        <LinearProgress variant="determinate" value={pct} sx={{ mb: 0.5, height: 4 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <TextField
            type="number"
            size="small"
            value={value}
            onChange={e => setValue(Math.max(0, Number(e.target.value)))}
            slotProps={{ htmlInput: { min: 0, max: target || undefined } }}
            sx={{ width: 72, '& input': { py: 0.25, fontSize: '0.78rem' } }}
          />
          <Typography variant="caption" color="text.secondary">/ {target}</Typography>
          {dirty && (
            <Chip
              label="Save"
              size="small"
              color="primary"
              onClick={save}
              sx={{ cursor: 'pointer', height: 20, fontSize: '0.65rem' }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default function ChecklistItems({
  items,
  accent,
  runBusy,
  questId,
}: {
  items: ChecklistItemWithProgress[];
  accent: string;
  runBusy: RunBusy;
  questId: string;
}) {
  const booleanItems = items.filter(i => i.numeric_target == null);

  // A compact signature of the SERVER completion state — changes only when the
  // backend data actually changes (after a successful flush + revalidation).
  const serverKey = booleanItems
    .map(i => `${i.id}:${i.progress?.completed_at ? 1 : 0}`)
    .join(',');

  // Optimistic completion per boolean item.
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(booleanItems.map(i => [i.id, Boolean(i.progress?.completed_at)])),
  );

  // Keep a ref of the latest optimistic map for use inside debounced callbacks.
  const optimisticRef = useRef(optimistic);
  useEffect(() => { optimisticRef.current = optimistic; });

  // Items toggled since the last flush, and the pending debounce timer.
  const dirtyRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resync optimistic state to the server when server data changes — but never
  // clobber items that are still dirty (mid-flight ticks), avoiding a race
  // where a revalidation between two batches drops a pending toggle.
  useEffect(() => {
    setOptimistic(prev => {
      const next = { ...prev };
      for (const i of booleanItems) {
        if (!dirtyRef.current.has(i.id)) {
          next[i.id] = Boolean(i.progress?.completed_at);
        }
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  function flush() {
    timerRef.current = null;
    const ids = Array.from(dirtyRef.current);
    dirtyRef.current.clear();
    if (ids.length === 0) return;

    const payload = ids.map(id => ({ id, complete: optimisticRef.current[id] }));
    runBusy(async () => {
      const res = await setChecklistItemsComplete(questId, payload);
      if (res?.error) {
        // Revert the failed batch to server truth.
        setOptimistic(prev => {
          const next = { ...prev };
          for (const id of ids) {
            const it = booleanItems.find(b => b.id === id);
            next[id] = Boolean(it?.progress?.completed_at);
          }
          return next;
        });
      }
    });
  }

  function toggle(id: string) {
    setOptimistic(prev => ({ ...prev, [id]: !prev[id] }));
    dirtyRef.current.add(id);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, DEBOUNCE_MS);
  }

  // On unmount, flush any pending ticks so they aren't lost (fire-and-forget).
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        const ids = Array.from(dirtyRef.current);
        if (ids.length > 0) {
          const payload = ids.map(id => ({ id, complete: optimisticRef.current[id] }));
          void setChecklistItemsComplete(questId, payload);
        }
      }
    };
  }, [questId]);

  const completedCount =
    booleanItems.filter(i => optimistic[i.id]).length +
    items.filter(i => i.numeric_target != null && i.progress?.completed_at).length;

  return (
    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.85 }}>
      <Typography variant="caption" color="text.secondary">
        {completedCount} / {items.length} complete
      </Typography>
      {items.map(item =>
        item.numeric_target != null
          ? <NumericItem key={item.id} item={item} runBusy={runBusy} />
          : (
            <BooleanItem
              key={item.id}
              item={item}
              accent={accent}
              complete={optimistic[item.id] ?? false}
              onToggle={() => toggle(item.id)}
            />
          ),
      )}
    </Box>
  );
}
