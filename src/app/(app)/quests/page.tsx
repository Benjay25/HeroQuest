import { redirect } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { createClient } from '@/lib/supabase/server';
import { getUserQuests } from '@/lib/supabase/queries/quests';
import QuestsBrowser from '@/components/ui/QuestsBrowser';

/**
 * /quests — the Quest Board: every quest you're tracking, filterable by type.
 * (Guest/curated view will come in Phase 3 when there's public content.)
 */
export default async function QuestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const quests = await getUserQuests(user.id);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2.5, md: 4 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="primary.light">
          Quest Board
        </Typography>
        <Typography variant="h2" sx={{ mt: 0.5 }}>
          Your Quests
        </Typography>
        <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
          Every undertaking, in one place.
        </Typography>
      </Box>

      <QuestsBrowser quests={quests} />
    </Box>
  );
}
