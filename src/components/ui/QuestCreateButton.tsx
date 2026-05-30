'use client';

/**
 * QuestCreateButton — a + button that opens the CreateQuestDialog,
 * pre-selecting the quest type of the container it sits in.
 *
 * This is the client island passed as `headerAction` to a (server-rendered)
 * QuestContainer, so the container itself can stay a Server Component.
 */

import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import CreateQuestDialog from '@/components/ui/CreateQuestDialog';
import type { Faction } from '@/types/database';

type CreatableType = 'daily' | 'weekly' | 'story';

export default function QuestCreateButton({
  defaultType,
  factions,
}: {
  defaultType: CreatableType;
  factions: Faction[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="New quest">
        <IconButton
          onClick={() => setOpen(true)}
          size="small"
          sx={{
            color: 'text.secondary',
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': { color: 'primary.main', borderColor: 'primary.main' },
          }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <CreateQuestDialog
        open={open}
        onClose={() => setOpen(false)}
        defaultType={defaultType}
        factions={factions}
      />
    </>
  );
}
