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
      className={`mb-2 mr-2 rounded-full px-4 py-2 ${isSelected ? 'bg-blue-600' : 'bg-gray-100'}`}
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel}
      aria-checked={isSelected}
      onPress={onPress}
    >
      <Text className={isSelected ? 'font-semibold text-white' : 'text-gray-700'}>{label}</Text>
    </Pressable>
  );
}
