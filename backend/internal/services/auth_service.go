package services

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/ahmetcoskunkizilkaya/vibecheck/backend/internal/config"
	"github.com/ahmetcoskunkizilkaya/vibecheck/backend/internal/dto"
	"github.com/ahmetcoskunkizilkaya/vibecheck/backend/internal/models"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrEmailTaken         = errors.New("email already registered")
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrInvalidToken       = errors.New("invalid or expired refresh token")
	ErrUserNotFound       = errors.New("user not found")
)

// Apple JWKS cache
var (
	appleKeysCache    *AppleJWKS
	appleKeysMu       sync.RWMutex
	appleKeysCachedAt time.Time
)

const appleKeysURL = "https://appleid.apple.com/auth/keys"
const appleKeysCacheDuration = 24 * time.Hour

// AppleJWKS represents Apple's JSON Web Key Set response
type AppleJWKS struct {
	Keys []AppleJWK `json:"keys"`
}

// AppleJWK represents a single JSON Web Key from Apple
type AppleJWK struct {
	Kty string `json:"kty"` // Key type (RSA)
	Kid string `json:"kid"` // Key ID
	Use string `json:"use"` // Key usage (sig)
	Alg string `json:"alg"` // Algorithm (RS256)
	N   string `json:"n"`   // RSA modulus (base64url)
	E   string `json:"e"`   // RSA exponent (base64url)
}

type AuthService struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewAuthService(db *gorm.DB, cfg *config.Config) *AuthService {
	return &AuthService{db: db, cfg: cfg}
}

func (s *AuthService) Register(req *dto.RegisterRequest) (*dto.AuthResponse, error) {
	if len(req.Email) == 0 || len(req.Password) < 8 {
		return nil, errors.New("email required and password must be at least 8 characters")
	}

	var existing models.User
	if err := s.db.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		return nil, ErrEmailTaken
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := models.User{
		ID:       uuid.New(),
		Email:    req.Email,
		Password: string(hash),
	}

	if err := s.db.Create(&user).Error; err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return s.generateTokenPair(&user)
}

func (s *AuthService) Login(req *dto.LoginRequest) (*dto.AuthResponse, error) {
	var user models.User
	if err := s.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		return nil, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	return s.generateTokenPair(&user)
}

func (s *AuthService) Refresh(req *dto.RefreshRequest) (*dto.AuthResponse, error) {
	tokenHash := hashToken(req.RefreshToken)

	var stored models.RefreshToken
	if err := s.db.Where("token_hash = ? AND revoked = false", tokenHash).First(&stored).Error; err != nil {
		return nil, ErrInvalidToken
	}

	if time.Now().After(stored.ExpiresAt) {
		s.db.Model(&stored).Update("revoked", true)
		return nil, ErrInvalidToken
	}

	// Revoke old token (rotation)
	s.db.Model(&stored).Update("revoked", true)

	var user models.User
	if err := s.db.First(&user, "id = ?", stored.UserID).Error; err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return s.generateTokenPair(&user)
}

func (s *AuthService) Logout(req *dto.LogoutRequest) error {
	tokenHash := hashToken(req.RefreshToken)
	return s.db.Model(&models.RefreshToken{}).
		Where("token_hash = ?", tokenHash).
		Update("revoked", true).Error
}

// DeleteAccount implements Apple Guideline 5.1.1(v) - account deletion.
// Scrubs all user data: tokens, subscriptions, reports, blocks, then soft-deletes user.
func (s *AuthService) DeleteAccount(userID uuid.UUID, password string) error {
	var user models.User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		return ErrUserNotFound
	}

	// Verify password (skip for Apple Sign-In users who have no password)
	if user.Password != "" && password != "" {
		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
			return ErrInvalidCredentials
		}
	}

	// Scrub all associated data in a transaction
	return s.db.Transaction(func(tx *gorm.DB) error {
		// Revoke all refresh tokens
		tx.Where("user_id = ?", userID).Delete(&models.RefreshToken{})

		// Remove subscriptions
		tx.Where("user_id = ?", userID).Delete(&models.Subscription{})

		// Remove reports filed by user
		tx.Where("reporter_id = ?", userID).Delete(&models.Report{})

		// Remove blocks
		tx.Where("blocker_id = ? OR blocked_id = ?", userID, userID).Delete(&models.Block{})

		// Soft-delete the user (GORM DeletedAt)
		return tx.Delete(&user).Error
	})
}

// AppleSignIn handles Sign in with Apple (Guideline 4.8).
// Verifies Apple identity token signature against Apple's public keys and validates claims.
func (s *AuthService) AppleSignIn(req *dto.AppleSignInRequest) (*dto.AuthResponse, error) {
	// Step 1: Parse the JWT header to get the key ID (kid)
	parts := strings.Split(req.IdentityToken, ".")
	if len(parts) != 3 {
		return nil, errors.New("invalid Apple identity token format")
	}

	headerBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, errors.New("invalid Apple identity token")
	}

	var header struct {
		Kid string `json:"kid"`
		Alg string `json:"alg"`
	}
	if err := json.Unmarshal(headerBytes, &header); err != nil {
		return nil, errors.New("invalid Apple identity token")
	}

	if header.Kid == "" {
		return nil, errors.New("invalid Apple identity token")
	}

	// Step 2: Fetch Apple's public key matching the kid
	publicKey, err := getApplePublicKey(header.Kid)
	if err != nil {
		return nil, fmt.Errorf("failed to verify Apple token: %w", err)
	}

	// Step 3: Parse and verify the JWT with the RSA public key
	token, err := jwt.Parse(req.IdentityToken, func(t *jwt.Token) (interface{}, error) {
		// Ensure the signing method is RSA
		if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return publicKey, nil
	})
	if err != nil {
		return nil, errors.New("invalid Apple identity token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid Apple identity token")
	}

	// Step 4: Verify issuer
	iss, _ := claims["iss"].(string)
	if iss != "https://appleid.apple.com" {
		return nil, errors.New("invalid Apple identity token")
	}

	// Step 5: Verify audience (app bundle ID) if configured
	if s.cfg.AppleBundleID != "" {
		aud, _ := claims["aud"].(string)
		if aud != s.cfg.AppleBundleID {
			return nil, errors.New("invalid Apple identity token")
		}
	}

	// Step 6: Verify expiration
	exp, ok := claims["exp"].(float64)
	if !ok || time.Now().Unix() > int64(exp) {
		return nil, errors.New("invalid Apple identity token")
	}

	// Step 7: Extract subject and email
	sub, _ := claims["sub"].(string)
	if sub == "" {
		return nil, errors.New("Apple token missing subject")
	}

	emailClaim, _ := claims["email"].(string)

	// Use email from token, or from the request (first sign-in only)
	email := emailClaim
	if email == "" {
		email = req.Email
	}
	if email == "" {
		email = sub + "@privaterelay.appleid.com"
	}

	// Find existing user by Apple ID (stored in email field with apple: prefix)
	// or by email match
	var user models.User
	appleEmail := "apple:" + sub
	err = s.db.Where("email = ? OR email = ?", appleEmail, email).First(&user).Error

	if err != nil {
		// Create new user for first-time Apple sign-in
		user = models.User{
			ID:       uuid.New(),
			Email:    email,
			Password: "", // Apple users have no password
		}
		if err := s.db.Create(&user).Error; err != nil {
			return nil, fmt.Errorf("failed to create Apple user: %w", err)
		}
	}

	return s.generateTokenPair(&user)
}

func (s *AuthService) generateTokenPair(user *models.User) (*dto.AuthResponse, error) {
	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.generateRefreshToken(user)
	if err != nil {
		return nil, err
	}

	return &dto.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: dto.UserResponse{
			ID:    user.ID,
			Email: user.Email,
		},
	}, nil
}

func (s *AuthService) generateAccessToken(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":   user.ID.String(),
		"email": user.Email,
		"iat":   time.Now().Unix(),
		"exp":   time.Now().Add(s.cfg.JWTAccessExpiry).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWTSecret))
}

func (s *AuthService) generateRefreshToken(user *models.User) (string, error) {
	rawBytes := make([]byte, 32)
	if _, err := rand.Read(rawBytes); err != nil {
		return "", fmt.Errorf("failed to generate random bytes: %w", err)
	}

	rawToken := base64.URLEncoding.EncodeToString(rawBytes)
	tokenHash := hashToken(rawToken)

	record := models.RefreshToken{
		ID:        uuid.New(),
		UserID:    user.ID,
		TokenHash: tokenHash,
		ExpiresAt: time.Now().Add(s.cfg.JWTRefreshExpiry),
	}

	if err := s.db.Create(&record).Error; err != nil {
		return "", fmt.Errorf("failed to store refresh token: %w", err)
	}

	return rawToken, nil
}

func hashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return fmt.Sprintf("%x", h)
}

// fetchApplePublicKeys retrieves Apple's JWKS from their public endpoint.
// Results are cached for 24 hours to avoid repeated HTTP calls.
func fetchApplePublicKeys() (*AppleJWKS, error) {
	appleKeysMu.RLock()
	if appleKeysCache != nil && time.Since(appleKeysCachedAt) < appleKeysCacheDuration {
		cached := appleKeysCache
		appleKeysMu.RUnlock()
		return cached, nil
	}
	appleKeysMu.RUnlock()

	appleKeysMu.Lock()
	defer appleKeysMu.Unlock()

	// Double-check after acquiring write lock
	if appleKeysCache != nil && time.Since(appleKeysCachedAt) < appleKeysCacheDuration {
		return appleKeysCache, nil
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(appleKeysURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch Apple public keys: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Apple JWKS endpoint returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read Apple JWKS response: %w", err)
	}

	var jwks AppleJWKS
	if err := json.Unmarshal(body, &jwks); err != nil {
		return nil, fmt.Errorf("failed to parse Apple JWKS: %w", err)
	}

	appleKeysCache = &jwks
	appleKeysCachedAt = time.Now()
	return &jwks, nil
}

// getApplePublicKey finds the RSA public key matching the given key ID from Apple's JWKS.
func getApplePublicKey(kid string) (*rsa.PublicKey, error) {
	jwks, err := fetchApplePublicKeys()
	if err != nil {
		return nil, err
	}

	for _, key := range jwks.Keys {
		if key.Kid == kid {
			return parseRSAPublicKey(key)
		}
	}

	return nil, fmt.Errorf("Apple public key not found for kid: %s", kid)
}

// parseRSAPublicKey converts an Apple JWK to an *rsa.PublicKey.
func parseRSAPublicKey(key AppleJWK) (*rsa.PublicKey, error) {
	// Decode modulus (n)
	nBytes, err := base64.RawURLEncoding.DecodeString(key.N)
	if err != nil {
		return nil, fmt.Errorf("failed to decode RSA modulus: %w", err)
	}

	// Decode exponent (e)
	eBytes, err := base64.RawURLEncoding.DecodeString(key.E)
	if err != nil {
		return nil, fmt.Errorf("failed to decode RSA exponent: %w", err)
	}

	// Convert exponent bytes to int
	var eInt int
	for _, b := range eBytes {
		eInt = eInt<<8 + int(b)
	}

	return &rsa.PublicKey{
		N: new(big.Int).SetBytes(nBytes),
		E: eInt,
	}, nil
}
