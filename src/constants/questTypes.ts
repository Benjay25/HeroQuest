import type { QuestType } from '@/types/database';

/**
 * Quest-type presentation metadata — the single source of truth for how
 * each quest type looks and reads across the whole app.
 *
 * Any component that needs a quest type's colour or label imports from here,
 * so a colour change happens in exactly one place. Colours intentionally
 * match the RAW quest colours in theme.ts.
 */
export const QUEST_TYPE_META: Record<
  QuestType,
  { label: string; color: string }
> = {
  daily:  { label: 'Daily',   color: '#74a9e0' }, // light blue — recurring, everyday
  weekly: { label: 'Weekly',  color: '#4a76c2' }, // deeper blue — structured
  story:  { label: 'Story',   color: '#c9a84c' }, // gold   — personal, significant
  fog:    { label: 'The Fog', color: '#8a7fa8' }, // purple — obscured, uneasy
  epic:   { label: 'Epic',    color: '#bf6a3a' }, // copper — grand, authored
};
