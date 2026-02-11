import React, { useRef, useEffect } from 'react';
import { View, Animated } from 'react-native';

// 2025-2026 Trend: Progressive Skeleton Loading (Generative AI Streaming Interface)
interface LoadingShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export default function LoadingShimmer({
  width = '100%',
  height = 40,
  borderRadius = 12,
  style,
}: LoadingShimmerProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: '#1f2937',
          borderRadius,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          transform: [{ translateX }],
          width: 100,
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        }}
      />
    </View>
  );
}

// Pre-built skeleton layouts for common patterns
export function CardSkeleton() {
  return (
    <View className="w-full rounded-3xl bg-gray-900 p-6 border border-gray-800">
      <LoadingShimmer width={120} height={20} borderRadius={8} />
      <View className="mt-4" />
      <LoadingShimmer width="100%" height={100} borderRadius={16} />
      <View className="mt-4 flex-row gap-2">
        <LoadingShimmer width={60} height={24} borderRadius={12} />
        <LoadingShimmer width={60} height={24} borderRadius={12} />
        <LoadingShimmer width={60} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

export function BentoGridSkeleton() {
  return (
    <View className="w-full gap-3">
      <View className="flex-row gap-3">
        <View className="flex-1">
          <LoadingShimmer width="100%" height={120} borderRadius={16} />
        </View>
        <View className="flex-1">
          <LoadingShimmer width="100%" height={120} borderRadius={16} />
        </View>
      </View>
      <LoadingShimmer width="100%" height={160} borderRadius={16} />
    </View>
  );
}

export function TextRowSkeleton({ width = '80%' }: { width?: number | string }) {
  return (
    <LoadingShimmer width={width} height={16} borderRadius={4} />
  );
}
