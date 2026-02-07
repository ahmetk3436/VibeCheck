import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { hapticLight } from '../../lib/haptics';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import AppleSignInButton from '../../components/ui/AppleSignInButton';

export default function LoginScreen() {
  const { login, continueAsGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Login failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = async () => {
    hapticLight();
    await continueAsGuest();
    router.replace('/(protected)/home');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-950"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-8">
        {/* Branding */}
        <Text className="text-5xl text-center">{'\u2728'}</Text>
        <Text className="text-3xl font-bold text-white text-center mt-2">
          VibeCheck
        </Text>
        <Text className="text-base text-gray-400 text-center mt-1 mb-8">
          Welcome back
        </Text>

        {error ? (
          <View className="mb-4 rounded-xl bg-red-900/30 p-3">
            <Text className="text-sm text-red-400">{error}</Text>
          </View>
        ) : null}

        <View className="mb-4">
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            editable={!isLoading}
          />
        </View>

        <View className="mb-6">
          <Input
            label="Password"
            placeholder="Your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            editable={!isLoading}
          />
        </View>

        <Button
          title="Sign In"
          onPress={handleLogin}
          isLoading={isLoading}
          size="lg"
        />

        <View className="mt-4 flex-row items-center justify-center">
          <Text className="text-gray-400">No account? </Text>
          <Link href="/(auth)/register" asChild>
            <Text className="font-semibold text-primary-500">Sign Up</Text>
          </Link>
        </View>

        {/* Sign in with Apple (Guideline 4.8) */}
        <AppleSignInButton onError={(msg) => setError(msg)} />

        {/* Skip for now */}
        <Pressable className="mt-6 items-center py-3" onPress={handleGuestMode}>
          <Text className="text-sm text-gray-500">Skip for now</Text>
          <Text className="text-xs text-gray-600 mt-0.5">3 free uses, no sign-up needed</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
