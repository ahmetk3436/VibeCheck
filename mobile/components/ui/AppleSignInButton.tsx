import React, { useState } from 'react';
import { Platform, View, Text, Pressable, ActivityIndicator } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { hapticError, hapticSelection } from '../../lib/haptics';

interface AppleSignInButtonProps {
  onError?: (error: string) => void;
  isLoading?: boolean;
}

// 2025-2026 Enhancement: Apple Sign-In with Android fallback and loading state
export default function AppleSignInButton({
  onError,
  isLoading: externalLoading = false,
}: AppleSignInButtonProps) {
  const { loginWithApple } = useAuth();
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading || internalLoading;

  // Sign in with Apple is only available on iOS
  const isIOS = Platform.OS === 'ios';

  const handleAppleSignIn = async () => {
    if (isLoading) return;

    hapticSelection();
    setInternalLoading(true);

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      const fullName = credential.fullName
        ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
        : undefined;

      await loginWithApple(
        credential.identityToken,
        credential.authorizationCode || '',
        fullName,
        credential.email || undefined
      );
    } catch (err: any) {
      if (err.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled - don't show error
        return;
      }
      hapticError();
      onError?.(err.message || 'Apple Sign In failed');
    } finally {
      setInternalLoading(false);
    }
  };

  // Android fallback button
  if (!isIOS) {
    return (
      <View className="mt-4">
        <View className="mb-4 flex-row items-center">
          <View className="h-px flex-1 bg-gray-700" />
          <Text className="mx-4 text-sm text-gray-500">or continue with</Text>
          <View className="h-px flex-1 bg-gray-700" />
        </View>

        <Pressable
          className="flex-row items-center justify-center rounded-xl bg-white py-3.5 active:opacity-80"
          onPress={() => {
            hapticSelection();
            // TODO: Implement Google Sign-In for Android
            onError?.('Google Sign-In coming soon to Android');
          }}
        >
          <Text className="text-lg mr-2">{'G'}</Text>
          <Text className="text-base font-semibold text-gray-900">
            Google
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="mt-4">
      <View className="mb-4 flex-row items-center">
        <View className="h-px flex-1 bg-gray-700" />
        <Text className="mx-4 text-sm text-gray-500">or</Text>
        <View className="h-px flex-1 bg-gray-700" />
      </View>

      <Pressable
        className={`flex-row items-center justify-center rounded-xl bg-black py-3.5 ${isLoading ? 'opacity-70' : 'active:opacity-80'}`}
        onPress={handleAppleSignIn}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <>
            <Text className="mr-2 text-lg text-white">{'\uF8FF'}</Text>
            <Text className="text-base font-semibold text-white">
              Sign in with Apple
            </Text>
          </>
        )}
      </Pressable>

      {/* Trust indicator */}
      <View className="flex-row items-center justify-center mt-3">
        <Ionicons name="shield-checkmark" size={12} color="#6b7280" />
        <Text className="text-xs text-gray-600 ml-1">
          Secure authentication powered by Apple
        </Text>
      </View>
    </View>
  );
}
