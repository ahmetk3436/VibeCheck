import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import api from '../../lib/api';
import { hapticSuccess, hapticError, hapticSelection, hapticLight } from '../../lib/haptics';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { VibeCheck, VibeStats } from '../../types/vibe';
import VibeCard from '../../components/ui/VibeCard';
import StreakBadge from '../../components/ui/StreakBadge';
import { CardSkeleton } from '../../components/ui/LoadingShimmer';
import ShareableResult from '../../components/ui/ShareableResult';

export default function HomeScreen() {
  const {
    isGuest,
    isAuthenticated,
    guestUsageCount,
    canUseFeature,
    incrementGuestUsage,
  } = useAuth();
  const { isSubscribed } = useSubscription();

  const [todayVibe, setTodayVibe] = useState<VibeCheck | null>(null);
  const [stats, setStats] = useState<VibeStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [moodText, setMoodText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const [deviceId, setDeviceId] = useState<string>('');

  // Streak celebration
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationText, setCelebrationText] = useState('');
  const [prevStreak, setPrevStreak] = useState(0);

  // Celebration animation values
  const celebrationScale = useSharedValue(0.8);
  const celebrationOpacity = useSharedValue(0);

  const celebrationAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: celebrationScale.value }],
      opacity: celebrationOpacity.value,
    };
  });

  // Initialize persistent device ID for guests
  useEffect(() => {
    const initDeviceId = async () => {
      try {
        let id = await AsyncStorage.getItem('guest_device_id');
        if (!id) {
          id = 'guest-' + Math.random().toString(36).substring(2, 15);
          await AsyncStorage.setItem('guest_device_id', id);
        }
        setDeviceId(id);
      } catch (err) {
        console.error('Failed to initialize device ID:', err);
        setDeviceId('guest-' + Math.random().toString(36).substring(2, 15));
      }
    };
    initDeviceId();
  }, []);

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    setErrorMsg('');
    if (isGuest) {
      setIsDataLoading(false);
      return;
    }
    try {
      const [vibeRes, statsRes] = await Promise.all([
        api.get('/vibes/today').catch(() => null),
        api.get('/vibes/stats').catch(() => null),
      ]);
      if (vibeRes?.data && !vibeRes.data.error) setTodayVibe(vibeRes.data);
      if (statsRes?.data) {
        setPrevStreak(stats?.current_streak ?? 0);
        setStats(statsRes.data);
      }
    } catch (error: any) {
      setErrorMsg('Could not load your vibe data. Pull down to retry.');
      hapticError();
    } finally {
      setIsDataLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    hapticLight();
    setIsRefreshing(true);
    loadData();
  }, [isAuthenticated]);

  const handleVibeCheck = async () => {
    if (!moodText.trim()) return;

    if (isGuest && !canUseFeature()) {
      router.push('/(auth)/register');
      return;
    }

    // For guest users, wait for device ID to be ready
    if (isGuest && !deviceId) {
      hapticError();
      setErrorMsg('Please wait while we set up your session');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      let result: VibeCheck;

      if (isGuest) {
        // Call the real guest API endpoint with persistent device ID
        const res = await api.post('/vibes/guest', {
          mood_text: moodText,
          device_id: deviceId,
        });
        result = res.data;
        await incrementGuestUsage();
      } else {
        const res = await api.post('/vibes', { mood_text: moodText });
        result = res.data;
      }

      setTodayVibe(result);
      setMoodText('');
      hapticSuccess();

      // Store guest vibe results locally for history
      if (isGuest && result) {
        try {
          const guestHistory = JSON.parse(await AsyncStorage.getItem('guest_vibes') || '[]');
          const historyEntry = {
            id: result.id || Date.now().toString(),
            mood_text: moodText.trim(),
            aesthetic: result.aesthetic,
            color_primary: result.color_primary,
            color_secondary: result.color_secondary,
            color_accent: result.color_accent,
            vibe_score: result.vibe_score,
            emoji: result.emoji,
            insight: result.insight,
            check_date: result.check_date || new Date().toISOString(),
          };
          guestHistory.unshift(historyEntry);
          await AsyncStorage.setItem('guest_vibes', JSON.stringify(guestHistory.slice(0, 10)));
        } catch (storageErr) {
          console.error('Failed to save guest vibe history:', storageErr);
        }
      }

      // Reload stats and check streak
      if (isAuthenticated) {
        const statsRes = await api.get('/vibes/stats').catch(() => null);
        if (statsRes?.data) {
          const newStreak = statsRes.data.current_streak || 0;
          setStats(statsRes.data);

          if (newStreak > prevStreak && newStreak > 0) {
            let text = `\u{1F525} ${newStreak} Day Streak!`;
            if (newStreak === 3) text = '\u{1F949} Bronze Streak! 3 days!';
            else if (newStreak === 7) text = '\u{1F948} Silver Streak! 1 week!';
            else if (newStreak === 14) text = '\u{1F947} Gold Streak! 2 weeks!';
            else if (newStreak === 30) text = '\u{1F48E} Diamond Streak! 1 month!';

            setCelebrationText(text);
            setShowCelebration(true);
            celebrationScale.value = withSpring(1, { damping: 8, stiffness: 100 });
            celebrationOpacity.value = withSpring(1);
            if (newStreak === 3 || newStreak === 7 || newStreak === 14 || newStreak === 30) {
              hapticSuccess();
            } else {
              hapticLight();
            }
            setTimeout(() => {
              celebrationOpacity.value = withSpring(0);
              setTimeout(() => {
                setShowCelebration(false);
                celebrationScale.value = 0.8;
              }, 300);
            }, 2500);
          }
        }

        // Contextual paywall trigger - show after 3+ vibe checks for non-subscribers
        if (!isSubscribed && statsRes?.data && statsRes.data.total_checks >= 3) {
          setTimeout(() => {
            setShowUpgradePrompt(true);
          }, 2000);
        }
      }
    } catch (error: any) {
      hapticError();
      if (error.response?.status === 429) {
        setErrorMsg('Daily limit reached! Sign up for unlimited vibes.');
      } else {
        const msg = error.response?.data?.message || 'Something went wrong. Please try again.';
        setErrorMsg(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Full-screen loading skeleton
  if (isDataLoading && !isGuest) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
        <View className="flex-1 px-5 pt-8">
          <CardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (errorMsg && !todayVibe && !isGuest) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
        >
          <Text className="text-5xl mb-4">{'\u{1F615}'}</Text>
          <Text className="text-lg font-semibold text-white mt-3">Something went wrong</Text>
          <Text className="text-sm text-gray-400 mt-1 text-center">{errorMsg}</Text>
          <Pressable
            className="bg-primary-600 rounded-2xl px-8 py-3 mt-6"
            onPress={() => { setIsDataLoading(true); loadData(); }}
          >
            <Text className="text-white font-semibold text-base">Try Again</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const remainingFreeUses = Math.max(0, 3 - guestUsageCount);

  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
      {/* Streak celebration overlay - ENHANCED */}
      {showCelebration && (
        <Animated.View
          style={[celebrationAnimatedStyle]}
          className="absolute inset-0 z-50 items-center justify-center"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.9)', 'rgba(37,99,235,0.3)', 'rgba(0,0,0,0.9)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            className="absolute inset-0"
          />
          <View className="bg-gray-900 rounded-3xl p-8 items-center border border-amber-500/30 mx-6">
            <Text className="text-7xl">{'\u{1F525}'}</Text>
            <Text className="text-3xl font-bold text-amber-400 mt-4">
              {celebrationText}
            </Text>
            <Pressable
              onPress={() => {
                hapticSelection();
                celebrationOpacity.value = withSpring(0);
                setTimeout(() => {
                  setShowCelebration(false);
                  celebrationScale.value = 0.8;
                }, 300);
              }}
              className="mt-6 bg-amber-500 rounded-xl px-6 py-3"
            >
              <Text className="text-white font-semibold">Keep Going!</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
      >
        {/* Header */}
        <View className="px-5 pt-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-white">VibeCheck</Text>
              {stats && stats.current_streak > 0 ? (
                <StreakBadge streak={stats.current_streak} size="md" />
              ) : (
                <Text className="text-sm text-gray-500 mt-0.5">
                  What is your vibe today?
                </Text>
              )}
            </View>
            {isGuest && (
              <View className="bg-indigo-500/20 rounded-full px-3 py-1.5">
                <Text className="text-xs font-semibold text-indigo-400">
                  Guest {guestUsageCount}/3
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Guest CTA Banner */}
        {isGuest && (
          <Pressable
            className="mx-5 mt-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4"
            onPress={() => {
              hapticSelection();
              router.push('/(auth)/register');
            }}
          >
            <Text className="text-amber-400 font-medium text-sm">
              You have {remainingFreeUses} free {remainingFreeUses === 1 ? 'vibe' : 'vibes'} left
            </Text>
            <Text className="text-primary-500 font-semibold mt-2 text-sm">
              Sign Up for Unlimited
            </Text>
          </Pressable>
        )}

        {/* Today's Vibe Card */}
        {todayVibe ? (
          <View className="mx-5 mt-6">
            <VibeCard
              vibeName={todayVibe.aesthetic}
              vibeDescription={todayVibe.mood_text}
              vibeScore={todayVibe.vibe_score}
              colorPrimary={todayVibe.color_primary}
              colorSecondary={todayVibe.color_secondary}
              colorAccent={todayVibe.color_accent}
              keywords={todayVibe.insight ? todayVibe.insight.split(' ').slice(0, 3) : []}
              timestamp={todayVibe.check_date}
            />
            <View className="mt-4 items-center">
              <ShareableResult
                aesthetic={todayVibe.aesthetic}
                emoji={todayVibe.emoji}
                vibeScore={todayVibe.vibe_score}
                moodText={todayVibe.mood_text}
                colorPrimary={todayVibe.color_primary}
                colorSecondary={todayVibe.color_secondary}
                colorAccent={todayVibe.color_accent}
                streak={stats?.current_streak}
                onShare={() => {
                  console.log('Result shared successfully');
                }}
              />
            </View>
          </View>
        ) : (
          /* Input Section - ENHANCED */
          <View className="mx-5 mt-6 bg-gray-900 rounded-3xl border border-gray-700/50 overflow-hidden">
            {/* Gradient accent strip at top */}
            <LinearGradient
              colors={['#2563eb', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="h-1"
            />

            <View className="p-6">
              <Text className="text-xl font-semibold text-white mb-4">
                How are you feeling?
              </Text>
              <TextInput
                value={moodText}
                onChangeText={setMoodText}
                placeholder="Describe your mood, thoughts, or how your day is going..."
                placeholderTextColor="#6b7280"
                className="bg-gray-800 rounded-2xl p-4 text-base text-white border border-gray-700"
                multiline
                numberOfLines={4}
                maxLength={500}
                style={{ minHeight: 120, textAlignVertical: 'top' }}
                editable={!submitting}
                onFocus={() => hapticLight()}
              />
              <Text className="text-xs text-gray-500 text-right mt-1">
                {moodText.length}/500
              </Text>

              {errorMsg ? (
                <View className="bg-red-900/30 rounded-xl p-3 mt-3">
                  <Text className="text-sm text-red-400">{errorMsg}</Text>
                </View>
              ) : null}

              {/* Submit Button - ENHANCED */}
              <Pressable
                onPress={handleVibeCheck}
                disabled={submitting || !moodText.trim()}
                className="overflow-hidden rounded-2xl mt-4"
              >
                <LinearGradient
                  colors={submitting || !moodText.trim() ? ['#374151', '#374151'] : ['#2563eb', '#1d4ed8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-4 items-center"
                >
                  {submitting ? (
                    <View className="flex-row items-center gap-2">
                      <ActivityIndicator color="#fff" size="small" />
                      <Text className="text-white font-medium">Analyzing...</Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="sparkles" size={20} color="#fff" />
                      <Text className="text-white font-semibold text-lg">
                        Check My Vibe
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        )}

        {/* Stats Row - ENHANCED */}
        {stats && !isGuest && (
          <View className="mx-5 mt-6 flex-row gap-3">
            {/* Streak Card with Gradient */}
            <View
              className="flex-1 rounded-2xl overflow-hidden border border-amber-500/20"
              style={{
                shadowColor: '#f59e0b',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <LinearGradient
                colors={stats.current_streak > 0 ? ['#f59e0b15', '#f59e0b05'] : ['#1f2937', '#111827']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                className="p-4 items-center"
              >
                <Ionicons name="flame" size={24} color="#f59e0b" />
                <Text className="text-2xl font-bold text-amber-500 mt-1">
                  {stats.current_streak}
                </Text>
                <Text className="text-xs text-gray-400 mt-1">Streak</Text>
              </LinearGradient>
            </View>

            {/* Total Vibes Card */}
            <View
              className="flex-1 rounded-2xl bg-gray-900 p-4 items-center border border-gray-800"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons name="stats-chart" size={24} color="#60a5fa" />
              <Text className="text-2xl font-bold text-blue-400 mt-1">
                {stats.total_checks}
              </Text>
              <Text className="text-xs text-gray-400 mt-1">Total Vibes</Text>
            </View>

            {/* Avg Score Card */}
            <View
              className="flex-1 rounded-2xl bg-gray-900 p-4 items-center border border-gray-800"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons name="star" size={24} color="#a78bfa" />
              <Text className="text-2xl font-bold text-purple-400 mt-1">
                {Math.round(stats.avg_vibe_score)}
              </Text>
              <Text className="text-xs text-gray-400 mt-1">Avg Score</Text>
            </View>
          </View>
        )}

        {/* Upgrade Banner - ENHANCED */}
        {isAuthenticated && (
          <Pressable
            onPress={() => {
              hapticSelection();
              router.push('/(protected)/paywall');
            }}
            className="mx-5 mt-6 overflow-hidden rounded-2xl"
          >
            <LinearGradient
              colors={['#2563eb10', '#8b5cf610']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="p-4 flex-row items-center border border-blue-500/20 rounded-2xl"
            >
              <Ionicons name="diamond" size={16} color="#3b82f6" />
              <View className="flex-1 ml-3">
                <Text className="text-sm text-gray-300">
                  Unlock deeper AI insights with Premium
                </Text>
                <Text className="text-blue-400 font-semibold mt-1 text-sm">Upgrade</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#60a5fa" />
            </LinearGradient>
          </Pressable>
        )}
      </ScrollView>

      {/* Contextual Upgrade Prompt Modal */}
      <Modal
        visible={showUpgradePrompt}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUpgradePrompt(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-end"
          onPress={() => setShowUpgradePrompt(false)}
        >
          <Pressable
            className="bg-gray-900 rounded-t-3xl p-6 pb-10 border-t border-gray-700"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <View className="w-12 h-1 bg-gray-600 rounded-full self-center mb-4" />

            {/* Icon */}
            <View className="items-center mb-4">
              <LinearGradient
                colors={['#8B5CF6', '#D946EF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-16 h-16 rounded-full items-center justify-center"
              >
                <Ionicons name="sparkles" size={32} color="white" />
              </LinearGradient>
            </View>

            {/* Title */}
            <Text className="text-2xl font-bold text-white text-center mb-2">
              Loving VibeCheck?
            </Text>

            {/* Description */}
            <Text className="text-base text-gray-400 text-center mb-6">
              Unlock AI-powered deep analysis and 20+ aesthetic palettes
            </Text>

            {/* Features List */}
            <View className="mb-6 gap-3">
              <View className="flex-row items-center gap-3">
                <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                <Text className="text-gray-300">Unlimited vibe checks</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                <Text className="text-gray-300">Deep AI personality insights</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                <Text className="text-gray-300">20+ aesthetic color palettes</Text>
              </View>
            </View>

            {/* Upgrade Button */}
            <Pressable
              onPress={() => {
                hapticSelection();
                setShowUpgradePrompt(false);
                router.push('/(protected)/paywall');
              }}
              className="overflow-hidden rounded-2xl"
            >
              <LinearGradient
                colors={['#8b5cf6', '#ec4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 items-center"
              >
                <Text className="text-white font-bold text-lg">Go Premium</Text>
              </LinearGradient>
            </Pressable>

            {/* Dismiss Button */}
            <Pressable
              className="mt-3 py-3 items-center"
              onPress={() => {
                hapticSelection();
                setShowUpgradePrompt(false);
              }}
            >
              <Text className="text-gray-500 text-base">Maybe later</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
