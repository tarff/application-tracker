import type { ComponentProps, ReactNode } from 'react';
import { Text, TextInput, View } from 'react-native';

import { cardShadow } from '@/lib/theme';

type FieldProps = ComponentProps<typeof TextInput> & {
  label: string;
  error?: string;
  icon?: ReactNode;
  accessory?: ReactNode;
};

export function Field({ label, error, icon, accessory, multiline, ...inputProps }: FieldProps) {
  return (
    <View className="mb-6">
      <View
        className={`flex-row items-center rounded-[15px] bg-white ${error ? 'border border-red-600' : ''}`}
        style={cardShadow}
      >
        <View className="flex-1">
          {/* The input fills the card, so tapping anywhere on it, including the label, focuses it. */}
          <TextInput
            className={`rounded-[15px] pb-4 pr-4 pt-[29px] font-body text-ink ${icon ? 'pl-[52px]' : 'pl-4'} ${multiline ? 'min-h-[142px] text-[11px]' : 'text-[14px]'}`}
            accessibilityLabel={label}
            multiline={multiline}
            {...inputProps}
          />
          <Text
            className={`absolute top-4 font-body text-[9px] text-muted ${icon ? 'left-[52px]' : 'left-4'}`}
            style={{ pointerEvents: 'none' }}
          >
            {label}
          </Text>
          {icon && (
            <View className="absolute left-4 top-[19px]" style={{ pointerEvents: 'none' }}>
              {icon}
            </View>
          )}
        </View>
        {accessory && <View className="pr-4">{accessory}</View>}
      </View>
      {error && (
        <Text className="ml-4 mt-1 font-body text-[11px] text-red-600" accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
}
