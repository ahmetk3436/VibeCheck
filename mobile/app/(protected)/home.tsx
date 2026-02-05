import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../lib/api';
import { hapticSuccess, hapticSelection } from '../../lib/haptics';
import { VibeCheck, VibeStats, AESTHETICS } from '../../types/vibe';
import Button from '../../components/ui/Button';

export default function HomeScreen() {
  const [todayVibe, setTodayVibe] = useState<VibeCheck | null>(null);
  const [stats, setStats] = useState<VibeStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [moodText, setMoodText] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [vibeRes, statsRes] = await Promise.all([
        api.get('/vibes/today').catch(() => null),
        api.get('/vibes/stats'),
      ]);
      if (vibeRes?.data) setTodayVibe(vibeRes.data);
      if (statsRes?.data) setStats(statsRes.data);
    } catch (error) {
      console.log('Error loading data:', error);
    }
  };

  const handleVibeCheck = async () => {
    if (!moodText.trim()) return;
    setIsLoading(true);
    try {
      const res = await api.post('/vibes', { mood_text: moodText });
      setTodayVibe(res.data);
      setShowInput(false);
      setMoodText('');
      hapticSuccess();
      loadData();
    } catch (error: any) {
      console.log('Vibe check error:', error.response?.data?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!todayVibe) return;
    try {
      await Share.share({
        message: `${todayVibe.emoji} My vibe today: ${todayVibe.aesthetic}\n\nVibe Score: ${todayVibe.vibe_score}/100\n\n"${todayVibe.mood_text}"\n\nCheck your vibe with VibeCheck`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-6 pt-8">
          <Text className="text-3xl font-bold text-gray-900">VibeCheck</Text>
          <Text className="mt-1 text-base text-gray-500">What's your vibe today?</Text>

          {/* Today's Vibe Card */}
          {todayVibe ? (
            <View className="mt-6 rounded-3xl overflow-hidden shadow-lg">
              <View
                className="p-6"
                style={{ backgroundColor: todayVibe.color_primary }}
              >
                <View className="items-center">
                  <Text className="text-6xl mb-4">{todayVibe.emoji}</Text>
                  <Text className="text-2xl font-bold text-white">{todayVibe.aesthetic}</Text>
                  <Text className="mt-2 text-lg text-white/80">Vibe Score: {todayVibe.vibe_score}</Text>
                  <Text className="mt-4 text-center text-white/90 italic">"{todayVibe.mood_text}"</Text>
                </View>
              </View>
              <View className="bg-white p-4">
                <Button title="Share Your Vibe" variant="outline" onPress={handleShare} />
              </View>
            </View>
          ) : (
            <View className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
              {!showInput ? (
                <Pressable
                  onPress={() => { setShowInput(true); hapticSelection(); }}
                  className="items-center py-8"
                >
                  <Text className="text-6xl">✨</Text>
                  <Text className="mt-4 text-xl font-semibold text-gray-900">Check Your Vibe</Text>
                  <Text className="mt-2 text-gray-500">Tap to start</Text>
                </Pressable>
              ) : (
                <View>
                  <Text className="text-lg font-semibold text-gray-900 mb-4">How are you feeling?</Text>
                  <TextInput
                    value={moodText}
                    onChangeText={setMoodText}
                    placeholder="I'm feeling creative and inspired today..."
                    className="bg-gray-100 rounded-xl px-4 py-4 text-base mb-4"
                    multiline
                    numberOfLines={3}
                    maxLength={500}
                  />
                  <Text className="text-xs text-gray-400 mb-4 text-right">{moodText.length}/500</Text>
                  <Button
                    title="Get My Vibe"
                    onPress={handleVibeCheck}
                    isLoading={isLoading}
                    size="lg"
                  />
                </View>
              )}
            </View>
          )}

          {/* Stats */}
          {stats && (
            <View className="mt-6 flex-row gap-3">
              <View className="flex-1 rounded-2xl bg-white p-4 shadow-sm">
                <Text className="text-3xl">🔥</Text>
                <Text className="mt-2 text-2xl font-bold text-gray-900">{stats.current_streak}</Text>
                <Text className="text-sm text-gray-500">Day Streak</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-4 shadow-sm">
                <Text className="text-3xl">📊</Text>
                <Text className="mt-2 text-2xl font-bold text-gray-900">{stats.total_checks}</Text>
                <Text className="text-sm text-gray-500">Total Vibes</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-4 shadow-sm">
                <Text className="text-3xl">⚡</Text>
                <Text className="mt-2 text-2xl font-bold text-gray-900">{Math.round(stats.avg_vibe_score)}</Text>
                <Text className="text-sm text-gray-500">Avg Score</Text>
              </View>
            </View>
          )}

          {/* Aesthetic Gallery */}
          <View className="mt-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Aesthetic Gallery</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3">
                {AESTHETICS.map((a) => (
                  <View
                    key={a.key}
                    className="w-24 rounded-2xl overflow-hidden"
                    style={{ backgroundColor: a.colors[2] }}
                  >
                    <View className="items-center py-4" style={{ backgroundColor: a.colors[0] + '20' }}>
                      <Text className="text-3xl">{a.emoji}</Text>
                      <Text className="mt-2 text-xs font-medium text-center px-2" style={{ color: a.colors[0] }}>
                        {a.name}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
