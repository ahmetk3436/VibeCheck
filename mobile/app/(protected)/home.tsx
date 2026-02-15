import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Share,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../lib/api';
import { hapticSuccess, hapticError, hapticSelection, hapticLight } from '../../lib/haptics';
import { useAuth } from '../../contexts/AuthContext';
import { VibeCheck, VibeStats } from '../../types/vibe';
import VibeCard from '../../components/ui/VibeCard';

export default function HomeScreen() {
  const {
    isGuest,
    isAuthenticated,
    guestUsageCount,
    canUseFeature,
    incrementGuestUsage,
  } = useAuth();

  const [todayVibe, setTodayVibe] = useState<VibeCheck | null>(null);
  const [stats, setStats] = useState<VibeStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [moodText, setMoodText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deviceId, setDeviceId] = useState<string>('');

  // Streak celebration
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationText, setCelebrationText] = useState('');
  const [prevStreak, setPrevStreak] = useState(0);

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
            if (newStreak === 3 || newStreak === 7 || newStreak === 14 || newStreak === 30) {
              hapticSuccess();
            } else {
              hapticLight();
            }
            setTimeout(() => setShowCelebration(false), 2500);
          }
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

  const handleShare = async () => {
    if (!todayVibe) return;
    hapticSelection();
    try {
      await Share.share({
        message: `${todayVibe.emoji} My vibe today is ${todayVibe.aesthetic}! Score: ${todayVibe.vibe_score}/100\n\nCheck your vibe at vibecheck.app`,
      });
      hapticSuccess();
    } catch {
      // User cancelled share
    }
  };

  // Full-screen loading skeleton
  if (isDataLoading && !isGuest) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
        <View className="flex-1 px-5 pt-8">
          <View className="h-10 w-40 bg-gray-900 rounded-xl mb-6" />
          <View className="h-64 bg-gray-900 rounded-3xl mb-4" style={{ opacity: 0.5 }} />
          <View className="h-20 bg-gray-900 rounded-2xl mb-4" style={{ opacity: 0.3 }} />
          <View className="flex-row gap-3">
            <View className="flex-1 h-24 bg-gray-900 rounded-2xl" style={{ opacity: 0.3 }} />
            <View className="flex-1 h-24 bg-gray-900 rounded-2xl" style={{ opacity: 0.3 }} />
            <View className="flex-1 h-24 bg-gray-900 rounded-2xl" style={{ opacity: 0.3 }} />
          </View>
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
      {/* Streak celebration overlay */}
      {showCelebration && (
        <View className="absolute inset-0 z-50 items-center justify-center bg-black/80">
          <Text className="text-7xl">{'\u{1F525}'}</Text>
          <Text className="text-3xl font-bold text-amber-400 mt-4">
            {celebrationText}
          </Text>
        </View>
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
                <Text className="text-sm text-primary-500 font-medium mt-0.5">
                  {'\u{1F525}'} {stats.current_streak} day streak
                </Text>
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
            onPress={() => router.push('/(auth)/register')}
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
              aesthetic={todayVibe.aesthetic}
              emoji={todayVibe.emoji}
              vibeScore={todayVibe.vibe_score}
              moodText={todayVibe.mood_text}
              colorPrimary={todayVibe.color_primary}
              colorSecondary={todayVibe.color_secondary}
              colorAccent={todayVibe.color_accent}
              date={todayVibe.check_date}
              streak={stats?.current_streak}
              insight={todayVibe.insight}
            />
            <Pressable
              className="bg-gray-800 rounded-2xl py-4 mt-4 items-center"
              onPress={handleShare}
            >
              <Text className="text-white text-base font-semibold">
                Share Your Vibe
              </Text>
            </Pressable>
          </View>
        ) : (
          /* Input Section */
          <View className="mx-5 mt-6 bg-gray-900 rounded-3xl p-6 border border-gray-800">
            <Text className="text-xl font-semibold text-white mb-4">
              How are you feeling?
            </Text>
            <TextInput
              value={moodText}
              onChangeText={setMoodText}
              placeholder="Describe your mood, thoughts, or how your day is going..."
              placeholderTextColor="#6b7280"
              className="bg-gray-800 rounded-2xl p-4 text-base text-white"
              multiline
              numberOfLines={4}
              maxLength={500}
              style={{ minHeight: 120, textAlignVertical: 'top' }}
              editable={!submitting}
            />
            <Text className="text-xs text-gray-500 text-right mt-1">
              {moodText.length}/500
            </Text>

            {errorMsg ? (
              <View className="bg-red-900/30 rounded-xl p-3 mt-3">
                <Text className="text-sm text-red-400">{errorMsg}</Text>
              </View>
            ) : null}

            <Pressable
              className={`bg-primary-600 rounded-2xl py-4 mt-4 items-center ${submitting ? 'opacity-70' : ''}`}
              onPress={handleVibeCheck}
              disabled={submitting || !moodText.trim()}
            >
              {submitting ? (
                <View className="flex-row items-center">
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text className="text-white text-sm ml-2">Analyzing your vibe...</Text>
                </View>
              ) : (
                <Text className="text-white text-lg font-semibold">
                  Check My Vibe {'\u2728'}
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {/* Stats Row */}
        {stats && !isGuest && (
          <View className="mx-5 mt-6 flex-row gap-3">
            <View
              className={`flex-1 rounded-2xl p-4 items-center border ${
                stats.current_streak > 0
                  ? 'bg-amber-500/10 border-amber-500/20'
                  : 'bg-gray-900 border-gray-800'
              }`}
            >
              <Text className="text-2xl">{'\u{1F525}'}</Text>
              <Text className="text-2xl font-bold text-white mt-1">
                {stats.current_streak}
              </Text>
              <Text className="text-xs text-gray-400 mt-1">Streak</Text>
            </View>
            <View className="flex-1 rounded-2xl bg-gray-900 p-4 items-center border border-gray-800">
              <Text className="text-2xl">{'\u{1F4CA}'}</Text>
              <Text className="text-2xl font-bold text-white mt-1">
                {stats.total_checks}
              </Text>
              <Text className="text-xs text-gray-400 mt-1">Total Vibes</Text>
            </View>
            <View className="flex-1 rounded-2xl bg-gray-900 p-4 items-center border border-gray-800">
              <Text className="text-2xl">{'\u2B50'}</Text>
              <Text className="text-2xl font-bold text-white mt-1">
                {Math.round(stats.avg_vibe_score)}
              </Text>
              <Text className="text-xs text-gray-400 mt-1">Avg Score</Text>
            </View>
          </View>
        )}

        {/* Upgrade Banner */}
        {isAuthenticated && (
          <Pressable
            className="mx-5 mt-6 bg-primary-600/10 border border-primary-600/20 rounded-2xl p-4"
            onPress={() => router.push('/(protected)/paywall')}
          >
            <Text className="text-sm text-gray-300">
              Unlock deeper AI insights with Premium
            </Text>
            <Text className="text-primary-500 font-semibold mt-1 text-sm">Upgrade</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
