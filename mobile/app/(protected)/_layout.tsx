import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Slot, usePathname, router, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { hapticSelection } from '../../lib/haptics';

const TABS = [
  {
    route: '/(protected)/home',
    icon: 'sparkles' as const,
    iconOutline: 'sparkles-outline' as const,
    label: 'Vibe',
  },
  {
    route: '/(protected)/history',
    icon: 'time' as const,
    iconOutline: 'time-outline' as const,
    label: 'History',
  },
  {
    route: '/(protected)/settings',
    icon: 'settings-sharp' as const,
    iconOutline: 'settings-outline' as const,
    label: 'Settings',
  },
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
        style={{
          paddingBottom: Platform.OS === 'ios' && insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          paddingHorizontal: 16,
        }}
      >
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.route ||
            pathname === `/${tab.route.split('/').pop()}` ||
            pathname.includes(tab.route.split('/').pop() || '');

          return (
            <Pressable
              key={tab.label}
              className="flex-1 items-center py-1"
              onPress={() => {
                hapticSelection();
                router.push(tab.route as any);
              }}
            >
              <Ionicons
                name={isActive ? tab.icon : tab.iconOutline}
                size={22}
                color={isActive ? '#2563eb' : '#9ca3af'}
              />
              <Text
                className={`text-xs mt-0.5 ${
                  isActive ? 'text-primary-600 font-semibold' : 'text-gray-400'
                }`}
              >
                {tab.label}
              </Text>
              {isActive && (
                <View className="w-1 h-1 rounded-full bg-primary-600 mt-1" />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
