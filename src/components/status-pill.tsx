import { Text, View } from 'react-native';

import { statusLabel } from '@/lib/applications';

// Applied, Interview and Offer use the design's To-do, In Progress and Done pills. The design has
// no equivalent for Rejected or Withdrawn, so those are chosen to stay distinct from the others.
const COLOURS: Record<string, { box: string; text: string }> = {
  applied: { box: 'bg-[#E3F2FF]', text: 'text-[#0087FF]' },
  interview: { box: 'bg-[#FFE9E1]', text: 'text-[#FF7D53]' },
  offer: { box: 'bg-soft', text: 'text-primary' },
  rejected: { box: 'bg-[#FFE4F2]', text: 'text-red-600' },
  withdrawn: { box: 'bg-gray-100', text: 'text-muted' },
};

export function StatusPill({ status }: { status: string }) {
  const colours = COLOURS[status] ?? COLOURS.withdrawn;
  return (
    <View className={`min-h-3.5 justify-center rounded-[7px] px-1.5 ${colours.box}`}>
      <Text className={`font-body text-[9px] ${colours.text}`}>{statusLabel(status)}</Text>
    </View>
  );
}
