package routes

import (
	"github.com/ahmetcoskunkizilkaya/vibecheck/backend/internal/config"
	"github.com/ahmetcoskunkizilkaya/vibecheck/backend/internal/handlers"
	"github.com/ahmetcoskunkizilkaya/vibecheck/backend/internal/middleware"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func Setup(
	app *fiber.App,
	cfg *config.Config,
	db *gorm.DB,
	authHandler *handlers.AuthHandler,
	healthHandler *handlers.HealthHandler,
	webhookHandler *handlers.WebhookHandler,
	moderationHandler *handlers.ModerationHandler,
	vibeHandler *handlers.VibeHandler,
) {
	api := app.Group("/api")

	// Health
	api.Get("/health", healthHandler.Check)

	// Auth (public)
	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Post("/refresh", authHandler.Refresh)
	auth.Post("/apple", authHandler.AppleSignIn) // Sign in with Apple (Guideline 4.8)

	// Auth (protected)
	protected := api.Group("", middleware.JWTProtected(cfg))
	protected.Post("/auth/logout", authHandler.Logout)
	protected.Delete("/auth/account", authHandler.DeleteAccount) // Account deletion (Guideline 5.1.1)

	// Moderation - User endpoints (protected)
	protected.Post("/reports", moderationHandler.CreateReport)     // Report content (Guideline 1.2)
	protected.Post("/blocks", moderationHandler.BlockUser)         // Block user (Guideline 1.2)
	protected.Delete("/blocks/:id", moderationHandler.UnblockUser) // Unblock user

	// VibeCheck - Daily vibe check-ins (protected)
	vibes := protected.Group("/vibes")
	vibes.Post("", vibeHandler.CreateVibeCheck)       // Create daily vibe check
	vibes.Get("/today", vibeHandler.GetTodayCheck)    // Get today's vibe
	vibes.Get("/history", vibeHandler.GetVibeHistory) // Get vibe history
	vibes.Get("/stats", vibeHandler.GetVibeStats)     // Get stats & streaks

	// Admin moderation panel (protected + admin role required)
	admin := api.Group("/admin", middleware.JWTProtected(cfg), middleware.AdminRequired(db))
	admin.Get("/moderation/reports", moderationHandler.ListReports)
	admin.Put("/moderation/reports/:id", moderationHandler.ActionReport)

	// Webhooks (verified by auth header, not JWT)
	webhooks := api.Group("/webhooks")
	webhooks.Post("/revenuecat", webhookHandler.HandleRevenueCat)
}
