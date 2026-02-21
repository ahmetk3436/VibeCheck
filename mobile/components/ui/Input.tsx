import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '../../lib/cn';
import { hapticSelection } from '../../lib/haptics';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  showCharCount?: boolean;
  maxLength?: number;
  showPasswordToggle?: boolean;
}

// 2025-2026 Trend: Enhanced input with character count, password toggle, error states
export default function Input({
  label,
  error,
  showCharCount = false,
  maxLength,
  showPasswordToggle = false,
  secureTextEntry,
  className,
  onChangeText,
  value,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const charCount = value?.length || 0;

  const togglePassword = () => {
    hapticSelection();
    setShowPassword(!showPassword);
  };

  const actualSecureEntry = showPasswordToggle
    ? secureTextEntry && !showPassword
    : secureTextEntry;

  return (
    <View className="w-full">
      {label && (
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-sm font-medium text-gray-400">
            {label}
          </Text>
          {showCharCount && maxLength && (
            <Text
              className={cn(
                "text-xs",
                charCount >= maxLength * 0.9
                  ? "text-red-400 font-semibold"
                  : "text-gray-600"
              )}
            >
              {charCount}/{maxLength}
            </Text>
          )}
        </View>
      )}

      <View className="relative">
        <TextInput
          className={cn(
            'w-full rounded-xl bg-gray-900 px-4 py-3 text-base text-white border',
            isFocused
              ? 'border-primary-500'
              : error
              ? 'border-red-500'
              : 'border-gray-700',
            showPasswordToggle && 'pr-12',
            className
          )}
          placeholderTextColor="#6b7280"
          value={value}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          onChangeText={onChangeText}
          secureTextEntry={actualSecureEntry}
          maxLength={maxLength}
          {...props}
        />

        {/* Password toggle with icon */}
        {showPasswordToggle && secureTextEntry && (
          <Pressable
            onPress={togglePassword}
            className="absolute right-3 top-1/2 -mt-3 p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="#6b7280"
            />
          </Pressable>
        )}
      </View>

      {error ? (
        <View className="flex-row items-center mt-1">
          <Ionicons name="warning-outline" size={14} color="#f87171" />
          <Text className="ml-1 text-sm text-red-400">{error}</Text>
        </View>
      ) : null}
    </View>
  );
}
