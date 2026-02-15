import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import api from '../../lib/api';
import { hapticSelection, hapticError, hapticSuccess, hapticMedium, hapticLight } from '../../lib/haptics';
import { VibeCheck, VibeTrendItem } from '../../types/vibe';
import { UpgradeBanner } from '../../components/ui/ContextualPaywall';
import GestureSwipeCard from '../../components/ui/GestureSwipeCard';
import { CardSkeleton } from '../../components/ui/LoadingShimmer';

// Color scheme for VibeMeter
const COLORS = {
  primary: '#8B5CF6',
  primaryDark: '#7C3AED',
  accent: '#EC4899',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#030712',
  surface: '#111827',
  border: '#1F2937',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
};

// Filter type
type FilterType = 'week' | 'month' | 'all';

export default function HistoryScreen() {
  const router = useRouter();
  const { isGuest } = useAuth();
  const { isSubscribed } = useSubscription();

  // State
  const [history, setHistory] = useState<VibeCheck[]>([]);
  const [trend, setTrend] = useState<VibeTrendItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load history data
  const loadHistory = async (filterType: FilterType = filter) => {
    try {
      setError(null);

      if (isGuest) {
        // Load guest vibes from AsyncStorage
        const stored = await AsyncStorage.getItem('guest_vibes');
        if (stored) {
          setHistory(JSON.parse(stored));
        } else {
          setHistory([]);
        }
        return;
      }

      const limitMap: Record<FilterType, number> = {
        week: 7,
        month: 30,
        all: 50,
      };
      const limit = limitMap[filterType];
      const res = await api.get(`/vibes/history?limit=${limit}`);
      setHistory(res.data.data || []);
    } catch (err: any) {
      hapticError();
      setError(err.response?.data?.message || 'Failed to load history');
    }
  };

  // Load trend data for chart
  const loadTrend = async () => {
    if (isGuest) {
      setTrend([]);
      return;
    }
    try {
      const res = await api.get('/vibes/trend?days=7');
      setTrend(res.data || []);
    } catch {
      // Silently ignore - non-critical feature
      setTrend([]);
    }
  };

  // Initial load
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await Promise.all([loadHistory(), loadTrend()]);
      setIsLoading(false);
    };
    initialize();
  }, []);

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    hapticSelection();
    await Promise.all([loadHistory(), loadTrend()]);
    setIsRefreshing(false);
  };

  // Handle filter change
  const handleFilterChange = (newFilter: FilterType) => {
    hapticSelection();
    setFilter(newFilter);
    loadHistory(newFilter);
  };

  // Navigate to register
  const handleNavigateToRegister = () => {
    hapticSelection();
    router.push('/(auth)/register');
  };

  // Get bar color based on score
  const getBarColor = (score: number): string => {
    if (score >= 70) return COLORS.success;
    if (score >= 40) return COLORS.warning;
    return COLORS.danger;
  };

  // Get score badge style
  const getScoreBadgeStyle = (score: number): string => {
    if (score >= 70) return 'bg-green-500/20';
    if (score >= 40) return 'bg-yellow-500/20';
    return 'bg-red-500/20';
  };

  // Get score text color
  const getScoreTextColor = (score: number): string => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Render filter chip
  const renderFilterChip = (filterType: FilterType, label: string) => {
    const isActive = filter === filterType;
    return (
      <Pressable
        key={filterType}
        onPress={() => handleFilterChange(filterType)}
        className={`px-4 py-2 rounded-full ${
          isActive ? 'bg-primary-600' : 'bg-gray-800 border border-gray-700'
        }`}
        style={isActive ? { backgroundColor: COLORS.primary } : undefined}
      >
        <Text
          className={`text-sm ${
            isActive ? 'font-semibold text-white' : 'font-medium text-gray-400'
          }`}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  // Render trend chart
  const renderTrendChart = () => {
    if (trend.length === 0) return null;

    return (
      <View className="mx-5 mb-4 bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-sm font-semibold text-white">
            7-Day Vibe Trend
          </Text>
          <Text className="text-xs text-gray-500">Your emotional journey</Text>
        </View>

        <View
          className="flex-row items-end justify-between"
          style={{ height: 80 }}
        >
          {trend.map((item, index) => {
            const barHeight = Math.max(4, (item.vibe_score / 100) * 70);
            const barColor = getBarColor(item.vibe_score);
            const dayLabel = new Date(item.date).toLocaleDateString('en-US', {
              weekday: 'narrow',
            });

            return (
              <View key={index} className="items-center flex-1">
                <Text className="text-lg mb-1">{item.emoji}</Text>
                <View
                  className="w-6 rounded-t-lg"
                  style={{
                    height: barHeight,
                    backgroundColor: barColor,
                  }}
                />
                <Text className="text-xs text-gray-500 mt-1">{dayLabel}</Text>
              </View>
            );
          })}
        </View>

        {/* Average score display */}
        {trend.length > 0 && (
          <View className="flex-row justify-center mt-3 pt-3 border-t border-gray-800">
            <Text className="text-xs text-gray-500">Average: </Text>
            <Text className="text-xs font-semibold text-white">
              {Math.round(
                trend.reduce((sum, item) => sum + item.vibe_score, 0) /
                  trend.length
              )}
            </Text>
            <Text className="text-xs text-gray-500"> / 100</Text>
          </View>
        )}
      </View>
    );
  };

  // Handle share for a history item
  const handleShare = useCallback(async (item: VibeCheck) => {
    hapticSelection();

    const shareMessage =
      `🎨 My Vibe: ${item.emoji} ${item.aesthetic}\n` +
      `✨ Vibe Score: ${item.vibe_score}/100\n` +
      `💭 "${item.mood_text}"\n\n` +
      `Check your vibe at vibecheck.app`;

    try {
      await Share.share({
        message: shareMessage,
        title: 'My Vibe Result',
      });
      hapticSuccess();
    } catch (error) {
      hapticError();
      console.error('Share failed:', error);
    }
  }, []);

  // Handle delete for a history item
  const handleDelete = useCallback(async (item: VibeCheck) => {
    hapticSelection();

    if (isGuest) {
      // Remove from local storage
      try {
        const stored = await AsyncStorage.getItem('guest_vibes');
        if (stored) {
          const vibes = JSON.parse(stored).filter((v: VibeCheck) => v.id !== item.id);
          await AsyncStorage.setItem('guest_vibes', JSON.stringify(vibes));
          setHistory(vibes);
          hapticSuccess();
        }
      } catch (error) {
        hapticError();
        console.error('Delete failed:', error);
      }
      return;
    }

    try {
      await api.delete(`/vibes/${item.id}`);
      setHistory(prev => prev.filter(v => v.id !== item.id));
      hapticSuccess();
    } catch (error) {
      hapticError();
      Alert.alert('Error', 'Failed to delete vibe. Please try again.');
      console.error('Delete failed:', error);
    }
  }, [isGuest]);

  // Render history item wrapped in GestureSwipeCard
  const renderHistoryItem = ({ item }: { item: VibeCheck }) => (
    <View className="mx-5 mb-3">
      <GestureSwipeCard
        title={item.aesthetic}
        subtitle={formatDate(item.check_date)}
        leftAction={{
          icon: 'trash',
          color: '#EF4444',
          label: 'Delete',
          onPress: () => handleDelete(item),
        }}
        rightAction={{
          icon: 'share-social',
          color: '#8B5CF6',
          label: 'Share',
          onPress: () => handleShare(item),
        }}
        onPress={() => hapticSelection()}
      >
        <View className="flex-row items-center">
          {/* Emoji container */}
          <View className="w-12 h-12 rounded-xl bg-gray-800 items-center justify-center">
            <Text className="text-2xl">{item.emoji}</Text>
          </View>

          {/* Content */}
          <View className="flex-1 ml-3">
            <Text className="text-xs text-gray-500" numberOfLines={1}>
              {item.mood_text}
            </Text>
            {item.insight && (
              <Text className="text-sm text-gray-400 italic mt-1">
                {'✨ '}{item.insight}
              </Text>
            )}
          </View>

          {/* Score badge */}
          <View
            className={`px-3 py-1 rounded-full ${getScoreBadgeStyle(item.vibe_score)}`}
          >
            <Text
              className={`text-sm font-bold ${getScoreTextColor(item.vibe_score)}`}
            >
              {item.vibe_score}
            </Text>
          </View>
        </View>
      </GestureSwipeCard>
    </View>
  );

  // Render empty state for logged-in users
  const renderEmptyState = () => {
    if (isLoading) return null;

    return (
      <View className="items-center py-12 px-6">
        <Ionicons
          name="analytics-outline"
          size={64}
          color={COLORS.textMuted}
        />
        <Text className="text-lg font-semibold text-white mt-4 text-center">
          No Vibe History Yet
        </Text>
        <Text className="text-sm text-gray-400 mt-2 text-center">
          Start analyzing your vibes to see your emotional journey unfold here.
        </Text>
      </View>
    );
  };

  // Render guest empty state (shown when guest has no local history)
  const renderGuestEmptyState = () => (
    <View className="items-center py-12 px-6">
      <Ionicons
        name="analytics-outline"
        size={64}
        color={COLORS.textMuted}
      />
      <Text className="text-lg font-semibold text-white mt-4 text-center">
        No Vibes Yet
      </Text>
      <Text className="text-sm text-gray-400 mt-2 text-center">
        Complete your first vibe check to see your history here. Sign up to save your history across devices!
      </Text>
      <Pressable
        className="bg-primary-600 rounded-xl py-3 px-6 mt-4 items-center"
        style={{ backgroundColor: COLORS.primary }}
        onPress={handleNavigateToRegister}
      >
        <Text className="text-white font-semibold text-base">
          Create Free Account
        </Text>
      </Pressable>
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950">
        <View className="px-5 pt-4 pb-3">
          <Text className="text-2xl font-bold text-white">Vibe History</Text>
          <Text className="text-sm text-gray-400 mt-1">Track your emotional journey over time</Text>
        </View>
        <View className="flex-1 px-5 pt-4">
          <CardSkeleton />
          <View className="mt-3" />
          <CardSkeleton />
          <View className="mt-3" />
          <CardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <View className="flex-1">
        {/* Header */}
        <View className="px-5 pt-4 pb-3">
          <Text className="text-2xl font-bold text-white">Vibe History</Text>
          <Text className="text-sm text-gray-400 mt-1">
            {isGuest ? 'Your local vibe history' : 'Swipe to share or delete'}
          </Text>
        </View>

        {/* Filter Chips - only for authenticated users */}
        {!isGuest && (
          <View className="flex-row gap-2 px-5 mb-4">
            {renderFilterChip('week', '7 Days')}
            {renderFilterChip('month', '30 Days')}
            {renderFilterChip('all', 'All Time')}
          </View>
        )}

        {/* Guest sign-up banner */}
        {isGuest && history.length > 0 && (
          <Pressable
            className="mx-5 mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-4"
            onPress={handleNavigateToRegister}
          >
            <Text className="text-indigo-400 font-medium text-sm">
              Sign up to save your history across devices and unlock unlimited vibes
            </Text>
          </Pressable>
        )}

        {/* Contextual Paywall Banner - shown when history has 5+ items and user is not subscribed */}
        {!isGuest && history.length >= 5 && !isSubscribed && (
          <View className="mx-5 mb-4">
            <UpgradeBanner
              title="5+ Vibe Checks! Unlock Premium"
              description="Get unlimited history & deep insights"
              onPress={() => router.push('/(protected)/paywall')}
            />
          </View>
        )}

        {/* History List with Trend Chart Header */}
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListHeaderComponent={!isGuest ? renderTrendChart : undefined}
          ListEmptyComponent={isGuest ? renderGuestEmptyState : renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}
