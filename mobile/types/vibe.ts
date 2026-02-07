export interface VibeCheck {
  id: string;
  mood_text: string;
  aesthetic: string;
  color_primary: string;
  color_secondary: string;
  color_accent: string;
  vibe_score: number;
  emoji: string;
  insight?: string;
  check_date: string;
  device_id?: string;
}

export interface VibeStats {
  current_streak: number;
  longest_streak: number;
  total_checks: number;
  avg_vibe_score: number;
  top_aesthetic: string;
}

export const AESTHETICS = [
  { key: 'chill', name: 'Chill Vibes', emoji: '😌', colors: ['#6366f1', '#a5b4fc', '#e0e7ff'] },
  { key: 'energetic', name: 'High Energy', emoji: '⚡', colors: ['#f97316', '#fdba74', '#fff7ed'] },
  { key: 'romantic', name: 'Hopeless Romantic', emoji: '💕', colors: ['#ec4899', '#f9a8d4', '#fdf2f8'] },
  { key: 'melancholy', name: 'Melancholy Soul', emoji: '🌧️', colors: ['#64748b', '#94a3b8', '#f1f5f9'] },
  { key: 'adventurous', name: 'Adventure Mode', emoji: '🏔️', colors: ['#22c55e', '#86efac', '#f0fdf4'] },
  { key: 'creative', name: 'Creative Flow', emoji: '🎨', colors: ['#8b5cf6', '#c4b5fd', '#f5f3ff'] },
  { key: 'peaceful', name: 'Inner Peace', emoji: '🧘', colors: ['#06b6d4', '#67e8f9', '#ecfeff'] },
  { key: 'confident', name: 'Main Character', emoji: '👑', colors: ['#eab308', '#fde047', '#fefce8'] },
  { key: 'cozy', name: 'Cozy Era', emoji: '☕', colors: ['#92400e', '#fbbf24', '#fffbeb'] },
  { key: 'mysterious', name: 'Dark Academia', emoji: '🌙', colors: ['#1e1b4b', '#4338ca', '#312e81'] },
];
