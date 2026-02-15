package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"log"
	"math"
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

// KeywordWeight maps a set of keywords to a weight for aesthetic scoring
type KeywordWeight struct {
	Keywords    []string
	Weight      float64
	AestheticKey string // The valid models.Aesthetics key to map to
}

// aestheticKeywordMap maps descriptive categories to weighted keyword sets.
// Each entry's AestheticKey must exist in models.Aesthetics.
var aestheticKeywordMap = map[string]KeywordWeight{
	"chill": {
		Keywords: []string{
			"chill", "relaxed", "calm", "peaceful", "mellow", "laid back", "laidback",
			"easygoing", "unbothered", "zen", "tranquil", "serene", "cozy", "comfy",
			"lazy", "slow", "quiet", "restful", "chilling", "vibing", "relaxing",
			"cloudy", "rainy day", "sunday morning",
		},
		Weight:      1.0,
		AestheticKey: "chill",
	},
	"energetic": {
		Keywords: []string{
			"energetic", "hype", "pumped", "excited", "hyped", "turnt", "turnt up",
			"lit", "fire", "electric", "buzzing", "alive", "thrilled", "amped",
			"energized", "power", "powerful", "dynamic", "vibrant", "explosive",
			"party", "workout", "gym", "dancing",
		},
		Weight:      1.0,
		AestheticKey: "energetic",
	},
	"romantic": {
		Keywords: []string{
			"romantic", "love", "loving", "affectionate", "tender", "passionate",
			"intimate", "heart", "crush", "dating", "relationship", "caring",
			"sweet", "adoring", "devoted", "enamored", "smitten", "lovestruck",
			"date night", "in love", "bae", "boo", "butterfly", "miss",
		},
		Weight:      1.0,
		AestheticKey: "romantic",
	},
	"melancholic": {
		Keywords: []string{
			"melancholic", "sad", "blue", "down", "lonely", "melancholy", "gloomy",
			"somber", "wistful", "nostalgic", "bittersweet", "heartbroken", "mournful",
			"depressed", "empty", "lost", "hurting", "aching", "sorrow", "grief",
			"missing", "crying", "tears", "hurt",
		},
		Weight:      1.0,
		AestheticKey: "melancholy",
	},
	"chaotic": {
		Keywords: []string{
			"chaotic", "crazy", "wild", "messy", "hectic", "insane", "unpredictable",
			"disorderly", "frenzy", "mayhem", "turmoil", "unstable", "turbulent",
			"manic", "frantic", "scattered", "overwhelmed", "disaster", "nightmare",
			"circus", "losing it", "falling apart",
		},
		Weight:      1.0,
		AestheticKey: "mysterious",
	},
	"cozy": {
		Keywords: []string{
			"cozy", "comfy", "snug", "warm", "homey", "comfortable", "nestled",
			"hygge", "toasty", "fuzzy", "soft", "blanket", "pajamas", "pjs",
			"bed", "couch", "cuddling", "cuddled", "wrapped up", "homebody",
			"staying in", "movie night", "rainy",
		},
		Weight:      1.0,
		AestheticKey: "cozy",
	},
	"adventurous": {
		Keywords: []string{
			"adventurous", "adventure", "exploring", "journey", "quest", "wanderlust",
			"traveling", "travel", "road trip", "hiking", "outdoors", "wild",
			"brave", "bold", "daring", "fearless", "spontaneous", "discovery",
			"new experience", "trying new", "escape", "nature", "explore", "free",
		},
		Weight:      1.0,
		AestheticKey: "adventurous",
	},
	"creative": {
		Keywords: []string{
			"creative", "artistic", "inspired", "imaginative", "innovative", "crafty",
			"making", "creating", "designing", "painting", "drawing", "writing",
			"composing", "brainstorming", "visionary", "expressive", "original",
			"art", "project", "idea", "muse", "flow", "create",
		},
		Weight:      1.0,
		AestheticKey: "creative",
	},
	"confident": {
		Keywords: []string{
			"confident", "bold", "powerful", "strong", "fearless",
			"self-assured", "poised", "assertive", "empowered", "unstoppable",
			"winning", "victorious", "successful", "accomplished", "proud",
			"slaying", "killing it", "on top", "main character", "boss", "slay",
		},
		Weight:      1.0,
		AestheticKey: "confident",
	},
	"anxious": {
		Keywords: []string{
			"anxious", "worried", "nervous", "stressed", "overwhelmed", "panic",
			"restless", "tense", "uneasy", "apprehensive", "fearful", "scared",
			"racing thoughts", "can't sleep", "overthinking", "dread", "doom",
			"spiral", "freaking out", "panic attack", "anxiety",
		},
		Weight:      1.0,
		AestheticKey: "melancholy",
	},
	"peaceful": {
		Keywords: []string{
			"peaceful", "serene", "tranquil", "harmonious", "balanced", "centered",
			"grounded", "mindful", "present", "still", "quiet", "content",
			"grateful", "blessed", "at peace", "inner calm", "meditation",
			"healing", "recovery", "self-care", "meditate", "peace",
		},
		Weight:      1.0,
		AestheticKey: "peaceful",
	},
	"nostalgic": {
		Keywords: []string{
			"nostalgic", "reminiscing", "memories", "throwback",
			"childhood", "past", "remembering", "looking back",
			"simpler times", "good old days", "flashback", "vintage", "retro",
			"old school", "back in the day", "growing up",
		},
		Weight:      1.0,
		AestheticKey: "melancholy",
	},
	"social": {
		Keywords: []string{
			"social", "outgoing", "friendly", "extroverted", "party", "gathering",
			"friends", "hanging out", "meeting", "networking", "connecting",
			"crowd", "celebration", "together", "community", "bonding",
			"with friends", "socializing", "people",
		},
		Weight:      1.0,
		AestheticKey: "energetic",
	},
	"focused": {
		Keywords: []string{
			"focused", "productive", "working", "grinding", "hustling", "determined",
			"ambitious", "goal-oriented", "driven", "motivated", "concentrated",
			"in the zone", "flow state", "deep work", "getting things done",
			"busy", "deadline", "project", "work mode",
		},
		Weight:      1.0,
		AestheticKey: "confident",
	},
	"playful": {
		Keywords: []string{
			"playful", "fun", "silly", "goofy", "cheeky", "mischievous",
			"joking", "laughing", "humor", "funny", "hilarious", "entertained",
			"amused", "lighthearted", "carefree", "joyful", "giddy", "bubbly",
			"jokes", "memes", "goofing around",
		},
		Weight:      1.0,
		AestheticKey: "energetic",
	},
	"mysterious": {
		Keywords: []string{
			"mysterious", "deep", "think", "night", "dark", "dream",
			"enigmatic", "cryptic", "abstract", "philosophical", "ponder",
			"wonder", "unknown", "shadow", "midnight", "secrets",
		},
		Weight:      1.0,
		AestheticKey: "mysterious",
	},
}

var strongPositiveWords = []string{
	"amazing", "incredible", "fantastic", "wonderful", "excellent", "outstanding",
	"phenomenal", "spectacular", "magnificent", "brilliant", "awesome", "perfect",
	"love", "adore", "thrilled", "ecstatic", "overjoyed", "blissful", "euphoric",
	"grateful", "blessed", "lucky", "fortunate", "happy", "joyful", "elated",
}

var mildPositiveWords = []string{
	"good", "nice", "pleasant", "fine", "okay", "alright", "decent", "fair",
	"content", "satisfied", "pleased", "glad", "cheerful", "bright",
	"positive", "hopeful", "optimistic", "looking forward", "excited", "eager",
	"interested", "curious", "engaged", "motivated", "inspired", "refreshed",
}

var strongNegativeWords = []string{
	"terrible", "horrible", "awful", "dreadful", "horrendous", "atrocious",
	"devastated", "heartbroken", "destroyed", "shattered", "crushed", "hopeless",
	"desperate", "miserable", "depressed",
	"hate", "loathe", "despise", "angry", "furious", "enraged", "livid",
}

var mildNegativeWords = []string{
	"bad", "poor", "negative", "down", "low", "off", "not great", "meh",
	"disappointed", "frustrated", "annoyed", "irritated", "bothered", "upset",
	"worried", "concerned", "troubled", "uneasy", "uncomfortable", "awkward",
	"tired", "exhausted", "drained", "burnt out", "stressed", "overwhelmed",
}

// insightTemplates provides 6 templates per aesthetic category, ordered by score range:
// indices 0-1: empathetic (score 10-30), 2-3: neutral (31-60), 4-5: enthusiastic (61-100)
var insightTemplates = map[string][]string{
	"chill": {
		"Your calm energy is exactly what you need right now — embrace the stillness.",
		"Taking it slow isn't laziness, it's wisdom. Your vibe is perfectly balanced.",
		"Peace looks beautiful on you. This chill energy is your superpower today.",
		"Sometimes the most productive thing you can do is relax. You've got this.",
		"Your mellow vibes are creating space for something wonderful to unfold.",
		"Embracing the slow vibes — this is what self-care looks like in action.",
	},
	"energetic": {
		"Your energy is absolutely magnetic right now — the world is ready for you!",
		"This electric vibe you're radiating? It's going to open amazing doors today.",
		"You're buzzing with potential — channel this energy into something you love.",
		"Your enthusiasm is contagious! Keep riding this wave of positive momentum.",
		"Something powerful is building within you — trust this energetic surge.",
		"Your vibrant spirit is ready to take on whatever challenge comes next!",
	},
	"romantic": {
		"Your heart is open and ready — love has a way of finding those who seek it.",
		"The tenderness you're feeling is a gift — let it guide your connections today.",
		"Romance isn't just about others, it's about loving yourself deeply too.",
		"Your loving energy is creating ripples — someone out there needs exactly that.",
		"The heart wants what it wants, and yours is speaking clearly right now.",
		"Your capacity for love is beautiful — nurture it and watch it flourish.",
	},
	"melancholy": {
		"It's okay to feel this heaviness — your emotions are valid and temporary.",
		"Even in the blue moments, you're not alone. This feeling will pass.",
		"Your sensitivity is a strength, even when it feels overwhelming right now.",
		"Gentle reminder: feeling deeply means you're living deeply. Take your time.",
		"The rain in your heart will pass — until then, be kind to yourself.",
		"Your melancholy has wisdom in it — listen to what it's trying to tell you.",
	},
	"adventurous": {
		"Your adventurous spirit is calling — something exciting awaits on the horizon!",
		"The world is vast and your curiosity is the perfect compass.",
		"This wanderlust isn't random — it's your soul seeking expansion.",
		"Bold moves create bold outcomes. Your brave energy is ready.",
		"Adventure isn't just about places — it's about the courage to explore within.",
		"Your fearless energy is opening doors you didn't even know existed!",
	},
	"creative": {
		"Your creative spark is igniting something magical — trust your artistic instincts.",
		"The muse has found you — now is the time to create without judgment.",
		"Your imagination is a superpower — let it run wild today.",
		"Every great creation started with exactly this kind of inspired energy.",
		"Your artistic vibe is attracting inspiration from unexpected places.",
		"The world needs your unique creative voice — express it boldly!",
	},
	"peaceful": {
		"Your peaceful presence is a gift to everyone around you.",
		"This inner harmony you've found is precious — protect it gently.",
		"Centered and grounded, you're exactly where you need to be.",
		"Your balanced energy is creating space for clarity and wisdom.",
		"Peace isn't the absence of chaos — it's your ability to remain steady.",
		"This tranquil vibe you're cultivating is healing more than just yourself.",
	},
	"confident": {
		"Your confidence is radiating — step into your power unapologetically!",
		"You're in your main character era — own this moment completely.",
		"This self-assured energy you're projecting? It's absolutely magnetic.",
		"Your belief in yourself is the foundation of everything you'll achieve.",
		"Walk tall — your confident vibe is inspiring others around you.",
		"You've earned this powerful energy — let it carry you forward!",
	},
	"cozy": {
		"Your cozy vibe is creating a sanctuary — this is beautiful self-preservation.",
		"There's profound wisdom in knowing when to nest and nurture yourself.",
		"Wrapped in comfort, you're exactly where you need to be right now.",
		"Your homebody energy is valid — rest is productive too.",
		"Creating warmth for yourself is the ultimate act of self-love.",
		"This snug feeling you've cultivated? It's healing you from the inside out.",
	},
	"mysterious": {
		"Your mysterious energy draws people in — there's power in depth.",
		"The shadows hold wisdom that the light cannot teach. Embrace the unknown.",
		"Your introspective mood is unlocking deeper understanding of yourself.",
		"There's beauty in the enigmatic — not everything needs to be explained.",
		"Your deep thinking is a rare gift — trust where it takes you.",
		"The night holds its own magic, and so does your current vibe.",
	},
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
		UserID:         &userID,
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

// CreateGuestVibeCheck creates a vibe check for a guest user (no auth required)
func (s *VibeService) CreateGuestVibeCheck(moodText, deviceID string) (*models.VibeCheck, error) {
	today := time.Now().Truncate(24 * time.Hour)

	// Count today's guest checks for this device
	var count int64
	s.db.Model(&models.VibeCheck{}).
		Where("device_id = ? AND check_date = ? AND user_id IS NULL", deviceID, today).
		Count(&count)

	if count >= 3 {
		return nil, errors.New("free limit reached, sign up for unlimited vibes")
	}

	// Analyze mood
	result := s.analyzeWithAI(moodText)

	aesthetic := models.Aesthetics[result.AestheticKey]

	check := &models.VibeCheck{
		UserID:         nil,
		DeviceID:       &deviceID,
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

// fallbackAnalyze uses weighted multi-signal scoring when AI is unavailable
func (s *VibeService) fallbackAnalyze(moodText string) aiAnalysisResult {
	// Normalize input text
	normalizedText := strings.ToLower(strings.TrimSpace(moodText))

	// Step 1: Calculate aesthetic scores using weighted keyword matching
	aestheticScores := make(map[string]float64)
	// Track which model aesthetic key each category maps to
	aestheticKeyMapping := make(map[string]string)

	for categoryName, keywordWeight := range aestheticKeywordMap {
		var totalScore float64
		for _, keyword := range keywordWeight.Keywords {
			keywordLower := strings.ToLower(keyword)

			if strings.Contains(normalizedText, keywordLower) {
				// Check for exact word match vs substring match
				words := strings.Fields(normalizedText)
				exactMatch := false
				for _, word := range words {
					if word == keywordLower {
						exactMatch = true
						break
					}
				}

				if exactMatch {
					totalScore += 1.0 * keywordWeight.Weight
				} else {
					// Partial match (substring within a word)
					totalScore += 0.5 * keywordWeight.Weight
				}
			}
		}
		if totalScore > 0 {
			// Multiple categories may map to the same aesthetic key;
			// accumulate the highest score per model aesthetic key
			modelKey := keywordWeight.AestheticKey
			aestheticKeyMapping[categoryName] = modelKey
			aestheticScores[categoryName] = totalScore
		}
	}

	// Step 2: Find the highest scoring category and its mapped aesthetic key
	var bestCategory string
	var highestScore float64

	for category, score := range aestheticScores {
		if score > highestScore {
			highestScore = score
			bestCategory = category
		}
	}

	// Step 3: Default to peaceful if no keywords matched
	var bestAestheticKey string
	if bestCategory == "" || highestScore == 0 {
		bestAestheticKey = "peaceful"
		highestScore = 1.0
	} else {
		bestAestheticKey = aestheticKeywordMap[bestCategory].AestheticKey
	}

	// Step 4: Calculate vibe score using sentiment analysis
	vibeScore := calculateSentimentScore(normalizedText)

	// Step 5: Generate contextual insight
	insight := s.generateInsight(bestAestheticKey, vibeScore, moodText)

	// Step 6: Validate the aesthetic key exists in models
	if _, ok := models.Aesthetics[bestAestheticKey]; !ok {
		bestAestheticKey = "peaceful"
	}

	return aiAnalysisResult{
		AestheticKey: bestAestheticKey,
		VibeScore:    vibeScore,
		Insight:      insight,
	}
}

// calculateSentimentScore computes a vibe score (10-100) using multi-tier sentiment analysis
func calculateSentimentScore(text string) int {
	// Base score starts at 55 (neutral-positive baseline)
	score := 55

	// Count sentiment word matches
	strongPositiveCount := 0
	mildPositiveCount := 0
	strongNegativeCount := 0
	mildNegativeCount := 0

	words := strings.Fields(text)
	wordSet := make(map[string]bool)
	for _, word := range words {
		cleaned := strings.ToLower(strings.Trim(word, ".,!?;:\"'"))
		wordSet[cleaned] = true
	}

	for _, word := range strongPositiveWords {
		if wordSet[strings.ToLower(word)] || strings.Contains(text, strings.ToLower(word)) {
			strongPositiveCount++
		}
	}

	for _, word := range mildPositiveWords {
		if wordSet[strings.ToLower(word)] || strings.Contains(text, strings.ToLower(word)) {
			mildPositiveCount++
		}
	}

	for _, word := range strongNegativeWords {
		if wordSet[strings.ToLower(word)] || strings.Contains(text, strings.ToLower(word)) {
			strongNegativeCount++
		}
	}

	for _, word := range mildNegativeWords {
		if wordSet[strings.ToLower(word)] || strings.Contains(text, strings.ToLower(word)) {
			mildNegativeCount++
		}
	}

	// Apply sentiment adjustments with diminishing returns
	if strongPositiveCount > 0 {
		score += int(float64(strongPositiveCount) * 15.0 * math.Pow(0.8, float64(strongPositiveCount-1)))
	}
	if mildPositiveCount > 0 {
		score += int(float64(mildPositiveCount) * 8.0 * math.Pow(0.9, float64(mildPositiveCount-1)))
	}
	if strongNegativeCount > 0 {
		score -= int(float64(strongNegativeCount) * 15.0 * math.Pow(0.8, float64(strongNegativeCount-1)))
	}
	if mildNegativeCount > 0 {
		score -= int(float64(mildNegativeCount) * 8.0 * math.Pow(0.9, float64(mildNegativeCount-1)))
	}

	// Length bonus: longer, more detailed entries get bonus points
	textLength := len(text)
	if textLength > 100 {
		score += 5
	} else if textLength > 50 {
		score += 3
	}

	// Emoji bonus: presence of positive emojis
	positiveEmojis := []string{"😊", "😄", "🥰", "😍", "🤩", "😎", "✨", "🌟", "💖", "💕", "❤️", "🔥", "💪", "🎉"}
	for _, emoji := range positiveEmojis {
		if strings.Contains(text, emoji) {
			score += 3
			break
		}
	}

	// Negative emoji penalty
	negativeEmojis := []string{"😢", "😭", "💔", "😞", "😔", "😤", "😡", "🤬", "😰", "😟"}
	for _, emoji := range negativeEmojis {
		if strings.Contains(text, emoji) {
			score -= 3
			break
		}
	}

	// Clamp score between 10 and 100
	if score < 10 {
		score = 10
	}
	if score > 100 {
		score = 100
	}

	return score
}

// generateInsight creates a contextual insight based on aesthetic and score range
func (s *VibeService) generateInsight(aestheticKey string, vibeScore int, moodText string) string {
	templates, exists := insightTemplates[aestheticKey]
	if !exists || len(templates) == 0 {
		templates = insightTemplates["peaceful"]
	}

	// Determine which template to use based on score range
	// Score 10-30: empathetic/comforting (indices 0-1)
	// Score 31-60: neutral/balanced (indices 2-3)
	// Score 61-100: enthusiastic/uplifting (indices 4-5)
	var templateIndex int
	if len(moodText) == 0 {
		templateIndex = 2 // Default to neutral
	} else {
		switch {
		case vibeScore <= 30:
			templateIndex = int(moodText[0]) % 2
		case vibeScore <= 60:
			templateIndex = 2 + (int(moodText[0]) % 2)
		default:
			templateIndex = 4 + (int(moodText[0]) % 2)
		}
	}

	if templateIndex >= len(templates) {
		templateIndex = len(templates) - 1
	}

	return templates[templateIndex]
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
