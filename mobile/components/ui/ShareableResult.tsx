import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Share,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import { hapticSuccess, hapticSelection } from '../../lib/haptics';

// 2025-2026 Trend: Shareable cards for viral growth
interface ShareableResultProps {
  aesthetic: string;
  emoji: string;
  vibeScore: number;
  streak?: number;
  onShare?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ShareableResult({
  aesthetic,
  emoji,
  vibeScore,
  streak,
  onShare,
}: ShareableResultProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const cardRef = useRef<View>(null);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleShare = async () => {
    hapticSelection();

    try {
      // Capture the card as an image
      if (cardRef.current) {
        const uri = await captureRef(cardRef, {
          format: 'png',
          quality: 1,
          width: SCREEN_WIDTH * 0.85,
        });

        // Share the image
        await Share.share({
          message: `${emoji} My vibe today is ${aesthetic}! Score: ${vibeScore}/100\n\nCheck your vibe at vibecheck.app`,
          url: uri,
        });
        hapticSuccess();
      }
    } catch (error) {
      console.error('Share failed:', error);
    }

    onShare?.();
  };

  // Gradient colors based on vibe score
  const getGradientColors = () => {
    if (vibeScore >= 80) return ['#10b981', '#059669']; // Emerald
    if (vibeScore >= 60) return ['#8b5cf6', '#6366f1']; // Violet
    if (vibeScore >= 40) return ['#f59e0b', '#d97706']; // Amber
    return ['#ef4444', '#dc2626']; // Red
  };

  return (
    <Animated.View
      ref={cardRef}
      style={{
        transform: [{ scale: scaleAnim }],
      }}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-3xl overflow-hidden"
        style={{ width: SCREEN_WIDTH * 0.85 }}
      >
        {/* Pattern overlay */}
        <View className="absolute inset-0 opacity-20">
          <View className="w-full h-full">
            {/* Decorative circles */}
            <View className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10" />
            <View className="absolute -bottom-10 -left-10 w-24 h-24 rounded-full bg-white/10" />
          </View>
        </View>

        {/* Content */}
        <View className="p-6 relative z-10">
          {/* Header */}
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-xs font-medium text-white/70 uppercase tracking-wider">
                VibeCheck
              </Text>
              <Text className="text-xs text-white/50 mt-0.5">
                {new Date().toLocaleDateString()}
              </Text>
            </View>
            {streak && streak > 0 && (
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Text className="text-xl">🔥</Text>
              </Animated.View>
            )}
          </View>

          {/* Main emoji */}
          <Text className="text-7xl text-center my-6">{emoji}</Text>

          {/* Aesthetic name */}
          <Text className="text-2xl font-bold text-white text-center capitalize mb-2">
            {aesthetic}
          </Text>

          {/* Vibe score */}
          <View className="items-center my-4">
            <View className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-2">
              <Text className="text-3xl font-bold text-white">
                {vibeScore}
              </Text>
            </View>
            <Text className="text-xs text-white/70 mt-2 uppercase tracking-wider">
              Vibe Score
            </Text>
          </View>

          {/* Streak badge */}
          {streak && streak > 0 && (
            <View className="items-center mt-4">
              <View className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5">
                <Text className="text-sm font-semibold text-white">
                  🔥 {streak} day streak
                </Text>
              </View>
            </View>
          )}

          {/* Footer */}
          <View className="mt-6 pt-4 border-t border-white/20">
            <Text className="text-center text-xs text-white/60">
              vibecheck.app • Share your vibe
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Share button */}
      <Pressable
        onPress={handleShare}
        className="mt-4 mx-auto bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 flex-row items-center"
      >
        <Text className="text-white font-semibold mr-2">Share Result</Text>
        <Text className="text-white">📤</Text>
      </Pressable>
    </Animated.View>
  );
}

// Mini shareable card for history items
export function MiniShareCard({
  aesthetic,
  emoji,
  vibeScore,
  onPress,
}: {
  aesthetic: string;
  emoji: string;
  vibeScore: number;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        hapticSelection();
        onPress?.();
      }}
      className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden active:scale-95 transition-transform"
    >
      <View className="p-4 flex-row items-center">
        <Text className="text-4xl mr-3">{emoji}</Text>
        <View className="flex-1">
          <Text className="text-base font-semibold text-white capitalize">
            {aesthetic}
          </Text>
          <Text className="text-sm text-gray-500">
            Score: {vibeScore}/100
          </Text>
        </View>
        <View className="w-8 h-8 rounded-full bg-gray-800 items-center justify-center">
          <Text className="text-sm">📤</Text>
        </View>
      </View>
    </Pressable>
  );
}
