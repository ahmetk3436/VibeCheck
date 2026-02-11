import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Share,
  Dimensions,
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
      if (cardRef.current) {
        const uri = await captureRef(cardRef, {
          format: 'png',
          quality: 1,
          width: SCREEN_WIDTH * 0.85,
        });

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
        style={{ width: SCREEN_WIDTH * 0.85, borderRadius: 24, overflow: 'hidden' }}
      >
        {/* Pattern overlay */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.2 }}>
          <View style={{ width: '100%', height: '100%' }}>
            {/* Decorative circles */}
            <View style={{ position: 'absolute', top: -40, right: -40, width: 128, height: 128, borderRadius: 64, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <View style={{ position: 'absolute', bottom: -40, left: -40, width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          </View>
        </View>

        {/* Content */}
        <View style={{ padding: 24, position: 'relative', zIndex: 10 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>
                VibeCheck
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                {new Date().toLocaleDateString()}
              </Text>
            </View>
            {streak && streak > 0 && (
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Text style={{ fontSize: 20 }}>🔥</Text>
              </Animated.View>
            )}
          </View>

          {/* Main emoji */}
          <Text style={{ fontSize: 56, textAlign: 'center', marginVertical: 24 }}>{emoji}</Text>

          {/* Aesthetic name */}
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center', capitalize: 'true' }}>
            {aesthetic}
          </Text>

          {/* Vibe score */}
          <View style={{ alignItems: 'center', marginVertical: 16 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 24, paddingVertical: 8 }}>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white' }}>
                {vibeScore}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Vibe Score
            </Text>
          </View>

          {/* Streak badge */}
          {streak && streak > 0 && (
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>
                  🔥 {streak} day streak
                </Text>
              </View>
            </View>
          )}

          {/* Footer */}
          <View style={{ marginTop: 24, paddingTop: 16, borderTopColor: 'rgba(255,255,255,0.2)', borderTopWidth: 1 }}>
            <Text style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              vibecheck.app • Share your vibe
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Share button */}
      <Pressable
        onPress={handleShare}
        style={{ marginTop: 16, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}
      >
        <Text style={{ color: 'white', fontWeight: '600', marginRight: 8 }}>Share Result</Text>
        <Text style={{ color: 'white' }}>📤</Text>
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
      style={{ backgroundColor: '#111827', borderRadius: 16, borderWidth: 1, borderColor: '#1f2937', overflow: 'hidden' }}
    >
      <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 36, marginRight: 12 }}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: 'white', capitalize: 'true' }}>
            {aesthetic}
          </Text>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>
            Score: {vibeScore}/100
          </Text>
        </View>
        <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 16 }}>📤</Text>
        </View>
      </View>
    </Pressable>
  );
}
