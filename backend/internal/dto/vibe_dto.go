package dto

// CreateVibeCheckRequest represents a vibe check-in request
type CreateVibeCheckRequest struct {
	MoodText string `json:"mood_text" validate:"required,max=500"`
}

// CreateGuestVibeCheckRequest represents a guest vibe check-in request
type CreateGuestVibeCheckRequest struct {
	MoodText string `json:"mood_text" validate:"required,max=500"`
	DeviceID string `json:"device_id" validate:"required"`
}

// VibeCheckResponse represents a vibe check response
type VibeCheckResponse struct {
	ID             string `json:"id"`
	MoodText       string `json:"mood_text"`
	Aesthetic      string `json:"aesthetic"`
	ColorPrimary   string `json:"color_primary"`
	ColorSecondary string `json:"color_secondary"`
	ColorAccent    string `json:"color_accent"`
	VibeScore      int    `json:"vibe_score"`
	Emoji          string `json:"emoji"`
	Insight        string `json:"insight"`
	CheckDate      string `json:"check_date"`
}

// VibeStatsResponse represents vibe statistics
type VibeStatsResponse struct {
	CurrentStreak int     `json:"current_streak"`
	LongestStreak int     `json:"longest_streak"`
	TotalChecks   int     `json:"total_checks"`
	TopAesthetic  string  `json:"top_aesthetic"`
	AvgVibeScore  float64 `json:"avg_vibe_score"`
}

// VibeTrendItem represents a single day's vibe data for trend charts
type VibeTrendItem struct {
	Date      string `json:"date"`       // Format: "2006-01-02"
	VibeScore int    `json:"vibe_score"` // 0-100, 0 means no check that day
	Aesthetic string `json:"aesthetic"`  // Empty string if no check
	Emoji     string `json:"emoji"`      // Empty string if no check
}

// VibeStatsEnhanced contains extended statistics including trend data
type VibeStatsEnhanced struct {
	CurrentStreak    int            `json:"current_streak"`
	LongestStreak    int            `json:"longest_streak"`
	TotalChecks      int            `json:"total_checks"`
	AvgVibeScore     float64        `json:"avg_vibe_score"`
	TopAesthetic     string         `json:"top_aesthetic"`
	Last7Avg         float64        `json:"last_7_avg"`
	MoodDistribution map[string]int `json:"mood_distribution"`
}
