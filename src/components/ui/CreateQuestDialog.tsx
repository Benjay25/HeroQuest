'use client';

/**
 * CreateQuestDialog — the full quest creation form (Daily, Weekly, Story).
 *
 * Fog uses its own frictionless quick-add; Epic is admin-authored (Phase 4).
 * So this dialog covers the three user-authored, structured types.
 *
 * The form adapts to the chosen completion type:
 *   - Simple   → nothing extra
 *   - Progress → a numeric target field (Weekly only)
 *   - Checklist→ a dynamic list builder, each item optionally numeric
 *
 * On submit it calls the createQuest server action, which writes the quest,
 * the user_quest, and any checklist items, then revalidates the dashboard.
 */

import { useState, useTransition } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import TuneIcon from '@mui/icons-material/Tune';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import MenuItem from '@mui/material/MenuItem';
import type { CompletionType, Difficulty, Faction } from '@/types/database';
import { QUEST_TYPE_META } from '@/constants/questTypes';
import { createQuest, type CreateQuestInput } from '@/lib/supabase/actions/quests';

/** Quest types this dialog can create. */
type CreatableType = 'daily' | 'weekly' | 'story';

/** Which completion styles each type allows. */
const COMPLETION_BY_TYPE: Record<CreatableType, CompletionType[]> = {
  daily:  ['boolean', 'checklist'],
  weekly: ['boolean', 'numeric', 'checklist'],
  story:  ['boolean', 'checklist'],
};

const COMPLETION_LABEL: Record<CompletionType, string> = {
  boolean:   'Simple',
  numeric:   'Progress',
  checklist: 'Checklist',
};

/** Suggested XP per difficulty (user can override). */
const DIFFICULTY_XP: Record<Difficulty, number> = {
  minor: 20, standard: 50, major: 120, legendary: 300,
};

type ChecklistDraft = { title: string; target: string };

interface CreateQuestDialogProps {
  open: boolean;
  onClose: () => void;
  defaultType: CreatableType;
  factions: Faction[];
}

export default function CreateQuestDialog({ open, onClose, defaultType, factions }: CreateQuestDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // 'simple' = title only, everything else assumed; 'full' = the whole form.
  const [mode, setMode] = useState<'simple' | 'full'>('simple');

  const [type, setType] = useState<CreatableType>(defaultType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [completionType, setCompletionType] = useState<CompletionType>('boolean');
  const [numericTarget, setNumericTarget] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('standard');
  const [xpReward, setXpReward] = useState(50);
  const [checklist, setChecklist] = useState<ChecklistDraft[]>([{ title: '', target: '' }]);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [factionId, setFactionId] = useState('');
  const [hasPenalty, setHasPenalty] = useState(false);
  const [penaltyXp, setPenaltyXp] = useState(25);

  function resetAndClose() {
    setMode('simple');
    setType(defaultType);
    setTitle('');
    setDescription('');
    setCompletionType('boolean');
    setNumericTarget('');
    setDifficulty('standard');
    setXpReward(50);
    setChecklist([{ title: '', target: '' }]);
    setFocusIndex(null);
    setFactionId('');
    setHasPenalty(false);
    setPenaltyXp(25);
    setError(null);
    onClose();
  }

  function changeType(next: CreatableType | null) {
    if (!next) return;
    setType(next);
    // If the current completion type isn't valid for the new type, reset it
    if (!COMPLETION_BY_TYPE[next].includes(completionType)) {
      setCompletionType('boolean');
    }
  }

  function changeDifficulty(next: Difficulty | null) {
    if (!next) return;
    setDifficulty(next);
    setXpReward(DIFFICULTY_XP[next]); // sync suggested XP; still editable below
  }

  // Checklist row helpers
  const updateItem = (i: number, patch: Partial<ChecklistDraft>) =>
    setChecklist(items => items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const addItem = () =>
    setChecklist(items => {
      const next = [...items, { title: '', target: '' }];
      setFocusIndex(next.length - 1); // autofocus the new row
      return next;
    });
  const removeItem = (i: number) =>
    setChecklist(items => items.filter((_, idx) => idx !== i));

  function handleSubmit() {
    setError(null);

    if (!title.trim()) {
      setError('Give your quest a title.');
      return;
    }

    const simple = mode === 'simple';

    // Quick mode: title only, everything else assumed.
    if (simple) {
      startTransition(async () => {
        const result = await createQuest({
          title,
          type,
          completion_type: 'boolean',
          xp_reward: 50,
          difficulty: 'standard',
        });
        if (result?.error) setError(result.error);
        else resetAndClose();
      });
      return;
    }

    // Detailed mode: validate the extra fields.
    if (completionType === 'numeric' && (!numericTarget || Number(numericTarget) <= 0)) {
      setError('Set a target greater than zero.');
      return;
    }
    let checklistItems: CreateQuestInput['checklist_items'];
    if (completionType === 'checklist') {
      const filled = checklist.filter(it => it.title.trim());
      if (filled.length === 0) {
        setError('Add at least one checklist item.');
        return;
      }
      checklistItems = filled.map(it => ({
        title: it.title,
        numeric_target: it.target ? Number(it.target) : null,
      }));
    }

    const input: CreateQuestInput = {
      title,
      description: description || null,
      type,
      completion_type: completionType,
      numeric_target: completionType === 'numeric' ? Number(numericTarget) : null,
      xp_reward: xpReward,
      difficulty,
      faction_id: factionId || null,
      // Story quests don't carry a penalty option
      has_penalty: type !== 'story' && hasPenalty,
      penalty_xp: type !== 'story' && hasPenalty ? penaltyXp : 0,
      checklist_items: checklistItems,
    };

    startTransition(async () => {
      const result = await createQuest(input);
      if (result?.error) setError(result.error);
      else resetAndClose();
    });
  }

  const allowedCompletions = COMPLETION_BY_TYPE[type];

  return (
    <Dialog
      open={open}
      onClose={isPending ? undefined : resetAndClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { border: '1px solid', borderColor: 'divider' } } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>New {QUEST_TYPE_META[type].label} Quest</span>
        <IconButton onClick={resetAndClose} size="small" disabled={isPending}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/*
          Sections animate with <Collapse> rather than mounting/unmounting.
          The outer container is a plain Box (no Stack gap) so collapsed
          sections leave no stray spacing; each section owns its own padding,
          which is clipped to zero while collapsed.
        */}
        {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 1 }}>{error}</Alert>}

        {/* Quest type — detailed only, animates in above the title */}
        <Collapse in={mode === 'full'}>
          <Box sx={{ pb: 2.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Type</Typography>
            <ToggleButtonGroup
              value={type}
              exclusive
              onChange={(_, v) => changeType(v)}
              size="small"
              fullWidth
            >
              {(['daily', 'weekly', 'story'] as CreatableType[]).map(t => (
                <ToggleButton key={t} value={t} sx={{ textTransform: 'none' }}>
                  {QUEST_TYPE_META[t].label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </Collapse>

        {/* Title — required in both modes */}
        <TextField
          label="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          fullWidth
          autoFocus
        />

        {/* Quick mode — assumptions + expand affordance */}
        <Collapse in={mode === 'simple'}>
          <Box sx={{ pt: 2.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Defaults applied</Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Chip size="small" variant="outlined" label="Simple completion" />
              <Chip size="small" variant="outlined" label="Standard difficulty" />
              <Chip size="small" variant="outlined" label="+50 XP" />
            </Stack>
            <Button
              onClick={() => setMode('full')}
              startIcon={<TuneIcon />}
              endIcon={<ExpandMoreIcon />}
              size="small"
              sx={{ mt: 1.5, textTransform: 'none' }}
            >
              Add details &amp; customise
            </Button>
          </Box>
        </Collapse>

        {/* Detailed mode — full field set, animates open */}
        <Collapse in={mode === 'full'}>
          <Stack spacing={2.5} sx={{ pt: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => setMode('simple')}
                startIcon={<ExpandLessIcon />}
                size="small"
                sx={{ textTransform: 'none', color: 'text.secondary' }}
              >
                Show less
              </Button>
            </Box>
          <TextField
            label="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />

          {/* Completion type */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Completion</Typography>
            <ToggleButtonGroup
              value={completionType}
              exclusive
              onChange={(_, v) => v && setCompletionType(v)}
              size="small"
              fullWidth
            >
              {allowedCompletions.map(c => (
                <ToggleButton key={c} value={c} sx={{ textTransform: 'none' }}>
                  {COMPLETION_LABEL[c]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Numeric target */}
          {completionType === 'numeric' && (
            <TextField
              label="Target (e.g. 50 pages)"
              type="number"
              value={numericTarget}
              onChange={e => setNumericTarget(e.target.value)}
              fullWidth
              slotProps={{ htmlInput: { min: 1 } }}
            />
          )}

          {/* Checklist builder */}
          {completionType === 'checklist' && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Checklist items
                {type === 'weekly' && ' (add a target for progress-based sub-quests)'}
              </Typography>
              <Stack spacing={1}>
                {checklist.map((item, i) => (
                  <Stack key={i} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <TextField
                      placeholder={`Item ${i + 1}`}
                      value={item.title}
                      onChange={e => updateItem(i, { title: e.target.value })}
                      onKeyDown={e => {
                        // Enter adds a new item (and focuses it) instead of
                        // submitting — fast keyboard-driven checklist entry.
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (item.title.trim()) addItem();
                        }
                      }}
                      autoFocus={i === focusIndex}
                      size="small"
                      fullWidth
                    />
                    {type === 'weekly' && (
                      <TextField
                        placeholder="Target"
                        type="number"
                        value={item.target}
                        onChange={e => updateItem(i, { target: e.target.value })}
                        size="small"
                        sx={{ width: 110 }}
                        slotProps={{ htmlInput: { min: 1 } }}
                      />
                    )}
                    <IconButton
                      onClick={() => removeItem(i)}
                      size="small"
                      disabled={checklist.length === 1}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
              <Button onClick={addItem} startIcon={<AddIcon />} size="small" sx={{ mt: 1 }}>
                Add item
              </Button>
            </Box>
          )}

          <Divider />

          {/* Difficulty + XP */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Difficulty</Typography>
            <ToggleButtonGroup
              value={difficulty}
              exclusive
              onChange={(_, v) => changeDifficulty(v)}
              size="small"
              fullWidth
            >
              {(['minor', 'standard', 'major', 'legendary'] as Difficulty[]).map(d => (
                <ToggleButton key={d} value={d} sx={{ textTransform: 'capitalize', fontSize: '0.72rem' }}>
                  {d}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          <TextField
            label="XP reward"
            type="number"
            value={xpReward}
            onChange={e => setXpReward(Math.max(0, Number(e.target.value)))}
            sx={{ width: 160 }}
            slotProps={{ htmlInput: { min: 0 } }}
          />

          {/* Guild — completing this quest builds reputation with the chosen guild */}
          <TextField
            label="Guild (optional)"
            select
            value={factionId}
            onChange={e => setFactionId(e.target.value)}
            fullWidth
            helperText="Completing this quest builds reputation with the guild."
          >
            <MenuItem value="">
              <em>No guild</em>
            </MenuItem>
            {factions.map(f => (
              <MenuItem key={f.id} value={f.id}>
                {f.icon ? `${f.icon}  ` : ''}{f.name}
              </MenuItem>
            ))}
          </TextField>

          {/* Optional penalty — not offered for Story quests */}
          {type !== 'story' && (
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={hasPenalty}
                  onChange={e => setHasPenalty(e.target.checked)}
                />
              }
              label="Lose XP if not completed (opt-in accountability)"
            />
            <Collapse in={hasPenalty}>
              <TextField
                label="Penalty XP"
                type="number"
                value={penaltyXp}
                onChange={e => setPenaltyXp(Math.max(0, Number(e.target.value)))}
                size="small"
                sx={{ width: 160, mt: 1 }}
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Collapse>
          </Box>
          )}
          </Stack>
        </Collapse>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={resetAndClose} disabled={isPending} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending} variant="contained">
          {isPending ? 'Creating…' : 'Create Quest'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
