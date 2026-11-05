import { Image, Text, View } from 'react-native';

import type { DateFieldProps } from '@/components/date-field';
import { cardShadow } from '@/lib/theme';

// The browser's own date input gives a calendar, typing and a clear option, and only ever
// reports a real date or nothing.
export function DateField({ value, disabled, onChange }: DateFieldProps) {
  return (
    <View className="mb-6 rounded-[15px] bg-white" style={cardShadow}>
      <input
        className="box-border w-full rounded-[15px] border-0 bg-transparent pb-4 pl-[52px] pr-4 pt-[29px] font-body text-[14px] text-ink"
        type="date"
        aria-label="Date applied"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      <Text
        className="absolute left-[52px] top-4 font-body text-[9px] text-muted"
        style={{ pointerEvents: 'none' }}
      >
        Date applied
      </Text>
      <View className="absolute left-4 top-[19px]" style={{ pointerEvents: 'none' }}>
        <Image source={require('@/assets/design/calendar.png')} style={{ width: 24, height: 24 }} />
      </View>
    </View>
  );
}
