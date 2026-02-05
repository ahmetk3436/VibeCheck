package services

import (
	"errors"
	"math/rand"
	"strings"
	"time"

	"github.com/ahmetcoskunkizilkaya/vibecheck/backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type VibeService struct {
	db *gorm.DB
}

func NewVibeService(db *gorm.DB) *VibeService {
	return &VibeService{db: db}
}

// CreateVibeCheck creates a new vibe check-in
func (s *VibeService) CreateVibeCheck(userID uuid.UUID, moodText string) (*models.VibeCheck, error) {
	today := time.Now().Truncate(24 * time.Hour)

	// Check if already checked in today
	var existing models.VibeCheck
	if err := s.db.Where("user_id = ? AND check_date = ?", userID, today).First(&existing).Error; err == nil {
		return nil, errors.New("already checked in today")
	}

	// Analyze mood and get aesthetic
	aesthetic, emoji, colors := s.analyzeMood(moodText)
	vibeScore := s.calculateVibeScore(moodText)

	check := &models.VibeCheck{
		UserID:         userID,
		MoodText:       moodText,
		Aesthetic:      aesthetic,
		ColorPrimary:   colors[0],
		ColorSecondary: colors[1],
		ColorAccent:    colors[2],
		VibeScore:      vibeScore,
		Emoji:          emoji,
		CheckDate:      today,
	}

	if err := s.db.Create(check).Error; err != nil {
		return nil, err
	}

	// Update streak
	s.updateStreak(userID, today)

	return check, nil
}

// analyzeMood determines aesthetic based on mood text
func (s *VibeService) analyzeMood(moodText string) (string, string, []string) {
	lower := strings.ToLower(moodText)

	keywords := map[string][]string{
		"chill":       {"chill", "relax", "calm", "peaceful", "zen", "vibing"},
		"energetic":   {"energy", "hyped", "excited", "pumped", "fire", "lit"},
		"romantic":    {"love", "crush", "heart", "romantic", "butterfly", "miss"},
		"melancholy":  {"sad", "tired", "exhausted", "lonely", "down", "blue"},
		"adventurous": {"adventure", "travel", "explore", "free", "wild", "nature"},
		"creative":    {"creative", "inspired", "art", "ideas", "flow", "create"},
		"peaceful":    {"peace", "meditate", "grateful", "blessed", "content"},
		"confident":   {"confident", "boss", "slay", "winning", "proud", "strong"},
		"cozy":        {"cozy", "home", "comfort", "warm", "snuggle", "rain"},
		"mysterious":  {"mysterious", "deep", "think", "night", "dark", "dream"},
	}

	for aesthetic, words := range keywords {
		for _, word := range words {
			if strings.Contains(lower, word) {
				a := models.Aesthetics[aesthetic]
				return a.Name, a.Emoji, []string{a.ColorPrimary, a.ColorSecondary, a.ColorAccent}
			}
		}
	}

	// Random if no match
	aestheticKeys := []string{"chill", "energetic", "romantic", "adventurous", "creative", "peaceful", "confident", "cozy", "mysterious"}
	randomKey := aestheticKeys[rand.Intn(len(aestheticKeys))]
	a := models.Aesthetics[randomKey]
	return a.Name, a.Emoji, []string{a.ColorPrimary, a.ColorSecondary, a.ColorAccent}
}

// calculateVibeScore generates a vibe score 1-100
func (s *VibeService) calculateVibeScore(moodText string) int {
	lower := strings.ToLower(moodText)
	score := 50

	positiveWords := []string{"happy", "great", "amazing", "love", "excited", "blessed", "grateful", "fire", "lit", "slay", "winning", "good"}
	negativeWords := []string{"sad", "tired", "exhausted", "lonely", "anxious", "stressed", "bad", "down", "worried"}

	for _, word := range positiveWords {
		if strings.Contains(lower, word) {
			score += 10
		}
	}
	for _, word := range negativeWords {
		if strings.Contains(lower, word) {
			score -= 10
		}
	}

	if score > 100 {
		score = 100
	}
	if score < 10 {
		score = 10
	}
	return score
}

// updateStreak updates user's streak
func (s *VibeService) updateStreak(userID uuid.UUID, today time.Time) {
	var streak models.VibeStreak
	if err := s.db.Where("user_id = ?", userID).First(&streak).Error; err != nil {
		// Create new streak
		streak = models.VibeStreak{
			UserID:        userID,
			CurrentStreak: 1,
			LongestStreak: 1,
			TotalChecks:   1,
			LastCheckDate: today,
		}
		s.db.Create(&streak)
		return
	}

	yesterday := today.AddDate(0, 0, -1)
	streak.TotalChecks++

	if streak.LastCheckDate.Equal(yesterday) {
		streak.CurrentStreak++
	} else if !streak.LastCheckDate.Equal(today) {
		streak.CurrentStreak = 1
	}

	if streak.CurrentStreak > streak.LongestStreak {
		streak.LongestStreak = streak.CurrentStreak
	}
	streak.LastCheckDate = today

	s.db.Save(&streak)
}

// GetTodayCheck returns today's check-in
func (s *VibeService) GetTodayCheck(userID uuid.UUID) (*models.VibeCheck, error) {
	today := time.Now().Truncate(24 * time.Hour)
	var check models.VibeCheck
	if err := s.db.Where("user_id = ? AND check_date = ?", userID, today).First(&check).Error; err != nil {
		return nil, err
	}
	return &check, nil
}

// GetVibeHistory returns user's vibe history
func (s *VibeService) GetVibeHistory(userID uuid.UUID, limit, offset int) ([]models.VibeCheck, int64, error) {
	var checks []models.VibeCheck
	var total int64

	s.db.Model(&models.VibeCheck{}).Where("user_id = ?", userID).Count(&total)

	if err := s.db.Where("user_id = ?", userID).
		Order("check_date DESC").
		Limit(limit).
		Offset(offset).
		Find(&checks).Error; err != nil {
		return nil, 0, err
	}

	return checks, total, nil
}

// GetVibeStats returns user's vibe statistics
func (s *VibeService) GetVibeStats(userID uuid.UUID) (map[string]interface{}, error) {
	var streak models.VibeStreak
	s.db.Where("user_id = ?", userID).First(&streak)

	var avgScore float64
	s.db.Model(&models.VibeCheck{}).
		Where("user_id = ?", userID).
		Select("COALESCE(AVG(vibe_score), 0)").
		Scan(&avgScore)

	// Get top aesthetic
	var topAesthetic string
	s.db.Model(&models.VibeCheck{}).
		Where("user_id = ?", userID).
		Select("aesthetic").
		Group("aesthetic").
		Order("COUNT(*) DESC").
		Limit(1).
		Scan(&topAesthetic)

	return map[string]interface{}{
		"current_streak": streak.CurrentStreak,
		"longest_streak": streak.LongestStreak,
		"total_checks":   streak.TotalChecks,
		"avg_vibe_score": avgScore,
		"top_aesthetic":  topAesthetic,
	}, nil
}
