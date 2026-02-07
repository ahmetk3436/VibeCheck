import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { hapticLight, hapticSuccess } from '../lib/haptics';

const { width } = Dimensions.get('window');
const ONBOARDING_KEY = 'onboarding_completed';

const FEATURES = [
  {
    icon: '\u{1F4DD}',
    title: 'Describe your mood',
    description: 'Tell us how you feel in your own words',
  },
  {
    icon: '\u{1F3A8}',
    title: 'Get a unique aesthetic',
    description: 'AI matches your mood to a visual vibe',
  },
  {
    icon: '\u{1F525}',
    title: 'Build your vibe streak',
    description: 'Check in daily to unlock streak rewards',
  },
];

export default function OnboardingScreen() {
  const { continueAsGuest } = useAuth();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / width);
    if (page !== currentPage) {
      setCurrentPage(page);
      hapticLight();
    }
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  };

  const handleTryFree = async () => {
    hapticSuccess();
    await completeOnboarding();
    await continueAsGuest();
    router.replace('/(protected)/home');
  };

  const handleSignIn = async () => {
    hapticLight();
    await completeOnboarding();
    router.replace('/(auth)/login');
  };

  const goToPage = (page: number) => {
    scrollRef.current?.scrollTo({ x: page * width, animated: true });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Page 1: Welcome */}
        <View style={{ width }} className="flex-1 justify-center items-center px-8">
          <View className="bg-indigo-500/10 rounded-3xl p-10 items-center w-full">
            <Text className="text-7xl mb-6">{'\u2728'}</Text>
            <Text className="text-3xl font-bold text-white text-center">
              Welcome to VibeCheck
            </Text>
            <Text className="text-lg text-gray-400 mt-3 text-center">
              Turn your mood into a visual aesthetic
            </Text>
          </View>
          <Pressable
            className="mt-8 py-4 px-8"
            onPress={() => goToPage(1)}
          >
            <Text className="text-primary-600 font-semibold text-base">
              Next
            </Text>
          </Pressable>
        </View>

        {/* Page 2: How It Works */}
        <View style={{ width }} className="flex-1 justify-center px-8">
          <Text className="text-2xl font-bold text-white text-center mb-8">
            How It Works
          </Text>
          {FEATURES.map((feature, index) => (
            <View key={index} className="flex-row items-center gap-4 mb-6">
              <View className="bg-indigo-500/20 w-14 h-14 rounded-full items-center justify-center">
                <Text className="text-2xl">{feature.icon}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-white">
                  {feature.title}
                </Text>
                <Text className="text-sm text-gray-400 mt-0.5">
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
          <Pressable
            className="mt-4 py-4 px-8 self-center"
            onPress={() => goToPage(2)}
          >
            <Text className="text-primary-600 font-semibold text-base">
              Next
            </Text>
          </Pressable>
        </View>

        {/* Page 3: CTA */}
        <View style={{ width }} className="flex-1 justify-center items-center px-8">
          <Text className="text-7xl mb-6">{'\u{1F680}'}</Text>
          <Text className="text-3xl font-bold text-white text-center">
            Ready to Vibe?
          </Text>
          <Text className="text-base text-gray-400 mt-2 text-center mb-10">
            Start discovering your daily aesthetic
          </Text>
          <Pressable
            className="bg-primary-600 rounded-2xl py-4 px-8 w-full items-center mb-4"
            onPress={handleTryFree}
          >
            <Text className="text-white text-lg font-semibold">
              Try Free \u2014 3 Vibes
            </Text>
          </Pressable>
          <Pressable
            className="border border-gray-700 rounded-2xl py-4 px-8 w-full items-center"
            onPress={handleSignIn}
          >
            <Text className="text-white text-lg font-semibold">Sign In</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Dot Indicators */}
      <View className="flex-row justify-center items-center pb-8 gap-2">
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            className={`w-2 h-2 rounded-full ${
              currentPage === i ? 'bg-primary-600' : 'bg-gray-700'
            }`}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}
