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
        <View className="w-full max-w-sm rounded-2xl bg-white p-6" accessibilityRole="alert">
          <Text className="mb-2 text-lg font-semibold">{title}</Text>
          <Text className="mb-6 text-gray-600">{message}</Text>
          <Pressable
            className="mb-2 items-center rounded-xl bg-red-600 py-3"
            accessibilityRole="button"
            accessibilityLabel={confirmLabel}
            onPress={onConfirm}
          >
            <Text className="font-semibold text-white">{confirmLabel}</Text>
          </Pressable>
          <Pressable
            className="items-center rounded-xl py-3"
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
            onPress={onCancel}
          >
            <Text className="font-semibold text-gray-700">{cancelLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
