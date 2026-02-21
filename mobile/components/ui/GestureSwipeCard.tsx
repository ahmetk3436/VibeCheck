import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticLight, hapticMedium } from '../../lib/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

// 2025-2026 Trend: Gesture-First Navigation with swipe actions
interface GestureSwipeCardProps {
  title: string;
  subtitle?: string;
  leftAction?: {
    icon: string;
    color: string;
    label: string;
    onPress: () => void;
  };
  rightAction?: {
    icon: string;
    color: string;
    label: string;
    onPress: () => void;
  };
  onPress?: () => void;
  children?: React.ReactNode;
}

export default function GestureSwipeCard({
  title,
  subtitle,
  leftAction,
  rightAction,
  onPress,
  children,
}: GestureSwipeCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwiped, setIsSwiped] = useState<'left' | 'right' | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        const maxSwipe = rightAction ? 100 : leftAction ? -100 : 0;
        translateX.setValue(Math.max(-100, Math.min(100, gestureState.dx)));
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldTriggerLeft = leftAction && gestureState.dx < -SWIPE_THRESHOLD;
        const shouldTriggerRight = rightAction && gestureState.dx > SWIPE_THRESHOLD;

        if (shouldTriggerLeft) {
          hapticMedium();
          setIsSwiped('left');
          leftAction.onPress();
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        } else if (shouldTriggerRight) {
          hapticMedium();
          setIsSwiped('right');
          rightAction.onPress();
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        } else {
          hapticLight();
          setIsSwiped(null);
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            damping: 15,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View className="relative overflow-hidden">
      {/* Left action background */}
      {leftAction && (
        <View
          className="absolute left-0 top-0 bottom-0 w-28 items-center justify-end px-4"
          style={{ backgroundColor: leftAction.color }}
        >
          <Ionicons name={leftAction.icon as any} size={24} color="white" />
          <Text className="text-white text-xs mt-1 font-semibold">
            {leftAction.label}
          </Text>
        </View>
      )}

      {/* Right action background */}
      {rightAction && (
        <View
          className="absolute right-0 top-0 bottom-0 w-28 items-center justify-end px-4"
          style={{ backgroundColor: rightAction.color }}
        >
          <Ionicons name={rightAction.icon as any} size={24} color="white" />
          <Text className="text-white text-xs mt-1 font-semibold">
            {rightAction.label}
          </Text>
        </View>
      )}

      {/* Swipeable card */}
      <Animated.View
        className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden"
        style={{
          transform: [{ translateX }],
          zIndex: 10,
        }}
        {...panResponder.panHandlers}
      >
        <Pressable
          className="p-4 flex-row items-center"
          onPress={onPress}
          disabled={!!leftAction || !!rightAction}
        >
          <View className="flex-1">
            <Text className="text-base font-semibold text-white">
              {title}
            </Text>
            {subtitle && (
              <Text className="text-sm text-gray-500 mt-0.5">{subtitle}</Text>
            )}
          </View>

          {/* Swipe hint icons */}
          {leftAction && (
            <Ionicons name="chevron-back" size={20} color="#6b7280" />
          )}
          {rightAction && (
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          )}
        </Pressable>

        {children && <View className="p-4">{children}</View>}
      </Animated.View>
    </View>
  );
}

// Quick swipe action chips
export function SwipeActionChip({
  icon,
  label,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="px-4 py-2 rounded-full items-center justify-center flex-row gap-1.5"
      style={{ backgroundColor: `${color}20` }}
    >
      <Ionicons name={icon as any} size={16} color={color} />
      <Text className="text-sm font-medium" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
}
