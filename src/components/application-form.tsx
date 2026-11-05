import { useRouter, usePreventRemove } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { PrimaryButton, SoftButton } from '@/components/buttons';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { DateField } from '@/components/date-field';
import { Field } from '@/components/field';
import { Screen, ScreenHeader } from '@/components/screen';
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
import { cardShadow } from '@/lib/theme';

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
  const [isDateIncomplete, setIsDateIncomplete] = useState(false);
  const dateValidity = useRef<{ badInput: boolean } | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  // State updates wait for a render, so a double tap can fire twice before isBusy changes.
  const busyRef = useRef(false);

  const hasChanges = (Object.keys(values) as (keyof FormValues)[]).some(
    (key) => values[key] !== initialValues[key],
  );
  // Leaving is blocked during a save or delete, so a request cannot finish after "Discard changes".
  const disablePrevention = usePreventRemove((hasChanges || isBusy) && !isLeaving, ({ repeat }) => {
    if (!busyRef.current) setPendingLeave(() => repeat);
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
    const hasIncompleteDate = dateValidity.current?.badInput ?? false;
    setIsDateIncomplete(hasIncompleteDate);
    if (hasIncompleteDate || Object.keys(validate(values)).length > 0) return;

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
    <Screen>
      <KeyboardAvoidingView className="w-full max-w-md flex-1 self-center" behavior="padding">
        <ScrollView contentContainerClassName="px-[22px] pb-6" keyboardShouldPersistTaps="handled">
          <ScreenHeader
            title={application ? 'Edit application' : 'Add application'}
            left={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                hitSlop={10}
                disabled={isBusy}
                onPress={goBack}
              >
                <Image
                  source={require('@/assets/design/arrow-left.png')}
                  style={{ width: 24, height: 24 }}
                />
              </Pressable>
            }
          />

          <View>
            <Field
              label="Company"
              value={values.company}
              onChangeText={setField('company')}
              error={errors.company}
              editable={!isBusy}
            />
            <Field
              label="Role"
              value={values.role}
              onChangeText={setField('role')}
              error={errors.role}
              editable={!isBusy}
            />
            <Field
              label="Job link"
              value={values.job_url}
              onChangeText={setField('job_url')}
              error={errors.job_url}
              editable={!isBusy}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              accessory={
                application && isValidJobUrl(jobUrl) ? (
                  <SoftButton
                    label="Open job ad"
                    role="link"
                    onPress={() => Linking.openURL(jobUrl)}
                  />
                ) : undefined
              }
            />
            <DateField
              value={values.date_applied}
              disabled={isBusy}
              error={isDateIncomplete ? 'Finish the date, or clear it.' : undefined}
              validityRef={dateValidity}
              onChange={(value) => {
                setIsDateIncomplete(false);
                setField('date_applied')(value);
              }}
            />

            <View className="mb-6 rounded-[15px] bg-white px-4 pb-1 pt-4" style={cardShadow}>
              <Text className="mb-2 font-body text-[9px] text-muted">Status</Text>
              <View className="flex-row flex-wrap" accessibilityRole="radiogroup">
                {STATUSES.map((status) => (
                  <StatusChip
                    key={status.value}
                    label={status.label}
                    accessibilityLabel={`Status: ${status.label}`}
                    isSelected={values.status === status.value}
                    disabled={isBusy}
                    onPress={() => setField('status')(status.value)}
                  />
                ))}
              </View>
            </View>

            <Field
              label="Notes"
              value={values.notes}
              onChangeText={setField('notes')}
              editable={!isBusy}
              multiline
              textAlignVertical="top"
            />

            {saveError && (
              <Text className="mb-4 font-body text-[14px] text-red-600" accessibilityRole="alert">
                {saveError}
              </Text>
            )}

            <PrimaryButton label="Save" isBusy={isBusy} onPress={save} />

            {application && (
              <Pressable
                className="mt-3 h-[52px] items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Delete application"
                disabled={isBusy}
                onPress={() => setIsConfirmingDelete(true)}
              >
                <Text className="font-heading text-[14px] text-red-600">Delete application</Text>
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
    </Screen>
  );
}
