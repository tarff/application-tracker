import type { AuthError } from '@supabase/supabase-js';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/buttons';
import { Field } from '@/components/field';
import { Screen } from '@/components/screen';
import { supabase } from '@/lib/supabase';

const CONNECTION_ERROR = 'Could not connect. Check your connection and try again.';

function authErrorMessage(error: AuthError) {
  switch (error.code) {
    case 'invalid_credentials':
      return 'That email or password is wrong.';
    case 'email_exists':
    case 'user_already_exists':
      return 'That email is already in use. Sign in instead.';
    case 'weak_password':
      return error.message;
    case 'signup_disabled':
      return 'New sign-ups are turned off.';
    case 'email_address_invalid':
    case 'validation_failed':
      return 'Enter a valid email address.';
    case 'over_request_rate_limit':
      return 'Too many attempts. Wait a few minutes and try again.';
    default:
      return error.status === 0 || error.name === 'AuthRetryableFetchError'
        ? CONNECTION_ERROR
        : 'Something went wrong. Please try again.';
  }
}

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignIn = mode === 'sign-in';
  const title = isSignIn ? 'Sign in' : 'Sign up';

  async function submit() {
    if (isSubmitting) return;
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const credentials = { email: email.trim(), password };
      const { error: authError } = isSignIn
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);
      if (authError) setError(authErrorMessage(authError));
    } catch {
      setError(CONNECTION_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <ScrollView
          contentContainerClassName="grow justify-center p-[22px]"
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-[404px] self-center">
            <Text
              className="mb-7 text-center font-heading text-[19px] text-ink"
              accessibilityRole="header"
            >
              {title}
            </Text>

            <Field
              label="Email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
            />

            <Field
              label="Password"
              autoCapitalize="none"
              autoComplete={isSignIn ? 'current-password' : 'new-password'}
              secureTextEntry
              textContentType={isSignIn ? 'password' : 'newPassword'}
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={submit}
            />

            {error && (
              <Text className="mb-4 font-body text-[14px] text-red-600" accessibilityRole="alert">
                {error}
              </Text>
            )}

            <PrimaryButton label={title} isBusy={isSubmitting} onPress={submit} />

            <Link
              className="mt-6 text-center font-body text-[14px] text-primary"
              href={isSignIn ? '/sign-up' : '/sign-in'}
              replace
            >
              {isSignIn ? 'New here? Sign up' : 'Already have an account? Sign in'}
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
