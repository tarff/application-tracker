import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusChip } from '@/components/status-chip';
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
      className="py-12 text-center text-gray-600"
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
      className="mb-3 rounded-2xl border border-gray-200 p-4"
      accessibilityRole="button"
      accessibilityLabel={`${application.company}, ${application.role}, ${status}, ${date}. Edit.`}
      onPress={onPress}
    >
      <Text className="text-base font-semibold">{application.company}</Text>
      <Text className="mb-2 text-gray-600">{application.role}</Text>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-blue-600">{status}</Text>
        <Text className="text-sm text-gray-500">{date}</Text>
      </View>
    </Pressable>
  );
}

export default function ApplicationsScreen() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [filter, setFilter] = useState<StatusFilter>('all');

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

  const visible = state.kind === 'ready' ? filterByStatus(state.applications, filter) : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View className="w-full max-w-md flex-1 self-center px-6 pt-4">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-2xl font-semibold" accessibilityRole="header">
            Applications
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            onPress={() => supabase.auth.signOut({ scope: 'local' })}
          >
            <Text className="text-blue-600">Sign out</Text>
          </Pressable>
        </View>

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

        {state.kind === 'loading' && (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator accessibilityLabel="Loading applications" />
          </View>
        )}

        {state.kind === 'failed' && (
          <View className="flex-1 items-center justify-center">
            <CenteredMessage
              isError
              message="Could not load your applications. Check your connection and try again."
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry"
              onPress={() => {
                setState({ kind: 'loading' });
                load();
              }}
            >
              <Text className="font-semibold text-blue-600">Retry</Text>
            </Pressable>
          </View>
        )}

        {state.kind === 'ready' && (
          <>
            <Text className="mb-3 mt-1 text-sm text-gray-600">{countLabel(visible.length)}</Text>
            <FlatList
              className="flex-1"
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
          className="my-4 items-center rounded-xl bg-blue-600 py-3"
          accessibilityRole="button"
          accessibilityLabel="Add application"
          onPress={() => router.push('/applications/new')}
        >
          <Text className="font-semibold text-white">Add application</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
