import type { ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Image
        source={require('@/assets/design/background.png')}
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
        resizeMode="cover"
      />
      <SafeAreaView style={{ flex: 1 }}>{children}</SafeAreaView>
    </View>
  );
}

type ScreenHeaderProps = {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
};

export function ScreenHeader({ title, left, right }: ScreenHeaderProps) {
  return (
    <View className="my-7 min-h-6 flex-row items-center">
      <View className="flex-1 items-start">{left}</View>
      <Text className="font-heading text-[19px] text-ink" accessibilityRole="header">
        {title}
      </Text>
      <View className="flex-1 items-end">{right}</View>
    </View>
  );
}
