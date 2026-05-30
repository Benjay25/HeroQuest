import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import type { SxProps, Theme } from '@mui/material/styles';
import type { QuestType } from '@/types/database';
import { QUEST_TYPE_META } from '@/constants/questTypes';
import OrnateDivider from './OrnateDivider';

/**
 * QuestContainer — a titled panel that houses a list of quests.
 *
 * Shows a type label, a title, a completed/total counter, an optional
 * header action (e.g. an add button), and renders quest cards as children.
 *
 * Colour and label come from the shared QUEST_TYPE_META so every place
 * that displays a quest type stays visually consistent.
 */

interface QuestContainerProps {
  type: QuestType;
  title: string;
  completed?: number;
  total?: number;
  /** Optional element rendered top-right (e.g. an add button). */
  headerAction?: React.ReactNode;
  /** Optional element pinned above the scrolling list (e.g. fog quick-add). */
  topSlot?: React.ReactNode;
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
}

export default function QuestContainer({
  type,
  title,
  completed = 0,
  total = 0,
  headerAction,
  topSlot,
  children,
  sx,
}: QuestContainerProps) {
  const { label, color } = QUEST_TYPE_META[type];
  const hasQuests = total > 0;

  return (
    <Card
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        ...sx,
      }}
    >
      {/* Coloured accent strip along the top */}
      <Box sx={{ height: 3, bgcolor: color, flexShrink: 0 }} />

      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          pt: 2,
          pb: 1.5,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1,
          flexShrink: 0,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="overline"
            sx={{ color, display: 'block', lineHeight: 1, mb: 0.5 }}
          >
            {label}
          </Typography>
          <Typography variant="h6">{title}</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {/* Completed / total counter — horizontal */}
          {hasQuests && (
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography variant="h5" sx={{ color, lineHeight: 1, fontWeight: 700 }}>
                {completed}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1 }}>
                / {total}
              </Typography>
            </Box>
          )}
          {headerAction}
        </Box>
      </Box>

      {/* Divider line — coloured to match the container's quest type */}
      <OrnateDivider color={color} sx={{ mb: 4 }} />

      {/* Optional pinned top slot (e.g. fog quick-add input) */}
      {topSlot && (
        <Box sx={{ px: 2.5, pt: 1.5, flexShrink: 0 }}>{topSlot}</Box>
      )}

      {/* Quest list area */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2.5, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {hasQuests ? (
          children
        ) : (
          <Box
            sx={{
              height: '100%',
              minHeight: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: 'italic', textAlign: 'center' }}
            >
              {type === 'fog'
                ? 'The fog is clear. Nothing lurks here... for now.'
                : 'No quests yet. Your adventure awaits.'}
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
}
