import { redirect } from 'next/navigation';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { createClient } from '@/lib/supabase/server';
import { getUserQuestsByType, completionCounts } from '@/lib/supabase/queries/quests';
import FogQuickAdd from '@/components/ui/FogQuickAdd';
import QuestCard from '@/components/ui/QuestCard';

/**
 * /fog — the full-page view of everything lurking in the Fog.
 * A focused, single-column list with the frictionless quick-add pinned on top.
 */
export default async function FogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const fog = await getUserQuestsByType(user.id, 'fog');
  const { completed, total } = completionCounts(fog);

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto', p: { xs: 2.5, md: 4 } }}>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" sx={{ color: '#a99ac4' }}>
          Unfinished Business
        </Typography>
        <Typography variant="h2" sx={{ mt: 0.5, color: '#a99ac4' }}>
          The Fog
        </Typography>
        <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
          The things you&apos;d rather not think about — written down so they can&apos;t be forgotten.
          {total > 0 && ` ${completed} of ${total} cleared.`}
        </Typography>
      </Box>

      {/* Quick-add */}
      <FogQuickAdd />

      {/* List */}
      <Stack spacing={1.25} sx={{ mt: 2.5 }}>
        {fog.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontStyle: 'italic', textAlign: 'center', py: 6 }}
          >
            The fog is clear. Nothing lurks here... for now.
          </Typography>
        ) : (
          fog.map(quest => <QuestCard key={quest.user_quest.id} quest={quest} />)
        )}
      </Stack>
    </Box>
  );
}
