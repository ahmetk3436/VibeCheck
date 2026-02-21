import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { PurchasesPackage } from '../../lib/purchases';
import { hapticSuccess, hapticMedium, hapticSelection } from '../../lib/haptics';

const FEATURES = [
  {
    icon: '\u{1F9E0}',
    title: 'AI-Powered Deep Mood Analysis',
    description: 'Get richer insights beyond basic keywords',
  },
  {
    icon: '\u{1F3A8}',
    title: '20+ Aesthetic Palettes',
    description: 'Unlock exclusive and rare aesthetics',
  },
  {
    icon: '\u{1F4CA}',
    title: 'Advanced Vibe Analytics',
    description: 'Detailed mood trends and patterns',
  },
  {
    icon: '\u{1F52E}',
    title: 'Personalized Mood Insights',
    description: 'AI-generated daily recommendations',
  },
];

export default function PaywallScreen() {
  const { offerings, isLoading, handlePurchase, handleRestore } =
    useSubscription();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePackagePurchase = async (pkg: PurchasesPackage) => {
    hapticSelection();
    setPurchasing(pkg.identifier);
    try {
      const success = await handlePurchase(pkg);
      if (success) {
        hapticSuccess();
        Alert.alert('Success', 'Subscription activated!');
        router.back();
      } else {
        Alert.alert('Error', 'Purchase failed. Please try again.');
      }
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestorePurchases = async () => {
    hapticMedium();
    const success = await handleRestore();
    if (success) {
      hapticSuccess();
      Alert.alert('Success', 'Purchases restored!');
      router.back();
    } else {
      Alert.alert('Not Found', 'No previous purchases found.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-950">
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Close button */}
        <Pressable
          className="self-end px-5 pt-4"
          onPress={() => {
            hapticSelection();
            router.back();
          }}
        >
          <Text className="text-gray-400 text-base font-medium">Close</Text>
        </Pressable>

        {/* Header */}
        <View className="items-center px-6 pt-4 pb-6">
          <Text className="text-6xl">{'\u{1F451}'}</Text>
          <Text className="text-3xl font-bold text-white text-center mt-3">
            Go Premium
          </Text>
          <Text className="text-base text-gray-400 text-center mt-1">
            Unlock the full VibeCheck experience
          </Text>
        </View>

        {/* Features */}
        <View className="px-5 mb-6">
          {FEATURES.map((feature, index) => (
            <View
              key={index}
              className="bg-gray-900 rounded-2xl p-4 mb-2 flex-row items-center border border-gray-800"
            >
              <View className="w-10 h-10 rounded-xl bg-primary-600/10 items-center justify-center">
                <Text className="text-lg">{feature.icon}</Text>
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-base font-medium text-white">
                  {feature.title}
                </Text>
                <Text className="text-sm text-gray-500 mt-0.5">
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Packages */}
        {offerings?.availablePackages.map((pkg: PurchasesPackage) => (
          <Pressable
            key={pkg.identifier}
            className="mx-5 mb-3 flex-row items-center rounded-2xl border border-gray-700 bg-gray-900 p-5"
            onPress={() => handlePackagePurchase(pkg)}
            disabled={purchasing === pkg.identifier}
            style={purchasing === pkg.identifier ? { opacity: 0.7 } : undefined}
          >
            <View className="flex-1">
              <Text className="mb-1 text-lg font-semibold text-white">
                {pkg.product.title}
              </Text>
              <Text className="text-sm text-gray-400">
                {pkg.product.description}
              </Text>
              <Text className="text-2xl font-bold text-primary-500 mt-1">
                {pkg.product.priceString}
              </Text>
            </View>
            {purchasing === pkg.identifier && (
              <ActivityIndicator color="#2563eb" style={{ marginLeft: 16 }} />
            )}
          </Pressable>
        ))}

        {/* Restore */}
        <Pressable
          className="mx-5 mt-4 items-center py-3"
          onPress={handleRestorePurchases}
        >
          <Text className="text-base font-medium text-primary-500">
            Restore Purchases
          </Text>
        </Pressable>

        {/* Terms */}
        <Text className="mx-5 mt-4 text-center text-xs text-gray-600 px-4">
          Subscription automatically renews unless canceled 24 hours before the
          end of the current period. Payment will be charged to your Apple ID
          account.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
