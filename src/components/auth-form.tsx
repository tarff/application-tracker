import type { AuthError } from '@supabase/supabase-js';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

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
    <KeyboardAvoidingView className="flex-1 bg-white" behavior="padding">
      <ScrollView
        contentContainerClassName="grow justify-center p-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-md self-center">
          <Text className="mb-6 text-2xl font-semibold" accessibilityRole="header">
            {title}
          </Text>

          <Text className="mb-1 text-sm text-gray-600">Email</Text>
          <TextInput
            className="mb-4 rounded-xl border border-gray-300 px-4 py-3"
            accessibilityLabel="Email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />

          <Text className="mb-1 text-sm text-gray-600">Password</Text>
          <TextInput
            className="mb-4 rounded-xl border border-gray-300 px-4 py-3"
            accessibilityLabel="Password"
            autoCapitalize="none"
            autoComplete={isSignIn ? 'current-password' : 'new-password'}
            secureTextEntry
            textContentType={isSignIn ? 'password' : 'newPassword'}
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
          />

          {error && (
            <Text className="mb-4 text-red-600" accessibilityRole="alert">
              {error}
            </Text>
          )}

          <Pressable
            className={`mb-4 items-center rounded-xl bg-blue-600 py-3 ${isSubmitting ? 'opacity-50' : ''}`}
            accessibilityRole="button"
            accessibilityLabel={title}
            disabled={isSubmitting}
            onPress={submit}
          >
            <Text className="font-semibold text-white">{isSubmitting ? 'Please wait…' : title}</Text>
          </Pressable>

          <Link
            className="text-center text-blue-600"
            href={isSignIn ? '/sign-up' : '/sign-in'}
            replace
          >
            {isSignIn ? 'New here? Sign up' : 'Already have an account? Sign in'}
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
