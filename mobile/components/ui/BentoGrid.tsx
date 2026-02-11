import React from 'react';
import { View, Pressable, Text, ScrollView } from 'react-native';
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
  const totalWidth = 100; // 100%

  return (
    <ScrollView
      horizontal={false}
      contentContainerStyle={{ gap }}
      className="w-full"
    >
      {items.reduce((rows: JSX.Element[][], item, index) => {
        const config = SIZE_CONFIG[item.size];
        const isNewRow = index === 0 || rows[rows.length - 1].length + config.width > columns;

        if (isNewRow) {
          rows.push([]);
        }

        const currentRow = rows[rows.length - 1];
        const rowWidth = currentRow.reduce((sum, i) => {
          const itemConfig = SIZE_CONFIG[items.find((x) => x.id === i)!.size];
          return sum + itemConfig.width;
        }, 0);

        if (rowWidth + config.width <= columns) {
          currentRow.push(item.id);
        } else {
          rows.push([item.id]);
        }

        return rows;
      }, []).map((rowItems, rowIndex) => (
        <View key={`row-${rowIndex}`} className="flex-row" style={{ gap }}>
          {rowItems.map((itemId) => {
            const item = items.find((i) => i.id === itemId)!;
            const config = SIZE_CONFIG[item.size];
            const itemWidth = (config.width / columns) * 100 - (gap / 2);

            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  hapticSelection();
                  item.onPress?.();
                }}
                className="overflow-hidden rounded-3xl border border-gray-800"
                style={[
                  {
                    backgroundColor: '#111827',
                    width: `${itemWidth}%`,
                    minHeight: config.height,
                  },
                  item.gradient && item.gradientColors
                    ? {}
                    : {},
                ]}
              >
                {item.gradient && item.gradientColors ? (
                  <LinearGradient
                    colors={item.gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="absolute inset-0"
                  />
                ) : null}

                <View className="relative z-10 p-4 justify-between flex-1">
                  {item.content}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
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
      <View className="flex-row items-start justify-between">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Text className="text-lg">{icon}</Text>
        </View>
        {trend && (
          <View
            className={`px-2 py-1 rounded-full ${
              trend.up ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                trend.up ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {trend.up ? '↑' : '↓'} {trend.value}
            </Text>
          </View>
        )}
      </View>
      <View>
        <Text className="text-2xl font-bold text-white">{value}</Text>
        <Text className="text-xs text-gray-500 mt-1">{label}</Text>
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
      className="bg-gray-800 rounded-3xl p-4 border border-gray-700"
    >
      <Text className="text-3xl mb-3">{icon}</Text>
      <Text className="text-base font-semibold text-white">{title}</Text>
      <Text className="text-sm text-gray-500 mt-1">{description}</Text>
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
      className="rounded-3xl overflow-hidden"
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-5 justify-between flex-1"
      >
        {icon && <Text className="text-4xl">{icon}</Text>}
        <View>
          <Text className="text-lg font-bold text-white">{title}</Text>
          {description && (
            <Text className="text-sm text-white/80 mt-1">{description}</Text>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}
