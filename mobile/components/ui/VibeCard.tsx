import React from 'react';
import { View, Text, Pressable, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

interface VibeCardProps {
  vibeName: string;
  vibeDescription: string;
  vibeScore: number;
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  keywords: string[];
  timestamp?: string;
  insight?: string;
}

export default function VibeCard({
  vibeName,
  vibeDescription,
  vibeScore,
  colorPrimary,
  colorSecondary,
  colorAccent,
  keywords = [],
  timestamp,
  insight,
}: VibeCardProps) {
  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `My vibe is "${vibeName}" with a score of ${vibeScore}/100! 🎨✨ Check out VibeMeter AI to discover your vibe.`,
        title: 'My Vibe Result',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Peak Vibes';
    if (score >= 60) return 'Good Energy';
    if (score >= 40) return 'Mellow';
    return 'Low Key';
  };

  return (
    <LinearGradient
      colors={[colorPrimary + '25', colorSecondary + '15', '#030712']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="w-full rounded-3xl overflow-hidden"
    >
      {/* Decorative Pattern Overlay */}
      <View className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <View
          className="w-full h-full rounded-bl-full"
          style={{ backgroundColor: colorPrimary }}
        />
      </View>

      {/* Content Container */}
      <View className="p-6 pt-4">
        {/* Header with Branding */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <Text
              className="text-sm font-bold uppercase"
              style={{ color: colorPrimary, letterSpacing: 4 }}
            >
              VIBECHECK
            </Text>
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colorPrimary }}
            />
          </View>
          <Text className="text-xs text-gray-500">
            {timestamp || new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Score Circle with Outer Ring */}
        <View className="items-center my-6">
          <View
            style={{
              borderWidth: 1,
              borderColor: colorPrimary + '40',
              borderRadius: 9999,
              padding: 4,
            }}
          >
            <View
              className="w-24 h-24 rounded-full items-center justify-center"
              style={{
                backgroundColor: colorPrimary + '20',
                borderWidth: 3,
                borderColor: colorPrimary,
              }}
            >
              <Text
                className="text-3xl font-bold"
                style={{ color: colorPrimary }}
              >
                {vibeScore}
              </Text>
              <Text className="text-xs text-gray-500">/100</Text>
            </View>
          </View>
          <Text
            className="text-xs font-medium mt-1"
            style={{ color: colorPrimary }}
          >
            {getScoreLabel(vibeScore)}
          </Text>
        </View>

        {/* Vibe Name and Description */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-white text-center mb-1">
            {vibeName}
          </Text>
          <Text className="text-sm text-gray-400 text-center">
            {vibeDescription}
          </Text>
        </View>

        {/* Color Palette Row */}
        <View className="flex-row justify-center gap-6 my-4">
          <View className="items-center">
            <View
              className="w-8 h-8 rounded-full"
              style={{
                borderWidth: 2,
                borderColor: '#ffffff20',
                backgroundColor: colorPrimary,
              }}
            />
            <Text className="text-xs text-gray-600 mt-1">Primary</Text>
          </View>
          <View className="items-center">
            <View
              className="w-8 h-8 rounded-full"
              style={{
                borderWidth: 2,
                borderColor: '#ffffff20',
                backgroundColor: colorSecondary,
              }}
            />
            <Text className="text-xs text-gray-600 mt-1">Secondary</Text>
          </View>
          <View className="items-center">
            <View
              className="w-8 h-8 rounded-full"
              style={{
                borderWidth: 2,
                borderColor: '#ffffff20',
                backgroundColor: colorAccent,
              }}
            />
            <Text className="text-xs text-gray-600 mt-1">Accent</Text>
          </View>
        </View>

        {/* Keywords */}
        {keywords.length > 0 && (
          <View className="flex-row items-center justify-center gap-2 mb-4 flex-wrap">
            {keywords.map((keyword, index) => (
              <View
                key={index}
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: colorPrimary + '15' }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: colorPrimary }}
                >
                  {keyword}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Insight */}
        {insight && (
          <View className="bg-gray-800/50 rounded-xl p-3 mt-4">
            <Text className="text-sm text-gray-300">
              {'✨ ' + insight}
            </Text>
          </View>
        )}

        {/* Share Button */}
        <Pressable
          className="flex-row items-center justify-center gap-2 py-3 px-6 rounded-2xl"
          style={{ backgroundColor: colorPrimary }}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={18} color="white" />
          <Text className="text-sm font-semibold text-white">Share Vibe</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}
