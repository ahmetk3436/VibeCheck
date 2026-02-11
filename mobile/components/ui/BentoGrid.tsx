import React from 'react';
import { View, Pressable, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '../../lib/cn';
import { hapticSelection } from '../../lib/haptics';

// 2025-2026 Trend: Bento Box Grids (modular layouts)
interface BentoItem {
  id: string;
  size: 'sm' | 'md' | 'lg' | 'full';
  content: React.ReactNode;
  onPress?: () => void;
  gradient?: boolean;
  gradientColors?: string[];
}

interface BentoGridProps {
  items: BentoItem[];
  columns?: 2 | 3;
  gap?: number;
}

const SIZE_CONFIG = {
  sm: { width: 1, height: 100 },
  md: { width: 1, height: 140 },
  lg: { width: 2, height: 180 },
  full: { width: 2, height: 'auto' as any },
};

export default function BentoGrid({
  items,
  columns = 2,
  gap = 12,
}: BentoGridProps) {
  return (
    <ScrollView
      horizontal={false}
      contentContainerStyle={[styles.container, { gap }]}
      style={styles.scrollView}
    >
      {items.map((item) => {
        const config = SIZE_CONFIG[item.size];
        const itemWidth = (config.width / columns) * 100;

        return (
          <Pressable
            key={item.id}
            onPress={() => {
              hapticSelection();
              item.onPress?.();
            }}
            style={[
              styles.item,
              {
                backgroundColor: '#111827',
                width: `${itemWidth}%`,
                minHeight: config.height,
                marginRight: gap,
              },
            ]}
          >
            {item.gradient && item.gradientColors ? (
              <LinearGradient
                colors={item.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
              />
            ) : null}

            <View style={styles.itemContent}>
              {item.content}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// Pre-built bento item components
export function StatBentoItem({
  label,
  value,
  icon,
  color = '#8b5cf6',
  trend,
}: {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
  trend?: { value: string; up: boolean };
}) {
  return (
    <>
      <View style={styles.rowBetween}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        {trend && (
          <View
            style={[
              styles.trendBadge,
              { backgroundColor: trend.up ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)' },
            ]}
          >
            <Text
              style={[styles.trendText, { color: trend.up ? '#4ade80' : '#ef4444' }]}
            >
              {trend.up ? '↑' : '↓'} {trend.value}
            </Text>
          </View>
        )}
      </View>
      <View>
        <Text style={styles.valueText}>{value}</Text>
        <Text style={styles.labelText}>{label}</Text>
      </View>
    </>
  );
}

export function ActionBentoItem({
  title,
  description,
  icon,
  onPress,
}: {
  title: string;
  description: string;
  icon: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        hapticSelection();
        onPress?.();
      }}
      style={styles.actionItem}
    >
      <Text style={styles.emojiLarge}>{icon}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDescription}>{description}</Text>
    </Pressable>
  );
}

export function GradientBentoItem({
  title,
  description,
  gradientColors,
  icon,
  onPress,
}: {
  title: string;
  description?: string;
  gradientColors: string[];
  icon?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        hapticSelection();
        onPress?.();
      }}
      style={styles.gradientItem}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {icon && <Text style={styles.emojiLarge}>{icon}</Text>}
        <View>
          <Text style={styles.gradientTitle}>{title}</Text>
          {description && (
            <Text style={styles.gradientDescription}>{description}</Text>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1f2937',
    overflow: 'hidden',
    marginBottom: 12,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  itemContent: {
    padding: 16,
    zIndex: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  valueText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  labelText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  actionItem: {
    backgroundColor: '#1f2937',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  actionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  emojiLarge: {
    fontSize: 28,
    marginBottom: 12,
  },
  gradientItem: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradientTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  gradientDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
});
