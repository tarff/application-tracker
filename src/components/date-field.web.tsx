import { Image, Text, View } from 'react-native';

import type { DateFieldProps } from '@/components/date-field';
import { cardShadow } from '@/lib/theme';

// The browser's own date input gives a calendar and typing. It reports an empty value for both a
// cleared date and a half-typed one, and only its validity tells them apart.
export function DateField({ value, disabled, onChange, error, validityRef }: DateFieldProps) {
  return (
    <View className="mb-6">
      <View
        className={`rounded-[15px] bg-white ${error ? 'border border-red-600' : ''}`}
        style={cardShadow}
      >
        <input
          className="box-border w-full rounded-[15px] border-0 bg-transparent pb-4 pl-[52px] pr-4 pt-[29px] font-body text-[14px] text-ink"
          type="date"
          aria-label="Date applied"
          value={value}
          disabled={disabled}
          ref={(input) => {
            if (validityRef) validityRef.current = input?.validity ?? null;
          }}
          onChange={(event) => onChange(event.target.value)}
        />
        <Text
          className="absolute left-[52px] top-4 font-body text-[9px] text-muted"
          style={{ pointerEvents: 'none' }}
        >
          Date applied
        </Text>
        <View className="absolute left-4 top-[19px]" style={{ pointerEvents: 'none' }}>
          <Image
            source={require('@/assets/design/calendar.png')}
            style={{ width: 24, height: 24 }}
          />
        </View>
      </View>
      {error && (
        <Text className="ml-4 mt-1 font-body text-[11px] text-red-600" accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
}
