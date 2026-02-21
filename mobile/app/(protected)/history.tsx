import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { hapticSelection, hapticSuccess, hapticError } from '../../lib/haptics';
import { VibeCheck } from '../../types/vibe';

export default function HistoryScreen() {
  // History state
  const [history, setHistory] = useState<VibeCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state for time range
  const [filter, setFilter] = useState<'week' | 'month' | 'all'>('all');

  // Trend data for 7-day chart
  const [trend, setTrend] = useState<{date: string; vibe_score: number; emoji: string}[]>([]);

  // Auth context
  const { isGuest } = useAuth();
  const router = useRouter();

  // Load history with filter
  const loadHistory = async (filterType: 'week' | 'month' | 'all' = 'all') => {
    try {
      const limit = filterType === 'week' ? 7 : filterType === 'month' ? 30 : 50;
      const res = await api.get(`/vibes/history?limit=${limit}`);
      setHistory(res.data?.history || []);
    } catch (error) {
      console.error('Failed to load history:', error);
      hapticError();
    }
  };

  // Load 7-day trend data
  const loadTrend = async () => {
    try {
      const res = await api.get('/vibes/trend?days=7');
      setTrend(res.data || []);
    } catch (error) {
      console.error('Failed to load trend:', error);
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    hapticSelection();
    await Promise.all([loadHistory(filter), loadTrend()]);
    setRefreshing(false);
    hapticSuccess();
  };

  // Handle filter change
  const handleFilterChange = (newFilter: 'week' | 'month' | 'all') => {
    hapticSelection();
    setFilter(newFilter);
    setIsLoading(true);
    loadHistory(newFilter).finally(() => setIsLoading(false));
  };

  // Handle sign up CTA for guests
  const handleSignUpCTA = () => {
    hapticSelection();
    router.push('/(auth)/register');
  };

  // Load data on mount
  useEffect(() => {
    setIsLoading(true);
    Promise.all([loadHistory(filter), loadTrend()])
      .finally(() => setIsLoading(false));
  }, []);

  // Render individual history item
  const renderHistoryItem = ({ item }: { item: VibeCheck }) => (
    <Pressable
      className="bg-gray-900 rounded-2xl p-4 mb-3 border border-gray-800 flex-row items-center"
      onPress={() => {
        hapticSelection();
        router.push(`/result?id=${item.id}`);
      }}
    >
      <View className="w-14 h-14 rounded-xl bg-primary-500/20 items-center justify-center mr-4">
        <Text className="text-2xl">{item.emoji || '✨'}</Text>
      </View>

      <View className="flex-1">
        <Text className="text-white font-semibold text-base mb-1" numberOfLines={1}>
          {item.aesthetic || 'Vibe Analysis'}
        </Text>
        <Text className="text-gray-400 text-sm" numberOfLines={1}>
          {item.mood_text?.substring(0, 40) || 'No input text'}
        </Text>
      </View>

      <View className="bg-primary-500 rounded-full px-3 py-1 ml-3">
        <Text className="text-white font-bold text-sm">{item.vibe_score}%</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#6B7280" />
    </Pressable>
  );

  // Render trend chart (ListHeaderComponent)
  const renderTrendChart = () => {
    if (isGuest || trend.length === 0) return null;

    return (
      <View className="mx-5 mb-4 bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm font-semibold text-white">7-Day Vibe Trend</Text>
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-primary-500 mr-2" />
            <Text className="text-xs text-gray-400">Vibe Score</Text>
          </View>
        </View>

        <View className="flex-row items-end justify-between" style={{ height: 80 }}>
          {trend.map((item, i) => {
            const barHeight = Math.max(4, (item.vibe_score / 100) * 70);

            return (
              <View key={i} className="items-center flex-1">
                <View
                  className="w-6 rounded-t-lg bg-primary-500"
                  style={{ height: barHeight }}
                />
                <Text className="text-xs text-gray-500 mt-1">
                  {new Date(item.date).toLocaleDateString('en-US', { weekday: 'narrow' })}
                </Text>
                {item.emoji && (
                  <Text className="text-xs mt-0.5">{item.emoji}</Text>
                )}
              </View>
            );
          })}
        </View>

        {trend.length > 0 && (
          <View className="mt-3 pt-3 border-t border-gray-800 flex-row justify-between">
            <Text className="text-xs text-gray-400">Weekly Average</Text>
            <Text className="text-xs font-semibold text-primary-400">
              {Math.round(trend.reduce((sum, item) => sum + item.vibe_score, 0) / trend.length)}%
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render filter chips
  const renderFilterChips = () => (
    <View className="flex-row gap-2 px-5 mb-4">
      {(['week', 'month', 'all'] as const).map((f) => (
        <Pressable
          key={f}
          className={`px-4 py-2 rounded-full ${
            filter === f ? 'bg-primary-600' : 'bg-gray-800 border border-gray-700'
          }`}
          onPress={() => handleFilterChange(f)}
        >
          <Text
            className={`text-sm font-medium ${
              filter === f ? 'text-white' : 'text-gray-400'
            }`}
          >
            {f === 'week' ? '7 Days' : f === 'month' ? '30 Days' : 'All Time'}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  // Render guest empty state
  const renderGuestEmptyState = () => (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <View className="w-20 h-20 rounded-full bg-primary-500/20 items-center justify-center mb-6">
        <Ionicons name="lock-closed" size={36} color="#8B5CF6" />
      </View>

      <Text className="text-xl font-bold text-white text-center mb-2">
        Track Your Vibe History
      </Text>

      <Text className="text-gray-400 text-center mb-6 px-4">
        Sign up to save your vibe analyses, track your emotional trends over time, and unlock personalized insights.
      </Text>

      <Pressable
        className="bg-primary-500 rounded-full px-8 py-4 flex-row items-center"
        onPress={handleSignUpCTA}
      >
        <Ionicons name="person-add" size={20} color="white" style={{ marginRight: 8 }} />
        <Text className="text-white font-semibold text-base">Create Free Account</Text>
      </Pressable>

      <Pressable
        className="mt-4"
        onPress={() => {
          hapticSelection();
          router.push('/(auth)/login');
        }}
      >
        <Text className="text-primary-400 text-sm">
          Already have an account? <Text className="font-semibold">Sign In</Text>
        </Text>
      </Pressable>
    </View>
  );

  // Render empty state for logged-in users
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <View className="w-20 h-20 rounded-full bg-gray-800 items-center justify-center mb-6">
        <Ionicons name="sparkles-outline" size={36} color="#6B7280" />
      </View>

      <Text className="text-xl font-bold text-white text-center mb-2">
        No Vibe History Yet
      </Text>

      <Text className="text-gray-400 text-center mb-6 px-4">
        Start analyzing your vibes to build your personal history and track your emotional journey.
      </Text>

      <Pressable
        className="bg-primary-500 rounded-full px-8 py-4"
        onPress={() => {
          hapticSelection();
          router.push('/(protected)/home');
        }}
      >
        <Text className="text-white font-semibold text-base">Analyze Your First Vibe</Text>
      </Pressable>
    </View>
  );

  // Guest view
  if (isGuest) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950">
        <View className="px-5 pt-2 pb-4">
          <Text className="text-2xl font-bold text-white">Vibe History</Text>
          <Text className="text-gray-400 text-sm mt-1">Track your emotional journey</Text>
        </View>
        {renderGuestEmptyState()}
      </SafeAreaView>
    );
  }

  // Logged-in user view
  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      {/* Header */}
      <View className="px-5 pt-2 pb-4">
        <Text className="text-2xl font-bold text-white">Vibe History</Text>
        <Text className="text-gray-400 text-sm mt-1">Track your emotional journey</Text>
      </View>

      {/* Filter Chips */}
      {renderFilterChips()}

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text className="text-gray-400 mt-3">Loading your vibe history...</Text>
        </View>
      ) : history.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pb-6"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderTrendChart}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#8B5CF6"
              colors={['#8B5CF6']}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
