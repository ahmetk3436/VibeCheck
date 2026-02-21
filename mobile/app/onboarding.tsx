import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Dimensions,
  Animated,
  StatusBar,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const { continueAsGuest } = useAuth();

  const opacity = useRef(new Animated.Value(1)).current;
  const dotScale1 = useRef(new Animated.Value(1)).current;
  const dotScale2 = useRef(new Animated.Value(0.8)).current;
  const dotScale3 = useRef(new Animated.Value(0.8)).current;

  const animateDots = (pageIndex: number) => {
    const scales = [dotScale1, dotScale2, dotScale3];
    scales.forEach((scale, index) => {
      Animated.spring(scale, {
        toValue: index === pageIndex ? 1 : 0.8,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentPage < 2) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        flatListRef.current?.scrollToIndex({ index: nextPage, animated: false });

        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();

        animateDots(nextPage);
      });
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentPage > 0) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        const prevPage = currentPage - 1;
        setCurrentPage(prevPage);
        flatListRef.current?.scrollToIndex({ index: prevPage, animated: false });

        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();

        animateDots(prevPage);
      });
    }
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem('onboarding_complete', 'true');
    await continueAsGuest();
    router.replace('/(protected)/home');
  };

  const handleTryFree = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem('onboarding_complete', 'true');
    await continueAsGuest();
    router.replace('/(protected)/home');
  };

  const handleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem('onboarding_complete', 'true');
    router.replace('/(auth)/login');
  };

  const pages = [
    { key: 'welcome' },
    { key: 'howItWorks' },
    { key: 'cta' },
  ];

  const renderPage = ({ item }: { item: { key: string } }) => {
    if (item.key === 'welcome') {
      return (
        <View style={{ width }} className="px-4 items-center justify-center flex-1">
          <LinearGradient
            colors={['#1e3a8a', '#312e81', '#030712']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-3xl p-10 items-center w-full"
            style={{ minHeight: 350 }}
          >
            <Text className="text-8xl">{'\u2728'}</Text>
            <Text className="text-4xl font-bold text-white mt-6 text-center">
              VibeMeter AI
            </Text>
            <Text className="text-base text-primary-300 mt-2 text-center">
              Discover your daily aesthetic vibe
            </Text>
          </LinearGradient>
        </View>
      );
    }

    if (item.key === 'howItWorks') {
      return (
        <View style={{ width }} className="px-4 flex-1 justify-center">
          <Text className="text-3xl font-bold text-white text-center mb-8">
            How It Works
          </Text>

          {/* Step 1 */}
          <View className="flex-row items-center mb-6">
            <LinearGradient
              colors={['#2563eb20', '#8b5cf620']}
              className="w-14 h-14 rounded-full items-center justify-center"
            >
              <Text className="text-2xl">{'\uD83D\uDCF8'}</Text>
            </LinearGradient>
            <View className="flex-1 ml-4">
              <View className="flex-row items-center">
                <View className="bg-primary-500 rounded-full px-2 py-0.5 mr-2">
                  <Text className="text-xs text-white font-bold">1</Text>
                </View>
                <Text className="text-lg font-semibold text-white">
                  Snap the Moment
                </Text>
              </View>
              <Text className="text-sm text-gray-400 mt-1">
                Take a photo of anything that catches your eye
              </Text>
            </View>
          </View>

          {/* Step 2 */}
          <View className="flex-row items-center mb-6">
            <LinearGradient
              colors={['#2563eb20', '#8b5cf620']}
              className="w-14 h-14 rounded-full items-center justify-center"
            >
              <Text className="text-2xl">{'\uD83C\uDFA8'}</Text>
            </LinearGradient>
            <View className="flex-1 ml-4">
              <View className="flex-row items-center">
                <View className="bg-primary-500 rounded-full px-2 py-0.5 mr-2">
                  <Text className="text-xs text-white font-bold">2</Text>
                </View>
                <Text className="text-lg font-semibold text-white">
                  Get Your Vibe
                </Text>
              </View>
              <Text className="text-sm text-gray-400 mt-1">
                AI analyzes colors, mood, and aesthetic
              </Text>
            </View>
          </View>

          {/* Step 3 */}
          <View className="flex-row items-center mb-6">
            <LinearGradient
              colors={['#2563eb20', '#8b5cf620']}
              className="w-14 h-14 rounded-full items-center justify-center"
            >
              <Text className="text-2xl">{'\uD83D\uDD17'}</Text>
            </LinearGradient>
            <View className="flex-1 ml-4">
              <View className="flex-row items-center">
                <View className="bg-primary-500 rounded-full px-2 py-0.5 mr-2">
                  <Text className="text-xs text-white font-bold">3</Text>
                </View>
                <Text className="text-lg font-semibold text-white">
                  Share & Save
                </Text>
              </View>
              <Text className="text-sm text-gray-400 mt-1">
                Save your vibe card or share with friends
              </Text>
            </View>
          </View>
        </View>
      );
    }

    if (item.key === 'cta') {
      return (
        <View style={{ width }} className="px-4 flex-1 justify-center items-center">
          <LinearGradient
            colors={['#2563eb', '#1d4ed8']}
            className="rounded-3xl p-8 items-center w-full mb-8"
          >
            <Text className="text-6xl mb-4">{'\uD83D\uDE80'}</Text>
            <Text className="text-2xl font-bold text-white text-center">
              Ready to Start?
            </Text>
            <Text className="text-base text-blue-100 text-center mt-2">
              Get 3 free vibe analyses instantly
            </Text>
          </LinearGradient>

          <Pressable
            onPress={handleTryFree}
            className="w-full mb-4"
          >
            <LinearGradient
              colors={['#2563eb', '#1d4ed8']}
              className="rounded-2xl py-4 px-8 w-full items-center"
            >
              <Text className="text-lg font-semibold text-white">
                Try Free
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={handleSignIn}
            className="w-full"
          >
            <View className="border-2 border-primary-500/50 rounded-2xl py-4 px-8 w-full items-center">
              <Text className="text-lg font-semibold text-white">
                Sign In
              </Text>
            </View>
          </Pressable>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <StatusBar barStyle="light-content" />

      {/* Skip Button */}
      {currentPage < 2 && (
        <Pressable
          onPress={handleSkip}
          className="absolute top-6 right-6 z-10"
        >
          <Text className="text-primary-400 text-base font-medium">
            Skip
          </Text>
        </Pressable>
      )}

      {/* Main Content */}
      <Animated.View style={{ flex: 1, opacity }}>
        <FlatList
          ref={flatListRef}
          data={pages}
          renderItem={renderPage}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={0}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />
      </Animated.View>

      {/* Navigation Footer */}
      <View className="flex-row items-center justify-between px-6 py-6">
        {/* Back Button */}
        <View style={{ width: 48 }}>
          {currentPage > 0 && (
            <Pressable
              onPress={handleBack}
              className="w-12 h-12 rounded-full bg-gray-800 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
          )}
        </View>

        {/* Dot Indicators */}
        <View className="flex-row items-center gap-2">
          <Animated.View
            style={{ transform: [{ scale: dotScale1 }] }}
            className={currentPage === 0 ? "w-6 h-2 rounded-full bg-primary-500" : "w-2 h-2 rounded-full bg-gray-700"}
          />
          <Animated.View
            style={{ transform: [{ scale: dotScale2 }] }}
            className={currentPage === 1 ? "w-6 h-2 rounded-full bg-primary-500" : "w-2 h-2 rounded-full bg-gray-700"}
          />
          <Animated.View
            style={{ transform: [{ scale: dotScale3 }] }}
            className={currentPage === 2 ? "w-6 h-2 rounded-full bg-primary-500" : "w-2 h-2 rounded-full bg-gray-700"}
          />
        </View>

        {/* Next Button */}
        <View style={{ width: 48 }}>
          {currentPage < 2 && (
            <Pressable
              onPress={handleNext}
              className="w-12 h-12 rounded-full bg-primary-500 items-center justify-center"
            >
              <Ionicons name="arrow-forward" size={24} color="white" />
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
