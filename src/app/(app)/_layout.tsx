import { Stack } from 'expo-router';

import { useSession } from '@/lib/session';

export default function AppLayout() {
  const { session } = useSession();
  // A different user gets new screens, so nothing loaded for the previous account stays on show.
  return <Stack key={session?.user.id} screenOptions={{ headerShown: false }} />;
}
