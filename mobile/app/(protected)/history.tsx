import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { hapticSelection, hapticError } from '../../lib/haptics';
import { VibeCheck, VibeTrendItem } from '../../types/vibe';

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

  // Render history item
  const renderHistoryItem = ({ item }: { item: VibeCheck }) => (
    <Pressable
      className="bg-gray-900 rounded-2xl p-4 mb-3 mx-5 border border-gray-800 flex-row items-center active:opacity-80"
      onPress={() => hapticSelection()}
    >
      {/* Emoji container */}
      <View className="w-12 h-12 rounded-xl bg-gray-800 items-center justify-center">
        <Text className="text-2xl">{item.emoji}</Text>
      </View>

      {/* Content */}
      <View className="flex-1 ml-3">
        <Text className="text-base font-semibold text-white" numberOfLines={1}>
          {item.aesthetic}
        </Text>
        <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
          {item.mood_text}
        </Text>
        <Text className="text-xs text-gray-600 mt-1">
          {formatDate(item.check_date)}
        </Text>
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
    </Pressable>
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

  // Render guest empty state
  const renderGuestState = () => (
    <View className="flex-1 items-center justify-center px-5">
      <View className="bg-gray-900 rounded-2xl p-6 border border-gray-800 items-center w-full max-w-sm">
        <Ionicons
          name="lock-closed-outline"
          size={48}
          color={COLORS.primary}
        />
        <Text className="text-lg font-semibold text-white text-center mt-4">
          Sign Up to Track Your Vibe History
        </Text>
        <Text className="text-sm text-gray-400 text-center mt-2">
          Create an account to save your vibe analyses, track your emotional
          trends, and unlock personalized insights.
        </Text>
        <Pressable
          className="bg-primary-600 rounded-xl py-3 px-6 mt-4 w-full items-center"
          style={{ backgroundColor: COLORS.primary }}
          onPress={handleNavigateToRegister}
        >
          <Text className="text-white font-semibold text-base">
            Create Free Account
          </Text>
        </Pressable>
        <Pressable
          className="mt-3 py-2"
          onPress={() => {
            hapticSelection();
            router.back();
          }}
        >
          <Text className="text-gray-400 text-sm">Maybe Later</Text>
        </Pressable>
      </View>
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="text-gray-400 mt-3">
            Loading your vibe history...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Guest state - show sign up prompt
  if (isGuest) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950">
        {renderGuestState()}
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
            Track your emotional journey over time
          </Text>
        </View>

        {/* Filter Chips */}
        <View className="flex-row gap-2 px-5 mb-4">
          {renderFilterChip('week', '7 Days')}
          {renderFilterChip('month', '30 Days')}
          {renderFilterChip('all', 'All Time')}
        </View>

        {/* History List with Trend Chart Header */}
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListHeaderComponent={renderTrendChart}
          ListEmptyComponent={renderEmptyState}
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
