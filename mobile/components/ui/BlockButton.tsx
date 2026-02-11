import React, { useState } from 'react';
import { Pressable, Text, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { hapticSuccess, hapticError, hapticWarning, hapticSelection } from '../../lib/haptics';
import Modal from './Modal';

interface BlockButtonProps {
  userId: string;
  userName?: string;
  onBlocked?: () => void;
}

// Block button (Apple Guideline 1.2 — immediate content hiding)
// Enhanced with custom modal and undo capability
export default function BlockButton({
  userId,
  userName = 'this user',
  onBlocked,
}: BlockButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [showUndoBanner, setShowUndoBanner] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [lastBlockedUser, setLastBlockedUser] = useState<string | null>(null);

  const handleBlock = async () => {
    setIsBlocking(true);
    try {
      await api.post('/blocks', { blocked_id: userId });
      hapticSuccess();
      setLastBlockedUser(userId);
      setShowModal(false);
      setShowUndoBanner(true);
      onBlocked?.();

      // Auto-hide undo banner after 5 seconds
      setTimeout(() => {
        setShowUndoBanner(false);
      }, 5000);
    } catch {
      hapticError();
      Alert.alert('Error', 'Failed to block user. Please try again.');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUndo = async () => {
    if (!lastBlockedUser) return;

    try {
      await api.delete(`/blocks/${lastBlockedUser}`);
      hapticSelection();
      setShowUndoBanner(false);
      setLastBlockedUser(null);
    } catch {
      hapticError();
    }
  };

  const openBlockModal = () => {
    hapticWarning();
    setShowModal(true);
  };

  return (
    <>
      {/* Undo banner */}
      {showUndoBanner && (
        <View className="absolute bottom-20 left-4 right-4 bg-gray-800 border border-gray-700 rounded-2xl p-4 flex-row items-center shadow-lg z-50">
          <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
          <Text className="flex-1 text-sm text-white ml-3">
            User blocked. Their content is now hidden.
          </Text>
          <Pressable
            onPress={handleUndo}
            className="bg-primary-600 px-4 py-2 rounded-xl"
          >
            <Text className="text-sm font-semibold text-white">Undo</Text>
          </Pressable>
        </View>
      )}

      <Pressable
        className="flex-row items-center gap-1 p-2"
        onPress={openBlockModal}
      >
        <Ionicons name="ban-outline" size={16} color="#ef4444" />
        <Text className="text-sm text-red-500">Block</Text>
      </Pressable>

      <Modal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title="Block User"
        size="md"
      >
        <View className="items-center mb-4">
          <View className="w-16 h-16 rounded-full bg-red-500/20 items-center justify-center mb-3">
            <Ionicons name="ban" size={32} color="#ef4444" />
          </View>
          <Text className="text-lg font-semibold text-white">
            Block {userName}?
          </Text>
        </View>

        <Text className="mb-4 text-sm text-gray-400 text-center">
          When you block someone, they can no longer:
        </Text>

        <View className="space-y-2 mb-6">
          <View className="flex-row items-start">
            <Ionicons name="checkmark-circle" size={16} color="#ef4444" />
            <Text className="text-sm text-gray-400 ml-2 flex-1">
              See your profile or content
            </Text>
          </View>
          <View className="flex-row items-start">
            <Ionicons name="checkmark-circle" size={16} color="#ef4444" />
            <Text className="text-sm text-gray-400 ml-2 flex-1">
              Follow or message you
            </Text>
          </View>
          <View className="flex-row items-start">
            <Ionicons name="checkmark-circle" size={16} color="#ef4444" />
            <Text className="text-sm text-gray-400 ml-2 flex-1">
              Find your account through search
            </Text>
          </View>
        </View>

        {/* Warning banner */}
        <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
          <View className="flex-row items-start">
            <Ionicons name="warning-outline" size={16} color="#ef4444" />
            <Text className="text-xs text-red-400 ml-2 flex-1">
              Blocked users won't be notified. You can unblock them anytime from Settings.
            </Text>
          </View>
        </View>

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
                isBlocking ? 'opacity-70' : 'bg-red-600'
              }`}
              onPress={handleBlock}
              disabled={isBlocking}
            >
              {isBlocking ? (
                <Text className="text-sm font-semibold text-white">Blocking...</Text>
              ) : (
                <Text className="text-sm font-semibold text-white">Block</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
