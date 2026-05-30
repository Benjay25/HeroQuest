import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ComingSoon from '@/components/ui/ComingSoon';

/**
 * /profile — the full hero profile (level history, faction standings, streak,
 * achievements) comes in Phase 5. Protected stub for now.
 */
export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <ComingSoon
      icon="📜"
      eyebrow="Your Legend"
      title="Profile"
      blurb="Your full hero record — levels earned, guild standings, streaks kept, and achievements unlocked — will be chronicled here."
    />
  );
}
