import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Linking,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from '../../lib/haptics';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    hapticMedium();
    setError('');

    if (!email || !password || !confirmPassword) {
      hapticError();
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      hapticError();
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      hapticError();
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password);
      hapticSuccess();
    } catch (err: any) {
      hapticError();
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-950"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-8">
        <Text className="text-5xl text-center">{'\u2728'}</Text>
        <Text className="text-3xl font-bold text-white text-center mt-2">
          Create Account
        </Text>
        <Text className="text-base text-gray-400 text-center mt-1 mb-8">
          Discover your daily vibe aesthetic
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

        <View className="mb-4">
          <Input
            label="Password"
            placeholder="Min. 8 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
            editable={!isLoading}
          />
        </View>

        <View className="mb-6">
          <Input
            label="Confirm Password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textContentType="newPassword"
            editable={!isLoading}
          />
        </View>

        <Button
          title={isLoading ? 'Creating your account...' : 'Create Account'}
          onPress={handleRegister}
          isLoading={isLoading}
          size="lg"
        />

        <View className="mt-6 flex-row items-center justify-center">
          <Text className="text-gray-400">Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable onPress={() => hapticLight()}>
              <Text className="font-semibold text-primary-500">Sign In</Text>
            </Pressable>
          </Link>
        </View>

        {/* Legal */}
        <Text className="text-xs text-gray-600 text-center mt-6 px-4">
          By creating an account, you agree to our{' '}
          <Text
            className="text-gray-400"
            onPress={() => Linking.openURL('https://vibecheck.app/terms')}
          >
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text
            className="text-gray-400"
            onPress={() => Linking.openURL('https://vibecheck.app/privacy')}
          >
            Privacy Policy
          </Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
