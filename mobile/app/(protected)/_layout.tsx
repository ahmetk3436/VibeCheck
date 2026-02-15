import React, { useRef } from 'react';
import { View, Text, Pressable, Platform, Animated } from 'react-native';
import { Slot, usePathname, router, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { hapticSelection } from '../../lib/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

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

  // Animation refs for each tab
  const homeScaleAnim = useRef(new Animated.Value(1)).current;
  const historyScaleAnim = useRef(new Animated.Value(1)).current;
  const settingsScaleAnim = useRef(new Animated.Value(1)).current;
  const scaleAnims = [homeScaleAnim, historyScaleAnim, settingsScaleAnim];

  const handlePressIn = (scaleAnim: Animated.Value) => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  };

  const handlePressOut = (scaleAnim: Animated.Value) => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  };

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

      {/* Custom Tab Bar Container */}
      <View>
        {/* Gradient Top Border - Blue to Purple to Blue */}
        <LinearGradient
          colors={['#2563eb', '#8b5cf6', '#2563eb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 2 }}
        />

        {/* Tab Bar with Blur Effect */}
        <BlurView intensity={40} tint="dark" className="bg-gray-950/95">
          <View
            className="flex-row items-center justify-around px-4"
            style={{
              paddingBottom: Platform.OS === 'ios' && insets.bottom > 0 ? insets.bottom : 8,
              paddingTop: 8,
            }}
          >
            {TABS.map((tab, index) => {
              const isActive =
                pathname === tab.route ||
                pathname === `/${tab.route.split('/').pop()}` ||
                pathname.includes(tab.route.split('/').pop() || '');

              const scaleAnim = scaleAnims[index];

              return (
                <Pressable
                  key={tab.label}
                  onPressIn={() => handlePressIn(scaleAnim)}
                  onPressOut={() => handlePressOut(scaleAnim)}
                  onPress={() => {
                    hapticSelection();
                    router.push(tab.route as any);
                  }}
                  className={`flex-1 items-center py-2 rounded-xl ${isActive ? 'bg-primary-600/10' : ''}`}
                >
                  <Animated.View
                    style={{ transform: [{ scale: scaleAnim }] }}
                    className="items-center"
                  >
                    <Ionicons
                      name={isActive ? tab.icon : tab.iconOutline}
                      size={22}
                      color={isActive ? '#3b82f6' : '#6b7280'}
                    />
                    <Text
                      className={`text-xs mt-1 ${
                        isActive ? 'text-primary-400 font-semibold' : 'text-gray-500'
                      }`}
                    >
                      {tab.label}
                    </Text>
                    {/* Active Tab Pill Indicator */}
                    {isActive && (
                      <View className="w-4 h-1 rounded-full bg-primary-500 mt-1" />
                    )}
                  </Animated.View>
                </Pressable>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}
