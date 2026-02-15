import React, { useRef } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
  PanResponder,
  type ModalProps as RNModalProps,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { cn } from '../../lib/cn';
import { hapticSelection } from '../../lib/haptics';

interface ModalProps extends Omit<RNModalProps, 'visible'> {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  swipeToClose?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// 2025-2026 Trend: Swipe-to-dismiss modal with backdrop blur
export default function Modal({
  visible,
  onClose,
  title,
  children,
  size = 'md',
  swipeToClose = true,
  ...props
}: ModalProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const showModal = Animated.timing(translateY, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  });

  const hideModal = Animated.timing(translateY, {
    toValue: SCREEN_HEIGHT,
    duration: 250,
    useNativeDriver: true,
  });

  const fadeIn = Animated.timing(backdropOpacity, {
    toValue: 1,
    duration: 300,
    useNativeDriver: true,
  });

  const fadeOut = Animated.timing(backdropOpacity, {
    toValue: 0,
    duration: 250,
    useNativeDriver: true,
  });

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([showModal, fadeIn]).start();
    } else {
      Animated.parallel([hideModal, fadeOut]).start();
    }
  }, [visible]);

  const handleClose = () => {
    hapticSelection();
    Animated.parallel([hideModal, fadeOut]).start(() => onClose());
  };

  const handleBackdropPress = () => {
    hapticSelection();
    handleClose();
  };

  const panResponder = useRef(
    swipeToClose
      ? PanResponder.create({
          onMoveShouldSetPanResponder: (_, gestureState) => {
            return gestureState.dy > 0 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
          },
          onPanResponderMove: (_, gestureState) => {
            translateY.setValue(gestureState.dy);
          },
          onPanResponderRelease: (_, gestureState) => {
            if (gestureState.dy > 100) {
              handleClose();
            } else {
              Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                damping: 15,
              }).start();
            }
          },
        })
      : null
  ).current;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
      {...props}
    >
      <Animated.View
        className="flex-1"
        style={{ opacity: backdropOpacity }}
      >
        {/* Backdrop with blur effect (Privacy Transparency UI trend) */}
        <Pressable
          className="flex-1 bg-black/60"
          onPress={handleBackdropPress}
        >
          <BlurView intensity={20} tint="dark" style={{ flex: 1 }} />
        </Pressable>

        {/* Modal Content */}
        <Animated.View
          className={cn(
            "absolute bottom-0 left-0 right-0 rounded-t-3xl bg-gray-900 border-t border-gray-800",
            size === 'full' ? 'h-full rounded-none' : 'mx-4 mb-4'
          )}
          style={{
            transform: [{ translateY }],
          }}
          {...panResponder?.panHandlers}
        >
          {/* Swipe indicator */}
          {swipeToClose && size !== 'full' && (
            <View className="items-center pt-3 pb-1">
              <View className="w-10 h-1 bg-gray-700 rounded-full" />
            </View>
          )}

          {/* Title */}
          {title && (
            <View className="px-6 pt-4 pb-2">
              <Text className="text-xl font-bold text-white">{title}</Text>
            </View>
          )}

          {/* Content */}
          <View className="p-6">{children}</View>
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
}
