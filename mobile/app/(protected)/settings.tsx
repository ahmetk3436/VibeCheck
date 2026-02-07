import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, Switch, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { isBiometricAvailable, getBiometricType } from '../../lib/biometrics';
import { hapticWarning, hapticSelection, hapticSuccess, hapticError } from '../../lib/haptics';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const PRIVACY_POLICY_URL = 'https://vibecheck.app/privacy';
const TERMS_URL = 'https://vibecheck.app/terms';
const BIOMETRIC_KEY = 'biometric_enabled';

export default function SettingsScreen() {
  const { user, logout, deleteAccount, isGuest, isAuthenticated } = useAuth();
  const { isSubscribed, handleRestore } = useSubscription();
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoringPurchases, setIsRestoringPurchases] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const init = async () => {
      const available = await isBiometricAvailable();
      if (available) {
        const type = await getBiometricType();
        setBiometricType(type);
      }
      // Restore biometric preference
      try {
        const stored = await SecureStore.getItemAsync(BIOMETRIC_KEY);
        if (stored === 'true') {
          setBiometricEnabled(true);
        }
      } catch {
        // Ignore
      }
    };
    init();
  }, []);

  const handleBiometricToggle = async (value: boolean) => {
    hapticSelection();
    setBiometricEnabled(value);
    try {
      await SecureStore.setItemAsync(BIOMETRIC_KEY, value ? 'true' : 'false');
    } catch {
      // Ignore
    }
  };

  const handleSignOut = async () => {
    hapticSelection();
    setIsSigningOut(true);
    try {
      await logout();
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleRestorePurchases = async () => {
    hapticSelection();
    setIsRestoringPurchases(true);
    try {
      const success = await handleRestore();
      if (success) {
        hapticSuccess();
        Alert.alert('Success', 'Purchases restored successfully.');
      } else {
        Alert.alert('Not Found', 'No previous purchases found.');
      }
    } catch {
      hapticError();
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsRestoringPurchases(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount(deletePassword);
      setShowDeleteModal(false);
      hapticSuccess();
    } catch (err: any) {
      hapticError();
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to delete account'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    hapticWarning();
    Alert.alert(
      'Delete Account',
      'This action is permanent. All your data will be erased and cannot be recovered. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setShowDeleteModal(true),
        },
      ]
    );
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-5 pt-6 pb-4">
          <Text className="text-2xl font-bold text-white">Settings</Text>
        </View>

        {/* Guest CTA */}
        {isGuest && (
          <Pressable
            className="mx-5 mb-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 p-5"
            onPress={() => {
              hapticSelection();
              router.push('/(auth)/register');
            }}
          >
            <Text className="text-lg font-semibold text-indigo-400 mb-1">
              Create Your Account
            </Text>
            <Text className="text-sm text-gray-400">
              Save your vibes, unlock full history, and get premium features
            </Text>
          </Pressable>
        )}

        {/* Account Section */}
        {isAuthenticated && (
          <>
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-2 mt-2">
              Account
            </Text>
            <View className="mx-5 rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
              <View className="px-5 py-4">
                <Text className="text-xs text-gray-500">Email</Text>
                <Text className="text-base font-medium text-white mt-0.5">
                  {user?.email}
                </Text>
              </View>
              <View className="h-px bg-gray-800" />
              <Pressable
                className="px-5 py-4 flex-row items-center justify-between"
                onPress={handleSignOut}
                disabled={isSigningOut}
              >
                <Text className="text-base font-medium text-white">
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Security Section */}
        {isAuthenticated && biometricType && (
          <>
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-2 mt-4">
              Security
            </Text>
            <View className="mx-5 rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
              <View className="flex-row items-center justify-between px-5 py-4">
                <View>
                  <Text className="text-base font-medium text-white">
                    {biometricType}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-0.5">
                    Use {biometricType} to unlock the app
                  </Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ true: '#2563eb', false: '#374151' }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>
          </>
        )}

        {/* Subscription Section */}
        {isAuthenticated && (
          <>
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-2 mt-4">
              Subscription
            </Text>
            <View className="mx-5 rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
              <Pressable
                className="px-5 py-4 flex-row items-center justify-between"
                onPress={() => {
                  hapticSelection();
                  if (!isSubscribed) router.push('/(protected)/paywall');
                }}
              >
                <View>
                  <Text className="text-base font-medium text-white">
                    {isSubscribed ? 'Premium' : 'Free Plan'}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-0.5">
                    {isSubscribed ? 'All features unlocked' : 'Upgrade for full access'}
                  </Text>
                </View>
                {!isSubscribed && (
                  <View className="bg-primary-600 rounded-lg px-3 py-1.5">
                    <Text className="text-sm font-semibold text-white">Upgrade</Text>
                  </View>
                )}
              </Pressable>
              <View className="h-px bg-gray-800" />
              <Pressable
                className="px-5 py-4"
                onPress={handleRestorePurchases}
                disabled={isRestoringPurchases}
              >
                <Text className="text-base font-medium text-primary-500">
                  {isRestoringPurchases ? 'Restoring...' : 'Restore Purchases'}
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Purchases (Guest) */}
        {isGuest && (
          <>
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-2 mt-4">
              Purchases
            </Text>
            <View className="mx-5 rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
              <Pressable
                className="px-5 py-4"
                onPress={handleRestorePurchases}
                disabled={isRestoringPurchases}
              >
                <Text className="text-base font-medium text-primary-500">
                  {isRestoringPurchases ? 'Restoring...' : 'Restore Purchases'}
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Legal Section */}
        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-2 mt-4">
          Legal
        </Text>
        <View className="mx-5 rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
          <Pressable
            className="px-5 py-4 flex-row items-center justify-between"
            onPress={() => {
              hapticSelection();
              Linking.openURL(PRIVACY_POLICY_URL);
            }}
          >
            <Text className="text-base font-medium text-white">Privacy Policy</Text>
            <Text className="text-gray-500 text-lg">{'\u203A'}</Text>
          </Pressable>
          <View className="h-px bg-gray-800" />
          <Pressable
            className="px-5 py-4 flex-row items-center justify-between"
            onPress={() => {
              hapticSelection();
              Linking.openURL(TERMS_URL);
            }}
          >
            <Text className="text-base font-medium text-white">Terms of Service</Text>
            <Text className="text-gray-500 text-lg">{'\u203A'}</Text>
          </Pressable>
        </View>

        {/* Danger Zone */}
        {isAuthenticated && (
          <>
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-2 mt-4">
              Danger Zone
            </Text>
            <View className="mx-5 rounded-2xl bg-red-950/30 border border-red-900/30 overflow-hidden">
              <Pressable className="px-5 py-4" onPress={confirmDelete}>
                <Text className="text-base font-medium text-red-400">
                  Delete Account
                </Text>
                <Text className="text-sm text-red-500/60 mt-0.5">
                  Permanently remove all your data
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Guest Sign Out */}
        {isGuest && (
          <Pressable
            className="mt-6 items-center py-3"
            onPress={() => {
              hapticSelection();
              logout();
            }}
          >
            <Text className="text-base font-medium text-gray-500">Exit Guest Mode</Text>
          </Pressable>
        )}

        {/* App Version */}
        <Text className="text-xs text-gray-600 text-center py-6">
          VibeCheck v{appVersion}
        </Text>
      </ScrollView>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
      >
        <Text className="mb-4 text-sm text-gray-400">
          Enter your password to confirm account deletion. This cannot be undone.
        </Text>
        <View className="mb-4">
          <Input
            placeholder="Your password"
            value={deletePassword}
            onChangeText={setDeletePassword}
            secureTextEntry
          />
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setShowDeleteModal(false)}
            />
          </View>
          <View className="flex-1">
            <Button
              title="Delete"
              variant="destructive"
              onPress={handleDeleteAccount}
              isLoading={isDeleting}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
