import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hapticSelection } from '../../lib/haptics';

// 2025-2026 Trend: Contextual Paywalls (value-gated upgrades)
interface ContextualPaywallProps {
  visible: boolean;
  onClose: () => void;
  feature: string;
  benefit: string;
  unlockAction: () => void;
  dismissible?: boolean;
}

const VALUE_GATES = {
  streak: {
    icon: '🔥',
    title: 'Keep Your Streak Alive',
    description: 'Premium users never lose their streak, even if they miss a day.',
    cta: 'Protect My Streak',
  },
  insights: {
    icon: '🧠',
    title: 'Unlock AI Insights',
    description: 'Get personalized mood analysis and trend predictions powered by AI.',
    cta: 'Unlock Insights',
  },
  aesthetics: {
    icon: '🎨',
    title: 'Get 20+ Aesthetics',
    description: 'Unlock exclusive aesthetics like Dark Academia, Cottagecore, and more.',
    cta: 'Explore Aesthetics',
  },
  history: {
    icon: '📊',
    title: 'View Full History',
    description: 'Access your complete mood history with advanced analytics.',
    cta: 'View History',
  },
};

type ValueGateType = keyof typeof VALUE_GATES;

export default function ContextualPaywall({
  visible,
  onClose,
  feature,
  benefit,
  unlockAction,
  dismissible = true,
}: ContextualPaywallProps) {
  const gateType = (feature.toLowerCase().split(' ')[0] + 's') as ValueGateType;
  const gateConfig = VALUE_GATES[gateType] || VALUE_GATES.insights;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismissible ? onClose : () => {}}
    >
      <SafeAreaView className="flex-1 bg-black/80 items-center justify-center px-5">
        {/* Card */}
        <View className="w-full max-w-sm">
          {/* Gradient border effect */}
          <View className="rounded-3xl overflow-hidden">
            <LinearGradient
              colors={['#8b5cf6', '#ec4899', '#f97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-0.5"
            >
              <View className="bg-gray-900 rounded-3xl p-6">
                {/* Lock icon */}
                <View className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 items-center justify-center mb-4">
                  <Text className="text-3xl">{gateConfig.icon}</Text>
                </View>

                {/* Premium badge */}
                <View className="mx-auto mb-4">
                  <View className="bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-1.5 rounded-full">
                    <Text className="text-xs font-semibold text-white uppercase tracking-wider">
                      Premium Feature
                    </Text>
                  </View>
                </View>

                {/* Title */}
                <Text className="text-2xl font-bold text-white text-center mb-2">
                  {gateConfig.title}
                </Text>

                {/* Description */}
                <Text className="text-base text-gray-400 text-center mb-6">
                  {gateConfig.description}
                </Text>

                {/* Value proposition */}
                <View className="bg-gray-800 rounded-2xl p-4 mb-6">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
                    <Text className="text-sm text-gray-300 ml-2 flex-1">
                      {benefit}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
                    <Text className="text-sm text-gray-300 ml-2 flex-1">
                      Cancel anytime
                    </Text>
                  </View>
                </View>

                {/* CTA Buttons */}
                <Pressable
                  onPress={() => {
                    hapticSelection();
                    unlockAction();
                  }}
                  className="mb-3 overflow-hidden rounded-2xl"
                >
                  <LinearGradient
                    colors={['#8b5cf6', '#ec4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="py-4 items-center"
                  >
                    <Text className="text-lg font-bold text-white">
                      {gateConfig.cta}
                    </Text>
                  </LinearGradient>
                </Pressable>

                {/* Pricing hint */}
                <Text className="text-center text-sm text-gray-500 mb-4">
                  From $4.99/month • 7-day free trial
                </Text>

                {/* Dismiss */}
                {dismissible && (
                  <Pressable
                    onPress={() => {
                      hapticSelection();
                      onClose();
                    }}
                    className="items-center py-2"
                  >
                    <Text className="text-sm text-gray-600">Maybe later</Text>
                  </Pressable>
                )}
              </View>
            </LinearGradient>
          </View>

          {/* Trust badges */}
          <View className="flex-row items-center justify-center mt-4 gap-6">
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark" size={16} color="#6b7280" />
              <Text className="text-xs text-gray-600 ml-1">Secure</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="lock-closed" size={16} color="#6b7280" />
              <Text className="text-xs text-gray-600 ml-1">Private</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="star" size={16} color="#6b7280" />
              <Text className="text-xs text-gray-600 ml-1">4.9★</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// Inline contextual upgrade banner
export function UpgradeBanner({
  title = 'Go Premium',
  description,
  onPress,
  style,
}: {
  title?: string;
  description?: string;
  onPress: () => void;
  style?: any;
}) {
  return (
    <Pressable
      onPress={() => {
        hapticSelection();
        onPress();
      }}
      className="relative overflow-hidden rounded-2xl"
      style={style}
    >
      <LinearGradient
        colors={['#8b5cf6', '#ec4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-4"
      >
        <View className="flex-row items-center">
          <View className="flex-1">
            <Text className="text-lg font-bold text-white">{title}</Text>
            {description && (
              <Text className="text-sm text-white/80 mt-0.5">
                {description}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// Feature-locked inline component
export function FeatureLocked({
  featureName,
  onTap,
}: {
  featureName: string;
  onTap: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        hapticSelection();
        onTap();
      }}
      className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6 items-center justify-center"
    >
      <View className="w-12 h-12 rounded-full bg-gray-800 items-center justify-center mb-3">
        <Ionicons name="lock-closed" size={24} color="#6b7280" />
      </View>
      <Text className="text-base font-semibold text-white mb-1">
        {featureName}
      </Text>
      <Text className="text-sm text-primary-500 font-medium">
        Upgrade to unlock
      </Text>
    </Pressable>
  );
}
