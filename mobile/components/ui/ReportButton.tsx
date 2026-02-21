import React, { useState } from 'react';
import { Alert, Pressable, Text, View, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { hapticSuccess, hapticError, hapticSelection } from '../../lib/haptics';
import Modal from './Modal';

interface ReportButtonProps {
  contentType: 'user' | 'post' | 'comment';
  contentId: string;
  userName?: string;
}

// Report categories for quick selection (2025-2026 trend)
const REPORT_CATEGORIES = [
  { id: 'harassment', icon: 'person-outline', label: 'Harassment', color: '#ef4444' },
  { id: 'spam', icon: 'chatbubble-outline', label: 'Spam', color: '#f59e0b' },
  { id: 'inappropriate', icon: 'eye-off-outline', label: 'Inappropriate Content', color: '#ec4899' },
  { id: 'misinformation', icon: 'warning-outline', label: 'Misinformation', color: '#8b5cf6' },
  { id: 'hate', icon: 'flash-outline', label: 'Hate Speech', color: '#dc2626' },
  { id: 'other', icon: 'ellipsis-horizontal-outline', label: 'Other', color: '#6b7280' },
];

// Report button (Apple Guideline 1.2 — every piece of UGC must have one)
// Enhanced with category chips and better UX
export default function ReportButton({
  contentType,
  contentId,
  userName = 'this content',
}: ReportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReport = async () => {
    if (!selectedCategory && !customReason.trim()) {
      Alert.alert('Required', 'Please select a category or provide a reason.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/reports', {
        content_type: contentType,
        content_id: contentId,
        reason: selectedCategory || customReason,
        category: selectedCategory,
      });
      hapticSuccess();
      setShowModal(false);
      setSelectedCategory('');
      setCustomReason('');
      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep our community safe. We will review this within 24 hours.',
        [{ text: 'OK', onPress: () => {} }]
      );
    } catch {
      hapticError();
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Pressable
        className="flex-row items-center gap-1 p-2"
        onPress={() => {
          hapticSelection();
          setShowModal(true);
        }}
      >
        <Ionicons name="flag-outline" size={16} color="#ef4444" />
        <Text className="text-sm text-red-500">Report</Text>
      </Pressable>

      <Modal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title="Report Content"
        size="lg"
      >
        <Text className="mb-4 text-sm text-gray-400">
          Tell us why you're reporting this {contentType}. Your report is anonymous.
        </Text>

        {/* Category chips for quick selection */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-400 mb-2">
            Select a reason
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {REPORT_CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category.id;
              return (
                <Pressable
                  key={category.id}
                  onPress={() => {
                    hapticSelection();
                    setSelectedCategory(category.id);
                    setCustomReason('');
                  }}
                  className={`px-3 py-2 rounded-full border ${
                    isSelected
                      ? 'border-transparent'
                      : 'border-gray-700 bg-gray-900'
                  }`}
                  style={{
                    backgroundColor: isSelected ? category.color : undefined,
                  }}
                >
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons
                      name={category.icon as any}
                      size={14}
                      color={isSelected ? '#ffffff' : category.color}
                    />
                    <Text
                      className={`text-xs font-medium ${
                        isSelected ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      {category.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Custom reason input */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-400 mb-2">
            Additional details (optional)
          </Text>
          <TextInput
            className="w-full rounded-xl bg-gray-800 border border-gray-700 p-3 text-white text-sm min-h-[80px]"
            placeholder="Provide more context to help us review..."
            placeholderTextColor="#6b7280"
            value={customReason}
            onChangeText={setCustomReason}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
          <Text className="text-xs text-gray-600 text-right mt-1">
            {customReason.length}/500
          </Text>
        </View>

        {/* Info banner */}
        <View className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4">
          <View className="flex-row items-start">
            <Ionicons name="information-circle-outline" size={16} color="#3b82f6" />
            <Text className="text-xs text-blue-400 ml-2 flex-1">
              False reports may result in account restrictions. Please report only content that violates our guidelines.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Pressable
              className="py-3 rounded-xl bg-gray-800 items-center"
              onPress={() => setShowModal(false)}
            >
              <Text className="text-sm font-medium text-gray-400">Cancel</Text>
            </Pressable>
          </View>
          <View className="flex-1">
            <Pressable
              className={`py-3 rounded-xl items-center ${
                isSubmitting ? 'opacity-70' : 'bg-red-600'
              }`}
              onPress={handleReport}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Text className="text-sm font-semibold text-white">Submitting...</Text>
              ) : (
                <Text className="text-sm font-semibold text-white">Submit Report</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
