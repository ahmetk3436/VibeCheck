import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Slot, usePathname, router, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { hapticSelection } from '../../lib/haptics';

const TABS = [
  { name: 'Home', route: '/(protected)/home', icon: 'pulse' as const },
  { name: 'History', route: '/(protected)/history', icon: 'time' as const },
  { name: 'Settings', route: '/(protected)/settings', icon: 'settings' as const },
];

export default function ProtectedLayout() {
  const { isAuthenticated, isLoading, isGuest } = useAuth();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-950">
        <Text className="text-indigo-400 text-lg">Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated && !isGuest) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View className="flex-1 bg-gray-950">
      <View className="flex-1">
        <Slot />
      </View>

      {/* Custom Tab Bar */}
      <View
        className="flex-row bg-gray-900 border-t border-gray-800"
        style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }}
      >
        {TABS.map((tab) => {
          const isActive = pathname === tab.route || pathname === `/${tab.route.split('/').pop()}`;
          return (
            <Pressable
              key={tab.name}
              className="flex-1 items-center pt-3 pb-2"
              onPress={() => {
                hapticSelection();
                router.push(tab.route as any);
              }}
            >
              <Ionicons
                name={isActive ? tab.icon : (`${tab.icon}-outline` as any)}
                size={24}
                color={isActive ? '#6366f1' : '#6b7280'}
              />
              <Text
                className={`text-xs mt-1 ${isActive ? 'text-indigo-400 font-semibold' : 'text-gray-500'}`}
              >
                {tab.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
