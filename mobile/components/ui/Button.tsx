import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  Animated,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '../../lib/cn';
import { hapticSelection } from '../../lib/haptics';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  shimmer?: boolean;
  icon?: string;
}

const variantStyles = {
  primary: 'bg-primary-600 active:bg-primary-700',
  secondary: 'bg-gray-600 active:bg-gray-700',
  outline: 'border-2 border-primary-600 bg-transparent active:bg-primary-50',
  destructive: 'bg-red-600 active:bg-red-700',
  gradient: '', // Handled separately with LinearGradient
};

const variantTextStyles = {
  primary: 'text-white',
  secondary: 'text-white',
  outline: 'text-primary-600',
  destructive: 'text-white',
  gradient: 'text-white',
};

const sizeStyles = {
  sm: 'px-3 py-2',
  md: 'px-5 py-3',
  lg: 'px-7 py-4',
};

const sizeTextStyles = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

// 2025-2026 Trend: Gradient buttons with shimmer loading effect
// AI Gradient Haze: purple→pink gradients for premium feel
const GRADIENT_COLORS = {
  primary: ['#8b5cf6', '#ec4899'], // Violet to Pink (AI Gradient Haze trend)
  secondary: ['#6366f1', '#8b5cf6'], // Indigo to Violet
  destructive: ['#ef4444', '#dc2626'], // Red gradient
};

export default function Button({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  shimmer = false,
  icon,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  const isGradient = variant === 'gradient' || variant === 'primary';

  // Shimmer animation for loading state (Generative AI Streaming Interface trend)
  React.useEffect(() => {
    if (shimmer || isLoading) {
      Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
    } else {
      animatedValue.setValue(0);
    }
  }, [shimmer, isLoading, animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const handlePress = () => {
    hapticSelection();
    if (props.onPress) {
      props.onPress();
    }
  };

  const buttonContent = (
    <>
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'outline' ? '#2563eb' : '#ffffff'}
          size={size === 'sm' ? 'small' : 'large'}
        />
      ) : (
        <Text
          className={cn(
            'font-semibold',
            variantTextStyles[variant],
            sizeTextStyles[size]
          )}
        >
          {icon ? `${icon} ` : ''}{title}
        </Text>
      )}

      {/* Shimmer overlay for progressive loading effect */}
      {(shimmer || isLoading) && !isDisabled && (
        <Animated.View
          className="absolute inset-0 overflow-hidden"
          pointerEvents="none"
        >
          <Animated.View
            style={{
              transform: [{ translateX }],
              width: 100,
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            }}
          />
        </Animated.View>
      )}
    </>
  );

  // Gradient button with 2025-2026 trend styling
  if (variant === 'gradient' || (variant === 'primary' && !isDisabled)) {
    return (
      <Pressable
        className={cn(
          'items-center justify-center rounded-xl overflow-hidden',
          sizeStyles[size],
          isDisabled && 'opacity-50'
        )}
        disabled={isDisabled}
        onPress={handlePress}
        style={style as ViewStyle}
        {...props}
      >
        <LinearGradient
          colors={GRADIENT_COLORS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
        <View className="flex-row items-center justify-center relative z-10 w-full h-full">
          {buttonContent}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      className={cn(
        'items-center justify-center rounded-xl',
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && 'opacity-50'
      )}
      disabled={isDisabled}
      onPress={handlePress}
      style={style as ViewStyle}
      {...props}
    >
      {buttonContent}
    </Pressable>
  );
}
