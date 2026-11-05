import { Pressable, Text } from 'react-native';

import { primaryShadow } from '@/lib/theme';

type PrimaryButtonProps = {
  label: string;
  isBusy: boolean;
  onPress: () => void;
};

export function PrimaryButton({ label, isBusy, onPress }: PrimaryButtonProps) {
  return (
    <Pressable
      className={`h-[52px] items-center justify-center rounded-[15px] bg-primary ${isBusy ? 'opacity-50' : ''}`}
      style={primaryShadow}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={isBusy}
      onPress={onPress}
    >
      <Text className="font-heading text-[19px] text-white">{isBusy ? 'Please wait…' : label}</Text>
    </Pressable>
  );
}

type SoftButtonProps = {
  label: string;
  role?: 'button' | 'link';
  onPress: () => void;
};

export function SoftButton({ label, role = 'button', onPress }: SoftButtonProps) {
  return (
    <Pressable
      className="h-[31px] justify-center rounded-[7px] bg-soft px-4"
      accessibilityRole={role}
      accessibilityLabel={label}
      onPress={onPress}
    >
      <Text className="font-body text-[11px] text-primary">{label}</Text>
    </Pressable>
  );
}
