package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"github.com/ahmetcoskunkizilkaya/vibecheck/backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type VibeService struct {
	db        *gorm.DB
	openaiKey string
}

func NewVibeService(db *gorm.DB, openaiKey string) *VibeService {
	return &VibeService{db: db, openaiKey: openaiKey}
}

// OpenAI API types
type openAIChatRequest struct {
	Model    string          `json:"model"`
	Messages []openAIMessage `json:"messages"`
}

type openAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIChatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

type aiAnalysisResult struct {
	AestheticKey string `json:"aesthetic_key"`
	VibeScore    int    `json:"vibe_score"`
	Insight      string `json:"insight"`
}

// CreateVibeCheck creates a new vibe check-in
func (s *VibeService) CreateVibeCheck(userID uuid.UUID, moodText string) (*models.VibeCheck, error) {
	today := time.Now().Truncate(24 * time.Hour)

	// Check if already checked in today
	var existing models.VibeCheck
	if err := s.db.Where("user_id = ? AND check_date = ?", userID, today).First(&existing).Error; err == nil {
		return nil, errors.New("already checked in today")
	}

	// Analyze mood — try AI first, fall back to keywords
	result := s.analyzeWithAI(moodText)

	aesthetic := models.Aesthetics[result.AestheticKey]

	check := &models.VibeCheck{
		UserID:         userID,
		MoodText:       moodText,
		Aesthetic:      aesthetic.Name,
		ColorPrimary:   aesthetic.ColorPrimary,
		ColorSecondary: aesthetic.ColorSecondary,
		ColorAccent:    aesthetic.ColorAccent,
		VibeScore:      result.VibeScore,
		Emoji:          aesthetic.Emoji,
		Insight:        result.Insight,
		CheckDate:      today,
	}

	if err := s.db.Create(check).Error; err != nil {
		return nil, err
	}

	// Update streak
	s.updateStreak(userID, today)

	return check, nil
}

// analyzeWithAI calls OpenAI API to analyze mood. Falls back to keyword matching on failure.
func (s *VibeService) analyzeWithAI(moodText string) aiAnalysisResult {
	if s.openaiKey == "" {
		log.Println("OPENAI_API_KEY not set, using fallback keyword analysis")
		return s.fallbackAnalyze(moodText)
	}

	reqBody := openAIChatRequest{
		Model: "gpt-4o-mini",
		Messages: []openAIMessage{
			{
				Role:    "system",
				Content: "You are a mood-to-aesthetic analyzer. Given a user mood text, respond with JSON only (no markdown, no code fences): {\"aesthetic_key\": one of [\"chill\",\"energetic\",\"romantic\",\"melancholy\",\"adventurous\",\"creative\",\"peaceful\",\"confident\",\"cozy\",\"mysterious\"], \"vibe_score\": 10-100, \"insight\": \"short 1-sentence insight about their vibe\"}. Match the aesthetic that best fits the emotional tone.",
			},
			{
				Role:    "user",
				Content: moodText,
			},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		log.Printf("OpenAI request marshal error: %v", err)
		return s.fallbackAnalyze(moodText)
	}

	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("OpenAI request creation error: %v", err)
		return s.fallbackAnalyze(moodText)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.openaiKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("OpenAI API call error: %v", err)
		return s.fallbackAnalyze(moodText)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("OpenAI API returned status %d", resp.StatusCode)
		return s.fallbackAnalyze(moodText)
	}

	var chatResp openAIChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil {
		log.Printf("OpenAI response decode error: %v", err)
		return s.fallbackAnalyze(moodText)
	}

	if len(chatResp.Choices) == 0 {
		log.Println("OpenAI returned no choices")
		return s.fallbackAnalyze(moodText)
	}

	content := chatResp.Choices[0].Message.Content
	// Strip markdown code fences if present
	content = strings.TrimSpace(content)
	if strings.HasPrefix(content, "```") {
		lines := strings.Split(content, "\n")
		if len(lines) > 2 {
			content = strings.Join(lines[1:len(lines)-1], "\n")
		}
	}

	var result aiAnalysisResult
	if err := json.Unmarshal([]byte(content), &result); err != nil {
		log.Printf("OpenAI response JSON parse error: %v, content: %s", err, content)
		return s.fallbackAnalyze(moodText)
	}

	// Validate aesthetic_key exists in our map
	if _, ok := models.Aesthetics[result.AestheticKey]; !ok {
		log.Printf("OpenAI returned unknown aesthetic_key: %s", result.AestheticKey)
		return s.fallbackAnalyze(moodText)
	}

	// Clamp vibe_score to valid range
	if result.VibeScore < 10 {
		result.VibeScore = 10
	}
	if result.VibeScore > 100 {
		result.VibeScore = 100
	}

	// Truncate insight if too long
	if len(result.Insight) > 500 {
		result.Insight = result.Insight[:497] + "..."
	}

	return result
}

// fallbackAnalyze uses keyword matching when AI is unavailable
func (s *VibeService) fallbackAnalyze(moodText string) aiAnalysisResult {
	aestheticKey, _ := s.fallbackAnalyzeMood(moodText)
	vibeScore := s.fallbackCalculateVibeScore(moodText)
	return aiAnalysisResult{
		AestheticKey: aestheticKey,
		VibeScore:    vibeScore,
		Insight:      fmt.Sprintf("Your vibe is %s today!", models.Aesthetics[aestheticKey].Name),
	}
}

// fallbackAnalyzeMood determines aesthetic based on keyword matching
func (s *VibeService) fallbackAnalyzeMood(moodText string) (string, string) {
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
				return aesthetic, models.Aesthetics[aesthetic].Emoji
			}
		}
	}

	// Random if no match
	aestheticKeys := []string{"chill", "energetic", "romantic", "adventurous", "creative", "peaceful", "confident", "cozy", "mysterious"}
	randomKey := aestheticKeys[rand.Intn(len(aestheticKeys))]
	return randomKey, models.Aesthetics[randomKey].Emoji
}

// fallbackCalculateVibeScore generates a vibe score using keyword counting
func (s *VibeService) fallbackCalculateVibeScore(moodText string) int {
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
