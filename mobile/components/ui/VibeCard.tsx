import React from 'react';
import { View, Text, Pressable, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface VibeCardProps {
  vibeScore: number;
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  analysisText: string;
  timestamp?: string;
}

export const VibeCard: React.FC<VibeCardProps> = ({
  vibeScore,
  colorPrimary,
  colorSecondary,
  colorAccent,
  analysisText,
  timestamp = 'Just now',
}) => {
  const getVibeLabel = (score: number): string => {
    if (score >= 80) return 'Peak Vibes';
    if (score >= 60) return 'Good Energy';
    if (score >= 40) return 'Mellow';
    return 'Low Key';
  };

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const shareMessage = `🎨 My Vibe Score: ${vibeScore}/100\n\n` +
      `✨ ${getVibeLabel(vibeScore)}!\n\n` +
      `🌈 Colors: ${colorPrimary}, ${colorSecondary}, ${colorAccent}\n\n` +
      `Check your vibe at VibeCheck!`;

    await Share.share({
      message: shareMessage,
    });
  };

  return (
    <LinearGradient
      colors={[colorPrimary + '25', colorSecondary + '15', '#030712']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="w-full rounded-3xl overflow-hidden"
    >
      {/* Decorative pattern overlay */}
      <View className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <View
          className="w-full h-full rounded-bl-full"
          style={{ backgroundColor: colorPrimary }}
        />
      </View>

      {/* Main content container */}
      <View className="p-6 pt-4">
        {/* Header row with branding */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-semibold text-white">VibeCheck</Text>
            <Text
              className="text-xs text-gray-400"
              style={{ letterSpacing: 4 }}
            >
              PREMIUM
            </Text>
          </View>
          <Text className="text-xs text-gray-500">{timestamp}</Text>
        </View>

        {/* Score section with outer ring */}
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
                borderWidth: 3,
                borderColor: colorPrimary,
                backgroundColor: colorPrimary + '20',
              }}
            >
              <Text
                className="text-4xl font-bold"
                style={{ color: colorPrimary }}
              >
                {vibeScore}
              </Text>
            </View>
          </View>
          <Text
            className="text-xs font-medium mt-1"
            style={{ color: colorPrimary }}
          >
            {getVibeLabel(vibeScore)}
          </Text>
        </View>

        {/* Analysis section */}
        <View className="mb-4">
          <Text className="text-sm text-gray-400 mb-2">Color Analysis</Text>
          <Text className="text-base text-white leading-6">{analysisText}</Text>
        </View>

        {/* Color palette section */}
        <View className="mb-4">
          <Text className="text-sm text-gray-400 mb-3">Extracted Palette</Text>
          <View className="flex-row justify-around">
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
        </View>

        {/* Share button */}
        <Pressable
          className="flex-row items-center justify-center gap-2 py-3 px-4 rounded-xl"
          style={{ backgroundColor: colorPrimary + '20' }}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={16} color={colorPrimary} />
          <Text
            className="text-sm font-medium"
            style={{ color: colorPrimary }}
          >
            Share Vibe
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
};

export default VibeCard;
