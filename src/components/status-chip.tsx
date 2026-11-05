import { Pressable, Text } from 'react-native';

type StatusChipProps = {
  label: string;
  isSelected: boolean;
  accessibilityLabel: string;
  onPress: () => void;
};

export function StatusChip({ label, isSelected, accessibilityLabel, onPress }: StatusChipProps) {
  return (
    <Pressable
      className={`mb-3 mr-3 h-[34px] justify-center rounded-[10px] px-6 ${isSelected ? 'bg-primary' : 'bg-soft'}`}
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel}
      aria-checked={isSelected}
      onPress={onPress}
    >
      <Text
        className={`text-[14px] ${isSelected ? 'font-heading text-white' : 'font-body text-primary'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
