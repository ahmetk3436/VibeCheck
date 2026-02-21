import React from 'react';
import { View, Text } from 'react-native';

// 2025-2026 Trend: Gamified Retention Loops
interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

const STREAK_THRESHOLDS = {
  silver: 3,
  gold: 7,
  platinum: 14,
  diamond: 30,
  cosmic: 50,
};

const getStreakConfig = (streak: number) => {
  if (streak >= STREAK_THRESHOLDS.cosmic) {
    return {
      emoji: '🌌',
      label: 'Cosmic',
      gradient: 'from-purple-500 via-pink-500 to-blue-500',
      textColor: 'text-white',
      bgColor: 'bg-gradient-to-r',
    };
  }
  if (streak >= STREAK_THRESHOLDS.diamond) {
    return {
      emoji: '💎',
      label: 'Diamond',
      gradient: 'from-cyan-400 via-blue-500 to-purple-500',
      textColor: 'text-white',
      bgColor: 'bg-gradient-to-r',
    };
  }
  if (streak >= STREAK_THRESHOLDS.platinum) {
    return {
      emoji: '⚪',
      label: 'Platinum',
      gradient: 'from-gray-200 via-gray-100 to-gray-300',
      textColor: 'text-gray-900',
      bgColor: 'bg-gradient-to-r',
    };
  }
  if (streak >= STREAK_THRESHOLDS.gold) {
    return {
      emoji: '🥇',
      label: 'Gold',
      gradient: 'from-yellow-400 via-amber-400 to-yellow-500',
      textColor: 'text-yellow-900',
      bgColor: 'bg-gradient-to-r',
    };
  }
  if (streak >= STREAK_THRESHOLDS.silver) {
    return {
      emoji: '🥈',
      label: 'Silver',
      gradient: 'from-gray-300 via-gray-200 to-gray-400',
      textColor: 'text-gray-700',
      bgColor: 'bg-gradient-to-r',
    };
  }
  return {
    emoji: '🔥',
    label: '',
    gradient: '',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  };
};

const sizeStyles = {
  sm: 'px-2.5 py-1',
  md: 'px-4 py-1.5',
  lg: 'px-5 py-2',
};

const textSizeStyles = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const emojiSizeStyles = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export default function StreakBadge({ streak, size = 'md' }: StreakBadgeProps) {
  if (streak <= 0) return null;

  const config = getStreakConfig(streak);

  return (
    <View
      className={`${config.bgColor} ${config.gradient} ${sizeStyles[size]} rounded-full items-center justify-center`}
      style={config.gradient ? {} : { backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
    >
      <Text className={`${emojiSizeStyles[size]} mr-1`}>{config.emoji}</Text>
      <Text
        className={`${config.textColor} ${textSizeStyles[size]} font-semibold`}
      >
        {streak} day{streak > 1 ? 's' : ''}{config.label ? ` ${config.label}` : ''}
      </Text>
    </View>
  );
}

// Progress component for next streak milestone
export function StreakProgress({
  currentStreak,
  nextMilestone = STREAK_THRESHOLDS.silver,
}: {
  currentStreak: number;
  nextMilestone?: number;
}) {
  const progress = Math.min((currentStreak / nextMilestone) * 100, 100);

  return (
    <View className="w-full">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-xs text-gray-500">
          Next milestone: {nextMilestone} days
        </Text>
        <Text className="text-xs font-semibold text-primary-500">
          {progress.toFixed(0)}%
        </Text>
      </View>
      <View className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <View
          className="h-full bg-gradient-to-r from-primary-500 to-pink-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </View>
    </View>
  );
}
