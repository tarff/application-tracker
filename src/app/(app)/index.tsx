import { Pressable, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';

export default function ApplicationsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="mb-4 text-lg font-semibold">Applications</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        onPress={() => supabase.auth.signOut({ scope: 'local' })}
      >
        <Text className="text-blue-600">Sign out</Text>
      </Pressable>
    </View>
  );
}
