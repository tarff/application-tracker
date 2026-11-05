import { useRouter, usePreventRemove } from 'expo-router';
import { useRef, useState, type ComponentProps } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { StatusChip } from '@/components/status-chip';
import {
  emptyFormValues,
  isValidJobUrl,
  STATUSES,
  toFormValues,
  toRow,
  validate,
  type Application,
  type FormValues,
} from '@/lib/applications';
import { supabase } from '@/lib/supabase';

type FieldProps = ComponentProps<typeof TextInput> & {
  label: string;
  error?: string;
};

function Field({ label, error, className, ...inputProps }: FieldProps) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm text-gray-600">{label}</Text>
      <TextInput
        className={`rounded-xl border px-4 py-3 ${error ? 'border-red-600' : 'border-gray-300'} ${className ?? ''}`}
        accessibilityLabel={label}
        {...inputProps}
      />
      {error && (
        <Text className="mt-1 text-sm text-red-600" accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
}

export function ApplicationForm({ application }: { application?: Application }) {
  const router = useRouter();
  const [initialValues] = useState(() =>
    application ? toFormValues(application) : emptyFormValues(),
  );
  const [values, setValues] = useState<FormValues>(initialValues);
  const [hasTriedToSave, setHasTriedToSave] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  // State updates wait for a render, so a double tap can fire twice before isBusy changes.
  const busyRef = useRef(false);

  const hasChanges = (Object.keys(values) as (keyof FormValues)[]).some(
    (key) => values[key] !== initialValues[key],
  );
  const disablePrevention = usePreventRemove(hasChanges && !isLeaving, ({ repeat }) => {
    setPendingLeave(() => repeat);
  });

  const errors = hasTriedToSave ? validate(values) : {};
  const jobUrl = values.job_url.trim();

  function setField(field: keyof FormValues) {
    return (value: string) => setValues((current) => ({ ...current, [field]: value }));
  }

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  function leaveAfterChange() {
    setIsLeaving(true);
    disablePrevention();
    goBack();
  }

  async function save() {
    if (busyRef.current) return;
    setHasTriedToSave(true);
    if (Object.keys(validate(values)).length > 0) return;

    busyRef.current = true;
    setIsBusy(true);
    setSaveError(null);
    try {
      const row = toRow(values);
      const { error } = application
        ? await supabase
            .from('applications')
            .update(row)
            .eq('id', application.id)
            .select('id')
            .single()
        : await supabase.from('applications').insert(row).select('id').single();
      if (error) {
        setSaveError('Could not save. Check your connection and try again.');
        return;
      }
      leaveAfterChange();
    } catch {
      setSaveError('Could not save. Check your connection and try again.');
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  }

  async function deleteApplication() {
    if (busyRef.current || !application) return;
    setIsConfirmingDelete(false);

    busyRef.current = true;
    setIsBusy(true);
    setSaveError(null);
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', application.id)
        .select('id')
        .single();
      if (error) {
        setSaveError('Could not delete. Check your connection and try again.');
        return;
      }
      leaveAfterChange();
    } catch {
      setSaveError('Could not delete. Check your connection and try again.');
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  }

  function discardAndLeave() {
    const leave = pendingLeave;
    setPendingLeave(null);
    setIsLeaving(true);
    leave?.();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <ScrollView contentContainerClassName="p-6" keyboardShouldPersistTaps="handled">
          <View className="w-full max-w-md self-center">
            <Pressable
              className="mb-4 self-start"
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={goBack}
            >
              <Text className="text-blue-600">Back</Text>
            </Pressable>

            <Text className="mb-6 text-2xl font-semibold" accessibilityRole="header">
              {application ? 'Edit application' : 'Add application'}
            </Text>

            <Field
              label="Company"
              value={values.company}
              onChangeText={setField('company')}
              error={errors.company}
            />
            <Field
              label="Role"
              value={values.role}
              onChangeText={setField('role')}
              error={errors.role}
            />
            <Field
              label="Job link"
              value={values.job_url}
              onChangeText={setField('job_url')}
              error={errors.job_url}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            {application && isValidJobUrl(jobUrl) && (
              <Pressable
                className="mb-4 self-start"
                accessibilityRole="link"
                accessibilityLabel="Open job ad"
                onPress={() => Linking.openURL(jobUrl)}
              >
                <Text className="text-blue-600">Open job ad</Text>
              </Pressable>
            )}
            <Field
              label="Date applied (YYYY-MM-DD)"
              value={values.date_applied}
              onChangeText={setField('date_applied')}
              error={errors.date_applied}
              autoCorrect={false}
              keyboardType="numbers-and-punctuation"
            />

            <Text className="mb-1 text-sm text-gray-600">Status</Text>
            <View className="mb-2 flex-row flex-wrap" accessibilityRole="radiogroup">
              {STATUSES.map((status) => (
                <StatusChip
                  key={status.value}
                  label={status.label}
                  accessibilityLabel={`Status: ${status.label}`}
                  isSelected={values.status === status.value}
                  onPress={() => setField('status')(status.value)}
                />
              ))}
            </View>

            <Field
              label="Notes"
              className="min-h-24"
              value={values.notes}
              onChangeText={setField('notes')}
              multiline
              textAlignVertical="top"
            />

            {saveError && (
              <Text className="mb-4 text-red-600" accessibilityRole="alert">
                {saveError}
              </Text>
            )}

            <Pressable
              className={`mb-3 items-center rounded-xl bg-blue-600 py-3 ${isBusy ? 'opacity-50' : ''}`}
              accessibilityRole="button"
              accessibilityLabel="Save"
              disabled={isBusy}
              onPress={save}
            >
              <Text className="font-semibold text-white">{isBusy ? 'Please wait…' : 'Save'}</Text>
            </Pressable>

            {application && (
              <Pressable
                className="items-center rounded-xl py-3"
                accessibilityRole="button"
                accessibilityLabel="Delete application"
                disabled={isBusy}
                onPress={() => setIsConfirmingDelete(true)}
              >
                <Text className="font-semibold text-red-600">Delete application</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        isVisible={isConfirmingDelete}
        title="Delete this application?"
        message="This can't be undone."
        confirmLabel="Delete"
        cancelLabel="Keep application"
        onConfirm={deleteApplication}
        onCancel={() => setIsConfirmingDelete(false)}
      />
      <ConfirmDialog
        isVisible={pendingLeave !== null}
        title="Discard your changes?"
        message="You have unsaved changes on this form."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onConfirm={discardAndLeave}
        onCancel={() => setPendingLeave(null)}
      />
    </SafeAreaView>
  );
}
