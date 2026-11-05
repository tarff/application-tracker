import { Modal, Pressable, Text, View } from 'react-native';

type ConfirmDialogProps = {
  isVisible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// Alert.alert does nothing on web, so both platforms share this dialog.
export function ConfirmDialog({
  isVisible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal transparent visible={isVisible} animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/50 p-6">
        <View className="w-full max-w-sm rounded-[15px] bg-white p-6" accessibilityRole="alert">
          <Text className="mb-2 font-heading text-[19px] text-ink">{title}</Text>
          <Text className="mb-6 font-body text-[14px] text-muted">{message}</Text>
          <Pressable
            className="mb-2 h-[52px] items-center justify-center rounded-[15px] bg-red-600"
            accessibilityRole="button"
            accessibilityLabel={confirmLabel}
            onPress={onConfirm}
          >
            <Text className="font-heading text-[14px] text-white">{confirmLabel}</Text>
          </Pressable>
          <Pressable
            className="h-[52px] items-center justify-center rounded-[15px]"
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
            onPress={onCancel}
          >
            <Text className="font-heading text-[14px] text-primary">{cancelLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
