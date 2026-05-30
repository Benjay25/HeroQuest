import { redirect } from 'next/navigation';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/supabase/queries/profile';
import { getUserQuests, groupQuestsByType, completionCounts } from '@/lib/supabase/queries/quests';
import { getFactions } from '@/lib/supabase/queries/factions';
import PlayerCard from '@/components/ui/PlayerCard';
import QuestContainer from '@/components/ui/QuestContainer';
import QuestCard from '@/components/ui/QuestCard';
import FogQuickAdd from '@/components/ui/FogQuickAdd';
import QuestCreateButton from '@/components/ui/QuestCreateButton';
import type { QuestWithProgress } from '@/types/database';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [profile, quests, factions] = await Promise.all([
    getProfile(user.id),
    getUserQuests(user.id),
    getFactions(),
  ]);

  const groups = groupQuestsByType(quests);

  // Helper: render a group's cards (or nothing — container shows empty state)
  const renderCards = (list: QuestWithProgress[]) =>
    list.map(q => <QuestCard key={q.user_quest.id} quest={q} />);

  return (
    // height 100% fills the <main> row exactly. On md the quest grid flex-grows
    // to consume whatever height the player card leaves — no viewport math.
    <Stack sx={{ width: '100%', height: { md: '100%' }, alignItems: 'center' }}>
      {/* Player card — full bleed */}
      <PlayerCard user={user} profile={profile} />

      <Box
        sx={{
          p: { xs: 2.5, md: 3 },
          maxWidth: 1400,
          width: '100%',
          mx: 'auto',
          // On md, become a flex column so the grid can grow to fill height.
          flexGrow: { md: 1 },
          minHeight: { md: 0 },
          display: { md: 'flex' },
          flexDirection: { md: 'column' },
        }}
      >
        {/*
          1 : 2 : 1 layout
            Left  — Story (full height)
            Centre— Daily (top) + Weekly (bottom)
            Right — The Fog (full height)
        */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
            gridTemplateRows: { md: '1fr 1fr' },
            gridTemplateAreas: {
              xs: `"story" "daily" "weekly" "fog"`,
              md: `"story daily fog"
                   "story weekly fog"`,
            },
            gap: 2,
            // md: grow to fill remaining height (player card sized automatically).
            // The quest lists inside each container scroll internally on overflow.
            flexGrow: { md: 1 },
            minHeight: { md: 0 },
          }}
        >
          <Box sx={{ gridArea: 'story', minHeight: { xs: 220, md: 'auto' } }}>
            <QuestContainer
              type="story"
              title="Story Quests"
              {...completionCounts(groups.story)}
              headerAction={<QuestCreateButton defaultType="story" factions={factions} />}
            >
              {renderCards(groups.story)}
            </QuestContainer>
          </Box>

          <Box sx={{ gridArea: 'daily', minHeight: { xs: 220, md: 'auto' } }}>
            <QuestContainer
              type="daily"
              title="Daily Quests"
              {...completionCounts(groups.daily)}
              headerAction={<QuestCreateButton defaultType="daily" factions={factions} />}
            >
              {renderCards(groups.daily)}
            </QuestContainer>
          </Box>

          <Box sx={{ gridArea: 'weekly', minHeight: { xs: 220, md: 'auto' } }}>
            <QuestContainer
              type="weekly"
              title="Weekly Quests"
              {...completionCounts(groups.weekly)}
              headerAction={<QuestCreateButton defaultType="weekly" factions={factions} />}
            >
              {renderCards(groups.weekly)}
            </QuestContainer>
          </Box>

          <Box sx={{ gridArea: 'fog', minHeight: { xs: 220, md: 'auto' } }}>
            <QuestContainer
              type="fog"
              title="The Fog"
              {...completionCounts(groups.fog)}
              topSlot={<FogQuickAdd />}
            >
              {renderCards(groups.fog)}
            </QuestContainer>
          </Box>
        </Box>
      </Box>
    </Stack>
  );
}
