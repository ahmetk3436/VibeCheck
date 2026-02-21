import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hapticSelection } from '../../lib/haptics';

// 2025-2026 Trend: Privacy Transparency UI (data dashboards)
interface DataUsageItem {
  category: string;
  description: string;
  isShared: boolean;
  canToggle: boolean;
}

const DATA_USAGE_ITEMS: DataUsageItem[] = [
  {
    category: 'Mood Analysis',
    description: 'Used to generate your vibe aesthetic and insights',
    isShared: false,
    canToggle: false,
  },
  {
    category: 'Streak Data',
    description: 'Tracks your daily check-in streak',
    isShared: false,
    canToggle: false,
  },
  {
    category: 'AI Personalization',
    description: 'Improves aesthetic recommendations',
    isShared: false,
    canToggle: true,
  },
  {
    category: 'Analytics',
    description: 'Helps improve app performance',
    isShared: false,
    canToggle: true,
  },
];

interface PrivacyDashboardProps {
  onClose?: () => void;
}

export default function PrivacyDashboard({ onClose }: PrivacyDashboardProps) {
  const [dataUsage, setDataUsage] = React.useState(DATA_USAGE_ITEMS);

  const toggleDataSharing = (index: number) => {
    hapticSelection();
    const newUsage = [...dataUsage];
    newUsage[index].isShared = !newUsage[index].isShared;
    setDataUsage(newUsage);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-5 pt-6 pb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-white">Privacy</Text>
            <Text className="text-sm text-gray-500 mt-1">
              Your data, your control
            </Text>
          </View>
          {onClose && (
            <Pressable onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#9ca3af" />
            </Pressable>
          )}
        </View>

        {/* Privacy Score Card */}
        <View className="mx-5 mb-6 rounded-3xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 p-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-gray-400">Privacy Score</Text>
              <Text className="text-3xl font-bold text-green-400 mt-1">A+</Text>
            </View>
            <View className="w-16 h-16 rounded-full bg-green-500/20 items-center justify-center">
              <Ionicons name="shield-checkmark" size={32} color="#4ade80" />
            </View>
          </View>
          <Text className="text-sm text-gray-500 mt-3">
            Your data stays on your device. We never sell your information.
          </Text>
        </View>

        {/* Data Usage Section */}
        <View className="px-5 mb-6">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Data Usage
          </Text>

          {dataUsage.map((item, index) => (
            <View
              key={index}
              className="bg-gray-900 rounded-2xl border border-gray-800 p-4 mb-2"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-base font-semibold text-white">
                      {item.category}
                    </Text>
                    {item.isShared && (
                      <View className="ml-2 px-2 py-0.5 bg-blue-500/20 rounded-full">
                        <Text className="text-xs text-blue-400">Active</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-sm text-gray-500 mt-1">
                    {item.description}
                  </Text>
                </View>

                {item.canToggle && (
                  <Pressable
                    onPress={() => toggleDataSharing(index)}
                    className={`w-12 h-7 rounded-full p-1 ${
                      item.isShared ? 'bg-primary-600' : 'bg-gray-700'
                    }`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full bg-white ${
                        item.isShared ? 'ml-auto' : ''
                      }`}
                    />
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Data Retention */}
        <View className="px-5 mb-6">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Data Retention
          </Text>
          <View className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-base font-semibold text-white">
                  Auto-delete old data
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Remove vibes older than 90 days
                </Text>
              </View>
              <Pressable
                onPress={() => hapticSelection()}
                className="w-12 h-7 rounded-full bg-gray-700 p-1"
              >
                <View className="w-5 h-5 rounded-full bg-white" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Download Data */}
        <View className="px-5 mb-6">
          <Pressable
            onPress={() => {
              hapticSelection();
              // TODO: Implement data export
            }}
            className="bg-gray-900 rounded-2xl border border-gray-800 p-4 flex-row items-center"
          >
            <View className="w-10 h-10 rounded-xl bg-primary-600/20 items-center justify-center mr-3">
              <Ionicons name="download-outline" size={20} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-white">
                Download My Data
              </Text>
              <Text className="text-sm text-gray-500">
                Get a copy of all your information
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </Pressable>
        </View>

        {/* Privacy Policy Link */}
        <View className="px-5 pb-6">
          <Pressable
            onPress={() => {
              hapticSelection();
              // TODO: Open privacy policy
            }}
            className="items-center py-3"
          >
            <Text className="text-sm text-primary-500 font-medium">
              Read Full Privacy Policy
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
