import React, { useRef, useCallback } from 'react';
import { View, Text, Pressable, Share, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import { hapticSuccess, hapticError, hapticSelection } from '../../lib/haptics';

interface ShareableResultProps {
  aesthetic: string;
  emoji: string;
  vibeScore: number;
  moodText: string;
  colorPrimary: string;
  colorSecondary?: string;
  colorAccent?: string;
  streak?: number;
  onShare?: () => void;
}

export default function ShareableResult({
  aesthetic,
  emoji,
  vibeScore,
  moodText,
  colorPrimary,
  colorSecondary = '#8B5CF6',
  colorAccent = '#EC4899',
  streak = 0,
  onShare,
}: ShareableResultProps) {
  const viewShotRef = useRef<View>(null);

  const truncatedMoodText = moodText.length > 100
    ? moodText.substring(0, 97) + '...'
    : moodText;

  const handleShareImage = useCallback(async () => {
    hapticSelection();

    if (!viewShotRef.current) {
      hapticError();
      Alert.alert('Error', 'Card not ready. Please try again.');
      return;
    }

    try {
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 0.9,
        result: 'tmpfile',
      });

      await Share.share({
        url: uri,
        message: `My vibe today: ${aesthetic} ✨`,
      });

      hapticSuccess();

      if (onShare) {
        onShare();
      }
    } catch (error) {
      hapticError();
      Alert.alert('Share Failed', 'Could not share the image. Please try again.');
      console.error('Share error:', error);
    }
  }, [aesthetic, onShare]);

  const handleShareText = useCallback(async () => {
    hapticSelection();

    const shareMessage = `🎨 My Vibe Today: ${aesthetic}\n\n` +
      `✨ Vibe Score: ${vibeScore}%\n` +
      `💭 "${truncatedMoodText}"\n` +
      `🔥 ${streak} day streak\n\n` +
      `Check your vibe at vibecheck.app`;

    try {
      await Share.share({ message: shareMessage });
      hapticSuccess();
    } catch (error) {
      hapticError();
      console.error('Share text error:', error);
    }
  }, [aesthetic, vibeScore, truncatedMoodText, streak]);

  return (
    <View className="flex-1 items-center justify-center p-6 bg-gray-50">
      {/* Shareable Card */}
      <View
        ref={viewShotRef}
        className="w-[320] rounded-3xl overflow-hidden shadow-2xl"
        collapsable={false}
      >
        <LinearGradient
          colors={[colorPrimary, colorSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 24, alignItems: 'center' }}
        >
          {/* Emoji */}
          <Text className="text-7xl mb-2">{emoji}</Text>

          {/* Aesthetic Name */}
          <Text className="text-2xl font-bold text-white text-center mb-4">
            {aesthetic}
          </Text>

          {/* Vibe Score Circle */}
          <View className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/40 items-center justify-center mb-4">
            <Text className="text-2xl font-bold text-white">{vibeScore}%</Text>
          </View>

          {/* Mood Text */}
          <Text className="text-base text-white/90 text-center italic mb-4 px-4">
            "{truncatedMoodText}"
          </Text>

          {/* Color Palette Dots */}
          <View className="flex-row gap-2 mb-4">
            <View
              className="w-6 h-6 rounded-full border border-white/30"
              style={{ backgroundColor: colorPrimary }}
            />
            <View
              className="w-6 h-6 rounded-full border border-white/30"
              style={{ backgroundColor: colorSecondary }}
            />
            <View
              className="w-6 h-6 rounded-full border border-white/30"
              style={{ backgroundColor: colorAccent }}
            />
          </View>

          {/* Streak */}
          {streak > 0 && (
            <View className="flex-row items-center gap-1 mb-2">
              <Ionicons name="flame" size={16} color="#FFD700" />
              <Text className="text-sm text-white/80">{streak} day streak</Text>
            </View>
          )}

          {/* Branding Footer */}
          <Text className="text-xs text-white/60 mt-2">✨ vibecheck.app</Text>
        </LinearGradient>
      </View>

      {/* Share Buttons */}
      <View className="flex-row gap-3 mt-6 w-full max-w-[320]">
        {/* Share Image Button */}
        <Pressable
          onPress={handleShareImage}
          className="flex-1 flex-row items-center justify-center gap-2 bg-gray-900 rounded-2xl py-4 px-4 active:opacity-80"
        >
          <Ionicons name="image" size={20} color="white" />
          <Text className="text-base font-semibold text-white">Share Image</Text>
        </Pressable>

        {/* Share Text Button */}
        <Pressable
          onPress={handleShareText}
          className="flex-1 flex-row items-center justify-center gap-2 bg-gray-200 rounded-2xl py-4 px-4 active:opacity-80"
        >
          <Ionicons name="text" size={20} color="#374151" />
          <Text className="text-base font-semibold text-gray-700">Share Text</Text>
        </Pressable>
      </View>
    </View>
  );
}
