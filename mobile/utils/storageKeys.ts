/**
 * AsyncStorage key constants for VibeMeter AI
 * Use these constants instead of string literals to prevent typos
 */

export const STORAGE_KEYS = {
  // Guest mode
  GUEST_DEVICE_ID: 'guest_device_id',
  GUEST_USAGE_COUNT: 'guest_usage_count',
  GUEST_VIBES: 'guest_vibes',

  // Onboarding
  ONBOARDING_COMPLETE: 'onboarding_complete',

  // User preferences
  DARK_MODE: 'dark_mode',
  NOTIFICATIONS_ENABLED: 'notifications_enabled',

  // Streak tracking
  LAST_VIBE_DATE: 'last_vibe_date',
  CURRENT_STREAK: 'current_streak',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
