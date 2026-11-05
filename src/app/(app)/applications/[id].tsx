import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { ApplicationForm } from '@/components/application-form';
import { SoftButton } from '@/components/buttons';
import { Screen } from '@/components/screen';
import type { Application } from '@/lib/applications';
import { supabase } from '@/lib/supabase';
import { PRIMARY } from '@/lib/theme';

// Postgres error code for text that is not a valid uuid, such as a mistyped web address.
const INVALID_ID_ERROR = '22P02';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'not-found' }
  | { kind: 'ready'; application: Application };

export default function EditApplicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  useEffect(() => {
    let isCurrent = true;
    supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isCurrent) return;
        if (error && error.code !== INVALID_ID_ERROR) {
          setState({ kind: 'failed' });
        } else {
          setState(data ? { kind: 'ready', application: data } : { kind: 'not-found' });
        }
      });
    return () => {
      isCurrent = false;
    };
  }, [id, attempt]);

  if (state.kind === 'ready') {
    return <ApplicationForm application={state.application} />;
  }

  if (state.kind === 'loading') {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={PRIMARY} accessibilityLabel="Loading application" />
        </View>
      </Screen>
    );
  }

  const isFailed = state.kind === 'failed';
  return (
    <Screen>
      <View className="flex-1 items-center justify-center p-[22px]">
        <Text className="mb-4 text-center font-body text-[14px] text-muted" accessibilityRole="alert">
          {isFailed
            ? 'Could not load this application. Check your connection and try again.'
            : 'This application could not be found.'}
        </Text>
        <SoftButton
          label={isFailed ? 'Retry' : 'Back to applications'}
          onPress={() => {
            if (isFailed) {
              setState({ kind: 'loading' });
              setAttempt((current) => current + 1);
            } else {
              router.replace('/');
            }
          }}
        />
      </View>
    </Screen>
  );
}
