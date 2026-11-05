import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Image, Modal, Platform, Pressable, Text, View } from 'react-native';

import { PrimaryButton, SoftButton } from '@/components/buttons';
import { formatDate, parseDate, toDateValue } from '@/lib/applications';
import { cardShadow, PRIMARY } from '@/lib/theme';

export type DateFieldProps = {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
};

// The web version is in date-field.web.tsx, because this picker package has no web support.
export function DateField({ value, disabled, onChange }: DateFieldProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerDate = parseDate(value) ?? new Date();
  const displayDate = formatDate(value);

  function pick(_event: unknown, date: Date) {
    onChange(toDateValue(date));
  }

  function openPicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: pickerDate, mode: 'date', onValueChange: pick });
    } else {
      setIsPickerOpen(true);
    }
  }

  return (
    <View className="mb-6 flex-row items-center rounded-[15px] bg-white" style={cardShadow}>
      <Pressable
        className="flex-1 flex-row items-center py-4 pl-4 pr-2"
        accessibilityRole="button"
        accessibilityLabel={`Date applied: ${displayDate}. Change date.`}
        disabled={disabled}
        onPress={openPicker}
      >
        <Image source={require('@/assets/design/calendar.png')} style={{ width: 24, height: 24 }} />
        <View className="ml-3 flex-1">
          <Text className="font-body text-[9px] text-muted">Date applied</Text>
          <Text className="font-body text-[14px] text-ink">{displayDate}</Text>
        </View>
        <Image
          source={require('@/assets/design/arrow-down.png')}
          style={{ width: 24, height: 24 }}
        />
      </Pressable>

      {value !== '' && !disabled && (
        <View className="pr-4">
          <SoftButton label="Clear" onPress={() => onChange('')} />
        </View>
      )}

      {Platform.OS === 'ios' && (
        <Modal
          transparent
          visible={isPickerOpen}
          animationType="fade"
          onRequestClose={() => setIsPickerOpen(false)}
        >
          <View className="flex-1 items-center justify-center bg-black/50 p-6">
            <View className="w-full max-w-sm rounded-[15px] bg-white p-4">
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="inline"
                themeVariant="light"
                accentColor={PRIMARY}
                onValueChange={pick}
              />
              <PrimaryButton label="Done" isBusy={false} onPress={() => setIsPickerOpen(false)} />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
