import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../lib/api';
import { VibeCheck } from '../../types/vibe';

export default function HistoryScreen() {
  const [vibes, setVibes] = useState<VibeCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async (refresh = false) => {
    try {
      const res = await api.get('/vibes/history?limit=50');
      setVibes(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.log('Error loading history:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadHistory(true);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderItem = ({ item }: { item: VibeCheck }) => (
    <View
      className="mx-4 mb-3 rounded-2xl p-4 shadow-sm"
      style={{ backgroundColor: item.color_accent }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View
            className="h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: item.color_primary + '30' }}
          >
            <Text className="text-2xl">{item.emoji}</Text>
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-lg font-semibold" style={{ color: item.color_primary }}>
              {item.aesthetic}
            </Text>
            <Text className="text-sm text-gray-600">{formatDate(item.check_date)}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-xl font-bold" style={{ color: item.color_primary }}>
            {item.vibe_score}
          </Text>
        </View>
      </View>
      <Text className="mt-3 text-gray-700 italic">"{item.mood_text}"</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-8 pb-4">
        <Text className="text-3xl font-bold text-gray-900">Vibe History</Text>
        <Text className="mt-1 text-base text-gray-500">{total} vibes logged</Text>
      </View>
      <FlatList
        data={vibes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !isLoading ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-6xl mb-4">✨</Text>
              <Text className="text-lg font-semibold text-gray-900">No vibes yet</Text>
              <Text className="text-gray-500 mt-2">Start logging your daily vibe!</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </SafeAreaView>
  );
}
