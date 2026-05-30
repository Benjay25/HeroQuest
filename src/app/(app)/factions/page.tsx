import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { createClient } from '@/lib/supabase/server';
import { getFactionsWithReputation } from '@/lib/supabase/queries/factions';
import FactionCard from '@/components/ui/FactionCard';
import OrnateDivider from '@/components/ui/OrnateDivider';

/**
 * /factions — the Guilds board. Public (guests can browse); logged-in users
 * also see their standing with each guild.
 */
export default async function FactionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const factions = await getFactionsWithReputation();

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto', p: { xs: 2.5, md: 4 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="primary.light">The Guilds</Typography>
        <Typography variant="h2" sx={{ mt: 0.5 }}>Choose Your Allegiances</Typography>
        <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
          Each guild rewards a different kind of effort. Tag your quests to a guild and rise through its ranks.
        </Typography>
      </Box>

      <OrnateDivider sx={{ mb: 4 }} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' },
          gap: 3,
          alignItems: 'stretch',
        }}
      >
        {factions.map(faction => (
          <FactionCard key={faction.id} faction={faction} showReputation={Boolean(user)} />
        ))}
      </Box>
    </Box>
  );
}
