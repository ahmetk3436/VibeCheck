import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../lib/api';
import { hapticSelection, hapticLight, hapticError } from '../../lib/haptics';
import { useAuth } from '../../contexts/AuthContext';
import { VibeCheck } from '../../types/vibe';

export default function HistoryScreen() {
  const { isGuest } = useAuth();
  const [vibes, setVibes] = useState<VibeCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadHistory = useCallback(async (isRefresh: boolean = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    }
    setErrorMsg('');
    try {
      if (isGuest) {
        // Load guest vibe history from AsyncStorage
        const stored = await AsyncStorage.getItem('guest_vibes');
        if (stored) {
          const parsedVibes = JSON.parse(stored);
          setVibes(parsedVibes);
          setTotal(parsedVibes.length);
        } else {
          setVibes([]);
          setTotal(0);
        }
      } else {
        // Load authenticated user's history from API
        const res = await api.get('/vibes/history?limit=50');
        setVibes(res.data.data || []);
        setTotal(res.data.total || 0);
      }
    } catch (error: any) {
      setErrorMsg('Failed to load history. Pull down to retry.');
      hapticError();
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isGuest]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = useCallback(() => {
    loadHistory(true);
  }, [loadHistory]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleShare = async (item: VibeCheck) => {
    hapticSelection();
    try {
      await Share.share({
        message: `${item.emoji} My vibe was ${item.aesthetic}! Score: ${item.vibe_score}/100\n\n"${item.mood_text}"\n\nCheck your vibe at vibecheck.app`,
      });
    } catch {
      // User cancelled
    }
  };

  const toggleExpand = (id: string) => {
    hapticSelection();
    setExpandedId(expandedId === id ? null : id);
  };

  const renderItem = ({ item }: { item: VibeCheck }) => {
    const isExpanded = expandedId === item.id;

    return (
      <Pressable
        className="mx-5 mb-3 bg-gray-900 rounded-2xl p-4 border border-gray-800"
        onPress={() => toggleExpand(item.id)}
      >
        <View className="flex-row items-center">
          {/* Emoji circle */}
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: item.color_primary + '20' }}
          >
            <Text className="text-2xl">{item.emoji}</Text>
          </View>

          {/* Info */}
          <View className="flex-1 ml-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-white">
                {item.aesthetic}
              </Text>
              <View
                className="rounded-full px-2.5 py-0.5"
                style={{ backgroundColor: item.color_primary + '20' }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: item.color_primary }}
                >
                  {item.vibe_score}
                </Text>
              </View>
            </View>
            <Text
              className="text-sm text-gray-400 mt-1"
              numberOfLines={isExpanded ? undefined : 2}
            >
              {item.mood_text}
            </Text>
            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-xs text-gray-500">
                {formatDate(item.check_date)}
              </Text>
              <View className="flex-row gap-1.5">
                <View
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color_primary }}
                />
                <View
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color_secondary }}
                />
                <View
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color_accent }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Expanded content */}
        {isExpanded && (
          <View className="mt-3">
            <View className="h-px bg-gray-800 my-3" />
            {item.insight && (
              <Text className="text-sm text-gray-400 italic mb-2">
                {'\u2728'} {item.insight}
              </Text>
            )}
            <Pressable
              className="flex-row items-center justify-center py-2"
              onPress={() => handleShare(item)}
            >
              <Text className="text-primary-500 font-medium text-sm">
                Share This Vibe
              </Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-gray-400 mt-3 text-sm">Loading your vibes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (errorMsg && vibes.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
        <View className="px-5 pt-6 pb-4">
          <Text className="text-2xl font-bold text-white">Vibe History</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-5xl">{'\u{1F615}'}</Text>
          <Text className="text-lg font-semibold text-white mt-4">
            Something went wrong
          </Text>
          <Text className="text-sm text-gray-400 mt-2 text-center">{errorMsg}</Text>
          <Pressable
            className="bg-primary-600 rounded-2xl px-8 py-3 mt-6"
            onPress={() => { setIsLoading(true); loadHistory(); }}
          >
            <Text className="text-white font-semibold text-base">Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
      <View className="px-5 pt-6 pb-2">
        <Text className="text-2xl font-bold text-white">Vibe History</Text>
        <Text className="text-sm text-gray-500 mt-1">
          {isGuest ? 'Your recent vibe checks' : `${total} vibes logged`}
        </Text>
      </View>

      <FlatList
        data={vibes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-6xl">{'\u{1F3AD}'}</Text>
            <Text className="text-xl font-semibold text-white mt-4">
              No Vibes Yet
            </Text>
            <Text className="text-base text-gray-400 mt-2 text-center px-8">
              {isGuest
                ? 'Start analyzing vibes to see your history here. Sign up to save more!'
                : 'Check your first vibe to start building your history'
              }
            </Text>
            <Pressable
              className="bg-primary-600 rounded-2xl px-8 py-3 mt-6"
              onPress={() => router.push('/(protected)/home')}
            >
              <Text className="text-white font-semibold text-base">
                Check My Vibe
              </Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
      />

      {isGuest && vibes.length > 0 && (
        <View className="px-5 py-4 bg-gray-900 border-t border-gray-800">
          <Pressable
            className="bg-primary-600 py-3 rounded-2xl items-center"
            onPress={() => {
              hapticSelection();
              router.push('/(auth)/register');
            }}
          >
            <Text className="text-white font-semibold">Sign Up to Save All Your Vibes</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
