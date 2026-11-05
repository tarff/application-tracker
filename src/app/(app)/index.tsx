import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from 'react-native';

import { SoftButton } from '@/components/buttons';
import { Screen, ScreenHeader } from '@/components/screen';
import { StatusChip } from '@/components/status-chip';
import { StatusPill } from '@/components/status-pill';
import {
  countLabel,
  filterByStatus,
  formatDate,
  listApplications,
  STATUSES,
  statusLabel,
  type Application,
  type StatusFilter,
} from '@/lib/applications';
import { supabase } from '@/lib/supabase';
import { cardShadow, PRIMARY, primaryShadow } from '@/lib/theme';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'ready'; applications: Application[] };

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...STATUSES,
];

function CenteredMessage({ message, isError }: { message: string; isError?: boolean }) {
  return (
    <Text
      className="py-12 text-center font-body text-[14px] text-muted"
      accessibilityRole={isError ? 'alert' : undefined}
    >
      {message}
    </Text>
  );
}

function ApplicationRow({ application, onPress }: { application: Application; onPress: () => void }) {
  const status = statusLabel(application.status);
  const date = formatDate(application.date_applied);
  return (
    <Pressable
      className="mb-4 rounded-[15px] bg-white p-4"
      style={cardShadow}
      accessibilityRole="button"
      accessibilityLabel={`${application.company}, ${application.role}, ${status}, ${date}. Edit.`}
      onPress={onPress}
    >
      <Text className="mb-2 font-body text-[11px] text-muted">{application.company}</Text>
      <Text className="mb-2 font-body text-[14px] text-ink">{application.role}</Text>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Image
            source={require('@/assets/design/calendar.png')}
            style={{ width: 14, height: 14 }}
          />
          <Text className="ml-1.5 font-body text-[11px] text-date">{date}</Text>
        </View>
        <StatusPill status={application.status} />
      </View>
    </Pressable>
  );
}

export default function ApplicationsScreen() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [signOutFailed, setSignOutFailed] = useState(false);

  // Runs on opening and on returning from the form, so saved changes always show.
  const load = useCallback(() => {
    let isCurrent = true;
    listApplications(supabase).then(({ data, error }) => {
      if (!isCurrent) return;
      setState(error ? { kind: 'failed' } : { kind: 'ready', applications: data ?? [] });
    });
    return () => {
      isCurrent = false;
    };
  }, []);
  useFocusEffect(load);

  async function signOut() {
    setSignOutFailed(false);
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) setSignOutFailed(true);
  }

  const visible = state.kind === 'ready' ? filterByStatus(state.applications, filter) : [];

  return (
    <Screen>
      <View className="w-full max-w-md flex-1 self-center">
        <View className="px-[22px]">
          <ScreenHeader
            title="Applications"
            right={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                hitSlop={10}
                onPress={signOut}
              >
                <Text className="font-body text-[14px] text-primary">Sign out</Text>
              </Pressable>
            }
          />

          {signOutFailed && (
            <Text className="mb-4 font-body text-[14px] text-red-600" accessibilityRole="alert">
              Could not sign out. Please try again.
            </Text>
          )}

          <View className="flex-row flex-wrap" accessibilityRole="radiogroup">
            {FILTERS.map((option) => (
              <StatusChip
                key={option.value}
                label={option.label}
                accessibilityLabel={`Show ${option.label}`}
                isSelected={filter === option.value}
                onPress={() => setFilter(option.value)}
              />
            ))}
          </View>
        </View>

        {state.kind === 'loading' && (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={PRIMARY} accessibilityLabel="Loading applications" />
          </View>
        )}

        {state.kind === 'failed' && (
          <View className="flex-1 items-center justify-center px-[22px]">
            <CenteredMessage
              isError
              message="Could not load your applications. Check your connection and try again."
            />
            <SoftButton
              label="Retry"
              onPress={() => {
                setState({ kind: 'loading' });
                load();
              }}
            />
          </View>
        )}

        {state.kind === 'ready' && (
          <>
            <Text className="mb-4 mt-1 px-[22px] font-body text-[11px] text-muted">
              {countLabel(visible.length)}
            </Text>
            <FlatList
              className="flex-1"
              contentContainerClassName="px-[22px]"
              data={visible}
              keyExtractor={(application) => application.id}
              renderItem={({ item }) => (
                <ApplicationRow
                  application={item}
                  onPress={() => router.push(`/applications/${item.id}`)}
                />
              )}
              ListEmptyComponent={
                <CenteredMessage
                  message={
                    state.applications.length === 0
                      ? 'No applications yet. Add your first one.'
                      : 'No applications match this filter.'
                  }
                />
              }
            />
          </>
        )}

        <Pressable
          className="my-4 h-11 w-11 items-center justify-center self-center rounded-full bg-primary"
          style={primaryShadow}
          accessibilityRole="button"
          accessibilityLabel="Add application"
          onPress={() => router.push('/applications/new')}
        >
          <View className="absolute h-0.5 w-3.5 rounded-full bg-white" />
          <View className="absolute h-3.5 w-0.5 rounded-full bg-white" />
        </Pressable>
      </View>
    </Screen>
  );
}
