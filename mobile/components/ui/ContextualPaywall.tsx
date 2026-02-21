import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
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
      <SafeAreaView style={styles.safeArea}>
        {/* Card */}
        <View style={styles.cardContainer}>
          {/* Gradient border effect */}
          <LinearGradient
            colors={['#8b5cf6', '#ec4899', '#f97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            <View style={styles.card}>
              {/* Lock icon */}
              <View style={styles.iconContainer}>
                <Text style={styles.emoji}>{gateConfig.icon}</Text>
              </View>

              {/* Premium badge */}
              <View style={styles.badgeContainer}>
                <LinearGradient
                  colors={['#8b5cf6', '#ec4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.badge}
                >
                  <Text style={styles.badgeText}>Premium Feature</Text>
                </LinearGradient>
              </View>

              {/* Title */}
              <Text style={styles.title}>{gateConfig.title}</Text>

              {/* Description */}
              <Text style={styles.description}>{gateConfig.description}</Text>

              {/* Value proposition */}
              <View style={styles.valueBox}>
                <View style={styles.checkRow}>
                  <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
                  <Text style={styles.checkText}>{benefit}</Text>
                </View>
                <View style={styles.checkRow}>
                  <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
                  <Text style={styles.checkText}>Cancel anytime</Text>
                </View>
              </View>

              {/* CTA Buttons */}
              <Pressable
                onPress={() => {
                  hapticSelection();
                  unlockAction();
                }}
                style={styles.ctaButton}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#ec4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaGradient}
                >
                  <Text style={styles.ctaText}>{gateConfig.cta}</Text>
                </LinearGradient>
              </Pressable>

              {/* Pricing hint */}
              <Text style={styles.pricing}>From $4.99/month • 7-day free trial</Text>

              {/* Dismiss */}
              {dismissible && (
                <Pressable
                  onPress={() => {
                    hapticSelection();
                    onClose();
                  }}
                  style={styles.dismissButton}
                >
                  <Text style={styles.dismissText}>Maybe later</Text>
                </Pressable>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Trust badges */}
        <View style={styles.trustBadges}>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={16} color="#6b7280" />
            <Text style={styles.trustText}>Secure</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="lock-closed" size={16} color="#6b7280" />
            <Text style={styles.trustText}>Private</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="star" size={16} color="#6b7280" />
            <Text style={styles.trustText}>4.9★</Text>
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
      style={[styles.upgradeBanner, style]}
    >
      <LinearGradient
        colors={['#8b5cf6', '#ec4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.upgradeGradient}
      >
        <View style={styles.upgradeContent}>
          <Text style={styles.upgradeTitle}>{title}</Text>
          {description && (
            <Text style={styles.upgradeDescription}>{description}</Text>
          )}
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
      style={styles.lockedCard}
    >
      <View style={styles.lockIcon}>
        <Ionicons name="lock-closed" size={24} color="#6b7280" />
      </View>
      <Text style={styles.lockedTitle}>{featureName}</Text>
      <Text style={styles.lockedCTA}>Upgrade to unlock</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 350,
  },
  gradientBorder: {
    padding: 2,
    borderRadius: 24,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 22,
    padding: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 32,
  },
  badgeContainer: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  valueBox: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkText: {
    fontSize: 14,
    color: '#d1d5db',
    marginLeft: 8,
    flex: 1,
  },
  ctaButton: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  pricing: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  dismissButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dismissText: {
    fontSize: 14,
    color: '#6b7280',
  },
  trustBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 24,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  upgradeBanner: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  upgradeGradient: {
    padding: 16,
  },
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  upgradeDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  lockedCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  lockedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  lockedCTA: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '500',
  },
});
