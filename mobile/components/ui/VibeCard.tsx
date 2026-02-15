import React from 'react';
import { View, Text } from 'react-native';

interface VibeCardProps {
  aesthetic: string;
  emoji: string;
  vibeScore: number;
  moodText: string;
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  date: string;
  streak?: number;
  insight?: string;
}

export default function VibeCard({
  aesthetic,
  emoji,
  vibeScore,
  moodText,
  colorPrimary,
  colorSecondary,
  colorAccent,
  date,
  streak,
  insight,
}: VibeCardProps) {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View
      className="w-full rounded-3xl overflow-hidden"
      style={{ backgroundColor: colorPrimary + '15' }}
    >
      <View className="p-6">
        {/* Top bar */}
        <View className="flex-row justify-between items-center">
          <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            VibeCheck
          </Text>
          <Text className="text-xs text-gray-500">{formattedDate}</Text>
        </View>

        {/* Center: emoji + aesthetic name */}
        <Text className="text-7xl text-center mt-6">{emoji}</Text>
        <Text className="text-2xl font-bold text-white text-center mt-3 capitalize">
          {aesthetic}
        </Text>

        {/* Vibe score circle */}
        <View className="items-center mt-4">
          <View
            className="w-16 h-16 rounded-full items-center justify-center self-center"
            style={{ borderWidth: 3, borderColor: colorPrimary }}
          >
            <Text className="text-xl font-bold" style={{ color: colorPrimary }}>
              {vibeScore}
            </Text>
          </View>
          <Text className="text-xs text-gray-500 text-center mt-1">
            vibe score
          </Text>
        </View>

        {/* Mood quote */}
        <View
          className="mt-5"
          style={{ borderLeftWidth: 3, borderLeftColor: colorPrimary, paddingLeft: 16 }}
        >
          <Text className="text-base text-gray-400 italic" numberOfLines={3}>
            &ldquo;{moodText}&rdquo;
          </Text>
        </View>

        {/* Insight */}
        {insight ? (
          <View className="bg-gray-800/50 rounded-xl p-3 mt-4">
            <Text className="text-sm text-gray-300">
              {'\u2728'} {insight}
            </Text>
          </View>
        ) : null}

        {/* Color palette */}
        <View className="flex-row gap-2 mt-5 justify-center">
          <View
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: colorPrimary }}
          />
          <View
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: colorSecondary }}
          />
          <View
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: colorAccent }}
          />
        </View>

        {/* Streak badge */}
        {streak && streak > 0 ? (
          <View className="flex-row items-center self-center mt-4 bg-amber-500/10 rounded-full px-4 py-1.5">
            <Text className="text-sm font-semibold text-amber-400">
              {'\u{1F525}'} {streak} day streak
            </Text>
          </View>
        ) : null}

        {/* Footer */}
        <Text className="text-xs text-gray-600 text-center mt-4">
          vibecheck.app
        </Text>
      </View>
    </View>
  );
}
