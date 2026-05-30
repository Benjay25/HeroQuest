'use client';

/**
 * FogQuickAdd — the frictionless capture input for Fog quests.
 *
 * Title only, one field, instant submit. This is the deliberate low-friction
 * path: the whole point of the Fog is that adding to it must be effortless,
 * or you won't bother. Everything else about a fog quest is optional and
 * editable later.
 *
 * Uses a native <form action={quickAddFog}> — the React 19 pattern. React
 * resets the uncontrolled input automatically after a successful submit.
 */

import { useRef } from 'react';
import { useFormStatus } from 'react-dom';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import CircularProgress from '@mui/material/CircularProgress';
import { quickAddFog } from '@/lib/supabase/actions/quests';

/** Submit affordance — reads the form's pending state via useFormStatus. */
function AddButton() {
  const { pending } = useFormStatus();
  return (
    <IconButton type="submit" size="small" disabled={pending} sx={{ color: '#8a7fa8' }}>
      {pending
        ? <CircularProgress size={16} sx={{ color: '#8a7fa8' }} />
        : <AddIcon fontSize="small" />}
    </IconButton>
  );
}

export default function FogQuickAdd() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    // Native <form> — MUI's Box does not understand React 19 form actions,
    // so the form element itself must be native. Styling lives on the inner Box.
    <form
      ref={formRef}
      action={async (formData: FormData) => {
        await quickAddFog(formData);
        formRef.current?.reset();
      }}
      style={{ width: '100%' }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.5,
          py: 0.25,
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'rgba(138,127,168,0.35)',
          bgcolor: 'background.default',
          transition: 'border-color 0.2s ease',
          '&:focus-within': { borderColor: '#8a7fa8' },
        }}
      >
        <InputBase
          name="title"
          placeholder="Something you're avoiding…"
          required
          fullWidth
          sx={{ fontSize: '0.9rem', '& input::placeholder': { fontStyle: 'italic', opacity: 0.6 } }}
        />
        <AddButton />
      </Box>
    </form>
  );
}
